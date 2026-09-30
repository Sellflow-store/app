"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

/** Przywrócenie usuniętego sklepu prosto z zakładki „Usunięte". Usunięcie
 *  jest miękkie, więc wraca wszystko: adres, produkty, zamówienia. */
export default function RestoreButton({ slug, shopName }: { slug: string; shopName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function restore() {
    if (!confirm(`Przywrócić sklep „${shopName}”? Storefront wróci do sieci pod tym samym adresem.`)) return;
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/ops/shops/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restore: true }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={restore}
      disabled={busy}
      className="inline-flex items-center gap-1.5 text-[12px] font-medium rounded-lg px-2.5 py-1.5 disabled:opacity-50"
      style={{
        border: "1px solid var(--brand-rule)",
        color: failed ? "var(--panel-danger-ink)" : "var(--brand-ink)",
      }}
    >
      <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
      {busy ? "…" : failed ? "Błąd, ponów" : "Przywróć"}
    </button>
  );
}
