/**
 * Kod QR polecenia przelewu wg rekomendacji Związku Banków Polskich (standard 2D).
 *
 * Klient skanuje kod aplikacją swojego banku i dostaje wypełniony formularz
 * przelewu zamiast przepisywania 26 cyfr z ekranu. Kod niczego nie autoryzuje —
 * zawiera wyłącznie jawne dane, a przelew klient i tak zatwierdza w banku.
 *
 * Format (separator "|", maks. 160 znaków łącznie):
 *   NIP | kraj | rachunek | kwota | nazwa odbiorcy | tytuł | rez1 | rez2 | rez3
 * Kwota jest w GROSZACH, wyrównana zerami do 6 znaków. Twarde limity długości:
 * nazwa 20, tytuł 32, pola rezerwowe 20/12/24.
 */

import { normalizeNrb } from "./nrb";

const SEPARATOR = "|";
const MAX_LEN = 160;
const NAME_MAX = 20;
const TITLE_MAX = 32;

export interface TransferQrData {
  /** NRB odbiorcy — 26 cyfr. */
  bankAccount: string;
  /** Nazwa odbiorcy; standard przycina do 20 znaków. */
  recipientName: string;
  /** Tytuł przelewu; standard przycina do 32 znaków. */
  title: string;
  /** Kwota w złotych, np. "101.99". */
  amount: string;
  /** NIP odbiorcy — opcjonalny, ale zalecany dla firm. */
  taxId?: string;
}

/** Standard dopuszcza wyłącznie cyfry w polu NIP. */
function normalizeTaxId(v: string | undefined): string {
  return (v ?? "").replace(/\D/g, "").slice(0, 10);
}

/**
 * Buduje ciąg danych do zakodowania w QR albo zwraca null, gdy danych nie da
 * się poprawnie sformatować (brak rachunku, zła kwota, przekroczony limit).
 * Wołający po prostu nie pokazuje wtedy kodu — dane do przelewu i tak są obok.
 */
export function buildTransferQrPayload(data: TransferQrData): string | null {
  const account = normalizeNrb(data.bankAccount);
  if (!/^\d{26}$/.test(account)) return null;

  const grosze = Math.round(parseFloat(data.amount) * 100);
  if (!Number.isFinite(grosze) || grosze < 0) return null;

  const name = data.recipientName.trim().slice(0, NAME_MAX);
  if (!name) return null;

  const fields = [
    normalizeTaxId(data.taxId),
    "PL",
    account,
    String(grosze).padStart(6, "0"),
    name,
    data.title.trim().slice(0, TITLE_MAX),
    "",
    "",
    "",
  ];

  const payload = fields.join(SEPARATOR);
  return payload.length > MAX_LEN ? null : payload;
}
