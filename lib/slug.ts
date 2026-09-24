import { db } from "./db";
import { products, shops } from "./db/schema";
import { eq, inArray } from "drizzle-orm";

// Pure rules live in slug-rules.ts so edge code (proxy.ts) can import them
// without pulling in the database client.
import { RESERVED_SLUGS } from "./slug-rules";
export { SLUG_RE, RESERVED_SLUGS } from "./slug-rules";

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
  const taken = await db
    .select({ slug: shops.slug })
    .from(shops)
    .where(inArray(shops.slug, candidates));
  const takenSet = new Set(taken.map((t) => t.slug));
  for (const candidate of candidates) {
    if (RESERVED_SLUGS.has(candidate)) continue;
    if (!takenSet.has(candidate)) return candidate;
  }
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}
