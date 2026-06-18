import BlogEditor from "../BlogEditor";

export default async function NewBlogPostPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  return <BlogEditor shopSlug={shop} />;
}
