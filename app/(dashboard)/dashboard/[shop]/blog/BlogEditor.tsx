"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, X, ImageIcon } from "lucide-react";
import Link from "next/link";
import ImageUpload from "@/components/admin/ImageUpload";
import SeoFields, { EMPTY_SEO, type SeoFormValue } from "@/components/admin/SeoFields";
import { SEO_DESC_RECOMMENDED, truncateForSerp } from "@/lib/product-seo";

export interface BlogFormData {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  published: boolean;
  /** Adres wpisu; pusty przy nowym (powstaje z tytułu). */
  slug: string;
  coverAlt: string;
  seo: SeoFormValue;
}

const EMPTY: BlogFormData = {
  title: "",
  excerpt: "",
  content: "",
  coverImage: "",
  published: false,
  slug: "",
  coverAlt: "",
  seo: EMPTY_SEO,
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 mb-5" style={{ background: "var(--panel-surface)", border: "1px solid var(--panel-border)" }}>
      <h2 className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-display)", color: "var(--panel-ink)" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-xs font-semibold mb-1.5" style={{ color: "var(--panel-ink)" }}>
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
} as const;

const focusProps = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = "var(--panel-primary)"),
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = "var(--panel-border)"),
};

interface Props {
  shopSlug: string;
  shopName: string;
  shopHost: string;
  postId?: string;
  initial?: BlogFormData;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function BlogEditor({ shopSlug, shopName, shopHost, postId, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<BlogFormData>(initial ?? EMPTY);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isEdit = !!postId;
  const listUrl = `/dashboard/${shopSlug}/blog`;

  function patch(updates: Partial<BlogFormData>) {
    setForm((prev) => ({ ...prev, ...updates }));
  }

  async function save(publishOverride?: boolean) {
    if (!form.title.trim()) {
      setValidationError("Podaj tytuł wpisu.");
      return;
    }
    setValidationError(null);
    setSaveState("saving");

    const published = publishOverride ?? form.published;
    const payload = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim() || null,
      content: form.content,
      coverImage: form.coverImage.trim() || null,
      published,
      seo: { ...form.seo, coverAlt: form.coverAlt },
    };

    try {
      const res = await fetch(
        isEdit ? `/api/shops/${shopSlug}/blog/${postId}` : `/api/shops/${shopSlug}/blog`,
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
    if (!confirm(`Usunąć wpis „${form.title}”? Tej operacji nie można cofnąć.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/blog/${postId}`, { method: "DELETE" });
      if (res.ok) {
        router.push(listUrl);
        router.refresh();
        return;
      }
    } catch {
      // fall through
    }
    setDeleting(false);
  }

  const buttonLabel =
    saveState === "saving" ? "Zapisywanie…"
    : saveState === "saved" ? "Zapisano"
    : saveState === "error" ? "Błąd, spróbuj ponownie"
    : isEdit ? "Zapisz zmiany" : "Zapisz wpis";

  const buttonBg =
    saveState === "saved" ? "var(--panel-success-strong)"
    : saveState === "error" ? "var(--panel-danger-strong)"
    : "var(--panel-accent)";

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={listUrl}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--panel-ink-muted)", border: "1px solid var(--panel-border)" }}
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--panel-ink)" }}>
              {isEdit ? "Edytuj wpis" : "Nowy wpis"}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--panel-ink-muted)" }}>
              {isEdit ? form.title : "Napisz artykuł i opublikuj"}
            </p>
          </div>
        </div>

        <button
          onClick={() => save()}
          disabled={saveState === "saving"}
          className="flex items-center gap-2 h-9 px-3.5 text-[13px] font-semibold rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: buttonBg, color: "#fff" }}
        >
          <Save className="w-3.5 h-3.5" strokeWidth={2} />
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

