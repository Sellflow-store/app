import type { Metadata } from "next";
import { db } from "@/lib/db";
import { shops, shopConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_INTEGRATIONS, DEFAULT_COMPLIANCE } from "@/lib/shop";
import type { IntegrationsConfig, ComplianceConfig } from "@/types/shop";
import TrackVisit from "@/components/store/TrackVisit";
import StorefrontScripts from "@/components/store/StorefrontScripts";
import { StoreBaseProvider } from "@/components/store/StoreBaseContext";
import { storefrontBase } from "@/lib/storefront-base";

async function loadIntegrations(slug: string): Promise<{
  integrations: IntegrationsConfig;
  compliance: ComplianceConfig;
} | null> {
  try {
    const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
    if (!shop) return null;
    const rows = await db
      .select()
      .from(shopConfig)
      .where(eq(shopConfig.shopId, shop.id));
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const savedCompliance = (map.compliance as Partial<ComplianceConfig>) ?? {};
    return {
      integrations: { ...DEFAULT_INTEGRATIONS, ...((map.integrations as Partial<IntegrationsConfig>) ?? {}) },
      compliance: {
        cookieBanner: { ...DEFAULT_COMPLIANCE.cookieBanner, ...(savedCompliance.cookieBanner ?? {}) },
        omnibus: { ...DEFAULT_COMPLIANCE.omnibus, ...(savedCompliance.omnibus ?? {}) },
      },
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shop: string }>;
}): Promise<Metadata> {
  const { shop } = await params;
  const data = await loadIntegrations(shop);
  const gmc = data?.integrations.googleMerchantId?.trim();
  return gmc ? { verification: { other: { "google-site-verification": gmc } } } : {};
}

// Wraps every storefront page for a shop. Mounts the pageview beacon and the
// merchant's consent-gated pixels/tags.
export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  const [data, base] = await Promise.all([loadIntegrations(shop), storefrontBase(shop)]);
  return (
    <StoreBaseProvider base={base}>
      {children}
      <TrackVisit slug={shop} />
      {data && <StorefrontScripts integrations={data.integrations} compliance={data.compliance} />}
    </StoreBaseProvider>
  );
}
