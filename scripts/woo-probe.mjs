#!/usr/bin/env node
/**
 * Etap 0 importu produktów: sonda sklepów WooCommerce.
 *
 * Odpowiada na jedno pytanie: którym kanałem da się pobrać dane sklepu
 * i czego z niego NIE dostaniemy. Tylko odczyt, bez kluczy i logowania:
 * publiczne endpointy, mapa strony i jedna karta produktu.
 *
 * Uruchamiaj wyłącznie na sklepach, na które masz zgodę właściciela.
 * Skrypt nie ma zależności (Node 18+), więc działa bez `npm install`.
 *
 *   node scripts/woo-probe.mjs https://sklep-a.pl https://sklep-b.pl
 *   node scripts/woo-probe.mjs --file sklepy.txt --out woo-probe-out --max-pages 5
 *
 * Wynik: raport w terminalu oraz pliki .md i .json w katalogu --out.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const UA = "Sellflow-import-probe/0.1 (+https://sell-flow.store)";
const TIMEOUT_MS = 15_000;
const PAUSE_MS = 400;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // limit uploadu w Sellflow (/api/upload)

// ── argumenty ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const urls = [];
let outDir = "woo-probe-out";
let maxPages = 5;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--out") outDir = args[++i];
  else if (a === "--max-pages") maxPages = Math.max(1, Number(args[++i]) || 5);
  else if (a === "--file") {
    const txt = await readFile(args[++i], "utf8");
    urls.push(...txt.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#")));
  } else if (!a.startsWith("--")) urls.push(a);
}
if (!urls.length) {
  console.error("Podaj adresy sklepów albo --file plik.txt (jeden adres w linii).");
  process.exit(1);
}

// ── HTTP ─────────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function http(url, { method = "GET" } = {}) {
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method,
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "user-agent": UA, accept: "application/json, text/html;q=0.9, */*;q=0.5" },
    });
    const text = method === "HEAD" ? "" : await res.text();
    const challenge =
      res.headers.get("cf-mitigated") === "challenge" ||
      /Just a moment\.\.\.|cf-browser-verification|Attention Required! \| Cloudflare/i.test(text.slice(0, 4000));
    return { ok: res.ok, status: res.status, headers: res.headers, text, ms: Date.now() - t0, challenge, url: res.url };
  } catch (e) {
    return { ok: false, status: 0, headers: new Headers(), text: "", ms: Date.now() - t0, challenge: false, error: String(e?.cause?.code ?? e?.name ?? e) };
  } finally {
    clearTimeout(timer);
  }
}

function json(res) {
  try {
    return JSON.parse(res.text);
  } catch {
    return null;
  }
}

function normalizeBase(raw) {
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProto.replace(/\/+$/, "");
}

const num = (v) => (v == null ? null : Number(v));

// ── sondy ────────────────────────────────────────────────────────────────────
async function probeRoot(base) {
  const res = await http(`${base}/wp-json/`);
  const data = res.ok ? json(res) : null;
  const ns = Array.isArray(data?.namespaces) ? data.namespaces : [];
  return {
    status: res.status,
    error: res.error,
    challenge: res.challenge,
    isWordPress: !!data,
    siteName: data?.name ?? null,
    namespaces: ns,
    hasStoreApi: ns.includes("wc/store/v1"),
    hasRestV3: ns.includes("wc/v3"),
  };
}

async function probeStoreApi(base, max) {
  const out = { status: null, total: null, totalPages: null, fetched: 0, products: [], firstKeys: [], error: null };
  for (let page = 1; page <= max; page++) {
    const res = await http(`${base}/wp-json/wc/store/v1/products?per_page=100&page=${page}`);
    if (page === 1) {
      out.status = res.status;
      out.total = num(res.headers.get("x-wp-total"));
      out.totalPages = num(res.headers.get("x-wp-totalpages"));
      out.challenge = res.challenge;
      out.error = res.error ?? null;
    }
    const data = res.ok ? json(res) : null;
    if (!Array.isArray(data)) break;
    if (page === 1 && data[0]) out.firstKeys = Object.keys(data[0]);
    out.products.push(...data);
    out.fetched = out.products.length;
    if (out.totalPages != null && page >= out.totalPages) break;
    if (data.length < 100) break;
    await sleep(PAUSE_MS);
  }
  return out;
}

