import { db } from "./db";
import { shops, shopConfig, products, blogPosts } from "./db/schema";
import { eq, and } from "drizzle-orm";
import { getLowestPrices30 } from "./price-history";
import {
  DEFAULT_LEGAL_DATA,
  normalizeLegalData,
  resolveLegalFields,
  resolveLegalVars,
  missingLegalFields,
  shopPublicUrl,
  buildTerms,
  buildPrivacy,
} from "./legal";
import type {
  ShopContext,
  HomeConfig,
  BrandingConfig,
  DeliveryConfig,
  DeliveryMethodKind,
  CheckoutConfig,
  AboutConfig,
  FaqConfig,
  LegalConfig,
  MenuConfig,
  FooterConfig,
  AccountConfig,
  IntegrationsConfig,
  ComplianceConfig,
  LegalDataConfig,
  StorefrontProduct,
} from "@/types/shop";
import {
  DEFAULT_MENU_ITEMS,
  DEFAULT_LOGO_HEIGHT,
  DEFAULT_LOGO_MAX_WIDTH,
} from "@/types/shop";

export const DEFAULT_BRANDING: BrandingConfig = {
  shopName: "Mój sklep",
  tagline: "",
  logoUrl: "",
  logoHeight: DEFAULT_LOGO_HEIGHT,
  logoMaxWidth: DEFAULT_LOGO_MAX_WIDTH,
  faviconUrl: "",
  primaryColor: "#171717",
  accentColor: "#737373",
  paperColor: "",
  fontFamily: "Space Grotesk",
  bodyFontFamily: "Inter Tight",
};

export const DEFAULT_HOME: HomeConfig = {
  topBar: { text: "Darmowa dostawa od 150 zł · Zwroty do 30 dni", visible: true },
  hero: {
    eyebrow: "Kolekcja 2026",
    headline: "Prostota,",
    headlineSub: "która wyróżnia.",
    description: "Minimalistyczny design spotyka najwyższą jakość materiałów.",
    ctaPrimary: "Kup teraz",
    ctaSecondary: "Dowiedz się więcej",
    socialProof: "Ponad 1 000 zadowolonych klientów",
    image: "",
  },
  products: {
    eyebrow: "Nasza oferta",
    headline: "Nasze produkty",
    subheadline: "Wybierz model, który najlepiej odpowiada Twoim potrzebom.",
  },
  benefits: {
    eyebrow: "Dlaczego my",
    headline: "Zaprojektowane z myślą o Tobie",
    items: [
      { title: "Jakość", description: "Najwyższej jakości materiały i wykonanie." },
      { title: "Trwałość", description: "Produkty zaprojektowane na lata." },
      { title: "Ekologia", description: "Odpowiedzialna produkcja." },
      { title: "Innowacja", description: "Nowoczesne rozwiązania." },
    ],
  },
  reviews: {
    rating: "4.9",
    reviewCount: "0",
    media: [],
    items: [],
  },
  guarantee: {
    headline: "Kupujesz bez ryzyka",
    subheadline: "Twoja satysfakcja jest naszym priorytetem.",
    items: [
      { title: "Gwarancja satysfakcji", description: "Zwrot pieniędzy bez pytań." },
      { title: "Darmowe zwroty 30 dni", description: "Masz 30 dni na zwrot towaru." },
      { title: "Szybka dostawa", description: "Wysyłka w ciągu 24 godzin." },
    ],
  },
  video: { visible: false, eyebrow: "", headline: "", description: "", type: "embed", embedUrl: "", fileUrl: "" },
  discounts: { codes: [], topBarCodeIndex: 0 },
  popup: {
    enabled: false,
    delaySeconds: 5,
    title: "Zapisz się do newslettera",
    description: "Otrzymaj kod rabatowy na pierwsze zamówienie.",
    buttonLabel: "Odbierz rabat",
    placeholder: "Twój adres e-mail",
    disclaimer: "Żadnego spamu.",
    successTitle: "Dziękujemy!",
    successText: "Kod został wysłany na Twojego maila.",
  },
};

export const DEFAULT_DELIVERY: DeliveryConfig = {
  methods: [
    { id: "kurier", label: "Kurier", price: "16.99", enabled: true, kind: "courier" },
    { id: "paczkomat", label: "Paczkomat InPost", price: "12.99", enabled: true, kind: "parcel_locker" },
    { id: "odbior", label: "Odbiór osobisty", price: "0.00", enabled: false, kind: "pickup" },
  ],
  freeShippingFrom: "",
};

