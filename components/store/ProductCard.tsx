"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import type { StorefrontProduct } from "@/types/shop";

interface Props {
  product: StorefrontProduct;
  shopSlug: string;
  index?: number;
}

export default function ProductCard({ product, shopSlug, index = 0 }: Props) {
  const mainImage = product.images?.[0] ?? null;

  return (
    <div className="group">
      {/* Image */}
      <div className="relative aspect-[4/5] bg-paper-3 rounded-2xl overflow-hidden mb-4">
        {mainImage ? (
          <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-2/60">
            <div className="w-16 h-16 border-2 border-dashed border-rule rounded-xl flex items-center justify-center mb-3">
              <span className="text-2xl font-light">✦</span>
            </div>
          </div>
        )}
        {product.badge && (
          <span className="absolute top-3 left-3 bg-ink text-on-ink text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-full">
            {product.badge}
          </span>
        )}
        <button className="absolute bottom-3 right-3 bg-paper/90 backdrop-blur-sm p-2.5 rounded-full opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-ink hover:text-on-ink text-ink-2 shadow-sm">
          <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Info */}
      <Link
        href={`/${shopSlug}/products/${product.id}`}
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
      </Link>
    </div>
  );
}
