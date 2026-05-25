"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeBootstrap } from "@/lib/brand/bootstrap";
import { bootstrapToShopContext } from "@/lib/brand/bootstrap-to-shop";
import type { ShopContext } from "@/types/shop";
import TopBar from "@/components/store/TopBar";
import Navbar from "@/components/store/Navbar";
import HeroSection from "@/components/store/HeroSection";
import ProductsSection from "@/components/store/ProductsSection";
import BenefitsSection from "@/components/store/BenefitsSection";
import GuaranteeSection from "@/components/store/GuaranteeSection";
import Footer from "@/components/store/Footer";

/**
 * Branded storefront preview, rendered entirely from a bootstrap payload
 * encoded in the URL — no DB lookup, no auth. Used by the onboarding
 * wizard's LivePreview iframe so the user sees a real (not mock) version
 * of their store before they click Save.
 *
 * The /api/onboarding route persists the same payload to DB on Save, so
 * what the user sees here matches the post-Save dashboard 1:1.
 */
export default function PreviewShopPage() {
  const [shop, setShop] = useState<ShopContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = new URLSearchParams(window.location.search).get("bootstrap");
    if (!raw) { setError("Brak danych do podglądu."); return; }
    const payload = decodeBootstrap(raw);
    if (!payload) { setError("Nieprawidłowy payload."); return; }
    setShop(bootstrapToShopContext(payload));
  }, []);

  const brandStyle = useMemo(() => {
    if (!shop) return undefined;
    return {
      // Per-preview brand overrides — same vars BrandTheme will set after Save.
      ["--brand-paper" as string]: "#ffffff",
      ["--brand-ink" as string]: shop.branding.primaryColor,
      ["--brand-accent" as string]: shop.branding.accentColor,
    } as React.CSSProperties;
  }, [shop]);

  if (error) return <PreviewError message={error} />;
  if (!shop) return <PreviewLoading />;

  return (
    <div className="min-h-screen bg-white" style={brandStyle}>
      <TopBar config={shop.home} />
      <Navbar shopSlug={shop.slug} branding={shop.branding} />
      <HeroSection config={shop.home.hero} shopSlug={shop.slug} />
      <ProductsSection
        config={shop.home.products}
        products={shop.products}
        shopSlug={shop.slug}
      />
      <BenefitsSection config={shop.home.benefits} />
      <GuaranteeSection config={shop.home.guarantee} />
      <Footer shopSlug={shop.slug} branding={shop.branding} />
    </div>
  );
}

function PreviewLoading() {
  return (
    <div className="min-h-screen grid place-items-center bg-white">
      <p className="text-sm text-neutral-500" style={{ fontFamily: "var(--font-mono)" }}>
        Ładuję podgląd…
      </p>
    </div>
  );
}

function PreviewError({ message }: { message: string }) {
  return (
    <div className="min-h-screen grid place-items-center bg-white px-6">
      <div className="text-center max-w-md">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-3"
          style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
        >
          Podgląd niedostępny
        </p>
        <p className="text-base text-neutral-700">{message}</p>
        <p className="mt-4 text-xs text-neutral-500">
          Otwórz <code>/onboarding</code> żeby wygenerować nowy podgląd.
        </p>
      </div>
    </div>
  );
}
