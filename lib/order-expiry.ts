import "server-only";
import { and, asc, eq, lt } from "drizzle-orm";
import { db } from "./db";
import { orders, shops } from "./db/schema";
import { releaseCancelledOrder } from "./order-lifecycle";
import { sendEmail } from "./email";
import { orderUnpaidCancelledEmail } from "./email-templates";
import { shopPublicUrl } from "./legal/data";
import { TPAY_PROVIDER, getTpayCredentials, getTpayTransaction, isTpayPaid } from "./tpay";

/**
 * Automatyczne anulowanie nieopłaconych zamówień z płatnością online.
 *
 * Tylko metoda "online" (Tpay): tam status płatności ustawia się sam, więc
 * „nieopłacone po 48 h" znaczy naprawdę „klient nie zapłacił". Przelew
 * tradycyjny merchant oznacza ręcznie, często z opóźnieniem — automat
 * anulowałby zamówienia już opłacone. Pobranie jest nieopłacone z definicji.
 *
 * Przed anulowaniem pytamy Tpay o stan transakcji: gdyby powiadomienie o
 * wpłacie zaginęło, zamówienie zostaje oznaczone jako opłacone zamiast
 * anulowane. Gdy Tpay nie odpowiada, zamówienie czeka na następny przebieg —
 * niepewność nigdy nie kończy się anulowaniem.
 */

export const UNPAID_ONLINE_TTL_HOURS = 48;
const BATCH = 50;

export interface ExpiryResult {
  checked: number;
  cancelled: string[];
  reconciledPaid: string[];
  skipped: string[];
}

export async function expireUnpaidOnlineOrders(now = new Date()): Promise<ExpiryResult> {
  const cutoff = new Date(now.getTime() - UNPAID_ONLINE_TTL_HOURS * 3600 * 1000);
  const result: ExpiryResult = { checked: 0, cancelled: [], reconciledPaid: [], skipped: [] };

  const stale = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.paymentMethod, "online"),
        eq(orders.paymentStatus, "unpaid"),
        eq(orders.status, "pending"),
        lt(orders.createdAt, cutoff),
      ),
    )
    .orderBy(asc(orders.createdAt))
    .limit(BATCH);

  for (const order of stale) {
    result.checked++;
    const label = `${order.orderNumber} (${order.shopId})`;

    // ── Ostatnie słowo należy do Tpay ────────────────────────────────────
    if (order.paymentProvider === TPAY_PROVIDER && order.paymentProviderRef) {
      const creds = await getTpayCredentials(order.shopId, { requireEnabled: false });
      if (!creds) {
        result.skipped.push(label);
        continue;
      }
      try {
        const tx = await getTpayTransaction(creds, order.paymentProviderRef);
        if (isTpayPaid(tx.status) && Math.abs(tx.amount - parseFloat(order.total)) <= 0.005) {
          await db
            .update(orders)
            .set({ paymentStatus: "paid", updatedAt: new Date() })
            .where(and(eq(orders.id, order.id), eq(orders.paymentStatus, "unpaid")));
          result.reconciledPaid.push(label);
          continue;
        }
      } catch (e) {
        console.error("Expiry: Tpay niedostępny, zamówienie czeka", label, e);
        result.skipped.push(label);
        continue;
      }
    }

    // ── Anulowanie — warunkowo, żeby równoległa wpłata albo ręczna zmiana
    //    merchanta wygrały z automatem ─────────────────────────────────────
    const [cancelled] = await db
      .update(orders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          eq(orders.id, order.id),
          eq(orders.status, "pending"),
          eq(orders.paymentStatus, "unpaid"),
        ),
      )
      .returning();
    if (!cancelled) continue;

    await releaseCancelledOrder(cancelled);
    result.cancelled.push(label);

    try {
      const shop = await db.query.shops.findFirst({ where: eq(shops.id, order.shopId) });
      if (shop) {
        const mail = orderUnpaidCancelledEmail({
          shopName: shop.name,
          customerName: cancelled.customerName ?? "",
          orderNumber: cancelled.orderNumber,
          total: cancelled.total,
          shopUrl: shopPublicUrl(shop),
        });
        await sendEmail({ to: cancelled.customerEmail, ...mail });
      }
    } catch (e) {
      console.error("Expiry: mail o anulowaniu nie wyszedł", label, e);
    }
  }

  return result;
}
