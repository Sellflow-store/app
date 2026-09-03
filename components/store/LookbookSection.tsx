import Link from "next/link";
import type { LookbookConfig } from "@/types/shop";
import { storefrontBase } from "@/lib/storefront-base";

interface Props {
  config: LookbookConfig | undefined;
  shopSlug: string;
}

/**
 * Kolaż kadrów z sesji — bez nagłówka, bez cen, bez przycisków. Domy mody
 * budują tak stronę główną: najpierw zdjęcia, dopiero potem katalog.
 *
 * Kadry idą pełną szerokością okna (bez `max-w-7xl`), bo margines po bokach
 * odbiera fotografii skalę — to jedyny element strony, który ma dotykać
 * krawędzi ekranu.
 */
export default async function LookbookSection({ config, shopSlug }: Props) {
  const items = (config?.items ?? []).filter((i) => i.image);
  if (!config || config.visible === false || items.length === 0) return null;

  const base = await storefrontBase(shopSlug);
  const pairs = config.layout !== "wide";

  return (
    <section aria-label="Lookbook" className="bg-paper">
      <div className={pairs ? "grid grid-cols-1 sm:grid-cols-2" : "grid grid-cols-1"}>
        {items.map((item, i) => {
          const figure = (
            <figure className="relative group overflow-hidden bg-paper-3">
              <div className={pairs ? "aspect-[3/4]" : "aspect-[16/9]"}>
                <img
                  src={item.image}
                  alt={item.caption ?? ""}
                  className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                />
              </div>
              {item.caption && (
                <figcaption className="absolute inset-x-0 bottom-0 p-5 lg:p-7">
                  <span className="text-[11px] tracking-[0.24em] uppercase text-white drop-shadow-sm">
                    {item.caption}
                  </span>
                </figcaption>
              )}
            </figure>
          );

          if (!item.href) return <div key={i}>{figure}</div>;
          // Ścieżka wewnętrzna dostaje prefiks sklepu; pełny URL zostaje jak jest.
          const href = item.href.startsWith("http") ? item.href : `${base}${item.href}`;
          return (
            <Link key={i} href={href} className="block">
              {figure}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
