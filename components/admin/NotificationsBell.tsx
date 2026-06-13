"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, ClipboardList, Banknote } from "lucide-react";

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string | null;
  total: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface Data {
  toShip: number;
  unpaid: number;
  count: number;
  recent: RecentOrder[];
}

const pln = (v: string) => `${(parseFloat(v) || 0).toFixed(2).replace(".", ",")} zł`;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "przed chwilą";
  if (mins < 60) return `${mins} min temu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} godz. temu`;
  const days = Math.floor(hours / 24);
  return `${days} dni temu`;
}

export default function NotificationsBell({ shopSlug }: { shopSlug: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const base = `/dashboard/${shopSlug}`;

  async function load() {
    try {
      const res = await fetch(`/api/shops/${shopSlug}/notifications`);
      if (res.ok) setData(await res.json());
    } catch {
      // ignore
    }
  }

  // Initial + lightweight polling so a new order shows up without a reload
  useEffect(() => {
    load();
    const t = window.setInterval(load, 60000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopSlug]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const count = data?.count ?? 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1"
        style={{ color: "oklch(55% 0 0)" }}
        aria-label="Powiadomienia"
      >
        <Bell className="w-4 h-4" strokeWidth={1.5} />
        {count > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ background: "oklch(56% 0.30 335)", color: "#fff" }}
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-xl py-2 z-50"
          style={{ background: "#fff", border: "1px solid oklch(90% 0 0)", boxShadow: "0 8px 28px oklch(0% 0 0 / 0.10)" }}
        >
          <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom: "1px solid oklch(94% 0 0)" }}>
            <span className="text-xs font-semibold" style={{ color: "oklch(15% 0 0)" }}>Powiadomienia</span>
          </div>

          {/* Summary */}
          <div className="px-4 py-2.5 flex gap-4">
            <Link href={`${base}/orders`} onClick={() => setOpen(false)} className="flex items-center gap-1.5 text-xs">
              <ClipboardList className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: "oklch(40% 0.20 260)" }} />
              <span style={{ color: "oklch(30% 0 0)" }}>
                <strong>{data?.toShip ?? 0}</strong> do obsługi
              </span>
            </Link>
            <Link href={`${base}/orders`} onClick={() => setOpen(false)} className="flex items-center gap-1.5 text-xs">
              <Banknote className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: "oklch(45% 0.15 70)" }} />
              <span style={{ color: "oklch(30% 0 0)" }}>
                <strong>{data?.unpaid ?? 0}</strong> nieopłaconych
              </span>
            </Link>
          </div>

          {/* Recent actionable orders */}
          <div style={{ borderTop: "1px solid oklch(94% 0 0)" }}>
            {!data || data.recent.length === 0 ? (
              <p className="px-4 py-5 text-xs text-center" style={{ color: "oklch(55% 0 0)" }}>
                Wszystko ogarnięte — brak nowych spraw 🎉
              </p>
            ) : (
              data.recent.map((o) => (
                <Link
                  key={o.id}
                  href={`${base}/orders/${o.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "oklch(97% 0 0)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: o.status === "pending" ? "oklch(56% 0.30 335)" : "oklch(80% 0 0)" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate" style={{ color: "oklch(15% 0 0)" }}>
                      {o.orderNumber} · {o.customerName ?? "—"}
                    </p>
                    <p className="text-[10px]" style={{ color: "oklch(55% 0 0)" }}>
                      {pln(o.total)} · {timeAgo(o.createdAt)}
                      {o.paymentStatus === "unpaid" ? " · nieopłacone" : ""}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="px-4 pt-2" style={{ borderTop: "1px solid oklch(94% 0 0)" }}>
            <Link
              href={`${base}/orders`}
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-semibold py-1.5"
              style={{ color: "oklch(22% 0.24 270)" }}
            >
              Wszystkie zamówienia →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
