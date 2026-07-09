"use client";

import { useEffect, useRef, useState } from "react";
import { decodeBootstrap } from "@/lib/brand/bootstrap";
import { bootstrapToShopContext } from "@/lib/brand/bootstrap-to-shop";
import type { ShopContext } from "@/types/shop";
import BrandTheme from "@/components/store/BrandTheme";
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
  const [noticeVisible, setNoticeVisible] = useState(false);
  const noticeTimer = useRef<number | null>(null);

  const showPreviewNotice = () => {
    setNoticeVisible(true);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNoticeVisible(false), 2500);
  };

  useEffect(() => {
    return () => {
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    };
  }, []);

  // The preview shop doesn't exist in the DB yet, so every /{slug}/... route
  // its links point at would 404. Block navigation at the root instead of
  // threading a previewMode prop through every storefront component; pure
  // hash links (#sklep) still scroll. next/link skips routing when
  // defaultPrevented is set, and propagation continues so e.g. the mobile
  // menu still closes itself.
  const handleClickCapture = (e: React.MouseEvent) => {
    const anchor = (e.target as HTMLElement).closest?.("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href") ?? "";
    if (href.startsWith("#")) return;
    e.preventDefault();
    showPreviewNotice();
  };

  // ProductSearch submits via router.push — same problem, same treatment.
  const handleSubmitCapture = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showPreviewNotice();
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Payload arrives in the hash (#bootstrap=...) to avoid edge URL limits.
    // We also accept ?bootstrap=... as a fallback for old links / direct shares.
    const hashRaw = window.location.hash.startsWith("#bootstrap=")
      ? window.location.hash.slice("#bootstrap=".length)
      : null;
    const queryRaw = new URLSearchParams(window.location.search).get("bootstrap");
    const raw = hashRaw ?? queryRaw;
    if (!raw) { setError("Brak danych do podglądu."); return; }
    const payload = decodeBootstrap(raw);
    if (!payload) { setError("Nieprawidłowy payload."); return; }
    setShop(bootstrapToShopContext(payload));
  }, []);

  if (error) return <PreviewError message={error} />;
  if (!shop) return <PreviewLoading />;

  return (
    <>
      <BrandTheme branding={shop.branding} />
      <div
        className="min-h-screen bg-paper"
        onClickCapture={handleClickCapture}
        onSubmitCapture={handleSubmitCapture}
      >
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
      {noticeVisible && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-full text-sm shadow-lg"
          style={{
            background: "var(--brand-ink, #111)",
            color: "var(--brand-paper, #fff)",
          }}
        >
          To podgląd — podstrony sklepu odblokujesz po zapisaniu.
        </div>
      )}
    </>
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
