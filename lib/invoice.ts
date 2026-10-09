import { isValidNip, normalizeNip } from "./mf-whitelist";

/**
 * Dane do faktury VAT na firmę, podawane przez klienta w zamówieniu.
 * Trzymane w zamówieniu (`orders.shipping_address.invoice`), obok adresu
 * dostawy: faktura może iść na inny adres niż paczka, a zamówienie
 * z produktami cyfrowymi nie ma adresu dostawy wcale.
 *
 * Plik bez zależności serwerowych: używa go checkout, API zamówień, maile
 * i panel.
 */
export interface InvoiceData {
  companyName: string;
  /** NIP, 10 cyfr bez kresek. */
  taxId: string;
  street: string;
  /** Kod pocztowy w formacie 00-000. */
  zip: string;
  city: string;
}

export type InvoiceInput = Partial<Record<keyof InvoiceData, unknown>>;

export type InvoiceResult = { ok: true; data: InvoiceData } | { ok: false; error: string };

const one = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";

/** NIP w czytelnej formie: 1234563218 → 123-456-32-18. */
export function formatNip(nip: string): string {
  const n = normalizeNip(nip);
  return n.length === 10 ? `${n.slice(0, 3)}-${n.slice(3, 6)}-${n.slice(6, 8)}-${n.slice(8)}` : nip;
}

/** Sprawdza dane z formularza i oddaje je w postaci do zapisania. Komunikaty są dla klienta sklepu. */
export function normalizeInvoice(raw: InvoiceInput | null | undefined): InvoiceResult {
  const companyName = one(raw?.companyName, 160);
  const street = one(raw?.street, 120);
  const city = one(raw?.city, 80);
  const taxId = normalizeNip(one(raw?.taxId, 20));
  const zipDigits = one(raw?.zip, 10).replace(/\D/g, "");

  if (companyName.length < 2) return { ok: false, error: "Faktura: podaj nazwę firmy." };
  if (!isValidNip(taxId)) {
    return { ok: false, error: "Faktura: NIP jest niepoprawny. Sprawdź, czy ma 10 cyfr i czy nie ma literówki." };
  }
  if (street.length < 2) return { ok: false, error: "Faktura: podaj ulicę i numer firmy." };
  if (zipDigits.length !== 5) return { ok: false, error: "Faktura: podaj kod pocztowy firmy w formacie 00-000." };
  if (city.length < 2) return { ok: false, error: "Faktura: podaj miasto firmy." };

  return {
    ok: true,
    data: { companyName, taxId, street, zip: `${zipDigits.slice(0, 2)}-${zipDigits.slice(2)}`, city },
  };
}

/** Odczyt faktury zapisanej w zamówieniu (stare zamówienia jej nie mają). */
export function readInvoice(shippingAddress: unknown): InvoiceData | null {
  const raw = (shippingAddress as { invoice?: InvoiceInput } | null | undefined)?.invoice;
  if (!raw || typeof raw !== "object") return null;
  const result = normalizeInvoice(raw);
  return result.ok ? result.data : null;
}

/** Wielkie litery z rejestru MF → "Ul. Kwiatowa 7/2". Mieszana wielkość zostaje bez zmian. */
function tidyCase(s: string): string {
  if (s !== s.toUpperCase()) return s;
  return s
    .toLowerCase()
    .replace(/(^|[\s.-])(\p{L})/gu, (_, sep: string, ch: string) => `${sep}${ch.toUpperCase()}`);
}

/**
 * "UL. KWIATOWA 7/2, 00-001 WARSZAWA" → ulica, kod, miasto. Adres w innym
 * formacie ląduje w całości w polu ulicy, żeby klient poprawił go ręcznie.
 */
export function splitPolishAddress(address: string): { street: string; zip: string; city: string } {
  const m = address.trim().match(/^(.*?),\s*(\d{2}-\d{3})\s+(.+)$/);
  if (!m) return { street: tidyCase(address.trim()), zip: "", city: "" };
  return { street: tidyCase(m[1].trim()), zip: m[2], city: tidyCase(m[3].trim()) };
}

/** Jednolinijkowy opis do maili i panelu. */
export function invoiceSummary(i: InvoiceData): string {
  return `${i.companyName}, NIP ${formatNip(i.taxId)}, ${i.street}, ${i.zip} ${i.city}`;
}
