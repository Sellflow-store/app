"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";

interface Props {
  productId: string;
}

// Cart lands in week 2 — until then the CTA exists but tells the truth.
export default function AddToCartButton({ productId: _productId }: Props) {
  const [clicked, setClicked] = useState(false);

  return (
    <div>
      <button
        onClick={() => setClicked(true)}
        className="w-full flex items-center justify-center gap-2 bg-accent-brand text-on-accent font-semibold text-sm tracking-wide px-8 py-4 rounded-full hover:opacity-90 transition-opacity"
      >
        <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
        Dodaj do koszyka
      </button>
      {clicked && (
        <p className="text-xs text-ink-2/70 text-center mt-2">
          Koszyk będzie dostępny już wkrótce.
        </p>
      )}
    </div>
  );
}
