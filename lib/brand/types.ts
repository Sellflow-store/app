// Brand + onboarding state types. Ported from Sellflow-store/www onboarding
// + shop-v2 bootstrap. Single source of truth in Sellflow-app.

/** Jeden z czterech gotowych stylów sklepu — patrz lib/brand/presets.ts. */
export type StylePresetId = 'minimal' | 'warm' | 'bold' | 'elegant'

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
  preset: StylePresetId
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

// v2: brand.sliders → brand.preset. Stary klucz v1 zostaje zignorowany,
// draft z suwakami nie da się sensownie zmapować na preset.
export const STORAGE_KEY = 'sellflow_onboarding_v2'

export const DEFAULT_PRESET: StylePresetId = 'minimal'

export const INITIAL_STATE: OnboardingState = {
  business: { sells: '', name: '', logoDataUrl: null, problem: '', edge: '' },
  brand: { traits: [], tone: [], preset: DEFAULT_PRESET },
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
    palette: { paper: string; ink: string; accent: string; secondary: string }
    fonts: { display: string; body: string }
    /** Skala zaokrągleń presetu (px); payloady sprzed presetów jej nie mają. */
    radius?: { input: number; card: number; button: number }
    traits: string[]
    tone: string[]
    /** Optional: payloady sprzed wprowadzenia presetów go nie mają. */
    preset?: StylePresetId
  }
}
