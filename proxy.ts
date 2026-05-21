import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);
const isAuthRoute = createRouteMatcher(["/login(.*)", "/register(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") ?? "";
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "sellflow.app";

  // ── Subdomain routing ────────────────────────────────────────────────────
  // monostore.sellflow.app → rewrite to /(storefront)/[shop]/...
  // localhost:3000 is the Sellflow platform (no subdomain)
  const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1");
  const isMainDomain = hostname === appDomain || hostname === `www.${appDomain}`;
  const hasSubdomain = !isLocalhost && !isMainDomain && hostname.endsWith(`.${appDomain}`);

  if (hasSubdomain) {
    const shopSlug = hostname.replace(`.${appDomain}`, "");
    const rewriteUrl = url.clone();
    rewriteUrl.pathname = `/${shopSlug}${url.pathname}`;
    return NextResponse.rewrite(rewriteUrl);
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

  // ── Auth guards for dashboard ────────────────────────────────────────────
  // Skip auth guard in dev when Clerk keys are not configured
  const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (isDashboardRoute(req) && clerkConfigured) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