const DELIVERY_KINDS: DeliveryMethodKind[] = ["courier", "parcel_locker", "pickup"];

/** Zgaduje rodzaj metody dla configów zapisanych zanim pole `kind` istniało.
 *  Sklepy w bazie mają domyślne id (kurier/paczkomat/odbior), więc trafia
 *  prawie zawsze; etykieta jest zapasem dla metod dodanych ręcznie. */
function guessDeliveryKind(m: { id?: string; label?: string }): DeliveryMethodKind {
  const hay = `${m.id ?? ""} ${m.label ?? ""}`.toLowerCase();
  if (/paczkomat|automat|locker|punkt|pudo|paczkopunkt/.test(hay)) return "parcel_locker";
  if (/odbi[oó]r|osobist|sklep|pickup/.test(hay)) return "pickup";
  return "courier";
}

/** Dokłada `kind` metodom bez tego pola i odsiewa wartości spoza enumu.
 *  Wołane wszędzie, gdzie config dostawy jest CZYTANY — dzięki temu stare
 *  wiersze w shop_config działają bez migracji danych. */
export function normalizeDeliveryConfig(raw: Partial<DeliveryConfig> | undefined): DeliveryConfig {
  const merged: DeliveryConfig = { ...DEFAULT_DELIVERY, ...(raw ?? {}) };
  return {
    ...merged,
    methods: (merged.methods ?? []).map((m) => ({
      ...m,
      kind: DELIVERY_KINDS.includes(m.kind) ? m.kind : guessDeliveryKind(m),
    })),
  };
}

export const DEFAULT_CHECKOUT: CheckoutConfig = {
  transferEnabled: true,
  bankAccount: "",
  accountOwner: "",
  codEnabled: true,
  codFee: "5.00",
};

export const DEFAULT_ABOUT: AboutConfig = {
  headline: "O nas",
  content: "",
  email: "",
  phone: "",
  address: "",
};

export const DEFAULT_FAQ: FaqConfig = { items: [] };

export const DEFAULT_LEGAL: LegalConfig = { content: "" };

export const DEFAULT_MENU: MenuConfig = { items: DEFAULT_MENU_ITEMS };

export { DEFAULT_LEGAL_DATA };

export const DEFAULT_FOOTER: FooterConfig = {
  description: "",
  social: { instagram: "", facebook: "", x: "", youtube: "", tiktok: "" },
};

export const DEFAULT_ACCOUNT: AccountConfig = {
  firstName: "",
  lastName: "",
  contactEmail: "",
  phone: "",
  company: { name: "", taxId: "", address: "" },
};

export const DEFAULT_INTEGRATIONS: IntegrationsConfig = {
  gtmId: "",
  metaPixelId: "",
  ga4Id: "",
  tiktokPixelId: "",
  googleMerchantId: "",
};

export const DEFAULT_COMPLIANCE: ComplianceConfig = {
  cookieBanner: {
    enabled: true,
    analytics: true,
    marketing: true,
    message:
      "Używamy plików cookie, aby zapewnić najlepsze działanie sklepu oraz — za Twoją zgodą — do analityki i marketingu.",
    policyUrl: "/prywatnosc",
  },
  omnibus: { enabled: true },
};

