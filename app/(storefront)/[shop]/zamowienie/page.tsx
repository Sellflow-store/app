import { notFound } from "next/navigation";
import { getShopBySlug } from "@/lib/shop";
import BrandTheme from "@/components/store/BrandTheme";
import TopBar from "@/components/store/TopBar";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import CheckoutForm from "@/components/store/CheckoutForm";

interface Props {
  params: Promise<{ shop: string }>;
}

export default async function CheckoutPage({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) notFound();

  const enabledMethods = shop.delivery.methods.filter((m) => m.enabled);

  return (
    <>
      <BrandTheme branding={shop.branding} />
      <div className="min-h-screen bg-paper flex flex-col">
        <TopBar config={shop.home} />
        <Navbar shopSlug={shop.slug} branding={shop.branding} menuItems={shop.menu.items} />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <CheckoutForm
            shopSlug={shop.slug}
            deliveryMethods={enabledMethods}
            freeShippingFrom={shop.delivery.freeShippingFrom}
            transferEnabled={shop.checkout.transferEnabled}
            codEnabled={shop.checkout.codEnabled}
            codFee={shop.checkout.codFee}
          />
        </main>
        <Footer shopSlug={shop.slug} branding={shop.branding} footer={shop.footer} />
      </div>
    </>
  );
}

export async function generateMetadata({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return {};
  return { title: `Zamówienie — ${shop.branding.shopName}` };
}
