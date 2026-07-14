// ─── Shop config value types (stored as JSONB in shop_config table) ───────────

export interface TopBarConfig {
  text: string;
  visible: boolean;
}

export interface HeroConfig {
  eyebrow: string;
  headline: string;
  headlineSub: string;
  description: string;
  ctaPrimary: string;
  ctaSecondary: string;
  socialProof: string;
  image: string;
}

export interface ProductsSectionConfig {
  eyebrow: string;
  headline: string;
  subheadline: string;
}

export interface BenefitItem {
  title: string;
  description: string;
}

export interface BenefitsConfig {
  eyebrow: string;
  headline: string;
  items: BenefitItem[];
}

export interface ReviewItem {
  name: string;
  rating: number;
  text: string;
  date: string;
}

export interface ReviewsConfig {
  rating: string;
  reviewCount: string;
  media: string[];
  items: ReviewItem[];
}

export interface GuaranteeItem {
  title: string;
  description: string;
}

export interface GuaranteeConfig {
  headline: string;
  subheadline: string;
  items: GuaranteeItem[];
}

export interface VideoConfig {
  visible: boolean;
  eyebrow: string;
  headline: string;
  description: string;
  type: "embed" | "file";
  embedUrl: string;
  fileUrl: string;
}

export interface DiscountCode {
  code: string;
  discount: number;
  label: string;
}

export interface DiscountsConfig {
  codes: DiscountCode[];
  topBarCodeIndex: number;
}

export interface PopupConfig {
  enabled: boolean;
  delaySeconds: number;
  title: string;
  description: string;
  buttonLabel: string;
  placeholder: string;
  disclaimer: string;
  successTitle: string;
  successText: string;
}

export interface DeliveryMethod {
  id: string;
  label: string;
  price: string; // "12.99"
  enabled: boolean;
}

export interface DeliveryConfig {
  methods: DeliveryMethod[];
  freeShippingFrom: string; // "" = brak progu darmowej dostawy
}

export interface CheckoutConfig {
  transferEnabled: boolean;
  bankAccount: string;
  accountOwner: string;
  codEnabled: boolean; // płatność za pobraniem
  codFee: string; // doliczana do zamówienia, "0" = bez opłaty
}

export interface MenuItem {
  label: string;
  /** Ścieżka względem sklepu, np. "/products"; "/" = strona główna */
  href: string;
}

export interface MenuConfig {
  items: MenuItem[];
}

/** Domyślne menu — musi być client-safe (importuje je Navbar). */
export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { label: "Sklep", href: "/produkty" },
  { label: "Blog", href: "/blog" },
  { label: "O nas", href: "/o-nas" },
  { label: "FAQ", href: "/faq" },
  { label: "Kontakt", href: "/kontakt" },
];

export interface LegalConfig {
  content: string; // plain text, renderowany z zachowaniem akapitów
}

