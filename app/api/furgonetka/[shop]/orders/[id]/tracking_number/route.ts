/**
 * POST /api/furgonetka/{shop}/orders/{id}/tracking_number
 *
 * Domknięcie pętli: merchant wygenerował etykietę w panelu Furgonetki, a stamtąd
 * wraca do nas numer przesyłki i nazwa przewoźnika. Zapisujemy je przy
 * zamówieniu, przestawiamy je na „wysłane" i wysyłamy klientowi maila z linkiem
 * do śledzenia — dokładnie to samo, co robi ręczne wpisanie numeru w panelu.
 *
 * `{id}` to `sourceOrderId`, czyli nasz numer zamówienia (ZAM-00001) — ta sama
 * wartość, którą oddajemy w GET /orders.
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, shopIntegrations } from "@/lib/db/schema";
import { authorizeFurgonetka, FURGONETKA_PROVIDER } from "@/lib/furgonetka-access";
import { serviceToCarrier } from "@/lib/furgonetka";
import {
  carrierLabel,
  isValidTrackingNumber,
  normalizeTrackingNumber,
  trackingUrl,
} from "@/lib/tracking";
import { sendEmail } from "@/lib/email";
import { orderShippedEmail } from "@/lib/email-templates";
import { checkRateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ shop: string; id: string }> };

interface Body {
  tracking?: { number?: string; courierService?: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  const { shop: shopSlug, id } = await params;

  const limited = checkRateLimit(req, `furgonetka:${shopSlug}`, 60, 60_000);
  if (limited) return limited;

  const access = await authorizeFurgonetka(shopSlug, req.headers.get("authorization"));
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const number = normalizeTrackingNumber(body.tracking?.number ?? "");
  if (!isValidTrackingNumber(number)) {
    return NextResponse.json({ error: "Invalid tracking number" }, { status: 400 });
  }
  const carrier = serviceToCarrier(body.tracking?.courierService ?? "");

  const existing = await db.query.orders.findFirst({
    where: and(eq(orders.shopId, access.shopId), eq(orders.orderNumber, id)),
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // „Wysłane" ustawiamy tylko z wcześniejszych etapów — gdyby Furgonetka
  // powtórzyła żądanie dla doręczonej paczki, nie cofamy jej statusu.
  const becomesShipped = existing.status === "pending" || existing.status === "processing";

  const [updated] = await db
    .update(orders)
    .set({
      carrier,
      trackingNumber: number,
      ...(becomesShipped ? { status: "shipped" } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(orders.shopId, access.shopId), eq(orders.orderNumber, id)))
    .returning();

  // Mail leci raz — przy wejściu w „wysłane". Powtórzony numer (korekta po
  // stronie merchanta) aktualizuje zamówienie, ale nie zasypuje klienta.
  if (becomesShipped) {
    try {
      const email = orderShippedEmail({
        shopName: access.shopName,
        customerName: updated.customerName ?? "",
        orderNumber: updated.orderNumber,
        carrierName: carrierLabel(carrier),
        trackingNumber: number,
        trackingUrl: trackingUrl(carrier, number),
      });
      await sendEmail({ to: updated.customerEmail, ...email });
    } catch (e) {
      console.error("Furgonetka: mail o wysyłce nie poszedł", e);
    }
  }

  try {
    await db
      .update(shopIntegrations)
      .set({ lastPushAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(shopIntegrations.shopId, access.shopId),
          eq(shopIntegrations.provider, FURGONETKA_PROVIDER),
        ),
      );
  } catch (e) {
    console.error("Furgonetka: nie udało się zapisać śladu numeru przesyłki", e);
  }

  return NextResponse.json({ ok: true });
}
