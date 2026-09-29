import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Szyfrowanie sekretów integracji, które musimy umieć ODCZYTAĆ (klucz API
 * operatora płatności), więc skrót jak przy tokenie Furgonetki nie wystarczy.
 *
 * AES-256-GCM, klucz spoza bazy: `INTEGRATIONS_ENCRYPTION_KEY` (32 bajty w
 * base64, np. `openssl rand -base64 32`). Wyciek samej bazy nie daje wtedy
 * kluczy do cudzych kont w Tpay.
 *
 * Format: `v1:<iv>:<tag>:<szyfrogram>`, części w base64url.
 */

const VERSION = "v1";

function key(): Buffer {
  const raw = process.env.INTEGRATIONS_ENCRYPTION_KEY;
  if (!raw) throw new Error("INTEGRATIONS_ENCRYPTION_KEY is not set");
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("INTEGRATIONS_ENCRYPTION_KEY must be 32 bytes (base64)");
  return buf;
}

export function secretBoxConfigured(): boolean {
  try {
    key();
    return true;
  } catch {
    return false;
  }
}

export function sealSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), data.toString("base64url")].join(":");
}

export function openSecret(sealed: string): string {
  const [version, iv, tag, data] = sealed.split(":");
  if (version !== VERSION || !iv || !tag || !data) throw new Error("Unsupported sealed secret format");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
}
