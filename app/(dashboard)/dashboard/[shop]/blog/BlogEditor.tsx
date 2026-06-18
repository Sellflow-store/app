"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, X, ImageIcon } from "lucide-react";
import Link from "next/link";
import ImageUpload from "@/components/admin/ImageUpload";

export interface BlogFormData {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  published: boolean;
}

const EMPTY: BlogFormData = {
  title: "",
  excerpt: "",
  content: "",
  coverImage: "",
  published: false,
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 mb-5" style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}>
      <h2 className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}>
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
} as const;

const focusProps = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = "oklch(22% 0.24 270)"),
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = "oklch(88% 0 0)"),
};

interface Props {
  shopSlug: string;
  postId?: string;
  initial?: BlogFormData;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function BlogEditor({ shopSlug, postId, initial }: Props) {
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
    : saveState === "saved" ? "Zapisano!"
    : saveState === "error" ? "Błąd — spróbuj ponownie"
    : isEdit ? "Zapisz zmiany" : "Zapisz wpis";

  const buttonBg =
    saveState === "saved" ? "oklch(52% 0.20 158)"
    : saveState === "error" ? "oklch(50% 0.20 20)"
    : "oklch(56% 0.30 335)";

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
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
            <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}>
              {isEdit ? "Edytuj wpis" : "Nowy wpis"}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
              {isEdit ? form.title : "Napisz artykuł i opublikuj"}
            </p>
          </div>
        </div>

        <button
          onClick={() => save()}
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
              alt="Zdjęcie główne"
              className="w-40 h-24 rounded-xl object-cover"
              style={{ border: "1px solid oklch(88% 0 0)" }}
            />
            <button
              onClick={() => patch({ coverImage: "" })}
              aria-label="Usuń zdjęcie główne"
              className="absolute -top-1.5 -right-1.5 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "oklch(25% 0 0)", color: "#fff" }}
            >
              <X className="w-3 h-3" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-8 rounded-xl mb-4 gap-2"
            style={{ border: "1.5px dashed oklch(85% 0 0)", background: "oklch(98% 0 0)" }}
          >
            <ImageIcon className="w-8 h-8" style={{ color: "oklch(80% 0 0)" }} strokeWidth={1} />
            <p className="text-xs" style={{ color: "oklch(55% 0 0)" }}>
              Brak zdjęcia głównego
            </p>
          </div>
        )}
        <ImageUpload
          endpoint="productImage"
          label="Wgraj zdjęcie z dysku"
          onUploaded={(urls) => urls[0] && patch({ coverImage: urls[0] })}
        />
      </SectionCard>

      <SectionCard title="Publikacja">
        <label className="flex items-center gap-2.5 cursor-pointer w-fit">
          <div
            className="relative w-9 h-5 rounded-full transition-all"
            style={{ background: form.published ? "oklch(56% 0.30 335)" : "oklch(82% 0 0)" }}
            onClick={() => patch({ published: !form.published })}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: form.published ? "1.125rem" : "0.125rem" }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: "oklch(35% 0 0)" }}>
            {form.published ? "Wpis opublikowany (widoczny w sklepie)" : "Szkic (ukryty)"}
          </span>
        </label>
      </SectionCard>

      {isEdit && (
        <div className="mt-8 pt-5" style={{ borderTop: "1px solid oklch(92% 0 0)" }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-all disabled:opacity-60"
            style={{ color: "oklch(45% 0.18 20)", border: "1.5px solid oklch(50% 0.20 20 / 0.3)" }}
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            {deleting ? "Usuwanie…" : "Usuń wpis"}
          </button>
        </div>
      )}
    </div>
  );
}