function top(map, n = 8) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => ({ name: k, count: v }));
}

function analyzeProducts(products) {
  const n = products.length;
  const types = new Map();
  const attrNames = new Map();
  const permalinkRoots = new Map();
  const cur = new Map();
  let withSku = 0, onSale = 0, multiCat = 0, noImage = 0, imgTotal = 0;
  let descImg = 0, descTable = 0, descH12 = 0, descShortcode = 0, descBuilder = 0, descEmpty = 0;
  let outOfStock = 0, lowStock = 0, variableWithoutVariations = 0;

  for (const p of products) {
    types.set(p.type ?? "?", (types.get(p.type ?? "?") ?? 0) + 1);
    if (p.sku) withSku++;
    if (p.on_sale) onSale++;
    if ((p.categories?.length ?? 0) > 1) multiCat++;
    const imgs = p.images?.length ?? 0;
    imgTotal += imgs;
    if (!imgs) noImage++;
    for (const a of p.attributes ?? []) attrNames.set(a.name ?? a.taxonomy, (attrNames.get(a.name ?? a.taxonomy) ?? 0) + 1);
    if (p.prices?.currency_code) cur.set(p.prices.currency_code, (cur.get(p.prices.currency_code) ?? 0) + 1);
    if (p.is_in_stock === false) outOfStock++;
    if (p.low_stock_remaining != null) lowStock++;
    if (p.type === "variable" && !(p.variations?.length > 0)) variableWithoutVariations++;
    try {
      const seg = new URL(p.permalink).pathname.split("/").filter(Boolean)[0] ?? "";
      permalinkRoots.set(`/${seg}/`, (permalinkRoots.get(`/${seg}/`) ?? 0) + 1);
    } catch {}
    const d = `${p.description ?? ""}`;
    if (!d.trim()) descEmpty++;
    if (/<img\b/i.test(d)) descImg++;
    if (/<table\b/i.test(d)) descTable++;
    if (/<h[12]\b/i.test(d)) descH12++;
    if (/\[[a-z_][a-z0-9_-]*[^\]]*\]/i.test(d)) descShortcode++;
    if (/elementor|et_pb_|vc_row|wpb_|fusion-/i.test(d)) descBuilder++;
  }
  return {
    count: n,
    types: top(types),
    variable: types.get("variable") ?? 0,
    variableWithoutVariations,
    withSku,
    onSale,
    multiCategory: multiCat,
    noImage,
    avgImages: n ? +(imgTotal / n).toFixed(1) : 0,
    currencies: top(cur),
    topAttributes: top(attrNames),
    permalinkRoots: top(permalinkRoots, 5),
    stock: { outOfStock, lowStockReported: lowStock },
    descriptions: { empty: descEmpty, withImg: descImg, withTable: descTable, withH1H2: descH12, withShortcodes: descShortcode, pageBuilder: descBuilder },
  };
}

async function probeVariation(base, products) {
  const v = products.find((p) => p.type === "variable" && p.variations?.length);
  if (!v) return { tested: false };
  const vid = v.variations[0]?.id;
  if (!vid) return { tested: false, note: "Store API zwraca warianty bez id" };
  const res = await http(`${base}/wp-json/wc/store/v1/products/${vid}`);
  const d = res.ok ? json(res) : null;
  return {
    tested: true,
    parentId: v.id,
    variationsListed: v.variations.length,
    listShape: Object.keys(v.variations[0] ?? {}),
    variationEndpointStatus: res.status,
    variationHasOwnPrice: !!d?.prices?.price,
    variationHasStockFlag: d ? "is_in_stock" in d : false,
    variationKeys: d ? Object.keys(d) : [],
  };
}

