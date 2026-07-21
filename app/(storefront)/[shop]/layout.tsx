import type { Metadata } from "next";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { shops, shopConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_INTEGRATIONS, DEFAULT_COMPLIANCE } from "@/lib/shop";
import type { IntegrationsConfig, ComplianceConfig, BrandingConfig } from "@/types/shop";
import TrackVisit from "@/components/store/TrackVisit";
import StorefrontScripts from "@/components/store/StorefrontScripts";
import { StoreBaseProvider } from "@/components/store/StoreBaseContext";
import { storefrontBase } from "@/lib/storefront-base";

async function loadShopMeta(slug: string): Promise<{
  integrations: IntegrationsConfig;
  compliance: ComplianceConfig;
  branding: Partial<BrandingConfig>;
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
      branding: {
        shopName: shop.name,
        ...((map.branding as Partial<BrandingConfig>) ?? {}),
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
  const data = await loadShopMeta(shop);
  const meta: Metadata = {};

  // Resolve relative OG / canonical URLs against the host actually serving this
  // request. When a shop has a verified custom domain the subdomain redirects
  // there (proxy.ts), so the serving host is already the canonical one.
  const host = (await headers()).get("host");
  if (host) {
    const proto = host.includes("localhost") ? "http" : "https";
    meta.metadataBase = new URL(`${proto}://${host}`);
  }

  const gmc = data?.integrations.googleMerchantId?.trim();
  if (gmc) meta.verification = { other: { "google-site-verification": gmc } };

  const branding = data?.branding;
  if (branding?.shopName) {
    meta.title = { default: branding.shopName, template: `%s — ${branding.shopName}` };
    if (branding.tagline) meta.description = branding.tagline;
  }

  // Favicon sklepu: własny plik, a jeśli go nie ma — logo sklepu.
  // Bez tego karta przeglądarki pokazywałaby ikonę platformy.
  const icon = branding?.faviconUrl?.trim() || branding?.logoUrl?.trim();
  if (icon) meta.icons = { icon: [{ url: icon }], shortcut: [{ url: icon }], apple: [{ url: icon }] };

  return meta;
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
  const [data, base] = await Promise.all([loadShopMeta(shop), storefrontBase(shop)]);
  return (
    <StoreBaseProvider base={base}>
      {children}
      <TrackVisit slug={shop} />
      {data && <StorefrontScripts integrations={data.integrations} compliance={data.compliance} />}
    </StoreBaseProvider>
  );
}
