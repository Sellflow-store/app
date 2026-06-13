import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, orders } from "@/lib/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";

type Params = { params: Promise<{ shop: string }> };

// Authed quick-search for the panel's global search box.
export async function GET(req: NextRequest, { params }: Params) {
  const { shop } = await params;
  const access = await getShopAccess(shop);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ products: [], orders: [] });
  }
  const like = `%${q}%`;

  const [productRows, orderRows] = await Promise.all([
    db
      .select({ id: products.id, name: products.name, category: products.category })
      .from(products)
      .where(and(eq(products.shopId, access.shopId), ilike(products.name, like)))
      .orderBy(desc(products.createdAt))
      .limit(5),
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        total: orders.total,
      })
      .from(orders)
      .where(
        and(
          eq(orders.shopId, access.shopId),
          or(
            ilike(orders.orderNumber, like),
            ilike(orders.customerName, like),
            ilike(orders.customerEmail, like)
          )
        )
      )
      .orderBy(desc(orders.createdAt))
      .limit(5),
  ]);

  return NextResponse.json({ products: productRows, orders: orderRows });
}