async function probeImages(products) {
  const urls = products.flatMap((p) => (p.images ?? []).map((i) => i.src)).filter(Boolean).slice(0, 6);
  const rows = [];
  for (const u of urls) {
    const r = await http(u, { method: "HEAD" });
    const len = num(r.headers.get("content-length"));
    rows.push({ url: u, status: r.status, bytes: len, over4MB: len != null && len > MAX_IMAGE_BYTES, type: r.headers.get("content-type") });
    await sleep(150);
  }
  return { sampled: rows.length, over4MB: rows.filter((r) => r.over4MB).length, failed: rows.filter((r) => !r.status || r.status >= 400).length, rows };
}

async function probeRestV3(base) {
  const res = await http(`${base}/wp-json/wc/v3/products?per_page=1`);
  const d = json(res);
  return { status: res.status, code: d?.code ?? null, note: res.status === 401 ? "wymaga kluczy (oczekiwane)" : res.ok ? "UWAGA: dostępne bez kluczy" : null };
}

async function probeCategories(base) {
  const res = await http(`${base}/wp-json/wc/store/v1/products/categories?per_page=100`);
  const d = res.ok ? json(res) : null;
  if (!Array.isArray(d)) return { status: res.status, count: null };
  return { status: res.status, count: d.length, nested: d.filter((c) => c.parent).length, sample: d.slice(0, 3).map((c) => c.permalink) };
}

async function probeWp(base) {
  const out = {};
  for (const kind of ["posts", "pages"]) {
    const r = await http(`${base}/wp-json/wp/v2/${kind}?per_page=1&_fields=id`);
    out[kind] = { status: r.status, total: num(r.headers.get("x-wp-total")) };
    await sleep(PAUSE_MS / 2);
  }
  return out;
}

