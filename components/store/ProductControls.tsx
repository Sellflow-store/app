"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SORT_OPTIONS, type SortOption } from "@/lib/storefront-products";

interface Props {
  sort: SortOption;
  hideUnavailable: boolean;
}

export default function ProductControls({ sort, hideUnavailable }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
      <label className="flex items-center gap-2 text-sm text-ink-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={hideUnavailable}
          onChange={(e) => update("dostepne", e.target.checked ? "1" : null)}
          className="accent-ink w-4 h-4"
        />
        Tylko dostępne
      </label>

      <label className="flex items-center gap-2 text-sm text-ink-2">
        Sortuj:
        <select
          value={sort}
          onChange={(e) => update("sort", e.target.value === "polecane" ? null : e.target.value)}
          className="bg-paper border border-rule rounded-input px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-ink/40"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
