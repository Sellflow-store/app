"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, Check } from "lucide-react";
import { useStoreBase } from "./StoreBaseContext";

interface Props {
  shopSlug: string;
}

type State = "idle" | "sending" | "sent" | "error";

const inputClass =
  "w-full border border-rule rounded-input bg-paper px-4 py-3 text-sm text-ink " +
  "placeholder:text-ink-2/50 focus:border-ink focus:outline-none transition-colors";

/**
 * Prosty formularz kontaktowy. Nie ma tu własnych kolorów ani zaokrągleń —
 * wszystko idzie przez tokeny marki (`bg-paper`, `border-rule`, `text-ink`,
 * `rounded-input`, `bg-accent-brand`), więc formularz wygląda jak reszta
 * danego sklepu, a nie jak wstawka z innego świata.
 */
export default function ContactForm({ shopSlug }: Props) {
  const base = useStoreBase();
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", firma: "" });

  function patch(updates: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...updates }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setError(null);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Nie udało się wysłać wiadomości.");
        setState("error");
        return;
      }
      setState("sent");
    } catch {
      setError("Brak połączenia. Sprawdź internet i spróbuj ponownie.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="border border-rule rounded-2xl px-6 py-8 text-center">
        <div className="mx-auto w-10 h-10 rounded-full bg-ink text-on-ink flex items-center justify-center mb-4">
          <Check className="w-4 h-4" strokeWidth={2} />
        </div>
        <p className="text-sm font-medium text-ink mb-1">Wiadomość wysłana</p>
        <p className="text-sm text-ink-2 font-light">
          Dziękujemy. Odpowiemy na adres {form.email}, najszybciej jak się da.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="kf-name" className="block text-[11px] tracking-[0.2em] uppercase text-ink-2/70 mb-2">
            Imię
          </label>
          <input
            id="kf-name"
            name="name"
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            required
            autoComplete="given-name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="kf-email" className="block text-[11px] tracking-[0.2em] uppercase text-ink-2/70 mb-2">
            E-mail
          </label>
          <input
            id="kf-email"
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => patch({ email: e.target.value })}
            required
            autoComplete="email"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="kf-phone" className="block text-[11px] tracking-[0.2em] uppercase text-ink-2/70 mb-2">
          Telefon <span className="normal-case tracking-normal text-ink-2/50">— opcjonalnie</span>
        </label>
        <input
          id="kf-phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={(e) => patch({ phone: e.target.value })}
          autoComplete="tel"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="kf-message" className="block text-[11px] tracking-[0.2em] uppercase text-ink-2/70 mb-2">
          Wiadomość
        </label>
        <textarea
          id="kf-message"
          name="message"
          value={form.message}
          onChange={(e) => patch({ message: e.target.value })}
          required
          rows={6}
          maxLength={4000}
          placeholder="W czym możemy pomóc?"
          className={`${inputClass} resize-y min-h-[9rem]`}
        />
      </div>

      {/* Pułapka na boty — ukryta przed człowiekiem i przed czytnikiem ekranu.
          Automaty wypełniają wszystko, co znajdą w formularzu. */}
      <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label htmlFor="kf-firma">Nazwa firmy</label>
        <input
          id="kf-firma"
          name="firma"
          tabIndex={-1}
          autoComplete="off"
          value={form.firma}
          onChange={(e) => patch({ firma: e.target.value })}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-ink">
          {error}
        </p>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={state === "sending"}
          className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap bg-accent-brand text-on-accent font-semibold text-sm tracking-wide px-8 py-4 rounded-button hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          <Send className="w-4 h-4" strokeWidth={1.5} />
          {state === "sending" ? "Wysyłanie…" : "Wyślij wiadomość"}
        </button>
        <p className="text-xs text-ink-2/70 font-light leading-relaxed">
          Dane z formularza wykorzystamy wyłącznie do odpowiedzi na tę wiadomość.
          Szczegóły w{" "}
          <Link href={`${base}/prywatnosc`} className="underline underline-offset-2 hover:text-ink">
            polityce prywatności
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
