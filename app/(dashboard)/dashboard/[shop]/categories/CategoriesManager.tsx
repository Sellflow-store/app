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

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-display)", color: "var(--panel-ink)" }}
        >
          Kategorie
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--panel-ink-muted)" }}>
          Zmień nazwę, ukryj lub usuń kategorię — zmiany obejmą wszystkie produkty w środku
        </p>
      </div>

      {error && (
        <div
          className="rounded-xl px-4 py-3 mb-5 text-xs font-medium"
          style={{
            background: "oklch(50% 0.20 20 / 0.08)",
            color: "oklch(40% 0.18 20)",
            border: "1px solid oklch(50% 0.20 20 / 0.25)",
          }}
        >
          {error}
        </div>
      )}

      <div
        className="rounded-2xl overflow-hidden mb-5"
        style={{ border: "1px solid var(--panel-border)", background: "var(--panel-surface)" }}
      >
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Layers className="w-10 h-10" style={{ color: "var(--panel-border-strong)" }} strokeWidth={1} />
            <p className="text-sm" style={{ color: "var(--panel-ink-muted)" }}>
              Brak kategorii — nadaj produktom kategorie w ich formularzach
            </p>
            <Link
              href={`/dashboard/${shopSlug}/products`}
              className="text-xs font-semibold px-4 py-2 rounded-full"
              style={{ background: "var(--panel-accent)", color: "#fff" }}
            >
              Przejdź do produktów
            </Link>
          </div>
        ) : (
          <>
            <div
              className="grid text-[11px] font-semibold tracking-wide uppercase px-5 py-3"
              style={{
                gridTemplateColumns: "2fr 0.8fr 1fr auto",
                color: "var(--panel-ink-muted)",
                borderBottom: "1px solid var(--panel-border)",
                background: "var(--panel-surface-2)",
              }}
            >
              <span>Kategoria</span>
              <span>Produkty</span>
              <span>Widoczne</span>
              <span />
            </div>
            {categories.map((row, i) => {
              const rowBusy = busy === row.name;
              return (
                <div
                  key={row.name}
                  className="grid items-center px-5 py-3"
                  style={{
                    gridTemplateColumns: "2fr 0.8fr 1fr auto",
                    borderBottom: i < categories.length - 1 ? "1px solid var(--panel-surface-hover)" : "none",
                    opacity: rowBusy ? 0.5 : 1,
                  }}
                >
                  {/* Name / inline edit */}
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
                      <button
                        onClick={() => saveRename(row)}
                        aria-label="Zapisz nazwę"
                        className="p-1.5 rounded-lg"
                        style={{ color: "oklch(40% 0.16 145)" }}
                      >
                        <Check className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        aria-label="Anuluj"
                        className="p-1.5 rounded-lg"
                        style={{ color: "var(--panel-ink-muted)" }}
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-medium" style={{ color: "var(--panel-ink)" }}>
                      {row.name}
                    </span>
                  )}

                  <span className="text-xs tabular-nums" style={{ color: "var(--panel-ink)" }}>
                    {row.total}
                  </span>

                  <span
                    className="flex items-center gap-1.5 text-xs tabular-nums"
                    style={{ color: row.visible > 0 ? "oklch(40% 0.16 145)" : "var(--panel-ink-muted)" }}
                  >
                    {row.visible > 0 ? (
                      <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" strokeWidth={1.5} />
                    )}
                    {row.visible} z {row.total}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => toggleVisible(row)}
                      disabled={rowBusy}
                      aria-label={row.visible > 0 ? "Ukryj kategorię" : "Pokaż kategorię"}
                      title={row.visible > 0 ? "Ukryj wszystkie produkty" : "Pokaż wszystkie produkty"}
                      className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                      style={{ color: "var(--panel-ink-muted)" }}
                    >
                      {row.visible > 0 ? (
                        <EyeOff className="w-3.5 h-3.5" strokeWidth={1.5} />
                      ) : (
                        <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                      )}
                    </button>
                    <button
                      onClick={() => startEdit(row)}
                      disabled={rowBusy || editing === row.name}
                      aria-label={`Zmień nazwę kategorii ${row.name}`}
                      className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                      style={{ color: "var(--panel-ink-muted)" }}
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => remove(row)}
                      disabled={rowBusy}
                      aria-label={`Usuń kategorię ${row.name}`}
                      className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                      style={{ color: "oklch(50% 0.15 20)" }}
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {uncategorized > 0 && (
        <p className="text-xs" style={{ color: "var(--panel-ink-muted)" }}>
          {uncategorized}{" "}
          {uncategorized === 1 ? "produkt nie ma" : "produkty(ów) nie ma"} przypisanej kategorii —{" "}
          <Link
            href={`/dashboard/${shopSlug}/products`}
            className="underline underline-offset-2 font-medium"
            style={{ color: "var(--panel-primary)" }}
          >
            uzupełnij w produktach
          </Link>
          .
        </p>
      )}
    </div>
  );
}
