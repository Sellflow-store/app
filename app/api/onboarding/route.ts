import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, shops, shopConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shopName, slug } = (await req.json()) as { shopName: string; slug: string };

  if (!shopName?.trim()) {
    return NextResponse.json({ error: "Nazwa sklepu jest wymagana." }, { status: 400 });
  }
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: "Adres może zawierać tylko małe litery, cyfry i myślniki (min. 3 znaki)." },
      { status: 400 }
    );
  }

  // Slug uniqueness check
  const taken = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (taken) {
    return NextResponse.json({ error: "Ten adres jest już zajęty. Wybierz inny." }, { status: 409 });
  }

  // Get Clerk user details
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? "";
  const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || undefined;

  // Upsert user in our DB
  let user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) {
    [user] = await db.insert(users).values({ clerkId, email, name }).returning();
  }

  // Guard: user already has a shop (re-submit / back button)
  const existingShop = await db.query.shops.findFirst({ where: eq(shops.ownerId, user.id) });
  if (existingShop) {
    return NextResponse.json({ shopSlug: existingShop.slug });
  }

  // Create shop
  const [shop] = await db.insert(shops).values({
    slug,
    name: shopName.trim(),
    ownerId: user.id,
  }).returning();

  // Seed default config
  await db.insert(shopConfig).values([
    {
      shopId: shop.id,
      key: "branding",
      value: {
        shopName: shopName.trim(),
        tagline: "",
        logoUrl: "",
        faviconUrl: "",
        primaryColor: "#12128c",
        accentColor: "#db00b2",
        fontFamily: "Space Grotesk",
      },
    },
    {
      shopId: shop.id,
      key: "home",
      value: {
        topBar: { text: "Darmowa dostawa od 150 zł · Zwroty do 30 dni", visible: true },
        hero: {
          eyebrow: "Kolekcja 2026",
          headline: shopName.trim() + ",",
          headlineSub: "który wyróżnia.",
          description: "Minimalistyczny design spotyka najwyższą jakość.",
          ctaPrimary: "Kup teraz",
          ctaSecondary: "Dowiedz się więcej",
          socialProof: "Dołącz do zadowolonych klientów",
          image: "",
        },
        products: {
          eyebrow: "Nasza oferta",
          headline: "Nasze produkty",
          subheadline: "Wybierz produkt, który najlepiej odpowiada Twoim potrzebom.",
        },
        benefits: {
          eyebrow: "Dlaczego my",
          headline: "Zaprojektowane z myślą o Tobie",
          items: [
            { title: "Jakość",    description: "Najwyższej jakości materiały i wykonanie." },
            { title: "Trwałość",  description: "Produkty zaprojektowane na lata." },
            { title: "Ekologia",  description: "Odpowiedzialna produkcja." },
            { title: "Innowacja", description: "Nowoczesne rozwiązania." },
          ],
        },
        reviews: { rating: "5.0", reviewCount: "0", media: [], items: [] },
        guarantee: {
          headline: "Kupujesz bez ryzyka",
          subheadline: "Twoja satysfakcja jest naszym priorytetem.",
          items: [
            { title: "Gwarancja satysfakcji", description: "Zwrot pieniędzy bez pytań." },
            { title: "Darmowe zwroty 30 dni", description: "Masz 30 dni na zwrot towaru." },
            { title: "Szybka dostawa",         description: "Wysyłka w ciągu 24 godzin." },
          ],
        },
        video: { visible: false, eyebrow: "", headline: "", description: "", type: "embed", embedUrl: "", fileUrl: "" },
        discounts: { codes: [], topBarCodeIndex: 0 },
        popup: {
          enabled: false,
          delaySeconds: 5,
          title: "Zapisz się do newslettera",
          description: "Otrzymaj kod rabatowy na pierwsze zamówienie.",
          buttonLabel: "Odbierz rabat",
          placeholder: "Twój adres e-mail",
          disclaimer: "Żadnego spamu.",
          successTitle: "Dziękujemy!",
          successText: "Kod został wysłany na Twojego maila.",
        },
      },
    },
  ]);

  return NextResponse.json({ shopSlug: shop.slug }, { status: 201 });
}
