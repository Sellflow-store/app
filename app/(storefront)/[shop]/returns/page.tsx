import { notFound } from "next/navigation";
import Link from "next/link";
import { RotateCcw, ShieldCheck, Mail } from "lucide-react";
import { getShopBySlug } from "@/lib/shop";
import StorefrontShell from "@/components/store/StorefrontShell";

interface Props {
  params: Promise<{ shop: string }>;
}

export default async function ReturnsPage({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) notFound();

  const steps = [
    {
      icon: Mail,
      title: "Napisz do nas",
      text: shop.about.email
        ? `Wyślij wiadomość na ${shop.about.email} z numerem zamówienia i informacją, co zwracasz.`
        : "Skontaktuj się z nami przez stronę kontaktową, podając numer zamówienia.",
    },
    {
      icon: RotateCcw,
      title: "Odeślij produkt",
      text: "Masz 14 dni od otrzymania paczki na odstąpienie od umowy bez podania przyczyny — i kolejne 14 dni na odesłanie produktu.",
    },
    {
      icon: ShieldCheck,
      title: "Odbierz zwrot pieniędzy",
      text: "Pieniądze odsyłamy tą samą metodą, którą zapłacono, w ciągu 14 dni od otrzymania oświadczenia o odstąpieniu.",
    },
  ];

  return (
    <StorefrontShell shop={shop}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-3">
          Zwroty i reklamacje
        </h1>
        <p className="text-sm text-ink-2 font-light mb-10">
          Kupujesz bez ryzyka — zgodnie z prawem konsumenckim masz 14 dni na zwrot.
        </p>

        <div className="space-y-5 mb-10">
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-4 border border-rule rounded-2xl px-6 py-5">
              <div className="w-10 h-10 rounded-xl border border-rule flex items-center justify-center shrink-0">
                <s.icon className="w-4 h-4 text-ink-2" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-ink mb-1">
                  {i + 1}. {s.title}
                </h2>
                <p className="text-sm text-ink-2 font-light leading-relaxed">{s.text}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-ink-2/70 leading-relaxed">
          Reklamacje rozpatrujemy w ciągu 14 dni. Szczegółowe zasady znajdziesz w{" "}
          <Link href={`/${shop.slug}/terms`} className="underline underline-offset-2 hover:text-ink">
            regulaminie sklepu
          </Link>
          , a w razie pytań{" "}
          <Link href={`/${shop.slug}/contact`} className="underline underline-offset-2 hover:text-ink">
            napisz do nas
          </Link>
          .
        </p>
      </div>
    </StorefrontShell>
  );
}

export async function generateMetadata({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return {};
  return { title: `Zwroty — ${shop.branding.shopName}` };
}
