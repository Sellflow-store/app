import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shops, visits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { classifyVisit } from "@/lib/traffic";

type Params = { params: Promise<{ shop: string }> };

// Public endpoint — the storefront TrackVisit beacon posts one row per pageview.
// Kept deliberately cheap: resolve shop, classify referrer, insert, 204.
export async function POST(req: NextRequest, { params }: Params) {
  const { shop: shopSlug } = await params;

  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, shopSlug),
    columns: { id: true, active: true },
  });
  if (!shop || !shop.active) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  let body: { path?: string; referrer?: string; visitorId?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    // Empty/invalid body is fine — treat as a bare direct visit.
  }

  const ownHost = req.headers.get("host");
  const userAgent = req.headers.get("user-agent");
  const { source, aiSource, referrerHost } = classifyVisit(
    body.referrer ?? null,
    ownHost,
    userAgent
  );

  const path = (body.path ?? "/").slice(0, 512);
  const visitorId = body.visitorId?.slice(0, 64) ?? null;

  try {
    await db.insert(visits).values({
      shopId: shop.id,
      path,
      source,
      aiSource,
      referrerHost,
      visitorId,
    });
  } catch {
    // Never let analytics logging break a page view.
  }

  return new NextResponse(null, { status: 204 });
}