export async function getShopBySlug(slug: string): Promise<ShopContext | null> {
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  // Storefront is visible only when the merchant has it on, ops hasn't
  // suspended it, and it isn't soft-deleted. The flags are independent (schema).
  if (!shop || !shop.active || shop.suspended || shop.deletedAt) return null;

  const [configs, shopProducts] = await Promise.all([
    db.select().from(shopConfig).where(eq(shopConfig.shopId, shop.id)),
    db.select().from(products).where(
      and(eq(products.shopId, shop.id), eq(products.visible, true))
    ),
  ]);

  const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]));

  const branding: BrandingConfig = {
    ...DEFAULT_BRANDING,
    ...((configMap.branding as Partial<BrandingConfig>) ?? {}),
    shopName: (configMap.branding as BrandingConfig)?.shopName ?? shop.name,
  };

  const home: HomeConfig = {
    topBar: { ...DEFAULT_HOME.topBar, ...((configMap.home as HomeConfig)?.topBar ?? {}) },
    hero: { ...DEFAULT_HOME.hero, ...((configMap.home as HomeConfig)?.hero ?? {}) },
    products: { ...DEFAULT_HOME.products, ...((configMap.home as HomeConfig)?.products ?? {}) },
    benefits: { ...DEFAULT_HOME.benefits, ...((configMap.home as HomeConfig)?.benefits ?? {}) },
    reviews: { ...DEFAULT_HOME.reviews, ...((configMap.home as HomeConfig)?.reviews ?? {}) },
    guarantee: { ...DEFAULT_HOME.guarantee, ...((configMap.home as HomeConfig)?.guarantee ?? {}) },
    video: { ...DEFAULT_HOME.video, ...((configMap.home as HomeConfig)?.video ?? {}) },
    discounts: { ...DEFAULT_HOME.discounts, ...((configMap.home as HomeConfig)?.discounts ?? {}) },
    popup: { ...DEFAULT_HOME.popup, ...((configMap.home as HomeConfig)?.popup ?? {}) },
    // Sekcja opcjonalna — nie ma jej w DEFAULT_HOME, więc przepisujemy wprost.
    // (Ten obiekt jest składany klucz po kluczu, więc każdy NOWY klucz configu
    // trzeba tu dopisać — inaczej po cichu ginie w drodze do storefrontu.)
    lookbook: (configMap.home as HomeConfig)?.lookbook,
  };

  const delivery: DeliveryConfig = normalizeDeliveryConfig(
    configMap.delivery as Partial<DeliveryConfig> | undefined
  );

  const checkout: CheckoutConfig = {
    ...DEFAULT_CHECKOUT,
    ...((configMap.checkout as Partial<CheckoutConfig>) ?? {}),
  };

  const about: AboutConfig = {
    ...DEFAULT_ABOUT,
    ...((configMap.about as Partial<AboutConfig>) ?? {}),
  };
  const faq: FaqConfig = {
    ...DEFAULT_FAQ,
    ...((configMap.faq as Partial<FaqConfig>) ?? {}),
  };
  const savedTerms: LegalConfig = {
    ...DEFAULT_LEGAL,
    ...((configMap.terms as Partial<LegalConfig>) ?? {}),
  };
  const savedPrivacy: LegalConfig = {
    ...DEFAULT_LEGAL,
    ...((configMap.privacy as Partial<LegalConfig>) ?? {}),
  };

  const menuSaved = (configMap.menu as Partial<MenuConfig>)?.items;
  const menuItems =
    Array.isArray(menuSaved) && menuSaved.length > 0 ? menuSaved : DEFAULT_MENU.items;

  // Blog w menu tylko wtedy, gdy jest co czytać. „Blog" prowadzący do pustej
  // strony wygląda jak niedokończony sklep, a domyślne menu ma go zawsze.
  // Zapytanie leci wyłącznie wtedy, gdy pozycja blogowa faktycznie jest w menu.
  const hasBlogItem = menuItems.some((i) => i.href === "/blog" || i.href.startsWith("/blog/"));
  let publishedPosts = 0;
  if (hasBlogItem) {
    const [row] = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(and(eq(blogPosts.shopId, shop.id), eq(blogPosts.published, true)))
      .limit(1);
    publishedPosts = row ? 1 : 0;
  }

  const menu: MenuConfig = {
    items: publishedPosts > 0 || !hasBlogItem
      ? menuItems
      : menuItems.filter((i) => i.href !== "/blog" && !i.href.startsWith("/blog/")),
  };

  const savedFooter = (configMap.footer as Partial<FooterConfig>) ?? {};
  const footer: FooterConfig = {
    ...DEFAULT_FOOTER,
    ...savedFooter,
    social: { ...DEFAULT_FOOTER.social, ...(savedFooter.social ?? {}) },
  };

  const integrations: IntegrationsConfig = {
    ...DEFAULT_INTEGRATIONS,
    ...((configMap.integrations as Partial<IntegrationsConfig>) ?? {}),
  };

  const savedCompliance = (configMap.compliance as Partial<ComplianceConfig>) ?? {};
  const compliance: ComplianceConfig = {
    cookieBanner: { ...DEFAULT_COMPLIANCE.cookieBanner, ...(savedCompliance.cookieBanner ?? {}) },
    omnibus: { ...DEFAULT_COMPLIANCE.omnibus, ...(savedCompliance.omnibus ?? {}) },
  };

  const account: AccountConfig = {
    ...DEFAULT_ACCOUNT,
    ...((configMap.account as Partial<AccountConfig>) ?? {}),
    company: { ...DEFAULT_ACCOUNT.company, ...((configMap.account as AccountConfig)?.company ?? {}) },
  };

  const legal: LegalDataConfig = normalizeLegalData(
    configMap.legal as Partial<LegalDataConfig> | undefined
  );

  // Dokumenty prawne domyślnie SKŁADAMY z „Danych do dokumentów" przy każdym
  // wyświetleniu — dzięki temu poprawka NIP-u czy adresu zwrotów w jednym
  // miejscu od razu widać w regulaminie i w polityce. Merchant, który kliknął
  // „edytuj ręcznie", ma mode="custom" i wtedy jego treść jest nietykalna.
  const legalSources = {
    legal,
    account,
    about,
    branding,
    checkout,
    delivery,
    shopName: shop.name,
    shopUrl: shopPublicUrl(shop),
  };
  const legalVars = resolveLegalVars(legalSources);
  // Storefront dostaje dane JUŻ rozwiązane (puste pole „legal" zastąpione tym,
  // co merchant podał w koncie / „O nas"), żeby strony sklepu nie musiały
  // powtarzać łańcucha fallbacków przy każdym użyciu.
  const legalResolved: LegalDataConfig = {
    ...legal,
    companyName: legalVars.companyName,
    companyAddress: legalVars.companyAddress,
    taxId: legalVars.taxId,
    email: legalVars.email,
    phone: legalVars.phone,
    returnAddress: legalVars.returnAddress,
    fulfillmentDays: legalVars.fulfillmentDays,
    effectiveDate: legalVars.effectiveDate,
  };

  // Dokument składany z danych publikujemy dopiero przy komplecie — inaczej
  // klient sklepu zobaczyłby w regulaminie „[UZUPEŁNIJ: NIP]". Do czasu
  // uzupełnienia strona pokazuje „dokument w przygotowaniu", a panel liczy braki.
  const legalComplete = missingLegalFields(resolveLegalFields(legalSources)).length === 0;
  const terms: LegalConfig =
    savedTerms.mode === "custom"
      ? savedTerms
      : { mode: "generated", content: legalComplete ? buildTerms(legalVars) : "" };
  const privacy: LegalConfig =
    savedPrivacy.mode === "custom"
      ? savedPrivacy
      : { mode: "generated", content: legalComplete ? buildPrivacy(legalVars) : "" };

  // Omnibus: „najniższa cena z 30 dni" tylko dla produktów w promocji (oldPrice),
  // i tylko gdy włączone w ustawieniach zgodności.
  const omnibusIds = compliance.omnibus.enabled
    ? shopProducts.filter((p) => p.oldPrice).map((p) => p.id)
    : [];
  const lowestMap = await getLowestPrices30(omnibusIds);

  const storefrontProducts: StorefrontProduct[] = shopProducts.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    oldPrice: p.oldPrice,
    lowestPrice30: p.oldPrice ? (lowestMap.get(p.id) ?? null) : null,
    badge: p.badge,
    rating: p.rating,
    reviews: p.reviews,
    visible: p.visible,
    stock: p.stock,
    shortDesc: p.shortDesc,
    description: p.description,
    images: (p.images as string[]) ?? [],
    video: p.video as StorefrontProduct["video"],
    colors: (p.colors as string[]) ?? [],
    sizes: (p.sizes as string[]) ?? [],
    benefits: (p.benefits as StorefrontProduct["benefits"]) ?? [],
    specs: (p.specs as StorefrontProduct["specs"]) ?? [],
    sizeChart: (p.sizeChart as StorefrontProduct["sizeChart"]) ?? [],
    faq: (p.faq as StorefrontProduct["faq"]) ?? [],
    deliveryInfo: (p.deliveryInfo as string[]) ?? [],
    sortOrder: p.sortOrder,
    type: (p.type as StorefrontProduct["type"]) ?? "physical",
    fulfillment: (p.fulfillment as StorefrontProduct["fulfillment"]) ?? {},
  }));

  return {
    id: shop.id,
    slug: shop.slug,
    name: shop.name,
    branding,
    home,
    delivery,
    checkout,
    about,
    faq,
    terms,
    privacy,
    menu,
    footer,
    integrations,
    compliance,
    legal: legalResolved,
    products: storefrontProducts,
  };
}
