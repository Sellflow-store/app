import { db } from "@/lib/db";
import { shopConfig } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { DEFAULT_FOOTER } from "@/lib/shop";
import type { FooterConfig } from "@/types/shop";
import FooterForm from "./FooterForm";

export default async function FooterPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  let initialConfig: FooterConfig = DEFAULT_FOOTER;

  try {
    const access = await getShopAccess(shopSlug);
    if (access) {
      const row = await db.query.shopConfig.findFirst({
        where: and(eq(shopConfig.shopId, access.shopId), eq(shopConfig.key, "footer")),
      });
      const saved = (row?.value as Partial<FooterConfig>) ?? {};
      initialConfig = {
        ...DEFAULT_FOOTER,
        ...saved,
        social: { ...DEFAULT_FOOTER.social, ...(saved.social ?? {}) },
      };
    }
  } catch {
    // DB not configured yet — render with defaults
  }

  return <FooterForm shopSlug={shopSlug} initialConfig={initialConfig} />;
}
