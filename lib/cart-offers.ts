import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { shopConfig } from "./db/schema";
import { checkDiscountCode } from "./discounts";
import type { CartConfig, CartOffers, HomeConfig } from "@/types/shop";

export const DEFAULT_CART: CartConfig = { showOffers: false };

/**
 * Promocje do pokazania w koszyku, gdy sprzedawca je włączył (Rabaty → „Pokazuj
 * promocje w koszyku”). Każdy kod przechodzi tę samą walidację co przy
 * zamówieniu: wygasły albo wyczerpany kod nie trafi na stronę jako obietnica.
 * null = nic nie pokazujemy (wyłączone albo nie ma czego).
 */
export async function getCartOffers(shopId: string): Promise<CartOffers | null> {
  const rows = await db
    .select({ key: shopConfig.key, value: shopConfig.value })
    .from(shopConfig)
    .where(and(eq(shopConfig.shopId, shopId), inArray(shopConfig.key, ["cart", "home"])));
  const cfg = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const cart = { ...DEFAULT_CART, ...((cfg.cart as Partial<CartConfig>) ?? {}) };
  if (!cart.showOffers) return null;

  const home = (cfg.home ?? {}) as Partial<HomeConfig>;

  let publicCode: CartOffers["publicCode"] = null;
  const barCode = home.topBar?.visible
    ? home.discounts?.codes?.[home.discounts?.topBarCodeIndex ?? 0]?.code
    : undefined;
  if (barCode) {
    const v = await checkDiscountCode(shopId, String(barCode));
    if (v.valid) publicCode = { code: v.row.code, percent: v.discountPercent };
  }

  let newsletter: CartOffers["newsletter"] = null;
  const reward = home.popup?.rewardCode?.trim();
  if (reward) {
    const v = await checkDiscountCode(shopId, reward);
    if (v.valid) newsletter = { percent: v.discountPercent };
  }

  return publicCode || newsletter ? { publicCode, newsletter } : null;
}
