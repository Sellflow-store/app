import { neon } from "@neondatabase/serverless";
import { OLD_SLUGS_KEY } from "./slug-rules";

/**
 * Resolve a custom-domain host (e.g. "mojsklep.pl") → the shop's slug, at the
 * edge (called from proxy.ts middleware). Uses a raw neon HTTP query rather than
 * the drizzle client so the full ORM + schema is not bundled into the edge
 * middleware. neon-http runs over fetch, so it is edge-runtime compatible.
 *
 * Only shops that are live are matched — self-enabled, not operator-suspended,
 * not soft-deleted — so a parked or disabled domain resolves to null and the
 * caller can 404 instead of leaking a hidden storefront. The domain must also
 * be verified (DNS + TXT ownership, lib/domain-ownership): an unverified claim
 * is just text a merchant typed and must not route anyone's domain to a shop.
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
        AND custom_domain_verified = true
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
 * {slug}.<appDomain>), return the origin the request belongs on instead, so
 * the middleware can 307-redirect there:
 * - the shop's custom domain IF it is verified (one canonical host);
 * - for a slug the shop gave up in an address change (SEL-38, OLD_SLUGS_KEY),
 *   the subdomain of its current slug.
 * Returns null when the subdomain should keep serving directly. Gated on
 * customDomainVerified (not a live Vercel call) to keep this cheap on the
 * subdomain hot path; old slugs come in the same single query.
 */
export async function resolveSubdomainRedirect(slug: string, appDomain: string): Promise<string | null> {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const sql = neon(url);
    const rows = (await sql`
      SELECT slug, custom_domain, custom_domain_verified FROM shops
      WHERE (slug = ${slug} OR id IN (
          SELECT shop_id FROM shop_config
          WHERE key = ${OLD_SLUGS_KEY} AND value -> 'slugs' @> ${JSON.stringify([slug])}::jsonb
        ))
        AND active = true
        AND suspended = false
        AND deleted_at IS NULL
      LIMIT 1
    `) as { slug: string; custom_domain: string | null; custom_domain_verified: boolean }[];
    const shop = rows[0];
    if (!shop) return null;
    if (shop.custom_domain_verified && shop.custom_domain) return `https://${shop.custom_domain}`;
    if (shop.slug !== slug) return `https://${shop.slug}.${appDomain}`;
    return null;
  } catch {
    return null;
  }
}
