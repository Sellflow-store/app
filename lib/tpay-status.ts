import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { shopIntegrations } from "./db/schema";

/**
 * Czy sklep ma aktywną płatność online — bez sekretów i bez `server-only`.
 *
 * Osobny moduł, bo `lib/shop.ts` (który to woła) jest importowany także przez
 * klienckie `app/preview-shop` po stałe DEFAULT_*. Gdyby szedł przez
 * `lib/tpay.ts`, bundler odrzuciłby build na imporcie `server-only`.
 */

export const TPAY_PROVIDER = "tpay";

export async function tpayEnabled(shopId: string): Promise<boolean> {
  const row = await db.query.shopIntegrations.findFirst({
    where: and(eq(shopIntegrations.shopId, shopId), eq(shopIntegrations.provider, TPAY_PROVIDER)),
  });
  const s = (row?.settings ?? {}) as { clientId?: string; secretEnc?: string };
  return Boolean(row?.enabled && s.clientId && s.secretEnc);
}
