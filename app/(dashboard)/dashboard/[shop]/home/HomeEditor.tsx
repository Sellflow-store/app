"use client";

import { useState } from "react";
import { Save, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { HomeConfig } from "@/types/shop";
import ImageUpload from "@/components/admin/ImageUpload";

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

const focusProps = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = "oklch(22% 0.24 270)"),
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = "oklch(88% 0 0)"),
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

function ItemListEditor({
  items,
  onChange,
  addLabel,
}: {
  items: { title: string; description: string }[];
  onChange: (items: { title: string; description: string }[]) => void;
  addLabel: string;
}) {
  function update(i: number, patch: Partial<{ title: string; description: string }>) {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="p-3 rounded-xl"
          style={{ background: "oklch(97% 0 0)", border: "1px solid oklch(92% 0 0)" }}
        >
          <div className="grid grid-cols-[1fr_1.5fr_2rem] gap-2 items-end">
            <Field label="Tytuł">
              <input
                value={item.title}
                onChange={(e) => update(i, { title: e.target.value })}
                style={inputStyle}
                {...focusProps}
              />
            </Field>
            <Field label="Opis">
              <input
                value={item.description}
                onChange={(e) => update(i, { description: e.target.value })}
                style={inputStyle}
                {...focusProps}
              />
            </Field>
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              aria-label="Usuń pozycję"
              className="p-2 mb-3 rounded-lg transition-colors"
              style={{ color: "oklch(50% 0.15 20)" }}
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, { title: "", description: "" }])}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
        style={{ border: "1.5px solid oklch(85% 0 0)", color: "oklch(30% 0 0)", background: "oklch(97% 0 0)" }}
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
        {addLabel}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  shopSlug: string;
  initialConfig: HomeConfig;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function HomeEditor({ shopSlug, initialConfig }: Props) {
  const [config, setConfig] = useState<HomeConfig>(initialConfig);
  const [open, setOpen] = useState<Record<string, boolean>>({ topBar: true });
  const [saveState, setSaveState] = useState<SaveState>("idle");

  function toggle(key: string) {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function patch<K extends keyof HomeConfig>(key: K, value: Partial<HomeConfig[K]>) {
    setConfig((prev) => ({ ...prev, [key]: { ...prev[key], ...value } }));
  }

  async function handleSave() {
    setSaveState("saving");
    try {
      // Full config object — preserves sections this editor doesn't touch
      // (reviews, video, discounts, popup) instead of dropping them.
      const res = await fetch(`/api/shops/${shopSlug}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "home", value: config }),
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
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
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
          disabled={saveState === "saving"}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full transition-all disabled:opacity-60"
          style={{ background: buttonBg, color: "#fff" }}
        >
          <Save className="w-3.5 h-3.5" strokeWidth={2} />
          {buttonLabel}
        </button>
      </div>

      {/* TopBar */}
      <Accordion title="Pasek powiadomień (TopBar)" open={!!open.topBar} onToggle={() => toggle("topBar")}>
        <div className="space-y-3">
          <Toggle
            checked={config.topBar.visible}
            onChange={(v) => patch("topBar", { visible: v })}
            label="Pokaż pasek nad menu"
          />
          <Field label="Tekst paska">
            <input
              value={config.topBar.text}
              onChange={(e) => patch("topBar", { text: e.target.value })}
              style={inputStyle}
              {...focusProps}
            />
          </Field>
        </div>
      </Accordion>

      {/* Hero */}
      <Accordion title="Sekcja Hero (nagłówek)" open={!!open.hero} onToggle={() => toggle("hero")}>
        <div className="space-y-0">
          <Field label="Zdjęcie w hero (opcjonalne)">
            <div className="flex items-start gap-3">
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                style={{ background: "oklch(95% 0.008 260)", border: "1.5px dashed oklch(80% 0 0)" }}
              >
                {config.hero.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={config.hero.image} alt="hero" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-center px-1" style={{ color: "oklch(55% 0 0)" }}>
                    Brak
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-[11px] mb-2" style={{ color: "oklch(45% 0 0)" }}>
                  Zalecane 800×800 px. Pojawi się po prawej stronie nagłówka. Bez zdjęcia
                  pokazujemy placeholder. Pamiętaj o „Zapisz zmiany”.
                </p>
                <div className="flex items-center gap-3">
                  <ImageUpload
                    label={config.hero.image ? "Zmień zdjęcie" : "Wgraj zdjęcie"}
                    onUploaded={(urls) => urls[0] && patch("hero", { image: urls[0] })}
                  />
                  {config.hero.image && (
                    <button
                      type="button"
                      onClick={() => patch("hero", { image: "" })}
                      className="text-[11px] font-medium underline-offset-2 hover:underline"
                      style={{ color: "oklch(45% 0.18 20)" }}
                    >
                      Usuń
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Field>
          <Field label="Nadtytuł (eyebrow)">
            <input
              value={config.hero.eyebrow}
              onChange={(e) => patch("hero", { eyebrow: e.target.value })}
              placeholder="np. Kolekcja 2026"
              style={inputStyle}
              {...focusProps}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nagłówek — linia 1">
              <input
                value={config.hero.headline}
                onChange={(e) => patch("hero", { headline: e.target.value })}
                style={inputStyle}
                {...focusProps}
              />
            </Field>
            <Field label="Nagłówek — linia 2 (wyróżniona)">
              <input
                value={config.hero.headlineSub}
                onChange={(e) => patch("hero", { headlineSub: e.target.value })}
                style={inputStyle}
                {...focusProps}
              />
            </Field>
          </div>
          <Field label="Opis pod nagłówkiem">
            <textarea
              value={config.hero.description}
              onChange={(e) => patch("hero", { description: e.target.value })}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
              {...focusProps}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Przycisk główny">
              <input
                value={config.hero.ctaPrimary}
                onChange={(e) => patch("hero", { ctaPrimary: e.target.value })}
                style={inputStyle}
                {...focusProps}
              />
            </Field>
            <Field label="Przycisk drugorzędny">
              <input
                value={config.hero.ctaSecondary}
                onChange={(e) => patch("hero", { ctaSecondary: e.target.value })}
                style={inputStyle}
                {...focusProps}
              />
            </Field>
          </div>
          <Field label="Social proof (np. liczba klientów)">
            <input
              value={config.hero.socialProof}
              onChange={(e) => patch("hero", { socialProof: e.target.value })}
              placeholder="np. Ponad 1 000 zadowolonych klientów"
              style={inputStyle}
              {...focusProps}
            />
          </Field>
        </div>
      </Accordion>

      {/* Products section */}
      <Accordion title="Sekcja Produkty" open={!!open.products} onToggle={() => toggle("products")}>
        <div className="space-y-0">
          <Field label="Nadtytuł (eyebrow)">
            <input
              value={config.products.eyebrow}
              onChange={(e) => patch("products", { eyebrow: e.target.value })}
              style={inputStyle}
              {...focusProps}
            />
          </Field>
          <Field label="Nagłówek sekcji">
            <input
              value={config.products.headline}
              onChange={(e) => patch("products", { headline: e.target.value })}
              style={inputStyle}
              {...focusProps}
            />
          </Field>
          <Field label="Pod-nagłówek">
            <input
              value={config.products.subheadline}
              onChange={(e) => patch("products", { subheadline: e.target.value })}
              style={inputStyle}
              {...focusProps}
            />
          </Field>
        </div>
      </Accordion>

      {/* Benefits */}
      <Accordion title="Sekcja Korzyści" open={!!open.benefits} onToggle={() => toggle("benefits")}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nadtytuł (eyebrow)">
              <input
                value={config.benefits.eyebrow}
                onChange={(e) => patch("benefits", { eyebrow: e.target.value })}
                style={inputStyle}
                {...focusProps}
              />
            </Field>
            <Field label="Nagłówek sekcji">
              <input
                value={config.benefits.headline}
                onChange={(e) => patch("benefits", { headline: e.target.value })}
                style={inputStyle}
                {...focusProps}
              />
            </Field>
          </div>
          <ItemListEditor
            items={config.benefits.items}
            onChange={(items) => patch("benefits", { items })}
            addLabel="Dodaj korzyść"
          />
        </div>
      </Accordion>

      {/* Guarantee */}
      <Accordion title="Gwarancja satysfakcji" open={!!open.guarantee} onToggle={() => toggle("guarantee")}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nagłówek">
              <input
                value={config.guarantee.headline}
                onChange={(e) => patch("guarantee", { headline: e.target.value })}
                style={inputStyle}
                {...focusProps}
              />
            </Field>
            <Field label="Pod-nagłówek">
              <input
                value={config.guarantee.subheadline}
                onChange={(e) => patch("guarantee", { subheadline: e.target.value })}
                style={inputStyle}
                {...focusProps}
              />
            </Field>
          </div>
          <ItemListEditor
            items={config.guarantee.items}
            onChange={(items) => patch("guarantee", { items })}
            addLabel="Dodaj punkt gwarancji"
          />
        </div>
      </Accordion>

      {/* Newsletter popup */}
      <Accordion title="Popup newslettera" open={!!open.popup} onToggle={() => toggle("popup")}>
        <div className="space-y-3">
          <Toggle
            checked={config.popup.enabled}
            onChange={(v) => patch("popup", { enabled: v })}
            label="Pokazuj popup z zapisem do newslettera"
          />
          {config.popup.enabled && (
            <>
              <Field label="Po ilu sekundach pokazać">
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={config.popup.delaySeconds}
                  onChange={(e) =>
                    patch("popup", { delaySeconds: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  style={{ ...inputStyle, width: "8rem" }}
                  {...focusProps}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tytuł">
                  <input
                    value={config.popup.title}
                    onChange={(e) => patch("popup", { title: e.target.value })}
                    style={inputStyle}
                    {...focusProps}
                  />
                </Field>
                <Field label="Tekst przycisku">
                  <input
                    value={config.popup.buttonLabel}
                    onChange={(e) => patch("popup", { buttonLabel: e.target.value })}
                    style={inputStyle}
                    {...focusProps}
                  />
                </Field>
              </div>
              <Field label="Opis (np. zachęta / rabat)">
                <textarea
                  value={config.popup.description}
                  onChange={(e) => patch("popup", { description: e.target.value })}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                  {...focusProps}
                />
              </Field>
            </>
          )}
        </div>
      </Accordion>
    </div>
  );
}
