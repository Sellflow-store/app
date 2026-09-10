/**
 * Jednorazowy skrypt: szósty produkt HAGI —
 * „Biała spódnica midi z bawełnianego żakardu" (490 zł, rozmiary XS–XL).
 *
 * Idempotentny: produkt zakłada tylko wtedy, gdy sklep nie ma jeszcze pozycji
 * o tej nazwie; zdjęcia wysyła raz.
 *
 * Uruchomienie z katalogu repo:
 *   node_modules/.bin/tsx scripts/haga-biala-spodnica-zakard.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";
import { slugify } from "@/lib/slug";

const SHOP_SLUG = "haga";
const NAME = "Biała spódnica midi z bawełnianego żakardu";
const PRICE = "490.00";
const SRC = process.env.SPODNICA_DIR ?? "/tmp/haga-biala-spodnica";

/** lead = sylwetka w całości, potem dwa packshoty w siatce 2× */
const IMAGES = [
  { file: `${SRC}/lead.jpg`, name: "haga-biala-spodnica-zakard-1.jpg" },
  { file: `${SRC}/pack1.jpg`, name: "haga-biala-spodnica-zakard-2.jpg" },
  { file: `${SRC}/pack2.jpg`, name: "haga-biala-spodnica-zakard-3.jpg" },
];

const sql = neon(process.env.DATABASE_URL!);

const SHORT_DESC =
  "Klasyczna forma, szlachetna faktura żakardu i biel, która rozświetla zimową garderobę.";

const DESCRIPTION = [
  "<p>Biała spódnica midi o klasycznym fasonie z półkola, uszyta z pięknego bawełnianego żakardu o mocniejszej strukturze i wyraźniejszym splocie. Tkanina nadaje jej formę i sprawia, że doskonale sprawdzi się również w chłodniejszych miesiącach.</p>",
  "<p>Spódnica jest ręcznie podszywana i wykończona podszewką, dzięki czemu materiał nie przykleja się do rajstop i pozostaje w ruchu, płynnie układając się na sylwetce.</p>",
  "<p>Biel, kojarzona przede wszystkim z wiosną i latem, pięknie odnajduje się również jesienią i zimą. Dodaje stylizacjom świeżości i lekkości, szczególnie w zestawieniu z miękkimi dzianinami.</p>",
  "<p>Biała spódnica z półkola świetnie wygląda z szarym lub beżowym swetrem, kardiganem czy dopasowanym longsleevem. Możesz nosić ją zarówno w bardziej eleganckiej wersji, jak i w codziennych, otulających stylizacjach.</p>",
  "<p>Poza standardową rozmiarówką spódnica może zostać uszyta również na miarę. Jeśli potrzebujesz indywidualnego dopasowania, napisz do nas przez formularz na stronie Kontakt — wspólnie ustalimy szczegóły, wymiary oraz możliwości wykonania spódnicy.</p>",
].join("\n");

const BENEFITS = [
  { label: "Żakard bawełniany", desc: "mocniejsza struktura i wyraźny splot" },
  { label: "Fason z półkola", desc: "płynnie układa się na sylwetce i pozostaje w ruchu" },
  { label: "Boczne zapięcie na zamek", desc: "prosty pasek, bez zbędnych detali" },
  { label: "Kieszenie ukryte w szwach", desc: "niewidoczne z zewnątrz" },
  { label: "W całości podszyta podszewką", desc: "materiał nie przykleja się do rajstop" },
  { label: "Ręcznie podszywana", desc: "wykończenie robione ręcznie" },
  { label: "Długość midi", desc: "90 cm w każdym rozmiarze" },
  { label: "Możliwość uszycia na miarę", desc: "po wcześniejszym ustaleniu szczegółów" },
];

const SPECS = [
  { key: "Skład — wierzch", value: "95% bawełna, 3% elastan, 2% poliester" },
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
  const [shop] = await sql`select id, owner_id, slug from shops where slug = ${SHOP_SLUG}`;
  if (!shop) throw new Error(`Nie ma sklepu o slug „${SHOP_SLUG}”`);
  console.log(`• sklep ${shop.slug} (${shop.id})`);

  const existing = await sql`
    select id from products where shop_id = ${shop.id} and name = ${NAME}`;
  if (existing.length > 0) {
    console.log(`• produkt już istnieje (${existing[0].id}) — nic nie robię`);
    return;
  }

  // ── Adres produktu: wolny slug w obrębie sklepu ──────────────────────────
  const taken = new Set(
    (await sql`select slug from products where shop_id = ${shop.id}`).map((r) => r.slug as string)
  );
  const root = slugify(NAME);
  let slug = root;
  for (let i = 2; taken.has(slug); i++) slug = `${root}-${i}`;
  console.log(`• adres: /produkty/${slug}`);

  // ── Zdjęcia na Vercel Blob ───────────────────────────────────────────────
  const urls: string[] = [];
  for (const img of IMAGES) {
    const bytes = await readFile(img.file);
    const blob = await put(`shops/${shop.owner_id}/${img.name}`, bytes, {
      access: "public",
      addRandomSuffix: true,
      contentType: "image/jpeg",
    });
    urls.push(blob.url);
    console.log(`✓ ${img.name} → ${blob.url} (${Math.round(bytes.length / 1024)} KB)`);
  }

  // ── Produkt ──────────────────────────────────────────────────────────────
  const [{ next_order }] = await sql`
    select coalesce(max(sort_order), -1) + 1 as next_order
    from products where shop_id = ${shop.id}`;

  const [product] = await sql`
    insert into products (
      shop_id, name, slug, category, price, price_on_request, visible,
      short_desc, description, images, sizes, benefits, specs,
      stock, type, sort_order
    ) values (
      ${shop.id}, ${NAME}, ${slug}, ${"Spódnice"}, ${PRICE}, ${false}, ${true},
      ${SHORT_DESC}, ${DESCRIPTION},
      ${JSON.stringify(urls)}::jsonb,
      ${JSON.stringify(SIZES)}::jsonb,
      ${JSON.stringify(BENEFITS)}::jsonb,
      ${JSON.stringify(SPECS)}::jsonb,
      ${null}, ${"physical"}, ${next_order}
    )
    returning id, name, slug, price, sort_order`;

  // Tak jak robi to API przy zapisie ceny (Omnibus).
  await sql`
    insert into price_history (product_id, shop_id, price)
    values (${product.id}, ${shop.id}, ${PRICE})`;

  console.log("✓ produkt dodany:", product);
  console.log("✓ wpis w price_history dopisany");
}

main();
