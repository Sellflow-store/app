"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import type { AboutConfig } from "@/types/shop";

const inputStyle = {
  border: "1.5px solid oklch(88% 0 0)",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "13px",
  color: "oklch(11% 0.10 275)",
  background: "#fff",
  fontFamily: "var(--font-body)",
  width: "100%",
  outline: "none",
};

const focusProps = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = "oklch(22% 0.24 270)"),
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = "oklch(88% 0 0)"),
};

function SectionCard({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5 mb-5"
      style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}
    >
      <h2
        className="text-sm font-semibold mb-1"
        style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
      >
        {title}
      </h2>
      {hint && (
        <p className="text-xs mb-4" style={{ color: "oklch(50% 0 0)" }}>{hint}</p>
      )}
      {!hint && <div className="mb-4" />}
      {children}
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-xs font-semibold mb-1.5" style={{ color: "oklch(30% 0 0)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

interface Props {
  shopSlug: string;
  initialConfig: AboutConfig;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function AboutForm({ shopSlug, initialConfig }: Props) {
  const [config, setConfig] = useState<AboutConfig>(initialConfig);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  function patch(updates: Partial<AboutConfig>) {
    setConfig((prev) => ({ ...prev, ...updates }));
  }

  async function handleSave() {
    setSaveState("saving");
    try {
      const res = await fetch(`/api/shops/${shopSlug}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "about", value: config }),
      });
      setSaveState(res.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
    setTimeout(() => setSaveState("idle"), 2500);
  }

  const buttonLabel =
    saveState === "saving" ? "Zapisywanie…"
    : saveState === "saved" ? "Zapisano!"
    : saveState === "error" ? "Błąd — spróbuj ponownie"
    : "Zapisz zmiany";

  const buttonBg =
    saveState === "saved" ? "oklch(52% 0.20 158)"
    : saveState === "error" ? "oklch(50% 0.20 20)"
    : "oklch(56% 0.30 335)";

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
          >
            O nas
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
            Historia Twojej marki i dane kontaktowe dla klientów
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveState === "saving"}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full transition-all disabled:opacity-60"
          style={{ background: buttonBg, color: "#fff" }}
        >
          <Save className="w-3.5 h-3.5" strokeWidth={2} />
          {buttonLabel}
        </button>
      </div>

      <SectionCard title="Treść strony „O nas”">
        <Field label="Nagłówek" id="about-headline">
          <input
            id="about-headline"
            value={config.headline}
            onChange={(e) => patch({ headline: e.target.value })}
            placeholder="np. Nasza historia"
            style={inputStyle}
            {...focusProps}
          />
        </Field>
        <Field label="Treść (akapity oddziel pustą linią)" id="about-content">
          <textarea
            id="about-content"
            value={config.content}
            onChange={(e) => patch({ content: e.target.value })}
            rows={8}
            placeholder="Opowiedz klientom, kim jesteście, co robicie i dlaczego warto Wam zaufać…"
            style={{ ...inputStyle, resize: "vertical" }}
            {...focusProps}
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="Dane kontaktowe"
        hint="Wyświetlane na stronie „Kontakt” Twojego sklepu."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Field label="E-mail" id="about-email">
            <input
              id="about-email"
              type="email"
              value={config.email}
              onChange={(e) => patch({ email: e.target.value })}
              placeholder="kontakt@twojsklep.pl"
              style={inputStyle}
              {...focusProps}
            />
          </Field>
          <Field label="Telefon" id="about-phone">
            <input
              id="about-phone"
              value={config.phone}
              onChange={(e) => patch({ phone: e.target.value })}
              placeholder="600 000 000"
              style={inputStyle}
              {...focusProps}
            />
          </Field>
        </div>
        <Field label="Adres (opcjonalnie)" id="about-address">
          <input
            id="about-address"
            value={config.address}
            onChange={(e) => patch({ address: e.target.value })}
            placeholder="ul. Przykładowa 1, 00-001 Warszawa"
            style={inputStyle}
            {...focusProps}
          />
        </Field>
      </SectionCard>
    </div>
  );
}
