import { getShopBySlug } from "@/lib/shop";
import { storefrontBase } from "@/lib/storefront-base";
import { absoluteUrl, shopOrigin } from "@/lib/seo";
import { aiRobotsSections } from "@/lib/agent-commerce";
import { logAiBotVisit } from "@/lib/ai-bot-log";

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

  const disallow = [`${base}/koszyk`, `${base}/zamowienie`, `${base}/szukaj`];
  await logAiBotVisit(shop.id, `${base}/robots.txt`);

  // Boty AI wymienione z nazwy: bot trzyma się najbardziej szczegółowej grupy,
  // więc jawny wpis „Allow” działa także wtedy, gdy ktoś kiedyś zaostrzy regułę
  // ogólną. Boty trenujące modele zależą od ustawienia w Zgodności.
  const body = [
    "User-agent: *",
    "Allow: /",
    ...disallow.map((d) => `Disallow: ${d}`),
    "",
    ...aiRobotsSections(shop.compliance.ai.allowTraining, disallow),
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
