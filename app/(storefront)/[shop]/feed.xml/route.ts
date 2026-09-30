import { getShopBySlug } from "@/lib/shop";
import { storefrontBase } from "@/lib/storefront-base";
import { absoluteUrl, shopOrigin } from "@/lib/seo";
import { stripHtml } from "@/lib/sanitize";
import { productFeedXml } from "@/lib/agent-commerce";
import { logAiBotVisit } from "@/lib/ai-bot-log";

type Params = { params: Promise<{ shop: string }> };

/**
 * Feed produktowy sklepu w formacie Google Merchant Center (RSS 2.0 + g:).
 * Sprzedawca wkleja jego adres w Merchant Center jako „zaplanowane pobieranie”,
 * a Google pobiera go codziennie. Z tych danych korzystają wyniki produktowe
 * Google, AI Mode i Gemini; ten sam format czytają porównywarki i agenci.
 * Adresy liczymy od hosta żądania, tak jak w mapie witryny.
 */
export async function GET(_req: Request, { params }: Params) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return new Response("Not found", { status: 404 });

  const [base, origin] = await Promise.all([storefrontBase(shop.slug), shopOrigin()]);
  await logAiBotVisit(shop.id, `${base}/feed.xml`);

  const body = productFeedXml({
    shopName: shop.branding.shopName,
    homeUrl: absoluteUrl(origin, base) || origin,
    productUrl: (slug) => absoluteUrl(origin, base, `/produkty/${slug}`),
    absoluteImage: (src) => (src.startsWith("http") ? src : `${origin}${src}`),
    products: shop.products,
    delivery: shop.delivery,
    legal: shop.legal,
    plainText: (html) => stripHtml(html, 5000) ?? "",
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
