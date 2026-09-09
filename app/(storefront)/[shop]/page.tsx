import { notFound } from "next/navigation";
import { getShopBySlug } from "@/lib/shop";
import { storefrontBase } from "@/lib/storefront-base";
import { absoluteUrl, jsonLdProps, shopOrigin } from "@/lib/seo";
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

  const [base, origin] = await Promise.all([storefrontBase(shop.slug), shopOrigin()]);
  const home = absoluteUrl(origin, base);

  // Tożsamość sklepu dla wyszukiwarki: nazwa, logo i kanały kontaktu w jednym
  // miejscu, żeby wyniki nie sklejały marki z przypadkowych fragmentów strony.
  const orgLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: shop.branding.shopName,
    url: home,
  };
  if (shop.branding.logoUrl) orgLd.logo = shop.branding.logoUrl;
  if (shop.about.content?.trim()) orgLd.description = shop.about.content.slice(0, 300);
  if (shop.about.email || shop.about.phone) {
    orgLd.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer support",
      ...(shop.about.email ? { email: shop.about.email } : {}),
      ...(shop.about.phone ? { telephone: shop.about.phone } : {}),
    };
  }
  const socials = Object.values(shop.footer.social ?? {}).filter(
    (v): v is string => typeof v === "string" && v.trim().length > 0
  );
  if (socials.length > 0) orgLd.sameAs = socials;

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: shop.branding.shopName,
    url: home,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl(origin, base, "/szukaj")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script {...jsonLdProps(orgLd)} />
      <script {...jsonLdProps(websiteLd)} />
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
  const base = await storefrontBase(shop.slug);
  return {
    title: shop.branding.shopName,
    description: shop.home.hero.description,
    alternates: { canonical: base || "/" },
  };
}
