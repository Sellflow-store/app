import Link from "next/link";
import { notFound } from "next/navigation";
import { getShopBySlug } from "@/lib/shop";
import { storefrontBase } from "@/lib/storefront-base";
import BrandTheme from "@/components/store/BrandTheme";
import TopBar from "@/components/store/TopBar";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";

/**
 * Powrót klienta ze strony płatności Tpay (payerUrls.success / payerUrls.error).
 *
 * Ta strona NIE decyduje o tym, czy zamówienie jest opłacone — to robi webhook
 * po sprawdzeniu transakcji w Tpay. Parametr `status` mówi tylko, którym
 * przyciskiem klient wrócił, więc treść jest ostrożna: „przyjęliśmy", nie
 * „opłacone". Stanu zamówienia po numerze też tu nie czytamy — numery są
 * kolejne, więc każdy mógłby podejrzeć cudze.
 */

interface Props {
  params: Promise<{ shop: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const ORDER_NO_RE = /^[A-Z]{2,5}-\d{1,10}$/;

export default async function PaymentReturnPage({ params, searchParams }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) notFound();

  const sp = await searchParams;
  const rawNr = typeof sp.nr === "string" ? sp.nr : "";
  const orderNumber = ORDER_NO_RE.test(rawNr) ? rawNr : null;
  const ok = sp.status !== "blad";
  const base = await storefrontBase(shop.slug);
  const contactEmail = shop.legal.email || shop.about.email;

  return (
    <>
      <BrandTheme branding={shop.branding} />
      <div className="min-h-screen bg-paper flex flex-col">
        <TopBar config={shop.home} />
        <Navbar shopSlug={shop.slug} branding={shop.branding} menuItems={shop.menu.items} />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-16 lg:py-24 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-ink mb-4">
            {ok ? "Dziękujemy za zamówienie!" : "Płatność nie została zakończona"}
          </h1>
          {orderNumber && (
            <p className="text-sm text-ink-2 mb-6">
              Numer zamówienia: <strong className="text-ink">{orderNumber}</strong>
            </p>
          )}
          {ok ? (
            <p className="text-sm text-ink-2 font-light leading-relaxed mb-10">
              Tpay przekazuje nam potwierdzenie płatności, zwykle w ciągu kilku sekund. Podsumowanie
              zamówienia wysłaliśmy na Twój adres e-mail. Zaczniemy je realizować, gdy tylko wpłata
              zostanie potwierdzona.
            </p>
          ) : (
            <p className="text-sm text-ink-2 font-light leading-relaxed mb-10">
              Zamówienie zostało zapisane, ale płatność nie doszła do skutku. Napisz do nas, a
              pomożemy ją dokończyć
              {contactEmail ? (
                <>
                  {" "}na <a className="underline" href={`mailto:${contactEmail}`}>{contactEmail}</a>
                </>
              ) : null}
              {orderNumber ? `, podając numer ${orderNumber}` : ""}.
            </p>
          )}
          <Link
            href={base || "/"}
            className="inline-flex items-center gap-2 bg-ink text-on-ink text-sm font-semibold px-6 py-3 rounded-button hover:opacity-90 transition-opacity"
          >
            Wróć do sklepu
          </Link>
        </main>
        <Footer shopSlug={shop.slug} branding={shop.branding} footer={shop.footer} />
      </div>
    </>
  );
}

export function generateMetadata() {
  return { title: "Płatność", robots: { index: false, follow: false } };
}
