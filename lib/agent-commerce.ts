/**
 * Dane sklepu w formie, którą czytają agenci AI i wyszukiwarki produktowe.
 *
 * Agent wybierający sklep sprawdza kryteria użytkownika („dostawa do piątku”,
 * „darmowy zwrot”) w danych strukturalnych. Brak pola to odrzucenie, a nie
 * niższa pozycja, dlatego wystawiamy wszystko, co sklep już ma w panelu:
 * metody i ceny dostawy, czas realizacji z modułu prawnego, zasady zwrotu
 * wynikające z regulaminu. Sprzedawca nic nie wpisuje drugi raz.
 */

import type { DeliveryConfig, LegalDataConfig, StorefrontProduct, FaqItem } from "@/types/shop";

// ─── Boty AI ─────────────────────────────────────────────────────────────────

/**
 * search: indeksuje do odpowiedzi wyszukiwarki AI (sklep pojawia się w ChatGPT,
 *         Perplexity, Claude).
 * user:   pobiera stronę na bieżącą prośbę konkretnego użytkownika.
 * training: zbiera treści do trenowania modeli.
 */
export type AiBotPurpose = "search" | "user" | "training";

export interface AiBot {
  /** Token z robots.txt i fragment User-Agenta (bez rozróżniania wielkości liter). */
  token: string;
  vendor: "OpenAI" | "Anthropic" | "Perplexity" | "Google" | "Apple" | "Meta" | "Amazon" | "Common Crawl" | "Mistral" | "DuckDuckGo";
  purpose: AiBotPurpose;
  /** false = token istnieje tylko w robots.txt, nigdy w nagłówku User-Agent. */
  seenInUserAgent: boolean;
}

export const AI_BOTS: AiBot[] = [
  { token: "OAI-SearchBot", vendor: "OpenAI", purpose: "search", seenInUserAgent: true },
  { token: "ChatGPT-User", vendor: "OpenAI", purpose: "user", seenInUserAgent: true },
  { token: "GPTBot", vendor: "OpenAI", purpose: "training", seenInUserAgent: true },
  { token: "Claude-SearchBot", vendor: "Anthropic", purpose: "search", seenInUserAgent: true },
  { token: "Claude-User", vendor: "Anthropic", purpose: "user", seenInUserAgent: true },
  { token: "ClaudeBot", vendor: "Anthropic", purpose: "training", seenInUserAgent: true },
  { token: "PerplexityBot", vendor: "Perplexity", purpose: "search", seenInUserAgent: true },
  { token: "Perplexity-User", vendor: "Perplexity", purpose: "user", seenInUserAgent: true },
  { token: "Google-Extended", vendor: "Google", purpose: "training", seenInUserAgent: false },
  { token: "Applebot-Extended", vendor: "Apple", purpose: "training", seenInUserAgent: false },
  { token: "meta-externalagent", vendor: "Meta", purpose: "training", seenInUserAgent: true },
  { token: "Amazonbot", vendor: "Amazon", purpose: "search", seenInUserAgent: true },
  { token: "DuckAssistBot", vendor: "DuckDuckGo", purpose: "search", seenInUserAgent: true },
  { token: "MistralAI-User", vendor: "Mistral", purpose: "user", seenInUserAgent: true },
  { token: "CCBot", vendor: "Common Crawl", purpose: "training", seenInUserAgent: true },
];

/** Bot AI rozpoznany po nagłówku User-Agent albo null. */
export function detectAiBot(userAgent: string | null | undefined): AiBot | null {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  // Dłuższe tokeny najpierw: „Claude-SearchBot” nie może wpaść jako „ClaudeBot”.
  for (const bot of [...AI_BOTS].sort((a, b) => b.token.length - a.token.length)) {
    if (bot.seenInUserAgent && ua.includes(bot.token.toLowerCase())) return bot;
  }
  return null;
}

/** Sekcje robots.txt dla botów AI. Wyszukiwarki i agenci użytkownika mają
 *  wstęp zawsze; boty trenujące zależą od ustawienia sklepu. */
