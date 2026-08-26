import { NextRequest, NextResponse } from "next/server";
import { searchPoints, titleCaseCity } from "@/lib/inpost";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Proxy do publicznego API punktów InPost.
 *
 * Idzie przez nasz serwer, a nie prosto z przeglądarki, z trzech powodów:
 * nie zależymy od nagłówków CORS InPostu, odpowiedzi wpadają we współdzielony
 * cache Next.js (punkty zmieniają się rzadko), a ruch da się ograniczyć.
 * Endpoint jest publiczny — wybór paczkomatu dzieje się przed zamówieniem.
 */
export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, "points", 60, 60_000);
  if (limited) return limited;

  const sp = req.nextUrl.searchParams;
  const lat = parseFloat(sp.get("lat") ?? "");
  const lng = parseFloat(sp.get("lng") ?? "");
  const query = (sp.get("q") ?? "").trim();
  const paymentOnly = sp.get("payment") === "1";

  const near =
    Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng, maxDistance: 15_000 } : undefined;

  // Kod pocztowy rozpoznajemy po kształcie i szukamy dokładnie; wszystko inne
  // traktujemy jak nazwę miasta (ShipX porównuje ją dokładnie, więc poprawiamy
  // wielkość liter za klienta).
  const isPostCode = /^\d{2}-?\d{3}$/.test(query);
  const postCode = isPostCode ? query.replace(/^(\d{2})-?(\d{3})$/, "$1-$2") : undefined;
  const city = !isPostCode && query ? titleCaseCity(query) : undefined;

  if (!near && !postCode && !city) {
    return NextResponse.json({ points: [] });
  }

  try {
    const points = await searchPoints({ near, postCode, city, paymentOnly, limit: 40 });
    return NextResponse.json({ points });
  } catch {
    return NextResponse.json(
      { error: "Nie udało się pobrać listy paczkomatów. Spróbuj ponownie." },
      { status: 502 }
    );
  }
}
