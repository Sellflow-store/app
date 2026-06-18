import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import BlogTable, { type BlogRow } from "./BlogTable";

export default async function BlogPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  let posts: BlogRow[] = [];

  try {
    const access = await getShopAccess(shopSlug);
    if (access) {
      const rows = await db
        .select({
          id: blogPosts.id,
          title: blogPosts.title,
          published: blogPosts.published,
          coverImage: blogPosts.coverImage,
          createdAt: blogPosts.createdAt,
        })
        .from(blogPosts)
        .where(eq(blogPosts.shopId, access.shopId))
        .orderBy(desc(blogPosts.createdAt));

      posts = rows.map((r) => ({
        id: r.id,
        title: r.title,
        published: r.published,
        coverImage: r.coverImage ?? undefined,
        createdAt: r.createdAt.toISOString(),
      }));
    }
  } catch {
    // DB not configured yet — render empty table
  }

  return <BlogTable shopSlug={shopSlug} posts={posts} />;
}
