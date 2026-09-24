/**
 * Przygotowanie bazy pod PR „onboarding + domeny". Puścić PRZED wdrożeniem
 * i PRZED `drizzle-kit push`.
 *
 * 1. Unikalny indeks shops.owner_id (jeden sklep na konto). Push nie przejdzie,
 *    jeśli ktoś już ma dwa sklepy (efekt dawnego wyścigu w onboardingu).
 *    Skrypt tylko je wypisuje: który zostaje, decyduje człowiek.
 *
 * 2. Routing domen własnych obsługuje teraz tylko domeny zweryfikowane.
 *    Flaga custom_domain_verified była odświeżana wyłącznie wtedy, gdy merchant
 *    otworzył panel domeny, więc działająca domena mogła mieć false i po
 *    wdrożeniu zwróciłaby 404. Skrypt pyta Vercel o status każdej takiej domeny
 *    i ustawia true tam, gdzie DNS i Vercel są w porządku. Te domeny działają
 *    dalej bez rekordu TXT (jak w lib/domain-ownership: wasVerified).
 *
 * Uruchomienie — najpierw na sucho, potem z --apply:
 *   npx tsx --env-file=.env.local scripts/prepare-domains-onboarding.ts
 *   npx tsx --env-file=.env.local scripts/prepare-domains-onboarding.ts --apply
 * Wymaga DATABASE_URL oraz VERCEL_TOKEN / VERCEL_PROJECT_ID (/ VERCEL_TEAM_ID).
 */
import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "../lib/db";
import { shops, users } from "../lib/db/schema";

const apply = process.argv.includes("--apply");

// lib/vercel-domains.ts importuje "server-only", więc tu wołamy API wprost.
async function vercelHealthy(domain: string): Promise<boolean | null> {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) return null;
  const team = process.env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}` : "";
  const headers = { Authorization: `Bearer ${token}` };
  const [dom, cfg] = await Promise.all([
    fetch(`https://api.vercel.com/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}${team}`, { headers }),
    fetch(`https://api.vercel.com/v6/domains/${encodeURIComponent(domain)}/config${team}`, { headers }),
  ]);
  if (!dom.ok || !cfg.ok) return false;
  const d = (await dom.json()) as { verified?: boolean };
  const c = (await cfg.json()) as { misconfigured?: boolean };
  return Boolean(d.verified) && c.misconfigured === false;
}

async function main() {
  // ── 1. Duplicated owners ────────────────────────────────────────────────
  const dupes = await db
    .select({
      ownerId: shops.ownerId,
      email: users.email,
      count: sql<number>`count(*)::int`,
      slugs: sql<string>`string_agg(${shops.slug} || CASE WHEN ${shops.deletedAt} IS NOT NULL THEN ' (usunięty)' ELSE '' END, ', ' ORDER BY ${shops.createdAt})`,
    })
    .from(shops)
    .innerJoin(users, eq(users.id, shops.ownerId))
    .groupBy(shops.ownerId, users.email)
    .having(sql`count(*) > 1`);

  if (dupes.length === 0) {
    console.log("1. Właściciele: każdy ma jeden sklep, unikalny indeks przejdzie.");
  } else {
    console.log(`1. UWAGA: ${dupes.length} kont ma więcej niż jeden sklep. Push indeksu się nie uda, dopóki tego nie rozwiążesz:`);
    for (const d of dupes) console.log(`   ${d.email}: ${d.count} sklepy (${d.slugs})`);
  }

  // ── 2. Custom domains that work but were never flagged verified ─────────
  const pending = await db
    .select({ id: shops.id, slug: shops.slug, domain: shops.customDomain })
    .from(shops)
    .where(and(isNotNull(shops.customDomain), eq(shops.customDomainVerified, false), isNull(shops.deletedAt)));

  console.log(`\n2. Domeny z flagą verified=false: ${pending.length}`);
  let toFix = 0;
  for (const s of pending) {
    const healthy = await vercelHealthy(s.domain!);
    if (healthy === null) {
      console.log("   Brak VERCEL_TOKEN / VERCEL_PROJECT_ID: nie da się sprawdzić statusu. Przerwano.");
      process.exit(1);
    }
    console.log(`   ${s.slug} → ${s.domain}: ${healthy ? "działa, ustawiam verified" : "nie działa (zostaje false)"}`);
    if (healthy) {
      toFix++;
      if (apply) await db.update(shops).set({ customDomainVerified: true }).where(eq(shops.id, s.id));
    }
  }

  console.log(
    apply
      ? `\nZapisano verified=true dla ${toFix} domen.`
      : `\nNa sucho: ${toFix} domen do oznaczenia. Uruchom z --apply, żeby zapisać.`,
  );
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