export interface AboutConfig {
  headline: string;
  content: string;
  email: string;
  phone: string;
  address: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqConfig {
  items: FaqItem[];
}

// ─── Ustawienia panelu ────────────────────────────────────────────────────────

/** Dane właściciela + firmy (sekcja „Konto i firma"). Email konta jest
 *  read-only (z users), tutaj trzymamy dane kontaktowe i opcjonalne dane firmy. */
export interface AccountConfig {
  firstName: string;
  lastName: string;
  contactEmail: string;
  phone: string;
  company: {
    name: string;
    taxId: string; // NIP
    address: string;
  };
}

/** Piksele / tagi wpinane do storefrontu. Puste = wyłączone. */
export interface IntegrationsConfig {
  gtmId: string; // GTM-XXXXXXX
  metaPixelId: string; // 15–16 cyfr
  ga4Id: string; // G-XXXXXXXXXX
  tiktokPixelId: string;
  googleMerchantId: string; // do meta-tagu weryfikacji
}

/** Zgoda na cookies + mechanizmy zgodności (RODO / Omnibus). */
export interface ComplianceConfig {
  cookieBanner: {
    enabled: boolean;
    // granularne kategorie — piksele marketingowe/analityczne ładują się
    // dopiero po zgodzie w danej kategorii.
    analytics: boolean; // pokaż checkbox „Analityka"
    marketing: boolean; // pokaż checkbox „Marketing"
    message: string;
    policyUrl: string; // link do polityki prywatności
  };
  omnibus: {
    enabled: boolean; // pokazuj „najniższa cena z 30 dni" przy promocjach
  };
}

/** Domyślny rozmiar logo w navbarze — używany, gdy merchant nic nie ustawił. */
export const DEFAULT_LOGO_HEIGHT = 40;
export const DEFAULT_LOGO_MAX_WIDTH = 180;
export const LOGO_HEIGHT_RANGE = { min: 24, max: 96 };
export const LOGO_MAX_WIDTH_RANGE = { min: 80, max: 420 };
/** Minimalna wysokość paska nawigacji (px) — logo może ją podnieść. */
export const NAVBAR_MIN_HEIGHT = 64;

export interface BrandingConfig {
  shopName: string;
  tagline: string;
  logoUrl: string;
  /** Wysokość logo w navbarze (px). Brak = DEFAULT_LOGO_HEIGHT. */
  logoHeight?: number;
  /** Maks. szerokość logo w navbarze (px) — kluczowe dla logo poziomych. */
  logoMaxWidth?: number;
  faviconUrl: string;
  primaryColor: string;
  accentColor: string;
  /** Kolor „pop" marki (badge'e/akcenty). "" = użyj accentu. */
  secondaryColor?: string;
  /** "" = domyślne jasne tło; hex nadpisuje --brand-paper na storefroncie */
  paperColor: string;
  fontFamily: string; // font nagłówków (display)
  bodyFontFamily: string; // font tekstu
  /** Skala zaokrągleń narożników (px). Brak = domyślne z globals.css. */
  radius?: { input: number; card: number; button: number };
}

export interface HomeConfig {
  topBar: TopBarConfig;
  hero: HeroConfig;
  products: ProductsSectionConfig;
  benefits: BenefitsConfig;
  reviews: ReviewsConfig;
  guarantee: GuaranteeConfig;
  video: VideoConfig;
  discounts: DiscountsConfig;
  popup: PopupConfig;
}

// ─── Product type (matches DB schema) ─────────────────────────────────────────

export interface ProductImage {
  url: string;
  alt?: string;
}

export interface ProductBenefit {
  label: string;
  desc: string;
}

export interface ProductSpec {
  key: string;
  value: string;
}

export interface SizeChartRow {
  eu: string;
  uk: string;
  us: string;
  cm: string;
}

export interface ProductFaq {
  q: string;
  a: string;
}

export interface StorefrontProduct {
  id: string;
  name: string;
  category: string | null;
  price: string;
  oldPrice: string | null;
  /** Najniższa cena z 30 dni (Omnibus). null = nie pokazuj (brak historii,
   *  brak promocji lub wyłączone w ustawieniach zgodności). */
  lowestPrice30: string | null;
  badge: string | null;
  rating: string | null;
  reviews: number | null;
  visible: boolean;
  stock: number | null; // null = nieograniczony; 0 = wyprzedane
  shortDesc: string | null;
  description: string | null;
  images: string[];
  video: VideoConfig | null;
  colors: string[];
  sizes: string[];
  benefits: ProductBenefit[];
  specs: ProductSpec[];
  sizeChart: SizeChartRow[];
  faq: ProductFaq[];
  deliveryInfo: string[];
  sortOrder: number;
  type: ProductType;
  fulfillment: ProductFulfillment;
}

export type ProductType = "physical" | "digital" | "service";

export interface ProductFulfillment {
  kind?: "file" | "link" | "license";
  fileUrl?: string;
  url?: string;
  licenseKeys?: string;
  instructions?: string;
  duration?: string;
  mode?: "online" | "onsite" | "both";
  details?: string;
}

/** Linki do social mediów sklepu. Pusty string = ikona nie pojawia się w stopce. */
export interface SocialLinks {
  instagram: string;
  facebook: string;
  x: string;
  youtube: string;
  tiktok: string;
}

export interface FooterConfig {
  /** Zdanie pod nazwą sklepu. Puste = użyj tagline'u z brandingu. */
  description: string;
  social: SocialLinks;
}

export const SOCIAL_PLATFORMS: {
  key: keyof SocialLinks;
  label: string;
  placeholder: string;
}[] = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/twoj-sklep" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/twoj-sklep" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@twoj-sklep" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@twoj-sklep" },
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/twoj-sklep" },
];

// ─── Full shop context (assembled from DB for storefront rendering) ────────────

export interface ShopContext {
  id: string;
  slug: string;
  name: string;
  branding: BrandingConfig;
  home: HomeConfig;
  delivery: DeliveryConfig;
  checkout: CheckoutConfig;
  about: AboutConfig;
  faq: FaqConfig;
  terms: LegalConfig;
  privacy: LegalConfig;
  menu: MenuConfig;
  footer: FooterConfig;
  integrations: IntegrationsConfig;
  compliance: ComplianceConfig;
  products: StorefrontProduct[];
}
