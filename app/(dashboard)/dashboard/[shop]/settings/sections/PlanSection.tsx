"use client";

import { ShoppingBag, Sparkles } from "lucide-react";
import { SectionTitle, LockedCard, P } from "../ui";
import { PLANS } from "@/lib/plans";

// Opis planu dla merchanta. Płatne plany (Starter, Pro) to dziś program beta
// dla pierwszych sklepów: cena ustalana indywidualnie i rozliczana poza
// panelem, więc kwoty tu nie pokazujemy.
const PLAN_COPY: Record<keyof typeof PLANS, string> = {
  free: "Bezpłatny plan na start: do 10 produktów w sklepie.",
  starter: "Do 100 produktów i własna domena, w cenie dla pierwszych sklepów na Sellflow.",
  pro: "Pełny zakres funkcji bez limitu produktów, w cenie dla pierwszych sklepów na Sellflow.",
};

export default function PlanSection({ currentPlan }: { currentPlan: string }) {
  const planId = (currentPlan in PLANS ? currentPlan : "free") as keyof typeof PLANS;
  const plan = PLANS[planId];
  const isBeta = planId !== "free";

  return (
    <div>
      <SectionTitle title="Rozliczenia" desc="Zarządzaj swoim planem." />

      <div className="rounded-2xl p-5 mb-5 flex items-center justify-between gap-4"
        style={{ background: P.surface, border: `1px solid ${P.border}` }}>
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center rounded-xl shrink-0"
            style={{ width: 40, height: 40, background: P.surface2, color: P.muted }}>
            <ShoppingBag className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-base font-semibold flex items-center gap-2" style={{ color: P.ink, fontFamily: "var(--font-display)" }}>
              Plan {plan.label}
              {isBeta && (
                <span
                  className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                  style={{ background: P.accentSoft, color: P.accent, fontFamily: "var(--font-body)" }}
                >
                  Beta
                </span>
              )}
            </p>
            <p className="text-sm" style={{ color: P.muted }}>
              {PLAN_COPY[planId]}
            </p>
          </div>
        </div>
      </div>

      {isBeta ? (
        <LockedCard
          icon={<Sparkles className="w-5 h-5" strokeWidth={1.75} />}
          title="Program beta dla pierwszych sklepów"
        >
          Jesteś jednym z pierwszych sklepów na Sellflow i rozwijasz platformę razem z nami. Nowe
          funkcje trafiają do Ciebie od razu, często zanim zobaczą je inni. Twoja cena obowiązuje
          przez cały okres beta, a o każdej zmianie cennika uprzedzimy Cię mailem z co najmniej
          30-dniowym wyprzedzeniem. Uwagi i pomysły wysyłaj śmiało, bo to one ustawiają kolejność prac.
        </LockedCard>
      ) : (
        <LockedCard
          icon={<ShoppingBag className="w-5 h-5" strokeWidth={1.75} />}
          title="Płatne plany już wkrótce"
          cta={
            <button
              disabled
              className="text-sm font-semibold px-4 py-2.5 rounded-full opacity-60 cursor-not-allowed"
              style={{ background: P.accent, color: "#fff" }}
            >
              Wybór planu wkrótce
            </button>
          }
        >
          Pracujemy nad planami <strong>Starter</strong> i <strong>Pro</strong>: więcej produktów,
          własna domena, zespół i integracje bez limitów. Do tego czasu korzystasz ze sklepu bez opłat.
        </LockedCard>
      )}
    </div>
  );
}
