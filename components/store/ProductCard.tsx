"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Check } from "lucide-react";
import type { StorefrontProduct } from "@/types/shop";
import { useCart } from "@/lib/cart";
import { useStoreBase } from "./StoreBaseContext";

interface Props {
  product: StorefrontProduct;
  shopSlug: string;
  index?: number;
}

export default function ProductCard({ product, shopSlug, index = 0 }: Props) {
  const mainImage = product.images?.[0] ?? null;
  const { add } = useCart(shopSlug);
  const base = useStoreBase();
  const [added, setAdded] = useState(false);

  const soldOut = product.stock != null && product.stock <= 0;

  function quickAdd() {
    if (soldOut) return;
    add({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: mainImage,
      stock: product.stock,
      type: product.type,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="group">
      {/* Image */}
      <div className="relative aspect-[4/5] bg-paper-3 rounded-card overflow-hidden mb-4">
        {mainImage ? (
          <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-2/60">
            <div className="w-16 h-16 border-2 border-dashed border-rule rounded-xl flex items-center justify-center mb-3">
              <span className="text-2xl font-light">✦</span>
            </div>
          </div>
        )}
        {soldOut ? (
          <span className="absolute top-3 left-3 bg-paper/90 backdrop-blur-sm text-ink-2 text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-full">
            Wyprzedane
          </span>
        ) : (
          product.badge && (
            <span className="absolute top-3 left-3 bg-secondary-brand text-on-secondary text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-full">
              {product.badge}
            </span>
          )
        )}
        {!soldOut && (
          <button
            onClick={quickAdd}
            aria-label={`Dodaj ${product.name} do koszyka`}
            className={`absolute bottom-3 right-3 backdrop-blur-sm p-2.5 rounded-full translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-sm ${
              added
                ? "opacity-100 translate-y-0 bg-ink text-on-ink"
                : "bg-paper/90 opacity-0 group-hover:opacity-100 hover:bg-ink hover:text-on-ink text-ink-2"
            }`}
          >
            {added ? (
              <Check className="w-4 h-4" strokeWidth={2} />
            ) : (
              <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>
        )}
      </div>

      {/* Info */}
      <Link
        href={`${base}/products/${product.id}`}
        className="block space-y-1 hover:opacity-80 transition-opacity"
      >
        <p className="text-[10px] tracking-[0.2em] uppercase text-ink-2/70">{product.category}</p>
        <h3 className="text-sm font-medium text-ink tracking-wide">{product.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">{product.price} zł</span>
          {product.oldPrice && (
            <span className="text-xs text-ink-2/70 line-through">{product.oldPrice} zł</span>
          )}
        </div>
        {product.lowestPrice30 && (
          <p className="text-[10px] text-ink-2/60">
            Najniższa cena z 30 dni: {product.lowestPrice30} zł
          </p>
        )}
      </Link>
    </div>
  );
}
