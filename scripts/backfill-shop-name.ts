/**
 * Migracja danych: jedna nazwa sklepu (SEL-38).
 *
 * Nazwa żyła w dwóch polach, które się nie synchronizowały: `branding.shopName`
 * (Logo i kolorystyka; czyta je sklep i regulamin) i `shops.name` (Ustawienia;
 * czytają je maile, Tpay i dane do przelewu). Od 0.14.9 API zapisuje oba pola
 * naraz, a ta migracja wyrównuje sklepy sprzed tej zmiany.
 *
 * Zasada:
 *   branding.shopName niepusty, inny niż shops.name  →  shops.name = branding.shopName
 *     (tę nazwę klienci widzą w sklepie i w regulaminie)
 *   branding.shopName pusty albo brak                 →  branding.shopName = shops.name
 *   nazwy równe                                       →  nie ruszamy (skrypt można puścić drugi raz)
 *
 * Uruchomienie — najpierw na sucho, potem z --apply:
 *   npx tsx --env-file=.env.local scripts/backfill-shop-name.ts
 *   npx tsx --env-file=.env.local scripts/backfill-shop-name.ts --apply
 */
import { and, eq, sql } from "drizzle-orm";
import { db } from "../lib/db";
import { shopConfig, shops } from "../lib/db/schema";

const apply = process.argv.includes("--apply");

interface Change {
  shopId: string;
  slug: string;
  field: "shops.name" | "branding.shopName";
  from: string;
  to: string;
}

async function main() {
  const rows = await db
    .select({ id: shops.id, slug: shops.slug, name: shops.name, branding: shopConfig.value })
    .from(shops)
    .leftJoin(shopConfig, and(eq(shopConfig.shopId, shops.id), eq(shopConfig.key, "branding")));

  const plan: Change[] = [];
  for (const row of rows) {
    const raw = (row.branding as Record<string, unknown> | null)?.shopName;
    const brandingName = typeof raw === "string" ? raw.trim() : "";
    if (!brandingName) {
      plan.push({ shopId: row.id, slug: row.slug, field: "branding.shopName", from: String(raw ?? ""), to: row.name });
    } else if (brandingName !== row.name) {
      plan.push({ shopId: row.id, slug: row.slug, field: "shops.name", from: row.name, to: brandingName });
    }
  }

  console.log(`Sklepów w bazie: ${rows.length}`);
  console.log(`Do zmiany: ${plan.length}\n`);
  for (const p of plan) {
    console.log(`  ${p.slug.padEnd(24)} ${p.field.padEnd(18)} „${p.from}” → „${p.to}”`);
  }

  if (!apply) {
    console.log("\nPrzebieg na sucho — nic nie zapisano. Dodaj --apply, żeby wykonać.");
    return;
  }

  let done = 0;
  for (const p of plan) {
    if (p.field === "shops.name") {
      await db.update(shops).set({ name: p.to, updatedAt: new Date() }).where(eq(shops.id, p.shopId));
    } else {
      // Merge jak w API configu: reszta brandingu zostaje.
      await db
        .insert(shopConfig)
        .values({ shopId: p.shopId, key: "branding", value: { shopName: p.to }, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: [shopConfig.shopId, shopConfig.key],
          set: { value: sql`${shopConfig.value} || excluded.value`, updatedAt: new Date() },
        });
    }
    done++;
  }
  console.log(`\nZapisano ${done} zmian.`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
