"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { AccountConfig } from "@/types/shop";
import { Card, Field, TextInput, ReadonlyRow, SectionTitle, SaveButton, P, type SaveState } from "../ui";
import { saveConfig } from "./save";

interface Props {
  shopSlug: string;
  accountEmail: string;
  userId: string;
  initial: AccountConfig;
}

export default function AccountSection({ shopSlug, accountEmail, userId, initial }: Props) {
  const [data, setData] = useState<AccountConfig>(initial);
  const [companyOpen, setCompanyOpen] = useState(
    Boolean(initial.company.name || initial.company.taxId || initial.company.address)
  );
  const [state, setState] = useState<SaveState>("idle");

  function set<K extends keyof AccountConfig>(key: K, value: AccountConfig[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }
  function setCompany<K extends keyof AccountConfig["company"]>(key: K, value: string) {
    setData((d) => ({ ...d, company: { ...d.company, [key]: value } }));
  }

  async function save() {
    setState("saving");
    setState((await saveConfig(shopSlug, "account", data)) ? "saved" : "error");
    setTimeout(() => setState("idle"), 2500);
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <SectionTitle title="Konto i firma" desc="Dane logowania oraz dane do faktur i kontaktu." />
        <SaveButton state={state} onClick={save} />
      </div>

      <Card title="Konto">
        <ReadonlyRow label="Email" value={accountEmail} />
        <div style={{ borderTop: `1px solid ${P.border}` }} />
        <ReadonlyRow label="ID" value={userId} mono />
      </Card>

      <Card title="Twoje dane">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Field label="Imię">
            <TextInput value={data.firstName} placeholder="Jan" onChange={(e) => set("firstName", e.target.value)} />
          </Field>
          <Field label="Nazwisko">
            <TextInput value={data.lastName} placeholder="Kowalski" onChange={(e) => set("lastName", e.target.value)} />
          </Field>
        </div>
        <Field label="Email kontaktowy" hint="Na ten adres wysyłamy powiadomienia o zamówieniach i sklepie.">
          <TextInput
            type="email"
            value={data.contactEmail}
            placeholder={accountEmail}
            onChange={(e) => set("contactEmail", e.target.value)}
          />
        </Field>
        <Field label="Numer telefonu">
          <TextInput value={data.phone} placeholder="+48 123 456 789" onChange={(e) => set("phone", e.target.value)} />
        </Field>
      </Card>

      <div className="rounded-2xl mb-5" style={{ background: P.surface, border: `1px solid ${P.border}` }}>
        <button
          type="button"
          onClick={() => setCompanyOpen((v) => !v)}
          className="w-full flex items-center justify-between p-5"
        >
          <div className="text-left">
            <h2 className="text-sm font-semibold" style={{ color: P.ink, fontFamily: "var(--font-display)" }}>
              Dane firmowe (opcjonalne)
            </h2>
            <p className="text-xs mt-1" style={{ color: P.faint }}>
              Uzupełnij, jeśli prowadzisz działalność gospodarczą.
            </p>
          </div>
          <ChevronDown
            className="w-4 h-4 transition-transform"
            style={{ color: P.muted, transform: companyOpen ? "rotate(180deg)" : "none" }}
          />
        </button>
        {companyOpen && (
          <div className="px-5 pb-5">
            <Field label="Nazwa firmy">
              <TextInput value={data.company.name} onChange={(e) => setCompany("name", e.target.value)} />
            </Field>
            <Field label="NIP">
              <TextInput value={data.company.taxId} placeholder="000-000-00-00" onChange={(e) => setCompany("taxId", e.target.value)} />
            </Field>
            <Field label="Adres">
              <TextInput value={data.company.address} onChange={(e) => setCompany("address", e.target.value)} />
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}
