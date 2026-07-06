"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { BrandingConfig } from "@/types/shop";
import type { StylePresetId } from "@/lib/brand/types";
import { STYLE_PRESETS, PRESET_FONT_FAMILIES, getStylePreset, isStylePresetId, type StylePreset } from "@/lib/brand/presets";
import { googleFontsHref } from "@/lib/fonts";
import { SectionTitle, Card, P } from "../ui";
import { saveConfig } from "./save";

interface Props {
  shopSlug: string;
  initialBranding: BrandingConfig;
  /** Surowy blob shop_config["brand"] (wizard state) — może nie istnieć. */
  initialBrand: Record<string, unknown> | null;
}

/** Ustal aktywny preset: najpierw z zapisanego brand.preset, w drugiej
 *  kolejności po kolorach brandingu (sklepy sprzed wprowadzenia presetów). */
function detectPreset(branding: BrandingConfig, brand: Record<string, unknown> | null): StylePresetId | null {
  if (brand && isStylePresetId(brand.preset)) return brand.preset;
  const norm = (c: string) => c.trim().toLowerCase();
  const match = STYLE_PRESETS.find(
    (p) =>
      norm(p.palette.ink) === norm(branding.primaryColor || "") &&
      norm(p.palette.accent) === norm(branding.accentColor || ""),
  );
  return match?.id ?? null;
}

export default function StyleSection({ shopSlug, initialBranding, initialBrand }: Props) {
  const [branding, setBranding] = useState(initialBranding);
  const [brand, setBrand] = useState(initialBrand);
  const [selected, setSelected] = useState<StylePresetId | null>(() =>
    detectPreset(initialBranding, initialBrand),
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function choose(id: StylePresetId) {
    if (status === "saving" || id === selected) return;
    const p = getStylePreset(id);
    const prev = selected;
    setSelected(id);
    setStatus("saving");

    const nextBranding: BrandingConfig = {
      ...branding,
      primaryColor: p.palette.ink,
      accentColor: p.palette.accent,
      secondaryColor: p.palette.secondary,
      paperColor: p.palette.paper,
      fontFamily: p.fonts.display,
      bodyFontFamily: p.fonts.body,
      radius: p.radius,
    };
    const nextBrand = {
      ...(brand ?? {}),
      preset: p.id,
      palette: p.palette,
      fonts: p.fontStacks,
      radius: p.radius,
      layout_type: p.layout_type,
    };

    const okBranding = await saveConfig(shopSlug, "branding", nextBranding);
    const okBrand = await saveConfig(shopSlug, "brand", nextBrand);

    if (okBranding && okBrand) {
      setBranding(nextBranding);
      setBrand(nextBrand);
      setStatus("saved");
    } else {
      setSelected(prev);
      setStatus("error");
    }
    setTimeout(() => setStatus("idle"), 2500);
  }

  const presetFontsHref = googleFontsHref(PRESET_FONT_FAMILIES);

  return (
    <div>
      {presetFontsHref && <link rel="stylesheet" href={presetFontsHref} />}
      <SectionTitle
        title="Styl sklepu"
        desc="Paleta kolorów, typografia i charakter Twojego sklepu. Zmiana działa od razu — bez utraty treści."
      />
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {STYLE_PRESETS.map((p) => (
            <PresetTile
              key={p.id}
              preset={p}
              active={selected === p.id}
              disabled={status === "saving"}
              onClick={() => choose(p.id)}
            />
          ))}
        </div>
        <p className="text-[11px] mt-3 h-4" style={{ color: status === "error" ? "oklch(60% 0.18 20)" : P.faint }} aria-live="polite">
          {status === "saving" && "Zapisywanie…"}
          {status === "saved" && "Zapisano — sklep używa nowego stylu."}
          {status === "error" && "Nie udało się zapisać. Spróbuj ponownie."}
          {status === "idle" && selected === null && "Sklep używa stylu niestandardowego z onboardingu — wybór presetu go nadpisze."}
        </p>
      </Card>
    </div>
  );
}

function PresetTile({
  preset, active, disabled, onClick,
}: {
  preset: StylePreset;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const { paper, ink, accent, secondary } = preset.palette;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className="relative text-left rounded-xl overflow-hidden transition-all disabled:opacity-60"
      style={{
        border: active ? `2px solid ${P.accent}` : `1.5px solid ${P.borderStrong}`,
      }}
    >
      {active && (
        <Check className="w-4 h-4 absolute top-2.5 right-2.5 z-10" style={{ color: P.accent }} strokeWidth={2.5} />
      )}
      <div style={{ background: paper, padding: "14px 14px 12px" }}>
        <div
          style={{
            fontFamily: preset.fontStacks.display,
            color: ink,
            fontSize: 15,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
          }}
        >
          Dobre rzeczy,
          <br />
          robione powoli
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span
            style={{
              display: "inline-block",
              padding: "4px 10px",
              background: accent,
              color: readableOn(accent),
              borderRadius: preset.radius.button,
              fontSize: 9,
              fontWeight: 700,
              fontFamily: preset.fontStacks.body,
            }}
          >
            Kup teraz
          </span>
          <span className="flex gap-1">
            {[ink, secondary, accent].map((c, i) => (
              <span
                key={i}
                style={{
                  width: 10, height: 10, borderRadius: 999, background: c,
                  border: "1px solid rgba(0,0,0,0.12)", display: "inline-block",
                }}
              />
            ))}
          </span>
        </div>
      </div>
      <div className="px-3.5 py-2" style={{ background: P.surface, borderTop: `1px solid ${P.border}` }}>
        <p className="text-sm font-semibold" style={{ color: P.ink, fontFamily: "var(--font-display)" }}>
          {preset.name}
        </p>
        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: P.faint }}>
          {preset.tagline}
        </p>
      </div>
    </button>
  );
}

function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => {
    const c = x / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#0c0c0c" : "#ffffff";
}
