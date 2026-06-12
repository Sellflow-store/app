import { db } from "@/lib/db";
import { shopConfig } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { DEFAULT_MENU } from "@/lib/shop";
import type { MenuConfig } from "@/types/shop";
import MenuForm from "./MenuForm";

export default async function MenuPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  let initialItems = DEFAULT_MENU.items;

  try {
    const access = await getShopAccess(shopSlug);
    if (access) {
      const row = await db.query.shopConfig.findFirst({
        where: and(eq(shopConfig.shopId, access.shopId), eq(shopConfig.key, "menu")),
      });
      const saved = (row?.value as Partial<MenuConfig>)?.items;
      if (Array.isArray(saved) && saved.length > 0) initialItems = saved;
    }
  } catch {
    // DB not configured yet — render with defaults
  }

  return <MenuForm shopSlug={shopSlug} initialItems={initialItems} />;
}
