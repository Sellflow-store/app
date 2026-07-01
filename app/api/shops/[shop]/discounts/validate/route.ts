import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkDiscountCode } from "@/lib/discounts";
import { checkRateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ shop: string }> };

// Public — checkout validates the code as the customer types it.
export async function GET(req: NextRequest, { params }: Params) {
  const { shop: shopSlug } = await params;

  // Throttle per IP — stops brute-force enumeration of discount codes.
  const limited = checkRateLimit(req, `discount:${shopSlug}`, 30, 60_000);
  if (limited) return limited;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, shopSlug) });
  if (!shop || !shop.active || shop.suspended) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  const code = req.nextUrl.searchParams.get("code") ?? "";
  const verdict = await checkDiscountCode(shop.id, code);

  if (!verdict.valid) {
    return NextResponse.json({ valid: false, reason: verdict.reason });
  }
  return NextResponse.json({
    valid: true,
    code: verdict.row.code,
    discountPercent: verdict.discountPercent,
  });
}
