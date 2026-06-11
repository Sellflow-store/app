import { notFound } from "next/navigation";
import { Mail, Phone, MapPin } from "lucide-react";
import { getShopBySlug } from "@/lib/shop";
import StorefrontShell from "@/components/store/StorefrontShell";

interface Props {
  params: Promise<{ shop: string }>;
}

export default async function ContactPage({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) notFound();

  const { email, phone, address } = shop.about;
  const hasAny = email || phone || address;

  return (
    <StorefrontShell shop={shop}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-3">Kontakt</h1>
        <p className="text-sm text-ink-2 font-light mb-10">
          Masz pytanie o produkt albo zamówienie? Odezwij się — odpowiadamy najszybciej, jak się da.
        </p>

        {hasAny ? (
          <div className="space-y-5">
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-4 border border-rule rounded-2xl px-6 py-5 hover:border-ink transition-colors"
              >
                <Mail className="w-5 h-5 text-ink-2 shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-xs text-ink-2/70 mb-0.5">E-mail</p>
                  <p className="text-sm font-medium text-ink">{email}</p>
                </div>
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="flex items-center gap-4 border border-rule rounded-2xl px-6 py-5 hover:border-ink transition-colors"
              >
                <Phone className="w-5 h-5 text-ink-2 shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-xs text-ink-2/70 mb-0.5">Telefon</p>
                  <p className="text-sm font-medium text-ink">{phone}</p>
                </div>
              </a>
            )}
            {address && (
              <div className="flex items-center gap-4 border border-rule rounded-2xl px-6 py-5">
                <MapPin className="w-5 h-5 text-ink-2 shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-xs text-ink-2/70 mb-0.5">Adres</p>
                  <p className="text-sm font-medium text-ink">{address}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-ink-2/70 font-light">
            Dane kontaktowe pojawią się tu wkrótce.
          </p>
        )}
      </div>
    </StorefrontShell>
  );
}

export async function generateMetadata({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return {};
  return { title: `Kontakt — ${shop.branding.shopName}` };
}
