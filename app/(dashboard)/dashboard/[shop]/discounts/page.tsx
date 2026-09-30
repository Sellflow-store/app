import { db } from "@/lib/db";
import { discountCodes, shopConfig, shops } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { shopPublicUrl } from "@/lib/legal";
import { DEFAULT_CART } from "@/lib/cart-offers";
import type { CartConfig } from "@/types/shop";
import DiscountsManager, { type DiscountRow } from "./DiscountsManager";

export default async function DiscountsPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  let rows: DiscountRow[] = [];
  let shopUrl = "";
  let showOffers = DEFAULT_CART.showOffers;

  const access = await getShopAccess(shopSlug);
  if (access) {
    const [codes, shop, cartRow] = await Promise.all([
      db
        .select()
        .from(discountCodes)
        .where(eq(discountCodes.shopId, access.shopId))
        .orderBy(desc(discountCodes.createdAt)),
      db.query.shops.findFirst({ where: eq(shops.id, access.shopId) }),
      db.query.shopConfig.findFirst({
        where: and(eq(shopConfig.shopId, access.shopId), eq(shopConfig.key, "cart")),
      }),
    ]);

    rows = codes.map((c) => ({
      id: c.id,
      code: c.code,
      discountPercent: c.discountPercent,
      active: c.active,
      expiresAt: c.expiresAt ? c.expiresAt.toISOString().slice(0, 10) : null,
      maxUses: c.maxUses,
      usesCount: c.usesCount,
    }));
    if (shop) shopUrl = shopPublicUrl(shop);
    showOffers = { ...DEFAULT_CART, ...((cartRow?.value as Partial<CartConfig>) ?? {}) }.showOffers;
  }

  return (
    <DiscountsManager
      shopSlug={shopSlug}
      initialCodes={rows}
      shopUrl={shopUrl}
      initialShowOffers={showOffers}
    />
  );
}
