import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/api";
import { loadOpsShops, opsShopStatus, parseOpsShopFilter } from "@/lib/ops-shops";

/**
 * CSV listy sklepów z /ops/shops, z tymi samymi filtrami co tabela.
 * Średnik i BOM, żeby polski Excel otworzył plik bez importu.
 */
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sp = req.nextUrl.searchParams;
  const f = parseOpsShopFilter({
    widok: sp.get("widok") ?? undefined,
    q: sp.get("q") ?? undefined,
    plan: sp.get("plan") ?? undefined,
    sort: sp.get("sort") ?? undefined,
  });
  const rows = await loadOpsShops(f);

  const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
  const header = [
    "Nazwa", "Adres", "E-mail właściciela", "Plan", "Status", "Produkty",
    "GMV 30 dni", "Zamówienia 30 dni", "Ostatnie zamówienie", "Aktywność właściciela",
    "Utworzono", "Usunięto",
  ];
  const lines = rows.map((r) => [
    r.name, r.slug, r.ownerEmail, r.ownerPlan, opsShopStatus(r), String(r.productCount),
    r.gmv30.toFixed(2).replace(".", ","), String(r.orders30), day(r.lastOrderAt), day(r.ownerActiveAt),
    day(r.createdAt), day(r.deletedAt),
  ]);

  const csv = "﻿" + [header, ...lines].map((l) => l.map(cell).join(";")).join("\r\n");
  const name = `sellflow-sklepy-${f.deleted ? "usuniete" : "aktywne"}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Cudzysłowy zawsze; nazwy sklepów wpisują klienci, więc wartości
 *  zaczynające się od =, +, -, @ dostają apostrof (formuły w Excelu). */
function cell(v: string): string {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}
