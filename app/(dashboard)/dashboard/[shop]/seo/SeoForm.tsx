"use client";

import { useState } from "react";
import { ChevronDown, Save } from "lucide-react";
import SeoFields, { EMPTY_SEO, type SeoFormValue } from "@/components/admin/SeoFields";
import { SEO_PAGES, type SeoConfig, type SeoPageKey } from "@/lib/page-seo";
import { saveConfig } from "../settings/sections/save";

interface Props {
  shopSlug: string;
  shopName: string;
  shopHost: string;
  /** Hasło sklepu i opis z banera: domyślne opisy stron, gdy nic nie wpisano. */
  tagline: string;
  heroDescription: string;
  initial: SeoConfig;
}

type SaveState = "idle" | "saving" | "saved" | "error";

function toForm(c: SeoConfig["pages"][SeoPageKey]): SeoFormValue {
  return {
    title: c?.title ?? "",
    description: c?.description ?? "",
    focus: c?.focus ?? "",
    phrases: c?.phrases ?? [],
  };
}

const isCustom = (v: SeoFormValue) => Boolean(v.title.trim() || v.description.trim() || v.focus.trim() || v.phrases.length);

export default function SeoForm({ shopSlug, shopName, shopHost, tagline, heroDescription, initial }: Props) {
  const [values, setValues] = useState<Record<SeoPageKey, SeoFormValue>>(
    () => Object.fromEntries(SEO_PAGES.map((p) => [p.key, toForm(initial.pages[p.key])])) as Record<SeoPageKey, SeoFormValue>
  );
  const [open, setOpen] = useState<SeoPageKey | null>("home");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  async function handleSave() {
    setSaveState("saving");
    const pages: Record<string, SeoFormValue> = {};
    for (const p of SEO_PAGES) if (isCustom(values[p.key])) pages[p.key] = values[p.key];
    const ok = await saveConfig(shopSlug, "seo", { pages });
    setSaveState(ok ? "saved" : "error");
    setTimeout(() => setSaveState("idle"), 2500);
  }

  const buttonLabel =
    saveState === "saving" ? "Zapisywanie…"
    : saveState === "saved" ? "Zapisano"
    : saveState === "error" ? "Błąd, spróbuj ponownie"
    : "Zapisz zmiany";
  const buttonBg =
    saveState === "saved" ? "var(--panel-success-strong)"
    : saveState === "error" ? "var(--panel-danger-strong)"
    : "var(--panel-accent)";

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto">
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-5 flex items-center justify-between gap-4 bg-[var(--panel-bg)] border-b border-[var(--panel-border)]">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-[var(--panel-ink)]" style={{ fontFamily: "var(--font-display)" }}>
            SEO stron sklepu
          </h1>
          <p className="text-[13px] mt-0.5 text-[var(--panel-ink-muted)]">
            Jak strony sklepu wyglądają w wynikach Google
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

      <p className="text-[13px] mb-5 text-[var(--panel-ink-muted)]">
        Tytuł i opis każdej strony to to, co klient widzi w Google przed kliknięciem. Puste pole oznacza ustawienie
        domyślne (widać je jako podpowiedź). SEO produktów ustawisz w karcie produktu, a wpisów na blogu we wpisie.
      </p>

      <div className="space-y-3">
        {SEO_PAGES.map((page) => {
          const v = values[page.key];
          const expanded = open === page.key;
          const defaultTitle = page.defaultTitle(shopName);
          return (
            <section key={page.key} className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-surface)]">
              <h2>
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : page.key)}
                  aria-expanded={expanded}
                  aria-controls={`seo-${page.key}`}
                  className="w-full flex items-center justify-between gap-3 px-5 h-12 text-left"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[15px] font-semibold text-[var(--panel-ink)]" style={{ fontFamily: "var(--font-display)" }}>
                      {page.label}
                    </span>
                    <span className="text-[12px] text-[var(--panel-ink-faint)] truncate">{page.path || "/"}</span>
                  </span>
                  <span className="flex items-center gap-3 shrink-0">
                    {isCustom(v) && (
                      <span className="text-[11.5px] font-medium px-1.5 py-px rounded-md border border-[var(--panel-border-strong)] text-[var(--panel-ink-muted)]">
                        własne
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-[var(--panel-ink-muted)] transition-transform ${expanded ? "rotate-180" : ""}`}
                      strokeWidth={1.75}
                    />
                  </span>
                </button>
              </h2>
              {expanded && (
                <div id={`seo-${page.key}`} className="px-5 pb-5 pt-1 border-t border-[var(--panel-border)]">
                  <div className="pt-4">
                    <SeoFields
                      value={v}
                      onChange={(patch) => setValues((prev) => ({ ...prev, [page.key]: { ...(prev[page.key] ?? EMPTY_SEO), ...patch } }))}
                      displayUrl={`${shopHost}${page.path ? ` › ${page.path.slice(1)}` : ""}`}
                      defaultTitle={defaultTitle}
                      defaultDescription={page.defaultDescription(shopName, { tagline, heroDescription })}
                      subject="strony"
                    />
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
