"use client";

import { useEffect, useRef } from "react";

interface Props {
  src: string;
  poster?: string;
  label?: string;
  className?: string;
  /** 1 = tempo oryginalne. Poniżej ~0.4 film zaczyna zacinać, bo przeglądarka
   *  nie dokłada klatek — trzyma każdą dłużej. */
  speed?: number;
}

/**
 * Kadr filmowy lookbooka — ożywione zdjęcie, nie odtwarzacz.
 *
 * Dwie rzeczy robią z sekundowego klipu coś, na co da się patrzeć:
 *
 * 1. ZWOLNIENIE. W oryginalnym tempie klip miga — ledwie zdążysz spojrzeć,
 *    a wraca na początek. `playbackRate` nie ma odpowiednika w atrybutach HTML
 *    i resetuje się przy każdym wczytaniu materiału, więc ustawiamy je z kodu
 *    i ponawiamy przy `loadedmetadata`.
 *
 * 2. ROZPUSZCZENIE PĘTLI. Zapętlony film wraca z ostatniej klatki na pierwszą
 *    cięciem — przy ujęciu, które ma udawać zdjęcie, ten przeskok widać jak
 *    usterkę. Więc pod filmem kładziemy jego pierwszą klatkę (plakat) i pod
 *    koniec przebiegu wygaszamy film do zera: obraz rozpływa się w klatkę,
 *    od której zaraz zacznie. W chwili nawrotu film wraca do pełnej krycia,
 *    ale pokazuje wtedy dokładnie to, co widać pod spodem, więc nawrót jest
 *    niewidoczny. Zamiast cięcia zostaje miękkie przejście.
 *
 * Krycie liczymy w rAF, nie na `timeupdate` — to zdarzenie leci ~4 razy na
 * sekundę, czyli za rzadko na płynne wygaszenie.
 */
const DEFAULT_RATE = 0.5;

/** Długość rozpuszczenia w sekundach RZECZYWISTYCH (nie materiału). */
const FADE_SECONDS = 0.5;

export default function LookbookVideo({ src, poster, label, className, speed }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const rate =
    Number.isFinite(speed) && speed! > 0 ? Math.min(2, Math.max(0.25, speed!)) : DEFAULT_RATE;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const applyRate = () => {
      el.playbackRate = rate;
    };
    applyRate();
    el.addEventListener("loadedmetadata", applyRate);

    // Wolniejsze odtwarzanie rozciąga materiał, więc pół sekundy na ekranie to
    // mniej niż pół sekundy materiału — stąd przeliczenie przez tempo.
    const fadeInMedia = FADE_SECONDS * rate;

    let raf = 0;
    const tick = () => {
      const duration = el.duration;
      if (duration && Number.isFinite(duration) && duration > fadeInMedia * 2) {
        const doKonca = duration - el.currentTime;
        const opacity = Math.min(1, doKonca / fadeInMedia, el.currentTime / fadeInMedia);
        el.style.opacity = String(Math.max(0, opacity));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("loadedmetadata", applyRate);
    };
  }, [src, rate]);

  return (
    <div className="relative w-full h-full">
      {poster && (
        // Pierwsza klatka pod spodem — to w nią rozpływa się koniec przebiegu.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" aria-hidden className={`absolute inset-0 ${className ?? ""}`} />
      )}
      <video
        ref={ref}
        src={src}
        poster={poster || undefined}
        autoPlay
        loop
        muted
        playsInline
        // preload="metadata": kilka kadrów filmowych na stronie głównej nie może
        // kosztować kilku megabajtów transferu przy pierwszym wejściu.
        preload="metadata"
        aria-label={label ?? "Kadr z sesji"}
        className={`absolute inset-0 ${className ?? ""}`}
      />
    </div>
  );
}
