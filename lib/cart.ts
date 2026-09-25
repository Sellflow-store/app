"use client";

import { useCallback, useSyncExternalStore } from "react";

export interface CartItem {
  productId: string;
  /** Adres produktu do linków z koszyka. Stare koszyki go nie mają — wtedy
   *  linkujemy identyfikatorem, a strona produktu przekieruje. */
  slug?: string;
  name: string;
  price: string; // "129.99" — display only; checkout recomputes from DB
  image: string | null;
  qty: number;
  /** Wybrany rozmiar. undefined/null = produkt bez rozmiarów (i stare koszyki). */
  size?: string | null;
  stock?: number | null; // null/undefined = nieograniczony; cap ilości w koszyku
  type?: "physical" | "digital" | "service"; // undefined = physical (legacy)
}

/**
 * Tożsamość POZYCJI koszyka, nie produktu: ten sam model w dwóch rozmiarach to
 * dwie osobne linie. Samo `productId` nie wystarcza — inaczej dodanie M/L do
 * koszyka z S/M tylko zwiększałoby ilość przy złym rozmiarze.
 */
export function lineKey(item: Pick<CartItem, "productId" | "size">): string {
  return `${item.productId}\u0000${item.size ?? ""}`;
}

const EMPTY: CartItem[] = [];
const PREFIX = "sf-cart-";
// Parsed-snapshot cache — useSyncExternalStore needs referentially stable
// snapshots between changes, so we can't JSON.parse on every read.
const cache = new Map<string, CartItem[]>();
const listeners = new Set<() => void>();

const storageKey = (slug: string) => `${PREFIX}${slug}`;

function read(slug: string): CartItem[] {
  if (typeof window === "undefined") return EMPTY;
  const cached = cache.get(slug);
  if (cached) return cached;
  let items: CartItem[] = EMPTY;
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) items = parsed;
  } catch {
    // corrupted entry — treat as empty
  }
  cache.set(slug, items);
  return items;
}

function write(slug: string, items: CartItem[]) {
  cache.set(slug, items);
  try {
    window.localStorage.setItem(storageKey(slug), JSON.stringify(items));
  } catch {
    // storage full/blocked — cart still works in-memory for this tab
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  // Cross-tab sync: another tab wrote the cart → drop cache, re-read
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith(PREFIX)) {
      cache.delete(e.key.slice(PREFIX.length));
      notify();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", onStorage);
  };
}

export function formatPln(amount: number): string {
  return `${amount.toFixed(2).replace(".", ",")} zł`;
}

export function useCart(shopSlug: string) {
  const items = useSyncExternalStore(
    subscribe,
    () => read(shopSlug),
    () => EMPTY
  );

  // Górny limit ilości: 99, a gdy produkt śledzi stan — nie więcej niż na stanie.
  const capFor = (stock: number | null | undefined) =>
    stock == null ? 99 : Math.max(0, Math.min(99, stock));

  const add = useCallback(
    (item: Omit<CartItem, "qty">, qty = 1) => {
      const current = read(shopSlug);
      const key = lineKey(item);
      const existing = current.find((i) => lineKey(i) === key);
      const cap = capFor(item.stock);
      const next = existing
        ? current.map((i) =>
            lineKey(i) === key
              ? { ...i, stock: item.stock, qty: Math.min(capFor(item.stock), i.qty + qty) }
              : i
          )
        : [...current, { ...item, qty: Math.min(cap, Math.max(1, qty)) }];
      write(shopSlug, next);
    },
    [shopSlug]
  );

  const setQty = useCallback(
    (key: string, qty: number) => {
      const current = read(shopSlug);
      const next =
        qty <= 0
          ? current.filter((i) => lineKey(i) !== key)
          : current.map((i) =>
              lineKey(i) === key ? { ...i, qty: Math.min(capFor(i.stock), qty) } : i
            );
      write(shopSlug, next);
    },
    [shopSlug]
  );

  const remove = useCallback(
    (key: string) => {
      write(shopSlug, read(shopSlug).filter((i) => lineKey(i) !== key));
    },
    [shopSlug]
  );

  const clear = useCallback(() => write(shopSlug, []), [shopSlug]);

  const count = items.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.price) * i.qty, 0);

  return { items, add, setQty, remove, clear, count, subtotal };
}

// ── Kod rabatowy przypięty do koszyka ──────────────────────────────────────
// Żyje obok pozycji koszyka (ten sam sklep, ta sama przeglądarka), więc kod
// z linku (?kod=…) albo wpisany w koszyku przetrwa przejście do zamówienia,
// odświeżenie strony i drugą kartę. Serwer i tak sprawdza go przy zamówieniu.

/** Skąd kod się wziął — do pomiaru, które źródło faktycznie działa. */
export type DiscountSource = "link" | "manual" | "offer_public" | "offer_newsletter";

export interface CartDiscount {
  code: string;
  percent: number;
  source: DiscountSource;
}

const DISCOUNT_PREFIX = "sf-discount-";
const discountCache = new Map<string, CartDiscount | null>();
const discountListeners = new Set<() => void>();

function readDiscount(slug: string): CartDiscount | null {
  if (typeof window === "undefined") return null;
  if (discountCache.has(slug)) return discountCache.get(slug)!;
  let d: CartDiscount | null = null;
  try {
    const raw = window.localStorage.getItem(`${DISCOUNT_PREFIX}${slug}`);
    const parsed = raw ? (JSON.parse(raw) as Partial<CartDiscount>) : null;
    if (parsed && typeof parsed.code === "string" && typeof parsed.percent === "number") {
      d = { code: parsed.code, percent: parsed.percent, source: parsed.source ?? "manual" };
    }
  } catch {
    // corrupted entry — no discount
  }
  discountCache.set(slug, d);
  return d;
}

function writeDiscount(slug: string, d: CartDiscount | null) {
  discountCache.set(slug, d);
  try {
    if (d) window.localStorage.setItem(`${DISCOUNT_PREFIX}${slug}`, JSON.stringify(d));
    else window.localStorage.removeItem(`${DISCOUNT_PREFIX}${slug}`);
  } catch {
    // storage blocked — the code still works in this tab
  }
  discountListeners.forEach((notify) => notify());
}

function subscribeDiscount(notify: () => void) {
  discountListeners.add(notify);
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith(DISCOUNT_PREFIX)) {
      discountCache.delete(e.key.slice(DISCOUNT_PREFIX.length));
      notify();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    discountListeners.delete(notify);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCartDiscount(shopSlug: string) {
  const discount = useSyncExternalStore(
    subscribeDiscount,
    () => readDiscount(shopSlug),
    () => null,
  );
  const setDiscount = useCallback((d: CartDiscount | null) => writeDiscount(shopSlug, d), [shopSlug]);
  return { discount, setDiscount };
}

/** Kwota rabatu liczona tak samo jak na serwerze (orders/route.ts), co do grosza. */
export function discountValue(subtotal: number, percent: number): number {
  return Math.round(subtotal * percent) / 100;
}
