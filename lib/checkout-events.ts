// Shared between the beacon (client) and the endpoint that stores it.

export type CheckoutEvent = "checkout_view" | "code_expand" | "code_applied" | "code_rejected";

/** Allowed detail values per event; anything else is stored as null. */
export const CHECKOUT_EVENT_DETAILS: Record<CheckoutEvent, readonly string[]> = {
  checkout_view: [],
  code_expand: ["cart", "checkout"],
  code_applied: ["link", "manual", "offer_public", "offer_newsletter"],
  code_rejected: ["not_found", "expired", "limit", "other"],
};

/** Map the discount validator's reason text to a stable bucket. */
export function rejectionBucket(reason: string | undefined): string {
  const r = (reason ?? "").toLowerCase();
  if (r.includes("wygasł")) return "expired";
  if (r.includes("limit")) return "limit";
  if (r.includes("nie istnieje") || r.includes("nieaktywny")) return "not_found";
  return "other";
}

/** Fire-and-forget beacon. Never throws, never blocks the UI. */
export function trackCheckoutEvent(shopSlug: string, event: CheckoutEvent, detail?: string) {
  if (typeof window === "undefined") return;
  fetch(`/api/shops/${shopSlug}/checkout-events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, detail: detail ?? null }),
    keepalive: true,
  }).catch(() => {});
}
