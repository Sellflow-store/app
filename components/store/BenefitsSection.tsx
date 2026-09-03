import { Feather, Shield, Recycle, Zap, LucideIcon } from "lucide-react";
import type { BenefitsConfig } from "@/types/shop";

const ICONS: LucideIcon[] = [Feather, Shield, Recycle, Zap];

interface Props {
  config: BenefitsConfig;
}

/**
 * Siatka dopasowana do LICZBY kafelków. Wcześniej było zawsze `lg:grid-cols-4`,
 * więc trzy korzyści zajmowały trzy z czterech kolumn i cała sekcja wyglądała
 * na zepchniętą w lewo, mimo wyśrodkowanego nagłówka. Klasy muszą być pełnymi
 * literałami — Tailwind nie widzi klas sklejanych w locie.
 */
const GRID_BY_COUNT: Record<number, string> = {
  1: "grid-cols-1 max-w-sm",
  2: "grid-cols-1 sm:grid-cols-2 max-w-3xl",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl",
};
const GRID_DEFAULT = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

export default function BenefitsSection({ config }: Props) {
  const items = config.items ?? [];
  if (items.length === 0) return null;
  const grid = GRID_BY_COUNT[items.length] ?? GRID_DEFAULT;
  // Ikony są przypisywane po pozycji (ICONS[i]), więc przy autorskich treściach
  // trafiają losowo — „tarcza" przy tekście o świetle. Tryb redakcyjny je zdejmuje
  // i opiera punkt na samej typografii.
  const showIcons = config.showIcons !== false;

  return (
    <section id="o-produkcie" className="py-20 lg:py-28 bg-paper-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          {config.eyebrow && (
            <span className="text-xs tracking-[0.25em] uppercase text-ink-2/70 font-medium">
              {config.eyebrow}
            </span>
          )}
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-ink tracking-tight">
            {config.headline}
          </h2>
        </div>
        <div className={`grid ${grid} gap-8 mx-auto`}>
          {items.map((benefit, i) => {
            if (!showIcons) {
              return (
                <div key={i}>
                  <h3 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-ink">
                    {benefit.title}
                  </h3>
                  <div className="h-px bg-rule my-4" />
                  <p className="text-sm text-ink-2 font-light leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              );
            }
            const Icon = ICONS[i] ?? Feather;
            return (
              <div key={i} className="text-center group">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-paper border border-rule flex items-center justify-center mb-5 group-hover:border-rule transition-colors duration-300">
                  <Icon className="w-5 h-5 text-ink-2" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold text-ink tracking-wide mb-2">{benefit.title}</h3>
                <p className="text-sm text-ink-2 font-light leading-relaxed">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
