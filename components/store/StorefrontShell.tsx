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
      {/* UWAGA NA KOLEJNOŚĆ: pierwszym elementem strony musi być prawdziwy
          kontener treści. BrandTheme oddaje <link> i <style>, które React
          wynosi do <head>; jako pierwszy węzeł segmentu mają zerową wysokość
          przy górnej krawędzi okna, więc Next uznaje, że góra nowej strony
          jest już widoczna i NIE przewija na początek. Efekt: przejście
          z długiej listy produktów na krótkie FAQ zostawiało czytelnika
          w połowie strony. */}
      <div className="min-h-screen bg-paper flex flex-col">
        <BrandTheme branding={shop.branding} />
        <TopBar config={shop.home} />
        <Navbar shopSlug={shop.slug} branding={shop.branding} menuItems={shop.menu.items} />
        <main className="flex-1 w-full">{children}</main>
        <Footer shopSlug={shop.slug} branding={shop.branding} footer={shop.footer} />
      </div>
    </>
  );
}
