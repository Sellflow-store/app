"use client";

import { useState } from "react";
import { CreditCard, KeyRound, Trash2 } from "lucide-react";

export interface TpayState {
  connected: boolean;
  enabled: boolean;
  clientId: string | null;
  secretHint: string | null;
  sandbox: boolean;
  connectedAt: string | null;
  lastNotificationAt: string | null;
  encryptionReady: boolean;
}

const inputStyle = {
  border: "1.5px solid var(--panel-border)",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "13px",
  color: "var(--panel-ink)",
  background: "var(--panel-surface)",
  fontFamily: "var(--font-mono, monospace)",
  width: "100%",
  outline: "none",
};

function Toggle({ checked, onChange, label, disabled }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-center gap-2.5 w-fit ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      <div
        className="relative w-9 h-5 rounded-full transition-all"
        style={{ background: checked ? "var(--panel-primary)" : "var(--panel-border-strong)" }}
        onClick={() => !disabled && onChange(!checked)}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
          style={{ left: checked ? "1.125rem" : "0.125rem" }}
        />
      </div>
      <span className="text-xs font-medium" style={{ color: "var(--panel-ink)" }}>{label}</span>
    </label>
  );
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
}

export default function TpayCard({
  shopSlug,
  initial,
  onEnabledChange,
}: {
  shopSlug: string;
  initial: TpayState;
  onEnabledChange: (enabled: boolean) => void;
}) {
  const [state, setState] = useState<TpayState>(initial);
  const [editing, setEditing] = useState(!initial.connected);
  const [clientId, setClientId] = useState(initial.clientId ?? "");
  const [clientSecret, setClientSecret] = useState("");
  const [sandbox, setSandbox] = useState(initial.sandbox);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  function apply(next: TpayState) {
    setState(next);
    onEnabledChange(next.connected && next.enabled);
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/tpay`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret, sandbox }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error ?? "Nie udało się zapisać kluczy.", error: true });
        return;
      }
      apply(data as TpayState);
      setClientSecret("");
      setEditing(false);
      setMessage({ text: "Klucze zweryfikowane w Tpay. Płatność online jest włączona w sklepie.", error: false });
    } catch {
      setMessage({ text: "Brak połączenia. Spróbuj ponownie.", error: true });
    } finally {
      setBusy(false);
    }
  }

  async function toggle(enabled: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/tpay`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      if (res.ok) apply(data as TpayState);
      else setMessage({ text: data.error ?? "Nie udało się zmienić ustawienia.", error: true });
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!confirm("Odłączyć konto Tpay? Klienci przestaną widzieć płatność online.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/tpay`, { method: "DELETE" });
      if (res.ok) {
        apply({ ...state, connected: false, enabled: false, clientId: null, secretHint: null });
        setClientId("");
        setEditing(true);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl p-5 mb-5" style={{ background: "var(--panel-surface)", border: "1px solid var(--panel-border)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <CreditCard className="w-4 h-4" style={{ color: "var(--panel-ink)" }} strokeWidth={1.5} />
          <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--panel-ink)" }}>
            Płatność online (Tpay)
          </h2>
        </div>
        {state.connected && (
          <Toggle
            checked={state.enabled}
            onChange={toggle}
            disabled={busy}
            label={state.enabled ? "Włączona" : "Wyłączona"}
          />
        )}
      </div>

      <p className="text-xs mb-4" style={{ color: "var(--panel-ink-muted)" }}>
        BLIK, karty i szybkie przelewy na Twoim koncie Tpay. Klucze znajdziesz w panelu Tpay:
        Integracje → API → Klucze API (Client ID i Secret). Wpłaty potwierdzają się same, bez
        ręcznego oznaczania zamówień.
      </p>

      {!state.encryptionReady && (
        <p className="text-xs mb-4 font-medium" style={{ color: "oklch(40% 0.18 20)" }}>
          Platforma nie ma jeszcze skonfigurowanego szyfrowania kluczy, więc zapis jest chwilowo niemożliwy.
        </p>
      )}

      {state.connected && !editing && (
        <dl className="grid grid-cols-[8rem_1fr] gap-y-1.5 text-xs mb-4" style={{ color: "var(--panel-ink)" }}>
          <dt>Client ID</dt>
          <dd className="font-mono break-all">{state.clientId}</dd>
          <dt>Secret</dt>
          <dd className="font-mono">••••{state.secretHint}</dd>
          <dt>Środowisko</dt>
          <dd>{state.sandbox ? "Sandbox (testowe)" : "Produkcyjne"}</dd>
          <dt>Podłączono</dt>
          <dd>{fmtDate(state.connectedAt)}</dd>
          <dt>Ostatnie powiadomienie</dt>
          <dd>{fmtDate(state.lastNotificationAt)}</dd>
        </dl>
      )}

      {editing ? (
        <>
          <div className="mb-3">
            <label htmlFor="tpay-client-id" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--panel-ink)" }}>
              Client ID
            </label>
            <input id="tpay-client-id" value={clientId} onChange={(e) => setClientId(e.target.value)} style={inputStyle} autoComplete="off" />
          </div>
          <div className="mb-3">
            <label htmlFor="tpay-secret" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--panel-ink)" }}>
              Secret
            </label>
            <input
              id="tpay-secret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              style={inputStyle}
              autoComplete="new-password"
            />
          </div>
          <div className="mb-4">
            <Toggle checked={sandbox} onChange={setSandbox} label="Konto testowe (sandbox)" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={busy || !clientId.trim() || !clientSecret.trim() || !state.encryptionReady}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full disabled:opacity-50"
              style={{ background: "var(--panel-accent)", color: "#fff" }}
            >
              <KeyRound className="w-3.5 h-3.5" strokeWidth={2} />
              {busy ? "Sprawdzam w Tpay…" : "Zapisz i połącz"}
            </button>
            {state.connected && (
              <button
                onClick={() => setEditing(false)}
                className="text-xs font-medium px-3 py-2"
                style={{ color: "var(--panel-ink-muted)" }}
              >
                Anuluj
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-semibold px-4 py-2 rounded-full"
            style={{ border: "1.5px solid var(--panel-border-strong)", color: "var(--panel-ink)" }}
          >
            Zmień klucze
          </button>
          <button
            onClick={disconnect}
            disabled={busy}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2"
            style={{ color: "oklch(45% 0.18 20)" }}
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            Odłącz
          </button>
        </div>
      )}

      {message && (
        <p className="text-xs mt-3 font-medium" style={{ color: message.error ? "oklch(40% 0.18 20)" : "oklch(40% 0.16 145)" }}>
          {message.text}
        </p>
      )}
    </div>
  );
}
