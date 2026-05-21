import { db } from "@/lib/db";
import { shopConfig, shops, users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import type { BrandingConfig } from "@/types/shop";
import BrandingForm from "./BrandingForm";

const DEFAULT_BRANDING: BrandingConfig = {
  shopName: "Mój sklep",
  tagline: "",
  logoUrl: "",
  faviconUrl: "",
  primaryColor: "#12128c",
  accentColor: "#db00b2",
  fontFamily: "Space Grotesk",
};

export default async function BrandingPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  let initialConfig: BrandingConfig = DEFAULT_BRANDING;
  let dbShopName = "";

  try {
    const { userId: clerkId } = await auth();
    if (clerkId) {
      const user = await db.query.users.findFirst({
        where: eq(users.clerkId, clerkId),
      });
      if (user) {
        const shop = await db.query.shops.findFirst({
          where: and(eq(shops.slug, shopSlug), eq(shops.ownerId, user.id)),
        });
        if (shop) {
          dbShopName = shop.name;
          const row = await db.query.shopConfig.findFirst({
            where: and(
              eq(shopConfig.shopId, shop.id),
              eq(shopConfig.key, "branding")
            ),
          });
          if (row?.value) {
            initialConfig = {
              ...DEFAULT_BRANDING,
              ...(row.value as Partial<BrandingConfig>),
              shopName: (row.value as BrandingConfig).shopName ?? shop.name,
            };
          } else {
            initialConfig = { ...DEFAULT_BRANDING, shopName: shop.name };
          }
        }
      }
    }
  } catch {
    // DB not configured yet — render with defaults
  }

  return (
    <BrandingForm
      shopSlug={shopSlug}
      dbShopName={dbShopName}
      initialConfig={initialConfig}
    />
  );
}
