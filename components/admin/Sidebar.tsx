"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { X, ChevronRight, ChevronDown, Eye } from "lucide-react";
import { NAV_SECTIONS, type NavSection } from "./nav";

interface SidebarProps {
  shopSlug: string;
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ shopSlug, mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const base = `/dashboard/${shopSlug}`;

  // Preview opens the live storefront on the shop's own subdomain
  // ({slug}.sell-flow.store), not app.sell-flow.store/{slug}. On localhost
  // there's no wildcard, so fall back to the path form the dev server serves.
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "sell-flow.store";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const isLocal = appUrl.includes("localhost") || appUrl.includes("127.0.0.1");
  const previewUrl = isLocal ? `/${shopSlug}` : `https://${shopSlug}.${appDomain}`;

  // Stan zwinięcia żyje w layoucie panelu, więc przetrwa przejścia między
  // stronami; po przeładowaniu wraca do domyślnego (zwinięte).
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function isActive(slug: string) {
    if (slug === "") return pathname === base; // Pulpit — only the bare base
    return pathname === `${base}/${slug}` || pathname.startsWith(`${base}/${slug}/`);
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Kierunek A redesignu: granat Sellflow, gęsta lista, aqua jako znacznik
          aktywnej strony. Kolory wyłącznie z tokenów --panel-sidebar-* (tryb
          ciemny podmienia je sam), hover w CSS zamiast w JS. */}
      <aside
        className={[
          "fixed top-0 left-0 h-full w-64 z-50 flex flex-col transition-transform duration-300",
          "bg-[var(--panel-sidebar)] text-[var(--panel-sidebar-ink)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:h-screen",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-14 shrink-0 border-b border-[var(--panel-sidebar-border)]">
          <Link
            href={base}
            className="flex items-center gap-2.5 text-white"
          >
            <span aria-hidden className="w-2.5 h-2.5 rounded-[3px] bg-[var(--panel-aqua)]" />
            <span className="flex flex-col leading-none">
              <span className="text-[15px] font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                Sellflow
              </span>
              <span className="text-[10.5px] font-medium tracking-[0.08em] uppercase mt-1 text-[var(--panel-sidebar-muted)]">
                admin
              </span>
            </span>
          </Link>
          <button
            onClick={onClose}
            aria-label="Zamknij menu"
            className="lg:hidden text-[var(--panel-sidebar-muted)] hover:text-white"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Nav */}
        <nav aria-label="Menu panelu" className="flex-1 overflow-y-auto py-4 px-3">
          {NAV_SECTIONS.map((section) => {
            const hasActive = section.items.some((i) => isActive(i.slug));
            // Zwinięta grupa rozwija się sama, gdy otwarta strona jest w środku.
            const open = !section.collapsible || hasActive || !!expanded[section.id];
            return (
              <div key={section.id} className={section.title ? "mb-4" : "mb-3"}>
                {section.title && (
                  section.collapsible ? (
                    <button
                      type="button"
                      onClick={() => setExpanded((e) => ({ ...e, [section.id]: !open }))}
                      aria-expanded={open}
                      disabled={hasActive}
                      className="w-full flex items-center gap-1.5 text-[11px] font-semibold px-2.5 mb-1.5 text-[var(--panel-sidebar-muted)] hover:text-white disabled:hover:text-[var(--panel-sidebar-muted)] transition-colors"
                    >
                      <span className="flex-1 text-left">{section.title}</span>
                      {!open && <span className="font-normal tabular-nums">{section.items.length}</span>}
                      <ChevronDown
                        className={["w-3.5 h-3.5 transition-transform", open ? "" : "-rotate-90"].join(" ")}
                        strokeWidth={2}
                      />
                    </button>
                  ) : (
                    <p className="text-[11px] font-semibold px-2.5 mb-1.5 text-[var(--panel-sidebar-muted)]">
                      {section.title}
                    </p>
                  )
                )}

                {open && section.items.map((item) => (
                  <NavLink
                    key={item.slug || "pulpit"}
                    item={item}
                    href={item.slug ? `${base}/${item.slug}` : base}
                    active={isActive(item.slug)}
                    onClick={onClose}
                  />
                ))}
              </div>
            );
          })}
        </nav>

        {/* Preview link */}
        <div className="px-3 py-3 shrink-0 border-t border-[var(--panel-sidebar-border)]">
          <Link
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-2.5 h-8 rounded-md text-[13px] transition-colors text-[var(--panel-sidebar-ink)] hover:bg-[var(--panel-sidebar-hover)] hover:text-white"
          >
            <Eye className="w-4 h-4 text-[var(--panel-sidebar-muted)]" strokeWidth={1.75} />
            Podgląd sklepu
          </Link>
        </div>
      </aside>
    </>
  );
}

function NavLink({
  item, href, active, onClick,
}: { item: NavSection["items"][number]; href: string; active: boolean; onClick: () => void }) {
  const { label, icon: Icon, hint } = item;
  return (
    <Link
      href={href}
      onClick={onClick}
      title={hint}
      aria-current={active ? "page" : undefined}
      className={[
        "group w-full flex items-center gap-3 px-2.5 py-1.5 min-h-8 rounded-md text-[13.5px] leading-snug transition-colors mb-px",
        active
          ? "bg-[var(--panel-sidebar-active)] text-white font-semibold"
          : "text-[var(--panel-sidebar-ink)] hover:bg-[var(--panel-sidebar-hover)] hover:text-white",
      ].join(" ")}
    >
      <Icon
        className={[
          "w-4 h-4 shrink-0 transition-colors",
          active ? "text-[var(--panel-aqua)]" : "text-[var(--panel-sidebar-muted)] group-hover:text-white",
        ].join(" ")}
        strokeWidth={1.75}
      />
      <span className="flex-1">{label}</span>
      {active && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" strokeWidth={2.25} />}
    </Link>
  );
}
