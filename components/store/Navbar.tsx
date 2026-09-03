"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, ShoppingBag, Menu, X } from "lucide-react";
import type { BrandingConfig, MenuItem } from "@/types/shop";
import {
  DEFAULT_MENU_ITEMS,
  DEFAULT_LOGO_HEIGHT,
  DEFAULT_LOGO_MAX_WIDTH,
  NAVBAR_MIN_HEIGHT,
} from "@/types/shop";
import { useCart } from "@/lib/cart";
import { useStoreBase } from "./StoreBaseContext";
import ProductSearch from "./ProductSearch";

interface Props {
  shopSlug: string;
  branding: BrandingConfig;
  menuItems?: MenuItem[];
  /** Pasek leży NA zdjęciu hero (bez tła), dopóki strona nie zjedzie niżej. */
  overlay?: boolean;
  /** Kolor treści paska na zdjęciu: "light" = biała (ciemne zdjęcia),
   *  "dark" = firmowa czerń (jasne, studyjne kadry). */
  overlayTone?: "light" | "dark";
}

export default function Navbar({
  shopSlug,
  branding,
  menuItems,
  overlay = false,
  overlayTone = "dark",
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count: cartCount } = useCart(shopSlug);

  const base = useStoreBase();
  const home = base || "/";

  // Pasek nad zdjęciem musi dostać tło, gdy tylko hero wyjedzie z kadru —
  // inaczej menu wchodzi na treść sekcji pod spodem.
  useEffect(() => {
    if (!overlay) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  const NAV_ITEMS = (menuItems?.length ? menuItems : DEFAULT_MENU_ITEMS).map((item) => ({
    label: item.label,
    href: item.href === "/" ? home : `${base}${item.href}`,
  }));

  const logoHeight = branding.logoHeight ?? DEFAULT_LOGO_HEIGHT;
  const logoMaxWidth = branding.logoMaxWidth ?? DEFAULT_LOGO_MAX_WIDTH;
  const caption = branding.logoCaption?.trim() ?? "";
  // wyższe logo rozciąga pasek, żeby nie było przycięte ani ciasno upakowane;
  // podpis pod logo (np. imię i nazwisko) dokłada jedną linijkę
  const rowHeight = Math.max(NAVBAR_MIN_HEIGHT, logoHeight + 16 + (caption ? 16 : 0));

  // Stan „przezroczysty" trwa tylko na szczycie strony i przy zamkniętym menu.
  const floating = overlay && !scrolled && !mobileOpen;
  const onImage = floating && overlayTone === "light";

  const shell = overlay
    ? `fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        floating ? "bg-transparent" : "bg-paper/95 backdrop-blur-md border-b border-rule"
      }`
    : "sticky top-0 z-50 bg-paper/95 backdrop-blur-md border-b border-rule";

  // Na jasnym zdjęciu zostaje firmowa czerń — biały tekst byłby niewidoczny.
  const strong = onImage ? "text-white" : "text-ink";
  const muted = onImage ? "text-white/85 hover:text-white" : "text-ink-2 hover:text-ink";
  const lightLogo = onImage && branding.logoUrlLight ? branding.logoUrlLight : branding.logoUrl;

  return (
    <nav className={shell}>
      {/* Delikatny gradient pod paskiem — ratuje czytelność na niejednolitym kadrze */}
      {floating && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, ${
              onImage ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.55)"
            }, transparent)`,
          }}
        />
      )}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between" style={{ height: rowHeight }}>
          {/* Logo / shop name */}
          <Link
            href={home}
            className={`text-xl font-bold tracking-tight shrink-0 flex flex-col items-start ${strong}`}
          >
            {lightLogo ? (
              <img
                src={lightLogo}
                alt={branding.shopName}
                className="w-auto object-contain"
                // na wąskich ekranach logo nie może zjeść miejsca ikonom
                style={{ height: logoHeight, maxWidth: `min(${logoMaxWidth}px, 55vw)` }}
              />
            ) : (
              branding.shopName
            )}
            {caption && (
              <span
                className={`mt-1 text-[10px] font-normal tracking-[0.22em] uppercase ${
                  onImage ? "text-white/85" : "text-ink-2"
                }`}
              >
                {caption}
              </span>
            )}
          </Link>

          {/* Desktop Nav */}
          <ul className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`text-sm tracking-wide transition-colors duration-200 ${muted}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Icons */}
          <div className="flex items-center gap-5">
            <ProductSearch />
            <button className={`hidden sm:block transition-colors ${muted}`}>
              <User className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
            <Link href={`${base}/koszyk`} className={`relative transition-colors ${muted}`}>
              <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.5} />
              {cartCount > 0 && (
                <span
                  className={`absolute -top-1.5 -right-1.5 text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-medium ${
                    onImage ? "bg-white text-ink" : "bg-ink text-on-ink"
                  }`}
                >
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              className={`md:hidden transition-colors ${muted}`}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" strokeWidth={1.5} /> : <Menu className="w-5 h-5" strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-rule bg-paper">
          <ul className="px-6 py-4 space-y-3">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="block text-sm tracking-wide text-ink-2 hover:text-ink py-1.5"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
