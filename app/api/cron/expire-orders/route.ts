/**
 * Vercel Cron (vercel.json) → co godzinę anuluje nieopłacone zamówienia
 * online starsze niż 48 h. Szczegóły reguł w lib/order-expiry.ts.
 *
 * Vercel dokleja do wywołania crona `Authorization: Bearer $CRON_SECRET`.
 * Bez ustawionego CRON_SECRET endpoint odmawia — inaczej każdy mógłby go
 * wywołać (szkody niewielkie, ale anulowanie to decyzja platformy, nie
 * przypadkowego żądania).
 */

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { expireUnpaidOnlineOrders } from "@/lib/order-expiry";

export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await expireUnpaidOnlineOrders();
  if (result.checked > 0) console.log("Expiry: przebieg", result);
  return NextResponse.json(result);
}
