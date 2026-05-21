import { ShieldCheck, RotateCcw, Truck, LucideIcon } from "lucide-react";
import type { GuaranteeConfig } from "@/types/shop";

const ICONS: LucideIcon[] = [ShieldCheck, RotateCcw, Truck];

interface Props {
  config: GuaranteeConfig;
}

export default function GuaranteeSection({ config }: Props) {
  return (
    <section className="py-20 lg:py-24 bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{config.headline}</h2>
          <p className="mt-3 text-neutral-400 font-light max-w-md mx-auto">{config.subheadline}</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8 lg:gap-12">
          {config.items.map((item, i) => {
            const Icon = ICONS[i] ?? ShieldCheck;
            return (
              <div key={i} className="text-center">
                <div className="mx-auto w-12 h-12 rounded-xl border border-neutral-700 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-neutral-300" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold tracking-wide mb-2">{item.title}</h3>
                <p className="text-sm text-neutral-400 font-light leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
