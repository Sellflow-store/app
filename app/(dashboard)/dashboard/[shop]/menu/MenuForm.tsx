"use client";

import { useState } from "react";
import { Save, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { MenuItem } from "@/types/shop";

/** Strony, na które może wskazywać pozycja menu. */
const PAGE_OPTIONS = [
  { href: "/", label: "Strona główna" },
  { href: "/produkty", label: "Wszystkie produkty" },
  { href: "/o-nas", label: "O nas" },
  { href: "/faq", label: "FAQ" },
  { href: "/kontakt", label: "Kontakt" },
  { href: "/dostawa", label: "Dostawa" },
  { href: "/zwroty", label: "Zwroty i reklamacje" },
  { href: "/regulamin", label: "Regulamin" },
  { href: "/prywatnosc", label: "Polityka prywatności" },
];

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
  initialItems: MenuItem[];
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function MenuForm({ shopSlug, initialItems }: Props) {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [validationError, setValidationError] = useState<string | null>(null);

  function update(i: number, patch: Partial<MenuItem>) {
    setItems((prev) => prev.map((item, j) => (j === i ? { ...item, ...patch } : item)));
  }

  function move(i: number, dir: -1 | 1) {
    setItems((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function handleSave() {
    const cleaned = items
      .map((i) => ({ label: i.label.trim(), href: i.href }))
      .filter((i) => i.label);
    if (cleaned.length === 0) {
      setValidationError("Dodaj przynajmniej jedną pozycję menu.");
      return;
    }
    setValidationError(null);
    setSaveState("saving");
    try {
      const res = await fetch(`/api/shops/${shopSlug}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "menu", value: { items: cleaned } }),
      });
      if (res.ok) setItems(cleaned);
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
            Menu nawigacji
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
            Pozycje widoczne w górnym menu Twojego sklepu
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

      <div className="space-y-3 mb-5">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-2xl p-4"
            style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}
          >
            <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-3 items-center">
              {/* Reorder */}
              <div className="flex flex-col">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Przesuń wyżej"
                  className="p-0.5 disabled:opacity-25"
                  style={{ color: "oklch(45% 0 0)" }}
                >
                  <ChevronUp className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  aria-label="Przesuń niżej"
                  className="p-0.5 disabled:opacity-25"
                  style={{ color: "oklch(45% 0 0)" }}
                >
                  <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              <input
                value={item.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Etykieta, np. Sklep"
                aria-label={`Etykieta pozycji ${i + 1}`}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
                onBlur={(e) => (e.target.style.borderColor = "oklch(88% 0 0)")}
              />

              <select
                value={item.href}
                onChange={(e) => update(i, { href: e.target.value })}
                aria-label={`Strona docelowa pozycji ${i + 1}`}
                style={{ ...inputStyle, appearance: "auto" }}
              >
                {PAGE_OPTIONS.map((p) => (
                  <option key={p.href} value={p.href}>
                    {p.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
                aria-label={`Usuń pozycję ${item.label || i + 1}`}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "oklch(50% 0.15 20)" }}
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setItems((prev) => [...prev, { label: "", href: "/produkty" }])}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
        style={{ border: "1.5px solid oklch(85% 0 0)", color: "oklch(30% 0 0)", background: "oklch(97% 0 0)" }}
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
        Dodaj pozycję
      </button>

      <p className="text-[11px] mt-4" style={{ color: "oklch(60% 0 0)" }}>
        Koszyk jest zawsze widoczny jako ikona — nie musisz dodawać go do menu.
      </p>
    </div>
  );
}
