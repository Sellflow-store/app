/**
 * Śledzenie przesyłek — mapowanie przewoźnika na link do jego wyszukiwarki.
 *
 * Nie integrujemy się tu z żadnym API: merchant wpisuje numer, my składamy
 * adres i podajemy go klientowi. To celowo najprostsza możliwa wersja, która
 * działa bez umowy z kimkolwiek i domyka obsługę zamówienia.
 */

export const CARRIERS = [
  { id: "inpost", label: "InPost", url: "https://inpost.pl/sledzenie-przesylek?number=" },
  { id: "dpd", label: "DPD", url: "https://tracktrace.dpd.com.pl/parcelDetails?p1=" },
  { id: "dhl", label: "DHL", url: "https://sprawdz.dhl.com.pl/szukaj.aspx?m=0&sn=" },
  { id: "ups", label: "UPS", url: "https://www.ups.com/track?loc=pl_PL&tracknum=" },
  { id: "gls", label: "GLS", url: "https://gls-group.eu/PL/pl/sledzenie-paczek?match=" },
  { id: "poczta", label: "Poczta Polska", url: "https://emonitoring.poczta-polska.pl/?numer=" },
  { id: "fedex", label: "FedEx", url: "https://www.fedex.com/fedextrack/?trknbr=" },
  // Numer zapisujemy, ale linku nie zmyślamy — klient dostanie sam numer.
  { id: "other", label: "Inny przewoźnik", url: null },
] as const;

export type CarrierId = (typeof CARRIERS)[number]["id"];

export function carrierLabel(id: string | null): string | null {
  return CARRIERS.find((c) => c.id === id)?.label ?? null;
}

export function isCarrierId(v: unknown): v is CarrierId {
  return typeof v === "string" && CARRIERS.some((c) => c.id === v);
}

/** Numery listów przewozowych to cyfry, litery i czasem myślnik. */
export function normalizeTrackingNumber(raw: string): string {
  return raw.trim().replace(/\s+/g, "").slice(0, 64);
}

export function isValidTrackingNumber(v: string): boolean {
  return /^[A-Za-z0-9-]{4,64}$/.test(v);
}

/** Link do śledzenia albo null, gdy przewoźnik go nie ma (albo brak numeru). */
export function trackingUrl(carrier: string | null, number: string | null): string | null {
  if (!carrier || !number) return null;
  const entry = CARRIERS.find((c) => c.id === carrier);
  if (!entry?.url) return null;
  return entry.url + encodeURIComponent(number);
}
