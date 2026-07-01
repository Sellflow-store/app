"use client";

import { Users, Lock } from "lucide-react";
import { SectionTitle, LockedCard, P, ReadonlyRow, Card } from "../ui";

export default function TeamSection({ ownerEmail }: { ownerEmail: string }) {
  return (
    <div>
      <SectionTitle title="Zespół" desc="Zaproś współpracowników do zarządzania sklepem." />

      <Card title="Członkowie">
        <ReadonlyRow label={ownerEmail} value="Właściciel" />
      </Card>

      <LockedCard
        icon={<div className="relative"><Users className="w-5 h-5" strokeWidth={1.75} /><Lock className="w-3 h-3 absolute -bottom-1 -right-1" strokeWidth={2} /></div>}
        title="Dostępne w planie Pro"
        cta={
          <button disabled className="text-sm font-semibold px-4 py-2.5 rounded-full opacity-60 cursor-not-allowed"
            style={{ background: P.ink, color: P.bg }}>
            Zmień plan
          </button>
        }
      >
        Zapraszanie zespołu (role: administrator, edytor) będzie częścią planu Pro. Na obecnym planie
        pełny dostęp do panelu ma tylko właściciel konta.
      </LockedCard>
    </div>
  );
}
