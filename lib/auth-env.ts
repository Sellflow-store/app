// Whether Clerk auth is wired up for this deployment.
//
// The old code gated the dashboard/ops guards and the onboarding identity check
// directly on `!!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — which meant a
// missing key silently DISABLED auth (fail-open). That's the correct behaviour
// in local dev (no keys → skip the guard so the wizard round-trips), but in
// production a dropped/rotated-out env var would take the guards down with it.
//
// So we fail closed in production: if the key is absent there, we still report
// "configured" so the guards run `auth()` / `auth.protect()`, which then deny
// for lack of a valid session instead of waving everyone through.

export function isProduction(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

export function clerkConfigured(): boolean {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return true;
  return isProduction();
}
