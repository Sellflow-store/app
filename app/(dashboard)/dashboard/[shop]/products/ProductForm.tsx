"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Plus, X, Package, Download, Briefcase, Sparkles } from "lucide-react";
import Link from "next/link";
import ProductImages from "@/components/admin/ProductImages";
import RichTextEditor from "@/components/admin/RichTextEditor";
import SeoFields, { EMPTY_SEO, type SeoFormValue } from "@/components/admin/SeoFields";
import { htmlIsEmpty } from "@/lib/sanitize";
import { isValidGtin, readinessGaps, readinessScore } from "@/lib/product-attributes";
import type { ImageMeta } from "@/lib/image-frame";
import { MAX_SHIPPING_DAYS, normalizeShippingTime, shippingTimeLabel } from "@/lib/shipping-time";
import { SEO_DESC_RECOMMENDED, truncateForSerp } from "@/lib/product-seo";

export interface ProductSpec {
  key: string;
  value: string;
}

export type ProductType = "physical" | "digital" | "service";
export type DigitalKind = "file" | "link" | "license";
export type ServiceMode = "online" | "onsite" | "both";

export interface ProductFormData {
  name: string;
  /** Adres w sklepie. Puste przy nowym produkcie = wyliczony z nazwy. */
  slug: string;
  category: string;
  price: string;
  oldPrice: string;
  /** true = produkt na zamówienie: bez ceny, bez koszyka, z zapytaniem mailem. */
  priceOnRequest: boolean;
  badge: string;
  visible: boolean;
  shortDesc: string;
  description: string;
  images: string[];
  /** Kadr i opis alternatywny zdjęć; klucz = adres zdjęcia. */
  imageMeta: Record<string, ImageMeta>;
  sizes: string; // rozmiary po przecinku, "" = produkt bez rozmiarów
  stock: string; // "" = nie śledzę stanu
  weight: string;  // gramy, "" = nie podano
  length: string;  // cm
  width: string;   // cm
  height: string;  // cm
  /** Czas wysyłki w dniach roboczych; oba puste = bez informacji na karcie. */
  shippingMin: string;
  shippingMax: string;
  specs: ProductSpec[];
  seo: SeoFormValue;
  // Dane dla Google i agentów AI (products.attributes)
  gtin: string;
  mpn: string;
  material: string;
  type: ProductType;
  // digital
  digitalKind: DigitalKind;
  digitalFileUrl: string;
  digitalUrl: string;
  digitalLicenseKeys: string;
  digitalInstructions: string;
  // service
  serviceDuration: string;
  serviceMode: ServiceMode;
  serviceDetails: string;
}

const EMPTY: ProductFormData = {
  name: "",
  slug: "",
  category: "",
  price: "",
  oldPrice: "",
  priceOnRequest: false,
  badge: "",
  visible: true,
  shortDesc: "",
  description: "",
  images: [],
  imageMeta: {},
  sizes: "",
  stock: "",
  weight: "",
  length: "",
  width: "",
  height: "",
  shippingMin: "",
  shippingMax: "",
  specs: [],
  seo: EMPTY_SEO,
  gtin: "",
  mpn: "",
  material: "",
  type: "physical",
  digitalKind: "file",
  digitalFileUrl: "",
  digitalUrl: "",
  digitalLicenseKeys: "",
  digitalInstructions: "",
  serviceDuration: "",
  serviceMode: "online",
  serviceDetails: "",
};

const TYPE_OPTIONS: { value: ProductType; label: string; hint: string; icon: typeof Package }[] = [
  { value: "physical", label: "Fizyczny", hint: "Wysyłka i stan magazynowy", icon: Package },
  { value: "digital", label: "Cyfrowy", hint: "Plik, link lub klucz wysyłany e-mailem", icon: Download },
  { value: "service", label: "Usługa", hint: "Realizacja bez wysyłki", icon: Briefcase },
];

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl mb-5 border border-[var(--panel-border)] bg-[var(--panel-surface)]">
      <h2
        className="px-5 h-12 flex items-center text-[15px] font-semibold border-b border-[var(--panel-border)] text-[var(--panel-ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <label htmlFor={id} className="block text-[12.5px] font-medium mb-1.5 text-[var(--panel-ink-muted)]">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  border: "1px solid var(--panel-border)",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "13.5px",
  color: "var(--panel-ink)",
  background: "var(--panel-surface)",
  fontFamily: "var(--font-body)",
  width: "100%",
  outline: "none",
};

const focusProps = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = "var(--panel-primary)"),
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = "var(--panel-border)"),
};

/** "129,99" / "129.99 zł" → "129.99"; returns null when unparseable */
function normalizePrice(raw: string): string | null {
  const cleaned = raw.replace(",", ".").replace(/[^\d.]/g, "");
  const n = parseFloat(cleaned);
  if (isNaN(n) || n < 0) return null;
  return n.toFixed(2);
}

