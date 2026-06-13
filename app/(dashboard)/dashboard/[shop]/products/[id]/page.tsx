import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import ProductForm, { type ProductFormData } from "../ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ shop: string; id: string }>;
}) {
  const { shop, id } = await params;

  const access = await getShopAccess(shop);
  if (!access) notFound();

  // Invalid UUIDs make Postgres throw before the query can return "no rows"
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) notFound();

  const product = await db.query.products.findFirst({
    where: and(eq(products.id, id), eq(products.shopId, access.shopId)),
  });
  if (!product) notFound();

  const initial: ProductFormData = {
    name: product.name,
    category: product.category ?? "",
    price: product.price,
    oldPrice: product.oldPrice ?? "",
    badge: product.badge ?? "",
    visible: product.visible,
    shortDesc: product.shortDesc ?? "",
    description: product.description ?? "",
    images: (product.images as string[]) ?? [],
    stock: product.stock != null ? String(product.stock) : "",
  };

  return <ProductForm shopSlug={shop} productId={product.id} initial={initial} />;
}
