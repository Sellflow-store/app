import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { checkEnv, checkSchema, dbLatency, deployInfo, type SchemaIssue } from "@/lib/ops-system";

const ISSUE_LABEL: Record<SchemaIssue["kind"], string> = {
  missing_table: "Brak tabeli",
  missing_column: "Brak kolumny",
  missing_index: "Brak indeksu",
};

/**
 * Stan systemu: baza kontra kod, zmienne środowiskowe, wersja na produkcji.
 * Sprawdzaj tu przed i po każdym mergu, który zmienia `lib/db/schema.ts`.
 */
export default async function OpsSystemPage() {
  const [schema, latency] = await Promise.all([checkSchema(), dbLatency()]);
  const env = checkEnv();
  const deploy = deployInfo();

  const missingRequired = env.filter((v) => v.required && !v.set);
  const schemaOk = schema.issues.length === 0;

  return (
    <div className="space-y-8 max-w-5xl">
      <header>
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-2"
          style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
        >
          Operator · system
        </p>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--brand-ink)" }}
        >
          Stan systemu
        </h1>
      </header>

      {/* ── Summary tiles ───────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Tile
          label="Baza kontra kod"
          ok={schemaOk}
          value={schemaOk ? "Zgodna" : `${schema.issues.length} ${schema.issues.length === 1 ? "problem" : "problemy"}`}
          hint={`${schema.tables} tabel · ${schema.columns} kolumn · ${schema.indexes} indeksów`}
        />
        <Tile
          label="Zmienne środowiskowe"
          ok={missingRequired.length === 0}
          value={missingRequired.length === 0 ? "Komplet" : `Brakuje ${missingRequired.length}`}
          hint={`${env.filter((v) => v.set).length} z ${env.length} ustawionych`}
        />
        <Tile
          label="Wersja"
          ok
          value={deploy.sha ? deploy.sha.slice(0, 7) : "lokalna"}
          hint={[deploy.env, deploy.branch, `baza ${latency} ms`].filter(Boolean).join(" · ")}
          mono
        />
      </section>

      {/* ── Schema ──────────────────────────────────────────────── */}
      <Panel
        title="Baza kontra kod"
        hint="lib/db/schema.ts porównane z bazą produkcyjną"
      >
        {schemaOk ? (
          <p className="px-5 py-6 text-sm" style={{ color: "var(--brand-ink-2)" }}>
            Każda tabela, kolumna i indeks z kodu istnieje w bazie.
          </p>
        ) : (
          <>
            <p
              className="px-5 py-4 text-sm"
              style={{ background: "var(--panel-danger-soft)", color: "var(--panel-danger-ink)" }}
            >
              Kod oczekuje elementów, których nie ma w bazie. Funkcje, które z nich korzystają, zwracają
              błąd. Uruchom brakującą migrację w Neon SQL Editor.
            </p>
            <ul>
              {schema.issues.map((i) => (
                <li
                  key={`${i.kind}:${i.table}:${i.name}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
                  style={{ borderTop: "1px solid var(--brand-rule)" }}
                >
                  <span style={{ color: "var(--panel-danger-ink)" }}>{ISSUE_LABEL[i.kind]}</span>
                  <code style={{ color: "var(--brand-ink)", fontFamily: "var(--font-mono)" }}>
                    {i.kind === "missing_table" ? i.table : `${i.table}.${i.name}`}
                  </code>
                </li>
              ))}
            </ul>
          </>
        )}
        {schema.extraColumns.length > 0 && (
          <p
            className="px-5 py-3 text-[12px]"
            style={{ borderTop: "1px solid var(--brand-rule)", color: "var(--brand-ink-2)" }}
          >
            Kolumny w bazie nieużywane przez kod (nie przeszkadzają):{" "}
            <span style={{ fontFamily: "var(--font-mono)" }}>
              {schema.extraColumns.map((c) => `${c.table}.${c.name}`).join(", ")}
            </span>
          </p>
        )}
      </Panel>

      {/* ── Env ─────────────────────────────────────────────────── */}
      <Panel title="Zmienne środowiskowe" hint="pokazujemy tylko, czy są ustawione, nigdy wartości">
        <ul>
          {env.map((v) => (
            <li
              key={v.name}
              className="grid grid-cols-[20px_1fr] sm:grid-cols-[20px_minmax(0,300px)_1fr] items-center gap-x-3 gap-y-0.5 px-5 py-2.5 text-sm"
              style={{ borderTop: "1px solid var(--brand-rule)" }}
            >
              {v.set ? (
                <CheckCircle2 className="w-4 h-4" style={{ color: "var(--brand-success)" }} strokeWidth={2} />
              ) : v.required ? (
                <XCircle className="w-4 h-4" style={{ color: "var(--panel-danger)" }} strokeWidth={2} />
              ) : (
                <AlertTriangle className="w-4 h-4" style={{ color: "var(--brand-ink-2)" }} strokeWidth={2} />
              )}
              <code
                className="text-[12px] truncate"
                style={{ color: "var(--brand-ink)", fontFamily: "var(--font-mono)" }}
              >
                {v.name}
              </code>
              <span className="text-[12px] col-start-2 sm:col-start-3" style={{ color: "var(--brand-ink-2)" }}>
                {v.purpose}
                {!v.set && (v.required ? " · brak, funkcja nie działa" : " · opcjonalna, nieustawiona")}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      {/* ── Deploy ──────────────────────────────────────────────── */}
      {deploy.sha && (
        <Panel title="Wdrożona wersja">
          <div className="px-5 py-4 text-sm space-y-1">
            <p style={{ color: "var(--brand-ink)" }}>{deploy.message}</p>
            <p className="text-[12px]" style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}>
              {deploy.sha} · {deploy.branch} · {deploy.env}
            </p>
          </div>
        </Panel>
      )}
    </div>
  );
}

function Tile({
  label,
  value,
  hint,
  ok,
  mono,
}: {
  label: string;
  value: string;
  hint: string;
  ok: boolean;
  mono?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: ok ? "var(--brand-paper)" : "var(--panel-danger-soft)",
        border: `1px solid ${ok ? "var(--brand-rule)" : "var(--panel-danger-border)"}`,
      }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-2"
        style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
      >
        {label}
      </p>
      <p
        className="text-2xl font-bold tabular-nums"
        style={{
          fontFamily: mono ? "var(--font-mono)" : "var(--font-display)",
          color: ok ? "var(--brand-ink)" : "var(--panel-danger-ink)",
        }}
      >
        {value}
      </p>
      <p className="text-xs mt-1" style={{ color: "var(--brand-ink-2)" }}>
        {hint}
      </p>
    </div>
  );
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--brand-paper)", border: "1px solid var(--brand-rule)" }}
    >
      <header className="flex flex-wrap items-baseline gap-x-2 px-5 py-4">
        <h2
          className="text-base font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--brand-ink)" }}
        >
          {title}
        </h2>
        {hint && (
          <span className="text-[11px]" style={{ color: "var(--brand-ink-2)" }}>
            {hint}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}
