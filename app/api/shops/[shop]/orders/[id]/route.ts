import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, shops } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { canTransition, isOrderStatus, releaseCancelledOrder } from "@/lib/order-lifecycle";
import { getShopAccess } from "@/lib/api";
import { sendEmail } from "@/lib/email";
import { orderShippedEmail } from "@/lib/email-templates";
import {
  isCarrierId,
  isValidTrackingNumber,
  normalizeTrackingNumber,
  trackingUrl,
  carrierLabel,
} from "@/lib/tracking";

type Params = { params: Promise<{ shop: string; id: string }> };

const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"] as const;

export async function PATCH(req: NextRequest, { params }: Params) {
  const { shop: shopSlug, id } = await params;
  const access = await getShopAccess(shopSlug);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Partial<{
    status: string;
    paymentStatus: string;
    carrier: string | null;
    trackingNumber: string | null;
  }>;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.status !== undefined && !isOrderStatus(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (body.paymentStatus !== undefined) {
    if (!PAYMENT_STATUSES.includes(body.paymentStatus as (typeof PAYMENT_STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid paymentStatus" }, { status: 400 });
    }
    updates.paymentStatus = body.paymentStatus;
  }

  // Przewoźnik i numer przesyłki — oba dają się wyczyścić pustą wartością,
  // bo merchant miewa literówki i musi móc się wycofać.
  if (body.carrier !== undefined) {
    if (body.carrier === null || body.carrier === "") {
      updates.carrier = null;
    } else if (!isCarrierId(body.carrier)) {
      return NextResponse.json({ error: "Nieznany przewoźnik." }, { status: 400 });
    } else {
      updates.carrier = body.carrier;
    }
  }
  if (body.trackingNumber !== undefined) {
    const n = normalizeTrackingNumber(body.trackingNumber ?? "");
    if (n === "") {
      updates.trackingNumber = null;
    } else if (!isValidTrackingNumber(n)) {
      return NextResponse.json(
        { error: "Numer przesyłki może zawierać tylko litery, cyfry i myślnik (4–64 znaki)." },
        { status: 400 }
      );
    } else {
      updates.trackingNumber = n;
    }
  }

  const existing = await db.query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.shopId, access.shopId)),
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const statusChange =
    body.status !== undefined && isOrderStatus(body.status) && body.status !== existing.status
      ? body.status
      : null;
  if (statusChange && !canTransition(existing.status, statusChange)) {
    return NextResponse.json(
      { error: "Tej zmiany statusu nie da się wykonać dla zamówienia w obecnym stanie." },
      { status: 409 },
    );
  }
  if (statusChange) updates.status = statusChange;

  // The status condition makes the transition happen exactly once: a double
  // click or a concurrent Furgonetka update finds the status already changed
  // and gets no row, so stock, discount and the shipped email are handled once.
  const [updated] = await db
    .update(orders)
    .set(updates)
    .where(
      and(
        eq(orders.id, id),
        eq(orders.shopId, access.shopId),
        ...(statusChange ? [eq(orders.status, existing.status)] : []),
      ),
    )
    .returning();
  if (!updated) {
    return NextResponse.json(
      { error: "Zamówienie zmieniło się w międzyczasie. Odśwież stronę i spróbuj ponownie." },
      { status: 409 },
    );
  }

  if (statusChange === "cancelled") {
    await releaseCancelledOrder(updated);
  }

  // Notify the customer once, on the transition into "shipped"
  if (statusChange === "shipped") {
    try {
      const shop = await db.query.shops.findFirst({ where: eq(shops.id, access.shopId) });
      if (shop) {
        const email = orderShippedEmail({
          shopName: shop.name,
          customerName: updated.customerName ?? "",
          orderNumber: updated.orderNumber,
          carrierName: carrierLabel(updated.carrier),
          trackingNumber: updated.trackingNumber,
          trackingUrl: trackingUrl(updated.carrier, updated.trackingNumber),
        });
        await sendEmail({ to: updated.customerEmail, ...email });
      }
    } catch (e) {
      console.error("Shipped email failed:", e);
    }
  }

  return NextResponse.json(updated);
}
