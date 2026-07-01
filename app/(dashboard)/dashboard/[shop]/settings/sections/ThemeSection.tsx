"use client";

import { Sun, Moon, Monitor, Check } from "lucide-react";
import { SectionTitle, Card, P } from "../ui";
import { usePanelTheme, type ThemePref } from "@/components/admin/ThemeProvider";

const OPTIONS: { id: ThemePref; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: "light", label: "Jasny", desc: "Zawsze jasny interfejs", icon: <Sun className="w-5 h-5" strokeWidth={1.75} /> },
  { id: "dark", label: "Ciemny", desc: "Zawsze ciemny interfejs", icon: <Moon className="w-5 h-5" strokeWidth={1.75} /> },
  { id: "system", label: "Systemowy", desc: "Dopasuj do ustawień systemu", icon: <Monitor className="w-5 h-5" strokeWidth={1.75} /> },
];

export default function ThemeSection() {
  const { theme, setTheme } = usePanelTheme();

  return (
    <div>
      <SectionTitle title="Motyw" />
      <Card
        title="Motyw aplikacji"
        desc="Wybierz wygląd panelu. Motyw dotyczy tylko interfejsu aplikacji — Twój sklep pozostaje bez zmian."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {OPTIONS.map((o) => {
            const active = theme === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setTheme(o.id)}
                className="relative text-left rounded-xl p-4 transition-all"
                style={{
                  border: active ? `2px solid ${P.accent}` : `1.5px solid ${P.borderStrong}`,
                  background: active ? P.accentSoft : P.surface,
                }}
              >
                {active && (
                  <Check className="w-4 h-4 absolute top-3 right-3" style={{ color: P.accent }} strokeWidth={2.5} />
                )}
                <div
                  className="flex items-center justify-center rounded-lg mb-3"
                  style={{ width: 36, height: 36, background: P.surface2, color: active ? P.accent : P.muted }}
                >
                  {o.icon}
                </div>
                <p className="text-sm font-semibold" style={{ color: P.ink, fontFamily: "var(--font-display)" }}>
                  {o.label}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: P.faint }}>
                  {o.desc}
                </p>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
