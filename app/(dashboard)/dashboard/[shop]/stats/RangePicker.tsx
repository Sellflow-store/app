"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Calendar, ChevronDown, Check } from "lucide-react";

const PRESETS: { value: string; label: string }[] = [
  { value: "7", label: "Ostatnie 7 dni" },
  { value: "30", label: "Ostatnie 30 dni" },
  { value: "90", label: "Ostatnie 90 dni" },
];

const todayISO = () => {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
};

export default function RangePicker({
  value,
  from,
  to,
  label,
}: {
  value: string; // "" when a custom range is active, else "7" | "30" | "90"
  from?: string;
  to?: string;
  label: string; // pre-formatted label for the trigger button
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(!!(from && to));
  const [f, setF] = useState(from ?? "");
  const [t, setT] = useState(to ?? "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const go = (qs: URLSearchParams) => {
    setOpen(false);
    router.push(qs.toString() ? `${pathname}?${qs.toString()}` : pathname);
  };

  const applyPreset = (v: string) => {
    const next = new URLSearchParams(params);
    next.delete("from");
    next.delete("to");
    next.set("range", v);
    go(next);
  };

  const applyCustom = () => {
    if (!f || !t) return;
    const next = new URLSearchParams(params);
    next.delete("range");
    next.set("from", f);
    next.set("to", t);
    go(next);
  };

  const max = todayISO();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors"
        style={{ background: "#fff", border: "1px solid oklch(90% 0 0)", color: "oklch(25% 0 0)" }}
      >
        <Calendar className="w-4 h-4" style={{ color: "oklch(55% 0 0)" }} strokeWidth={1.75} />
        {label}
        <ChevronDown className="w-4 h-4" style={{ color: "oklch(55% 0 0)" }} strokeWidth={1.75} />
      </button>

      {open && (
        <div
          className="absolute left-0 mt-1.5 z-20 rounded-xl overflow-hidden min-w-[240px]"
          style={{ background: "#fff", border: "1px solid oklch(90% 0 0)", boxShadow: "0 8px 24px oklch(0% 0 0 / 0.08)" }}
        >
          {PRESETS.map((o) => (
            <button
              key={o.value}
              onClick={() => applyPreset(o.value)}
              className="flex items-center justify-between w-full gap-3 px-3.5 py-2.5 text-sm text-left transition-colors hover:bg-[oklch(97%_0_0)]"
              style={{ color: "oklch(25% 0 0)" }}
            >
              {o.label}
              {value === o.value && (
                <Check className="w-4 h-4" style={{ color: "oklch(56% 0.30 335)" }} strokeWidth={2} />
              )}
            </button>
          ))}

          <div style={{ borderTop: "1px solid oklch(93% 0 0)" }}>
            <button
              onClick={() => setCustomOpen((c) => !c)}
              className="flex items-center justify-between w-full gap-3 px-3.5 py-2.5 text-sm text-left transition-colors hover:bg-[oklch(97%_0_0)]"
              style={{ color: "oklch(25% 0 0)" }}
            >
              Własny zakres
              {value === "" ? (
                <Check className="w-4 h-4" style={{ color: "oklch(56% 0.30 335)" }} strokeWidth={2} />
              ) : (
                <ChevronDown
                  className="w-4 h-4 transition-transform"
                  style={{ color: "oklch(55% 0 0)", transform: customOpen ? "rotate(180deg)" : "none" }}
                  strokeWidth={1.75}
                />
              )}
            </button>

            {customOpen && (
              <div className="px-3.5 pb-3.5 pt-1 space-y-2">
                <label className="block">
                  <span className="text-[11px] font-medium" style={{ color: "oklch(50% 0 0)" }}>Od</span>
                  <input
                    type="date"
                    value={f}
                    max={t || max}
                    onChange={(e) => setF(e.target.value)}
                    className="mt-1 w-full rounded-lg px-2.5 py-1.5 text-sm tabular-nums"
                    style={{ border: "1px solid oklch(88% 0 0)", color: "oklch(20% 0 0)" }}
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-medium" style={{ color: "oklch(50% 0 0)" }}>Do</span>
                  <input
                    type="date"
                    value={t}
                    min={f || undefined}
                    max={max}
                    onChange={(e) => setT(e.target.value)}
                    className="mt-1 w-full rounded-lg px-2.5 py-1.5 text-sm tabular-nums"
                    style={{ border: "1px solid oklch(88% 0 0)", color: "oklch(20% 0 0)" }}
                  />
                </label>
                <button
                  onClick={applyCustom}
                  disabled={!f || !t}
                  className="w-full rounded-lg py-2 text-sm font-medium transition-opacity disabled:opacity-40"
                  style={{ background: "oklch(11% 0.10 275)", color: "#fff" }}
                >
                  Zastosuj zakres
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
