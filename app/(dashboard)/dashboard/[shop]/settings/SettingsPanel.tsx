"use client";

import { useState } from "react";
import {
  UserCircle, Receipt, Palette, Store, Globe, Users, Sparkles, ShieldCheck, Paintbrush,
} from "lucide-react";
import type { AccountConfig, IntegrationsConfig, ComplianceConfig, BrandingConfig } from "@/types/shop";
import { P } from "./ui";
import AccountSection from "./sections/AccountSection";
import PlanSection from "./sections/PlanSection";
import ThemeSection from "./sections/ThemeSection";
import ShopSection from "./sections/ShopSection";
import StyleSection from "./sections/StyleSection";
import DomainSection from "./sections/DomainSection";
import TeamSection from "./sections/TeamSection";
import IntegrationsSection from "./sections/IntegrationsSection";
import ComplianceSection from "./sections/ComplianceSection";

type SectionId =
  | "account" | "plan" | "theme"
  | "shop" | "style" | "domain" | "team" | "integrations" | "compliance";

const NAV: { group: string; items: { id: SectionId; label: string; icon: React.ElementType }[] }[] = [
  {
    group: "Konto",
    items: [
      { id: "account", label: "Konto i firma", icon: UserCircle },
      { id: "plan", label: "Plan", icon: Receipt },
      { id: "theme", label: "Motyw", icon: Palette },
    ],
  },
  {
    group: "Sklep",
    items: [
      { id: "shop", label: "Sklep", icon: Store },
      { id: "style", label: "Styl sklepu", icon: Paintbrush },
      { id: "domain", label: "Własna domena", icon: Globe },
      { id: "team", label: "Zespół", icon: Users },
      { id: "integrations", label: "Integracje", icon: Sparkles },
      { id: "compliance", label: "Zgodność", icon: ShieldCheck },
    ],
  },
];

interface Props {
  shopSlug: string;
  accountEmail: string;
  userId: string;
  plan: string;
  account: AccountConfig;
  shopName: string;
  active: boolean;
  storeUrl: string;
  integrations: IntegrationsConfig;
  compliance: ComplianceConfig;
  branding: BrandingConfig;
  brand: Record<string, unknown> | null;
}

export default function SettingsPanel(props: Props) {
  const [active, setActive] = useState<SectionId>("account");

  return (
    <div className="flex flex-col lg:flex-row min-h-full">
      {/* submenu */}
      <aside
        className="lg:w-64 shrink-0 lg:border-r"
        style={{ borderColor: P.border, background: P.surface }}
      >
        <div className="p-5 lg:sticky lg:top-0">
          <h1 className="text-lg font-bold mb-5" style={{ color: P.ink, fontFamily: "var(--font-display)" }}>
            Ustawienia
          </h1>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto">
            {NAV.map((section) => (
              <div key={section.group} className="lg:mb-3">
                <p className="hidden lg:block text-[10px] font-bold uppercase tracking-wider px-2 mb-1.5"
                  style={{ color: P.faint }}>
                  {section.group}
                </p>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const on = active === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActive(item.id)}
                      className="flex items-center gap-2.5 w-full text-left rounded-lg px-2.5 py-2 text-sm font-medium transition-colors whitespace-nowrap"
                      style={{
                        background: on ? P.accentSoft : "transparent",
                        color: on ? P.accent : P.muted,
                      }}
                    >
                      <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* content */}
      <div className="flex-1 min-w-0 p-6 lg:p-8">
        <div className="max-w-2xl">
          {active === "account" && (
            <AccountSection shopSlug={props.shopSlug} accountEmail={props.accountEmail} userId={props.userId} initial={props.account} />
          )}
          {active === "plan" && <PlanSection currentPlan={props.plan} />}
          {active === "theme" && <ThemeSection />}
          {active === "shop" && (
            <ShopSection shopSlug={props.shopSlug} initialName={props.shopName} initialActive={props.active} />
          )}
          {active === "style" && (
            <StyleSection shopSlug={props.shopSlug} initialBranding={props.branding} initialBrand={props.brand} />
          )}
          {active === "domain" && <DomainSection storeUrl={props.storeUrl} />}
          {active === "team" && <TeamSection ownerEmail={props.accountEmail} />}
          {active === "integrations" && <IntegrationsSection shopSlug={props.shopSlug} initial={props.integrations} />}
          {active === "compliance" && <ComplianceSection shopSlug={props.shopSlug} initial={props.compliance} />}
        </div>
      </div>
    </div>
  );
}
