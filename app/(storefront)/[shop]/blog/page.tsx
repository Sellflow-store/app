import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getShopBySlug } from "@/lib/shop";
import StorefrontShell from "@/components/store/StorefrontShell";

interface Props {
  params: Promise<{ shop: string }>;
}

export default async function BlogListPage({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) notFound();

  const posts = await db
    .select({
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      coverImage: blogPosts.coverImage,
      publishedAt: blogPosts.publishedAt,
    })
    .from(blogPosts)
    .where(and(eq(blogPosts.shopId, shop.id), eq(blogPosts.published, true)))
    .orderBy(desc(blogPosts.publishedAt));

  return (
    <StorefrontShell shop={shop}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="mb-10">
          <p className="text-[11px] tracking-[0.2em] uppercase text-ink-2/70 mb-2">Blog</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">Aktualności</h1>
        </div>

        {posts.length === 0 ? (
          <p className="text-sm text-ink-2/70 font-light py-12">
            Pierwsze wpisy pojawią się tu wkrótce.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {posts.map((post) => (
              <Link key={post.slug} href={`/${shop.slug}/blog/${post.slug}`} className="group block">
                <div className="aspect-[16/10] bg-paper-3 rounded-2xl overflow-hidden mb-4">
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-2/40 text-2xl font-light">
                      ✦
                    </div>
                  )}
                </div>
                <h2 className="text-base font-medium text-ink tracking-tight group-hover:opacity-80 transition-opacity">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-ink-2/80 font-light mt-1.5 line-clamp-2">{post.excerpt}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}

export async function generateMetadata({ params }: Props) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return {};
  return { title: `Blog — ${shop.branding.shopName}` };
}
