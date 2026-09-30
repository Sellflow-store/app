/**
 * Jednorazowy skrypt: jedenasty produkt HAGI —
 * „Jedwabna chusta Lady Green" (680 zł, 120 × 120 cm, bez wyboru rozmiaru).
 *
 * Idempotentny: produkt zakłada tylko wtedy, gdy sklep nie ma jeszcze pozycji
 * o tej nazwie; zdjęcie wysyła raz.
 *
 * Na razie jeden kadr: płaski print całej chusty (z sygnaturą HAGA x artystka).
 * Kadry noszenia do dopisania, gdy klientka je przyśle.
 *
 * Uruchomienie z katalogu repo:
 *   CHUSTA_DIR=<katalog z kadrami> node_modules/.bin/tsx scripts/haga-chusta-lady-green.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";
import { slugify } from "@/lib/slug";

const SHOP_SLUG = "haga";
const NAME = "Jedwabna chusta Lady Green";
const CATEGORY = "Chusty";
const PRICE = "680.00";
const SRC = process.env.CHUSTA_DIR ?? "/tmp/haga-chusta-lady-green";

/** lead = płaski print całej chusty */
const IMAGES = [{ file: `${SRC}/lg_lead.jpg`, name: "haga-chusta-lady-green-1.jpg" }];

const sql = neon(process.env.DATABASE_URL!);

const SHORT_DESC =
  "Jedwabna chusta 120 × 120 cm z roślinnym printem artystki Doroty Janickiej: zielenie, brązy i czerń na szarym tle, z czerwonym akcentem.";

const DESCRIPTION = [
  "<p>Jedwabna chusta Lady Green powstała we współpracy z artystką Dorotą Janicką.</p>",
  "<p>Na miękkiej, szlachetnej jedwabnej krepie pojawia się wyrazisty print inspirowany światem roślin. Głębokie zielenie, brązy i czerń zestawione z szarym tłem tworzą wzór o eleganckim, nieoczywistym charakterze. Subtelny czerwony akcent dodaje mu energii i własnego charakteru.</p>",
  "<p>Chusta o wymiarach 120 × 120 cm daje wiele możliwości noszenia: jako klasycznie zawiązana chusta na szyi, narzucona na ramiona czy jako efektowny dodatek do stylizacji. Można również nadać jej zupełnie nową formę, tworząc z niej bluzkę, spódnicę lub inną część stylizacji.</p>",
  "<p>Lady Green to połączenie jedwabiu, sztuki i charakterystycznego wzoru.</p>",
].join("\n");

const BENEFITS = [
  { label: "Print artystki Doroty Janickiej", desc: "wzór inspirowany światem roślin" },
  { label: "100% jedwabna krepa", desc: "miękka i szlachetna w dotyku" },
  { label: "Duży format 120 × 120 cm", desc: "na szyję, ramiona, jako bluzka lub spódnica" },
  { label: "Najwyższa jakość wykonania", desc: "" },
];

const SPECS = [
  { key: "Skład", value: "100% jedwabna krepa" },
  { key: "Wymiar", value: "120 × 120 cm" },
  { key: "Kolory", value: "odcienie zieleni, szarości, brązu, czerwieni" },
];

/** chusta ma jeden wymiar, więc bez wyboru rozmiaru w koszyku */
const SIZES: string[] = [];

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
