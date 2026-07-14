"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { generateReactHelpers } from "@uploadthing/react";
import type { AppFileRouter } from "@/lib/uploadthing";

const { useUploadThing } = generateReactHelpers<AppFileRouter>();

interface Props {
  endpoint: keyof AppFileRouter;
  onUploaded: (urls: string[]) => void;
  label?: string;
  multiple?: boolean;
}

export default function ImageUpload({
  endpoint,
  onUploaded,
  label = "Wgraj zdjęcie",
  multiple = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      setError(null);
      onUploaded(res.map((file) => file.ufsUrl));
    },
    onUploadError: (err) => {
      // Pokaż prawdziwą przyczynę (limit rozmiaru, brak konfiguracji storage,
      // brak uprawnień…) zamiast generycznego komunikatu — inaczej nie da się
      // zdiagnozować, czemu upload pada.
      const msg = err?.message?.trim();
      setError(
        msg
          ? `Nie udało się wgrać pliku: ${msg}`
          : "Nie udało się wgrać pliku. Możesz też wkleić adres URL zdjęcia.",
      );
    },
  });

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) startUpload(files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-all disabled:opacity-60"
        style={{ border: "1.5px solid oklch(85% 0 0)", color: "oklch(30% 0 0)", background: "oklch(97% 0 0)" }}
      >
        <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
        {isUploading ? "Wgrywanie…" : label}
      </button>
      {error && (
        <p className="text-[11px] mt-1.5" style={{ color: "oklch(45% 0.18 20)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
