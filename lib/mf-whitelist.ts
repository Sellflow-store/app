/**
 * Biała lista podatników VAT Ministerstwa Finansów.
 *
 * Publiczne API bez klucza i bez rejestracji. Używamy go po to, żeby merchant
 * nie przepisywał danych firmy, które państwo i tak już o nim wie: wpisuje NIP,
 * a nazwa i adres wpadają same. Te same dane pójdą później do wniosku
 * u operatora płatności, więc prefill robi się sam.
 */

const WL_API = "https://wl-api.mf.gov.pl/api/search/nip";

export interface CompanyLookup {
  name: string;
  nip: string;
  /** "Czynny" | "Zwolniony" | "Niezarejestrowany" */
  statusVat: string | null;
  address: string;
  regon: string | null;
  krs: string | null;
  /** Rachunki zgłoszone do urzędu — pozwalają sprawdzić numer do przelewu. */
  accountNumbers: string[];
}

export function normalizeNip(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** NIP ma 10 cyfr i własną sumę kontrolną — sprawdzamy ją przed odpytaniem API. */
export function isValidNip(raw: string): boolean {
  const nip = normalizeNip(raw);
  if (!/^\d{10}$/.test(nip)) return false;
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const sum = weights.reduce((acc, w, i) => acc + w * Number(nip[i]), 0);
  const check = sum % 11;
  // Reszta 10 oznacza NIP niemożliwy do wystawienia.
  return check !== 10 && check === Number(nip[9]);
}

/** Dzisiejsza data w formacie wymaganym przez API (rejestr jest historyczny). */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Zwraca dane firmy albo null, gdy NIP jest nieznany. Rzuca tylko wtedy, gdy
 * samo API zawiedzie — wołający odróżnia „nie ma takiej firmy" od „nie udało
 * się sprawdzić", bo to dwie różne wiadomości dla merchanta.
 */
export async function lookupCompanyByNip(rawNip: string): Promise<CompanyLookup | null> {
  const nip = normalizeNip(rawNip);
  const res = await fetch(`${WL_API}/${nip}?date=${today()}`, {
    // Dane rejestrowe zmieniają się rzadko; dzienny cache wystarcza i oszczędza
    // limity po stronie MF.
    next: { revalidate: 86400 },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`MF whitelist ${res.status}`);

  const data = (await res.json()) as {
    result?: { subject?: Record<string, unknown> | null };
  };
  const s = data.result?.subject;
  if (!s || typeof s.name !== "string") return null;

  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

  return {
    name: s.name.trim(),
    nip,
    statusVat: str(s.statusVat),
    // Firmy jednoosobowe mają adres zamieszkania, spółki adres siedziby.
    address: str(s.workingAddress) ?? str(s.residenceAddress) ?? "",
    regon: str(s.regon),
    krs: str(s.krs),
    accountNumbers: Array.isArray(s.accountNumbers)
      ? s.accountNumbers.filter((a): a is string => typeof a === "string")
      : [],
  };
}
