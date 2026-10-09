import BlogEditor from "../BlogEditor";
import { shopDisplay } from "@/lib/shop-display";

export default async function NewBlogPostPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  const display = await shopDisplay(shop);
  return <BlogEditor shopSlug={shop} shopName={display.name} shopHost={display.host} />;
}
