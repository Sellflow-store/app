/**
 * Jednorazowy skrypt: dziesiąty produkt HAGI —
 * „Jedwabna bluzka z guzikami na plecach i wiązaniem w pasie" (630 zł, rozmiary S/M i M/L).
 *
 * Idempotentny: produkt zakłada tylko wtedy, gdy sklep nie ma jeszcze pozycji
 * o tej nazwie; zdjęcia wysyła raz.
 *
 * Uruchomienie z katalogu repo:
 *   BLUZKA_DIR=<katalog z kadrami> node_modules/.bin/tsx scripts/haga-jedwabna-bluzka.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";
import { slugify } from "@/lib/slug";

const SHOP_SLUG = "haga";
const NAME = "Jedwabna bluzka z guzikami na plecach i wiązaniem w pasie";
const CATEGORY = "Bluzki";
const PRICE = "630.00";
const SRC = process.env.BLUZKA_DIR ?? "/tmp/haga-jedwabna-bluzka";

/** lead = przód przewiązany paskiem, potem tył z osobnym paskiem i detal guziczków na plecach */
const IMAGES = [
  { file: `${SRC}/bl_lead.jpg`, name: "haga-jedwabna-bluzka-1.jpg" },
  { file: `${SRC}/bl_p1.jpg`, name: "haga-jedwabna-bluzka-2.jpg" },
  { file: `${SRC}/bl_p2.jpg`, name: "haga-jedwabna-bluzka-3.jpg" },
];

const sql = neon(process.env.DATABASE_URL!);

const SHORT_DESC =
  "Bluzka o swobodnym, luźnym kroju uszyta z wysokiej jakości krepy jedwabnej, zapinana na rząd ozdobnych guziczków na plecach.";

const DESCRIPTION = [
  "<p>Bluzka o swobodnym, luźnym kroju uszyta z wysokiej jakości krepy jedwabnej. Tkanina ma delikatną, matową powierzchnię i miękko układa się na sylwetce.</p>",
  "<p>Tył bluzki został przecięty na całej długości i zapinany na rząd niewielkich, ozdobnych guziczków. Konstrukcja pleców jest głównym detalem fasonu — subtelnym, ale wyraźnym.</p>",
  "<p>Do bluzki dołączony jest osobny pasek z tej samej tkaniny. Można nosić ją luźno lub przewiązać w talii, zmieniając charakter i proporcje fasonu.</p>",
  "<p>Prosta forma, szlachetna tkanina i dopracowany detal tworzą ponadczasowy model, który można zestawiać z różnymi elementami garderoby.</p>",
  "<p>Bluzka została uszyta z tej samej krepy jedwabnej co jedwabne spodnie na gumce. Noszone razem tworzą elegancki, spójny komplet.</p>",
].join("\n");

const BENEFITS = [
  { label: "Luźny, swobodny fason", desc: "" },
  { label: "Delikatna krepa jedwabna", desc: "" },
  { label: "Zapięcie na ozdobne guziczki na plecach", desc: "" },
  { label: "Osobny pasek do wiązania w pasie", desc: "do noszenia luźno lub przewiązanej w talii" },
  { label: "Rękaw długi", desc: "" },
  { label: "Komplet z jedwabnymi spodniami", desc: "z tej samej tkaniny" },
];

const SPECS = [
  { key: "Skład", value: "100% jedwab" },
  { key: "Fason", value: "luźny, swobodny" },
  { key: "Rękaw", value: "długi" },
  { key: "Zapięcie", value: "ozdobne guziczki na plecach" },
  { key: "S/M", value: "dł. 56 cm · szer. 110 cm" },
  { key: "M/L", value: "dł. 59 cm · szer. 116 cm" },
];

const SIZES = ["S/M", "M/L"];

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
      ${shop.id}, ${NAME}, ${slug}, ${CATEGORY}, ${PRICE}, ${false}, ${true},
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
