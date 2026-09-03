import {
  ShieldCheck,
  RotateCcw,
  Truck,
  Package,
  Mail,
  Leaf,
  Lock,
  Clock,
  Star,
  LucideIcon,
} from "lucide-react";
import type { GuaranteeConfig, GuaranteeIcon } from "@/types/shop";

/** Ikona po pozycji — tak działały istniejące sklepy, zostaje jako fallback. */
const BY_POSITION: LucideIcon[] = [ShieldCheck, RotateCcw, Truck];

/** Ikona po znaczeniu — merchant wybiera w panelu, więc pasuje do treści. */
const BY_KEY: Record<GuaranteeIcon, LucideIcon> = {
  shield: ShieldCheck,
  return: RotateCcw,
  package: Package,
  truck: Truck,
  mail: Mail,
  leaf: Leaf,
  lock: Lock,
  clock: Clock,
  star: Star,
};

function iconFor(key: GuaranteeIcon | undefined, index: number): LucideIcon {
  return (key && BY_KEY[key]) || BY_POSITION[index] || ShieldCheck;
}

interface Props {
  config: GuaranteeConfig;
}

export default function GuaranteeSection({ config }: Props) {
  const items = config.items ?? [];
  if (config.visible === false || items.length === 0) return null;

  if (config.layout === "strip") return <Strip config={config} />;

  // Ciemny pas to domyślny wygląd (tak wyglądają istniejące sklepy). Marki
  // minimalistyczne dostają wariant na papierze — ciężki czarny blok potrafi
  // rozbić spokojny układ strony.
  const dark = config.tone !== "light";
  const showIcons = config.showIcons !== false;

  const section = dark ? "bg-ink text-on-ink" : "bg-paper text-ink";
  const sub = dark ? "text-on-ink/70" : "text-ink-2";
  const rule = dark ? "bg-on-ink/20" : "bg-rule";
  const title = dark ? "text-on-ink" : "text-ink";
  const desc = dark ? "text-on-ink/70" : "text-ink-2";
  const iconBox = dark ? "border-on-ink/25" : "border-rule";
  const icon = dark ? "text-on-ink/70" : "text-ink-2";

  return (
    <section className={`py-20 lg:py-24 ${section}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{config.headline}</h2>
          {config.subheadline && (
            <p className={`mt-3 font-light max-w-md mx-auto ${sub}`}>{config.subheadline}</p>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {items.map((item, i) => {
            if (!showIcons) {
              return (
                <div key={i}>
                  <h3 className={`text-[11px] font-semibold tracking-[0.18em] uppercase ${title}`}>
                    {item.title}
                  </h3>
                  <div className={`h-px my-4 ${rule}`} />
                  <p className={`text-sm font-light leading-relaxed ${desc}`}>{item.description}</p>
                </div>
              );
            }
            const Icon = iconFor(item.icon, i);
            return (
              <div key={i} className="text-center">
                <div
                  className={`mx-auto w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${iconBox}`}
                >
                  <Icon className={`w-5 h-5 ${icon}`} strokeWidth={1.5} />
                </div>
                <h3 className={`text-sm font-semibold tracking-wide mb-2 ${title}`}>{item.title}</h3>
                <p className={`text-sm font-light leading-relaxed ${desc}`}>{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * Wąski pasek zaufania tuż nad stopką: mała ikona + tytuł + jedno zdanie,
 * bez nagłówka. Tło i hairline takie jak w stopce, więc oba bloki czytają się
 * jako jeden — zamiast trzeciej „dużej sekcji" pod rząd.
 */
function Strip({ config }: { config: GuaranteeConfig }) {
  const items = config.items ?? [];
  const cols =
    items.length === 1
      ? "sm:grid-cols-1 max-w-md"
      : items.length === 2
        ? "sm:grid-cols-2 max-w-3xl"
        : items.length === 4
          ? "sm:grid-cols-2 lg:grid-cols-4"
          : "sm:grid-cols-3";
  return (
    <section aria-label="Zasady zakupów" className="bg-paper-2 border-t border-rule">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <ul className={`grid grid-cols-1 ${cols} gap-6 lg:gap-10 mx-auto`}>
          {items.map((item, i) => {
            const Icon = iconFor(item.icon, i);
            return (
              <li key={i} className="flex items-start gap-3">
                <Icon className="w-4 h-4 mt-0.5 shrink-0 text-ink" strokeWidth={1.5} />
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-ink">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="mt-1 text-xs text-ink-2 font-light leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
