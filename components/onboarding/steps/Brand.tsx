"use client";

import { useCallback, useMemo } from "react";
import { useOnboarding } from "../state";
import StepFooter from "../StepFooter";
import MiniPreview from "../MiniPreview";
import type { Sliders } from "@/lib/brand/types";

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

const SLIDER_DEFS: Array<{ key: keyof Sliders; left: string; right: string }> = [
  { key: "minimal_expressive", left: "Minimalistyczna", right: "Ekspresyjna" },
  { key: "soft_sharp",         left: "Miękka",          right: "Ostra" },
  { key: "modern_classic",     left: "Nowoczesna",      right: "Klasyczna" },
  { key: "mono_color",         left: "Monochromat",     right: "Kolor" },
  { key: "industrial_organic", left: "Industrialna",    right: "Organiczna" },
];

const TRAIT_MAX = 5;
const TONE_MAX = 3;

export default function Brand({ onNext, onBack }: Props) {
  const { state, setTraits, setTone, setSliders } = useOnboarding();

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

  const onSlider = (key: keyof Sliders, value: number) => {
    setSliders({ ...state.brand.sliders, [key]: value });
  };

  return (
    <div className="grid lg:grid-cols-[1fr_420px] gap-8">
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
            Estetyka
          </h2>
          <p className="text-sm mb-5" style={{ color: "var(--brand-ink-2)" }}>
            Każdy suwak — wpływ na kompozycję, paletę i kroje pisma.
          </p>
          <div className="space-y-5">
            {SLIDER_DEFS.map(({ key, left, right }) => (
              <div key={key}>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={state.brand.sliders[key]}
                    onChange={(e) => onSlider(key, Number(e.target.value))}
                    aria-label={`${left} ↔ ${right}`}
                    className="flex-1 accent-[var(--brand-accent)]"
                  />
                  <span className="text-xs font-mono w-9 text-right"
                        style={{ color: "var(--brand-ink-2)" }}>
                    {state.brand.sliders[key]}
                  </span>
                </div>
                <div className="flex justify-between mt-1.5 text-[11px] tracking-wide"
                     style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}>
                  <span>{left}</span>
                  <span>{right}</span>
                </div>
              </div>
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
