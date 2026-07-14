import { headers } from "next/headers";

/**
 * Prefix for in-store links. On a shop subdomain (monostore.sell-flow.store) or
 * a custom domain the storefront is served at the host root, so links must be
 * slug-less ("/products"). On the app host / localhost / Vercel preview the same
 * storefront is path-based ("/{slug}/products"). Mirrors the host classification
 * in proxy.ts so the rewrite and the emitted links always agree.
 *
 * Returns "" (base-less) on a subdomain/custom domain, "/{slug}" otherwise.
 */
export async function storefrontBase(slug: string): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "";
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "sellflow.app";
  const appSubdomain = process.env.NEXT_PUBLIC_APP_SUBDOMAIN ?? "app";

  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
  const isVercelPreview = host.endsWith(".vercel.app");
  const isPlatform = host === `${appSubdomain}.${appDomain}`;
  const isMain =
    host === appDomain || host === `www.${appDomain}` || isPlatform || isVercelPreview;
  const isAdmin = host === `admin.${appDomain}`;
  const onShopSubdomain =
    !isLocalhost && !isMain && !isAdmin && host.endsWith(`.${appDomain}`);
  const onCustomDomain = !isLocalhost && !isMain && !host.endsWith(`.${appDomain}`);

  return onShopSubdomain || onCustomDomain ? "" : `/${slug}`;
}
