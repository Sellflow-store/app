"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { GUEST_DATA_TTL_MS, PENDING_SAVE_KEY, SAVE_BOUNCE_KEY, STORAGE_KEY } from "@/lib/brand/types";

type Pending = { raw: string; stale: boolean; shopName: string };

// Sign-up takes minutes. An older stash, or one from before stashes carried
// savedAt, may be someone else's who walked away mid-sign-up in this tab, so
// it is used only after the person here confirms the shop is theirs.
function readPending(): Pending | null {
  const raw = sessionStorage.getItem(PENDING_SAVE_KEY);
  if (!raw) return null;
  try {
    const { savedAt, shopName } = JSON.parse(raw) ?? {};
    return {
      raw,
      stale: !(Date.now() - Number(savedAt) < GUEST_DATA_TTL_MS),
      shopName: typeof shopName === "string" ? shopName : "",
    };
  } catch {
    // uszkodzony stash — traktuj jak brak
    sessionStorage.removeItem(PENDING_SAVE_KEY);
    return null;
  }
}

// The stash is accepted: keep the guest's wizard draft fresh too, so
// "Wróć do kreatora" after a failed save still finds it.
function touchGuestDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const draft = raw ? JSON.parse(raw) : null;
    if (draft?.owner === null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
    }
  } catch {}
}

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
  const [status, setStatus] = useState<"loading" | "missing" | "confirm" | "error">("loading");
  const [staleName, setStaleName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Bumping re-runs the save effect — router.refresh() would NOT re-fire
  // a client effect, so the old retry button silently did nothing.
  const [attempt, setAttempt] = useState(0);
  // The stash this page accepted (fresh, or confirmed as theirs):
  // "Spróbuj ponownie" retries it without asking again.
  const pendingRef = useRef<string | null>(null);

  useEffect(() => {
    const pending = pendingRef.current
      ? { raw: pendingRef.current, stale: false, shopName: "" }
      : readPending();
    if (!pending) { setStatus("missing"); return; }
    if (pending.stale) { setStaleName(pending.shopName); setStatus("confirm"); return; }
    const raw = pending.raw;
    if (!pendingRef.current) touchGuestDraft();
    pendingRef.current = raw;
    setStatus("loading");

    let cancelled = false;
    (async () => {
      try {
        const payload = JSON.parse(raw);
        // Logo mogło wypaść ze stashu w sessionStorage (za duży base64 → limit).
        // Pełny stan kreatora żyje w localStorage — odzyskaj z niego logo, żeby
        // zapisało się na sklepie.
        try {
          if (!payload?.bootstrap?.store?.logoDataUrl) {
            const wizRaw = localStorage.getItem(STORAGE_KEY);
            const logo = wizRaw ? JSON.parse(wizRaw)?.business?.logoDataUrl : null;
            if (logo && payload?.bootstrap?.store) {
              payload.bootstrap.store.logoDataUrl = logo;
            }
          }
        } catch { /* brak/uszkodzony stan kreatora — zapisz bez logo */ }
        const res = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as { shopSlug?: string; error?: string };
        if (cancelled) return;

        if (!res.ok) {
          // Still 401? Clerk session hasn't propagated yet — bounce back to
          // login, but only once: /login redirects signed-in users straight
          // back here, so a second 401 means the server genuinely can't see
          // the session and bouncing again would just loop forever.
          if (res.status === 401) {
            if (!sessionStorage.getItem(SAVE_BOUNCE_KEY)) {
              sessionStorage.setItem(SAVE_BOUNCE_KEY, "1");
              router.push(`/login?redirect_url=${encodeURIComponent("/onboarding/save")}`);
              return;
            }
            setErrorMsg("Nie udało się potwierdzić Twojej sesji. Odśwież stronę i spróbuj ponownie — Twoje ustawienia z kreatora są zapamiętane.");
            setStatus("error");
            return;
          }
          setErrorMsg(data.error ?? "Nie udało się zapisać sklepu.");
          setStatus("error");
          return;
        }

        sessionStorage.removeItem(SAVE_BOUNCE_KEY);
        sessionStorage.removeItem(PENDING_SAVE_KEY);
        // The shop exists now — the wizard draft must not prefill the next account.
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
        router.replace(`/dashboard/${data.shopSlug}`);
      } catch {
        if (cancelled) return;
        setErrorMsg("Błąd połączenia.");
        setStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, [router, attempt]);

  const confirmPending = () => {
    pendingRef.current = sessionStorage.getItem(PENDING_SAVE_KEY);
    touchGuestDraft();
    setAttempt((a) => a + 1);
  };

  // Not theirs: drop it. Without the stash the guest draft it came with is not
  // adopted either, so the wizard opens empty.
  const discardPending = () => {
    try {
      sessionStorage.removeItem(PENDING_SAVE_KEY);
      sessionStorage.removeItem(SAVE_BOUNCE_KEY);
    } catch {}
    router.push("/onboarding");
  };

  return (
    <div
      className="fixed inset-0 grid place-items-center px-6"
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

        {status === "confirm" && (
          <>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-3"
              style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
            >
              Dokończ zakładanie sklepu
            </p>
            <p className="text-base" style={{ color: "var(--brand-ink)" }}>
              W tej karcie czeka niedokończony sklep
              {staleName && <> „<strong>{staleName}</strong>”</>}. Czy to Twój sklep?
            </p>
            <p className="mt-2 mb-6 text-sm" style={{ color: "var(--brand-ink-2)" }}>
              Czeka tu od dłuższego czasu, więc mogła go zostawić osoba, która
              wcześniej korzystała z tej przeglądarki.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={confirmPending}
                className="inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "var(--brand-accent)", color: "var(--brand-paper)" }}
              >
                Tak, utwórz sklep
              </button>
              <button
                type="button"
                onClick={discardPending}
                className="inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold transition-all hover:opacity-90"
                style={{
                  background: "var(--brand-paper)",
                  color: "var(--brand-ink)",
                  border: "1.5px solid var(--brand-rule)",
                }}
              >
                Nie, zacznij od nowa
              </button>
            </div>
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
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setAttempt((a) => a + 1)}
                className="inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "var(--brand-accent)", color: "var(--brand-paper)" }}
              >
                Spróbuj ponownie
              </button>
              <button
                type="button"
                onClick={() => router.push("/onboarding")}
                className="inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold transition-all hover:opacity-90"
                style={{
                  background: "var(--brand-paper)",
                  color: "var(--brand-ink)",
                  border: "1.5px solid var(--brand-rule)",
                }}
              >
                Wróć do kreatora
              </button>
            </div>
            <p className="mt-4 text-xs" style={{ color: "var(--brand-ink-2)" }}>
              Twoje ustawienia z kreatora są zapamiętane — nic nie przepada.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
