import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";

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
    category?: string;
    badge?: string;
    visible?: boolean;
    shortDesc?: string;
    description?: string;
    images?: string[];
    sortOrder?: number;
  };

  if (!body.name?.trim() || !body.price) {
    return NextResponse.json({ error: "name and price required" }, { status: 400 });
  }

  const [product] = await db
    .insert(products)
    .values({
      shopId: access.shopId,
      name: body.name.trim(),
      price: body.price,
      category: body.category,
      badge: body.badge,
      visible: body.visible ?? true,
      shortDesc: body.shortDesc,
      description: body.description,
      images: body.images ?? [],
      sortOrder: body.sortOrder ?? 0,
    })
    .returning();

  return NextResponse.json(product, { status: 201 });
}
