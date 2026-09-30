import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { getShopAccess } from "@/lib/api";
import { checkRateLimit } from "@/lib/rate-limit";
import { productAssistConfigured, suggestProductData } from "@/lib/ai-product-assist";

type Params = { params: Promise<{ shop: string }> };

/**
 * Propozycja materiału, kategorii i krótkiego opisu dla produktu
 * (lib/ai-product-assist). Nic nie zapisuje: formularz pokazuje propozycję,
 * a sprzedawca sam decyduje, czy ją przyjąć.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const { shop: shopSlug } = await params;
  const access = await getShopAccess(shopSlug);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!productAssistConfigured()) {
    return NextResponse.json({ error: "Asystent AI nie jest włączony na platformie." }, { status: 503 });
  }

  // Każde wywołanie kosztuje: 20 propozycji na minutę na sklep wystarcza
  // przy przeglądaniu katalogu, a blokuje pętlę kliknięć.
  const limited = checkRateLimit(req, `suggest:${shopSlug}`, 20, 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
    shortDesc?: string;
    category?: string;
    image?: string | null;
  };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Podaj najpierw nazwę produktu." }, { status: 400 });
  }

  const cats = await db
    .selectDistinct({ category: products.category })
    .from(products)
    .where(eq(products.shopId, access.shopId));

  try {
    const suggestion = await suggestProductData({
      name: body.name.trim().slice(0, 200),
      description: (body.description ?? "").slice(0, 20000),
      shortDesc: (body.shortDesc ?? "").slice(0, 500),
      category: (body.category ?? "").slice(0, 100),
      existingCategories: cats.map((c) => c.category).filter((c): c is string => !!c?.trim()).slice(0, 50),
      imageUrl: body.image ?? null,
    });
    if (!suggestion) {
      return NextResponse.json({ error: "Nie udało się przygotować propozycji. Spróbuj ponownie." }, { status: 502 });
    }
    return NextResponse.json(suggestion);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Asystent jest chwilowo zajęty. Spróbuj za minutę." }, { status: 429 });
    }
    if (e instanceof Anthropic.APIError) {
      console.error("product suggest failed", e.status, e.message);
      return NextResponse.json({ error: "Asystent AI jest chwilowo niedostępny." }, { status: 502 });
    }
    throw e;
  }
}
