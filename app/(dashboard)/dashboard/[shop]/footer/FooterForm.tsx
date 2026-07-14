"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import type { FooterConfig, SocialLinks } from "@/types/shop";
import { SOCIAL_PLATFORMS } from "@/types/shop";

interface Props {
  shopSlug: string;
  initialConfig: FooterConfig;
}

type SaveState = "idle" | "saving" | "saved" | "error";

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

/** Puste pole jest OK (ikona po prostu się nie pokaże), ale wpisany śmieć nie —
 *  serwer i tak odrzuci nie-http(s), więc mówimy o tym od razu w formularzu. */
function isValidUrl(v: string): boolean {
  const s = v.trim();
  if (!s) return true;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function FooterForm({ shopSlug, initialConfig }: Props) {
  const [description, setDescription] = useState(initialConfig.description);
  const [social, setSocial] = useState<SocialLinks>(initialConfig.social);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const invalid = SOCIAL_PLATFORMS.filter((p) => !isValidUrl(social[p.key]));

  async function handleSave() {
    if (invalid.length > 0) return;
    setSaveState("saving");
    try {
      const res = await fetch(`/api/shops/${shopSlug}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "footer",
          value: { description, social } satisfies FooterConfig,
        }),
      });
      setSaveState(res.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
    setTimeout(() => setSaveState("idle"), 2500);
  }

  const buttonLabel =
    saveState === "saving" ? "Zapisywanie…"
    : saveState === "saved"  ? "Zapisano!"
    : saveState === "error"  ? "Błąd — spróbuj ponownie"
    : "Zapisz zmiany";

  const buttonBg =
    saveState === "saved"  ? "oklch(52% 0.20 158)"
    : saveState === "error" ? "oklch(50% 0.20 20)"
    : "oklch(56% 0.30 335)";

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
          >
            Stopka
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
            Opis sklepu i linki do social mediów na dole każdej strony
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saveState === "saving" || invalid.length > 0}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full transition-all disabled:opacity-60"
          style={{ background: buttonBg, color: "#fff" }}
        >
          <Save className="w-3.5 h-3.5" strokeWidth={2} />
          {buttonLabel}
        </button>
      </div>

      <div
        className="rounded-2xl p-5 mb-5"
        style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}
      >
        <h2
          className="text-sm font-semibold mb-4"
          style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
        >
          Opis pod nazwą sklepu
        </h2>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="np. Kreatywne materiały do druku dla dzieci i rodziców."
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <p className="text-xs mt-2" style={{ color: "oklch(50% 0 0)" }}>
          Puste pole = użyjemy tagline&apos;u z sekcji „Logo i kolorystyka”.
        </p>
      </div>

      <div
        className="rounded-2xl p-5"
        style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}
      >
        <h2
          className="text-sm font-semibold mb-1"
          style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
        >
          Social media
        </h2>
        <p className="text-xs mb-4" style={{ color: "oklch(50% 0 0)" }}>
          Wklej pełne adresy swoich profili. Ikona pojawi się w stopce tylko dla
          uzupełnionych pól — puste profile nie są pokazywane.
        </p>

        {SOCIAL_PLATFORMS.map((p) => {
          const value = social[p.key];
          const bad = !isValidUrl(value);
          return (
            <div key={p.key} className="mb-4">
              <label
                htmlFor={`social-${p.key}`}
                className="block text-xs font-semibold mb-1.5"
                style={{ color: "oklch(30% 0 0)" }}
              >
                {p.label}
              </label>
              <input
                id={`social-${p.key}`}
                type="url"
                value={value}
                onChange={(e) => setSocial({ ...social, [p.key]: e.target.value })}
                placeholder={p.placeholder}
                style={{
                  ...inputStyle,
                  border: bad ? "1.5px solid oklch(50% 0.20 20)" : inputStyle.border,
                }}
              />
              {bad && (
                <p className="text-xs mt-1" style={{ color: "oklch(50% 0.20 20)" }}>
                  Podaj pełny adres zaczynający się od https://
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
