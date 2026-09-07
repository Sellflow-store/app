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
 * Klipy z sesji trwają sekundę albo dwie i w normalnym tempie migają: ledwie
 * zdążysz spojrzeć, a film wraca na początek. Spowolnienie wydłuża ten sam
 * materiał do kilku sekund, więc ruch czyta się jak powolne ujęcie, a skok
 * pętli wypada rzadziej.
 *
 * `playbackRate` nie ma odpowiednika w atrybutach HTML i resetuje się przy
 * każdym wczytaniu materiału, więc ustawiamy je z kodu — i ponawiamy przy
 * `loadedmetadata`, bo ustawienie przed wczytaniem metadanych bywa gubione.
 */
const DEFAULT_RATE = 0.5;

export default function LookbookVideo({ src, poster, label, className, speed }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const rate = Number.isFinite(speed) && speed! > 0 ? Math.min(2, Math.max(0.25, speed!)) : DEFAULT_RATE;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      el.playbackRate = rate;
    };
    apply();
    el.addEventListener("loadedmetadata", apply);
    return () => el.removeEventListener("loadedmetadata", apply);
  }, [src, rate]);

  return (
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
      className={className}
    />
  );
}
