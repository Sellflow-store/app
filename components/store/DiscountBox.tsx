"use client";

import { useEffect, useRef, useState } from "react";
import { Tag, X, Mail } from "lucide-react";
import { useCartDiscount, type DiscountSource } from "@/lib/cart";
import { rejectionBucket, trackCheckoutEvent } from "@/lib/checkout-events";
import type { CartOffers } from "@/types/shop";

interface Props {
  shopSlug: string;
  /** Promocje sklepu (Rabaty → „Pokazuj promocje w koszyku”); null = wyłączone. */
  offers: CartOffers | null;
  placement: "cart" | "checkout";
}

/**
 * Kod rabatowy w koszyku i przy zamówieniu.
 *
 * Otwarte pole „Kod rabatowy” mówi klientce bez kodu, że inni płacą mniej, i
 * wysyła ją do Google po kupony (które nie działają). Dlatego:
 *  - pole jest zwinięte za linkiem „Mam kod rabatowy”: kto ma kod, rozwinie,
 *    kto nie ma, nie dostaje sygnału, że coś traci;
 *  - kod z linku (?kod=…, DiscountFromLink) albo wpisany raz jest zapamiętany
 *    przy koszyku i widoczny od razu jako zastosowany;
 *  - gdy sprzedawca włączy oferty, zamiast pustego pola pokazujemy promocję,
 *    którą sklep i tak daje (kod z paska, rabat za newsletter): odpowiedź na
 *    „czy jest jakiś kod?” jest tam, gdzie klientka jej szuka.
 */
