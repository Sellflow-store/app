import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import OrderDetail from "./OrderDetail";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ shop: string; id: string }>;
}) {
  const { shop, id } = await params;

  const access = await getShopAccess(shop);
  if (!access) notFound();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) notFound();

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.shopId, access.shopId)),
  });
  if (!order) notFound();

  return (
    <OrderDetail
      shopSlug={shop}
      order={{
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName ?? "—",
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        items: (order.items as { name: string; price: string; qty: number; image: string | null }[]) ?? [],
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        total: order.total,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        shippingAddress: (order.shippingAddress as Record<string, string | undefined>) ?? {},
        notes: order.notes,
        createdAt: order.createdAt.toLocaleString("pl-PL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      }}
    />
  );
}
