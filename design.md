# Design — Sellflow

Locked design system. Future Hallmark runs read this file first; pages defer
to it. Amend intentionally — the file is the rule.

Snapshot baseline: 2026-05-19, branch `hallmark-refresh-2026-05`. Locks the
brand DNA (palette, type, voice, motion stance). Macrostructure is a candidate
not a hard lock — see § Variants. Audit punch-list in § Notes.

## System
- Genre · modern-minimal (SaaS landing for solo sellers / 10–20 SKU)
- Macrostructure · Marquee Hero *(candidate · landing only)*
- Theme · custom (vibe: "navy + aqua + magenta · technical but warm B2B")
- Axes · light paper / geometric-sans display / cool primary + chromatic-other accents

## Tokens (canonical · `dist/assets/colors_and_type.css` is the current runtime source)

```css
:root {
  /* Paper / ink */
  --color-paper:      oklch(99%  0.005 250);   /* near-white, cool tint */
  --color-paper-2:    oklch(98%  0.025 195);   /* muted aqua wash */
  --color-paper-3:    oklch(97%  0.008 250);   /* neutral surface */
  --color-ink:        oklch(11%  0.10  275);   /* deep ink (was #000031) */
  --color-ink-2:      oklch(40%  0.06  240);   /* muted ink */
  --color-rule:       oklch(91%  0.020 230);   /* hairline */

  /* Primary anchor — navy */
  --color-primary:    oklch(22%  0.24  270);   /* was #00007D */
  --color-primary-2:  oklch(17%  0.22  273);   /* was #000058 */
  --color-primary-3:  oklch(96%  0.015 270);   /* was #F2F2FF */

  /* Accent A — aqua */
  --color-aqua:       oklch(80%  0.16  195);   /* was #00E5F0 */
  --color-aqua-2:     oklch(91%  0.09  195);   /* was #7CF5FA */

  /* Accent B — magenta (destructive / hot) */
  --color-magenta:    oklch(56%  0.30  335);   /* was #DB00B2 */
  --color-magenta-2:  oklch(46%  0.25  333);   /* was #A3008A */

  /* Status */
  --color-success:    oklch(50%  0.13  160);
  --color-warning:    oklch(76%  0.16   75);

  /* Focus — must be visible at ≥3:1 on every surface */
  --color-focus:      var(--color-primary);

  /* Type */
  --font-display: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-body:    "Inter Tight", "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;

  /* 4-pt spacing — exists as --sf-space-1..9 in colors_and_type.css.
     Canonical names: --space-3xs (4) … --space-4xl (96). */

  /* Type scale (1.25 major-third) — exists as --sf-text-xs..6xl.
     12 / 14 / 16 / 18 / 22 / 28 / 36 / 48 / 64 / 88 px. */

  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in:     cubic-bezier(0.7,  0, 0.84, 0);
  --dur-fast:    120ms;
  --dur-base:    200ms;
  --dur-slow:    360ms;

  --radius-card:  16px;
  --radius-pill:  999px;
  --radius-input: 12px;
}
```

Legacy aliases (`--sf-*`) in `dist/assets/colors_and_type.css` map 1:1 onto
the canonical tokens above. Don't add new `--sf-*` tokens — extend the
canonical block, then alias if needed.

## CTA voice
- **Primary** · navy fill (`--color-primary`) · pill radius · 14×22 padding · `--font-body` semibold · no all-caps
- **Accent** · magenta fill (`--color-magenta`) · pill radius · same padding · reserved for the *one* hot CTA per view (waitlist signup)
- **Ghost** · transparent fill · 1.5px `--color-rule` outline · darkens on hover
- Labels: imperative verb, ≤ 3 words, no exclamation. *"Zapisz się"*, *"Zobacz demo"*, *"Czytaj"*. Not *"Get started for free!"*

## Motion stance
- **One** orchestrated entrance per page (hero only). Rest of the page is just there.
- Spatial reveals: `opacity 0→1 + translateY(12px→0)` over `--dur-slow` with `--ease-out`. Stagger ≤ 80ms between siblings, max 3 siblings.
- Hover signal per element: **one** of {border-shift, background-tint, underline} — never lift + shadow + colour-change together.
- Reduced-motion fallback (mandatory): `@media (prefers-reduced-motion: reduce)` → all animation/transition durations clamped to 0.01ms; spatial moves collapse to a ≤150ms opacity crossfade.
- `:focus-visible` rings render **instantly** (no transition on `outline` / `box-shadow` at focus moment).

