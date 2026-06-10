import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { shops, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Wizard from "@/components/onboarding/Wizard";

/**
 * Onboarding is public-by-design: anonymous visitors get the full wizard
 * + live preview, sign-up only happens at the Save step (matches the
 * "show the shop, then ask to register" flow on the project sketch).
 *
 * Logged-in users who already have a shop skip straight to the dashboard.
 */
export default async function OnboardingPage() {
  const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  let firstName = "";
  let existingSlug: string | null = null;

  if (clerkConfigured) {
    const { userId: clerkId } = await auth();
    if (clerkId) {
      try {
        const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
        if (user) {
          const shop = await db.query.shops.findFirst({ where: eq(shops.ownerId, user.id) });
          existingSlug = shop?.slug ?? null;
        }
      } catch {
        // DB not ready — fall through to wizard
      }

      const clerkUser = await currentUser();
      firstName = clerkUser?.firstName ?? "";
    }
  }

  // redirect() throws internally, so it must stay outside the try/catch —
  // …unless they're mid-Save (came back here from /register with a
  // pending payload). /onboarding/save handles that case explicitly.
  if (existingSlug) redirect(`/dashboard/${existingSlug}/orders`);

  return <Wizard firstName={firstName} />;
}
