import type { StorefrontProduct } from "@/types/shop";

/** Jedna etykieta dla produktów bez ceny półkowej — używana na karcie, liście
 *  i przycisku, żeby wszędzie nazywały się tak samo. Mówimy o produkcie
 *  („powstaje na zamówienie"), nie o brakującej cenie. */
export const MADE_TO_ORDER_LABEL = "Produkt na zamówienie";

export type SortOption = "polecane" | "cena-rosnaco" | "cena-malejaco" | "nazwa";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "polecane", label: "Polecane" },
  { value: "cena-rosnaco", label: "Cena: od najniższej" },
  { value: "cena-malejaco", label: "Cena: od najwyższej" },
  { value: "nazwa", label: "Nazwa: A–Z" },
];

export function parseSort(value: string | undefined): SortOption {
  return SORT_OPTIONS.some((o) => o.value === value) ? (value as SortOption) : "polecane";
}

function isSoldOut(p: StorefrontProduct): boolean {
  return p.stock != null && p.stock <= 0;
}

/** Komparator cenowy, który spycha produkty bez ceny na koniec listy. */
function byPrice(compare: (a: number, b: number) => number) {
  return (a: StorefrontProduct, b: StorefrontProduct) => {
    if (a.priceOnRequest !== b.priceOnRequest) return a.priceOnRequest ? 1 : -1;
    if (a.priceOnRequest) return a.sortOrder - b.sortOrder;
    return compare(parseFloat(a.price), parseFloat(b.price));
  };
}

/** Filtruje produkty po frazie — wszystkie słowa muszą wystąpić w nazwie/kategorii/opisie. */
export function searchProducts(products: StorefrontProduct[], query: string): StorefrontProduct[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return products.filter((p) => {
    const haystack = [p.name, p.category, p.shortDesc, p.description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
}

/** Sortuje (nie mutuje) i opcjonalnie ukrywa niedostępne produkty. */
export function sortProducts(
  products: StorefrontProduct[],
  sort: SortOption,
  hideUnavailable = false
): StorefrontProduct[] {
  let list = hideUnavailable ? products.filter((p) => !isSoldOut(p)) : [...products];
  switch (sort) {
    // Produkty na zamówienie nie mają ceny do porównania — lądują na końcu
    // obu list cenowych, zamiast udawać, że kosztują 0 zł.
    case "cena-rosnaco":
      list = list.sort(byPrice((a, b) => a - b));
      break;
    case "cena-malejaco":
      list = list.sort(byPrice((a, b) => b - a));
      break;
    case "nazwa":
      list = list.sort((a, b) => a.name.localeCompare(b.name, "pl"));
      break;
    default:
      list = list.sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return list;
}
