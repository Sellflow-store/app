import { notFound } from "next/navigation";
import { getShopBySlug } from "@/lib/shop";
import StorefrontShell from "@/components/store/StorefrontShell";

interface Props {
  params: Promise<{ shop: string }>;
}

export default async function FaqPage({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) notFound();

  const items = shop.faq.items.filter((i) => i.q.trim());

  return (
    <StorefrontShell shop={shop}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-8">
          Najczęstsze pytania
        </h1>
        {items.length === 0 ? (
          <p className="text-sm text-ink-2/70 font-light">
            Sekcja w przygotowaniu. Masz pytanie? Napisz do nas przez stronę kontaktową.
          </p>
        ) : (
          <div className="divide-y divide-rule border-y border-rule">
            {items.map((item, i) => (
              <details key={i} className="group py-5">
                <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-medium text-ink">
                  {item.q}
                  <span className="ml-4 text-ink-2 transition-transform group-open:rotate-45 text-lg leading-none shrink-0">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-ink-2 font-light leading-relaxed whitespace-pre-line">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}

export async function generateMetadata({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return {};
  return { title: `FAQ — ${shop.branding.shopName}` };
}
