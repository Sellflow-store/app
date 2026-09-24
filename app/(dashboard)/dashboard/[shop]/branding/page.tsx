import { db } from "@/lib/db";
import { shopConfig, shops } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { DEFAULT_BRANDING } from "@/lib/shop";
import type { BrandingConfig } from "@/types/shop";
import BrandingForm from "./BrandingForm";

export default async function BrandingPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  let initialConfig: BrandingConfig = DEFAULT_BRANDING;
  let dbShopName = "";

  // getShopAccess, not an ownerId lookup: an admin using "login as owner" must
  // see (and save over) the merchant's real branding, not the defaults.
  // Errors propagate to error.tsx: rendering defaults on a failed load would
  // let one click of "Save" overwrite the real config with them.
  const access = await getShopAccess(shopSlug);
  if (access) {
    const [shop, row] = await Promise.all([
      db.query.shops.findFirst({ where: eq(shops.id, access.shopId) }),
      db.query.shopConfig.findFirst({
        where: and(eq(shopConfig.shopId, access.shopId), eq(shopConfig.key, "branding")),
      }),
    ]);
    if (shop) {
      dbShopName = shop.name;
      const saved = (row?.value as Partial<BrandingConfig> | undefined) ?? {};
      // Same defaults as the storefront (lib/shop), so the form shows the
      // colors the shop actually renders with.
      initialConfig = { ...DEFAULT_BRANDING, ...saved, shopName: saved.shopName ?? shop.name };
    }
  }

  return (
    <BrandingForm
      shopSlug={shopSlug}
      dbShopName={dbShopName}
      initialConfig={initialConfig}
    />
  );
}
