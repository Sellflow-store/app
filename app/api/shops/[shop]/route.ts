import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";

type Params = { params: Promise<{ shop: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { shop: shopSlug } = await params;
  const access = await getShopAccess(shopSlug);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Partial<{ name: string; active: boolean }>;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Nazwa nie może być pusta." }, { status: 400 });
    updates.name = name;
  }
  if (body.active !== undefined) {
    if (typeof body.active !== "boolean") {
      return NextResponse.json({ error: "Invalid active flag" }, { status: 400 });
    }
    updates.active = body.active;
  }

  const [updated] = await db
    .update(shops)
    .set(updates)
    .where(eq(shops.id, access.shopId))
    .returning({ name: shops.name, active: shops.active, slug: shops.slug });

  return NextResponse.json(updated);
}