async function probeSitemap(base) {
  const candidates = ["/wp-sitemap.xml", "/sitemap_index.xml", "/sitemap.xml"];
  for (const path of candidates) {
    const r = await http(`${base}${path}`);
    if (!r.ok || !/<(sitemapindex|urlset)\b/.test(r.text)) continue;
    const locs = [...r.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
    const isIndex = /<sitemapindex\b/.test(r.text);
    let productUrls = 0, scanned = 0;
    if (isIndex) {
      for (const child of locs.filter((l) => /product/i.test(l)).slice(0, 6)) {
        const c = await http(child);
        productUrls += [...c.text.matchAll(/<loc>/g)].length;
        scanned++;
        await sleep(PAUSE_MS / 2);
      }
    } else productUrls = locs.filter((l) => /produkt|product/i.test(l)).length;
    return { path, isIndex, childSitemaps: isIndex ? locs.length : 0, productSitemapsScanned: scanned, productUrls };
  }
  return { path: null };
}

async function probeJsonLd(url) {
  if (!url) return { tested: false };
  const r = await http(url);
  if (!r.ok) return { tested: true, status: r.status };
  const blocks = [...r.text.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const nodes = [];
  for (const b of blocks) {
    try {
      const j = JSON.parse(b);
      const flat = Array.isArray(j) ? j : j["@graph"] ? j["@graph"] : [j];
      nodes.push(...flat);
    } catch {}
  }
  const prod = nodes.find((x) => [].concat(x?.["@type"] ?? []).includes("Product"));
  return {
    tested: true,
    status: r.status,
    hasProduct: !!prod,
    keys: prod ? Object.keys(prod) : [],
    gtin: prod ? ["gtin", "gtin8", "gtin12", "gtin13", "gtin14"].filter((k) => prod[k]) : [],
    mpn: !!prod?.mpn,
    brand: !!prod?.brand,
  };
}

// ── werdykt ──────────────────────────────────────────────────────────────────
function verdict(r) {
  const notes = [];
  if (!r.root.isWordPress) {
    if (r.root.challenge) return { grade: "C", text: "Zablokowane przez ochronę (np. Cloudflare). Import tylko z CSV lub kluczy REST.", notes };
    return { grade: "C", text: "Brak /wp-json/ (nie WordPress, wyłączone REST albo błąd sieci). Import z CSV lub feedu XML.", notes };
  }
  const api = r.storeApi;
  if (r.root.hasStoreApi && api.fetched > 0) {
    notes.push("Stan magazynowy: Store API daje tylko flagę dostępności, nie liczbę sztuk. Liczby z CSV albo kluczy REST.");
    if (r.analysis.variable > 0) notes.push(`Produkty zmienne: ${r.analysis.variable}. Wymagają decyzji o wariantach (patrz sekcja wariantów).`);
    if (api.total != null && api.fetched < api.total) notes.push(`Pobrano ${api.fetched} z ${api.total} produktów (limit --max-pages).`);
    if (r.analysis.descriptions.pageBuilder) notes.push(`Opisy z page builderem: ${r.analysis.descriptions.pageBuilder}. Wymagają czyszczenia.`);
    if (r.images?.over4MB) notes.push(`Zdjęcia powyżej 4 MB: ${r.images.over4MB} z ${r.images.sampled} próbek. Potrzebna kompresja przy imporcie.`);
    return { grade: "A", text: "Publiczne Store API działa: import z samego adresu sklepu, bez kluczy.", notes };
  }
  if (r.root.hasRestV3 || r.restV3?.status === 401) {
    return { grade: "B", text: "Store API niedostępne, REST v3 odpowiada (wymaga kluczy). Import z kluczami albo CSV.", notes };
  }
  return { grade: "C", text: "WordPress działa, ale API sklepu jest niedostępne. Import z CSV.", notes };
}

// ── raport ───────────────────────────────────────────────────────────────────
function toMarkdown(r) {
  const a = r.analysis;
  const L = [];
  L.push(`## ${r.base}`);
  L.push(`**Ocena ${r.verdict.grade}**: ${r.verdict.text}`);
  for (const n of r.verdict.notes) L.push(`- ${n}`);
  L.push("");
  L.push(`- WordPress: ${r.root.isWordPress ? "tak" : "nie"}${r.root.siteName ? ` (${r.root.siteName})` : ""}; Store API: ${r.root.hasStoreApi ? "tak" : "nie"}; REST v3: ${r.root.hasRestV3 ? "tak" : "nie"}${r.restV3 ? ` (HTTP ${r.restV3.status})` : ""}`);
  if (r.storeApi) L.push(`- Produkty: ${r.storeApi.total ?? "?"} wg nagłówka, pobrano ${r.storeApi.fetched} (HTTP ${r.storeApi.status})`);
  if (a) {
    L.push(`- Typy: ${a.types.map((t) => `${t.name} ${t.count}`).join(", ")}; z SKU: ${a.withSku}/${a.count}; w promocji: ${a.onSale}; wiele kategorii: ${a.multiCategory}; bez zdjęcia: ${a.noImage}; średnio zdjęć: ${a.avgImages}`);
    L.push(`- Waluty: ${a.currencies.map((c) => `${c.name} ${c.count}`).join(", ") || "?"}; niedostępne: ${a.stock.outOfStock}; niski stan podany: ${a.stock.lowStockReported}`);
    L.push(`- Atrybuty: ${a.topAttributes.map((t) => `${t.name} (${t.count})`).join(", ") || "brak"}`);
    L.push(`- Opisy: puste ${a.descriptions.empty}, z <img> ${a.descriptions.withImg}, z tabelą ${a.descriptions.withTable}, z h1/h2 ${a.descriptions.withH1H2}, z shortcode ${a.descriptions.withShortcodes}, page builder ${a.descriptions.pageBuilder} (sanitizer Sellflow usuwa img, tabele, h1/h2)`);
    L.push(`- Prefiks adresu produktu: ${a.permalinkRoots.map((t) => `${t.name} ${t.count}`).join(", ")}`);
  }
  if (r.variation?.tested) {
    const v = r.variation;
    L.push(`- Warianty: produkt #${v.parentId} ma ${v.variationsListed}; lista niesie ${v.listShape.join("/") || "?"}; endpoint wariantu HTTP ${v.variationEndpointStatus}; własna cena: ${v.variationHasOwnPrice ? "tak" : "nie"}; flaga stanu: ${v.variationHasStockFlag ? "tak" : "nie"}`);
  } else if (a?.variable) L.push(`- Warianty: nie udało się sprawdzić (${r.variation?.note ?? "brak id"})`);
  if (r.categories) L.push(`- Kategorie: ${r.categories.count ?? "brak danych"} (zagnieżdżone: ${r.categories.nested ?? "?"})`);
  if (r.images) L.push(`- Zdjęcia (próbka ${r.images.sampled}): powyżej 4 MB ${r.images.over4MB}, błędy ${r.images.failed}`);
  if (r.sitemap?.path) L.push(`- Sitemap ${r.sitemap.path}: adresów produktów ${r.sitemap.productUrls}${r.storeApi?.total != null ? ` (Store API: ${r.storeApi.total})` : ""}`);
  else L.push("- Sitemap: nie znaleziono");
  if (r.wp) L.push(`- Wpisy: ${r.wp.posts.total ?? "?"} (HTTP ${r.wp.posts.status}); strony: ${r.wp.pages.total ?? "?"} (HTTP ${r.wp.pages.status}) [dane do etapu 3]`);
  if (r.jsonld?.tested) L.push(`- JSON-LD Product: ${r.jsonld.hasProduct ? `tak; GTIN: ${r.jsonld.gtin.join(",") || "brak"}; MPN: ${r.jsonld.mpn ? "tak" : "nie"}; marka: ${r.jsonld.brand ? "tak" : "nie"}` : `nie (HTTP ${r.jsonld.status})`}`);
  L.push("");
  return L.join("\n");
}

async function probeSite(raw) {
  const base = normalizeBase(raw);
  const r = { base, at: new Date().toISOString() };
  r.root = await probeRoot(base);
  if (r.root.isWordPress) {
    await sleep(PAUSE_MS);
    r.restV3 = await probeRestV3(base);
    if (r.root.hasStoreApi) {
      r.storeApi = await probeStoreApi(base, maxPages);
      r.analysis = analyzeProducts(r.storeApi.products);
      r.variation = await probeVariation(base, r.storeApi.products);
      r.images = await probeImages(r.storeApi.products);
      r.categories = await probeCategories(base);
      r.jsonld = await probeJsonLd(r.storeApi.products[0]?.permalink);
    }
    r.wp = await probeWp(base);
    r.sitemap = await probeSitemap(base);
  }
  r.verdict = verdict(r);
  if (r.storeApi) r.storeApi = { ...r.storeApi, products: undefined, sampleKeys: r.storeApi.firstKeys };
  return r;
}

const results = [];
for (const u of urls) {
  process.stderr.write(`Sonduję ${u} ...\n`);
  results.push(await probeSite(u));
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const summary = [
  `# Sonda importu WooCommerce, ${new Date().toISOString().slice(0, 10)}`,
  "",
  "| Sklep | Ocena | Produkty | Zmienne | Wniosek |",
  "|---|---|---|---|---|",
  ...results.map((r) => `| ${r.base} | ${r.verdict.grade} | ${r.storeApi?.total ?? "-"} | ${r.analysis?.variable ?? "-"} | ${r.verdict.text} |`),
  "",
  "A = Store API publiczne, B = klucze REST lub CSV, C = tylko CSV lub feed.",
  "",
  ...results.map(toMarkdown),
].join("\n");

await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, `woo-probe-${stamp}.md`), summary);
await writeFile(join(outDir, `woo-probe-${stamp}.json`), JSON.stringify(results, null, 2));
console.log(summary);
console.error(`\nZapisano w ${outDir}/woo-probe-${stamp}.{md,json}`);
