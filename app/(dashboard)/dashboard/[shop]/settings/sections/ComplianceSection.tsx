"use client";

import { useState } from "react";
import { ShieldCheck, Tag } from "lucide-react";
import type { ComplianceConfig } from "@/types/shop";
import { SectionTitle, Card, Field, TextInput, Toggle, SaveButton, P, type SaveState } from "../ui";
import { saveConfig } from "./save";

export default function ComplianceSection({
  shopSlug,
  initial,
}: {
  shopSlug: string;
  initial: ComplianceConfig;
}) {
  const [data, setData] = useState<ComplianceConfig>(initial);
  const [state, setState] = useState<SaveState>("idle");

  function setBanner<K extends keyof ComplianceConfig["cookieBanner"]>(
    key: K,
    value: ComplianceConfig["cookieBanner"][K]
  ) {
    setData((d) => ({ ...d, cookieBanner: { ...d.cookieBanner, [key]: value } }));
  }

  async function save() {
    setState("saving");
    setState((await saveConfig(shopSlug, "compliance", data)) ? "saved" : "error");
    setTimeout(() => setState("idle"), 2500);
  }

  const b = data.cookieBanner;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <SectionTitle title="Zgodność" desc="Zgoda na cookies (RODO) oraz mechanizmy wymagane prawem, np. dyrektywa Omnibus." />
        <SaveButton state={state} onClick={save} />
      </div>

      <Card title="Baner zgody na cookies">
        <div className="flex items-center gap-2 mb-2" style={{ color: P.muted }}>
          <ShieldCheck className="w-4 h-4" strokeWidth={1.75} />
          <span className="text-xs">Wyświetlany klientom przy pierwszej wizycie w sklepie.</span>
        </div>
        <Toggle
          checked={b.enabled}
          onChange={(v) => setBanner("enabled", v)}
          label="Pokazuj baner zgody na cookies"
          desc="Wyłączenie oznacza brak zbierania zgód — nie zalecane, gdy używasz pikseli."
        />

        {b.enabled && (
          <>
            <div className="my-3" style={{ borderTop: `1px solid ${P.border}` }} />
            <p className="text-xs font-medium mb-1" style={{ color: P.muted }}>Kategorie zgody</p>
            <Toggle
              checked={b.analytics}
              onChange={(v) => setBanner("analytics", v)}
              label="Analityka"
              desc="Google Analytics, GA4 przez GTM — ładowane po zgodzie na analitykę."
            />
            <Toggle
              checked={b.marketing}
              onChange={(v) => setBanner("marketing", v)}
              label="Marketing"
              desc="Piksel Meta, Piksel TikTok — ładowane po zgodzie na marketing."
            />
            <div className="my-3" style={{ borderTop: `1px solid ${P.border}` }} />
            <Field label="Treść banera">
              <TextInput value={b.message} onChange={(e) => setBanner("message", e.target.value)} />
            </Field>
            <Field label="Link do polityki prywatności" hint="Ścieżka lub pełny adres, np. /polityka-prywatnosci.">
              <TextInput value={b.policyUrl} onChange={(e) => setBanner("policyUrl", e.target.value)} />
            </Field>
          </>
        )}
      </Card>

      <Card title="Dyrektywa Omnibus">
        <div className="flex items-center gap-2 mb-2" style={{ color: P.muted }}>
          <Tag className="w-4 h-4" strokeWidth={1.75} />
          <span className="text-xs">Najniższa cena z 30 dni przed obniżką.</span>
        </div>
        <Toggle
          checked={data.omnibus.enabled}
          onChange={(v) => setData((d) => ({ ...d, omnibus: { enabled: v } }))}
          label="Pokazuj „najniższą cenę z 30 dni” przy promocjach"
          desc="Przy produktach z ceną promocyjną sklep wyświetla najniższą cenę z ostatnich 30 dni — wymóg prawny przy komunikowaniu obniżek."
        />
        <p className="text-[11px] mt-3 leading-relaxed" style={{ color: P.faint }}>
          Sklep automatycznie zapisuje historię cen każdego produktu i wylicza najniższą cenę z 30 dni.
          Informacja pojawia się na karcie produktu wszędzie tam, gdzie widnieje cena przekreślona.
        </p>
      </Card>
    </div>
  );
}
