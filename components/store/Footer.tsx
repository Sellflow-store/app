"use client";

import Link from "next/link";
import { Instagram, Facebook, Twitter, Youtube, Tiktok } from "@/components/icons/social";
import type { BrandingConfig, FooterConfig, SocialLinks } from "@/types/shop";
import { useStoreBase } from "./StoreBaseContext";
import NavLink from "./NavLink";
import SellflowWordmark from "@/components/icons/SellflowWordmark";

interface Props {
  shopSlug: string;
  branding: BrandingConfig;
  footer?: FooterConfig;
}

const SOCIAL: { key: keyof SocialLinks; icon: typeof Instagram; label: string }[] = [
  { key: "instagram", icon: Instagram, label: "Instagram" },
  { key: "facebook", icon: Facebook, label: "Facebook" },
  { key: "tiktok", icon: Tiktok, label: "TikTok" },
  { key: "youtube", icon: Youtube, label: "YouTube" },
  { key: "x", icon: Twitter, label: "X" },
];

export default function Footer({ branding, footer }: Props) {
  const base = useStoreBase();

  // Pokazujemy tylko profile, które merchant faktycznie podał — reszta znika,
  // zamiast wisieć jako martwa ikona.
  const socialLinks = SOCIAL.map((s) => ({ ...s, href: footer?.social?.[s.key]?.trim() ?? "" }))
    .filter((s) => s.href);

  const description = footer?.description?.trim() || branding.tagline?.trim() || "";

  const FOOTER_LINKS = {
    Sklep: [
      { label: "Wszystkie produkty", href: `${base}/produkty` },
    ],
    Informacje: [
      { label: "O nas", href: `${base}/o-nas` },
      { label: "FAQ", href: `${base}/faq` },
      { label: "Dostawa", href: `${base}/dostawa` },
      { label: "Zwroty i reklamacje", href: `${base}/zwroty` },
      { label: "Polityka prywatności", href: `${base}/prywatnosc` },
      { label: "Regulamin", href: `${base}/regulamin` },
    ],
    Kontakt: [
      { label: "Kontakt", href: `${base}/kontakt` },
    ],
  };

  return (
    <footer id="kontakt" className="bg-paper-2 border-t border-rule">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link href={base || "/"} className="inline-block text-lg font-bold tracking-tight text-ink">
              {branding.logoUrl ? (
                // Ten sam logotyp co w navbarze, w tej samej wysokości — stopka
                // z nazwą tekstem obok logo w nagłówku wyglądała jak dwie marki.
                <img
                  src={branding.logoUrl}
                  alt={branding.shopName}
                  className="w-auto object-contain"
                  style={{
                    height: branding.logoHeight ?? 28,
                    maxWidth: `min(${branding.logoMaxWidth ?? 160}px, 60vw)`,
                  }}
                />
              ) : (
                branding.shopName
              )}
            </Link>
            {description && (
              <p className="mt-3 text-sm text-ink-2 font-light leading-relaxed">{description}</p>
            )}
            {socialLinks.length > 0 && (
              <div className="flex gap-2.5 mt-5">
                {socialLinks.map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    aria-label={label}
                    className="w-8 h-8 rounded-full border border-rule flex items-center justify-center text-ink-2/70 hover:border-ink hover:text-ink transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-xs tracking-[0.2em] uppercase text-ink font-semibold mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <NavLink
                      href={item.href}
                      className="inline-block text-sm text-ink-2 hover:text-ink transition-colors font-light"
                      activeClassName="text-ink"
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-rule flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-ink-2/70">
            © {new Date().getFullYear()} {branding.shopName}. Wszelkie prawa zastrzeżone.
          </p>
          <PoweredBy />
        </div>
      </div>
    </footer>
  );
}

/**
 * Podpis platformy w stopce każdego sklepu — jak „Powered by Shopify".
 *
 * Wordmark jest wektorem w `currentColor`, więc bierze kolor tekstu stopki
 * danego sklepu. Podpis ma być widoczny, ale nie ma konkurować z marką
 * klienta: stoi w tym samym przygaszonym odcieniu co nota o prawach
 * autorskich obok i dopiero po najechaniu dochodzi do pełnej mocy.
 */
function PoweredBy() {
  const landing = `https://${process.env.NEXT_PUBLIC_APP_DOMAIN ?? "sell-flow.store"}`;
  return (
    <a
      href={landing}
      target="_blank"
      rel="noopener"
      className="inline-flex items-center gap-2 text-xs text-ink-2/70 hover:text-ink transition-colors"
    >
      <span>Zbudowane w Polsce</span>
      <SellflowWordmark className="h-3" />
    </a>
  );
}
