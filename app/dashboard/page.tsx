import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { shops, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Bare /dashboard hits this — AuthForm + RootPage default to it because
 * neither knows which shop slug the user owns. Look the shop up, then
 * forward to /dashboard/[slug]/orders (or /onboarding if they don't have
 * one yet).
 *
 * Lives at /app/dashboard/page.tsx (outside the (dashboard) route group)
 * so it doesn't clash with /app/(dashboard)/dashboard/[shop]/page.tsx.
 */
export default async function DashboardIndexPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/login");

  try {
    const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
    if (user) {
      const shop = await db.query.shops.findFirst({ where: eq(shops.ownerId, user.id) });
      if (shop) redirect(`/dashboard/${shop.slug}/orders`);
    }
  } catch {
    // DB unreachable — fall through to onboarding, which renders without DB.
  }

  redirect("/onboarding");
}
