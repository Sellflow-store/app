"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useStoreBase } from "./StoreBaseContext";

export default function ProductSearch() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const base = useStoreBase();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q.length < 2) return;
    setOpen(false);
    router.push(`${base}/szukaj?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Zamknij wyszukiwarkę" : "Szukaj produktów"}
        className="text-ink-2 hover:text-ink transition-colors"
      >
        {open ? (
          <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
        ) : (
          <Search className="w-[18px] h-[18px]" strokeWidth={1.5} />
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full border-b border-rule bg-paper/95 backdrop-blur-md">
          <form
            onSubmit={submit}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3"
          >
            <Search className="w-[18px] h-[18px] text-ink-2/70 shrink-0" strokeWidth={1.5} />
            <input
              ref={inputRef}
              type="search"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
              placeholder="Czego szukasz?"
              className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-2/50 focus:outline-none"
            />
            <button
              type="submit"
              className="text-xs tracking-wide uppercase text-ink-2 hover:text-ink transition-colors"
            >
              Szukaj
            </button>
          </form>
        </div>
      )}
    </>
  );
}
