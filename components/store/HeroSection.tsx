"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HeroConfig } from "@/types/shop";
import { useStoreBase } from "./StoreBaseContext";

interface Props {
  config: HeroConfig;
  shopSlug: string;
}

export default function HeroSection({ config }: Props) {
  const base = useStoreBase();
  return (
    <section className="relative bg-paper-2 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[70vh] py-16 lg:py-0">
          <div className="order-2 lg:order-1">
            <span className="text-xs tracking-[0.25em] uppercase text-ink-2/70 font-medium">
              {config.eyebrow}
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.1] tracking-tight">
              {config.headline}
              <br />
              <span className="text-ink-2/70 font-light">{config.headlineSub}</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-ink-2 max-w-md leading-relaxed font-light">
              {config.description}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href={`${base}/produkty`}
                className="bg-ink text-on-ink px-8 py-3.5 text-sm tracking-wide rounded-button hover:bg-ink transition-colors duration-200 flex items-center justify-center gap-2 group"
              >
                {config.ctaPrimary}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.5} />
              </Link>
              <a
                href="#sklep"
                className="border border-rule text-ink-2 px-8 py-3.5 text-sm tracking-wide rounded-button hover:border-ink hover:text-ink transition-all duration-200 flex items-center justify-center"
              >
                {config.ctaSecondary}
              </a>
            </div>
            <p className="mt-5 text-xs text-ink-2/70 tracking-wide">
              ★★★★★ &nbsp;{config.socialProof}
            </p>
          </div>

          <div className="order-1 lg:order-2 flex items-center justify-center">
            <div className="relative w-full aspect-square max-w-lg">
              {config.image ? (
                <img
                  src={config.image}
                  alt="Hero"
                  className="w-full h-full object-cover rounded-card"
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-paper-3/60 rounded-card" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-2/70">
                    <div className="w-24 h-24 border-2 border-dashed border-rule rounded-2xl flex items-center justify-center mb-4">
                      <span className="text-3xl font-light">✦</span>
                    </div>
                    <span className="text-xs tracking-[0.15em] uppercase">Zdjęcie produktu</span>
                    <span className="text-[10px] text-ink-2/60 mt-1">800 × 800 px</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
