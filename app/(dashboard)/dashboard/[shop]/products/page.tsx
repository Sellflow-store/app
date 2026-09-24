import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import type { Product } from "./ProductsTable";
import ProductsTable from "./ProductsTable";

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
      })
      .from(products)
      .where(eq(products.shopId, access.shopId))
      .orderBy(asc(products.sortOrder), asc(products.createdAt));

    initialProducts = rows.map((r) => ({
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
    }));
  }

  return <ProductsTable shopSlug={shopSlug} products={initialProducts} />;
}
