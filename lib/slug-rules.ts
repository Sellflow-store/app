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

/**
 * Shop name (or a raw slug) → a slug that always passes SLUG_RE: Polish
 * letters → ASCII, dash-separated, no dash at either end, 3–44 characters
 * (44 leaves room for findFreeSlug's "-2"…"-30" suffixes within SLUG_RE's 50).
 * Too-short names get "-sklep" so "OK" becomes "ok-sklep" instead of an
 * invalid slug that strands the new merchant on /onboarding/save.
 */
export function toShopSlug(raw: string): string {
  let s = (raw || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 44)
    .replace(/-+$/, "");
  if (s.length < 3) s = s ? `${s}-sklep` : "sklep";
  return s;
}
