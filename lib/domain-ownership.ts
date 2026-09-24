import "server-only";
import { createHmac } from "crypto";
import { resolveTxt } from "dns/promises";
import { zoneLabelCount, type DomainStatus } from "./vercel-domains";

// Proof that the merchant who attaches a domain controls it. Pointing DNS at
// Vercel is not enough: the A/CNAME target is shared by every Vercel project,
// so a shop that claimed someone else's domain first would go live the moment
// the real owner set up DNS. The TXT value is bound to the claiming shop, so
// only the shop whose token the owner published can be verified.

const PREFIX = "_sellflow";

function secret(): string | null {
  return process.env.DOMAIN_VERIFY_SECRET || process.env.CLERK_SECRET_KEY || null;
}

function token(shopId: string, domain: string): string | null {
  const s = secret();
  if (!s) return null;
  const key = createHmac("sha256", s).update("sellflow:domain-ownership:v1").digest();
  return createHmac("sha256", key).update(`${shopId}:${domain}`).digest("hex").slice(0, 32);
}

export interface OwnershipRecord {
  type: "TXT";
  /** Host field as entered at the registrar, relative to the zone. */
  name: string;
  /** Full DNS name, for registrars that want the FQDN. */
  fqdn: string;
  value: string;
}

export function ownershipRecord(shopId: string, domain: string): OwnershipRecord | null {
  const t = token(shopId, domain);
  if (!t) return null;
  // Registrars take the host relative to the zone: "_sellflow" for the apex,
  // "_sellflow.sklep" for sklep.mojafirma.pl.
  const labels = domain.split(".");
  const sub = labels.slice(0, Math.max(0, labels.length - zoneLabelCount(domain))).join(".");
  return {
    type: "TXT",
    name: sub ? `${PREFIX}.${sub}` : PREFIX,
    fqdn: `${PREFIX}.${domain}`,
    value: `sellflow-verify=${t}`,
  };
}

/** True when the shop's TXT record is published. DNS errors (NXDOMAIN, timeout) = false. */
export async function ownershipProven(shopId: string, domain: string): Promise<boolean> {
  const rec = ownershipRecord(shopId, domain);
  if (!rec) return false;
  try {
    const records = await resolveTxt(rec.fqdn);
    return records.some((chunks) => chunks.join("").trim() === rec.value);
  } catch {
    return false;
  }
}

/**
 * Whether the domain may serve this shop: Vercel has it and DNS points here,
 * and the TXT proves the shop's claim. A domain that was already verified
 * before the TXT requirement existed keeps working without it (grandfathered)
 * as long as Vercel still reports it healthy; once it drops out, getting back
 * in needs the TXT like any new domain.
 */
export async function isDomainVerified(
  shopId: string,
  domain: string,
  status: DomainStatus,
  wasVerified: boolean,
): Promise<{ verified: boolean; ownership: boolean }> {
  const vercelOk = status.verified && !status.misconfigured;
  const ownership = await ownershipProven(shopId, domain);
  return { verified: vercelOk && (ownership || wasVerified), ownership };
}
