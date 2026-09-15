/**
 * GET /api/furgonetka/{shop}/orders — zamówienia dla panelu Furgonetki.
 *
 * To Furgonetka nas odpytuje, cyklicznie, podając w `datetime` moment ostatniej
 * zmiany, którą już zna. Oddajemy zamówienia zmienione PÓŹNIEJ, od najstarszego
 * do najnowszego — kolejność jest częścią kontraktu, bo po ostatniej pozycji
 * odkładają sobie kursor do następnego odpytania.
 */

import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, gt, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, products, shopIntegrations } from "@/lib/db/schema";
import { authorizeFurgonetka, FURGONETKA_PROVIDER } from "@/lib/furgonetka-access";
import { mapOrderToFurgonetka, type ParcelSize } from "@/lib/furgonetka";
import { checkRateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ shop: string }> };

// Ich dokumentacja deklaruje 100 na stronę; trzymamy to jako twardy sufit,
// żeby literówka w parametrze nie ściągnęła całej historii sklepu naraz.
const MAX_LIMIT = 100;

export async function GET(req: NextRequest, { params }: Params) {
  const { shop: shopSlug } = await params;

  const limited = checkRateLimit(req, `furgonetka:${shopSlug}`, 60, 60_000);
  if (limited) return limited;

  const access = await authorizeFurgonetka(shopSlug, req.headers.get("authorization"));
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = req.nextUrl.searchParams;
  const parsedLimit = parseInt(raw.get("limit") ?? "", 10);
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), MAX_LIMIT)
    : MAX_LIMIT;

  // Brak albo niepoprawna data = pierwsza synchronizacja: oddajemy od początku.
  const sinceRaw = raw.get("datetime");
  const since = sinceRaw ? new Date(sinceRaw) : null;
  const validSince = since && !isNaN(since.getTime()) ? since : null;

  const rows = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.shopId, access.shopId),
        // Anulowanych nie podajemy — z takiego zamówienia nie ma co nadawać.
        ne(orders.status, "cancelled"),
        ...(validSince ? [gt(orders.updatedAt, validSince)] : []),
      ),
    )
    .orderBy(asc(orders.updatedAt))
    .limit(limit);

  // Gabaryty dokładamy z produktów — snapshot pozycji w zamówieniu niesie tylko
  // nazwę i cenę, a bez wagi Furgonetka nie wyceni przesyłki.
  const productIds = [
    ...new Set(
      rows.flatMap((o) =>
        (Array.isArray(o.items) ? (o.items as { productId?: string }[]) : [])
          .map((i) => i.productId)
          .filter((id): id is string => typeof id === "string"),
      ),
    ),
  ];

  const sizes = new Map<string, ParcelSize>();
  if (productIds.length > 0) {
    const found = await db
      .select({
        id: products.id,
        weightGrams: products.weightGrams,
        dimensions: products.dimensions,
      })
      .from(products)
      .where(and(eq(products.shopId, access.shopId), inArray(products.id, productIds)));

    for (const p of found) {
      const d = (p.dimensions ?? {}) as { length?: number; width?: number; height?: number };
      sizes.set(p.id, {
        weightGrams: p.weightGrams ?? null,
        length: typeof d.length === "number" ? d.length : null,
        width: typeof d.width === "number" ? d.width : null,
        height: typeof d.height === "number" ? d.height : null,
      });
    }
  }

  const payload = rows
    .map((o) => mapOrderToFurgonetka(o, sizes, access.serviceByMethod))
    .filter((o) => o !== null);

  // Ślad dla panelu merchanta: „ostatnie pobranie" jest jedynym widocznym
  // dowodem, że integracja żyje. Nie blokujemy nim odpowiedzi.
  try {
    await db
      .update(shopIntegrations)
      .set({ lastPullAt: new Date(), lastPullCount: payload.length, updatedAt: new Date() })
      .where(
        and(
          eq(shopIntegrations.shopId, access.shopId),
          eq(shopIntegrations.provider, FURGONETKA_PROVIDER),
        ),
      );
  } catch (e) {
    console.error("Furgonetka: nie udało się zapisać śladu pobrania", e);
  }

  return NextResponse.json(payload);
}
