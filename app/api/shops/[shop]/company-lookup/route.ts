import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isValidNip, lookupCompanyByNip, normalizeNip } from "@/lib/mf-whitelist";
import { splitPolishAddress } from "@/lib/invoice";
import { checkRateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ shop: string }> };

/**
 * Podpowiedź danych firmy po NIP-ie w checkoucie, przy fakturze na firmę.
 *
 * Publiczna, bo kupujący nie ma konta, więc pilnujemy jej inaczej niż panelową
 * wersję: tylko dla działającego sklepu, z limitem na IP i z poprawnym NIP-em
 * (suma kontrolna), żeby nie robić z nas darmowego proxy do rejestru MF.
 * Zwraca wyłącznie dane z publicznego rejestru. Klient i tak sprawdza je
 * przed wysłaniem zamówienia, a serwer waliduje je jeszcze raz.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const { shop: shopSlug } = await params;

  const limited = checkRateLimit(req, `company-lookup:${shopSlug}`, 12, 60_000);
  if (limited) return limited;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, shopSlug) });
  if (!shop || !shop.active || shop.suspended || shop.deletedAt) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  const nip = normalizeNip(req.nextUrl.searchParams.get("nip") ?? "");
  if (!isValidNip(nip)) {
    return NextResponse.json(
      { error: "To nie jest poprawny NIP. Sprawdź, czy nie ma literówki." },
      { status: 400 }
    );
  }

  try {
    const company = await lookupCompanyByNip(nip);
    if (!company) {
      return NextResponse.json(
        { error: "Nie znaleźliśmy firmy o tym NIP-ie w rejestrze. Wpisz dane ręcznie." },
        { status: 404 }
      );
    }
    return NextResponse.json({
      company: { name: company.name, taxId: company.nip, ...splitPolishAddress(company.address) },
    });
  } catch {
    return NextResponse.json(
      { error: "Rejestr Ministerstwa Finansów nie odpowiada. Wpisz dane ręcznie." },
      { status: 502 }
    );
  }
}