export default function DiscountBox({ shopSlug, offers, placement }: Props) {
  const { discount, setDiscount } = useCartDiscount(shopSlug);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const [nlOpen, setNlOpen] = useState(false);
  const [nlEmail, setNlEmail] = useState("");
  const [nlState, setNlState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  // A remembered code can expire or run out between visits: re-check it once
  // per mount and drop it with an explanation instead of failing at "Zamawiam".
  const revalidated = useRef(false);
  useEffect(() => {
    if (!discount || revalidated.current) return;
    revalidated.current = true;
    const code = discount.code;
    fetch(`/api/shops/${shopSlug}/discounts/validate?code=${encodeURIComponent(code)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { valid?: boolean; reason?: string; discountPercent?: number } | null) => {
        if (!data) return;
        if (!data.valid) {
          setDiscount(null);
          setNotice(`Kod ${code} przestał działać: ${data.reason ?? "jest nieważny"}`);
        } else if (typeof data.discountPercent === "number" && data.discountPercent !== discount.percent) {
          setDiscount({ ...discount, percent: data.discountPercent });
        }
      })
      .catch(() => {});
  }, [discount, setDiscount, shopSlug]);

  async function apply(raw: string, source: DiscountSource) {
    const code = raw.trim().toUpperCase();
    if (!code) return;
    setChecking(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/discounts/validate?code=${encodeURIComponent(code)}`);
      const data = (await res.json()) as { valid?: boolean; code?: string; discountPercent?: number; reason?: string; error?: string };
      if (data.valid && data.code && typeof data.discountPercent === "number") {
        setDiscount({ code: data.code, percent: data.discountPercent, source });
        revalidated.current = true;
        setInput("");
        setExpanded(false);
        trackCheckoutEvent(shopSlug, "code_applied", source);
      } else {
        const reason = data.reason ?? data.error ?? "Niepoprawny kod.";
        setError(reason);
        trackCheckoutEvent(shopSlug, "code_rejected", rejectionBucket(data.reason));
      }
    } catch {
      setError("Nie udało się sprawdzić kodu. Spróbuj ponownie.");
    } finally {
      setChecking(false);
    }
  }

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setNlState("sending");
    try {
      const res = await fetch(`/api/shops/${shopSlug}/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nlEmail }),
      });
      setNlState(res.ok ? "sent" : "error");
    } catch {
      setNlState("error");
    }
  }

  if (discount) {
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
          <Tag className="w-3.5 h-3.5" strokeWidth={1.5} />
          {discount.code} (−{discount.percent}%)
          <span className="font-light text-ink-2">zastosowany</span>
        </span>
        <button
          type="button"
          onClick={() => {
            setDiscount(null);
            setNotice(null);
          }}
          aria-label={`Usuń kod ${discount.code}`}
          className="p-1 text-ink-2/60 hover:text-ink transition-colors"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </div>
    );
  }

  const publicCode = offers?.publicCode ?? null;
  const newsletter = offers?.newsletter ?? null;

  return (
    <div className="space-y-2.5">
      {notice && (
        <p className="text-[11px] text-ink-2" role="status">
          {notice}
        </p>
      )}

      {publicCode && (
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-ink-2">
            Promocja w sklepie: <strong className="text-ink font-semibold">{publicCode.code}</strong> −{publicCode.percent}%
          </span>
          <button
            type="button"
            onClick={() => apply(publicCode.code, "offer_public")}
            disabled={checking}
            className="font-semibold text-ink underline underline-offset-2 hover:opacity-70 transition-opacity disabled:opacity-50 shrink-0"
          >
            Zastosuj
          </button>
        </div>
      )}

      {newsletter && !publicCode && (
        <div className="text-xs">
          {nlState === "sent" ? (
            <p className="text-ink-2" role="status">
              Wysłaliśmy link na {nlEmail}. Po potwierdzeniu kod −{newsletter.percent}% trafi do koszyka
              automatycznie, a koszyk poczeka na Ciebie.
            </p>
          ) : !nlOpen ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-2">−{newsletter.percent}% na to zamówienie za zapis do newslettera</span>
              <button
                type="button"
                onClick={() => setNlOpen(true)}
                className="font-semibold text-ink underline underline-offset-2 hover:opacity-70 transition-opacity shrink-0"
              >
                Odbierz
              </button>
            </div>
          ) : (
            <form onSubmit={subscribe} className="flex gap-2">
              <input
                type="email"
                required
                value={nlEmail}
                onChange={(e) => setNlEmail(e.target.value)}
                placeholder="Twój e-mail"
                aria-label="Adres e-mail do newslettera"
                className="flex-1 min-w-0 border border-rule rounded-input px-3 py-2 text-xs text-ink bg-paper placeholder:text-ink-2/50 outline-none focus:border-ink transition-colors"
              />
              <button
                type="submit"
                disabled={nlState === "sending"}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-input border border-rule text-ink hover:border-ink transition-colors disabled:opacity-50 shrink-0"
              >
                <Mail className="w-3.5 h-3.5" strokeWidth={1.5} />
                {nlState === "sending" ? "…" : "Wyślij"}
              </button>
            </form>
          )}
          {nlState === "error" && (
            <p className="text-[11px] text-red-600 mt-1.5" role="alert">
              Nie udało się zapisać. Sprawdź adres i spróbuj ponownie.
            </p>
          )}
        </div>
      )}

      {error && !expanded && (
        <p className="text-[11px] text-red-600" role="alert">
          {error}
        </p>
      )}

      {!expanded ? (
        <button
          type="button"
          onClick={() => {
            setExpanded(true);
            trackCheckoutEvent(shopSlug, "code_expand", placement);
          }}
          className="text-xs text-ink-2 underline underline-offset-2 hover:text-ink transition-colors"
        >
          Mam kod rabatowy
        </button>
      ) : (
        <div>
          <div className="flex gap-2">
            <input
              value={input}
              autoFocus
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  apply(input, "manual");
                }
              }}
              placeholder="Kod rabatowy"
              aria-label="Kod rabatowy"
              className="flex-1 min-w-0 border border-rule rounded-input px-3 py-2 text-xs text-ink bg-paper placeholder:text-ink-2/50 outline-none focus:border-ink transition-colors uppercase"
            />
            <button
              type="button"
              onClick={() => apply(input, "manual")}
              disabled={checking || !input.trim()}
              className="text-xs font-semibold px-3.5 py-2 rounded-input border border-rule text-ink hover:border-ink transition-colors disabled:opacity-50 shrink-0"
            >
              {checking ? "…" : "Zastosuj"}
            </button>
          </div>
          {error && (
            <p className="text-[11px] text-red-600 mt-1.5" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
