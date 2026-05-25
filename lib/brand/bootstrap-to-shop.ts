import type { ShopContext, StorefrontProduct } from "@/types/shop";
import type { StoreBootstrap } from "./types";

/**
 * Map an in-memory StoreBootstrap (built by the onboarding wizard) into the
 * full ShopContext shape that the storefront components consume. Used by
 * /preview-shop to render the live preview WITHOUT writing to the DB.
 *
 * Field defaults match what /api/onboarding seeds for `home` config, so the
 * preview matches what the user will see after Save.
 */
export function bootstrapToShopContext(payload: StoreBootstrap): ShopContext {
  const { store, brand } = payload;
  const traits = brand.traits.slice(0, 4);

  const benefits = (traits.length > 0
    ? traits.map((t) => ({ title: t, description: benefitDescriptionFor(t) }))
    : [
        { title: "Jakość",   description: "Wybrane materiały i dopracowane wykonanie." },
        { title: "Trwałość", description: "Produkty zaprojektowane na lata." },
        { title: "Ekologia", description: "Odpowiedzialna produkcja." },
        { title: "Bliskość", description: "Mała marka, kontakt bez kolejki." },
      ]
  ).slice(0, 4);

  const products: StorefrontProduct[] = store.products.map((p, i) => ({
    id: `preview-${i}`,
    name: p.name,
    category: store.category,
    price: p.price,
    oldPrice: p.originalPrice ?? null,
    badge: p.badge ?? null,
    rating: "5.0",
    reviews: 0,
    visible: true,
    shortDesc: p.description,
    description: p.description,
    images: [],
    video: null,
    colors: [],
    sizes: [],
    benefits: [],
    specs: [],
    sizeChart: [],
    faq: [],
    deliveryInfo: [],
    sortOrder: i,
  }));

  return {
    id: `preview-${payload.bootstrapId}`,
    slug: "preview",
    name: store.name,
    branding: {
      shopName: store.name,
      tagline: store.storyShort,
      logoUrl: store.logoDataUrl ?? "",
      faviconUrl: "",
      primaryColor: brand.palette.ink,
      accentColor: brand.palette.accent,
      fontFamily: brand.fonts.display,
    },
    home: {
      topBar: {
        text: store.hero_sub || "Darmowa dostawa od 150 zł · Zwroty do 30 dni",
        visible: true,
      },
      hero: {
        eyebrow: humanizeCategory(store.category),
        headline: store.hero_headline,
        headlineSub: "",
        description: store.storyShort || store.hero_sub,
        ctaPrimary: "Kup teraz",
        ctaSecondary: "Dowiedz się więcej",
        socialProof: store.audience || "Dla osób, które cenią szczegóły",
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
    products,
  };
}

function humanizeCategory(cat: string): string {
  const map: Record<string, string> = {
    candles: "Świece", home_decor: "Wnętrze", jewelry: "Biżuteria",
    apparel: "Odzież", beauty: "Beauty", coffee: "Kawa", food: "Smaki",
    art: "Sztuka", digital: "Produkty cyfrowe", plants: "Rośliny",
    accessories: "Akcesoria", kids: "Dla dzieci", pets: "Dla pupili",
    lifestyle: "Lifestyle",
  };
  return map[cat] ?? "Nowa kolekcja";
}

function benefitDescriptionFor(trait: string): string {
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
