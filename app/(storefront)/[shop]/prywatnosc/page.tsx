import { notFound } from "next/navigation";
import { getShopBySlug } from "@/lib/shop";
import StorefrontShell from "@/components/store/StorefrontShell";
import LegalDocument from "@/components/store/LegalDocument";

interface Props {
  params: Promise<{ shop: string }>;
}

export default async function PrivacyPage({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) notFound();

  return (
    <StorefrontShell shop={shop}>
      <LegalDocument title="Polityka prywatności" content={shop.privacy.content} />
    </StorefrontShell>
  );
}

export async function generateMetadata({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return {};
  return { title: `Polityka prywatności — ${shop.branding.shopName}` };
}
