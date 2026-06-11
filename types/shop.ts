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

export interface BrandingConfig {
  shopName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
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
  badge: string | null;
  rating: string | null;
  reviews: number | null;
  visible: boolean;
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
}

// ─── Full shop context (assembled from DB for storefront rendering) ────────────

export interface ShopContext {
  id: string;
  slug: string;
  name: string;
  branding: BrandingConfig;
  home: HomeConfig;
  delivery: DeliveryConfig;
  checkout: CheckoutConfig;
  products: StorefrontProduct[];
}
