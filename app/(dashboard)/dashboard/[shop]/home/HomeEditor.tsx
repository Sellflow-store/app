"use client";

import { useState } from "react";
import { Save, ChevronDown, ChevronUp } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface HomeConfig {
  topBar:  { enabled: boolean; text: string };
  hero:    { headline: string; subheadline: string; ctaText: string; ctaUrl: string };
  benefits: { items: { icon: string; title: string; desc: string }[] };
  reviews:  { enabled: boolean };
  guarantee: { enabled: boolean; text: string };
}

const DEFAULT: HomeConfig = {
  topBar:  { enabled: true, text: "🚚 Darmowa dostawa od 199 zł" },
  hero:    { headline: "Styl, który mówi za Ciebie.", subheadline: "Ubrania i akcesoria dla tych, którzy wiedzą czego chcą.", ctaText: "Odkryj kolekcję", ctaUrl: "#produkty" },
  benefits: {
    items: [
      { icon: "🚚", title: "Szybka dostawa",     desc: "Wysyłamy w 24h w dni robocze" },
      { icon: "↩️", title: "Zwrot 30 dni",       desc: "Bez pytań, bez stresu" },
      { icon: "🔒", title: "Bezpieczne płatności", desc: "Stripe + BLIK + przelew" },
    ],
  },
  reviews:  { enabled: true },
  guarantee: { enabled: true, text: "Jeśli nie będziesz zadowolony/-a — zwrot bez zbędnych pytań." },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function Accordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl mb-4 overflow-hidden"
      style={{ border: "1px solid oklch(90% 0 0)", background: "#fff" }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        style={{ color: "oklch(11% 0.10 275)" }}
      >
        <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </span>
        {open
          ? <ChevronUp className="w-4 h-4 shrink-0" strokeWidth={1.5} style={{ color: "oklch(55% 0 0)" }} />
          : <ChevronDown className="w-4 h-4 shrink-0" strokeWidth={1.5} style={{ color: "oklch(55% 0 0)" }} />}
      </button>
      {open && (
        <div className="px-5 pb-5" style={{ borderTop: "1px solid oklch(93% 0 0)" }}>
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer w-fit">
      <div
        className="relative w-9 h-5 rounded-full transition-all"
        style={{ background: checked ? "oklch(56% 0.30 335)" : "oklch(82% 0 0)" }}
        onClick={() => onChange(!checked)}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
          style={{ left: checked ? "1.125rem" : "0.125rem" }}
        />
      </div>
      <span className="text-xs font-medium" style={{ color: "oklch(35% 0 0)" }}>{label}</span>
    </label>
  );
}

const inputStyle = {
  border: "1.5px solid oklch(88% 0 0)",
  borderRadius: "10px",
  padding: "9px 12px",
  fontSize: "13px",
  color: "oklch(11% 0.10 275)",
  background: "#fff",
  fontFamily: "var(--font-body)",
  width: "100%",
  outline: "none",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-[11px] font-semibold mb-1" style={{ color: "oklch(40% 0 0)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HomeEditor() {
  const [config, setConfig] = useState<HomeConfig>(DEFAULT);
  const [open, setOpen] = useState<Record<string, boolean>>({ topBar: true, hero: false, benefits: false });
  const [saved, setSaved] = useState(false);

  function toggle(key: string) {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function patch<K extends keyof HomeConfig>(key: K, value: Partial<HomeConfig[K]>) {
    setConfig((prev) => ({ ...prev, [key]: { ...prev[key], ...value } }));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
          >
            Strona główna
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
            Edytuj treści widoczne na stronie Twojego sklepu
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full transition-all"
          style={{
            background: saved ? "oklch(52% 0.20 158)" : "oklch(56% 0.30 335)",
            color: "#fff",
          }}
        >
          <Save className="w-3.5 h-3.5" strokeWidth={2} />
          {saved ? "Zapisano!" : "Zapisz zmiany"}
        </button>
      </div>

      {/* TopBar */}
      <Accordion title="Pasek powiadomień (TopBar)" open={!!open.topBar} onToggle={() => toggle("topBar")}>
        <div className="space-y-3">
          <Toggle
            checked={config.topBar.enabled}
            onChange={(v) => patch("topBar", { enabled: v })}
            label="Włącz pasek"
          />
          <Field label="Tekst paska">
            <input
              value={config.topBar.text}
              onChange={(e) => patch("topBar", { text: e.target.value })}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
              onBlur={(e) => (e.target.style.borderColor = "oklch(88% 0 0)")}
            />
          </Field>
        </div>
      </Accordion>

      {/* Hero */}
      <Accordion title="Sekcja Hero (nagłówek)" open={!!open.hero} onToggle={() => toggle("hero")}>
        <div className="space-y-0">
          <Field label="Nagłówek główny">
            <input
              value={config.hero.headline}
              onChange={(e) => patch("hero", { headline: e.target.value })}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
              onBlur={(e) => (e.target.style.borderColor = "oklch(88% 0 0)")}
            />
          </Field>
          <Field label="Pod-nagłówek">
            <textarea
              value={config.hero.subheadline}
              onChange={(e) => patch("hero", { subheadline: e.target.value })}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
              onBlur={(e) => (e.target.style.borderColor = "oklch(88% 0 0)")}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tekst przycisku">
              <input
                value={config.hero.ctaText}
                onChange={(e) => patch("hero", { ctaText: e.target.value })}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
                onBlur={(e) => (e.target.style.borderColor = "oklch(88% 0 0)")}
              />
            </Field>
            <Field label="Link przycisku">
              <input
                value={config.hero.ctaUrl}
                onChange={(e) => patch("hero", { ctaUrl: e.target.value })}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
                onBlur={(e) => (e.target.style.borderColor = "oklch(88% 0 0)")}
              />
            </Field>
          </div>
        </div>
      </Accordion>

      {/* Benefits */}
      <Accordion title="Sekcja Korzyści" open={!!open.benefits} onToggle={() => toggle("benefits")}>
        <div className="space-y-3">
          {config.benefits.items.map((item, i) => (
            <div
              key={i}
              className="p-3 rounded-xl"
              style={{ background: "oklch(97% 0 0)", border: "1px solid oklch(92% 0 0)" }}
            >
              <div className="grid grid-cols-[3rem_1fr_1fr] gap-2">
                <Field label="Ikona">
                  <input
                    value={item.icon}
                    onChange={(e) => {
                      const items = [...config.benefits.items];
                      items[i] = { ...items[i], icon: e.target.value };
                      patch("benefits", { items });
                    }}
                    style={{ ...inputStyle, textAlign: "center" }}
                    onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
                    onBlur={(e) => (e.target.style.borderColor = "oklch(88% 0 0)")}
                  />
                </Field>
                <Field label="Tytuł">
                  <input
                    value={item.title}
                    onChange={(e) => {
                      const items = [...config.benefits.items];
                      items[i] = { ...items[i], title: e.target.value };
                      patch("benefits", { items });
                    }}
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
                    onBlur={(e) => (e.target.style.borderColor = "oklch(88% 0 0)")}
                  />
                </Field>
                <Field label="Opis">
                  <input
                    value={item.desc}
                    onChange={(e) => {
                      const items = [...config.benefits.items];
                      items[i] = { ...items[i], desc: e.target.value };
                      patch("benefits", { items });
                    }}
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
                    onBlur={(e) => (e.target.style.borderColor = "oklch(88% 0 0)")}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </Accordion>

      {/* Reviews */}
      <Accordion title="Sekcja Opinie" open={!!open.reviews} onToggle={() => toggle("reviews")}>
        <Toggle
          checked={config.reviews.enabled}
          onChange={(v) => patch("reviews", { enabled: v })}
          label="Pokaż sekcję opinii na stronie"
        />
      </Accordion>

      {/* Guarantee */}
      <Accordion title="Gwarancja satysfakcji" open={!!open.guarantee} onToggle={() => toggle("guarantee")}>
        <div className="space-y-3">
          <Toggle
            checked={config.guarantee.enabled}
            onChange={(v) => patch("guarantee", { enabled: v })}
            label="Pokaż sekcję gwarancji"
          />
          <Field label="Tekst gwarancji">
            <textarea
              value={config.guarantee.text}
              onChange={(e) => patch("guarantee", { text: e.target.value })}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
              onBlur={(e) => (e.target.style.borderColor = "oklch(88% 0 0)")}
            />
          </Field>
        </div>
      </Accordion>
    </div>
  );
}
