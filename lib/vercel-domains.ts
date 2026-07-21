import "server-only";

/**
 * Thin wrapper over the Vercel Domains API used for merchant self-service
 * custom domains. A merchant types their domain in the dashboard; we register
 * it on the Vercel project so Vercel routes it here and issues the TLS cert,
 * then we surface the DNS records + verification status back to the merchant.
 *
 * All calls no-op gracefully when the env is not configured (see
 * `vercelConfigured`): the domain is still saved to the DB so the Phase-1
 * manual flow keeps working, and the UI shows static DNS instructions with an
 * "unknown" live status instead of erroring.
 *
 * Required env (set in Vercel project + .env.local):
 *   VERCEL_TOKEN       — token with access to the project's team
 *   VERCEL_PROJECT_ID  — the storefront project id (prj_…)
 *   VERCEL_TEAM_ID     — team/owner id (team_…), optional for personal accounts
 */

const API = "https://api.vercel.com";

function env() {
  return {
    token: process.env.VERCEL_TOKEN,
    projectId: process.env.VERCEL_PROJECT_ID,
    teamId: process.env.VERCEL_TEAM_ID,
  };
}

export function vercelConfigured(): boolean {
  const { token, projectId } = env();
  return Boolean(token && projectId);
}

function teamQuery(): string {
  const { teamId } = env();
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
}

async function vercelFetch(path: string, init?: RequestInit): Promise<Response> {
  const { token } = env();
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

export interface AddDomainResult {
  ok: boolean;
  /** Machine code for known failures the UI maps to friendly copy. */
  error?: "already_in_use" | "invalid" | "vercel_error";
  message?: string;
}

/** Register `domain` on the Vercel project. Idempotent — re-adding an existing
 *  domain returns ok. `already_in_use` means another Vercel account/project
 *  holds it, which the merchant must release first. */
export async function addDomainToProject(domain: string): Promise<AddDomainResult> {
  if (!vercelConfigured()) return { ok: true };
  const { projectId } = env();
  try {
    const res = await vercelFetch(
      `/v10/projects/${projectId}/domains${teamQuery()}`,
      { method: "POST", body: JSON.stringify({ name: domain }) },
    );
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string };
    };
    const code = body.error?.code;
    // Domain already attached to *this* project → treat as success.
    if (code === "domain_already_exists") return { ok: true };
    if (code === "domain_already_in_use" || code === "forbidden") {
      return { ok: false, error: "already_in_use", message: body.error?.message };
    }
    if (code === "invalid_domain") {
      return { ok: false, error: "invalid", message: body.error?.message };
    }
    return { ok: false, error: "vercel_error", message: body.error?.message };
  } catch {
    return { ok: false, error: "vercel_error" };
  }
}

/** Detach `domain` from the Vercel project. Best-effort — a failure here must
 *  not block clearing the DB, so callers ignore the result. */
export async function removeDomainFromProject(domain: string): Promise<void> {
  if (!vercelConfigured()) return;
  const { projectId } = env();
  try {
    await vercelFetch(
      `/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}${teamQuery()}`,
      { method: "DELETE" },
    );
  } catch {
    /* ignore */
  }
}

export interface DomainStatus {
  /** Whether the Vercel integration is wired up at all. */
  configured: boolean;
  /** Ownership verified on Vercel (TXT challenge passed or not required). */
  verified: boolean;
  /** DNS is not yet pointing at Vercel (A/CNAME missing or wrong). */
  misconfigured: boolean;
  /** TXT records the merchant must add to prove ownership, when required. */
  verification: { type: string; domain: string; value: string; reason?: string }[];
}

/** Live status of `domain`: verified (SSL issued) vs. waiting on DNS. Combines
 *  the project-domain object (ownership) with the domain config (DNS pointing).
 *  Returns configured:false when the integration is not set up. */
export async function getDomainStatus(domain: string): Promise<DomainStatus> {
  if (!vercelConfigured()) {
    return { configured: false, verified: false, misconfigured: true, verification: [] };
  }
  const { projectId } = env();
  try {
    const [domRes, cfgRes] = await Promise.all([
      vercelFetch(`/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}${teamQuery()}`),
      vercelFetch(`/v6/domains/${encodeURIComponent(domain)}/config${teamQuery()}`),
    ]);

    const dom = domRes.ok
      ? ((await domRes.json()) as { verified?: boolean; verification?: DomainStatus["verification"] })
      : null;
    const cfg = cfgRes.ok
      ? ((await cfgRes.json()) as { misconfigured?: boolean })
      : null;

    return {
      configured: true,
      verified: Boolean(dom?.verified),
      misconfigured: cfg?.misconfigured ?? true,
      verification: dom?.verification ?? [],
    };
  } catch {
    return { configured: true, verified: false, misconfigured: true, verification: [] };
  }
}

// Second-level TLDs where the registrable domain has three labels
// (e.g. sklep.pl vs. firma.com.pl). Kept small — covers the PL/UK cases most
// Sellflow merchants use — so apex vs. subdomain DNS advice stays correct.
const MULTI_PART_TLDS = new Set(["com.pl", "net.pl", "org.pl", "co.uk"]);

/** True when `domain` is a registrable apex (needs an A record) rather than a
 *  subdomain (needs a CNAME). */
export function isApexDomain(domain: string): boolean {
  const parts = domain.split(".");
  if (parts.length <= 2) return true;
  const lastTwo = parts.slice(-2).join(".");
  if (MULTI_PART_TLDS.has(lastTwo)) return parts.length <= 3;
  return false;
}

export interface DnsRecord {
  type: "A" | "CNAME";
  /** Host field as entered at the registrar (@ for apex). */
  name: string;
  value: string;
}

/** The single DNS record the merchant must create to point `domain` here. */
export function dnsInstructions(domain: string): DnsRecord {
  if (isApexDomain(domain)) {
    return { type: "A", name: "@", value: "76.76.21.21" };
  }
  return { type: "CNAME", name: domain.split(".")[0], value: "cname.vercel-dns.com" };
}
