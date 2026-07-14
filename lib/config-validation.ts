// Server-side validation for the generic shop_config PATCH. That endpoint takes
// an arbitrary { key, value } scoped to the caller's shop; without this a
// merchant could write unknown keys, stuff megabytes into one row, or set
// values that later reach an injection sink on their storefront (branding
// colors → inline <style>, pixel IDs → inline <script>). We allowlist the key,
// cap the serialized size, and scrub the two keys whose values hit a sink.

export const CONFIG_KEYS = new Set([
  "branding", "home", "menu", "about", "faq", "terms", "privacy",
  "checkout", "delivery", "popup", "newsletter", "integrations",
  "brand", "account", "compliance", "footer",
]);

// 256 KB serialized — generous for the biggest blobs (legal text, home config)
// but stops a single row from ballooning.
export const MAX_CONFIG_BYTES = 256 * 1024;

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const RGB_HSL = /^(rgb|hsl)a?\([0-9.,%\s/]+\)$/i;
const FONT = /^[\w \-]{1,64}$/;

export function isSafeColor(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const s = v.trim();
  return HEX.test(s) || RGB_HSL.test(s);
}

export function safeColor(v: unknown, fallback: string): string {
  return isSafeColor(v) ? v.trim() : fallback;
}

export function safeFont(v: unknown, fallback: string): string {
  return typeof v === "string" && FONT.test(v.trim()) ? v.trim() : fallback;
}

/** Pixel / tag IDs: keep only the character classes real IDs use. */
export function safeTrackingId(v: unknown): string {
  return typeof v === "string" ? v.trim().replace(/[^\w.\-]/g, "").slice(0, 64) : "";
}

/** Radius scale (px) — reaches an inline <style> via BrandTheme, so coerce to
 *  clamped integers. Returns null when the shape is invalid (caller drops it). */
export function safeRadius(
  v: unknown,
): { input: number; card: number; button: number } | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const n = (x: unknown) =>
    typeof x === "number" && Number.isFinite(x)
      ? Math.max(0, Math.min(9999, Math.round(x)))
      : null;
  const input = n(o.input);
  const card = n(o.card);
  const button = n(o.button);
  if (input === null || card === null || button === null) return null;
  return { input, card, button };
}

/** Link social: ląduje w href na storefroncie, więc przepuszczamy wyłącznie
 *  http(s). Inaczej `javascript:` w polu formularza dałoby XSS na sklepie. */
export function safeUrl(v: unknown): string {
  if (typeof v !== "string") return "";
  const s = v.trim();
  if (!s) return "";
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.toString().slice(0, 300);
  } catch {
    return "";
  }
}

/** Scrub the values whose key feeds an HTML/CSS/JS sink on the storefront. */
export function scrubConfigValue(key: string, value: Record<string, unknown>): Record<string, unknown> {
  if (key === "branding") {
    const v = { ...value };
    if ("primaryColor" in v) v.primaryColor = safeColor(v.primaryColor, "#0c0c0c");
    if ("accentColor" in v) v.accentColor = safeColor(v.accentColor, "#db00b2");
    if ("secondaryColor" in v && v.secondaryColor) v.secondaryColor = safeColor(v.secondaryColor, "");
    if ("paperColor" in v && v.paperColor) v.paperColor = safeColor(v.paperColor, "");
    if ("fontFamily" in v && v.fontFamily) v.fontFamily = safeFont(v.fontFamily, "Space Grotesk");
    if ("bodyFontFamily" in v && v.bodyFontFamily) v.bodyFontFamily = safeFont(v.bodyFontFamily, "Inter Tight");
    if ("radius" in v) {
      const r = safeRadius(v.radius);
      if (r) v.radius = r;
      else delete v.radius;
    }
    return v;
  }
  if (key === "footer") {
    const v = { ...value };
    if ("social" in v && v.social && typeof v.social === "object") {
      const s = v.social as Record<string, unknown>;
      v.social = Object.fromEntries(Object.keys(s).map((k) => [k, safeUrl(s[k])]));
    }
    if ("description" in v) {
      v.description = typeof v.description === "string" ? v.description.slice(0, 300) : "";
    }
    return v;
  }
  if (key === "integrations") {
    const v = { ...value };
    for (const k of ["gtmId", "ga4Id", "metaPixelId", "tiktokPixelId", "googleMerchantId"]) {
      if (k in v && v[k]) v[k] = safeTrackingId(v[k]);
    }
    return v;
  }
  return value;
}
