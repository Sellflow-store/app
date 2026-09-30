import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import type { Product } from "./ProductsTable";
import ProductsTable from "./ProductsTable";
import { materialFromSpecs, normalizeAttributes, readinessGaps, readinessScore } from "@/lib/product-attributes";

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  let initialProducts: Product[] = [];

  const access = await getShopAccess(shopSlug);
  if (access) {
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        category: products.category,
        price: products.price,
        priceOnRequest: products.priceOnRequest,
        visible: products.visible,
        badge: products.badge,
        stock: products.stock,
        images: products.images,
        type: products.type,
        shortDesc: products.shortDesc,
        description: products.description,
        weightGrams: products.weightGrams,
        attributes: products.attributes,
        specs: products.specs,
      })
      .from(products)
      .where(eq(products.shopId, access.shopId))
      .orderBy(asc(products.sortOrder), asc(products.createdAt));

    initialProducts = rows.map((r) => {
      const attrs = normalizeAttributes(r.attributes);
      const readiness = {
        type: (r.type as Product["type"]) ?? "physical",
        priceOnRequest: r.priceOnRequest,
        images: (r.images as string[]) ?? [],
        shortDesc: r.shortDesc,
        description: r.description,
        category: r.category,
        weightGrams: r.weightGrams,
        attributes: { ...attrs, material: attrs.material ?? materialFromSpecs(r.specs as { key: string; value: string }[]) },
      };
      return {
      id: r.id,
      name: r.name,
      category: r.category ?? "",
      price: r.price,
      priceOnRequest: r.priceOnRequest,
      visible: r.visible,
      badge: r.badge ?? undefined,
      stock: r.stock,
      image: ((r.images as string[]) ?? [])[0],
      type: r.type as Product["type"],
      aiScore: readinessScore(readiness),
      aiGap: readinessGaps(readiness)[0]?.label,
      };
    });
  }

  return <ProductsTable shopSlug={shopSlug} products={initialProducts} />;
}
