"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Search, LocateFixed, Check, X, Loader2 } from "lucide-react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";

export interface PickedPoint {
  code: string;
  name: string;
  address: string;
  description: string | null;
  lat: number;
  lng: number;
  openingHours: string | null;
  paymentAvailable: boolean;
  distance: number | null;
}

interface Props {
  value: PickedPoint | null;
  onChange: (p: PickedPoint | null) => void;
  /** Zamówienie za pobraniem — pokazujemy tylko punkty, które przyjmą płatność. */
  paymentOnly?: boolean;
  /** Wstępne zapytanie, zwykle kod pocztowy z adresu wpisanego wyżej. */
  initialQuery?: string;
}

/** Kafelki z OpenStreetMap. Podmiana na własnego dostawcę = jedna zmienna. */
const TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ?? "&copy; OpenStreetMap";

const POLAND_CENTER: [number, number] = [52.06, 19.48];

function formatDistance(m: number | null): string | null {
  if (m == null) return null;
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

export default function PickupPointPicker({
  value,
  onChange,
  paymentOnly = false,
  initialQuery = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [points, setPoints] = useState<PickedPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  // Mapa powstaje od nowa przy każdym otwarciu panelu, a znaczniki trzeba
  // wtedy nanieść ponownie. Musi to być LICZNIK, nie flaga: sprzątanie ustawia
  // false, a tworzenie nowej mapy true w tym samym batchu Reacta, więc wartość
  // logiczna wraca do punktu wyjścia i efekt zależny od niej nigdy nie rusza —
  // mapa zostawała pusta mimo aktualnych wyników wyszukiwania.
  const [mapEpoch, setMapEpoch] = useState(0);

  const mapNode = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  // Leaflet ładujemy dopiero po otwarciu i tylko w przeglądarce — moduł sięga
  // po `window` przy imporcie, więc nie może pojechać w bundlu serwerowym.
  const leafletRef = useRef<typeof import("leaflet") | null>(null);

  const runSearch = useCallback(
    async (params: { q?: string; lat?: number; lng?: number }) => {
      setLoading(true);
      setError(null);
      try {
        const sp = new URLSearchParams();
        if (params.q) sp.set("q", params.q);
        if (params.lat != null && params.lng != null) {
          sp.set("lat", String(params.lat));
          sp.set("lng", String(params.lng));
        }
        if (paymentOnly) sp.set("payment", "1");
        const res = await fetch(`/api/points?${sp}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPoints(data.points as PickedPoint[]);
        setSearched(true);
      } catch {
        setError("Nie udało się pobrać paczkomatów. Spróbuj ponownie.");
        setPoints([]);
      } finally {
        setLoading(false);
      }
    },
    [paymentOnly]
  );

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Twoja przeglądarka nie udostępnia lokalizacji. Wpisz kod pocztowy.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => runSearch({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setLoading(false);
        setError("Nie udało się ustalić lokalizacji. Wpisz kod pocztowy lub miasto.");
      },
      { timeout: 8000 }
    );
  }

  // ── Mapa: tworzona po otwarciu, sprzątana po zamknięciu ──────────────────
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      const L = leafletRef.current ?? (await import("leaflet"));
      if (cancelled) return;
      leafletRef.current = L;
      if (!mapNode.current || mapRef.current) return;

      const map = L.map(mapNode.current, { scrollWheelZoom: false }).setView(POLAND_CENTER, 6);
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);
      mapRef.current = map;
      setMapEpoch((n) => n + 1);
      // Kontener dostaje realny rozmiar dopiero po wyrenderowaniu panelu.
      setTimeout(() => map.invalidateSize(), 60);
    })().catch((e) => {
      // Bez tego błąd inicjalizacji mapy ginie w nieobsłużonym promisie i klient
      // widzi pusty prostokąt bez żadnej informacji.
      console.error("Mapa paczkomatów:", e);
      setError("Nie udało się załadować mapy. Wybierz punkt z listy obok.");
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, [open]);

  // ── Znaczniki dla aktualnych wyników ─────────────────────────────────────
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (points.length === 0) return;

    const icon = L.divIcon({
      className: "",
      html: `<span style="display:block;width:14px;height:14px;border-radius:50%;background:var(--accent-brand,#111);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    for (const p of points) {
      const marker = L.marker([p.lat, p.lng], { icon, title: p.code }).addTo(map);
      marker.bindPopup(
        `<strong>${p.code}</strong><br>${p.address}` +
          (p.description ? `<br><em>${p.description}</em>` : "")
      );
      marker.on("click", () => onChange(p));
      markersRef.current.push(marker);
    }
    map.fitBounds(
      L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])),
      { padding: [30, 30], maxZoom: 15 }
    );
  }, [points, onChange, mapEpoch]);

  // Wybór z listy przesuwa mapę na punkt.
  useEffect(() => {
    if (!value || !mapRef.current) return;
    mapRef.current.setView([value.lat, value.lng], 15);
  }, [value, mapEpoch]);

  // ── Widok zwinięty ───────────────────────────────────────────────────────
  if (!open) {
    return (
      <div className="border border-rule rounded-input p-4">
        {value ? (
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <MapPin className="w-4 h-4 text-ink shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">Paczkomat {value.code}</p>
                <p className="text-xs text-ink-2 mt-0.5 break-words">{value.address}</p>
                {value.description && (
                  <p className="text-xs text-ink-2/70 mt-0.5">{value.description}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-xs font-semibold text-ink underline underline-offset-2 shrink-0"
            >
              Zmień
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-ink-2">Wybierz paczkomat, do którego dowieziemy paczkę.</p>
            <button
              type="button"
              onClick={() => {
                setOpen(true);
                if (!searched && initialQuery) runSearch({ q: initialQuery });
              }}
              className="text-xs font-semibold px-4 py-2.5 rounded-button bg-ink text-on-ink shrink-0"
            >
              Wybierz paczkomat
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Widok rozwinięty ─────────────────────────────────────────────────────
  return (
    <div className="border border-ink rounded-input overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-rule">
        <p className="text-sm font-semibold text-ink">Wybierz paczkomat</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Zamknij wybór paczkomatu"
          className="p-1 text-ink-2 hover:text-ink transition-colors"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-2/60"
              strokeWidth={1.5}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  // Formularz zamówienia otacza ten komponent — bez tego Enter
                  // w wyszukiwarce wysłałby całe zamówienie.
                  e.preventDefault();
                  if (query.trim()) runSearch({ q: query.trim() });
                }
              }}
              placeholder="Kod pocztowy albo miasto"
              aria-label="Szukaj paczkomatu"
              className="w-full border border-rule rounded-input pl-9 pr-3 py-2.5 text-sm text-ink bg-paper outline-none focus:border-ink transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={() => query.trim() && runSearch({ q: query.trim() })}
            disabled={loading || !query.trim()}
            className="text-xs font-semibold px-4 rounded-input bg-ink text-on-ink disabled:opacity-40 shrink-0"
          >
            Szukaj
          </button>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={loading}
            aria-label="Znajdź paczkomaty w pobliżu"
            title="Znajdź w pobliżu"
            className="px-3 rounded-input border border-rule text-ink-2 hover:border-ink hover:text-ink transition-colors disabled:opacity-40 shrink-0"
          >
            <LocateFixed className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {paymentOnly && (
          <p className="text-[11px] text-ink-2/80">
            Pokazujemy tylko paczkomaty, w których zapłacisz przy odbiorze.
          </p>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="grid md:grid-cols-[1fr_1.1fr] gap-3">
          <div className="order-2 md:order-1 max-h-72 overflow-y-auto -mr-1 pr-1 space-y-2">
            {loading && (
              <p className="flex items-center gap-2 text-xs text-ink-2 py-4">
                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                Szukam paczkomatów…
              </p>
            )}
            {!loading && searched && points.length === 0 && (
              <p className="text-xs text-ink-2 py-4">
                Nic nie znaleźliśmy. Spróbuj innego kodu pocztowego albo nazwy miasta.
              </p>
            )}
            {!loading && !searched && (
              <p className="text-xs text-ink-2 py-4">
                Wpisz kod pocztowy albo miasto, żeby zobaczyć paczkomaty w okolicy.
              </p>
            )}
            {points.map((p) => {
              const active = value?.code === p.code;
              return (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => onChange(p)}
                  className={`w-full text-left border rounded-input px-3 py-2.5 transition-colors ${
                    active ? "border-ink bg-paper-2" : "border-rule hover:border-ink-2/50"
                  }`}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-ink">{p.code}</span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      {formatDistance(p.distance) && (
                        <span className="text-[11px] text-ink-2 tabular-nums">
                          {formatDistance(p.distance)}
                        </span>
                      )}
                      {active && <Check className="w-3.5 h-3.5 text-ink" strokeWidth={2} />}
                    </span>
                  </span>
                  <span className="block text-xs text-ink-2 mt-0.5">{p.address}</span>
                  {p.description && (
                    <span className="block text-[11px] text-ink-2/70 mt-0.5">{p.description}</span>
                  )}
                  {p.openingHours && (
                    <span className="block text-[11px] text-ink-2/70 mt-0.5">
                      {p.openingHours}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div
            ref={mapNode}
            className="order-1 md:order-2 h-56 md:h-72 rounded-input overflow-hidden border border-rule z-0"
            role="application"
            aria-label="Mapa paczkomatów"
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-ink-2 min-w-0 truncate">
            {value ? `Wybrano: ${value.code} — ${value.address}` : "Nie wybrano paczkomatu"}
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={!value}
            className="text-xs font-semibold px-4 py-2.5 rounded-button bg-accent-brand text-on-accent disabled:opacity-40 shrink-0"
          >
            Gotowe
          </button>
        </div>
      </div>
    </div>
  );
}
