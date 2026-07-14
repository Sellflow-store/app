"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

interface Props {
  /** Zachowane dla kompatybilności wywołań (shopLogo / productImage / …).
   *  Autoryzacja i limity są jednolite po stronie /api/upload, więc pole nie
   *  zmienia zachowania — pozostaje, by nie ruszać miejsc wywołania. */
  endpoint?: string;
  onUploaded: (urls: string[]) => void;
  label?: string;
  multiple?: boolean;
}

export default function ImageUpload({
  onUploaded,
  label = "Wgraj zdjęcie",
  multiple = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function upload(files: File[]) {
    if (files.length === 0) return;
    setError(null);
    setIsUploading(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = (await res.json()) as { urls?: string[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Nie udało się wgrać pliku. Możesz też wkleić adres URL zdjęcia.");
        return;
      }
      onUploaded(data.urls ?? []);
    } catch {
      setError("Nie udało się wgrać pliku. Sprawdź połączenie i spróbuj ponownie.");
    } finally {
      setIsUploading(false);
    }
  }

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
          if (files.length > 0) upload(files);
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
