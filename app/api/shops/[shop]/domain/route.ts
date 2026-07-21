import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shops, users } from "@/lib/db/schema";
import { and, eq, isNull, ne } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import {
  addDomainToProject,
  removeDomainFromProject,
  getDomainStatus,
  dnsInstructions,
  vercelConfigured,
} from "@/lib/vercel-domains";

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
  // Self-heal the persisted verification flag from the live status so the
  // subdomain redirect (proxy.ts) tracks reality without its own Vercel call.
  const verified = status.verified && !status.misconfigured;
  if (verified !== shop?.customDomainVerified) {
    await db
      .update(shops)
      .set({ customDomainVerified: verified })
      .where(eq(shops.id, access.shopId));
  }
  return NextResponse.json({
    domain,
    dns: dnsInstructions(domain),
    status,
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

  // Uniqueness across shops (the DB unique index is the hard guard; this returns
  // a friendly message before we hit it).
  const taken = await db.query.shops.findFirst({
    where: and(
      eq(shops.customDomain, domain),
      ne(shops.id, access.shopId),
      isNull(shops.deletedAt),
    ),
  });
  if (taken) {
    return NextResponse.json(
      { error: "Ta domena jest już podłączona do innego sklepu." },
      { status: 409 },
    );
  }

  // Release the previous domain (if the merchant is changing it) before adding
  // the new one, so Vercel doesn't hold a stale attachment.
  const current = await db.query.shops.findFirst({ where: eq(shops.id, access.shopId) });
  if (current?.customDomain && current.customDomain !== domain) {
    await removeDomainFromProject(current.customDomain);
  }

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

  const status = await getDomainStatus(domain);
  await db
    .update(shops)
    .set({
      customDomain: domain,
      // Reset verification to the freshly-observed state — a brand-new domain
      // is normally still pending DNS, so this is usually false. Drives the
      // subdomain→custom-domain redirect (see proxy.ts).
      customDomainVerified: status.verified && !status.misconfigured,
      updatedAt: new Date(),
    })
    .where(eq(shops.id, access.shopId));

  return NextResponse.json({
    ok: true,
    domain,
    dns: dnsInstructions(domain),
    status,
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
    await removeDomainFromProject(shop.customDomain);
    await db
      .update(shops)
      .set({ customDomain: null, customDomainVerified: false, updatedAt: new Date() })
      .where(eq(shops.id, access.shopId));
  }
  return NextResponse.json({ ok: true });
}
