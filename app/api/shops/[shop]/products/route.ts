import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, shops } from "@/lib/db/schema";
import { asc, count, eq, max } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { planLimits } from "@/lib/plans";
import { recordPrice } from "@/lib/price-history";
import { findFreeProductSlug } from "@/lib/slug";
import { normalizeAttributes } from "@/lib/product-attributes";

type Params = { params: Promise<{ shop: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { shop } = await params;
  const access = await getShopAccess(shop);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(products)
    .where(eq(products.shopId, access.shopId))
    .orderBy(asc(products.sortOrder), asc(products.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { shop } = await params;
  const access = await getShopAccess(shop);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    name: string;
    slug?: string;
    price: string;
    oldPrice?: string | null;
    priceOnRequest?: boolean;
    category?: string | null;
    badge?: string | null;
    sizes?: string[];
    visible?: boolean;
    shortDesc?: string | null;
    description?: string | null;
    images?: string[];
    specs?: { key: string; value: string }[];
    stock?: number | null;
    weightGrams?: number | null;
    dimensions?: Record<string, number | null>;
    sortOrder?: number;
    type?: string;
    fulfillment?: Record<string, unknown>;
    attributes?: Record<string, unknown>;
  };

  // Produkt na zamówienie nie ma ceny do podania — reszta musi ją mieć.
  const priceOnRequest = body.priceOnRequest === true;
  if (!body.name?.trim() || (!priceOnRequest && !body.price)) {
    return NextResponse.json({ error: "name and price required" }, { status: 400 });
  }

  // Plan limit — counted against the shop owner's plan, not the requester's
  // (an admin acting as owner shouldn't bypass the merchant's limit).
  const [shopRow, [{ total, lastOrder }]] = await Promise.all([
    db.query.shops.findFirst({
      where: eq(shops.id, access.shopId),
      with: { owner: true },
    }),
    db
      .select({ total: count(), lastOrder: max(products.sortOrder) })
      .from(products)
      .where(eq(products.shopId, access.shopId)),
  ]);
  const ownerPlan = shopRow?.owner.plan ?? "free";
  const limit = planLimits(ownerPlan).maxProducts;
  if (total >= limit) {
    return NextResponse.json(
      {
        error: `Osiągnięto limit planu ${ownerPlan} (${limit} produktów). Zmień plan, aby dodać kolejne.`,
      },
      { status: 403 }
    );
  }

  // Adres z nazwy, chyba że merchant podał własny. Kolizje w obrębie sklepu
  // rozwiązuje sufiks -2, -3…
  const slug = await findFreeProductSlug(access.shopId, body.slug?.trim() || body.name);

  const [product] = await db
    .insert(products)
    .values({
      shopId: access.shopId,
      name: body.name.trim(),
      slug,
      // 0.00 to wypełniacz kolumny NOT NULL — przy `priceOnRequest` nigdzie
      // się nie pokazuje ani nie wchodzi do wyliczeń zamówienia.
      price: priceOnRequest ? "0.00" : body.price,
      oldPrice: priceOnRequest ? null : (body.oldPrice ?? null),
      priceOnRequest,
      category: body.category,
      badge: body.badge,
      sizes: Array.isArray(body.sizes) ? body.sizes.filter((s) => typeof s === "string") : [],
      visible: body.visible ?? true,
      shortDesc: body.shortDesc,
      description: body.description,
      images: body.images ?? [],
      specs: body.specs ?? [],
      stock: body.stock ?? null,
      weightGrams: body.weightGrams ?? null,
      dimensions: body.dimensions ?? {},
      type: body.type ?? "physical",
      fulfillment: body.fulfillment ?? {},
      attributes: normalizeAttributes(
        body.attributes,
        Array.isArray(body.images) ? body.images.filter((u): u is string => typeof u === "string") : undefined,
      ),
      // Nowy produkt ląduje na końcu listy. Sam 0 zrównałby go z pierwszym
      // produktem po ręcznym ułożeniu kolejności.
      sortOrder: body.sortOrder ?? (lastOrder ?? -1) + 1,
    })
    .returning();

  // Omnibus: zapisz punkt startowy historii cen. Produkt bez ceny półkowej
  // nie ma czego zapisywać — 0.00 zafałszowałoby „najniższą cenę z 30 dni".
  if (!priceOnRequest) {
    await recordPrice(access.shopId, product.id, product.price);
  }

  return NextResponse.json(product, { status: 201 });
}
