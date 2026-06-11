import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Check } from "lucide-react";
import { getShopBySlug } from "@/lib/shop";
import BrandTheme from "@/components/store/BrandTheme";
import TopBar from "@/components/store/TopBar";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import ProductGallery from "@/components/store/ProductGallery";
import AddToCartButton from "@/components/store/AddToCartButton";

interface Props {
  params: Promise<{ shop: string; id: string }>;
}

export default async function ProductPage({ params }: Props) {
  const { shop: shopSlug, id } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) notFound();

  // getShopBySlug returns visible products only, so hidden products 404 here
  const product = shop.products.find((p) => p.id === id);
  if (!product) notFound();

  return (
    <>
      <BrandTheme branding={shop.branding} />
      <div className="min-h-screen bg-paper">
        <TopBar config={shop.home} />
        <Navbar shopSlug={shop.slug} branding={shop.branding} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          {/* Breadcrumb */}
          <Link
            href={`/${shop.slug}`}
            className="inline-flex items-center gap-1 text-xs tracking-wide text-ink-2/70 hover:text-ink transition-colors mb-8"
          >
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
            Wróć do sklepu
          </Link>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Gallery */}
            <ProductGallery images={product.images} name={product.name} />

            {/* Info */}
            <div className="lg:py-4">
              {product.badge && (
                <span className="inline-block bg-ink text-on-ink text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-full mb-4">
                  {product.badge}
                </span>
              )}

              {product.category && (
                <p className="text-[11px] tracking-[0.2em] uppercase text-ink-2/70 mb-2">
                  {product.category}
                </p>
              )}

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
                {product.name}
              </h1>

              <div className="flex items-baseline gap-3 mt-4 mb-6">
                <span className="text-2xl font-semibold text-ink">{product.price} zł</span>
                {product.oldPrice && (
                  <span className="text-base text-ink-2/70 line-through">
                    {product.oldPrice} zł
                  </span>
                )}
              </div>

              {product.shortDesc && (
                <p className="text-sm text-ink-2 font-light leading-relaxed mb-8">
                  {product.shortDesc}
                </p>
              )}

              <AddToCartButton productId={product.id} />

              {/* Benefits */}
              {product.benefits.length > 0 && (
                <ul className="mt-8 space-y-2.5">
                  {product.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-ink-2">
                      <Check className="w-4 h-4 mt-0.5 shrink-0 text-ink" strokeWidth={1.5} />
                      <span>
                        <span className="font-medium text-ink">{b.label}</span>
                        {b.desc && <span className="font-light"> — {b.desc}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Description */}
              {product.description && (
                <div className="mt-10 pt-8 border-t border-rule">
                  <h2 className="text-sm font-semibold tracking-wide text-ink mb-3">
                    Opis produktu
                  </h2>
                  <p className="text-sm text-ink-2 font-light leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Specs */}
              {product.specs.length > 0 && (
                <div className="mt-8 pt-8 border-t border-rule">
                  <h2 className="text-sm font-semibold tracking-wide text-ink mb-3">
                    Specyfikacja
                  </h2>
                  <dl className="space-y-2">
                    {product.specs.map((s, i) => (
                      <div key={i} className="flex justify-between gap-4 text-sm">
                        <dt className="text-ink-2/70 font-light">{s.key}</dt>
                        <dd className="text-ink font-medium text-right">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </main>

        <Footer shopSlug={shop.slug} branding={shop.branding} />
      </div>
    </>
  );
}

export async function generateMetadata({ params }: Props) {
  const { shop: shopSlug, id } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return {};
  const product = shop.products.find((p) => p.id === id);
  if (!product) return {};
  return {
    title: `${product.name} — ${shop.branding.shopName}`,
    description: product.shortDesc ?? product.description ?? undefined,
  };
}
