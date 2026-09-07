"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Copy, FileText, Pencil, RotateCcw, ShieldCheck } from "lucide-react";
import type {
  AboutConfig,
  AccountConfig,
  BrandingConfig,
  CheckoutConfig,
  ContractMoment,
  DeliveryConfig,
  LegalConfig,
  LegalDataConfig,
} from "@/types/shop";
import {
  CLAUSE_GROUPS,
  buildPrivacy,
  buildTerms,
  missingLegalFields,
  resolveLegalFields,
  resolveLegalVars,
} from "@/lib/legal";
import type { LegalSources, ResolvedField, VarSource } from "@/lib/legal";
import { Card, Field, P, SaveButton, SectionTitle, TextInput, Toggle, type SaveState } from "../settings/ui";
import { saveConfig } from "../settings/sections/save";

interface Props {
  shopSlug: string;
  shopName: string;
  shopUrl: string;
  initialLegal: LegalDataConfig;
  account: AccountConfig;
  about: AboutConfig;
  branding: BrandingConfig;
  checkout: CheckoutConfig;
  delivery: DeliveryConfig;
  initialTerms: LegalConfig;
  initialPrivacy: LegalConfig;
}

const SOURCE_LABEL: Record<VarSource, string> = {
  legal: "",
  account: "z sekcji Ustawienia → Konto i firma",
  about: "ze strony „O nas”",
  auto: "czyli adresu siedziby",
  missing: "",
};

