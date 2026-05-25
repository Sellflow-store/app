"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const PENDING_KEY = "sellflow_pending_onboarding";

/**
 * Auto-finalizer for anonymous → signed-up onboarding flow.
 *
 * The wizard's Save CTA stashes the bootstrap payload in sessionStorage
 * and redirects an anonymous user here via /register?redirect_url=...
 * After Clerk completes sign-up + redirects them back, this page reads
 * the payload, POSTs to /api/onboarding (now with a Clerk session) and
 * sends them straight to their new dashboard.
 *
 * Renders a loading state while the round-trip completes; surfaces
 * errors with a manual retry so the user is never stranded.
 */
export default function OnboardingSavePage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "missing" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) { setStatus("missing"); return; }

    let cancelled = false;
    (async () => {
      try {
        const payload = JSON.parse(raw);
        const res = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as { shopSlug?: string; error?: string };
        if (cancelled) return;

        if (!res.ok) {
          // Still 401? Clerk session hasn't propagated yet — bounce back to login.
          if (res.status === 401) {
            router.push(`/login?redirect_url=${encodeURIComponent("/onboarding/save")}`);
            return;
          }
          setErrorMsg(data.error ?? "Nie udało się zapisać sklepu.");
          setStatus("error");
          return;
        }

        sessionStorage.removeItem(PENDING_KEY);
        router.replace(`/dashboard/${data.shopSlug}/orders`);
      } catch {
        if (cancelled) return;
        setErrorMsg("Błąd połączenia.");
        setStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div
      className="min-h-screen grid place-items-center px-6"
      style={{ background: "var(--brand-paper)", fontFamily: "var(--font-body)" }}
    >
      <div className="text-center max-w-md">
        {status === "loading" && (
          <>
            <Loader2
              className="w-7 h-7 mx-auto mb-4 animate-spin"
              style={{ color: "var(--brand-accent)" }}
            />
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-2"
              style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
            >
              Ostatni krok
            </p>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--brand-ink)" }}
            >
              Tworzymy Twój sklep…
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--brand-ink-2)" }}>
              Za chwilę przekierujemy Cię do panelu.
            </p>
          </>
        )}

        {status === "missing" && (
          <>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-3"
              style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
            >
              Brak danych do zapisu
            </p>
            <p className="text-base" style={{ color: "var(--brand-ink)" }}>
              Wygląda na to, że nie ma żadnego sklepu do zapisania. Wróć do kreatora
              i przejdź przez wszystkie kroki jeszcze raz.
            </p>
            <button
              type="button"
              onClick={() => router.push("/onboarding")}
              className="mt-6 inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "var(--brand-accent)", color: "var(--brand-paper)" }}
            >
              Otwórz kreator
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-3"
              style={{ color: "var(--brand-magenta)", fontFamily: "var(--font-mono)" }}
            >
              Coś poszło nie tak
            </p>
            <p className="text-base mb-6" style={{ color: "var(--brand-ink)" }}>
              {errorMsg ?? "Nie udało się zapisać sklepu."}
            </p>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "var(--brand-accent)", color: "var(--brand-paper)" }}
            >
              Spróbuj ponownie
            </button>
          </>
        )}
      </div>
    </div>
  );
}
