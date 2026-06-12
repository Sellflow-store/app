"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { useOnboarding } from "./state";
import { buildBootstrap, encodeBootstrap, makeSlug, slugifyName } from "@/lib/brand/bootstrap";
import type { StoreBootstrap } from "@/lib/brand/types";
import MiniPreview from "./MiniPreview";

/**
 * Step Preview: embeds /preview-shop (a no-DB storefront renderer) in an
 * iframe, branded with the current wizard state. Falls back to MiniPreview
 * after a 5s watchdog if the iframe never loads. The Save CTA below the
 * frame POSTs the same payload to /api/onboarding to persist the shop.
 */
export default function LivePreview() {
  const router = useRouter();
  const { state, markPreviewSeen } = useOnboarding();
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeFailed, setIframeFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Built once per Step Preview mount — fresh bootstrapId would otherwise
  // force needless iframe reloads on every parent render.
  const { url, previewSlug, payload, dbSlug, shopName } = useMemo(() => {
    const p: StoreBootstrap = buildBootstrap(state.business, state.brand);
    const sessionSlug = makeSlug(state.business.name);
    return {
      // Hash, not query — payload stays client-side, never hits Vercel/edge
      // URL limits (URI_TOO_LONG with full inferred catalogs + brand data).
      url: `/preview-shop#bootstrap=${encodeBootstrap(p)}`,
      previewSlug: sessionSlug,
      payload: p,
      dbSlug: slugifyName(p.store.name), // server slug — no shortid suffix needed before uniqueness check
      shopName: p.store.name,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watchdog: if iframe never loads (route missing, network blocked, etc),
  // drop to MiniPreview so the wizard still progresses and Save stays usable.
  useEffect(() => {
    const t = window.setTimeout(() => { if (!iframeLoaded) setIframeFailed(true); }, 5000);
    return () => window.clearTimeout(t);
  }, [iframeLoaded]);

  useEffect(() => {
    if (!iframeLoaded && !iframeFailed) return;
    const raf = requestAnimationFrame(() => markPreviewSeen());
    return () => cancelAnimationFrame(raf);
  }, [iframeLoaded, iframeFailed, markPreviewSeen]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName, slug: dbSlug, bootstrap: payload }),
      });
      const data = (await res.json()) as { shopSlug?: string; error?: string };
      if (!res.ok) {
        // 401: anonymous visitor — stash payload, send them to register.
        // /onboarding/save picks the payload back up after sign-up + auto-finalizes.
        if (res.status === 401) {
          sessionStorage.setItem(
            "sellflow_pending_onboarding",
            JSON.stringify({ shopName, slug: dbSlug, bootstrap: payload }),
          );
          router.push(`/register?redirect_url=${encodeURIComponent("/onboarding/save")}`);
          return;
        }
        setError(data.error ?? "Nie udało się zapisać sklepu.");
        return;
      }
      router.push(`/dashboard/${data.shopSlug}/orders`);
    } catch {
      setError("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto" style={{ maxWidth: 1180 }}>
      <p
        className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] mb-3"
        style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
      >
        Twój sklep · podgląd na żywo
      </p>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--brand-paper)",
          border: "1px solid var(--brand-rule)",
          boxShadow: "0 30px 80px -40px oklch(11% 0.10 275 / 0.35)",
        }}
      >
        <div
          className="flex items-center gap-1.5 px-3.5 py-2.5 text-[11px]"
          style={{
            borderBottom: "1px solid var(--brand-rule)",
            background: "var(--brand-paper-3)",
            color: "var(--brand-ink-2)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--brand-rule)" }} />
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--brand-rule)" }} />
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--brand-rule)" }} />
          <span className="ml-3">{previewSlug}.sell-flow.store</span>
        </div>
        {iframeFailed ? (
          <MiniPreview />
        ) : (
          <iframe
            src={url}
            title="Podgląd Twojego sklepu"
            onLoad={() => setIframeLoaded(true)}
            className="block w-full border-0"
            style={{ height: 720, background: "var(--brand-paper)" }}
          />
        )}
      </div>

      {/* Save CTA */}
      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
          style={{
            background: "var(--brand-accent)",
            color: "var(--brand-paper)",
            fontFamily: "var(--font-body)",
          }}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Tworzę sklep…
            </>
          ) : (
            <>
              Zapisz i otwórz sklep
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
        <p className="mt-3 text-xs" style={{ color: "var(--brand-ink-2)" }}>
          Twój adres:{" "}
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--brand-ink)" }}>
            {dbSlug}.sellflow.app
          </span>
        </p>
        {error && (
          <p
            role="alert"
            className="mt-4 text-sm"
            style={{ color: "var(--brand-magenta)" }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
