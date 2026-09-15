/**
 * Tworzy tabelę `shop_integrations` (integracja własna z Furgonetką).
 *
 * W repo nie ma katalogu migracji — schemat jedzie przez drizzle-kit push albo
 * przez takie punktowe skrypty. Ten jest idempotentny (IF NOT EXISTS), więc
 * można go puścić drugi raz bez szkody.
 *
 * Uruchomienie — najpierw na sucho, potem z --apply:
 *   npx tsx --env-file=.env.local scripts/furgonetka-tabela.ts
 *   npx tsx --env-file=.env.local scripts/furgonetka-tabela.ts --apply
 */
import { sql } from "drizzle-orm";
import { db } from "../lib/db";

const apply = process.argv.includes("--apply");

const DDL = `
CREATE TABLE IF NOT EXISTS shop_integrations (
  shop_id           uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  provider          text NOT NULL,
  enabled           boolean NOT NULL DEFAULT false,
  token_hash        text,
  token_hint        text,
  token_created_at  timestamp,
  settings          jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_pull_at      timestamp,
  last_pull_count   integer,
  last_push_at      timestamp,
  created_at        timestamp NOT NULL DEFAULT now(),
  updated_at        timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (shop_id, provider)
)`;

async function main() {
  const probe = (await db.execute(
    sql`SELECT to_regclass('public.shop_integrations') IS NOT NULL AS exists`,
  )) as unknown as { rows: { exists: boolean }[] };

  if (probe.rows[0]?.exists) {
    console.log("Tabela shop_integrations już istnieje — nie ma nic do zrobienia.");
    return;
  }

  if (!apply) {
    console.log("Do utworzenia:\n" + DDL.trim());
    console.log("\nNa sucho. Uruchom ponownie z --apply, żeby wykonać.");
    return;
  }

  await db.execute(sql.raw(DDL));
  console.log("Utworzono tabelę shop_integrations.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
