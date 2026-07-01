import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const f = createUploadthing();

// Upload is a merchant action: require a signed-in user who actually owns a
// shop (or is staff). Without this, any signed-in account — including
// non-merchants — could burn UploadThing storage/quota. We also tag the upload
// with the user id for attribution.
async function requireShopOwner() {
  const { userId } = await auth();
  if (!userId) throw new UploadThingError("Unauthorized");

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, userId) });
  if (!user) throw new UploadThingError("Unauthorized");

  if (user.role !== "admin") {
    const shop = await db.query.shops.findFirst({ where: eq(shops.ownerId, user.id) });
    if (!shop) throw new UploadThingError("Brak sklepu — najpierw dokończ onboarding.");
  }

  return { clerkId: userId, userId: user.id };
}

export const fileRouter = {
  productImage: f({ image: { maxFileSize: "4MB", maxFileCount: 8 } })
    .middleware(requireShopOwner)
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),

  shopLogo: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(requireShopOwner)
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),
} satisfies FileRouter;

export type AppFileRouter = typeof fileRouter;
