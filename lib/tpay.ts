import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { shopIntegrations } from "./db/schema";
import { openSecret } from "./secret-box";

/**
 * Tpay OpenAPI — płatności online (BLIK, karty, szybkie przelewy) na koncie
 * merchanta. Każdy sklep podpina WŁASNE konto Tpay (Client ID + Secret z
 * panel.tpay.com → Integracje → API), pieniądze idą prosto do niego.
 *
 * Przepływ:
 *   1. POST /oauth/auth         → token Bearer (ważny ok. 2 h, trzymamy w pamięci)
 *   2. POST /transactions       → transactionId + transactionPaymentUrl,
 *                                 klient jedzie na stronę płatności Tpay
 *   3. Tpay → nasz webhook      → NIE ufamy treści powiadomienia; pytamy
 *                                 GET /transactions/{id} własnym tokenem i
 *                                 dopiero ta odpowiedź oznacza zamówienie jako
 *                                 opłacone. Podrobione powiadomienie nic nie da,
 *                                 bo nie zmieni stanu transakcji w Tpay.
 */

import { TPAY_PROVIDER } from "./tpay-status";

export { TPAY_PROVIDER, tpayEnabled } from "./tpay-status";

const PROD_API = "https://openapi.tpay.com";
const SANDBOX_API = "https://openapi.sandbox.tpay.com";
const TIMEOUT_MS = 10_000;

// API Tpay stoi za Cloudflare. Domyślny User-Agent Node'a („node") łapie się
// na Browser Integrity Check i dostaje 403 ze stroną HTML zamiast JSON-a,
// zanim żądanie w ogóle dojdzie do Tpay. Przedstawiamy się jawnie.
const USER_AGENT = "Sellflow/1.0 (+https://sell-flow.store)";

export interface TpayCredentials {
  clientId: string;
  clientSecret: string;
  sandbox: boolean;
}

/** Kształt `shop_integrations.settings` dla providera "tpay". */
export interface TpaySettings {
  clientId?: string;
  /** Secret zaszyfrowany `sealSecret` — nigdy nie wraca do przeglądarki. */
  secretEnc?: string;
  sandbox?: boolean;
}

export class TpayError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "TpayError";
    this.status = status;
  }
}

function apiBase(sandbox: boolean): string {
  return sandbox ? SANDBOX_API : PROD_API;
}

// ── OAuth ─────────────────────────────────────────────────────────────────

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

function cacheKey(c: TpayCredentials): string {
  return `${c.sandbox ? "sb" : "prod"}:${c.clientId}`;
}

type TokenBody = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
  errors?: { errorMessage?: string; errorCode?: string }[];
};

/** Komunikat Tpay z odpowiedzi odmownej — bez sekretów, bezpieczny do panelu. */
/**
 * Strona blokady Cloudflare zamiast odpowiedzi Tpay. Zwraca krótki opis z
 * kodem błędu CF i Ray ID — to jest to, o co zapyta support Tpay.
 */
function cloudflareBlock(res: Response, raw: string): string | null {
  const isHtml = /^\s*<!doctype html|<html/i.test(raw);
  if (!isHtml || !(res.headers.get("cf-ray") || /cloudflare/i.test(raw))) return null;
  const code = raw.match(/Error(?:\s|&nbsp;|<[^>]+>)*(\d{4})/i)?.[1];
  const ray = res.headers.get("cf-ray") ?? raw.match(/Ray ID:(?:\s|<[^>]+>)*([0-9a-f]{16})/i)?.[1];
  return `zablokowane przez Cloudflare przed API Tpay${code ? `, błąd ${code}` : ""}${ray ? `, Ray ID ${ray}` : ""}`;
}

function tpayErrorText(body: TokenBody, raw: string): string {
  return (
    body.error_description ||
    body.errors?.map((e) => e.errorMessage || e.errorCode).filter(Boolean).join("; ") ||
    body.error ||
    raw.slice(0, 200)
  );
}

