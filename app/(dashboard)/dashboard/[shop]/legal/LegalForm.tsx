"use client";

import { useState } from "react";
import { Save, Sparkles, FileText, ShieldCheck } from "lucide-react";
import { termsTemplate, privacyTemplate } from "@/lib/legal-templates";

const textareaStyle = {
  border: "1.5px solid oklch(88% 0 0)",
  borderRadius: "10px",
  padding: "12px",
  fontSize: "12px",
  lineHeight: "1.6",
  color: "oklch(11% 0.10 275)",
  background: "#fff",
  fontFamily: "var(--font-body)",
  width: "100%",
  outline: "none",
  resize: "vertical" as const,
};

interface Props {
  shopSlug: string;
  shopName: string;
  initialTerms: string;
  initialPrivacy: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function LegalForm({ shopSlug, shopName, initialTerms, initialPrivacy }: Props) {
  const [terms, setTerms] = useState(initialTerms);
  const [privacy, setPrivacy] = useState(initialPrivacy);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  async function handleSave() {
    setSaveState("saving");
    try {
      const save = (key: string, content: string) =>
        fetch(`/api/shops/${shopSlug}/config`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value: { content } }),
        });
      const [r1, r2] = await Promise.all([save("terms", terms), save("privacy", privacy)]);
      setSaveState(r1.ok && r2.ok ? "saved" : "error");
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

  const sections = [
    {
      key: "terms",
      title: "Regulamin sklepu",
      icon: FileText,
      value: terms,
      set: setTerms,
      template: () => termsTemplate(shopName),
      publicPath: `/${shopSlug}/terms`,
    },
    {
      key: "privacy",
      title: "Polityka prywatności",
      icon: ShieldCheck,
      value: privacy,
      set: setPrivacy,
      template: () => privacyTemplate(shopName),
      publicPath: `/${shopSlug}/privacy`,
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
          >
            Dokumenty prawne
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
            Regulamin i polityka prywatności — wymagane do legalnej sprzedaży w Polsce
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

      {sections.map((s) => (
        <div
          key={s.key}
          className="rounded-2xl p-5 mb-5"
          style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}
        >
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <s.icon className="w-4 h-4" style={{ color: "oklch(40% 0 0)" }} strokeWidth={1.5} />
              <h2
                className="text-sm font-semibold"
                style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
              >
                {s.title}
              </h2>
            </div>
            <button
              onClick={() => {
                if (
                  !s.value.trim() ||
                  confirm("Zastąpić obecną treść szablonem? Obecny tekst zostanie nadpisany.")
                ) {
                  s.set(s.template());
                }
              }}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
              style={{ border: "1.5px solid oklch(85% 0 0)", color: "oklch(30% 0 0)", background: "oklch(97% 0 0)" }}
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
              Wstaw szablon
            </button>
          </div>

          <textarea
            value={s.value}
            onChange={(e) => s.set(e.target.value)}
            rows={14}
            placeholder={`Treść dokumentu „${s.title}” — możesz zacząć od szablonu i uzupełnić pola [W NAWIASACH].`}
            style={textareaStyle}
            onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
            onBlur={(e) => (e.target.style.borderColor = "oklch(88% 0 0)")}
          />
          <p className="text-[11px] mt-2" style={{ color: "oklch(60% 0 0)" }}>
            Dokument będzie widoczny pod adresem <span className="font-medium">{s.publicPath}</span>.
            Szablon to punkt startowy, nie porada prawna — uzupełnij pola [W NAWIASACH].
          </p>
        </div>
      ))}
    </div>
  );
}
