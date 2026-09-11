/**
 * Jednorazowy skrypt: poprawki klientki HAGI z 2026-09-11.
 *
 *  1. Tkanina w specyfikacji zawsze jako jeden wiersz „Skład" (jej format:
 *     „Skład — wierzch 100% wełna, podszewka 100% wiskoza").
 *  2. Szycie na miarę opisane jako opcja, nie cecha produktu.
 *  3. „Kamizelka cekinowa HAGA" → „Cekinowa kamizelka z jedwabiem". Adres
 *     (slug) zostaje — nie podąża za nazwą, żeby nie zrywać linków.
 *  4. Slogan pod logo w stopce: „Własny rytm, własne światło".
 *  5. „O nas": tytuł „Blisko ciała" nad pierwszą myślą, sekcja „Trzy rzeczy,
 *     które są dla mnie ważne" schowana.
 *  6. Dostawa: tylko InPost (paczkomat i kurier pod adres), 18,49 zł, za
 *     granicę na zapytanie.
 *  7. Płatność: tylko przelew.
 *  + FAQ zgodne z powyższym, bez placeholderów „[Do uzupełnienia…]".
 *
 * Idempotentny — drugie uruchomienie niczego nie psuje.
 *
 *   node_modules/.bin/tsx scripts/haga-poprawki-2026-09-11.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

type Spec = { key: string; value: string };

const sql = neon(process.env.DATABASE_URL!);

const MADE_TO_MEASURE_KEY = "Opcjonalnie";

/** Zastępuje wiersze `from` jednym wierszem „Skład" w miejscu pierwszego z nich. */
function toSklad(specs: Spec[], from: string[], value: string): Spec[] {
  if (specs.some((s) => s.key === "Skład")) return specs.map((s) => (s.key === "Skład" ? { key: "Skład", value } : s));
  const at = specs.findIndex((s) => from.includes(s.key));
  if (at === -1) throw new Error(`Brak wierszy ${from.join(", ")}`);
  const rest = specs.filter((s) => !from.includes(s.key));
  rest.splice(at, 0, { key: "Skład", value });
  return rest;
}

function madeToMeasureAsOption(specs: Spec[], value: string): Spec[] {
  return specs.map((s) =>
    s.key === "Szycie na miarę" || s.key === MADE_TO_MEASURE_KEY ? { key: MADE_TO_MEASURE_KEY, value } : s
  );
}

const SPECS: Record<string, (s: Spec[]) => Spec[]> = {
  "kamizelka-cekinowa-haga": (s) =>
    toSklad(s, ["Wierzch", "Spód, lamówki, wiązania"], "wierzch 100% poliester, podszycie, lamówki i wiązania 100% jedwab"),
  "granatowa-kamizelka-garniturowa-z-wloskiej-welny": (s) =>
    toSklad(s, ["Materiał"], "wierzch 100% wełna, podszewka 100% wiskoza"),
  "koronkowa-halka-maxi-spodnica": (s) => toSklad(s, ["Materiał"], "koronka 100% poliester"),
  "welniana-bluzka-z-odkrytymi-plecami": (s) => toSklad(s, [], "100% wełna"),
  "spodnica-koralowa-z-wloskiej-welny": (s) =>
    madeToMeasureAsOption(
      toSklad(s, ["Skład — wierzch", "Skład — podszewka"], "wierzch 100% wełna, podszewka 100% wiskoza"),
      "uszycie na miarę po ustaleniu szczegółów"
    ),
  "biala-spodnica-midi-z-bawelnianego-zakardu": (s) =>
    madeToMeasureAsOption(
      toSklad(s, ["Skład — wierzch", "Skład — podszewka"], "wierzch 95% bawełna, 3% elastan, 2% poliester; podszewka 100% wiskoza"),
      "uszycie na miarę po ustaleniu szczegółów"
    ),
  "jedwabne-szerokie-spodnie-z-gumkami": (s) =>
    madeToMeasureAsOption(toSklad(s, [], "100% jedwab"), "gumki i długość dopasowane na miarę"),
  "jedwabna-kamizelka-wiazana-na-sznureczki": (s) =>
    toSklad(s, ["Skład — wierzch", "Skład — spód"], "wierzch 100% tafta jedwabna, spód 100% satyna jedwabna"),
};

const RENAME = { slug: "kamizelka-cekinowa-haga", name: "Cekinowa kamizelka z jedwabiem" };
const TAGLINE = "Własny rytm, własne światło";
const ABOUT_FIRST_TITLE = "Blisko ciała";

const DELIVERY = {
  methods: [
    { id: "paczkomat", label: "InPost — do paczkomatu", price: "18.49", enabled: true, kind: "parcel_locker" },
    { id: "kurier", label: "InPost — kurier pod adres", price: "18.49", enabled: true, kind: "courier" },
  ],
  freeShippingFrom: "",
  abroadOnRequest: true,
};

