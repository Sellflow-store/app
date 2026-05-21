import AdminShell from "@/components/admin/AdminShell";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  return <AdminShell shopSlug={shop}>{children}</AdminShell>;
}
