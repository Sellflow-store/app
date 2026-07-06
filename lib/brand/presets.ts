import type { Inferred, StylePresetId } from './types'

/**
 * Cztery gotowe style sklepu z systemu „Sellflow – Shop Style System"
 * (Figma, autor: Michał). Merchant wybiera jeden preset w onboardingu
 * (i może go zmienić później w panelu Ustawienia → Styl sklepu). Każdy
 * preset to komplet: paleta, para fontów, typ layoutu hero oraz skala
 * zaokrągleń narożników — więc wybór zawsze daje wyraźnie inny sklep.
 *
 * Mapowanie palety Figmy (primary / secondary / tertiary / …) na nasze
 * cztery role:
 *   paper     = Background
 *   ink       = Text Primary
 *   accent    = kolor CTA / głównego przycisku (wierny Figmie — w Bold
 *               i Elegant to czerń, w Minimal/Warm to kolor marki)
 *   secondary = kolor „pop" marki na akcentach/badge'ach (neon róż,
 *               złoto, oliwka) — tam gdzie CTA jest czarne, tu żyje
 *               kolor-tożsamość stylu
 *
 * Fonty muszą pochodzić z katalogu lib/fonts.ts (BrandTheme dociąga je
 * z Google Fonts po nazwie rodziny).
 */

/** Skala zaokrągleń narożników (px). `button: 9999` = pełny pill. */
export type RadiusScale = {
  input: number
  card: number
  button: number
}

export type StylePreset = {
  id: StylePresetId
  name: string
  tagline: string
  palette: { paper: string; ink: string; accent: string; secondary: string }
  /** Nazwy rodzin (persystowane w branding.fontFamily / bodyFontFamily). */
  fonts: { display: string; body: string }
  /** Pełne stacki CSS (używane w podglądach renderowanych inline). */
  fontStacks: { display: string; body: string }
  layout_type: Inferred['layout_type']
  /** System narożników — patrz sekcja „Corner Radius" w pliku Figmy. */
  radius: RadiusScale
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'minimal',
    name: 'Minimal Modern',
    tagline: 'Czysto, pewnie, z oddechem. Świetny do ogólnych i tech sklepów.',
    palette: { paper: '#FFFFFF', ink: '#171717', accent: '#2563EB', secondary: '#2563EB' },
    fonts: { display: 'Space Grotesk', body: 'Inter' },
    fontStacks: {
      display: `"Space Grotesk", system-ui, sans-serif`,
      body: `"Inter", system-ui, sans-serif`,
    },
    layout_type: 'grid',
    radius: { input: 4, card: 8, button: 8 },
  },
  {
    id: 'warm',
    name: 'Warm Craft',
    tagline: 'Ciepło, dotykowo, ręcznie robione. Do rękodzieła i craftu.',
    palette: { paper: '#FBF7F0', ink: '#3A2E24', accent: '#B5502D', secondary: '#6B7A4F' },
    fonts: { display: 'Fraunces', body: 'Karla' },
    fontStacks: {
      display: `"Fraunces", Georgia, serif`,
      body: `"Karla", system-ui, sans-serif`,
    },
    layout_type: 'card',
    radius: { input: 12, card: 20, button: 20 },
  },
  {
    id: 'bold',
    name: 'Bold Street',
    tagline: 'Wysoki kontrast, energia, bez kompromisów. Streetwear i moda.',
    palette: { paper: '#FFFFFF', ink: '#0A0A0A', accent: '#0A0A0A', secondary: '#FF3366' },
    fonts: { display: 'Anton', body: 'Work Sans' },
    fontStacks: {
      display: `"Anton", Impact, system-ui, sans-serif`,
      body: `"Work Sans", system-ui, sans-serif`,
    },
    layout_type: 'grid',
    radius: { input: 0, card: 2, button: 2 },
  },
  {
    id: 'elegant',
    name: 'Elegant Luxe',
    tagline: 'Wyrafinowanie, premium, editorial. Do beauty, biżuterii i lifestyle.',
    palette: { paper: '#FFFFFF', ink: '#1A1A1A', accent: '#1A1A1A', secondary: '#C6A664' },
    fonts: { display: 'Playfair Display', body: 'Jost' },
    fontStacks: {
      display: `"Playfair Display", Georgia, serif`,
      body: `"Jost", system-ui, sans-serif`,
    },
    layout_type: 'editorial',
    radius: { input: 2, card: 4, button: 9999 },
  },
]

/** Wszystkie rodziny używane przez presety — do załadowania w miejscach,
 *  które renderują miniatury stylów (wizard, panel). */
export const PRESET_FONT_FAMILIES: string[] = [
  ...new Set(STYLE_PRESETS.flatMap((p) => [p.fonts.display, p.fonts.body])),
]

/** Stare identyfikatory presetów (sprzed systemu Michała) → najbliższy nowy.
 *  Dzięki temu sklepy z zapisanym `brand.preset` sprzed migracji nadal
 *  rozwiązują się na sensowny styl zamiast lecieć na domyślny. */
const LEGACY_PRESET_ALIASES: Record<string, StylePresetId> = {
  pastel: 'warm',
  vivid: 'bold',
  mono: 'minimal',
  earth: 'warm',
}

export function isStylePresetId(v: unknown): v is StylePresetId {
  return typeof v === 'string' && STYLE_PRESETS.some((p) => p.id === v)
}

export function getStylePreset(id: StylePresetId): StylePreset {
  const direct = STYLE_PRESETS.find((p) => p.id === id)
  if (direct) return direct
  const legacy = typeof id === 'string' ? LEGACY_PRESET_ALIASES[id] : undefined
  if (legacy) return STYLE_PRESETS.find((p) => p.id === legacy) ?? STYLE_PRESETS[0]
  return STYLE_PRESETS[0] // minimal
}
