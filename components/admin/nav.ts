import {
  Home, Package, Info, HelpCircle, FileText, Settings, BarChart2, Users, CreditCard,
  ClipboardList, Truck, Tag, Mail, Palette, Layers, MenuIcon, LayoutDashboard,
  PanelBottom, PackageCheck, type LucideIcon,
} from "lucide-react";

/**
 * Jedno źródło nazw stron panelu: menu boczne, okruszki w nagłówku i
 * wyszukiwarka czytają stąd, więc zmiana nazwy to jedna linijka, a nie trzy.
 */

export interface NavItem {
  slug: string;
  label: string;
  icon: LucideIcon;
}

export interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "store-ops",
    title: "Obsługa sklepu",
    items: [
      { slug: "",          label: "Pulpit",     icon: LayoutDashboard },
      { slug: "orders",    label: "Zamówienia", icon: ClipboardList },
      { slug: "customers", label: "Klienci",    icon: Users },
      { slug: "stats",     label: "Analityka",  icon: BarChart2 },
    ],
  },
  {
    id: "store-mgmt",
    title: "Zarządzanie sklepem",
    items: [
      { slug: "products",   label: "Produkty",   icon: Package },
      { slug: "categories", label: "Kategorie",  icon: Layers },
      { slug: "payments",   label: "Płatności (Tpay, przelew, pobranie)", icon: CreditCard },
      { slug: "delivery",   label: "Dostawa",    icon: Truck },
      { slug: "furgonetka", label: "Furgonetka", icon: PackageCheck },
    ],
  },
  {
    id: "marketing",
    title: "Marketing",
    items: [
      { slug: "discounts",  label: "Kody rabatowe", icon: Tag },
      { slug: "newsletter", label: "Newsletter",    icon: Mail },
    ],
  },
  {
    id: "appearance",
    title: "Wygląd i treści",
    items: [
      { slug: "branding", label: "Logo i kolorystyka", icon: Palette },
      { slug: "home",     label: "Strona główna",      icon: Home },
      { slug: "about",    label: "O nas",              icon: Info },
      { slug: "faq",      label: "FAQ",                icon: HelpCircle },
      { slug: "blog",     label: "Blog",               icon: FileText },
      { slug: "menu",     label: "Menu nawigacji",     icon: MenuIcon },
      { slug: "footer",   label: "Stopka",             icon: PanelBottom },
    ],
  },
  {
    id: "legal",
    title: "Prawo",
    items: [{ slug: "legal", label: "Dokumenty prawne", icon: FileText }],
  },
  {
    id: "settings-group",
    title: "Ustawienia",
    items: [{ slug: "settings", label: "Ustawienia panelu", icon: Settings }],
  },
];

/** Strona panelu po slugu pierwszego segmentu ścieżki ("" = Pulpit). */
export function findNavItem(slug: string): { section: NavSection; item: NavItem } | null {
  for (const section of NAV_SECTIONS) {
    const item = section.items.find((i) => i.slug === slug);
    if (item) return { section, item };
  }
  return null;
}
