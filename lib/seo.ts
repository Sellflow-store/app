import { headers } from "next/headers";

/**
 * Bezwzględny adres strony sklepu — potrzebny w mapie witryny, pliku dla
 * robotów i danych strukturalnych, gdzie ścieżka względna nic nie znaczy.
 *
 * Host bierzemy z żądania, bo ten sam sklep bywa serwowany pod trzema
 * adresami: subdomeną, własną domeną klienta i ścieżką na domenie aplikacji.
 * Proxy przepisuje wszystkie trzy na tę samą trasę, więc kanoniczny jest ten
 * host, pod którym klient faktycznie wszedł.
 */
export async function shopOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Skleja bezwzględny adres z originu, bazy storefrontu i ścieżki. */
export function absoluteUrl(origin: string, base: string, path = ""): string {
  return `${origin}${base}${path}`;
}

/**
 * Wstawka `<script type="application/ld+json">`. Dane idą przez JSON.stringify,
 * a `<` w treści uciekamy — inaczej opis produktu ze znakiem mniejszości mógłby
 * zamknąć znacznik skryptu.
 */
export function jsonLdProps(data: unknown) {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(data).replace(/</g, "\\u003c"),
    },
  } as const;
}
