import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getShopBySlug } from "@/lib/shop";
import { storefrontBase } from "@/lib/storefront-base";
import { absoluteUrl, shopOrigin } from "@/lib/seo";

type Params = { params: Promise<{ shop: string }> };

interface Entry {
  path: string;
  lastmod?: Date | null;
  priority: string;
  changefreq: string;
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Mapa witryny JEDNEGO sklepu. Storefront tego samego sklepu żyje pod
 * subdomeną, własną domeną i ścieżką na domenie aplikacji, więc adresy liczymy
 * od hosta żądania — mapa serwowana z danego hosta wskazuje strony tego hosta.
 *
 * Nie ma tu koszyka, zamówienia ani wyszukiwarki: to strony bez treści do
 * zaindeksowania, a wyszukiwarka i tak dostaje na nie zakaz w robots.txt.
 */
export async function GET(_req: Request, { params }: Params) {
  const { shop: shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return new Response("Not found", { status: 404 });

  const [base, origin] = await Promise.all([storefrontBase(shop.slug), shopOrigin()]);

  const posts = await db
    .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
    .from(blogPosts)
    .where(and(eq(blogPosts.shopId, shop.id), eq(blogPosts.published, true)));

  const entries: Entry[] = [
    { path: "", priority: "1.0", changefreq: "weekly" },
    { path: "/produkty", priority: "0.9", changefreq: "weekly" },
    ...shop.products.map((p) => ({
      path: `/produkty/${p.slug}`,
      priority: "0.8",
      changefreq: "weekly",
    })),
  ];

  // Strony treściowe tylko wtedy, gdy merchant je wypełnił — pusta „O nas"
  // w mapie to zaproszenie do zaindeksowania pustki.
  if (shop.about.content?.trim()) {
    entries.push({ path: "/o-nas", priority: "0.5", changefreq: "monthly" });
  }
  // Kontakt ma zawsze treść — formularz jest tam niezależnie od tego, czy
  // sprzedawca podał adres i telefon.
  entries.push({ path: "/kontakt", priority: "0.5", changefreq: "monthly" });
  if (shop.faq.items.length > 0) {
    entries.push({ path: "/faq", priority: "0.5", changefreq: "monthly" });
  }
  entries.push({ path: "/dostawa", priority: "0.4", changefreq: "monthly" });
  entries.push({ path: "/zwroty", priority: "0.4", changefreq: "monthly" });
  if (shop.terms.content?.trim()) {
    entries.push({ path: "/regulamin", priority: "0.3", changefreq: "yearly" });
  }
  if (shop.privacy.content?.trim()) {
    entries.push({ path: "/prywatnosc", priority: "0.3", changefreq: "yearly" });
  }
  if (posts.length > 0) {
    entries.push({ path: "/blog", priority: "0.6", changefreq: "weekly" });
    for (const post of posts) {
      entries.push({
        path: `/blog/${post.slug}`,
        lastmod: post.updatedAt,
        priority: "0.6",
        changefreq: "monthly",
      });
    }
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((e) => {
      const lastmod = e.lastmod
        ? `<lastmod>${e.lastmod.toISOString().slice(0, 10)}</lastmod>`
        : "";
      return `<url><loc>${esc(absoluteUrl(origin, base, e.path))}</loc>${lastmod}<changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`;
    }),
    "</urlset>",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
