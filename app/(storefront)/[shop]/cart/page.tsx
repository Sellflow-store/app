import { notFound } from "next/navigation";
import { getShopBySlug } from "@/lib/shop";
import BrandTheme from "@/components/store/BrandTheme";
import TopBar from "@/components/store/TopBar";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import CartView from "@/components/store/CartView";

interface Props {
  params: Promise<{ shop: string }>;
}

export default async function CartPage({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) notFound();

  return (
    <>
      <BrandTheme branding={shop.branding} />
      <div className="min-h-screen bg-paper flex flex-col">
        <TopBar config={shop.home} />
        <Navbar shopSlug={shop.slug} branding={shop.branding} menuItems={shop.menu.items} />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <CartView shopSlug={shop.slug} freeShippingFrom={shop.delivery.freeShippingFrom} />
        </main>
        <Footer shopSlug={shop.slug} branding={shop.branding} />
      </div>
    </>
  );
}

export async function generateMetadata({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return {};
  return { title: `Koszyk — ${shop.branding.shopName}` };
}
