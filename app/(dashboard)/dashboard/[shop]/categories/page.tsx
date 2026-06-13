import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import CategoriesManager, { type CategoryRow } from "./CategoriesManager";

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

  return <CategoriesManager shopSlug={shopSlug} categories={rows} uncategorized={uncategorized} />;
}
