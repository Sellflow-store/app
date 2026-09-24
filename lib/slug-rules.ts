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
