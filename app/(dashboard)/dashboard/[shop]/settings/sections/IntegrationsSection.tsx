"use client";

import { useState } from "react";
import { Info, Copy, Check, Rss } from "lucide-react";
import type { IntegrationsConfig } from "@/types/shop";
import { SectionTitle, Card, Field, TextInput, SaveButton, P, type SaveState } from "../ui";
import { saveConfig } from "./save";

const FIELDS: {
  key: keyof IntegrationsConfig;
  label: string;
  placeholder: string;
  hint: string;
}[] = [
  { key: "gtmId", label: "Google Tag Manager", placeholder: "GTM-XXXXXXX", hint: "ID kontenera GTM. Pozwala wpiąć dowolne tagi bez zmiany kodu." },
  { key: "ga4Id", label: "Google Analytics 4", placeholder: "G-XXXXXXXXXX", hint: "ID pomiaru GA4 (Measurement ID)." },
  { key: "metaPixelId", label: "Piksel Meta (Facebook)", placeholder: "1234567890123456", hint: "ID piksela z Meta Events Manager (same cyfry)." },
  { key: "tiktokPixelId", label: "Piksel TikTok", placeholder: "CXXXXXXXXXXXXXXXXX", hint: "ID piksela z TikTok Events Manager." },
  { key: "googleMerchantId", label: "Google Merchant Center", placeholder: "Kod weryfikacyjny meta-tagu", hint: "Zawartość content= z tagu google-site-verification (do potwierdzenia witryny)." },
];

export default function IntegrationsSection({
  shopSlug,
  initial,
  feedUrl,
}: {
  shopSlug: string;
  initial: IntegrationsConfig;
  feedUrl: string;
}) {
  const [data, setData] = useState<IntegrationsConfig>(initial);
  const [copied, setCopied] = useState(false);

  async function copyFeed() {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Schowek zablokowany: adres i tak widać w polu obok.
    }
  }
  const [state, setState] = useState<SaveState>("idle");

  function set(key: keyof IntegrationsConfig, value: string) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function save() {
    setState("saving");
    const trimmed = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v.trim()])
    ) as IntegrationsConfig;
    setData(trimmed);
    setState((await saveConfig(shopSlug, "integrations", trimmed)) ? "saved" : "error");
    setTimeout(() => setState("idle"), 2500);
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <SectionTitle title="Integracje" desc="Podłącz narzędzia analityczne i marketingowe. Wystarczy wkleić identyfikatory, kod dodamy do sklepu automatycznie." />
        <SaveButton state={state} onClick={save} />
      </div>

      <div className="rounded-xl p-3.5 mb-5 flex items-start gap-2.5"
        style={{ background: P.surface2, border: `1px solid ${P.border}` }}>
        <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: P.muted }} strokeWidth={1.75} />
        <p className="text-xs leading-relaxed" style={{ color: P.muted }}>
          Piksele analityczne i marketingowe ładują się dopiero po zgodzie klienta na cookies
          (zgodnie z RODO). Zarządzasz tym w sekcji <strong>Zgodność</strong>.
        </p>
      </div>

      <Card>
        {FIELDS.map((f, i) => (
          <div key={f.key} style={i > 0 ? { borderTop: `1px solid ${P.border}`, paddingTop: 16, marginTop: 4 } : undefined}>
            <Field label={f.label} hint={f.hint}>
              <TextInput value={data[f.key]} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} />
            </Field>
          </div>
        ))}
      </Card>

      <Card title="Feed produktowy (Google, AI Mode, Gemini)">
        <div className="flex items-center gap-2 mb-2" style={{ color: P.muted }}>
          <Rss className="w-4 h-4" strokeWidth={1.75} />
          <span className="text-xs">Aktualizuje się sam przy każdej zmianie produktów.</span>
        </div>
        <div className="flex items-stretch gap-2 mb-3">
          <code
            className="flex-1 min-w-0 truncate text-[12.5px] px-3 py-2 rounded-lg"
            style={{ background: P.surface2, border: `1px solid ${P.border}`, color: P.ink }}
          >
            {feedUrl}
          </code>
          <button
            type="button"
            onClick={copyFeed}
            className="inline-flex items-center gap-1.5 px-3 rounded-lg text-[13px] font-medium shrink-0"
            style={{ border: `1px solid ${P.border}`, color: P.ink }}
          >
            {copied ? <Check className="w-3.5 h-3.5" strokeWidth={2} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />}
            {copied ? "Skopiowano" : "Kopiuj"}
          </button>
        </div>
        <ol className="text-xs leading-relaxed space-y-1 list-decimal pl-4" style={{ color: P.muted }}>
          <li>Załóż konto w Google Merchant Center i potwierdź witrynę kodem z pola powyżej.</li>
          <li>W Merchant Center wybierz Produkty → Dodaj produkty → Plik z adresu URL i wklej ten adres.</li>
          <li>Ustaw pobieranie codziennie. Produkty pojawią się w bezpłatnych wynikach Google, w AI Mode i w Gemini.</li>
        </ol>
      </Card>
    </div>
  );
}
