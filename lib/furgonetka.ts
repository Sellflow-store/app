/**
 * Integracja własna z Furgonetką — strona „my wystawiamy API".
 *
 * Furgonetka ma dwie drogi integracji. Ta tańsza odwraca kierunek: to ONA jest
 * klientem, a sklep tylko wystawia dwa adresy, które merchant wkleja u siebie
 * w panelu (Ustawienia → Integracje → Własne). Furgonetka cyklicznie pyta
 * `GET /orders` o zamówienia zmienione po wskazanej dacie, merchant robi z nich
 * etykiety u siebie, a numer przesyłki wraca do nas przez
 * `POST /orders/{id}/tracking_number`. Żadnego OAuth, żadnej umowy z
 * przewoźnikiem, żadnego sekretu poza tokenem per sklep.
 *
 * Specyfikacja (swagger, pobrany 2026-09-15):
 * https://furgonetka.pl/js/swagger/universal-integration-structure-documentation.yaml
 */

import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { isFurgonetkaService, serviceToCarrier } from "./furgonetka-services";

// Lista usług mieszka osobno (patrz nagłówek tam) — tutaj tylko ją przepuszczamy
// dalej, żeby wołający miał wszystko pod jednym importem po stronie serwera.
export {
  FURGONETKA_SERVICES,
  isFurgonetkaService,
  serviceToCarrier,
  type FurgonetkaService,
} from "./furgonetka-services";

// ─── Token integracji ────────────────────────────────────────────────────────

/** 32 znaki base64url z CSPRNG — merchant kopiuje to raz do panelu Furgonetki. */
export function generateIntegrationToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** 4 ostatnie znaki — panel pokazuje „…a9Fq", żeby merchant poznał, który token
 *  jest wpięty, nie ujawniając całości. */
export function tokenHint(token: string): string {
  return token.slice(-4);
}

/**
 * Token z nagłówka `Authorization`.
 *
 * Dokumentacja Furgonetki mówi o gołym tokenie („Authorization: token"), ale
 * przyjmujemy też formy z prefiksem — kosztuje jedną linijkę, a oszczędza
 * merchantowi wieczoru z nagłówkiem, którego i tak nie kontroluje.
 */
export function tokenFromHeader(header: string | null): string {
  if (!header) return "";
  return header.trim().replace(/^(Bearer|Token)\s+/i, "").trim();
}

