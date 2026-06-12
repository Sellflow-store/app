"use client";

import { useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import type { DeliveryConfig, DeliveryMethod } from "@/types/shop";

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
  onFocus: (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = "oklch(22% 0.24 270)"),
  onBlur: (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = "oklch(88% 0 0)"),
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className="relative w-9 h-5 rounded-full transition-all cursor-pointer shrink-0"
      style={{ background: checked ? "oklch(56% 0.30 335)" : "oklch(82% 0 0)" }}
      onClick={() => onChange(!checked)}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
        style={{ left: checked ? "1.125rem" : "0.125rem" }}
      />
    </div>
  );
}

/** "16,99" → "16.99"; null gdy nie da się sparsować */
function normalizePrice(raw: string): string | null {
  const cleaned = raw.replace(",", ".").replace(/[^\d.]/g, "");
  if (cleaned === "") return null;
  const n = parseFloat(cleaned);
  if (isNaN(n) || n < 0) return null;
  return n.toFixed(2);
}

interface Props {
  shopSlug: string;
  initialConfig: DeliveryConfig;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function DeliveryForm({ shopSlug, initialConfig }: Props) {
  const [methods, setMethods] = useState<DeliveryMethod[]>(initialConfig.methods);
  const [freeFrom, setFreeFrom] = useState(initialConfig.freeShippingFrom);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [validationError, setValidationError] = useState<string | null>(null);

  function updateMethod(i: number, patch: Partial<DeliveryMethod>) {
    setMethods((prev) => prev.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  }

  async function handleSave() {
    const normalized: DeliveryMethod[] = [];
    for (const m of methods) {
      if (!m.label.trim()) {
        setValidationError("Każda metoda dostawy musi mieć nazwę.");
        return;
      }
      const price = normalizePrice(m.price);
      if (price === null) {
        setValidationError(`Niepoprawna cena przy metodzie „${m.label}”.`);
        return;
      }
      normalized.push({ ...m, label: m.label.trim(), price });
    }
    if (normalized.length === 0) {
      setValidationError("Dodaj przynajmniej jedną metodę dostawy.");
      return;
    }
    let freeShippingFrom = "";
    if (freeFrom.trim()) {
      const parsed = normalizePrice(freeFrom);
      if (parsed === null) {
        setValidationError("Niepoprawny próg darmowej dostawy.");
        return;
      }
      freeShippingFrom = parsed;
    }

    setValidationError(null);
    setSaveState("saving");
    try {
      const value: DeliveryConfig = { methods: normalized, freeShippingFrom };
      const res = await fetch(`/api/shops/${shopSlug}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "delivery", value }),
      });
      if (res.ok) {
        setMethods(normalized);
        setFreeFrom(freeShippingFrom);
      }
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
          >
            Dostawa
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
            Metody i ceny dostawy widoczne w koszyku Twoich klientów
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

      {validationError && (
        <div
          className="rounded-xl px-4 py-3 mb-5 text-xs font-medium"
          style={{ background: "oklch(50% 0.20 20 / 0.08)", color: "oklch(40% 0.18 20)", border: "1px solid oklch(50% 0.20 20 / 0.25)" }}
        >
          {validationError}
        </div>
      )}

      {/* Methods */}
      <div
        className="rounded-2xl p-5 mb-5"
        style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}
      >
        <h2
          className="text-sm font-semibold mb-4"
          style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
        >
          Metody dostawy
        </h2>

        <div className="space-y-3">
          {methods.map((m, i) => (
            <div
              key={m.id}
              className="p-3 rounded-xl"
              style={{
                background: m.enabled ? "oklch(97% 0 0)" : "oklch(97% 0 0 / 0.5)",
                border: "1px solid oklch(92% 0 0)",
                opacity: m.enabled ? 1 : 0.6,
              }}
            >
              <div className="grid grid-cols-[auto_1fr_7rem_2rem] gap-3 items-center">
                <Toggle checked={m.enabled} onChange={(v) => updateMethod(i, { enabled: v })} />
                <input
                  value={m.label}
                  onChange={(e) => updateMethod(i, { label: e.target.value })}
                  placeholder="Nazwa metody"
                  aria-label="Nazwa metody dostawy"
                  style={inputStyle}
                  {...focusProps}
                />
                <div className="relative">
                  <input
                    value={m.price}
                    onChange={(e) => updateMethod(i, { price: e.target.value })}
                    placeholder="0,00"
                    inputMode="decimal"
                    aria-label="Cena dostawy"
                    style={{ ...inputStyle, paddingRight: "28px", textAlign: "right" }}
                    {...focusProps}
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                    style={{ color: "oklch(55% 0 0)" }}
                  >
                    zł
                  </span>
                </div>
                <button
                  onClick={() => setMethods((prev) => prev.filter((_, j) => j !== i))}
                  aria-label={`Usuń metodę ${m.label}`}
                  className="p-1.5 rounded-lg transition-colors justify-self-end"
                  style={{ color: "oklch(50% 0.15 20)" }}
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() =>
            setMethods((prev) => [
              ...prev,
              { id: `metoda-${Date.now().toString(36)}`, label: "", price: "", enabled: true },
            ])
          }
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
          style={{ border: "1.5px solid oklch(85% 0 0)", color: "oklch(30% 0 0)", background: "oklch(97% 0 0)" }}
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
          Dodaj metodę
        </button>
      </div>

      {/* Free shipping threshold */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}
      >
        <h2
          className="text-sm font-semibold mb-1"
          style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
        >
          Darmowa dostawa
        </h2>
        <p className="text-xs mb-4" style={{ color: "oklch(50% 0 0)" }}>
          Zostaw puste, jeśli nie oferujesz darmowej dostawy.
        </p>
        <div className="relative max-w-[12rem]">
          <input
            value={freeFrom}
            onChange={(e) => setFreeFrom(e.target.value)}
            placeholder="np. 199"
            inputMode="decimal"
            aria-label="Próg darmowej dostawy"
            style={{ ...inputStyle, paddingRight: "60px" }}
            {...focusProps}
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: "oklch(55% 0 0)" }}
          >
            zł i więcej
          </span>
        </div>
      </div>
    </div>
  );
}
