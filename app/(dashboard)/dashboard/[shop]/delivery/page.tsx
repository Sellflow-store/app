import { db } from "@/lib/db";
import { shopConfig } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { DEFAULT_DELIVERY } from "@/lib/shop";
import type { DeliveryConfig } from "@/types/shop";
import DeliveryForm from "./DeliveryForm";

export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  let initialConfig: DeliveryConfig = DEFAULT_DELIVERY;

  try {
    const access = await getShopAccess(shopSlug);
    if (access) {
      const row = await db.query.shopConfig.findFirst({
        where: and(eq(shopConfig.shopId, access.shopId), eq(shopConfig.key, "delivery")),
      });
      if (row?.value) {
        initialConfig = { ...DEFAULT_DELIVERY, ...(row.value as Partial<DeliveryConfig>) };
      }
    }
  } catch {
    // DB not configured yet — render with defaults
  }

  return <DeliveryForm shopSlug={shopSlug} initialConfig={initialConfig} />;
}
