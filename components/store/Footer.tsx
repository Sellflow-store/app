"use client";

import Link from "next/link";
import { Instagram, Facebook, Twitter, Youtube } from "@/components/icons/social";
import type { BrandingConfig } from "@/types/shop";
import { useStoreBase } from "./StoreBaseContext";

interface Props {
  shopSlug: string;
  branding: BrandingConfig;
}

const PAYMENT_ICONS = ["Visa", "MC", "PayPal", "Blik", "P24"];

const SOCIAL = [
  { icon: Instagram, label: "Instagram" },
  { icon: Facebook, label: "Facebook" },
  { icon: Twitter, label: "Twitter" },
  { icon: Youtube, label: "YouTube" },
];

export default function Footer({ branding }: Props) {
  const base = useStoreBase();

  const FOOTER_LINKS = {
    Sklep: [
      { label: "Wszystkie produkty", href: `${base}/products` },
    ],
    Informacje: [
      { label: "O nas", href: `${base}/about` },
      { label: "FAQ", href: `${base}/faq` },
      { label: "Dostawa", href: `${base}/shipping` },
      { label: "Zwroty i reklamacje", href: `${base}/returns` },
      { label: "Polityka prywatności", href: `${base}/privacy` },
      { label: "Regulamin", href: `${base}/terms` },
    ],
    Kontakt: [
      { label: "Kontakt", href: `${base}/contact` },
    ],
  };

  return (
    <footer id="kontakt" className="bg-paper-2 border-t border-rule">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link href={base || "/"} className="text-lg font-bold tracking-tight text-ink">
              {branding.shopName}
            </Link>
            <p className="mt-3 text-sm text-ink-2 font-light leading-relaxed">
              Minimalistyczne produkty najwyższej jakości.
            </p>
            <div className="flex gap-2.5 mt-5">
              {SOCIAL.map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-8 h-8 rounded-full border border-rule flex items-center justify-center text-ink-2/70 hover:border-ink hover:text-ink transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-xs tracking-[0.2em] uppercase text-ink font-semibold mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-ink-2 hover:text-ink transition-colors font-light"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-rule flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-2/70">
            © {new Date().getFullYear()} {branding.shopName}. Wszelkie prawa zastrzeżone.
          </p>
          <div className="flex items-center gap-3">
            {PAYMENT_ICONS.map((name) => (
              <span
                key={name}
                className="text-[10px] font-semibold text-ink-2/60 border border-rule rounded px-2 py-1"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
