"use client";

import Link from "next/link";
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart, formatPln } from "@/lib/cart";

interface Props {
  shopSlug: string;
  freeShippingFrom: string;
}

export default function CartView({ shopSlug, freeShippingFrom }: Props) {
  const { items, setQty, remove, subtotal } = useCart(shopSlug);

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="mx-auto w-14 h-14 rounded-2xl border border-rule flex items-center justify-center mb-5">
          <ShoppingBag className="w-6 h-6 text-ink-2/60" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink mb-2">
          Twój koszyk jest pusty
        </h1>
        <p className="text-sm text-ink-2 font-light mb-8">
          Dodaj produkty, a pojawią się tutaj.
        </p>
        <Link
          href={`/${shopSlug}`}
          className="inline-flex items-center gap-2 bg-ink text-on-ink text-sm font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
        >
          Wróć do sklepu
        </Link>
      </div>
    );
  }

  const freeFrom = parseFloat(freeShippingFrom);
  const missingForFree =
    !isNaN(freeFrom) && freeFrom > 0 && subtotal < freeFrom ? freeFrom - subtotal : null;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-ink mb-8">Koszyk</h1>

      <div className="divide-y divide-rule border-y border-rule">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center gap-4 py-5">
            {/* Thumbnail */}
            <Link
              href={`/${shopSlug}/products/${item.productId}`}
              className="w-20 h-20 bg-paper-3 rounded-xl overflow-hidden shrink-0"
            >
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-2/50">
                  ✦
                </div>
              )}
            </Link>

            {/* Name + unit price */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/${shopSlug}/products/${item.productId}`}
                className="text-sm font-medium text-ink hover:opacity-70 transition-opacity line-clamp-2"
              >
                {item.name}
              </Link>
              <p className="text-xs text-ink-2/70 mt-1">{formatPln(parseFloat(item.price))} / szt.</p>
            </div>

            {/* Qty stepper */}
            <div className="flex items-center border border-rule rounded-full shrink-0">
              <button
                onClick={() => setQty(item.productId, item.qty - 1)}
                aria-label="Zmniejsz ilość"
                className="px-2.5 py-2 text-ink-2 hover:text-ink transition-colors"
              >
                <Minus className="w-3 h-3" strokeWidth={1.5} />
              </button>
              <span className="w-6 text-center text-xs font-medium text-ink tabular-nums">
                {item.qty}
              </span>
              <button
                onClick={() => setQty(item.productId, item.qty + 1)}
                aria-label="Zwiększ ilość"
                className="px-2.5 py-2 text-ink-2 hover:text-ink transition-colors"
              >
                <Plus className="w-3 h-3" strokeWidth={1.5} />
              </button>
            </div>

            {/* Line total */}
            <span className="text-sm font-semibold text-ink w-24 text-right tabular-nums shrink-0">
              {formatPln(parseFloat(item.price) * item.qty)}
            </span>

            <button
              onClick={() => remove(item.productId)}
              aria-label={`Usuń ${item.name} z koszyka`}
              className="p-1.5 text-ink-2/60 hover:text-ink transition-colors shrink-0"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-8 flex flex-col items-end gap-4">
        {missingForFree !== null && (
          <p className="text-xs text-ink-2">
            Brakuje Ci <span className="font-semibold text-ink">{formatPln(missingForFree)}</span>{" "}
            do darmowej dostawy.
          </p>
        )}
        <div className="flex items-baseline gap-3">
          <span className="text-sm text-ink-2">Razem:</span>
          <span className="text-2xl font-bold text-ink tabular-nums">{formatPln(subtotal)}</span>
        </div>
        <p className="text-[11px] text-ink-2/70">Koszt dostawy zostanie doliczony w następnym kroku.</p>
        <Link
          href={`/${shopSlug}/checkout`}
          className="inline-flex items-center gap-2 bg-accent-brand text-on-accent text-sm font-semibold px-8 py-4 rounded-full hover:opacity-90 transition-opacity"
        >
          Przejdź do zamówienia
          <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  );
}
