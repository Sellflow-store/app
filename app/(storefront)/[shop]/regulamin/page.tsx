import { notFound } from "next/navigation";
import { getShopBySlug } from "@/lib/shop";
import StorefrontShell from "@/components/store/StorefrontShell";
import LegalDocument from "@/components/store/LegalDocument";

interface Props {
  params: Promise<{ shop: string }>;
}

export default async function TermsPage({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) notFound();

  return (
    <StorefrontShell shop={shop}>
      <LegalDocument title="Regulamin sklepu" content={shop.terms.content} />
    </StorefrontShell>
  );
}

export async function generateMetadata({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return {};
  return { title: `Regulamin — ${shop.branding.shopName}` };
}
