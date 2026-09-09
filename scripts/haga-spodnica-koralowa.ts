/**
 * Jednorazowy skrypt: kolumna `price_on_request` + produkt HAGI
 * „Spódnica koralowa z włoskiej wełny" (cena na zapytanie).
 *
 * Idempotentny: kolumnę dodaje tylko gdy jej nie ma, produkt zakłada tylko gdy
 * sklep nie ma jeszcze produktu o tej nazwie, zdjęcie wysyła raz.
 *
 * Uruchomienie z katalogu repo:
 *   node_modules/.bin/tsx scripts/haga-spodnica-koralowa.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";

const SHOP_SLUG = "haga";
const NAME = "Spódnica koralowa z włoskiej wełny";
const IMAGE_PATH = process.env.SPODNICA_JPG ?? "/tmp/spodnica-lead.jpg";

const sql = neon(process.env.DATABASE_URL!);

const DESCRIPTION = [
  "<p>Koralowa spódnica uszyta z delikatnej włoskiej wełny. Prosta forma została oparta na klasycznym kroju z półkola, dzięki czemu spódnica miękko układa się na sylwetce i pięknie porusza podczas chodzenia.</p>",
  "<p>Ma prosty pasek z bocznym zapięciem na zamek oraz dyskretnie ukryte w szwach kieszenie. Jest w pełni podszyta podszewką, która zapewnia komfort noszenia i sprawia, że całość elegancko układa się na sylwetce.</p>",
  "<p>To model minimalistyczny i ponadczasowy, który z łatwością odnajduje się w różnych stylizacjach — od eleganckich po bardziej swobodne, codzienne zestawienia. Koralowy kolor wnosi do klasycznej formy odrobinę wyrazistości.</p>",
  "<p>Miękka i przyjemna w dotyku wełna jest łatwa w użytkowaniu. Przy zachowaniu odpowiednich zasad pielęgnacji może być również delikatnie prana w domu.</p>",
  "<p>Możliwość uszycia na miarę po wcześniejszym ustaleniu szczegółów — napisz do nas.</p>",
].join("\n");

const BENEFITS = [
  { label: "Włoska wełna", desc: "miękka i przyjemna w dotyku" },
  { label: "Fason z półkola", desc: "miękko układa się i porusza podczas chodzenia" },
  { label: "Boczne zapięcie na zamek", desc: "prosty pasek, bez zbędnych detali" },
  { label: "Kieszenie ukryte w szwach", desc: "niewidoczne z zewnątrz" },
  { label: "W całości podszyta podszewką", desc: "komfort noszenia i elegancki układ" },
  { label: "Długość midi", desc: "90 cm w każdym rozmiarze" },
];

const SPECS = [
  { key: "Skład — wierzch", value: "100% wełna" },
  { key: "Skład — podszewka", value: "100% wiskoza" },
  { key: "Długość", value: "90 cm (midi)" },
  { key: "Obwód pasa — XS", value: "68 cm" },
  { key: "Obwód pasa — S", value: "72 cm" },
  { key: "Obwód pasa — M", value: "76 cm" },
  { key: "Obwód pasa — L", value: "80 cm" },
  { key: "Obwód pasa — XL", value: "84 cm" },
  { key: "Szycie na miarę", value: "możliwe po ustaleniu szczegółów" },
];

const SIZES = ["XS", "S", "M", "L", "XL"];

async function main() {
  // ── 1. Kolumna price_on_request ──────────────────────────────────────────
  const col = await sql`
    select column_name from information_schema.columns
    where table_name = 'products' and column_name = 'price_on_request'`;
  if (col.length === 0) {
    await sql`alter table products add column price_on_request boolean not null default false`;
    console.log("✓ kolumna price_on_request dodana");
  } else {
    console.log("• kolumna price_on_request już istnieje");
  }

  // ── 2. Sklep ─────────────────────────────────────────────────────────────
  const [shop] = await sql`select id, owner_id, slug from shops where slug = ${SHOP_SLUG}`;
  if (!shop) throw new Error(`Nie ma sklepu o slug „${SHOP_SLUG}”`);
  console.log(`• sklep ${shop.slug} (${shop.id})`);

  const existing = await sql`
    select id from products where shop_id = ${shop.id} and name = ${NAME}`;
  if (existing.length > 0) {
    console.log(`• produkt już istnieje (${existing[0].id}) — nic nie robię`);
    return;
  }

  // ── 3. Zdjęcie na Vercel Blob ────────────────────────────────────────────
  const bytes = await readFile(IMAGE_PATH);
  const blob = await put(
    `shops/${shop.owner_id}/${shop.slug}-spodnica-koralowa.jpg`,
    bytes,
    { access: "public", addRandomSuffix: true, contentType: "image/jpeg" }
  );
  console.log(`✓ zdjęcie: ${blob.url} (${Math.round(bytes.length / 1024)} KB)`);

  // ── 4. Produkt ───────────────────────────────────────────────────────────
  const [{ next_order }] = await sql`
    select coalesce(max(sort_order), -1) + 1 as next_order
    from products where shop_id = ${shop.id}`;

  const [product] = await sql`
    insert into products (
      shop_id, name, category, price, price_on_request, visible,
      short_desc, description, images, sizes, benefits, specs,
      stock, type, sort_order
    ) values (
      ${shop.id},
      ${NAME},
      ${"Spódnice"},
      ${"0.00"},
      ${true},
      ${true},
      ${"Klasyczna spódnica midi z półkola, uszyta z włoskiej wełny. Powstaje na zamówienie."},
      ${DESCRIPTION},
      ${JSON.stringify([blob.url])}::jsonb,
      ${JSON.stringify(SIZES)}::jsonb,
      ${JSON.stringify(BENEFITS)}::jsonb,
      ${JSON.stringify(SPECS)}::jsonb,
      ${null},
      ${"physical"},
      ${next_order}
    )
    returning id, name, price, price_on_request, sort_order`;

  console.log("✓ produkt dodany:", product);
  console.log(
    "  Uwaga: brak wpisu w price_history — produkt bez ceny półkowej nie ma czego zapisywać."
  );
}

main();
