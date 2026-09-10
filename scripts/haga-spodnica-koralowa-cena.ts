/**
 * Jednorazowy skrypt: spódnica koralowa dostaje cenę półkową (490 zł) i
 * przestaje być produktem na zamówienie.
 *
 * Uwaga na kolejność: `price_on_request` idzie na false RAZEM z ceną, a wpis
 * w `price_history` powstaje dopiero teraz — dla Omnibusa 490 zł to pierwsza
 * cena tego produktu (0.00 z czasów „na zamówienie" nigdy nie było ceną i
 * celowo nie trafiło do historii).
 *
 *   node_modules/.bin/tsx scripts/haga-spodnica-koralowa-cena.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const SLUG = "spodnica-koralowa-z-wloskiej-welny";
const PRICE = "490.00";
const SHORT_DESC = "Klasyczna spódnica midi z półkola, uszyta z delikatnej włoskiej wełny.";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const [shop] = await sql`select id from shops where slug = ${"haga"}`;
  const [before] = await sql`
    select id, name, price, price_on_request, short_desc
    from products where shop_id = ${shop.id} and slug = ${SLUG}`;
  if (!before) throw new Error(`Nie ma produktu ${SLUG}`);
  console.log("przed:", before);

  const [after] = await sql`
    update products
    set price = ${PRICE},
        price_on_request = ${false},
        short_desc = ${SHORT_DESC},
        updated_at = now()
    where id = ${before.id}
    returning id, name, price, price_on_request, short_desc`;

  const history = await sql`
    select id from price_history where product_id = ${before.id}`;
  if (history.length === 0) {
    await sql`
      insert into price_history (product_id, shop_id, price)
      values (${before.id}, ${shop.id}, ${PRICE})`;
    console.log("✓ wpis w price_history dopisany");
  } else {
    console.log(`• price_history ma już ${history.length} wpis(y) — nie dopisuję`);
  }

  console.log("po:", after);
}

main();
