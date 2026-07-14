import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Upload obrazów (logo, zdjęcia produktów, obrazki bloga) do Vercel Blob.
// Zastępuje uploadthing: storage jest wbudowany w Vercela, token
// (BLOB_READ_WRITE_TOKEN) provisionuje się przy tworzeniu Blob store, a pliki
// serwuje CDN Vercela. Upload jest akcją sprzedawcy — wymagamy zalogowanego
// właściciela sklepu (lub admina), żeby nikt obcy nie spalał storage.

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB — spina się z limitem body funkcji na Vercelu
const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
]);

async function requireShopOwner() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await db.query.users.findFirst({ where: eq(users.clerkId, userId) });
  if (!user) return null;
  if (user.role !== "admin") {
    const shop = await db.query.shops.findFirst({ where: eq(shops.ownerId, user.id) });
    if (!shop) return null;
  }
  return user;
}

export async function POST(req: NextRequest) {
  const user = await requireShopOwner();
  if (!user) {
    return NextResponse.json({ error: "Brak uprawnień — zaloguj się jako właściciel sklepu." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe żądanie." }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "Nie wybrano pliku." }, { status: 400 });
  }
  if (files.length > 8) {
    return NextResponse.json({ error: "Maksymalnie 8 plików naraz." }, { status: 400 });
  }

  for (const file of files) {
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: "Nieobsługiwany format (dozwolone: PNG, JPG, WebP, GIF, SVG, AVIF)." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Plik jest za duży — maksymalnie 4 MB." }, { status: 400 });
    }
  }

  try {
    const urls: string[] = [];
    for (const file of files) {
      const blob = await put(`shops/${user.id}/${file.name}`, file, {
        access: "public",
        addRandomSuffix: true,
        contentType: file.type,
      });
      urls.push(blob.url);
    }
    return NextResponse.json({ urls }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "nieznany błąd";
    // Najczęściej: brak BLOB_READ_WRITE_TOKEN (nieutworzony Blob store).
    return NextResponse.json({ error: `Storage: ${msg}` }, { status: 500 });
  }
}
