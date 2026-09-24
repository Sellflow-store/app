import { createHmac, timingSafeEqual } from "crypto";

// Double opt-in without a schema change: the confirmation link carries the
// shop id, the address and an expiry, signed with a server secret. The
// subscriber row is written only when the link is opened, so an address typed
// in by someone else never lands on the list.

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function key(): Buffer | null {
  const secret = process.env.NEWSLETTER_SECRET || process.env.CLERK_SECRET_KEY;
  if (!secret) return null;
  // Derived key: the Clerk secret itself never signs anything user-visible.
  return createHmac("sha256", secret).update("sellflow:newsletter-confirm:v1").digest();
}

const b64url = (b: Buffer) => b.toString("base64url");

export function signNewsletterToken(shopId: string, email: string, now = Date.now()): string | null {
  const k = key();
  if (!k) return null;
  const payload = b64url(Buffer.from(JSON.stringify({ s: shopId, e: email, x: now + TTL_MS })));
  const sig = b64url(createHmac("sha256", k).update(payload).digest());
  return `${payload}.${sig}`;
}

export function verifyNewsletterToken(
  token: string,
  now = Date.now(),
): { shopId: string; email: string } | null {
  const k = key();
  if (!k) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", k).update(payload).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      s?: unknown;
      e?: unknown;
      x?: unknown;
    };
    if (typeof data.s !== "string" || typeof data.e !== "string" || typeof data.x !== "number") return null;
    if (data.x < now) return null;
    return { shopId: data.s, email: data.e };
  } catch {
    return null;
  }
}
