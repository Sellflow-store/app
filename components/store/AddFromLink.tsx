"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCart, type CartItem } from "@/lib/cart";

/**
 * Link „wrzuć do koszyka”: /koszyk?dodaj=slug, /koszyk?dodaj=slug:2:M,inny.
 * Asystent AI albo agent w przeglądarce może podać klientowi gotowy koszyk
 * zamiast instrukcji „wejdź, wybierz rozmiar, kliknij”. Produkty rozwiązuje
 * serwer (strona koszyka), tu tylko jednorazowo dopisujemy je do koszyka
 * i czyścimy parametr, żeby odświeżenie strony nie dodało ich drugi raz.
 */
export default function AddFromLink({
  shopSlug,
  items,
}: {
  shopSlug: string;
  items: (Omit<CartItem, "qty"> & { qty: number })[];
}) {
  const { add } = useCart(shopSlug);
  const router = useRouter();
  const pathname = usePathname();
  const done = useRef(false);

  useEffect(() => {
    if (done.current || items.length === 0) return;
    done.current = true;
    for (const { qty, ...item } of items) add(item, qty);
    router.replace(pathname);
  }, [items, add, router, pathname]);

  return null;
}
