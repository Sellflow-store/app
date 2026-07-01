import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, shops } from "@/lib/db/schema";
import { asc, count, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { planLimits } from "@/lib/plans";
import { recordPrice } from "@/lib/price-history";

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
    price: string;
    oldPrice?: string | null;
    category?: string;
    badge?: string;
    visible?: boolean;
    shortDesc?: string;
    description?: string;
    images?: string[];
    specs?: { key: string; value: string }[];
    stock?: number | null;
    sortOrder?: number;
    type?: string;
    fulfillment?: Record<string, unknown>;
  };

  if (!body.name?.trim() || !body.price) {
    return NextResponse.json({ error: "name and price required" }, { status: 400 });
  }

  // Plan limit — counted against the shop owner's plan, not the requester's
  // (an admin acting as owner shouldn't bypass the merchant's limit).
  const [shopRow, [{ total }]] = await Promise.all([
    db.query.shops.findFirst({
      where: eq(shops.id, access.shopId),
      with: { owner: true },
    }),
    db.select({ total: count() }).from(products).where(eq(products.shopId, access.shopId)),
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

  const [product] = await db
    .insert(products)
    .values({
      shopId: access.shopId,
      name: body.name.trim(),
      price: body.price,
      oldPrice: body.oldPrice ?? null,
      category: body.category,
      badge: body.badge,
      visible: body.visible ?? true,
      shortDesc: body.shortDesc,
      description: body.description,
      images: body.images ?? [],
      specs: body.specs ?? [],
      stock: body.stock ?? null,
      type: body.type ?? "physical",
      fulfillment: body.fulfillment ?? {},
      sortOrder: body.sortOrder ?? 0,
    })
    .returning();

  // Omnibus: zapisz punkt startowy historii cen.
  await recordPrice(access.shopId, product.id, product.price);

  return NextResponse.json(product, { status: 201 });
}
