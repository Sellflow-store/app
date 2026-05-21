import { Star } from "lucide-react";
import type { ReviewsConfig } from "@/types/shop";

interface Props {
  config: ReviewsConfig;
}

export default function ReviewsSection({ config }: Props) {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.25em] uppercase text-neutral-400 font-medium mb-8">Pisali o nas</p>
          <div className="flex items-center justify-center gap-8 sm:gap-14 flex-wrap">
            {config.media.map((name) => (
              <span key={name} className="text-xl sm:text-2xl font-bold text-neutral-200 tracking-tight">
                {name}
              </span>
            ))}
          </div>
        </div>

        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-4 h-4 fill-neutral-900 text-neutral-900" />
            ))}
          </div>
          <p className="text-sm text-neutral-500">
            <span className="font-semibold text-neutral-900">{config.rating}</span> na podstawie{" "}
            <span className="font-semibold text-neutral-900">{config.reviewCount}</span> opinii
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {config.items.map((review, i) => (
            <div
              key={i}
              className="border border-neutral-100 rounded-2xl p-6 hover:border-neutral-300 transition-colors duration-300"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${s < review.rating ? "fill-neutral-900 text-neutral-900" : "text-neutral-200"}`}
                  />
                ))}
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed font-light mb-4">„{review.text}"</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-900">{review.name}</span>
                <span className="text-[10px] text-neutral-400">{review.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
