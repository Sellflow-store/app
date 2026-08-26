/**
 * Publiczne API punktów InPost (ShipX Points).
 *
 * Endpoint działa BEZ tokenu, bez konta i bez rejestrowania domeny — dlatego
 * wybór paczkomatu działa u każdego sklepu na platformie od razu, bez żadnej
 * konfiguracji po stronie merchanta. Alternatywy (GeoWidget InPostu, mapa
 * Furgonetki) wymagają klucza przypisanego do konkretnej domeny, co przy
 * subdomenach i własnych domenach klientów oznaczałoby wpis per sklep.
 */

const SHIPX_POINTS = "https://api-shipx-pl.easypack24.net/v1/points";

/** Punkt w kształcie, którego używa checkout — płaski i gotowy do pokazania. */
export interface InpostPoint {
  code: string;
  name: string;
  /** Jednolinijkowy adres: "Marszałkowska 94, 00-510 Warszawa" */
  address: string;
  /** Opis lokalizacji od InPostu, np. "Przy Novotel Warsaw Centrum" */
  description: string | null;
  lat: number;
  lng: number;
  openingHours: string | null;
  /** Czy punkt obsłuży płatność przy odbiorze — filtr dla zamówień za pobraniem. */
  paymentAvailable: boolean;
  /** Metry od punktu odniesienia; null gdy szukano bez współrzędnych. */
  distance: number | null;
}

interface ShipxPoint {
  name?: string;
  location?: { latitude?: number; longitude?: number };
  location_description?: string | null;
  opening_hours?: string | null;
  payment_available?: boolean;
  distance?: number | null;
  address?: { line1?: string; line2?: string };
  status?: number | string;
}

const FIELDS =
  "name,location,location_description,opening_hours,payment_available,distance,address";

function toPoint(raw: ShipxPoint): InpostPoint | null {
  const lat = raw.location?.latitude;
  const lng = raw.location?.longitude;
  if (!raw.name || typeof lat !== "number" || typeof lng !== "number") return null;
  return {
    code: raw.name,
    name: raw.name,
    address: [raw.address?.line1, raw.address?.line2].filter(Boolean).join(", "),
    description: raw.location_description ?? null,
    lat,
    lng,
    openingHours: raw.opening_hours ?? null,
    paymentAvailable: raw.payment_available === true,
    distance: typeof raw.distance === "number" ? raw.distance : null,
  };
}

export interface PointSearch {
  /** Kod pocztowy — dopasowanie dokładne, najpewniejszy sposób wyszukania. */
  postCode?: string;
  /** Miasto — UWAGA: ShipX dopasowuje dokładnie i Z UWZGLĘDNIENIEM wielkości
   *  liter ("warszawa" zwraca zero), więc wołający musi podać poprawną formę. */
  city?: string;
  /** Szukanie wokół współrzędnych — wynik posortowany po odległości. */
  near?: { lat: number; lng: number; maxDistance?: number };
  /** Zwróć tylko punkty obsługujące płatność przy odbiorze. */
  paymentOnly?: boolean;
  limit?: number;
}

/** Miasta ShipX są zapisane z wielkiej litery ("Nowy Sącz"), a klient pisze
 *  jak mu wygodnie. Bez tego wyszukiwanie po mieście prawie zawsze zwraca zero. */
export function titleCaseCity(input: string): string {
  return input
    .trim()
    .toLocaleLowerCase("pl-PL")
    .split(/(\s|-)/)
    .map((part) =>
      /^(\s|-)$/.test(part) ? part : part.charAt(0).toLocaleUpperCase("pl-PL") + part.slice(1)
    )
    .join("");
}

export async function searchPoints(q: PointSearch): Promise<InpostPoint[]> {
  const params = new URLSearchParams({
    type: "parcel_locker",
    functions: "parcel_collect",
    fields: FIELDS,
    per_page: String(Math.min(q.limit ?? 30, 100)),
  });
  if (q.near) {
    params.set("relative_point", `${q.near.lat},${q.near.lng}`);
    params.set("max_distance", String(q.near.maxDistance ?? 10_000));
  }
  if (q.postCode) params.set("post_code", q.postCode);
  if (q.city) params.set("city", q.city);

  const res = await fetch(`${SHIPX_POINTS}?${params}`, {
    // Punkty zmieniają się rzadko; godzinny cache oszczędza InPostowi ruchu
    // i przyspiesza otwarcie mapy kolejnym klientom tego samego sklepu.
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`ShipX points ${res.status}`);

  const data = (await res.json()) as { items?: ShipxPoint[] };
  const points = (data.items ?? []).map(toPoint).filter((p): p is InpostPoint => p !== null);
  return q.paymentOnly ? points.filter((p) => p.paymentAvailable) : points;
}

/**
 * Weryfikacja pojedynczego punktu — checkout nie może ufać kodowi z przeglądarki.
 *
 * Pułapka: dla nieistniejącego kodu ShipX odpowiada HTTP 200 z ciałem
 * `{"status":404,"key":"point_not_found"}`, więc sam status HTTP nic tu nie mówi.
 */
export async function fetchPointByCode(code: string): Promise<InpostPoint | null> {
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(code)) return null;
  try {
    const res = await fetch(`${SHIPX_POINTS}/${encodeURIComponent(code)}`, {
      next: { revalidate: 3600 },
    });
    const data = (await res.json()) as ShipxPoint;
    if (!res.ok || !data.name || String(data.status) === "404") return null;
    return toPoint(data);
  } catch {
    return null;
  }
}
