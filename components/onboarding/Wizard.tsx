"use client";

import { useCallback, useMemo, useState } from "react";
<<<<<<< HEAD
import Link from "next/link";
import { useAuth, useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { OnboardingProvider, useOnboarding } from "./state";
import { PENDING_SAVE_KEY, SAVE_BOUNCE_KEY } from "@/lib/brand/types";
=======
import { useAuth } from "@clerk/nextjs";
import { OnboardingProvider } from "./state";
>>>>>>> origin/dabekkacper32/sel-30-onboarding-kreator-nowego-konta-wypelniony-danymi
import Welcome from "./steps/Welcome";
import Sells from "./steps/Sells";
import Name from "./steps/Name";
import Logo from "./steps/Logo";
import Problem from "./steps/Problem";
import Edge from "./steps/Edge";
import Brand from "./steps/Brand";
import LivePreview from "./LivePreview";

type StepId =
  | "welcome" | "sells" | "name" | "logo" | "problem" | "edge" | "brand" | "preview";

const ORDER: StepId[] = ["welcome", "sells", "name", "logo", "problem", "edge", "brand", "preview"];

interface Props { firstName: string; userId: string | null }

export default function Wizard({ firstName, userId }: Props) {
<<<<<<< HEAD
  return (
    <OnboardingProvider>
      <Shell firstName={firstName} signedIn={!!userId} />
=======
  // The server prop covers SSR and the first client render; once Clerk loads,
  // its live state wins — a page restored by Back after signing out still
  // carries the previous account's id.
  const { isLoaded, userId: liveUserId } = useAuth();
  const owner = isLoaded ? (liveUserId ?? null) : userId;
  return (
    // Keyed by account: a sign-in/out without a full reload remounts the
    // provider, so the in-memory draft is re-checked against the new owner
    // instead of being re-saved under it.
    <OnboardingProvider key={owner ?? "guest"} userId={owner}>
      <Shell firstName={firstName} />
>>>>>>> origin/dabekkacper32/sel-30-onboarding-kreator-nowego-konta-wypelniony-danymi
    </OnboardingProvider>
  );
}

function Shell({ firstName, signedIn }: { firstName: string; signedIn: boolean }) {
  const { reset } = useOnboarding();
  // The server prop covers SSR and the first client render; once Clerk loads,
  // its live state wins (e.g. a page restored by Back after signing out).
  const { isLoaded, isSignedIn } = useAuth();
  const showSignOut = isLoaded ? !!isSignedIn : signedIn;
  const { signOut } = useClerk();
  // Clear only once Clerk has signed out: a failed sign-out must not leave a
  // signed-in user with an emptied draft.
  const handleSignOut = async () => {
    try {
      await signOut({ redirectUrl: "/login" });
    } catch {
      return;
    }
    reset();
    try {
      sessionStorage.removeItem(PENDING_SAVE_KEY);
      sessionStorage.removeItem(SAVE_BOUNCE_KEY);
    } catch {}
  };
  const [step, setStep] = useState<StepId>("welcome");
  const index = ORDER.indexOf(step);
  const progressPct = useMemo(() => {
    if (index <= 0) return 0;
    return Math.round((index / (ORDER.length - 1)) * 100);
  }, [index]);

  const goNext = useCallback(() => {
    setStep(ORDER[Math.min(index + 1, ORDER.length - 1)]);
  }, [index]);

  const goBack = useCallback(() => {
    setStep(ORDER[Math.max(index - 1, 0)]);
  }, [index]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--brand-paper)", fontFamily: "var(--font-body)" }}
    >
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--brand-rule)" }}
      >
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 100 100" className="w-7 h-7 shrink-0" aria-hidden>
            <rect width="100" height="100" rx="18" ry="18" fill="oklch(22% 0.24 270)" />
            <text x="50" y="76" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900"
                  fontSize="74" textAnchor="middle" fill="#fff">S</text>
          </svg>
          <span className="text-base font-bold tracking-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--brand-ink)" }}>
            Sellflow
          </span>
        </div>
        <div className="flex items-center gap-4">
          {index > 0 && (
            <div className="flex items-center gap-3" aria-label="Postęp onboardingu">
              <span className="text-xs font-mono"
                    style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}>
                {Math.min(index, ORDER.length - 1)} / {ORDER.length - 1}
              </span>
              <div
                className="h-1 w-20 sm:w-32 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{ background: "var(--brand-rule)" }}
              >
                <div
                  className="h-full transition-[width] duration-500"
                  style={{
                    width: `${progressPct}%`,
                    background: "var(--brand-accent)",
                    transitionTimingFunction: "var(--brand-ease-out)",
                  }}
                />
              </div>
            </div>
          )}
          {/* A signed-in user without a shop is sent back here from every route,
              so the wizard is the only place they can sign out. The draft and
              the pending save are cleared after sign-out so the next person on
              this browser starts empty. Disabled until Clerk loads: before
              that signOut() is only queued and would resolve at once. */}
          {showSignOut ? (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={!isLoaded}
              className="inline-flex items-center gap-1.5 h-8 px-2 rounded-md text-xs font-medium hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ color: "var(--brand-ink-2)" }}
            >
              <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden />
              <span className="sr-only sm:not-sr-only">Wyloguj</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="text-xs font-medium hover:underline"
              style={{ color: "var(--brand-ink-2)" }}
            >
              <span className="hidden sm:inline">Masz konto? </span>Zaloguj się
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-12">
        <div className={step === "preview" || step === "brand" ? "max-w-6xl mx-auto" : "max-w-[560px] mx-auto"}>
          {step !== "welcome" && step !== "preview" && step !== "brand" && (
            <div
              className="rounded-3xl p-8 sm:p-10"
              style={{
                background: "var(--brand-paper)",
                border: "1px solid var(--brand-rule)",
                boxShadow: "0 4px 24px oklch(22% 0.24 270 / 0.04)",
              }}
            >
              {renderStep(step, goNext, goBack, firstName)}
            </div>
          )}
          {(step === "welcome" || step === "preview" || step === "brand") &&
            renderStep(step, goNext, goBack, firstName)}
        </div>
      </main>

      <footer
        className="flex items-center justify-between px-6 py-3 text-[11px]"
        style={{
          borderTop: "1px solid var(--brand-rule)",
          color: "var(--brand-ink-2)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <span>Sellflow Onboarding</span>
        <span>Autosave on</span>
      </footer>
    </div>
  );
}

function renderStep(
  step: StepId,
  goNext: () => void,
  goBack: () => void,
  firstName: string,
) {
  switch (step) {
    case "welcome": return <Welcome firstName={firstName} onContinue={goNext} />;
    case "sells":   return <Sells   onNext={goNext} onBack={goBack} />;
    case "name":    return <Name    onNext={goNext} onBack={goBack} />;
    case "logo":    return <Logo    onNext={goNext} onBack={goBack} />;
    case "problem": return <Problem onNext={goNext} onBack={goBack} />;
    case "edge":    return <Edge    onNext={goNext} onBack={goBack} />;
    case "brand":   return <Brand   onNext={goNext} onBack={goBack} />;
    case "preview": return <LivePreview />;
  }
}
