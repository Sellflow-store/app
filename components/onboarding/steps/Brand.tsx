"use client";

import { useCallback, useMemo } from "react";
import { Check } from "lucide-react";
import { useOnboarding } from "../state";
import StepFooter from "../StepFooter";
import MiniPreview from "../MiniPreview";
import { STYLE_PRESETS, PRESET_FONT_FAMILIES, type StylePreset } from "@/lib/brand/presets";
import { googleFontsHref } from "@/lib/fonts";

type Props = { onNext: () => void; onBack: () => void };

const TRAIT_OPTIONS = [
  "Ciepła", "Minimalistyczna", "Szczera", "Odważna", "Spokojna",
  "Eksperymentalna", "Premium", "Rzemieślnicza", "Nowoczesna", "Klasyczna",
  "Zabawna", "Surowa",
] as const;

const TONE_OPTIONS = [
  "Spokojny", "Poetycki", "Bezpośredni", "Ciepły",
  "Profesjonalny", "Zabawny", "Pewny siebie",
] as const;

const TRAIT_MAX = 5;
const TONE_MAX = 3;

export default function Brand({ onNext, onBack }: Props) {
  const { state, setTraits, setTone, setPreset } = useOnboarding();

  const traitsSet = useMemo(() => new Set(state.brand.traits), [state.brand.traits]);
  const toneSet   = useMemo(() => new Set(state.brand.tone),   [state.brand.tone]);

  const toggleTrait = useCallback((t: string) => {
    if (traitsSet.has(t)) setTraits(state.brand.traits.filter(x => x !== t));
    else if (state.brand.traits.length < TRAIT_MAX) setTraits([...state.brand.traits, t]);
  }, [traitsSet, state.brand.traits, setTraits]);

  const toggleTone = useCallback((t: string) => {
    if (toneSet.has(t)) setTone(state.brand.tone.filter(x => x !== t));
    else if (state.brand.tone.length < TONE_MAX) setTone([...state.brand.tone, t]);
  }, [toneSet, state.brand.tone, setTone]);

  // Fonty presetów — bez nich miniatury stylów i podgląd renderują fallbacki.
  const presetFontsHref = googleFontsHref(PRESET_FONT_FAMILIES);

  return (
    <div className="grid lg:grid-cols-[1fr_420px] gap-8">
      {presetFontsHref && <link rel="stylesheet" href={presetFontsHref} />}
      {/* Left — controls */}
      <div className="space-y-6">
        <section
          className="rounded-2xl p-6"
          style={{ background: "var(--brand-paper)", border: "1px solid var(--brand-rule)" }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-3"
             style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}>
            Krok 2 z 2 · Styl
          </p>
          <h2 className="text-xl font-bold tracking-tight mb-1"
              style={{ fontFamily: "var(--font-display)", color: "var(--brand-ink)" }}>
            Cechy marki
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--brand-ink-2)" }}>
            Wybierz do {TRAIT_MAX}. Po prawej zobaczysz, jak zmienia się Twój sklep.
          </p>
          <Pills items={TRAIT_OPTIONS} selected={traitsSet} max={TRAIT_MAX}
                 selectedCount={state.brand.traits.length} onToggle={toggleTrait} />
          <p className="mt-3 text-xs" style={{ color: "var(--brand-ink-2)" }}>
            {state.brand.traits.length} / {TRAIT_MAX}
          </p>
        </section>

        <section
          className="rounded-2xl p-6"
          style={{ background: "var(--brand-paper)", border: "1px solid var(--brand-rule)" }}
        >
          <h2 className="text-xl font-bold tracking-tight mb-1"
              style={{ fontFamily: "var(--font-display)", color: "var(--brand-ink)" }}>
            Ton komunikacji
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--brand-ink-2)" }}>
            Wybierz do {TONE_MAX}.
          </p>
          <Pills items={TONE_OPTIONS} selected={toneSet} max={TONE_MAX}
                 selectedCount={state.brand.tone.length} onToggle={toggleTone} />
          <p className="mt-3 text-xs" style={{ color: "var(--brand-ink-2)" }}>
            {state.brand.tone.length} / {TONE_MAX}
          </p>
        </section>

        <section
          className="rounded-2xl p-6"
          style={{ background: "var(--brand-paper)", border: "1px solid var(--brand-rule)" }}
        >
          <h2 className="text-xl font-bold tracking-tight mb-1"
              style={{ fontFamily: "var(--font-display)", color: "var(--brand-ink)" }}>
            Styl sklepu
          </h2>
          <p className="text-sm mb-5" style={{ color: "var(--brand-ink-2)" }}>
            Wybierz jeden z czterech stylów — paletę, typografię i układ.
            Później możesz go zmienić w panelu.
          </p>
          <div className="grid sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Styl sklepu">
            {STYLE_PRESETS.map((p) => (
              <PresetCard
                key={p.id}
                preset={p}
                selected={state.brand.preset === p.id}
                onSelect={() => setPreset(p.id)}
              />
            ))}
          </div>
        </section>

        <StepFooter
          onBack={onBack}
          onSkip={onNext}
          nextLabel="Pokaż mój sklep"
          onNext={onNext}
        />
      </div>

      {/* Right — live mini-preview */}
      <div
        className="rounded-2xl overflow-hidden self-start sticky top-6"
        style={{ border: "1px solid var(--brand-rule)", background: "var(--brand-paper)" }}
      >
        <div
          className="flex items-center gap-1.5 px-3 py-2.5 text-[11px]"
          style={{
            borderBottom: "1px solid var(--brand-rule)",
            background: "var(--brand-paper-3)",
            color: "var(--brand-ink-2)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--brand-rule)" }} />
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--brand-rule)" }} />
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--brand-rule)" }} />
          <span className="ml-3">twoja-marka.sellflow.app · podgląd</span>
        </div>
        <MiniPreview compact />
      </div>
    </div>
  );
}

