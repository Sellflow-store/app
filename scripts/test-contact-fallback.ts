/**
 * Test toru awaryjnego formularza kontaktowego: przy nieudanej wysyłce
 * endpoint ma oddać publiczny adres sklepu z „O nas".
 *
 * Ustawia adres na sklepie testowym `bla-bla`, odpytuje produkcję i PRZYWRACA
 * stan sprzed testu, cokolwiek się wydarzy. Uwaga: sklep może w ogóle nie mieć
 * wiersza `about` — wtedy trzeba go założyć i po teście usunąć, bo zwykły
 * UPDATE nie zapisze niczego i test skłamie, że tor awaryjny nie działa.
 *
 *   node_modules/.bin/tsx scripts/test-contact-fallback.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const SLUG = "bla-bla";
const TEST_EMAIL = "kontakt@example.com";

async function main() {
  const [shop] = await sql`select id from shops where slug = ${SLUG}`;
  if (!shop) throw new Error("brak sklepu testowego");

  const [row] = await sql`
    select value from shop_config where shop_id = ${shop.id} and key = 'about'`;
  const bylWiersz = !!row;
  const przed = row?.value ?? {};
  console.log(`wiersz 'about' przed testem: ${bylWiersz ? "jest" : "BRAK"}`);

  try {
    if (bylWiersz) {
      await sql`
        update shop_config set value = ${JSON.stringify({ ...przed, email: TEST_EMAIL })}::jsonb
        where shop_id = ${shop.id} and key = 'about'`;
    } else {
      await sql`
        insert into shop_config (shop_id, key, value)
        values (${shop.id}, 'about', ${JSON.stringify({ email: TEST_EMAIL })}::jsonb)`;
    }
    const [sprawdz] = await sql`
      select value->>'email' as email from shop_config
      where shop_id = ${shop.id} and key = 'about'`;
    console.log("✓ ustawiono tymczasowo:", sprawdz?.email);

    await new Promise((r) => setTimeout(r, 2000));

    const res = await fetch(`https://${SLUG}.sell-flow.store/api/shops/${SLUG}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test toru awaryjnego",
        email: "test@example.com",
        message: "Sprawdzam, czy przy nieudanej wysylce wraca adres zapasowy.",
      }),
    });
    const data = await res.json();
    console.log("odpowiedź:", res.status, JSON.stringify(data));
    console.log(
      data.fallbackEmail === TEST_EMAIL
        ? "✓ tor awaryjny działa — endpoint oddał publiczny adres"
        : "✗ endpoint NIE oddał publicznego adresu"
    );
  } finally {
    if (bylWiersz) {
      await sql`
        update shop_config set value = ${JSON.stringify(przed)}::jsonb
        where shop_id = ${shop.id} and key = 'about'`;
    } else {
      await sql`delete from shop_config where shop_id = ${shop.id} and key = 'about'`;
    }
    const [po] = await sql`
      select key from shop_config where shop_id = ${shop.id} and key = 'about'`;
    console.log(`✓ przywrócono — wiersz 'about' ${po ? "jest (tak jak przed)" : "usunięty (tak jak przed)"}`);
  }
}

main();
