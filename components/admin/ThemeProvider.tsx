"use client";

import { createContext, useContext, useSyncExternalStore, useCallback } from "react";

export type ThemePref = "light" | "dark" | "system";
type Resolved = "light" | "dark";

const STORAGE_KEY = "sellflow-panel-theme";
const listeners = new Set<() => void>();
let prefCache: ThemePref | null = null;

function readPref(): ThemePref {
  if (typeof window === "undefined") return "system";
  if (prefCache) return prefCache;
  try {
    prefCache = (localStorage.getItem(STORAGE_KEY) as ThemePref | null) ?? "system";
  } catch {
    prefCache = "system";
  }
  return prefCache;
}

function writePref(t: ThemePref) {
  prefCache = t;
  try {
    localStorage.setItem(STORAGE_KEY, t);
  } catch {
    /* storage blocked — theme still applies for this tab */
  }
  listeners.forEach((n) => n());
}

/** Subscribe to preference changes AND OS colour-scheme changes (for „system"). */
function subscribe(notify: () => void) {
  listeners.add(notify);
  let mq: MediaQueryList | undefined;
  if (typeof window !== "undefined") {
    mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", notify);
  }
  return () => {
    listeners.delete(notify);
    mq?.removeEventListener("change", notify);
  };
}

function systemDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

interface ThemeCtx {
  theme: ThemePref;
  resolved: Resolved;
  setTheme: (t: ThemePref) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

/** Hook for panel components (e.g. the „Motyw" settings section). */
export function usePanelTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePanelTheme must be used inside <ThemeProvider>");
  return ctx;
}

/**
 * Scopes the panel colour scheme. The wrapper gets `.dark` when the resolved
 * theme is dark, so panel tokens (`--panel-*`) flip without touching the
 * storefront. Preference persists in localStorage and follows the OS in
 * „system" mode. Uses useSyncExternalStore so there's no setState-in-effect
 * and it stays SSR-safe.
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readPref, () => "system" as ThemePref);
  const resolved = useSyncExternalStore(
    subscribe,
    () => {
      const p = readPref();
      return p === "system" ? (systemDark() ? "dark" : "light") : p;
    },
    () => "light" as Resolved
  );
  const setTheme = useCallback((t: ThemePref) => writePref(t), []);

  return (
    <Ctx.Provider value={{ theme, resolved, setTheme }}>
      <div
        className={resolved === "dark" ? "dark" : undefined}
        style={{ colorScheme: resolved, background: "var(--panel-bg)", minHeight: "100%" }}
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}
