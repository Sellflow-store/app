/**
 * Jednorazowy skrypt: zmiana głównego e-maila HAGI na contact@hagastore.pl.
 *
 * Adres leży w trzech kluczach `shop_config`, więc podmieniam go we wszystkich
 * naraz, zostawiając resztę wartości nietkniętą:
 *   - `legal.email`          (regulamin i polityka prywatności),
 *   - `account.contactEmail` (panel „Konto i firma"),
 *   - `about.email`          (strona „Kontakt", formularz i CTA produktów na zamówienie).
 *
 * Idempotentny — drugie uruchomienie niczego nie psuje.
 *
 *   node_modules/.bin/tsx scripts/haga-zmiana-emaila.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const EMAIL = "contact@hagastore.pl";

const TARGETS: { key: string; field: string }[] = [
  { key: "legal", field: "email" },
  { key: "account", field: "contactEmail" },
  { key: "about", field: "email" },
];

async function main() {
  const [shop] = await sql`select id from shops where slug = ${"haga"}`;
  if (!shop) throw new Error("Nie ma sklepu haga");

  for (const { key, field } of TARGETS) {
    const [row] = await sql`
      select value from shop_config where shop_id = ${shop.id} and key = ${key}`;
    const current = (row?.value as Record<string, unknown>) ?? {};
    const value = { ...current, [field]: EMAIL };
    await sql`
      insert into shop_config (shop_id, key, value)
      values (${shop.id}, ${key}, ${JSON.stringify(value)}::jsonb)
      on conflict (shop_id, key)
      do update set value = excluded.value, updated_at = now()`;
    console.log(`✓ ${key}.${field}: ${String(current[field] ?? "(brak)")} → ${EMAIL}`);
  }
}

main();
