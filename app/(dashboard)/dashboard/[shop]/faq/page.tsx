import { db } from "@/lib/db";
import { shopConfig } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { DEFAULT_FAQ } from "@/lib/shop";
import type { FaqConfig } from "@/types/shop";
import FaqForm from "./FaqForm";

export default async function FaqPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  let initialConfig: FaqConfig = DEFAULT_FAQ;

  try {
    const access = await getShopAccess(shopSlug);
    if (access) {
      const row = await db.query.shopConfig.findFirst({
        where: and(eq(shopConfig.shopId, access.shopId), eq(shopConfig.key, "faq")),
      });
      if (row?.value) {
        initialConfig = { ...DEFAULT_FAQ, ...(row.value as Partial<FaqConfig>) };
      }
    }
  } catch {
    // DB not configured yet — render with defaults
  }

  return <FaqForm shopSlug={shopSlug} initialConfig={initialConfig} />;
}
