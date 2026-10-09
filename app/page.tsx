import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

/**
 * Smart entry point. Routes by auth state, never lands on a 404:
 *
 *   anonymous  → /onboarding   (sketch flow: build first, sign up later)
 *   signed in  → /dashboard    (DashboardResolver: the user's shop, or
 *                               /onboarding when they have none yet)
 *
 * AuthForm's afterLogin defaults to "/" so this central rule decides the
 * post-login destination. The shop lookup lives only in DashboardResolver —
 * a copy here once swallowed its redirect() inside a try/catch.
 */
export default async function RootPage() {
  const { userId: clerkId } = await auth();
  redirect(clerkId ? "/dashboard" : "/onboarding");
}
