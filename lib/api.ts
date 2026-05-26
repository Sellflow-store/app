import { auth } from "@clerk/nextjs/server";
import { db } from "./db";
import { users, shops } from "./db/schema";
import { and, eq } from "drizzle-orm";

export interface ShopAccess {
  userId: string;
  shopId: string;
  /** True when the access was granted via the admin role bypass. The
   *  dashboard can use this to surface a "viewing as admin" banner. */
  asAdmin: boolean;
}

/**
 * Resolve dashboard access for the current Clerk user.
 *
 * Merchants only see shops they own. Sellflow staff (`users.role = 'admin'`)
 * see every shop — that's how /ops "Login as owner" works without minting
 * fake sessions: the admin's real Clerk session just bypasses the ownership
 * check at the dashboard layer.
 */
export async function getShopAccess(shopSlug: string): Promise<ShopAccess | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
  if (!user) return null;

  if (user.role === "admin") {
    const shop = await db.query.shops.findFirst({ where: eq(shops.slug, shopSlug) });
    if (!shop) return null;
    return { userId: user.id, shopId: shop.id, asAdmin: true };
  }

  const shop = await db.query.shops.findFirst({
    where: and(eq(shops.slug, shopSlug), eq(shops.ownerId, user.id)),
  });
  if (!shop) return null;

  return { userId: user.id, shopId: shop.id, asAdmin: false };
}

/** True if the currently signed-in user has role=admin. Used by /ops gate
 *  in proxy.ts and as a defence-in-depth check on server pages. */
export async function isAdmin(): Promise<boolean> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return false;
  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  return user?.role === "admin";
}

/** Comma-separated emails from SELLFLOW_ADMIN_EMAILS, normalised. Used by
 *  /api/onboarding to promote configured emails on first sign-up. */
export function adminEmailAllowlist(): string[] {
  const raw = process.env.SELLFLOW_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
