import { db } from "@/lib/db";
import { products, shops, users } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import type { Product } from "./ProductsTable";
import ProductsTable from "./ProductsTable";

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  let initialProducts: Product[] = [];

  try {
    const { userId: clerkId } = await auth();
    if (clerkId) {
      const user = await db.query.users.findFirst({
        where: eq(users.clerkId, clerkId),
      });
      if (user) {
        const shop = await db.query.shops.findFirst({
          where: and(eq(shops.slug, shopSlug), eq(shops.ownerId, user.id)),
        });
        if (shop) {
          const rows = await db
            .select({
              id: products.id,
              name: products.name,
              category: products.category,
              price: products.price,
              visible: products.visible,
              badge: products.badge,
              stock: products.stock,
              images: products.images,
            })
            .from(products)
            .where(eq(products.shopId, shop.id))
            .orderBy(asc(products.sortOrder), asc(products.createdAt));

          initialProducts = rows.map((r) => ({
            id: r.id,
            name: r.name,
            category: r.category ?? "",
            price: r.price,
            visible: r.visible,
            badge: r.badge ?? undefined,
            stock: r.stock,
            image: ((r.images as string[]) ?? [])[0],
          }));
        }
      }
    }
  } catch {
    // DB not configured yet — render empty table
  }

  return <ProductsTable shopSlug={shopSlug} products={initialProducts} />;
}
