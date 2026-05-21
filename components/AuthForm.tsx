"use client";

import { useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

// Sellflow logo — "S" on navy square (matches favicon.svg)
function SellflowLogo() {
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 100 100" className="w-9 h-9 shrink-0" aria-hidden="true">
        <rect width="100" height="100" rx="18" ry="18" fill="#12128c" />
        <text
          x="50" y="76"
          fontFamily="Arial Black,Arial,sans-serif"
          fontWeight="900"
          fontSize="74"
          textAnchor="middle"
          fill="#ffffff"
        >
          S
        </text>
      </svg>
      <span
        className="text-2xl font-bold tracking-tight"
        style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
      >
        Sellflow
      </span>
    </div>
  );
}

type Mode = "login" | "register";

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>("register");
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const isLogin = mode === "login";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire to Clerk
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* ── LEFT PANEL — branding ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "oklch(22% 0.24 270)" }}
      >
        {/* Subtle noise/grain texture via SVG filter */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]" aria-hidden="true">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>

        {/* Aqua glow */}
        <div
          className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, oklch(80% 0.16 195 / 0.12) 0%, transparent 70%)" }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 100 100" className="w-10 h-10 shrink-0">
              <rect width="100" height="100" rx="18" ry="18" fill="#ffffff" fillOpacity="0.12" />
              <text x="50" y="76" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="74" textAnchor="middle" fill="#ffffff">S</text>
            </svg>
            <span className="text-2xl font-bold tracking-tight text-white" style={{ fontFamily: "var(--font-display)" }}>
              Sellflow
            </span>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-6">
          <p
            className="text-xs font-semibold tracking-[0.15em] uppercase"
            style={{ color: "oklch(80% 0.16 195)" }}
          >
            E-commerce dla mikro i małych sprzedawców
          </p>
          <h1
            className="text-4xl xl:text-5xl font-bold leading-[1.1] tracking-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Twój sklep
            <br />
            bez chaosu,
            <br />
            <span style={{ color: "oklch(56% 0.30 335)" }}>w przerwie na kawę.</span>
          </h1>
          <p className="text-base leading-relaxed max-w-sm" style={{ color: "oklch(80% 0.16 195 / 0.8)" }}>
            Stwórz konto, uzupełnij dane sklepu i zacznij sprzedawać. Zero wtyczek, zero technikaliów.
          </p>
        </div>

        {/* Social proof */}
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

      {/* ── RIGHT PANEL — form ────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto"
        style={{ background: "oklch(99% 0.005 250)" }}
      >
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <SellflowLogo />
        </div>

        <div className="w-full max-w-[400px]">
          {/* Tab switcher */}
          <div
            className="flex rounded-xl p-1 mb-8"
            style={{ background: "oklch(97% 0.008 250)" }}
          >
            {(["register", "login"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all"
                style={
                  mode === m
                    ? {
                        background: "oklch(22% 0.24 270)",
                        color: "#ffffff",
                        boxShadow: "0 1px 4px oklch(22% 0.24 270 / 0.3)",
                      }
                    : { color: "oklch(40% 0.06 240)" }
                }
              >
                {m === "register" ? "Utwórz konto" : "Zaloguj się"}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
            >
              {isLogin ? "Witaj z powrotem" : "Zacznij sprzedawać"}
            </h2>
            <p className="text-sm mt-1" style={{ color: "oklch(40% 0.06 240)" }}>
              {isLogin
                ? "Zaloguj się, aby zarządzać swoim sklepem."
                : "Załóż konto i skonfiguruj sklep w kilka minut."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Field
                label="Twoje imię"
                type="text"
                value={name}
                onChange={setName}
                placeholder="np. Marta Kowalska"
                autoComplete="name"
              />
            )}

            <Field
              label="Adres e-mail"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="marta@twojsklep.pl"
              autoComplete="email"
            />

            <div className="space-y-1">
              <label className="block text-xs font-semibold" style={{ color: "oklch(11% 0.10 275)" }}>
                Hasło
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? "Twoje hasło" : "Min. 8 znaków"}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  className="w-full pr-10 text-sm focus:outline-none transition-all"
                  style={{
                    padding: "12px 44px 12px 14px",
                    border: "1.5px solid oklch(91% 0.020 230)",
                    borderRadius: "12px",
                    background: "#fff",
                    color: "oklch(11% 0.10 275)",
                    fontFamily: "var(--font-body)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
                  onBlur={(e) => (e.target.style.borderColor = "oklch(91% 0.020 230)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "oklch(40% 0.06 240)" }}
                >
                  {showPass
                    ? <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                    : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="text-right">
                <button type="button" className="text-xs font-semibold" style={{ color: "oklch(22% 0.24 270)" }}>
                  Nie pamiętam hasła
                </button>
              </div>
            )}

            {/* CTA */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold transition-all group"
              style={{
                padding: "14px 22px",
                borderRadius: "999px",
                background: "oklch(56% 0.30 335)",
                color: "#ffffff",
                marginTop: "8px",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.background = "oklch(46% 0.25 333)")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.background = "oklch(56% 0.30 335)")}
            >
              {isLogin ? "Zaloguj się" : "Stwórz konto i sklep"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: "oklch(91% 0.020 230)" }} />
            <span className="text-xs" style={{ color: "oklch(40% 0.06 240)" }}>lub kontynuuj przez</span>
            <div className="flex-1 h-px" style={{ background: "oklch(91% 0.020 230)" }} />
          </div>

          {/* Google SSO */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2.5 text-sm font-semibold transition-all"
            style={{
              padding: "12px 22px",
              borderRadius: "999px",
              border: "1.5px solid oklch(91% 0.020 230)",
              background: "#fff",
              color: "oklch(11% 0.10 275)",
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.borderColor = "oklch(22% 0.24 270)")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.borderColor = "oklch(91% 0.020 230)")}
          >
            <svg viewBox="0 0 48 48" className="w-4 h-4">
              <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 29.8 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.4-4h.2z" />
              <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.4 19.1 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.7 0-14.3 4.5-17.7 11.7z" />
              <path fill="#FBBC05" d="M24 43c5.6 0 10.6-1.9 14.5-5.1l-6.7-5.5C29.8 34.3 27 35 24 35c-5.7 0-10.6-3.2-13-7.9l-7 5.4C7.7 38.5 15.4 43 24 43z" />
              <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.6 2.8-2.2 5.2-4.5 6.9l6.7 5.5C41.8 37.4 44.5 31 44.5 24c0-1.3-.1-2.7-.4-4h.4z" />
            </svg>
            Kontynuuj z Google
          </button>

          {/* Footer note */}
          <p className="mt-6 text-center text-xs leading-relaxed" style={{ color: "oklch(40% 0.06 240)" }}>
            {isLogin ? (
              <>Nie masz konta?{" "}
                <button onClick={() => setMode("register")} className="font-semibold" style={{ color: "oklch(22% 0.24 270)" }}>
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
        </div>
      </div>
    </div>
  );
}

// ── Reusable field ────────────────────────────────────────────────────────────

function Field({
  label, type, value, onChange, placeholder, autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
}) {
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
        required
        className="w-full text-sm focus:outline-none transition-all"
        style={{
          padding: "12px 14px",
          border: "1.5px solid oklch(91% 0.020 230)",
          borderRadius: "12px",
          background: "#fff",
          color: "oklch(11% 0.10 275)",
          fontFamily: "var(--font-body)",
        }}
        onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
        onBlur={(e) => (e.target.style.borderColor = "oklch(91% 0.020 230)")}
      />
    </div>
  );
}
