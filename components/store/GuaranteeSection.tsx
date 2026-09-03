import { ShieldCheck, RotateCcw, Truck, LucideIcon } from "lucide-react";
import type { GuaranteeConfig } from "@/types/shop";

const ICONS: LucideIcon[] = [ShieldCheck, RotateCcw, Truck];

interface Props {
  config: GuaranteeConfig;
}

export default function GuaranteeSection({ config }: Props) {
  const items = config.items ?? [];
  if (config.visible === false || items.length === 0) return null;

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
            const Icon = ICONS[i] ?? ShieldCheck;
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
