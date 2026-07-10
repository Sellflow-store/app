import { db } from "./db";
import { shops } from "./db/schema";
import { inArray } from "drizzle-orm";

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

/**
 * Slugs a shop must never claim: platform subdomains (app, www, mail, Clerk
 * hosts) — owning one would hijack that subdomain once *.sell-flow.store is
 * live — plus top-level app routes, which would shadow the storefront at
 * /{slug} and serve platform pages on the shop's subdomain.
 */
export const RESERVED_SLUGS = new Set([
  // infra / subdomeny platformy
  "app", "www", "api", "mail", "webmail", "smtp", "imap", "pop", "ftp",
  "clerk", "accounts", "clkmail", "clk", "cdn", "assets", "static", "status",
  "admin", "staging", "dev", "test", "vercel", "autodiscover", "autoconfig",
  "ns1", "ns2", "blog", "docs", "help", "support", "sklep", "shop", "store",
  // trasy aplikacji (app/*)
  "onboarding", "login", "register", "dashboard", "ops", "preview",
  "preview-shop", "sso-callback",
]);

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
    if (RESERVED_SLUGS.has(candidate)) continue;
    if (!takenSet.has(candidate)) return candidate;
  }
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}
