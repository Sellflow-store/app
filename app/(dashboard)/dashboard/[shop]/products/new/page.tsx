import ProductForm from "../ProductForm";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  return <ProductForm shopSlug={shop} />;
}
