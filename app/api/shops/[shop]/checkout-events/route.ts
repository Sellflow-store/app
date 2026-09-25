import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shops, checkoutEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { CHECKOUT_EVENT_DETAILS, type CheckoutEvent } from "@/lib/checkout-events";

type Params = { params: Promise<{ shop: string }> };

// Public beacon from the cart / checkout (lib/checkout-events.ts). Cheap and
// fire-and-forget: unknown events or details are dropped, never stored raw.
export async function POST(req: NextRequest, { params }: Params) {
  const { shop: shopSlug } = await params;

  const limited = checkRateLimit(req, `checkout-events:${shopSlug}`, 60, 60_000);
  if (limited) return limited;

  let body: { event?: string; detail?: string | null } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const event = body.event as CheckoutEvent;
  const allowed = CHECKOUT_EVENT_DETAILS[event];
  if (!allowed) return new NextResponse(null, { status: 204 });
  const detail = body.detail && allowed.includes(body.detail) ? body.detail : null;

  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, shopSlug),
    columns: { id: true, active: true, suspended: true, deletedAt: true },
  });
  if (!shop || !shop.active || shop.suspended || shop.deletedAt) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    await db.insert(checkoutEvents).values({ shopId: shop.id, event, detail });
  } catch {
    // Analytics must never break the checkout.
  }
  return new NextResponse(null, { status: 204 });
}
