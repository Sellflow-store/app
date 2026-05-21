"use client";

import { useState } from "react";

export default function WaitlistForm({ className }: { className?: string }) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <p className="text-[#E91E8C] text-sm font-medium">
        ✓ Gotowe! Damy Ci znać jako jednemu z pierwszych.
      </p>
    );
  }

  return (
    <form
      className={`flex flex-col sm:flex-row gap-3 ${className ?? ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <input
        type="email"
        required
        placeholder="Twój e-mail"
        className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/30 px-5 py-3.5 rounded-full text-sm focus:outline-none focus:border-[#E91E8C]/60 transition-colors"
      />
      <button
        type="submit"
        className="bg-[#E91E8C] hover:bg-[#d01878] text-white font-medium text-sm px-7 py-3.5 rounded-full transition-colors whitespace-nowrap"
      >
        Zapisz się na waitlistę
      </button>
    </form>
  );
}
