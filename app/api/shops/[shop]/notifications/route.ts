import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";

type Params = { params: Promise<{ shop: string }> };

// Authed "needs attention" feed for the header bell.
export async function GET(_req: NextRequest, { params }: Params) {
  const { shop } = await params;
  const access = await getShopAccess(shop);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shopOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      total: orders.total,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(eq(orders.shopId, access.shopId), ne(orders.status, "cancelled")))
    .orderBy(desc(orders.createdAt))
    .limit(20);

  const toShip = shopOrders.filter((o) => ["pending", "processing"].includes(o.status)).length;
  const unpaid = shopOrders.filter((o) => o.paymentStatus === "unpaid").length;

  // Recent orders that still need action (new or unpaid), newest first
  const recent = shopOrders
    .filter((o) => o.status === "pending" || o.paymentStatus === "unpaid")
    .slice(0, 6)
    .map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      total: o.total,
      status: o.status,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt.toISOString(),
    }));

  return NextResponse.json({ toShip, unpaid, count: toShip, recent });
}
