"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Package, ShoppingBag, Info, HelpCircle, FileText, ShieldCheck, Settings,
  BarChart2, X, ChevronRight, Users, Eye, CreditCard, ClipboardList,
  Truck, Tag, Mail, Palette, Megaphone, Scale, Layers, Store, RotateCcw,
  MenuIcon, LayoutDashboard,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    id: "store-ops",
    title: "Obsługa sklepu",
    items: [
      { slug: "",          label: "Pulpit",      icon: LayoutDashboard },
      { slug: "orders",    label: "Zamówienia",  icon: ClipboardList },
      { slug: "customers", label: "Klienci",      icon: Users },
      { slug: "stats",     label: "Statystyki",   icon: BarChart2 },
    ],
  },
  {
    id: "store-mgmt",
    title: "Zarządzanie sklepem",
    items: [
      { slug: "products",   label: "Produkty",        icon: Package },
      { slug: "categories", label: "Kategorie",        icon: Layers },
      { slug: "payments",   label: "Płatności i VAT",  icon: CreditCard },
      { slug: "delivery",   label: "Dostawa",          icon: Truck },
    ],
  },
  {
    id: "marketing",
    title: "Marketing",
    items: [
      { slug: "discounts",   label: "Kody rabatowe", icon: Tag },
      { slug: "newsletter",  label: "Newsletter",    icon: Mail },
    ],
  },
  {
    id: "appearance",
    title: "Wygląd i treści",
    items: [
      { slug: "branding", label: "Logo i kolorystyka", icon: Palette },
      { slug: "home",     label: "Strona główna",       icon: Home },
      { slug: "about",    label: "O nas",               icon: Info },
      { slug: "faq",      label: "FAQ",                 icon: HelpCircle },
      { slug: "menu",     label: "Menu nawigacji",      icon: MenuIcon },
    ],
  },
  {
    id: "legal",
    title: "Prawo",
    items: [
      { slug: "legal", label: "Dokumenty prawne", icon: FileText },
    ],
  },
  {
    id: "settings-group",
    title: "Ustawienia",
    items: [
      { slug: "settings", label: "Ustawienia panelu", icon: Settings },
    ],
  },
];

interface SidebarProps {
  shopSlug: string;
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ shopSlug, mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const base = `/dashboard/${shopSlug}`;

  function isActive(slug: string) {
    if (slug === "") return pathname === base; // Pulpit — only the bare base
    return pathname === `${base}/${slug}` || pathname.startsWith(`${base}/${slug}/`);
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          "fixed top-0 left-0 h-full w-60 z-50 flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:h-screen",
        ].join(" ")}
        style={{ background: "oklch(8% 0 0)", color: "#fff" }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid oklch(18% 0 0)" }}
        >
          <Link
            href={base}
            className="text-sm font-bold tracking-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Sellflow{" "}
            <span style={{ color: "oklch(45% 0 0)", fontWeight: 300 }}>admin</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden"
            style={{ color: "oklch(45% 0 0)" }}
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV_SECTIONS.map((section) => (
            <div key={section.id} className="mb-4">
              <p
                className="text-[9px] tracking-[0.18em] uppercase font-semibold px-2 mb-1.5"
                style={{ color: "oklch(38% 0 0)" }}
              >
                {section.title}
              </p>

              {section.items.map(({ slug, label, icon: Icon }) => {
                const active = isActive(slug);
                return (
                  <Link
                    key={slug || "pulpit"}
                    href={slug ? `${base}/${slug}` : base}
                    onClick={onClose}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors mb-0.5"
                    style={
                      active
                        ? { background: "#fff", color: "oklch(10% 0 0)", fontWeight: 600 }
                        : { color: "oklch(50% 0 0)" }
                    }
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = "oklch(15% 0 0)";
                        (e.currentTarget as HTMLElement).style.color = "#fff";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                        (e.currentTarget as HTMLElement).style.color = "oklch(50% 0 0)";
                      }
                    }}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                    <span className="flex-1">{label}</span>
                    {active && <ChevronRight className="w-3 h-3 shrink-0" strokeWidth={2.5} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Preview link */}
        <div
          className="px-4 py-3.5 shrink-0"
          style={{ borderTop: "1px solid oklch(18% 0 0)" }}
        >
          <Link
            href={`/${shopSlug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-[11px] transition-colors"
            style={{ color: "oklch(45% 0 0)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#fff")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "oklch(45% 0 0)")}
          >
            <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
            Podgląd sklepu
          </Link>
        </div>
      </aside>
    </>
  );
}
