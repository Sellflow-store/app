"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

/**
 * Link nawigacyjny z dwoma stanami, które mówią to samo językiem jednej kreski
 * pod etykietą:
 *
 *   • bieżąca strona — kreska stoi, spokojna, w kolorze tekstu
 *   • kliknięty, strona się ładuje — ta sama kreska przebiega od lewej
 *
 * Powód: między kliknięciem a pojawieniem się nowej strony nic się nie działo,
 * więc nie było wiadomo, czy kliknięcie w ogóle doszło. Ruch pojawia się
 * dopiero wtedy, gdy faktycznie coś trwa.
 */

/** Kreska pod etykietą. MUSI być wewnątrz <Link> — stąd bierze stan ładowania. */
function Rule({ active }: { active: boolean }) {
  const { pending } = useLinkStatus();
  if (!pending && !active) return null;
  return (
    <span
      aria-hidden="true"
      className={`nav-rule${pending ? " nav-rule--pending" : ""}`}
    />
  );
}

/** Bieżąca strona: dokładne trafienie albo cokolwiek pod tą ścieżką. */
export function isActivePath(pathname: string, href: string): boolean {
  const clean = href.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const here = pathname.replace(/\/+$/, "") || "/";
  if (clean === "/") return here === "/";
  return here === clean || here.startsWith(`${clean}/`);
}

interface Props {
  href: string;
  children: React.ReactNode;
  /** Klasy etykiety. Stan bieżącej strony dokłada `activeClassName`. */
  className?: string;
  activeClassName?: string;
  onClick?: () => void;
}

export default function NavLink({
  href,
  children,
  className = "",
  activeClassName = "",
  onClick,
}: Props) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`nav-link ${className} ${active ? activeClassName : ""}`}
    >
      {children}
      <Rule active={active} />
    </Link>
  );
}

/**
 * Wariant dla linków-ikon (koszyk), gdzie nie ma etykiety, pod którą dałoby się
 * podłożyć kreskę. Zamiast niej ikona przygasa na czas ładowania — ten sam
 * komunikat, środkami dostępnymi w tym miejscu.
 */
export function IconNavLink({
  href,
  children,
  className = "",
  "aria-label": ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <Link href={href} aria-label={ariaLabel} className={className}>
      <IconPending>{children}</IconPending>
    </Link>
  );
}

function IconPending({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return <span className={pending ? "nav-icon--pending" : undefined}>{children}</span>;
}
