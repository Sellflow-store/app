"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { PopupConfig } from "@/types/shop";

interface Props {
  shopSlug: string;
  config: PopupConfig;
}

/** Klucz per sklep — zamknięcie/zapis wycisza popup na tej przeglądarce. */
const dismissKey = (slug: string) => `sf-popup-${slug}`;

export default function NewsletterPopup({ shopSlug, config }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  useEffect(() => {
    if (!config.enabled) return;
    try {
      if (window.localStorage.getItem(dismissKey(shopSlug))) return;
    } catch {
      // private mode — pokaż mimo wszystko
    }
    const t = window.setTimeout(
      () => setOpen(true),
      Math.max(0, config.delaySeconds) * 1000
    );
    return () => window.clearTimeout(t);
  }, [config.enabled, config.delaySeconds, shopSlug]);

  if (!open) return null;

  function dismiss() {
    setOpen(false);
    try {
      window.localStorage.setItem(dismissKey(shopSlug), "1");
    } catch {
      // ignore
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch(`/api/shops/${shopSlug}/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setState("error");
        return;
      }
      setState("done");
      try {
        window.localStorage.setItem(dismissKey(shopSlug), "1");
      } catch {
        // ignore
      }
    } catch {
      setState("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/40"
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label={config.title}
    >
      <div
        className="relative w-full max-w-md bg-paper rounded-card p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="Zamknij"
          className="absolute top-4 right-4 p-1.5 text-ink-2 hover:text-ink transition-colors"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>

        {state === "done" ? (
          <div className="text-center py-4">
            <h2 className="text-xl font-bold tracking-tight text-ink mb-2">
              {config.successTitle || "Dziękujemy!"}
            </h2>
            <p className="text-sm text-ink-2 font-light">{config.successText}</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold tracking-tight text-ink mb-2">{config.title}</h2>
            <p className="text-sm text-ink-2 font-light mb-5">{config.description}</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={config.placeholder || "Twój adres e-mail"}
                className="w-full border border-rule rounded-input px-4 py-3 text-sm text-ink bg-paper placeholder:text-ink-2/50 outline-none focus:border-ink transition-colors"
              />
              <button
                type="submit"
                disabled={state === "sending"}
                className="w-full bg-accent-brand text-on-accent text-sm font-semibold px-6 py-3.5 rounded-button hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {state === "sending" ? "Zapisywanie…" : config.buttonLabel || "Zapisz się"}
              </button>
              {state === "error" && (
                <p className="text-xs text-red-600 text-center" role="alert">
                  Nie udało się zapisać. Sprawdź adres i spróbuj ponownie.
                </p>
              )}
              {config.disclaimer && (
                <p className="text-[10px] text-ink-2/60 text-center">{config.disclaimer}</p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
