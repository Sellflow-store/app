/**
 * Jednorazowy skrypt: klientka dosłała ostry detal białej spódnicy (pas,
 * kieszeń, splot żakardu, dół). Zastępuje trzecie zdjęcie — wcześniej był tam
 * MÓJ wycinek z kadru sylwetki, czyli to samo ujęcie, tylko gorszej jakości.
 *
 * Zdjęć zostaje TRZY, bo galeria to lead + siatka 2× — czwarte wisiałoby samo
 * w połowie rzędu.
 *
 *   node_modules/.bin/tsx scripts/haga-biala-spodnica-detal.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";

const SLUG = "biala-spodnica-midi-z-bawelnianego-zakardu";
const FILE = process.env.DETAL_JPG ?? "/tmp/white_detail.jpg";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const [shop] = await sql`select id, owner_id from shops where slug = ${"haga"}`;
  const [product] = await sql`
    select id, name, images from products where shop_id = ${shop.id} and slug = ${SLUG}`;
  if (!product) throw new Error(`Nie ma produktu ${SLUG}`);

  const images = product.images as string[];
  console.log(`• ${product.name}: ${images.length} zdjęć`);

  const bytes = await readFile(FILE);
  const blob = await put(`shops/${shop.owner_id}/haga-biala-spodnica-zakard-detal.jpg`, bytes, {
    access: "public",
    addRandomSuffix: true,
    contentType: "image/jpeg",
  });
  console.log(`✓ ${blob.url} (${Math.round(bytes.length / 1024)} KB)`);

  const next = [images[0], images[1], blob.url];
  await sql`
    update products set images = ${JSON.stringify(next)}::jsonb, updated_at = now()
    where id = ${product.id}`;
  console.log("✓ trzecie zdjęcie podmienione");
}

main();
