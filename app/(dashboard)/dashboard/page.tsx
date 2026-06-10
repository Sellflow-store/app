import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { shops, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardResolver() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/login");

  let shopSlug: string | null = null;
  try {
    const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
    if (user) {
      const shop = await db.query.shops.findFirst({ where: eq(shops.ownerId, user.id) });
      shopSlug = shop?.slug ?? null;
    }
  } catch {
    // DB not ready — send to onboarding, which tolerates the same state
  }

  if (shopSlug) redirect(`/dashboard/${shopSlug}/orders`);
  redirect("/onboarding");
}
