import type {
  AboutConfig,
  AccountConfig,
  BrandingConfig,
  CheckoutConfig,
  DeliveryConfig,
  LegalDataConfig,
} from "@/types/shop";
import { CLAUSE_GROUP_IDS } from "./clauses";

export const DEFAULT_LEGAL_DATA: LegalDataConfig = {
  companyName: "",
  companyAddress: "",
  taxId: "",
  regon: "",
  krs: "",
  email: "",
  phone: "",
  returnAddress: "",
  sells: { physical: true, digital: false, services: false },
  contractMoment: "confirmation",
  fulfillmentDays: "1–3",
  effectiveDate: "",
  personalizedProducts: false,
  clauses: [],
};

export function normalizeLegalData(raw: Partial<LegalDataConfig> | undefined): LegalDataConfig {
  const d = { ...DEFAULT_LEGAL_DATA, ...(raw ?? {}) };
  return {
    ...d,
    sells: { ...DEFAULT_LEGAL_DATA.sells, ...(raw?.sells ?? {}) },
    // Nieznane id klauzuli w bazie = klauzula, której już nie ma w katalogu.
    // Cicho ją odsiewamy, żeby generator nie wywalał się na starym zapisie.
    clauses: Array.isArray(d.clauses) ? d.clauses.filter((c) => CLAUSE_GROUP_IDS.has(c)) : [],
  };
}

/** Skąd wzięła się wartość pola — panel pokazuje to merchantowi, żeby wiedział,
 *  że nie musi przepisywać danych, które już gdzieś podał. */
export type VarSource = "legal" | "account" | "about" | "auto" | "missing";

export interface ResolvedField {
  value: string;
  source: VarSource;
}

export interface LegalVars {
  shopName: string;
  shopUrl: string;
  companyName: string;
  companyAddress: string;
  taxId: string;
  regon: string;
  krs: string;
  email: string;
  phone: string;
  returnAddress: string;
  sells: LegalDataConfig["sells"];
  contractMoment: LegalDataConfig["contractMoment"];
  fulfillmentDays: string;
  effectiveDate: string;
  personalizedProducts: boolean;
  clauses: string[];
  /** Etykiety realnie włączonych metod płatności (z sekcji „Płatności"). */
  payments: string[];
  /** Etykiety realnie włączonych metod dostawy (z sekcji „Dostawa"). */
  shipping: string[];
  /** Czy wśród metod dostawy jest odbiór osobisty. */
  hasPickup: boolean;
}

export interface LegalSources {
  legal: LegalDataConfig;
  account: AccountConfig;
  about: AboutConfig;
  branding: BrandingConfig;
  checkout: CheckoutConfig;
  delivery: DeliveryConfig;
  shopName: string;
  shopUrl: string;
}

/** Pierwsza niepusta wartość z łańcucha — razem z informacją, skąd pochodzi. */
function pick(...candidates: [string, VarSource][]): ResolvedField {
  for (const [value, source] of candidates) {
    if (value && value.trim()) return { value: value.trim(), source };
  }
  return { value: "", source: "missing" };
}

/** Rozwiązuje pola dokumentów z „Danych do dokumentów" i — dla pustych — z
 *  pozostałych sekcji panelu. Zwraca też źródło każdego pola, żeby panel mógł
 *  napisać „pobrane z Konto i firma" zamiast kazać wpisywać NIP drugi raz. */
export function resolveLegalFields(s: LegalSources): Record<string, ResolvedField> {
  const companyAddress = pick(
    [s.legal.companyAddress, "legal"],
    [s.account.company.address, "account"],
    [s.about.address, "about"],
  );
  return {
    companyName: pick(
      [s.legal.companyName, "legal"],
      [s.account.company.name, "account"],
    ),
    companyAddress,
    taxId: pick([s.legal.taxId, "legal"], [s.account.company.taxId, "account"]),
    regon: pick([s.legal.regon, "legal"]),
    krs: pick([s.legal.krs, "legal"]),
    email: pick(
      [s.legal.email, "legal"],
      [s.about.email, "about"],
      [s.account.contactEmail, "account"],
    ),
    phone: pick([s.legal.phone, "legal"], [s.about.phone, "about"], [s.account.phone, "account"]),
    returnAddress: pick(
      [s.legal.returnAddress, "legal"],
      [companyAddress.value, companyAddress.source === "missing" ? "missing" : "auto"],
    ),
    fulfillmentDays: pick([s.legal.fulfillmentDays, "legal"]),
    effectiveDate: pick([s.legal.effectiveDate, "legal"]),
  };
}

/** Pola, bez których dokument ma dziurę — panel liczy je i pokazuje licznik. */
export const REQUIRED_LEGAL_FIELDS: { key: string; label: string }[] = [
  { key: "companyName", label: "nazwa firmy / sprzedawcy" },
  { key: "companyAddress", label: "adres siedziby" },
  { key: "taxId", label: "NIP" },
  { key: "email", label: "e-mail kontaktowy" },
  { key: "fulfillmentDays", label: "czas realizacji zamówienia" },
  { key: "effectiveDate", label: "data obowiązywania" },
];

export function missingLegalFields(fields: Record<string, ResolvedField>): string[] {
  return REQUIRED_LEGAL_FIELDS.filter((f) => !fields[f.key]?.value).map((f) => f.label);
}

export function resolveLegalVars(s: LegalSources): LegalVars {
  const f = resolveLegalFields(s);
  const payments: string[] = [];
  if (s.checkout.transferEnabled) payments.push("przelew bankowy (tradycyjny)");
  if (s.checkout.codEnabled) payments.push("płatność przy odbiorze (za pobraniem)");

  const enabled = s.delivery.methods.filter((m) => m.enabled);
  return {
    shopName: s.branding.shopName || s.shopName,
    shopUrl: s.shopUrl,
    companyName: f.companyName.value,
    companyAddress: f.companyAddress.value,
    taxId: f.taxId.value,
    regon: f.regon.value,
    krs: f.krs.value,
    email: f.email.value,
    phone: f.phone.value,
    returnAddress: f.returnAddress.value,
    sells: s.legal.sells,
    contractMoment: s.legal.contractMoment,
    fulfillmentDays: f.fulfillmentDays.value,
    effectiveDate: f.effectiveDate.value,
    personalizedProducts: s.legal.personalizedProducts,
    clauses: s.legal.clauses,
    payments,
    shipping: enabled.map((m) => m.label),
    hasPickup: enabled.some((m) => m.kind === "pickup"),
  };
}

/** Publiczny adres sklepu — do §1 regulaminu i §1 polityki. */
export function shopPublicUrl(shop: {
  slug: string;
  customDomain: string | null;
  customDomainVerified: boolean;
}): string {
  if (shop.customDomain && shop.customDomainVerified) return `https://${shop.customDomain}`;
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "sell-flow.store";
  return `https://${shop.slug}.${appDomain}`;
}
