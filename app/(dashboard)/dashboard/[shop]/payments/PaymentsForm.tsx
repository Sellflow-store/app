"use client";

import { useState } from "react";
import { Save, Landmark, HandCoins } from "lucide-react";
import type { CheckoutConfig } from "@/types/shop";
import { isValidNrb, formatNrb, normalizeNrb } from "@/lib/nrb";
import TpayCard, { type TpayState } from "./TpayCard";

const inputStyle = {
  border: "1px solid var(--panel-border)",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "13.5px",
  color: "var(--panel-ink)",
  background: "var(--panel-surface)",
  fontFamily: "var(--font-body)",
  width: "100%",
  outline: "none",
};

const focusProps = {
  onFocus: (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = "var(--panel-primary)"),
  onBlur: (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = "var(--panel-border)"),
};

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer w-fit">
      <div
        className="relative w-9 h-5 rounded-full transition-all"
        style={{ background: checked ? "var(--panel-primary)" : "var(--panel-border-strong)" }}
        onClick={() => onChange(!checked)}
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

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-xs font-semibold mb-1.5" style={{ color: "var(--panel-ink)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function normalizePrice(raw: string): string | null {
  const cleaned = raw.replace(",", ".").replace(/[^\d.]/g, "");
  if (cleaned === "") return "0.00";
  const n = parseFloat(cleaned);
  if (isNaN(n) || n < 0) return null;
  return n.toFixed(2);
}

