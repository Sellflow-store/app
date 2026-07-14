"use client";

import { useState } from "react";
import { Save, X, TriangleAlert } from "lucide-react";
import type { BrandingConfig } from "@/types/shop";
import {
  DEFAULT_LOGO_HEIGHT,
  DEFAULT_LOGO_MAX_WIDTH,
  LOGO_HEIGHT_RANGE,
  LOGO_MAX_WIDTH_RANGE,
  NAVBAR_MIN_HEIGHT,
} from "@/types/shop";
import ImageUpload from "@/components/admin/ImageUpload";
import { DISPLAY_FONTS, BODY_FONTS, googleFontsHref } from "@/lib/fonts";

const PRESET_COLORS = [
  { name: "Navy",    hex: "#12128c" },
  { name: "Magenta", hex: "#db00b2" },
  { name: "Emerald", hex: "#0d9c6b" },
  { name: "Amber",   hex: "#d97706" },
  { name: "Slate",   hex: "#475569" },
  { name: "Rose",    hex: "#e11d48" },
];

const PAPER_PRESETS = [
  { name: "Domyślne", hex: "" },
  { name: "Białe",    hex: "#ffffff" },
  { name: "Kremowe",  hex: "#faf6ef" },
  { name: "Piaskowe", hex: "#f5efe6" },
  { name: "Chłodne",  hex: "#f3f5f7" },
  { name: "Miętowe",  hex: "#eef5f0" },
];

/** true gdy kolor jest na tyle ciemny, że ciemny tekst sklepu będzie nieczytelny */
function isDarkBackground(hex: string): boolean {
  const h = hex.replace("#", "");
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(h)) return false;
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5;
}

// Fonty do podglądu w pickerach — ładujemy cały katalog tylko na tej stronie
const PICKER_FONTS_HREF = googleFontsHref([
  ...DISPLAY_FONTS.map((f) => f.id),
  ...BODY_FONTS.map((f) => f.id),
]);

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

