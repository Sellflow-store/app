"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle, X } from "lucide-react";
import {
  SEO_DESC_MAX,
  SEO_DESC_MIN,
  SEO_DESC_RECOMMENDED,
  SEO_PHRASES_MAX,
  SEO_PHRASE_MAX,
  SEO_TITLE_MAX,
  SEO_TITLE_RECOMMENDED,
  normalizePhrases,
  seoChecks,
  truncateForSerp,
  type CheckStatus,
  type SeoCheckInput,
} from "@/lib/product-seo";

export interface SeoFormValue {
  title: string;
  description: string;
  focus: string;
  phrases: string[];
}

export const EMPTY_SEO: SeoFormValue = { title: "", description: "", focus: "", phrases: [] };

interface Props {
  value: SeoFormValue;
  onChange: (patch: Partial<SeoFormValue>) => void;
  /** Adres do podglądu wyniku Google, bez protokołu: "sklep.pl › produkty › bluzka". */
  displayUrl: string;
  /** Co zobaczy Google, gdy pole zostanie puste. */
  defaultTitle: string;
  defaultDescription: string;
  /** Dane do listy kontrolnej (nazwa, adres, treść, zdjęcia). */
  context?: Pick<SeoCheckInput, "name" | "slug" | "body" | "imageCount" | "imagesWithAlt">;
  /** Wpisy o stronie, np. "produktu": do podpowiedzi pod polami. */
  subject?: string;
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

function Label({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="block text-[12.5px] font-medium mb-1.5 text-[var(--panel-ink-muted)]">
      {children}
    </label>
  );
}

/** Pasek wypełnienia: zielony w zaleceniu, żółty poza nim. */
function Meter({ value, min, max, hardMax }: { value: number; min: number; max: number; hardMax: number }) {
  const pct = Math.min(100, (value / hardMax) * 100);
  const color =
    value === 0
      ? "var(--panel-border-strong)"
      : value > max || value < min
        ? "var(--panel-warning)"
        : "var(--panel-success)";
  return (
    <div className="h-1 rounded-full mt-1.5 bg-[var(--panel-border)]" aria-hidden>
      <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

const STATUS_ICON: Record<CheckStatus, { Icon: typeof CheckCircle2; color: string }> = {
  ok: { Icon: CheckCircle2, color: "var(--panel-success)" },
  warn: { Icon: AlertTriangle, color: "var(--panel-warning)" },
  bad: { Icon: XCircle, color: "var(--panel-danger)" },
};

/**
 * Pola SEO wspólne dla produktu i stron sklepu: podgląd wyniku Google,
 * tytuł, opis, frazy i lista kontrolna. Pusty tytuł lub opis = sklep użyje
 * wartości domyślnej, którą widać w polu jako podpowiedź.
 */
export default function SeoFields({
  value,
  onChange,
  displayUrl,
  defaultTitle,
  defaultDescription,
  context,
  subject = "strony",
}: Props) {
  const [phraseDraft, setPhraseDraft] = useState("");

  const effectiveTitle = value.title.trim() || defaultTitle;
  const effectiveDescription = value.description.trim() || defaultDescription;
  const checks = seoChecks({
    title: effectiveTitle,
    description: effectiveDescription,
    focus: value.focus,
    ...context,
  });

  function commitPhrase(raw: string) {
    const next = normalizePhrases([...value.phrases, ...raw.split(",")]);
    if (next.length !== value.phrases.length) onChange({ phrases: next });
    setPhraseDraft("");
  }

  return (
    <div>
      {/* Podgląd: zawsze jasny, tak jak wynik w Google. */}
      <div className="rounded-lg p-4 mb-5 border border-[var(--panel-border)] bg-white" aria-label="Podgląd wyniku w Google">
        <p className="text-[12px] text-[#4d5156] truncate">{displayUrl}</p>
        <p className="text-[18px] leading-snug text-[#1a0dab] mt-0.5 break-words" style={{ fontFamily: "Arial, sans-serif" }}>
          {truncateForSerp(effectiveTitle, SEO_TITLE_RECOMMENDED + 4) || "Brak tytułu"}
        </p>
        <p className="text-[13px] leading-snug text-[#4d5156] mt-1 break-words" style={{ fontFamily: "Arial, sans-serif" }}>
          {truncateForSerp(effectiveDescription, SEO_DESC_RECOMMENDED) || "Brak opisu."}
        </p>
      </div>

      <div className="mb-4">
        <Label id="seo-title">Tytuł w Google</Label>
        <input
          id="seo-title"
          value={value.title}
          maxLength={SEO_TITLE_MAX}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={defaultTitle}
          style={inputStyle}
          {...focusProps}
        />
        <Meter value={value.title.trim().length || defaultTitle.length} min={20} max={SEO_TITLE_RECOMMENDED} hardMax={80} />
        <p className="text-[11px] mt-1.5 text-[var(--panel-ink-faint)]">
          {value.title.trim()
            ? `${value.title.trim().length} znaków, zalecane do ${SEO_TITLE_RECOMMENDED}. To pełny tytuł: nazwa sklepu nie zostanie dopisana.`
            : `Puste = tytuł domyślny. Zacznij od frazy, po której klient szuka ${subject}, i dodaj to, co odróżnia ją od konkurencji.`}
        </p>
      </div>

      <div className="mb-4">
        <Label id="seo-desc">Opis w Google</Label>
        <textarea
          id="seo-desc"
          value={value.description}
          maxLength={SEO_DESC_MAX}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          placeholder={defaultDescription || "Dwa zdania: co to jest, dla kogo i dlaczego u Ciebie."}
          style={{ ...inputStyle, resize: "vertical" }}
          {...focusProps}
        />
        <Meter
          value={value.description.trim().length || defaultDescription.length}
          min={SEO_DESC_MIN}
          max={SEO_DESC_RECOMMENDED}
          hardMax={200}
        />
        <p className="text-[11px] mt-1.5 text-[var(--panel-ink-faint)]">
          {value.description.trim()
            ? `${value.description.trim().length} znaków, zalecane ${SEO_DESC_MIN}–${SEO_DESC_RECOMMENDED}.`
            : "Puste = sklep użyje krótkiego opisu albo początku opisu pełnego. Własny opis zwykle daje więcej kliknięć."}
        </p>
      </div>

      <div className="mb-4">
        <Label id="seo-focus">Główna fraza</Label>
        <input
          id="seo-focus"
          value={value.focus}
          maxLength={SEO_PHRASE_MAX}
          onChange={(e) => onChange({ focus: e.target.value })}
          placeholder="np. jedwabna bluzka damska"
          style={inputStyle}
          {...focusProps}
        />
        <p className="text-[11px] mt-1.5 text-[var(--panel-ink-faint)]">
          Jedna fraza, którą klient wpisuje w Google, szukając tego produktu. Nie trafia na stronę jako ukryty
          znacznik (Google go ignoruje): sprawdzamy na jej podstawie, czy tytuł, opis, adres i treść mówią o tym
          samym.
        </p>
      </div>

      <div className="mb-5">
        <Label id="seo-phrases">Dodatkowe frazy</Label>
        {value.phrases.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 mb-2">
            {value.phrases.map((p) => (
              <li
                key={p}
                className="inline-flex items-center gap-1 pl-2.5 pr-1 h-7 rounded-full text-[12.5px] border border-[var(--panel-border-strong)] bg-[var(--panel-surface-2)] text-[var(--panel-ink)]"
              >
                {p}
                <button
                  type="button"
                  onClick={() => onChange({ phrases: value.phrases.filter((x) => x !== p) })}
                  aria-label={`Usuń frazę ${p}`}
                  className="flex items-center justify-center w-5 h-5 rounded-full text-[var(--panel-ink-muted)] hover:text-[var(--panel-ink)]"
                >
                  <X className="w-3 h-3" strokeWidth={2} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          id="seo-phrases"
          value={phraseDraft}
          disabled={value.phrases.length >= SEO_PHRASES_MAX}
          onChange={(e) => {
            const v = e.target.value;
            // Przecinek kończy frazę, tak jak Enter.
            if (v.includes(",")) commitPhrase(v);
            else setPhraseDraft(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitPhrase(phraseDraft);
            } else if (e.key === "Backspace" && !phraseDraft && value.phrases.length > 0) {
              onChange({ phrases: value.phrases.slice(0, -1) });
            }
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--panel-border)";
            if (phraseDraft.trim()) commitPhrase(phraseDraft);
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--panel-primary)")}
          placeholder={
            value.phrases.length >= SEO_PHRASES_MAX ? `Maksymalnie ${SEO_PHRASES_MAX} fraz` : "Wpisz frazę i zatwierdź Enterem lub przecinkiem"
          }
          style={inputStyle}
        />
        <p className="text-[11px] mt-1.5 text-[var(--panel-ink-faint)]">
          Synonimy i warianty, np. „bluzka z jedwabiu”, „koszula jedwabna”. Dzięki nim wyszukiwarka w sklepie
          znajdzie {subject === "produktu" ? "produkt" : "stronę"} także po tych słowach.
        </p>
      </div>

      <ul className="space-y-1.5" aria-label="Lista kontrolna SEO">
        {checks.map((c) => {
          const { Icon, color } = STATUS_ICON[c.status];
          return (
            <li key={c.id} className="flex items-start gap-2 text-[12.5px] text-[var(--panel-ink)]">
              <Icon className="w-4 h-4 mt-px shrink-0" style={{ color }} strokeWidth={2} aria-hidden />
              <span>{c.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
