import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shopConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { CONFIG_KEYS, MAX_CONFIG_BYTES, scrubConfigValue } from "@/lib/config-validation";

type Params = { params: Promise<{ shop: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { shop } = await params;
  const access = await getShopAccess(shop);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(shopConfig)
    .where(eq(shopConfig.shopId, access.shopId));

  const config = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return NextResponse.json(config);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { shop } = await params;
  const access = await getShopAccess(shop);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, value } = (await req.json()) as { key: string; value: unknown };
  if (!key || value === undefined) {
    return NextResponse.json({ error: "key and value required" }, { status: 400 });
  }
  if (!CONFIG_KEYS.has(key)) {
    return NextResponse.json({ error: "Nieznany klucz konfiguracji." }, { status: 400 });
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return NextResponse.json({ error: "Wartość musi być obiektem." }, { status: 400 });
  }
  if (JSON.stringify(value).length > MAX_CONFIG_BYTES) {
    return NextResponse.json({ error: "Konfiguracja jest zbyt duża." }, { status: 413 });
  }

  const clean = scrubConfigValue(key, value as Record<string, unknown>);

  await db
    .insert(shopConfig)
    .values({
      shopId: access.shopId,
      key,
      value: clean,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [shopConfig.shopId, shopConfig.key],
      set: { value: clean, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}
