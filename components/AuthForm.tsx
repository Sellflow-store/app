"use client";

import { useEffect, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useSignIn, useSignUp } from "@clerk/nextjs/legacy";
import type { SignInResource } from "@clerk/nextjs/types";
import { Eye, EyeOff, ArrowRight, Mail, Loader2, Check, Circle } from "lucide-react";

/** Only accept same-origin relative paths to avoid open-redirect abuse. */
function safeRedirect(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}

type Mode  = "login" | "register";
type Phase = "form" | "verifying" | "loading" | "reset-request" | "reset-verify";

// Clerk's own messages are English. Keys follow @clerk/localizations: the error
// code, `code__paramName` where the field matters, `code__sign_in` where the
// same code means something else at sign-in.
const PWNED_AT_SIGN_IN = "To hasło wyciekło z innego serwisu, więc trzeba je zmienić. Kliknij „Nie pamiętam hasła”.";
const CAPTCHA_FAILED   = "Nie udało się potwierdzić, że nie jesteś botem. Odśwież stronę i spróbuj ponownie. Pomaga też wyłączenie blokowania reklam.";
const TOO_MANY_TRIES   = "Za dużo prób w krótkim czasie. Odczekaj chwilę i spróbuj ponownie.";
const CLERK_ERRORS_PL: Record<string, string> = {
  form_identifier_not_found:                  "Nie znaleźliśmy konta z tym adresem e-mail.",
  form_identifier_exists__email_address:      "Konto z tym adresem e-mail już istnieje. Przejdź do „Zaloguj się”.",
  form_param_format_invalid__email_address:   "Wpisz poprawny adres e-mail.",
  form_email_address_blocked:                 "Tego adresu e-mail nie można użyć. Podaj inny.",
  form_param_nil:                             "Uzupełnij wszystkie pola.",
  form_param_max_length_exceeded__first_name: "Imię jest za długie.",
  form_param_max_length_exceeded__last_name:  "Nazwisko jest za długie.",
  not_allowed_access:                         "Z tym adresem e-mail nie można założyć konta. Napisz do nas.",
  strategy_for_user_invalid:                  "To konto loguje się przez Google. Użyj przycisku „Kontynuuj z Google” na ekranie logowania.",
  form_password_incorrect:                    "Nieprawidłowe hasło. Spróbuj ponownie albo kliknij „Nie pamiętam hasła”.",
  form_password_or_identifier_incorrect:      "Nieprawidłowy e-mail lub hasło.",
  form_password_pwned:                        "To hasło wyciekło z innego serwisu, więc nie jest bezpieczne. Wybierz inne.",
  form_password_pwned__sign_in:               PWNED_AT_SIGN_IN,
  form_password_compromised:                  PWNED_AT_SIGN_IN,
  form_password_untrusted:                    PWNED_AT_SIGN_IN,
  form_password_length_too_short:             "Hasło jest za krótkie. Sprawdź wymagania pod polem hasła.",
  form_password_size_in_bytes_exceeded:       "Hasło jest za długie.",
  form_password_validation_failed:            "Hasło nie spełnia wymagań. Sprawdź listę pod polem hasła.",
  form_password_not_strong_enough:            "Hasło jest za słabe. Wydłuż je, np. dodając kilka słów.",
  form_password_matches_identifier:           "Hasło nie może być takie samo jak adres e-mail.",
  form_new_password_matches_current:          "Nowe hasło musi się różnić od obecnego.",
  form_code_incorrect:                        "Nieprawidłowy kod. Sprawdź e-mail i wpisz kod jeszcze raz.",
  verification_expired:                       "Kod wygasł. Kliknij „Wyślij kod ponownie”.",
  verification_failed:                        "Za dużo nieudanych prób. Kliknij „Wyślij kod ponownie”.",
  user_locked:                                "Konto jest tymczasowo zablokowane po zbyt wielu nieudanych próbach. Spróbuj ponownie później.",
  too_many_requests:                          TOO_MANY_TRIES,
  signup_rate_limit_exceeded:                 TOO_MANY_TRIES,
  captcha_invalid:                            CAPTCHA_FAILED,
  captcha_missing_token:                      CAPTCHA_FAILED,
  captcha_unavailable:                        CAPTCHA_FAILED,
};

