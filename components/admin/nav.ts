import {
  Home, Package, Info, HelpCircle, FileText, Settings, BarChart2, Users, CreditCard,
  ClipboardList, Truck, Tag, Mail, Palette, Layers, MenuIcon, LayoutDashboard,
  PanelBottom, PackageCheck, Search, type LucideIcon,
} from "lucide-react";

/**
 * Jedno źródło nazw stron panelu: menu boczne, okruszki w nagłówku i
 * wyszukiwarka czytają stąd, więc zmiana nazwy to jedna linijka, a nie trzy.
 */

export interface NavItem {
  slug: string;
  label: string;
  icon: LucideIcon;
  /** Jedno zdanie „po co tu wejść”: dymek w menu i podpowiedź w wyszukiwarce. */
  hint?: string;
  /** Słowa, którymi klient szuka tej strony, choć nie ma ich w nazwie. */
  keywords?: string[];
}

export interface NavSection {
  id: string;
  /** Pusty tytuł = sekcja bez nagłówka (sam Pulpit). */
  title: string;
  /** Rzadko używane grupy są domyślnie zwinięte, żeby nowy klient widział
   *  najpierw to, co potrzebne do sprzedaży. Rozwijają się same, gdy
   *  otwarta strona jest w środku. */
  collapsible?: boolean;
  items: NavItem[];
}

// Kolejność grup = kolejność pracy: najpierw codzienna obsługa, potem oferta,
// płatności i wysyłka, a wygląd i marketing na końcu, zwinięte.
export const NAV_SECTIONS: NavSection[] = [
  {
    id: "home",
    title: "",
    items: [
      { slug: "", label: "Pulpit", icon: LayoutDashboard, hint: "Co dziś wymaga uwagi i co zostało do uruchomienia sklepu" },
    ],
  },
  {
    id: "sales",
    title: "Sprzedaż",
    items: [
      { slug: "orders",    label: "Zamówienia", icon: ClipboardList, hint: "Nowe zamówienia, płatności i wysyłka", keywords: ["wysyłka", "paczka", "status", "faktura"] },
      { slug: "customers", label: "Klienci",    icon: Users,         hint: "Kto kupił i ile wydał", keywords: ["kupujący", "email"] },
      { slug: "stats",     label: "Analityka",  icon: BarChart2,     hint: "Sprzedaż i ruch w czasie", keywords: ["statystyki", "raport", "przychód"] },
    ],
  },
  {
    id: "catalog",
    title: "Oferta",
    items: [
      { slug: "products",   label: "Produkty",  icon: Package, hint: "Dodawanie produktów, ceny, zdjęcia i stany", keywords: ["cena", "magazyn", "stan", "zdjęcia", "vat"] },
      { slug: "categories", label: "Kategorie", icon: Layers,  hint: "Grupowanie produktów w sklepie", keywords: ["kolekcje"] },
    ],
  },
  {
    id: "checkout",
    title: "Płatności i wysyłka",
    items: [
      { slug: "payments",   label: "Płatności", icon: CreditCard, hint: "Jak klienci płacą: Tpay (BLIK, karty), przelew, pobranie", keywords: ["tpay", "blik", "karta", "przelew", "pobranie", "konto bankowe", "vat"] },
      { slug: "delivery",   label: "Dostawa",    icon: Truck,        hint: "Metody i ceny wysyłki, darmowa dostawa", keywords: ["wysyłka", "kurier", "paczkomat", "inpost", "odbiór osobisty"] },
      { slug: "furgonetka", label: "Furgonetka", icon: PackageCheck, hint: "Automatyczne etykiety i nadawanie paczek", keywords: ["etykieta", "kurier", "nadanie"] },
    ],
  },
  {
    id: "appearance",
    title: "Wygląd sklepu",
    collapsible: true,
    items: [
      { slug: "branding", label: "Logo i kolorystyka", icon: Palette,     hint: "Logo, kolory i fonty sklepu", keywords: ["logo", "kolory", "font", "favicon"] },
      { slug: "home",     label: "Strona główna",      icon: Home,        hint: "Baner, sekcje i polecane produkty", keywords: ["hero", "baner", "zdjęcie główne"] },
      { slug: "about",    label: "O nas",              icon: Info,        hint: "Historia marki i dane kontaktowe", keywords: ["kontakt", "telefon", "email"] },
      { slug: "faq",      label: "FAQ",                icon: HelpCircle,  hint: "Najczęstsze pytania klientów", keywords: ["pytania"] },
      { slug: "blog",     label: "Blog",               icon: FileText,    hint: "Wpisy i poradniki", keywords: ["artykuł", "wpis"] },
      { slug: "menu",     label: "Menu nawigacji",     icon: MenuIcon,    hint: "Linki w górnym menu sklepu", keywords: ["nawigacja", "linki"] },
      { slug: "footer",   label: "Stopka",             icon: PanelBottom, hint: "Linki i dane na dole strony", keywords: ["social", "instagram", "facebook"] },
    ],
  },
  {
    id: "marketing",
    title: "Marketing",
    collapsible: true,
    items: [
      { slug: "discounts",  label: "Kody rabatowe", icon: Tag,  hint: "Rabaty procentowe i kwotowe", keywords: ["rabat", "promocja", "kupon", "zniżka"] },
      { slug: "newsletter", label: "Newsletter",    icon: Mail, hint: "Zapisy na newsletter i eksport adresów", keywords: ["mailing", "subskrybenci"] },
      { slug: "seo",        label: "SEO stron",     icon: Search, hint: "Tytuły i opisy stron w Google, frazy kluczowe", keywords: ["google", "meta title", "meta description", "frazy", "pozycjonowanie", "wyszukiwarka"] },
    ],
  },
  {
    id: "shop",
    title: "Sklep i konto",
    items: [
      { slug: "legal",    label: "Dokumenty prawne", icon: FileText, hint: "Regulamin i polityka prywatności, które składają się same", keywords: ["regulamin", "rodo", "polityka prywatności", "zwroty", "odstąpienie", "nip"] },
      { slug: "settings", label: "Ustawienia",       icon: Settings, hint: "Dane firmy, domena, plan, wygląd panelu", keywords: ["domena", "nip", "firma", "plan", "hasło", "konto", "motyw", "ciemny"] },
    ],
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
