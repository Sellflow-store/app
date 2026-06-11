"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Globe, Power } from "lucide-react";

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

interface Props {
  shopSlug: string;
  initialName: string;
  initialActive: boolean;
  storeUrl: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function SettingsForm({ shopSlug, initialName, initialActive, storeUrl }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [active, setActive] = useState(initialActive);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [toggling, setToggling] = useState(false);

  async function patchShop(body: { name?: string; active?: boolean }): Promise<boolean> {
    const res = await fetch(`/api/shops/${shopSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  }

  async function handleSaveName() {
    if (!name.trim()) return;
    setSaveState("saving");
    try {
      setSaveState((await patchShop({ name: name.trim() })) ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
    setTimeout(() => setSaveState("idle"), 2500);
  }

  async function handleToggleActive() {
    const next = !active;
    if (
      !next &&
      !confirm(
        "Wyłączyć sklep? Klienci zobaczą stronę „nie znaleziono” do czasu ponownego włączenia. Panel pozostanie dostępny."
      )
    ) {
      return;
    }
    setToggling(true);
    try {
      if (await patchShop({ active: next })) {
        setActive(next);
        router.refresh();
      }
    } finally {
      setToggling(false);
    }
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
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
          >
            Ustawienia
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
            Podstawowe ustawienia Twojego sklepu
          </p>
        </div>
        <button
          onClick={handleSaveName}
          disabled={saveState === "saving"}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full transition-all disabled:opacity-60"
          style={{ background: buttonBg, color: "#fff" }}
        >
          <Save className="w-3.5 h-3.5" strokeWidth={2} />
          {buttonLabel}
        </button>
      </div>

      <SectionCard title="Nazwa sklepu">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Nazwa sklepu"
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "oklch(22% 0.24 270)")}
          onBlur={(e) => (e.target.style.borderColor = "oklch(88% 0 0)")}
        />
        <p className="text-[11px] mt-2" style={{ color: "oklch(60% 0 0)" }}>
          Używana w mailach do klientów i jako domyślna nazwa w sklepie.
        </p>
      </SectionCard>

      <SectionCard title="Adres sklepu">
        <div className="flex items-center gap-2.5">
          <Globe className="w-4 h-4 shrink-0" style={{ color: "oklch(45% 0 0)" }} strokeWidth={1.5} />
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium underline underline-offset-2"
            style={{ color: "oklch(22% 0.24 270)" }}
          >
            {storeUrl}
          </a>
        </div>
        <p className="text-[11px] mt-2" style={{ color: "oklch(60% 0 0)" }}>
          Adres jest stały. Podpięcie własnej domeny pojawi się wkrótce.
        </p>
      </SectionCard>

      <SectionCard title="Status sklepu">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium" style={{ color: active ? "oklch(35% 0.16 145)" : "oklch(45% 0.15 20)" }}>
              {active ? "Sklep jest włączony" : "Sklep jest wyłączony"}
            </p>
            <p className="text-[11px] mt-1" style={{ color: "oklch(55% 0 0)" }}>
              {active
                ? "Klienci widzą sklep i mogą składać zamówienia."
                : "Klienci widzą stronę „nie znaleziono”. Panel działa normalnie."}
            </p>
          </div>
          <button
            onClick={handleToggleActive}
            disabled={toggling}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all disabled:opacity-50 shrink-0"
            style={
              active
                ? { color: "oklch(45% 0.18 20)", border: "1.5px solid oklch(50% 0.20 20 / 0.3)" }
                : { background: "oklch(52% 0.20 158)", color: "#fff" }
            }
          >
            <Power className="w-3.5 h-3.5" strokeWidth={1.5} />
            {toggling ? "Przełączanie…" : active ? "Wyłącz sklep" : "Włącz sklep"}
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
