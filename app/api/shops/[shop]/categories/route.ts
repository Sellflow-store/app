import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";

type Params = { params: Promise<{ shop: string }> };

/**
 * Categories aren't a separate entity — they're the free-text `category`
 * field on products. These ops act in bulk on every product carrying a
 * given category name, matched case-insensitively.
 *   PATCH  { category, rename }   → rename across all those products
 *   PATCH  { category, visible }  → show/hide the whole category
 *   DELETE ?category=…            → clear the field (products stay)
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { shop } = await params;
  const access = await getShopAccess(shop);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    category?: string;
    rename?: string;
    visible?: boolean;
  };

  const category = body.category?.trim();
  if (!category) return NextResponse.json({ error: "Brak kategorii." }, { status: 400 });

  const match = and(
    eq(products.shopId, access.shopId),
    sql`lower(${products.category}) = lower(${category})`
  );

  if (body.rename !== undefined) {
    const newName = body.rename.trim();
    if (!newName) {
      return NextResponse.json({ error: "Nazwa kategorii nie może być pusta." }, { status: 400 });
    }
    if (newName.length > 60) {
      return NextResponse.json({ error: "Nazwa kategorii jest za długa." }, { status: 400 });
    }
    await db.update(products).set({ category: newName, updatedAt: new Date() }).where(match);
  }

  if (body.visible !== undefined) {
    if (typeof body.visible !== "boolean") {
      return NextResponse.json({ error: "Invalid visible flag" }, { status: 400 });
    }
    await db.update(products).set({ visible: body.visible, updatedAt: new Date() }).where(match);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { shop } = await params;
  const access = await getShopAccess(shop);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const category = req.nextUrl.searchParams.get("category")?.trim();
  if (!category) return NextResponse.json({ error: "Brak kategorii." }, { status: 400 });

  // Removing a category only clears the field — the products themselves stay.
  await db
    .update(products)
    .set({ category: null, updatedAt: new Date() })
    .where(
      and(
        eq(products.shopId, access.shopId),
        sql`lower(${products.category}) = lower(${category})`
      )
    );

  return NextResponse.json({ ok: true });
}
