import { clauseGroupsByIds } from "./clauses";
import type { LegalVars } from "./data";

/**
 * Generatory regulaminu i polityki prywatności — wzory od prawnika, w których
 * miejsca „[…]" i checkboxy zastąpiliśmy danymi sklepu. Nic tu nie jest
 * wpisywane ręcznie przez merchanta: wszystko przychodzi w `LegalVars`.
 */

// ─── Model dokumentu ──────────────────────────────────────────────────────────

type Item = string | { text: string; sub: string[] };

interface Section {
  title: string;
  items: Item[];
}

/** Placeholder w miejscu brakującej danej — widoczny gołym okiem, żeby nikt
 *  nie opublikował regulaminu z pustą dziurą po NIP-ie. */
function need(value: string, label: string): string {
  return value.trim() || `[UZUPEŁNIJ: ${label}]`;
}

const MONTHS = [
  "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
  "lipca", "sierpnia", "września", "października", "listopada", "grudnia",
];

/** "2026-07-11" → "11 lipca 2026"; cokolwiek innego zwracamy bez zmian. */
export function formatLegalDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso.trim();
  const month = MONTHS[Number(m[2]) - 1];
  if (!month) return iso.trim();
  return `${Number(m[3])} ${month} ${m[1]}`;
}

function renderSections(title: string, sections: Section[]): string {
  const body = sections
    .map((s, si) => {
      const items = s.items
        .map((item, ii) => {
          const n = ii + 1;
          if (typeof item === "string") return `${n}. ${item}`;
          const sub = item.sub
            .map((t, k) => {
              // Ostatnia pozycja wyliczenia kończy się kropką, nie przecinkiem —
              // pozycje przychodzą z przecinkiem, bo lista bywa ucinana warunkami.
              const last = k === item.sub.length - 1;
              const text = last ? t.replace(/[,;]\s*$/, ".") : t;
              return `   ${String.fromCharCode(97 + k)}) ${text}`;
            })
            .join("\n");
          return `${n}. ${item.text}\n${sub}`;
        })
        .join("\n");
      return `§${si + 1}. ${s.title}\n${items}`;
    })
    .join("\n\n");
  return `${title}\n\n${body}`;
}

/** Wylicza listę w zdaniu: „a, b oraz c". */
function enumerate(items: string[], fallback: string): string {
  const clean = items.filter(Boolean);
  if (clean.length === 0) return fallback;
  if (clean.length === 1) return clean[0];
  return `${clean.slice(0, -1).join(", ")} oraz ${clean[clean.length - 1]}`;
}

/** Zdanie z §1: czym sklep handluje. */
function salesDescription(v: LegalVars): string {
  const kinds: string[] = [];
  if (v.sells.physical) kinds.push("towarów fizycznych");
  if (v.sells.digital) kinds.push("produktów cyfrowych (treści cyfrowych)");
  if (v.sells.services) kinds.push("usług");
  return enumerate(kinds, "towarów fizycznych");
}

// ─── Regulamin ────────────────────────────────────────────────────────────────

