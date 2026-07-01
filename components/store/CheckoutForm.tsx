"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Landmark, HandCoins, Check, Copy, Tag, X } from "lucide-react";
import { useCart, formatPln } from "@/lib/cart";
import type { DeliveryMethod } from "@/types/shop";

interface Props {
  shopSlug: string;
  deliveryMethods: DeliveryMethod[];
  freeShippingFrom: string;
  transferEnabled: boolean;
  codEnabled: boolean;
  codFee: string;
}

interface Confirmation {
  orderNumber: string;
  total: string;
  paymentMethod: "transfer" | "cod";
  transfer: { bankAccount: string; accountOwner: string; title: string } | null;
}

const inputClass =
  "w-full border border-rule rounded-xl px-4 py-3 text-sm text-ink bg-paper placeholder:text-ink-2/50 outline-none focus:border-ink transition-colors";

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-ink-2 mb-1.5">
      {children}
    </label>
  );
}

export default function CheckoutForm({
  shopSlug,
  deliveryMethods,
  freeShippingFrom,
  transferEnabled,
  codEnabled,
  codFee,
}: Props) {
  const { items, subtotal, clear } = useCart(shopSlug);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryId, setDeliveryId] = useState(deliveryMethods[0]?.id ?? "");
  const [payment, setPayment] = useState<"transfer" | "cod">(transferEnabled ? "transfer" : "cod");
  const [discountInput, setDiscountInput] = useState("");
  const [discount, setDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Confirmation view (cart already cleared) ─────────────────────────────
  if (confirmation) {
    return (
      <div className="max-w-xl mx-auto text-center py-10">
        <div className="mx-auto w-14 h-14 rounded-full bg-ink text-on-ink flex items-center justify-center mb-6">
          <Check className="w-6 h-6" strokeWidth={2} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink mb-2">
          Dziękujemy za zamówienie!
        </h1>
        <p className="text-sm text-ink-2 font-light mb-1">
          Numer zamówienia: <span className="font-semibold text-ink">{confirmation.orderNumber}</span>
        </p>
        <p className="text-sm text-ink-2 font-light mb-8">
          Potwierdzenie wysłaliśmy na adres <span className="font-medium text-ink">{email}</span>.
        </p>

        {confirmation.paymentMethod === "transfer" && confirmation.transfer && (
          <div className="text-left border border-rule rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-semibold tracking-wide text-ink mb-4">
              Dane do przelewu
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-ink-2/70 mb-0.5">Odbiorca</dt>
                <dd className="text-ink font-medium">{confirmation.transfer.accountOwner || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-2/70 mb-0.5">Numer konta</dt>
                <dd className="flex items-center gap-2">
                  <span className="text-ink font-medium tabular-nums">
                    {confirmation.transfer.bankAccount || "—"}
                  </span>
                  {confirmation.transfer.bankAccount && (
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          confirmation.transfer!.bankAccount.replace(/\s/g, "")
                        );
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      aria-label="Skopiuj numer konta"
                      className="p-1 text-ink-2 hover:text-ink transition-colors"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5" strokeWidth={2} />
                      ) : (
                        <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                      )}
                    </button>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-2/70 mb-0.5">Tytuł przelewu</dt>
                <dd className="text-ink font-medium">{confirmation.transfer.title}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-2/70 mb-0.5">Kwota</dt>
                <dd className="text-ink font-bold">{formatPln(parseFloat(confirmation.total))}</dd>
              </div>
            </dl>
            <p className="text-[11px] text-ink-2/70 mt-4">
              Zamówienie zrealizujemy po zaksięgowaniu wpłaty.
            </p>
          </div>
        )}

        {confirmation.paymentMethod === "cod" && (
          <div className="text-left border border-rule rounded-2xl p-6 mb-8">
            <p className="text-sm text-ink-2">
              Płatność przy odbiorze:{" "}
              <span className="font-bold text-ink">{formatPln(parseFloat(confirmation.total))}</span>{" "}
              — przygotuj gotówkę lub kartę dla kuriera.
            </p>
          </div>
        )}

        <Link
          href={`/${shopSlug}`}
          className="inline-flex items-center gap-2 bg-ink text-on-ink text-sm font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
        >
          Wróć do sklepu
        </Link>
      </div>
    );
  }

  // ── Empty cart ────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold tracking-tight text-ink mb-2">
          Koszyk jest pusty
        </h1>
        <p className="text-sm text-ink-2 font-light mb-8">
          Dodaj produkty, żeby złożyć zamówienie.
        </p>
        <Link
          href={`/${shopSlug}`}
          className="inline-flex items-center gap-2 bg-ink text-on-ink text-sm font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
        >
          Wróć do sklepu
        </Link>
      </div>
    );
  }

  // ── Type-aware flow ──────────────────────────────────────────────────────
  // Shipping, address and cash-on-delivery only make sense when the cart holds
  // a physical product. An all-digital / all-service cart skips them entirely.
  const hasPhysical = items.some((i) => (i.type ?? "physical") === "physical");
  const hasDigital = items.some((i) => i.type === "digital");
  const hasService = items.some((i) => i.type === "service");
  const codShown = codEnabled && hasPhysical;
  const effPayment: "transfer" | "cod" = payment === "cod" && !codShown ? "transfer" : payment;

  // ── Totals ────────────────────────────────────────────────────────────────
  const method = deliveryMethods.find((m) => m.id === deliveryId) ?? null;
  const freeFrom = parseFloat(freeShippingFrom);
  const shippingFree = !isNaN(freeFrom) && freeFrom > 0 && subtotal >= freeFrom;
  const shippingCost = hasPhysical && method ? (shippingFree ? 0 : parseFloat(method.price)) : 0;
  const codFeeValue = effPayment === "cod" ? parseFloat(codFee) || 0 : 0;
  const discountAmount = discount ? (subtotal * discount.percent) / 100 : 0;
  const total = subtotal - discountAmount + shippingCost + codFeeValue;

  async function applyDiscount() {
    const code = discountInput.trim().toUpperCase();
    if (!code) return;
    setCheckingCode(true);
    setDiscountError(null);
    try {
      const res = await fetch(
        `/api/shops/${shopSlug}/discounts/validate?code=${encodeURIComponent(code)}`
      );
      const data = await res.json();
      if (data.valid) {
        setDiscount({ code: data.code, percent: data.discountPercent });
        setDiscountInput("");
      } else {
        setDiscountError(data.reason ?? "Niepoprawny kod.");
      }
    } catch {
      setDiscountError("Nie udało się sprawdzić kodu.");
    } finally {
      setCheckingCode(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { email, name, phone },
          address: hasPhysical ? { street, zip, city } : null,
          items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
          deliveryMethodId: hasPhysical ? deliveryId : null,
          paymentMethod: effPayment,
          discountCode: discount?.code ?? null,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Nie udało się złożyć zamówienia. Spróbuj ponownie.");
        return;
      }
      setConfirmation(data as Confirmation);
      clear();
      window.scrollTo({ top: 0 });
    } catch {
      setError("Nie udało się złożyć zamówienia. Sprawdź połączenie i spróbuj ponownie.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link
        href={`/${shopSlug}/cart`}
        className="inline-flex items-center gap-1 text-xs tracking-wide text-ink-2/70 hover:text-ink transition-colors mb-8"
      >
        <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
        Wróć do koszyka
      </Link>

      <h1 className="text-3xl font-bold tracking-tight text-ink mb-10">Zamówienie</h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_22rem] gap-10 lg:gap-16 items-start">
        {/* ── Left: data ── */}
        <div className="space-y-10">
          {/* Contact */}
          <section>
            <h2 className="text-sm font-semibold tracking-wide text-ink mb-4">Dane kontaktowe</h2>
            <div className="space-y-4">
              <div>
                <FieldLabel htmlFor="co-email">E-mail *</FieldLabel>
                <input id="co-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="jan@przyklad.pl" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel htmlFor="co-name">Imię i nazwisko *</FieldLabel>
                  <input id="co-name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Jan Kowalski" />
                </div>
                <div>
                  <FieldLabel htmlFor="co-phone">Telefon</FieldLabel>
                  <input id="co-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="600 000 000" />
                </div>
              </div>
            </div>
          </section>

          {/* Address — physical carts only */}
          {hasPhysical && (
          <section>
            <h2 className="text-sm font-semibold tracking-wide text-ink mb-4">Adres dostawy</h2>
            <div className="space-y-4">
              <div>
                <FieldLabel htmlFor="co-street">Ulica i numer *</FieldLabel>
                <input id="co-street" required value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} placeholder="ul. Kwiatowa 7/2" />
              </div>
              <div className="grid grid-cols-[8rem_1fr] gap-4">
                <div>
                  <FieldLabel htmlFor="co-zip">Kod *</FieldLabel>
                  <input id="co-zip" required value={zip} onChange={(e) => setZip(e.target.value)} className={inputClass} placeholder="00-001" />
                </div>
                <div>
                  <FieldLabel htmlFor="co-city">Miasto *</FieldLabel>
                  <input id="co-city" required value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="Warszawa" />
                </div>
              </div>
            </div>
          </section>
          )}

          {/* Non-physical fulfillment note */}
          {!hasPhysical && (
            <section>
              <h2 className="text-sm font-semibold tracking-wide text-ink mb-4">Realizacja</h2>
              <div className="border border-rule rounded-xl p-4 text-sm text-ink-2 space-y-1.5">
                {hasDigital && (
                  <p>📩 Produkty cyfrowe dostarczymy na e-mail podany powyżej — bez wysyłki i adresu.</p>
                )}
                {hasService && (
                  <p>📞 W sprawie realizacji usługi skontaktujemy się z Tobą po złożeniu zamówienia.</p>
                )}
              </div>
            </section>
          )}

          {/* Delivery — physical carts only */}
          {hasPhysical && (
          <section>
            <h2 className="text-sm font-semibold tracking-wide text-ink mb-4">Dostawa</h2>
            <div className="space-y-2.5">
              {deliveryMethods.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-center justify-between gap-3 border rounded-xl px-4 py-3.5 cursor-pointer transition-colors ${
                    deliveryId === m.id ? "border-ink" : "border-rule hover:border-ink-2/40"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryId === m.id}
                      onChange={() => setDeliveryId(m.id)}
                      className="accent-current"
                    />
                    <span className="text-sm text-ink">{m.label}</span>
                  </span>
                  <span className="text-sm font-medium text-ink tabular-nums">
                    {shippingFree ? "0,00 zł" : formatPln(parseFloat(m.price))}
                  </span>
                </label>
              ))}
              {shippingFree && (
                <p className="text-xs text-ink-2">Twoje zamówienie kwalifikuje się do darmowej dostawy 🎉</p>
              )}
            </div>
          </section>
          )}

          {/* Payment */}
          <section>
            <h2 className="text-sm font-semibold tracking-wide text-ink mb-4">Płatność</h2>
            <div className="space-y-2.5">
              {transferEnabled && (
                <label
                  className={`flex items-center justify-between gap-3 border rounded-xl px-4 py-3.5 cursor-pointer transition-colors ${
                    effPayment === "transfer" ? "border-ink" : "border-rule hover:border-ink-2/40"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={effPayment === "transfer"}
                      onChange={() => setPayment("transfer")}
                      className="accent-current"
                    />
                    <Landmark className="w-4 h-4 text-ink-2" strokeWidth={1.5} />
                    <span className="text-sm text-ink">Przelew tradycyjny</span>
                  </span>
                  <span className="text-xs text-ink-2/70">dane po złożeniu zamówienia</span>
                </label>
              )}
              {codShown && (
                <label
                  className={`flex items-center justify-between gap-3 border rounded-xl px-4 py-3.5 cursor-pointer transition-colors ${
                    effPayment === "cod" ? "border-ink" : "border-rule hover:border-ink-2/40"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={effPayment === "cod"}
                      onChange={() => setPayment("cod")}
                      className="accent-current"
                    />
                    <HandCoins className="w-4 h-4 text-ink-2" strokeWidth={1.5} />
                    <span className="text-sm text-ink">Za pobraniem</span>
                  </span>
                  {parseFloat(codFee) > 0 && (
                    <span className="text-sm font-medium text-ink tabular-nums">
                      +{formatPln(parseFloat(codFee))}
                    </span>
                  )}
                </label>
              )}
            </div>
          </section>

          {/* Notes */}
          <section>
            <FieldLabel htmlFor="co-notes">Uwagi do zamówienia (opcjonalnie)</FieldLabel>
            <textarea
              id="co-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`${inputClass} resize-y`}
              placeholder="np. proszę zostawić u sąsiada"
            />
          </section>
        </div>

        {/* ── Right: summary ── */}
        <aside className="border border-rule rounded-2xl p-6 lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold tracking-wide text-ink mb-5">Podsumowanie</h2>

          <ul className="space-y-3 mb-5">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3 text-sm">
                <span className="text-ink-2 font-light min-w-0 truncate">
                  {i.name} <span className="text-ink-2/60">×{i.qty}</span>
                </span>
                <span className="text-ink font-medium tabular-nums shrink-0">
                  {formatPln(parseFloat(i.price) * i.qty)}
                </span>
              </li>
            ))}
          </ul>

          {/* Discount code */}
          <div className="border-t border-rule pt-4 mb-4">
            {discount ? (
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <Tag className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {discount.code} (−{discount.percent}%)
                </span>
                <button
                  type="button"
                  onClick={() => setDiscount(null)}
                  aria-label="Usuń kod rabatowy"
                  className="p-1 text-ink-2/60 hover:text-ink transition-colors"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyDiscount();
                      }
                    }}
                    placeholder="Kod rabatowy"
                    className="flex-1 min-w-0 border border-rule rounded-xl px-3 py-2 text-xs text-ink bg-paper placeholder:text-ink-2/50 outline-none focus:border-ink transition-colors uppercase"
                  />
                  <button
                    type="button"
                    onClick={applyDiscount}
                    disabled={checkingCode || !discountInput.trim()}
                    className="text-xs font-semibold px-3.5 py-2 rounded-xl border border-rule text-ink hover:border-ink transition-colors disabled:opacity-50 shrink-0"
                  >
                    {checkingCode ? "…" : "Zastosuj"}
                  </button>
                </div>
                {discountError && (
                  <p className="text-[11px] text-red-600 mt-1.5" role="alert">
                    {discountError}
                  </p>
                )}
              </>
            )}
          </div>

          <dl className="space-y-2 border-t border-rule pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-2 font-light">Produkty</dt>
              <dd className="text-ink tabular-nums">{formatPln(subtotal)}</dd>
            </div>
            {discount && (
              <div className="flex justify-between">
                <dt className="text-ink-2 font-light">Rabat {discount.code}</dt>
                <dd className="tabular-nums" style={{ color: "oklch(45% 0.16 158)" }}>
                  −{formatPln(discountAmount)}
                </dd>
              </div>
            )}
            {hasPhysical && (
              <div className="flex justify-between">
                <dt className="text-ink-2 font-light">Dostawa</dt>
                <dd className="text-ink tabular-nums">{formatPln(shippingCost)}</dd>
              </div>
            )}
            {codFeeValue > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-2 font-light">Pobranie</dt>
                <dd className="text-ink tabular-nums">{formatPln(codFeeValue)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-rule pt-3 mt-3">
              <dt className="text-ink font-semibold">Razem</dt>
              <dd className="text-ink font-bold text-lg tabular-nums">{formatPln(total)}</dd>
            </div>
          </dl>

          {error && (
            <p className="text-xs text-red-600 mt-4" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || (hasPhysical && !method) || (!transferEnabled && !codShown)}
            className="w-full mt-6 bg-accent-brand text-on-accent text-sm font-semibold px-8 py-4 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Składanie zamówienia…" : "Zamawiam i płacę"}
          </button>
          <p className="text-[10px] text-ink-2/60 text-center mt-3 leading-relaxed">
            Składając zamówienie akceptujesz regulamin sklepu.
          </p>
        </aside>
      </form>
    </div>
  );
}
