import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { shops, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import OnboardingForm from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/login");

  // If user already has a shop, skip onboarding
  try {
    const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
    if (user) {
      const shop = await db.query.shops.findFirst({ where: eq(shops.ownerId, user.id) });
      if (shop) redirect(`/dashboard/${shop.slug}/orders`);
    }
  } catch {
    // DB not ready — continue to form
  }

  const clerkUser = await currentUser();
  const firstName = clerkUser?.firstName ?? "";

  return <OnboardingForm firstName={firstName} />;
}
