import Link from "next/link";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { Layers, Eye, EyeOff } from "lucide-react";

interface CategoryRow {
  name: string;
  total: number;
  visible: number;
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  let rows: CategoryRow[] = [];
  let uncategorized = 0;

  try {
    const access = await getShopAccess(shopSlug);
    if (access) {
      const shopProducts = await db
        .select({ category: products.category, visible: products.visible })
        .from(products)
        .where(eq(products.shopId, access.shopId));

      const agg = new Map<string, CategoryRow>();
      for (const p of shopProducts) {
        const name = p.category?.trim();
        if (!name) {
          uncategorized += 1;
          continue;
        }
        const existing = agg.get(name.toLowerCase()) ?? { name, total: 0, visible: 0 };
        existing.total += 1;
        if (p.visible) existing.visible += 1;
        agg.set(name.toLowerCase(), existing);
      }
      rows = [...agg.values()].sort((a, b) => b.total - a.total);
    }
  } catch {
    // DB not configured yet — render empty state
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
        >
          Kategorie
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
          Kategorie powstają z pola „Kategoria” w produktach — edytuj je w formularzu produktu
        </p>
      </div>

      <div
        className="rounded-2xl overflow-hidden mb-5"
        style={{ border: "1px solid oklch(90% 0 0)", background: "#fff" }}
      >
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Layers className="w-10 h-10" style={{ color: "oklch(80% 0 0)" }} strokeWidth={1} />
            <p className="text-sm" style={{ color: "oklch(55% 0 0)" }}>
              Brak kategorii — nadaj produktom kategorie w ich formularzach
            </p>
            <Link
              href={`/dashboard/${shopSlug}/products`}
              className="text-xs font-semibold px-4 py-2 rounded-full"
              style={{ background: "oklch(56% 0.30 335)", color: "#fff" }}
            >
              Przejdź do produktów
            </Link>
          </div>
        ) : (
          <>
            <div
              className="grid text-[11px] font-semibold tracking-wide uppercase px-5 py-3"
              style={{
                gridTemplateColumns: "2fr 1fr 1fr",
                color: "oklch(50% 0 0)",
                borderBottom: "1px solid oklch(92% 0 0)",
                background: "oklch(98% 0 0)",
              }}
            >
              <span>Kategoria</span>
              <span>Produkty</span>
              <span>Widoczne</span>
            </div>
            {rows.map((row, i) => (
              <div
                key={row.name}
                className="grid items-center px-5 py-3.5"
                style={{
                  gridTemplateColumns: "2fr 1fr 1fr",
                  borderBottom: i < rows.length - 1 ? "1px solid oklch(94% 0 0)" : "none",
                }}
              >
                <span className="text-xs font-medium" style={{ color: "oklch(15% 0 0)" }}>
                  {row.name}
                </span>
                <span className="text-xs tabular-nums" style={{ color: "oklch(25% 0 0)" }}>
                  {row.total}
                </span>
                <span className="flex items-center gap-1.5 text-xs tabular-nums" style={{ color: row.visible > 0 ? "oklch(40% 0.16 145)" : "oklch(55% 0 0)" }}>
                  {row.visible > 0 ? (
                    <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" strokeWidth={1.5} />
                  )}
                  {row.visible} z {row.total}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      {uncategorized > 0 && (
        <p className="text-xs" style={{ color: "oklch(50% 0 0)" }}>
          {uncategorized}{" "}
          {uncategorized === 1 ? "produkt nie ma" : "produkty(ów) nie ma"} przypisanej kategorii —{" "}
          <Link
            href={`/dashboard/${shopSlug}/products`}
            className="underline underline-offset-2 font-medium"
            style={{ color: "oklch(22% 0.24 270)" }}
          >
            uzupełnij w produktach
          </Link>
          .
        </p>
      )}
    </div>
  );
}
