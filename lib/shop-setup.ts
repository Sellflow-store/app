import type {
  BrandingConfig, CheckoutConfig, LegalConfig, AboutConfig, AccountConfig, LegalDataConfig,
} from "@/types/shop";
import { DEFAULT_ABOUT, DEFAULT_ACCOUNT, DEFAULT_CHECKOUT, normalizeDeliveryConfig } from "./shop";
import { missingLegalFields, normalizeLegalData, resolveLegalFields } from "./legal";
import {
  materialFromSpecs, normalizeAttributes, readinessGaps, readinessScore, type ReadinessGap,
} from "./product-attributes";

/**
 * Wspólna ocena „czy sklep jest gotowy": checklistę „Uruchom sklep" widzi
 * klient na Pulpicie, a zespół tę samą w /ops. Jedno źródło, żeby obie
 * strony zawsze widziały ten sam stan.
 */

export type SetupStepKey = "product" | "payments" | "delivery" | "legal" | "logo" | "about";

/** Kolejność = kolejność, w jakiej sklep zaczyna zarabiać. */
export const SETUP_STEP_KEYS: SetupStepKey[] = ["product", "payments", "delivery", "legal", "logo", "about"];

export const SETUP_STEP_LABELS: Record<SetupStepKey, string> = {
  product: "Pierwszy produkt",
  payments: "Płatności",
  delivery: "Dostawa",
  legal: "Dane do dokumentów",
  logo: "Logo",
  about: "O nas",
};

export function shopSetupDone(input: {
  configMap: Record<string, unknown>;
  productCount: number;
  onlinePayments: boolean;
  shopName: string;
}): Record<SetupStepKey, boolean> {
  const { configMap, productCount, onlinePayments, shopName } = input;
  const branding = configMap.branding as Partial<BrandingConfig> | undefined;
  const checkout = configMap.checkout as Partial<CheckoutConfig> | undefined;
  const terms = configMap.terms as Partial<LegalConfig> | undefined;
  const about = configMap.about as Partial<AboutConfig> | undefined;

  const savedAccount = (configMap.account as Partial<AccountConfig>) ?? {};
  const legalComplete =
    missingLegalFields(
      resolveLegalFields({
        legal: normalizeLegalData(configMap.legal as Partial<LegalDataConfig> | undefined),
        account: {
          ...DEFAULT_ACCOUNT,
          ...savedAccount,
          company: { ...DEFAULT_ACCOUNT.company, ...(savedAccount.company ?? {}) },
        },
        about: { ...DEFAULT_ABOUT, ...(about ?? {}) },
        branding: branding as never,
        checkout: { ...DEFAULT_CHECKOUT, ...(checkout ?? {}) },
        delivery: normalizeDeliveryConfig(configMap.delivery as never),
        shopName,
        shopUrl: "",
      })
    ).length === 0;

  return {
    product: productCount > 0,
    payments:
      onlinePayments ||
      (!!checkout && ((checkout.transferEnabled ? !!checkout.bankAccount : false) || !!checkout.codEnabled)),
    delivery: !!configMap.delivery,
    // Dokumenty składają się same, więc „gotowe" nie znaczy „ktoś wkleił
    // tekst", tylko „nie zostały w nich luki po brakujących danych".
    legal: terms?.mode === "custom" ? !!terms.content?.trim() : legalComplete,
    logo: !!branding?.logoUrl,
    about: !!(about?.content?.trim() || about?.email?.trim()),
  };
}

export interface ReadinessProductRow {
  type: string | null;
  priceOnRequest: boolean | null;
  images: unknown;
  shortDesc: string | null;
  description: string | null;
  category: string | null;
  weightGrams: number | null;
  attributes: unknown;
  specs: unknown;
}

export interface CatalogReadiness {
  total: number;
  readyCount: number;
  topGaps: { key: ReadinessGap["key"]; label: string; count: number; weight: number }[];
}

/** Gotowość katalogu dla Google i AI: ile produktów ma wynik ≥ 85 i czego brakuje najczęściej. */
export function catalogReadiness(rows: ReadinessProductRow[]): CatalogReadiness {
  const gapCounts = new Map<ReadinessGap["key"], { key: ReadinessGap["key"]; label: string; count: number; weight: number }>();
  let readyCount = 0;
  for (const p of rows) {
    const attrs = normalizeAttributes(p.attributes);
    const input = {
      type: (p.type as "physical" | "digital" | "service") ?? "physical",
      priceOnRequest: p.priceOnRequest ?? false,
      images: (p.images as string[]) ?? [],
      shortDesc: p.shortDesc,
      description: p.description,
      category: p.category,
      weightGrams: p.weightGrams,
      attributes: { ...attrs, material: attrs.material ?? materialFromSpecs(p.specs as { key: string; value: string }[]) },
    };
    if (readinessScore(input) >= 85) readyCount++;
    for (const g of readinessGaps(input)) {
      const e = gapCounts.get(g.key) ?? { key: g.key, label: g.label, count: 0, weight: g.weight };
      e.count++;
      gapCounts.set(g.key, e);
    }
  }
  const topGaps = [...gapCounts.values()].sort((a, b) => b.count * b.weight - a.count * a.weight).slice(0, 3);
  return { total: rows.length, readyCount, topGaps };
}
