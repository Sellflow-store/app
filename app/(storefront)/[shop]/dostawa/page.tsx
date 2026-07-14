import { notFound } from "next/navigation";
import { Truck } from "lucide-react";
import { getShopBySlug } from "@/lib/shop";
import StorefrontShell from "@/components/store/StorefrontShell";

interface Props {
  params: Promise<{ shop: string }>;
}

const pln = (v: string) => `${parseFloat(v).toFixed(2).replace(".", ",")} zł`;

export default async function ShippingPage({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) notFound();

  const methods = shop.delivery.methods.filter((m) => m.enabled);
  const freeFrom = parseFloat(shop.delivery.freeShippingFrom);
  const hasFree = !isNaN(freeFrom) && freeFrom > 0;

  return (
    <StorefrontShell shop={shop}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-3">Dostawa</h1>
        <p className="text-sm text-ink-2 font-light mb-10">
          Zamówienia wysyłamy na terenie Polski. Koszt dostawy widzisz też w koszyku przed
          złożeniem zamówienia.
        </p>

        {methods.length === 0 ? (
          <p className="text-sm text-ink-2/70 font-light">
            Informacje o dostawie pojawią się tu wkrótce.
          </p>
        ) : (
          <div className="divide-y divide-rule border-y border-rule mb-8">
            {methods.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-4 py-4">
                <span className="flex items-center gap-3 text-sm text-ink">
                  <Truck className="w-4 h-4 text-ink-2 shrink-0" strokeWidth={1.5} />
                  {m.label}
                </span>
                <span className="text-sm font-semibold text-ink tabular-nums">
                  {parseFloat(m.price) === 0 ? "Gratis" : pln(m.price)}
                </span>
              </div>
            ))}
          </div>
        )}

        {hasFree && (
          <div className="border border-rule rounded-2xl px-6 py-5">
            <p className="text-sm text-ink">
              🎉 Darmowa dostawa dla zamówień od{" "}
              <span className="font-semibold">{pln(shop.delivery.freeShippingFrom)}</span>.
            </p>
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
  return { title: `Dostawa — ${shop.branding.shopName}` };
}
