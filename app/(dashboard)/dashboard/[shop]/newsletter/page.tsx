import Link from "next/link";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { Mail } from "lucide-react";

export default async function NewsletterPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  let subscribers: (typeof newsletterSubscribers.$inferSelect)[] = [];

  try {
    const access = await getShopAccess(shopSlug);
    if (access) {
      subscribers = await db
        .select()
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.shopId, access.shopId))
        .orderBy(desc(newsletterSubscribers.createdAt));
    }
  } catch {
    // DB not configured yet — render empty state
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-display)", color: "var(--panel-ink)" }}
        >
          Newsletter
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--panel-ink-muted)" }}>
          {subscribers.length === 1
            ? "1 subskrybent"
            : `${subscribers.length} subskrybentów`}{" "}
          — zapisy z popupu na stronie sklepu
        </p>
      </div>

      <div
        className="rounded-2xl overflow-hidden mb-5"
        style={{ border: "1px solid var(--panel-border)", background: "var(--panel-surface)" }}
      >
        {subscribers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
            <Mail className="w-10 h-10" style={{ color: "var(--panel-border-strong)" }} strokeWidth={1} />
            <p className="text-sm" style={{ color: "var(--panel-ink-muted)" }}>
              Jeszcze nikt się nie zapisał. Włącz popup newslettera w{" "}
              <Link
                href={`/dashboard/${shopSlug}/home`}
                className="underline underline-offset-2 font-medium"
                style={{ color: "var(--panel-primary)" }}
              >
                edytorze strony głównej
              </Link>
              , aby zbierać adresy.
            </p>
          </div>
        ) : (
          <>
            <div
              className="grid text-[11px] font-semibold tracking-wide uppercase px-5 py-3"
              style={{
                gridTemplateColumns: "2fr 1fr",
                color: "var(--panel-ink-muted)",
                borderBottom: "1px solid var(--panel-border)",
                background: "var(--panel-surface-2)",
              }}
            >
              <span>E-mail</span>
              <span>Data zapisu</span>
            </div>
            {subscribers.map((s, i) => (
              <div
                key={s.id}
                className="grid items-center px-5 py-3"
                style={{
                  gridTemplateColumns: "2fr 1fr",
                  borderBottom: i < subscribers.length - 1 ? "1px solid var(--panel-surface-hover)" : "none",
                }}
              >
                <span className="text-xs font-medium truncate" style={{ color: "var(--panel-ink)" }}>
                  {s.email}
                </span>
                <span className="text-xs" style={{ color: "var(--panel-ink-muted)" }}>
                  {s.createdAt.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      {subscribers.length > 0 && (
        <p className="text-xs" style={{ color: "var(--panel-ink-muted)" }}>
          Wysyłka kampanii pojawi się wkrótce — na razie możesz skopiować adresy do swojego
          narzędzia mailingowego.
        </p>
      )}
    </div>
  );
}
