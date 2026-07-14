import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Check, Download, Clock } from "lucide-react";
import { getShopBySlug } from "@/lib/shop";
import { storefrontBase } from "@/lib/storefront-base";
import BrandTheme from "@/components/store/BrandTheme";
import TopBar from "@/components/store/TopBar";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import ProductGallery from "@/components/store/ProductGallery";
import AddToCartButton from "@/components/store/AddToCartButton";
import { toSafeHtml } from "@/lib/sanitize";

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

  const base = await storefrontBase(shop.slug);

  return (
    <>
      <BrandTheme branding={shop.branding} />
      <div className="min-h-screen bg-paper">
        <TopBar config={shop.home} />
        <Navbar shopSlug={shop.slug} branding={shop.branding} menuItems={shop.menu.items} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          {/* Breadcrumb */}
          <Link
            href={base || "/"}
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

              <div className="mt-4 mb-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-semibold text-ink">{product.price} zł</span>
                  {product.oldPrice && (
                    <span className="text-base text-ink-2/70 line-through">
                      {product.oldPrice} zł
                    </span>
                  )}
                </div>
                {product.lowestPrice30 && (
                  <p className="text-xs text-ink-2/60 mt-1.5">
                    Najniższa cena z 30 dni przed obniżką: {product.lowestPrice30} zł
                  </p>
                )}
              </div>

              {product.type === "digital" && (
                <div className="flex items-center gap-2 mb-6 text-sm text-ink-2">
                  <Download className="w-4 h-4 text-ink shrink-0" strokeWidth={1.5} />
                  <span>Produkt cyfrowy — dostęp e-mailem po zakupie, bez wysyłki</span>
                </div>
              )}

              {product.type === "service" && (
                <div className="mb-6 rounded-xl border border-rule p-4">
                  <div className="flex items-center gap-2 text-ink font-medium text-sm mb-1.5">
                    <Clock className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                    Usługa
                  </div>
                  <dl className="space-y-0.5 text-sm text-ink-2">
                    {product.fulfillment.duration && (
                      <div className="flex gap-2">
                        <dt className="text-ink-2/70">Czas trwania:</dt>
                        <dd className="text-ink">{product.fulfillment.duration}</dd>
                      </div>
                    )}
                    {product.fulfillment.mode && (
                      <div className="flex gap-2">
                        <dt className="text-ink-2/70">Forma:</dt>
                        <dd className="text-ink">
                          {product.fulfillment.mode === "online"
                            ? "Online"
                            : product.fulfillment.mode === "onsite"
                            ? "Stacjonarnie"
                            : "Online lub stacjonarnie"}
                        </dd>
                      </div>
                    )}
                  </dl>
                  <p className="text-xs text-ink-2/70 mt-2">
                    Po zamówieniu skontaktujemy się w sprawie realizacji.
                  </p>
                </div>
              )}

              {product.shortDesc && (
                <p className="text-sm text-ink-2 font-light leading-relaxed mb-8">
                  {product.shortDesc}
                </p>
              )}

              <AddToCartButton
                shopSlug={shop.slug}
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.images[0] ?? null,
                  stock: product.stock,
                  type: product.type,
                }}
              />

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
                  <div
                    className="rte-render text-sm text-ink-2 font-light leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: toSafeHtml(product.description) }}
                  />
                  <style>{`
                    .rte-render p { margin: 0.5rem 0; }
                    .rte-render ul { list-style: disc; padding-left: 1.25rem; margin: 0.5rem 0; }
                    .rte-render ol { list-style: decimal; padding-left: 1.25rem; margin: 0.5rem 0; }
                    .rte-render a { color: var(--brand-accent, currentColor); text-decoration: underline; }
                    .rte-render strong, .rte-render b { font-weight: 600; }
                  `}</style>
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
