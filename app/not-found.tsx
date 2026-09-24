import { headers } from "next/headers";
import Link from "next/link";
import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { shops } from "@/lib/db/schema";

/**
 * Global 404 boundary. Catches notFound() from every segment (a shop that's
 * soft-deleted / suspended / disabled via getShopBySlug, a bad product id,
 * or any unmatched URL). We branch on the Host header so a public storefront
 * URL — which may be printed on packaging or shared by customers — gets a
 * branded "sklep niedostępny" instead of a raw 404, while the platform
 * (app.sell-flow.store) gets a generic message.
 *
 * A segment-level app/(storefront)/[shop]/not-found.tsx does NOT reliably
 * catch notFound() from its own page in this Next version, so the routing is
 * centralised here.
 */
export default async function NotFound() {
  const h = await headers();
  const host = h.get("host") ?? "";
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "sell-flow.store";
  const appSubdomain = process.env.NEXT_PUBLIC_APP_SUBDOMAIN ?? "app";
  const isPlatform =
    host === `${appSubdomain}.${appDomain}` ||
    host === `admin.${appDomain}` ||
    host === appDomain ||
    host === `www.${appDomain}`;

  if (isPlatform) return <PlatformNotFound />;

  // On a live shop's own host (subdomain or custom domain) the shop exists and
  // only the page is missing (bad product slug, removed blog post): say that
  // and link back to the shop instead of claiming the whole shop is gone.
  const liveShopName = await liveShopNameForHost(host, appDomain);
  return liveShopName ? <PageInShopNotFound shopName={liveShopName} /> : <StoreNotFound />;
}

async function liveShopNameForHost(host: string, appDomain: string): Promise<string | null> {
  if (!host || host.includes("localhost") || host.includes("127.0.0.1") || host.endsWith(".vercel.app")) {
    return null;
  }
  const slug = host.endsWith(`.${appDomain}`) ? host.slice(0, -(appDomain.length + 1)) : null;
  try {
    const shop = await db.query.shops.findFirst({
      columns: { name: true },
      where: and(
        slug ? or(eq(shops.slug, slug), eq(shops.customDomain, host)) : eq(shops.customDomain, host),
        eq(shops.active, true),
        eq(shops.suspended, false),
        isNull(shops.deletedAt),
      ),
    });
    return shop?.name ?? null;
  } catch {
    return null;
  }
}

function PageInShopNotFound({ shopName }: { shopName: string }) {
  return (
    <div className="min-h-screen grid place-items-center bg-white px-6">
      <div className="text-center max-w-md">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-3"
          style={{ color: "oklch(50% 0 0)", fontFamily: "var(--font-mono, ui-monospace)" }}
        >
          {shopName}
        </p>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-3">
          Nie znaleźliśmy tej strony
        </h1>
        <p className="text-base text-neutral-600">
          Produkt mógł zostać wycofany albo link jest nieaktualny. Zajrzyj na
          stronę główną sklepu, tam znajdziesz aktualną ofertę.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 text-sm font-semibold text-neutral-900 underline underline-offset-4"
        >
          Przejdź do sklepu
        </Link>
      </div>
    </div>
  );
}

function StoreNotFound() {
  return (
    <div className="min-h-screen grid place-items-center bg-white px-6">
      <div className="text-center max-w-md">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-3"
          style={{ color: "oklch(50% 0 0)", fontFamily: "var(--font-mono, ui-monospace)" }}
        >
          Sklep niedostępny
        </p>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-3">
          Nie znaleźliśmy tego sklepu
        </h1>
        <p className="text-base text-neutral-600">
          Ten sklep nie istnieje albo został wyłączony. Jeśli szukasz konkretnej
          marki, sprawdź adres lub skontaktuj się ze sprzedawcą.
        </p>
        <a
          href="https://sell-flow.store"
          className="inline-block mt-6 text-sm font-semibold text-neutral-900 underline underline-offset-4"
        >
          Załóż własny sklep na Sellflow
        </a>
      </div>
    </div>
  );
}

function PlatformNotFound() {
  return (
    <div className="min-h-screen grid place-items-center bg-white px-6">
      <div className="text-center max-w-md">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-3"
          style={{ color: "oklch(50% 0 0)", fontFamily: "var(--font-mono, ui-monospace)" }}
        >
          404
        </p>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-3">
          Nie znaleziono strony
        </h1>
        <p className="text-base text-neutral-600">
          Strona, której szukasz, nie istnieje lub została przeniesiona.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 text-sm font-semibold text-neutral-900 underline underline-offset-4"
        >
          Wróć na stronę główną
        </Link>
      </div>
    </div>
  );
}
