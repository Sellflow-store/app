import { notFound } from "next/navigation";
import { getShopBySlug } from "@/lib/shop";
import StorefrontShell from "@/components/store/StorefrontShell";
import ProductCard from "@/components/store/ProductCard";
import ProductControls from "@/components/store/ProductControls";
import { parseSort, sortProducts } from "@/lib/storefront-products";

interface Props {
  params: Promise<{ shop: string }>;
  searchParams: Promise<{ sort?: string; dostepne?: string }>;
}

export default async function ProductsListPage({ params, searchParams }: Props) {
  const { shop: shopSlug } = await params;
  const { sort: sortParam, dostepne } = await searchParams;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) notFound();

  const sort = parseSort(sortParam);
  const hideUnavailable = dostepne === "1";
  const sorted = sortProducts(shop.products, sort, hideUnavailable);

  return (
    <StorefrontShell shop={shop}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="mb-10">
          <p className="text-[11px] tracking-[0.2em] uppercase text-ink-2/70 mb-2">
            {shop.home.products.eyebrow}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Wszystkie produkty
          </h1>
        </div>

        {shop.products.length === 0 ? (
          <p className="text-sm text-ink-2/70 font-light py-12">
            Produkty pojawią się tu wkrótce.
          </p>
        ) : (
          <>
            <ProductControls sort={sort} hideUnavailable={hideUnavailable} />
            {sorted.length === 0 ? (
              <p className="text-sm text-ink-2/70 font-light py-12">
                Brak dostępnych produktów dla wybranych filtrów.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                {sorted.map((product, i) => (
                  <ProductCard key={product.id} product={product} shopSlug={shop.slug} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </StorefrontShell>
  );
}

export async function generateMetadata({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return {};
  return { title: `Produkty — ${shop.branding.shopName}` };
}