function PresetCard({
  preset, selected, onSelect,
}: {
  preset: StylePreset;
  selected: boolean;
  onSelect: () => void;
}) {
  const { paper, ink, accent, secondary } = preset.palette;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="text-left rounded-2xl overflow-hidden transition-all focus-visible:outline-2"
      style={{
        border: selected
          ? "2px solid var(--brand-accent)"
          : "1.5px solid var(--brand-rule)",
        boxShadow: selected ? "0 0 0 3px color-mix(in srgb, var(--brand-accent) 18%, transparent)" : "none",
      }}
    >
      {/* Miniatura stylu — mikro-makieta sklepu w palecie presetu */}
      <div style={{ background: paper, padding: "16px 16px 14px" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span style={{ width: 10, height: 10, borderRadius: Math.min(preset.radius.button, 999), background: secondary, display: "inline-block" }} />
            <span style={{ fontFamily: preset.fontStacks.display, fontWeight: 700, fontSize: 12, color: ink }}>
              Marka
            </span>
          </div>
          <div className="flex gap-1">
            {[ink, secondary, accent].map((c, i) => (
              <span key={i} style={{
                width: 12, height: 12, borderRadius: 999, background: c,
                border: "1px solid rgba(0,0,0,0.12)", display: "inline-block",
              }} />
            ))}
          </div>
        </div>
        <div style={{ fontFamily: preset.fontStacks.display, color: ink, fontSize: 17, lineHeight: 1.15, fontWeight: 700, letterSpacing: "-0.01em" }}>
          Dobre rzeczy,<br />robione powoli
        </div>
        <div className="mt-2 space-y-1">
          <div style={{ height: 4, width: "82%", borderRadius: 2, background: ink, opacity: 0.22 }} />
          <div style={{ height: 4, width: "60%", borderRadius: 2, background: ink, opacity: 0.22 }} />
        </div>
        <span style={{
          display: "inline-block", marginTop: 10, padding: "5px 12px",
          background: accent, color: pickReadable(accent),
          borderRadius: preset.radius.button,
          fontSize: 10, fontWeight: 700, fontFamily: preset.fontStacks.body,
        }}>
          Kup teraz
        </span>
      </div>
      <div
        className="px-4 py-2.5"
        style={{ background: "var(--brand-paper)", borderTop: "1px solid var(--brand-rule)" }}
      >
        <p className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--brand-ink)" }}>
          {preset.name}
          {selected && <Check className="w-3.5 h-3.5" style={{ color: "var(--brand-accent)" }} strokeWidth={3} />}
        </p>
        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: "var(--brand-ink-2)" }}>
          {preset.tagline}
        </p>
      </div>
    </button>
  );
}

/** Czytelny kolor tekstu na kolorowym tle (ta sama heurystyka co BrandTheme). */
function pickReadable(hex: string): string {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => {
    const c = x / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#0c0c0c" : "#ffffff";
}

function Pills({
  items, selected, max, selectedCount, onToggle,
}: {
  items: readonly string[];
  selected: Set<string>;
  max: number;
  selectedCount: number;
  onToggle: (t: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t) => {
        const on = selected.has(t);
        const locked = !on && selectedCount >= max;
        return (
          <button
            key={t}
            type="button"
            aria-pressed={on}
            disabled={locked}
            onClick={() => onToggle(t)}
            className="rounded-full px-3.5 py-1.5 text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: on ? "var(--brand-ink)" : "transparent",
              color: on ? "var(--brand-paper)" : "var(--brand-ink)",
              border: `1.5px solid ${on ? "var(--brand-ink)" : "var(--brand-rule)"}`,
              fontFamily: "var(--font-body)",
            }}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}
