import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { discountCodes } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";

type Params = { params: Promise<{ shop: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { shop } = await params;
  const access = await getShopAccess(shop);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.shopId, access.shopId))
    .orderBy(desc(discountCodes.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { shop } = await params;
  const access = await getShopAccess(shop);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    code?: string;
    discountPercent?: number;
    expiresAt?: string | null;
    maxUses?: number | null;
  };

  const code = body.code?.trim().toUpperCase() ?? "";
  if (!/^[A-Z0-9-]{3,24}$/.test(code)) {
    return NextResponse.json(
      { error: "Kod: 3–24 znaki, litery/cyfry/myślniki." },
      { status: 400 }
    );
  }
  const pct = body.discountPercent;
  if (!Number.isInteger(pct) || pct! < 1 || pct! > 90) {
    return NextResponse.json({ error: "Rabat musi być w zakresie 1–90%." }, { status: 400 });
  }
  let expiresAt: Date | null = null;
  if (body.expiresAt) {
    expiresAt = new Date(body.expiresAt);
    if (isNaN(expiresAt.getTime())) {
      return NextResponse.json({ error: "Niepoprawna data wygaśnięcia." }, { status: 400 });
    }
  }
  const maxUses =
    body.maxUses != null && Number.isInteger(body.maxUses) && body.maxUses > 0
      ? body.maxUses
      : null;

  try {
    const [created] = await db
      .insert(discountCodes)
      .values({ shopId: access.shopId, code, discountPercent: pct!, expiresAt, maxUses })
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const isUnique = e instanceof Error && /unique|duplicate/i.test(e.message);
    if (isUnique) {
      return NextResponse.json({ error: "Taki kod już istnieje w Twoim sklepie." }, { status: 409 });
    }
    throw e;
  }
}
