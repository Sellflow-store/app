import { auth } from "@clerk/nextjs/server";
import { db } from "./db";
import { users, shops } from "./db/schema";
import { and, eq } from "drizzle-orm";

export interface ShopAccess {
  userId: string;
  shopId: string;
}

export async function getShopAccess(shopSlug: string): Promise<ShopAccess | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
  if (!user) return null;

  const shop = await db.query.shops.findFirst({
    where: and(eq(shops.slug, shopSlug), eq(shops.ownerId, user.id)),
  });
  if (!shop) return null;

  return { userId: user.id, shopId: shop.id };
}
