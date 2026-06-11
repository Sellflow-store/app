"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import type { BrandingConfig } from "@/types/shop";
import ImageUpload from "@/components/admin/ImageUpload";

const PRESET_COLORS = [
  { name: "Navy",    hex: "#12128c" },
  { name: "Magenta", hex: "#db00b2" },
  { name: "Emerald", hex: "#0d9c6b" },
  { name: "Amber",   hex: "#d97706" },
  { name: "Slate",   hex: "#475569" },
  { name: "Rose",    hex: "#e11d48" },
];

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5 mb-5"
      style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}
    >
      <h2
        className="text-sm font-semibold mb-4"
        style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
      >
        {title}
      </h2>
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

interface Props {
  shopSlug: string;
  dbShopName: string;
  initialConfig: BrandingConfig;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function BrandingForm({ shopSlug, dbShopName: _dbShopName, initialConfig }: Props) {
  const [shopName, setShopName]       = useState(initialConfig.shopName);
  const [tagline, setTagline]         = useState(initialConfig.tagline ?? "");
  const [logoUrl, setLogoUrl]         = useState(initialConfig.logoUrl ?? "");
  const [primaryColor, setPrimary]    = useState(initialConfig.primaryColor);
  const [accentColor, setAccent]      = useState(initialConfig.accentColor);
  const [saveState, setSaveState]     = useState<SaveState>("idle");

  async function handleSave() {
    setSaveState("saving");
    try {
      const res = await fetch(`/api/shops/${shopSlug}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "branding",
          value: {
            shopName,
            tagline,
            logoUrl,
            faviconUrl: initialConfig.faviconUrl,
            primaryColor,
            accentColor,
            fontFamily: initialConfig.fontFamily,
          } satisfies BrandingConfig,
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
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
          >
            Logo i kolorystyka
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
            Wygląd Twojego sklepu i identyfikacja marki
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

      {/* Logo upload */}
      <SectionCard title="Logo sklepu">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center"
              style={{ background: "oklch(95% 0.008 260)", border: "1.5px dashed oklch(80% 0 0)" }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="logo" className="w-full h-full object-contain rounded-xl" />
              ) : (
                <span
                  className="text-2xl font-black"
                  style={{ color: primaryColor, fontFamily: "var(--font-display)" }}
                >
                  {shopName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {logoUrl && (
              <button
                onClick={() => setLogoUrl("")}
                aria-label="Usuń logo"
                className="absolute -top-1.5 -right-1.5 p-1 rounded-full"
                style={{ background: "oklch(25% 0 0)", color: "#fff" }}
              >
                <X className="w-3 h-3" strokeWidth={2} />
              </button>
            )}
          </div>

          <div className="flex-1">
            <p className="text-xs mb-2" style={{ color: "oklch(45% 0 0)" }}>
              PNG lub SVG, min. 200×200 px. Zalecane tło transparentne. Pamiętaj o
              kliknięciu „Zapisz zmiany” po wgraniu.
            </p>
            <ImageUpload
              endpoint="shopLogo"
              label="Wgraj logo"
              onUploaded={(urls) => urls[0] && setLogoUrl(urls[0])}
            />
          </div>
        </div>
      </SectionCard>

      {/* Shop identity */}
      <SectionCard title="Dane sklepu">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
          <Field label="Nazwa sklepu" id="shop-name">
            <input
              id="shop-name"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
              onBlur={(e) =>  (e.target.style.borderColor = "oklch(88% 0 0)")}
            />
          </Field>
          <div className="sm:pl-3">
            <Field label="Hasło / tagline" id="tagline">
              <input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
                onBlur={(e) =>  (e.target.style.borderColor = "oklch(88% 0 0)")}
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* Colors */}
      <SectionCard title="Kolory marki">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Kolor główny" id="primary-color">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg shrink-0"
                style={{ background: primaryColor, border: "2px solid oklch(85% 0 0)" }}
              />
              <input
                id="primary-color"
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimary(e.target.value)}
                style={{ ...inputStyle, width: "auto", flex: 1 }}
                onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
                onBlur={(e) =>  (e.target.style.borderColor = "oklch(88% 0 0)")}
              />
            </div>
          </Field>

          <Field label="Kolor akcentowy (CTA)" id="accent-color">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg shrink-0"
                style={{ background: accentColor, border: "2px solid oklch(85% 0 0)" }}
              />
              <input
                id="accent-color"
                type="text"
                value={accentColor}
                onChange={(e) => setAccent(e.target.value)}
                style={{ ...inputStyle, width: "auto", flex: 1 }}
                onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
                onBlur={(e) =>  (e.target.style.borderColor = "oklch(88% 0 0)")}
              />
            </div>
          </Field>
        </div>

        {/* Presets */}
        <div>
          <p className="text-[11px] font-semibold mb-2" style={{ color: "oklch(55% 0 0)" }}>
            Gotowe palety
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => setPrimary(c.hex)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all"
                style={{
                  background: primaryColor === c.hex ? `${c.hex}20` : "oklch(96% 0 0)",
                  border: `1.5px solid ${primaryColor === c.hex ? c.hex : "oklch(88% 0 0)"}`,
                  color: "oklch(25% 0 0)",
                }}
              >
                <span className="w-3 h-3 rounded-full" style={{ background: c.hex }} />
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Live preview */}
      <SectionCard title="Podgląd na żywo">
        <div
          className="rounded-xl p-4 flex items-center justify-between"
          style={{ background: primaryColor }}
        >
          <div>
            <p className="text-white font-bold text-base" style={{ fontFamily: "var(--font-display)" }}>
              {shopName || "Nazwa sklepu"}
            </p>
            <p className="text-white/70 text-xs mt-0.5">{tagline || "Twoje hasło"}</p>
          </div>
          <button
            className="text-xs font-bold px-4 py-2 rounded-full"
            style={{ background: accentColor, color: "#fff" }}
          >
            Kup teraz
          </button>
        </div>
        <p className="text-[11px] mt-2" style={{ color: "oklch(60% 0 0)" }}>
          Tak będzie wyglądać header Twojego sklepu z wybranymi kolorami.
        </p>
      </SectionCard>
    </div>
  );
}
