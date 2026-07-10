"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Power, Trash2, RotateCcw } from "lucide-react";
import { PLANS, PLAN_IDS, type PlanId } from "@/lib/plans";

interface Props {
  slug: string;
  shopName: string;
  suspended: boolean;
  deleted: boolean;
  plan: string;
}

export default function ShopActions({ slug, shopName, suspended, deleted, plan }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: { suspended?: boolean; plan?: string; restore?: boolean }): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/ops/shops/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError("Operacja nie powiodła się.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Operacja nie powiodła się.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleActive() {
    if (
      !suspended &&
      !confirm(`Zawiesić sklep „${shopName}”? Klienci zobaczą stronę „nie znaleziono”, panel merchanta pozostanie dostępny.`)
    ) {
      return;
    }
    await patch({ suspended: !suspended });
  }

  async function handlePlanChange(next: string) {
    if (next === plan) return;
    await patch({ plan: next });
  }

  async function handleDelete() {
    const typed = prompt(
      `Usunąć sklep „${shopName}”? Storefront zniknie z sieci, ale slug (subdomena) pozostaje zarezerwowany, a produkty, zamówienia i faktury są zachowane. Sklep można później przywrócić.\n\nPrzepisz slug sklepu, aby potwierdzić:`
    );
    if (typed !== slug) {
      if (typed !== null) alert("Slug się nie zgadza — usunięcie przerwane.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/ops/shops/${slug}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Nie udało się usunąć sklepu.");
        return;
      }
      router.refresh();
    } catch {
      setError("Nie udało się usunąć sklepu.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore() {
    if (!confirm(`Przywrócić sklep „${shopName}”? Storefront wróci do sieci pod tym samym adresem.`)) {
      return;
    }
    await patch({ restore: true });
  }

  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--brand-paper)", border: "1px solid var(--brand-rule)" }}
    >
      <header
        className="px-5 py-3"
        style={{ borderBottom: "1px solid var(--brand-rule)", background: "var(--brand-paper-3)" }}
      >
        <h2
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
        >
          Akcje operatora
        </h2>
      </header>

      <div className="px-5 py-4 space-y-4">
        {error && (
          <p className="text-xs font-medium" style={{ color: "oklch(45% 0.18 20)" }} role="alert">
            {error}
          </p>
        )}

        {/* Plan */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--brand-ink)" }}>
              Plan właściciela
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--brand-ink-2)" }}>
              Limit produktów: free {PLANS.free.maxProducts} · starter {PLANS.starter.maxProducts} · pro bez limitu
            </p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            {PLAN_IDS.map((p: PlanId) => (
              <button
                key={p}
                onClick={() => handlePlanChange(p)}
                disabled={busy}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
                style={
                  plan === p
                    ? { background: "var(--brand-ink)", color: "var(--brand-paper)" }
                    : { border: "1.5px solid var(--brand-rule)", color: "var(--brand-ink-2)" }
                }
              >
                {PLANS[p].label}
              </button>
            ))}
          </div>
        </div>

        {/* Suspend / activate */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--brand-ink)" }}>
              {suspended ? "Sklep zawieszony" : "Sklep aktywny"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--brand-ink-2)" }}>
              {suspended
                ? "Storefront zwraca 404, zamówień nie można składać."
                : "Storefront widoczny, zamówienia przyjmowane."}
            </p>
          </div>
          <button
            onClick={handleToggleActive}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full transition-all disabled:opacity-50 shrink-0"
            style={
              suspended
                ? { background: "var(--brand-success, oklch(52% 0.2 158))", color: "#fff" }
                : { color: "oklch(45% 0.18 20)", border: "1.5px solid oklch(50% 0.20 20 / 0.35)" }
            }
          >
            <Power className="w-3.5 h-3.5" strokeWidth={1.75} />
            {busy ? "…" : suspended ? "Aktywuj sklep" : "Zawieś sklep"}
          </button>
        </div>

        {/* Delete / restore */}
        <div
          className="flex items-center justify-between gap-4 pt-4"
          style={{ borderTop: "1px solid var(--brand-rule)" }}
        >
          {deleted ? (
            <>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--brand-ink)" }}>
                  Sklep usunięty
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--brand-ink-2)" }}>
                  Storefront offline, slug zarezerwowany, dane zachowane. Można przywrócić.
                </p>
              </div>
              <button
                onClick={handleRestore}
                disabled={busy}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full transition-all disabled:opacity-50 shrink-0"
                style={{ background: "var(--brand-success, oklch(52% 0.2 158))", color: "#fff" }}
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
                {busy ? "…" : "Przywróć sklep"}
              </button>
            </>
          ) : (
            <>
              <div>
                <p className="text-sm font-medium" style={{ color: "oklch(45% 0.18 20)" }}>
                  Usuń sklep
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--brand-ink-2)" }}>
                  Zdejmuje storefront z sieci. Slug pozostaje zarezerwowany, dane zachowane. Odwracalne.
                </p>
              </div>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full transition-all disabled:opacity-50 shrink-0"
                style={{ color: "oklch(45% 0.18 20)", border: "1.5px solid oklch(50% 0.20 20 / 0.35)" }}
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                Usuń sklep
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
