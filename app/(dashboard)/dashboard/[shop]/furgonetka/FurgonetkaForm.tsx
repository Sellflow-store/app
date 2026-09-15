"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, Link2, RefreshCw, Unplug } from "lucide-react";
import { FURGONETKA_SERVICES } from "@/lib/furgonetka-services";
import type { DeliveryMethodKind } from "@/types/shop";

const CARD = {
  background: "#fff",
  border: "1px solid oklch(90% 0 0)",
} as const;

const inputStyle = {
  border: "1.5px solid oklch(88% 0 0)",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "13px",
  color: "oklch(11% 0.10 275)",
  background: "#fff",
  fontFamily: "var(--font-body)",
  width: "100%",
  outline: "none",
};

export interface IntegrationState {
  connected: boolean;
  enabled: boolean;
  tokenHint: string | null;
  lastPullAt: string | null;
  lastPullCount: number | null;
  lastPushAt: string | null;
  serviceByMethod: Record<string, string>;
}

interface MethodRow {
  id: string;
  label: string;
  kind: DeliveryMethodKind;
}

interface Props {
  shopSlug: string;
  initialState: IntegrationState;
  baseUrl: string;
  methods: MethodRow[];
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className="relative w-9 h-5 rounded-full transition-all cursor-pointer shrink-0"
      style={{ background: checked ? "oklch(56% 0.30 335)" : "oklch(82% 0 0)" }}
      onClick={() => onChange(!checked)}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
        style={{ left: checked ? "1.125rem" : "0.125rem" }}
      />
    </div>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Schowek bywa zablokowany (http, uprawnienia) — pole jest zaznaczalne,
      // więc merchant zawsze może skopiować ręcznie.
    }
  }

  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: "oklch(35% 0 0)" }}>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          readOnly
          value={value}
          onFocus={(e) => e.target.select()}
          style={{ ...inputStyle, fontFamily: "ui-monospace, monospace", fontSize: "12px" }}
        />
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 rounded-[10px] shrink-0 transition-all"
          style={{
            background: copied ? "oklch(52% 0.20 158)" : "oklch(96% 0 0)",
            color: copied ? "#fff" : "oklch(25% 0 0)",
            border: "1.5px solid oklch(88% 0 0)",
          }}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Skopiowano" : "Kopiuj"}
        </button>
      </div>
    </div>
  );
}

function formatMoment(iso: string | null): string {
  if (!iso) return "jeszcze nigdy";
  return new Date(iso).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
}

