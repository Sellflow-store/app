/**
 * Klauzule branżowe do regulaminu — treść z wzorów prawnika. Merchant zaznacza
 * kategorie pasujące do swojego asortymentu, a generator dokleja ich klauzule
 * jako osobny paragraf regulaminu. Treści są niezmienne: edytujemy je tylko
 * razem z prawnikiem, nigdy „przy okazji".
 */

export interface ClauseGroup {
  id: string;
  /** Etykieta w panelu. */
  label: string;
  /** Dla kogo — pomaga merchantowi trafić w swoją branżę. */
  hint: string;
  clauses: string[];
}

export const CLAUSE_GROUPS: ClauseGroup[] = [
  {
    id: "kosmetyki",
    label: "Kosmetyki",
    hint: "kosmetyki, skincare, perfumy, produkty higieniczne",
    clauses: [
      "Produkty kosmetyczne oferowane w Sklepie są wprowadzane do obrotu zgodnie z Rozporządzeniem (WE) nr 1223/2009 dotyczącym produktów kosmetycznych.",
      "Efekty stosowania produktów mogą różnić się w zależności od indywidualnych cech organizmu Klienta, w tym jego predyspozycji fizjologicznych, sposobu stosowania produktu oraz warunków jego używania, i nie stanowią gwarantowanego rezultatu.",
      "Sprzedawca nie ponosi odpowiedzialności za skutki wynikające z indywidualnych cech organizmu Klienta, w szczególności reakcji alergicznych lub nadwrażliwości, jeżeli produkt był używany zgodnie z jego przeznaczeniem oraz informacjami udostępnionymi przez Sprzedawcę, w tym ostrzeżeniami i składem produktu.",
      "Klient zobowiązany jest do korzystania z produktu zgodnie z jego przeznaczeniem, instrukcją użytkowania oraz zaleceniami producenta, a także z uwzględnieniem zasad bezpieczeństwa właściwych dla danego rodzaju produktu. W przypadku ich naruszenia Sprzedawca nie ponosi odpowiedzialności za skutki niewłaściwego użycia produktu w zakresie dopuszczalnym przez bezwzględnie obowiązujące przepisy prawa.",
    ],
  },
  {
    id: "handmade",
    label: "Rękodzieło / handmade",
    hint: "biżuteria, ceramika, dekoracje, produkty z drewna i skóry",
    clauses: [
      "Produkty wykonywane ręcznie mogą wykazywać naturalne różnice w zakresie koloru, faktury, kształtu i wykończenia, wynikające z ich rzemieślniczego charakteru i procesu produkcji. Różnice te stanowią cechę produktu i nie wpływają na jego zgodność z umową, o ile mieszczą się w granicach zwyczajowych dla tego rodzaju wyrobów.",
      "Zdjęcia produktów mają charakter poglądowy i mogą nie odzwierciedlać w pełni rzeczywistego wyglądu produktu. Poszczególne egzemplarze mogą różnić się od przedstawionych na zdjęciach w zakresie nieistotnym dla ich funkcjonalności, w szczególności w odniesieniu do odcienia, detali wykończenia lub elementów wynikających z procesu produkcyjnego.",
      "Naturalne cechy materiałów użytych do produkcji, takich jak w szczególności drewno, skóra naturalna czy tkaniny, w tym ich zróżnicowanie struktury, odcienia, usłojenia, faktury lub innych właściwości wynikających z ich naturalnego pochodzenia, stanowią cechę produktu i nie wpływają na jego zgodność z umową, o ile mieszczą się w granicach właściwych dla danego rodzaju materiału i nie naruszają jego funkcjonalności.",
    ],
  },
  {
    id: "elektronika",
    label: "Elektronika",
    hint: "urządzenia elektryczne, smart devices, IoT",
    clauses: [
      "Produkty, dla których jest to wymagane na podstawie obowiązujących przepisów prawa, są oznakowane znakiem CE oraz spełniają wymagania określone w mających zastosowanie przepisach prawa Unii Europejskiej dotyczących ich wprowadzania do obrotu.",
      "Sprzedawca nie gwarantuje pełnej kompatybilności produktu z każdym systemem lub urządzeniem, w szczególności w przypadkach, gdy kompatybilność zależy od czynników technicznych, konfiguracji oprogramowania, aktualizacji systemowych lub innych elementów pozostających poza kontrolą Sprzedawcy.",
      "W przypadku produktów cyfrowych lub urządzeń wyposażonych w funkcje cyfrowe mogą być dostarczane aktualizacje oprogramowania, w tym aktualizacje niezbędne dla zapewnienia prawidłowego działania produktu, jego bezpieczeństwa oraz zgodności z obowiązującymi wymaganiami technicznymi lub prawnymi.",
    ],
  },
  {
    id: "zywnosc",
    label: "Żywność",
    hint: "żywność, napoje, produkty świeże",
    clauses: [
      "Produkty spożywcze oferowane w Sklepie posiadają wymagane prawem informacje dotyczące ich składu, wartości odżywczej oraz obecności alergenów, zgodnie z właściwymi przepisami prawa, w szczególności przepisami dotyczącymi przekazywania konsumentom informacji na temat żywności.",
      "Produkt nie posiada właściwości leczniczych w rozumieniu obowiązujących przepisów prawa i nie jest przeznaczony do diagnozowania, leczenia ani zapobiegania chorobom. Produkt nie stanowi substytutu zróżnicowanej i zbilansowanej diety.",
      "Produkt należy przechowywać zgodnie z zaleceniami producenta oraz informacjami udostępnionymi przez Sprzedawcę, w szczególności w sposób zapewniający zachowanie jego właściwości, bezpieczeństwa oraz przydatności do użycia.",
    ],
  },
  {
    id: "suplementy",
    label: "Suplementy diety",
    hint: "suplementy, nutraceutyki",
    clauses: [
      "Suplement diety nie jest produktem leczniczym w rozumieniu obowiązujących przepisów prawa i nie może być stosowany jako substytut produktów leczniczych.",
      "Zaleca się konsultację z lekarzem lub innym wykwalifikowanym pracownikiem ochrony zdrowia przed rozpoczęciem stosowania suplementu diety, w szczególności w przypadku osób przyjmujących leki, kobiet w ciąży lub karmiących piersią oraz osób z chorobami przewlekłymi.",
    ],
  },
  {
    id: "odziez",
    label: "Odzież i tekstylia",
    hint: "odzież, obuwie, tekstylia, akcesoria",
    clauses: [
      "Kolory produktów mogą różnić się od rzeczywistych ze względu na indywidualne ustawienia wyświetlaczy, w tym kalibrację ekranu, jasność oraz parametry techniczne urządzenia używanego przez Klienta.",
      "Dopuszczalne są niewielkie różnice w wymiarach produktów wynikające z procesu produkcyjnego oraz właściwości zastosowanych materiałów, o ile nie wpływają one na funkcjonalność produktu ani jego zgodność z umową.",
    ],
  },
  {
    id: "cyfrowe",
    label: "Produkty cyfrowe",
    hint: "kursy online, e-booki, pliki do pobrania, oprogramowanie",
    clauses: [
      "Konsument traci prawo odstąpienia od umowy o dostarczanie treści cyfrowych niedostarczanych na nośniku materialnym z chwilą rozpoczęcia ich pobierania lub uzyskania do nich dostępu, pod warunkiem uprzedniego wyrażenia wyraźnej zgody na rozpoczęcie świadczenia przed upływem terminu do odstąpienia od umowy oraz poinformowania o utracie prawa odstąpienia.",
      "Zakup produktu cyfrowego nie skutkuje przeniesieniem autorskich praw majątkowych do tego produktu, a jedynie udzieleniem Klientowi niewyłącznej, nieprzenoszalnej licencji na korzystanie z produktu w zakresie określonym w regulaminie lub opisie produktu.",
      "Klient wyraża wyraźną zgodę na rozpoczęcie świadczenia usług lub dostarczania treści cyfrowych przed upływem ustawowego terminu do odstąpienia od umowy oraz potwierdza, że został poinformowany o utracie prawa odstąpienia od umowy z chwilą pełnego wykonania usługi lub rozpoczęcia dostarczania treści cyfrowych, w przypadkach przewidzianych przez obowiązujące przepisy prawa.",
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    hint: "platforma ze sprzedażą wielu niezależnych sprzedawców",
    clauses: [
      "Sklep stanowi platformę internetową umożliwiającą sprzedaż produktów przez niezależnych sprzedawców, przy czym poszczególne umowy sprzedaży mogą być zawierane bezpośrednio pomiędzy Klientem a danym sprzedawcą oferującym produkty za pośrednictwem Sklepu.",
      "Operator platformy pełni wyłącznie funkcję dostawcy infrastruktury technicznej umożliwiającej zawieranie umów pomiędzy użytkownikami i nie jest stroną umów sprzedaży zawieranych pomiędzy użytkownikami za pośrednictwem platformy, chyba że co innego wyraźnie wynika z odrębnych postanowień regulaminu.",
    ],
  },
  {
    id: "dropshipping",
    label: "Dropshipping",
    hint: "wysyłka realizowana przez zewnętrznego dostawcę",
    clauses: [
      "Realizacja zamówienia może zostać powierzona podmiotowi trzeciemu, w szczególności operatorowi logistycznemu lub innemu wyspecjalizowanemu podmiotowi, przy czym Sprzedawca pozostaje odpowiedzialny wobec Klienta za należyte wykonanie umowy zgodnie z obowiązującymi przepisami prawa.",
      "Sprzedawca ponosi odpowiedzialność wobec Klienta za należyte wykonanie umowy, w szczególności za zgodność świadczenia z umową oraz obowiązującymi przepisami prawa.",
    ],
  },
  {
    id: "subskrypcje",
    label: "Subskrypcje",
    hint: "płatności cykliczne, abonamenty",
    clauses: [
      "Płatności mają charakter cykliczny i są pobierane automatycznie w ustalonych okresach rozliczeniowych, zgodnie z wybraną przez Klienta subskrypcją, po uprzednim poinformowaniu Klienta o warunkach i częstotliwości pobierania opłat.",
      "Klient może w każdym czasie zrezygnować z subskrypcji ze skutkiem na koniec bieżącego okresu rozliczeniowego, zgodnie z zasadami określonymi w regulaminie, bez wpływu na ważność płatności dokonanych za okresy już rozpoczęte.",
    ],
  },
];

export const CLAUSE_GROUP_IDS = new Set(CLAUSE_GROUPS.map((g) => g.id));

export function clauseGroupsByIds(ids: string[]): ClauseGroup[] {
  // Kolejność z katalogu, nie z zapisu — dokument ma wyglądać tak samo
  // niezależnie od tego, w jakiej kolejności merchant klikał checkboxy.
  return CLAUSE_GROUPS.filter((g) => ids.includes(g.id));
}
