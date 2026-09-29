"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers, Eye, EyeOff, Pencil, Trash2, Check, X } from "lucide-react";

export interface CategoryRow {
  name: string;
  total: number;
  visible: number;
}

const inputStyle = {
  border: "1.5px solid var(--panel-primary)",
  borderRadius: "8px",
  padding: "6px 10px",
  fontSize: "13px",
  color: "var(--panel-ink)",
  background: "var(--panel-surface)",
  fontFamily: "var(--font-body)",
  outline: "none",
};

interface Props {
  shopSlug: string;
  categories: CategoryRow[];
  uncategorized: number;
}

export default function CategoriesManager({ shopSlug, categories, uncategorized }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function call(method: "PATCH" | "DELETE", category: string, body?: object) {
    setBusy(category);
    setError(null);
    try {
      const url =
        method === "DELETE"
          ? `/api/shops/${shopSlug}/categories?category=${encodeURIComponent(category)}`
          : `/api/shops/${shopSlug}/categories`;
      const res = await fetch(url, {
        method,
        headers: method === "PATCH" ? { "Content-Type": "application/json" } : undefined,
        body: method === "PATCH" ? JSON.stringify({ category, ...body }) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Operacja nie powiodła się.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Operacja nie powiodła się.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  function startEdit(row: CategoryRow) {
    setEditing(row.name);
    setDraft(row.name);
    setError(null);
  }

  async function saveRename(row: CategoryRow) {
    const next = draft.trim();
    if (!next || next === row.name) {
      setEditing(null);
      return;
    }
    if (await call("PATCH", row.name, { rename: next })) setEditing(null);
  }

  async function toggleVisible(row: CategoryRow) {
    // If any product is visible, hide the whole category; otherwise show it.
    await call("PATCH", row.name, { visible: row.visible === 0 });
  }

  async function remove(row: CategoryRow) {
    if (
      !confirm(
        `Usunąć kategorię „${row.name}”? Produkty (${row.total}) zostaną, ale stracą przypisanie do tej kategorii.`
      )
    ) {
      return;
    }
    await call("DELETE", row.name);
  }

  const ICON_BTN =
    "flex items-center justify-center w-8 h-8 rounded-md transition-colors disabled:opacity-50 text-[var(--panel-ink-faint)] hover:bg-[var(--panel-surface-2)] hover:text-[var(--panel-ink)]";
  const COLS = "grid-cols-[minmax(0,2fr)_110px_150px_120px]";

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-[var(--panel-ink)]" style={{ fontFamily: "var(--font-display)" }}>
          Kategorie
        </h1>
        <p className="text-[13px] mt-0.5 text-[var(--panel-ink-muted)]">
          Zmień nazwę, ukryj lub usuń kategorię. Zmiana obejmie wszystkie produkty w środku.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg px-4 py-3 mb-5 text-[13px] font-medium bg-[oklch(50%_0.20_20/0.08)] text-[oklch(45%_0.18_20)] border border-[oklch(50%_0.20_20/0.25)]">
          {error}
        </div>
      )}

      <div className="rounded-xl overflow-hidden mb-4 border border-[var(--panel-border)] bg-[var(--panel-surface)]">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Layers className="w-10 h-10 text-[var(--panel-ink-faint)]" strokeWidth={1} />
            <p className="text-sm text-[var(--panel-ink-muted)]">Brak kategorii. Nadaj produktom kategorie w ich formularzach.</p>
            <Link
              href={`/dashboard/${shopSlug}/products`}
              className="h-9 px-3.5 flex items-center rounded-lg text-[13px] font-semibold bg-[var(--panel-primary)] text-[var(--panel-surface)] hover:opacity-90"
            >
              Przejdź do produktów
            </Link>
          </div>
        ) : (
          <div role="table" aria-label="Kategorie" className="overflow-x-auto">
            <div
              role="row"
              className={`grid ${COLS} gap-4 items-center px-5 h-9 min-w-[560px] text-[12px] font-medium text-[var(--panel-ink-muted)] border-b border-[var(--panel-border)] bg-[var(--panel-surface-2)]`}
            >
              <span role="columnheader">Kategoria</span>
              <span role="columnheader" className="text-right">Produkty</span>
              <span role="columnheader">Widoczne w sklepie</span>
              <span role="columnheader" className="sr-only">Akcje</span>
            </div>
            {categories.map((row) => {
              const rowBusy = busy === row.name;
              return (
                <div
                  key={row.name}
                  role="row"
                  className={`grid ${COLS} gap-4 items-center px-5 h-[52px] min-w-[560px] text-[13.5px] border-b last:border-b-0 border-[var(--panel-border)] transition-colors hover:bg-[var(--panel-surface-hover)] ${rowBusy ? "opacity-50" : ""}`}
                >
                  {editing === row.name ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveRename(row);
                          if (e.key === "Escape") setEditing(null);
                        }}
                        aria-label="Nazwa kategorii"
                        style={inputStyle}
                      />
                      <button onClick={() => saveRename(row)} aria-label="Zapisz nazwę" className={ICON_BTN}>
                        <Check className="w-4 h-4 text-[var(--panel-success)]" strokeWidth={2} />
                      </button>
                      <button onClick={() => setEditing(null)} aria-label="Anuluj" className={ICON_BTN}>
                        <X className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>
                  ) : (
                    <span className="font-medium truncate text-[var(--panel-ink)]">{row.name}</span>
                  )}

                  <span className="text-right tabular-nums text-[var(--panel-ink)]">{row.total}</span>

                  <span className="flex items-center gap-2 text-[13px] tabular-nums text-[var(--panel-ink)]">
                    <span
                      aria-hidden
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        background:
                          row.visible === 0 ? "var(--panel-ink-faint)" : row.visible < row.total ? "var(--panel-warning)" : "var(--panel-success)",
                      }}
                    />
                    {row.visible} z {row.total}
                  </span>

                  <div className="flex items-center gap-0.5 justify-end">
                    <button
                      onClick={() => toggleVisible(row)}
                      disabled={rowBusy}
                      aria-label={row.visible > 0 ? "Ukryj kategorię" : "Pokaż kategorię"}
                      title={row.visible > 0 ? "Ukryj wszystkie produkty" : "Pokaż wszystkie produkty"}
                      className={ICON_BTN}
                    >
                      {row.visible > 0 ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
                    </button>
                    <button
                      onClick={() => startEdit(row)}
                      disabled={rowBusy || editing === row.name}
                      aria-label={`Zmień nazwę kategorii ${row.name}`}
                      className={ICON_BTN}
                    >
                      <Pencil className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                    <button
                      onClick={() => remove(row)}
                      disabled={rowBusy}
                      aria-label={`Usuń kategorię ${row.name}`}
                      className={`${ICON_BTN} hover:text-[oklch(55%_0.19_25)]`}
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {uncategorized > 0 && (
        <p className="text-[13px] text-[var(--panel-ink-muted)]">
          {uncategorized} {uncategorized === 1 ? "produkt nie ma" : "produkty(ów) nie ma"} przypisanej kategorii.{" "}
          <Link href={`/dashboard/${shopSlug}/products`} className="underline underline-offset-2 font-medium text-[var(--panel-primary)]">
            Uzupełnij w produktach
          </Link>
          .
        </p>
      )}
    </div>
  );
}
