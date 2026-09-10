/**
 * Jednorazowy skrypt: ósmy produkt HAGI —
 * „Jedwabna kamizelka wiązana na sznureczki" (450 zł, rozmiary S/M/L).
 *
 * UWAGA: klientka przysłała sekcję „Wymiary" bez liczb (S/M/L — długość, biust),
 * więc `specs` mają na razie sam skład. Wymiary do dopisania, gdy je poda —
 * nie zmyślać.
 *
 *   node_modules/.bin/tsx scripts/haga-jedwabna-kamizelka.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";
import { slugify } from "@/lib/slug";

const SHOP_SLUG = "haga";
const NAME = "Jedwabna kamizelka wiązana na sznureczki";
const PRICE = "450.00";
const SRC = process.env.KAMIZELKA_DIR ?? "/tmp/haga-jedwabna-kamizelka";

/** lead = jedyny kolorowy kadr (widać taftę i sznureczki), packshoty = dwa czarno-białe */
const IMAGES = [
  { file: `${SRC}/kam_lead.jpg`, name: "haga-jedwabna-kamizelka-1.jpg" },
  { file: `${SRC}/kam_p1.jpg`, name: "haga-jedwabna-kamizelka-2.jpg" },
  { file: `${SRC}/kam_p2.jpg`, name: "haga-jedwabna-kamizelka-3.jpg" },
];

const sql = neon(process.env.DATABASE_URL!);

const SHORT_DESC =
  "Głęboka czerń, prosta forma i jedwabne sznureczki, które pozwalają nosić ją na różne sposoby.";

const DESCRIPTION = [
  "<p>Damska kamizelka uszyta z wysokiej jakości jedwabiu — z wierzchu z matowej tafty jedwabnej, od spodu wykończona jedwabną satyną.</p>",
  "<p>Głęboka czerń podkreśla prostotę formy i nadaje jej ponadczasowy charakter. Ma swobodny, nieprzylegający krój oraz delikatne wiązania na sznureczki, które pozwalają nosić ją na różne sposoby.</p>",
  "<p>To wyjątkowy element garderoby, który może pełnić rolę lekkiego okrycia na chłodniejsze dni — świetnie wygląda na dopasowanym longsleevie, golfie czy koszuli. Wieczorem może stać się subtelnym, zmysłowym dodatkiem noszonym na delikatną bieliznę.</p>",
  "<p>Szlachetność jedwabiu nadaje jej wyjątkowego charakteru, a prosta forma sprawia, że z łatwością uzupełnia zarówno codzienne, jak i wieczorowe stylizacje.</p>",
  "<p>Niewielki element garderoby, który daje wiele możliwości i został zaprojektowany z myślą o tym, by pozostać z Tobą na lata.</p>",
].join("\n");

const BENEFITS = [
  { label: "Luźny, nieprzylegający fason", desc: "swobodnie układa się na sylwetce" },
  { label: "Wiązana na jedwabne sznureczki", desc: "pozwalają nosić ją na różne sposoby" },
  { label: "W całości uszyta z jedwabiu", desc: "matowa tafta z wierzchu, satyna od spodu" },
];

const SPECS = [
  { key: "Skład — wierzch", value: "100% tafta jedwabna" },
  { key: "Skład — spód", value: "100% satyna jedwabna" },
];

const SIZES = ["S", "M", "L"];

async function main() {
  const [shop] = await sql`select id, owner_id, slug from shops where slug = ${SHOP_SLUG}`;
  if (!shop) throw new Error(`Nie ma sklepu o slug „${SHOP_SLUG}”`);

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
      ${shop.id}, ${NAME}, ${slug}, ${"Kamizelki"}, ${PRICE}, ${false}, ${true},
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
}

main();
