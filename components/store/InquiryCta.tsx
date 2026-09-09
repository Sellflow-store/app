import Link from "next/link";
import { Mail, Ruler } from "lucide-react";

interface Props {
  /** Nazwa produktu — trafia do tematu wiadomości, żeby sprzedawca wiedział, o co pytanie. */
  productName: string;
  /** Adres z „O nas". Pusty = nie ma dokąd wysłać maila, prowadzimy na /kontakt. */
  email: string;
  /** Ścieżka bazowa storefrontu (pusta na subdomenie, „/sklep/slug" na ścieżce). */
  base: string;
  /** Rozmiary do pokazania jako informacja — tu się ich nie wybiera, bo nie ma koszyka. */
  sizes?: string[];
}

/**
 * Zamiennik przycisku „Dodaj do koszyka" dla produktów bez ceny półkowej.
 * Sprzedaż takiego produktu zaczyna się od rozmowy, więc jedyne, co robimy,
 * to otwieramy tę rozmowę z wypełnionym tematem.
 */
export default function InquiryCta({ productName, email, base, sizes = [] }: Props) {
  const subject = `Zapytanie o produkt: ${productName}`;
  const href = email
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
    : `${base}/kontakt`;

  return (
    <div>
      {sizes.length > 0 && (
        <div className="mb-5">
          <span className="text-[11px] tracking-[0.2em] uppercase text-ink-2/70">
            Dostępne rozmiary
          </span>
          <div className="flex flex-wrap gap-2 mt-2">
            {sizes.map((s) => (
              <span
                key={s}
                className="min-w-[3.5rem] px-4 py-2.5 text-sm text-center rounded-input border border-rule text-ink-2"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <a
        href={href}
        className="w-full flex items-center justify-center gap-2 bg-accent-brand text-on-accent font-semibold text-sm tracking-wide px-8 py-4 rounded-button hover:opacity-90 transition-opacity"
      >
        <Mail className="w-4 h-4" strokeWidth={1.5} />
        Zapytaj o cenę
      </a>

      <p className="flex items-start gap-2 text-xs text-ink-2 font-light leading-relaxed mt-3">
        <Ruler className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={1.5} />
        <span>
          Ten model powstaje na zamówienie — cenę i termin ustalamy indywidualnie.
          {email ? " Napisz do nas, odpowiemy z wyceną." : " Dane kontaktowe znajdziesz na stronie kontaktu."}
        </span>
      </p>

      {email && (
        <Link
          href={`${base}/kontakt`}
          className="block text-center text-xs font-medium text-ink underline underline-offset-4 mt-3 hover:opacity-70 transition-opacity"
        >
          Inne formy kontaktu →
        </Link>
      )}
    </div>
  );
}
