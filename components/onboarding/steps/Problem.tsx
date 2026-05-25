"use client";

import { useEffect, useRef, useState } from "react";
import { useOnboarding } from "../state";
import StepFooter from "../StepFooter";

type Props = { onNext: () => void; onBack: () => void };

export default function Problem({ onNext, onBack }: Props) {
  const { state, patchBusiness } = useOnboarding();
  const [value, setValue] = useState(state.business.problem);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const commit = () => patchBusiness({ problem: value.trim() });

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-3"
         style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}>
        Krok 1 z 2 · Biznes
      </p>
      <h2 className="text-[28px] font-bold tracking-tight mb-2"
          style={{ fontFamily: "var(--font-display)", color: "var(--brand-ink)", lineHeight: 1.15 }}>
        Jaki problem rozwiązujesz?
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: "var(--brand-ink-2)" }}>
        Jednym, dwoma zdaniami. Np. „Większość świec na rynku pachnie sztucznie — a ludzie chcą,
        żeby ich dom pachniał spokojem.”
      </p>

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        placeholder="Wpisz tu problem, który widzisz u swoich klientów…"
        rows={4}
        className="mt-7 w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors resize-y"
        style={{
          background: "var(--brand-paper)",
          color: "var(--brand-ink)",
          border: "1.5px solid var(--brand-rule)",
          fontFamily: "var(--font-body)",
          minHeight: 112,
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--brand-navy)")}
      />

      <StepFooter
        onBack={onBack}
        onSkip={() => { patchBusiness({ problem: "" }); onNext(); }}
        onNext={() => { commit(); onNext(); }}
      />
    </div>
  );
}
