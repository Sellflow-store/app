"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  INITIAL_STATE,
  STORAGE_KEY,
  type Brand,
  type Business,
  type OnboardingState,
  type StylePresetId,
} from "@/lib/brand/types";
import { isStylePresetId } from "@/lib/brand/presets";

type Action =
  | { type: "business/patch"; patch: Partial<Business> }
  | { type: "brand/setTraits"; traits: string[] }
  | { type: "brand/setTone"; tone: string[] }
  | { type: "brand/setPreset"; preset: StylePresetId }
  | { type: "brand/patch"; patch: Partial<Brand> }
  | { type: "preview/seen" }
  | { type: "reset" }
  | { type: "hydrate"; state: OnboardingState };

function reducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case "business/patch":
      return { ...state, business: { ...state.business, ...action.patch } };
    case "brand/setTraits":
      return { ...state, brand: { ...state.brand, traits: action.traits } };
    case "brand/setTone":
      return { ...state, brand: { ...state.brand, tone: action.tone } };
    case "brand/setPreset":
      return { ...state, brand: { ...state.brand, preset: action.preset } };
    case "brand/patch":
      return { ...state, brand: { ...state.brand, ...action.patch } };
    case "preview/seen":
      return state.previewSeen ? state : { ...state, previewSeen: true };
    case "reset":
      return { ...INITIAL_STATE, brand: { ...INITIAL_STATE.brand } };
    case "hydrate":
      return action.state;
    default:
      return state;
  }
}

type Ctx = {
  state: OnboardingState;
  patchBusiness: (patch: Partial<Business>) => void;
  setTraits: (traits: string[]) => void;
  setTone: (tone: string[]) => void;
  setPreset: (preset: StylePresetId) => void;
  markPreviewSeen: () => void;
  reset: () => void;
};

const OnboardingCtx = createContext<Ctx | null>(null);

function loadFromStorage(): OnboardingState | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingState;
    return {
      business: { ...INITIAL_STATE.business, ...(parsed.business ?? {}) },
      brand: {
        ...INITIAL_STATE.brand,
        ...(parsed.brand ?? {}),
        preset: isStylePresetId(parsed.brand?.preset)
          ? parsed.brand.preset
          : INITIAL_STATE.brand.preset,
      },
      previewSeen: !!parsed.previewSeen,
    };
  } catch {
    return null;
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, (init) => loadFromStorage() ?? init);

  // Persist on every meaningful state change. Quota errors are non-fatal
  // for a draft — silently swallow.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const value: Ctx = useMemo(
    () => ({
      state,
      patchBusiness: (patch) => dispatch({ type: "business/patch", patch }),
      setTraits: (traits) => dispatch({ type: "brand/setTraits", traits }),
      setTone: (tone) => dispatch({ type: "brand/setTone", tone }),
      setPreset: (preset) => dispatch({ type: "brand/setPreset", preset }),
      markPreviewSeen: () => dispatch({ type: "preview/seen" }),
      reset: () => {
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
        dispatch({ type: "reset" });
      },
    }),
    [state],
  );

  return <OnboardingCtx.Provider value={value}>{children}</OnboardingCtx.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingCtx);
  if (!ctx) throw new Error("useOnboarding must be used inside <OnboardingProvider>");
  return ctx;
}

/** Single-field commit hook for blur-driven inputs. */
export function useBusinessField<K extends keyof Business>(key: K) {
  const { state, patchBusiness } = useOnboarding();
  const value = state.business[key];
  const commit = useCallback(
    (next: Business[K]) => patchBusiness({ [key]: next } as Partial<Business>),
    [key, patchBusiness],
  );
  return [value, commit] as const;
}