async function fetchToken(c: TpayCredentials): Promise<{ token: string; expiresIn: number }> {
  // Przykłady w dokumentacji Tpay wysyłają dane jako multipart/form-data;
  // JSON zostaje jako druga próba, gdyby endpoint go wymagał.
  const attempts: { label: string; init: RequestInit }[] = [
    {
      label: "form-data",
      init: {
        body: (() => {
          const f = new FormData();
          f.set("client_id", c.clientId);
          f.set("client_secret", c.clientSecret);
          return f;
        })(),
      },
    },
    {
      label: "json",
      init: {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: c.clientId, client_secret: c.clientSecret }),
      },
    },
  ];

  let lastStatus: number | undefined;
  let lastMessage = "";
  for (const { label, init } of attempts) {
    const res = await fetch(`${apiBase(c.sandbox)}/oauth/auth`, {
      method: "POST",
      ...init,
      headers: { Accept: "application/json", "User-Agent": USER_AGENT, ...(init.headers ?? {}) },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const raw = await res.text().catch(() => "");
    let body: TokenBody = {};
    try {
      body = JSON.parse(raw) as TokenBody;
    } catch {
      /* nie-JSON — zostaje surowy tekst */
    }
    if (res.ok && body.access_token) {
      return { token: body.access_token, expiresIn: body.expires_in ?? 3600 };
    }
    lastStatus = res.status;
    const blocked = cloudflareBlock(res, raw);
    lastMessage = blocked ?? tpayErrorText(body, raw);
    console.error("Tpay oauth odmowa", {
      attempt: label,
      sandbox: c.sandbox,
      clientIdTail: c.clientId.slice(-6),
      status: res.status,
      message: lastMessage,
    });
  }
  throw new TpayError(lastMessage || "Tpay odrzucił dane logowania do API.", lastStatus);
}

async function accessToken(c: TpayCredentials): Promise<string> {
  const k = cacheKey(c);
  const hit = tokenCache.get(k);
  if (hit && hit.expiresAt > Date.now()) return hit.token;
  const { token, expiresIn } = await fetchToken(c);
  // Minuta zapasu, żeby token nie wygasł w połowie żądania.
  tokenCache.set(k, { token, expiresAt: Date.now() + Math.max(expiresIn - 60, 30) * 1000 });
  return token;
}

/** Sprawdza klucze przed zapisem w panelu — bez cache, zawsze pyta Tpay. */
export async function verifyTpayCredentials(
  c: TpayCredentials,
): Promise<{ ok: true } | { ok: false; status?: number; message: string }> {
  try {
    await fetchToken(c);
    return { ok: true };
  } catch (e) {
    if (e instanceof TpayError) return { ok: false, status: e.status, message: e.message };
    console.error("Tpay oauth: błąd połączenia", e);
    return { ok: false, message: "Brak połączenia z Tpay." };
  }
}

async function tpayFetch(c: TpayCredentials, path: string, init?: RequestInit): Promise<Response> {
  const doFetch = async () =>
    fetch(`${apiBase(c.sandbox)}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${await accessToken(c)}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": USER_AGENT,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  let res = await doFetch();
  // Token mógł zostać unieważniony po stronie Tpay (np. merchant wygenerował
  // nowy secret) — jedna ponowna próba ze świeżym tokenem.
  if (res.status === 401) {
    tokenCache.delete(cacheKey(c));
    res = await doFetch();
  }
  return res;
}

// ── Transakcje ────────────────────────────────────────────────────────────

export interface CreateTransactionInput {
  amount: number;
  /** Widoczny dla płacącego, max 128 znaków. */
  description: string;
  /** Nasz identyfikator zamówienia — Tpay odsyła go w powiadomieniu jako tr_crc. */
  hiddenDescription: string;
  payer: { email: string; name: string; phone?: string | null };
  successUrl: string;
  errorUrl: string;
  notificationUrl: string;
}

export interface CreatedTransaction {
  transactionId: string;
  title: string;
  paymentUrl: string;
}

export async function createTpayTransaction(
  c: TpayCredentials,
  input: CreateTransactionInput,
): Promise<CreatedTransaction> {
  const payer: Record<string, string> = { email: input.payer.email, name: input.payer.name.slice(0, 255) };
  if (input.payer.phone) payer.phone = input.payer.phone;

  const res = await tpayFetch(c, "/transactions", {
    method: "POST",
    body: JSON.stringify({
      amount: Math.round(input.amount * 100) / 100,
      description: input.description.slice(0, 128),
      hiddenDescription: input.hiddenDescription.slice(0, 255),
      lang: "pl",
      payer,
      callbacks: {
        payerUrls: { success: input.successUrl, error: input.errorUrl },
        notification: { url: input.notificationUrl },
      },
    }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    result?: string;
    transactionId?: string;
    title?: string;
    transactionPaymentUrl?: string;
    errors?: { errorMessage?: string }[];
  };
  if (!res.ok || body.result !== "success" || !body.transactionId || !body.transactionPaymentUrl) {
    const detail = body.errors?.map((e) => e.errorMessage).filter(Boolean).join("; ");
    throw new TpayError(`Tpay nie utworzył transakcji${detail ? `: ${detail}` : ""}.`, res.status);
  }
  return {
    transactionId: body.transactionId,
    title: body.title ?? body.transactionId,
    paymentUrl: body.transactionPaymentUrl,
  };
}

export interface TpayTransactionState {
  /** "pending" | "correct" | "paid" | "refund" | "error" | … — surowo z Tpay. */
  status: string;
  amount: number;
  hiddenDescription: string | null;
}

export async function getTpayTransaction(
  c: TpayCredentials,
  transactionId: string,
): Promise<TpayTransactionState> {
  const res = await tpayFetch(c, `/transactions/${encodeURIComponent(transactionId)}`);
  const body = (await res.json().catch(() => ({}))) as {
    status?: string;
    amount?: number | string;
    hiddenDescription?: string;
  };
  if (!res.ok || !body.status) {
    throw new TpayError("Nie udało się pobrać stanu transakcji z Tpay.", res.status);
  }
  return {
    status: body.status,
    amount: Number(body.amount ?? 0),
    hiddenDescription: body.hiddenDescription ?? null,
  };
}

/** Status transakcji, który oznacza wpłatę w pełnej kwocie. */
export function isTpayPaid(status: string): boolean {
  return status === "correct" || status === "paid";
}

// ── Dane dostępowe sklepu ─────────────────────────────────────────────────

export async function loadTpayRow(shopId: string) {
  return db.query.shopIntegrations.findFirst({
    where: and(eq(shopIntegrations.shopId, shopId), eq(shopIntegrations.provider, TPAY_PROVIDER)),
  });
}

/**
 * Klucze sklepu, gdy integracja jest podpięta i włączona; inaczej `null`.
 * Webhook woła z `requireEnabled: false`: wyłączenie płatności online nie może
 * zgubić wpłat za zamówienia złożone, zanim merchant kliknął „wyłącz".
 * `null` także wtedy, gdy secretu nie da się odszyfrować (zmieniony klucz
 * szyfrowania) — checkout po prostu nie pokaże płatności online.
 */
export async function getTpayCredentials(
  shopId: string,
  { requireEnabled = true }: { requireEnabled?: boolean } = {},
): Promise<TpayCredentials | null> {
  const row = await loadTpayRow(shopId);
  if (!row || (requireEnabled && !row.enabled)) return null;
  const s = (row.settings ?? {}) as TpaySettings;
  if (!s.clientId || !s.secretEnc) return null;
  try {
    return { clientId: s.clientId, clientSecret: openSecret(s.secretEnc), sandbox: Boolean(s.sandbox) };
  } catch (e) {
    console.error("Tpay: secret nie daje się odszyfrować", shopId, e);
    return null;
  }
}
