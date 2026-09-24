"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { P } from "./settings/ui";

// Panel pages load the saved config and fail loudly instead of rendering
// defaults: a form pre-filled with defaults after a transient DB error would
// overwrite the merchant's real settings on the next "Save".
export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-6 lg:p-8 max-w-xl">
      <div
        className="rounded-2xl p-6"
        style={{ background: P.surface, border: `1px solid ${P.border}` }}
      >
        <h1
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-display)", color: P.ink }}
        >
          Nie udało się wczytać danych
        </h1>
        <p className="text-sm mt-2" style={{ color: P.muted }}>
          Połączenie z bazą chwilowo nie działa. Twoje ustawienia są bezpieczne:
          formularz nie wyświetli się, dopóki nie wczytamy zapisanych danych, żeby
          nic ich nie nadpisało. Spróbuj ponownie za chwilę.
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="mt-5 inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-full"
          style={{ background: P.accent, color: "white" }}
        >
          <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
          Spróbuj ponownie
        </button>
      </div>
    </div>
  );
}
