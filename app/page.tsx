import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { shops, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Smart entry point. Routes by auth + DB state, never lands on a 404:
 *
 *   anonymous           → /onboarding   (sketch flow: build first, sign up later)
 *   signed in, no shop  → /onboarding   (finish what they started)
 *   signed in, has shop → /dashboard/[slug]/orders
 *
 * AuthForm's afterLogin defaults to "/" so this central rule decides
 * the post-login destination — no /dashboard intermediate that 404s
 * against the (dashboard)/dashboard/[shop] route group.
 */
export default async function RootPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/onboarding");

  let shopSlug: string | null = null;
  try {
    const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
    if (user) {
      const shop = await db.query.shops.findFirst({ where: eq(shops.ownerId, user.id) });
      shopSlug = shop?.slug ?? null;
    }
  } catch {
    // DB unreachable — wizard renders without DB so this is still useful.
  }

  // redirect() throws, so it must stay outside the try/catch above.
  if (shopSlug) redirect(`/dashboard/${shopSlug}`);
  redirect("/onboarding");
}
