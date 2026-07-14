import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clerkConfigured } from "@/lib/auth-env";

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);
const isAuthRoute = createRouteMatcher(["/login(.*)", "/register(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);
const isOpsRoute = createRouteMatcher(["/ops(.*)"]);

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
    const p = url.pathname;
    // API routes are global (the shop is keyed by slug inside the path, e.g.
    // /api/shops/{slug}/orders) and auth callbacks are host-level — neither may
    // get the shop prefix, or the fetch 404s. Everything else is a storefront
    // page and gets rewritten to the path-based /(storefront)/[shop]/... route.
    const isGlobalPath = p.startsWith("/api") || /^\/(sso-callback)(\/|$)/.test(p);
    if (!isGlobalPath) {
      const rewriteUrl = url.clone();
      // Storefront links on a subdomain are now slug-less (see storefront-base.ts),
      // but a legacy/bookmarked /{slug}/... URL must still resolve — don't prefix
      // it twice (/{slug}/{slug}/... would 404).
      const alreadyPrefixed = p === `/${shopSlug}` || p.startsWith(`/${shopSlug}/`);
      rewriteUrl.pathname = alreadyPrefixed ? p : `/${shopSlug}${p}`;
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  // ── Custom domain routing ────────────────────────────────────────────────
  // myshop.pl → look up shop by custom domain (handled via DB at page level)
  // For non-sellflow.app, non-localhost hosts we pass shopDomain header
  if (!isLocalhost && !isMainDomain && !hostname.endsWith(`.${appDomain}`)) {
    const rewriteUrl = url.clone();
    rewriteUrl.pathname = `/_custom${url.pathname}`;
    const response = NextResponse.rewrite(rewriteUrl);
    response.headers.set("x-shop-domain", hostname);
    return response;
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
