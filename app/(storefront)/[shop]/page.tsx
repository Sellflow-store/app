import { notFound } from "next/navigation";
import { getShopBySlug } from "@/lib/shop";
import BrandTheme from "@/components/store/BrandTheme";
import TopBar from "@/components/store/TopBar";
import Navbar from "@/components/store/Navbar";
import HeroSection from "@/components/store/HeroSection";
import ProductsSection from "@/components/store/ProductsSection";
import LookbookSection from "@/components/store/LookbookSection";
import BenefitsSection from "@/components/store/BenefitsSection";
import ReviewsSection from "@/components/store/ReviewsSection";
import GuaranteeSection from "@/components/store/GuaranteeSection";
import Footer from "@/components/store/Footer";
import NewsletterPopup from "@/components/store/NewsletterPopup";

interface Props {
  params: Promise<{ shop: string }>;
}

export default async function StorefrontHome({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);

  if (!shop) notFound();

  // Pasek nawigacji kładziemy na zdjęciu tylko w układzie „cover" i tylko gdy
  // nad nim nie ma paska promocyjnego — fixed navbar zasłoniłby TopBar.
  const coverHero = shop.home.hero.layout === "cover" && !!shop.home.hero.image;
  const overlayNav = coverHero && !shop.home.topBar.visible;

  return (
    <>
      <BrandTheme branding={shop.branding} />
      <div className="min-h-screen bg-paper">
        <TopBar config={shop.home} />
        <Navbar
          shopSlug={shop.slug}
          branding={shop.branding}
          menuItems={shop.menu.items}
          overlay={overlayNav}
          overlayTone={shop.home.hero.overlayTone}
        />
        <HeroSection config={shop.home.hero} shopSlug={shop.slug} />
        <LookbookSection config={shop.home.lookbook} shopSlug={shop.slug} />
        <ProductsSection
          config={shop.home.products}
          products={shop.products}
          shopSlug={shop.slug}
          cardStyle={shop.branding.cardStyle}
        />
        {(shop.home.benefits.placement ?? "home") !== "about" &&
          shop.home.benefits.placement !== "hidden" && (
            <BenefitsSection config={shop.home.benefits} />
          )}
        <ReviewsSection config={shop.home.reviews} />
        <GuaranteeSection config={shop.home.guarantee} />
        <Footer shopSlug={shop.slug} branding={shop.branding} footer={shop.footer} />
        <NewsletterPopup shopSlug={shop.slug} config={shop.home.popup} />
      </div>
    </>
  );
}

export async function generateMetadata({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return {};
  return {
    title: shop.branding.shopName,
    description: shop.home.hero.description,
  };
}
