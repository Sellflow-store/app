"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Check, Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useStoreBase } from "./StoreBaseContext";

interface Props {
  shopSlug: string;
  product: {
    id: string;
    name: string;
    price: string;
    image: string | null;
    stock?: number | null;
    type?: "physical" | "digital" | "service";
  };
}

export default function AddToCartButton({ shopSlug, product }: Props) {
  const { add } = useCart(shopSlug);
  const base = useStoreBase();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const tracked = product.stock != null;
  const soldOut = tracked && product.stock! <= 0;
  const max = tracked ? Math.min(99, product.stock!) : 99;
  const lowStock = tracked && product.stock! > 0 && product.stock! <= 5;

  function handleAdd() {
    if (soldOut) return;
    add(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        stock: product.stock,
        type: product.type,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  }

  if (soldOut) {
    return (
      <div>
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 border border-rule text-ink-2 font-semibold text-sm tracking-wide px-8 py-4 rounded-button cursor-not-allowed"
        >
          Wyprzedane
        </button>
        <p className="text-xs text-ink-2/70 text-center mt-2">
          Tego produktu chwilowo nie ma na stanie.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-3">
        {/* Qty stepper */}
        <div className="flex items-center border border-rule rounded-input">
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
            onClick={() => setQty((q) => Math.min(max, q + 1))}
            disabled={qty >= max}
            aria-label="Zwiększ ilość"
            className="px-3 py-4 text-ink-2 hover:text-ink transition-colors disabled:opacity-30"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>

        <button
          onClick={handleAdd}
          className="flex-1 flex items-center justify-center gap-2 bg-accent-brand text-on-accent font-semibold text-sm tracking-wide px-8 py-4 rounded-button hover:opacity-90 transition-opacity"
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

      {lowStock && (
        <p className="text-xs text-center mt-2" style={{ color: "oklch(45% 0.16 60)" }}>
          Zostały ostatnie sztuki ({product.stock}).
        </p>
      )}

      {added && (
        <Link
          href={`${base}/cart`}
          className="block text-center text-xs font-medium text-ink underline underline-offset-4 mt-3 hover:opacity-70 transition-opacity"
        >
          Przejdź do koszyka →
        </Link>
      )}
    </div>
  );
}
