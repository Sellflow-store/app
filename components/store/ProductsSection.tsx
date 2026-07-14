import ProductCard from "./ProductCard";
import type { ProductsSectionConfig, StorefrontProduct } from "@/types/shop";

interface Props {
  config: ProductsSectionConfig;
  products: StorefrontProduct[];
  shopSlug: string;
}

export default function ProductsSection({ config, products, shopSlug }: Props) {
  const displayed = products.filter((p) => p.visible).slice(0, 3);

  return (
    <section id="sklep" className="py-20 lg:py-28 bg-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-xs tracking-[0.25em] uppercase text-ink-2/70 font-medium">
            {config.eyebrow}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-ink tracking-tight">
            {config.headline}
          </h2>
          <p className="mt-3 text-ink-2 font-light max-w-md mx-auto">
            {config.subheadline}
          </p>
        </div>
        <div
          className={`grid gap-6 lg:gap-8 ${
            displayed.length === 1
              ? "grid-cols-1 max-w-sm mx-auto"
              : displayed.length === 2
                ? "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {displayed.map((product, i) => (
            <ProductCard key={product.id} product={product} shopSlug={shopSlug} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
