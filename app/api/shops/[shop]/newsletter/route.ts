import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shops, newsletterSubscribers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ shop: string }> };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public endpoint — the storefront newsletter popup posts here.
export async function POST(req: NextRequest, { params }: Params) {
  const { shop: shopSlug } = await params;

  // Throttle per IP — stops newsletter sign-up spam.
  const limited = checkRateLimit(req, `newsletter:${shopSlug}`, 10, 60_000);
  if (limited) return limited;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, shopSlug) });
  if (!shop || !shop.active || shop.suspended) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  let email = "";
  try {
    const body = (await req.json()) as { email?: string };
    email = body.email?.trim().toLowerCase() ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Podaj poprawny adres e-mail." }, { status: 400 });
  }

  // Repeat sign-up is fine — same response, no duplicate row
  await db
    .insert(newsletterSubscribers)
    .values({ shopId: shop.id, email })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true }, { status: 201 });
}
