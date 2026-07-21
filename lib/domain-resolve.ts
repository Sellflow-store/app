import { neon } from "@neondatabase/serverless";

/**
 * Resolve a custom-domain host (e.g. "mojsklep.pl") → the shop's slug, at the
 * edge (called from proxy.ts middleware). Uses a raw neon HTTP query rather than
 * the drizzle client so the full ORM + schema is not bundled into the edge
 * middleware. neon-http runs over fetch, so it is edge-runtime compatible.
 *
 * Only shops that are live are matched — self-enabled, not operator-suspended,
 * not soft-deleted — so a parked or disabled domain resolves to null and the
 * caller can 404 instead of leaking a hidden storefront.
 *
 * Returns null on any miss or transient error; the caller treats null as
 * "unknown domain". Phase 1 pays one DB round-trip per custom-domain request;
 * a later phase can cache this (edge KV) to cut latency and DB load.
 */
export async function resolveCustomDomainSlug(host: string): Promise<string | null> {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const sql = neon(url);
    const rows = (await sql`
      SELECT slug FROM shops
      WHERE custom_domain = ${host}
        AND active = true
        AND suspended = false
        AND deleted_at IS NULL
      LIMIT 1
    `) as { slug: string }[];
    return rows[0]?.slug ?? null;
  } catch {
    return null;
  }
}

/**
 * Reverse of resolveCustomDomainSlug: given a shop slug (i.e. a request on
 * {slug}.<appDomain>), return its custom domain IF that domain is verified —
 * so the middleware can 307-redirect the subdomain to the shop's own address
 * (one canonical host). Returns null when there's no verified custom domain,
 * so the subdomain keeps serving directly. Gated on customDomainVerified (not
 * a live Vercel call) to keep this cheap on the subdomain hot path.
 */
export async function resolveVerifiedCustomDomain(slug: string): Promise<string | null> {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const sql = neon(url);
    const rows = (await sql`
      SELECT custom_domain FROM shops
      WHERE slug = ${slug}
        AND custom_domain_verified = true
        AND custom_domain IS NOT NULL
        AND active = true
        AND suspended = false
        AND deleted_at IS NULL
      LIMIT 1
    `) as { custom_domain: string }[];
    return rows[0]?.custom_domain ?? null;
  } catch {
    return null;
  }
}
