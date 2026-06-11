import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;

  const access = await getShopAccess(shopSlug);
  if (!access) notFound();

  const shop = await db.query.shops.findFirst({ where: eq(shops.id, access.shopId) });
  if (!shop) notFound();

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "sell-flow.store";

  return (
    <SettingsForm
      shopSlug={shop.slug}
      initialName={shop.name}
      initialActive={shop.active}
      storeUrl={`https://${shop.slug}.${appDomain}`}
    />
  );
}
