/**
 * Przełącznik widoczności spódnicy koralowej. Produkt musi być ukryty, dopóki
 * na produkcji nie ma kodu obsługującego `price_on_request` — bez niego stary
 * storefront pokazuje „0.00 zł" i wpuszcza go do koszyka.
 *
 *   node_modules/.bin/tsx scripts/haga-spodnica-visibility.ts hide
 *   node_modules/.bin/tsx scripts/haga-spodnica-visibility.ts show
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const PRODUCT_ID = "15c3dc34-01af-4d60-9961-a1c48019bed9";

async function main() {
  const mode = process.argv[2];
  if (mode !== "hide" && mode !== "show") {
    throw new Error("Podaj tryb: hide albo show");
  }
  const visible = mode === "show";
  const [row] = await sql`
    update products set visible = ${visible}, updated_at = now()
    where id = ${PRODUCT_ID}
    returning id, name, visible, price, price_on_request`;
  console.log(row);
}

main();
