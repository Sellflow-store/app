"use client";

import { ShoppingBag } from "lucide-react";
import { SectionTitle, LockedCard, P } from "../ui";
import { PLANS } from "@/lib/plans";

export default function PlanSection({ currentPlan }: { currentPlan: string }) {
  const plan = PLANS[currentPlan as keyof typeof PLANS] ?? PLANS.free;
  return (
    <div>
      <SectionTitle title="Rozliczenia" desc="Zarządzaj swoim planem." />

      <div className="rounded-2xl p-5 mb-5 flex items-center justify-between gap-4"
        style={{ background: P.surface, border: `1px solid ${P.border}` }}>
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center rounded-xl"
            style={{ width: 40, height: 40, background: P.surface2, color: P.muted }}>
            <ShoppingBag className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-base font-semibold" style={{ color: P.ink, fontFamily: "var(--font-display)" }}>
              Plan {plan.label}
            </p>
            <p className="text-sm" style={{ color: P.muted }}>
              Twój sklep jest aktywny na planie startowym.
            </p>
          </div>
        </div>
      </div>

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
        Pracujemy nad planami <strong>Starter</strong> i <strong>Pro</strong> — więcej produktów,
        własna domena, zespół i integracje bez limitów. Do tego czasu korzystasz ze sklepu bez opłat.
      </LockedCard>
    </div>
  );
}
