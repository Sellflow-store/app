import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shops, shopConfig, users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { contactFormEmail } from "@/lib/email-templates";
import type { AboutConfig, AccountConfig } from "@/types/shop";

type Params = { params: Promise<{ shop: string }> };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE = 4000;

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/**
 * Skrzynka, na którą idą wiadomości z formularza. Kolejność od najbardziej
 * świadomej decyzji sprzedawcy do ostatniej deski ratunku:
 *   1. adres publiczny z „O nas" — ten, który i tak widnieje na stronie
 *   2. adres kontaktowy z ustawień konta
 *   3. e-mail właściciela konta
 * Bez żadnego z nich formularz się nie pokazuje, więc nie da się wysłać
 * wiadomości donikąd.
 */
async function recipientFor(shopId: string, ownerId: string): Promise<string | null> {
  const rows = await db
    .select()
    .from(shopConfig)
    .where(and(eq(shopConfig.shopId, shopId)));
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const about = (map.about ?? {}) as Partial<AboutConfig>;
  const account = (map.account ?? {}) as Partial<AccountConfig>;

  const candidates = [about.email, account.contactEmail];
  for (const c of candidates) {
    if (typeof c === "string" && EMAIL_RE.test(c.trim())) return c.trim();
  }
  const owner = await db.query.users.findFirst({ where: eq(users.id, ownerId) });
  return owner?.email && EMAIL_RE.test(owner.email) ? owner.email : null;
}

/** Publiczny endpoint — formularz kontaktowy na storefroncie wysyła tutaj. */
export async function POST(req: NextRequest, { params }: Params) {
  const { shop: shopSlug } = await params;

  // Formularz kontaktowy to darmowa wysyłka maila cudzym kosztem, więc limit
  // jest ciaśniejszy niż przy zamówieniach.
  const limited = checkRateLimit(req, `contact:${shopSlug}`, 5, 10 * 60_000);
  if (limited) return limited;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, shopSlug) });
  if (!shop || !shop.active || shop.suspended || shop.deletedAt) {
    return bad("Shop not found", 404);
  }

  let body: { name?: string; email?: string; phone?: string; message?: string; firma?: string };
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON");
  }

  // Pułapka na boty: pole ukryte przed człowiekiem. Wypełnione = automat.
  // Odpowiadamy sukcesem, żeby nie podpowiadać, że wpadł w pułapkę.
  if (typeof body.firma === "string" && body.firma.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const phone = body.phone?.trim() ?? "";
  const message = body.message?.trim() ?? "";

  if (name.length < 2) return bad("Podaj imię.");
  if (!EMAIL_RE.test(email)) return bad("Podaj poprawny adres e-mail.");
  if (message.length < 10) return bad("Napisz kilka słów więcej — wiadomość jest za krótka.");
  if (message.length > MAX_MESSAGE) return bad("Wiadomość jest za długa.");

  const to = await recipientFor(shop.id, shop.ownerId);
  if (!to) {
    return bad(
      "Sklep nie ma jeszcze skonfigurowanego adresu kontaktowego. Spróbuj później.",
      503
    );
  }

  const mail = contactFormEmail({
    shopName: shop.name,
    name,
    email,
    phone: phone || undefined,
    message,
  });

  // `replyTo` na adresie nadawcy: sprzedawca odpowiada w swoim kliencie
  // pocztowym i trafia do klienta, a nie na adres platformy.
  const sent = await sendEmail({ to, ...mail, replyTo: email });
  if (!sent) {
    return bad("Nie udało się wysłać wiadomości. Spróbuj ponownie za chwilę.", 502);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
