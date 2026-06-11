import { db } from "@/lib/db";
import { shopConfig } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { DEFAULT_CHECKOUT } from "@/lib/shop";
import type { CheckoutConfig } from "@/types/shop";
import PaymentsForm from "./PaymentsForm";

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  let initialConfig: CheckoutConfig = DEFAULT_CHECKOUT;

  try {
    const access = await getShopAccess(shopSlug);
    if (access) {
      const row = await db.query.shopConfig.findFirst({
        where: and(eq(shopConfig.shopId, access.shopId), eq(shopConfig.key, "checkout")),
      });
      if (row?.value) {
        initialConfig = { ...DEFAULT_CHECKOUT, ...(row.value as Partial<CheckoutConfig>) };
      }
    }
  } catch {
    // DB not configured yet — render with defaults
  }

  return <PaymentsForm shopSlug={shopSlug} initialConfig={initialConfig} />;
}
