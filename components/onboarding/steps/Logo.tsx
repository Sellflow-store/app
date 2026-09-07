"use client";

import { useRef } from "react";
import { useOnboarding } from "../state";
import StepFooter from "../StepFooter";

type Props = { onNext: () => void; onBack: () => void };

export default function Logo({ onNext, onBack }: Props) {
  const { state, patchBusiness } = useOnboarding();
  const fileRef = useRef<HTMLInputElement>(null);

  // Logo jedzie przez kreator jako base64 (podgląd → payload → sessionStorage
  // przy rejestracji → POST). Surowy plik potrafi mieć kilka MB i przekracza
  // limit sessionStorage (QuotaExceededError zrywał zapis sklepu), więc raster
  // skalujemy i przekodowujemy tutaj. Do bazy base64 już nie trafia — serwer
  // przekłada obraz na Vercel Blob (POST /api/onboarding) i zapisuje sam URL.
  //
  // 600 px dłuższego boku: navbar pokazuje logo w kilkudziesięciu pikselach,
  // więc to nadal zapas na ekrany o podwójnej gęstości, a waga jest mała.
  // Format dobieramy po przezroczystości — PNG tylko wtedy, gdy jest naprawdę
  // potrzebny. Logotypy „na białym prostokącie" (a takie ludzie wgrywają
  // najczęściej) jako PNG ważyły setki kilobajtów, a jako JPEG ważą dziesiątki.
  // SVG jest wektorem i zostaje bez zmian.
  const MAX_DIM = 600;
  const JPEG_QUALITY = 0.85;

  const hasTransparency = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    try {
      const { data } = ctx.getImageData(0, 0, w, h);
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 250) return true;
      }
      return false;
    } catch {
      // getImageData może rzucić przy nietypowych źródłach — wtedy zakładamy
      // przezroczystość, bo utrata kanału alfa jest gorsza niż większy plik.
      return true;
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (file.type === "image/svg+xml") {
        patchBusiness({ logoDataUrl: dataUrl });
        return;
      }
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          patchBusiness({ logoDataUrl: dataUrl });
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const encoded = hasTransparency(ctx, w, h)
          ? canvas.toDataURL("image/png")
          : canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        // Gdyby przekodowanie wyszło większe niż oryginał (małe, już zoptymalizowane
        // pliki), zostawiamy oryginał.
        patchBusiness({ logoDataUrl: encoded.length < dataUrl.length ? encoded : dataUrl });
      };
      img.onerror = () => patchBusiness({ logoDataUrl: dataUrl });
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-3"
         style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}>
        Krok 1 z 2 · Biznes
      </p>
      <h2 className="text-[28px] font-bold tracking-tight mb-2"
          style={{ fontFamily: "var(--font-display)", color: "var(--brand-ink)", lineHeight: 1.15 }}>
        Masz już logo?
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: "var(--brand-ink-2)" }}>
        Wrzuć plik PNG lub SVG. Jeśli pominiesz — użyjemy typografii.
      </p>

      <div className="mt-7 space-y-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/svg+xml,image/jpeg"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
          style={{
            background: "var(--brand-paper-3)",
            color: "var(--brand-ink)",
            border: "1.5px solid var(--brand-rule)",
            fontFamily: "var(--font-body)",
          }}
        >
          {state.business.logoDataUrl ? "Zmień plik" : "Wgraj logo"}
        </button>

        {state.business.logoDataUrl && (
          <div
            className="flex items-center gap-4 rounded-xl p-4"
            style={{ border: "1px solid var(--brand-rule)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.business.logoDataUrl}
              alt="Twoje logo"
              className="w-14 h-14 object-contain"
            />
            <div>
              <div className="font-semibold text-sm" style={{ color: "var(--brand-ink)" }}>
                Logo wgrane
              </div>
              <button
                type="button"
                onClick={() => patchBusiness({ logoDataUrl: null })}
                className="text-sm font-medium underline-offset-4 hover:underline"
                style={{ color: "var(--brand-magenta)" }}
              >
                Usuń
              </button>
            </div>
          </div>
        )}
      </div>

      <StepFooter onBack={onBack} onSkip={onNext} onNext={onNext} />
    </div>
  );
}
