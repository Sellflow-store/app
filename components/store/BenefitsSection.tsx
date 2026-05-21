import { Feather, Shield, Recycle, Zap, LucideIcon } from "lucide-react";
import type { BenefitsConfig } from "@/types/shop";

const ICONS: LucideIcon[] = [Feather, Shield, Recycle, Zap];

interface Props {
  config: BenefitsConfig;
}

export default function BenefitsSection({ config }: Props) {
  return (
    <section id="o-produkcie" className="py-20 lg:py-28 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-xs tracking-[0.25em] uppercase text-neutral-400 font-medium">
            {config.eyebrow}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
            {config.headline}
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {config.items.map((benefit, i) => {
            const Icon = ICONS[i] ?? Feather;
            return (
              <div key={i} className="text-center group">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center mb-5 group-hover:border-neutral-400 transition-colors duration-300">
                  <Icon className="w-5 h-5 text-neutral-700" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 tracking-wide mb-2">{benefit.title}</h3>
                <p className="text-sm text-neutral-500 font-light leading-relaxed">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
