import type { ShopContext } from "@/types/shop";
import BrandTheme from "./BrandTheme";
import TopBar from "./TopBar";
import Navbar from "./Navbar";
import Footer from "./Footer";

/** Wspólna rama podstron storefrontu: motyw marki, TopBar, Navbar, Footer. */
export default function StorefrontShell({
  shop,
  children,
}: {
  shop: ShopContext;
  children: React.ReactNode;
}) {
  return (
    <>
      <BrandTheme branding={shop.branding} />
      <div className="min-h-screen bg-paper flex flex-col">
        <TopBar config={shop.home} />
        <Navbar shopSlug={shop.slug} branding={shop.branding} menuItems={shop.menu.items} />
        <main className="flex-1 w-full">{children}</main>
        <Footer shopSlug={shop.slug} branding={shop.branding} footer={shop.footer} />
      </div>
    </>
  );
}
