/**
 * Atrybuty produktu, po których filtrują agenci AI i wyszukiwarki produktowe
 * (Google Merchant Center, AI Mode, ChatGPT). Trzymane w `products.attributes`.
 *
 * Plik bez zależności serwerowych: używa go formularz w panelu, API zapisu,
 * karta produktu w sklepie i feed.
 */

export interface ProductAttributes {
  /** EAN / GTIN: 8, 12, 13 albo 14 cyfr z poprawną cyfrą kontrolną. */
  gtin?: string;
  /** Kod producenta (MPN), gdy produkt nie ma EAN. */
  mpn?: string;
  /** Materiał lub skład, np. „100% jedwab”, „len 70%, bawełna 30%”. */
  material?: string;
}

/** Cyfra kontrolna GS1 (ta sama reguła dla GTIN-8/12/13/14). */
export function isValidGtin(raw: string): boolean {
  const digits = raw.replace(/\s/g, "");
  if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(digits)) return false;
  const nums = digits.split("").map(Number);
  const check = nums.pop()!;
  const sum = nums
    .reverse()
    .reduce((acc, n, i) => acc + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/** Oczyszcza dane z formularza lub bazy. Niepoprawny EAN odrzuca: błędny kod
 *  w feedzie powoduje odrzucenie produktu w Merchant Center. */
export function normalizeAttributes(raw: unknown): ProductAttributes {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown, max: number) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;
  const gtinRaw = str(r.gtin, 20)?.replace(/\s/g, "");
  return {
    ...(gtinRaw && isValidGtin(gtinRaw) ? { gtin: gtinRaw } : {}),
    ...(str(r.mpn, 70) ? { mpn: str(r.mpn, 70) } : {}),
    ...(str(r.material, 200) ? { material: str(r.material, 200) } : {}),
  };
}

// ─── Gotowość dla AI ────────────────────────────────────────────────────────

export interface ReadinessInput {
  type: "physical" | "digital" | "service";
  priceOnRequest: boolean;
  images: string[];
  shortDesc: string | null;
  description: string | null;
  category: string | null;
  weightGrams?: number | null;
  attributes: ProductAttributes;
}

export interface ReadinessGap {
  key: "images" | "shortDesc" | "description" | "category" | "material" | "identifier" | "weight";
  label: string;
  /** Po co to pole agentowi albo Google, jednym zdaniem. */
  why: string;
  weight: number;
}

/**
 * Luki w danych produktu, od najważniejszej. Wagi oddają to, jak często brak
 * pola wyklucza produkt z odpowiedzi agenta albo z Merchant Center:
 * bez zdjęcia produkt w ogóle nie trafi do feedu, bez materiału odpada
 * przy zapytaniach typu „lniana sukienka”.
 */
export function readinessGaps(p: ReadinessInput): ReadinessGap[] {
  const gaps: ReadinessGap[] = [];
  const physical = p.type === "physical";
  const text = (v: string | null) => (v ?? "").replace(/<[^>]*>/g, " ").trim();

  if (p.images.length === 0)
    gaps.push({ key: "images", label: "Zdjęcie", why: "Bez zdjęcia produkt nie trafi do Google ani do odpowiedzi AI.", weight: 30 });
  if (!text(p.shortDesc))
    gaps.push({ key: "shortDesc", label: "Krótki opis", why: "Agent cytuje go w odpowiedzi jako streszczenie produktu.", weight: 10 });
  if (text(p.description).length < 150)
    gaps.push({ key: "description", label: "Opis (min. 150 znaków)", why: "Z opisu AI wyciąga zastosowania, styl i odpowiedzi na pytania klientów.", weight: 15 });
  if (!p.category?.trim())
    gaps.push({ key: "category", label: "Kategoria", why: "Pozwala dopasować produkt do zapytania o typ rzeczy.", weight: 10 });
  if (physical && !p.attributes.material)
    gaps.push({ key: "material", label: "Materiał", why: "Klienci pytają AI o skład: „jedwabna”, „lniana”, „ze stali”.", weight: 20 });
  if (physical && !p.attributes.gtin && !p.attributes.mpn)
    gaps.push({ key: "identifier", label: "EAN lub kod producenta", why: "Google łączy po nim ofertę z katalogiem produktów. Wyroby własne mogą go nie mieć.", weight: 10 });
  if (physical && !p.weightGrams)
    gaps.push({ key: "weight", label: "Waga", why: "Potrzebna do wyceny wysyłki i danych o dostawie.", weight: 5 });

  return gaps.sort((a, b) => b.weight - a.weight);
}

/** 0–100: suma wag pól, które są uzupełnione. */
export function readinessScore(p: ReadinessInput): number {
  const physical = p.type === "physical";
  const max = physical ? 100 : 65;
  const missing = readinessGaps(p).reduce((s, g) => s + g.weight, 0);
  return Math.max(0, Math.round(((max - missing) / max) * 100));
}

/** Materiał wpisany wcześniej jako parametr („Materiał”, „Skład”) zanim
 *  istniało osobne pole. Używany jako wartość zastępcza. */
export function materialFromSpecs(specs: { key?: string; value?: string }[] | null | undefined): string | undefined {
  const hit = (specs ?? []).find((s) => /^(materia[łl]|sk[łl]ad|tkanina|surowiec)/i.test(s.key?.trim() ?? ""));
  return hit?.value?.trim() || undefined;
}
