import { db } from "./db";
import { discountCodes } from "./db/schema";
import { and, eq, isNull, lt, or, sql } from "drizzle-orm";

export type DiscountVerdict =
  | { valid: true; row: typeof discountCodes.$inferSelect; discountPercent: number }
  | { valid: false; reason: string };

const SHOP_TZ = "Europe/Warsaw";

/** Offset strefy sklepu względem UTC (ms) w danej chwili. */
function tzOffsetMs(at: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SHOP_TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(at));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - (at - (at % 1000));
}

/**
 * Merchant wybiera w panelu DZIEŃ („ważny do 1.10”), a kolumna trzyma północ
 * UTC tego dnia. Kod ma działać do końca tego dnia czasu polskiego, więc
 * granicą jest północ polska dnia następnego (a nie 02:00 w dniu wygaśnięcia).
 */
export function discountDeadline(expiresAt: Date): number {
  const nextDayUtcMidnight = Date.UTC(
    expiresAt.getUTCFullYear(),
    expiresAt.getUTCMonth(),
    expiresAt.getUTCDate() + 1,
  );
  // Zmiana czasu w Polsce jest o 2:00/3:00, więc offset o północy jest pewny.
  return nextDayUtcMidnight - tzOffsetMs(nextDayUtcMidnight);
}

/** Wspólna walidacja kodu — używana przez publiczny endpoint i zapis zamówienia. */
export async function checkDiscountCode(shopId: string, rawCode: string): Promise<DiscountVerdict> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { valid: false, reason: "Podaj kod rabatowy." };

  const row = await db.query.discountCodes.findFirst({
    where: and(eq(discountCodes.shopId, shopId), eq(discountCodes.code, code)),
  });

  if (!row || !row.active) return { valid: false, reason: "Ten kod nie istnieje lub jest nieaktywny." };
  if (row.expiresAt && discountDeadline(row.expiresAt) <= Date.now()) {
    return { valid: false, reason: "Ten kod wygasł." };
  }
  if (row.maxUses !== null && row.usesCount >= row.maxUses) {
    return { valid: false, reason: "Limit użyć tego kodu został wyczerpany." };
  }
  return { valid: true, row, discountPercent: row.discountPercent };
}

/**
 * Atomowo zajmuje jedno użycie kodu. Limit sprawdza sama baza w warunku
 * UPDATE-a, więc równoległe zamówienia nie przebiją `maxUses`, nawet gdy
 * wszystkie przeszły wcześniej checkDiscountCode. false = limit wyczerpany
 * albo kod wyłączony w międzyczasie.
 */
export async function claimDiscountUse(id: string): Promise<boolean> {
  const rows = await db
    .update(discountCodes)
    .set({ usesCount: sql`${discountCodes.usesCount} + 1` })
    .where(
      and(
        eq(discountCodes.id, id),
        eq(discountCodes.active, true),
        or(isNull(discountCodes.maxUses), lt(discountCodes.usesCount, discountCodes.maxUses)),
      ),
    )
    .returning({ id: discountCodes.id });
  return rows.length > 0;
}

/** Oddaje użycie zajęte przez claimDiscountUse, gdy zamówienie ostatecznie nie powstało. */
export async function releaseDiscountUse(id: string): Promise<void> {
  await db
    .update(discountCodes)
    .set({ usesCount: sql`GREATEST(${discountCodes.usesCount} - 1, 0)` })
    .where(eq(discountCodes.id, id));
}
