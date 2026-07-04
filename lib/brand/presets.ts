import type { Inferred, StylePresetId } from './types'

/**
 * Cztery gotowe style sklepu. Zastępują dawne suwaki estetyki — merchant
 * wybiera jeden preset w onboardingu (i może go zmienić później w panelu
 * Ustawienia → Styl sklepu). Każdy preset to komplet: paleta, para fontów
 * i typ layoutu hero, więc wybór zawsze daje wyraźnie inny sklep.
 *
 * Fonty muszą pochodzić z katalogu lib/fonts.ts (BrandTheme dociąga je
 * z Google Fonts po nazwie rodziny).
 */

export type StylePreset = {
  id: StylePresetId
  name: string
  tagline: string
  palette: { paper: string; ink: string; accent: string }
  /** Nazwy rodzin (persystowane w branding.fontFamily / bodyFontFamily). */
  fonts: { display: string; body: string }
  /** Pełne stacki CSS (używane w podglądach renderowanych inline). */
  fontStacks: { display: string; body: string }
  layout_type: Inferred['layout_type']
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'pastel',
    name: 'Pastelowy',
    tagline: 'Miękkie kolory i zaokrąglone formy. Lekko i przyjaźnie.',
    palette: { paper: '#FAF4F1', ink: '#46394B', accent: '#D8A7B8' },
    fonts: { display: 'Outfit', body: 'Manrope' },
    fontStacks: {
      display: `"Outfit", system-ui, sans-serif`,
      body: `"Manrope", system-ui, sans-serif`,
    },
    layout_type: 'card',
  },
  {
    id: 'vivid',
    name: 'Energetyczny',
    tagline: 'Żywy kolor i mocna typografia. Marka, którą widać.',
    palette: { paper: '#FFFFFF', ink: '#191036', accent: '#6C3BFF' },
    fonts: { display: 'Space Grotesk', body: 'Inter Tight' },
    fontStacks: {
      display: `"Space Grotesk", system-ui, sans-serif`,
      body: `"Inter Tight", "Inter", system-ui, sans-serif`,
    },
    layout_type: 'grid',
  },
  {
    id: 'mono',
    name: 'Monochrom',
    tagline: 'Czerń, biel i elegancki serif. Ponadczasowy editorial.',
    palette: { paper: '#FAFAF8', ink: '#0B0B0B', accent: '#171717' },
    fonts: { display: 'Playfair Display', body: 'Inter Tight' },
    fontStacks: {
      display: `"Playfair Display", Georgia, serif`,
      body: `"Inter Tight", "Inter", system-ui, sans-serif`,
    },
    layout_type: 'editorial',
  },
  {
    id: 'earth',
    name: 'Naturalny',
    tagline: 'Ciepłe, ziemiste tony. Rzemieślniczy, organiczny charakter.',
    palette: { paper: '#F1EAE0', ink: '#2C241C', accent: '#B4602F' },
    fonts: { display: 'Fraunces', body: 'Work Sans' },
    fontStacks: {
      display: `"Fraunces", Georgia, serif`,
      body: `"Work Sans", system-ui, sans-serif`,
    },
    layout_type: 'editorial',
  },
]

/** Wszystkie rodziny używane przez presety — do załadowania w miejscach,
 *  które renderują miniatury stylów (wizard, panel). */
export const PRESET_FONT_FAMILIES: string[] = [
  ...new Set(STYLE_PRESETS.flatMap((p) => [p.fonts.display, p.fonts.body])),
]

export function isStylePresetId(v: unknown): v is StylePresetId {
  return typeof v === 'string' && STYLE_PRESETS.some((p) => p.id === v)
}

export function getStylePreset(id: StylePresetId): StylePreset {
  return STYLE_PRESETS.find((p) => p.id === id) ?? STYLE_PRESETS[2] // mono
}
