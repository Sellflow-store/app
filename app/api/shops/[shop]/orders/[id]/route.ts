import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, shops } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
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

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
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
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status as (typeof STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;
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

  const [updated] = await db
    .update(orders)
    .set(updates)
    .where(and(eq(orders.id, id), eq(orders.shopId, access.shopId)))
    .returning();

  // Notify the customer once, on the transition into "shipped"
  if (updates.status === "shipped" && existing.status !== "shipped") {
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
