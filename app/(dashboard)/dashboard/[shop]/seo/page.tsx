import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { shopConfig } from "@/lib/db/schema";
import { getShopAccess } from "@/lib/api";
import { DEFAULT_SEO, normalizeSeoConfig, type SeoConfig } from "@/lib/page-seo";
import { shopDisplay } from "@/lib/shop-display";
import SeoForm from "./SeoForm";

type Row = { value: unknown } | undefined;

export default async function SeoPage({ params }: { params: Promise<{ shop: string }> }) {
  const { shop: shopSlug } = await params;
  let initial: SeoConfig = DEFAULT_SEO;
  let tagline = "";
  let heroDescription = "";

  const access = await getShopAccess(shopSlug);
  if (access) {
    const get = async (key: string): Promise<Row> =>
      db.query.shopConfig.findFirst({
        where: and(eq(shopConfig.shopId, access.shopId), eq(shopConfig.key, key)),
      });
    const [seoRow, brandingRow, homeRow] = await Promise.all([get("seo"), get("branding"), get("home")]);
    initial = normalizeSeoConfig(seoRow?.value);
    tagline = ((brandingRow?.value as { tagline?: string } | undefined)?.tagline ?? "").trim();
    heroDescription = ((homeRow?.value as { hero?: { description?: string } } | undefined)?.hero?.description ?? "").trim();
  }

  const display = await shopDisplay(shopSlug);
  return (
    <SeoForm
      shopSlug={shopSlug}
      shopName={display.name}
      shopHost={display.host}
      tagline={tagline}
      heroDescription={heroDescription}
      initial={initial}
    />
  );
}
