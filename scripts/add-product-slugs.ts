/**
 * Kolumna `products.slug` + uzupełnienie adresów istniejącym produktom.
 *
 * Idempotentny: kolumnę i indeks zakłada tylko, gdy ich nie ma; adres nadaje
 * tylko produktom, które go jeszcze nie mają. Kolizje w obrębie sklepu
 * rozwiązuje sufiksem -2, -3… tak samo jak API.
 *
 *   node_modules/.bin/tsx scripts/add-product-slugs.ts          # podgląd
 *   node_modules/.bin/tsx scripts/add-product-slugs.ts --apply  # zapis
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const APPLY = process.argv.includes("--apply");

const PL: Record<string, string> = {
  ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
};

/** Ta sama reguła co `slugify` w lib/slug.ts — adresy muszą wyjść identyczne. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => PL[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
}

async function main() {
  const col = await sql`
    select column_name, is_nullable from information_schema.columns
    where table_name = 'products' and column_name = 'slug'`;

  if (col.length === 0) {
    if (!APPLY) {
      console.log("• kolumny slug nie ma — z --apply zostanie dodana jako NULL-owalna");
    } else {
      await sql`alter table products add column slug text`;
      console.log("✓ kolumna slug dodana (na razie NULL-owalna)");
    }
  } else {
    console.log(`• kolumna slug istnieje (nullable: ${col[0].is_nullable})`);
  }

  // ── Uzupełnienie adresów ────────────────────────────────────────────────
  // Bez kolumny (podgląd przed migracją) udajemy, że każdy produkt ma pusty
  // adres — plan wychodzi ten sam, co po jej dodaniu.
  const hasColumn = col.length > 0;
  const rows = hasColumn
    ? await sql`
        select p.id, p.shop_id, p.name, p.slug, s.slug as shop_slug
        from products p join shops s on s.id = p.shop_id
        order by p.shop_id, p.sort_order, p.created_at`
    : await sql`
        select p.id, p.shop_id, p.name, null::text as slug, s.slug as shop_slug
        from products p join shops s on s.id = p.shop_id
        order by p.shop_id, p.sort_order, p.created_at`;

  const takenByShop = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!takenByShop.has(r.shop_id)) takenByShop.set(r.shop_id, new Set());
    if (r.slug) takenByShop.get(r.shop_id)!.add(r.slug);
  }

  const plan: { id: string; shop: string; name: string; slug: string }[] = [];
  for (const r of rows) {
    if (r.slug) continue;
    const taken = takenByShop.get(r.shop_id)!;
    const root = slugify(r.name) || "produkt";
    let candidate = root;
    for (let i = 2; taken.has(candidate); i++) candidate = `${root}-${i}`;
    taken.add(candidate);
    plan.push({ id: r.id, shop: r.shop_slug, name: r.name, slug: candidate });
  }

  console.log(`\nProduktów razem: ${rows.length}, do uzupełnienia: ${plan.length}`);
  for (const p of plan.slice(0, 12)) {
    console.log(`  ${p.shop.padEnd(18)} ${p.name.slice(0, 44).padEnd(46)} → ${p.slug}`);
  }
  if (plan.length > 12) console.log(`  … i ${plan.length - 12} więcej`);

  if (!APPLY) {
    console.log("\nPodgląd. Uruchom z --apply, żeby zapisać.");
    return;
  }

  for (const p of plan) {
    await sql`update products set slug = ${p.slug} where id = ${p.id}`;
  }
  console.log(`\n✓ zapisano ${plan.length} adresów`);

  // ── Indeks unikalny + NOT NULL dopiero, gdy każdy wiersz ma adres ───────
  const stillNull = await sql`select count(*)::int as n from products where slug is null`;
  if (stillNull[0].n > 0) {
    throw new Error(`${stillNull[0].n} produktów wciąż bez adresu — nie zakładam ograniczeń`);
  }

  await sql`create unique index if not exists products_shop_slug_idx on products (shop_id, slug)`;
  await sql`alter table products alter column slug set not null`;
  console.log("✓ indeks unikalny (shop_id, slug) + NOT NULL");

  const sample = await sql`
    select s.slug as shop, p.slug from products p join shops s on s.id = p.shop_id
    where s.slug = 'haga' order by p.sort_order`;
  console.log("\nHAGA:", sample.map((r) => r.slug));
}

main();
