"use client";

import { useCallback, useEffect, useState } from "react";
import { Globe, Lock, Check, Copy, RefreshCw, Trash2, CircleAlert, Clock } from "lucide-react";
import { SectionTitle, Card, Field, TextInput, SaveButton, LockedCard, P, type SaveState } from "../ui";

interface DnsRecord {
  type: "A" | "CNAME";
  name: string;
  value: string;
}
interface DomainStatus {
  configured: boolean;
  verified: boolean;
  misconfigured: boolean;
  verification: { type: string; domain: string; value: string; reason?: string }[];
}
interface DomainResponse {
  domain: string | null;
  dns?: DnsRecord;
  status?: DomainStatus;
  vercelConfigured?: boolean;
}

interface Props {
  shopSlug: string;
  plan: string;
  storeUrl: string;
  initialDomain: string | null;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <span className="block text-[11px] font-medium mb-1" style={{ color: P.faint }}>
        {label}
      </span>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors"
        style={{ background: P.surface2, border: `1px solid ${P.border}` }}
        title="Kliknij, aby skopiować"
      >
        <code className="text-xs truncate" style={{ color: P.ink, fontFamily: "var(--font-mono)" }}>
          {value}
        </code>
        {copied ? (
          <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(60% 0.16 145)" }} strokeWidth={2} />
        ) : (
          <Copy className="w-3.5 h-3.5 shrink-0" style={{ color: P.muted }} strokeWidth={1.5} />
        )}
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: DomainStatus | null }) {
  if (!status) return null;
  // Not wired to Vercel yet — domain is saved but we can't report live status.
  if (!status.configured) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ background: P.surface2, color: P.muted }}>
        <Clock className="w-3.5 h-3.5" strokeWidth={2} /> Zapisano — skonfiguruj DNS
      </span>
    );
  }
  if (status.verified && !status.misconfigured) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ background: "oklch(60% 0.16 145 / 0.14)", color: "oklch(52% 0.16 145)" }}>
        <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Domena aktywna
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: "oklch(75% 0.15 75 / 0.16)", color: "oklch(55% 0.13 66)" }}>
      <Clock className="w-3.5 h-3.5" strokeWidth={2} /> Oczekuje na weryfikację DNS
    </span>
  );
}

