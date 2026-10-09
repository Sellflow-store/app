import { normalizeSeo, type PageSeo } from "./product-seo";

/**
 * SEO stron sklepu (poza produktami): tytuł, opis i frazy per strona.
 * Zapisywane w `shop_config` pod kluczem `seo`.
 *
 * Plik bez zależności serwerowych: używa go panel i strony sklepu.
 */
export type SeoPageKey = "home" | "products" | "about" | "faq" | "contact" | "blog" | "delivery" | "returns";

export interface SeoPageDef {
  key: SeoPageKey;
  label: string;
  /** Ścieżka względem sklepu; "" = strona główna. */
  path: string;
  /** Tytuł domyślny (bez nazwy sklepu: dopisuje ją szablon w layoucie). */
  defaultTitle: (shopName: string) => string;
  defaultDescription: (shopName: string, ctx: { tagline: string; heroDescription: string }) => string;
}

export const SEO_PAGES: SeoPageDef[] = [
  {
    key: "home",
    label: "Strona główna",
    path: "",
    defaultTitle: (n) => n,
    defaultDescription: (_n, c) => c.heroDescription,
  },
  {
    key: "products",
    label: "Lista produktów",
    path: "/produkty",
    defaultTitle: () => "Produkty",
    defaultDescription: (n) => `Wszystkie produkty w sklepie ${n}.`,
  },
  { key: "about", label: "O nas", path: "/o-nas", defaultTitle: () => "O nas", defaultDescription: (_n, c) => c.tagline },
  { key: "faq", label: "FAQ", path: "/faq", defaultTitle: () => "FAQ", defaultDescription: (_n, c) => c.tagline },
  { key: "contact", label: "Kontakt", path: "/kontakt", defaultTitle: () => "Kontakt", defaultDescription: (_n, c) => c.tagline },
  { key: "blog", label: "Blog", path: "/blog", defaultTitle: () => "Blog", defaultDescription: (_n, c) => c.tagline },
  { key: "delivery", label: "Dostawa", path: "/dostawa", defaultTitle: () => "Dostawa", defaultDescription: (_n, c) => c.tagline },
  { key: "returns", label: "Zwroty", path: "/zwroty", defaultTitle: () => "Zwroty", defaultDescription: (_n, c) => c.tagline },
];

export interface SeoConfig {
  pages: Partial<Record<SeoPageKey, PageSeo>>;
}

export const DEFAULT_SEO: SeoConfig = { pages: {} };

/** Oczyszcza konfigurację z bazy lub formularza; nieznane strony odpadają. */
export function normalizeSeoConfig(raw: unknown): SeoConfig {
  const pages = (raw as { pages?: unknown } | null | undefined)?.pages;
  if (!pages || typeof pages !== "object") return DEFAULT_SEO;
  const out: SeoConfig["pages"] = {};
  for (const def of SEO_PAGES) {
    const seo = normalizeSeo((pages as Record<string, unknown>)[def.key]);
    if (seo) out[def.key] = seo;
  }
  return { pages: out };
}

/**
 * Metadane strony: własny tytuł i opis z panelu wygrywają z domyślnymi.
 * Własny tytuł jest pełnym tytułem (`absolute` pomija szablon „%s — Sklep”),
 * żeby to, co sprzedawca zobaczył w podglądzie Google, trafiło do <title>.
 */
export function pageMetadata(
  seo: SeoConfig | undefined,
  key: SeoPageKey,
  defaults: { title: string; description?: string },
) {
  const own = seo?.pages[key];
  const description = own?.description || defaults.description || undefined;
  return {
    title: own?.title ? { absolute: own.title } : defaults.title,
    description,
    ...(own?.title || own?.description
      ? { openGraph: { title: own?.title || defaults.title, description, type: "website" as const } }
      : {}),
  };
}
