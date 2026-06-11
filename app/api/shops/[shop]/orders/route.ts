import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shops, shopConfig, products, orders, customers } from "@/lib/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { DEFAULT_DELIVERY, DEFAULT_CHECKOUT } from "@/lib/shop";
import type { DeliveryConfig, CheckoutConfig } from "@/types/shop";

type Params = { params: Promise<{ shop: string }> };

interface OrderRequest {
  customer: { email: string; name: string; phone?: string };
  address: { street: string; zip: string; city: string };
  items: { productId: string; qty: number }[];
  deliveryMethodId: string;
  paymentMethod: "transfer" | "cod";
  notes?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

// Public endpoint — shop customers place orders here, no auth.
export async function POST(req: NextRequest, { params }: Params) {
  const { shop: shopSlug } = await params;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, shopSlug) });
  if (!shop || !shop.active) return bad("Shop not found", 404);

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

  const street = body.address?.street?.trim();
  const zip = body.address?.zip?.trim();
  const city = body.address?.city?.trim();
  if (!street || !zip || !city) return bad("Uzupełnij adres dostawy.");

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return bad("Koszyk jest pusty.");
  }
  if (body.items.some((i) => !i.productId || !Number.isInteger(i.qty) || i.qty < 1 || i.qty > 99)) {
    return bad("Niepoprawne pozycje zamówienia.");
  }
  if (body.paymentMethod !== "transfer" && body.paymentMethod !== "cod") {
    return bad("Niepoprawna metoda płatności.");
  }

  // ── Load config ─────────────────────────────────────────────────────────
  const configs = await db
    .select()
    .from(shopConfig)
    .where(and(eq(shopConfig.shopId, shop.id), inArray(shopConfig.key, ["delivery", "checkout"])));
  const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]));

  const delivery: DeliveryConfig = {
    ...DEFAULT_DELIVERY,
    ...((configMap.delivery as Partial<DeliveryConfig>) ?? {}),
  };
  const checkout: CheckoutConfig = {
    ...DEFAULT_CHECKOUT,
    ...((configMap.checkout as Partial<CheckoutConfig>) ?? {}),
  };

  const method = delivery.methods.find((m) => m.id === body.deliveryMethodId && m.enabled);
  if (!method) return bad("Wybierz metodę dostawy.");

  if (body.paymentMethod === "transfer" && !checkout.transferEnabled) {
    return bad("Płatność przelewem jest niedostępna w tym sklepie.");
  }
  if (body.paymentMethod === "cod" && !checkout.codEnabled) {
    return bad("Płatność za pobraniem jest niedostępna w tym sklepie.");
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

  const orderItems = body.items.map((i) => {
    const p = productMap.get(i.productId)!;
    return {
      productId: p.id,
      name: p.name,
      price: p.price,
      qty: i.qty,
      image: ((p.images as string[]) ?? [])[0] ?? null,
    };
  });

  const subtotal = orderItems.reduce((sum, i) => sum + parseFloat(i.price) * i.qty, 0);

  const freeFrom = parseFloat(delivery.freeShippingFrom);
  const shippingFree = !isNaN(freeFrom) && freeFrom > 0 && subtotal >= freeFrom;
  const shippingCost = shippingFree ? 0 : parseFloat(method.price);

  const codFee = body.paymentMethod === "cod" ? parseFloat(checkout.codFee) || 0 : 0;
  const total = subtotal + shippingCost + codFee;

  const shippingAddress = {
    name,
    phone,
    street,
    zip,
    city,
    deliveryMethodId: method.id,
    deliveryMethod: method.label,
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
          total: total.toFixed(2),
          paymentMethod: body.paymentMethod,
          shippingAddress,
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

  return NextResponse.json(
    {
      orderNumber: order.orderNumber,
      subtotal: subtotal.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      codFee: codFee > 0 ? codFee.toFixed(2) : null,
      total: total.toFixed(2),
      paymentMethod: body.paymentMethod,
      transfer:
        body.paymentMethod === "transfer"
          ? {
              bankAccount: checkout.bankAccount,
              accountOwner: checkout.accountOwner,
              title: `Zamówienie ${order.orderNumber}`,
            }
          : null,
    },
    { status: 201 }
  );
}
