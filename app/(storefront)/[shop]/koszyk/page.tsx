import { notFound } from "next/navigation";
import { getShopBySlug } from "@/lib/shop";
import BrandTheme from "@/components/store/BrandTheme";
import TopBar from "@/components/store/TopBar";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import CartView from "@/components/store/CartView";
import AddFromLink from "@/components/store/AddFromLink";
import type { StorefrontProduct } from "@/types/shop";
import { getCartOffers } from "@/lib/cart-offers";

interface Props {
  params: Promise<{ shop: string }>;
  searchParams?: Promise<{ dodaj?: string }>;
}

/** `?dodaj=slug[:ilość][:rozmiar],…` → pozycje koszyka. Pomija produkty
 *  bez ceny, wyprzedane i te z rozmiarami, gdy rozmiaru brak lub jest zły. */
function itemsFromLink(raw: string | undefined, products: StorefrontProduct[]) {
  if (!raw) return [];
  return raw
    .split(",")
    .slice(0, 20)
    .flatMap((part) => {
      const [slug, qtyRaw, sizeRaw] = part.split(":").map((x) => decodeURIComponent(x ?? "").trim());
      const p = products.find((x) => x.slug === slug);
      if (!p || p.priceOnRequest || (p.stock != null && p.stock <= 0)) return [];
      const size = sizeRaw ? p.sizes.find((s) => s.toLowerCase() === sizeRaw.toLowerCase()) : undefined;
      if (p.sizes.length > 0 && !size) return [];
      const qty = Math.min(99, Math.max(1, parseInt(qtyRaw || "1", 10) || 1));
      return [{
        productId: p.id,
        slug: p.slug,
        name: p.name,
        price: p.price,
        image: p.images[0] ?? null,
        size: size ?? null,
        stock: p.stock,
        type: p.type,
        qty,
      }];
    });
}

export default async function CartPage({ params, searchParams }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) notFound();
  const linkItems = itemsFromLink((await searchParams)?.dodaj, shop.products);
  const offers = await getCartOffers(shop.id);

  return (
    <>
      <BrandTheme branding={shop.branding} />
      <div className="min-h-screen bg-paper flex flex-col">
        <TopBar config={shop.home} />
        <Navbar shopSlug={shop.slug} branding={shop.branding} menuItems={shop.menu.items} />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <AddFromLink shopSlug={shop.slug} items={linkItems} />
          <CartView shopSlug={shop.slug} freeShippingFrom={shop.delivery.freeShippingFrom} offers={offers} />
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
  return { title: `Koszyk` };
}
