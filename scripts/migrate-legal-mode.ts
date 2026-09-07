/**
 * Migracja danych: oznacz istniejące regulaminy i polityki jako „wersja własna".
 *
 * Dokumenty prawne składają się teraz z „Danych do dokumentów" (config `legal`),
 * a `terms`/`privacy` niosą pole `mode`. Sklepy sprzed tej zmiany mają w tych
 * kluczach tekst wpisany ręcznie i ŻADNEGO `mode` — bez migracji storefront
 * uznałby je za generowane i podmienił treść, którą merchant sam napisał.
 *
 * Zasada:
 *   content niepusty, brak mode  →  mode: "custom"     (treść merchanta zostaje)
 *   content pusty,   brak mode   →  mode: "generated"  (i tak domyślne, zapisujemy wprost)
 *   mode już ustawiony           →  nie ruszamy (skrypt można puścić drugi raz)
 *
 * Uruchomienie — najpierw na sucho, potem z --apply:
 *   npx tsx --env-file=.env.local scripts/migrate-legal-mode.ts
 *   npx tsx --env-file=.env.local scripts/migrate-legal-mode.ts --apply
 */
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../lib/db";
import { shopConfig, shops } from "../lib/db/schema";

const apply = process.argv.includes("--apply");

interface Change {
  shopId: string;
  slug: string;
  key: string;
  mode: "custom" | "generated";
  value: Record<string, unknown>;
  chars: number;
}

async function main() {
  const rows = await db
    .select({
      shopId: shopConfig.shopId,
      key: shopConfig.key,
      value: shopConfig.value,
      slug: shops.slug,
    })
    .from(shopConfig)
    .innerJoin(shops, eq(shops.id, shopConfig.shopId))
    .where(inArray(shopConfig.key, ["terms", "privacy"]));

  const plan: Change[] = [];
  for (const row of rows) {
    const value = (row.value ?? {}) as Record<string, unknown>;
    if (typeof value.mode === "string") continue; // już zmigrowane
    const content = typeof value.content === "string" ? value.content : "";
    plan.push({
      shopId: row.shopId,
      slug: row.slug,
      key: row.key,
      mode: content.trim() ? "custom" : "generated",
      value,
      chars: content.trim().length,
    });
  }

  const custom = plan.filter((p) => p.mode === "custom");
  console.log(`Wierszy terms/privacy w bazie: ${rows.length}`);
  console.log(`Do zmiany: ${plan.length} — w tym ${custom.length} z własną treścią (→ "custom")\n`);
  for (const p of plan) {
    console.log(`  ${p.slug.padEnd(24)} ${p.key.padEnd(8)} → ${p.mode.padEnd(10)} ${p.chars} znaków`);
  }

  if (!apply) {
    console.log("\nPrzebieg na sucho — nic nie zapisano. Dodaj --apply, żeby wykonać.");
    return;
  }

  let done = 0;
  for (const p of plan) {
    await db
      .update(shopConfig)
      .set({ value: { ...p.value, mode: p.mode }, updatedAt: new Date() })
      // Klucz główny to (shop_id, key) — bez obu warunków ruszylibyśmy też
      // drugi dokument tego sklepu.
      .where(and(eq(shopConfig.shopId, p.shopId), eq(shopConfig.key, p.key)));
    done++;
  }
  console.log(`\nZapisano ${done} wierszy.`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
