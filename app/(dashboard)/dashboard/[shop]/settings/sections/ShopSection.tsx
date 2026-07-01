"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Power } from "lucide-react";
import { SectionTitle, Card, Field, TextInput, SaveButton, P, type SaveState } from "../ui";

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
        <Field label="Nazwa" hint="Używana w mailach do klientów i jako domyślna nazwa w sklepie.">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} aria-label="Nazwa sklepu" />
        </Field>
      </Card>

      <Card title="Status sklepu">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium"
              style={{ color: active ? "oklch(60% 0.16 145)" : "oklch(60% 0.15 20)" }}>
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
                ? { color: "oklch(60% 0.18 20)", border: "1.5px solid oklch(60% 0.20 20 / 0.35)" }
                : { background: "oklch(52% 0.20 158)", color: "#fff" }
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
