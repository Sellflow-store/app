import { db } from "@/lib/db";
import { shopConfig } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { DEFAULT_HOME } from "@/lib/shop";
import type { HomeConfig } from "@/types/shop";
import HomeEditor from "./HomeEditor";

export default async function HomePage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  let initialConfig: HomeConfig = DEFAULT_HOME;

  try {
    const access = await getShopAccess(shopSlug);
    if (access) {
      const row = await db.query.shopConfig.findFirst({
        where: and(eq(shopConfig.shopId, access.shopId), eq(shopConfig.key, "home")),
      });
      if (row?.value) {
        const saved = row.value as Partial<HomeConfig>;
        initialConfig = {
          topBar: { ...DEFAULT_HOME.topBar, ...saved.topBar },
          hero: { ...DEFAULT_HOME.hero, ...saved.hero },
          products: { ...DEFAULT_HOME.products, ...saved.products },
          benefits: { ...DEFAULT_HOME.benefits, ...saved.benefits },
          reviews: { ...DEFAULT_HOME.reviews, ...saved.reviews },
          guarantee: { ...DEFAULT_HOME.guarantee, ...saved.guarantee },
          video: { ...DEFAULT_HOME.video, ...saved.video },
          discounts: { ...DEFAULT_HOME.discounts, ...saved.discounts },
          popup: { ...DEFAULT_HOME.popup, ...saved.popup },
        };
      }
    }
  } catch {
    // DB not configured yet — render with defaults
  }

  return <HomeEditor shopSlug={shopSlug} initialConfig={initialConfig} />;
}