interface Props {
  shopSlug: string;
  initialConfig: CheckoutConfig;
  initialTpay: TpayState;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function PaymentsForm({ shopSlug, initialConfig, initialTpay }: Props) {
  const [onlineActive, setOnlineActive] = useState(initialTpay.connected && initialTpay.enabled);
  const [transferEnabled, setTransferEnabled] = useState(initialConfig.transferEnabled);
  const [bankAccount, setBankAccount] = useState(initialConfig.bankAccount);
  const [accountOwner, setAccountOwner] = useState(initialConfig.accountOwner);
  const [codEnabled, setCodEnabled] = useState(initialConfig.codEnabled);
  const [codFee, setCodFee] = useState(initialConfig.codFee);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSave() {
    if (!transferEnabled && !codEnabled && !onlineActive) {
      setValidationError("Włącz przynajmniej jedną metodę płatności — inaczej klienci nie złożą zamówienia.");
      return;
    }
    if (transferEnabled) {
      const digits = normalizeNrb(bankAccount);
      if (digits.length !== 26) {
        setValidationError("Numer konta powinien mieć 26 cyfr (polski NRB).");
        return;
      }
      // Suma kontrolna wyłapuje przekręcone cyfry. Bez tego jedynym sygnałem
      // błędu byłoby to, że przelewy od klientów nigdy nie przychodzą.
      if (!isValidNrb(digits)) {
        setValidationError(
          "Ten numer konta ma błędną sumę kontrolną — sprawdź, czy nie ma literówki."
        );
        return;
      }
    }
    const fee = normalizePrice(codFee);
    if (fee === null) {
      setValidationError("Niepoprawna opłata za pobranie.");
      return;
    }

    setValidationError(null);
    setSaveState("saving");
    try {
      const value: CheckoutConfig = {
        transferEnabled,
        bankAccount: transferEnabled ? formatNrb(bankAccount) : bankAccount.trim(),
        accountOwner: accountOwner.trim(),
        codEnabled,
        codFee: fee,
      };
      const res = await fetch(`/api/shops/${shopSlug}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "checkout", value }),
      });
      if (res.ok) setCodFee(fee);
      setSaveState(res.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
    setTimeout(() => setSaveState("idle"), 2500);
  }

  const buttonLabel =
    saveState === "saving" ? "Zapisywanie…"
    : saveState === "saved" ? "Zapisano"
    : saveState === "error" ? "Błąd, spróbuj ponownie"
    : "Zapisz zmiany";

  const buttonBg =
    saveState === "saved" ? "var(--panel-success)"
    : saveState === "error" ? "oklch(50% 0.20 20)"
    : "var(--panel-accent)";

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--panel-ink)" }}
          >
            Płatności
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--panel-ink-muted)" }}>
            Jak klienci płacą za zamówienia w Twoim sklepie
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveState === "saving"}
          className="flex items-center gap-2 h-9 px-3.5 text-[13px] font-semibold rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: buttonBg, color: "#fff" }}
        >
          <Save className="w-3.5 h-3.5" strokeWidth={2} />
          {buttonLabel}
        </button>
      </div>

      {validationError && (
        <div
          className="rounded-xl px-4 py-3 mb-5 text-xs font-medium"
          style={{ background: "oklch(50% 0.20 20 / 0.08)", color: "oklch(40% 0.18 20)", border: "1px solid oklch(50% 0.20 20 / 0.25)" }}
        >
          {validationError}
        </div>
      )}

      {/* Online (Tpay) — zapisuje się osobno, własnym przyciskiem */}
      <TpayCard shopSlug={shopSlug} initial={initialTpay} onEnabledChange={setOnlineActive} />

      {/* Bank transfer */}
      <div
        className="rounded-2xl p-5 mb-5"
        style={{ background: "var(--panel-surface)", border: "1px solid var(--panel-border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Landmark className="w-4 h-4" style={{ color: "var(--panel-ink)" }} strokeWidth={1.5} />
            <h2
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--panel-ink)" }}
            >
              Przelew tradycyjny
            </h2>
          </div>
          <Toggle checked={transferEnabled} onChange={setTransferEnabled} label={transferEnabled ? "Włączony" : "Wyłączony"} />
        </div>

        {transferEnabled && (
          <>
            <p className="text-xs mb-4" style={{ color: "var(--panel-ink-muted)" }}>
              Klient zobaczy te dane po złożeniu zamówienia i w mailu z potwierdzeniem.
            </p>
            <Field label="Numer konta (26 cyfr)" id="bank-account">
              <input
                id="bank-account"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                onBlur={(e) => {
                  setBankAccount(formatNrb(e.target.value));
                  focusProps.onBlur(e);
                }}
                onFocus={focusProps.onFocus}
                placeholder="00 0000 0000 0000 0000 0000 0000"
                inputMode="numeric"
                style={inputStyle}
              />
            </Field>
            <Field label="Odbiorca przelewu (nazwa firmy / imię i nazwisko)" id="account-owner">
              <input
                id="account-owner"
                value={accountOwner}
                onChange={(e) => setAccountOwner(e.target.value)}
                placeholder="np. Moja Firma sp. z o.o."
                style={inputStyle}
                {...focusProps}
              />
            </Field>
            <p className="text-[11px]" style={{ color: "var(--panel-ink-faint)" }}>
              Tytuł przelewu zostanie wygenerowany automatycznie z numerem zamówienia.
            </p>
          </>
        )}
      </div>

      {/* Cash on delivery */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--panel-surface)", border: "1px solid var(--panel-border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <HandCoins className="w-4 h-4" style={{ color: "var(--panel-ink)" }} strokeWidth={1.5} />
            <h2
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--panel-ink)" }}
            >
              Płatność za pobraniem
            </h2>
          </div>
          <Toggle checked={codEnabled} onChange={setCodEnabled} label={codEnabled ? "Włączona" : "Wyłączona"} />
        </div>

        {codEnabled && (
          <Field label="Dodatkowa opłata za pobranie (zł)" id="cod-fee">
            <div className="relative max-w-[10rem]">
              <input
                id="cod-fee"
                value={codFee}
                onChange={(e) => setCodFee(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
                style={{ ...inputStyle, paddingRight: "28px", textAlign: "right" }}
                {...focusProps}
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                style={{ color: "var(--panel-ink-muted)" }}
              >
                zł
              </span>
            </div>
          </Field>
        )}
      </div>
    </div>
  );
}
