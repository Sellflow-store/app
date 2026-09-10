/**
 * Jednorazowy skrypt: dane firmy HAGI do regulaminu i polityki prywatności.
 *
 * Dokumenty składają się z klucza `legal` przy każdym wyświetleniu (mode
 * „generated"), więc wystarczy uzupełnić dane — nie ma czego przepisywać do
 * treści. `account.company` wypełniam tym samym, żeby panel „Konto i firma"
 * nie świecił pustkami.
 *
 * E-mail kontaktowy (kontakt@hagastore.pl) idzie w trzy miejsca naraz: do
 * dokumentów, do konta i do sekcji „O nas" — z tej ostatniej bierze go strona
 * „Kontakt" i przycisk produktów na zamówienie.
 *
 *   node_modules/.bin/tsx scripts/haga-dane-firmy.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const COMPANY_NAME = "HAGA Agnieszka Hetman";
const COMPANY_ADDRESS = "ul. Konwaliowa 12/1, 62-052 Komorniki, Polska";
const TAX_ID = "777 119 33 60";
const EMAIL = "kontakt@hagastore.pl";

const LEGAL = {
  companyName: COMPANY_NAME,
  companyAddress: COMPANY_ADDRESS,
  taxId: TAX_ID,
  regon: "",
  krs: "",
  email: EMAIL,
  phone: "",
  // Puste = adres do zwrotów spada na adres siedziby (fallback „auto").
  returnAddress: "",
  sells: { physical: true, digital: false, services: false },
  contractMoment: "confirmation",
  // Od klientki (2026-09-10): średnio 7 dni, przy zamówieniach szytych na
  // miarę do 14. Szablon dokleja „dni roboczych", więc wartość to sam człon
  // liczbowy zdania.
  fulfillmentDays: "7, a przy zamówieniach szytych na miarę do 14",
  effectiveDate: "2026-09-10",
  // Spódnice i spodnie szyte na miarę = produkty personalizowane. Klauzula
  // dotyczy WYŁĄCZNIE ich, standardowa rozmiarówka zachowuje 14 dni na zwrot.
  personalizedProducts: true,
  clauses: [],
};

const ACCOUNT = {
  firstName: "Agnieszka",
  lastName: "Hetman",
  contactEmail: EMAIL,
  phone: "",
  company: { name: COMPANY_NAME, taxId: TAX_ID, address: COMPANY_ADDRESS },
};

async function upsert(shopId: string, key: string, value: unknown) {
  // shop_config ma klucz złożony (shop_id, key) i NIE ma kolumny id.
  await sql`
    insert into shop_config (shop_id, key, value)
    values (${shopId}, ${key}, ${JSON.stringify(value)}::jsonb)
    on conflict (shop_id, key)
    do update set value = excluded.value, updated_at = now()`;
  console.log(`\u2713 ${key} zapisany`);
}

async function main() {
  const [shop] = await sql`select id from shops where slug = ${"haga"}`;
  if (!shop) throw new Error("Nie ma sklepu haga");
  await upsert(shop.id, "legal", LEGAL);
  await upsert(shop.id, "account", ACCOUNT);

  // Ten sam adres na stronie „Kontakt" i w CTA produktów na zamówienie —
  // reszta klucza `about` (treść „O nas", telefon, adres) zostaje nietknięta.
  const [aboutRow] = await sql`
    select value from shop_config where shop_id = ${shop.id} and key = ${"about"}`;
  const about = { ...((aboutRow?.value as Record<string, unknown>) ?? {}), email: EMAIL };
  await upsert(shop.id, "about", about);
}

main();
