import { db } from "./db";
import { customers, discountCodes, orders, products } from "./db/schema";
import { and, eq, isNotNull, sql } from "drizzle-orm";

export const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Which status an order may move to from which. Mirrors the actions the order
 * detail page offers; the API enforces it so a hand-crafted request can't
 * move a delivered order back to pending or revive a cancelled one (whose
 * stock and discount use have already been handed back).
 */
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function isOrderStatus(v: unknown): v is OrderStatus {
  return typeof v === "string" && (ORDER_STATUSES as readonly string[]).includes(v);
}

export function canTransition(from: string, to: OrderStatus): boolean {
  return isOrderStatus(from) && TRANSITIONS[from].includes(to);
}

type OrderRow = typeof orders.$inferSelect;

/**
 * Undo what placing the order reserved: stock of tracked products, the
 * discount code use and the customer's aggregates. Call it only after the
 * conditional status UPDATE that moved the order into "cancelled" returned a
 * row, so a double click or a retried request can't release twice.
 * Best-effort per step: a failed step is logged, the cancellation stands.
 */
export async function releaseCancelledOrder(order: OrderRow): Promise<void> {
  const items = (Array.isArray(order.items) ? order.items : []) as { productId?: string; qty?: number }[];
  const qtyByProduct = new Map<string, number>();
  for (const i of items) {
    if (typeof i.productId !== "string") continue;
    const qty = typeof i.qty === "number" && i.qty > 0 ? i.qty : 0;
    qtyByProduct.set(i.productId, (qtyByProduct.get(i.productId) ?? 0) + qty);
  }

  for (const [productId, qty] of qtyByProduct) {
    if (qty === 0) continue;
    await db
      .update(products)
      .set({ stock: sql`${products.stock} + ${qty}`, updatedAt: new Date() })
      // Untracked products (stock null) stay untracked.
      .where(and(eq(products.id, productId), eq(products.shopId, order.shopId), isNotNull(products.stock)))
      .catch((e) => console.error("Cancel: stock release failed", order.orderNumber, productId, e));
  }

  if (order.discountCode) {
    await db
      .update(discountCodes)
      .set({ usesCount: sql`GREATEST(${discountCodes.usesCount} - 1, 0)` })
      .where(and(eq(discountCodes.shopId, order.shopId), eq(discountCodes.code, order.discountCode)))
      .catch((e) => console.error("Cancel: discount release failed", order.orderNumber, e));
  }

  await db
    .update(customers)
    .set({
      totalOrders: sql`GREATEST(${customers.totalOrders} - 1, 0)`,
      totalSpent: sql`GREATEST(${customers.totalSpent} - ${order.total}, 0)`,
    })
    .where(and(eq(customers.shopId, order.shopId), eq(customers.email, order.customerEmail)))
    .catch((e) => console.error("Cancel: customer aggregate update failed", order.orderNumber, e));
}
