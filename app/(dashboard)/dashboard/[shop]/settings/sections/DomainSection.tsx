"use client";

import { Globe, Lock } from "lucide-react";
import { SectionTitle, LockedCard, P } from "../ui";

export default function DomainSection({ storeUrl }: { storeUrl: string }) {
  const host = storeUrl.replace(/^https?:\/\//, "");
  return (
    <div>
      <SectionTitle
        title="Własna domena"
        desc="Podłącz własną domenę (np. mojsklep.pl), aby klienci widzieli Twój sklep pod własnym adresem. Certyfikat SSL (https) ustawiamy automatycznie po weryfikacji DNS."
      />

      <div className="rounded-2xl p-5 mb-5 flex items-center gap-2.5"
        style={{ background: P.surface, border: `1px solid ${P.border}` }}>
        <Globe className="w-4 h-4 shrink-0" style={{ color: P.muted }} strokeWidth={1.5} />
        <a href={storeUrl} target="_blank" rel="noopener noreferrer"
          className="text-sm font-medium underline underline-offset-2" style={{ color: P.accent }}>
          {host}
        </a>
      </div>

      <LockedCard
        icon={<Lock className="w-5 h-5" strokeWidth={1.75} />}
        title="Dostępne w planie Pro"
        cta={
          <button disabled className="text-sm font-semibold px-4 py-2.5 rounded-full opacity-60 cursor-not-allowed"
            style={{ background: P.ink, color: P.bg }}>
            Zmień plan
          </button>
        }
      >
        Własna domena (.pl / .com) będzie częścią planu Pro i wyższych. Na obecnym planie Twój sklep
        działa pod stałym adresem <strong>{host}</strong>.
      </LockedCard>
    </div>
  );
}
