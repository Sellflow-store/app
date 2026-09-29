"use client";

import { useState } from "react";
import { Save, Plus, Trash2, HelpCircle } from "lucide-react";
import type { FaqConfig, FaqItem } from "@/types/shop";

const inputStyle = {
  border: "1px solid var(--panel-border)",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "13.5px",
  color: "var(--panel-ink)",
  background: "var(--panel-surface)",
  fontFamily: "var(--font-body)",
  width: "100%",
  outline: "none",
};

const focusProps = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = "var(--panel-primary)"),
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = "var(--panel-border)"),
};

interface Props {
  shopSlug: string;
  initialConfig: FaqConfig;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function FaqForm({ shopSlug, initialConfig }: Props) {
  const [items, setItems] = useState<FaqItem[]>(initialConfig.items);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  function update(i: number, patch: Partial<FaqItem>) {
    setItems((prev) => prev.map((item, j) => (j === i ? { ...item, ...patch } : item)));
  }

  async function handleSave() {
    setSaveState("saving");
    try {
      const cleaned = items.filter((i) => i.q.trim() || i.a.trim());
      const res = await fetch(`/api/shops/${shopSlug}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "faq", value: { items: cleaned } satisfies FaqConfig }),
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
    : saveState === "saved" ? "Zapisano"
    : saveState === "error" ? "Błąd, spróbuj ponownie"
    : "Zapisz zmiany";

  const buttonBg =
    saveState === "saved" ? "var(--panel-success)"
    : saveState === "error" ? "oklch(50% 0.20 20)"
    : "var(--panel-accent)";

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--panel-ink)" }}
          >
            FAQ
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--panel-ink-muted)" }}>
            Najczęstsze pytania klientów i odpowiedzi
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveState === "saving"}
          className="flex items-center gap-2 h-9 px-3.5 text-[13px] font-semibold rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: buttonBg, color: "#fff" }}
        >
          <Save className="w-3.5 h-3.5" strokeWidth={2} />
          {buttonLabel}
        </button>
      </div>

      {items.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-12 gap-3 rounded-2xl mb-5"
          style={{ border: "1.5px dashed var(--panel-border-strong)", background: "var(--panel-surface-2)" }}
        >
          <HelpCircle className="w-8 h-8" style={{ color: "var(--panel-border-strong)" }} strokeWidth={1} />
          <p className="text-sm" style={{ color: "var(--panel-ink-muted)" }}>
            Brak pytań — dodaj pierwsze poniżej
          </p>
        </div>
      )}

      <div className="space-y-4 mb-5">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-2xl p-4"
            style={{ background: "var(--panel-surface)", border: "1px solid var(--panel-border)" }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-3">
                <input
                  value={item.q}
                  onChange={(e) => update(i, { q: e.target.value })}
                  placeholder={`Pytanie ${i + 1}, np. „Ile trwa dostawa?”`}
                  aria-label={`Pytanie ${i + 1}`}
                  style={{ ...inputStyle, fontWeight: 600 }}
                  {...focusProps}
                />
                <textarea
                  value={item.a}
                  onChange={(e) => update(i, { a: e.target.value })}
                  rows={2}
                  placeholder="Odpowiedź…"
                  aria-label={`Odpowiedź ${i + 1}`}
                  style={{ ...inputStyle, resize: "vertical" }}
                  {...focusProps}
                />
              </div>
              <button
                onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
                aria-label={`Usuń pytanie ${i + 1}`}
                className="p-1.5 rounded-lg transition-colors shrink-0 mt-1"
                style={{ color: "oklch(50% 0.15 20)" }}
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setItems((prev) => [...prev, { q: "", a: "" }])}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
        style={{ border: "1.5px solid var(--panel-border-strong)", color: "var(--panel-ink)", background: "var(--panel-surface-2)" }}
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
        Dodaj pytanie
      </button>
    </div>
  );
}
