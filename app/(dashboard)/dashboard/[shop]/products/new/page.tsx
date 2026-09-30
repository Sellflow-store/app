import ProductForm from "../ProductForm";
import { productAssistConfigured } from "@/lib/ai-product-assist";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  return <ProductForm shopSlug={shop} aiEnabled={productAssistConfigured()} />;
}
