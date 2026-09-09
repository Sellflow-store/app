import { getShopBySlug } from "@/lib/shop";
import { storefrontBase } from "@/lib/storefront-base";
import { absoluteUrl, shopOrigin } from "@/lib/seo";

type Params = { params: Promise<{ shop: string }> };

/**
 * robots.txt sklepu. Koszyk, zamówienie i wyszukiwarka są wyłączone z indeksu:
 * to strony stanu użytkownika, a wyniki wyszukiwania mnożą adresy o tej samej
 * treści. Reszta storefrontu jest otwarta, a mapa witryny wskazana wprost.
 */
export async function GET(_req: Request, { params }: Params) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return new Response("Not found", { status: 404 });

  const [base, origin] = await Promise.all([storefrontBase(shop.slug), shopOrigin()]);

  const body = [
    "User-agent: *",
    "Allow: /",
    `Disallow: ${base}/koszyk`,
    `Disallow: ${base}/zamowienie`,
    `Disallow: ${base}/szukaj`,
    "",
    `Sitemap: ${absoluteUrl(origin, base, "/sitemap.xml")}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
