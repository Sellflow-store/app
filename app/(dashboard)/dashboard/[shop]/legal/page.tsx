import { db } from "@/lib/db";
import { shopConfig, shops } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import type { LegalConfig } from "@/types/shop";
import LegalForm from "./LegalForm";

export default async function LegalPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  let initialTerms = "";
  let initialPrivacy = "";
  let shopName = shopSlug;

  try {
    const access = await getShopAccess(shopSlug);
    if (access) {
      const [shop, rows] = await Promise.all([
        db.query.shops.findFirst({ where: eq(shops.id, access.shopId) }),
        db
          .select()
          .from(shopConfig)
          .where(and(eq(shopConfig.shopId, access.shopId), inArray(shopConfig.key, ["terms", "privacy"]))),
      ]);
      if (shop) shopName = shop.name;
      for (const row of rows) {
        const content = (row.value as Partial<LegalConfig>)?.content ?? "";
        if (row.key === "terms") initialTerms = content;
        if (row.key === "privacy") initialPrivacy = content;
      }
    }
  } catch {
    // DB not configured yet — render empty editor
  }

  return (
    <LegalForm
      shopSlug={shopSlug}
      shopName={shopName}
      initialTerms={initialTerms}
      initialPrivacy={initialPrivacy}
    />
  );
}
