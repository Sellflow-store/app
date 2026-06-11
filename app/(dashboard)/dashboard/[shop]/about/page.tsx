import { db } from "@/lib/db";
import { shopConfig } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { DEFAULT_ABOUT } from "@/lib/shop";
import type { AboutConfig } from "@/types/shop";
import AboutForm from "./AboutForm";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  let initialConfig: AboutConfig = DEFAULT_ABOUT;

  try {
    const access = await getShopAccess(shopSlug);
    if (access) {
      const row = await db.query.shopConfig.findFirst({
        where: and(eq(shopConfig.shopId, access.shopId), eq(shopConfig.key, "about")),
      });
      if (row?.value) {
        initialConfig = { ...DEFAULT_ABOUT, ...(row.value as Partial<AboutConfig>) };
      }
    }
  } catch {
    // DB not configured yet — render with defaults
  }

  return <AboutForm shopSlug={shopSlug} initialConfig={initialConfig} />;
}
