import { db } from "./db";
import { shops } from "./db/schema";
import { inArray } from "drizzle-orm";

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

/**
 * Returns `base` when free, otherwise the first free of base-2…base-30,
 * with a random-suffix fallback. Single DB round-trip for all candidates.
 */
export async function findFreeSlug(base: string): Promise<string> {
  const candidates = [base, ...Array.from({ length: 29 }, (_, i) => `${base}-${i + 2}`)];
  const taken = await db
    .select({ slug: shops.slug })
    .from(shops)
    .where(inArray(shops.slug, candidates));
  const takenSet = new Set(taken.map((t) => t.slug));
  for (const candidate of candidates) {
    if (!takenSet.has(candidate)) return candidate;
  }
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}
