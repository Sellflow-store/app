/**
 * Jednorazowy skrypt: rola admina (panel admin.sell-flow.store) dla konta
 * podanego adresem e-mail.
 *
 * Dostęp do /ops i /api/ops/* zależy od `users.role = 'admin'`, a ta rola daje
 * też wgląd w wszystkie sklepy (lib/api.ts) i upload (app/api/upload). Wiersz
 * w `users` powstaje dopiero przy zapisie onboardingu, więc osoba musi się
 * najpierw zalogować i przejść kreator (albo mieć już sklep).
 *
 * Uruchomienie — najpierw na sucho, potem z --apply (wymaga DATABASE_URL):
 *   npx tsx --env-file=.env.local scripts/grant-admin.ts adres@example.com
 *   npx tsx --env-file=.env.local scripts/grant-admin.ts adres@example.com --apply
 *
 * Idempotentny. Cofnięcie: `update users set role = 'merchant' where email = '…'`.
 */
import { eq, sql } from "drizzle-orm";
import { db } from "../lib/db";
import { users } from "../lib/db/schema";

const apply = process.argv.includes("--apply");
const email = process.argv.slice(2).find((a) => !a.startsWith("--"))?.trim().toLowerCase();

async function main() {
  if (!email) throw new Error("Podaj adres e-mail: grant-admin.ts adres@example.com [--apply]");

  const [user] = await db
    .select({ id: users.id, email: users.email, role: users.role, clerkId: users.clerkId })
    .from(users)
    .where(eq(sql`lower(${users.email})`, email));
  if (!user) {
    throw new Error(`Brak użytkownika ${email} w bazie. Najpierw musi się zalogować i przejść kreator sklepu.`);
  }
  console.log(`${user.email}  |  rola: ${user.role}  |  clerk_id: ${user.clerkId}`);

  if (user.role === "admin") {
    console.log("Już admin, nic do zmiany.");
    return;
  }
  console.log(`Cel: rola admin${apply ? "" : "  (na sucho, dodaj --apply)"}`);
  if (!apply) return;

  await db.update(users).set({ role: "admin", updatedAt: new Date() }).where(eq(users.id, user.id));
  console.log("✓ rola ustawiona na admin");
}

main().then(() => process.exit(0), (e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
