import { NextResponse } from "next/server";

// Lightweight in-process rate limiter (fixed window). No external deps and no
// configuration required, so it works out of the box on Vercel. Caveat: the
// counters live per serverless instance, so under horizontal scale the limit
// is approximate — enough to blunt brute-force and spam at MVP traffic. When
// the platform outgrows a single warm instance, swap the store for Upstash
// Ratelimit (drop-in: same call sites, replace the Map with a Redis INCR).

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function hit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();

  // Opportunistic cleanup so the Map can't grow unbounded across many keys.
  if (now - lastSweep > 60_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    lastSweep = now;
  }

  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  b.count++;

  return { ok: b.count <= limit, retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Enforce a per-IP limit for a named bucket. Returns a ready-to-send 429
 * (with Retry-After) when the caller is over the limit, or null to proceed.
 *
 *   const limited = checkRateLimit(req, `orders:${slug}`, 20, 60_000);
 *   if (limited) return limited;
 */
export function checkRateLimit(
  req: Request,
  name: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const { ok, retryAfterSec } = hit(`${name}:${clientIp(req)}`, limit, windowMs);
  if (ok) return null;
  return NextResponse.json(
    { error: "Zbyt wiele żądań. Odczekaj chwilę i spróbuj ponownie." },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}
