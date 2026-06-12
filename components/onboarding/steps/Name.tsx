"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, TriangleAlert } from "lucide-react";
import { useOnboarding } from "../state";
import { suggestNames } from "@/lib/brand/inference";
import { slugifyName } from "@/lib/brand/bootstrap";
import StepFooter from "../StepFooter";

type Props = { onNext: () => void; onBack: () => void };

type SlugCheck =
  | { state: "idle" }
  | { state: "checking"; slug: string }
  | { state: "free"; slug: string }
  | { state: "taken"; slug: string; suggestion: string | null };

export default function Name({ onNext, onBack }: Props) {
  const { state, patchBusiness } = useOnboarding();
  const [value, setValue] = useState(state.business.name);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [slugCheck, setSlugCheck] = useState<SlugCheck>({ state: "idle" });
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  // Live availability check, debounced. Informational, never blocking —
  // /api/onboarding picks the suggested variant automatically on save.
  useEffect(() => {
    const name = value.trim();
    if (!name) {
      setSlugCheck({ state: "idle" });
      return;
    }
    const slug = slugifyName(name);
    setSlugCheck({ state: "checking", slug });

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/onboarding/check-slug?slug=${encodeURIComponent(slug)}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("check failed");
        const data = (await res.json()) as { available: boolean; suggestion: string | null };
        setSlugCheck(
          data.available
            ? { state: "free", slug }
            : { state: "taken", slug, suggestion: data.suggestion }
        );
      } catch {
        // network hiccup — stay quiet, the server resolves conflicts on save
        if (!controller.signal.aborted) setSlugCheck({ state: "idle" });
      }
    }, 400);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [value]);

  const suggestions = useMemo(() => suggestNames(state.business.sells), [state.business.sells]);

  const commit = (next: string) => {
    setValue(next);
    patchBusiness({ name: next.trim() });
  };

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-3"
         style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}>
        Krok 1 z 2 · Biznes
      </p>
      <h2 className="text-[28px] font-bold tracking-tight mb-2"
          style={{ fontFamily: "var(--font-display)", color: "var(--brand-ink)", lineHeight: 1.15 }}>
        Jak nazywa się Twój sklep?
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: "var(--brand-ink-2)" }}>
        Możesz wpisać własną nazwę lub poprosić o 10 propozycji dopasowanych do tego, co sprzedajesz.
      </p>

      <div className="mt-7 space-y-3">
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => patchBusiness({ name: value.trim() })}
          placeholder="np. Ember & Oak"
          className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
          style={{
            background: "var(--brand-paper)",
            color: "var(--brand-ink)",
            border: "1.5px solid var(--brand-rule)",
            fontFamily: "var(--font-body)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--brand-navy)")}
        />
        {/* Live address availability */}
        {slugCheck.state !== "idle" && (
          <div
            className="flex items-start gap-2 text-xs rounded-xl px-3.5 py-2.5"
            style={{
              background: "var(--brand-paper)",
              border: "1px solid var(--brand-rule)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {slugCheck.state === "checking" && (
              <>
                <Loader2
                  className="w-3.5 h-3.5 mt-px shrink-0 animate-spin"
                  style={{ color: "var(--brand-ink-2)" }}
                />
                <span style={{ color: "var(--brand-ink-2)" }}>
                  Sprawdzam {slugCheck.slug}.sell-flow.store…
                </span>
              </>
            )}
            {slugCheck.state === "free" && (
              <>
                <Check
                  className="w-3.5 h-3.5 mt-px shrink-0"
                  strokeWidth={2.5}
                  style={{ color: "oklch(52% 0.2 158)" }}
                />
                <span style={{ color: "var(--brand-ink)" }}>
                  {slugCheck.slug}.sell-flow.store{" "}
                  <span style={{ color: "oklch(45% 0.16 158)" }}>jest wolny</span>
                </span>
              </>
            )}
            {slugCheck.state === "taken" && (
              <>
                <TriangleAlert
                  className="w-3.5 h-3.5 mt-px shrink-0"
                  strokeWidth={2}
                  style={{ color: "oklch(60% 0.15 70)" }}
                />
                <span style={{ color: "var(--brand-ink)" }}>
                  {slugCheck.slug}.sell-flow.store jest zajęty
                  {slugCheck.suggestion && (
                    <>
                      {" — "}Twój sklep dostanie adres{" "}
                      <strong>{slugCheck.suggestion}.sell-flow.store</strong>.
                    </>
                  )}{" "}
                  <span style={{ color: "var(--brand-ink-2)" }}>
                    Możesz też zmienić nazwę.
                  </span>
                </span>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowSuggestions(true)}
          className="text-sm font-medium underline-offset-4 hover:underline"
          style={{ color: "var(--brand-navy)" }}
        >
          Nie mam nazwy — podpowiedz 10
        </button>
      </div>

      {showSuggestions && (
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-3"
             style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}>
            10 propozycji dla: {state.business.sells || "Twój sklep"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {suggestions.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => commit(name)}
                className="text-left rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:bg-[var(--brand-paper-2)]"
                style={{
                  background: "var(--brand-paper)",
                  color: "var(--brand-ink)",
                  border: "1px solid var(--brand-rule)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      <StepFooter
        onBack={onBack}
        onSkip={() => { patchBusiness({ name: "" }); onNext(); }}
        onNext={() => { patchBusiness({ name: value.trim() }); onNext(); }}
      />
    </div>
  );
}
