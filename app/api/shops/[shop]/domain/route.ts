import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shops, users } from "@/lib/db/schema";
import { and, eq, isNotNull, ne, or } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import {
  addDomainToProject,
  removeDomainFromProject,
  getDomainStatus,
  dnsInstructions,
  vercelConfigured,
} from "@/lib/vercel-domains";
import { isDomainVerified, ownershipRecord } from "@/lib/domain-ownership";
import { uniqueViolation } from "@/lib/db/errors";

type Params = { params: Promise<{ shop: string }> };

/** Normalize a merchant-typed domain: lowercase, strip protocol/path/trailing
 *  dot. Returns null when it isn't a plausible hostname. */
function normalizeDomain(raw: string): string | null {
  const d = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
  if (!/^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(d)) return null;
  return d;
}

/** Current domain + live Vercel status. Polled by the panel. */
export async function GET(_req: NextRequest, { params }: Params) {
  const { shop: shopSlug } = await params;
  const access = await getShopAccess(shopSlug);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await db.query.shops.findFirst({ where: eq(shops.id, access.shopId) });
  const domain = shop?.customDomain ?? null;

  if (!domain) {
    return NextResponse.json({ domain: null, vercelConfigured: vercelConfigured() });
  }
  const status = await getDomainStatus(domain);
  // Self-heal the persisted verification flag from the live status + TXT
  // ownership, so routing (proxy.ts serves only verified domains) and the
  // subdomain redirect track reality without their own checks per request.
  const { verified, ownership } = await isDomainVerified(
    access.shopId,
    domain,
    status,
    shop?.customDomainVerified ?? false,
  );
  if (verified !== shop?.customDomainVerified) {
    await db
      .update(shops)
      .set({ customDomainVerified: verified })
      .where(eq(shops.id, access.shopId));
  }
  return NextResponse.json({
    domain,
    dns: dnsInstructions(domain),
    ownership: ownershipRecord(access.shopId, domain),
    status: { ...status, ownershipVerified: ownership, active: verified },
    vercelConfigured: vercelConfigured(),
  });
}

/** Attach a custom domain to this shop (Pro-only). */
export async function PUT(req: NextRequest, { params }: Params) {
  const { shop: shopSlug } = await params;
  const access = await getShopAccess(shopSlug);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Plan gate — the shop owner must be on Pro. Ops/admins bypass so support can
  // configure a domain on a merchant's behalf.
  if (!access.asAdmin) {
    const owner = await db.query.users.findFirst({ where: eq(users.id, access.userId) });
    if ((owner?.plan ?? "free") !== "pro") {
      return NextResponse.json(
        { error: "Własna domena jest dostępna w planie Pro." },
        { status: 403 },
      );
    }
  }

  const body = (await req.json().catch(() => ({}))) as { domain?: string };
  const domain = body.domain ? normalizeDomain(body.domain) : null;
  if (!domain) {
    return NextResponse.json({ error: "Podaj poprawną domenę, np. mojsklep.pl." }, { status: 400 });
  }

  // Can't hijack the platform's own domain space as a "custom" domain.
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "sell-flow.store";
  if (domain === appDomain || domain.endsWith(`.${appDomain}`)) {
    return NextResponse.json(
      { error: "Ta domena należy do platformy — wybierz własną domenę." },
      { status: 400 },
    );
  }

  // Who holds this domain now? Only a VERIFIED claim of a live shop blocks
  // others. An unverified claim proves nothing (anyone can type a domain in),
  // so it must not lock the real owner out; it is handed over, and whichever
  // shop publishes its own TXT record (lib/domain-ownership) gets verified.
  const holder = await db.query.shops.findFirst({
    where: and(eq(shops.customDomain, domain), ne(shops.id, access.shopId)),
  });
  if (holder && holder.customDomainVerified && !holder.deletedAt) {
    return NextResponse.json(
      { error: "Ta domena jest już podłączona do innego sklepu." },
      { status: 409 },
    );
  }

  const current = await db.query.shops.findFirst({ where: eq(shops.id, access.shopId) });
  const previousDomain = current?.customDomain && current.customDomain !== domain ? current.customDomain : null;
  // Nobody here had it attached on Vercel before this request (neither this
  // shop nor a previous claimant), so a failure below must detach it again.
  const newOnVercel = !holder && current?.customDomain !== domain;

  // Order matters: attach the new domain first, then switch the database,
  // and only then release the old one. The old order (release, then add)
  // left a shop with no working domain whenever the add failed.
  const added = await addDomainToProject(domain);
  if (!added.ok) {
    const msg =
      added.error === "already_in_use"
        ? "Domena jest przypisana do innego konta Vercel. Zwolnij ją i spróbuj ponownie."
        : added.error === "invalid"
          ? "Vercel odrzucił tę domenę jako nieprawidłową."
          : "Nie udało się zarejestrować domeny. Spróbuj ponownie za chwilę.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  try {
    // One transaction: the unverified claimant loses the domain in the same
    // step this shop gets it (the unique index allows one holder).
    await db.batch([
      db
        .update(shops)
        .set({ customDomain: null, customDomainVerified: false, updatedAt: new Date() })
        .where(
          and(
            eq(shops.customDomain, domain),
            ne(shops.id, access.shopId),
            or(eq(shops.customDomainVerified, false), isNotNull(shops.deletedAt)),
          ),
        ),
      db
        .update(shops)
        // Never verified on attach: the flag is set by the status check once
        // DNS and the TXT record are in place.
        .set({ customDomain: domain, customDomainVerified: false, updatedAt: new Date() })
        .where(eq(shops.id, access.shopId)),
    ]);
  } catch (e) {
    if (newOnVercel) await removeDomainFromProject(domain);
    if (uniqueViolation(e)) {
      // A verified claim appeared between the check and the write.
      return NextResponse.json(
        { error: "Ta domena jest już podłączona do innego sklepu." },
        { status: 409 },
      );
    }
    throw e;
  }

  if (previousDomain) await removeDomainFromProject(previousDomain);

  const status = await getDomainStatus(domain);
  const { verified, ownership } = await isDomainVerified(access.shopId, domain, status, false);
  if (verified) {
    await db.update(shops).set({ customDomainVerified: true }).where(eq(shops.id, access.shopId));
  }

  return NextResponse.json({
    ok: true,
    domain,
    dns: dnsInstructions(domain),
    ownership: ownershipRecord(access.shopId, domain),
    status: { ...status, ownershipVerified: ownership, active: verified },
    vercelConfigured: vercelConfigured(),
  });
}

/** Detach the custom domain from this shop. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { shop: shopSlug } = await params;
  const access = await getShopAccess(shopSlug);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await db.query.shops.findFirst({ where: eq(shops.id, access.shopId) });
  if (shop?.customDomain) {
    await db
      .update(shops)
      .set({ customDomain: null, customDomainVerified: false, updatedAt: new Date() })
      .where(eq(shops.id, access.shopId));
    await removeDomainFromProject(shop.customDomain);
  }
  return NextResponse.json({ ok: true });
}
