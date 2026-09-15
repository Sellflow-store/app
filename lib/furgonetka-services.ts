/**
 * Lista usług kurierskich w nomenklaturze Furgonetki.
 *
 * Osobny plik, bo tę listę rysuje też formularz w panelu („use client"), a
 * lib/furgonetka.ts sięga po node:crypto — import całego modułu wciągnąłby
 * kryptografię do paczki przeglądarki.
 */

import type { CarrierId } from "./tracking";

export const FURGONETKA_SERVICES = [
  { value: "inpost", label: "InPost Paczkomat", carrier: "inpost" },
  { value: "inpostkurier", label: "InPost Kurier", carrier: "inpost" },
  { value: "dpd", label: "DPD", carrier: "dpd" },
  { value: "orlen", label: "Orlen Paczka", carrier: "orlen" },
  { value: "poczta", label: "Poczta Polska", carrier: "poczta" },
  { value: "dhl", label: "DHL", carrier: "dhl" },
  { value: "dhlinternational", label: "DHL International", carrier: "dhl" },
  { value: "ups", label: "UPS", carrier: "ups" },
  { value: "gls", label: "GLS", carrier: "gls" },
  { value: "fedex", label: "FedEx", carrier: "fedex" },
] as const;

export type FurgonetkaService = (typeof FURGONETKA_SERVICES)[number]["value"];

export function isFurgonetkaService(v: unknown): v is FurgonetkaService {
  return typeof v === "string" && FURGONETKA_SERVICES.some((s) => s.value === v);
}

/** Usługa Furgonetki → nasze id przewoźnika. Nieznana usługa ląduje jako
 *  „inny przewoźnik": numer zapiszemy, linku do śledzenia nie zmyślimy. */
export function serviceToCarrier(service: string): CarrierId {
  const hit = FURGONETKA_SERVICES.find((s) => s.value === service.trim().toLowerCase());
  return (hit?.carrier as CarrierId) ?? "other";
}
