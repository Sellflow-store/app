import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getShopBySlug } from "@/lib/shop";
import { storefrontBase } from "@/lib/storefront-base";
import StorefrontShell from "@/components/store/StorefrontShell";

interface Props {
  params: Promise<{ shop: string; slug: string }>;
}

async function getPost(shopId: string, slug: string) {
  return db.query.blogPosts.findFirst({
    where: and(
      eq(blogPosts.shopId, shopId),
      eq(blogPosts.slug, slug),
      eq(blogPosts.published, true)
    ),
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { shop: shopSlug, slug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) notFound();

  const post = await getPost(shop.id, slug);
  if (!post) notFound();

  const base = await storefrontBase(shop.slug);

  const date = post.publishedAt
    ? new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" }).format(
        post.publishedAt
      )
    : null;

  return (
    <StorefrontShell shop={shop}>
      <article className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <Link
          href={`${base}/blog`}
          className="inline-flex items-center gap-1.5 text-xs tracking-wide uppercase text-ink-2/70 hover:text-ink transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          Wróć do bloga
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-3">{post.title}</h1>
        {date && <p className="text-xs text-ink-2/60 mb-8">{date}</p>}

        {post.coverImage && (
          <div className="aspect-[16/9] bg-paper-3 rounded-2xl overflow-hidden mb-10">
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {post.content?.trim() ? (
          <div className="text-base text-ink-2 font-light leading-relaxed whitespace-pre-line">
            {post.content}
          </div>
        ) : (
          <p className="text-sm text-ink-2/70 font-light">Treść w przygotowaniu.</p>
        )}
      </article>
    </StorefrontShell>
  );
}

export async function generateMetadata({ params }: Props) {
  const { shop: shopSlug, slug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return {};
  const post = await getPost(shop.id, slug);
  if (!post) return { title: `Blog — ${shop.branding.shopName}` };
  return {
    title: `${post.title} — ${shop.branding.shopName}`,
    description: post.excerpt ?? undefined,
  };
}
