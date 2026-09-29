/**
 * Wygląd statusów zamówienia i etykiety metod płatności — wspólne dla
 * komponentów klienckich (lista, szczegóły) i serwerowych (Pulpit).
 * Bez "use client": import z pliku klienckiego do komponentu serwerowego daje
 * referencję kliencką zamiast obiektu i wywraca render.
 */

export const STATUS_STYLES: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  pending:    { label: "Nowe",         bg: "oklch(95% 0.08 260)", color: "oklch(35% 0.20 260)", dot: "var(--panel-accent)" },
  processing: { label: "W realizacji", bg: "oklch(95% 0.09 85)",  color: "oklch(40% 0.14 75)",  dot: "var(--panel-warning)" },
  shipped:    { label: "Wysłane",      bg: "oklch(94% 0.10 195)", color: "oklch(35% 0.18 195)", dot: "var(--panel-aqua)" },
  delivered:  { label: "Dostarczone",  bg: "oklch(93% 0.08 145)", color: "oklch(30% 0.16 145)", dot: "var(--panel-success)" },
  cancelled:  { label: "Anulowane",    bg: "oklch(95% 0.05 20)",  color: "oklch(40% 0.18 20)",  dot: "var(--panel-ink-faint)" },
};

export const PAYMENT_LABELS: Record<string, string> = {
  transfer: "przelew",
  cod: "pobranie",
  online: "online (Tpay)",
};