const FAQ_ANSWERS: Record<string, string> = {
  "Jak mogę zapłacić?":
    "Przelewem na konto. Dane do przelewu i numer zamówienia dostaniesz na ekranie po złożeniu zamówienia oraz w mailu z potwierdzeniem.",
  "Jak wysyłacie zamówienia?":
    "Przez InPost — do paczkomatu albo kurierem pod wskazany adres. W obu przypadkach dostawa na terenie Polski kosztuje 18,49 zł. Paczkomat wybierasz na mapie w koszyku.",
  "W jakim czasie wysyłacie zamówienie?":
    "Do 7 dni roboczych, a przy zamówieniach szytych na miarę do 14 dni roboczych.",
};
const FAQ_ABROAD = {
  q: "Czy wysyłacie za granicę?",
  a: "Wysyłka poza Polskę jest możliwa po wcześniejszym ustaleniu. Zanim złożysz zamówienie, napisz do nas przez formularz na stronie Kontakt — podamy koszt i sposób dostawy.",
};
const FAQ_REMOVE_PLACEHOLDERS = /^\[Do uzupełnienia/;

async function upsertConfig(shopId: string, key: string, value: unknown) {
  await sql`
    insert into shop_config (shop_id, key, value)
    values (${shopId}, ${key}, ${JSON.stringify(value)}::jsonb)
    on conflict (shop_id, key) do update set value = excluded.value`;
}

async function main() {
  const [shop] = await sql`select id from shops where slug = ${"haga"}`;
  const cfgRows = await sql`select key, value from shop_config where shop_id = ${shop.id}`;
  const cfg = Object.fromEntries(cfgRows.map((r) => [r.key, r.value])) as Record<string, any>;

  // 1–3. Produkty
  for (const [slug, fix] of Object.entries(SPECS)) {
    const [p] = await sql`select id, name, specs from products where shop_id = ${shop.id} and slug = ${slug}`;
    if (!p) throw new Error(`Nie ma produktu ${slug}`);
    const specs = fix(p.specs as Spec[]);
    const name = slug === RENAME.slug ? RENAME.name : p.name;
    await sql`
      update products set specs = ${JSON.stringify(specs)}::jsonb, name = ${name}, updated_at = now()
      where id = ${p.id}`;
    console.log(`✓ ${name}`);
    for (const s of specs.filter((s) => s.key === "Skład" || s.key === MADE_TO_MEASURE_KEY)) {
      console.log(`    ${s.key}: ${s.value}`);
    }
  }

  // 4. Slogan w stopce
  await upsertConfig(shop.id, "branding", { ...cfg.branding, tagline: TAGLINE });
  console.log(`✓ branding.tagline = ${TAGLINE}`);

  // 5. O nas
  const content: string = cfg.about.content;
  const about = content.startsWith(ABOUT_FIRST_TITLE)
    ? cfg.about
    : { ...cfg.about, content: `${ABOUT_FIRST_TITLE}\n\n${content}` };
  await upsertConfig(shop.id, "about", about);
  await upsertConfig(shop.id, "home", {
    ...cfg.home,
    benefits: { ...cfg.home.benefits, placement: "hidden" },
  });
  console.log("✓ about: tytuł pierwszej myśli, sekcja korzyści schowana");

  // 6–7. Dostawa i płatność
  await upsertConfig(shop.id, "delivery", DELIVERY);
  await upsertConfig(shop.id, "checkout", {
    transferEnabled: true,
    bankAccount: cfg.checkout?.bankAccount ?? "",
    accountOwner: cfg.checkout?.accountOwner ?? "",
    codEnabled: false,
    codFee: "0.00",
  });
  console.log("✓ dostawa: InPost paczkomat + kurier po 18,49 zł, za granicę na zapytanie; płatność: tylko przelew");

  // FAQ
  let items: { q: string; a: string }[] = cfg.faq.items
    .filter((i: { a: string }) => !FAQ_REMOVE_PLACEHOLDERS.test(i.a) || FAQ_ANSWERS[(i as any).q])
    .map((i: { q: string; a: string }) => (FAQ_ANSWERS[i.q] ? { ...i, a: FAQ_ANSWERS[i.q] } : i))
    .filter((i: { q: string }) => i.q !== FAQ_ABROAD.q);
  const after = items.findIndex((i) => i.q === "Jak wysyłacie zamówienia?");
  items.splice(after + 1, 0, FAQ_ABROAD);
  await upsertConfig(shop.id, "faq", { ...cfg.faq, items });
  console.log("✓ FAQ:");
  for (const i of items) console.log(`    ${i.q}`);
}

main();
