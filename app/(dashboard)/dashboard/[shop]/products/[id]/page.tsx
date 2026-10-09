import { materialFromSpecs, normalizeAttributes } from "@/lib/product-attributes";
import { shopDisplay } from "@/lib/shop-display";
import { productAssistConfigured } from "@/lib/ai-product-assist";
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
  const dim = (product.dimensions ?? {}) as {
    length?: number | null;
    width?: number | null;
    height?: number | null;
  };

  const display = await shopDisplay(shop);
  const attrs = normalizeAttributes(product.attributes);
  const initial: ProductFormData = {
    name: product.name,
    slug: product.slug,
    category: product.category ?? "",
    price: product.priceOnRequest ? "" : product.price,
    oldPrice: product.oldPrice ?? "",
    priceOnRequest: product.priceOnRequest,
    badge: product.badge ?? "",
    visible: product.visible,
    shortDesc: product.shortDesc ?? "",
    description: product.description ?? "",
    images: (product.images as string[]) ?? [],
    imageMeta: attrs.imageMeta ?? {},
    stock: product.stock != null ? String(product.stock) : "",
    weight: product.weightGrams != null ? String(product.weightGrams) : "",
    length: dim.length != null ? String(dim.length) : "",
    width: dim.width != null ? String(dim.width) : "",
    height: dim.height != null ? String(dim.height) : "",
    shippingMin: attrs.shippingTime ? String(attrs.shippingTime.min) : "",
    shippingMax: attrs.shippingTime ? String(attrs.shippingTime.max) : "",
    seo: {
      title: attrs.seo?.title ?? "",
      description: attrs.seo?.description ?? "",
      focus: attrs.seo?.focus ?? "",
      phrases: attrs.seo?.phrases ?? [],
    },
    sizes: ((product.sizes as string[]) ?? []).join(", "),
    specs: (product.specs as { key: string; value: string }[]) ?? [],
    gtin: attrs.gtin ?? "",
    mpn: attrs.mpn ?? "",
    // Materiał wpisany kiedyś jako parametr trafia od razu do nowego pola.
    material: attrs.material ?? materialFromSpecs(product.specs as { key: string; value: string }[]) ?? "",
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

  return (
    <ProductForm
      shopSlug={shop}
      shopName={display.name}
      shopHost={display.host}
      productId={product.id}
      initial={initial}
      aiEnabled={productAssistConfigured()}
    />
  );
}
