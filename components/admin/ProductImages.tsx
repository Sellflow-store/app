"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Crop, ImageIcon, Plus, Star, X } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import ImageFrameEditor from "@/components/admin/ImageFrameEditor";
import { frameStyle, type ImageMeta } from "@/lib/image-frame";

interface Props {
  images: string[];
  imageMeta: Record<string, ImageMeta>;
  productName: string;
  onChange: (next: { images: string[]; imageMeta: Record<string, ImageMeta> }) => void;
}

const inputStyle = {
  border: "1px solid var(--panel-border)",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "13.5px",
  color: "var(--panel-ink)",
  background: "var(--panel-surface)",
  fontFamily: "var(--font-body)",
  flex: 1,
  width: "auto",
  outline: "none",
};

const iconBtn =
  "flex items-center justify-center w-7 h-7 rounded-md transition-colors disabled:opacity-30 bg-[var(--panel-surface)]/90 text-[var(--panel-ink)] hover:bg-[var(--panel-surface)] backdrop-blur-sm border border-[var(--panel-border)]";

/**
 * Zdjęcia produktu: kolejność (przeciąganie albo strzałki), zdjęcie główne
 * i kadrowanie. Kafelki pokazują zdjęcia w tej samej ramce 4:5 i z tym samym
 * kadrem, co sklep, więc sprzedawca widzi efekt bez wchodzenia do edytora.
 */
export default function ProductImages({ images, imageMeta, productName, onChange }: Props) {
  const [newUrl, setNewUrl] = useState("");
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);

  const emit = (nextImages: string[], nextMeta: Record<string, ImageMeta> = imageMeta) =>
    onChange({ images: nextImages, imageMeta: nextMeta });

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    emit(next);
  }

  function remove(index: number) {
    const url = images[index];
    const next = images.filter((_, i) => i !== index);
    // Meta znika razem z ostatnim wystąpieniem tego adresu.
    if (next.includes(url) || !(url in imageMeta)) return emit(next);
    const { [url]: _dropped, ...rest } = imageMeta;
    void _dropped;
    emit(next, rest);
  }

  function addUrl() {
    const url = newUrl.trim();
    if (!url) return;
    emit([...images, url]);
    setNewUrl("");
  }

  function applyEdit(index: number, value: { frame: ImageMeta["frame"]; alt: string }) {
    const url = images[index];
    const meta: ImageMeta = {
      ...(value.alt ? { alt: value.alt } : {}),
      ...(value.frame ? { frame: value.frame } : {}),
    };
    const next = { ...imageMeta };
    if (meta.alt || meta.frame) next[url] = meta;
    else delete next[url];
    emit(images, next);
    setEditing(null);
  }

  return (
    <div>
      {images.length > 0 ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-3 mb-4">
          {images.map((url, i) => {
            const meta = imageMeta[url];
            return (
              <li
                key={`${url}-${i}`}
                draggable
                onDragStart={(e) => {
                  setDragFrom(i);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOver !== i) setDragOver(i);
                }}
                onDragEnd={() => {
                  setDragFrom(null);
                  setDragOver(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom != null) move(dragFrom, i);
                  setDragFrom(null);
                  setDragOver(null);
                }}
                className={[
                  "relative aspect-[4/5] rounded-xl overflow-hidden border bg-[var(--panel-surface-2)] cursor-grab",
                  dragOver === i && dragFrom !== i
                    ? "border-[var(--panel-primary)] ring-2 ring-[var(--panel-primary)]"
                    : "border-[var(--panel-border)]",
                  dragFrom === i ? "opacity-50" : "",
                ].join(" ")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={meta?.alt || `Zdjęcie ${i + 1}`}
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={frameStyle(meta?.frame)}
                />

                <div className="absolute top-1.5 left-1.5 right-1.5 flex items-start justify-between gap-1">
                  <span className="flex flex-col items-start gap-1">
                    {i === 0 && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "var(--panel-accent)", color: "#fff" }}
                      >
                        Główne
                      </span>
                    )}
                    {meta?.alt && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-black/60 text-white" title={meta.alt}>
                        ALT
                      </span>
                    )}
                  </span>
                  <button type="button" onClick={() => remove(i)} aria-label={`Usuń zdjęcie ${i + 1}`} className={iconBtn}>
                    <X className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>

                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, i - 1)}
                      disabled={i === 0}
                      aria-label={`Przesuń zdjęcie ${i + 1} w lewo`}
                      className={iconBtn}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, i + 1)}
                      disabled={i === images.length - 1}
                      aria-label={`Przesuń zdjęcie ${i + 1} w prawo`}
                      className={iconBtn}
                    >
                      <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  </span>
                  <span className="flex items-center gap-1">
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => move(i, 0)}
                        aria-label={`Ustaw zdjęcie ${i + 1} jako główne`}
                        title="Ustaw jako główne"
                        className={iconBtn}
                      >
                        <Star className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditing(i)}
                      aria-label={`Kadruj zdjęcie ${i + 1}`}
                      title="Kadruj i opisz"
                      className={iconBtn}
                    >
                      <Crop className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-8 rounded-xl mb-4 gap-2"
          style={{ border: "1.5px dashed var(--panel-border-strong)", background: "var(--panel-surface-2)" }}
        >
          <ImageIcon className="w-8 h-8" style={{ color: "var(--panel-border-strong)" }} strokeWidth={1} />
          <p className="text-xs" style={{ color: "var(--panel-ink-muted)" }}>
            Brak zdjęć. Pierwsze dodane będzie zdjęciem głównym
          </p>
        </div>
      )}

      {images.length > 0 && (
        <p className="text-[11px] mb-4" style={{ color: "var(--panel-ink-faint)" }}>
          Przeciągnij zdjęcie albo użyj strzałek, żeby zmienić kolejność. Pierwsze jest główne i pokazuje się na liście
          produktów. Ikoną kadru ustawisz, co ma być widoczne w ramce, i dopiszesz opis zdjęcia (alt).
        </p>
      )}

      <div className="mb-3">
        <ImageUpload
          endpoint="productImage"
          multiple
          label="Wgraj zdjęcia z dysku"
          onUploaded={(urls) => emit([...images, ...urls])}
        />
      </div>

      <div className="flex gap-2">
        <input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
          placeholder="Wklej adres URL zdjęcia"
          aria-label="Adres URL zdjęcia"
          style={inputStyle}
        />
        <button
          type="button"
          onClick={addUrl}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all shrink-0"
          style={{ border: "1.5px solid var(--panel-border-strong)", color: "var(--panel-ink)", background: "var(--panel-surface-2)" }}
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
          Dodaj
        </button>
      </div>

      {editing != null && images[editing] && (
        <ImageFrameEditor
          key={images[editing]}
          src={images[editing]}
          productName={productName}
          frame={imageMeta[images[editing]]?.frame}
          alt={imageMeta[images[editing]]?.alt ?? ""}
          onApply={(v) => applyEdit(editing, v)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
