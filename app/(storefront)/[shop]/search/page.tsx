import { notFound } from "next/navigation";
import { getShopBySlug } from "@/lib/shop";
import { storefrontBase } from "@/lib/storefront-base";
import StorefrontShell from "@/components/store/StorefrontShell";
import ProductCard from "@/components/store/ProductCard";
import { searchProducts } from "@/lib/storefront-products";

interface Props {
  params: Promise<{ shop: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { shop: shopSlug } = await params;
  const { q = "" } = await searchParams;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) notFound();
  const base = await storefrontBase(shop.slug);

  const query = q.trim();
  const results = query.length >= 2 ? searchProducts(shop.products, query) : [];

  return (
    <StorefrontShell shop={shop}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="mb-10">
          <p className="text-[11px] tracking-[0.2em] uppercase text-ink-2/70 mb-2">Wyszukiwanie</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            {query ? `Wyniki dla „${query}”` : "Wyszukiwarka"}
          </h1>
          {query.length >= 2 && (
            <p className="text-sm text-ink-2/70 mt-3">
              {results.length === 0
                ? "Brak produktów pasujących do zapytania."
                : `Znaleziono ${results.length} ${results.length === 1 ? "produkt" : "produktów"}.`}
            </p>
          )}
        </div>

        {query.length < 2 ? (
          <p className="text-sm text-ink-2/70 font-light py-12">
            Wpisz co najmniej 2 znaki, aby wyszukać produkty.
          </p>
        ) : results.length === 0 ? (
          <p className="text-sm text-ink-2/70 font-light py-12">
            Spróbuj innej frazy lub przejrzyj{" "}
            <a href={`${base}/products`} className="text-ink underline underline-offset-4">
              wszystkie produkty
            </a>
            .
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {results.map((product, i) => (
              <ProductCard key={product.id} product={product} shopSlug={shop.slug} index={i} />
            ))}
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}

export async function generateMetadata({ params, searchParams }: Props) {
  const { shop: shopSlug } = await params;
  const { q = "" } = await searchParams;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return {};
  const query = q.trim();
  return {
    title: query
      ? `Wyniki dla „${query}” — ${shop.branding.shopName}`
      : `Wyszukiwarka — ${shop.branding.shopName}`,
    robots: { index: false },
  };
}
