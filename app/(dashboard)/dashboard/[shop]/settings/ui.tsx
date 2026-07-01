"use client";

import React from "react";

/** Shared panel-token palette so every settings section repaints with the
 *  „Motyw" (light / dark / system) setting. */
export const P = {
  bg: "var(--panel-bg)",
  surface: "var(--panel-surface)",
  surface2: "var(--panel-surface-2)",
  ink: "var(--panel-ink)",
  muted: "var(--panel-ink-muted)",
  faint: "var(--panel-ink-faint)",
  border: "var(--panel-border)",
  borderStrong: "var(--panel-border-strong)",
  accent: "var(--panel-accent)",
  accentSoft: "var(--panel-accent-soft)",
};

export function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-6">
      <h1
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-display)", color: P.ink }}
      >
        {title}
      </h1>
      {desc && (
        <p className="text-sm mt-1" style={{ color: P.muted }}>
          {desc}
        </p>
      )}
    </div>
  );
}

export function Card({
  title,
  desc,
  children,
}: {
  title?: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5 mb-5"
      style={{ background: P.surface, border: `1px solid ${P.border}` }}
    >
      {title && (
        <h2
          className="text-sm font-semibold"
          style={{ fontFamily: "var(--font-display)", color: P.ink }}
        >
          {title}
        </h2>
      )}
      {desc && (
        <p className="text-xs mt-1 mb-3" style={{ color: P.faint }}>
          {desc}
        </p>
      )}
      <div className={title && !desc ? "mt-4" : ""}>{children}</div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-4 last:mb-0">
      <span className="block text-xs font-medium mb-1.5" style={{ color: P.muted }}>
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-[11px] mt-1.5" style={{ color: P.faint }}>
          {hint}
        </span>
      )}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={"w-full text-sm outline-none rounded-[10px] " + (props.className ?? "")}
      style={{
        border: `1.5px solid ${P.borderStrong}`,
        borderRadius: "10px",
        padding: "10px 12px",
        fontSize: "13px",
        color: P.ink,
        background: P.surface,
        fontFamily: "var(--font-body)",
        ...props.style,
      }}
      onFocus={(e) => {
        e.target.style.borderColor = P.accent;
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.target.style.borderColor = P.borderStrong;
        props.onBlur?.(e);
      }}
    />
  );
}

export function ReadonlyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm" style={{ color: P.muted }}>
        {label}
      </span>
      <span
        className="text-sm font-semibold text-right break-all"
        style={{ color: P.ink, fontFamily: mono ? "var(--font-mono)" : undefined }}
      >
        {value}
      </span>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <div>
        <p className="text-sm font-medium" style={{ color: P.ink }}>
          {label}
        </p>
        {desc && (
          <p className="text-[11px] mt-0.5" style={{ color: P.faint }}>
            {desc}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="relative shrink-0 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={
          {
            width: 44,
            height: 24,
            background: checked ? P.accent : "var(--panel-toggle-off)",
            border: checked ? `1px solid ${P.accent}` : "1px solid var(--panel-knob-border)",
            "--tw-ring-color": P.accent,
            "--tw-ring-offset-color": P.surface,
          } as React.CSSProperties
        }
      >
        <span
          className="absolute rounded-full transition-transform"
          style={{
            width: 18,
            height: 18,
            top: 2,
            left: 2,
            background: "var(--panel-knob)",
            border: "1px solid var(--panel-knob-border)",
            transform: checked ? "translateX(20px)" : "none",
            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
          }}
        />
      </button>
    </div>
  );
}

/** Plan-gated placeholder card (własna domena / zespół / płatny plan). */
export function LockedCard({
  icon,
  title,
  children,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  cta?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: P.surface, border: `1px solid ${P.border}` }}
    >
      <div className="flex items-start gap-3.5">
        <div
          className="shrink-0 flex items-center justify-center rounded-xl"
          style={{ width: 40, height: 40, background: P.surface2, color: P.muted }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold" style={{ color: P.ink, fontFamily: "var(--font-display)" }}>
            {title}
          </h3>
          <div className="text-sm mt-1 leading-relaxed" style={{ color: P.muted }}>
            {children}
          </div>
          {cta && <div className="mt-4">{cta}</div>}
        </div>
      </div>
    </div>
  );
}

export function SoonBadge() {
  return (
    <span
      className="inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
      style={{ background: P.accentSoft, color: P.accent }}
    >
      Wkrótce
    </span>
  );
}

export type SaveState = "idle" | "saving" | "saved" | "error";

export function SaveButton({
  state,
  onClick,
  disabled,
  idleLabel = "Zapisz zmiany",
}: {
  state: SaveState;
  onClick: () => void;
  disabled?: boolean;
  idleLabel?: string;
}) {
  const label =
    state === "saving" ? "Zapisywanie…"
    : state === "saved" ? "Zapisano!"
    : state === "error" ? "Błąd — spróbuj ponownie"
    : idleLabel;
  const bg =
    state === "saved" ? "oklch(52% 0.20 158)"
    : state === "error" ? "oklch(50% 0.20 20)"
    : P.accent;
  return (
    <button
      onClick={onClick}
      disabled={disabled || state === "saving"}
      className="text-sm font-semibold px-4 py-2.5 rounded-full transition-all disabled:opacity-50"
      style={{ background: bg, color: "#fff" }}
    >
      {label}
    </button>
  );
}
