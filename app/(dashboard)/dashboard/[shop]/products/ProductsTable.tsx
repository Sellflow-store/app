"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Eye, EyeOff, Package } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  visible: boolean;
  badge?: string;
  image?: string;
}

function formatPrice(price: string): string {
  const n = parseFloat(price);
  if (isNaN(n)) return price;
  return `${n.toFixed(2).replace(".", ",")} zł`;
}

interface Props {
  shopSlug: string;
  products: Product[];
}

export default function ProductsTable({ shopSlug, products: initial }: Props) {
  const [products, setProducts] = useState(initial);

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

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
          >
            Produkty
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
            {products.length} produktów w sklepie
          </p>
        </div>

        <Link
          href={`/dashboard/${shopSlug}/products/new`}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full transition-all"
          style={{ background: "oklch(56% 0.30 335)", color: "#fff" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "oklch(46% 0.25 333)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "oklch(56% 0.30 335)")}
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Dodaj produkt
        </Link>
      </div>

      {/* Table card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid oklch(90% 0 0)", background: "#fff" }}
      >
        {/* Header row */}
        <div
          className="grid text-[11px] font-semibold tracking-wide uppercase px-5 py-3"
          style={{
            gridTemplateColumns: "2.5rem 2fr 1fr 1fr 1fr 5rem",
            color: "oklch(50% 0 0)",
            borderBottom: "1px solid oklch(92% 0 0)",
            background: "oklch(98% 0 0)",
          }}
        >
          <span />
          <span>Produkt</span>
          <span>Kategoria</span>
          <span>Cena</span>
          <span>Widoczność</span>
          <span />
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Package className="w-10 h-10" style={{ color: "oklch(80% 0 0)" }} strokeWidth={1} />
            <p className="text-sm" style={{ color: "oklch(55% 0 0)" }}>
              Brak produktów — kliknij &ldquo;Dodaj produkt&rdquo;
            </p>
          </div>
        ) : (
          products.map((product, i) => (
            <div
              key={product.id}
              className="grid items-center px-5 py-3 transition-colors"
              style={{
                gridTemplateColumns: "2.5rem 2fr 1fr 1fr 1fr 5rem",
                borderBottom: i < products.length - 1 ? "1px solid oklch(94% 0 0)" : "none",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "oklch(98.5% 0.003 250)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "")}
            >
              {/* Thumbnail */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "oklch(95% 0.008 250)" }}
              >
                {product.image ? (
                  <img src={product.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <Package className="w-4 h-4" style={{ color: "oklch(65% 0 0)" }} strokeWidth={1.5} />
                )}
              </div>

              {/* Name + badge */}
              <div className="min-w-0 pl-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold truncate" style={{ color: "oklch(11% 0.10 275)" }}>
                    {product.name}
                  </p>
                  {product.badge && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: "oklch(56% 0.30 335 / 0.12)", color: "oklch(46% 0.25 333)" }}
                    >
                      {product.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: "oklch(60% 0 0)" }}>
                  ID: {product.id.slice(0, 8)}…
                </p>
              </div>

              {/* Category */}
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "oklch(95% 0 0)", color: "oklch(45% 0 0)" }}
              >
                {product.category || "—"}
              </span>

              {/* Price */}
              <span className="text-xs font-semibold" style={{ color: "oklch(11% 0.10 275)" }}>
                {formatPrice(product.price)}
              </span>

              {/* Visibility toggle */}
              <button
                onClick={() => toggleVisibility(product.id, product.visible)}
                className="flex items-center gap-1.5 text-xs font-medium transition-colors w-fit"
                style={{ color: product.visible ? "oklch(40% 0.18 145)" : "oklch(55% 0 0)" }}
              >
                {product.visible ? (
                  <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" strokeWidth={1.5} />
                )}
                {product.visible ? "Widoczny" : "Ukryty"}
              </button>

              {/* Actions */}
              <div className="flex justify-end">
                <Link
                  href={`/dashboard/${shopSlug}/products/${product.id}`}
                  aria-label={`Edytuj ${product.name}`}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: "oklch(55% 0 0)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "oklch(94% 0 0)";
                    (e.currentTarget as HTMLElement).style.color = "oklch(20% 0 0)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "";
                    (e.currentTarget as HTMLElement).style.color = "oklch(55% 0 0)";
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
