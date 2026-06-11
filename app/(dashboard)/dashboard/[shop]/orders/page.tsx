import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import OrdersTable, { type OrderRow } from "./OrdersTable";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  let rows: OrderRow[] = [];

  try {
    const access = await getShopAccess(shopSlug);
    if (access) {
      const dbOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.shopId, access.shopId))
        .orderBy(desc(orders.createdAt));

      rows = dbOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customer: o.customerName ?? "—",
        email: o.customerEmail,
        total: o.total,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        date: o.createdAt.toLocaleDateString("pl-PL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      }));
    }
  } catch {
    // DB not configured yet — render empty state
  }

  return <OrdersTable shopSlug={shopSlug} orders={rows} />;
}
