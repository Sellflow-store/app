"use client";

import { useState } from "react";
import { Save, Landmark, HandCoins } from "lucide-react";
import type { CheckoutConfig } from "@/types/shop";

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

const focusProps = {
  onFocus: (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = "oklch(22% 0.24 270)"),
  onBlur: (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = "oklch(88% 0 0)"),
};

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer w-fit">
      <div
        className="relative w-9 h-5 rounded-full transition-all"
        style={{ background: checked ? "oklch(56% 0.30 335)" : "oklch(82% 0 0)" }}
        onClick={() => onChange(!checked)}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
          style={{ left: checked ? "1.125rem" : "0.125rem" }}
        />
      </div>
      <span className="text-xs font-medium" style={{ color: "oklch(35% 0 0)" }}>{label}</span>
    </label>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-xs font-semibold mb-1.5" style={{ color: "oklch(30% 0 0)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

/** Grupuje cyfry NRB po 4 dla czytelności; akceptuje też IBAN z "PL" */
function formatBankAccount(raw: string): string {
  const cleaned = raw.replace(/\s/g, "").toUpperCase();
  return cleaned.replace(/(.{4})/g, "$1 ").trim();
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
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function PaymentsForm({ shopSlug, initialConfig }: Props) {
  const [transferEnabled, setTransferEnabled] = useState(initialConfig.transferEnabled);
  const [bankAccount, setBankAccount] = useState(initialConfig.bankAccount);
  const [accountOwner, setAccountOwner] = useState(initialConfig.accountOwner);
  const [codEnabled, setCodEnabled] = useState(initialConfig.codEnabled);
  const [codFee, setCodFee] = useState(initialConfig.codFee);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSave() {
    if (!transferEnabled && !codEnabled) {
      setValidationError("Włącz przynajmniej jedną metodę płatności — inaczej klienci nie złożą zamówienia.");
      return;
    }
    const accountDigits = bankAccount.replace(/[\sA-Z]/gi, "");
    if (transferEnabled && accountDigits.length !== 26) {
      setValidationError("Numer konta powinien mieć 26 cyfr (polski NRB).");
      return;
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
        bankAccount: formatBankAccount(bankAccount),
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
    : saveState === "saved" ? "Zapisano!"
    : saveState === "error" ? "Błąd — spróbuj ponownie"
    : "Zapisz zmiany";

  const buttonBg =
    saveState === "saved" ? "oklch(52% 0.20 158)"
    : saveState === "error" ? "oklch(50% 0.20 20)"
    : "oklch(56% 0.30 335)";

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
          >
            Płatności
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
            Jak klienci płacą za zamówienia w Twoim sklepie
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveState === "saving"}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full transition-all disabled:opacity-60"
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

      {/* Bank transfer */}
      <div
        className="rounded-2xl p-5 mb-5"
        style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Landmark className="w-4 h-4" style={{ color: "oklch(40% 0 0)" }} strokeWidth={1.5} />
            <h2
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
            >
              Przelew tradycyjny
            </h2>
          </div>
          <Toggle checked={transferEnabled} onChange={setTransferEnabled} label={transferEnabled ? "Włączony" : "Wyłączony"} />
        </div>

        {transferEnabled && (
          <>
            <p className="text-xs mb-4" style={{ color: "oklch(50% 0 0)" }}>
              Klient zobaczy te dane po złożeniu zamówienia i w mailu z potwierdzeniem.
            </p>
            <Field label="Numer konta (26 cyfr)" id="bank-account">
              <input
                id="bank-account"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                onBlur={(e) => {
                  setBankAccount(formatBankAccount(e.target.value));
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
            <p className="text-[11px]" style={{ color: "oklch(60% 0 0)" }}>
              Tytuł przelewu zostanie wygenerowany automatycznie z numerem zamówienia.
            </p>
          </>
        )}
      </div>

      {/* Cash on delivery */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <HandCoins className="w-4 h-4" style={{ color: "oklch(40% 0 0)" }} strokeWidth={1.5} />
            <h2
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
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
                style={{ color: "oklch(55% 0 0)" }}
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
