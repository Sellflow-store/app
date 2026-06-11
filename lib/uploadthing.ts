import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new UploadThingError("Unauthorized");
  return { clerkId: userId };
}

export const fileRouter = {
  productImage: f({ image: { maxFileSize: "4MB", maxFileCount: 8 } })
    .middleware(requireUser)
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),

  shopLogo: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(requireUser)
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),
} satisfies FileRouter;

export type AppFileRouter = typeof fileRouter;