export function buildTerms(v: LegalVars): string {
  const seller = [
    need(v.companyName, "nazwa firmy"),
    need(v.companyAddress, "adres siedziby"),
    `NIP: ${need(v.taxId, "NIP")}`,
    v.regon ? `REGON: ${v.regon}` : "",
    v.krs ? `KRS: ${v.krs}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const contact = [
    `e-mail: ${need(v.email, "e-mail kontaktowy")}`,
    v.phone ? `telefon: ${v.phone}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const sections: Section[] = [];

  sections.push({
    title: "Informacje o sklepie",
    items: [
      `Niniejszy Regulamin dotyczy sklepu internetowego ${v.shopName}, prowadzonego pod adresem ${v.shopUrl}.`,
      `Właścicielem Sklepu (dalej: „Sprzedawca") jest: ${seller}.`,
      `Kontakt ze Sprzedawcą: ${contact}.`,
      `Sklep prowadzi sprzedaż ${salesDescription(v)}.`,
      "Regulamin określa zasady składania zamówień, płatności, dostawy, reklamacji oraz zwrotów.",
    ],
  });

  sections.push({
    title: "Składanie zamówień",
    items: [
      "Zakupy w Sklepie można dokonywać przez całą dobę.",
      {
        text: "Aby złożyć zamówienie, Klient:",
        sub: [
          "wybiera produkt,",
          "dodaje go do koszyka,",
          "podaje dane niezbędne do realizacji zamówienia,",
          "wybiera metodę dostawy i płatności,",
          "potwierdza zamówienie.",
        ],
      },
      "Po złożeniu zamówienia Klient otrzymuje potwierdzenie na adres e-mail.",
      v.contractMoment === "payButton"
        ? "Umowa sprzedaży zostaje zawarta z chwilą kliknięcia przez Klienta przycisku „zamawiam i płacę”."
        : "Umowa sprzedaży zostaje zawarta z chwilą potwierdzenia przyjęcia zamówienia przez Sprzedawcę.",
    ],
  });

  const paymentItems: Item[] = [
    "Wszystkie ceny podane w Sklepie są cenami brutto i wyrażone są w złotych polskich.",
    v.payments.length
      ? { text: "Dostępne metody płatności:", sub: v.payments.map((p) => `${p},`) }
      : "Dostępne metody płatności prezentowane są Klientowi w koszyku przed złożeniem zamówienia.",
    "W przypadku płatności przelewem zamówienie jest realizowane po zaksięgowaniu wpłaty na rachunku Sprzedawcy.",
  ];
  if (v.clauses.includes("subskrypcje")) {
    paymentItems.push(
      "W przypadku płatności cyklicznych (subskrypcji) Klient jest informowany o zasadach i częstotliwości pobierania opłat przed zawarciem umowy."
    );
  }
  sections.push({ title: "Ceny i płatności", items: paymentItems });

  const deliveryForms: string[] = [];
  if (v.sells.physical) deliveryForms.push("dostawę fizyczną (przesyłką)");
  if (v.sells.digital) deliveryForms.push("dostawę cyfrową (drogą elektroniczną)");
  if (v.hasPickup) deliveryForms.push("odbiór osobisty");

  const deliveryItems: Item[] = [
    "Zamówienia realizowane są na adres wskazany przez Klienta lub w formie elektronicznej.",
    { text: "Dostawa może obejmować:", sub: deliveryForms.map((d) => `${d},`) },
  ];
  if (v.shipping.length) {
    deliveryItems.push({
      text: "Dostępne metody dostawy:",
      sub: v.shipping.map((d) => `${d},`),
    });
  }
  deliveryItems.push(
    `Standardowy czas realizacji zamówienia wynosi ${need(v.fulfillmentDays, "czas realizacji")} dni roboczych, chyba że przy produkcie wskazano inaczej.`
  );
  if (v.sells.physical) {
    deliveryItems.push(
      "W przypadku towarów fizycznych ryzyko utraty lub uszkodzenia przechodzi na Klienta z chwilą wydania towaru przewoźnikowi, z zastrzeżeniem przepisów dotyczących konsumentów."
    );
  }
  sections.push({ title: "Dostawa", items: deliveryItems });

  sections.push({
    title: "O produktach",
    items: [
      "Oferowane produkty mają charakter zgodny z opisem w Sklepie.",
      {
        text: "W zależności od rodzaju produktu mogą występować:",
        sub: [
          "naturalne różnice wynikające z materiału lub technologii,",
          "konieczność prawidłowego użytkowania zgodnie z przeznaczeniem,",
          "ograniczenia wynikające ze specyfiki produktu.",
        ],
      },
      "Sprzedawca nie odpowiada za szkody wynikające z niewłaściwego użytkowania produktów.",
    ],
  });

  sections.push({
    title: "Użytkowanie i bezpieczeństwo",
    items: [
      "Produkty powinny być używane zgodnie z ich przeznaczeniem.",
      "Klient zobowiązany jest do przestrzegania instrukcji użytkowania, jeżeli została udostępniona.",
      "Sprzedawca nie ponosi odpowiedzialności za skutki nieprawidłowego użytkowania.",
    ],
  });

  sections.push({
    title: "Reklamacje",
    items: [
      "W przypadku stwierdzenia niezgodności towaru z umową Klient ma prawo złożyć reklamację.",
      {
        text: "Reklamację można zgłosić:",
        sub: [
          `e-mailowo na adres ${need(v.email, "e-mail kontaktowy")},`,
          `pisemnie na adres ${need(v.companyAddress, "adres siedziby")}.`,
        ],
      },
      {
        text: "Reklamacja powinna zawierać:",
        sub: ["opis problemu,", "numer zamówienia,", "dane kontaktowe."],
      },
      "Reklamacje rozpatrywane są w terminie 14 dni od dnia otrzymania zgłoszenia.",
    ],
  });

  const withdrawalStart: string[] = [];
  if (v.sells.physical) withdrawalStart.push("dnia otrzymania towaru — w przypadku towarów fizycznych,");
  if (v.sells.digital || v.sells.services)
    withdrawalStart.push("dnia zawarcia umowy — w przypadku usług i treści cyfrowych,");

  const exclusions: string[] = [];
  if (v.sells.services)
    exclusions.push("rozpoczęto świadczenie usług za wyraźną zgodą konsumenta,");
  if (v.sells.digital)
    exclusions.push("rozpoczęto dostarczanie treści cyfrowych za wyraźną zgodą konsumenta,");
  if (v.personalizedProducts)
    exclusions.push("produkt został wykonany na indywidualne zamówienie konsumenta,");

  const withdrawalItems: Item[] = [
    "Konsument ma prawo odstąpić od umowy w terminie 14 dni bez podania przyczyny.",
    withdrawalStart.length
      ? { text: "Termin liczy się od:", sub: withdrawalStart }
      : "Termin liczy się od dnia otrzymania towaru.",
    `Oświadczenie o odstąpieniu należy przesłać na adres e-mail ${need(v.email, "e-mail kontaktowy")}.`,
    `Zwracany produkt należy odesłać na adres: ${need(v.returnAddress, "adres do zwrotów")}, w terminie 14 dni od odstąpienia od umowy.`,
    "Koszt zwrotu ponosi Klient, chyba że Sprzedawca postanowi inaczej.",
    "Zwrot płatności następuje niezwłocznie, nie później niż w terminie 14 dni od dnia otrzymania oświadczenia o odstąpieniu od umowy. Sprzedawca może wstrzymać się ze zwrotem płatności do chwili otrzymania zwracanego Produktu lub dostarczenia przez Konsumenta dowodu jego odesłania, w zależności od tego, które zdarzenie nastąpi wcześniej.",
    "Klient będący Konsumentem może złożyć oświadczenie o odstąpieniu od umowy również za pomocą funkcjonalności elektronicznej udostępnionej przez Sprzedawcę w Sklepie lub w koncie Klienta, jeżeli taka funkcjonalność jest dostępna. Po otrzymaniu oświadczenia złożonego drogą elektroniczną Sprzedawca niezwłocznie potwierdza jego otrzymanie na trwałym nośniku, w szczególności za pośrednictwem poczty elektronicznej. Skorzystanie z elektronicznej funkcjonalności odstąpienia nie wyłącza możliwości złożenia oświadczenia w inny sposób przewidziany przepisami prawa.",
  ];
  if (exclusions.length) {
    withdrawalItems.splice(2, 0, {
      text: "Prawo odstąpienia nie przysługuje w przypadkach przewidzianych przepisami prawa, w szczególności gdy:",
      sub: exclusions,
    });
  }
  if (v.personalizedProducts) {
    withdrawalItems.push(
      "Prawo odstąpienia od umowy zawartej na odległość nie przysługuje w odniesieniu do Produktów Personalizowanych, tj. produktów wykonywanych według specyfikacji Konsumenta lub służących zaspokojeniu jego indywidualnych potrzeb, w rozumieniu art. 38 ust. 1 pkt 3 ustawy o prawach konsumenta.",
      "Za produkty personalizowane uważa się w szczególności produkty zawierające wskazane przez Konsumenta napisy, grafiki, zdjęcia, oznaczenia, dedykacje, logo lub inne elementy indywidualizujące, a także produkty wykonane lub zmodyfikowane zgodnie z wytycznymi Konsumenta.",
      "Powyższe nie wyłącza uprawnień Konsumenta wynikających z przepisów dotyczących odpowiedzialności Sprzedawcy za niezgodność towaru z umową."
    );
  }
  sections.push({ title: "Zwroty (odstąpienie od umowy)", items: withdrawalItems });

  if (v.sells.physical) {
    sections.push({
      title: "Stan zwracanych produktów",
      items: [
        "Zwracany produkt powinien być w stanie umożliwiającym jego dalszą odsprzedaż.",
        "W przypadku produktów fizycznych oznacza to brak uszkodzeń wykraczających poza zwykłe sprawdzenie charakteru produktu.",
      ],
    });
  }

  sections.push({
    title: "Dane osobowe",
    items: [
      "Dane osobowe Klientów są przetwarzane zgodnie z obowiązującymi przepisami prawa.",
      "Administratorem danych jest Sprzedawca.",
      "Szczegółowe zasady przetwarzania danych osobowych, w tym informacje o odbiorcach danych oraz wykorzystywanych systemach informatycznych, określa Polityka Prywatności dostępna na stronie Sklepu.",
    ],
  });

  sections.push({
    title: "Pliki cookies",
    items: [
      {
        text: "Sklep wykorzystuje pliki cookies w celu:",
        sub: ["zapewnienia działania serwisu,", "analizy ruchu,", "działań marketingowych."],
      },
      "Użytkownik może zarządzać cookies w ustawieniach przeglądarki.",
    ],
  });

  const groups = clauseGroupsByIds(v.clauses);
  if (groups.length) {
    sections.push({
      title: "Postanowienia szczególne dotyczące oferowanych produktów",
      items: groups.flatMap((g) => g.clauses),
    });
  }

  sections.push({
    title: "Postanowienia końcowe",
    items: [
      `Regulamin obowiązuje od dnia ${need(formatLegalDate(v.effectiveDate), "data obowiązywania")} r.`,
      {
        text: "Sprzedawca może zmieniać Regulamin z ważnych przyczyn, w szczególności:",
        sub: ["zmiany prawa,", "zmiany funkcjonalności Sklepu,", "zmiany modelu sprzedaży."],
      },
      "Zmiany Regulaminu nie wpływają na zamówienia złożone przed ich wejściem w życie.",
      "W sprawach nieuregulowanych stosuje się przepisy prawa polskiego oraz Unii Europejskiej, w szczególności Kodeksu cywilnego oraz ustawy o prawach konsumenta.",
    ],
  });

  return renderSections(`REGULAMIN SKLEPU INTERNETOWEGO ${v.shopName.toUpperCase()}`, sections);
}

// ─── Polityka prywatności ─────────────────────────────────────────────────────

export function buildPrivacy(v: LegalVars): string {
  const admin = [
    need(v.companyName, "nazwa firmy"),
    `z siedzibą: ${need(v.companyAddress, "adres siedziby")}`,
    `NIP: ${need(v.taxId, "NIP")}`,
    v.regon ? `REGON: ${v.regon}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const sections: Section[] = [
    {
      title: "Postanowienia ogólne",
      items: [
        `Niniejsza Polityka Prywatności określa zasady przetwarzania danych osobowych Klientów sklepu internetowego działającego pod nazwą ${v.shopName}, dostępnego pod adresem ${v.shopUrl} (dalej: „Sklep").`,
        `Administratorem danych osobowych jest ${admin} (dalej: „Administrator").`,
        "Dane osobowe przetwarzane są zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO).",
      ],
    },
    {
      title: "Zakres przetwarzanych danych",
      items: [
        {
          text: "Administrator może przetwarzać w szczególności:",
          sub: [
            "dane identyfikacyjne (imię, nazwisko, firma),",
            "dane kontaktowe (e-mail, telefon),",
            "dane adresowe (adres dostawy i rozliczeń),",
            "dane transakcyjne (zamówienia, płatności),",
            "dane techniczne (adres IP, cookies, dane urządzenia),",
            "dane dotyczące aktywności w Sklepie.",
          ],
        },
      ],
    },
    {
      title: "Cele i podstawy przetwarzania danych",
      items: [
        {
          text: "Dane osobowe są przetwarzane w celu:",
          sub: [
            "realizacji umów sprzedaży (art. 6 ust. 1 lit. b RODO),",
            "obsługi zamówień, płatności i dostaw,",
            "realizacji obowiązków prawnych, w tym podatkowych i rachunkowych (art. 6 ust. 1 lit. c RODO),",
            "obsługi reklamacji i zwrotów,",
            "prowadzenia komunikacji z Klientem,",
            "zapewnienia bezpieczeństwa Sklepu,",
            "marketingu — jeżeli Klient wyraził zgodę (art. 6 ust. 1 lit. a RODO),",
            "realizacji prawnie uzasadnionego interesu Administratora (art. 6 ust. 1 lit. f RODO).",
          ],
        },
      ],
    },
    {
      title: "Odbiorcy danych",
      items: [
        {
          text: "Dane osobowe mogą być przekazywane:",
          sub: [
            "operatorom płatności,",
            "firmom kurierskim i logistycznym,",
            "dostawcom usług IT i hostingu,",
            "dostawcom narzędzi analitycznych i marketingowych,",
            "biurom rachunkowym i kancelariom prawnym,",
            "podmiotom świadczącym usługi niezbędne do funkcjonowania Sklepu.",
          ],
        },
        "Sklep działa na platformie Sellflow, która świadczy na rzecz Administratora usługi techniczne umożliwiające prowadzenie Sklepu.",
      ],
    },
    {
      title: "Przekazywanie danych podmiotom przetwarzającym",
      items: [
        "Dane osobowe mogą być przetwarzane przez podmioty świadczące usługi na rzecz Administratora, w szczególności dostawców systemów informatycznych, hostingu, płatności oraz narzędzi wspierających prowadzenie Sklepu.",
        "Podmioty te przetwarzają dane wyłącznie na podstawie umów powierzenia przetwarzania danych i zgodnie z poleceniami Administratora.",
      ],
    },
    {
      title: "Narzędzia do obsługi Sklepu (w tym generowanie dokumentów)",
      items: [
        "W ramach prowadzenia Sklepu Administrator może korzystać z zewnętrznych narzędzi informatycznych służących do obsługi działalności, w tym do generowania dokumentów prawnych, regulaminów oraz polityk.",
        "W takim przypadku dostawca narzędzia może przetwarzać dane osobowe wyłącznie w zakresie niezbędnym do świadczenia usług na rzecz Administratora i na podstawie umowy powierzenia przetwarzania danych (art. 28 RODO).",
        "Dostawca narzędzia nie wykorzystuje danych do własnych celów.",
      ],
    },
    {
      title: "Okres przechowywania danych",
      items: [
        {
          text: "Dane osobowe są przechowywane przez okres:",
          sub: [
            "realizacji umowy,",
            "wymagany przepisami prawa,",
            "niezbędny do ustalenia, dochodzenia lub obrony roszczeń,",
            "w przypadku marketingu — do czasu cofnięcia zgody.",
          ],
        },
      ],
    },
    {
      title: "Prawa osób, których dane dotyczą",
      items: [
        {
          text: "Osobie, której dane dotyczą, przysługuje prawo do:",
          sub: [
            "dostępu do danych,",
            "ich sprostowania,",
            "usunięcia,",
            "ograniczenia przetwarzania,",
            "przenoszenia danych,",
            "wniesienia sprzeciwu,",
            "cofnięcia zgody w dowolnym momencie.",
          ],
        },
        "Osobie, której dane dotyczą, przysługuje również prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.",
      ],
    },
    {
      title: "Pliki cookies",
      items: [
        {
          text: "Sklep wykorzystuje pliki cookies w celu:",
          sub: ["zapewnienia działania serwisu,", "analityki,", "marketingu."],
        },
        "Użytkownik może zarządzać plikami cookies w ustawieniach przeglądarki.",
      ],
    },
    {
      title: "Kontakt",
      items: [
        `Kontakt w sprawach danych osobowych: ${need(v.email, "e-mail kontaktowy")}${v.phone ? `, telefon: ${v.phone}` : ""}.`,
        `Polityka obowiązuje od dnia ${need(formatLegalDate(v.effectiveDate), "data obowiązywania")} r.`,
      ],
    },
  ];

  return renderSections(`POLITYKA PRYWATNOŚCI SKLEPU ${v.shopName.toUpperCase()}`, sections);
}