      <SectionCard title="Treść wpisu">
        <Field label="Tytuł" id="b-title">
          <input
            id="b-title"
            value={form.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="np. Jak dbać o nasze produkty"
            style={inputStyle}
            {...focusProps}
          />
        </Field>
        <Field label="Zajawka (na liście wpisów)" id="b-excerpt">
          <input
            id="b-excerpt"
            value={form.excerpt}
            onChange={(e) => patch({ excerpt: e.target.value })}
            placeholder="Jedno–dwa zdania wprowadzenia"
            style={inputStyle}
            {...focusProps}
          />
        </Field>
        <Field label="Treść" id="b-content">
          <textarea
            id="b-content"
            value={form.content}
            onChange={(e) => patch({ content: e.target.value })}
            rows={14}
            placeholder="Pełna treść artykułu. Akapity oddzielaj pustą linią."
            style={{ ...inputStyle, resize: "vertical" }}
            {...focusProps}
          />
        </Field>
      </SectionCard>

      <SectionCard title="Zdjęcie główne">
        {form.coverImage ? (
          <div className="relative group w-fit mb-3">
            <img
              src={form.coverImage}
              alt={form.coverAlt || "Zdjęcie główne"}
              className="w-40 h-24 rounded-xl object-cover"
              style={{ border: "1px solid var(--panel-border)" }}
            />
            <button
              onClick={() => patch({ coverImage: "" })}
              aria-label="Usuń zdjęcie główne"
              className="absolute -top-1.5 -right-1.5 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "var(--panel-ink)", color: "var(--panel-surface)" }}
            >
              <X className="w-3 h-3" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-8 rounded-xl mb-4 gap-2"
            style={{ border: "1.5px dashed var(--panel-border-strong)", background: "var(--panel-surface-2)" }}
          >
            <ImageIcon className="w-8 h-8" style={{ color: "var(--panel-border-strong)" }} strokeWidth={1} />
            <p className="text-xs" style={{ color: "var(--panel-ink-muted)" }}>
              Brak zdjęcia głównego
            </p>
          </div>
        )}
        <ImageUpload
          endpoint="productImage"
          label="Wgraj zdjęcie z dysku"
          onUploaded={(urls) => urls[0] && patch({ coverImage: urls[0] })}
        />
        {form.coverImage && (
          <Field label="Opis zdjęcia (alt)" id="b-cover-alt">
            <input
              id="b-cover-alt"
              value={form.coverAlt}
              maxLength={200}
              onChange={(e) => patch({ coverAlt: e.target.value })}
              placeholder="Co widać na zdjęciu. Puste = tytuł wpisu"
              style={{ ...inputStyle, marginTop: 12 }}
              {...focusProps}
            />
          </Field>
        )}
      </SectionCard>

      <SectionCard title="SEO: wynik w Google">
        <SeoFields
          value={form.seo}
          onChange={(seo) => patch({ seo: { ...form.seo, ...seo } })}
          displayUrl={`${shopHost} › blog › ${form.slug || "adres-wpisu"}`}
          defaultTitle={`${form.title.trim() || "Tytuł wpisu"} — ${shopName}`}
          defaultDescription={
            form.excerpt.trim() || truncateForSerp(form.content, SEO_DESC_RECOMMENDED)
          }
          subject="wpisu"
          context={{
            name: form.title,
            slug: form.slug || undefined,
            body: `${form.excerpt} ${form.content}`,
            imageCount: form.coverImage ? 1 : 0,
            imagesWithAlt: form.coverImage && form.coverAlt.trim() ? 1 : 0,
          }}
        />
      </SectionCard>

      <SectionCard title="Publikacja">
        <label className="flex items-center gap-2.5 cursor-pointer w-fit">
          <div
            className="relative w-9 h-5 rounded-full transition-all"
            style={{ background: form.published ? "var(--panel-primary)" : "var(--panel-border-strong)" }}
            onClick={() => patch({ published: !form.published })}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: form.published ? "1.125rem" : "0.125rem" }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--panel-ink)" }}>
            {form.published ? "Wpis opublikowany (widoczny w sklepie)" : "Szkic (ukryty)"}
          </span>
        </label>
      </SectionCard>

      {isEdit && (
        <div className="mt-8 pt-5" style={{ borderTop: "1px solid var(--panel-border)" }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-all disabled:opacity-60"
            style={{ color: "var(--panel-danger-ink)", border: "1.5px solid var(--panel-danger-border)" }}
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            {deleting ? "Usuwanie…" : "Usuń wpis"}
          </button>
        </div>
      )}
    </div>
  );
}
