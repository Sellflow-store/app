import { db } from "@/lib/db";
import { discountCodes } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import DiscountsManager, { type DiscountRow } from "./DiscountsManager";

export default async function DiscountsPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  let rows: DiscountRow[] = [];

  try {
    const access = await getShopAccess(shopSlug);
    if (access) {
      const codes = await db
        .select()
        .from(discountCodes)
        .where(eq(discountCodes.shopId, access.shopId))
        .orderBy(desc(discountCodes.createdAt));

      rows = codes.map((c) => ({
        id: c.id,
        code: c.code,
        discountPercent: c.discountPercent,
        active: c.active,
        expiresAt: c.expiresAt ? c.expiresAt.toISOString().slice(0, 10) : null,
        maxUses: c.maxUses,
        usesCount: c.usesCount,
      }));
    }
  } catch {
    // DB not configured yet — render empty state
  }

  return <DiscountsManager shopSlug={shopSlug} initialCodes={rows} />;
}
