"use client";

import { ArrowRight } from "lucide-react";

type Props = { firstName: string; onContinue: () => void };

export default function Welcome({ firstName, onContinue }: Props) {
  return (
    <div className="text-center">
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-4"
        style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
      >
        Sellflow · onboarding
      </p>
      <h1
        className="font-bold tracking-tight"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--brand-ink)",
          fontSize: "clamp(32px, 5vw, 48px)",
          lineHeight: 1.05,
        }}
      >
        {firstName ? `Cześć ${firstName},` : "Zbudujmy Twój sklep"}
        <br />
        {firstName ? "zbudujmy Twój sklep w kilka minut." : "w kilka minut."}
      </h1>
      <p
        className="mx-auto mt-5 max-w-[460px] text-base"
        style={{ color: "var(--brand-ink-2)", lineHeight: 1.55 }}
      >
        Kilka pytań o to, co sprzedajesz i jak chcesz, żeby Twój sklep wyglądał. Resztą
        zajmiemy się my — zobaczysz go zanim klikniesz Publikuj.
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="mt-9 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-all hover:opacity-90"
        style={{
          background: "var(--brand-accent)",
          color: "var(--brand-paper)",
          fontFamily: "var(--font-body)",
        }}
      >
        Zaczynamy
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
