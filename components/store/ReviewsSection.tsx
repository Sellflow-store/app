import { Star } from "lucide-react";
import type { ReviewsConfig } from "@/types/shop";

interface Props {
  config: ReviewsConfig;
}

export default function ReviewsSection({ config }: Props) {
  return (
    <section className="py-20 lg:py-28 bg-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.25em] uppercase text-ink-2/70 font-medium mb-8">Pisali o nas</p>
          <div className="flex items-center justify-center gap-8 sm:gap-14 flex-wrap">
            {config.media.map((name) => (
              <span key={name} className="text-xl sm:text-2xl font-bold text-ink-2/40 tracking-tight">
                {name}
              </span>
            ))}
          </div>
        </div>

        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-4 h-4 fill-ink text-ink" />
            ))}
          </div>
          <p className="text-sm text-ink-2">
            <span className="font-semibold text-ink">{config.rating}</span> na podstawie{" "}
            <span className="font-semibold text-ink">{config.reviewCount}</span> opinii
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {config.items.map((review, i) => (
            <div
              key={i}
              className="border border-rule rounded-card p-6 hover:border-rule transition-colors duration-300"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${s < review.rating ? "fill-ink text-ink" : "text-ink-2/40"}`}
                  />
                ))}
              </div>
              <p className="text-sm text-ink-2 leading-relaxed font-light mb-4">„{review.text}"</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink">{review.name}</span>
                <span className="text-[10px] text-ink-2/70">{review.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
