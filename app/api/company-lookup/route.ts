import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { lookupCompanyByNip, isValidNip, normalizeNip } from "@/lib/mf-whitelist";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Podpowiedź danych firmy po NIP-ie, na potrzeby panelu.
 *
 * Za sesją, mimo że źródło jest publiczne — endpoint bez logowania zrobiłby
 * z nas darmowe proxy do rejestru MF i obciążał nasz limit cudzym ruchem.
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = checkRateLimit(req, `company-lookup:${userId}`, 20, 60_000);
  if (limited) return limited;

  const nip = normalizeNip(req.nextUrl.searchParams.get("nip") ?? "");
  if (!isValidNip(nip)) {
    return NextResponse.json(
      { error: "To nie jest poprawny NIP — sprawdź, czy nie ma literówki." },
      { status: 400 }
    );
  }

  try {
    const company = await lookupCompanyByNip(nip);
    if (!company) {
      return NextResponse.json(
        { error: "Nie znaleźliśmy firmy o tym NIP-ie w rejestrze." },
        { status: 404 }
      );
    }
    return NextResponse.json({ company });
  } catch {
    return NextResponse.json(
      { error: "Rejestr Ministerstwa Finansów nie odpowiada. Wpisz dane ręcznie." },
      { status: 502 }
    );
  }
}
