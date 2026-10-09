/**
 * Czas wysyłki produktu: ile dni roboczych mija od zamówienia do nadania paczki.
 * To NIE jest czas przewozu (ten należy do metody dostawy, `transitDays`).
 *
 * Plik bez zależności serwerowych: używa go formularz w panelu, API zapisu,
 * karta produktu, dane strukturalne i feed.
 */
export interface ShippingTime {
  /** Najkrócej, w dniach roboczych. 0 = nadajemy w dniu zamówienia. */
  min: number;
  /** Najdłużej, w dniach roboczych. */
  max: number;
}

export const MAX_SHIPPING_DAYS = 90;

/** Oczyszcza dane z formularza lub bazy. Brak sensownych liczb → undefined. */
export function normalizeShippingTime(raw: unknown): ShippingTime | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const day = (v: unknown) => {
    const n = typeof v === "string" ? parseInt(v, 10) : typeof v === "number" ? Math.round(v) : NaN;
    return Number.isFinite(n) && n >= 0 && n <= MAX_SHIPPING_DAYS ? n : null;
  };
  const a = day(r.min);
  const b = day(r.max);
  if (a == null && b == null) return undefined;
  // Wpisana jedna liczba oznacza "dokładnie tyle".
  const min = a ?? (b as number);
  const max = b ?? (a as number);
  return { min: Math.min(min, max), max: Math.max(min, max) };
}

/** Polska odmiana: 1 dzień, 2–4 dni, 5+ dni (z wyjątkiem 12–14, 112–114…). */
function dayWord(n: number): string {
  if (n === 1) return "dzień roboczy";
  const last = n % 10;
  const lastTwo = n % 100;
  return last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14) ? "dni robocze" : "dni roboczych";
}

/** "1–2 dni robocze", "1 dzień roboczy", "10–14 dni roboczych", "w dniu zamówienia". */
export function formatShippingTime(t: ShippingTime): string {
  if (t.max === 0) return "w dniu zamówienia";
  if (t.min === t.max) return `${t.max} ${dayWord(t.max)}`;
  return `${t.min}–${t.max} ${dayWord(t.max)}`;
}

/** Zdanie do karty produktu: "Wysyłka w 1–2 dni robocze". */
export function shippingTimeLabel(t: ShippingTime): string {
  return t.max === 0 ? "Wysyłka w dniu zamówienia" : `Wysyłka w ${formatShippingTime(t)}`;
}
