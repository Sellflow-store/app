"use client";

import { useMemo } from "react";
import { useOnboarding } from "./state";
import { inferBrand } from "@/lib/brand/inference";

type Props = { compact?: boolean };

/**
 * Lightweight storefront preview rendered with inferred palette + typography.
 * Used inline on Step Brand and as the fallback for LivePreview when the
 * full iframe preview cannot load.
 */
export default function MiniPreview({ compact = false }: Props) {
  const { state } = useOnboarding();
  const inf = useMemo(() => inferBrand(state.business, state.brand), [state.business, state.brand]);

  const [paper, ink, accent] = inf.palette;
  const muted = mix(paper, ink, 0.08);
  const rule = mix(paper, ink, 0.12);

  const productCount = 3;
  const headlineSize = compact ? 22 : 36;
  const heroPadding = compact ? "36px 28px" : "64px 56px";

  return (
    <div
      style={{
        background: paper,
        color: ink,
        fontFamily: inf.font_pair.body,
        borderRadius: compact ? 0 : 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: compact ? "14px 20px" : "20px 32px",
          borderBottom: `1px solid ${rule}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {state.business.logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={state.business.logoDataUrl}
              alt=""
              style={{ width: 28, height: 28, objectFit: "contain" }}
            />
          ) : (
            <span style={{
              width: 22, height: 22,
              borderRadius: 4,
              background: accent,
              display: "inline-block",
            }} />
          )}
          <span style={{
            fontFamily: inf.font_pair.display,
            fontWeight: 700,
            fontSize: compact ? 15 : 18,
            letterSpacing: "-0.005em",
          }}>
            {inf.effective_name}
          </span>
        </div>
        <div style={{ display: "flex", gap: compact ? 12 : 20, fontSize: compact ? 11 : 13, opacity: 0.7 }}>
          <span>Sklep</span>
          <span>O nas</span>
          <span>Kontakt</span>
        </div>
      </div>

      {/* Hero */}
      {inf.layout_type === "editorial" ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          padding: heroPadding,
          gap: 32,
          alignItems: "center",
          background: paper,
        }}>
          <div>
            <div style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              opacity: 0.6,
              marginBottom: 12,
            }}>
              {inf.category.replace("_", " ")}
            </div>
            <h1 style={{
              fontFamily: inf.font_pair.display,
              fontSize: headlineSize,
              lineHeight: 1.1,
              letterSpacing: "-0.015em",
              margin: 0,
              color: ink,
            }}>
              {inf.hero_headline}
            </h1>
            <p style={{
              marginTop: 14,
              fontSize: compact ? 13 : 15,
              opacity: 0.75,
              lineHeight: 1.5,
              maxWidth: 360,
            }}>
              {inf.hero_sub}
            </p>
            <div style={{ marginTop: compact ? 18 : 24 }}>
              <span style={{
                display: "inline-block",
                padding: "10px 18px",
                background: ink,
                color: paper,
                borderRadius: 999,
                fontSize: compact ? 12 : 13,
                fontWeight: 600,
              }}>
                Zobacz kolekcję
              </span>
            </div>
          </div>
          <div style={{
            aspectRatio: "4 / 5",
            background: `linear-gradient(180deg, ${mix(paper, ink, 0.05)}, ${mix(accent, ink, 0.15)})`,
            borderRadius: 12,
            border: `1px solid ${rule}`,
          }} />
        </div>
      ) : (
        <div style={{
          padding: heroPadding,
          background: mix(paper, accent, 0.18),
          textAlign: inf.layout_type === "card" ? "center" : "left",
        }}>
          <h1 style={{
            fontFamily: inf.font_pair.display,
            fontSize: headlineSize,
            lineHeight: 1.1,
            letterSpacing: "-0.015em",
            margin: 0,
            color: ink,
            maxWidth: 520,
            marginInline: inf.layout_type === "card" ? "auto" : undefined,
          }}>
            {inf.hero_headline}
          </h1>
          <p style={{
            marginTop: 14,
            fontSize: compact ? 13 : 15,
            opacity: 0.75,
            maxWidth: 460,
            marginInline: inf.layout_type === "card" ? "auto" : undefined,
          }}>
            {inf.hero_sub}
          </p>
        </div>
      )}

      {/* Products */}
      <div style={{ padding: compact ? "24px 20px" : "40px 32px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${productCount}, minmax(0, 1fr))`,
          gap: compact ? 12 : 20,
        }}>
          {Array.from({ length: productCount }).map((_, i) => (
            <div key={i} style={{
              border: `1px solid ${rule}`,
              borderRadius: 12,
              overflow: "hidden",
              background: paper,
            }}>
              <div style={{
                aspectRatio: "1 / 1",
                background: i === 0
                  ? mix(paper, accent, 0.45)
                  : i === 1
                  ? mix(paper, ink, 0.10)
                  : mix(paper, accent, 0.28),
              }} />
              <div style={{ padding: compact ? "10px 12px" : "14px 16px" }}>
                <div style={{ fontSize: compact ? 12 : 14, fontWeight: 600 }}>
                  {productLabel(inf.category, i)}
                </div>
                <div style={{ fontSize: compact ? 11 : 13, opacity: 0.65, marginTop: 4 }}>
                  {productPrice(i)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: compact ? "16px 20px" : "24px 32px",
        borderTop: `1px solid ${rule}`,
        background: muted,
        display: "flex",
        justifyContent: "space-between",
        fontSize: compact ? 11 : 12,
        opacity: 0.75,
      }}>
        <span>© {inf.effective_name}</span>
        <div style={{ display: "flex", gap: 16 }}>
          <span>Sklep</span>
          <span>O nas</span>
          <span>Kontakt</span>
        </div>
      </div>
    </div>
  );
}

function productLabel(cat: string, i: number) {
  const labels: Record<string, string[]> = {
    candles:    ["Sojowa #1 · Cedar", "Sojowa #2 · Linen", "Sojowa #3 · Smoke"],
    home_decor: ["Misa ceramiczna", "Wazon (low)", "Świecznik mosiężny"],
    jewelry:    ["Lune Ring", "Aster Studs", "Halo Chain"],
    apparel:    ["Linen Tee", "Workwear Pant", "Light Overshirt"],
    beauty:     ["Calm Serum", "Daily Cream", "Quiet Bar"],
    coffee:     ["Single Origin · Kolumbia", "Espresso Blend", "Decaf Slow"],
    food:       ["Granola · Field", "Honey · Wild", "Chocolate · 70%"],
    art:        ["Print 01 · Field", "Print 02 · Mono", "Print 03 · Color"],
    digital:    ["Notion Kit", "Brand Templates", "Email Toolkit"],
    plants:     ["Monstera · S", "Pothos · M", "Olive · L"],
    accessories:["Tote · Sable", "Wallet · Plain", "Belt · Daily"],
    kids:       ["Plush · Small", "Rattle · Wood", "Tee · Cotton"],
    pets:       ["Leash · Daily", "Bed · Wash", "Bowl · Stone"],
    lifestyle:  ["Object 01", "Object 02", "Object 03"],
  };
  return labels[cat]?.[i] ?? `Produkt ${i + 1}`;
}

function productPrice(i: number) {
  return ["89 zł", "129 zł", "149 zł"][i] ?? "99 zł";
}

function mix(a: string, b: string, amount: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const t = clamp(amount, 0, 1);
  const r  = Math.round(ca[0] + (cb[0] - ca[0]) * t);
  const g  = Math.round(ca[1] + (cb[1] - ca[1]) * t);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
