"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HeroConfig } from "@/types/shop";

interface Props {
  config: HeroConfig;
  shopSlug: string;
}

export default function HeroSection({ config, shopSlug }: Props) {
  return (
    <section className="relative bg-neutral-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[70vh] py-16 lg:py-0">
          <div className="order-2 lg:order-1">
            <span className="text-xs tracking-[0.25em] uppercase text-neutral-400 font-medium">
              {config.eyebrow}
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 leading-[1.1] tracking-tight">
              {config.headline}
              <br />
              <span className="text-neutral-400 font-light">{config.headlineSub}</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-neutral-500 max-w-md leading-relaxed font-light">
              {config.description}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href={`/${shopSlug}/products`}
                className="bg-neutral-900 text-white px-8 py-3.5 text-sm tracking-wide hover:bg-neutral-800 transition-colors duration-200 flex items-center justify-center gap-2 group"
              >
                {config.ctaPrimary}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.5} />
              </Link>
              <a
                href="#sklep"
                className="border border-neutral-300 text-neutral-700 px-8 py-3.5 text-sm tracking-wide hover:border-neutral-900 hover:text-neutral-900 transition-all duration-200 flex items-center justify-center"
              >
                {config.ctaSecondary}
              </a>
            </div>
            <p className="mt-5 text-xs text-neutral-400 tracking-wide">
              ★★★★★ &nbsp;{config.socialProof}
            </p>
          </div>

          <div className="order-1 lg:order-2 flex items-center justify-center">
            <div className="relative w-full aspect-square max-w-lg">
              {config.image ? (
                <img
                  src={config.image}
                  alt="Hero"
                  className="w-full h-full object-cover rounded-3xl"
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-neutral-200/60 rounded-3xl" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
                    <div className="w-24 h-24 border-2 border-dashed border-neutral-300 rounded-2xl flex items-center justify-center mb-4">
                      <span className="text-3xl font-light">✦</span>
                    </div>
                    <span className="text-xs tracking-[0.15em] uppercase">Zdjęcie produktu</span>
                    <span className="text-[10px] text-neutral-300 mt-1">800 × 800 px</span>
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
