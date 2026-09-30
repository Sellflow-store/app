"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, LayoutGrid, Store } from "lucide-react";

const ITEMS = [
  { href: "/ops", label: "Przegląd", icon: LayoutGrid, exact: true },
  { href: "/ops/shops", label: "Sklepy", icon: Store, exact: false },
  { href: "/ops/system", label: "Stan systemu", icon: Activity, exact: false },
];

/** Menu ops w tym samym stylu co menu panelu sklepu (granat, aqua na aktywnej). */
export default function OpsNav() {
  const pathname = usePathname();
  return (
    <>
      {ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={[
              "group flex items-center gap-3 px-2.5 h-9 rounded-md text-[13.5px] transition-colors",
              active
                ? "bg-[var(--panel-sidebar-active)] text-white font-semibold"
                : "text-[var(--panel-sidebar-ink)] hover:bg-[var(--panel-sidebar-hover)] hover:text-white",
            ].join(" ")}
          >
            <Icon
              className={[
                "w-4 h-4 shrink-0",
                active ? "text-[var(--panel-aqua)]" : "text-[var(--panel-sidebar-muted)] group-hover:text-white",
              ].join(" ")}
              strokeWidth={1.75}
            />
            {label}
          </Link>
        );
      })}
    </>
  );
}
