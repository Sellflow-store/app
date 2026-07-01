"use client";

import { useState, useSyncExternalStore } from "react";
import Script from "next/script";
import type { IntegrationsConfig, ComplianceConfig } from "@/types/shop";

const CONSENT_KEY = "sellflow-consent";

interface Consent {
  analytics: boolean;
  marketing: boolean;
}

// ── localStorage-backed consent store (useSyncExternalStore, SSR-safe) ──────
const consentListeners = new Set<() => void>();
let consentCache: { raw: string | null; val: Consent | null } = { raw: null, val: null };

function readStoredConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
  if (raw === consentCache.raw) return consentCache.val; // stable reference
  let val: Consent | null = null;
  try {
    val = raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    val = null;
  }
  consentCache = { raw, val };
  return val;
}

function writeStoredConsent(c: Consent) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...c, ts: Date.now() }));
  } catch {
    /* ignore */
  }
  consentCache = { raw: null, val: null }; // force re-read on next snapshot
  consentListeners.forEach((n) => n());
}

function subscribeConsent(notify: () => void) {
  consentListeners.add(notify);
  return () => consentListeners.delete(notify);
}

/**
 * Loads merchant-configured pixels/tags on the storefront, but only after the
 * visitor has consented to the matching category (RODO). Also renders the
 * cookie-consent banner. Analytics = GTM + GA4; Marketing = Meta + TikTok.
 * If the merchant turned the banner off, pixels load unconditionally.
 */
export default function StorefrontScripts({
  integrations,
  compliance,
}: {
  integrations: IntegrationsConfig;
  compliance: ComplianceConfig;
}) {
  const banner = compliance.cookieBanner;
  const stored = useSyncExternalStore(subscribeConsent, readStoredConsent, () => null);

  // If the merchant disabled the banner, pixels load unconditionally.
  const consent: Consent | null = banner.enabled ? stored : { analytics: true, marketing: true };
  const decided = !banner.enabled || stored !== null;

  // Sanitize IDs before they land in inline <Script> template literals: keep
  // only the characters real pixel/tag IDs use. Defense in depth — the config
  // PATCH scrubs these on write, but merchant text must never reach JS raw.
  const sanId = (v: string | undefined) => (v ? v.replace(/[^\w.\-]/g, "").slice(0, 64) : "");
  const gtmId = sanId(integrations.gtmId);
  const ga4Id = sanId(integrations.ga4Id);
  const metaPixelId = sanId(integrations.metaPixelId);
  const tiktokPixelId = sanId(integrations.tiktokPixelId);

  const analyticsOn = consent?.analytics && (gtmId || ga4Id);
  const marketingOn = consent?.marketing && (metaPixelId || tiktokPixelId);

  return (
    <>
      {/* ── Analytics ─────────────────────────────────────────── */}
      {analyticsOn && gtmId && (
        <Script id="sf-gtm" strategy="afterInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
          var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
          j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');
        `}</Script>
      )}
      {analyticsOn && ga4Id && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
          <Script id="sf-ga4" strategy="afterInteractive">{`
            window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
            gtag('js',new Date());gtag('config','${ga4Id}');
          `}</Script>
        </>
      )}

      {/* ── Marketing ─────────────────────────────────────────── */}
      {marketingOn && metaPixelId && (
        <Script id="sf-meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init','${metaPixelId}');fbq('track','PageView');
        `}</Script>
      )}
      {marketingOn && tiktokPixelId && (
        <Script id="sf-tiktok-pixel" strategy="afterInteractive">{`
          !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
          ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
          ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
          for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
          ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
          ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};
          var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=r+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
          ttq.load('${tiktokPixelId}');ttq.page();}(window,document,'ttq');
        `}</Script>
      )}

      {/* ── Consent banner ────────────────────────────────────── */}
      {banner.enabled && !decided && (
        <ConsentBanner banner={banner} onDecide={writeStoredConsent} />
      )}
    </>
  );
}

function ConsentBanner({
  banner,
  onDecide,
}: {
  banner: ComplianceConfig["cookieBanner"];
  onDecide: (c: Consent) => void;
}) {
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);
  const [customize, setCustomize] = useState(false);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[9999] p-4 sm:p-5"
      style={{ background: "var(--brand-ink, #171717)", color: "var(--brand-on-ink, #fff)" }}
      role="dialog"
      aria-label="Zgoda na pliki cookie"
    >
      <div className="mx-auto max-w-5xl flex flex-col gap-3">
        <p className="text-sm leading-relaxed opacity-90">
          {banner.message}{" "}
          {banner.policyUrl && (
            <a href={banner.policyUrl} className="underline underline-offset-2">
              Polityka prywatności
            </a>
          )}
        </p>

        {customize && (
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2 opacity-60">
              <input type="checkbox" checked disabled /> Niezbędne (zawsze aktywne)
            </label>
            {banner.analytics && (
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} /> Analityka
              </label>
            )}
            {banner.marketing && (
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} /> Marketing
              </label>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onDecide({ analytics: banner.analytics, marketing: banner.marketing })}
            className="text-sm font-semibold px-4 py-2 rounded-full"
            style={{ background: "var(--brand-accent, #d6249f)", color: "var(--brand-on-accent, #fff)" }}
          >
            Akceptuję wszystkie
          </button>
          {customize ? (
            <button
              onClick={() => onDecide({ analytics: banner.analytics && analytics, marketing: banner.marketing && marketing })}
              className="text-sm font-semibold px-4 py-2 rounded-full border border-white/30"
            >
              Zapisz wybór
            </button>
          ) : (
            <button
              onClick={() => setCustomize(true)}
              className="text-sm font-medium px-4 py-2 rounded-full border border-white/30"
            >
              Dostosuj
            </button>
          )}
          <button
            onClick={() => onDecide({ analytics: false, marketing: false })}
            className="text-sm font-medium px-4 py-2 rounded-full opacity-70 hover:opacity-100"
          >
            Tylko niezbędne
          </button>
        </div>
      </div>
    </div>
  );
}
