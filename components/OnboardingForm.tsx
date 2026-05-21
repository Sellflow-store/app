"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Store, Check } from "lucide-react";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

function slugError(slug: string): string | null {
  if (slug.length < 3) return "Min. 3 znaki.";
  if (!SLUG_RE.test(slug)) return "Tylko małe litery, cyfry i myślniki.";
  return null;
}

interface Props {
  firstName: string;
}

export default function OnboardingForm({ firstName }: Props) {
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [slug, setSlug]         = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // Auto-generate slug from shop name unless user manually edited it
  useEffect(() => {
    if (!slugEdited) setSlug(toSlug(shopName));
  }, [shopName, slugEdited]);

  function handleSlugChange(val: string) {
    setSlugEdited(true);
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 50));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = slugError(slug);
    if (err) { setError(err); return; }
    if (!shopName.trim()) { setError("Podaj nazwę sklepu."); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName, slug }),
      });
      const data = await res.json() as { shopSlug?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Wystąpił błąd. Spróbuj ponownie.");
        return;
      }
      router.push(`/dashboard/${data.shopSlug}/orders`);
    } catch {
      setError("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }

  const slugValid = !slugError(slug) && slug.length >= 3;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: "oklch(99% 0.005 250)", fontFamily: "var(--font-body)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-12">
        <svg viewBox="0 0 100 100" className="w-9 h-9 shrink-0">
          <rect width="100" height="100" rx="18" ry="18" fill="#12128c" />
          <text x="50" y="76" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="74" textAnchor="middle" fill="#fff">S</text>
        </svg>
        <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}>
          Sellflow
        </span>
      </div>

      <div className="w-full max-w-[480px]">
        {/* Progress dots */}
        <div className="flex items-center gap-2 justify-center mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i === 0 ? "24px" : "8px",
                height: "8px",
                background: i === 0 ? "oklch(56% 0.30 335)" : "oklch(88% 0 0)",
              }}
            />
          ))}
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8"
          style={{ background: "#fff", border: "1px solid oklch(91% 0.010 250)", boxShadow: "0 4px 24px oklch(22% 0.24 270 / 0.06)" }}
        >
          {/* Icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: "oklch(22% 0.24 270 / 0.08)" }}
          >
            <Store className="w-7 h-7" style={{ color: "oklch(22% 0.24 270)" }} strokeWidth={1.5} />
          </div>

          <h1
            className="text-2xl font-bold tracking-tight mb-1"
            style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
          >
            {firstName ? `Cześć, ${firstName}!` : "Witaj w Sellflow!"}
          </h1>
          <p className="text-sm mb-7" style={{ color: "oklch(45% 0.04 240)" }}>
            Podaj nazwę sklepu — resztę skonfigurujemy w panelu.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Shop name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold" style={{ color: "oklch(25% 0.06 270)" }}>
                Nazwa sklepu
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="np. Butik Ania, TechGadżety, EkoKoszyki"
                required
                autoFocus
                disabled={loading}
                className="w-full text-sm focus:outline-none transition-all disabled:opacity-50"
                style={{
                  padding: "13px 14px",
                  border: "1.5px solid oklch(88% 0 0)",
                  borderRadius: "12px",
                  background: "#fff",
                  color: "oklch(11% 0.10 275)",
                  fontFamily: "var(--font-body)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
                onBlur={(e) =>  (e.target.style.borderColor = "oklch(88% 0 0)")}
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold" style={{ color: "oklch(25% 0.06 270)" }}>
                Adres sklepu
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="moj-sklep"
                  required
                  disabled={loading}
                  className="w-full text-sm focus:outline-none transition-all disabled:opacity-50"
                  style={{
                    padding: "13px 40px 13px 14px",
                    border: `1.5px solid ${slug && slugValid ? "oklch(52% 0.20 158)" : "oklch(88% 0 0)"}`,
                    borderRadius: "12px",
                    background: "#fff",
                    color: "oklch(11% 0.10 275)",
                    fontFamily: "var(--font-body)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = slugValid ? "oklch(52% 0.20 158)" : "oklch(22% 0.24 270)")}
                  onBlur={(e) =>  (e.target.style.borderColor = slug && slugValid ? "oklch(52% 0.20 158)" : "oklch(88% 0 0)")}
                />
                {slug && slugValid && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "oklch(52% 0.20 158)" }} strokeWidth={2.5} />
                )}
              </div>

              {/* URL preview */}
              {slug && (
                <p className="text-[11px]" style={{ color: "oklch(50% 0 0)" }}>
                  Twój sklep:{" "}
                  <span className="font-semibold" style={{ color: slugValid ? "oklch(22% 0.24 270)" : "oklch(50% 0.18 20)" }}>
                    {slug}.sellflow.app
                  </span>
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <p
                className="text-xs font-medium px-3 py-2.5 rounded-xl"
                style={{ background: "oklch(97% 0.012 20)", color: "oklch(42% 0.20 20)", border: "1px solid oklch(90% 0.03 20)" }}
              >
                {error}
              </p>
            )}

            {/* CTA */}
            <button
              type="submit"
              disabled={loading || !shopName.trim() || !slugValid}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold transition-all disabled:opacity-50"
              style={{
                padding: "14px 22px",
                borderRadius: "999px",
                background: "oklch(56% 0.30 335)",
                color: "#fff",
                marginTop: "4px",
              }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "oklch(46% 0.25 333)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "oklch(56% 0.30 335)"; }}
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>Stwórz sklep <ArrowRight className="w-4 h-4" strokeWidth={2} /></>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "oklch(55% 0 0)" }}>
          Nazwę i adres możesz zmienić później w ustawieniach.
        </p>
      </div>
    </div>
  );
}
