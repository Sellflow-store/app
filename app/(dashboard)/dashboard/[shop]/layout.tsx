import { notFound } from "next/navigation";
import { getShopAccess } from "@/lib/api";
import { clerkConfigured } from "@/lib/auth-env";
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
  // Skipped in local dev without Clerk; enforced in production even if the key
  // is missing (clerkConfigured fails closed there). Data is also protected at
  // the API layer regardless.
  if (clerkConfigured()) {
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
