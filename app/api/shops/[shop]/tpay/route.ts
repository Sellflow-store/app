/**
 * Panel merchanta → podpięcie własnego konta Tpay (płatności online).
 *
 * Secret przyjmujemy raz i trzymamy zaszyfrowany (lib/secret-box). Do
 * przeglądarki wraca tylko Client ID i 4 ostatnie znaki secretu — tyle, żeby
 * merchant poznał, który klucz jest wpięty. Przed zapisem pytamy Tpay o token:
 * literówka w kluczu wychodzi tu, a nie przy pierwszym kliencie w checkoucie.
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { shopIntegrations } from "@/lib/db/schema";
import { getShopAccess } from "@/lib/api";
import { sealSecret, secretBoxConfigured } from "@/lib/secret-box";
import { TPAY_PROVIDER, loadTpayRow, verifyTpayCredentials, type TpaySettings } from "@/lib/tpay";

type Params = { params: Promise<{ shop: string }> };

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

function publicState(row: Awaited<ReturnType<typeof loadTpayRow>>) {
  const s = (row?.settings ?? {}) as TpaySettings;
  return {
    connected: Boolean(s.clientId && s.secretEnc),
    enabled: row?.enabled ?? false,
    clientId: s.clientId ?? null,
    secretHint: row?.tokenHint ?? null,
    sandbox: Boolean(s.sandbox),
    connectedAt: row?.tokenCreatedAt ?? null,
    lastNotificationAt: row?.lastPushAt ?? null,
    encryptionReady: secretBoxConfigured(),
  };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { shop } = await params;
  const access = await getShopAccess(shop);
  if (!access) return unauthorized();
  return NextResponse.json(publicState(await loadTpayRow(access.shopId)));
}

/** Zapis (albo wymiana) kluczy API. Włącza integrację. */
export async function PUT(req: NextRequest, { params }: Params) {
  const { shop } = await params;
  const access = await getShopAccess(shop);
  if (!access) return unauthorized();

  if (!secretBoxConfigured()) {
    return bad(
      "Platforma nie ma ustawionego klucza szyfrowania (INTEGRATIONS_ENCRYPTION_KEY). Napisz do supportu Sellflow.",
      503,
    );
  }

  let body: Partial<{ clientId: string; clientSecret: string; sandbox: boolean }>;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON");
  }
  const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
  const clientSecret = typeof body.clientSecret === "string" ? body.clientSecret.trim() : "";
  const sandbox = body.sandbox === true;

  if (!clientId || clientId.length > 200) return bad("Podaj Client ID z panelu Tpay.");
  if (!clientSecret || clientSecret.length > 200) return bad("Podaj Secret z panelu Tpay.");

  const ok = await verifyTpayCredentials({ clientId, clientSecret, sandbox });
  if (!ok) {
    return bad(
      sandbox
        ? "Tpay (sandbox) nie przyjął tych kluczy. Sprawdź, czy to klucze z panelu testowego."
        : "Tpay nie przyjął tych kluczy. Sprawdź Client ID i Secret w panelu Tpay → Integracje → API.",
    );
  }

  const now = new Date();
  const settings: TpaySettings = { clientId, secretEnc: sealSecret(clientSecret), sandbox };

  await db
    .insert(shopIntegrations)
    .values({
      shopId: access.shopId,
      provider: TPAY_PROVIDER,
      enabled: true,
      tokenHint: clientSecret.slice(-4),
      tokenCreatedAt: now,
      settings,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [shopIntegrations.shopId, shopIntegrations.provider],
      set: {
        enabled: true,
        tokenHint: clientSecret.slice(-4),
        tokenCreatedAt: now,
        settings,
        lastPushAt: null,
        updatedAt: now,
      },
    });

  return NextResponse.json(publicState(await loadTpayRow(access.shopId)));
}

/** Włącznik płatności online bez ruszania kluczy. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { shop } = await params;
  const access = await getShopAccess(shop);
  if (!access) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as { enabled?: unknown };
  if (typeof body.enabled !== "boolean") return bad("enabled musi być prawdą albo fałszem.");

  const row = await loadTpayRow(access.shopId);
  if (!row) return bad("Najpierw zapisz klucze API Tpay.");

  await db
    .update(shopIntegrations)
    .set({ enabled: body.enabled, updatedAt: new Date() })
    .where(and(eq(shopIntegrations.shopId, access.shopId), eq(shopIntegrations.provider, TPAY_PROVIDER)));

  return NextResponse.json(publicState(await loadTpayRow(access.shopId)));
}

/** Odłączenie: kasujemy klucze, checkout od razu przestaje oferować Tpay. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { shop } = await params;
  const access = await getShopAccess(shop);
  if (!access) return unauthorized();

  await db
    .delete(shopIntegrations)
    .where(and(eq(shopIntegrations.shopId, access.shopId), eq(shopIntegrations.provider, TPAY_PROVIDER)));

  return NextResponse.json({ ok: true });
}
