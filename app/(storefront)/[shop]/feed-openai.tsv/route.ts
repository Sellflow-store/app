import { getShopBySlug } from "@/lib/shop";
import { storefrontBase } from "@/lib/storefront-base";
import { absoluteUrl, shopOrigin } from "@/lib/seo";
import { stripHtml } from "@/lib/sanitize";
import { productFeedOpenAiTsv } from "@/lib/agent-commerce";
import { logAiBotVisit } from "@/lib/ai-bot-log";

type Params = { params: Promise<{ shop: string }> };

/**
 * Feed produktowy w specyfikacji OpenAI (ChatGPT Shopping, Ads Manager).
 * OpenAI nie pobiera go sam: sprzedawca ściąga plik z panelu i wgrywa go
 * w Ads Manager albo na SFTP OpenAI. Adresy jak w feedzie Google.
 */
export async function GET(req: Request, { params }: Params) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return new Response("Not found", { status: 404 });

  const [base, origin] = await Promise.all([storefrontBase(shop.slug), shopOrigin()]);
  await logAiBotVisit(shop.id, `${base}/feed-openai.tsv`);

  const body = productFeedOpenAiTsv({
    shopName: shop.branding.shopName,
    homeUrl: absoluteUrl(origin, base) || origin,
    productUrl: (slug) => absoluteUrl(origin, base, `/produkty/${slug}`),
    pageUrl: (path) => absoluteUrl(origin, base, path),
    absoluteImage: (src) => (src.startsWith("http") ? src : `${origin}${src}`),
    products: shop.products,
    delivery: shop.delivery,
    legal: shop.legal,
    plainText: (html) => stripHtml(html, 5000) ?? "",
  });

  const download = new URL(req.url).searchParams.has("download");
  return new Response(body, {
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
      ...(download ? { "Content-Disposition": `attachment; filename="${shop.slug}-openai-feed.tsv"` } : {}),
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
