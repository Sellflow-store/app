import type { StorefrontProduct } from "@/types/shop";

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
    case "cena-rosnaco":
      list = list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      break;
    case "cena-malejaco":
      list = list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      break;
    case "nazwa":
      list = list.sort((a, b) => a.name.localeCompare(b.name, "pl"));
      break;
    default:
      list = list.sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return list;
}
