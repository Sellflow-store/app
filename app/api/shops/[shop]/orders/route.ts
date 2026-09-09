import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shops, shopConfig, products, orders, customers, users, discountCodes } from "@/lib/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { DEFAULT_CHECKOUT, normalizeDeliveryConfig } from "@/lib/shop";
import { checkDiscountCode } from "@/lib/discounts";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail, merchantNewOrderEmail } from "@/lib/email-templates";
import { checkRateLimit } from "@/lib/rate-limit";
import { fetchPointByCode } from "@/lib/inpost";
import { buildTransferQrPayload } from "@/lib/qr-transfer";
import QRCode from "qrcode";
import type { AccountConfig } from "@/types/shop";
import type { DeliveryConfig, CheckoutConfig } from "@/types/shop";

type Params = { params: Promise<{ shop: string }> };

interface OrderRequest {
  customer: { email: string; name: string; phone?: string };
  address: { street: string; zip: string; city: string } | null;
  items: { productId: string; qty: number; size?: string | null }[];
  deliveryMethodId: string | null;
  pickupPointCode?: string | null;
  paymentMethod: "transfer" | "cod";
  discountCode?: string | null;
  notes?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

// Public endpoint — shop customers place orders here, no auth.
export async function POST(req: NextRequest, { params }: Params) {
  const { shop: shopSlug } = await params;

  // Throttle order placement per IP — blocks order spam and denial-of-inventory
  // (each order can decrement stock) from a single source.
  const limited = checkRateLimit(req, `orders:${shopSlug}`, 10, 60_000);
  if (limited) return limited;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, shopSlug) });
  if (!shop || !shop.active || shop.suspended) return bad("Shop not found", 404);

  let body: OrderRequest;
  try {
    body = (await req.json()) as OrderRequest;
  } catch {
    return bad("Invalid JSON");
  }

  // ── Validate input ──────────────────────────────────────────────────────
  const email = body.customer?.email?.trim().toLowerCase();
  const name = body.customer?.name?.trim();
  const phone = body.customer?.phone?.trim() || null;
  if (!email || !EMAIL_RE.test(email)) return bad("Podaj poprawny adres e-mail.");
  if (!name) return bad("Podaj imię i nazwisko.");

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return bad("Koszyk jest pusty.");
  }
  if (body.items.some((i) => !i.productId || !Number.isInteger(i.qty) || i.qty < 1 || i.qty > 99)) {
    return bad("Niepoprawne pozycje zamówienia.");
  }
  if (body.paymentMethod !== "transfer" && body.paymentMethod !== "cod") {
    return bad("Niepoprawna metoda płatności.");
  }

  // ── Recompute prices from DB — client totals are never trusted ──────────
  const ids = [...new Set(body.items.map((i) => i.productId))];
  const dbProducts = await db
    .select()
    .from(products)
    .where(and(eq(products.shopId, shop.id), eq(products.visible, true), inArray(products.id, ids)));
  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  const missing = ids.filter((id) => !productMap.has(id));
  if (missing.length > 0) {
    return bad("Część produktów z koszyka jest już niedostępna. Odśwież koszyk.", 409);
  }

  // ── Produkty na zamówienie nie mają ceny, więc nie mają czego policzyć ──
  // Storefront ich nie doda do koszyka, ale stary koszyk w localStorage albo
  // ręcznie sklejone żądanie mogłyby przepchnąć zamówienie za 0 zł.
  const onRequest = dbProducts.filter((p) => p.priceOnRequest);
  if (onRequest.length > 0) {
    return bad(
      `Produkt „${onRequest[0].name}" powstaje na zamówienie — skontaktuj się z nami, żeby ustalić cenę i termin. Usuń go z koszyka, aby dokończyć zamówienie.`,
      409
    );
  }

  // ── Rozmiar — nigdy z klienta na wiarę ──────────────────────────────────
  // Produkt z rozmiarami musi dostać jeden z SWOICH rozmiarów; produkt bez
  // rozmiarów dostaje null, choćby przeglądarka coś przysłała.
  const sizeByLine: (string | null)[] = [];
  for (const i of body.items) {
    const p = productMap.get(i.productId)!;
    const available = ((p.sizes as string[]) ?? []).filter((s) => typeof s === "string");
    const wanted = typeof i.size === "string" ? i.size.trim() : "";
    if (available.length === 0) {
      sizeByLine.push(null);
      continue;
    }
    const match = available.find((s) => s === wanted);
    if (!match) {
      return bad(`Wybierz rozmiar dla produktu „${p.name}".`);
    }
    sizeByLine.push(match);
  }

  // Physical items drive shipping, address and cash-on-delivery.
  const hasPhysical = dbProducts.some((p) => (p.type ?? "physical") === "physical");
  const hasDigital = dbProducts.some((p) => p.type === "digital");
  const hasService = dbProducts.some((p) => p.type === "service");

  // Address required only when something ships. Dla paczkomatu ulica nie ma
  // sensu (adresem jest punkt), więc sprawdzamy ją dopiero po ustaleniu metody.
  const street = body.address?.street?.trim() ?? "";
  const zip = body.address?.zip?.trim() ?? "";
  const city = body.address?.city?.trim() ?? "";
  if (hasPhysical && (!zip || !city)) return bad("Uzupełnij adres dostawy.");

  // ── Load config ─────────────────────────────────────────────────────────
  const configs = await db
    .select()
    .from(shopConfig)
    .where(and(eq(shopConfig.shopId, shop.id), inArray(shopConfig.key, ["delivery", "checkout", "account"])));
  const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]));

  const delivery: DeliveryConfig = normalizeDeliveryConfig(
    configMap.delivery as Partial<DeliveryConfig> | undefined
  );
  const checkout: CheckoutConfig = {
    ...DEFAULT_CHECKOUT,
    ...((configMap.checkout as Partial<CheckoutConfig>) ?? {}),
  };

  // Delivery method required only for physical carts.
  const method = hasPhysical
    ? delivery.methods.find((m) => m.id === body.deliveryMethodId && m.enabled) ?? null
    : null;
  if (hasPhysical && !method) return bad("Wybierz metodę dostawy.");
  if (method && method.kind !== "parcel_locker" && !street) {
    return bad("Uzupełnij adres dostawy.");
  }

  // ── Punkt odbioru — kod z przeglądarki weryfikujemy u InPostu ────────────
  // Klient mógłby podstawić dowolny ciąg, a etykieta powstaje z tego, co tu
  // zapiszemy. Bierzemy nazwę i adres z odpowiedzi InPostu, nie od klienta.
  let pickupPoint: Record<string, string | boolean> | null = null;
  if (method?.kind === "parcel_locker") {
    const code = body.pickupPointCode?.trim();
    if (!code) return bad("Wybierz paczkomat, do którego mamy dowieźć paczkę.");
    const point = await fetchPointByCode(code);
    if (!point) return bad("Nie znamy takiego paczkomatu. Wybierz punkt z mapy.");
    if (body.paymentMethod === "cod" && !point.paymentAvailable) {
      return bad(
        `Paczkomat ${point.code} nie przyjmuje płatności przy odbiorze. Wybierz inny punkt albo zapłać przelewem.`
      );
    }
    pickupPoint = {
      code: point.code,
      name: point.name,
      address: point.address,
      carrier: "inpost",
      paymentAvailable: point.paymentAvailable,
    };
  }

  // Cash-on-delivery only makes sense for a physical shipment.
  if (body.paymentMethod === "cod" && !hasPhysical) {
    return bad("Za pobraniem jest dostępne tylko dla produktów fizycznych.");
  }
  if (body.paymentMethod === "transfer" && !checkout.transferEnabled) {
    return bad("Płatność przelewem jest niedostępna w tym sklepie.");
  }
  if (body.paymentMethod === "cod" && !checkout.codEnabled) {
    return bad("Płatność za pobraniem jest niedostępna w tym sklepie.");
  }

  // ── Stock guard — block overselling for tracked products ────────────────
  // Aggregate requested qty per product (the same id can appear twice).
  const requested = new Map<string, number>();
  for (const i of body.items) requested.set(i.productId, (requested.get(i.productId) ?? 0) + i.qty);
  for (const [id, qty] of requested) {
    const p = productMap.get(id)!;
    if (p.stock != null && qty > p.stock) {
      return bad(
        p.stock <= 0
          ? `Produkt „${p.name}" jest już wyprzedany. Usuń go z koszyka.`
          : `Produktu „${p.name}" zostało tylko ${p.stock} szt. Zmniejsz ilość w koszyku.`,
        409
      );
    }
  }

  const orderItems = body.items.map((i, idx) => {
    const p = productMap.get(i.productId)!;
    return {
      productId: p.id,
      name: p.name,
      price: p.price,
      qty: i.qty,
      size: sizeByLine[idx],
      image: ((p.images as string[]) ?? [])[0] ?? null,
    };
  });

  const subtotal = orderItems.reduce((sum, i) => sum + parseFloat(i.price) * i.qty, 0);

  // Discount — re-validated server-side, never trusted from the client
  let discountAmount = 0;
  let appliedDiscount: { id: string; code: string } | null = null;
  if (body.discountCode) {
    const verdict = await checkDiscountCode(shop.id, body.discountCode);
    if (!verdict.valid) return bad(verdict.reason);
    discountAmount = Math.round(subtotal * verdict.discountPercent) / 100;
    appliedDiscount = { id: verdict.row.id, code: verdict.row.code };
  }

  // Free-shipping threshold uses the pre-discount subtotal (same as checkout UI)
  const freeFrom = parseFloat(delivery.freeShippingFrom);
  const shippingFree = !isNaN(freeFrom) && freeFrom > 0 && subtotal >= freeFrom;
  const shippingCost = method ? (shippingFree ? 0 : parseFloat(method.price)) : 0;

  const codFee = body.paymentMethod === "cod" ? parseFloat(checkout.codFee) || 0 : 0;
  const total = subtotal - discountAmount + shippingCost + codFee;

  const shippingAddress = {
    name,
    phone,
    street: street || undefined,
    zip: zip || undefined,
    city: city || undefined,
    deliveryMethodId: method?.id,
    deliveryMethod: method?.label,
    deliveryMethodKind: method?.kind,
    pickupPointCode: pickupPoint?.code,
    codFee: codFee > 0 ? codFee.toFixed(2) : undefined,
  };

  // ── Insert order; sequential number per shop, retry on collision ────────
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(eq(orders.shopId, shop.id));

  let order: typeof orders.$inferSelect | null = null;
  for (let attempt = 0; attempt < 3 && !order; attempt++) {
    const orderNumber = `ZAM-${String(count + 1 + attempt).padStart(5, "0")}`;
    try {
      const [inserted] = await db
        .insert(orders)
        .values({
          shopId: shop.id,
          orderNumber,
          customerEmail: email,
          customerName: name,
          customerPhone: phone,
          items: orderItems,
          subtotal: subtotal.toFixed(2),
          shippingCost: shippingCost.toFixed(2),
          discountAmount: discountAmount.toFixed(2),
          discountCode: appliedDiscount?.code ?? null,
          total: total.toFixed(2),
          paymentMethod: body.paymentMethod,
          shippingAddress,
          pickupPoint: pickupPoint ?? {},
          carrier: pickupPoint ? "inpost" : null,
          notes: body.notes?.trim() || null,
        })
        .returning();
      order = inserted;
    } catch (e) {
      // unique violation on (shopId, orderNumber) — concurrent order, bump and retry
      const isUnique = e instanceof Error && /unique|duplicate/i.test(e.message);
      if (!isUnique || attempt === 2) throw e;
    }
  }
  if (!order) return bad("Nie udało się zapisać zamówienia. Spróbuj ponownie.", 500);

  if (appliedDiscount) {
    await db
      .update(discountCodes)
      .set({ usesCount: sql`${discountCodes.usesCount} + 1` })
      .where(eq(discountCodes.id, appliedDiscount.id));
  }

  // ── Decrement stock for tracked products (floor at 0) ───────────────────
  // Validated above; the small validate→decrement race is acceptable at MVP
  // scale and GREATEST() guarantees stock never goes negative.
  for (const [id, qty] of requested) {
    const p = productMap.get(id)!;
    if (p.stock != null) {
      await db
        .update(products)
        .set({ stock: sql`GREATEST(${products.stock} - ${qty}, 0)`, updatedAt: new Date() })
        .where(and(eq(products.id, id), eq(products.shopId, shop.id)));
    }
  }

  // ── Upsert customer aggregate ────────────────────────────────────────────
  await db
    .insert(customers)
    .values({
      shopId: shop.id,
      email,
      name,
      phone,
      address: { street, zip, city },
      totalOrders: 1,
      totalSpent: total.toFixed(2),
    })
    .onConflictDoUpdate({
      target: [customers.shopId, customers.email],
      set: {
        name,
        phone,
        address: { street, zip, city },
        totalOrders: sql`${customers.totalOrders} + 1`,
        totalSpent: sql`${customers.totalSpent} + ${total.toFixed(2)}`,
      },
    });

  // ── Emails — best-effort, never fail the order on email problems ────────
  const transferTitle = `Zamówienie ${order.orderNumber}`;
  const transferDetails =
    body.paymentMethod === "transfer"
      ? {
          bankAccount: checkout.bankAccount,
          accountOwner: checkout.accountOwner,
          title: transferTitle,
        }
      : null;

  // ── Kod QR przelewu (standard 2D ZBP) ───────────────────────────────────
  // Klient skanuje go aplikacją banku zamiast przepisywać 26 cyfr. Generujemy
  // po stronie serwera, żeby nie dokładać kodera QR do bundla storefrontu.
  // Gdy danych nie da się poprawnie sformatować, po prostu nie pokazujemy kodu —
  // numer konta i tytuł są obok, więc klient nadal zapłaci.
  let transferQr: string | null = null;
  if (transferDetails) {
    const account = (configMap.account as Partial<AccountConfig> | undefined) ?? {};
    const payload = buildTransferQrPayload({
      bankAccount: checkout.bankAccount,
      recipientName: checkout.accountOwner || shop.name,
      title: transferTitle,
      amount: total.toFixed(2),
      taxId: account.company?.taxId,
    });
    if (payload) {
      try {
        transferQr = await QRCode.toDataURL(payload, { margin: 1, width: 320 });
      } catch (e) {
        console.error("QR przelewu nie powstał:", e);
      }
    }
  }

  const summary = {
    orderNumber: order.orderNumber,
    items: orderItems,
    subtotal: subtotal.toFixed(2),
    shippingCost: shippingCost.toFixed(2),
    codFee: codFee > 0 ? codFee.toFixed(2) : null,
    discountAmount: discountAmount > 0 ? discountAmount.toFixed(2) : null,
    discountCode: appliedDiscount?.code ?? null,
    total: total.toFixed(2),
    showShipping: hasPhysical,
    pickupPoint: pickupPoint
      ? { code: String(pickupPoint.code), address: String(pickupPoint.address) }
      : null,
  };

  // Customer-facing note for non-physical items.
  const noteParts: string[] = [];
  if (hasDigital) noteParts.push("Dostęp do produktów cyfrowych wyślemy na Twój adres e-mail po zaksięgowaniu płatności.");
  if (hasService) noteParts.push("W sprawie realizacji usługi skontaktujemy się z Tobą wkrótce.");
  const fulfillmentNote = noteParts.join(" ") || undefined;

  // Merchant-facing fulfillment details: digital access to send + service flags.
  const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const digitalDetails = dbProducts
    .filter((p) => p.type === "digital")
    .map((p) => {
      const ful = (p.fulfillment ?? {}) as {
        kind?: string; fileUrl?: string; url?: string; licenseKeys?: string; instructions?: string;
      };
      const value =
        ful.kind === "file" ? ful.fileUrl :
        ful.kind === "link" ? ful.url :
        ful.kind === "license" ? ful.licenseKeys : "";
      const kindLabel = ful.kind === "file" ? "Plik" : ful.kind === "link" ? "Link" : ful.kind === "license" ? "Klucze" : "Dostęp";
      const instr = ful.instructions ? ` — ${escHtml(ful.instructions)}` : "";
      return `<p style="margin:0 0 6px;font-size:12px;color:#444444;"><strong>${escHtml(p.name)}</strong> · ${kindLabel}: ${escHtml(value || "—")}${instr}</p>`;
    })
    .join("");
  const serviceDetails = hasService
    ? `<p style="margin:0;font-size:12px;color:#444444;">Zamówienie zawiera usługę — skontaktuj się z klientem w sprawie realizacji.</p>`
    : "";
  const fulfillmentDetails = digitalDetails || serviceDetails ? digitalDetails + serviceDetails : undefined;

  try {
    const confirmation = orderConfirmationEmail({
      shopName: shop.name,
      customerName: name,
      order: summary,
      paymentMethod: body.paymentMethod,
      transfer: transferDetails,
      fulfillmentNote,
    });
    await sendEmail({ to: email, ...confirmation });

    const owner = await db.query.users.findFirst({ where: eq(users.id, shop.ownerId) });
    if (owner?.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const notification = merchantNewOrderEmail({
        shopName: shop.name,
        order: summary,
        customerName: name,
        customerEmail: email,
        paymentMethod: body.paymentMethod,
        orderUrl: `${appUrl}/dashboard/${shop.slug}/orders/${order.id}`,
        fulfillmentDetails,
      });
      await sendEmail({ to: owner.email, ...notification, replyTo: email });
    }
  } catch (e) {
    console.error("Order emails failed:", e);
  }

  return NextResponse.json(
    {
      orderNumber: order.orderNumber,
      subtotal: subtotal.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      codFee: codFee > 0 ? codFee.toFixed(2) : null,
      discountAmount: discountAmount > 0 ? discountAmount.toFixed(2) : null,
      discountCode: appliedDiscount?.code ?? null,
      total: total.toFixed(2),
      paymentMethod: body.paymentMethod,
      pickupPoint: pickupPoint
        ? { code: String(pickupPoint.code), address: String(pickupPoint.address) }
        : null,
      transfer: transferDetails ? { ...transferDetails, qr: transferQr } : null,
    },
    { status: 201 }
  );
}
