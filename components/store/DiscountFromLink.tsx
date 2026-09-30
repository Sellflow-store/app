"use client";

import { useEffect, useState } from "react";
import { Tag, X } from "lucide-react";
import { useCartDiscount } from "@/lib/cart";
import { rejectionBucket, trackCheckoutEvent } from "@/lib/checkout-events";

const PARAM = "kod";

/**
 * Kod z linku: ?kod=WITAJ10 na dowolnej stronie sklepu (mail z nagrodą za
 * newsletter, post na Instagramie, link od influencera) sam trafia do
 * koszyka. Klientka nie musi go przepisywać ani szukać, więc pole na kod w
 * koszyku może być ciche. Parametr znika z paska adresu, żeby link do
 * produktu udostępniony dalej nie niósł kodu.
 */
export default function DiscountFromLink({ shopSlug }: { shopSlug: string }) {
  const { setDiscount } = useCartDiscount(shopSlug);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get(PARAM)?.trim().toUpperCase();
    if (!code) return;
    url.searchParams.delete(PARAM);
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);

    let cancelled = false;
    fetch(`/api/shops/${shopSlug}/discounts/validate?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((data: { valid?: boolean; code?: string; discountPercent?: number; reason?: string }) => {
        if (cancelled) return;
        if (data.valid && data.code && typeof data.discountPercent === "number") {
          setDiscount({ code: data.code, percent: data.discountPercent, source: "link" });
          trackCheckoutEvent(shopSlug, "code_applied", "link");
          setToast({ ok: true, text: `Kod ${data.code} (−${data.discountPercent}%) czeka w koszyku.` });
        } else {
          trackCheckoutEvent(shopSlug, "code_rejected", rejectionBucket(data.reason));
          setToast({ ok: false, text: `Kod ${code} nie działa: ${data.reason ?? "jest nieważny"}` });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [shopSlug, setDiscount]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(t);
  }, [toast]);

  if (!toast) return null;
  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2.5 bg-ink text-on-ink text-xs px-4 py-3 rounded-card shadow-xl max-w-[calc(100vw-2rem)]"
    >
      <Tag className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
      <span className={toast.ok ? "" : "opacity-90"}>{toast.text}</span>
      <button onClick={() => setToast(null)} aria-label="Zamknij" className="p-0.5 opacity-70 hover:opacity-100">
        <X className="w-3.5 h-3.5" strokeWidth={1.5} />
      </button>
    </div>
  );
}
