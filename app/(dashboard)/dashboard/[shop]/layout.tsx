import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getShopAccess } from "@/lib/api";
import { clerkConfigured } from "@/lib/auth-env";
import AdminShell from "@/components/admin/AdminShell";

/** URL of the operator panel, so Sellflow staff can hop over from a shop
 *  dashboard. On the deployed hosts it lives on admin.<domain>; in local dev
 *  (single localhost origin, no subdomains) it's the plain /ops route. */
function opsHref(host: string): string {
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
  if (isLocal || !domain) return "/ops";
  return `https://admin.${domain}`;
}

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
  //
  // getShopAccess also tells us whether this is Sellflow staff (asAdmin), which
  // gates the "Panel admina" switch — computed server-side so the link never
  // reaches a merchant's browser. The /ops role gate is the real boundary.
  let staff = false;
  if (clerkConfigured()) {
    let denied = false;
    try {
      const access = await getShopAccess(shop);
      denied = access === null;
      staff = access?.asAdmin ?? false;
    } catch {
      // DB unreachable — let pages render their own degraded states
    }
    if (denied) notFound();
  }

  const host = (await headers()).get("host") ?? "";

  return (
    <AdminShell shopSlug={shop} adminHref={staff ? opsHref(host) : null}>
      {children}
    </AdminShell>
  );
}