interface Props {
  shopSlug: string;
  /** Nazwa sklepu i jego host (bez protokołu): do podglądu wyniku w Google. */
  shopName: string;
  shopHost: string;
  productId?: string;
  initial?: ProductFormData;
  /** Na platformie jest klucz do modelu AI: pokaż przycisk propozycji. */
  aiEnabled?: boolean;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function ProductForm({ shopSlug, shopName, shopHost, productId, initial, aiEnabled = false }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormData>(initial ?? EMPTY);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isEdit = !!productId;
  const listUrl = `/dashboard/${shopSlug}/products`;

  function patch(updates: Partial<ProductFormData>) {
    setForm((prev) => ({ ...prev, ...updates }));
  }

  function addSpec() {
    patch({ specs: [...form.specs, { key: "", value: "" }] });
  }

  function updateSpec(index: number, updates: Partial<ProductSpec>) {
    patch({
      specs: form.specs.map((s, i) => (i === index ? { ...s, ...updates } : s)),
    });
  }

  function removeSpec(index: number) {
    patch({ specs: form.specs.filter((_, i) => i !== index) });
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setValidationError("Podaj nazwę produktu.");
      return;
    }
    // Produkt na zamówienie nie ma ceny do sprawdzenia — API wpisze 0.00.
    const price = form.priceOnRequest ? "0.00" : normalizePrice(form.price);
    if (!price) {
      setValidationError("Podaj poprawną cenę, np. 129,99.");
      return;
    }
    const oldPrice =
      !form.priceOnRequest && form.oldPrice.trim() ? normalizePrice(form.oldPrice) : null;
    if (!form.priceOnRequest && form.oldPrice.trim() && !oldPrice) {
      setValidationError("Cena przed obniżką jest niepoprawna.");
      return;
    }

    // Stock: empty → null (nie śledzę); liczba całkowita ≥ 0 wymagana
    let stock: number | null = null;
    if (form.stock.trim() !== "") {
      const n = parseInt(form.stock.replace(/[^\d-]/g, ""), 10);
      if (isNaN(n) || n < 0) {
        setValidationError("Stan magazynowy musi być liczbą całkowitą (0 lub więcej).");
        return;
      }
      stock = n;
    }

    // Gabaryt: puste → null. Wartości muszą być dodatnie, bo trafią do wyceny
    // przesyłki — zero albo minus zablokowałoby etykietę u brokera.
    const positiveOrNull = (raw: string): number | null | "invalid" => {
      if (raw.trim() === "") return null;
      const n = parseFloat(raw.replace(",", ".").replace(/[^\d.]/g, ""));
      if (isNaN(n) || n <= 0) return "invalid";
      return Math.round(n);
    };
    const weight = positiveOrNull(form.weight);
    const dims = {
      length: positiveOrNull(form.length),
      width: positiveOrNull(form.width),
      height: positiveOrNull(form.height),
    };
    if (weight === "invalid") {
      setValidationError("Waga musi być liczbą większą od zera (w gramach).");
      return;
    }
    if (Object.values(dims).includes("invalid")) {
      setValidationError("Wymiary muszą być liczbami większymi od zera (w centymetrach).");
      return;
    }

    // Czas wysyłki: puste = brak; inaczej liczby całkowite dni roboczych.
    const shippingRaw = [form.shippingMin.trim(), form.shippingMax.trim()];
    const shippingTime =
      form.type === "physical" && (shippingRaw[0] || shippingRaw[1])
        ? normalizeShippingTime({ min: shippingRaw[0] || shippingRaw[1], max: shippingRaw[1] || shippingRaw[0] })
        : undefined;
    if (
      form.type === "physical" &&
      (shippingRaw[0] || shippingRaw[1]) &&
      (!shippingTime || shippingRaw.some((v) => v && !/^\d{1,2}$/.test(v)))
    ) {
      setValidationError(`Czas wysyłki: podaj liczbę dni roboczych od 0 do ${MAX_SHIPPING_DAYS}.`);
      return;
    }

    setValidationError(null);
    setSaveState("saving");

    // Type-specific fulfillment payload; only the active type contributes.
    let fulfillment: Record<string, unknown> = {};
    if (form.type === "digital") {
      fulfillment = {
        kind: form.digitalKind,
        fileUrl: form.digitalKind === "file" ? form.digitalFileUrl.trim() : undefined,
        url: form.digitalKind === "link" ? form.digitalUrl.trim() : undefined,
        licenseKeys: form.digitalKind === "license" ? form.digitalLicenseKeys.trim() : undefined,
        instructions: form.digitalInstructions.trim() || undefined,
      };
    } else if (form.type === "service") {
      fulfillment = {
        duration: form.serviceDuration.trim() || undefined,
        mode: form.serviceMode,
        details: form.serviceDetails.trim() || undefined,
      };
    }

    const gtin = form.gtin.replace(/\s/g, "");
    if (gtin && !isValidGtin(gtin)) {
      setValidationError("Niepoprawny EAN. Sprawdź, czy to 8, 12, 13 lub 14 cyfr z kodu kreskowego.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      // Puste pole przy edycji = zostaw dotychczasowy adres nietknięty.
      slug: form.slug.trim() || undefined,
      // Puste pole = wyczyść (null). undefined zniknęłoby z JSON-a i API
      // zostawiłoby starą wartość: skasowany badge „Promocja” wracał po zapisie.
      category: form.category.trim() || null,
      price,
      oldPrice,
      priceOnRequest: form.priceOnRequest,
      badge: form.badge.trim() || null,
      visible: form.visible,
      shortDesc: form.shortDesc.trim() || null,
      description: htmlIsEmpty(form.description) ? null : form.description,
      images: form.images,
      sizes: parseSizes(form.sizes),
      // Stock only applies to physical products; others are unlimited.
      stock: form.type === "physical" ? stock : null,
      // Gabaryt dotyczy tylko wysyłki — produkty cyfrowe i usługi go nie mają.
      weightGrams: form.type === "physical" ? (weight as number | null) : null,
      dimensions:
        form.type === "physical"
          ? {
              length: dims.length as number | null,
              width: dims.width as number | null,
              height: dims.height as number | null,
            }
          : {},
      specs: form.specs
        .map((s) => ({ key: s.key.trim(), value: s.value.trim() }))
        .filter((s) => s.key || s.value),
      type: form.type,
      fulfillment,
      attributes: {
        gtin: form.gtin.replace(/\s/g, "") || undefined,
        mpn: form.mpn.trim() || undefined,
        material: form.material.trim() || undefined,
        imageMeta: form.imageMeta,
        shippingTime,
        seo: {
          title: form.seo.title,
          description: form.seo.description,
          focus: form.seo.focus,
          phrases: form.seo.phrases,
        },
      },
    };

    try {
      const res = await fetch(
        isEdit
          ? `/api/shops/${shopSlug}/products/${productId}`
          : `/api/shops/${shopSlug}/products`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.error) setValidationError(data.error);
        setSaveState("error");
        setTimeout(() => setSaveState("idle"), 2500);
        return;
      }
      setSaveState("saved");
      router.push(listUrl);
      router.refresh();
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2500);
    }
  }

  async function handleDelete() {
    if (!isEdit) return;
    if (!confirm(`Usunąć produkt „${form.name}”? Tej operacji nie można cofnąć.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/products/${productId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push(listUrl);
        router.refresh();
        return;
      }
    } catch {
      // fall through to reset
    }
    setDeleting(false);
  }

  const buttonLabel =
    saveState === "saving" ? "Zapisywanie…"
    : saveState === "saved" ? "Zapisano"
    : saveState === "error" ? "Błąd, spróbuj ponownie"
    : isEdit ? "Zapisz zmiany" : "Dodaj produkt";

  const buttonBg =
    saveState === "saved" ? "var(--panel-success-strong)"
    : saveState === "error" ? "var(--panel-danger-strong)"
    : "var(--panel-accent)";

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto">
      <Link
        href={listUrl}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-3 text-[var(--panel-ink-muted)] hover:text-[var(--panel-ink)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Produkty
      </Link>

      {/* Header — przyklejony przy przewijaniu, żeby „Zapisz” był zawsze pod ręką */}
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-5 flex items-center justify-between gap-4 bg-[var(--panel-bg)] border-b border-[var(--panel-border)]">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold truncate text-[var(--panel-ink)]" style={{ fontFamily: "var(--font-display)" }}>
            {isEdit ? form.name || "Edytuj produkt" : "Nowy produkt"}
          </h1>
          <p className="text-[13px] mt-0.5 text-[var(--panel-ink-muted)]">
            {isEdit ? "Edycja produktu" : "Uzupełnij dane i zapisz"}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saveState === "saving"}
          className="flex items-center gap-2 h-9 px-3.5 rounded-lg text-[13px] font-semibold shrink-0 transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: buttonBg, color: "#fff" }}
        >
          <Save className="w-4 h-4" strokeWidth={2} />
          {buttonLabel}
        </button>
      </div>

      {validationError && (
        <div
          className="rounded-xl px-4 py-3 mb-5 text-xs font-medium"
          style={{ background: "var(--panel-danger-soft)", color: "var(--panel-danger-ink)", border: "1px solid var(--panel-danger-border)" }}
        >
          {validationError}
        </div>
      )}

      {/* Product type */}
      <SectionCard title="Typ produktu">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TYPE_OPTIONS.map((opt) => {
            const active = form.type === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => patch({ type: opt.value })}
                className="flex flex-col items-start gap-1.5 rounded-xl p-3.5 text-left transition-all"
                style={{
                  border: active ? "1.5px solid var(--panel-primary)" : "1.5px solid var(--panel-border)",
                  background: active ? "var(--panel-primary-soft)" : "var(--panel-surface)",
                }}
              >
                <Icon
                  className="w-5 h-5"
                  style={{ color: active ? "var(--panel-primary)" : "var(--panel-ink-muted)" }}
                  strokeWidth={1.75}
                />
                <span className="text-sm font-semibold" style={{ color: active ? "var(--panel-primary)" : "var(--panel-ink)" }}>
                  {opt.label}
                </span>
                <span className="text-[11px] leading-tight" style={{ color: "var(--panel-ink-muted)" }}>
                  {opt.hint}
                </span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Basic info */}
      <SectionCard title="Podstawowe informacje">
        <Field label="Nazwa produktu" id="p-name">
          <input
            id="p-name"
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="np. Koszulka oversize Classic"
            style={inputStyle}
            {...focusProps}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Field label="Kategoria" id="p-category">
            <input
              id="p-category"
              value={form.category}
              onChange={(e) => patch({ category: e.target.value })}
              placeholder="np. Koszulki"
              style={inputStyle}
              {...focusProps}
            />
          </Field>
          <Field label="Etykieta (badge)" id="p-badge">
            <input
              id="p-badge"
              value={form.badge}
              onChange={(e) => patch({ badge: e.target.value })}
              placeholder="np. Nowość, Bestseller"
              style={inputStyle}
              {...focusProps}
            />
          </Field>
        </div>
        <Field label="Adres produktu (URL)" id="p-slug">
          <input
            id="p-slug"
            value={form.slug}
            onChange={(e) => patch({ slug: e.target.value })}
            placeholder={isEdit ? "" : "wyliczy się z nazwy"}
            style={inputStyle}
            {...focusProps}
          />
          <p className="text-[11px] mt-1.5" style={{ color: "var(--panel-ink-faint)" }}>
            {isEdit
              ? "Zmieniaj tylko świadomie. Stary adres przestanie być tym właściwym, a linki i pozycja w Google prowadzą pod niego. Zmiana nazwy produktu adresu nie rusza."
              : "Zostaw puste, a adres powstanie z nazwy produktu."}
          </p>
        </Field>

        <Field label="Rozmiary (po przecinku)" id="p-sizes">
          <input
            id="p-sizes"
            value={form.sizes}
            onChange={(e) => patch({ sizes: e.target.value })}
            placeholder="S/M, M/L, L/XL"
            style={inputStyle}
            {...focusProps}
          />
          <p className="text-[11px] mt-1.5" style={{ color: "var(--panel-ink-faint)" }}>
            Zostaw puste, jeśli produkt nie ma rozmiarów. Gdy są, klient musi wybrać
            rozmiar, zanim doda produkt do koszyka.
          </p>
        </Field>

        <Field label="Krótki opis (na liście produktów)" id="p-short">
          <input
            id="p-short"
            value={form.shortDesc}
            onChange={(e) => patch({ shortDesc: e.target.value })}
            placeholder="Jedno zdanie zachęcające do kliknięcia"
            style={inputStyle}
            {...focusProps}
          />
        </Field>
        <Field label="Pełny opis" id="p-desc">
          <RichTextEditor
            value={form.description}
            onChange={(html) => patch({ description: html })}
            placeholder="Materiały, wymiary, pielęgnacja…"
          />
        </Field>
      </SectionCard>

      {/* Pricing */}
      <SectionCard title="Cena">
        <label className="flex items-center gap-2.5 cursor-pointer w-fit mb-1">
          <div
            className="relative w-9 h-5 rounded-full transition-all shrink-0"
            style={{ background: form.priceOnRequest ? "var(--panel-primary)" : "var(--panel-border-strong)" }}
            onClick={() => patch({ priceOnRequest: !form.priceOnRequest })}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: form.priceOnRequest ? "1.125rem" : "0.125rem" }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--panel-ink)" }}>
            Produkt na zamówienie (bez ceny)
          </span>
        </label>
        <p className="text-[11px] mb-1" style={{ color: "var(--panel-ink-faint)" }}>
          Zamiast ceny klient zobaczy &bdquo;Produkt na zamówienie&rdquo; i przycisk, który
          otwiera wiadomość do Ciebie. Takiego produktu nie da się dodać do koszyka.
        </p>

        {!form.priceOnRequest && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cena (zł)" id="p-price">
            <input
              id="p-price"
              value={form.price}
              onChange={(e) => patch({ price: e.target.value })}
              placeholder="129,99"
              inputMode="decimal"
              style={inputStyle}
              {...focusProps}
            />
          </Field>
          <Field label="Cena przed obniżką (opcjonalnie)" id="p-old-price">
            <input
              id="p-old-price"
              value={form.oldPrice}
              onChange={(e) => patch({ oldPrice: e.target.value })}
              placeholder="159,99"
              inputMode="decimal"
              style={inputStyle}
              {...focusProps}
            />
          </Field>
        </div>
        )}
        {!form.priceOnRequest && (
          <p className="text-[11px]" style={{ color: "var(--panel-ink-faint)" }}>
            Po podaniu ceny przed obniżką klient zobaczy ją przekreśloną obok aktualnej.
          </p>
        )}
      </SectionCard>

      {/* Digital delivery */}
      {form.type === "digital" && (
        <SectionCard title="Dostarczanie cyfrowe">
          <Field label="Sposób dostarczenia" id="p-dkind">
            <div className="grid grid-cols-3 gap-2">
              {([
                { v: "file", l: "Plik" },
                { v: "link", l: "Link" },
                { v: "license", l: "Klucz licencyjny" },
              ] as { v: DigitalKind; l: string }[]).map((k) => {
                const active = form.digitalKind === k.v;
                return (
                  <button
                    key={k.v}
                    type="button"
                    onClick={() => patch({ digitalKind: k.v })}
                    className="rounded-lg py-2 text-xs font-semibold transition-all"
                    style={{
                      border: active ? "1.5px solid var(--panel-primary)" : "1.5px solid var(--panel-border)",
                      background: active ? "var(--panel-primary-soft)" : "var(--panel-surface)",
                      color: active ? "var(--panel-primary)" : "var(--panel-ink)",
                    }}
                  >
                    {k.l}
                  </button>
                );
              })}
            </div>
          </Field>

          {form.digitalKind === "file" && (
            <Field label="Adres pliku (URL)" id="p-dfile">
              <input
                id="p-dfile"
                value={form.digitalFileUrl}
                onChange={(e) => patch({ digitalFileUrl: e.target.value })}
                placeholder="https://…/ebook.pdf"
                style={inputStyle}
                {...focusProps}
              />
            </Field>
          )}
          {form.digitalKind === "link" && (
            <Field label="Link do dostępu / produktu" id="p-durl">
              <input
                id="p-durl"
                value={form.digitalUrl}
                onChange={(e) => patch({ digitalUrl: e.target.value })}
                placeholder="https://…"
                style={inputStyle}
                {...focusProps}
              />
            </Field>
          )}
          {form.digitalKind === "license" && (
            <Field label="Klucze licencyjne (jeden na linię)" id="p-dlic">
              <textarea
                id="p-dlic"
                value={form.digitalLicenseKeys}
                onChange={(e) => patch({ digitalLicenseKeys: e.target.value })}
                rows={4}
                placeholder={"XXXX-YYYY-ZZZZ\nAAAA-BBBB-CCCC"}
                style={{ ...inputStyle, resize: "vertical" }}
                {...focusProps}
              />
            </Field>
          )}

          <Field label="Instrukcja dla klienta (opcjonalnie)" id="p-dinstr">
            <textarea
              id="p-dinstr"
              value={form.digitalInstructions}
              onChange={(e) => patch({ digitalInstructions: e.target.value })}
              rows={3}
              placeholder="Np. jak pobrać plik, jak aktywować klucz…"
              style={{ ...inputStyle, resize: "vertical" }}
              {...focusProps}
            />
          </Field>
          <p className="text-[11px]" style={{ color: "var(--panel-ink-faint)" }}>
            Produkt cyfrowy nie wymaga wysyłki ani adresu, klient otrzyma dostęp e-mailem.
          </p>
        </SectionCard>
      )}

      {/* Service details */}
      {form.type === "service" && (
        <SectionCard title="Szczegóły usługi">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Field label="Czas trwania" id="p-sdur">
              <input
                id="p-sdur"
                value={form.serviceDuration}
                onChange={(e) => patch({ serviceDuration: e.target.value })}
                placeholder="np. 60 min"
                style={inputStyle}
                {...focusProps}
              />
            </Field>
            <Field label="Forma realizacji" id="p-smode">
              <select
                id="p-smode"
                value={form.serviceMode}
                onChange={(e) => patch({ serviceMode: e.target.value as ServiceMode })}
                style={inputStyle}
              >
                <option value="online">Online</option>
                <option value="onsite">Stacjonarnie</option>
                <option value="both">Online lub stacjonarnie</option>
              </select>
            </Field>
          </div>
          <Field label="Opis realizacji (opcjonalnie)" id="p-sdet">
            <textarea
              id="p-sdet"
              value={form.serviceDetails}
              onChange={(e) => patch({ serviceDetails: e.target.value })}
              rows={3}
              placeholder="Jak przebiega usługa, co klient dostaje, jak się umawiacie…"
              style={{ ...inputStyle, resize: "vertical" }}
              {...focusProps}
            />
          </Field>
          <p className="text-[11px]" style={{ color: "var(--panel-ink-faint)" }}>
            Usługa nie wymaga wysyłki ani adresu, po zamówieniu skontaktujesz się z klientem
            w sprawie realizacji.
          </p>
        </SectionCard>
      )}

      <AgentDataCard form={form} patch={patch} shopSlug={shopSlug} aiEnabled={aiEnabled} />

      {/* Parameters (specs) */}
      <SectionCard title="Parametry">
        {form.specs.length > 0 && (
          <div className="space-y-2 mb-3">
            {form.specs.map((spec, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  value={spec.key}
                  onChange={(e) => updateSpec(i, { key: e.target.value })}
                  placeholder="Nazwa, np. Materiał"
                  style={{ ...inputStyle, flex: "0 0 40%", width: "auto" }}
                  {...focusProps}
                />
                <input
                  value={spec.value}
                  onChange={(e) => updateSpec(i, { value: e.target.value })}
                  placeholder="Wartość, np. 100% bawełna"
                  style={{ ...inputStyle, flex: 1, width: "auto" }}
                  {...focusProps}
                />
                <button
                  onClick={() => removeSpec(i)}
                  aria-label="Usuń parametr"
                  className="shrink-0 p-2 rounded-lg transition-colors"
                  style={{ color: "var(--panel-ink-muted)", border: "1.5px solid var(--panel-border)" }}
                >
                  <X className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}
        {form.specs.length === 0 && (
          <p className="text-[11px] mb-3" style={{ color: "var(--panel-ink-faint)" }}>
            Dodaj dowolne parametry (np. Materiał, Waga, Pojemność), pokażą się jako
            tabela „Specyfikacja" na stronie produktu.
          </p>
        )}
        <button
          onClick={addSpec}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
          style={{ border: "1.5px solid var(--panel-border-strong)", color: "var(--panel-ink)", background: "var(--panel-surface-2)" }}
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
          Dodaj parametr
        </button>
      </SectionCard>

      {/* Images */}
      <SectionCard title="Zdjęcia">
        <ProductImages
          images={form.images}
          imageMeta={form.imageMeta}
          productName={form.name}
          onChange={({ images, imageMeta }) => patch({ images, imageMeta })}
        />
      </SectionCard>

      {/* Stock — physical only */}
      {form.type === "physical" && (
      <SectionCard title="Stan magazynowy">
        <Field label="Liczba sztuk na stanie" id="p-stock">
          <input
            id="p-stock"
            value={form.stock}
            onChange={(e) => patch({ stock: e.target.value })}
            placeholder="np. 25"
            inputMode="numeric"
            style={{ ...inputStyle, maxWidth: "12rem" }}
            {...focusProps}
          />
        </Field>
        <p className="text-[11px]" style={{ color: "var(--panel-ink-faint)" }}>
          Zostaw puste, jeśli nie chcesz śledzić stanu, produkt będzie zawsze dostępny.
          Przy <strong>0</strong> klient zobaczy „Wyprzedane" i nie doda produktu do koszyka.
          Stan zmniejsza się automatycznie po każdym zamówieniu.
        </p>
      </SectionCard>
      )}

      {/* Shipping dimensions — physical only */}
      {form.type === "physical" && (
      <SectionCard title="Gabaryt przesyłki">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Waga (g)" id="p-weight">
            <input
              id="p-weight"
              value={form.weight}
              onChange={(e) => patch({ weight: e.target.value })}
              placeholder="np. 500"
              inputMode="numeric"
              style={inputStyle}
              {...focusProps}
            />
          </Field>
          <Field label="Długość (cm)" id="p-length">
            <input
              id="p-length"
              value={form.length}
              onChange={(e) => patch({ length: e.target.value })}
              placeholder="np. 30"
              inputMode="numeric"
              style={inputStyle}
              {...focusProps}
            />
          </Field>
          <Field label="Szerokość (cm)" id="p-width">
            <input
              id="p-width"
              value={form.width}
              onChange={(e) => patch({ width: e.target.value })}
              placeholder="np. 20"
              inputMode="numeric"
              style={inputStyle}
              {...focusProps}
            />
          </Field>
          <Field label="Wysokość (cm)" id="p-height">
            <input
              id="p-height"
              value={form.height}
              onChange={(e) => patch({ height: e.target.value })}
              placeholder="np. 10"
              inputMode="numeric"
              style={inputStyle}
              {...focusProps}
            />
          </Field>
        </div>
        <p className="text-[11px]" style={{ color: "var(--panel-ink-faint)" }}>
          Potrzebne, żeby policzyć koszt wysyłki i wygenerować etykietę kurierską.
          Możesz zostawić puste i uzupełnić później, bez tego trzeba będzie nadawać paczki ręcznie.
        </p>
      </SectionCard>
      )}

      {/* Shipping time — physical only */}
      {form.type === "physical" && <ShippingTimeCard form={form} patch={patch} />}

      {/* SEO */}
      <SectionCard title="SEO: wyniki w Google">
        <SeoFields
          value={form.seo}
          onChange={(seo) => patch({ seo: { ...form.seo, ...seo } })}
          displayUrl={`${shopHost} › produkty › ${form.slug.trim() || "adres-produktu"}`}
          defaultTitle={`${form.name.trim() || "Nazwa produktu"} — ${shopName}`}
          defaultDescription={
            form.shortDesc.trim() ||
            truncateForSerp(plainText(form.description), SEO_DESC_RECOMMENDED)
          }
          subject="produktu"
          context={{
            name: form.name,
            slug: form.slug.trim() || undefined,
            body: `${form.shortDesc} ${plainText(form.description)}`,
            imageCount: form.images.length,
            imagesWithAlt: form.images.filter((u) => form.imageMeta[u]?.alt).length,
          }}
        />
      </SectionCard>

      {/* Visibility */}
      <SectionCard title="Widoczność">
        <label className="flex items-center gap-2.5 cursor-pointer w-fit">
          <div
            className="relative w-9 h-5 rounded-full transition-all"
            style={{ background: form.visible ? "var(--panel-primary)" : "var(--panel-border-strong)" }}
            onClick={() => patch({ visible: !form.visible })}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: form.visible ? "1.125rem" : "0.125rem" }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--panel-ink)" }}>
            {form.visible ? "Produkt widoczny w sklepie" : "Produkt ukryty"}
          </span>
        </label>
      </SectionCard>

      {/* Danger zone */}
      {isEdit && (
        <div className="mt-8 pt-5" style={{ borderTop: "1px solid var(--panel-border)" }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-all disabled:opacity-60"
            style={{ color: "var(--panel-danger-ink)", border: "1.5px solid var(--panel-danger-border)" }}
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            {deleting ? "Usuwanie…" : "Usuń produkt"}
          </button>
        </div>
      )}
    </div>
  );
}

/** Treść z edytora jako zwykły tekst: do podglądu opisu w Google i listy kontrolnej SEO. */
function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

const SHIPPING_PRESETS: { label: string; min: string; max: string }[] = [
  { label: "W dniu zamówienia", min: "0", max: "0" },
  { label: "1 dzień", min: "1", max: "1" },
  { label: "1–2 dni", min: "1", max: "2" },
  { label: "3–5 dni", min: "3", max: "5" },
  { label: "7–14 dni", min: "7", max: "14" },
];

/** Czas wysyłki produktu: pokazuje się klientowi na karcie produktu. */
function ShippingTimeCard({
  form,
  patch,
}: {
  form: ProductFormData;
  patch: (u: Partial<ProductFormData>) => void;
}) {
  const parsed = normalizeShippingTime({
    min: form.shippingMin.trim() || form.shippingMax.trim(),
    max: form.shippingMax.trim() || form.shippingMin.trim(),
  });
  const set = form.shippingMin.trim() !== "" || form.shippingMax.trim() !== "";
  return (
    <SectionCard title="Czas wysyłki">
      <div className="flex flex-wrap gap-2 mb-4">
        {SHIPPING_PRESETS.map((p) => {
          const active = form.shippingMin === p.min && form.shippingMax === p.max;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => patch({ shippingMin: p.min, shippingMax: p.max })}
              aria-pressed={active}
              className="h-8 px-3 rounded-full text-[12.5px] font-medium transition-colors"
              style={{
                border: active ? "1.5px solid var(--panel-primary)" : "1.5px solid var(--panel-border)",
                background: active ? "var(--panel-primary-soft)" : "var(--panel-surface)",
                color: active ? "var(--panel-primary)" : "var(--panel-ink)",
              }}
            >
              {p.label}
            </button>
          );
        })}
        {set && (
          <button
            type="button"
            onClick={() => patch({ shippingMin: "", shippingMax: "" })}
            className="h-8 px-3 rounded-full text-[12.5px] font-medium text-[var(--panel-ink-muted)] hover:text-[var(--panel-ink)]"
          >
            Wyczyść
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-xs">
        <Field label="Od (dni robocze)" id="p-ship-min">
          <input
            id="p-ship-min"
            value={form.shippingMin}
            onChange={(e) => patch({ shippingMin: e.target.value })}
            placeholder="np. 1"
            inputMode="numeric"
            style={inputStyle}
            {...focusProps}
          />
        </Field>
        <Field label="Do (dni robocze)" id="p-ship-max">
          <input
            id="p-ship-max"
            value={form.shippingMax}
            onChange={(e) => patch({ shippingMax: e.target.value })}
            placeholder="np. 2"
            inputMode="numeric"
            style={inputStyle}
            {...focusProps}
          />
        </Field>
      </div>

      <p className="text-[11px] mt-3" style={{ color: "var(--panel-ink-faint)" }}>
        {parsed ? (
          <>
            Klient zobaczy na karcie produktu: <strong>{shippingTimeLabel(parsed)}</strong>. Ta sama informacja trafia
            do Google (feed i dane strukturalne) w miejsce domyślnego czasu realizacji sklepu.
          </>
        ) : (
          <>
            To czas od zamówienia do nadania paczki, bez czasu przewozu (ten ustawiasz przy metodzie dostawy).
            Zostaw puste, jeśli nie chcesz podawać go przy tym produkcie. Wpisz jedną liczbę, jeśli czas jest stały.
          </>
        )}
      </p>
    </SectionCard>
  );
}

/** "S/M, M/L,, S/M " → ["S/M","M/L"] — bez pustych i bez duplikatów. */
function parseSizes(raw: string): string[] {
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const size = part.trim();
    if (size && size.length <= 24 && !out.includes(size)) out.push(size);
  }
  return out;
}

/**
 * Pola, po których filtrują Google i asystenci AI, razem z oceną kompletności
 * produktu. Ocena liczy się na żywo z formularza, więc sprzedawca widzi, co
 * zmienia każde uzupełnione pole.
 */
interface Suggestion {
  material: string;
  category: string;
  shortDesc: string;
}

function AgentDataCard({
  form,
  patch,
  shopSlug,
  aiEnabled,
}: {
  form: ProductFormData;
  patch: (u: Partial<ProductFormData>) => void;
  shopSlug: string;
  aiEnabled: boolean;
}) {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  async function ask() {
    setAsking(true);
    setAskError(null);
    setSuggestion(null);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/products/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          shortDesc: form.shortDesc,
          category: form.category,
          image: form.images[0] ?? null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setAskError(data?.error ?? "Nie udało się przygotować propozycji.");
        return;
      }
      setSuggestion(data as Suggestion);
    } catch {
      setAskError("Brak połączenia. Spróbuj ponownie.");
    } finally {
      setAsking(false);
    }
  }

  // Tylko pola, w których propozycja coś wnosi względem tego, co już jest.
  const rows = suggestion
    ? ([
        ["material", "Materiał", suggestion.material, form.material],
        ["category", "Kategoria", suggestion.category, form.category],
        ["shortDesc", "Krótki opis", suggestion.shortDesc, form.shortDesc],
      ] as const).filter(([key, , value, current]) => value && value !== current && (key !== "material" || form.type === "physical"))
    : [];

  const input = {
    type: form.type,
    priceOnRequest: form.priceOnRequest,
    images: form.images,
    shortDesc: form.shortDesc,
    description: form.description,
    category: form.category,
    weightGrams: form.weight ? Number(form.weight) : null,
    attributes: {
      gtin: form.gtin.trim() || undefined,
      mpn: form.mpn.trim() || undefined,
      material: form.material.trim() || undefined,
    },
  };
  const score = readinessScore(input);
  const gaps = readinessGaps(input);
  const tone = score >= 85 ? "var(--panel-success)" : score >= 60 ? "var(--panel-warning)" : "var(--panel-danger)";
  const gtinInvalid = form.gtin.trim() !== "" && !isValidGtin(form.gtin.replace(/\s/g, ""));

  return (
    <SectionCard title="Dane dla Google i AI">
      <div className="flex items-start gap-4 mb-5 p-3.5 rounded-lg bg-[var(--panel-surface-2)]">
        <div className="shrink-0 text-center">
          <p className="text-[22px] font-semibold tabular-nums leading-none" style={{ color: tone, fontFamily: "var(--font-display)" }}>
            {score}%
          </p>
          <p className="text-[11px] mt-1 text-[var(--panel-ink-muted)]">gotowości</p>
        </div>
        <div className="flex-1 min-w-0">
          {gaps.length === 0 ? (
            <p className="text-[13px] text-[var(--panel-ink)]">
              Komplet. Produkt ma wszystko, czego potrzebują Google i asystenci AI, żeby go polecić.
            </p>
          ) : (
            <>
              <p className="text-[12.5px] font-medium mb-1 text-[var(--panel-ink)]">Uzupełnij, żeby AI mogło polecić ten produkt:</p>
              <ul className="space-y-0.5">
                {gaps.slice(0, 4).map((g) => (
                  <li key={g.key} className="text-[12px] text-[var(--panel-ink-muted)]">
                    <span className="font-medium text-[var(--panel-ink)]">{g.label}</span>: {g.why}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Asystent AI: bez klucza API na platformie przycisk jest widoczny,
          ale wyszarzony z oznaczeniem „wkrótce”, żeby sprzedawca wiedział,
          że ta pomoc nadchodzi. */}
      {(
        <div className="mb-5">
          <button
            type="button"
            onClick={aiEnabled ? ask : undefined}
            disabled={!aiEnabled || asking || !form.name.trim()}
            aria-disabled={!aiEnabled}
            title={aiEnabled ? undefined : "Asystent AI będzie dostępny wkrótce"}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg text-[13px] font-semibold border border-[var(--panel-border-strong)] text-[var(--panel-ink)] hover:bg-[var(--panel-surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[var(--panel-primary)]" strokeWidth={1.75} />
            {asking ? "Analizuję opis i zdjęcie…" : "Zaproponuj z AI"}
            {!aiEnabled && (
              <span className="ml-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] px-1.5 py-px rounded-md bg-[var(--panel-surface-2)] text-[var(--panel-ink-muted)] border border-[var(--panel-border)]">
                wkrótce
              </span>
            )}
          </button>
          <p className="text-[11px] mt-1.5 text-[var(--panel-ink-faint)]">
            {aiEnabled
              ? "AI czyta nazwę, opis i pierwsze zdjęcie. Nic nie zmieni się bez Twojego kliknięcia."
              : "Wkrótce AI zaproponuje materiał, kategorię i krótki opis na podstawie opisu i zdjęcia."}
          </p>
          {askError && <p className="text-[12px] mt-2 text-[var(--panel-danger-ink)]">{askError}</p>}
          {suggestion && rows.length === 0 && (
            <p className="text-[12px] mt-2 text-[var(--panel-ink-muted)]">AI nie ma nic do dodania: pola są już uzupełnione.</p>
          )}
          {rows.length > 0 && (
            <div className="mt-3 rounded-lg border border-[var(--panel-border)] divide-y divide-[var(--panel-border)]">
              {rows.map(([key, label, value]) => (
                <div key={key} className="flex items-start gap-3 px-3.5 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11.5px] font-medium text-[var(--panel-ink-muted)]">{label}</p>
                    <p className="text-[13px] text-[var(--panel-ink)]">{value}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => patch({ [key]: value } as Partial<ProductFormData>)}
                    className="shrink-0 text-[12.5px] font-semibold px-2.5 h-8 rounded-md text-[var(--panel-primary)] hover:bg-[var(--panel-primary-soft)]"
                  >
                    Użyj
                  </button>
                </div>
              ))}
              {rows.length > 1 && (
                <div className="px-3.5 py-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => patch(Object.fromEntries(rows.map(([k, , v]) => [k, v])) as Partial<ProductFormData>)}
                    className="text-[12.5px] font-semibold px-2.5 h-8 rounded-md text-[var(--panel-primary)] hover:bg-[var(--panel-primary-soft)]"
                  >
                    Użyj wszystkich
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {form.type === "physical" && (
        <>
          <Field label="Materiał / skład" id="pf-material">
            <input
              id="pf-material"
              value={form.material}
              onChange={(e) => patch({ material: e.target.value })}
              placeholder="np. 100% jedwab, len 70% i bawełna 30%"
              style={inputStyle}
              {...focusProps}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Field label="EAN (kod kreskowy)" id="pf-gtin">
              <input
                id="pf-gtin"
                value={form.gtin}
                onChange={(e) => patch({ gtin: e.target.value })}
                placeholder="np. 5901234123457"
                inputMode="numeric"
                style={{ ...inputStyle, borderColor: gtinInvalid ? "var(--panel-danger)" : undefined }}
                {...focusProps}
              />
              {gtinInvalid && (
                <p className="text-[11px] mt-1 text-[var(--panel-danger-ink)]">Ten numer nie przechodzi kontroli EAN.</p>
              )}
            </Field>
            <Field label="Kod producenta (MPN)" id="pf-mpn">
              <input
                id="pf-mpn"
                value={form.mpn}
                onChange={(e) => patch({ mpn: e.target.value })}
                placeholder="gdy produkt nie ma EAN"
                style={inputStyle}
                {...focusProps}
              />
            </Field>
          </div>
          <p className="text-[11px] text-[var(--panel-ink-faint)]">
            Wyroby własne i rękodzieło zwykle nie mają EAN. Wtedy zostaw oba pola puste, a sklep zgłosi to Google poprawnie.
          </p>
        </>
      )}
    </SectionCard>
  );
}
