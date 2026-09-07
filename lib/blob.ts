import { put } from "@vercel/blob";
import { createHash } from "crypto";

// Przeniesienie obrazu z data URI na Vercel Blob.
//
// Kreator sklepu niesie logo przez cały onboarding jako base64 (podgląd →
// sessionStorage → POST), bo w trakcie wypełniania kreatora użytkownik bywa
// jeszcze niezalogowany i nie ma czego chronić uploadem. Do BAZY logo w tej
// postaci trafiać już nie powinno: data URI w `shop_config` jest inline'owane
// w HTML każdej podstrony sklepu, w Next.js podwójnie (HTML + payload RSC).
// Zmierzone przypadki sprzed tej zmiany: 1,2 MB, 694 KB i 636 KB doklejane do
// każdego żądania. Dlatego POST /api/onboarding — już po zalogowaniu i po
// utworzeniu sklepu — przekłada obraz na Blob i zapisuje sam URL.
//
// Autoryzacja: na Vercelu `put()` uwierzytelnia się tokenem OIDC (`BLOB_STORE_ID`
// + `VERCEL_OIDC_TOKEN` wstrzykiwany przez runtime), więc nie potrzeba
// `BLOB_READ_WRITE_TOKEN` w env. Lokalnie, bez jednego i drugiego, upload po
// prostu się nie uda — i o to chodzi, żeby wołający miał fallback.

// [\s\S] zamiast flagi `s` — target projektu nie dopuszcza dotAll.
const DATA_URL_RE = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([\s\S]+)$/i;

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

/** 4 MB — ten sam limit co w /api/upload, spina się z limitem body funkcji. */
const MAX_BYTES = 4 * 1024 * 1024;

export function isDataUrl(value: unknown): value is string {
  return typeof value === "string" && DATA_URL_RE.test(value);
}

/** Data URI o typie MIME, który faktycznie umiemy wgrać jako obraz. */
export function isImageDataUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = value.match(DATA_URL_RE);
  return !!match && match[1].toLowerCase() in EXT;
}

/**
 * Wysyła obraz z data URI na Blob i zwraca publiczny URL.
 * Zwraca `null` przy każdym niepowodzeniu (zły format, za duży plik, brak
 * skonfigurowanego storage) — wołający decyduje, co wtedy, bo upload obrazu
 * nigdy nie powinien wywrócić operacji, przy której się dzieje.
 *
 * @param prefix ścieżka w store, bez nazwy pliku, np. `shops/{ownerId}`
 * @param label  człon nazwy pliku opisujący miejsce użycia, np. `branding-logo`
 */
export async function uploadDataUrl(
  dataUrl: string,
  prefix: string,
  label: string,
): Promise<string | null> {
  const match = dataUrl.match(DATA_URL_RE);
  if (!match) return null;

  const [, mime, base64] = match;
  const ext = EXT[mime.toLowerCase()];
  if (!ext) return null;

  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0 || buffer.length > MAX_BYTES) return null;

  // Nazwa z odcisku treści: ten sam plik wgrany drugi raz nadpisuje sam siebie
  // zamiast mnożyć kopie, a zmiana obrazu zawsze daje nowy URL (żaden CDN nie
  // poda starego z cache'u).
  const hash = createHash("sha1").update(buffer).digest("hex").slice(0, 10);
  const slug = label.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").toLowerCase();

  try {
    const blob = await put(`${prefix}/${slug}-${hash}.${ext}`, buffer, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: mime,
    });
    return blob.url;
  } catch {
    return null;
  }
}
