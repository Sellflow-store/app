"use client";

import { useState } from "react";

interface Props {
  images: string[];
  name: string;
}

export default function ProductGallery({ images, name }: Props) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-[4/5] bg-paper-3 rounded-2xl flex items-center justify-center">
        <div className="w-16 h-16 border-2 border-dashed border-rule rounded-xl flex items-center justify-center">
          <span className="text-2xl font-light text-ink-2/60">✦</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-[4/5] bg-paper-3 rounded-2xl overflow-hidden">
        <img
          src={images[active]}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-3 mt-4">
          {images.map((url, i) => (
            <button
              key={`${url}-${i}`}
              onClick={() => setActive(i)}
              aria-label={`Zdjęcie ${i + 1}`}
              className={`w-16 h-16 rounded-xl overflow-hidden bg-paper-3 transition-all ${
                i === active ? "ring-2 ring-ink" : "opacity-70 hover:opacity-100"
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
