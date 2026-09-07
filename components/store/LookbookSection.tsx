import Link from "next/link";
import type { LookbookConfig, LookbookItem } from "@/types/shop";
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
 *
 * Kadr może być zdjęciem albo krótkim filmem (`item.video`). Film leci w pętli,
 * bez dźwięku i bez kontrolek — ma się zachowywać jak ożywione zdjęcie, nie jak
 * odtwarzacz. `image` zostaje wtedy plakatem na czas wczytywania i dla
 * przeglądarek, które blokują autoodtwarzanie.
 */
export default async function LookbookSection({ config, shopSlug }: Props) {
  const items = (config?.items ?? []).filter((i) => i.image || i.video);
  if (!config || config.visible === false || items.length === 0) return null;

  const base = await storefrontBase(shopSlug);
  const layout = config.layout ?? "pairs";

  // Pas płynący w lewo. Kadry idą w jednym rzędzie i wracają w pętli, więc
  // liczba kadrów nie ma znaczenia — mieści się ich dowolnie wiele, a strona
  // główna zostaje krótka. Druga kopia listy jest tylko po to, żeby przejście
  // z końca na początek nie miało szwu; dla czytnika ekranu jest ukryta.
  if (layout === "marquee") {
    const track = [...items, ...items];
    // Około 7 s na kadr — tempo spaceru, nie karuzeli.
    const duration = Math.max(28, items.length * 7);
    return (
      <section aria-label="Lookbook" className="bg-paper py-10 lg:py-16">
        <div className="lookbook-marquee-viewport overflow-hidden">
          <div className="lookbook-marquee flex w-max" style={{ animationDuration: `${duration}s` }}>
            {track.map((item, i) => (
              <div
                key={i}
                className="w-[58vw] sm:w-[34vw] lg:w-[23vw] shrink-0 mr-3 sm:mr-4 lg:mr-6"
                aria-hidden={i >= items.length}
              >
                <Frame item={item} base={base} aspect="aspect-[3/4]" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Układ redakcyjny: dwie kolumny, prawa zsunięta w dół. Kadry rozdzielamy
  // naprzemiennie, więc nieparzysta liczba nie zostawia sieroty w rzędzie —
  // kolumny po prostu kończą się na różnej wysokości, i o to chodzi.
  if (layout === "stagger") {
    const columns = [items.filter((_, i) => i % 2 === 0), items.filter((_, i) => i % 2 === 1)];
    return (
      <section aria-label="Lookbook" className="bg-paper px-4 sm:px-6 lg:px-10 py-10 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-10 max-w-[1600px] mx-auto">
          {columns.map((column, c) => (
            <div
              key={c}
              className={`flex flex-col gap-4 sm:gap-6 lg:gap-10 ${c === 1 ? "sm:mt-16 lg:mt-28" : ""}`}
            >
              {column.map((item, i) => (
                <Frame key={i} item={item} base={base} aspect="aspect-[3/4]" />
              ))}
            </div>
          ))}
        </div>
      </section>
    );
  }

  const pairs = layout !== "wide";
  return (
    <section aria-label="Lookbook" className="bg-paper">
      <div className={pairs ? "grid grid-cols-1 sm:grid-cols-2" : "grid grid-cols-1"}>
        {items.map((item, i) => (
          <Frame key={i} item={item} base={base} aspect={pairs ? "aspect-[3/4]" : "aspect-[16/9]"} />
        ))}
      </div>
    </section>
  );
}

function Frame({ item, base, aspect }: { item: LookbookItem; base: string; aspect: string }) {
  const figure = (
    <figure className="relative group overflow-hidden bg-paper-3">
      <div className={aspect}>
        {item.video ? (
          <video
            src={item.video}
            poster={item.image || undefined}
            autoPlay
            loop
            muted
            playsInline
            // preload="metadata": kilka kadrów filmowych na stronie głównej nie
            // może kosztować kilku megabajtów transferu przy pierwszym wejściu.
            preload="metadata"
            aria-label={item.caption ?? "Kadr z sesji"}
            className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <img
            src={item.image}
            alt={item.caption ?? ""}
            className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
          />
        )}
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

  if (!item.href) return figure;
  // Ścieżka wewnętrzna dostaje prefiks sklepu; pełny URL zostaje jak jest.
  const href = item.href.startsWith("http") ? item.href : `${base}${item.href}`;
  return (
    <Link href={href} className="block">
      {figure}
    </Link>
  );
}
