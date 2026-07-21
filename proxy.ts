import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clerkConfigured } from "@/lib/auth-env";
import { resolveCustomDomainSlug, resolveVerifiedCustomDomain } from "@/lib/domain-resolve";

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);
const isAuthRoute = createRouteMatcher(["/login(.*)", "/register(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);
const isOpsRoute = createRouteMatcher(["/ops(.*)"]);

// Old English storefront route segments → their Polish replacements. Kept so
// bookmarks and any menu still storing English hrefs 308-redirect to the new
// Polish paths instead of 404-ing. `faq` and `blog` were never renamed.
const LEGACY_STOREFRONT_SEGMENTS: Record<string, string> = {
  products: "produkty",
  about: "o-nas",
  contact: "kontakt",
  terms: "regulamin",
  privacy: "prywatnosc",
  shipping: "dostawa",
  returns: "zwroty",
  search: "szukaj",
  cart: "koszyk",
  checkout: "zamowienie",
};

// Rewrite a host-rooted storefront request onto the path-based
// /(storefront)/[shop]/... route for `shopSlug`. Shared by the subdomain and
// custom-domain branches so both resolve to the exact same storefront tree.
// Returns null for global paths (/api, /sso-callback), which must pass through
// unprefixed — the shop is keyed by slug inside those paths, not the host.
function rewriteStorefront(
  url: NextRequest["nextUrl"],
  shopSlug: string,
): NextResponse | null {
  const p = url.pathname;
  const isGlobalPath = p.startsWith("/api") || /^\/(sso-callback)(\/|$)/.test(p);
  if (isGlobalPath) return null;

  // Redirect legacy English storefront paths (/about, /terms, …) to their
  // Polish equivalents before rewriting, so old links keep working.
  const firstSeg = p.split("/")[1] ?? "";
  const polish = LEGACY_STOREFRONT_SEGMENTS[firstSeg];
  if (polish) {
    const redirectUrl = url.clone();
    redirectUrl.pathname = `/${polish}${p.slice(firstSeg.length + 1)}`;
    return NextResponse.redirect(redirectUrl, 308);
  }

  const rewriteUrl = url.clone();
  // Storefront links on a subdomain/custom domain are slug-less (see
  // storefront-base.ts), but a legacy/bookmarked /{slug}/... URL must still
  // resolve — don't prefix it twice (/{slug}/{slug}/... would 404).
  const alreadyPrefixed = p === `/${shopSlug}` || p.startsWith(`/${shopSlug}/`);
  rewriteUrl.pathname = alreadyPrefixed ? p : `/${shopSlug}${p}`;
  return NextResponse.rewrite(rewriteUrl);
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") ?? "";
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "sellflow.app";

  // ── Subdomain routing ────────────────────────────────────────────────────
  // monostore.sellflow.app → rewrite to /(storefront)/[shop]/...
  // localhost:3000 is the Sellflow platform (no subdomain)
  // Platform lives at app.<domain> — treat it as main, not a shop subdomain
  const appSubdomain = process.env.NEXT_PUBLIC_APP_SUBDOMAIN ?? "app";
  const isPlatform = hostname === `${appSubdomain}.${appDomain}`;

  const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1");
  const isVercelPreview = hostname.endsWith(".vercel.app");
  const isMainDomain = hostname === appDomain || hostname === `www.${appDomain}` || isPlatform || isVercelPreview;
  // admin.<domain> is the operator panel (app/(ops)/ops/*), not a shop.
  const isAdminHost = hostname === `admin.${appDomain}`;
  const hasSubdomain = !isLocalhost && !isMainDomain && !isAdminHost && hostname.endsWith(`.${appDomain}`);

  // ── Operator panel on admin.<domain> ─────────────────────────────────────
  // Serve the existing /ops routes here. Bare + shorthand paths get the /ops
  // prefix so admin.<domain> and admin.<domain>/shops both resolve; the /ops
  // links the panel already emits, plus auth/dashboard/api, pass through.
  // Role gate stays in app/(ops)/ops/layout.tsx; the auth guard below runs on
  // the pass-through /ops paths.
  if (isAdminHost) {
    const p = url.pathname;
    const passthrough =
      p === "/ops" ||
      p.startsWith("/ops/") ||
      p.startsWith("/api") ||
      /^\/(login|register|sso-callback)(\/|$)/.test(p);
    if (!passthrough) {
      // Everything else on the admin host is the panel: "/", the post-login
      // "/onboarding" landing, and any stray path all render /ops. Rewrite (not
      // redirect) to the panel root so the ops layout does the logged-out →
      // /login bounce, instead of auth.protect() 404-ing a /ops/<stray> path.
      const rewriteUrl = url.clone();
      rewriteUrl.pathname = "/ops";
      return NextResponse.rewrite(rewriteUrl);
    }
  } else if (hasSubdomain) {
    const shopSlug = hostname.replace(`.${appDomain}`, "");
    // If this shop has a verified custom domain, the subdomain is not its
    // canonical address — 307-redirect storefront pages there so there's one
    // public URL (no duplicate content). Global paths (/api, /sso-callback)
    // are excluded: they must keep working on the subdomain host.
    const p = url.pathname;
    const isGlobalPath = p.startsWith("/api") || /^\/(sso-callback)(\/|$)/.test(p);
    if (!isGlobalPath) {
      const verifiedDomain = await resolveVerifiedCustomDomain(shopSlug);
      if (verifiedDomain) {
        return NextResponse.redirect(`https://${verifiedDomain}${p}${url.search}`, 307);
      }
    }
    const res = rewriteStorefront(url, shopSlug);
    if (res) return res;
  }

  // ── Custom domain routing ────────────────────────────────────────────────
  // myshop.pl → resolve the shop's slug by its custom domain at the edge, then
  // rewrite onto the same path-based /(storefront)/[shop]/... tree the
  // subdomains use. The neon-http driver runs over fetch, so the lookup is
  // edge-safe. Only live shops resolve; an unknown/parked/disabled domain gets
  // a plain 404 rather than falling through to the platform landing page.
  if (!isLocalhost && !isMainDomain && !hostname.endsWith(`.${appDomain}`)) {
    const shopSlug = await resolveCustomDomainSlug(hostname);
    if (!shopSlug) {
      return new NextResponse("Sklep nie został znaleziony", { status: 404 });
    }
    const res = rewriteStorefront(url, shopSlug);
    if (res) return res;
  }

  // ── Auth guards for dashboard + ops ──────────────────────────────────────
  // Skip auth guard in dev when Clerk keys are not configured. Role check
  // for /ops lives in app/(ops)/ops/layout.tsx — middleware would need DB
  // access at the edge, so we keep it to a plain signed-in gate here.
  // Fail closed in production: a missing Clerk key there must not skip the gate.
  if (clerkConfigured() && (isDashboardRoute(req) || isOpsRoute(req))) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
