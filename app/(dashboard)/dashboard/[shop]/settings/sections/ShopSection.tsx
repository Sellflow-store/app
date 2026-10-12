"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Power } from "lucide-react";
import { SLUG_RE } from "@/lib/slug-rules";
import { SectionTitle, Card, Field, TextInput, SaveButton, P, type SaveState } from "../ui";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "sell-flow.store";

interface Props {
  shopSlug: string;
  initialName: string;
  initialActive: boolean;
}

export default function ShopSection({ shopSlug, initialName, initialActive }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [active, setActive] = useState(initialActive);
  const [state, setState] = useState<SaveState>("idle");
  const [toggling, setToggling] = useState(false);
  const [slug, setSlug] = useState(shopSlug);
  const [slugState, setSlugState] = useState<SaveState>("idle");
  const [slugError, setSlugError] = useState<{ error: string; suggestion: string | null } | null>(null);
  const slugValid = SLUG_RE.test(slug);

  async function patch(body: { name?: string; active?: boolean }) {
    const res = await fetch(`/api/shops/${shopSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  }

  async function saveName() {
    if (!name.trim()) return;
    setState("saving");
    setState((await patch({ name: name.trim() })) ? "saved" : "error");
    setTimeout(() => setState("idle"), 2500);
  }

  async function saveSlug() {
    if (
      !confirm(
        `Zmienić adres sklepu na ${slug}.${APP_DOMAIN}?

Stary adres ${shopSlug}.${APP_DOMAIN} dalej działa i przenosi klientów na nowy. Linki w wysłanych mailach, płatności Tpay i Furgonetka działają bez zmian.`
      )
    )
      return;
    setSlugState("saving");
    setSlugError(null);
    const res = await fetch(`/api/shops/${shopSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    const data = (await res.json().catch(() => null)) as { slug?: string; error?: string; suggestion?: string | null } | null;
    if (res.ok && data?.slug) {
      // The panel's URL holds the slug: reload under the new one.
      window.location.assign(`/dashboard/${data.slug}/settings`);
      return;
    }
    setSlugState("error");
    setSlugError({ error: data?.error ?? "Nie udało się zmienić adresu.", suggestion: data?.suggestion ?? null });
    setTimeout(() => setSlugState("idle"), 2500);
  }

  async function toggleActive() {
    const next = !active;
    if (
      !next &&
      !confirm(
        "Wyłączyć sklep? Klienci zobaczą stronę „nie znaleziono” do czasu ponownego włączenia. Panel pozostanie dostępny."
      )
    )
      return;
    setToggling(true);
    try {
      if (await patch({ active: next })) {
        setActive(next);
        router.refresh();
      }
    } finally {
      setToggling(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <SectionTitle title="Sklep" desc="Nazwa i widoczność Twojego sklepu." />
        <SaveButton state={state} onClick={saveName} />
      </div>

      <Card title="Nazwa sklepu">
        <Field label="Nazwa" hint="Klienci widzą ją w sklepie, w regulaminie, w mailach i przy płatności. To ta sama nazwa co w „Logo i kolorystyka”.">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} aria-label="Nazwa sklepu" />
        </Field>
      </Card>

      <Card title="Adres sklepu">
        <Field
          label="Adres"
          hint="Adres sklepu w Sellflow, inny w każdym sklepie. Zmiana nazwy go nie zmienia. Po zmianie adresu stary dalej działa i przenosi klientów na nowy. Własna domena, jeśli ją masz, zostaje bez zmian."
        >
          <div className="flex items-center gap-1.5">
            <TextInput
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value.trim().toLowerCase());
                setSlugError(null);
              }}
              aria-label="Adres sklepu"
              spellCheck={false}
              autoCapitalize="none"
              className="min-w-0"
            />
            <span className="text-[13px] shrink-0" style={{ color: P.muted }}>
              .{APP_DOMAIN}
            </span>
          </div>
        </Field>
        {slug !== shopSlug && !slugValid && (
          <p className="text-[12px] mb-3" style={{ color: "var(--panel-danger-ink)" }}>
            Od 3 do 50 znaków: małe litery bez polskich znaków, cyfry i myślniki. Bez myślnika na początku i na końcu.
          </p>
        )}
        {slugError && (
          <p className="text-[12px] mb-3" style={{ color: "var(--panel-danger-ink)" }}>
            {slugError.error}
            {slugError.suggestion && (
              <>
                {" "}Wolny jest{" "}
                <button
                  type="button"
                  className="underline font-semibold"
                  onClick={() => {
                    setSlug(slugError.suggestion!);
                    setSlugError(null);
                  }}
                >
                  {slugError.suggestion}
                </button>
                .
              </>
            )}
          </p>
        )}
        <SaveButton
          state={slugState}
          onClick={saveSlug}
          disabled={slug === shopSlug || !slugValid}
          idleLabel="Zmień adres"
        />
      </Card>

      <Card title="Status sklepu">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium"
              style={{ color: active ? "var(--panel-success)" : "var(--panel-danger)" }}>
              {active ? "Sklep jest włączony" : "Sklep jest wyłączony"}
            </p>
            <p className="text-[11px] mt-1" style={{ color: P.faint }}>
              {active
                ? "Klienci widzą sklep i mogą składać zamówienia."
                : "Klienci widzą stronę „nie znaleziono”. Panel działa normalnie."}
            </p>
          </div>
          <button
            onClick={toggleActive}
            disabled={toggling}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all disabled:opacity-50 shrink-0"
            style={
              active
                ? { color: "var(--panel-danger)", border: "1.5px solid var(--panel-danger-border)" }
                : { background: "var(--panel-success)", color: "var(--panel-surface)" }
            }
          >
            <Power className="w-3.5 h-3.5" strokeWidth={1.5} />
            {toggling ? "Przełączanie…" : active ? "Wyłącz sklep" : "Włącz sklep"}
          </button>
        </div>
      </Card>
    </div>
  );
}
