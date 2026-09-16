/**
 * Jednorazowy skrypt: dziewiąty produkt HAGI —
 * „Lekki płaszcz bawełniany / kimono" (480 zł, rozmiary S/M i M/L).
 *
 * Idempotentny: produkt zakłada tylko wtedy, gdy sklep nie ma jeszcze pozycji
 * o tej nazwie; zdjęcia wysyła raz.
 *
 * Uruchomienie z katalogu repo:
 *   PLASZCZ_DIR=<katalog z kadrami> node_modules/.bin/tsx scripts/haga-lekki-plaszcz.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";
import { slugify } from "@/lib/slug";

const SHOP_SLUG = "haga";
const NAME = "Lekki płaszcz bawełniany / kimono";
const PRICE = "480.00";
const SRC = process.env.PLASZCZ_DIR ?? "/tmp/haga-lekki-plaszcz";

/** lead = packshot przewiązany w talii, potem rozpięty (widać boczne paski) i noszony z jedwabnymi spodniami */
const IMAGES = [
  { file: `${SRC}/pl_lead.jpg`, name: "haga-lekki-plaszcz-1.jpg" },
  { file: `${SRC}/pl_p1.jpg`, name: "haga-lekki-plaszcz-2.jpg" },
  { file: `${SRC}/pl_p2.jpg`, name: "haga-lekki-plaszcz-3.jpg" },
];

const sql = neon(process.env.DATABASE_URL!);

const SHORT_DESC =
  "Lekki płaszcz z przyjemnej w dotyku, delikatnie strukturalnej bawełny w odcieniu ciepłego beżu, w delikatny prążek.";

const DESCRIPTION = [
  "<p>Lekki płaszcz uszyty z przyjemnej w dotyku bawełny delikatnie strukturalnej, o odcieniu ciepłego beżu, w delikatny prążek.</p>",
  "<p>Prosta, swobodna forma została zaprojektowana tak, aby można było nosić go na wiele sposobów — jako główne okrycie stylizacji, narzucony na bieliznę i szerokie spodnie albo jako dodatkową warstwę, kiedy potrzebujesz osłonić się przed chłodem.</p>",
  "<p>Jasny, rozświetlający kolor nadaje mu lekkości i pozostawia przestrzeń dla reszty stylizacji. To również fason, po który można sięgnąć wtedy, gdy chcesz szybko zmienić charakter stroju — narzucić go na sukienkę, spódnicę czy prosty top.</p>",
  "<p>Po bokach znajdują się cienkie paski pozwalające regulować sposób ułożenia płaszcza i delikatnie zaznaczyć talię. Całość uzupełniają duże kieszenie oraz efektowne rozcięcie z tyłu, które porządkuje sylwetkę i nadaje prostej formie charakteru.</p>",
  "<p>Lekki bawełniany płaszcz/kimono jest świetną propozycją do Twojej szafy kapsułowej. Pięknie prezentuje się z naszymi jedwabnymi spodniami.</p>",
].join("\n");

const BENEFITS = [
  { label: "Swobodny, prosty krój", desc: "do noszenia na wiele sposobów" },
  { label: "Boczne paski do wiązania", desc: "regulują ułożenie i zaznaczają talię" },
  { label: "Duże kieszenie", desc: "" },
  { label: "Rozcięcie z tyłu", desc: "rozporek porządkuje sylwetkę" },
  { label: "Lekko strukturalna tkanina", desc: "beż w odcieniu masełkowym" },
  { label: "Delikatny prążek", desc: "czarny i bordowy na przemian" },
  { label: "Staranne wykończenie", desc: "" },
];

const SPECS = [
  { key: "Skład", value: "90% bawełna, 10% wiskoza" },
  { key: "Kolor", value: "beż w odcieniu masełkowym, prążek czarny i bordowy" },
  { key: "Fason", value: "swobodny, prosty" },
  { key: "S/M", value: "dł. 130 cm · szer. 126 cm" },
  { key: "M/L", value: "dł. 130 cm · szer. 132 cm" },
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
      ${shop.id}, ${NAME}, ${slug}, ${"Płaszcze"}, ${PRICE}, ${false}, ${true},
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
