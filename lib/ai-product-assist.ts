import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";

/**
 * Asystent danych produktu: z nazwy, opisu i pierwszego zdjęcia proponuje
 * materiał, kategorię i krótki opis. Sprzedawca tylko zatwierdza, bo wąskim
 * gardłem kompletności katalogu jest jego cierpliwość do wypełniania pól,
 * a nie brak wiedzy o produkcie.
 *
 * Działa, gdy w środowisku jest ANTHROPIC_API_KEY. Bez klucza przycisk
 * w panelu się nie pokazuje.
 */

export function productAssistConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

const SuggestionSchema = z.object({
  material: z.string().describe("Materiał lub skład, np. „100% jedwab”. Pusty, gdy nie wynika z danych."),
  category: z.string().describe("Kategoria produktu: jedna z istniejących, jeśli pasuje, inaczej krótka nowa nazwa."),
  shortDesc: z.string().describe("Krótki opis produktu, 1–2 zdania, maks. 200 znaków."),
});

export type ProductSuggestion = z.infer<typeof SuggestionSchema>;

export interface SuggestInput {
  name: string;
  description: string;
  shortDesc: string;
  category: string;
  existingCategories: string[];
  imageUrl: string | null;
}

const SYSTEM = [
  "Pomagasz właścicielom małych sklepów internetowych uzupełnić dane produktu tak, żeby Google i asystenci AI mogli go poprawnie polecać.",
  "Piszesz po polsku, rzeczowo, bez przymiotników marketingowych i bez wykrzykników.",
  "Materiał podajesz tylko wtedy, gdy wynika z opisu, nazwy albo jednoznacznie ze zdjęcia. Nie zgaduj składu procentowego, którego nie ma w danych; gdy nie wiesz, zostaw pole puste.",
  "Kategorię wybierz z listy istniejących kategorii sklepu, jeśli któraś pasuje. Nową proponuj tylko wtedy, gdy żadna nie pasuje: jedno lub dwa słowa, liczba mnoga, wielka litera na początku.",
  "Krótki opis: jedno lub dwa zdania, do 200 znaków, mówiące czym jest produkt i z czego jest zrobiony.",
].join("\n");

function htmlToText(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export async function suggestProductData(input: SuggestInput): Promise<ProductSuggestion | null> {
  const client = new Anthropic();

  const text = [
    `Nazwa produktu: ${input.name}`,
    `Opis: ${htmlToText(input.description).slice(0, 6000) || "(brak)"}`,
    `Obecny krótki opis: ${input.shortDesc || "(brak)"}`,
    `Obecna kategoria: ${input.category || "(brak)"}`,
    `Istniejące kategorie sklepu: ${input.existingCategories.join(", ") || "(brak)"}`,
  ].join("\n");

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (input.imageUrl && /^https:\/\//.test(input.imageUrl)) {
    content.push({ type: "image", source: { type: "url", url: input.imageUrl } });
  }
  content.push({ type: "text", text });

  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    system: SYSTEM,
    messages: [{ role: "user", content }],
    // Proste wydobycie danych: niski wysiłek wystarcza i skraca czas odpowiedzi.
    output_config: { effort: "low", format: betaZodOutputFormat(SuggestionSchema) },
    // Gdy filtr bezpieczeństwa odrzuci zapytanie, API samo ponawia je na
    // modelu zapasowym, zamiast zwracać sprzedawcy błąd.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });

  if (response.stop_reason === "refusal") return null;
  const out = response.parsed_output;
  if (!out) return null;
  return {
    material: out.material.trim().slice(0, 200),
    category: out.category.trim().slice(0, 60),
    shortDesc: out.shortDesc.trim().slice(0, 240),
  };
}
