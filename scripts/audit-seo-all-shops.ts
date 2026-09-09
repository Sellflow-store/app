/**
 * Audyt: czy zmiany SEO faktycznie objęły wszystkie sklepy.
 * Sprawdza bazę (adresy produktów) i żywe adresy (mapa, robots, karta produktu).
 *
 *   node_modules/.bin/tsx scripts/audit-seo-all-shops.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "sell-flow.store";

/** Ponawia raz — pierwsze wejście na uśpiony sklep bywa zimnym startem. */
async function fetchTwice(url: string): Promise<Response | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (res.ok || attempt === 1) return res;
    } catch {
      if (attempt === 1) return null;
    }
  }
  return null;
}

async function head(url: string): Promise<number> {
  const res = await fetchTwice(url);
  return res?.status ?? 0;
}

async function text(url: string): Promise<string> {
  const res = await fetchTwice(url);
  return res?.ok ? await res.text() : "";
}

async function main() {
  const shops = await sql`
    select s.slug, s.custom_domain, s.active, s.suspended, s.deleted_at,
           count(p.id)::int as products,
           count(p.id) filter (where p.slug is null)::int as bez_slugu,
           -- przykład MUSI być produktem widocznym: ukryty słusznie zwraca 404
           min(p.slug) filter (where p.visible) as przyklad
    from shops s left join products p on p.shop_id = s.id
    group by s.id
    order by s.slug`;

  const zywe = shops.filter((s) => s.active && !s.suspended && !s.deleted_at);
  console.log(`Sklepy w bazie: ${shops.length}, żywe: ${zywe.length}\n`);

  const bad: string[] = [];
  console.log("sklep".padEnd(22), "prod".padEnd(5), "mapa".padEnd(6), "robots".padEnd(7), "produkt");
  console.log("-".repeat(78));

  for (const s of zywe) {
    const host = s.custom_domain ? `https://${s.custom_domain}` : `https://${s.slug}.${DOMAIN}`;
    const [mapa, robots] = await Promise.all([text(`${host}/sitemap.xml`), text(`${host}/robots.txt`)]);
    const locs = (mapa.match(/<loc>/g) ?? []).length;
    const hasSitemapLine = robots.includes("Sitemap:");

    let produkt = "brak produktów";
    if (s.przyklad) {
      const code = await head(`${host}/produkty/${s.przyklad}`);
      produkt = code === 200 ? `200 ${s.przyklad}` : `!! ${code}`;
      if (code !== 200) bad.push(`${s.slug}: karta produktu ${code}`);
    }

    if (s.bez_slugu > 0) bad.push(`${s.slug}: ${s.bez_slugu} produktów bez adresu`);
    if (locs === 0) bad.push(`${s.slug}: mapa witryny pusta lub niedostępna`);
    if (!hasSitemapLine) bad.push(`${s.slug}: robots.txt bez wskazania mapy`);

    console.log(
      s.slug.padEnd(22),
      String(s.products).padEnd(5),
      String(locs).padEnd(6),
      (hasSitemapLine ? "ok" : "BRAK").padEnd(7),
      produkt
    );
  }

  console.log("\n" + "=".repeat(78));
  if (bad.length === 0) {
    console.log("Wszystkie żywe sklepy mają adresy produktów, mapę witryny i robots.txt.");
  } else {
    console.log("PROBLEMY:");
    for (const b of bad) console.log("  -", b);
  }

  const nieaktywne = shops.filter((s) => !s.active || s.suspended || s.deleted_at);
  if (nieaktywne.length > 0) {
    console.log(
      `\nPominięte (wyłączone/zawieszone/usunięte): ${nieaktywne.map((s) => s.slug).join(", ")}`
    );
  }
}

main();
