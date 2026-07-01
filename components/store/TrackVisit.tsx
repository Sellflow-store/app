"use client";

import { useEffect } from "react";

/**
 * Fire-and-forget storefront pageview beacon. Mounted once in the storefront
 * layout, it posts the current path + referrer to the public track endpoint on
 * mount. An anonymous visitor id (localStorage) lets the dashboard tell unique
 * from returning visitors without any PII.
 */
export default function TrackVisit({ slug }: { slug: string }) {
  useEffect(() => {
    let visitorId: string | null = null;
    try {
      visitorId = localStorage.getItem("sf_vid");
      if (!visitorId) {
        visitorId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem("sf_vid", visitorId);
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
  }, [slug]);

  return null;
}
