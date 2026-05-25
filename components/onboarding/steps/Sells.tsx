"use client";

import { useEffect, useRef, useState } from "react";
import { useOnboarding } from "../state";
import StepFooter from "../StepFooter";

type Props = { onNext: () => void; onBack: () => void };

export default function Sells({ onNext, onBack }: Props) {
  const { state, patchBusiness } = useOnboarding();
  const [value, setValue] = useState(state.business.sells);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const commit = () => patchBusiness({ sells: value.trim() });

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-3"
         style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}>
        Krok 1 z 2 · Biznes
      </p>
      <h2 className="text-[28px] font-bold tracking-tight mb-2"
          style={{ fontFamily: "var(--font-display)", color: "var(--brand-ink)", lineHeight: 1.15 }}>
        Co sprzedajesz?
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: "var(--brand-ink-2)" }}>
        Wystarczy krótko — np. „ręcznie robione świece sojowe” albo „kursy o copywritingu B2B”.
        To jedyne pytanie wymagane na tym etapie — resztę zaproponuje AI.
      </p>

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        placeholder="Świece, ceramika, e-book, plecak…"
        rows={3}
        className="mt-7 w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors resize-y"
        style={{
          background: "var(--brand-paper)",
          color: "var(--brand-ink)",
          border: "1.5px solid var(--brand-rule)",
          fontFamily: "var(--font-body)",
          minHeight: 96,
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--brand-navy)")}
      />

      <StepFooter
        onBack={onBack}
        onNext={() => { commit(); onNext(); }}
        nextDisabled={value.trim().length === 0}
      />
    </div>
  );
}
