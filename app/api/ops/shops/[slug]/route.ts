import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shops, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/api";
import { PLAN_IDS, type PlanId } from "@/lib/plans";

type Params = { params: Promise<{ slug: string }> };

/** Operator actions on a shop. PATCH: suspend/activate + change owner plan. */
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as Partial<{ suspended: boolean; plan: string; restore: boolean }>;

  if (body.restore === true) {
    // Undo a soft delete: bring the shop back online. Slug was reserved the
    // whole time (row never left), so nothing to reclaim.
    await db
      .update(shops)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(shops.id, shop.id));
  }

  if (body.suspended !== undefined) {
    if (typeof body.suspended !== "boolean") {
      return NextResponse.json({ error: "Invalid suspended flag" }, { status: 400 });
    }
    // Operator-only suspension. Merchants cannot clear this (their PATCH only
    // touches `active`), so a suspended shop stays down until ops lifts it.
    await db
      .update(shops)
      .set({ suspended: body.suspended, updatedAt: new Date() })
      .where(eq(shops.id, shop.id));
  }

  if (body.plan !== undefined) {
    if (!PLAN_IDS.includes(body.plan as PlanId)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    await db
      .update(users)
      .set({ plan: body.plan, updatedAt: new Date() })
      .where(eq(users.id, shop.ownerId));
  }

  return NextResponse.json({ ok: true });
}

/** Soft-delete a shop: take the storefront + dashboard offline but keep the
 *  row so the slug/subdomain stays reserved (no hijacking) and order/invoice
 *  history is retained (PL tax: 5 lat). Reversible via PATCH { restore: true }.
 *  Products/orders/config are NOT touched. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;

  const [deleted] = await db
    .update(shops)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(shops.slug, slug))
    .returning({ id: shops.id });

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
