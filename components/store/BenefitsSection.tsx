import { Feather, Shield, Recycle, Zap, LucideIcon } from "lucide-react";
import type { BenefitsConfig } from "@/types/shop";

const ICONS: LucideIcon[] = [Feather, Shield, Recycle, Zap];

interface Props {
  config: BenefitsConfig;
}

export default function BenefitsSection({ config }: Props) {
  return (
    <section id="o-produkcie" className="py-20 lg:py-28 bg-paper-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-xs tracking-[0.25em] uppercase text-ink-2/70 font-medium">
            {config.eyebrow}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-ink tracking-tight">
            {config.headline}
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {config.items.map((benefit, i) => {
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
