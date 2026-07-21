"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Check, Clock, RefreshCw, Trash2 } from "lucide-react";

interface DnsRecord {
  type: string;
  name: string;
  value: string;
}
interface DomainStatus {
  configured: boolean;
  verified: boolean;
  misconfigured: boolean;
  verification: { type: string; domain: string; value: string }[];
}
interface DomainResponse {
  domain: string | null;
  dns?: DnsRecord;
  status?: DomainStatus;
  error?: string;
}

interface Props {
  slug: string;
  initialDomain: string | null;
}

/**
 * Operator-side custom-domain control. Calls the same /api/shops/[shop]/domain
 * endpoint the merchant dashboard uses — admin sessions bypass the Pro gate
 * (getShopAccess.asAdmin) so support can attach a domain on a merchant's
 * behalf. Shows the DNS record + live status so ops can relay it to the owner.
 */
export default function DomainActions({ slug, initialDomain }: Props) {
  const router = useRouter();
  const [domain, setDomain] = useState<string | null>(initialDomain);
  const [input, setInput] = useState("");
  const [dns, setDns] = useState<DnsRecord | null>(null);
  const [status, setStatus] = useState<DomainStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch(`/api/shops/${slug}/domain`);
      if (res.ok) {
        const data = (await res.json()) as DomainResponse;
        setDomain(data.domain);
        setDns(data.dns ?? null);
        setStatus(data.status ?? null);
      }
    } finally {
      setChecking(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!initialDomain) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/shops/${slug}/domain`);
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
  }, [initialDomain, slug]);

  async function connect() {
    const value = input.trim();
    if (!value) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/shops/${slug}/domain`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: value }),
      });
      const data = (await res.json().catch(() => ({}))) as DomainResponse;
      if (!res.ok) {
        setError(data.error ?? "Nie udało się podłączyć domeny.");
        return;
      }
      setDomain(data.domain);
      setDns(data.dns ?? null);
      setStatus(data.status ?? null);
      setInput("");
      router.refresh();
    } catch {
      setError("Błąd sieci. Spróbuj ponownie.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Odłączyć własną domenę od sklepu „${slug}”?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/shops/${slug}/domain`, { method: "DELETE" });
      if (res.ok) {
        setDomain(null);
        setDns(null);
        setStatus(null);
        router.refresh();
      } else {
        setError("Nie udało się odłączyć domeny.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--brand-paper)", border: "1px solid var(--brand-rule)" }}
    >
      <header
        className="px-5 py-3"
        style={{ borderBottom: "1px solid var(--brand-rule)", background: "var(--brand-paper-3)" }}
      >
        <h2
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
        >
          Własna domena
        </h2>
      </header>

      <div className="px-5 py-4 space-y-4">
        {error && (
          <p className="text-xs font-medium" style={{ color: "oklch(45% 0.18 20)" }} role="alert">
            {error}
          </p>
        )}

        {!domain ? (
          <div className="flex items-end gap-2">
            <label className="flex-1">
              <span className="block text-xs font-medium mb-1.5" style={{ color: "var(--brand-ink-2)" }}>
                Podłącz domenę do tego sklepu (admin — bez wymogu planu Pro)
              </span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && connect()}
                placeholder="mojsklep.pl"
                aria-label="Własna domena"
                className="w-full text-sm rounded-lg px-3 py-2 outline-none"
                style={{
                  border: "1.5px solid var(--brand-rule)",
                  color: "var(--brand-ink)",
                  background: "var(--brand-paper)",
                  fontFamily: "var(--font-mono)",
                }}
              />
            </label>
            <button
              onClick={connect}
              disabled={busy || !input.trim()}
              className="text-xs font-semibold px-4 py-2 rounded-full transition-all disabled:opacity-50 shrink-0"
              style={{ background: "var(--brand-ink)", color: "var(--brand-paper)" }}
            >
              {busy ? "…" : "Podłącz"}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-4 h-4 shrink-0" style={{ color: "var(--brand-ink-2)" }} strokeWidth={1.75} />
                <span className="text-sm font-semibold truncate" style={{ color: "var(--brand-ink)", fontFamily: "var(--font-mono)" }}>
                  {domain}
                </span>
              </div>
              {status && <StatusBadge status={status} />}
            </div>

            {dns && (
              <div
                className="rounded-lg px-3 py-2.5 text-xs"
                style={{ background: "var(--brand-paper-3)", border: "1px solid var(--brand-rule)", fontFamily: "var(--font-mono)", color: "var(--brand-ink)" }}
              >
                <span style={{ color: "var(--brand-ink-2)" }}>DNS: </span>
                {dns.type} &nbsp; {dns.name} &nbsp;→&nbsp; {dns.value}
                {status?.verification?.map((v, i) => (
                  <div key={i} className="mt-1">
                    <span style={{ color: "var(--brand-ink-2)" }}>TXT: </span>
                    {v.domain} &nbsp;→&nbsp; {v.value}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={loadStatus}
                disabled={checking}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full transition-all disabled:opacity-50"
                style={{ border: "1.5px solid var(--brand-rule)", color: "var(--brand-ink-2)" }}
              >
                <RefreshCw className={"w-3.5 h-3.5" + (checking ? " animate-spin" : "")} strokeWidth={1.75} />
                {checking ? "Sprawdzam…" : "Sprawdź status"}
              </button>
              <button
                onClick={remove}
                disabled={busy}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full transition-all disabled:opacity-50"
                style={{ color: "oklch(45% 0.18 20)", border: "1.5px solid oklch(50% 0.20 20 / 0.35)" }}
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                {busy ? "…" : "Odłącz"}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: DomainStatus }) {
  if (!status.configured) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
        style={{ background: "var(--brand-paper-3)", color: "var(--brand-ink-2)" }}>
        <Clock className="w-3 h-3" strokeWidth={2} /> Zapisano — brak integracji
      </span>
    );
  }
  if (status.verified && !status.misconfigured) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
        style={{ background: "oklch(60% 0.16 145 / 0.14)", color: "oklch(45% 0.16 145)" }}>
        <Check className="w-3 h-3" strokeWidth={2.5} /> Aktywna
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
      style={{ background: "oklch(75% 0.15 75 / 0.16)", color: "oklch(48% 0.13 66)" }}>
      <Clock className="w-3 h-3" strokeWidth={2} /> Oczekuje na DNS
    </span>
  );
}
