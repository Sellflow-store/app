"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HeroConfig, HeroLayout } from "@/types/shop";
import { useStoreBase } from "./StoreBaseContext";

interface Props {
  config: HeroConfig;
  shopSlug: string;
}

const IMAGE_POSITION: Record<NonNullable<HeroConfig["imagePosition"]>, string> = {
  top: "center 15%",
  center: "center 50%",
  bottom: "center 85%",
};

/**
 * Trzy układy hero, przełączane w panelu (`hero.layout`):
 * - split (domyślny, wygląd wszystkich istniejących sklepów) — tekst po lewej,
 *   kwadratowe zdjęcie po prawej;
 * - fullbleed — zdjęcie na całą szerokość ekranu, tekst na dole nad delikatnym
 *   przejściem w kolor papieru (czytelny na każdej fotografii);
 * - editorial — sam tekst, duża typografia na osi, zdjęcie (opcjonalne) jako
 *   szeroki pas pod spodem.
 * Bez zdjęcia fullbleed spada do editorial — nie ma czego rozciągać.
 */
export default function HeroSection({ config }: Props) {
  const base = useStoreBase();
  const layout: HeroLayout =
    config.layout === "fullbleed" && !config.image ? "editorial" : config.layout ?? "split";

  if (layout === "fullbleed") return <FullBleed config={config} base={base} />;
  if (layout === "editorial") return <Editorial config={config} base={base} />;
  return <Split config={config} base={base} />;
}

// ─── Wspólne klocki ──────────────────────────────────────────────────────────

function Eyebrow({ text }: { text: string }) {
  if (!text) return null;
  return (
    <span className="text-xs tracking-[0.25em] uppercase text-ink-2/70 font-medium">{text}</span>
  );
}

function PrimaryCta({ base, label }: { base: string; label: string }) {
  if (!label) return null;
  return (
    <Link
      href={`${base}/produkty`}
      className="bg-ink text-on-ink px-8 py-3.5 text-sm tracking-wide rounded-button hover:opacity-90 transition-opacity duration-200 inline-flex items-center justify-center gap-2 group"
    >
      {label}
      <ArrowRight
        className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
        strokeWidth={1.5}
      />
    </Link>
  );
}

/** Drugie CTA jako podkreślony link, nie druga ramka — mniej pudełek na ekranie. */
function SecondaryLink({ label }: { label: string }) {
  if (!label) return null;
  return (
    <a
      href="#sklep"
      className="text-sm tracking-wide text-ink-2 underline underline-offset-[6px] decoration-rule hover:text-ink hover:decoration-ink transition-colors inline-flex items-center justify-center px-2 py-3.5"
    >
      {label}
    </a>
  );
}

function SocialProof({ text }: { text: string }) {
  // Bez zaszytych ★★★★★ — nowy sklep nie ma opinii, a rysowanie pięciu
  // gwiazdek przy zerze opinii to fałszywy dowód społeczny. Zostaje sam tekst,
  // który merchant sam wpisał (albo nic).
  if (!text) return null;
  return <p className="mt-5 text-xs text-ink-2/70 tracking-wide">{text}</p>;
}

// ─── split — dotychczasowy układ ─────────────────────────────────────────────

function Split({ config, base }: { config: HeroConfig; base: string }) {
  return (
    <section className="relative bg-paper-2 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[70vh] py-16 lg:py-0">
          <div className="order-2 lg:order-1">
            <Eyebrow text={config.eyebrow} />
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.1] tracking-tight">
              {config.headline}
              {config.headlineSub && (
                <>
                  <br />
                  <span className="text-ink-2/70 font-light">{config.headlineSub}</span>
                </>
              )}
            </h1>
            <p className="mt-6 text-base sm:text-lg text-ink-2 max-w-md leading-relaxed font-light">
              {config.description}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <PrimaryCta base={base} label={config.ctaPrimary} />
              {config.ctaSecondary && (
                <a
                  href="#sklep"
                  className="border border-rule text-ink-2 px-8 py-3.5 text-sm tracking-wide rounded-button hover:border-ink hover:text-ink transition-all duration-200 flex items-center justify-center"
                >
                  {config.ctaSecondary}
                </a>
              )}
            </div>
            <SocialProof text={config.socialProof} />
          </div>

          <div className="order-1 lg:order-2 flex items-center justify-center">
            <div className="relative w-full aspect-square max-w-lg">
              {config.image ? (
                <img src={config.image} alt="" className="w-full h-full object-cover rounded-card" />
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

// ─── fullbleed — zdjęcie od krawędzi do krawędzi ─────────────────────────────

function FullBleed({ config, base }: { config: HeroConfig; base: string }) {
  const position = IMAGE_POSITION[config.imagePosition ?? "center"];
  return (
    <section className="relative bg-paper overflow-hidden">
      <div className="relative h-[78vh] min-h-[520px] max-h-[880px] w-full">
        <img
          src={config.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: position }}
        />
        {/* Przejście w papier od dołu: tekst czytelny na każdym zdjęciu,
            a fotografia „wtapia się" w stronę zamiast kończyć się krawędzią. */}
        <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-paper via-paper/70 to-transparent pointer-events-none" />

        <div className="absolute inset-x-0 bottom-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 lg:pb-16">
            <div className="max-w-2xl">
              <Eyebrow text={config.eyebrow} />
              <h1 className="mt-3 text-5xl sm:text-6xl lg:text-7xl font-bold text-ink leading-[1.02] tracking-[-0.02em]">
                {config.headline}
                {config.headlineSub && (
                  <>
                    <br />
                    <span className="text-ink-2/70 font-light">{config.headlineSub}</span>
                  </>
                )}
              </h1>
              {config.description && (
                <p className="mt-5 text-base sm:text-lg text-ink-2 max-w-lg leading-relaxed font-light">
                  {config.description}
                </p>
              )}
              <div className="mt-7 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <PrimaryCta base={base} label={config.ctaPrimary} />
                <SecondaryLink label={config.ctaSecondary} />
              </div>
              <SocialProof text={config.socialProof} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── editorial — typografia na osi, zdjęcie jako pas ─────────────────────────

function Editorial({ config, base }: { config: HeroConfig; base: string }) {
  const position = IMAGE_POSITION[config.imagePosition ?? "center"];
  return (
    <section className="relative bg-paper overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-28 pb-16 lg:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <Eyebrow text={config.eyebrow} />
          <h1 className="mt-4 text-5xl sm:text-6xl lg:text-7xl font-bold text-ink leading-[1.02] tracking-[-0.02em]">
            {config.headline}
            {config.headlineSub && (
              <>
                <br />
                <span className="text-ink-2/70 font-light">{config.headlineSub}</span>
              </>
            )}
          </h1>
          {config.description && (
            <p className="mt-6 text-base sm:text-lg text-ink-2 max-w-xl mx-auto leading-relaxed font-light">
              {config.description}
            </p>
          )}
          <div className="mt-8 flex flex-col sm:flex-row sm:justify-center sm:items-center gap-3 sm:gap-6">
            <PrimaryCta base={base} label={config.ctaPrimary} />
            <SecondaryLink label={config.ctaSecondary} />
          </div>
          <SocialProof text={config.socialProof} />
        </div>

        {config.image && (
          <div className="mt-16 lg:mt-20 aspect-[21/9] w-full overflow-hidden bg-paper-3">
            <img
              src={config.image}
              alt=""
              className="w-full h-full object-cover"
              style={{ objectPosition: position }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
