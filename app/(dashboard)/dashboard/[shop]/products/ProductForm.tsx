"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Plus, X, ImageIcon } from "lucide-react";
import Link from "next/link";
import ImageUpload from "@/components/admin/ImageUpload";

export interface ProductFormData {
  name: string;
  category: string;
  price: string;
  oldPrice: string;
  badge: string;
  visible: boolean;
  shortDesc: string;
  description: string;
  images: string[];
}

const EMPTY: ProductFormData = {
  name: "",
  category: "",
  price: "",
  oldPrice: "",
  badge: "",
  visible: true,
  shortDesc: "",
  description: "",
  images: [],
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5 mb-5"
      style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}
    >
      <h2
        className="text-sm font-semibold mb-4"
        style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-xs font-semibold mb-1.5" style={{ color: "oklch(30% 0 0)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  border: "1.5px solid oklch(88% 0 0)",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "13px",
  color: "oklch(11% 0.10 275)",
  background: "#fff",
  fontFamily: "var(--font-body)",
  width: "100%",
  outline: "none",
};

const focusProps = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = "oklch(22% 0.24 270)"),
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = "oklch(88% 0 0)"),
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
  productId?: string;
  initial?: ProductFormData;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function ProductForm({ shopSlug, productId, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormData>(initial ?? EMPTY);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isEdit = !!productId;
  const listUrl = `/dashboard/${shopSlug}/products`;

  function patch(updates: Partial<ProductFormData>) {
    setForm((prev) => ({ ...prev, ...updates }));
  }

  function addImage() {
    const url = newImageUrl.trim();
    if (!url) return;
    patch({ images: [...form.images, url] });
    setNewImageUrl("");
  }

  function removeImage(index: number) {
    patch({ images: form.images.filter((_, i) => i !== index) });
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setValidationError("Podaj nazwę produktu.");
      return;
    }
    const price = normalizePrice(form.price);
    if (!price) {
      setValidationError("Podaj poprawną cenę, np. 129,99.");
      return;
    }
    const oldPrice = form.oldPrice.trim() ? normalizePrice(form.oldPrice) : null;
    if (form.oldPrice.trim() && !oldPrice) {
      setValidationError("Cena przed obniżką jest niepoprawna.");
      return;
    }

    setValidationError(null);
    setSaveState("saving");

    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || undefined,
      price,
      oldPrice,
      badge: form.badge.trim() || undefined,
      visible: form.visible,
      shortDesc: form.shortDesc.trim() || undefined,
      description: form.description.trim() || undefined,
      images: form.images,
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
    : saveState === "saved" ? "Zapisano!"
    : saveState === "error" ? "Błąd — spróbuj ponownie"
    : isEdit ? "Zapisz zmiany" : "Dodaj produkt";

  const buttonBg =
    saveState === "saved" ? "oklch(52% 0.20 158)"
    : saveState === "error" ? "oklch(50% 0.20 20)"
    : "oklch(56% 0.30 335)";

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={listUrl}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "oklch(45% 0 0)", border: "1px solid oklch(88% 0 0)" }}
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          </Link>
          <div>
            <h1
              className="text-xl font-bold"
              style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
            >
              {isEdit ? "Edytuj produkt" : "Nowy produkt"}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
              {isEdit ? form.name : "Uzupełnij dane i zapisz"}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saveState === "saving"}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full transition-all disabled:opacity-60"
          style={{ background: buttonBg, color: "#fff" }}
        >
          <Save className="w-3.5 h-3.5" strokeWidth={2} />
          {buttonLabel}
        </button>
      </div>

      {validationError && (
        <div
          className="rounded-xl px-4 py-3 mb-5 text-xs font-medium"
          style={{ background: "oklch(50% 0.20 20 / 0.08)", color: "oklch(40% 0.18 20)", border: "1px solid oklch(50% 0.20 20 / 0.25)" }}
        >
          {validationError}
        </div>
      )}

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
          <textarea
            id="p-desc"
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            rows={5}
            placeholder="Materiały, wymiary, pielęgnacja…"
            style={{ ...inputStyle, resize: "vertical" }}
            {...focusProps}
          />
        </Field>
      </SectionCard>

      {/* Pricing */}
      <SectionCard title="Cena">
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
        <p className="text-[11px]" style={{ color: "oklch(60% 0 0)" }}>
          Po podaniu ceny przed obniżką klient zobaczy ją przekreśloną obok aktualnej.
        </p>
      </SectionCard>

      {/* Images */}
      <SectionCard title="Zdjęcia">
        {form.images.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            {form.images.map((url, i) => (
              <div key={`${url}-${i}`} className="relative group">
                <img
                  src={url}
                  alt={`Zdjęcie ${i + 1}`}
                  className="w-20 h-20 rounded-xl object-cover"
                  style={{ border: "1px solid oklch(88% 0 0)" }}
                />
                {i === 0 && (
                  <span
                    className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "oklch(56% 0.30 335)", color: "#fff" }}
                  >
                    Główne
                  </span>
                )}
                <button
                  onClick={() => removeImage(i)}
                  aria-label="Usuń zdjęcie"
                  className="absolute -top-1.5 -right-1.5 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "oklch(25% 0 0)", color: "#fff" }}
                >
                  <X className="w-3 h-3" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}

        {form.images.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-8 rounded-xl mb-4 gap-2"
            style={{ border: "1.5px dashed oklch(85% 0 0)", background: "oklch(98% 0 0)" }}
          >
            <ImageIcon className="w-8 h-8" style={{ color: "oklch(80% 0 0)" }} strokeWidth={1} />
            <p className="text-xs" style={{ color: "oklch(55% 0 0)" }}>
              Brak zdjęć — pierwsze dodane będzie zdjęciem głównym
            </p>
          </div>
        )}

        <div className="mb-3">
          <ImageUpload
            endpoint="productImage"
            multiple
            label="Wgraj zdjęcia z dysku"
            onUploaded={(urls) =>
              setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }))
            }
          />
        </div>

        <div className="flex gap-2">
          <input
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addImage();
              }
            }}
            placeholder="Wklej adres URL zdjęcia"
            style={{ ...inputStyle, flex: 1, width: "auto" }}
            {...focusProps}
          />
          <button
            onClick={addImage}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all shrink-0"
            style={{ border: "1.5px solid oklch(85% 0 0)", color: "oklch(30% 0 0)", background: "oklch(97% 0 0)" }}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            Dodaj
          </button>
        </div>
      </SectionCard>

      {/* Visibility */}
      <SectionCard title="Widoczność">
        <label className="flex items-center gap-2.5 cursor-pointer w-fit">
          <div
            className="relative w-9 h-5 rounded-full transition-all"
            style={{ background: form.visible ? "oklch(56% 0.30 335)" : "oklch(82% 0 0)" }}
            onClick={() => patch({ visible: !form.visible })}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: form.visible ? "1.125rem" : "0.125rem" }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: "oklch(35% 0 0)" }}>
            {form.visible ? "Produkt widoczny w sklepie" : "Produkt ukryty"}
          </span>
        </label>
      </SectionCard>

      {/* Danger zone */}
      {isEdit && (
        <div className="mt-8 pt-5" style={{ borderTop: "1px solid oklch(92% 0 0)" }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-all disabled:opacity-60"
            style={{ color: "oklch(45% 0.18 20)", border: "1.5px solid oklch(50% 0.20 20 / 0.3)" }}
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            {deleting ? "Usuwanie…" : "Usuń produkt"}
          </button>
        </div>
      )}
    </div>
  );
}