function clerkMsg(err: unknown, flow?: "sign_in"): string {
  const e = (err as { errors?: { code?: string; meta?: { paramName?: string } }[] })?.errors?.[0];
  const code = e?.code ?? "";
  return (
    (flow && CLERK_ERRORS_PL[`${code}__${flow}`]) ||
    CLERK_ERRORS_PL[`${code}__${e?.meta?.paramName}`] ||
    CLERK_ERRORS_PL[code] ||
    "Wystąpił błąd. Spróbuj ponownie."
  );
}

function clerkCode(err: unknown): string | undefined {
  return (err as { errors?: { code?: string }[] })?.errors?.[0]?.code;
}

// ── Sellflow logo ──────────────────────────────────────────────────────────────
function SellflowLogo({ white = false }: { white?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 100 100" className="w-9 h-9 shrink-0" aria-hidden="true">
        <rect width="100" height="100" rx="18" ry="18" fill={white ? "rgba(255,255,255,0.12)" : "#12128c"} />
        <text x="50" y="76" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="74" textAnchor="middle" fill="#ffffff">S</text>
      </svg>
      <span
        className="text-2xl font-bold tracking-tight"
        style={{ fontFamily: "var(--font-display)", color: white ? "#fff" : "oklch(11% 0.10 275)" }}
      >
        Sellflow
      </span>
    </div>
  );
}

