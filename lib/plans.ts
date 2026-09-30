/**
 * Plany platformy i ich limity. `users.plan` przechowuje id planu;
 * egzekwowanie odbywa się w API (limit liczy się per sklep właściciela).
 */

export const PLANS = {
  free: { label: "Free", maxProducts: 10, customDomain: false },
  starter: { label: "Starter", maxProducts: 100, customDomain: true },
  pro: { label: "Pro", maxProducts: Number.POSITIVE_INFINITY, customDomain: true },
} as const;

export type PlanId = keyof typeof PLANS;

export const PLAN_IDS = Object.keys(PLANS) as PlanId[];

export function planLimits(plan: string | null | undefined) {
  return PLANS[(plan ?? "free") as PlanId] ?? PLANS.free;
}

/** Czy plan pozwala podpiąć własną domenę (Starter i wyższe). */
export function planAllowsCustomDomain(plan: string | null | undefined): boolean {
  return planLimits(plan).customDomain;
}
