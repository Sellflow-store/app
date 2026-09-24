import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shops, shopConfig, newsletterSubscribers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { verifyNewsletterToken } from "@/lib/newsletter-token";
import { checkDiscountCode } from "@/lib/discounts";
import { sendEmail } from "@/lib/email";
import { newsletterRewardEmail } from "@/lib/email-templates";
import { storefrontBase } from "@/lib/storefront-base";
import { checkRateLimit } from "@/lib/rate-limit";
import type { HomeConfig } from "@/types/shop";

type Params = { params: Promise<{ shop: string }> };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function page(
  title: string,
  text: string,
  shopName: string,
  backUrl: string,
  status = 200,
  confirmAction?: string,
) {
  const action = confirmAction
    ? `<form method="post" action="${esc(confirmAction)}" style="margin:0 0 12px;"><button type="submit" style="background:#16161d;color:#fff;font-size:14px;font-weight:bold;padding:13px 26px;border:0;border-radius:99px;cursor:pointer;">Potwierdzam zapis</button></form>`
    : "";
  const html = `<!DOCTYPE html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${esc(title)} · ${esc(shopName)}</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;padding:16px;box-sizing:border-box;">
<main style="max-width:440px;width:100%;background:#fff;border-radius:16px;padding:32px;text-align:center;">
<p style="margin:0 0 16px;font-size:13px;font-weight:bold;color:#888;letter-spacing:0.04em;">${esc(shopName)}</p>
<h1 style="margin:0 0 10px;font-size:22px;color:#111;">${esc(title)}</h1>
<p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#444;">${esc(text)}</p>
${action}<a href="${esc(backUrl)}" style="display:inline-block;${confirmAction ? "color:#444;font-size:13px;padding:8px;" : "background:#16161d;color:#fff;font-size:13px;font-weight:bold;padding:11px 22px;border-radius:99px;"}text-decoration:none;">Wróć do sklepu</a>
</main></body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function resolve(req: NextRequest, params: Params["params"]) {
  const { shop: shopSlug } = await params;

  const limited = checkRateLimit(req, `newsletter-confirm:${shopSlug}`, 30, 60_000);
  if (limited) return limited;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, shopSlug) });
  const shopName = shop?.name ?? "Sklep";
  const backUrl = `${req.nextUrl.origin}${(await storefrontBase(shopSlug)) || "/"}`;

  if (!shop || !shop.active || shop.suspended || shop.deletedAt) {
    return page("Sklep jest niedostępny", "Tego sklepu nie ma już w sieci, więc zapis nie jest możliwy.", shopName, backUrl, 404);
  }

  const data = verifyNewsletterToken(req.nextUrl.searchParams.get("t") ?? "");
  if (!data || data.shopId !== shop.id) {
    return page(
      "Link jest nieważny",
      "Link wygasł albo został uszkodzony. Zapisz się jeszcze raz w sklepie, a wyślemy nowy.",
      shopName,
      backUrl,
      400,
    );
  }
  return { shop, data, backUrl };
}

// Opened from the confirmation e-mail (double opt-in, see ../route.ts). GET
// only asks: mail scanners and link previews open links on their own, and a
// GET that subscribed would confirm addresses nobody confirmed.
export async function GET(req: NextRequest, { params }: Params) {
  const r = await resolve(req, params);
  if (r instanceof NextResponse) return r;
  return page(
    "Potwierdź zapis",
    `Zapiszemy adres ${r.data.email} do newslettera sklepu ${r.shop.name}.`,
    r.shop.name,
    r.backUrl,
    200,
    `${req.nextUrl.pathname}${req.nextUrl.search}`,
  );
}

export async function POST(req: NextRequest, { params }: Params) {
  const r = await resolve(req, params);
  if (r instanceof NextResponse) return r;
  const { shop, data, backUrl } = r;

  const inserted = await db
    .insert(newsletterSubscribers)
    .values({ shopId: shop.id, email: data.email })
    .onConflictDoNothing()
    .returning({ id: newsletterSubscribers.id });

  // Only the first confirmation sends the reward: reopening the link (or a
  // mail scanner prefetching it) must not mail the code again.
  let rewardSent = false;
  if (inserted.length > 0) {
    const homeRow = await db.query.shopConfig.findFirst({
      where: and(eq(shopConfig.shopId, shop.id), eq(shopConfig.key, "home")),
    });
    const rewardCode = ((homeRow?.value ?? {}) as Partial<HomeConfig>).popup?.rewardCode?.trim();
    if (rewardCode) {
      const verdict = await checkDiscountCode(shop.id, rewardCode);
      if (verdict.valid) {
        const mail = newsletterRewardEmail({
          shopName: shop.name,
          code: verdict.row.code,
          discountPercent: verdict.discountPercent,
          shopUrl: backUrl,
        });
        rewardSent = await sendEmail({ to: data.email, ...mail });
      } else {
        console.error(`Newsletter: kod nagrody „${rewardCode}" w sklepie ${shop.slug} jest nieważny: ${verdict.reason}`);
      }
    }
  }

  return page(
    "Zapis potwierdzony",
    rewardSent
      ? "Dziękujemy! Kod rabatowy jest już w Twojej skrzynce."
      : inserted.length > 0
        ? "Dziękujemy! Od teraz będziesz dostawać nasze wiadomości."
        : "Ten adres jest już na liście. Nic więcej nie trzeba robić.",
    shop.name,
    backUrl,
  );
}