function Slider({
  label, id, value, min, max, onChange,
}: {
  label: string;
  id: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="text-xs font-semibold" style={{ color: "oklch(30% 0 0)" }}>
          {label}
        </label>
        <span className="text-xs tabular-nums" style={{ color: "oklch(50% 0 0)" }}>
          {value} px
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: "oklch(56% 0.30 335)" }}
      />
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
  const [logoHeight, setLogoHeight]   = useState(initialConfig.logoHeight ?? DEFAULT_LOGO_HEIGHT);
  const [logoMaxWidth, setLogoMaxWidth] = useState(initialConfig.logoMaxWidth ?? DEFAULT_LOGO_MAX_WIDTH);
  const [faviconUrl, setFaviconUrl]   = useState(initialConfig.faviconUrl ?? "");
  const [primaryColor, setPrimary]    = useState(initialConfig.primaryColor);
  const [accentColor, setAccent]      = useState(initialConfig.accentColor);
  const [paperColor, setPaper]        = useState(initialConfig.paperColor ?? "");
  const [displayFont, setDisplayFont] = useState(initialConfig.fontFamily || "Space Grotesk");
  const [bodyFont, setBodyFont]       = useState(initialConfig.bodyFontFamily || "Inter Tight");
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
            ...initialConfig,
            shopName,
            tagline,
            logoUrl,
            logoHeight,
            logoMaxWidth,
            faviconUrl,
            primaryColor,
            accentColor,
            paperColor,
            fontFamily: displayFont,
            bodyFontFamily: bodyFont,
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
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Pełny katalog fontów do podglądu w pickerach */}
      {PICKER_FONTS_HREF && <link rel="stylesheet" href={PICKER_FONTS_HREF} />}

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

        {logoUrl && (
          <div className="mt-5 pt-5" style={{ borderTop: "1px solid oklch(93% 0 0)" }}>
            <p className="text-xs mb-3" style={{ color: "oklch(45% 0 0)" }}>
              Rozmiar w nagłówku sklepu. Logo poziome (szerokie i niskie) potrzebuje
              zwykle większej maks. szerokości — inaczej zmniejsza się do ledwie
              widocznego paska.
            </p>

            <Slider
              id="logo-height"
              label="Wysokość logo"
              value={logoHeight}
              min={LOGO_HEIGHT_RANGE.min}
              max={LOGO_HEIGHT_RANGE.max}
              onChange={setLogoHeight}
            />
            <Slider
              id="logo-max-width"
              label="Maks. szerokość logo"
              value={logoMaxWidth}
              min={LOGO_MAX_WIDTH_RANGE.min}
              max={LOGO_MAX_WIDTH_RANGE.max}
              onChange={setLogoMaxWidth}
            />

            <button
              onClick={() => {
                setLogoHeight(DEFAULT_LOGO_HEIGHT);
                setLogoMaxWidth(DEFAULT_LOGO_MAX_WIDTH);
              }}
              className="text-xs underline"
              style={{ color: "oklch(50% 0 0)" }}
            >
              Przywróć domyślne
            </button>

            {/* Podgląd nagłówka — te same reguły co w storefroncie */}
            <div className="mt-4">
              <p className="text-[11px] font-semibold mb-1.5" style={{ color: "oklch(30% 0 0)" }}>
                Podgląd nagłówka
              </p>
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid oklch(90% 0 0)", background: paperColor || "#fff" }}
              >
                <div
                  className="flex items-center justify-between px-4"
                  style={{ height: Math.max(NAVBAR_MIN_HEIGHT, logoHeight + 16) }}
                >
                  <img
                    src={logoUrl}
                    alt="Podgląd logo"
                    className="w-auto object-contain"
                    style={{ height: logoHeight, maxWidth: logoMaxWidth }}
                  />
                  <div className="flex items-center gap-4">
                    {["Sklep", "Blog", "Kontakt"].map((l) => (
                      <span key={l} className="text-xs" style={{ color: "oklch(45% 0 0)" }}>
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Favicon */}
      <SectionCard title="Ikona karty przeglądarki (favicon)">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ background: "oklch(95% 0.008 260)", border: "1.5px dashed oklch(80% 0 0)" }}
            >
              {faviconUrl || logoUrl ? (
                <img src={faviconUrl || logoUrl} alt="favicon" className="w-full h-full object-contain p-1.5" />
              ) : (
                <span className="text-[10px] text-center px-1" style={{ color: "oklch(55% 0 0)" }}>
                  brak
                </span>
              )}
            </div>
            {faviconUrl && (
              <button
                onClick={() => setFaviconUrl("")}
                aria-label="Usuń favicon"
                className="absolute -top-1.5 -right-1.5 p-1 rounded-full"
                style={{ background: "oklch(25% 0 0)", color: "#fff" }}
              >
                <X className="w-3 h-3" strokeWidth={2} />
              </button>
            )}
          </div>

          <div className="flex-1">
            <p className="text-xs mb-2" style={{ color: "oklch(45% 0 0)" }}>
              Mała ikona na karcie przeglądarki i w zakładkach. Bez własnego pliku
              używamy logo sklepu. Kwadratowy PNG/SVG, min. 64×64 px — logo poziome
              zrobi się w tym miejscu nieczytelne, więc warto wgrać sam znak (np.
              samą chatkę bez napisu).
            </p>
            <ImageUpload
              endpoint="shopLogo"
              label={faviconUrl ? "Zmień favicon" : "Wgraj favicon"}
              onUploaded={(urls) => urls[0] && setFaviconUrl(urls[0])}
            />

            {(faviconUrl || logoUrl) && (
              <div className="mt-4">
                <p className="text-[11px] font-semibold mb-1.5" style={{ color: "oklch(30% 0 0)" }}>
                  Podgląd karty
                </p>
                <div
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-t-lg"
                  style={{ background: "oklch(96% 0 0)", border: "1px solid oklch(88% 0 0)" }}
                >
                  <img
                    src={faviconUrl || logoUrl}
                    alt=""
                    className="w-4 h-4 object-contain"
                  />
                  <span className="text-xs" style={{ color: "oklch(30% 0 0)" }}>
                    {shopName || "Mój sklep"}
                  </span>
                </div>
              </div>
            )}
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
        <div className="mb-5">
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

        {/* Page background */}
        <div className="pt-4" style={{ borderTop: "1px solid oklch(93% 0 0)" }}>
          <p className="text-[11px] font-semibold mb-2" style={{ color: "oklch(55% 0 0)" }}>
            Tło sklepu
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {PAPER_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => setPaper(p.hex)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all"
                style={{
                  background: paperColor === p.hex ? "oklch(93% 0.01 250)" : "oklch(96% 0 0)",
                  border: `1.5px solid ${paperColor === p.hex ? "oklch(22% 0.24 270)" : "oklch(88% 0 0)"}`,
                  color: "oklch(25% 0 0)",
                }}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: p.hex || "oklch(99% 0.005 250)",
                    border: "1px solid oklch(85% 0 0)",
                  }}
                />
                {p.name}
              </button>
            ))}
            <input
              type="text"
              value={paperColor}
              onChange={(e) => setPaper(e.target.value)}
              placeholder="#ffffff"
              aria-label="Własny kolor tła (hex)"
              style={{ ...inputStyle, width: "7.5rem", padding: "6px 10px", fontSize: "11px" }}
              onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
              onBlur={(e) => (e.target.style.borderColor = "oklch(88% 0 0)")}
            />
          </div>
          {isDarkBackground(paperColor) && (
            <p
              className="flex items-center gap-1.5 text-[11px] font-medium"
              style={{ color: "oklch(50% 0.15 70)" }}
            >
              <TriangleAlert className="w-3.5 h-3.5" strokeWidth={2} />
              Ciemne tło może zlewać się z tekstem sklepu — sprawdź czytelność na podglądzie.
            </p>
          )}
        </div>
      </SectionCard>

      {/* Typography */}
      <SectionCard title="Typografia">
        <div className="mb-5">
          <p className="text-[11px] font-semibold mb-2" style={{ color: "oklch(55% 0 0)" }}>
            Font nagłówków
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DISPLAY_FONTS.map((f) => (
              <button
                key={f.id}
                onClick={() => setDisplayFont(f.id)}
                className="text-left rounded-xl px-3 py-2.5 transition-all"
                style={{
                  border: `1.5px solid ${displayFont === f.id ? "oklch(22% 0.24 270)" : "oklch(88% 0 0)"}`,
                  background: displayFont === f.id ? "oklch(96% 0.01 270)" : "#fff",
                }}
              >
                <span
                  className="block text-base leading-tight"
                  style={{ fontFamily: `'${f.id}', ${f.serif ? "serif" : "sans-serif"}`, color: "oklch(15% 0 0)", fontWeight: 600 }}
                >
                  {f.id}
                </span>
                <span className="block text-[10px] mt-0.5" style={{ color: "oklch(55% 0 0)" }}>
                  {f.hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold mb-2" style={{ color: "oklch(55% 0 0)" }}>
            Font tekstu
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {BODY_FONTS.map((f) => (
              <button
                key={f.id}
                onClick={() => setBodyFont(f.id)}
                className="text-left rounded-xl px-3 py-2.5 transition-all"
                style={{
                  border: `1.5px solid ${bodyFont === f.id ? "oklch(22% 0.24 270)" : "oklch(88% 0 0)"}`,
                  background: bodyFont === f.id ? "oklch(96% 0.01 270)" : "#fff",
                }}
              >
                <span
                  className="block text-sm leading-tight"
                  style={{ fontFamily: `'${f.id}', ${f.serif ? "serif" : "sans-serif"}`, color: "oklch(15% 0 0)" }}
                >
                  {f.id}
                </span>
                <span className="block text-[10px] mt-0.5" style={{ color: "oklch(55% 0 0)" }}>
                  {f.hint}
                </span>
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Live preview */}
      <SectionCard title="Podgląd na żywo">
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid oklch(90% 0 0)" }}
        >
          <div
            className="p-4 flex items-center justify-between"
            style={{ background: primaryColor }}
          >
            <div>
              <p
                className="text-white font-bold text-base"
                style={{ fontFamily: `'${displayFont}', sans-serif` }}
              >
                {shopName || "Nazwa sklepu"}
              </p>
              <p className="text-white/70 text-xs mt-0.5" style={{ fontFamily: `'${bodyFont}', sans-serif` }}>
                {tagline || "Twoje hasło"}
              </p>
            </div>
            <button
              className="text-xs font-bold px-4 py-2 rounded-full"
              style={{ background: accentColor, color: "#fff" }}
            >
              Kup teraz
            </button>
          </div>
          <div className="px-4 py-5" style={{ background: paperColor || "oklch(99% 0.005 250)" }}>
            <p
              className="text-lg font-bold mb-1"
              style={{ fontFamily: `'${displayFont}', sans-serif`, color: primaryColor }}
            >
              Prostota, która wyróżnia.
            </p>
            <p
              className="text-xs leading-relaxed"
              style={{ fontFamily: `'${bodyFont}', sans-serif`, color: "oklch(35% 0 0)" }}
            >
              Tak wygląda treść Twojego sklepu — nagłówki w foncie „{displayFont}”,
              tekst w foncie „{bodyFont}”, na wybranym tle.
            </p>
          </div>
        </div>
        <p className="text-[11px] mt-2" style={{ color: "oklch(60% 0 0)" }}>
          Tak będzie wyglądać header i treść Twojego sklepu z wybranymi kolorami i fontami.
        </p>
      </SectionCard>
    </div>
  );
}
