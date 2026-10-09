"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Eye, EyeOff, Package, Search, ArrowUp, ArrowDown, GripVertical, ListOrdered, Check } from "lucide-react";
import { formatPln } from "@/lib/money";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  priceOnRequest: boolean;
  visible: boolean;
  badge?: string;
  stock?: number | null;
  image?: string;
  type?: "physical" | "digital" | "service";
  /** Gotowość danych dla Google i AI, 0–100 (lib/product-attributes). */
  aiScore?: number;
  /** Najważniejsza brakująca rzecz, do podpowiedzi. */
  aiGap?: string;
}

/** Ocena kompletności danych dla Google i asystentów AI. */
function AiScore({ score, gap }: { score?: number; gap?: string }) {
  if (score == null) return <span className="text-[var(--panel-ink-faint)]">—</span>;
  const color = score >= 85 ? "var(--panel-success)" : score >= 60 ? "var(--panel-warning)" : "var(--panel-danger)";
  return (
    <span className="flex items-center gap-2 text-[var(--panel-ink)] tabular-nums" title={gap ? `Brakuje: ${gap}` : "Komplet danych"}>
      <span aria-hidden className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      {score}%
    </span>
  );
}

const CHIP = "text-[11.5px] font-medium px-1.5 py-px rounded-md border shrink-0";

function TypeBadge({ type }: { type?: string }) {
  if (!type || type === "physical") return null;
  return (
    <span className={`${CHIP} border-[var(--panel-border)] text-[var(--panel-ink-muted)]`}>
      {type === "digital" ? "Cyfrowy" : "Usługa"}
    </span>
  );
}

/** Stan magazynu: kropka + tekst. null = nie śledzony (produkt na zamówienie, cyfrowy). */
function Stock({ stock }: { stock?: number | null }) {
  if (stock == null) return <span className="text-[var(--panel-ink-faint)]">nie śledzony</span>;
  const color = stock === 0 ? "var(--panel-danger)" : stock <= 5 ? "var(--panel-warning)" : "var(--panel-success)";
  return (
    <span className="flex items-center gap-2 text-[var(--panel-ink)]">
      <span aria-hidden className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      {stock === 0 ? "Wyprzedane" : stock <= 5 ? `Mało: ${stock} szt.` : `${stock} szt.`}
    </span>
  );
}

function Thumb({ image }: { image?: string }) {
  return (
    <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shrink-0 bg-[var(--panel-surface-2)] border border-[var(--panel-border)]">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="w-full h-full object-cover" />
      ) : (
        <Package className="w-4 h-4 text-[var(--panel-ink-faint)]" strokeWidth={1.5} />
      )}
    </div>
  );
}

function MoveButtons({
  name,
  canUp,
  canDown,
  onUp,
  onDown,
}: {
  name: string;
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
}) {
  const cls =
    "flex items-center justify-center w-7 h-7 rounded-md border border-[var(--panel-border)] text-[var(--panel-ink-muted)] hover:text-[var(--panel-ink)] hover:border-[var(--panel-border-strong)] disabled:opacity-30 disabled:hover:text-[var(--panel-ink-muted)] disabled:hover:border-[var(--panel-border)] transition-colors";
  return (
    <span className="flex items-center gap-1 shrink-0">
      <button type="button" onClick={onUp} disabled={!canUp} aria-label={`Przesuń wyżej: ${name}`} className={cls}>
        <ArrowUp className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
      <button type="button" onClick={onDown} disabled={!canDown} aria-label={`Przesuń niżej: ${name}`} className={cls}>
        <ArrowDown className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
    </span>
  );
}

const COLS = "grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_120px_140px_90px_120px_44px]";
const COLS_REORDER = "grid-cols-[84px_minmax(0,2.4fr)_minmax(0,1fr)_120px_140px_90px_120px_44px]";

type OrderState = "idle" | "saving" | "saved" | "error";

interface Props {
  shopSlug: string;
  products: Product[];
}

