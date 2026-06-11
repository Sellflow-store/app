import { notFound } from "next/navigation";
import { getShopAccess } from "@/lib/api";
import AdminShell from "@/components/admin/AdminShell";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;

  // Ownership guard: a signed-in user only sees panels of shops they own.
  // Skipped in dev without Clerk; data is still protected at the API layer.
  const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (clerkConfigured) {
    let denied = false;
    try {
      denied = (await getShopAccess(shop)) === null;
    } catch {
      // DB unreachable — let pages render their own degraded states
    }
    if (denied) notFound();
  }

  return <AdminShell shopSlug={shop}>{children}</AdminShell>;
}
