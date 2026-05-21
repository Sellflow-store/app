import { redirect } from "next/navigation";

export default async function DashboardRoot({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  redirect(`/dashboard/${shop}/orders`);
}
