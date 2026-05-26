import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, shops, shopConfig, products as productsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { adminEmailAllowlist } from "@/lib/api";
import type { StoreBootstrap } from "@/lib/brand/types";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

type Body = {
  shopName: string;
  slug: string;
  /** Optional full brand-themer payload from the wizard. When present, seeds
   *  branding + home config from inferred values; otherwise we fall back to
   *  the legacy minimal defaults so the old OnboardingForm still works. */
  bootstrap?: StoreBootstrap;
};

export async function POST(req: NextRequest) {
  const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  let clerkId: string | null = null;

  if (clerkConfigured) {
    const session = await auth();
    clerkId = session.userId;
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } else {
    // Dev mode: no Clerk keys → single shared dev user. Lets the wizard's
    // Save CTA round-trip locally before real auth is set up. NEVER hits
    // in prod because Vercel will always have Clerk keys.
    clerkId = "dev-user-local";
  }

  const body = (await req.json()) as Body;
  const { shopName, slug, bootstrap } = body;

  if (!shopName?.trim()) {
    return NextResponse.json({ error: "Nazwa sklepu jest wymagana." }, { status: 400 });
  }
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: "Adres może zawierać tylko małe litery, cyfry i myślniki (min. 3 znaki)." },
      { status: 400 },
    );
  }

  // Slug uniqueness check.
  const taken = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (taken) {
    return NextResponse.json({ error: "Ten adres jest już zajęty. Wybierz inny." }, { status: 409 });
  }

  // Upsert user against Clerk identity (or dev fallback).
  let email = "dev@sellflow.local";
  let name: string | undefined = "Dev User";
  if (clerkConfigured) {
    const clerkUser = await currentUser();
    email = clerkUser?.emailAddresses[0]?.emailAddress ?? email;
    name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || undefined;
  }

  // Promote Sellflow staff to admin on first sign-up if their email is in
  // SELLFLOW_ADMIN_EMAILS. Existing users get promoted on next save too.
  const role = adminEmailAllowlist().includes(email.toLowerCase()) ? "admin" : "merchant";

  let user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) {
    [user] = await db.insert(users).values({ clerkId, email, name, role }).returning();
  } else if (role === "admin" && user.role !== "admin") {
    [user] = await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id)).returning();
  }

  // Re-submit / back button guard.
  const existingShop = await db.query.shops.findFirst({ where: eq(shops.ownerId, user.id) });
  if (existingShop) {
    return NextResponse.json({ shopSlug: existingShop.slug });
  }

  // Create shop.
  const [shop] = await db
    .insert(shops)
    .values({ slug, name: shopName.trim(), ownerId: user.id })
    .returning();

  // Seed config — branded if a bootstrap payload was sent, neutral defaults otherwise.
  await db.insert(shopConfig).values(buildConfigRows(shop.id, shopName.trim(), bootstrap));

  // Seed products from the bootstrap payload (if any) so the new dashboard
  // isn't empty. Names + prices come from the inferred catalog per category.
  if (bootstrap?.store.products?.length) {
    const rows = bootstrap.store.products.slice(0, 20).map((p, i) => ({
      shopId: shop.id,
      name: p.name,
      category: bootstrap.store.category,
      price: p.price,
      oldPrice: p.originalPrice ?? null,
      badge: p.badge ?? null,
      shortDesc: p.description,
      description: p.description,
      images: [] as string[],
      colors: [] as string[],
      sizes: [] as string[],
      sortOrder: i,
    }));
    await db.insert(productsTable).values(rows);
  }

  return NextResponse.json({ shopSlug: shop.slug }, { status: 201 });
}

function buildConfigRows(shopId: string, shopName: string, bootstrap?: StoreBootstrap) {
  const branding = brandingFromBootstrap(shopName, bootstrap);
  const home = homeFromBootstrap(shopName, bootstrap);

  const rows: Array<{ shopId: string; key: string; value: unknown }> = [
    { shopId, key: "branding", value: branding },
    { shopId, key: "home", value: home },
  ];

  // Keep the raw payload around — lets us rebuild the wizard state for
  // "edit my onboarding" later, and gives the dashboard a single source of
  // truth for traits/tone/palette without duplicating across keys.
  if (bootstrap) {
    rows.push({
      shopId,
      key: "brand",
      value: {
        traits: bootstrap.brand.traits,
        tone: bootstrap.brand.tone,
        palette: bootstrap.brand.palette,
        fonts: bootstrap.brand.fonts,
        layout_type: bootstrap.store.layout_type,
        category: bootstrap.store.category,
        audience: bootstrap.store.audience,
        sells: bootstrap.store.sells,
      },
    });
  }

  return rows;
}

