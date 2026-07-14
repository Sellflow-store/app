import { db } from "./db";
import { shops, shopConfig, products } from "./db/schema";
import { eq, and } from "drizzle-orm";
import { getLowestPrices30 } from "./price-history";
import type {
  ShopContext,
  HomeConfig,
  BrandingConfig,
  DeliveryConfig,
  CheckoutConfig,
  AboutConfig,
  FaqConfig,
  LegalConfig,
  MenuConfig,
  FooterConfig,
  AccountConfig,
  IntegrationsConfig,
  ComplianceConfig,
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
    { id: "kurier", label: "Kurier", price: "16.99", enabled: true },
    { id: "paczkomat", label: "Paczkomat InPost", price: "12.99", enabled: true },
    { id: "odbior", label: "Odbiór osobisty", price: "0.00", enabled: false },
  ],
  freeShippingFrom: "",
};

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
    policyUrl: "/polityka-prywatnosci",
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
  };

  const delivery: DeliveryConfig = {
    ...DEFAULT_DELIVERY,
    ...((configMap.delivery as Partial<DeliveryConfig>) ?? {}),
  };

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
  const terms: LegalConfig = {
    ...DEFAULT_LEGAL,
    ...((configMap.terms as Partial<LegalConfig>) ?? {}),
  };
  const privacy: LegalConfig = {
    ...DEFAULT_LEGAL,
    ...((configMap.privacy as Partial<LegalConfig>) ?? {}),
  };

  const menuSaved = (configMap.menu as Partial<MenuConfig>)?.items;
  const menu: MenuConfig = {
    items: Array.isArray(menuSaved) && menuSaved.length > 0 ? menuSaved : DEFAULT_MENU.items,
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
    products: storefrontProducts,
  };
}
