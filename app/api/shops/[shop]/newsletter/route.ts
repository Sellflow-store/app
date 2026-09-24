import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shops, shopConfig, newsletterSubscribers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { allowKey, checkRateLimit } from "@/lib/rate-limit";
import { signNewsletterToken } from "@/lib/newsletter-token";
import { sendEmail } from "@/lib/email";
import { newsletterConfirmEmail } from "@/lib/email-templates";
import type { HomeConfig } from "@/types/shop";

type Params = { params: Promise<{ shop: string }> };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public endpoint — the storefront newsletter popup posts here.
export async function POST(req: NextRequest, { params }: Params) {
  const { shop: shopSlug } = await params;

  // Throttle per IP — stops newsletter sign-up spam.
  const limited = checkRateLimit(req, `newsletter:${shopSlug}`, 10, 60_000);
  if (limited) return limited;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, shopSlug) });
  if (!shop || !shop.active || shop.suspended || shop.deletedAt) {
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

  // Double opt-in: nothing is stored yet. The address gets a signed link and
  // lands on the list only after the owner of the mailbox clicks it
  // (newsletter/confirm). An address already on the list is answered the
  // same way, so the endpoint doesn't reveal who is subscribed.
  const existing = await db.query.newsletterSubscribers.findFirst({
    where: and(eq(newsletterSubscribers.shopId, shop.id), eq(newsletterSubscribers.email, email)),
    columns: { id: true },
  });
  // Each request mails an address the caller picked: cap it per address too,
  // not only per IP, so the form can't be used to flood someone's inbox.
  if (!existing && allowKey(`newsletter-mail:${shop.id}:${email}`, 3, 60 * 60_000)) {
    const token = signNewsletterToken(shop.id, email);
    if (!token) {
      console.error("Newsletter: brak NEWSLETTER_SECRET/CLERK_SECRET_KEY, nie da się podpisać linku");
      return NextResponse.json({ error: "Zapis jest chwilowo niedostępny." }, { status: 503 });
    }
    const homeRow = await db.query.shopConfig.findFirst({
      where: and(eq(shopConfig.shopId, shop.id), eq(shopConfig.key, "home")),
    });
    const popup = ((homeRow?.value ?? {}) as Partial<HomeConfig>).popup;
    const confirmUrl = `${req.nextUrl.origin}/api/shops/${shop.slug}/newsletter/confirm?t=${token}`;
    const mail = newsletterConfirmEmail({
      shopName: shop.name,
      confirmUrl,
      hasReward: Boolean(popup?.rewardCode?.trim()),
    });
    await sendEmail({ to: email, ...mail });
  }

  return NextResponse.json({ ok: true, confirmationRequired: true }, { status: 202 });
}