export function aiRobotsSections(allowTraining: boolean, disallow: string[]): string[] {
  const lines: string[] = ["# Boty AI"];
  for (const bot of AI_BOTS) {
    lines.push(`User-agent: ${bot.token}`);
    if (bot.purpose === "training" && !allowTraining) {
      lines.push("Disallow: /");
    } else {
      lines.push("Allow: /");
      for (const d of disallow) lines.push(`Disallow: ${d}`);
    }
    lines.push("");
  }
  return lines;
}

// ─── Dostawa i zwroty ────────────────────────────────────────────────────────

/** "1–3", "2", "1-5 dni" → { min, max } dni roboczych. Domyślnie 1–3. */
export function parseDayRange(raw: string | null | undefined): { min: number; max: number } {
  const nums = (raw ?? "").match(/\d+/g)?.map(Number).filter((n) => n >= 0 && n < 60) ?? [];
  if (nums.length === 0) return { min: 1, max: 3 };
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return { min, max };
}

// Czas przewozu kurierem i do paczkomatu w Polsce: typowo 1–2 dni robocze.
// Sklep nie podaje go osobno, a bez niego agent nie policzy „dostawy do piątku”.
const TRANSIT_DAYS = { min: 1, max: 2 };

function money(value: number) {
  return { "@type": "MonetaryAmount", value: value.toFixed(2), currency: "PLN" };
}

/**
 * `OfferShippingDetails` dla każdej włączonej metody dostawy. Odbiór osobisty
 * pomijamy: to nie wysyłka i nie ma czasu przewozu. Próg darmowej dostawy
 * uwzględniamy od razu w cenie, bo agent porównuje koszt końcowy.
 */
export function shippingDetailsLd(
  delivery: DeliveryConfig,
  legal: LegalDataConfig,
  productPrice: number,
): Record<string, unknown>[] {
  const handling = parseDayRange(legal.fulfillmentDays);
  const freeFrom = parseFloat(delivery.freeShippingFrom);
  const free = Number.isFinite(freeFrom) && freeFrom > 0 && productPrice >= freeFrom;

  return delivery.methods
    .filter((m) => m.enabled && m.kind !== "pickup")
    .map((m) => ({
      "@type": "OfferShippingDetails",
      name: m.label,
      shippingRate: money(free ? 0 : parseFloat(m.price) || 0),
      shippingDestination: { "@type": "DefinedRegion", addressCountry: "PL" },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        handlingTime: { "@type": "QuantitativeValue", minValue: handling.min, maxValue: handling.max, unitCode: "DAY" },
        transitTime: { "@type": "QuantitativeValue", minValue: TRANSIT_DAYS.min, maxValue: TRANSIT_DAYS.max, unitCode: "DAY" },
      },
    }));
}

/**
 * Zasady zwrotu z regulaminu Sellflow: 14 dni na odstąpienie, odesłanie
 * pocztą lub kurierem, koszt odesłania po stronie klienta. Produkty cyfrowe
 * i personalizowane mają ustawowe wyłączenie, więc dostają „zwrot niemożliwy”.
 */
export function returnPolicyLd(product: Pick<StorefrontProduct, "type">, legal: LegalDataConfig): Record<string, unknown> {
  if (product.type === "digital" || product.type === "service" || legal.personalizedProducts) {
    return {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "PL",
      returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
    };
  }
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "PL",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 14,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
  };
}

/** `FAQPage` z par pytanie/odpowiedź. null, gdy nie ma żadnej pełnej pary. */
export function faqPageLd(items: { q: string; a: string }[] | FaqItem[]): Record<string, unknown> | null {
  const pairs = items.filter((i) => i.q?.trim() && i.a?.trim());
  if (pairs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pairs.map((i) => ({
      "@type": "Question",
      name: i.q.trim(),
      acceptedAnswer: { "@type": "Answer", text: i.a.trim() },
    })),
  };
}

// ─── Feed produktowy (Google Merchant Center) ────────────────────────────────

function xml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface FeedInput {
  shopName: string;
  homeUrl: string;
  productUrl: (slug: string) => string;
  absoluteImage: (src: string) => string;
  products: StorefrontProduct[];
  delivery: DeliveryConfig;
  legal: LegalDataConfig;
  plainText: (html: string | null) => string;
}

/**
 * Feed RSS 2.0 w przestrzeni nazw `g:` (format Google Merchant Center).
 * Ten sam plik czytają inne porównywarki i agenci zakupowi. Pomijamy produkty
 * bez ceny i bez zdjęcia: Merchant Center i tak je odrzuci, a odrzucenia
 * obniżają ocenę całego konta.
 */
