/**
 * Numer rachunku bankowego (NRB) — normalizacja i suma kontrolna.
 *
 * Bez tego merchant może zapisać numer z literówką, a jedyną informacją
 * zwrotną jest to, że przelewy nie przychodzą. Sprawdzenie sumy kontrolnej
 * wyłapuje przekręcone cyfry od razu w panelu.
 */

/** Zostawia same cyfry; akceptuje zapis ze spacjami i z prefiksem "PL". */
export function normalizeNrb(raw: string): string {
  return raw.replace(/^\s*PL/i, "").replace(/\D/g, "");
}

/**
 * "12345678901234567890123456" → "12 3456 7890 1234 5678 9012 3456"
 *
 * Działa też na numerze niepełnym, bo panel formatuje pole w trakcie pisania —
 * gdyby grupowanie właczało się dopiero przy 26 cyfrach, tekst skakałby przy
 * ostatnim znaku.
 */
export function formatNrb(raw: string): string {
  const d = normalizeNrb(raw).slice(0, 26);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)} ${d.slice(2).replace(/(.{4})/g, "$1 ").trim()}`;
}

/**
 * Walidacja NRB wg ISO 13616 (IBAN mod 97).
 *
 * NRB to 26 cyfr: 2 cyfry kontrolne + 24 cyfry rachunku. Sprawdzenie polega
 * na przestawieniu na postać IBAN — 24 cyfry rachunku, potem "PL" zapisane
 * liczbowo (P=25, L=21), na końcu cyfry kontrolne — i sprawdzeniu, czy całość
 * modulo 97 daje 1. Liczba ma 30 cyfr, więc liczymy resztę partiami, bez BigInt.
 */
export function isValidNrb(raw: string): boolean {
  const d = normalizeNrb(raw);
  if (!/^\d{26}$/.test(d)) return false;

  const rearranged = d.slice(2) + "2521" + d.slice(0, 2);
  let remainder = 0;
  for (const ch of rearranged) {
    remainder = (remainder * 10 + (ch.charCodeAt(0) - 48)) % 97;
  }
  return remainder === 1;
}
