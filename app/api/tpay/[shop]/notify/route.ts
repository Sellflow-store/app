/**
 * Powiadomienie Tpay o zmianie stanu transakcji (webhook, form-urlencoded).
 *
 * Treść powiadomienia traktujemy wyłącznie jako sygnał „sprawdź zamówienie X".
 * O tym, czy zamówienie jest opłacone, decyduje odpowiedź GET /transactions/{id}
 * pobrana kluczami sklepu — podrobione żądanie na ten adres niczego nie
 * zmieni, bo nie zmieni stanu transakcji po stronie Tpay.
 *
 * Tpay ponawia powiadomienie, dopóki nie dostanie w odpowiedzi „TRUE". Zwracamy
 * je także dla śmieci (nieznane zamówienie), żeby nie ponawiał w nieskończoność;
 * błąd po naszej stronie albo niedostępne API Tpay → 500, niech spróbuje znowu.
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, shopIntegrations, shops } from "@/lib/db/schema";
import { TPAY_PROVIDER, getTpayCredentials, getTpayTransaction, isTpayPaid } from "@/lib/tpay";

type Params = { params: Promise<{ shop: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ack() {
  return new NextResponse("TRUE", { status: 200, headers: { "Content-Type": "text/plain" } });
}

function retry(reason: string) {
  return new NextResponse(reason, { status: 500, headers: { "Content-Type": "text/plain" } });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { shop: shopSlug } = await params;

  let form: URLSearchParams;
  try {
    form = new URLSearchParams(await req.text());
  } catch {
    return ack();
  }
  // tr_crc = hiddenDescription z utworzenia transakcji = nasze orders.id.
  const orderId = form.get("tr_crc")?.trim() ?? "";
  if (!UUID_RE.test(orderId)) return ack();

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, shopSlug) });
  if (!shop) return ack();

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.shopId, shop.id)),
  });
  if (!order || order.paymentProvider !== TPAY_PROVIDER || !order.paymentProviderRef) return ack();
  if (order.paymentStatus === "paid") return ack();

  const creds = await getTpayCredentials(shop.id, { requireEnabled: false });
  if (!creds) return retry("Tpay credentials unavailable");

  let tx;
  try {
    tx = await getTpayTransaction(creds, order.paymentProviderRef);
  } catch (e) {
    console.error("Tpay notify: nie udało się pobrać transakcji", order.orderNumber, e);
    return retry("Transaction lookup failed");
  }

  await db
    .update(shopIntegrations)
    .set({ lastPushAt: new Date() })
    .where(and(eq(shopIntegrations.shopId, shop.id), eq(shopIntegrations.provider, TPAY_PROVIDER)))
    .catch(() => {});

  if (!isTpayPaid(tx.status)) return ack();

  const expected = parseFloat(order.total);
  if (Math.abs(tx.amount - expected) > 0.005 || (tx.hiddenDescription && tx.hiddenDescription !== order.id)) {
    // Kwota się nie zgadza — nie oznaczamy jako opłacone, merchant musi to obejrzeć.
    console.error("Tpay notify: niezgodna transakcja", {
      order: order.orderNumber,
      expected,
      got: tx.amount,
      hiddenDescription: tx.hiddenDescription,
    });
    return ack();
  }

  await db
    .update(orders)
    .set({ paymentStatus: "paid", updatedAt: new Date() })
    .where(and(eq(orders.id, order.id), eq(orders.paymentStatus, "unpaid")));

  if (order.status === "cancelled") {
    console.warn("Tpay notify: wpłata za anulowane zamówienie — do zwrotu", order.orderNumber);
  }

  return ack();
}
