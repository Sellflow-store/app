"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useOnboarding } from "../state";
import { suggestNames } from "@/lib/brand/inference";
import StepFooter from "../StepFooter";

type Props = { onNext: () => void; onBack: () => void };

export default function Name({ onNext, onBack }: Props) {
  const { state, patchBusiness } = useOnboarding();
  const [value, setValue] = useState(state.business.name);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

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
