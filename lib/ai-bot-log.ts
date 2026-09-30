import "server-only";
import { after } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { visits } from "@/lib/db/schema";
import { detectAiBot } from "@/lib/agent-commerce";

/**
 * Zapis wizyty bota AI. Boty nie wykonują JavaScriptu, więc beacon
 * TrackVisit ich nie widzi; łapiemy je po User-Agencie przy renderowaniu
 * strony na serwerze. Wiersz trafia do `visits` ze źródłem "ai_bot" (token bota
 * w `referrerHost`, np. "GPTBot"), bez nowej tabeli. Statystyki ruchu ludzi
 * pomijają te wiersze, a karta „Boty AI” liczy tylko je.
 *
 * Zapis idzie przez after(), czyli po wysłaniu odpowiedzi: bot nie czeka na
 * bazę, a błąd zapisu nie psuje strony.
 */
export async function logAiBotVisit(shopId: string, path?: string): Promise<void> {
  const h = await headers();
  const ua = h.get("user-agent");
  const bot = detectAiBot(ua);
  if (!bot) return;
  after(async () => {
    try {
      await db.insert(visits).values({
        shopId,
        path: (path ?? h.get("x-sf-path") ?? "/").slice(0, 512),
        source: "ai_bot",
        aiSource: null,
        referrerHost: bot.token,
        visitorId: null,
      });
    } catch {
      // Analityka nigdy nie może zepsuć odpowiedzi.
    }
  });
}
