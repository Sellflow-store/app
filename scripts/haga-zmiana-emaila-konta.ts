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

  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
  const user = await clerk.users.getUser(owner.clerkId);
  const current = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
  console.log(`Clerk: ${current?.emailAddress ?? "(brak)"}  |  users.email: ${owner.email}`);
  console.log(`Cel:   ${NEW_EMAIL}${apply ? "" : "  (na sucho, dodaj --apply)"}`);

  // Adres zajęty przez inne konto: Clerk i tak by odmówił, a unique na users.email też.
  const [clash] = await db.select({ id: users.id }).from(users).where(eq(users.email, NEW_EMAIL));
  if (clash && clash.id !== owner.id) throw new Error(`${NEW_EMAIL} należy już do innego konta`);

  if (!apply) return;

  let target = user.emailAddresses.find((e) => e.emailAddress === NEW_EMAIL);
  if (!target) {
    target = await clerk.emailAddresses.createEmailAddress({
      userId: user.id,
      emailAddress: NEW_EMAIL,
      verified: true,
      primary: true,
    });
    console.log("✓ Clerk: dodano nowy adres jako główny");
  } else if (user.primaryEmailAddressId !== target.id) {
    await clerk.emailAddresses.updateEmailAddress(target.id, { verified: true, primary: true });
    console.log("✓ Clerk: nowy adres ustawiony jako główny");
  }

  for (const e of user.emailAddresses) {
    if (e.id !== target.id) {
      await clerk.emailAddresses.deleteEmailAddress(e.id);
      console.log(`✓ Clerk: usunięto ${e.emailAddress}`);
    }
  }

  await db.update(users).set({ email: NEW_EMAIL, updatedAt: new Date() }).where(eq(users.id, owner.id));
  console.log("✓ users.email zaktualizowany");
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