// ── Reusable field ─────────────────────────────────────────────────────────────
function Field({
  label, type = "text", value, onChange, placeholder, autoComplete, disabled, inputMode, hint,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  autoComplete?: string; disabled?: boolean;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"]; hint?: string;
}) {
  const hintId = useId();
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold" style={{ color: "oklch(11% 0.10 275)" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-describedby={hint ? hintId : undefined}
        required
        disabled={disabled}
        className="w-full text-sm focus:outline-none transition-all disabled:opacity-50"
        style={{
          padding: "12px 14px",
          border: "1.5px solid oklch(91% 0.020 230)",
          borderRadius: "12px",
          background: "#fff",
          color: "oklch(11% 0.10 275)",
          fontFamily: "var(--font-body)",
        }}
        onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
        onBlur={(e) =>  (e.target.style.borderColor = "oklch(91% 0.020 230)")}
      />
      {hint && (
        <p id={hintId} className="text-xs" style={{ color: "oklch(40% 0.06 240)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

// ── Password requirements ──────────────────────────────────────────────────────
// The policy lives in the Clerk instance. validatePassword() reports which of
// its rules a password fails without exposing the settings, so validating ""
// reveals the rules that are switched on. The minimum length isn't exposed
// either; 8 is Clerk's default.
const PASSWORD_RULES = [
  { key: "min_length",           label: "co najmniej 8 znaków" },
  { key: "require_lowercase",    label: "małą literę" },
  { key: "require_uppercase",    label: "wielką literę" },
  { key: "require_numbers",      label: "cyfrę" },
  { key: "require_special_char", label: "znak specjalny, np. ! ? #" },
];

type PasswordValidator = Pick<SignInResource, "validatePassword">;

/** Rules `password` fails, or null while Clerk can't validate (not loaded yet). */
function failedRules(validator: PasswordValidator | undefined, password: string): Set<string> | null {
  let failed: Set<string> | null = null;
  validator?.validatePassword(password, {
    // Always called, synchronously. onValidation is skipped when every rule
    // passes and Clerk's strength check (zxcvbn) still has to load.
    onValidationComplexity: () => { failed = new Set(); },
    onValidation: ({ complexity }) => { failed = new Set(Object.keys(complexity ?? {})); },
  });
  return failed;
}

function PasswordRules({ password, validator }: { password: string; validator?: PasswordValidator }) {
  const enabled = failedRules(validator, "");
  const failed  = failedRules(validator, password);
  const rules = enabled && failed
    ? PASSWORD_RULES.filter((r) => enabled.has(r.key)).map((r) => ({ ...r, ok: !failed.has(r.key) }))
    : [{ ...PASSWORD_RULES[0], ok: password.length >= 8 }];
  return (
    <div className="pt-1 text-xs" style={{ color: "oklch(40% 0.06 240)" }}>
      <p>Hasło musi mieć:</p>
      <ul className="mt-1 space-y-0.5">
        {rules.map((r) => (
          <li key={r.key} className="flex items-center gap-1.5"
              style={r.ok ? { color: "var(--panel-success-ink)" } : undefined}>
            {r.ok
              ? <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
              : <Circle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />}
            {r.label}
            {r.ok && <span className="sr-only"> (spełnione)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface Props {
  defaultMode?: Mode;
}

export default function AuthForm({ defaultMode = "register" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Honor ?redirect_url=/x set by the onboarding wizard's Save CTA so an
  // anonymous user lands back on /onboarding/save after sign-up + auto-finalizes.
  // Default afterLogin is "/" because the root page does the user → shop lookup
  // and redirects to /dashboard/[slug]/orders or /onboarding accordingly —
  // avoiding the bare /dashboard route that collides with the (dashboard) group.
  const afterLogin    = safeRedirect(searchParams.get("redirect_url"), "/");
  const afterRegister = safeRedirect(searchParams.get("redirect_url"), "/onboarding");
  const { signIn, setActive: setSignInActive, isLoaded: siLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: suLoaded } = useSignUp();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();

  const [mode, setMode]         = useState<Mode>(defaultMode);
  const [phase, setPhase]       = useState<Phase>("form");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [code, setCode]         = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  // The code screens (email verification, password reset) keep their own busy
  // flags: phase "loading" would swap them back to the main form while a
  // request is in flight.
  const [verifyBusy, setVerifyBusy]     = useState(false);
  const [verifyNotice, setVerifyNotice] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetBusy, setResetBusy]     = useState(false);
  const [resetNotice, setResetNotice] = useState("");

  const isLogin   = mode === "login";
  const isLoading = phase === "loading";

  // Digits only, cut to 6, so a pasted "123 456" still fits. Not maxLength,
  // which would cut that paste to "123 45".
  const onCodeChange = (v: string) => setCode(v.replace(/\D/g, "").slice(0, 6));

  // Already signed in (e.g. bounced here after a server-side 401 while the
  // client still holds a session) — signing in/up again would only produce
  // Clerk's session_exists error, so route them to their destination instead.
  // Gated to the idle form phase so it can't fire mid sign-up/verification.
  useEffect(() => {
    if (authLoaded && isSignedIn && phase === "form") {
      router.replace(afterLogin);
    }
  }, [authLoaded, isSignedIn, phase, router, afterLogin]);

  function switchMode(m: Mode) {
    setMode(m);
    setError("");
    setPhase("form");
    const base = m === "login" ? "/login" : "/register";
    const pending = searchParams.get("redirect_url");
    router.push(pending ? `${base}?redirect_url=${encodeURIComponent(pending)}` : base);
  }

  // ── Login ────────────────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!siLoaded) return;
    setPhase("loading");
    setError("");
    try {
      const result = await signIn!.create({ identifier: email, password });
      if (result.status === "complete") {
        await setSignInActive!({ session: result.createdSessionId });
        router.push(afterLogin);
      } else {
        setError("Logowanie wymaga dodatkowego kroku, którego ta forma nie obsługuje. Spróbuj przez Google lub skontaktuj się z nami.");
        setPhase("form");
      }
    } catch (err) {
      if (clerkCode(err) === "session_exists") {
        router.replace(afterLogin);
        return;
      }
      setError(clerkMsg(err, "sign_in"));
      setPhase("form");
    }
  }

  // ── Register step 1 — create account ────────────────────────────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!suLoaded) return;
    setPhase("loading");
    setError("");
    try {
      const parts = name.trim().split(" ");
      await signUp!.create({
        emailAddress: email,
        password,
        firstName: parts[0],
        lastName: parts.slice(1).join(" ") || undefined,
      });
      await signUp!.prepareEmailAddressVerification({ strategy: "email_code" });
      setPhase("verifying");
    } catch (err) {
      if (clerkCode(err) === "session_exists") {
        router.replace(afterRegister);
        return;
      }
      setError(clerkMsg(err));
      setPhase("form");
    }
  }

  // ── Register step 2 — verify email code ─────────────────────────────────────
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!suLoaded) return;
    setVerifyBusy(true);
    setError("");
    setVerifyNotice("");
    try {
      const result = await signUp!.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setSignUpActive!({ session: result.createdSessionId });
        router.push(afterRegister);
        return; // stay busy until the navigation lands
      }
      // e.g. missing_requirements — without this branch the form hung on a
      // spinner forever, which reads as "registration is broken".
      setError("Nie udało się dokończyć rejestracji. Spróbuj ponownie lub użyj logowania przez Google.");
    } catch (err) {
      setError(clerkMsg(err));
    }
    setVerifyBusy(false);
  }

  async function handleResendSignUpCode() {
    if (!suLoaded) return;
    setVerifyBusy(true);
    setError("");
    setVerifyNotice("");
    setCode("");
    try {
      await signUp!.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifyNotice(`Wysłaliśmy nowy kod na ${email}.`);
    } catch (err) {
      setError(clerkMsg(err));
    } finally {
      setVerifyBusy(false);
    }
  }

  function backToRegisterForm() {
    setError("");
    setVerifyNotice("");
    setCode("");
    setPhase("form");
  }

  // ── Password reset ───────────────────────────────────────────────────────────
  // In-component (no /forgot-password route): on app.<domain> proxy.ts 308s any
  // slug-shaped path outside RESERVED_SLUGS to a shop subdomain.
  function startReset() {
    setError("");
    setResetNotice("");
    setCode("");
    setNewPassword("");
    setPhase("reset-request");
  }

  function backToLogin() {
    setError("");
    setResetNotice("");
    setCode("");
    setNewPassword("");
    setPhase("form");
  }

  async function sendResetCode(): Promise<boolean> {
    if (!siLoaded) return false;
    setResetBusy(true);
    setError("");
    setResetNotice("");
    try {
      await signIn!.create({ strategy: "reset_password_email_code", identifier: email });
      return true;
    } catch (err) {
      setError(clerkMsg(err));
      return false;
    } finally {
      setResetBusy(false);
    }
  }

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault();
    if (await sendResetCode()) setPhase("reset-verify");
  }

  async function handleResendResetCode() {
    setCode("");
    if (await sendResetCode()) setResetNotice(`Wysłaliśmy nowy kod na ${email}.`);
  }

  async function handleResetVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!siLoaded) return;
    setResetBusy(true);
    setError("");
    setResetNotice("");
    try {
      // A retry after a rejected new password must not re-submit the already
      // consumed code, so skip straight to resetPassword in that state.
      let result = signIn!;
      if (result.status !== "needs_new_password") {
        result = await result.attemptFirstFactor({ strategy: "reset_password_email_code", code });
      }
      if (result.status === "needs_new_password") {
        result = await result.resetPassword({ password: newPassword, signOutOfOtherSessions: true });
      }
      if (result.status === "complete") {
        await setSignInActive!({ session: result.createdSessionId });
        router.push(afterLogin);
        return;
      }
      // e.g. needs_second_factor — same dead end as in handleLogin, but say so
      // instead of leaving the user on a spinner.
      setError("Nie udało się dokończyć zmiany hasła: logowanie wymaga dodatkowego kroku, którego ta forma nie obsługuje. Skontaktuj się z nami.");
    } catch (err) {
      setError(clerkMsg(err));
    } finally {
      setResetBusy(false);
    }
  }

  // ── Google OAuth ─────────────────────────────────────────────────────────────
  async function handleGoogle() {
    try {
      if (isLogin && siLoaded) {
        await signIn!.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: "/sso-callback",
          redirectUrlComplete: afterLogin,
        });
      } else if (!isLogin && suLoaded) {
        await signUp!.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: "/sso-callback",
          redirectUrlComplete: afterRegister,
        });
      }
    } catch (err) {
      setError(clerkMsg(err));
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex" style={{ fontFamily: "var(--font-body)" }}>

      {/* LEFT — branding */}
      <div
        className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "oklch(22% 0.24 270)" }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]" aria-hidden="true">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
        <div
          className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, oklch(80% 0.16 195 / 0.12) 0%, transparent 70%)" }}
        />

        <div className="relative z-10">
          <SellflowLogo white />
        </div>

        <div className="relative z-10 space-y-6">
          <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "oklch(80% 0.16 195)" }}>
            E-commerce dla mikro i małych sprzedawców
          </p>
          <h1
            className="text-4xl xl:text-5xl font-bold leading-[1.1] tracking-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Twój sklep<br />bez chaosu,<br />
            <span style={{ color: "oklch(56% 0.30 335)" }}>w przerwie na kawę.</span>
          </h1>
          <p className="text-base leading-relaxed max-w-sm" style={{ color: "oklch(80% 0.16 195 / 0.8)" }}>
            Stwórz konto, uzupełnij dane sklepu i zacznij sprzedawać. Zero wtyczek, zero technikaliów.
          </p>
        </div>

        <div className="relative z-10">
          <div
            className="flex items-center gap-4 p-4 rounded-2xl"
            style={{ background: "oklch(100% 0 0 / 0.06)", border: "1px solid oklch(100% 0 0 / 0.1)" }}
          >
            <div className="flex -space-x-2 shrink-0">
              {["#DB00B2", "#00E5F0", "#12128c", "#ffffff"].map((c, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                  style={{ background: c, borderColor: "oklch(22% 0.24 270)", color: i === 3 ? "#12128c" : "#fff" }}
                >
                  {["M", "A", "K", "R"][i]}
                </div>
              ))}
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight">Dołącz do Early Access</p>
              <p className="text-xs mt-0.5" style={{ color: "oklch(80% 0.16 195 / 0.7)" }}>
                Pierwsi użytkownicy · lifetime discount
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — form */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto"
        style={{ background: "oklch(99% 0.005 250)" }}
      >
        <div className="mb-8 lg:hidden">
          <SellflowLogo />
        </div>

        <div className="w-full max-w-[400px]">

          {/* Email verification screen */}
          {phase === "verifying" && (
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "oklch(56% 0.30 335 / 0.1)" }}>
                <Mail className="w-7 h-7" style={{ color: "oklch(56% 0.30 335)" }} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}>
                  Sprawdź skrzynkę
                </h2>
                <p className="text-sm mt-1" style={{ color: "oklch(40% 0.06 240)" }}>
                  Wysłaliśmy 6-cyfrowy kod na <strong>{email}</strong>
                </p>
              </div>

              <Field
                label="Kod weryfikacyjny"
                value={code}
                onChange={onCodeChange}
                placeholder="123456"
                autoComplete="one-time-code"
                inputMode="numeric"
                hint="Kod ma 6 cyfr."
                disabled={verifyBusy}
              />

              {error && (
                <p className="text-xs font-medium px-3 py-2 rounded-lg" style={{ background: "var(--panel-danger-soft)", color: "var(--panel-danger-ink)" }}>
                  {error}
                </p>
              )}
              {verifyNotice && (
                <p className="text-xs font-medium px-3 py-2 rounded-lg" style={{ background: "var(--panel-success-soft)", color: "var(--panel-success-ink)" }}>
                  {verifyNotice}
                </p>
              )}

              <button
                type="submit"
                disabled={verifyBusy || code.length !== 6}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold transition-all disabled:opacity-60"
                style={{ padding: "14px 22px", borderRadius: "999px", background: "oklch(56% 0.30 335)", color: "#fff" }}
              >
                {verifyBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Potwierdź konto <ArrowRight className="w-4 h-4" strokeWidth={2} /></>}
              </button>

              <div className="flex items-center justify-between">
                <button type="button" onClick={backToRegisterForm} disabled={verifyBusy}
                  className="text-xs" style={{ color: "oklch(40% 0.06 240)" }}>
                  ← Wróć i zmień e-mail
                </button>
                <button type="button" onClick={handleResendSignUpCode} disabled={verifyBusy}
                  className="text-xs font-semibold" style={{ color: "oklch(22% 0.24 270)" }}>
                  Wyślij kod ponownie
                </button>
              </div>
            </form>
          )}

          {/* Password reset — step 1: request a code */}
          {phase === "reset-request" && (
            <form onSubmit={handleResetRequest} className="space-y-5">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "oklch(56% 0.30 335 / 0.1)" }}>
                <Mail className="w-7 h-7" style={{ color: "oklch(56% 0.30 335)" }} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}>
                  Zresetuj hasło
                </h2>
                <p className="text-sm mt-1" style={{ color: "oklch(40% 0.06 240)" }}>
                  Podaj adres e-mail konta. Wyślemy na niego 6-cyfrowy kod.
                </p>
              </div>

              <Field label="Adres e-mail" type="email" value={email} onChange={setEmail}
                placeholder="marta@twojsklep.pl" autoComplete="email" disabled={resetBusy} />

              {error && (
                <p className="text-xs font-medium px-3 py-2 rounded-lg" style={{ background: "var(--panel-danger-soft)", color: "var(--panel-danger-ink)" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={resetBusy || !email}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold transition-all disabled:opacity-60"
                style={{ padding: "14px 22px", borderRadius: "999px", background: "oklch(56% 0.30 335)", color: "#fff" }}
              >
                {resetBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Wyślij kod <ArrowRight className="w-4 h-4" strokeWidth={2} /></>}
              </button>

              <button type="button" onClick={backToLogin}
                className="w-full text-xs text-center" style={{ color: "oklch(40% 0.06 240)" }}>
                ← Wróć do logowania
              </button>
            </form>
          )}

          {/* Password reset — step 2: code + new password */}
          {phase === "reset-verify" && (
            <form onSubmit={handleResetVerify} className="space-y-5">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "oklch(56% 0.30 335 / 0.1)" }}>
                <Mail className="w-7 h-7" style={{ color: "oklch(56% 0.30 335)" }} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}>
                  Ustaw nowe hasło
                </h2>
                <p className="text-sm mt-1" style={{ color: "oklch(40% 0.06 240)" }}>
                  Wysłaliśmy 6-cyfrowy kod na <strong>{email}</strong>
                </p>
              </div>

              <Field
                label="Kod z e-maila"
                value={code}
                onChange={onCodeChange}
                placeholder="123456"
                autoComplete="one-time-code"
                inputMode="numeric"
                hint="Kod ma 6 cyfr."
                disabled={resetBusy}
              />

              <div className="space-y-1">
                <label className="block text-xs font-semibold" style={{ color: "oklch(11% 0.10 275)" }}>Nowe hasło</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 znaków"
                    autoComplete="new-password"
                    required
                    disabled={resetBusy}
                    className="w-full pr-10 text-sm focus:outline-none transition-all disabled:opacity-50"
                    style={{
                      padding: "12px 44px 12px 14px",
                      border: "1.5px solid oklch(91% 0.020 230)",
                      borderRadius: "12px",
                      background: "#fff",
                      color: "oklch(11% 0.10 275)",
                      fontFamily: "var(--font-body)",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
                    onBlur={(e) =>  (e.target.style.borderColor = "oklch(91% 0.020 230)")}
                  />
                  <button type="button" onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "oklch(40% 0.06 240)" }}>
                    {showPass ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                  </button>
                </div>
                <PasswordRules password={newPassword} validator={signIn} />
              </div>

              {error && (
                <p className="text-xs font-medium px-3 py-2 rounded-lg" style={{ background: "var(--panel-danger-soft)", color: "var(--panel-danger-ink)" }}>
                  {error}
                </p>
              )}
              {resetNotice && (
                <p className="text-xs font-medium px-3 py-2 rounded-lg" style={{ background: "var(--panel-success-soft)", color: "var(--panel-success-ink)" }}>
                  {resetNotice}
                </p>
              )}

              <button
                type="submit"
                disabled={resetBusy || code.length !== 6 || !newPassword}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold transition-all disabled:opacity-60"
                style={{ padding: "14px 22px", borderRadius: "999px", background: "oklch(56% 0.30 335)", color: "#fff" }}
              >
                {resetBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Ustaw nowe hasło <ArrowRight className="w-4 h-4" strokeWidth={2} /></>}
              </button>

              <div className="flex items-center justify-between">
                <button type="button" onClick={backToLogin} disabled={resetBusy}
                  className="text-xs" style={{ color: "oklch(40% 0.06 240)" }}>
                  ← Wróć do logowania
                </button>
                <button type="button" onClick={handleResendResetCode} disabled={resetBusy}
                  className="text-xs font-semibold" style={{ color: "oklch(22% 0.24 270)" }}>
                  Wyślij kod ponownie
                </button>
              </div>
            </form>
          )}

          {/* Main form */}
          {(phase === "form" || phase === "loading") && (
            <>
              {/* Tab switcher */}
              <div className="flex rounded-xl p-1 mb-8" style={{ background: "oklch(97% 0.008 250)" }}>
                {(["register", "login"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all"
                    style={
                      mode === m
                        ? { background: "oklch(22% 0.24 270)", color: "#fff", boxShadow: "0 1px 4px oklch(22% 0.24 270 / 0.3)" }
                        : { color: "oklch(40% 0.06 240)" }
                    }
                  >
                    {m === "register" ? "Utwórz konto" : "Zaloguj się"}
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}>
                  {isLogin ? "Witaj z powrotem" : "Zacznij sprzedawać"}
                </h2>
                <p className="text-sm mt-1" style={{ color: "oklch(40% 0.06 240)" }}>
                  {isLogin
                    ? "Zaloguj się, aby zarządzać swoim sklepem."
                    : "Załóż konto i skonfiguruj sklep w kilka minut."}
                </p>
              </div>

              <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
                {!isLogin && (
                  <Field label="Twoje imię i nazwisko" value={name} onChange={setName}
                    placeholder="np. Marta Kowalska" autoComplete="name" disabled={isLoading} />
                )}
                <Field label="Adres e-mail" type="email" value={email} onChange={setEmail}
                  placeholder="marta@twojsklep.pl" autoComplete="email" disabled={isLoading} />

                <div className="space-y-1">
                  <label className="block text-xs font-semibold" style={{ color: "oklch(11% 0.10 275)" }}>Hasło</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isLogin ? "Twoje hasło" : "Min. 8 znaków"}
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      required
                      disabled={isLoading}
                      className="w-full pr-10 text-sm focus:outline-none transition-all disabled:opacity-50"
                      style={{
                        padding: "12px 44px 12px 14px",
                        border: "1.5px solid oklch(91% 0.020 230)",
                        borderRadius: "12px",
                        background: "#fff",
                        color: "oklch(11% 0.10 275)",
                        fontFamily: "var(--font-body)",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
                      onBlur={(e) =>  (e.target.style.borderColor = "oklch(91% 0.020 230)")}
                    />
                    <button type="button" onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "oklch(40% 0.06 240)" }}>
                      {showPass ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                    </button>
                  </div>
                  {!isLogin && <PasswordRules password={password} validator={signUp} />}
                </div>

                {isLogin && (
                  <div className="text-right">
                    <button type="button" onClick={startReset} className="text-xs font-semibold" style={{ color: "oklch(22% 0.24 270)" }}>
                      Nie pamiętam hasła
                    </button>
                  </div>
                )}

                {error && (
                  <p className="text-xs font-medium px-3 py-2 rounded-lg" style={{ background: "var(--panel-danger-soft)", color: "var(--panel-danger-ink)" }}>
                    {error}
                  </p>
                )}

                {/* Clerk mounts its bot-protection widget here; the instance has
                    smart CAPTCHA enabled and custom sign-up flows must provide
                    this element or signUp.create() can fail with
                    captcha_missing_token for users behind adblockers. */}
                {!isLogin && <div id="clerk-captcha" />}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold transition-all disabled:opacity-60"
                  style={{ padding: "14px 22px", borderRadius: "999px", background: "oklch(56% 0.30 335)", color: "#fff", marginTop: "8px" }}
                  onMouseEnter={(e) => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = "oklch(46% 0.25 333)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "oklch(56% 0.30 335)"; }}
                >
                  {isLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <>{isLogin ? "Zaloguj się" : "Stwórz konto i sklep"} <ArrowRight className="w-4 h-4" strokeWidth={2} /></>
                  }
                </button>
              </form>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px" style={{ background: "oklch(91% 0.020 230)" }} />
                <span className="text-xs" style={{ color: "oklch(40% 0.06 240)" }}>lub kontynuuj przez</span>
                <div className="flex-1 h-px" style={{ background: "oklch(91% 0.020 230)" }} />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 text-sm font-semibold transition-all disabled:opacity-50"
                style={{ padding: "12px 22px", borderRadius: "999px", border: "1.5px solid oklch(91% 0.020 230)", background: "#fff", color: "oklch(11% 0.10 275)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "oklch(22% 0.24 270)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "oklch(91% 0.020 230)")}
              >
                <svg viewBox="0 0 48 48" className="w-4 h-4">
                  <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 29.8 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.4-4h.2z" />
                  <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.4 19.1 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.7 0-14.3 4.5-17.7 11.7z" />
                  <path fill="#FBBC05" d="M24 43c5.6 0 10.6-1.9 14.5-5.1l-6.7-5.5C29.8 34.3 27 35 24 35c-5.7 0-10.6-3.2-13-7.9l-7 5.4C7.7 38.5 15.4 43 24 43z" />
                  <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.6 2.8-2.2 5.2-4.5 6.9l6.7 5.5C41.8 37.4 44.5 31 44.5 24c0-1.3-.1-2.7-.4-4h.4z" />
                </svg>
                Kontynuuj z Google
              </button>

              <p className="mt-6 text-center text-xs leading-relaxed" style={{ color: "oklch(40% 0.06 240)" }}>
                {isLogin ? (
                  <>Nie masz konta?{" "}
                    <button onClick={() => switchMode("register")} className="font-semibold" style={{ color: "oklch(22% 0.24 270)" }}>
                      Utwórz je za darmo
                    </button>
                  </>
                ) : (
                  <>Zakładając konto, akceptujesz nasz{" "}
                    <a href="/terms" className="font-semibold" style={{ color: "oklch(22% 0.24 270)" }}>regulamin</a>{" "}
                    i{" "}
                    <a href="/privacy" className="font-semibold" style={{ color: "oklch(22% 0.24 270)" }}>politykę prywatności</a>.
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