function brandingFromBootstrap(shopName: string, b?: StoreBootstrap) {
  return {
    shopName: b?.store.name ?? shopName,
    tagline: b?.store.storyShort ?? "",
    logoUrl: b?.store.logoDataUrl ?? "",
    faviconUrl: "",
    primaryColor: b?.brand.palette.ink ?? "#12128c",
    accentColor: b?.brand.palette.accent ?? "#db00b2",
    fontFamily: parseDisplayFont(b?.brand.fonts.display) ?? "Space Grotesk",
  };
}

function homeFromBootstrap(shopName: string, b?: StoreBootstrap) {
  const traits = b?.brand.traits ?? [];
  const benefits = traits.length
    ? traits.slice(0, 4).map((t) => ({ title: t, description: defaultBenefitDescription(t) }))
    : [
        { title: "Jakość",    description: "Najwyższej jakości materiały i wykonanie." },
        { title: "Trwałość",  description: "Produkty zaprojektowane na lata." },
        { title: "Ekologia",  description: "Odpowiedzialna produkcja." },
        { title: "Innowacja", description: "Nowoczesne rozwiązania." },
      ];

  return {
    topBar: {
      text: b?.store.hero_sub || "Darmowa dostawa od 150 zł · Zwroty do 30 dni",
      visible: true,
    },
    hero: {
      eyebrow: humanizeCategory(b?.store.category) ?? "Kolekcja 2026",
      headline: b?.store.hero_headline ?? `${shopName},`,
      // Bootstrap provides a full headline; the legacy "który wyróżnia." sub
      // only kicks in for the no-bootstrap flow so the old form still reads naturally.
      headlineSub: b?.store.hero_headline ? "" : "który wyróżnia.",
      description: b?.store.storyShort || "Minimalistyczny design spotyka najwyższą jakość.",
      ctaPrimary: "Kup teraz",
      ctaSecondary: "Dowiedz się więcej",
      socialProof: b?.store.audience || "Dołącz do zadowolonych klientów",
      image: "",
    },
    products: {
      eyebrow: "Nasza oferta",
      headline: "Produkty",
      subheadline: "Wybierz coś, co najbardziej do Ciebie pasuje.",
    },
    benefits: {
      eyebrow: "Dlaczego my",
      headline: "Zaprojektowane z myślą o Tobie",
      items: benefits,
    },
    reviews: { rating: "5.0", reviewCount: "0", media: [], items: [] },
    guarantee: {
      headline: "Kupujesz bez ryzyka",
      subheadline: "Twoja satysfakcja jest naszym priorytetem.",
      items: [
        { title: "Gwarancja satysfakcji", description: "Zwrot pieniędzy bez pytań." },
        { title: "Darmowe zwroty 30 dni", description: "Masz 30 dni na zwrot towaru." },
        { title: "Szybka dostawa",        description: "Wysyłka w ciągu 24 godzin." },
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
  };
}

function humanizeCategory(cat?: string): string | null {
  if (!cat) return null;
  const map: Record<string, string> = {
    candles: "Świece", home_decor: "Wnętrze", jewelry: "Biżuteria",
    apparel: "Odzież", beauty: "Beauty", coffee: "Kawa", food: "Smaki",
    art: "Sztuka", digital: "Produkty cyfrowe", plants: "Rośliny",
    accessories: "Akcesoria", kids: "Dla dzieci", pets: "Dla pupili",
    lifestyle: "Lifestyle",
  };
  return map[cat] ?? null;
}

/** The wizard emits font-family stacks ("\"Space Grotesk\", system-ui, ...").
 *  We persist the head family only so existing branding.fontFamily callers
 *  (which expect a single name) keep working. */
function parseDisplayFont(stack?: string): string | null {
  if (!stack) return null;
  const head = stack.split(",")[0].trim().replace(/^["']|["']$/g, "");
  return head || null;
}

function defaultBenefitDescription(trait: string): string {
  const map: Record<string, string> = {
    Ciepła: "Czuć w każdym detalu — od opakowania po wykończenie.",
    Minimalistyczna: "Mniej, ale przemyślane. Bez ozdobników.",
    Szczera: "Jasno o tym, co robimy i czego nie obiecujemy.",
    Odważna: "Nie boimy się wyboru, który Cię zaskoczy.",
    Spokojna: "Bez krzykliwości — dla tych, którzy słuchają.",
    Eksperymentalna: "Pierwsza partia? Często. To część zabawy.",
    Premium: "Materiał, który czuć w dłoni od pierwszego razu.",
    Rzemieślnicza: "Robione w małej skali, w naszych rękach.",
    Nowoczesna: "W kroku z tym, co dzisiaj, ale bez krótkiej daty ważności.",
    Klasyczna: "Sprawdzone proporcje, które się nie zestarzeją.",
    Zabawna: "Życie jest poważne — produkty już niekoniecznie.",
    Surowa: "Bez wykończeń, które dodają tylko grubości.",
  };
  return map[trait] ?? "Bo wierzymy, że tak ma być.";
}