export function productFeedXml(input: FeedInput): string {
  const handling = parseDayRange(input.legal.fulfillmentDays);
  const shippingMethods = input.delivery.methods.filter((m) => m.enabled && m.kind !== "pickup");
  const freeFrom = parseFloat(input.delivery.freeShippingFrom);

  // Tylko produkty fizyczne: Merchant Center nie przyjmuje plików do pobrania
  // ani usług, a odrzucenia obniżają ocenę konta.
  const items = input.products
    .filter((p) => p.type === "physical" && !p.priceOnRequest && p.images.length > 0 && parseFloat(p.price) > 0)
    .flatMap((p) => {
      const price = parseFloat(p.price);
      const old = p.oldPrice ? parseFloat(p.oldPrice) : NaN;
      const onSale = Number.isFinite(old) && old > price;
      const inStock = p.stock == null || p.stock > 0;
      const description = (p.shortDesc?.trim() || input.plainText(p.description) || p.name).slice(0, 5000);
      const free = Number.isFinite(freeFrom) && freeFrom > 0 && price >= freeFrom;
      const common = [
        `<g:title>${xml(p.name.slice(0, 150))}</g:title>`,
        `<g:description>${xml(description)}</g:description>`,
        `<g:link>${xml(input.productUrl(p.slug))}</g:link>`,
        `<g:image_link>${xml(input.absoluteImage(p.images[0]))}</g:image_link>`,
        ...p.images.slice(1, 11).map((src) => `<g:additional_image_link>${xml(input.absoluteImage(src))}</g:additional_image_link>`),
        `<g:availability>${inStock ? "in_stock" : "out_of_stock"}</g:availability>`,
        `<g:price>${(onSale ? old : price).toFixed(2)} PLN</g:price>`,
        ...(onSale ? [`<g:sale_price>${price.toFixed(2)} PLN</g:sale_price>`] : []),
        `<g:brand>${xml(input.shopName)}</g:brand>`,
        // Brak EAN: Merchant Center wymaga wtedy jawnego „identifier_exists = no”.
        `<g:identifier_exists>no</g:identifier_exists>`,
        `<g:condition>new</g:condition>`,
        ...(p.category ? [`<g:product_type>${xml(p.category)}</g:product_type>`] : []),
        ...(p.colors.length ? [`<g:color>${xml(p.colors.slice(0, 3).join("/"))}</g:color>`] : []),
        `<g:min_handling_time>${handling.min}</g:min_handling_time>`,
        `<g:max_handling_time>${handling.max}</g:max_handling_time>`,
        ...shippingMethods.map(
          (m) =>
            `<g:shipping><g:country>PL</g:country><g:service>${xml(m.label)}</g:service><g:price>${(free ? 0 : parseFloat(m.price) || 0).toFixed(2)} PLN</g:price></g:shipping>`,
        ),
      ];
      const item = (lines: string[]) => `<item>\n  ${lines.join("\n  ")}\n</item>`;

      // Jeden rozmiar na pozycję: rozmiary to warianty jednej grupy. Stan
      // i cena są wspólne dla produktu, bo sklep nie trzyma ich per rozmiar.
      if (p.sizes.length > 1) {
        return p.sizes.slice(0, 30).map((size) =>
          item([
            `<g:id>${xml(`${p.id}-${size}`.slice(0, 50))}</g:id>`,
            `<g:item_group_id>${xml(p.id)}</g:item_group_id>`,
            `<g:size>${xml(size)}</g:size>`,
            ...common,
          ]),
        );
      }
      return [
        item([
          `<g:id>${xml(p.id)}</g:id>`,
          ...(p.sizes.length === 1 ? [`<g:size>${xml(p.sizes[0])}</g:size>`] : []),
          ...common,
        ]),
      ];
    });

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">`,
    `<channel>`,
    `<title>${xml(input.shopName)}</title>`,
    `<link>${xml(input.homeUrl)}</link>`,
    `<description>${xml(`Produkty sklepu ${input.shopName}`)}</description>`,
    ...items,
    `</channel>`,
    `</rss>`,
    ``,
  ].join("\n");
}
