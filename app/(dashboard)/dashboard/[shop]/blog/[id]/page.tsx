import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import BlogEditor, { type BlogFormData } from "../BlogEditor";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ shop: string; id: string }>;
}) {
  const { shop, id } = await params;

  const access = await getShopAccess(shop);
  if (!access) notFound();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) notFound();

  const post = await db.query.blogPosts.findFirst({
    where: and(eq(blogPosts.id, id), eq(blogPosts.shopId, access.shopId)),
  });
  if (!post) notFound();

  const initial: BlogFormData = {
    title: post.title,
    excerpt: post.excerpt ?? "",
    content: post.content ?? "",
    coverImage: post.coverImage ?? "",
    published: post.published,
  };

  return <BlogEditor shopSlug={shop} postId={post.id} initial={initial} />;
}