export default function ProductsTable({ shopSlug, products: initial }: Props) {
  const [products, setProducts] = useState(initial);
  const [query, setQuery] = useState("");
  // Tryb układania kolejności: ta sama kolejność obowiązuje w sklepie ("Polecane").
  const [reorder, setReorder] = useState(false);
  const [orderState, setOrderState] = useState<OrderState>("idle");
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const q = reorder ? "" : query.trim().toLowerCase();
  const visible = q
    ? products.filter((p) => p.name.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q))
    : products;

  async function toggleVisibility(id: string, currentVisible: boolean) {
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, visible: !currentVisible } : p))
    );

    try {
      const res = await fetch(`/api/shops/${shopSlug}/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: !currentVisible }),
      });
      if (!res.ok) {
        // Revert on failure
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, visible: currentVisible } : p))
        );
      }
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, visible: currentVisible } : p))
      );
    }
  }

  async function saveOrder(next: Product[], previous: Product[]) {
    setOrderState("saving");
    try {
      const res = await fetch(`/api/shops/${shopSlug}/products/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((p) => p.id) }),
      });
      if (!res.ok) {
        setProducts(previous);
        setOrderState("error");
        return;
      }
      setOrderState("saved");
      setTimeout(() => setOrderState((s) => (s === "saved" ? "idle" : s)), 2000);
    } catch {
      setProducts(previous);
      setOrderState("error");
    }
  }

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= products.length) return;
    const previous = products;
    const next = [...products];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setProducts(next);
    void saveOrder(next, previous);
  }

  const editHref = (id: string) => `/dashboard/${shopSlug}/products/${id}`;
  const price = (p: Product) => (p.priceOnRequest ? "Na zamówienie" : formatPln(p.price));

  function VisibilityButton({ product }: { product: Product }) {
    return (
      <button
        type="button"
        onClick={() => toggleVisibility(product.id, product.visible)}
        aria-pressed={product.visible}
        className={[
          "flex items-center gap-1.5 h-7 px-2 rounded-md text-[12.5px] font-medium transition-colors w-fit border",
          product.visible
            ? "border-transparent text-[var(--panel-success)] hover:border-[var(--panel-border)]"
            : "border-[var(--panel-border)] text-[var(--panel-ink-muted)] hover:text-[var(--panel-ink)]",
        ].join(" ")}
      >
        {product.visible ? <Eye className="w-3.5 h-3.5" strokeWidth={1.75} /> : <EyeOff className="w-3.5 h-3.5" strokeWidth={1.75} />}
        {product.visible ? "Widoczny" : "Ukryty"}
      </button>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-semibold text-[var(--panel-ink)]" style={{ fontFamily: "var(--font-display)" }}>
            Produkty
          </h1>
          <p className="text-[13px] mt-0.5 text-[var(--panel-ink-muted)]">{products.length} produktów w sklepie</p>
        </div>

        <div className="flex items-center gap-2">
          {products.length > 1 && (
            <button
              type="button"
              onClick={() => {
                setReorder((r) => !r);
                setOrderState("idle");
              }}
              aria-pressed={reorder}
              className={[
                "flex items-center gap-2 h-9 px-3.5 rounded-lg text-[13px] font-semibold border transition-colors",
                reorder
                  ? "border-[var(--panel-primary)] bg-[var(--panel-primary-soft)] text-[var(--panel-primary)]"
                  : "border-[var(--panel-border-strong)] text-[var(--panel-ink)] hover:bg-[var(--panel-surface-hover)]",
              ].join(" ")}
            >
              {reorder ? <Check className="w-4 h-4" strokeWidth={2} /> : <ListOrdered className="w-4 h-4" strokeWidth={1.75} />}
              {reorder ? "Gotowe" : "Ułóż kolejność"}
            </button>
          )}
          <Link
            href={`/dashboard/${shopSlug}/products/new`}
            className="flex items-center gap-2 h-9 px-3.5 rounded-lg text-[13px] font-semibold bg-[var(--panel-accent)] text-white hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            Dodaj produkt
          </Link>
        </div>
      </div>

      {reorder && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-4 py-2.5 mb-4 text-[13px] border border-[var(--panel-border)] bg-[var(--panel-surface-2)] text-[var(--panel-ink-muted)]"
        >
          <span>
            Przeciągnij produkt albo użyj strzałek. Taka kolejność obowiązuje w sklepie w sortowaniu „Polecane”
            i na stronie głównej.
          </span>
          <span
            className={orderState === "error" ? "font-medium text-[var(--panel-danger-ink)]" : "font-medium text-[var(--panel-ink)]"}
          >
            {orderState === "saving" ? "Zapisywanie…" : orderState === "saved" ? "Zapisano" : orderState === "error" ? "Nie udało się zapisać. Spróbuj ponownie." : ""}
          </span>
        </div>
      )}

      {products.length > 0 && !reorder && (
        <label className="flex items-center gap-2 h-9 w-full sm:w-80 px-3 mb-4 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-surface)] focus-within:border-[var(--panel-primary)] transition-colors">
          <Search className="w-4 h-4 text-[var(--panel-ink-faint)]" strokeWidth={1.75} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj po nazwie lub kategorii"
            aria-label="Szukaj produktów"
            className="flex-1 bg-transparent outline-none text-[13.5px] text-[var(--panel-ink)] placeholder:text-[var(--panel-ink-faint)]"
          />
        </label>
      )}

      <div className="rounded-xl overflow-hidden border border-[var(--panel-border)] bg-[var(--panel-surface)]">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Package className="w-10 h-10 text-[var(--panel-ink-faint)]" strokeWidth={1} />
            <p className="text-sm text-[var(--panel-ink-muted)]">Brak produktów. Kliknij „Dodaj produkt”.</p>
          </div>
        ) : visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--panel-ink-muted)]">Nic nie pasuje do „{query.trim()}”.</p>
        ) : (
          <>
            {/* Telefon: karty */}
            <ul className="md:hidden divide-y divide-[var(--panel-border)]">
              {visible.map((product, index) => (
                <li key={product.id} className="flex items-center gap-3 px-4 py-3">
                  <Thumb image={product.image} />
                  <Link href={editHref(product.id)} className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium truncate text-[var(--panel-ink)]">{product.name}</p>
                    <p className="text-[12.5px] mt-0.5 text-[var(--panel-ink-muted)] truncate">
                      {price(product)}
                      {product.category ? ` · ${product.category}` : ""}
                    </p>
                  </Link>
                  {reorder ? (
                    <MoveButtons
                      name={product.name}
                      canUp={index > 0}
                      canDown={index < products.length - 1}
                      onUp={() => move(index, index - 1)}
                      onDown={() => move(index, index + 1)}
                    />
                  ) : (
                    <VisibilityButton product={product} />
                  )}
                </li>
              ))}
            </ul>

            <div role="table" aria-label="Produkty" className="hidden md:block">
              <div
                role="row"
                className={`grid ${reorder ? COLS_REORDER : COLS} gap-4 items-center px-5 h-9 text-[12px] font-medium text-[var(--panel-ink-muted)] border-b border-[var(--panel-border)] bg-[var(--panel-surface-2)]`}
              >
                {reorder && <span role="columnheader">Kolejność</span>}
                <span role="columnheader">Produkt</span>
                <span role="columnheader">Kategoria</span>
                <span role="columnheader" className="text-right">Cena</span>
                <span role="columnheader">Stan</span>
                <span role="columnheader" title="Kompletność danych dla Google i asystentów AI">Gotowość AI</span>
                <span role="columnheader">Sklep</span>
                <span role="columnheader" className="sr-only">Edytuj</span>
              </div>

              {visible.map((product, index) => (
                <div
                  key={product.id}
                  role="row"
                  draggable={reorder}
                  onDragStart={reorder ? (e) => { setDragFrom(index); e.dataTransfer.effectAllowed = "move"; } : undefined}
                  onDragOver={reorder ? (e) => { e.preventDefault(); if (dragOver !== index) setDragOver(index); } : undefined}
                  onDragEnd={reorder ? () => { setDragFrom(null); setDragOver(null); } : undefined}
                  onDrop={
                    reorder
                      ? (e) => {
                          e.preventDefault();
                          if (dragFrom != null) move(dragFrom, index);
                          setDragFrom(null);
                          setDragOver(null);
                        }
                      : undefined
                  }
                  className={[
                    `group grid ${reorder ? COLS_REORDER : COLS} gap-4 items-center px-5 py-2.5 text-[13.5px] border-b last:border-b-0 border-[var(--panel-border)] transition-colors hover:bg-[var(--panel-surface-hover)]`,
                    reorder && dragFrom === index ? "opacity-50" : "",
                    reorder && dragOver === index && dragFrom !== index ? "bg-[var(--panel-primary-soft)]" : "",
                  ].join(" ")}
                >
                  {reorder && (
                    <span className="flex items-center gap-1">
                      <GripVertical className="w-4 h-4 cursor-grab text-[var(--panel-ink-faint)]" strokeWidth={1.75} aria-hidden />
                      <MoveButtons
                        name={product.name}
                        canUp={index > 0}
                        canDown={index < products.length - 1}
                        onUp={() => move(index, index - 1)}
                        onDown={() => move(index, index + 1)}
                      />
                    </span>
                  )}
                  <Link href={editHref(product.id)} className="flex items-center gap-3 min-w-0">
                    <Thumb image={product.image} />
                    <span className="min-w-0 flex flex-col gap-1">
                      <span className="font-medium truncate text-[var(--panel-ink)] group-hover:underline underline-offset-2">
                        {product.name}
                      </span>
                      {(product.badge || (product.type && product.type !== "physical")) && (
                        <span className="flex items-center gap-1.5">
                          {product.badge && (
                            <span className={`${CHIP} border-[color-mix(in_oklch,var(--panel-accent)_35%,transparent)] text-[var(--panel-accent)]`}>
                              {product.badge}
                            </span>
                          )}
                          <TypeBadge type={product.type} />
                        </span>
                      )}
                    </span>
                  </Link>

                  <span className="truncate text-[var(--panel-ink-muted)]">{product.category || "—"}</span>

                  <span className="text-right font-semibold tabular-nums text-[var(--panel-ink)]">{price(product)}</span>

                  <span className="text-[13px]"><Stock stock={product.stock} /></span>

                  <span className="text-[13px]"><AiScore score={product.aiScore} gap={product.aiGap} /></span>

                  <VisibilityButton product={product} />

                  <Link
                    href={editHref(product.id)}
                    aria-label={`Edytuj ${product.name}`}
                    className="flex items-center justify-center w-8 h-8 rounded-md transition-colors text-[var(--panel-ink-faint)] hover:bg-[var(--panel-surface-2)] hover:text-[var(--panel-ink)]"
                  >
                    <Pencil className="w-4 h-4" strokeWidth={1.75} />
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
