/**
 * Panel merchanta → stan integracji z Furgonetką.
 *
 * Token pokazujemy DOKŁADNIE raz, w odpowiedzi na POST. Baza trzyma tylko jego
 * skrót, więc „pokaż mi go jeszcze raz" nie istnieje — zgubiony token zastępuje
 * się nowym i wkleja w Furgonetce ponownie. Ten koszt jest świadomy: inaczej
 * wyciek bazy oddawałby czytanie cudzych zamówień razem z adresami klientów.
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { shopIntegrations } from "@/lib/db/schema";
import { getShopAccess } from "@/lib/api";
import { FURGONETKA_PROVIDER } from "@/lib/furgonetka-access";
import { generateIntegrationToken, hashToken, isFurgonetkaService, tokenHint } from "@/lib/furgonetka";

type Params = { params: Promise<{ shop: string }> };

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function loadRow(shopId: string) {
  return db.query.shopIntegrations.findFirst({
    where: and(
      eq(shopIntegrations.shopId, shopId),
      eq(shopIntegrations.provider, FURGONETKA_PROVIDER),
    ),
  });
}

function publicState(row: Awaited<ReturnType<typeof loadRow>>) {
  const settings = (row?.settings ?? {}) as { serviceByMethod?: Record<string, string> };
  return {
    connected: Boolean(row?.tokenHash),
    enabled: row?.enabled ?? false,
    tokenHint: row?.tokenHint ?? null,
    tokenCreatedAt: row?.tokenCreatedAt ?? null,
    lastPullAt: row?.lastPullAt ?? null,
    lastPullCount: row?.lastPullCount ?? null,
    lastPushAt: row?.lastPushAt ?? null,
    serviceByMethod: settings.serviceByMethod ?? {},
  };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { shop } = await params;
  const access = await getShopAccess(shop);
  if (!access) return unauthorized();
  return NextResponse.json(publicState(await loadRow(access.shopId)));
}

/** Generuje (albo wymienia) token i włącza integrację. */
export async function POST(_req: NextRequest, { params }: Params) {
  const { shop } = await params;
  const access = await getShopAccess(shop);
  if (!access) return unauthorized();

  const token = generateIntegrationToken();
  const now = new Date();

  await db
    .insert(shopIntegrations)
    .values({
      shopId: access.shopId,
      provider: FURGONETKA_PROVIDER,
      enabled: true,
      tokenHash: hashToken(token),
      tokenHint: tokenHint(token),
      tokenCreatedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [shopIntegrations.shopId, shopIntegrations.provider],
      set: {
        enabled: true,
        tokenHash: hashToken(token),
        tokenHint: tokenHint(token),
        tokenCreatedAt: now,
        // Wymiana tokena zeruje ślady — inaczej panel pokazywałby „ostatnie
        // pobranie" sprzed wymiany jako dowód, że nowy token działa.
        lastPullAt: null,
        lastPullCount: null,
        lastPushAt: null,
        updatedAt: now,
      },
    });

  const row = await loadRow(access.shopId);
  return NextResponse.json({ ...publicState(row), token });
}

/** Włącznik i mapowanie metod dostawy na usługi kurierskie Furgonetki. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { shop } = await params;
  const access = await getShopAccess(shop);
  if (!access) return unauthorized();

  const body = (await req.json()) as Partial<{
    enabled: boolean;
    serviceByMethod: Record<string, unknown>;
  }>;

  const row = await loadRow(access.shopId);
  if (!row) {
    return NextResponse.json(
      { error: "Najpierw wygeneruj token integracji." },
      { status: 400 },
    );
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (body.enabled !== undefined) {
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "enabled musi być prawdą albo fałszem." }, { status: 400 });
    }
    updates.enabled = body.enabled;
  }

  if (body.serviceByMethod !== undefined) {
    const raw = body.serviceByMethod;
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      return NextResponse.json({ error: "Niepoprawne mapowanie metod." }, { status: 400 });
    }
    // Przepisujemy tylko pary, które rozumiemy: id metody dostawy → usługa
    // z zamkniętej listy Furgonetki. Pusty wybór znaczy „nie mapuj" i wypada.
    const clean: Record<string, string> = {};
    for (const [methodId, service] of Object.entries(raw).slice(0, 50)) {
      if (typeof methodId !== "string" || methodId.length > 64) continue;
      if (!isFurgonetkaService(service)) continue;
      clean[methodId] = service;
    }
    updates.settings = { serviceByMethod: clean };
  }

  await db
    .update(shopIntegrations)
    .set(updates)
    .where(
      and(
        eq(shopIntegrations.shopId, access.shopId),
        eq(shopIntegrations.provider, FURGONETKA_PROVIDER),
      ),
    );

  return NextResponse.json(publicState(await loadRow(access.shopId)));
}

/** Rozłączenie: kasujemy token, więc dotychczasowy przestaje działać od razu. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { shop } = await params;
  const access = await getShopAccess(shop);
  if (!access) return unauthorized();

  await db
    .delete(shopIntegrations)
    .where(
      and(
        eq(shopIntegrations.shopId, access.shopId),
        eq(shopIntegrations.provider, FURGONETKA_PROVIDER),
      ),
    );

  return NextResponse.json({ ok: true });
}
