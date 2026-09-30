import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { shops, shopConfig, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { DEFAULT_ACCOUNT, DEFAULT_INTEGRATIONS, DEFAULT_BRANDING, normalizeCompliance } from "@/lib/shop";
import type { AccountConfig, IntegrationsConfig, ComplianceConfig, BrandingConfig } from "@/types/shop";
import SettingsPanel from "./SettingsPanel";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;

  const access = await getShopAccess(shopSlug);
  if (!access) notFound();

  const [shop, configs] = await Promise.all([
    db.query.shops.findFirst({ where: eq(shops.id, access.shopId) }),
    db.select().from(shopConfig).where(eq(shopConfig.shopId, access.shopId)),
  ]);
  if (!shop) notFound();

  // Plan, e-mail i ID konta to dane WŁAŚCICIELA sklepu, nie osoby, która
  // ogląda panel: admin Sellflow wchodzący do cudzego sklepu ma własny plan.
  const owner = await db.query.users.findFirst({ where: eq(users.id, shop.ownerId) });

  const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]));

  const account: AccountConfig = {
    ...DEFAULT_ACCOUNT,
    ...((configMap.account as Partial<AccountConfig>) ?? {}),
    company: { ...DEFAULT_ACCOUNT.company, ...((configMap.account as AccountConfig)?.company ?? {}) },
  };
  const integrations: IntegrationsConfig = {
    ...DEFAULT_INTEGRATIONS,
    ...((configMap.integrations as Partial<IntegrationsConfig>) ?? {}),
  };
  const branding: BrandingConfig = {
    ...DEFAULT_BRANDING,
    ...((configMap.branding as Partial<BrandingConfig>) ?? {}),
    shopName: (configMap.branding as BrandingConfig)?.shopName ?? shop.name,
  };
  const brand = (configMap.brand as Record<string, unknown>) ?? null;
  const compliance = normalizeCompliance(configMap.compliance as Partial<ComplianceConfig> | undefined);

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "sell-flow.store";

  return (
    <SettingsPanel
      shopSlug={shop.slug}
      accountEmail={owner?.email ?? ""}
      userId={owner?.id ?? shop.ownerId}
      plan={owner?.plan ?? "free"}
      account={account}
      shopName={shop.name}
      active={shop.active}
      storeUrl={`https://${shop.slug}.${appDomain}`}
      customDomain={shop.customDomain}
      integrations={integrations}
      compliance={compliance}
      branding={branding}
      brand={brand}
    />
  );
}
