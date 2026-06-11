import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";

type Params = { params: Promise<{ shop: string; id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { shop, id } = await params;
  const access = await getShopAccess(shop);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Partial<{
    name: string;
    price: string;
    oldPrice: string | null;
    category: string;
    badge: string;
    visible: boolean;
    shortDesc: string;
    description: string;
    images: string[];
    colors: string[];
    sizes: string[];
    benefits: unknown[];
    specs: unknown[];
    sortOrder: number;
  }>;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  const fields = [
    "name", "price", "oldPrice", "category", "badge", "visible",
    "shortDesc", "description", "images", "colors", "sizes",
    "benefits", "specs", "sortOrder",
  ] as const;
  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f];
  }

  const [updated] = await db
    .update(products)
    .set(updates)
    .where(and(eq(products.id, id), eq(products.shopId, access.shopId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { shop, id } = await params;
  const access = await getShopAccess(shop);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [deleted] = await db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.shopId, access.shopId)))
    .returning({ id: products.id });

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
