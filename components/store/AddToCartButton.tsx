"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Check, Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart";

interface Props {
  shopSlug: string;
  product: {
    id: string;
    name: string;
    price: string;
    image: string | null;
  };
}

export default function AddToCartButton({ shopSlug, product }: Props) {
  const { add } = useCart(shopSlug);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    add(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  }

  return (
    <div>
      <div className="flex gap-3">
        {/* Qty stepper */}
        <div className="flex items-center border border-rule rounded-full">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Zmniejsz ilość"
            className="px-3 py-4 text-ink-2 hover:text-ink transition-colors"
          >
            <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
          <span className="w-6 text-center text-sm font-medium text-ink tabular-nums">
            {qty}
          </span>
          <button
            onClick={() => setQty((q) => Math.min(99, q + 1))}
            aria-label="Zwiększ ilość"
            className="px-3 py-4 text-ink-2 hover:text-ink transition-colors"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>

        <button
          onClick={handleAdd}
          className="flex-1 flex items-center justify-center gap-2 bg-accent-brand text-on-accent font-semibold text-sm tracking-wide px-8 py-4 rounded-full hover:opacity-90 transition-opacity"
        >
          {added ? (
            <>
              <Check className="w-4 h-4" strokeWidth={2} />
              Dodano do koszyka
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
              Dodaj do koszyka
            </>
          )}
        </button>
      </div>

      {added && (
        <Link
          href={`/${shopSlug}/cart`}
          className="block text-center text-xs font-medium text-ink underline underline-offset-4 mt-3 hover:opacity-70 transition-opacity"
        >
          Przejdź do koszyka →
        </Link>
      )}
    </div>
  );
}
