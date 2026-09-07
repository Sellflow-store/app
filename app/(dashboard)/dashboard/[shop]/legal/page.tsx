import { db } from "@/lib/db";
import { shopConfig, shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import {
  DEFAULT_ABOUT,
  DEFAULT_ACCOUNT,
  DEFAULT_BRANDING,
  DEFAULT_CHECKOUT,
  DEFAULT_DELIVERY,
  DEFAULT_LEGAL,
  normalizeDeliveryConfig,
} from "@/lib/shop";
import { DEFAULT_LEGAL_DATA, normalizeLegalData, shopPublicUrl } from "@/lib/legal";
import type {
  AboutConfig,
  AccountConfig,
  BrandingConfig,
  CheckoutConfig,
  DeliveryConfig,
  LegalConfig,
  LegalDataConfig,
} from "@/types/shop";
import LegalForm from "./LegalForm";

export default async function LegalPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "sell-flow.store";

  let shopName = shopSlug;
  let shopUrl = `https://${shopSlug}.${appDomain}`;
  let legal: LegalDataConfig = DEFAULT_LEGAL_DATA;
  let account: AccountConfig = DEFAULT_ACCOUNT;
  let about: AboutConfig = DEFAULT_ABOUT;
  let branding: BrandingConfig = { ...DEFAULT_BRANDING, shopName: shopSlug };
  let checkout: CheckoutConfig = DEFAULT_CHECKOUT;
  let delivery: DeliveryConfig = DEFAULT_DELIVERY;
  let terms: LegalConfig = DEFAULT_LEGAL;
  let privacy: LegalConfig = DEFAULT_LEGAL;

  try {
    const access = await getShopAccess(shopSlug);
    if (access) {
      const [shop, rows] = await Promise.all([
        db.query.shops.findFirst({ where: eq(shops.id, access.shopId) }),
        db.select().from(shopConfig).where(eq(shopConfig.shopId, access.shopId)),
      ]);
      const cfg = Object.fromEntries(rows.map((r) => [r.key, r.value]));

      if (shop) {
        shopName = shop.name;
        shopUrl = shopPublicUrl(shop);
      }

      const savedAccount = (cfg.account as Partial<AccountConfig>) ?? {};
      account = {
        ...DEFAULT_ACCOUNT,
        ...savedAccount,
        company: { ...DEFAULT_ACCOUNT.company, ...(savedAccount.company ?? {}) },
      };
      about = { ...DEFAULT_ABOUT, ...((cfg.about as Partial<AboutConfig>) ?? {}) };
      const savedBranding = (cfg.branding as Partial<BrandingConfig>) ?? {};
      branding = { ...DEFAULT_BRANDING, ...savedBranding, shopName: savedBranding.shopName || shopName };
      checkout = { ...DEFAULT_CHECKOUT, ...((cfg.checkout as Partial<CheckoutConfig>) ?? {}) };
      delivery = normalizeDeliveryConfig(cfg.delivery as Partial<DeliveryConfig> | undefined);
      legal = normalizeLegalData(cfg.legal as Partial<LegalDataConfig> | undefined);
      terms = { ...DEFAULT_LEGAL, ...((cfg.terms as Partial<LegalConfig>) ?? {}) };
      privacy = { ...DEFAULT_LEGAL, ...((cfg.privacy as Partial<LegalConfig>) ?? {}) };
    }
  } catch {
    // Baza jeszcze nieskonfigurowana — pokaż pusty formularz zamiast błędu.
  }

  return (
    <LegalForm
      shopSlug={shopSlug}
      shopName={shopName}
      shopUrl={shopUrl}
      initialLegal={legal}
      account={account}
      about={about}
      branding={branding}
      checkout={checkout}
      delivery={delivery}
      initialTerms={terms}
      initialPrivacy={privacy}
    />
  );
}
