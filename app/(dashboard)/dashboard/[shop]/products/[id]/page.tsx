import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import ProductForm, {
  type ProductFormData,
  type ProductType,
  type DigitalKind,
  type ServiceMode,
} from "../ProductForm";

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

  const f = (product.fulfillment ?? {}) as Record<string, unknown>;

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
    specs: (product.specs as { key: string; value: string }[]) ?? [],
    type: (product.type as ProductType) ?? "physical",
    digitalKind: (f.kind as DigitalKind) ?? "file",
    digitalFileUrl: (f.fileUrl as string) ?? "",
    digitalUrl: (f.url as string) ?? "",
    digitalLicenseKeys: (f.licenseKeys as string) ?? "",
    digitalInstructions: (f.instructions as string) ?? "",
    serviceDuration: (f.duration as string) ?? "",
    serviceMode: (f.mode as ServiceMode) ?? "online",
    serviceDetails: (f.details as string) ?? "",
  };

  return <ProductForm shopSlug={shop} productId={product.id} initial={initial} />;
}
