import { db } from "@/lib/db";
import { shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { shopPublicUrl } from "@/lib/legal/data";

/**
 * Nazwa i host sklepu do podglądów w panelu (wynik Google, linki). Panel jest
 * za logowaniem, a oba pola są publiczne na stronie sklepu, więc wystarczy
 * odczyt po slugu.
 */
export async function shopDisplay(slug: string): Promise<{ name: string; host: string }> {
  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) return { name: slug, host: slug };
  return { name: shop.name, host: new URL(shopPublicUrl(shop)).host };
}
