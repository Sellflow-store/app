import { notFound } from "next/navigation";
import { getShopBySlug } from "@/lib/shop";
import StorefrontShell from "@/components/store/StorefrontShell";
import BenefitsSection from "@/components/store/BenefitsSection";

interface Props {
  params: Promise<{ shop: string }>;
}

export default async function AboutPage({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) notFound();

  const { headline, content } = shop.about;
  // Sekcja „korzyści" ze strony głównej może mieszkać tutaj — przy markach
  // z autorską historią czyta się lepiej pod tekstem o marce niż między
  // produktami a stopką.
  const placement = shop.home.benefits.placement ?? "home";
  const showBenefits = placement === "about" || placement === "both";

  return (
    <StorefrontShell shop={shop}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-8">
          {headline || "O nas"}
        </h1>
        {content.trim() ? (
          <div className="text-sm text-ink-2 font-light leading-relaxed whitespace-pre-line">
            {content}
          </div>
        ) : (
          <p className="text-sm text-ink-2/70 font-light">
            {shop.branding.shopName} — sklep z pasją. Więcej o nas już wkrótce.
          </p>
        )}
      </div>
      {showBenefits && <BenefitsSection config={shop.home.benefits} />}
    </StorefrontShell>
  );
}

export async function generateMetadata({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return {};
  return { title: `O nas` };
}