/** Porównanie w stałym czasie — inaczej czas odpowiedzi zdradzałby prefiks. */
export function tokenMatches(provided: string, expectedHash: string | null): boolean {
  if (!provided || !expectedHash) return false;
  const a = Buffer.from(hashToken(provided), "hex");
  const b = Buffer.from(expectedHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ─── Mapowanie zamówienia na strukturę Furgonetki ────────────────────────────

/** ISO 8601 z sekundową precyzją w UTC — ich przykłady są bez strefy, ale
 *  „Z" jest jednoznaczne i mieści się w standardzie, na który się powołują. */
export function isoSeconds(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function money(v: string | null): number {
  const n = parseFloat(v ?? "0");
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

/** Dzielimy „Jan Kowalski" na imię i nazwisko — Furgonetka chce osobnych pól,
 *  a nasz checkout pyta o jedno. Bez spacji całość idzie jako imię. */
function splitName(full: string): { name: string; surname: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return { name: full.trim(), surname: "" };
  return { name: parts[0], surname: parts.slice(1).join(" ") };
}

export interface FurgonetkaProduct {
  sourceProductId: string;
  name: string;
  priceGross: number;
  taxRate: number | null;
  quantity: number;
  weight: number | null;
  width: number | null;
  height: number | null;
  depth: number | null;
  imageUrl: string | null;
}

export interface FurgonetkaAddress {
  name: string;
  surname: string;
  street: string;
  city: string;
  postcode: string;
  countryCode: string;
  phone: string;
  email: string;
}

export interface FurgonetkaOrder {
  sourceOrderId: string;
  sourceClientId: number | null;
  datetimeOrder: string;
  sourceDatetimeChange: string;
  service: string | null;
  serviceDescription: string | null;
  status: string;
  totalPrice: number;
  shippingCost: number;
  shippingMethodId: string | null;
  shippingTaxRate: number | null;
  totalPaid: number;
  codAmount: number;
  totalWeight: number | null;
  point: string | null;
  comment: string | null;
  shippingAddress: FurgonetkaAddress;
  invoiceAddress: null;
  products: FurgonetkaProduct[];
  paymentDatetime: null;
}

/** Gabaryt produktu — dokładamy go z tabeli produktów, bo snapshot pozycji
 *  w zamówieniu niesie tylko nazwę i cenę. */
export interface ParcelSize {
  weightGrams: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
}

interface OrderRow {
  orderNumber: string;
  customerEmail: string;
  customerName: string | null;
  customerPhone: string | null;
  items: unknown;
  shippingCost: string;
  total: string;
  status: string;
  paymentMethod: string | null;
  paymentStatus: string;
  shippingAddress: unknown;
  pickupPoint: unknown;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ItemSnapshot {
  productId?: string;
  name?: string;
  price?: string;
  qty?: number;
  size?: string | null;
  image?: string | null;
}

interface AddressSnapshot {
  name?: string;
  phone?: string | null;
  street?: string;
  zip?: string;
  city?: string;
  deliveryMethodId?: string;
  deliveryMethod?: string;
  deliveryMethodKind?: string;
}

interface PointSnapshot {
  code?: string;
  address?: string;
  carrier?: string;
}

/**
 * Zamówienie → struktura `OrderOut` Furgonetki.
 *
 * Zwraca `null`, gdy z zamówienia nie da się zrobić przesyłki: odbiór osobisty
 * albo brak kodu pocztowego i miasta. Takie pozycje pomijamy zamiast wysyłać
 * puste adresy, które i tak zatrzymałyby się na walidacji po ich stronie.
 */
export function mapOrderToFurgonetka(
  order: OrderRow,
  sizes: Map<string, ParcelSize>,
  serviceByMethod: Record<string, string>,
): FurgonetkaOrder | null {
  const addr = (order.shippingAddress ?? {}) as AddressSnapshot;
  const point = (order.pickupPoint ?? {}) as PointSnapshot;
  const items = (Array.isArray(order.items) ? order.items : []) as ItemSnapshot[];

  if (addr.deliveryMethodKind === "pickup") return null;
  const city = (addr.city ?? "").trim();
  const postcode = (addr.zip ?? "").trim();
  if (!city || !postcode) return null;

  // Mapowanie metody dostawy na usługę ustawia merchant w panelu. Gdy nic nie
  // wybrał, a klient wskazał paczkomat — wiemy, że to InPost, bo tylko stamtąd
  // bierzemy punkty. Poza tym zostawiamy `null`: przewoźnika wybierze sam
  // w Furgonetce, zamiast dostać nasze zgadywanie na etykiecie.
  const methodId = addr.deliveryMethodId ?? "";
  const mapped = serviceByMethod[methodId];
  const service = isFurgonetkaService(mapped)
    ? mapped
    : addr.deliveryMethodKind === "parcel_locker" && point.carrier === "inpost"
      ? "inpost"
      : null;

  // Kod punktu przekazujemy tylko wtedy, gdy pochodzi od TEGO przewoźnika —
  // kod paczkomatu InPostu w zleceniu Orlenu byłby cichym błędem na etykiecie.
  const pickedPoint = point.code ?? null;
  const pointCode =
    pickedPoint && service && serviceToCarrier(service) === (point.carrier ?? "inpost")
      ? pickedPoint
      : null;

  // Przy paczkomacie ulica bywa pusta (adresem jest punkt), a Furgonetka wymaga
  // czegoś w tym polu. Wpisujemy tam punkt — merchant od razu widzi w panelu,
  // gdzie paczka ma trafić. Liczy się punkt WYBRANY przez klienta, nie ten
  // przekazany dalej: przy niedopasowanym przewoźniku i tak chcemy wydać
  // zamówienie (z informacją, czego klient oczekiwał), a nie schować je cicho.
  const street = (addr.street ?? "").trim() || (pickedPoint ? `Paczkomat ${pickedPoint}` : "");
  if (!street) return null;

  const { name, surname } = splitName(addr.name ?? order.customerName ?? "");

  const paid = order.paymentStatus === "paid";
  const total = money(order.total);

  let weightGrams = 0;
  let weightKnown = false;
  const products: FurgonetkaProduct[] = items.map((i) => {
    const size = i.productId ? sizes.get(i.productId) : undefined;
    const qty = typeof i.qty === "number" && i.qty > 0 ? i.qty : 1;
    if (size?.weightGrams) {
      weightGrams += size.weightGrams * qty;
      weightKnown = true;
    }
    return {
      sourceProductId: i.productId ?? "",
      // Rozmiar dopisujemy do nazwy — na liście w Furgonetce to jedyne miejsce,
      // gdzie merchant zobaczy, który wariant pakuje.
      name: [i.name ?? "Produkt", i.size].filter(Boolean).join(" · ").slice(0, 200),
      priceGross: money(i.price ?? "0"),
      // Nie prowadzimy stawek VAT w sklepie; null = zwolnienie z VAT po ich stronie.
      taxRate: null,
      quantity: qty,
      weight: size?.weightGrams ? Math.round(size.weightGrams) / 1000 : null,
      width: size?.width ?? null,
      height: size?.height ?? null,
      depth: size?.length ?? null,
      // Limit pola to 128 znaków — dłuższy adres pomijamy, zamiast go obciąć
      // w środku i wysłać link, który nie działa.
      imageUrl: i.image && i.image.length <= 128 ? i.image : null,
    };
  });

  return {
    sourceOrderId: order.orderNumber,
    // Ich pole jest liczbą, a nasze id klienta to UUID — nie da się przekazać.
    sourceClientId: null,
    datetimeOrder: isoSeconds(order.createdAt),
    sourceDatetimeChange: isoSeconds(order.updatedAt),
    service,
    serviceDescription: addr.deliveryMethod ?? null,
    status: order.status,
    totalPrice: total,
    shippingCost: money(order.shippingCost),
    shippingMethodId: methodId || null,
    shippingTaxRate: null,
    totalPaid: paid ? total : 0,
    // Pobranie ma sens tylko dopóki nie zapłacono — inaczej kurier
    // zainkasowałby drugi raz.
    codAmount: order.paymentMethod === "cod" && !paid ? total : 0,
    totalWeight: weightKnown ? Math.round(weightGrams) / 1000 : null,
    point: pointCode,
    comment: order.notes,
    shippingAddress: {
      name,
      surname,
      street: street.slice(0, 255),
      city: city.slice(0, 100),
      postcode,
      // Wysyłamy wyłącznie po Polsce (zagranica w sklepie idzie „na zapytanie").
      countryCode: "PL",
      phone: (addr.phone ?? order.customerPhone ?? "").trim(),
      email: order.customerEmail,
    },
    invoiceAddress: null,
    products,
    paymentDatetime: null,
  };
}
