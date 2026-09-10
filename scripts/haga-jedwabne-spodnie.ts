/**
 * Jednorazowy skrypt: siódmy produkt HAGI —
 * „Jedwabne szerokie spodnie z gumkami" (900 zł, rozmiary S/M i L/XL).
 *
 * Idempotentny: produkt zakłada tylko wtedy, gdy sklep nie ma jeszcze pozycji
 * o tej nazwie; zdjęcia wysyła raz.
 *
 * Uruchomienie z katalogu repo:
 *   node_modules/.bin/tsx scripts/haga-jedwabne-spodnie.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";
import { slugify } from "@/lib/slug";

const SHOP_SLUG = "haga";
const NAME = "Jedwabne szerokie spodnie z gumkami";
const PRICE = "900.00";
const SRC = process.env.SPODNIE_DIR ?? "/tmp/haga-jedwabne-spodnie";

/** lead = sylwetka w ruchu, potem ujęcie z przodu i detal pasa/kostki */
const IMAGES = [
  { file: `${SRC}/sp_lead.jpg`, name: "haga-jedwabne-spodnie-1.jpg" },
  { file: `${SRC}/sp_p1.jpg`, name: "haga-jedwabne-spodnie-2.jpg" },
  { file: `${SRC}/sp_p2.jpg`, name: "haga-jedwabne-spodnie-3.jpg" },
];

const sql = neon(process.env.DATABASE_URL!);

const SHORT_DESC =
  "Są takie ubrania, po które chce się sięgać codziennie. Te spodnie należą właśnie do nich.";

const DESCRIPTION = [
  "<p>Damskie jedwabne spodnie mają swobodną, szeroką formę, elastyczny pas i delikatne gumki przy kostkach. Boczne kieszenie dodają im praktyczności, a miękko układająca się tkanina sprawia, że pięknie pracują z sylwetką.</p>",
  "<p>Są trochę magiczne. Dopasowują się do różnych sylwetek, stylów i okazji, dlatego świetnie odnajdują się w szafie kapsułowej — mogą zająć w niej naprawdę honorowe miejsce.</p>",
  "<p>Z jedwabną kamizelką HAGA, biżuterią i eleganckimi butami stają się częścią wyrafinowanej stylizacji. Z prostym T-shirtem, swetrem i płaskimi butami nabierają swobodnego, codziennego charakteru.</p>",
  "<p>Jedwab sprawia, że noszenie ich jest czymś więcej niż wygodą. To przyjemność, którą czuje ciało — miękkość, lekkość i poczucie, że masz na sobie coś wyjątkowego. A świadomość, że jedwab wymaga troski, sprawia, że zaczynamy o te spodnie dbać tak jak o rzeczy, które naprawdę są dla nas ważne.</p>",
  "<p>Jedwabne szerokie spodnie można zestawić z jedwabną bluzką wiązaną w pasie HAGA — obie propozycje uszyte są z tej samej tkaniny i tworzą piękny set.</p>",
  "<p>Jeśli potrzebujesz indywidualnego dopasowania szerokości gumek w pasie i przy kostkach oraz długości spodni, napisz do nas przez formularz na stronie Kontakt — wspólnie ustalimy szczegóły.</p>",
].join("\n");

const BENEFITS = [
  { label: "Jedwab", desc: "miękko układa się i pięknie pracuje z sylwetką" },
  { label: "Boczne kieszenie", desc: "wpuszczone w bok, niewidoczne z zewnątrz" },
  { label: "Gumki w pasie i przy kostkach", desc: "z możliwością dopasowania na miarę" },
  { label: "Obszerny, swobodny krój", desc: "odnajduje się w szafie kapsułowej" },
];

const SPECS = [
  { key: "Skład", value: "100% jedwab" },
  { key: "Długość", value: "97 cm (oba rozmiary)" },
  { key: "S/M — pas (gumka)", value: "72–80 cm" },
  { key: "S/M — biodra", value: "170 cm" },
  { key: "S/M — kostki (gumka)", value: "26–30 cm" },
  { key: "L/XL — pas (gumka)", value: "80–90 cm" },
  { key: "L/XL — biodra", value: "180 cm" },
  { key: "L/XL — kostki (gumka)", value: "30–34 cm" },
  { key: "Szycie na miarę", value: "szerokość gumek i długość spodni" },
];

const SIZES = ["S/M", "L/XL"];

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

  const taken = new Set(
    (await sql`select slug from products where shop_id = ${shop.id}`).map((r) => r.slug as string)
  );
  const root = slugify(NAME);
  let slug = root;
  for (let i = 2; taken.has(slug); i++) slug = `${root}-${i}`;
  console.log(`• adres: /produkty/${slug}`);

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

  const [{ next_order }] = await sql`
    select coalesce(max(sort_order), -1) + 1 as next_order
    from products where shop_id = ${shop.id}`;

  const [product] = await sql`
    insert into products (
      shop_id, name, slug, category, price, price_on_request, visible,
      short_desc, description, images, sizes, benefits, specs,
      stock, type, sort_order
    ) values (
      ${shop.id}, ${NAME}, ${slug}, ${"Spodnie"}, ${PRICE}, ${false}, ${true},
      ${SHORT_DESC}, ${DESCRIPTION},
      ${JSON.stringify(urls)}::jsonb,
      ${JSON.stringify(SIZES)}::jsonb,
      ${JSON.stringify(BENEFITS)}::jsonb,
      ${JSON.stringify(SPECS)}::jsonb,
      ${null}, ${"physical"}, ${next_order}
    )
    returning id, name, slug, price, sort_order`;

  await sql`
    insert into price_history (product_id, shop_id, price)
    values (${product.id}, ${shop.id}, ${PRICE})`;

  console.log("✓ produkt dodany:", product);
  console.log("✓ wpis w price_history dopisany");
}

main();
