import { db } from "./db";
import { discountCodes } from "./db/schema";
import { and, eq } from "drizzle-orm";

export type DiscountVerdict =
  | { valid: true; row: typeof discountCodes.$inferSelect; discountPercent: number }
  | { valid: false; reason: string };

/** Wspólna walidacja kodu — używana przez publiczny endpoint i zapis zamówienia. */
export async function checkDiscountCode(shopId: string, rawCode: string): Promise<DiscountVerdict> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { valid: false, reason: "Podaj kod rabatowy." };

  const row = await db.query.discountCodes.findFirst({
    where: and(eq(discountCodes.shopId, shopId), eq(discountCodes.code, code)),
  });

  if (!row || !row.active) return { valid: false, reason: "Ten kod nie istnieje lub jest nieaktywny." };
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
    return { valid: false, reason: "Ten kod wygasł." };
  }
  if (row.maxUses !== null && row.usesCount >= row.maxUses) {
    return { valid: false, reason: "Limit użyć tego kodu został wyczerpany." };
  }
  return { valid: true, row, discountPercent: row.discountPercent };
}
