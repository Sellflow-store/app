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
