import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { shops, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Wizard from "@/components/onboarding/Wizard";

export default async function OnboardingPage() {
  const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  let firstName = "";

  // Auth + dedupe-shop guard only runs when Clerk is configured. In dev
  // without keys, the wizard renders standalone so the UI can be iterated
  // without setting up Clerk + DB.
  if (clerkConfigured) {
    const { userId: clerkId } = await auth();
    if (!clerkId) redirect("/login");

    try {
      const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
      if (user) {
        const shop = await db.query.shops.findFirst({ where: eq(shops.ownerId, user.id) });
        if (shop) redirect(`/dashboard/${shop.slug}/orders`);
      }
    } catch {
      // DB not ready — continue to wizard
    }

    const clerkUser = await currentUser();
    firstName = clerkUser?.firstName ?? "";
  }

  return <Wizard firstName={firstName} />;
}
