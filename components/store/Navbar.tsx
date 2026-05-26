"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, User, ShoppingBag, Menu, X } from "lucide-react";
import type { BrandingConfig } from "@/types/shop";

interface Props {
  shopSlug: string;
  branding: BrandingConfig;
}

export default function Navbar({ shopSlug, branding }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount] = useState(0);

  const base = `/${shopSlug}`;

  const NAV_ITEMS = [
    { label: "Sklep", href: `${base}/products` },
    { label: "Blog", href: `${base}/blog` },
    { label: "O nas", href: `${base}/about` },
    { label: "Kontakt", href: `${base}/contact` },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-paper/95 backdrop-blur-md border-b border-rule">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / shop name */}
          <Link href={base} className="text-xl font-bold tracking-tight text-ink">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.shopName} className="h-8 w-auto" />
            ) : (
              branding.shopName
            )}
          </Link>

          {/* Desktop Nav */}
          <ul className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="text-sm tracking-wide text-ink-2 hover:text-ink transition-colors duration-200"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Icons */}
          <div className="flex items-center gap-5">
            <button className="text-ink-2 hover:text-ink transition-colors hidden sm:block">
              <Search className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
            <button className="hidden sm:block text-ink-2 hover:text-ink transition-colors">
              <User className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
            <Link href={`${base}/cart`} className="text-ink-2 hover:text-ink transition-colors relative">
              <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-ink text-on-ink text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              className="md:hidden text-ink-2 hover:text-ink transition-colors"
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
