import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";

type Params = { params: Promise<{ shop: string; id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { shop, id } = await params;
  const access = await getShopAccess(shop);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Partial<{
    title: string;
    excerpt: string | null;
    content: string | null;
    coverImage: string | null;
    published: boolean;
  }>;

  // Aktualny wpis — potrzebny do ustawienia publishedAt przy pierwszej publikacji
  const existing = await db.query.blogPosts.findFirst({
    where: and(eq(blogPosts.id, id), eq(blogPosts.shopId, access.shopId)),
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.excerpt !== undefined) updates.excerpt = body.excerpt?.trim() || null;
  if (body.content !== undefined) updates.content = body.content;
  if (body.coverImage !== undefined) updates.coverImage = body.coverImage?.trim() || null;
  if (body.published !== undefined) {
    updates.published = body.published;
    // Ustaw datę publikacji tylko przy pierwszym opublikowaniu
    if (body.published && !existing.publishedAt) updates.publishedAt = new Date();
  }

  const [updated] = await db
    .update(blogPosts)
    .set(updates)
    .where(and(eq(blogPosts.id, id), eq(blogPosts.shopId, access.shopId)))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { shop, id } = await params;
  const access = await getShopAccess(shop);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [deleted] = await db
    .delete(blogPosts)
    .where(and(eq(blogPosts.id, id), eq(blogPosts.shopId, access.shopId)))
    .returning({ id: blogPosts.id });

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
