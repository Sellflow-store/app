"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, ClipboardList, FileText } from "lucide-react";

interface ProductHit { id: string; name: string; category: string | null }
interface OrderHit { id: string; orderNumber: string; customerName: string | null; total: string }

// Static panel pages — searched client-side, no round-trip.
const PAGES: { label: string; slug: string }[] = [
  { label: "Zamówienia", slug: "orders" },
  { label: "Klienci", slug: "customers" },
  { label: "Statystyki", slug: "stats" },
  { label: "Produkty", slug: "products" },
  { label: "Kategorie", slug: "categories" },
  { label: "Płatności i VAT", slug: "payments" },
  { label: "Dostawa", slug: "delivery" },
  { label: "Kody rabatowe", slug: "discounts" },
  { label: "Newsletter", slug: "newsletter" },
  { label: "Logo i kolorystyka", slug: "branding" },
  { label: "Strona główna", slug: "home" },
  { label: "O nas", slug: "about" },
  { label: "FAQ", slug: "faq" },
  { label: "Menu nawigacji", slug: "menu" },
  { label: "Dokumenty prawne", slug: "legal" },
  { label: "Ustawienia panelu", slug: "settings" },
];

const pln = (v: string) => `${(parseFloat(v) || 0).toFixed(2).replace(".", ",")} zł`;

export default function GlobalSearch({ shopSlug }: { shopSlug: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<ProductHit[]>([]);
  const [orders, setOrders] = useState<OrderHit[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const base = `/dashboard/${shopSlug}`;
  const q = query.trim().toLowerCase();
  const pageHits = q.length >= 1 ? PAGES.filter((p) => p.label.toLowerCase().includes(q)).slice(0, 5) : [];

  // Debounced product/order lookup
  useEffect(() => {
    if (q.length < 2) {
      setProducts([]);
      setOrders([]);
      return;
    }
    const controller = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/shops/${shopSlug}/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        setProducts(data.products ?? []);
        setOrders(data.orders ?? []);
      } catch {
        // aborted / network — ignore
      }
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(t);
    };
  }, [query, q, shopSlug]);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  const hasResults = pageHits.length > 0 || products.length > 0 || orders.length > 0;
  const showDropdown = open && q.length >= 1;

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
        strokeWidth={1.5}
        style={{ color: "oklch(55% 0 0)" }}
      />
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={(e) => { setOpen(true); (e.target.style.borderColor = "oklch(55% 0 0)"); }}
        onBlur={(e) => (e.target.style.borderColor = "oklch(88% 0 0)")}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        placeholder="Szukaj stron, produktów, zamówień…"
        className="w-full pl-9 pr-4 py-2 rounded-lg text-xs focus:outline-none transition-colors"
        style={{
          border: "1px solid oklch(88% 0 0)",
          background: "oklch(97% 0 0)",
          color: "oklch(10% 0 0)",
          fontFamily: "var(--font-body)",
        }}
      />

      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 rounded-xl py-2 z-50 max-h-[70vh] overflow-y-auto"
          style={{ background: "#fff", border: "1px solid oklch(90% 0 0)", boxShadow: "0 8px 28px oklch(0% 0 0 / 0.10)" }}
        >
          {!hasResults && (
            <p className="px-4 py-3 text-xs" style={{ color: "oklch(55% 0 0)" }}>
              Brak wyników dla „{query.trim()}".
            </p>
          )}

          {pageHits.length > 0 && (
            <Group label="Strony">
              {pageHits.map((p) => (
                <Row key={p.slug} icon={FileText} onClick={() => go(`${base}/${p.slug}`)}>
                  {p.label}
                </Row>
              ))}
            </Group>
          )}

          {products.length > 0 && (
            <Group label="Produkty">
              {products.map((p) => (
                <Row key={p.id} icon={Package} onClick={() => go(`${base}/products/${p.id}`)}>
                  <span className="truncate">{p.name}</span>
                  {p.category && (
                    <span className="ml-auto text-[10px] shrink-0" style={{ color: "oklch(60% 0 0)" }}>
                      {p.category}
                    </span>
                  )}
                </Row>
              ))}
            </Group>
          )}

          {orders.length > 0 && (
            <Group label="Zamówienia">
              {orders.map((o) => (
                <Row key={o.id} icon={ClipboardList} onClick={() => go(`${base}/orders/${o.id}`)}>
                  <span className="font-medium">{o.orderNumber}</span>
                  <span className="truncate" style={{ color: "oklch(55% 0 0)" }}>
                    {o.customerName ?? ""}
                  </span>
                  <span className="ml-auto text-[10px] shrink-0" style={{ color: "oklch(45% 0 0)" }}>
                    {pln(o.total)}
                  </span>
                </Row>
              ))}
            </Group>
          )}
        </div>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1 last:mb-0">
      <p className="px-4 pt-1.5 pb-1 text-[9px] font-semibold uppercase tracking-[0.16em]" style={{ color: "oklch(55% 0 0)" }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function Row({
  icon: Icon, onClick, children,
}: { icon: typeof Package; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-left transition-colors"
      style={{ color: "oklch(20% 0 0)" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "oklch(97% 0 0)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} style={{ color: "oklch(55% 0 0)" }} />
      {children}
    </button>
  );
}