export default function LegalForm({
  shopSlug,
  shopName,
  shopUrl,
  initialLegal,
  account,
  about,
  branding,
  checkout,
  delivery,
  initialTerms,
  initialPrivacy,
}: Props) {
  const [data, setData] = useState<LegalDataConfig>(initialLegal);
  const [state, setState] = useState<SaveState>("idle");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupMsg, setLookupMsg] = useState<{ text: string; error: boolean } | null>(null);

  // Ręczne wersje dokumentów. Puste + mode="generated" = składamy z danych.
  const [termsMode, setTermsMode] = useState(initialTerms.mode ?? "generated");
  const [privacyMode, setPrivacyMode] = useState(initialPrivacy.mode ?? "generated");
  const [termsCustom, setTermsCustom] = useState(initialTerms.content);
  const [privacyCustom, setPrivacyCustom] = useState(initialPrivacy.content);

  const sources: LegalSources = useMemo(
    () => ({ legal: data, account, about, branding, checkout, delivery, shopName, shopUrl }),
    [data, account, about, branding, checkout, delivery, shopName, shopUrl]
  );

  const fields = useMemo(() => resolveLegalFields(sources), [sources]);
  const missing = useMemo(() => missingLegalFields(fields), [fields]);
  const vars = useMemo(() => resolveLegalVars(sources), [sources]);
  const generatedTerms = useMemo(() => buildTerms(vars), [vars]);
  const generatedPrivacy = useMemo(() => buildPrivacy(vars), [vars]);

  function set<K extends keyof LegalDataConfig>(key: K, value: LegalDataConfig[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function toggleClause(id: string) {
    setData((d) => ({
      ...d,
      clauses: d.clauses.includes(id) ? d.clauses.filter((c) => c !== id) : [...d.clauses, id],
    }));
  }

  async function fetchCompany() {
    setLookingUp(true);
    setLookupMsg(null);
    try {
      const res = await fetch(`/api/company-lookup?nip=${encodeURIComponent(data.taxId)}`);
      const body = await res.json();
      if (!res.ok) {
        setLookupMsg({ text: body.error ?? "Nie udało się pobrać danych.", error: true });
        return;
      }
      const c = body.company as { name: string; address: string };
      setData((d) => ({ ...d, companyName: c.name, companyAddress: c.address }));
      setLookupMsg({ text: "Dane uzupełnione z rejestru. Sprawdź je i zapisz.", error: false });
    } catch {
      setLookupMsg({ text: "Nie udało się połączyć z rejestrem. Wpisz dane ręcznie.", error: true });
    } finally {
      setLookingUp(false);
    }
  }

  async function save() {
    setState("saving");
    const ok = await Promise.all([
      saveConfig(shopSlug, "legal", data),
      saveConfig(shopSlug, "terms", {
        mode: termsMode,
        content: termsMode === "custom" ? termsCustom : generatedTerms,
      }),
      saveConfig(shopSlug, "privacy", {
        mode: privacyMode,
        content: privacyMode === "custom" ? privacyCustom : generatedPrivacy,
      }),
    ]);
    setState(ok.every(Boolean) ? "saved" : "error");
    setTimeout(() => setState("idle"), 2500);
  }

  const inherited = (key: keyof LegalDataConfig & string) => ({
    resolved: fields[key],
    value: (data[key] as string) ?? "",
    onChange: (v: string) => set(key, v as never),
  });

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <SectionTitle
          title="Dokumenty prawne"
          desc="Uzupełnij dane raz — regulamin i polityka prywatności złożą się same i będą aktualne na sklepie."
        />
        <SaveButton state={state} onClick={save} />
      </div>

      {missing.length > 0 ? (
        <div
          className="rounded-2xl p-4 mb-5 flex items-start gap-3"
          style={{ background: "oklch(96% 0.05 85)", border: "1px solid oklch(80% 0.12 85)" }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "oklch(52% 0.16 70)" }} strokeWidth={1.8} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "oklch(35% 0.10 70)" }}>
              Brakuje {missing.length}{" "}
              {missing.length === 1 ? "danej" : missing.length < 5 ? "danych" : "danych"} — w dokumentach
              zostaną widoczne luki
            </p>
            <p className="text-xs mt-1" style={{ color: "oklch(45% 0.07 70)" }}>
              {missing.join(", ")}.
            </p>
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl p-4 mb-5 flex items-center gap-3"
          style={{ background: "oklch(96% 0.04 158)", border: "1px solid oklch(82% 0.10 158)" }}
        >
          <Check className="w-4 h-4 shrink-0" style={{ color: "oklch(48% 0.15 158)" }} strokeWidth={2.2} />
          <p className="text-sm font-semibold" style={{ color: "oklch(35% 0.10 158)" }}>
            Komplet danych — dokumenty są gotowe do publikacji.
          </p>
        </div>
      )}

      <Card title="Dane sprzedawcy" desc="Trafiają do §1 regulaminu i do sekcji „Administrator” w polityce prywatności.">
        <InheritedField label="NIP" {...inherited("taxId")} hint="Wpisz NIP i kliknij „Pobierz dane” — resztę weźmiemy z rejestru Ministerstwa Finansów.">
          <div className="flex gap-2">
            <TextInput
              value={data.taxId}
              placeholder={fields.taxId.value && fields.taxId.source !== "legal" ? fields.taxId.value : "000-000-00-00"}
              onChange={(e) => {
                set("taxId", e.target.value);
                setLookupMsg(null);
              }}
            />
            <button
              type="button"
              onClick={fetchCompany}
              disabled={lookingUp || !data.taxId.trim()}
              className="shrink-0 text-xs font-semibold px-3.5 rounded-lg transition-all disabled:opacity-40"
              style={{ border: `1.5px solid ${P.border}`, color: P.ink, background: P.surface2 }}
            >
              {lookingUp ? "Szukam…" : "Pobierz dane"}
            </button>
          </div>
        </InheritedField>
        {lookupMsg && (
          <p
            className="text-[11px] -mt-2 mb-3"
            style={{ color: lookupMsg.error ? "oklch(50% 0.20 20)" : P.muted }}
          >
            {lookupMsg.text}
          </p>
        )}
        <InheritedField label="Nazwa firmy / sprzedawcy" {...inherited("companyName")} placeholder="Jan Kowalski Studio" />
        <InheritedField
          label="Adres siedziby"
          {...inherited("companyAddress")}
          placeholder="ul. Przykładowa 1, 00-001 Warszawa"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Field label="REGON (opcjonalnie)">
            <TextInput value={data.regon} onChange={(e) => set("regon", e.target.value)} />
          </Field>
          <Field label="KRS (opcjonalnie)" hint="Tylko spółki wpisane do rejestru.">
            <TextInput value={data.krs} onChange={(e) => set("krs", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="Kontakt i zwroty" desc="Adres, na który klient pisze reklamację i odsyła towar.">
        <InheritedField label="E-mail kontaktowy" {...inherited("email")} type="email" placeholder="kontakt@twojsklep.pl" />
        <InheritedField label="Telefon (opcjonalnie)" {...inherited("phone")} placeholder="+48 123 456 789" />
        <InheritedField
          label="Adres do zwrotów"
          {...inherited("returnAddress")}
          hint="Puste = użyjemy adresu siedziby."
          placeholder="ul. Magazynowa 5, 00-001 Warszawa"
        />
      </Card>

      <Card title="Jak sprzedajesz" desc="Od tego zależy, które warianty klauzul wejdą do regulaminu.">
        <p className="text-xs font-medium mb-2" style={{ color: P.muted }}>
          Sklep prowadzi sprzedaż:
        </p>
        <Toggle
          checked={data.sells.physical}
          onChange={(v) => set("sells", { ...data.sells, physical: v })}
          label="Towarów fizycznych"
          desc="Przesyłki, ryzyko przy wydaniu przewoźnikowi, stan zwracanego produktu."
        />
        <Toggle
          checked={data.sells.digital}
          onChange={(v) => set("sells", { ...data.sells, digital: v })}
          label="Produktów cyfrowych"
          desc="Pliki, kursy, e-booki — dochodzi utrata prawa odstąpienia po rozpoczęciu pobierania."
        />
        <Toggle
          checked={data.sells.services}
          onChange={(v) => set("sells", { ...data.sells, services: v })}
          label="Usług"
          desc="Termin odstąpienia liczony od zawarcia umowy."
        />

        <div className="mt-5">
          <Field label="Umowa sprzedaży zostaje zawarta" hint="§2 regulaminu.">
            <select
              value={data.contractMoment}
              onChange={(e) => set("contractMoment", e.target.value as ContractMoment)}
              className="w-full text-sm outline-none rounded-[10px]"
              style={{
                border: `1.5px solid ${P.borderStrong}`,
                padding: "10px 12px",
                fontSize: "13px",
                color: P.ink,
                background: P.surface,
                fontFamily: "var(--font-body)",
              }}
            >
              <option value="confirmation">z chwilą potwierdzenia zamówienia przez sprzedawcę</option>
              <option value="payButton">z chwilą kliknięcia „zamawiam i płacę”</option>
            </select>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Field label="Czas realizacji (dni robocze)" hint="Np. „1–3”.">
              <TextInput
                value={data.fulfillmentDays}
                placeholder="1–3"
                onChange={(e) => set("fulfillmentDays", e.target.value)}
              />
            </Field>
            <Field label="Dokumenty obowiązują od" hint="Data wejścia w życie.">
              <TextInput
                type="date"
                value={data.effectiveDate}
                onChange={(e) => set("effectiveDate", e.target.value)}
              />
            </Field>
          </div>
          <Toggle
            checked={data.personalizedProducts}
            onChange={(v) => set("personalizedProducts", v)}
            label="Sprzedaję produkty personalizowane"
            desc="Napisy, grafiki, dedykacje, wykonanie na indywidualne zamówienie — wyłącza prawo odstąpienia dla tych produktów."
          />
        </div>
      </Card>

      <Card
        title="Klauzule branżowe"
        desc="Zaznacz, co sprzedajesz. Wybrane klauzule dopiszemy do regulaminu osobnym paragrafem."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CLAUSE_GROUPS.map((g) => {
            const on = data.clauses.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleClause(g.id)}
                className="text-left rounded-xl p-3 transition-all"
                style={{
                  border: `1.5px solid ${on ? P.accent : P.border}`,
                  background: on ? P.accentSoft : P.surface,
                }}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="flex items-center justify-center rounded-[5px] shrink-0"
                    style={{
                      width: 16,
                      height: 16,
                      border: `1.5px solid ${on ? P.accent : P.borderStrong}`,
                      background: on ? P.accent : "transparent",
                    }}
                  >
                    {on && <Check className="w-3 h-3" style={{ color: "#fff" }} strokeWidth={3} />}
                  </span>
                  <span className="text-sm font-medium" style={{ color: P.ink }}>
                    {g.label}
                  </span>
                </span>
                <span className="block text-[11px] mt-1 pl-6" style={{ color: P.faint }}>
                  {g.hint}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="Dane pobierane z innych sekcji" desc="Nie przepisuj ich tutaj — zmień u źródła, a dokumenty się zaktualizują.">
        <SourceRow
          label="Metody płatności"
          value={vars.payments.length ? vars.payments.join(", ") : "brak włączonych"}
          href={`/dashboard/${shopSlug}/payments`}
        />
        <SourceRow
          label="Metody dostawy"
          value={vars.shipping.length ? vars.shipping.join(", ") : "brak włączonych"}
          href={`/dashboard/${shopSlug}/delivery`}
        />
        <SourceRow label="Nazwa sklepu" value={vars.shopName} href={`/dashboard/${shopSlug}/branding`} />
        <SourceRow label="Adres sklepu" value={vars.shopUrl} href={`/dashboard/${shopSlug}/settings`} />
      </Card>

      <DocumentPanel
        icon={FileText}
        title="Regulamin sklepu"
        publicPath={`/${shopSlug}/regulamin`}
        mode={termsMode}
        missingCount={missing.length}
        generated={generatedTerms}
        custom={termsCustom}
        onCustomChange={setTermsCustom}
        onTakeOver={() => {
          setTermsCustom(generatedTerms);
          setTermsMode("custom");
        }}
        onRestore={() => setTermsMode("generated")}
      />

      <DocumentPanel
        icon={ShieldCheck}
        title="Polityka prywatności"
        publicPath={`/${shopSlug}/prywatnosc`}
        mode={privacyMode}
        missingCount={missing.length}
        generated={generatedPrivacy}
        custom={privacyCustom}
        onCustomChange={setPrivacyCustom}
        onTakeOver={() => {
          setPrivacyCustom(generatedPrivacy);
          setPrivacyMode("custom");
        }}
        onRestore={() => setPrivacyMode("generated")}
      />

      <p className="text-[11px] leading-relaxed mb-4" style={{ color: P.faint }}>
        Dokumenty powstają z wzorów przygotowanych przez prawnika i uzupełniają się Twoimi danymi. To punkt
        startowy dopasowany do typowego sklepu — nie porada prawna. Jeśli prowadzisz sprzedaż nietypową,
        skonsultuj treść z prawnikiem.
      </p>
    </div>
  );
}

/** Pole, które może przyjść z innej sekcji panelu — wtedy input zostaje pusty,
 *  a pod spodem piszemy, skąd wartość pochodzi. Merchant wpisuje NIP raz.
 *  Zdefiniowane na poziomie modułu (nie w LegalForm), bo komponent tworzony
 *  w ciele rodzica montuje się od nowa przy każdym wciśnięciu klawisza. */
function InheritedField({
  label,
  hint,
  placeholder,
  type,
  value,
  resolved,
  onChange,
  children,
}: {
  label: string;
  hint?: string;
  placeholder?: string;
  type?: string;
  value: string;
  resolved: ResolvedField;
  onChange: (v: string) => void;
  children?: React.ReactNode;
}) {
  const fromElsewhere = resolved.source !== "legal" && resolved.source !== "missing" && resolved.value;
  return (
    <Field label={label} hint={hint}>
      {children ?? (
        <TextInput
          type={type}
          value={value}
          placeholder={fromElsewhere ? resolved.value : placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {fromElsewhere && (
        <span className="block text-[11px] mt-1.5" style={{ color: P.faint }}>
          W dokumentach użyjemy „{resolved.value}” — {SOURCE_LABEL[resolved.source]}. Wpisz tutaj tylko
          wtedy, gdy w regulaminie ma być co innego.
        </span>
      )}
    </Field>
  );
}

function SourceRow({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm shrink-0" style={{ color: P.muted }}>
        {label}
      </span>
      <span className="text-sm text-right" style={{ color: P.ink }}>
        {value}{" "}
        <Link href={href} className="underline underline-offset-2" style={{ color: P.accent }}>
          zmień
        </Link>
      </span>
    </div>
  );
}

function DocumentPanel({
  icon: Icon,
  title,
  publicPath,
  mode,
  missingCount,
  generated,
  custom,
  onCustomChange,
  onTakeOver,
  onRestore,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number }>;
  title: string;
  publicPath: string;
  mode: "generated" | "custom";
  missingCount: number;
  generated: string;
  custom: string;
  onCustomChange: (v: string) => void;
  onTakeOver: () => void;
  onRestore: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const text = mode === "custom" ? custom : generated;

  return (
    <div className="rounded-2xl p-5 mb-5" style={{ background: P.surface, border: `1px solid ${P.border}` }}>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4" style={{ color: P.muted }} strokeWidth={1.5} />
          <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: P.ink }}>
            {title}
          </h2>
          <span
            className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{
              background: mode === "custom" ? P.surface2 : P.accentSoft,
              color: mode === "custom" ? P.muted : P.accent,
            }}
          >
            {mode === "custom" ? "Wersja własna" : "Składany z danych"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
            style={{ border: `1.5px solid ${P.border}`, color: P.ink, background: P.surface2 }}
          >
            <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
            {copied ? "Skopiowano" : "Kopiuj"}
          </button>
          {mode === "custom" ? (
            <button
              type="button"
              onClick={() => {
                if (confirm("Wrócić do wersji składanej z danych? Twoje ręczne zmiany przestaną być publikowane.")) {
                  onRestore();
                }
              }}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
              style={{ border: `1.5px solid ${P.border}`, color: P.ink, background: P.surface2 }}
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
              Wróć do generowanej
            </button>
          ) : (
            <button
              type="button"
              onClick={onTakeOver}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
              style={{ border: `1.5px solid ${P.border}`, color: P.ink, background: P.surface2 }}
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
              Edytuj ręcznie
            </button>
          )}
        </div>
      </div>

      {mode === "custom" ? (
        <textarea
          value={custom}
          onChange={(e) => onCustomChange(e.target.value)}
          rows={18}
          className="w-full outline-none"
          style={{
            border: `1.5px solid ${P.borderStrong}`,
            borderRadius: "10px",
            padding: "12px",
            fontSize: "12px",
            lineHeight: "1.7",
            color: P.ink,
            background: P.surface,
            fontFamily: "var(--font-body)",
            resize: "vertical",
          }}
        />
      ) : (
        <pre
          className="overflow-auto whitespace-pre-wrap"
          style={{
            border: `1px solid ${P.border}`,
            borderRadius: "10px",
            padding: "14px",
            fontSize: "12px",
            lineHeight: "1.7",
            color: P.ink,
            background: P.surface2,
            fontFamily: "var(--font-body)",
            maxHeight: 420,
          }}
        >
          {generated}
        </pre>
      )}

      <p className="text-[11px] mt-2" style={{ color: P.faint }}>
        {mode === "custom" ? (
          <>
            Dokument jest widoczny pod adresem <span className="font-medium">{publicPath}</span> w wersji,
            którą tu wpiszesz.
          </>
        ) : missingCount > 0 ? (
          <>
            Uzupełnij brakujące dane, żeby dokument pojawił się na sklepie pod adresem{" "}
            <span className="font-medium">{publicPath}</span> — do tego czasu klienci widzą tam informację,
            że dokument jest w przygotowaniu.
          </>
        ) : (
          <>
            Dokument jest widoczny pod adresem <span className="font-medium">{publicPath}</span> i
            aktualizuje się sam, gdy zmienisz dane powyżej.
          </>
        )}
      </p>
    </div>
  );
}
