"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Tag, Trash2, Link2, Check } from "lucide-react";

export interface DiscountRow {
  id: string;
  code: string;
  discountPercent: number;
  active: boolean;
  expiresAt: string | null; // YYYY-MM-DD
  maxUses: number | null;
  usesCount: number;
}

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

interface Props {
  shopSlug: string;
  initialCodes: DiscountRow[];
  /** Public shop address, for "?kod=" links that apply a code by themselves. */
  shopUrl: string;
  initialShowOffers: boolean;
}

export default function DiscountsManager({ shopSlug, initialCodes, shopUrl, initialShowOffers }: Props) {
  const [showOffers, setShowOffers] = useState(initialShowOffers);
  const [offersSaving, setOffersSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function toggleOffers() {
    const next = !showOffers;
    setShowOffers(next);
    setOffersSaving(true);
    const res = await fetch(`/api/shops/${shopSlug}/config`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "cart", value: { showOffers: next } }),
    }).catch(() => null);
    if (!res?.ok) setShowOffers(!next);
    setOffersSaving(false);
  }

  function copyLink(row: DiscountRow) {
    navigator.clipboard?.writeText(`${shopUrl}/?kod=${encodeURIComponent(row.code)}`).then(() => {
      setCopiedId(row.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  const router = useRouter();
  const [codes, setCodes] = useState(initialCodes);
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("10");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/discounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountPercent: parseInt(percent) || 0,
          expiresAt: expiresAt || null,
          maxUses: maxUses ? parseInt(maxUses) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Nie udało się dodać kodu.");
        return;
      }
      setCodes((prev) => [
        {
          id: data.id,
          code: data.code,
          discountPercent: data.discountPercent,
          active: data.active,
          expiresAt: data.expiresAt ? String(data.expiresAt).slice(0, 10) : null,
          maxUses: data.maxUses,
          usesCount: data.usesCount,
        },
        ...prev,
      ]);
      setCode("");
      setPercent("10");
      setExpiresAt("");
      setMaxUses("");
      router.refresh();
    } catch {
      setError("Nie udało się dodać kodu.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(row: DiscountRow) {
    setCodes((prev) => prev.map((c) => (c.id === row.id ? { ...c, active: !row.active } : c)));
    const res = await fetch(`/api/shops/${shopSlug}/discounts/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !row.active }),
    }).catch(() => null);
    if (!res?.ok) {
      setCodes((prev) => prev.map((c) => (c.id === row.id ? { ...c, active: row.active } : c)));
    }
  }

  async function handleDelete(row: DiscountRow) {
    if (!confirm(`Usunąć kod „${row.code}”?`)) return;
    const res = await fetch(`/api/shops/${shopSlug}/discounts/${row.id}`, {
      method: "DELETE",
    }).catch(() => null);
    if (res?.ok) setCodes((prev) => prev.filter((c) => c.id !== row.id));
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
        >
          Kody rabatowe
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
          Pole na kod jest w koszyku zwinięte pod „Mam kod rabatowy”, żeby nie odsyłać klientek bez kodu
          do szukania kuponów. Najwygodniej dawać kod w linku (przycisk przy kodzie): sam trafia do koszyka.
        </p>
      </div>

      {/* Offers in cart */}
      <div
        className="rounded-2xl p-5 mb-6 flex items-start justify-between gap-6"
        style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}
      >
        <div>
          <h2
            className="text-sm font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
          >
            Pokazuj promocje w koszyku
          </h2>
          <p className="text-xs mt-1 max-w-xl" style={{ color: "oklch(50% 0 0)" }}>
            Zamiast pustego pola koszyk podpowie promocję, którą i tak dajesz: kod z paska na górze strony
            (jednym kliknięciem) albo rabat za zapis do newslettera. Mniej porzuconych koszyków, ale rabat
            weźmie też część osób, które kupiłyby bez niego. Przy markach premium zwykle lepiej zostawić
            wyłączone i dawać kody w linkach.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleOffers}
          disabled={offersSaving}
          role="switch"
          aria-checked={showOffers}
          aria-label="Pokazuj promocje w koszyku"
          className="relative w-9 h-5 rounded-full transition-all shrink-0 mt-0.5 disabled:opacity-60"
          style={{ background: showOffers ? "oklch(56% 0.30 335)" : "oklch(82% 0 0)" }}
        >
          <span
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
            style={{ left: showOffers ? "1.125rem" : "0.125rem" }}
          />
        </button>
      </div>

      {/* Create form */}
      <form
        onSubmit={handleCreate}
        className="rounded-2xl p-5 mb-6"
        style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}
      >
        <h2
          className="text-sm font-semibold mb-4"
          style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
        >
          Nowy kod
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-[2fr_1fr_1.2fr_1fr_auto] gap-3 items-end">
          <div>
            <label htmlFor="dc-code" className="block text-[11px] font-semibold mb-1" style={{ color: "oklch(40% 0 0)" }}>
              Kod
            </label>
            <input
              id="dc-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="np. LATO10"
              style={{ ...inputStyle, textTransform: "uppercase", fontFamily: "var(--font-mono, monospace)" }}
              {...focusProps}
            />
          </div>
          <div>
            <label htmlFor="dc-pct" className="block text-[11px] font-semibold mb-1" style={{ color: "oklch(40% 0 0)" }}>
              Rabat (%)
            </label>
            <input
              id="dc-pct"
              required
              type="number"
              min={1}
              max={90}
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              style={inputStyle}
              {...focusProps}
            />
          </div>
          <div>
            <label htmlFor="dc-exp" className="block text-[11px] font-semibold mb-1" style={{ color: "oklch(40% 0 0)" }}>
              Wygasa (opcjonalnie)
            </label>
            <input
              id="dc-exp"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              style={inputStyle}
              {...focusProps}
            />
          </div>
          <div>
            <label htmlFor="dc-max" className="block text-[11px] font-semibold mb-1" style={{ color: "oklch(40% 0 0)" }}>
              Limit użyć
            </label>
            <input
              id="dc-max"
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="bez limitu"
              style={inputStyle}
              {...focusProps}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-full transition-all disabled:opacity-60 h-fit"
            style={{ background: "oklch(56% 0.30 335)", color: "#fff" }}
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            Dodaj
          </button>
        </div>
        {error && (
          <p className="text-xs font-medium mt-3" style={{ color: "oklch(45% 0.18 20)" }} role="alert">
            {error}
          </p>
        )}
      </form>

      {/* List */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid oklch(90% 0 0)", background: "#fff" }}
      >
        {codes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Tag className="w-10 h-10" style={{ color: "oklch(80% 0 0)" }} strokeWidth={1} />
            <p className="text-sm" style={{ color: "oklch(55% 0 0)" }}>
              Brak kodów — dodaj pierwszy powyżej
            </p>
          </div>
        ) : (
          <>
            <div
              className="grid text-[11px] font-semibold tracking-wide uppercase px-5 py-3"
              style={{
                gridTemplateColumns: "1.5fr 0.8fr 1fr 1fr 1fr 6rem",
                color: "oklch(50% 0 0)",
                borderBottom: "1px solid oklch(92% 0 0)",
                background: "oklch(98% 0 0)",
              }}
            >
              <span>Kod</span>
              <span>Rabat</span>
              <span>Użycia</span>
              <span>Wygasa</span>
              <span>Status</span>
              <span />
            </div>
            {codes.map((row, i) => (
              <div
                key={row.id}
                className="grid items-center px-5 py-3"
                style={{
                  gridTemplateColumns: "1.5fr 0.8fr 1fr 1fr 1fr 6rem",
                  borderBottom: i < codes.length - 1 ? "1px solid oklch(94% 0 0)" : "none",
                  opacity: row.active ? 1 : 0.55,
                }}
              >
                <span className="text-xs font-bold tracking-wide" style={{ color: "oklch(11% 0.10 275)", fontFamily: "var(--font-mono, monospace)" }}>
                  {row.code}
                </span>
                <span className="text-xs font-semibold tabular-nums" style={{ color: "oklch(25% 0 0)" }}>
                  −{row.discountPercent}%
                </span>
                <span className="text-xs tabular-nums" style={{ color: "oklch(40% 0 0)" }}>
                  {row.usesCount}
                  {row.maxUses ? ` / ${row.maxUses}` : ""}
                </span>
                <span className="text-xs" style={{ color: "oklch(50% 0 0)" }}>
                  {row.expiresAt ?? "—"}
                </span>
                <button
                  onClick={() => toggleActive(row)}
                  className="text-xs font-medium w-fit px-2 py-0.5 rounded-full transition-all"
                  style={
                    row.active
                      ? { background: "oklch(93% 0.08 145)", color: "oklch(30% 0.16 145)" }
                      : { background: "oklch(95% 0 0)", color: "oklch(45% 0 0)" }
                  }
                >
                  {row.active ? "Aktywny" : "Wyłączony"}
                </button>
                <span className="flex items-center gap-1 justify-self-end">
                  <button
                    onClick={() => copyLink(row)}
                    aria-label={`Kopiuj link z kodem ${row.code}`}
                    title="Kopiuj link, który sam doda kod do koszyka"
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: "oklch(40% 0 0)" }}
                  >
                    {copiedId === row.id ? (
                      <Check className="w-3.5 h-3.5" strokeWidth={2} style={{ color: "oklch(52% 0.16 145)" }} />
                    ) : (
                      <Link2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(row)}
                    aria-label={`Usuń kod ${row.code}`}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: "oklch(50% 0.15 20)" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
