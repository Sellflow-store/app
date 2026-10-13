/**
 * Jednorazowy skrypt: e-mail logowania HAGI (Ustawienia → Konto i firma → „Email")
 * z technicznego haga@sell-flow.store na contact@hagastore.pl.
 *
 * To drugi adres niż „Email kontaktowy" (ten zmienia haga-zmiana-emaila.ts).
 * Adres konta żyje w dwóch miejscach, które nie są ze sobą zsynchronizowane
 * (brak webhooka Clerka), więc skrypt zmienia oba:
 *   1. Clerk: dodaje nowy adres jako zweryfikowany i główny, potem usuwa stary.
 *      Od tej chwili logowanie i kody e-mail idą na contact@hagastore.pl.
 *   2. `users.email` (to czyta panel i `TeamSection`).
 *
 * Wyjątek: gdy `users.clerk_id` jest placeholderem (`pending:haga`), właściciel
 * nigdy nie miał konta w Clerku. Wtedy robimy to w dwóch przebiegach:
 *   1. pierwszy `--apply` zmienia tylko `users.email`,
 *   2. po rejestracji w Clerku adresem contact@hagastore.pl (z potwierdzonym
 *      kodem z maila) ten sam skrypt, puszczony drugi raz z `--apply`, podpina
 *      to konto: ustawia `users.clerk_id` na id konta z Clerka. Sklep działa
 *      wtedy od razu po zalogowaniu, bez przechodzenia kreatora.
 *
 * Adres dodajemy jako zweryfikowany bez wysyłania kodu, więc skrzynka
 * contact@hagastore.pl musi działać, zanim ktoś użyje „Nie pamiętam hasła".
 *
 * Uruchomienie — najpierw na sucho, potem z --apply (wymaga CLERK_SECRET_KEY
 * i DATABASE_URL w .env.local):
 *   npx tsx --env-file=.env.local scripts/haga-zmiana-emaila-konta.ts
 *   npx tsx --env-file=.env.local scripts/haga-zmiana-emaila-konta.ts --apply
 *
 * Idempotentny: gdy konto ma już nowy adres, niczego nie zmienia.
 */
import { createClerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { shops, users } from "../lib/db/schema";

const NEW_EMAIL = "contact@hagastore.pl";
const apply = process.argv.includes("--apply");

async function main() {
  const [owner] = await db
    .select({ id: users.id, clerkId: users.clerkId, email: users.email })
    .from(shops)
    .innerJoin(users, eq(shops.ownerId, users.id))
    .where(eq(shops.slug, "haga"));
  if (!owner) throw new Error("Nie ma sklepu haga");

  // Adres zajęty przez inne konto w bazie: unique na users.email by odmówił.
  const [clash] = await db.select({ id: users.id }).from(users).where(eq(users.email, NEW_EMAIL));
  if (clash && clash.id !== owner.id) throw new Error(`${NEW_EMAIL} należy już do innego konta`);

  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
  const pending = owner.clerkId.startsWith("pending:");
  console.log(`users.email: ${owner.email}  |  clerk_id: ${owner.clerkId}${pending ? "  (placeholder, brak konta w Clerku)" : ""}`);
  console.log(`Cel:         ${NEW_EMAIL}${apply ? "" : "  (na sucho, dodaj --apply)"}`);

  if (pending) {
    // Właściciel nigdy się nie zalogował: wiersz w `users` ma tymczasowy clerk_id
    // (np. `pending:haga`), którego Clerk nie zna. Nie ma czego zmieniać w Clerku.
    // Jeśli ktoś już założył konto z nowym adresem, podpinamy je do wiersza.
    // Jeśli nie, zmieniamy tylko `users.email`: przy pierwszej rejestracji tym
    // adresem /api/onboarding sam podepnie jej clerk_id do tego wiersza.
    const { data } = await clerk.users.getUserList({ emailAddress: [NEW_EMAIL], limit: 2 });
    const existing = data[0];
    // Podpinamy tylko konto z zweryfikowanym adresem: clerk_id daje pełny dostęp
    // do sklepu, więc nie może trafić do kogoś, kto adresu nie potwierdził.
    const match = existing?.emailAddresses.find((e) => e.emailAddress.toLowerCase() === NEW_EMAIL);
    if (existing && match?.verification?.status !== "verified") {
      throw new Error(`Konto ${existing.id} ma niezweryfikowany adres ${NEW_EMAIL}, najpierw potwierdź kod z maila`);
    }
    console.log(
      existing
        ? `Clerk ma już konto ${NEW_EMAIL} (${existing.id}), zostanie podpięte do sklepu.`
        : `Clerk nie ma jeszcze konta ${NEW_EMAIL}, trzeba zarejestrować się tym adresem.`
    );
    if (!apply) return;
    await db
      .update(users)
      .set({ email: NEW_EMAIL, ...(existing ? { clerkId: existing.id } : {}), updatedAt: new Date() })
      .where(eq(users.id, owner.id));
    console.log(`\u2713 users.email zaktualizowany${existing ? ", clerk_id podpięty" : ""}`);
    return;
  }

  const user = await clerk.users.getUser(owner.clerkId);
  const current = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
  console.log(`Clerk: ${current?.emailAddress ?? "(brak)"}`);
  if (!apply) return;

  let target = user.emailAddresses.find((e) => e.emailAddress === NEW_EMAIL);
  if (!target) {
    target = await clerk.emailAddresses.createEmailAddress({
      userId: user.id,
      emailAddress: NEW_EMAIL,
      verified: true,
      primary: true,
    });
    console.log("\u2713 Clerk: dodano nowy adres jako główny");
  } else if (user.primaryEmailAddressId !== target.id) {
    await clerk.emailAddresses.updateEmailAddress(target.id, { verified: true, primary: true });
    console.log("\u2713 Clerk: nowy adres ustawiony jako główny");
  }

  for (const e of user.emailAddresses) {
    if (e.id !== target.id) {
      await clerk.emailAddresses.deleteEmailAddress(e.id);
      console.log(`\u2713 Clerk: usunięto ${e.emailAddress}`);
    }
  }

  await db.update(users).set({ email: NEW_EMAIL, updatedAt: new Date() }).where(eq(users.id, owner.id));
  console.log("\u2713 users.email zaktualizowany");
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
