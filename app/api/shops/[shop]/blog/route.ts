import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { slugify } from "@/lib/slug";

type Params = { params: Promise<{ shop: string }> };

/** Zwraca wolny slug dla wpisu w obrębie sklepu (base, base-2, base-3…). */
async function freeBlogSlug(shopId: string, base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "wpis";
  const rows = await db
    .select({ slug: blogPosts.slug, id: blogPosts.id })
    .from(blogPosts)
    .where(eq(blogPosts.shopId, shopId));
  const taken = new Set(rows.filter((r) => r.id !== excludeId).map((r) => r.slug));
  if (!taken.has(root)) return root;
  for (let i = 2; i < 100; i++) {
    const candidate = `${root}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${root}-${Date.now()}`;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { shop } = await params;
  const access = await getShopAccess(shop);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.shopId, access.shopId))
    .orderBy(desc(blogPosts.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { shop } = await params;
  const access = await getShopAccess(shop);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    title: string;
    excerpt?: string;
    content?: string;
    coverImage?: string;
    published?: boolean;
  };

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Tytuł jest wymagany." }, { status: 400 });
  }

  const slug = await freeBlogSlug(access.shopId, body.title);
  const published = body.published ?? false;

  const [post] = await db
    .insert(blogPosts)
    .values({
      shopId: access.shopId,
      slug,
      title: body.title.trim(),
      excerpt: body.excerpt?.trim() || null,
      content: body.content ?? null,
      coverImage: body.coverImage?.trim() || null,
      published,
      publishedAt: published ? new Date() : null,
    })
    .returning();

  return NextResponse.json(post, { status: 201 });
}
