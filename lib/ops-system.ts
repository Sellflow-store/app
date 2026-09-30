import "server-only";
import { is, sql } from "drizzle-orm";
import { PgTable, getTableConfig } from "drizzle-orm/pg-core";
import { db } from "./db";
import * as schema from "./db/schema";

/**
 * Stan systemu dla /ops/system: czy baza ma wszystko, czego oczekuje kod,
 * czy są ustawione zmienne środowiskowe i jaka wersja działa na produkcji.
 *
 * Sprawdzenie schematu porównuje `lib/db/schema.ts` z information_schema i
 * pg_indexes. Brak kolumny albo indeksu to znak, że kod wszedł na produkcję
 * przed migracją (tak padł panel produktów na braku `products.attributes`).
 */

export interface SchemaIssue {
  table: string;
  kind: "missing_table" | "missing_column" | "missing_index";
  name: string;
}

export interface SchemaReport {
  tables: number;
  columns: number;
  indexes: number;
  issues: SchemaIssue[];
  /** Kolumny w bazie, których kod nie zna. Informacyjnie, nie błąd. */
  extraColumns: { table: string; name: string }[];
}

export interface EnvCheck {
  name: string;
  purpose: string;
  required: boolean;
  set: boolean;
}

export interface DeployInfo {
  env: string | null;
  sha: string | null;
  message: string | null;
  branch: string | null;
}

export async function checkSchema(): Promise<SchemaReport> {
  const tables = (Object.values(schema) as unknown[])
    .filter((v): v is PgTable => is(v, PgTable))
    .map((t) => getTableConfig(t));

  const [colRes, idxRes] = await Promise.all([
    db.execute(sql`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = 'public'
    `),
    db.execute(sql`SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public'`),
  ]);
  const colRows = (colRes as unknown as { rows: { table_name: string; column_name: string }[] }).rows;
  const idxRows = (idxRes as unknown as { rows: { tablename: string; indexname: string }[] }).rows;

  const dbColumns = new Map<string, Set<string>>();
  for (const r of colRows) {
    if (!dbColumns.has(r.table_name)) dbColumns.set(r.table_name, new Set());
    dbColumns.get(r.table_name)!.add(r.column_name);
  }
  const dbIndexes = new Set(idxRows.map((r) => r.indexname));

  const report: SchemaReport = { tables: tables.length, columns: 0, indexes: 0, issues: [], extraColumns: [] };

  for (const t of tables) {
    const actual = dbColumns.get(t.name);
    report.columns += t.columns.length;
    report.indexes += t.indexes.length;

    if (!actual) {
      report.issues.push({ table: t.name, kind: "missing_table", name: t.name });
      continue;
    }
    for (const c of t.columns) {
      if (!actual.has(c.name)) report.issues.push({ table: t.name, kind: "missing_column", name: c.name });
    }
    for (const i of t.indexes) {
      const name = i.config.name;
      if (name && !dbIndexes.has(name)) report.issues.push({ table: t.name, kind: "missing_index", name });
    }
    const known = new Set(t.columns.map((c) => c.name));
    for (const name of actual) {
      if (!known.has(name)) report.extraColumns.push({ table: t.name, name });
    }
  }

  return report;
}

const ENV_VARS: Omit<EnvCheck, "set">[] = [
  { name: "DATABASE_URL", purpose: "Baza danych (Neon)", required: true },
  { name: "CLERK_SECRET_KEY", purpose: "Logowanie (Clerk)", required: true },
  { name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", purpose: "Logowanie (Clerk), klucz publiczny", required: true },
  { name: "NEXT_PUBLIC_APP_DOMAIN", purpose: "Domena platformy, subdomeny sklepów", required: true },
  { name: "NEXT_PUBLIC_APP_URL", purpose: "Adres panelu w linkach i mailach", required: true },
  { name: "INTEGRATIONS_ENCRYPTION_KEY", purpose: "Szyfrowanie kluczy Tpay i integracji", required: true },
  { name: "CRON_SECRET", purpose: "Automatyczne anulowanie nieopłaconych zamówień", required: true },
  { name: "RESEND_API_KEY", purpose: "Wysyłka maili transakcyjnych", required: true },
  { name: "RESEND_FROM", purpose: "Nadawca maili (bez tego: domena testowa Resend)", required: true },
  { name: "VERCEL_TOKEN", purpose: "Podpinanie domen sklepów", required: true },
  { name: "VERCEL_PROJECT_ID", purpose: "Podpinanie domen sklepów", required: true },
  { name: "VERCEL_TEAM_ID", purpose: "Podpinanie domen sklepów", required: true },
  { name: "DOMAIN_VERIFY_SECRET", purpose: "Weryfikacja własności domen (inaczej klucz Clerk)", required: false },
  { name: "NEWSLETTER_SECRET", purpose: "Linki wypisu z newslettera (inaczej klucz Clerk)", required: false },
  { name: "SELLFLOW_ADMIN_EMAILS", purpose: "Dodatkowi administratorzy po adresie e-mail", required: false },
  { name: "ANTHROPIC_API_KEY", purpose: "Asystent AI w formularzu produktu", required: false },
  { name: "NEXT_PUBLIC_APP_SUBDOMAIN", purpose: "Subdomena panelu (domyślnie app)", required: false },
];

/** Tylko informacja, czy zmienna jest ustawiona. Wartości nigdy nie wychodzą. */
export function checkEnv(): EnvCheck[] {
  return ENV_VARS.map((v) => ({ ...v, set: !!process.env[v.name]?.trim() }));
}

export function deployInfo(): DeployInfo {
  return {
    env: process.env.VERCEL_ENV ?? null,
    sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    message: process.env.VERCEL_GIT_COMMIT_MESSAGE?.split("\n")[0] ?? null,
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
  };
}

/** Czas odpowiedzi bazy w ms dla prostego zapytania. */
export async function dbLatency(): Promise<number> {
  const start = performance.now();
  await db.execute(sql`SELECT 1`);
  return Math.round(performance.now() - start);
}
