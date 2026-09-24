"use client";

import { useEffect } from "react";
import { readStoredConsent } from "./StorefrontScripts";

const VISITOR_KEY = "sf_vid";

/**
 * Fire-and-forget storefront visit beacon. Mounted once in the storefront
 * layout, so it records the entry into the shop (landing path + referrer),
 * which is what the dashboard's visits-by-source view counts: in-store clicks
 * are deliberately not separate rows, or every one would show up as a
 * "direct" visit.
 *
 * The anonymous visitor id (unique vs returning) lives in localStorage, which
 * under ePrivacy/RODO needs consent: it is read or created only when the
 * visitor accepted analytics, or when the merchant runs no consent banner
 * (the same rule StorefrontScripts applies to GA/GTM). Without it the visit
 * is still counted, just without an id.
 */
export default function TrackVisit({ slug, bannerEnabled }: { slug: string; bannerEnabled: boolean }) {
  useEffect(() => {
    let visitorId: string | null = null;
    try {
      const consent = bannerEnabled ? readStoredConsent() : { analytics: true, marketing: true };
      if (consent?.analytics) {
        visitorId = localStorage.getItem(VISITOR_KEY);
        if (!visitorId) {
          visitorId =
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          localStorage.setItem(VISITOR_KEY, visitorId);
        }
      } else if (consent && !consent.analytics) {
        // Declined: drop an id stored before consent was asked for.
        localStorage.removeItem(VISITOR_KEY);
      }
    } catch {
      // Private mode / storage blocked — track anonymously without an id.
    }

    const payload = JSON.stringify({
      path: window.location.pathname,
      referrer: document.referrer || null,
      visitorId,
    });

    // Prefer fetch+keepalive so it survives the page unloading right after.
    fetch(`/api/shops/${slug}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Analytics must never surface an error to the shopper.
    });
  }, [slug, bannerEnabled]);

  return null;
}
