import { db } from "./db";
import { uniqueViolation } from "./db/errors";
import { products, shopConfig, shops } from "./db/schema";
import { and, eq, inArray, or, sql, type SQL } from "drizzle-orm";

// Pure rules live in slug-rules.ts so edge code (proxy.ts) can import them
// without pulling in the database client.
import { OLD_SLUGS_KEY, RESERVED_SLUGS, SLUG_RE } from "./slug-rules";
export { SLUG_RE, RESERVED_SLUGS } from "./slug-rules";

// Each old slug stays reserved for good, so the cap stops one account from
// hoarding addresses by changing its own over and over.
const MAX_OLD_SLUGS = 5;

function oldSlugsOf(value: unknown): string[] {
  const slugs = (value as { slugs?: unknown } | null)?.slugs;
  return Array.isArray(slugs) ? slugs.filter((s): s is string => typeof s === "string") : [];
}

/**
 * WHERE condition for the shop at `slug`: the slug it has now, or one it had
 * before an address change (SEL-38). Old addresses keep working, so links in
 * sent e-mails, the notify URL of a pending Tpay payment and the URLs pasted
 * into Furgonetka don't break. Not filtered by deleted_at, like findFreeSlug.
 */
export function shopAtSlug(slug: string): SQL {
  return or(
    eq(shops.slug, slug),
    inArray(
      shops.id,
      db
        .select({ id: shopConfig.shopId })
        .from(shopConfig)
        .where(
          and(
            eq(shopConfig.key, OLD_SLUGS_KEY),
            sql`${shopConfig.value} -> 'slugs' @> ${JSON.stringify([slug])}::jsonb`
          )
        )
    )
  )!;
}

const PL_MAP: Record<string, string> = {
  ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
};

/** Zamienia tekst na slug: małe litery, polskie znaki → ASCII, reszta → "-". */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => PL_MAP[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
}

/**
 * Wolny adres produktu w obrębie JEDNEGO sklepu (dwa sklepy mogą mieć
 * „sukienka-lniana" — indeks unikalny jest na parze sklep+adres). Wzorowane na
 * tym, co blog robi od początku. `excludeId` pozwala zapisać produkt jego
 * własnym adresem przy edycji.
 */
export async function findFreeProductSlug(
  shopId: string,
  base: string,
  excludeId?: string
): Promise<string> {
  const root = slugify(base) || "produkt";
  const rows = await db
    .select({ slug: products.slug, id: products.id })
    .from(products)
    .where(eq(products.shopId, shopId));
  const taken = new Set(rows.filter((r) => r.id !== excludeId).map((r) => r.slug));
  if (!taken.has(root)) return root;
  for (let i = 2; i < 100; i++) {
    const candidate = `${root}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${root}-${Date.now()}`;
}

/**
 * Returns `base` when free, otherwise the first free of base-2…base-30,
 * with a random-suffix fallback. Single DB round-trip for all candidates.
 */
export async function findFreeSlug(base: string): Promise<string> {
  const candidates = [base, ...Array.from({ length: 29 }, (_, i) => `${base}-${i + 2}`)];
  // Deliberately NOT filtered by deleted_at: a soft-deleted shop keeps its
  // slug reserved so the freed subdomain can't be re-registered and hijacked.
  // Old slugs (SEL-38) are taken for the same reason: they still lead to the
  // shop that gave them up.
  const [taken, old] = await Promise.all([
    db.select({ slug: shops.slug }).from(shops).where(inArray(shops.slug, candidates)),
    db.select({ value: shopConfig.value }).from(shopConfig).where(eq(shopConfig.key, OLD_SLUGS_KEY)),
  ]);
  const takenSet = new Set([...taken.map((t) => t.slug), ...old.flatMap((r) => oldSlugsOf(r.value))]);
  for (const candidate of candidates) {
    if (RESERVED_SLUGS.has(candidate)) continue;
    if (!takenSet.has(candidate)) return candidate;
  }
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

export type SlugChange =
  | { ok: true; slug: string }
  | { ok: false; error: string; suggestion?: string };

/**
 * Changes a shop's address (SEL-38). The new slug must be free: not a current
 * slug of any shop (soft-deleted ones included) nor an old one. The shop may
 * go back to one of its own old slugs. The slug it leaves joins its old slugs,
 * so the old address keeps leading to it (see shopAtSlug).
 */
export async function changeShopSlug(shopId: string, raw: unknown): Promise<SlugChange> {
  const slug = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!SLUG_RE.test(slug)) {
    return {
      ok: false,
      error: "Adres ma od 3 do 50 znaków: małe litery bez polskich znaków, cyfry i myślniki. Nie zaczyna się ani nie kończy myślnikiem.",
    };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false, error: "Ten adres jest zarezerwowany dla Sellflow.", suggestion: await findFreeSlug(slug) };
  }

  const [shop, oldRow] = await Promise.all([
    db.query.shops.findFirst({ where: eq(shops.id, shopId), columns: { slug: true } }),
    db.query.shopConfig.findFirst({
      where: and(eq(shopConfig.shopId, shopId), eq(shopConfig.key, OLD_SLUGS_KEY)),
    }),
  ]);
  if (!shop) return { ok: false, error: "Nie znaleziono sklepu." };
  if (slug === shop.slug) return { ok: true, slug };

  const own = oldSlugsOf(oldRow?.value);
  if (!own.includes(slug)) {
    const [other] = await db.select({ id: shops.id }).from(shops).where(shopAtSlug(slug)).limit(1);
    if (other) {
      return { ok: false, error: "Ten adres jest już zajęty.", suggestion: await findFreeSlug(slug) };
    }
    if (own.length >= MAX_OLD_SLUGS) {
      return {
        ok: false,
        error: `Adres sklepu można zmienić najwyżej ${MAX_OLD_SLUGS} razy. Napisz do nas, jeśli potrzebujesz kolejnej zmiany.`,
      };
    }
  }

  const value = { slugs: [...own.filter((s) => s !== slug), shop.slug] };
  try {
    await db.batch([
      db.update(shops).set({ slug, updatedAt: new Date() }).where(eq(shops.id, shopId)),
      db
        .insert(shopConfig)
        .values({ shopId, key: OLD_SLUGS_KEY, value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: [shopConfig.shopId, shopConfig.key],
          set: { value, updatedAt: new Date() },
        }),
    ]);
  } catch (e) {
    // Another shop took the slug between the check and the write.
    if (uniqueViolation(e) !== "shops_slug_idx") throw e;
    return { ok: false, error: "Ten adres jest już zajęty.", suggestion: await findFreeSlug(slug) };
  }
  return { ok: true, slug };
}
