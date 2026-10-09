import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";

type Params = { params: Promise<{ shop: string }> };

/**
 * Zapisuje kolejność produktów: `ids` to wszystkie produkty sklepu w nowej
 * kolejności. Ta sama kolejność obowiązuje w panelu i w sklepie ("Polecane").
 *
 * Wymagamy KOMPLETNEJ listy. Lista częściowa (np. po filtrze w panelu albo
 * produkt dodany w drugiej karcie) przesunęłaby pominięte produkty w losowe
 * miejsca, więc przy rozbieżności odpowiadamy 409 i panel odświeża listę.
 */
export async function PUT(req: NextRequest, { params }: Params) {
  const { shop } = await params;
  const access = await getShopAccess(shop);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let ids: unknown;
  try {
    ids = ((await req.json()) as { ids?: unknown }).ids;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }
  const ordered = ids as string[];
  if (new Set(ordered).size !== ordered.length) {
    return NextResponse.json({ error: "Duplicate ids" }, { status: 400 });
  }

  const existing = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.shopId, access.shopId));
  const known = new Set(existing.map((p) => p.id));
  if (known.size !== ordered.length || ordered.some((id) => !known.has(id))) {
    return NextResponse.json(
      { error: "Lista produktów się zmieniła. Odśwież stronę i spróbuj ponownie." },
      { status: 409 }
    );
  }

  // Jedno zapytanie zamiast N: neon-http nie ma transakcji, a kolejność
  // zapisana w połowie byłaby gorsza niż żadna.
  const cases = sql.join(
    ordered.map((id, index) => sql`when ${products.id} = ${id}::uuid then ${index}`),
    sql` `
  );
  await db
    .update(products)
    .set({ sortOrder: sql`case ${cases} else ${products.sortOrder} end` })
    .where(and(eq(products.shopId, access.shopId), inArray(products.id, ordered)));

  return NextResponse.json({ ok: true });
}
