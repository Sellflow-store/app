import ProductForm from "../ProductForm";
import { productAssistConfigured } from "@/lib/ai-product-assist";
import { shopDisplay } from "@/lib/shop-display";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  const display = await shopDisplay(shop);
  return (
    <ProductForm
      shopSlug={shop}
      shopName={display.name}
      shopHost={display.host}
      aiEnabled={productAssistConfigured()}
    />
  );
}
