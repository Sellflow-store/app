import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import BlogEditor, { type BlogFormData } from "../BlogEditor";
import { readBlogSeo } from "@/lib/blog-seo";
import { shopDisplay } from "@/lib/shop-display";

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

  const [seo, display] = await Promise.all([readBlogSeo(access.shopId, post.id), shopDisplay(shop)]);

  const initial: BlogFormData = {
    title: post.title,
    excerpt: post.excerpt ?? "",
    content: post.content ?? "",
    coverImage: post.coverImage ?? "",
    published: post.published,
    slug: post.slug,
    coverAlt: seo?.coverAlt ?? "",
    seo: {
      title: seo?.title ?? "",
      description: seo?.description ?? "",
      focus: seo?.focus ?? "",
      phrases: seo?.phrases ?? [],
    },
  };

  return (
    <BlogEditor
      shopSlug={shop}
      shopName={display.name}
      shopHost={display.host}
      postId={post.id}
      initial={initial}
    />
  );
}
