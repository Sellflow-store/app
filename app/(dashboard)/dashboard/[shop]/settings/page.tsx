import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { shops, shopConfig, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { DEFAULT_ACCOUNT, DEFAULT_INTEGRATIONS, DEFAULT_COMPLIANCE } from "@/lib/shop";
import type { AccountConfig, IntegrationsConfig, ComplianceConfig } from "@/types/shop";
import SettingsPanel from "./SettingsPanel";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;

  const access = await getShopAccess(shopSlug);
  if (!access) notFound();

  const [shop, owner, configs] = await Promise.all([
    db.query.shops.findFirst({ where: eq(shops.id, access.shopId) }),
    db.query.users.findFirst({ where: eq(users.id, access.userId) }),
    db.select().from(shopConfig).where(eq(shopConfig.shopId, access.shopId)),
  ]);
  if (!shop) notFound();

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
  const savedCompliance = (configMap.compliance as Partial<ComplianceConfig>) ?? {};
  const compliance: ComplianceConfig = {
    cookieBanner: { ...DEFAULT_COMPLIANCE.cookieBanner, ...(savedCompliance.cookieBanner ?? {}) },
    omnibus: { ...DEFAULT_COMPLIANCE.omnibus, ...(savedCompliance.omnibus ?? {}) },
  };

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "sell-flow.store";

  return (
    <SettingsPanel
      shopSlug={shop.slug}
      accountEmail={owner?.email ?? ""}
      userId={access.userId}
      plan={owner?.plan ?? "free"}
      account={account}
      shopName={shop.name}
      active={shop.active}
      storeUrl={`https://${shop.slug}.${appDomain}`}
      integrations={integrations}
      compliance={compliance}
    />
  );
}
