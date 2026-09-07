"use client";

import { useState } from "react";
import { Save, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { HomeConfig } from "@/types/shop";
import ImageUpload from "@/components/admin/ImageUpload";

// ── Sub-components ────────────────────────────────────────────────────────────

function Accordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl mb-4 overflow-hidden"
      style={{ border: "1px solid oklch(90% 0 0)", background: "#fff" }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        style={{ color: "oklch(11% 0.10 275)" }}
      >
        <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </span>
        {open
          ? <ChevronUp className="w-4 h-4 shrink-0" strokeWidth={1.5} style={{ color: "oklch(55% 0 0)" }} />
          : <ChevronDown className="w-4 h-4 shrink-0" strokeWidth={1.5} style={{ color: "oklch(55% 0 0)" }} />}
      </button>
      {open && (
        <div className="px-5 pb-5" style={{ borderTop: "1px solid oklch(93% 0 0)" }}>
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer w-fit">
      <div
        className="relative w-9 h-5 rounded-full transition-all"
        style={{ background: checked ? "oklch(56% 0.30 335)" : "oklch(82% 0 0)" }}
        onClick={() => onChange(!checked)}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
          style={{ left: checked ? "1.125rem" : "0.125rem" }}
        />
      </div>
      <span className="text-xs font-medium" style={{ color: "oklch(35% 0 0)" }}>{label}</span>
    </label>
  );
}

const inputStyle = {
  border: "1.5px solid oklch(88% 0 0)",
  borderRadius: "10px",
  padding: "9px 12px",
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-[11px] font-semibold mb-1" style={{ color: "oklch(40% 0 0)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

type ListItem = { title: string; description: string; icon?: string };

const GUARANTEE_ICONS = [
  { value: "shield", label: "Tarcza" },
  { value: "return", label: "Zwrot" },
  { value: "package", label: "Paczka" },
  { value: "truck", label: "Dostawa" },
  { value: "mail", label: "Kontakt" },
  { value: "leaf", label: "Natura" },
  { value: "lock", label: "Bezpieczeństwo" },
  { value: "clock", label: "Czas" },
  { value: "star", label: "Gwiazdka" },
];

function ItemListEditor({
  items,
  onChange,
  addLabel,
  iconOptions,
}: {
  items: ListItem[];
  onChange: (items: ListItem[]) => void;
  addLabel: string;
  /** Gdy podane, każda pozycja dostaje select ikony (klucz → etykieta). */
  iconOptions?: { value: string; label: string }[];
}) {
  function update(i: number, patch: Partial<ListItem>) {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="p-3 rounded-xl"
          style={{ background: "oklch(97% 0 0)", border: "1px solid oklch(92% 0 0)" }}
        >
          <div
            className={`grid gap-2 items-end ${
              iconOptions ? "grid-cols-[7rem_1fr_1.5fr_2rem]" : "grid-cols-[1fr_1.5fr_2rem]"
            }`}
          >
            {iconOptions && (
              <Field label="Ikona">
                <select
                  value={item.icon ?? ""}
                  onChange={(e) => update(i, { icon: e.target.value || undefined })}
                  style={inputStyle}
                >
                  <option value="">wg kolejności</option>
                  {iconOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Tytuł">
              <input
                value={item.title}
                onChange={(e) => update(i, { title: e.target.value })}
                style={inputStyle}
                {...focusProps}
              />
            </Field>
            <Field label="Opis">
              <input
                value={item.description}
                onChange={(e) => update(i, { description: e.target.value })}
                style={inputStyle}
                {...focusProps}
              />
            </Field>
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              aria-label="Usuń pozycję"
              className="p-2 mb-3 rounded-lg transition-colors"
              style={{ color: "oklch(50% 0.15 20)" }}
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, { title: "", description: "" }])}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
        style={{ border: "1.5px solid oklch(85% 0 0)", color: "oklch(30% 0 0)", background: "oklch(97% 0 0)" }}
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
        {addLabel}
      </button>
    </div>
  );
}

type LookItem = { image: string; video?: string; caption?: string; href?: string };

function LookbookEditor({
  items,
  onChange,
}: {
  items: LookItem[];
  onChange: (items: LookItem[]) => void;
}) {
  function update(i: number, patch: Partial<LookItem>) {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="p-3 rounded-xl flex gap-3"
          style={{ background: "oklch(97% 0 0)", border: "1px solid oklch(92% 0 0)" }}
        >
          <div
            className="w-16 h-20 rounded-lg overflow-hidden shrink-0 relative"
            style={{ background: "oklch(93% 0 0)" }}
          >
            {item.image && (
              <img src={item.image} alt="" className="w-full h-full object-cover" />
            )}
            {item.video && (
              <span
                className="absolute inset-x-0 bottom-0 text-[9px] text-center py-0.5 tracking-wider uppercase"
                style={{ background: "oklch(20% 0 0 / 0.7)", color: "white" }}
              >
                film
              </span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <Field label="Podpis na zdjęciu (opcjonalnie)">
              <input
                value={item.caption ?? ""}
                onChange={(e) => update(i, { caption: e.target.value })}
                placeholder="np. Kolekcja wiosna"
                style={inputStyle}
                {...focusProps}
              />
            </Field>
            <Field label="Dokąd prowadzi (opcjonalnie)">
              <input
                value={item.href ?? ""}
                onChange={(e) => update(i, { href: e.target.value })}
                placeholder="/produkty"
                style={inputStyle}
                {...focusProps}
              />
            </Field>
            <div className="flex items-center gap-2 flex-wrap">
              <ImageUpload
                label={item.video ? "Zmień film" : "Dodaj film do tego kadru"}
                accept="video/mp4,video/webm"
                onUploaded={(urls) => urls[0] && update(i, { video: urls[0] })}
              />
              {item.video && (
                <button
                  type="button"
                  onClick={() => update(i, { video: undefined })}
                  className="text-[11px] underline underline-offset-2"
                  style={{ color: "oklch(50% 0 0)" }}
                >
                  Usuń film, zostaw zdjęcie
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            aria-label="Usuń kadr"
            className="p-2 h-8 rounded-lg transition-colors"
            style={{ color: "oklch(50% 0.15 20)" }}
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      ))}
      <ImageUpload
        label="Dodaj kadry"
        multiple
        onUploaded={(urls) => onChange([...items, ...urls.map((image) => ({ image }))])}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  shopSlug: string;
  initialConfig: HomeConfig;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function HomeEditor({ shopSlug, initialConfig }: Props) {
  const [config, setConfig] = useState<HomeConfig>(initialConfig);
  const [open, setOpen] = useState<Record<string, boolean>>({ topBar: true });
  const [saveState, setSaveState] = useState<SaveState>("idle");

  function toggle(key: string) {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function patch<K extends keyof HomeConfig>(key: K, value: Partial<HomeConfig[K]>) {
    setConfig((prev) => ({ ...prev, [key]: { ...prev[key], ...value } }));
  }

  /** Jak patch, ale dla sekcji, których w zapisanym configu może w ogóle nie być. */
  function patch2(key: "lookbook", value: Partial<NonNullable<HomeConfig["lookbook"]>>) {
    setConfig((prev) => ({
      ...prev,
      lookbook: { items: [], ...(prev.lookbook ?? {}), ...value },
    }));
  }

  async function handleSave() {
    setSaveState("saving");
    try {
      // Full config object — preserves sections this editor doesn't touch
      // (reviews, video, discounts, popup) instead of dropping them.
      const res = await fetch(`/api/shops/${shopSlug}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "home", value: config }),
      });
      setSaveState(res.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
    setTimeout(() => setSaveState("idle"), 2500);
  }

  const buttonLabel =
    saveState === "saving" ? "Zapisywanie…"
    : saveState === "saved" ? "Zapisano!"
    : saveState === "error" ? "Błąd — spróbuj ponownie"
    : "Zapisz zmiany";

  const buttonBg =
    saveState === "saved" ? "oklch(52% 0.20 158)"
    : saveState === "error" ? "oklch(50% 0.20 20)"
    : "oklch(56% 0.30 335)";

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
          >
            Strona główna
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
            Edytuj treści widoczne na stronie Twojego sklepu
          </p>
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

      {/* TopBar */}
      <Accordion title="Pasek powiadomień (TopBar)" open={!!open.topBar} onToggle={() => toggle("topBar")}>
        <div className="space-y-3">
          <Toggle
            checked={config.topBar.visible}
            onChange={(v) => patch("topBar", { visible: v })}
            label="Pokaż pasek nad menu"
          />
          <Field label="Tekst paska">
            <input
              value={config.topBar.text}
              onChange={(e) => patch("topBar", { text: e.target.value })}
              style={inputStyle}
              {...focusProps}
            />
          </Field>
        </div>
      </Accordion>

      {/* Hero */}
      <Accordion title="Sekcja Hero (nagłówek)" open={!!open.hero} onToggle={() => toggle("hero")}>
        <div className="space-y-0">
          <Field label="Układ">
            <select
              value={config.hero.layout ?? "split"}
              onChange={(e) => patch("hero", { layout: e.target.value as HomeConfig["hero"]["layout"] })}
              style={inputStyle}
            >
              <option value="split">Dwie kolumny — tekst po lewej, zdjęcie po prawej</option>
              <option value="fullbleed">Zdjęcie na całą szerokość, tekst na dole</option>
              <option value="editorial">Typograficzny — duży tytuł na osi, zdjęcie jako pas</option>
              <option value="cover">Sam kadr — zdjęcie na pełny ekran, menu na zdjęciu, bez tekstu</option>
            </select>
            <p className="text-[11px] mt-1.5" style={{ color: "oklch(60% 0 0)" }}>
              Układ ze zdjęciem na całą szerokość wymaga zdjęcia — bez niego pokaże się układ
              typograficzny. Najlepiej działa z fotografią na modelce lub z sesji.
            </p>
          </Field>
          {config.hero.layout === "cover" && (
            <>
              <Field label="Kolor menu na zdjęciu">
                <select
                  value={config.hero.overlayTone ?? "dark"}
                  onChange={(e) =>
                    patch("hero", { overlayTone: e.target.value as HomeConfig["hero"]["overlayTone"] })
                  }
                  style={inputStyle}
                >
                  <option value="dark">Ciemny — do jasnych, studyjnych kadrów</option>
                  <option value="light">Jasny — do ciemnych zdjęć</option>
                </select>
                <p className="text-[11px] mt-1.5" style={{ color: "oklch(60% 0 0)" }}>
                  Przy jasnym menu podmienia się też logo, jeśli wgrasz jego jasną wersję
                  w „Logo i kolorystyka”.
                </p>
              </Field>
              <Field label="Wysokość kadru">
                <select
                  value={config.hero.coverHeight ?? "full"}
                  onChange={(e) =>
                    patch("hero", { coverHeight: e.target.value as HomeConfig["hero"]["coverHeight"] })
                  }
                  style={inputStyle}
                >
                  <option value="full">Pełny ekran</option>
                  <option value="tall">Wysoki, ale widać, że strona idzie dalej</option>
                  <option value="medium">Niższy — do zdjęć poziomych</option>
                </select>
              </Field>
            </>
          )}
          {(config.hero.layout === "fullbleed" ||
            config.hero.layout === "editorial" ||
            config.hero.layout === "cover") && (
            <Field label="Kadrowanie zdjęcia">
              <select
                value={config.hero.imagePosition ?? "center"}
                onChange={(e) =>
                  patch("hero", { imagePosition: e.target.value as HomeConfig["hero"]["imagePosition"] })
                }
                style={inputStyle}
              >
                <option value="top">Góra — gdy ważna jest głowa / góra kadru</option>
                <option value="center">Środek</option>
                <option value="bottom">Dół</option>
              </select>
            </Field>
          )}
          <Field label="Zdjęcie w hero (opcjonalne)">
            <div className="flex items-start gap-3">
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                style={{ background: "oklch(95% 0.008 260)", border: "1.5px dashed oklch(80% 0 0)" }}
              >
                {config.hero.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={config.hero.image} alt="hero" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-center px-1" style={{ color: "oklch(55% 0 0)" }}>
                    Brak
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-[11px] mb-2" style={{ color: "oklch(45% 0 0)" }}>
                  Dwie kolumny: 800×800 px. Na całą szerokość / pas: zdjęcie poziome lub z
                  sesji, min. 2000 px szerokości. Pamiętaj o „Zapisz zmiany”.
                </p>
                <div className="flex items-center gap-3">
                  <ImageUpload
                    label={config.hero.image ? "Zmień zdjęcie" : "Wgraj zdjęcie"}
                    onUploaded={(urls) => urls[0] && patch("hero", { image: urls[0] })}
                  />
                  {config.hero.image && (
                    <button
                      type="button"
                      onClick={() => patch("hero", { image: "" })}
                      className="text-[11px] font-medium underline-offset-2 hover:underline"
                      style={{ color: "oklch(45% 0.18 20)" }}
                    >
                      Usuń
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Field>
          <Field label="Nadtytuł (eyebrow)">
            <input
              value={config.hero.eyebrow}
              onChange={(e) => patch("hero", { eyebrow: e.target.value })}
              placeholder="np. Kolekcja 2026"
              style={inputStyle}
              {...focusProps}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nagłówek — linia 1">
              <input
                value={config.hero.headline}
                onChange={(e) => patch("hero", { headline: e.target.value })}
                style={inputStyle}
                {...focusProps}
              />
            </Field>
            <Field label="Nagłówek — linia 2 (wyróżniona)">
              <input
                value={config.hero.headlineSub}
                onChange={(e) => patch("hero", { headlineSub: e.target.value })}
                style={inputStyle}
                {...focusProps}
              />
            </Field>
          </div>
          <Field label="Opis pod nagłówkiem">
            <textarea
              value={config.hero.description}
              onChange={(e) => patch("hero", { description: e.target.value })}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
              {...focusProps}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Przycisk główny">
              <input
                value={config.hero.ctaPrimary}
                onChange={(e) => patch("hero", { ctaPrimary: e.target.value })}
                style={inputStyle}
                {...focusProps}
              />
            </Field>
            <Field label="Przycisk drugorzędny">
              <input
                value={config.hero.ctaSecondary}
                onChange={(e) => patch("hero", { ctaSecondary: e.target.value })}
                style={inputStyle}
                {...focusProps}
              />
            </Field>
          </div>
          <Field label="Social proof (np. liczba klientów)">
            <input
              value={config.hero.socialProof}
              onChange={(e) => patch("hero", { socialProof: e.target.value })}
              placeholder="np. Ponad 1 000 zadowolonych klientów"
              style={inputStyle}
              {...focusProps}
            />
          </Field>
        </div>
      </Accordion>

      {/* Products section */}
      <Accordion title="Sekcja Produkty" open={!!open.products} onToggle={() => toggle("products")}>
        <div className="mb-4">
          <Toggle
            checked={config.products.showHeading !== false}
            onChange={(v) => patch("products", { showHeading: v })}
            label="Pokaż nagłówek nad produktami"
          />
          <p className="text-[11px] mt-2" style={{ color: "oklch(60% 0 0)" }}>
            Bez nagłówka zostaje sama siatka produktów — spokojniej, gdy nad nią jest lookbook.
          </p>
        </div>
        <div className="space-y-0">
          <Field label="Nadtytuł (eyebrow)">
            <input
              value={config.products.eyebrow}
              onChange={(e) => patch("products", { eyebrow: e.target.value })}
              style={inputStyle}
              {...focusProps}
            />
          </Field>
          <Field label="Nagłówek sekcji">
            <input
              value={config.products.headline}
              onChange={(e) => patch("products", { headline: e.target.value })}
              style={inputStyle}
              {...focusProps}
            />
          </Field>
          <Field label="Pod-nagłówek">
            <input
              value={config.products.subheadline}
              onChange={(e) => patch("products", { subheadline: e.target.value })}
              style={inputStyle}
              {...focusProps}
            />
          </Field>
        </div>
      </Accordion>

      {/* Benefits */}
      <Accordion title="Sekcja Korzyści" open={!!open.benefits} onToggle={() => toggle("benefits")}>
        <div className="mb-4 space-y-3">
          <Field label="Gdzie pokazać">
            <select
              value={config.benefits.placement ?? "home"}
              onChange={(e) =>
                patch("benefits", { placement: e.target.value as HomeConfig["benefits"]["placement"] })
              }
              style={inputStyle}
            >
              <option value="home">Na stronie głównej</option>
              <option value="about">Na stronie „O nas”</option>
              <option value="both">Na obu</option>
              <option value="hidden">Nigdzie (ukryta)</option>
            </select>
          </Field>
          <Toggle
            checked={config.benefits.showIcons !== false}
            onChange={(v) => patch("benefits", { showIcons: v })}
            label="Pokaż ikony przy korzyściach"
          />
          <p className="text-[11px] mt-2" style={{ color: "oklch(60% 0 0)" }}>
            Ikony dobierają się po kolejności, nie po treści. Po wyłączeniu punkt składa się
            z tytułu, cienkiej kreski i opisu — spokojniej przy autorskich tekstach.
          </p>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nadtytuł (eyebrow)">
              <input
                value={config.benefits.eyebrow}
                onChange={(e) => patch("benefits", { eyebrow: e.target.value })}
                style={inputStyle}
                {...focusProps}
              />
            </Field>
            <Field label="Nagłówek sekcji">
              <input
                value={config.benefits.headline}
                onChange={(e) => patch("benefits", { headline: e.target.value })}
                style={inputStyle}
                {...focusProps}
              />
            </Field>
          </div>
          <ItemListEditor
            items={config.benefits.items}
            onChange={(items) => patch("benefits", { items })}
            addLabel="Dodaj korzyść"
          />
        </div>
      </Accordion>

      {/* Guarantee */}
      <Accordion title="Gwarancja satysfakcji" open={!!open.guarantee} onToggle={() => toggle("guarantee")}>
        <div className="mb-4 space-y-3">
          <Toggle
            checked={config.guarantee.visible !== false}
            onChange={(v) => patch("guarantee", { visible: v })}
            label="Pokaż sekcję na stronie głównej"
          />
          <Toggle
            checked={config.guarantee.showIcons !== false}
            onChange={(v) => patch("guarantee", { showIcons: v })}
            label="Pokaż ikony"
          />
          <Toggle
            checked={config.guarantee.tone === "light"}
            onChange={(v) => patch("guarantee", { tone: v ? "light" : "dark" })}
            label="Jasne tło zamiast czarnego pasa"
          />
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nagłówek">
              <input
                value={config.guarantee.headline}
                onChange={(e) => patch("guarantee", { headline: e.target.value })}
                style={inputStyle}
                {...focusProps}
              />
            </Field>
            <Field label="Pod-nagłówek">
              <input
                value={config.guarantee.subheadline}
                onChange={(e) => patch("guarantee", { subheadline: e.target.value })}
                style={inputStyle}
                {...focusProps}
              />
            </Field>
          </div>
          <Field label="Układ">
            <select
              value={config.guarantee.layout ?? "section"}
              onChange={(e) =>
                patch("guarantee", { layout: e.target.value as HomeConfig["guarantee"]["layout"] })
              }
              style={inputStyle}
            >
              <option value="section">Osobna sekcja z nagłówkiem</option>
              <option value="strip">Wąski pasek z małymi ikonami nad stopką</option>
            </select>
            <p className="text-[11px] mt-1.5" style={{ color: "oklch(60% 0 0)" }}>
              Pasek nie pokazuje nagłówka — same punkty, jedna linia każdy, zlewa się ze stopką.
            </p>
          </Field>
          <ItemListEditor
            items={config.guarantee.items}
            onChange={(items) => patch("guarantee", { items: items as HomeConfig["guarantee"]["items"] })}
            addLabel="Dodaj punkt gwarancji"
            iconOptions={GUARANTEE_ICONS}
          />
        </div>
      </Accordion>

      {/* Lookbook */}
      <Accordion title="Lookbook (kadry z sesji)" open={!!open.lookbook} onToggle={() => toggle("lookbook")}>
        <div className="space-y-3">
          <Toggle
            checked={config.lookbook?.visible !== false && (config.lookbook?.items?.length ?? 0) > 0}
            onChange={(v) =>
              patch2("lookbook", { visible: v, items: config.lookbook?.items ?? [] })
            }
            label="Pokaż lookbook na stronie głównej"
          />
          <Field label="Układ">
            <select
              value={config.lookbook?.layout ?? "pairs"}
              onChange={(e) =>
                patch2("lookbook", {
                  layout: e.target.value as "pairs" | "wide" | "stagger" | "marquee",
                  items: config.lookbook?.items ?? [],
                })
              }
              style={inputStyle}
            >
              <option value="pairs">Po dwa kadry w rzędzie</option>
              <option value="wide">Jeden szeroki kadr w rzędzie</option>
              <option value="stagger">Dwie kolumny z przesunięciem</option>
              <option value="marquee">Pas płynący w lewo</option>
            </select>
          </Field>
          <LookbookEditor
            items={config.lookbook?.items ?? []}
            onChange={(items) => patch2("lookbook", { items })}
          />
          <p className="text-[11px]" style={{ color: "oklch(60% 0 0)" }}>
            Kadry pionowe z sesji wyglądają najlepiej. Dwa pierwsze układy idą pełną
            szerokością okna i chcą parzystej liczby kadrów. Układ z przesunięciem ma
            marginesy i przyjmuje dowolną liczbę kadrów. Pas płynący w lewo mieści ich
            najwięcej i zajmuje najmniej strony — zatrzymuje się, gdy ktoś na niego
            najedzie. Film leci w pętli, bez dźwięku, a zdjęcie kadru zostaje plakatem
            na czas wczytywania.
          </p>
        </div>
      </Accordion>

      {/* Opinie */}
      <Accordion title="Sekcja Opinie" open={!!open.reviews} onToggle={() => toggle("reviews")}>
        <div className="space-y-3">
          <Toggle
            checked={config.reviews.visible !== false}
            onChange={(v) => patch("reviews", { visible: v })}
            label="Pokaż sekcję z opiniami klientów"
          />
          <p className="text-[11px]" style={{ color: "oklch(60% 0 0)" }}>
            Sekcja i tak nie pokaże się, dopóki nie ma ani jednej opinii ani logotypu
            prasowego — pusty sklep nie wyświetla gwiazdek na podstawie zera opinii.
            Wyłącznik przydaje się, gdy opinie już są, a mimo to nie chcesz ich pokazywać.
          </p>
        </div>
      </Accordion>

      {/* Newsletter popup */}
      <Accordion title="Popup newslettera" open={!!open.popup} onToggle={() => toggle("popup")}>
        <div className="space-y-3">
          <Toggle
            checked={config.popup.enabled}
            onChange={(v) => patch("popup", { enabled: v })}
            label="Pokazuj popup z zapisem do newslettera"
          />
          {config.popup.enabled && (
            <>
              <Field label="Po ilu sekundach pokazać">
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={config.popup.delaySeconds}
                  onChange={(e) =>
                    patch("popup", { delaySeconds: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  style={{ ...inputStyle, width: "8rem" }}
                  {...focusProps}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tytuł">
                  <input
                    value={config.popup.title}
                    onChange={(e) => patch("popup", { title: e.target.value })}
                    style={inputStyle}
                    {...focusProps}
                  />
                </Field>
                <Field label="Tekst przycisku">
                  <input
                    value={config.popup.buttonLabel}
                    onChange={(e) => patch("popup", { buttonLabel: e.target.value })}
                    style={inputStyle}
                    {...focusProps}
                  />
                </Field>
              </div>
              <Field label="Opis (np. zachęta / rabat)">
                <textarea
                  value={config.popup.description}
                  onChange={(e) => patch("popup", { description: e.target.value })}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                  {...focusProps}
                />
              </Field>
            </>
          )}
        </div>
      </Accordion>
    </div>
  );
}