export default function DomainSection({ shopSlug, plan, storeUrl, initialDomain }: Props) {
  const host = storeUrl.replace(/^https?:\/\//, "");
  const isPro = plan === "pro";

  const [domain, setDomain] = useState<string | null>(initialDomain);
  const [input, setInput] = useState("");
  const [dns, setDns] = useState<DnsRecord | null>(null);
  const [status, setStatus] = useState<DomainStatus | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [removing, setRemoving] = useState(false);

  const loadStatus = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/domain`);
      if (res.ok) {
        const data = (await res.json()) as DomainResponse;
        setDomain(data.domain);
        setDns(data.dns ?? null);
        setStatus(data.status ?? null);
      }
    } finally {
      setChecking(false);
    }
  }, [shopSlug]);

  // Pull live status once on mount when a domain is already connected. Fetches
  // inline (not via loadStatus) so no setState runs synchronously in the effect.
  useEffect(() => {
    if (!initialDomain || !isPro) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/shops/${shopSlug}/domain`);
      if (cancelled || !res.ok) return;
      const data = (await res.json()) as DomainResponse;
      if (cancelled) return;
      setDomain(data.domain);
      setDns(data.dns ?? null);
      setStatus(data.status ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [initialDomain, isPro, shopSlug]);

  async function connect() {
    const value = input.trim();
    if (!value) return;
    setSaveState("saving");
    setError(null);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/domain`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: value }),
      });
      const data = (await res.json().catch(() => ({}))) as DomainResponse & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Nie udało się podłączyć domeny.");
        setSaveState("error");
        setTimeout(() => setSaveState("idle"), 2500);
        return;
      }
      setDomain(data.domain);
      setDns(data.dns ?? null);
      setStatus(data.status ?? null);
      setInput("");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setError("Błąd sieci. Spróbuj ponownie.");
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2500);
    }
  }

  async function remove() {
    if (!confirm("Odłączyć własną domenę? Sklep wróci do adresu " + host + ".")) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/domain`, { method: "DELETE" });
      if (res.ok) {
        setDomain(null);
        setDns(null);
        setStatus(null);
      }
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div>
      <SectionTitle
        title="Własna domena"
        desc="Podłącz własną domenę (np. mojsklep.pl), aby klienci widzieli Twój sklep pod własnym adresem. Certyfikat SSL (https) ustawiamy automatycznie po weryfikacji DNS."
      />

      {/* Domyślny adres sklepu — zawsze działa */}
      <Card title="Adres domyślny" desc="Ten adres działa zawsze, niezależnie od własnej domeny.">
        <div className="flex items-center gap-2.5">
          <Globe className="w-4 h-4 shrink-0" style={{ color: P.muted }} strokeWidth={1.5} />
          <a href={storeUrl} target="_blank" rel="noopener noreferrer"
            className="text-sm font-medium underline underline-offset-2" style={{ color: P.accent }}>
            {host}
          </a>
        </div>
      </Card>

      {!isPro ? (
        <LockedCard
          icon={<Lock className="w-5 h-5" strokeWidth={1.75} />}
          title="Dostępne w planie Pro"
          cta={
            <button disabled className="text-sm font-semibold px-4 py-2.5 rounded-full opacity-60 cursor-not-allowed"
              style={{ background: P.ink, color: P.bg }}>
              Zmień plan
            </button>
          }
        >
          Własna domena (.pl / .com) jest częścią planu Pro i wyższych. Na obecnym planie Twój sklep
          działa pod stałym adresem <strong>{host}</strong>.
        </LockedCard>
      ) : !domain ? (
        <>
          <div className="flex items-start justify-between gap-4">
            <div />
            <SaveButton state={saveState} onClick={connect} idleLabel="Podłącz domenę" disabled={!input.trim()} />
          </div>
          <Card title="Podłącz domenę">
            <Field label="Twoja domena" hint="Wpisz domenę bez https:// — np. mojsklep.pl lub sklep.mojafirma.pl">
              <TextInput
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="mojsklep.pl"
                aria-label="Własna domena"
                onKeyDown={(e) => e.key === "Enter" && connect()}
              />
            </Field>
            {error && (
              <div className="flex items-start gap-2 mt-1 text-xs" style={{ color: "oklch(55% 0.18 20)" }}>
                <CircleAlert className="w-4 h-4 shrink-0 mt-px" strokeWidth={1.75} />
                <span>{error}</span>
              </div>
            )}
          </Card>
        </>
      ) : (
        <>
          <Card>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <Globe className="w-4 h-4 shrink-0" style={{ color: P.muted }} strokeWidth={1.5} />
                <span className="text-sm font-semibold truncate" style={{ color: P.ink }}>{domain}</span>
              </div>
              <StatusBadge status={status} />
            </div>
          </Card>

          {dns && (
            <Card
              title="Skonfiguruj DNS"
              desc="Dodaj ten rekord u swojego rejestratora domeny (np. OVH, home.pl, nazwa.pl). Zmiany DNS mogą propagować się do kilku godzin."
            >
              <div className="grid grid-cols-3 gap-3">
                <CopyField label="Typ" value={dns.type} />
                <CopyField label="Nazwa / Host" value={dns.name} />
                <CopyField label="Wartość" value={dns.value} />
              </div>

              {status?.verification && status.verification.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-medium mb-2" style={{ color: P.faint }}>
                    Dodatkowo — rekord TXT potwierdzający własność domeny:
                  </p>
                  {status.verification.map((v, i) => (
                    <div key={i} className="grid grid-cols-3 gap-3 mb-2">
                      <CopyField label="Typ" value={v.type} />
                      <CopyField label="Nazwa" value={v.domain} />
                      <CopyField label="Wartość" value={v.value} />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={loadStatus}
                  disabled={checking}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all disabled:opacity-50"
                  style={{ color: P.accent, border: `1.5px solid ${P.accent}` }}
                >
                  <RefreshCw className={"w-3.5 h-3.5" + (checking ? " animate-spin" : "")} strokeWidth={2} />
                  {checking ? "Sprawdzam…" : "Sprawdź teraz"}
                </button>
                <button
                  onClick={remove}
                  disabled={removing}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all disabled:opacity-50"
                  style={{ color: "oklch(58% 0.18 20)", border: "1.5px solid oklch(58% 0.20 20 / 0.35)" }}
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {removing ? "Odłączam…" : "Odłącz domenę"}
                </button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