## Variants
- **Landing (`/`)** · Marquee Hero · vary section padding (96 / 80 / 120 / 144 / 80 / 64 px — break the 120px monotony)
- **Blog index (`/blog/`)** · Long Document or Bento Grid — not Marquee Hero
- **Article (`/blog/<slug>/`)** · Long Document — single-column, 64ch measure, no section eyebrows beyond chapter numbering
- **Legal (`terms`, `privacy-policy`)** · plain document, body font only, no hero

## Notes — audit punch-list (2026-05-19)

These are the deviations between current shipping code and this locked system.
They are removed progressively over the `hallmark-refresh-2026-05` branch:

1. **Re-drawn browser chrome** in [hero.css:139-162](dist/hero.css) and [showcase.css:175-218](dist/showcase.css) — replace with real screenshot or typographic-only proof.
2. **Floating-orb decorations** (5 instances) in [showcase.css:20-36](dist/showcase.css) and [benefits-faq.css:302-323](dist/benefits-faq.css) — remove.
3. **Aurora / radial-gradient hero backgrounds** in [hero.css:9-16](dist/hero.css), [benefits-faq.css:247-253](dist/benefits-faq.css), [benefits-faq.css:355-362](dist/benefits-faq.css) — solid navy + optional grain.
4. **Gradient headline** (`background-clip:text`) in [benefits-faq.css:336-341](dist/benefits-faq.css) — solid white.
5. **Invented metrics** (KPI cards 4,2% / +12 / PL·EN·DE) in [hero.css:222-274](dist/hero.css) — remove or replace with em-dash placeholder until real numbers exist.
6. **Eyebrow on every section** — keep on max 2 ordinal sections (Demo · Beta), drop from 6 others.
7. **Tag-left / header-right two-column heads** in [problems-how.css:96-103](dist/problems-how.css) and [benefits-faq.css:21-29](dist/benefits-faq.css) — flatten to single column.
8. **AI nav** (N1 wordmark + inline links + CTA + sticky blur) — migrate to N5 Floating Pill or radically simplify to logo + one primary CTA.
9. **AI footer** (3-col index) — migrate to Ft1 Mast-headed or Ft5 Statement.
10. **Pure-white surface** `#FFFFFF` — replace with `--color-paper` (cool-tinted near-white).
11. **One-font page** (Space Grotesk for display *and* body) — pair Space Grotesk display + Inter Tight body.
12. **Missing `prefers-reduced-motion`** in every CSS file — add global guard.
13. **Missing `:focus-visible`** on every interactive — add via `--color-focus` token.
14. **Universal hover-lift** (`translateY(-4px)` on every card) — pick one signal per element.
15. **Animate-on-scroll on everything** (`.sf-reveal` on every section) — limit to one orchestrated entrance.
16. **Mid-render token improvisation** — replace inline hex / raw rgba with `var(--token)` references. Lines: [benefits-faq.css:289](dist/benefits-faq.css), [showcase.css:200-202](dist/showcase.css), [problems-how.css:298](dist/problems-how.css), [hero.css:13-15](dist/hero.css).
17. **`overflow-x: hidden` on body** in [styles.css:9](dist/styles.css) — change to `clip`.
18. **`z-index: 9999`** in [dist/index.html:238](dist/index.html) — introduce named z-scale.
19. **Bouncy `sfPop` (1.06× overshoot) on UI tags** in [showcase.css:404-412](dist/showcase.css) — remove overshoot, use `--ease-out`.
20. **Stripe-pills "fake integration"** in [www/i18n.jsx:27](www/i18n.jsx) — either real partner logos or change `stripeLabel` away from "Zintegrowane z…".
21. **Identical 120px section padding** everywhere — vary per Variants table above.

## Exports

`dist/assets/colors_and_type.css` (in this project) is the current source of
truth for runtime tokens. For Tailwind v4 `@theme`, DTCG `tokens.json`, or
shadcn/ui CSS variables, ask *"extend design.md with Tailwind exports"* (or
the format you want) — Hallmark will append them per
[`export-formats.md`](../../.claude/skills/hallmark/references/export-formats.md).
