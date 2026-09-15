/**
 * Wspólna bramka dla obu adresów, które wystawiamy Furgonetce.
 *
 * Żądanie przychodzi z ich serwera, bez sesji i bez Clerka — jedynym dowodem
 * tożsamości jest token, który merchant wkleił u siebie w panelu. Sklep
 * rozpoznajemy po slugu w ścieżce, tak jak w całym /api.
 */

import { and, eq, isNull } from "drizzle-orm";
import { db } from "./db";
import { shopIntegrations, shops } from "./db/schema";
import { tokenFromHeader, tokenMatches } from "./furgonetka";

export const FURGONETKA_PROVIDER = "furgonetka";

export interface FurgonetkaAccess {
  shopId: string;
  shopName: string;
  serviceByMethod: Record<string, string>;
}

/**
 * Zwraca kontekst sklepu albo `null`, gdy cokolwiek się nie zgadza: nie ma
 * takiego sklepu, jest wyłączony/zawieszony, integracja nie jest włączona albo
 * token nie pasuje. Rozmyślnie jeden `null` na wszystkie przypadki — odpowiedź
 * nie ma zdradzać, który sklep istnieje.
 */
export async function authorizeFurgonetka(
  shopSlug: string,
  authHeader: string | null,
): Promise<FurgonetkaAccess | null> {
  const token = tokenFromHeader(authHeader);
  if (!token) return null;

  const shop = await db.query.shops.findFirst({
    where: and(eq(shops.slug, shopSlug), isNull(shops.deletedAt)),
  });
  if (!shop || !shop.active || shop.suspended) return null;

  const row = await db.query.shopIntegrations.findFirst({
    where: and(
      eq(shopIntegrations.shopId, shop.id),
      eq(shopIntegrations.provider, FURGONETKA_PROVIDER),
    ),
  });
  if (!row || !row.enabled) return null;
  if (!tokenMatches(token, row.tokenHash)) return null;

  const settings = (row.settings ?? {}) as { serviceByMethod?: Record<string, string> };

  return {
    shopId: shop.id,
    shopName: shop.name,
    serviceByMethod: settings.serviceByMethod ?? {},
  };
}