export default function FurgonetkaForm({ shopSlug, initialState, baseUrl, methods }: Props) {
  const [state, setState] = useState<IntegrationState>(initialState);
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>(initialState.serviceByMethod);
  const [mapSaved, setMapSaved] = useState(false);

  async function generateToken() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/furgonetka`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as IntegrationState & { token: string };
      setState(data);
      setFreshToken(data.token);
    } catch {
      setError("Nie udało się wygenerować tokena. Spróbuj ponownie.");
    }
    setBusy(false);
  }

  async function patch(body: Record<string, unknown>) {
    setError(null);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/furgonetka`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setState((await res.json()) as IntegrationState);
      return true;
    } catch {
      setError("Nie udało się zapisać zmiany.");
      return false;
    }
  }

  async function disconnect() {
    if (!confirm("Rozłączyć Furgonetkę? Dotychczasowy token przestanie działać od razu.")) return;
    setBusy(true);
    try {
      await fetch(`/api/shops/${shopSlug}/furgonetka`, { method: "DELETE" });
      setState({
        connected: false,
        enabled: false,
        tokenHint: null,
        lastPullAt: null,
        lastPullCount: null,
        lastPushAt: null,
        serviceByMethod: {},
      });
      setMapping({});
      setFreshToken(null);
    } catch {
      setError("Nie udało się rozłączyć integracji.");
    }
    setBusy(false);
  }

  async function saveMapping() {
    if (await patch({ serviceByMethod: mapping })) {
      setMapSaved(true);
      setTimeout(() => setMapSaved(false), 2500);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
        >
          Furgonetka
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
          Zamówienia ze sklepu trafiają do Twojego panelu Furgonetki, a numer przesyłki
          wraca tutaj i sam idzie mailem do klienta.
        </p>
      </div>

      {error && (
        <div
          className="rounded-xl px-4 py-3 mb-5 text-xs font-medium"
          style={{
            background: "oklch(50% 0.20 20 / 0.08)",
            color: "oklch(40% 0.18 20)",
            border: "1px solid oklch(50% 0.20 20 / 0.25)",
          }}
        >
          {error}
        </div>
      )}

      {/* ── Krok 1: dane do wklejenia ─────────────────────────────────────── */}
      <div className="rounded-2xl p-5 mb-5" style={CARD}>
        <div className="flex items-center gap-2 mb-1">
          <Link2 className="w-4 h-4" style={{ color: "oklch(56% 0.30 335)" }} />
          <h2
            className="text-sm font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
          >
            Dane do wklejenia w Furgonetce
          </h2>
        </div>
        <p className="text-xs mb-4" style={{ color: "oklch(50% 0 0)" }}>
          W Furgonetce wejdź w{" "}
          <a
            href="https://furgonetka.pl/konto/integracje/dodaj/universal"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: "oklch(56% 0.30 335)" }}
          >
            Ustawienia → Integracje → Własne
          </a>{" "}
          i wklej te dwie wartości. Włącz tam „Synchronizację zamówień” oraz „Wysyłkę
          informacji o przesyłce” — bez tego drugiego numer nie wróci do sklepu.
        </p>

        <div className="space-y-3">
          <CopyField label="Adres URL" value={baseUrl} />

          {freshToken ? (
            <div>
              <CopyField label="Token" value={freshToken} />
              <p
                className="text-xs mt-2 rounded-lg px-3 py-2"
                style={{
                  background: "oklch(75% 0.15 85 / 0.12)",
                  color: "oklch(40% 0.12 70)",
                  border: "1px solid oklch(75% 0.15 85 / 0.3)",
                }}
              >
                Skopiuj go teraz — trzymamy tylko jego skrót i nie pokażemy go ponownie.
                Jeśli go zgubisz, wygeneruj nowy i wklej w Furgonetce jeszcze raz.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "oklch(35% 0 0)" }}>
                Token
              </label>
              <div
                className="rounded-[10px] px-3 py-2.5 text-xs"
                style={{ background: "oklch(97% 0 0)", border: "1.5px solid oklch(90% 0 0)", color: "oklch(45% 0 0)" }}
              >
                {state.connected
                  ? `Token jest aktywny (kończy się na „${state.tokenHint}”). Nie możemy go pokazać ponownie.`
                  : "Jeszcze nie wygenerowany."}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={generateToken}
            disabled={busy}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full transition-all disabled:opacity-60"
            style={{ background: "oklch(56% 0.30 335)", color: "#fff" }}
          >
            {state.connected ? <RefreshCw className="w-3.5 h-3.5" /> : <KeyRound className="w-3.5 h-3.5" />}
            {busy ? "Chwila…" : state.connected ? "Wygeneruj nowy token" : "Wygeneruj token"}
          </button>

          {state.connected && (
            <button
              onClick={disconnect}
              disabled={busy}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full transition-all disabled:opacity-60"
              style={{ background: "oklch(96% 0 0)", color: "oklch(40% 0.18 20)", border: "1px solid oklch(88% 0 0)" }}
            >
              <Unplug className="w-3.5 h-3.5" />
              Rozłącz
            </button>
          )}
        </div>

        {state.connected && (
          <p className="text-xs mt-3" style={{ color: "oklch(55% 0 0)" }}>
            Wymiana tokena unieważnia poprzedni — po wygenerowaniu nowego trzeba go
            wkleić w Furgonetce, inaczej synchronizacja stanie.
          </p>
        )}
      </div>

      {/* ── Krok 2: włącznik i stan ───────────────────────────────────────── */}
      {state.connected && (
        <div className="rounded-2xl p-5 mb-5" style={CARD}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2
                className="text-sm font-semibold"
                style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
              >
                Synchronizacja włączona
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
                Wyłącznik zatrzymuje wydawanie zamówień bez kasowania tokena.
              </p>
            </div>
            <Toggle checked={state.enabled} onChange={(v) => patch({ enabled: v })} />
          </div>

          <div
            className="grid grid-cols-2 gap-3 mt-4 pt-4 text-xs"
            style={{ borderTop: "1px solid oklch(93% 0 0)", color: "oklch(45% 0 0)" }}
          >
            <div>
              <div className="font-semibold" style={{ color: "oklch(25% 0 0)" }}>
                Ostatnie pobranie zamówień
              </div>
              <div className="mt-0.5">
                {formatMoment(state.lastPullAt)}
                {state.lastPullCount !== null && state.lastPullAt
                  ? ` · ${state.lastPullCount} zamówień`
                  : ""}
              </div>
            </div>
            <div>
              <div className="font-semibold" style={{ color: "oklch(25% 0 0)" }}>
                Ostatni numer przesyłki z Furgonetki
              </div>
              <div className="mt-0.5">{formatMoment(state.lastPushAt)}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Krok 3: mapowanie metod dostawy ───────────────────────────────── */}
      {state.connected && methods.length > 0 && (
        <div className="rounded-2xl p-5" style={CARD}>
          <h2
            className="text-sm font-semibold mb-1"
            style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
          >
            Metody dostawy → przewoźnik
          </h2>
          <p className="text-xs mb-4" style={{ color: "oklch(50% 0 0)" }}>
            Przy zamówieniu podpowiemy Furgonetce, jakim przewoźnikiem ma iść paczka.
            Zostaw „nie podpowiadaj”, jeśli wolisz wybierać za każdym razem sam.
          </p>

          <div className="space-y-2">
            {methods.map((m) => (
              <div
                key={m.id}
                className="grid grid-cols-[1fr_12rem] gap-3 items-center p-3 rounded-xl"
                style={{ background: "oklch(97% 0 0)", border: "1px solid oklch(92% 0 0)" }}
              >
                <div>
                  <div className="text-sm font-medium" style={{ color: "oklch(20% 0 0)" }}>
                    {m.label}
                  </div>
                  <div className="text-xs" style={{ color: "oklch(55% 0 0)" }}>
                    {m.kind === "parcel_locker" ? "Paczkomat / punkt odbioru" : "Kurier pod adres"}
                  </div>
                </div>
                <select
                  value={mapping[m.id] ?? ""}
                  onChange={(e) =>
                    setMapping((prev) => {
                      const next = { ...prev };
                      if (e.target.value) next[m.id] = e.target.value;
                      else delete next[m.id];
                      return next;
                    })
                  }
                  style={inputStyle}
                >
                  <option value="">Nie podpowiadaj</option>
                  {FURGONETKA_SERVICES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <p className="text-xs mt-3" style={{ color: "oklch(55% 0 0)" }}>
            Kod paczkomatu przekazujemy tylko wtedy, gdy wskazany przewoźnik go obsłuży —
            punkty zbieramy z sieci InPostu.
          </p>

          <button
            onClick={saveMapping}
            className="mt-4 text-sm font-semibold px-4 py-2.5 rounded-full transition-all"
            style={{ background: mapSaved ? "oklch(52% 0.20 158)" : "oklch(56% 0.30 335)", color: "#fff" }}
          >
            {mapSaved ? "Zapisano!" : "Zapisz mapowanie"}
          </button>
        </div>
      )}
    </div>
  );
}
