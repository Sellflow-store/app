"use client";

import { ArrowRight } from "lucide-react";

type Props = {
  onBack?: () => void;
  onSkip?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
};

export default function StepFooter({
  onBack,
  onSkip,
  onNext,
  nextLabel = "Dalej",
  nextDisabled,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-4 mt-8">
      <div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-[var(--brand-ink-2)] hover:text-[var(--brand-ink)] transition-colors"
          >
            ← Wróć
          </button>
        )}
      </div>
      <div className="flex items-center gap-4">
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-medium text-[var(--brand-ink-2)] hover:text-[var(--brand-ink)] transition-colors"
          >
            Pomiń
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "var(--brand-accent)",
            color: "var(--brand-paper)",
            fontFamily: "var(--font-body)",
          }}
        >
          {nextLabel}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
