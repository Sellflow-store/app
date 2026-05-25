import { fillBusinessDefaults, inferBrand, inferProducts } from "./inference";
import type { Brand, Business, StoreBootstrap } from "./types";

/**
 * Compose the full bootstrap payload the storefront + API need to render +
 * persist a shop. Pure — same inputs always produce the same shape (except
 * bootstrapId). Mirrors www's onboarding/src/ai/bootstrap.ts but drops the
 * Vite-era `account` block: Clerk auth replaces it in this stack.
 */
export function buildBootstrap(business: Business, brand: Brand): StoreBootstrap {
  const filled = fillBusinessDefaults(business);
  const inf = inferBrand(business, brand);
  const products = inferProducts(inf.category as Parameters<typeof inferProducts>[0]);

  return {
    version: 1,
    bootstrapId: crypto.randomUUID(),
    store: {
      name: inf.effective_name,
      sells: filled.sells,
      storyShort: filled.problem,
      logoDataUrl: filled.logoDataUrl,
      category: inf.category,
      audience: inf.audience,
      layout_type: inf.layout_type,
      hero_headline: inf.hero_headline,
      hero_sub: inf.hero_sub,
      products,
    },
    brand: {
      palette: { paper: inf.palette[0], ink: inf.palette[1], accent: inf.palette[2] },
      fonts: inf.font_pair,
      traits: brand.traits,
      tone: brand.tone,
    },
  };
}

// ─── Slug ────────────────────────────────────────────────────────────────

const SHORTID_KEY = "sellflow_onboarding_shortid";

/** Random 5-char base36 ID, stable per browser session so preview + handoff
 *  hit the same slug. New session = new ID. */
function getShortId(): string {
  if (typeof sessionStorage === "undefined") {
    return Math.random().toString(36).slice(2, 7).padEnd(5, "0");
  }
  const existing = sessionStorage.getItem(SHORTID_KEY);
  if (existing) return existing;
  const id = Math.random().toString(36).slice(2, 7).padEnd(5, "0");
  sessionStorage.setItem(SHORTID_KEY, id);
  return id;
}

/** Strip diacritics + Polish ł, lowercase, dash-separated. Matches existing
 *  OnboardingForm.toSlug so the two flows produce the same shapes. */
export function slugifyName(name: string): string {
  const cleaned = (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 32);
  return cleaned || "sklep";
}

/** Combined slug for the preview iframe + initial handoff. The /api/onboarding
 *  route still enforces uniqueness server-side and will rename if taken. */
export function makeSlug(name: string): string {
  return `${slugifyName(name)}-${getShortId()}`;
}

// ─── URL helpers ─────────────────────────────────────────────────────────

/** URL-safe base64 of the JSON payload. Decoded on the preview side. */
export function encodeBootstrap(payload: StoreBootstrap): string {
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeBootstrap(b64url: string): StoreBootstrap | null {
  try {
    const pad = (4 - (b64url.length % 4)) % 4;
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
    const json = decodeURIComponent(escape(atob(b64)));
    const payload = JSON.parse(json) as StoreBootstrap;
    return payload?.version === 1 ? payload : null;
  } catch {
    return null;
  }
}
