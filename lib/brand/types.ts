// Brand + onboarding state types. Ported from Sellflow-store/www onboarding
// + shop-v2 bootstrap. Single source of truth in Sellflow-app.

export type Sliders = {
  minimal_expressive: number
  soft_sharp: number
  modern_classic: number
  mono_color: number
  industrial_organic: number
}

export type Business = {
  sells: string
  name: string
  logoDataUrl: string | null
  problem: string
  edge: string
}

export type Brand = {
  traits: string[]
  tone: string[]
  sliders: Sliders
}

export type OnboardingState = {
  business: Business
  brand: Brand
  /** Set once the live preview has rendered at least once. Gates Save modal. */
  previewSeen: boolean
}

export type Inferred = {
  category: string
  audience: string
  palette: [string, string, string] // [paper, ink, accent]
  layout_type: 'editorial' | 'grid' | 'card'
  hero_headline: string
  hero_sub: string
  effective_name: string
  font_pair: { display: string; body: string }
}

export const STORAGE_KEY = 'sellflow_onboarding_v1'

export const DEFAULT_SLIDERS: Sliders = {
  minimal_expressive: 50,
  soft_sharp: 50,
  modern_classic: 50,
  mono_color: 50,
  industrial_organic: 50,
}

export const INITIAL_STATE: OnboardingState = {
  business: { sells: '', name: '', logoDataUrl: null, problem: '', edge: '' },
  brand: { traits: [], tone: [], sliders: { ...DEFAULT_SLIDERS } },
  previewSeen: false,
}

// ─── Bootstrap payload (handed off from onboarding to API + storefront) ───

export type BootstrapProduct = {
  name: string
  price: string
  originalPrice?: string
  description: string
  badge?: 'sale' | 'new' | 'bestseller'
  collections: string[]
}

/** Full shape sent to /api/onboarding. Drizzle persists store fields into
 *  shopConfig (key: branding | home) and creates a row in `shops`. */
export type StoreBootstrap = {
  version: 1
  bootstrapId: string
  store: {
    name: string
    sells: string
    storyShort: string
    logoDataUrl: string | null
    category: string
    audience: string
    layout_type: Inferred['layout_type']
    hero_headline: string
    hero_sub: string
    products: BootstrapProduct[]
  }
  brand: {
    palette: { paper: string; ink: string; accent: string }
    fonts: { display: string; body: string }
    traits: string[]
    tone: string[]
  }
}
