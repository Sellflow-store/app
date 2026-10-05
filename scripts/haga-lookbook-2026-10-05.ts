/**
 * Jednorazowy skrypt: nowy układ lookbooka na stronie głównej HAGI (od klientki,
 * 2026-10-05). Z ośmiu kadrów zostaje sześć, w tej kolejności:
 *
 *  1. NOWE — czarno-białe, fragment marynarki i koronka
 *  2. film nr 4 (zielone kwiaty na granacie)
 *  3. zdjęcie nr 6 (czarno-białe kwiaty)
 *  4. zdjęcie nr 3 (siedząca, czarna kamizelka)
 *  5. film nr 2 (leżąca, granatowa kamizelka i koronka)
 *  6. NOWE — czarno-białe, siedząca z profilu
 *
 * Numery to pozycje w starym układzie. Stare kadry szukamy po nazwie pliku,
 * nie po pozycji, więc drugie uruchomienie daje ten sam wynik, a nowe zdjęcia
 * wysyłamy tylko raz (jeśli już są w lookbooku, bierzemy istniejący adres).
 *
 *   node_modules/.bin/tsx scripts/haga-lookbook-2026-10-05.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";
import type { LookbookItem } from "@/types/shop";

const SHOP_SLUG = "haga";
const SRC = process.env.LOOKBOOK_DIR ?? "scripts/assets/haga-lookbook";

type Slot = { existing: string } | { file: string; name: string };

/** `existing` = fragment nazwy pliku kadru, który już jest w lookbooku (film po adresie filmu). */
const ORDER: Slot[] = [
  { file: `${SRC}/marynarka-koronka.jpg`, name: "haga-lookbook-11-marynarka-koronka.jpg" },
  { existing: "haga-lookbook-04-klip-" },
  { existing: "haga-lookbook-05-kwiaty-" },
  { existing: "haga-lookbook-03-siedzaca-" },
  { existing: "haga-lookbook-02-klip-" },
  { file: `${SRC}/siedzaca-bw.jpg`, name: "haga-lookbook-12-siedzaca-profil.jpg" },
];

const sql = neon(process.env.DATABASE_URL!);

/** Nazwa bez rozszerzenia — `put` z `addRandomSuffix` dokleja sufiks przed kropką. */
const stem = (name: string) => name.replace(/\.[^.]+$/, "");

async function main() {
  const [shop] = await sql`select id, owner_id from shops where slug = ${SHOP_SLUG}`;
  if (!shop) throw new Error(`Nie ma sklepu o slug „${SHOP_SLUG}”`);
  const [row] = await sql`select value from shop_config where shop_id = ${shop.id} and key = 'home'`;
  const home = row.value;
  const current: LookbookItem[] = home.lookbook?.items ?? [];

  const find = (part: string) => current.find((i) => (i.video ?? i.image).includes(part));

  const items: LookbookItem[] = [];
  for (const slot of ORDER) {
    if ("existing" in slot) {
      const item = find(slot.existing);
      if (!item) throw new Error(`W lookbooku nie ma kadru „${slot.existing}”`);
      items.push(item);
      continue;
    }
    const uploaded = find(stem(slot.name));
    if (uploaded) {
      items.push(uploaded);
      console.log(`• ${slot.name} już wysłane`);
      continue;
    }
    const bytes = await readFile(slot.file);
    const blob = await put(`shops/${shop.owner_id}/${slot.name}`, bytes, {
      access: "public",
      addRandomSuffix: true,
      contentType: "image/jpeg",
    });
    items.push({ image: blob.url });
    console.log(`✓ ${slot.name} → ${blob.url} (${Math.round(bytes.length / 1024)} KB)`);
  }

  await sql`
    update shop_config
    set value = ${JSON.stringify({ ...home, lookbook: { ...home.lookbook, items } })}::jsonb
    where shop_id = ${shop.id} and key = 'home'`;

  console.log("✓ lookbook:");
  items.forEach((i, n) => console.log(`    ${n + 1}. ${(i.video ?? i.image).split("/").pop()}`));
}

main();
