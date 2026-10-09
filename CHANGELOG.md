# Sellflow: szczegółowa lista zmian

Pełna historia produktu, wersja po wersji. Skrócony przegląd etapów, zasady numeracji i plany są w [ROADMAP.md](ROADMAP.md).

Jak czytać wpisy:
- nagłówek: wersja, data, skrót commitu w repozytorium `app` i numer PR, jeśli zmiana przeszła przez PR,
- punkty opisują kolejno: co zmieniło się dla sprzedawcy, klienta sklepu albo zespołu, jak to działa, dlaczego tak zrobiono (jeśli commit to wyjaśnia),
- etap 0.0 opisuje kamienie milowe sprzed kodu produktu, z odwołaniem do dokumentu źródłowego.

Nowy wpis dodaje się w tym samym PR, który podbija wersję.

## 0.0 Koncepcja i walidacja (styczeń do maja 2026)
Zespół sprawdził problem i segmenty, zanim powstała linijka kodu produktu. W tym etapie powstały też design system, landing z waitlistą i pierwszy szablon sklepu.

### 0.0.0 · styczeń 2026
**Start projektu**
- Początek prac nad Sellflow według zespołu. W repozytoriach nie ma artefaktu z tego okresu, dokładną datę i wydarzenie warto uzupełnić.

### 0.0.1 · luty 2026 · `kontekst-projektu/kontekst-strategia.md`
**Pitch deck v1 w akceleratorze Unicorn Hub Innovation Lab**
- Pierwsza wersja pitch decku przygotowana w programie akceleracyjnym Unicorn Hub.
- Pozycjonowanie produktu w briefie projektu: pudełkowa platforma e-commerce dla mikro i małych sprzedawców, celowo ograniczona do 24 produktów, sklep gotowy w 30 minut, agenci AI (copywriter, tłumacz, analityk) zamiast wtyczek.

### 0.0.2 · kwiecień 2026 · `kontekst-projektu/kontekst-walidacja.md`
**Walidacja True/False zakończona, przejście do rundy IV (ścieżka Go Global)**
- Dwie ankiety walidacyjne (Google Forms), co najmniej 40 respondentów na segment.
- Segment 1, początkujący sprzedawcy (szacunkowo 60–80 tys. w Polsce): potwierdzone bariery brak czasu (70%) i paraliż decyzyjny (75%). Niepotwierdzony chaos informacyjny (37,5%). 82,5% chce gotowego szablonu, 72,5% woli model „krok po kroku”, 90% chce sklep gotowy w jeden dzień. Cena: najczęściej 100–199 zł/mies. (42,5%).
- Segment 2, seryjni e-commerce'owcy (szacunkowo 15–20 tys. w Polsce): wszystkie trzy propozycje wartości potwierdzone. „Trusted process” 97,2%, preferencja gotowca 91,7%, konfiguracja techniczna jako bariera 88,9%, jeden panel do wielu sklepów 94,4%. 52,8% gotowych płacić 200 zł/mies. lub więcej.
- Wniosek z dokumentu: segment 2 uzasadnia osobny, wyższy plan cenowy.

### 0.0.3 · 16.04.2026 · `kontekst-projektu/kontekst-akcelerator.md`
**Warsztaty akceleratora: MoSCoW, definicja MVP, hipotezy BMC**
- Must have na demo day: video explainer (agencja), landing PL, działająca waitlista, analityka landingu.
- Świadomie odrzucone na ten etap: działająca platforma i dedykowany support.
- Hipoteza do walidacji: 10% odwiedzających landing zapisze się na waitlistę.
- Dla każdego bloku Business Model Canvas spisane założenia, hipotezy i proponowane eksperymenty.

### 0.0.4 · 24.04.2026 · repo `Design-System`, `sellflow-docs`
**Design system Sellflow i jego dokumentacja (Kacper Dąbek)**
- Biblioteka komponentów sklepu: nagłówek, mega menu, karta produktu, siatka i widok kolekcji, filtry, galeria, szczegóły produktu, szybki podgląd, szuflada koszyka, stopka.
- Tokeny marki: skale granatu, cyjanu i neutralnych, cienie, odstępy, ruch, klasy typografii, przyciski CTA.
- Dokumentacja design systemu publikowana na GitHub Pages.

### 0.0.5 · 29.04.2026 · repo `www`
**Landing z waitlistą na sell-flow.store**
- Strona marketingowa z zapisem na waitlistę.
- Google Analytics 4 ze zgodą na cookies, PostHog, Open Graph, dane strukturalne Schema.org (30.04).
- Kolejne tygodnie: interaktywna prezentacja onboardingu (04.05), teksty od copywritera PL i EN (07.05), blog PL i EN (13–14.05).

### 0.0.6 · 30.04.2026 · repo `kontekst-projektu`
**Kontekst projektu spisany w jednym miejscu**
- Brief, strategia i model biznesowy po etapie True/False, trzy buyer persony (Patrycja, Mateusz, Hanna), Value Proposition Canvas, Problem-Solution Fit, analiza konkurencji, customer journey, dane rynkowe, wyniki walidacji.

### 0.0.7 · 14–15.05.2026 · repo `www`
**Demo szablonu sklepu, potem uniwersalny szablon shop-v2 (Kacper Dąbek)**
- Pierwszy klikalny szablon sklepu na stronie marketingowej, następnego dnia zastąpiony uniwersalnym szablonem shop-v2.
- Ostatni krok przed kodem platformy: od 21.05 produkt powstaje w repozytorium `app`.

## 0.1 MVP: konto, onboarding, sklep w barwach marki (21.05 do 26.05.2026)
Sprzedawca może założyć konto, przejść kreator, który z opisu oferty dobiera paletę, fonty i treści, i od razu zobaczyć swój sklep w barwach marki. Zespół Sellflow dostał panel operacyjny z listą wszystkich sklepów.

### 0.1.0 · 21.05.2026 · `e224ab6`
**Start projektu z szablonu Create Next App**
- Repozytorium powstało z generatora Next.js: konfiguracja TypeScript, ESLint, PostCSS i domyślna strona startowa.
- Dołączone pliki `AGENTS.md` i `CLAUDE.md` z instrukcją dla agentów.

### 0.1.1 · 21.05.2026 · `c082dca`
**Fundament MVP: sklep, panel sprzedawcy, API**
- Pełny schemat bazy w Drizzle (`lib/db/schema.ts`): użytkownicy, sklepy, konfiguracja sklepu, produkty, zamówienia, klienci, kody rabatowe, newsletter.
- Połączenie z bazą Neon przez klienta Drizzle z leniwą inicjalizacją oraz middleware Clerk z routingiem po subdomenie sklepu.
- Witryna sklepu złożona z sekcji: pasek górny, nawigacja, hero, produkty, korzyści, opinie, gwarancja, stopka (`components/store/*`).
- Panel sprzedawcy: tabela zamówień, tabela produktów, formularz brandingu, edytor strony głównej i 10 stron zaślepek (m.in. klienci, rabaty, dostawa, płatności, statystyki, FAQ, regulamin).
- API: odczyt i zapis konfiguracji sklepu, lista i dodawanie produktów, edycja i usuwanie produktu.
- Funkcja `getShopAccess()` w `lib/api.ts` sprawdza przy każdym wywołaniu API, czy zalogowany w Clerk użytkownik jest właścicielem sklepu.
- Ekran logowania i rejestracji w jednym widoku, w kolorystyce granat i magenta.

### 0.1.2 · 21.05.2026 · `0972dde`
**Middleware przemianowane na `proxy.ts` (Next.js 16), poprawka konfiguracji Drizzle**
- Plik `middleware.ts` przeniesiony do `proxy.ts`, zgodnie z konwencją Next.js 16.
- `drizzle.config.ts` wczytuje zmienne z `.env.local` przez dotenv, więc narzędzia Drizzle widzą adres bazy.

### 0.1.3 · 21.05.2026 · `1117f6f`
**Strony logowania i rejestracji: e-mail, weryfikacja kodem, Google**
- Osobne adresy `/login` i `/register` z pełną integracją Clerk.
- Rejestracja e-mailem i hasłem z ekranem wpisania 6-cyfrowego kodu weryfikacyjnego.
- Logowanie przez Google (OAuth) z powrotem na `/sso-callback`.
- Stany ładowania i błędy wyświetlane przy polach formularza. Strona główna kieruje zalogowanych do panelu, a gości do logowania.

### 0.1.4 · 21.05.2026 · `5d31c40`
**Onboarding: zakładanie konta, sklepu i domyślnej konfiguracji**
- Nowy ekran `/onboarding`: sprzedawca podaje nazwę sklepu, a system generuje adres (slug) z obsługą polskich znaków i pokazuje podgląd URL-a.
- `POST /api/onboarding` zapisuje użytkownika z Clerk w bazie, tworzy sklep i wypełnia domyślny branding oraz stronę główną.
- Kto ma już sklep, jest przekierowany do panelu. Po sukcesie sprzedawca trafia na listę zamówień swojego sklepu.

### 0.1.5 · 21.05.2026 · `d9ca955`
**Adres app.sell-flow.store traktowany jako platforma, nie sklep**
- Platforma działa pod `app.sell-flow.store`, sklepy pod `[slug].sell-flow.store`. Wcześniej subdomena `app` trafiała do obsługi witryny sklepu.
- Nowa zmienna `NEXT_PUBLIC_APP_SUBDOMAIN` (domyślnie `app`) w `proxy.ts`.

### 0.1.6 · 21.05.2026 · `0880797`
**Podglądy Vercel traktowane jako platforma, nie własna domena sklepu**
- Adresy `*.vercel.app` były kierowane do obsługi własnych domen sklepów. Dodany warunek w `proxy.ts`, dzięki któremu wersje podglądowe ładują platformę.

### 0.1.7 · 25.05.2026 · `da99818`
**Kreator onboardingu z dobieraniem marki i podglądem na żywo**
- Jednoekranowy formularz zastąpiony 7-krokowym kreatorem: powitanie, co sprzedajesz, nazwa, logo, problem klienta, przewaga, marka.
- Krok „Marka”: 12 cech, 7 tonów komunikacji i 5 suwaków estetyki. Obok miniatura sklepu, która na bieżąco przelicza paletę, fonty i układ.
- Krok podglądu osadza w ramce prawdziwą witrynę sklepu (`/preview-shop`), bez zapisu do bazy, więc sprzedawca widzi sklep przed zapisaniem.
- Deterministyczne wnioskowanie w `lib/brand/inference.ts` dobiera kategorię, paletę, fonty, układ, tekst hero i przykładowy katalog na podstawie opisu oferty.
- `POST /api/onboarding` przyjmuje dane z kreatora i zapisuje w konfiguracji sklepu paletę, hero i cechy jako korzyści. Surowe dane trafiają pod klucz `brand`, do późniejszej przebudowy. Bez nich działa stary, neutralny zestaw domyślny.
- Bez klucza Clerk kreator działa lokalnie bez logowania i bazy, co ułatwia pracę nad interfejsem.
- Do projektu trafił `design.md` z zasadami wyglądu oraz tokeny kolorów i fontów podpięte pod klasy Tailwind.
- Znane ograniczenie: komponenty witryny wciąż miały na sztywno neutralne kolory, więc zapisane barwy marki nie były jeszcze widoczne w sklepie.

### 0.1.8 · 25.05.2026 · `53c4800`
**Rejestracja po onboardingu, dane podglądu przeniesione do hasha URL-a**
- Kreator jest dostępny bez logowania: odwiedzający najpierw widzi swój sklep, a o konto jest proszony dopiero przy zapisie.
- Przy zapisie bez sesji dane kreatora trafiają do `sessionStorage`, a użytkownik na `/register` z parametrem powrotu. Po rejestracji, weryfikacji e-maila albo logowaniu przez Google nowa strona `/onboarding/save` sama zapisuje sklep i przenosi do panelu.
- Parametr powrotu w `AuthForm` jest filtrowany (`safeRedirect`), żeby nie dało się go użyć do przekierowania na obcą stronę.
- Dane podglądu przekazywane do ramki przez `#bootstrap=` zamiast `?bootstrap=`. Na produkcji długi adres kończył się błędem URI_TOO_LONG, a hash nie opuszcza przeglądarki.

### 0.1.9 · 25.05.2026 · `3028b65`
**Formularz logowania opakowany w Suspense**
- `useSearchParams()` bez granicy Suspense przerywał budowanie produkcyjne stron `/login` i `/register`. Po zmianie obie strony znów renderują się statycznie, a obsługa parametru powrotu działa w przeglądarce.

### 0.1.10 · 25.05.2026 · `09d7bdd`
**Przekierowanie z `/dashboard` do sklepu użytkownika**
- Sam adres `/dashboard` zwracał 404, a właśnie tam trafiał użytkownik po zalogowaniu.
- Nowa strona `app/dashboard/page.tsx` szuka sklepu użytkownika i przenosi do jego zamówień albo do onboardingu, gdy sklepu brak.

### 0.1.11 · 25.05.2026 · `cfc8989`
**Kierowanie po zalogowaniu przeniesione na stronę główną**
- Strona `/dashboard` z poprzedniej wersji nie zadziałała, bo segment należał już do grupy tras panelu. Została usunięta.
- Decyzję podejmuje teraz `app/page.tsx`: gość i zalogowany bez sklepu trafiają na `/onboarding`, właściciel sklepu na listę zamówień. `AuthForm` po logowaniu kieruje na `/`.

### 0.1.12 · 26.05.2026 · `91fe903`
**Witryna sklepu w kolorach marki**
- Barwy wybrane w kreatorze są widoczne w sklepie: wszystkie 9 komponentów witryny korzysta z klas opartych na zmiennych `--brand-*` zamiast sztywnych szarości.
- Nowy komponent `components/store/BrandTheme.tsx` wstrzykuje zmienne kolorów i font nagłówków z konfiguracji sklepu.
- Kolor tekstu na przyciskach dobierany jest według luminancji tła, żeby był czytelny przy każdej palecie.
- Ten sam motyw działa w sklepie i w podglądzie kreatora, więc podgląd pokazuje dokładnie to, co trafi do sklepu po zapisie.

### 0.1.13 · 26.05.2026 · `745948a`
**Panel operacyjny Sellflow: lista sklepów i wejście jako właściciel**
- Użytkownicy dostali rolę (`merchant` domyślnie, `admin` dla zespołu Sellflow). Rola admina jest nadawana przy zapisie onboardingu adresom z listy `SELLFLOW_ADMIN_EMAILS`.
- `/ops`: kafle z liczbą sklepów, użytkowników, produktów i zamówień oraz 5 najnowszych sklepów.
- `/ops/shops`: tabela wszystkich sklepów z wyszukiwaniem po adresie i nazwie, planem i statusem.
- `/ops/shops/[slug]`: właściciel, plan, własna domena, daty, próbki kolorów marki, liczba produktów i zamówień oraz akcje „Otwórz storefront” i „Zaloguj jako właściciel”.
- „Zaloguj jako właściciel” działa przez pominięcie sprawdzenia własności w `getShopAccess()` dla admina, bez tokenów podszywania się w Clerk.
- `proxy.ts` wymaga logowania dla `/ops`, a sprawdzenie roli w bazie odbywa się w layoucie panelu, który odsyła osoby bez uprawnień na stronę główną.

## 0.2 Sklep, który sprzedaje (11.06 do 18.06.2026)
Sklep przyjmuje zamówienia od początku do końca: produkty ze zdjęciami, koszyk, checkout, płatność przelewem lub za pobraniem, e-maile i obsługa zamówień w panelu. Sprzedawca dostał komplet ekranów panelu, w tym rabaty, newsletter, stany magazynowe i blog, a klient sklepu wyszukiwarkę i sortowanie.

### 0.2.0 · 11.06.2026 · `802d5a1`
**`/dashboard` prowadzi do sklepu użytkownika, przekierowanie z onboardingu działa**
- Powracający użytkownicy po zalogowaniu trafiali na 404 pod `/dashboard`. Nowa strona w grupie tras panelu kieruje do zamówień sklepu albo do onboardingu.
- `redirect()` w onboardingu wyjęty z `try/catch`: Next zgłasza go jako wyjątek, który był połykany, przez co właściciel istniejącego sklepu znów widział formularz onboardingu.

### 0.2.1 · 11.06.2026 · `eb698b5`
**Tydzień 1: formularz produktu, wgrywanie zdjęć, edytor strony głównej, strona produktu**
- Formularz dodawania i edycji produktu: nazwa, kategoria, cena i cena przed obniżką, plakietka, opisy, lista zdjęć, widoczność, usuwanie. Przycisk „Dodaj produkt” i ołówek w tabeli zaczęły działać.
- Wgrywanie plików przez Uploadthing v7 (zdjęcia produktów i logo sklepu) z autoryzacją Clerk i własnym przyciskiem `ImageUpload`. Logo w brandingu wcześniej w ogóle się nie zapisywało.
- Edytor strony głównej przepisany na format konfiguracji, który czyta witryna. Wcześniej edytował inny kształt danych, a przycisk zapisu niczego nie wysyłał. Teraz wczytuje zapisaną konfigurację i zachowuje sekcje, których nie edytuje.
- Strona produktu w sklepie `/[shop]/products/[id]`: galeria, cena, korzyści, specyfikacja, opis i przycisk koszyka (na razie zaślepka). Ukryte produkty zwracają 404.

### 0.2.2 · 11.06.2026 · `e8027b4`
**Tydzień 2: koszyk, dostawa i płatności, checkout, publiczne API zamówień**
- Koszyk zapisywany w przeglądarce osobno dla każdego sklepu, zsynchronizowany między kartami. Dodawanie do koszyka ze strony produktu i szybkie dodawanie z karty, licznik w nawigacji, strona koszyka ze zmianą ilości i podpowiedzią do darmowej dostawy.
- Panel „Dostawa”: metody dostawy z cenami i przełącznikami oraz próg darmowej wysyłki.
- Panel „Płatności”: przelew (numer konta z walidacją NRB, odbiorca) i płatność za pobraniem (z opłatą).
- Checkout: dane kontaktowe i adres, wybór dostawy i płatności, podsumowanie z kwotami zgodnymi z serwerem, ekran potwierdzenia z danymi do przelewu i kopiowaniem numeru konta.
- Publiczne `POST /api/shops/[shop]/orders`: walidacja danych, ceny zawsze przeliczane z bazy (kwotom z przeglądarki się nie ufa), kolejne numery zamówień w obrębie sklepu z ponowieniem przy kolizji, zapis klienta z sumą jego zakupów.

### 0.2.3 · 11.06.2026 · `b9a2085`
**Tydzień 3: zamówienia z bazy, e-maile transakcyjne, dokumenty prawne, strony treści**
- Lista zamówień czyta dane z bazy zamiast przykładowych, z filtrami statusu i statusem płatności.
- Nowy widok szczegółów zamówienia: pozycje, kwoty, klient, adres, uwagi oraz zmiana statusu (w realizacji, wysłane, dostarczone, anulowane) i oznaczenie opłacenia.
- E-maile przez Resend (`lib/email.ts`): potwierdzenie dla klienta z danymi do przelewu, powiadomienie dla sprzedawcy z odpowiedzią na adres klienta oraz informacja o wysyłce. Bez klucza API wysyłka jest pomijana, a błąd e-maila nigdy nie blokuje zamówienia.
- Edytor regulaminu i polityki prywatności z gotowymi polskimi szablonami do uzupełnienia, publikowane pod `/[shop]/terms` i `/[shop]/privacy`.
- Edytory „O nas” (historia i dane kontaktowe) oraz FAQ. W sklepie powstały strony `/[shop]/about`, `/[shop]/faq` (rozwijane pytania) i `/[shop]/contact`, do których nawigacja i stopka wcześniej prowadziły na 404.
- Wspólna rama stron sklepu wydzielona do `StorefrontShell`.

### 0.2.4 · 11.06.2026 · `85cbdb1`
**Tydzień 4: strony produktów, dostawy i zwrotów, ustawienia sklepu, ochrona panelu**
- W sklepie powstały: pełna lista produktów `/[shop]/products`, strona dostawy z metodami i progiem darmowej wysyłki z konfiguracji oraz strona zwrotów opisująca 14-dniowe odstąpienie od umowy.
- Link „Blog” zniknął z nawigacji do czasu powstania modułu bloga.
- Ustawienia sklepu: zmiana nazwy, adres witryny i włączanie lub wyłączanie sklepu (wyłączony sklep zwraca 404).
- Panel sklepu zwraca 404 osobom, które nie są właścicielem. Admin przechodzi dalej, więc „Zaloguj jako właściciel” nadal działa.

### 0.2.5 · 11.06.2026 · `2a66f6d`
**Zarządzanie sklepami w panelu operacyjnym: akcje, limity planów, metryki platformy**
- Na stronie sklepu w `/ops` pojawiły się akcje: zawieszenie i odwieszenie sklepu, zmiana planu właściciela (free, starter, pro) oraz trwałe usunięcie sklepu po wpisaniu jego adresu. Konto właściciela zostaje.
- Limity produktów na plan w `lib/plans.ts`: free 10, starter 100, pro bez limitu. Liczy się plan właściciela, więc admin działający jako właściciel też nie obejdzie limitu. Formularz produktu pokazuje czytelny komunikat.
- Pulpit `/ops` pokazuje nowe sklepy z 7 i 30 dni, obroty i liczbę zamówień (bez anulowanych), 5 sklepów z największymi obrotami i listę sklepów bez produktów do kontaktu.

### 0.2.6 · 12.06.2026 · `e2da2ed`
**Kolizja adresu sklepu nie blokuje już użytkownika**
- Krok „Nazwa” w kreatorze na bieżąco sprawdza, czy adres jest wolny, i pokazuje, jaki wariant dostanie użytkownik, jeśli jest zajęty.
- `/api/onboarding` zamiast błędu 409 wybiera pierwszy wolny wariant (`nazwa-2`, `nazwa-3` i dalej) przez wspólną funkcję w `lib/slug.ts`.
- Ekran błędu zapisu naprawdę ponawia próbę i ma powrót do kreatora. Wcześniej błąd wychodził dopiero po rejestracji, a ponowienie wysyłało ten sam adres w kółko.
- Podgląd kreatora pokazywał nieaktualną domenę sellflow.app.

### 0.2.7 · 12.06.2026 · `1bd494f`
**Sprzedawca wybiera fonty i tło strony**
- W brandingu doszedł wybór fontu nagłówków (6 krojów) i tekstu (4 kroje) z kart pisanych danym krojem. Katalog w `lib/fonts.ts`, kroje spoza paczki ładowane z Google Fonts.
- Tło strony: gotowe odcienie albo własny kolor HEX, z ostrzeżeniem o kontraście przy ciemnym tle.
- `BrandTheme` nakłada fonty na całą stronę. Wcześniej wybrany font, także ten dobrany w kreatorze, nigdy się nie wyświetlał.
- Podgląd w formularzu pokazuje nagłówek i treść z wybranymi fontami i tłem.

### 0.2.8 · 12.06.2026 · `37f64be`
**Panel kompletny: klienci, statystyki, kategorie, rabaty, newsletter, menu**
- Wszystkie pozostałe zaślepki „Ta sekcja jest w przygotowaniu” zastąpione działającymi ekranami. Treść panelu jest wyśrodkowana na szerokich ekranach.
- Klienci: tabela z bazy (liczba zamówień, suma zakupów, data dołączenia) z wyszukiwaniem.
- Statystyki: kafle za 30 i 90 dni (zamówienia, przychód, średnia wartość, nieopłacone), wykres 14 dni, najlepsze produkty i najlepsi klienci.
- Kategorie: widok wyliczony z pola kategorii produktów, z liczbą produktów i widocznością.
- Kody rabatowe: dodawanie, edycja i usuwanie (procent, data ważności, limit użyć). W checkoucie pole na kod z walidacją na żywo, serwer sprawdza kod ponownie, zapisuje rabat w zamówieniu i zlicza użycia. E-maile pokazują rabat.
- Newsletter: zapis w sklepie, lista subskrybentów w panelu i okienko zapisu na stronie głównej, które wcześniej było skonfigurowane, ale nigdzie się nie wyświetlało. Edytor strony głównej ma sekcję okienka.
- Menu: edytor pozycji (etykieta, strona docelowa, kolejność), a nawigacja sklepu wyświetla skonfigurowane pozycje.

### 0.2.9 · 13.06.2026 · `a310db8`
**Edycja kategorii: zmiana nazwy, ukrywanie, usuwanie zbiorczo**
- Kategoria to tekst w produkcie, więc każda operacja działa na wszystkich produktach z tą nazwą (bez względu na wielkość liter).
- Zmiana nazwy w miejscu, ukrycie lub pokazanie całej kategorii oraz usunięcie, które czyści pole w produktach, a same produkty zostawia.
- Nowe `PATCH`/`DELETE /api/shops/[shop]/categories` z autoryzacją przez `getShopAccess()`.

### 0.2.10 · 13.06.2026 · `40ad6f3`
**Pakiet A: pulpit panelu, lista startowa, działające wyszukiwanie i powiadomienia**
- `/dashboard/[shop]` stał się pulpitem: powitanie, lista kroków startowych (produkt, logo, dostawa, płatności, regulamin, o nas) z paskiem postępu, który znika po ukończeniu.
- Cztery kafle: sprzedaż i zamówienia z 30 dni, do wysłania, nieopłacone (dwa ostatnie wyróżnione, gdy jest coś do zrobienia), ostatnie zamówienia i szybkie akcje.
- Po zalogowaniu i onboardingu sprzedawca trafia na pulpit zamiast na zamówienia. „Pulpit” jest pierwszą pozycją menu.
- Wyszukiwarka w nagłówku przeszukuje strony panelu oraz produkty i zamówienia (`GET /api/shops/[shop]/search`).
- Dzwonek pokazuje liczbę spraw do obsługi i listę nowych lub nieopłaconych zamówień, odświeżaną co 60 sekund.

### 0.2.11 · 13.06.2026 · `125f500`
**Warstwa B (1/n): stany magazynowe od panelu po zamówienie**
- Produkt ma opcjonalny stan magazynowy. Puste pole oznacza „nie śledzę”, więc istniejące produkty działają jak dotąd.
- Tabela produktów pokazuje plakietki: Wyprzedane, Mało (do 5 sztuk), Stan.
- W sklepie wyprzedany produkt ma plakietkę i zablokowany przycisk koszyka, przy niskim stanie widać „ostatnie sztuki”. Ilość w koszyku nie przekroczy dostępnego stanu.
- API zamówień odrzuca zamówienie (409 z komunikatem), gdy brakuje towaru, a po zapisie zmniejsza stan tak, by nie spadł poniżej zera.

### 0.2.12 · 18.06.2026 · `db29f00`
**Etap 1: wyszukiwarka w sklepie, sortowanie i filtr dostępności**
- Lupa w nawigacji sklepu otwiera pole wyszukiwania prowadzące do `/[shop]/search` z wynikami, licznikiem i pustymi stanami. Strona wyników nie jest indeksowana.
- Wyszukiwanie dopasowuje wszystkie słowa w nazwie, kategorii lub opisie (`lib/storefront-products.ts`).
- Lista produktów ma sortowanie (polecane, cena, nazwa) i filtr „tylko dostępne”, zapisane w adresie strony.

### 0.2.13 · 18.06.2026 · `30c5b5f`
**Etap 3: moduł bloga**
- Panel: lista wpisów oraz edytor z tytułem, zajawką, treścią, zdjęciem okładki i publikacją. „Blog” w menu bocznym w sekcji treści.
- Sklep: `/[shop]/blog` z listą opublikowanych wpisów i `/[shop]/blog/[slug]` ze wpisem. Szkice zwracają 404.
- Adres wpisu tworzony z tytułu (polskie znaki zamieniane na łacińskie) i unikalny w obrębie sklepu.
- „Blog” wrócił do domyślnego menu sklepu.

## 0.3 Typy produktów, analityka, bezpieczeństwo (01.07 do 04.07.2026)
Sprzedawca może sprzedawać produkty cyfrowe i usługi bez wymuszania wysyłki, widzi analitykę ruchu z podziałem na źródła, w tym asystentów AI, i konfiguruje integracje, cookies oraz Omnibus. Platforma przeszła audyt bezpieczeństwa, a rejestracja przestała kończyć się w ślepych zaułkach.

### 0.3.0 · 01.07.2026 · `120ce1f`
**Analityka: porównanie okresów, źródła ruchu, widoczność w AI**
- Strona „Statystyki” przebudowana na „Analitykę” w nowym wyglądzie.
- Każda odsłona sklepu jest zapisywana w nowej tabeli `visits` przez komponent `TrackVisit` i publiczny `POST /api/shops/[shop]/track`.
- `lib/traffic.ts` klasyfikuje ruch po adresie odsyłającym i przeglądarce: bezpośredni, AI, wyszukiwarki, social, odesłania, a dla AI także ChatGPT, Claude, Perplexity, Gemini i Copilot.
- Wybór okresu: 7, 30, 90 dni albo własny zakres dat.
- Kafle ze zmianą względem poprzedniego okresu: sprzedaż brutto, odsetek powracających klientów, opłacone zamówienia, zamówienia.
- Wykres sprzedaży w czasie (bieżący i poprzedni okres), karta „Widoczność w AI” z podziałem na asystentów, najlepsze produkty i źródła ruchu.

### 0.3.1 · 01.07.2026 · `aef27c3`
**Edytor produktu: formatowany opis i własne parametry**
- Opis produktu edytowany w edytorze z pogrubieniem, kursywą, listami, linkami oraz cofaniem i ponawianiem, bez nowych zależności.
- `lib/sanitize.ts` czyści HTML od sprzedawcy: usuwa skrypty, style, ramki, atrybuty zdarzeń i linki `javascript:`. Stare opisy tekstowe wyświetlają się bez zmian.
- Sekcja „Parametry” (pary nazwa i wartość) zapisywana w polu specyfikacji i widoczna na stronie produktu.

### 0.3.2 · 01.07.2026 · `0ed18fc`
**Typy produktów: fizyczny, cyfrowy, usługa**
- Produkt ma typ (domyślnie fizyczny, więc istniejące produkty się nie zmieniają) i pole z danymi realizacji.
- Formularz produktu pokazuje sekcje zależne od typu: dla cyfrowego plik, link albo klucz licencyjny z instrukcją, dla usługi czas trwania, tryb i uwagi. Stan magazynowy tylko dla produktów fizycznych.
- Strona produktu w sklepie informuje o dostępie e-mailem bez wysyłki (cyfrowy) albo o czasie, trybie i kontakcie w sprawie realizacji (usługa).
- Lista produktów w panelu ma plakietki „Cyfrowy” i „Usługa”.
- Checkout nie uwzględniał jeszcze typu, co domknęła kolejna wersja.

### 0.3.3 · 01.07.2026 · `0438c30`
**Checkout zależny od typu: produkty cyfrowe i usługi bez wysyłki i adresu**
- Gdy w koszyku nie ma produktu fizycznego, checkout ukrywa adres i dostawę, liczy wysyłkę 0 zł, ukrywa płatność za pobraniem i wyjaśnia sposób realizacji. Koszyki fizyczne i mieszane działają jak dotąd.
- API zamówień wymaga adresu i dostawy tylko przy produkcie fizycznym i odrzuca pobranie dla koszyków bez takich produktów.
- E-mail do klienta pomija wiersz wysyłki i zawiera informację o realizacji. E-mail do sprzedawcy zawiera dane dostępu do produktu cyfrowego, żeby mógł go wydać po opłaceniu.

### 0.3.4 · 01.07.2026 · `5559937`
**Ustawienia panelu: podmenu, Integracje, Zgodność, Motyw, Omnibus**
- Ustawienia mają lewe podmenu z sekcjami: Konto i firma, Plan (płatne plany wkrótce), Motyw, Sklep, Własna domena i Zespół (zablokowane, plan Pro), Integracje, Zgodność.
- Motyw panelu: jasny, ciemny lub systemowy, ograniczony do panelu.
- Integracje: Google Tag Manager, GA4, Piksel Meta, Piksel TikTok, Google Merchant Center. Skrypty wstawiane w sklepie przez `StorefrontScripts` dopiero po zgodzie w banerze cookies.
- Zgodność: konfigurowalny baner cookies z kategoriami analityczną i marketingową oraz przełącznik Omnibus.
- Omnibus: nowa tabela `price_history` zapisuje każdą zmianę ceny, a karta i strona produktu w promocji pokazują najniższą cenę z 30 dni.
- Przełączniki mają wyraźny kontrast stanów i obramowanie fokusu w obu motywach.

### 0.3.5 · 02.07.2026 · `e7b0061`
**Bezpieczeństwo: poprawki po audycie**
- Zawieszenie przez zespół Sellflow to osobna flaga `suspended`. Wcześniej sprzedawca mógł sam włączyć zawieszony sklep w ustawieniach.
- Limity zapytań na adres IP (`lib/rate-limit.ts`): zamówienia 10/min, sprawdzanie kodów rabatowych 30/min (blokuje zgadywanie kodów), newsletter 10/min, śledzenie ruchu 60/min.
- Brak klucza Clerk na produkcji nie wyłącza już ochrony panelu, `/ops` i onboardingu (`lib/auth-env.ts`).
- Zapis konfiguracji sklepu przyjmuje tylko dozwolone klucze, do 256 KB, z oczyszczeniem kolorów, fontów i identyfikatorów pikseli.
- Ochrona przed XSS w pasku górnym, motywie kolorów i skryptach integracji.
- Wgrywanie plików wymaga użytkownika z własnym sklepem, a rolę admina dostaje tylko zweryfikowany główny e-mail z listy.

### 0.3.6 · 03.07.2026 · `352ff14`
**Rejestracja bez ślepych zaułków przy rozjechanej sesji Clerk**
- Zalogowani użytkownicy są przekierowywani z `/login` i `/register`, a błąd `session_exists` jest obsłużony.
- Formularz renderuje miejsce na CAPTCHA Clerk, więc rejestracja nie pada u osób z blokerami reklam.
- Niedokończone statusy logowania i weryfikacji pokazują komunikat zamiast kręcącego się wskaźnika.
- `/onboarding/save` nie wpada w pętlę przekierowań między zapisem a logowaniem.

### 0.3.7 · 04.07.2026 · `fa438f6`
**Onboarding łączy konto po zweryfikowanym e-mailu przy migracji logowania**
- Użytkownik rejestrujący się ponownie pod nową tożsamością Clerk (przejście z instancji deweloperskiej na produkcyjną) zostaje dopięty do istniejącego konta po zweryfikowanym adresie e-mail.
- Dzięki temu nie powstaje duplikat konta bez dostępu do sklepu.

## 0.4 Marka, adres sklepu i własne domeny (04.07 do 21.07.2026)
Sprzedawca wybiera gotowy styl sklepu, ustawia logo, favicon, zdjęcie hero i stopkę, a sklep działa pod czystym, polskim adresem na własnej subdomenie albo na podłączonej własnej domenie. Klienci sklepu widzą spójną markę, polskie treści i adresy podstron bez technicznych dopisków.

### 0.4.0 · 04.07.2026 · `a7d7d60`
**Cztery gotowe style sklepu zamiast suwaków estetyki**
- W kroku 2 onboardingu pięć suwaków „Estetyka” zastąpiły cztery kompletne style: Pastelowy, Energetyczny, Monochrom i Naturalny, pokazane jako karty z miniaturą sklepu.
- Każdy styl łączy paletę kolorów, parę fontów i układ hero; definicje żyją w jednym miejscu, `lib/brand/presets.ts`.
- Nowa sekcja w panelu: Ustawienia → Styl sklepu, w której sprzedawca może później zmienić styl (zapis do konfiguracji brandingu i marki).
- Branding zapisuje teraz także kolor tła (`paperColor`) i font tekstu (`bodyFontFamily`).
- Naprawiony podgląd w onboardingu: przekazywał pełne definicje fontów CSS, które nie przechodziły walidacji `BrandTheme`, więc wybrane fonty się tam nie wyświetlały.
- Dlaczego: suwaki w większości nic nie robiły, dwa nie były do niczego podpięte, a reszta przełączała między prawie identycznymi paletami. Szkice z suwakami są nieprzenoszalne, więc klucz `localStorage` onboardingu podniesiono do v2.

### 0.4.1 · 06.07.2026 · `c02b274`
**Cztery style sklepu z projektu w Figmie, kolor dodatkowy i zaokrąglenia**
- Style zastąpiono czterema z projektu Shop Style System w Figmie: Minimal Modern, Warm Craft, Bold Street i Elegant Luxe, każdy z własną paletą, parą fontów, układem i skalą zaokrągleń narożników.
- Istniejące sklepy z dawnymi identyfikatorami stylów nadal się poprawnie rozpoznają (aliasy).
- Doszły fonty Inter, Karla, Anton i Jost; poprawiono `googleFontsHref`, żeby jednowagowy Anton nie psuł całego zapytania do Google Fonts.
- Nowy kolor dodatkowy (`palette.secondary`) na plakietkach oraz skala zaokrągleń przechodzą przez cały tor: od onboardingu, przez zapis, po `BrandingConfig`. Kolor akcentu odpowiada teraz wiernie przyciskom CTA (czarny w Bold i Elegant).
- `BrandTheme` emituje zmienne `--brand-secondary` i `--brand-radius-*`, a nowe klasy w `globals.css` stosują je w przyciskach, kartach, polach formularzy, hero, galerii, koszyku i checkoutcie.
- Wartości zaokrągleń są wymuszane jako liczby w walidacji konfiguracji i w `BrandTheme`, jako ochrona przed wstrzyknięciem CSS.

### 0.4.2 · 10.07.2026 · `24b09ea`
**Podgląd w onboardingu blokuje nawigację zamiast pokazywać 404**
- Kliknięcia w linki i wyszukiwanie w podglądzie sklepu (`/preview-shop`) pokazują komunikat zamiast prowadzić na stronę 404; linki do kotwic nadal przewijają stronę.
- Dlaczego: linki w podglądzie wskazują adresy, które istnieją dopiero po zapisaniu sklepu.

### 0.4.3 · 10.07.2026 · `53fa1c8`
**Działająca nawigacja na subdomenach sklepów i zarezerwowane nazwy platformy**
- Na subdomenie sklepu każde kliknięcie poza stroną główną kończyło się 404, bo `proxy.ts` dokładał slug sklepu drugi raz; teraz pomija to, gdy ścieżka już go zawiera.
- `findFreeSlug` w `lib/slug.ts` odrzuca zarezerwowane nazwy (m.in. app, www, clerk, accounts, mail, nazwy tras aplikacji), żeby sklep o takiej nazwie nie przejął subdomeny platformy.

### 0.4.4 · 10.07.2026 · `f835a24`
**Podgląd sklepu w panelu prowadzi na subdomenę sklepu**
- Link „Podgląd sklepu” w bocznym menu panelu otwiera na produkcji adres `https://{slug}.{domena}` zamiast `app.sell-flow.store/{slug}`.
- Lokalnie (localhost) zostaje adres ścieżkowy, bo tam nie ma obsługi subdomen.

### 0.4.5 · 10.07.2026 · `b06fc85`
**Miękkie usuwanie sklepów**
- Usunięcie sklepu ustawia kolumnę `shops.deleted_at` zamiast kasować wiersz, więc operację można cofnąć.
- W panelu operatora usunięty sklep ma status „Usunięty” na liście i w szczegółach oraz akcję przywrócenia.
- Usunięty sklep jest traktowany jako niedostępny (`getShopBySlug`, `getShopAccess`), a jego slug pozostaje zajęty.
- Nowa globalna strona `app/not-found.tsx`: na adresach sklepów pokazuje komunikat „sklep niedostępny”, na adresach platformy zwykłe 404.
- Dlaczego: zarezerwowany slug nie może zostać zarejestrowany przez kogoś innego i przejęty, a historia zamówień i faktur zostaje (polskie przepisy podatkowe wymagają 5 lat).

### 0.4.6 · 10.07.2026 · `1cfe23a`
**Panel operatora pod adresem admin.<domena>**
- Panel `/ops` jest dostępny pod `admin.sell-flow.store`; `proxy.ts` dokłada prefiks `/ops` do ścieżek, a `/ops`, `/login`, `/dashboard` i `/api` przepuszcza bez zmian.
- `admin.<domena>` nie jest już traktowany jako subdomena sklepu. Nie trzeba zmian w Vercelu ani DNS, a sesja Clerka jest wspólna z `app.<domena>`.
- Akcja „działaj jako właściciel” w panelu operatora otwiera panel sprzedawcy na `app.<domena>`.

### 0.4.7 · 10.07.2026 · `22bf252`
**Przypadkowe ścieżki na hoście admina trafiają do panelu operatora**
- Po zalogowaniu na `admin.<domena>` Clerk kierował na `/onboarding`, co dawało 404 ze stroną „sklep niedostępny”. Teraz każda ścieżka spoza `/ops`, logowania i API prowadzi do głównej strony panelu operatora.
- Strona 404 traktuje host admina jako host platformy i pokazuje zwykłe 404.

### 0.4.8 · 10.07.2026 · `5966427`
**Koniec pętli przekierowań na hoście admina dla osób bez uprawnień**
- Zalogowany użytkownik bez roli admina na `admin.<domena>` trafiał w pętlę przekierowań (ERR_TOO_MANY_REDIRECTS). Teraz jest przekierowywany na pełny adres aplikacji (`NEXT_PUBLIC_APP_URL`).

### 0.4.9 · 13.07.2026 · `caded8f`
**Przełącznik między panelem sprzedawcy a panelem operatora dla zespołu Sellflow**
- W nagłówku panelu sprzedawcy pracownicy z rolą admin widzą przycisk „Panel admina” (admin.<domena> na serwerze, `/ops` lokalnie).
- W bocznym menu panelu operatora jest link „Przejdź do sklepu” z powrotem do panelu sprzedawcy.
- Widoczność sprawdzana jest po stronie serwera (`getShopAccess().asAdmin`), więc link nie trafia do przeglądarki sprzedawcy. Właściwą granicą dostępu pozostaje kontrola roli w `/ops`.

### 0.4.10 · 14.07.2026 · `e0b2393`
**Treści sklepu generowane w całości po polsku**
- Lokalny generator `lib/brand/inference.ts` tworzył po angielsku nagłówek i opis hero, odbiorców, problem, wyróżnik i opisy produktów, które pojawiały się w sklepie (górny pasek, hero, dowód społeczny).
- Wszystkie 14 kategorii przetłumaczono na polski z zachowaniem spokojnego tonu marki.

### 0.4.11 · 14.07.2026 · `afc34f4`
**Czyste adresy na subdomenie sklepu, bez powtórzonego sluga**
- Na subdomenie sklepu adresy nie zawierają już sluga, np. `/products` zamiast `/bla-bla/products`.
- `lib/storefront-base.ts` wylicza prefiks linków z hosta: pusty na subdomenie i własnej domenie, `/{slug}` na hoście aplikacji, localhost i w podglądzie. Komponenty sklepu czytają go przez `useStoreBase()`.
- `proxy.ts` przepuszcza na subdomenie `/api` i `/sso-callback` bez prefiksu sluga. Przy okazji naprawiło to zapytania do API sklepu na subdomenie (checkout, newsletter, kody rabatowe), które wcześniej kończyły się 404.
- Stare linki z prefiksem sluga na subdomenie nadal są przekierowywane.

### 0.4.12 · 14.07.2026 · `fb7cc23`
**Polskie adresy podstron sklepu**
- Podstrony sklepu mają polskie ścieżki: produkty, o-nas, kontakt, regulamin, prywatnosc, dostawa, zwroty, szukaj, koszyk, zamowienie (faq i blog bez zmian).
- Zaktualizowano wszystkie linki w sklepie oraz domyślne menu i presety w edytorze menu panelu.
- `proxy.ts` przekierowuje stare angielskie adresy na polskie (308), żeby zakładki i zapisane menu nie dawały 404.
- Trasy panelu i API zostają po angielsku, bo nie są publicznymi adresami sklepu.

### 0.4.13 · 14.07.2026 · `b6e0c69`
**Zapis sklepu z dużym logo w onboardingu i większe logo zamiast nazwy**
- Zapis sklepu przy wgranym logo kończył się komunikatem „Błąd połączenia” i użytkownik nie przechodził do rejestracji: logo w base64 przekraczało limit `sessionStorage`.
- Logo rastrowe jest przy wgraniu skalowane do maks. 512 px i zapisywane jako lżejszy PNG (SVG bez zmian), co odchudza dane na całej drodze aż do bazy.
- Gdy zapis do `sessionStorage` się nie zmieści, dane trafiają tam bez logo, a przekierowanie do rejestracji wykonuje się zawsze.
- Gdy sklep ma logo, w podglądzie onboardingu widać samo logo (większe, bez nazwy); w nawigacji sklepu logo również jest większe.

### 0.4.14 · 14.07.2026 · `0958ebe`
**Spójny adres sklepu w podglądzie onboardingu**
- Pasek adresu w atrapie przeglądarki pokazywał adres z losowym sufiksem, a pole „Twój adres” czysty adres. Oba pokazują teraz ten sam adres, który jest próbowany jako pierwszy przy zapisie.

### 0.4.15 · 14.07.2026 · `b6f8134`
**Logo nie ginie przy finalizacji zapisu sklepu**
- Gdy dane czekające na rejestrację zapisały się bez logo, `/onboarding/save` odzyskuje logo z pełnego stanu kreatora w `localStorage`, więc sklep powstaje z logo.
- Onboarding zostaje przy logo w base64, bo endpoint uploadu wymaga zalogowania, a użytkownik na tym etapie bywa anonimowy.

### 0.4.16 · 14.07.2026 · `da51ead`
**Konkretny komunikat błędu uploadu i limit logo 4 MB**
- Pole wgrywania obrazów w panelu pokazuje przyczynę błędu (limit rozmiaru, konfiguracja magazynu plików, uprawnienia) zamiast ogólnego „Nie udało się wgrać pliku”.
- Limit rozmiaru logo podniesiono z 2 MB do 4 MB, tak jak dla zdjęć produktów.

### 0.4.17 · 14.07.2026 · `e1f14bd`
**Przejście z uploadthing na Vercel Blob**
- Wgrywanie obrazów w panelu (logo, produkty, blog) korzysta z Vercel Blob; pliki serwuje CDN.
- Nowy endpoint `app/api/upload` zapisuje plik przez `put()`; uprawnienia jak wcześniej (właściciel sklepu lub admin), limit 4 MB i lista dozwolonych formatów.
- Komponent `ImageUpload` wysyła plik do `/api/upload` i pokazuje błąd zwrócony przez serwer.
- Usunięto uploadthing i jego pakiety, dodano `@vercel/blob`.
- Dlaczego: upload na produkcji padał z błędem „Missing token”, bo uploadthing wymagał osobnego konta i tokena; token Vercel Blob podpina się do projektu automatycznie.

### 0.4.18 · 14.07.2026 · `61a6963`
**Wgrywanie zdjęcia hero w panelu**
- W edytorze strony głównej (sekcja Hero) można wgrać, zmienić i usunąć zdjęcie hero z podglądem; zapis razem z resztą konfiguracji strony głównej.
- Wcześniej sklep obsługiwał zdjęcie hero, ale nie było jak go ustawić, więc w hero widniał placeholder.

### 0.4.19 · 14.07.2026 · `050f2ac`
**Układ sekcji Produkty dopasowany do 1–2 produktów**
- Na stronie głównej 1 produkt wyświetla się jako wyśrodkowana karta, 2 jako dwie wyśrodkowane karty, a od 3 zostaje siatka trzykolumnowa.
- Wcześniej pojedynczy produkt stał z lewej strony z pustym miejscem obok.

### 0.4.20 · 14.07.2026 · `8e420d2`
**Ustawianie rozmiaru logo w nawigacji**
- W brandingu sprzedawca ustawia wysokość logo (24–96 px) i jego maksymalną szerokość (80–420 px); pasek nawigacji rośnie razem z logo.
- Dlaczego: sztywne wymiary sprawiały, że poziome logo kurczyło się do kilkunastu pikseli wysokości.
- Przy okazji zapis brandingu przestał kasować zaokrąglenia i kolor dodatkowy.

### 0.4.21 · 14.07.2026 · `57efcd4`
**Własny favicon platformy i sklepów zamiast ikony Vercela**
- Platforma ma ikonę Sellflow (`app/icon.svg`, `app/apple-icon.png`) zamiast trójkąta Vercela z szablonu, który pokazywał się na wszystkich adresach.
- Sklep ustawia w metadanych własny favicon (a gdy go brak, logo) oraz tytuł i opis z brandingu; wcześniej każdy sklep miał tytuł „Sellflow - Twój sklep w minutę”.
- W brandingu nowa sekcja „Ikona karty przeglądarki”: upload favicona z podglądem karty.

### 0.4.22 · 14.07.2026 · `ba34fd6`
**Edytowalna stopka: opis i linki do mediów społecznościowych**
- Nowa strona w panelu: Wygląd i treści → Stopka (`FooterForm`), w której sprzedawca wpisuje opis i adresy profili społecznościowych, z walidacją adresów.
- Stopka pokazuje opis z konfiguracji (a gdy go brak, hasło z brandingu) i ikony tylko dla uzupełnionych profili, otwierane w nowej karcie. Doszedł TikTok.
- Usunięto ikony płatności Visa, Mastercard, PayPal, BLIK i P24, których checkout nie obsługuje.
- Walidacja konfiguracji przepuszcza w linkach wyłącznie http(s), bo trafiają one do publicznego sklepu (link `javascript:` byłby podatnością XSS).
- Dlaczego: stopka była zaszyta w kodzie: ikony z pustymi linkami i ten sam opis w każdym sklepie na platformie.

### 0.4.23 · 21.07.2026 · `3a4d705`
**Własne domeny sklepów w samoobsłudze**
- Sprzedawca na planie Pro podłącza w panelu (Ustawienia, sekcja domeny) własną domenę, np. mojsklep.pl lub sklep.mojafirma.pl.
- Panel pokazuje rekord DNS do dodania u rejestratora z przyciskami kopiowania: rekord A dla domeny głównej, CNAME dla subdomeny. Status weryfikacji jest widoczny na bieżąco, z przyciskiem „Sprawdź teraz” i opcją „Odłącz domenę”; adres domyślny w subdomenie działa zawsze.
- `proxy.ts` z resolverem `lib/domain-resolve.ts` kieruje ruch z własnej domeny do istniejącego sklepu; nieznana lub wyłączona domena daje 404.
- `lib/vercel-domains.ts` rejestruje i usuwa domenę w projekcie przez Vercel Domains API oraz odczytuje jej status (weryfikacja, poprawność DNS).
- Endpoint `/api/shops/[shop]/domain` (GET, PUT, DELETE) sprawdza plan Pro, poprawność domeny, to, że nie należy do platformy, i że nie jest podłączona do innego sklepu; przy zmianie domeny zwalnia poprzednią.
- Bez skonfigurowanych zmiennych `VERCEL_*` domena zapisuje się tylko w bazie, a panel pokazuje statyczne instrukcje DNS.

### 0.4.24 · 21.07.2026 · `d7f1b50`
**Zarządzanie własną domeną sklepu z panelu operatora**
- W panelu operatora nowa sekcja „Własna domena”: podłączenie, status z rekordem DNS i odłączenie, przez ten sam endpoint co w panelu sprzedawcy.
- Sesja admina omija wymóg planu Pro, więc wsparcie może podłączyć domenę w imieniu klienta. Statyczny wiersz domeny w „Danych sklepu” usunięto.

### 0.4.25 · 21.07.2026 · `8f6a933`
**Subdomena przekierowuje na zweryfikowaną własną domenę**
- Gdy sklep ma zweryfikowaną własną domenę, jego subdomena `{slug}.sell-flow.store` przekierowuje (307) na nią z zachowaniem ścieżki i parametrów; `/api` i `/sso-callback` są wyłączone z przekierowania.
- Nowa kolumna `custom_domain_verified` przechowuje stan weryfikacji, bo middleware nie może pytać Vercel API przy każdym żądaniu. GET endpointu domeny aktualizuje ją ze statusu na żywo, PUT ustawia, DELETE zeruje.
- Layout sklepu ustawia `metadataBase` na host serwujący, więc adresy OG i względne rozwiązują się względem kanonicznego adresu.
- Dlaczego: jeden kanoniczny adres sklepu, bez zduplikowanej treści pod dwoma adresami.

## 0.5 Fundament zamówień (26.08.2026)
Klient sklepu wybiera paczkomat na mapie, płaci przelewem przez zeskanowanie kodu QR i dostaje w mailu numer przesyłki z linkiem do śledzenia. Sprzedawca rozróżnia rodzaje dostawy, podaje gabaryty produktów, wpisuje numer przesyłki w panelu i pobiera dane firmy po NIP-ie, bez umowy z żadnym operatorem.

### 0.5.0 · 26.08.2026 · `9780619`
**Rodzaj metody dostawy i gabaryt produktu jako podstawa płatności i wysyłki**
- W panelu Dostawa każda metoda ma selektor rodzaju: kurier, paczkomat albo odbiór osobisty (`kind`: courier, parcel_locker, pickup).
- Stare ustawienia dostawy działają bez migracji: `normalizeDeliveryConfig()` w `lib/shop.ts` dopisuje rodzaj przy każdym odczycie, zgadując go po identyfikatorze i nazwie.
- Zamówienie zapisuje rodzaj metody dostawy w swoim snapshocie.
- W formularzu produktu fizycznego nowa, opcjonalna sekcja „Gabaryt przesyłki” (waga, wymiary), bo bez tych danych broker nie wyceni przesyłki.
- Schemat bazy: zamówienia dostały pola operatora płatności, przewoźnika, numeru przesyłki, etykiety i punktu odbioru; produkty pola wagi i wymiarów. Usunięto pustą kolumnę `stripe_payment_intent_id`.
- Dlaczego: metoda dostawy była samą etykietą z ceną, więc system nie wiedział, że paczkomat wymaga wskazania punktu, co blokowało dodanie mapy punktów do checkoutu.

### 0.5.1 · 26.08.2026 · `02ac33b`
**Wybór paczkomatu w checkoutcie na własnej mapie z publicznym API InPostu**
- Klient wybiera paczkomat na mapie (Leaflet + OpenStreetMap) z listą punktów, odległością i godzinami otwarcia; szuka po kodzie pocztowym, mieście albo „w pobliżu”. Wyszukiwarka startuje z kodem pocztowym wpisanym w adresie.
- Przy dostawie do paczkomatu ulica w adresie jest opcjonalna, a zamówienia nie da się złożyć bez wskazania punktu. Przy płatności za pobraniem lista pokazuje tylko punkty przyjmujące płatność.
- `lib/inpost.ts` wyszukuje i weryfikuje punkty w publicznym ShipX Points InPostu. Poprawia wielkość liter w nazwie miasta i rozpoznaje błąd w treści odpowiedzi, bo dla nieistniejącego kodu API zwraca HTTP 200.
- `/api/points` pośredniczy w zapytaniach z limitem częstotliwości i godzinnym cache.
- Przy składaniu zamówienia kod punktu jest weryfikowany w InPoście, a nazwa i adres punktu zapisywane z odpowiedzi InPostu, nie z danych przeglądarki.
- Wybrany punkt widać na potwierdzeniu zamówienia, w mailu do klienta i do sprzedawcy oraz w panelu zamówienia (karta „Paczkomat” zamiast adresu).
- Dlaczego publiczne API: działa bez tokenu, konta i rejestracji domeny, więc u każdego sklepu bez konfiguracji. GeoWidget InPostu i mapa Furgonetki wymagają klucza przypisanego do domeny, czyli osobnego wpisu dla każdej subdomeny i własnej domeny.

### 0.5.2 · 26.08.2026 · `965d950`
**Śledzenie przesyłki: numer w panelu, link w mailu do klienta**
- W panelu zamówienia nowa karta „Przesyłka”: wybór przewoźnika i numer przesyłki. Przy zamówieniu do paczkomatu przewoźnik jest ustawiony z góry; po zapisie pojawia się link do śledzenia.
- Podpowiedź przypomina, by uzupełnić numer przed oznaczeniem zamówienia jako wysłanego, bo wtedy wychodzi mail.
- Mail „wysłane” zawiera numer przesyłki i przycisk śledzenia; dla przewoźnika bez wyszukiwarki sam numer z instrukcją.
- `lib/tracking.ts` obsługuje InPost, DPD, DHL, UPS, GLS, Pocztę Polską i FedEx; „Inny przewoźnik” zapisuje sam numer bez linku.
- Endpoint aktualizacji zamówienia sprawdza przewoźnika z listy i format numeru (odrzuca za krótkie i z niedozwolonymi znakami, usuwa spacje); oba pola można wyczyścić.
- Sprzedawca nadaje paczkę gdziekolwiek, bez integracji i umowy z przewoźnikiem.

### 0.5.3 · 26.08.2026 · `0c0dc26`
**Przelew bez przepisywania: kod QR, suma kontrolna numeru konta, dane firmy z NIP-u**
- Na ekranie potwierdzenia zamówienia klient widzi kod QR przelewu w standardzie 2D ZBP, obok numeru konta i tytułu. Gdy danych nie da się poprawnie sformatować, kod się nie pojawia.
- `lib/qr-transfer.ts` składa ciąg według rekomendacji ZBP (kwota w groszach, nazwa odbiorcy do 20 znaków, tytuł do 32, całość poniżej 160 znaków). Kod generuje serwer przy składaniu zamówienia, żeby nie powiększać kodu sklepu o koder QR.
- Panel płatności sprawdza sumę kontrolną numeru konta (`lib/nrb.ts`, IBAN mod 97) i odrzuca numer z przekręconą cyfrą. Wcześniej sprawdzał tylko liczbę cyfr, więc błąd wychodził dopiero, gdy przelewy nie przychodziły.
- Numer konta ma jedno formatowanie podczas wpisywania i przy zapisie.
- W ustawieniach konta sprzedawca wpisuje NIP i klika „Pobierz dane”: nazwa i adres firmy wczytują się z białej listy Ministerstwa Finansów (`lib/mf-whitelist.ts`, `/api/company-lookup`). Status VAT inny niż „Czynny” jest sygnalizowany.
- NIP jest sprawdzany sumą kontrolną przed zapytaniem, a endpoint wymaga zalogowania, żeby platforma nie była darmowym pośrednikiem do rejestru.
- Wszystkie trzy funkcje nie wymagają umowy z operatorem płatności; dane firmy posłużą potem do wniosku u operatora.

## 0.6 Wygląd sklepu (03.09.2026)
Sprzedawca dostaje wybór rozmiarów produktów, nową galerię, kilka układów hero (w tym otwarcie w stylu domów mody z lookbookiem) oraz ustawienia brandingu, gwarancji i stopki. Klient sklepu widzi uczciwsze sekcje strony głównej, bez fałszywych gwiazdek, i może kupić odzież w konkretnym rozmiarze.

### 0.6.0 · 03.09.2026 · `d652a70`
**Wybór rozmiaru produktu z walidacją po stronie serwera**
- Na stronie produktu jest selektor rozmiaru; bez wyboru nie da się dodać do koszyka, a przy jednym rozmiarze wybiera się on sam.
- Szybkie dodawanie z karty produktu z rozmiarami prowadzi na stronę produktu zamiast wrzucać pozycję bez rozmiaru.
- Pozycja koszyka to produkt + rozmiar (`lib/cart.ts`, klucz linii), więc ten sam produkt w dwóch rozmiarach to dwie pozycje.
- Serwer przy składaniu zamówienia sprawdza rozmiar względem rozmiarów produktu i zapisuje go w zamówieniu; stan magazynowy pozostaje liczony na produkt.
- Rozmiar widać w koszyku, podsumowaniu checkoutu, panelu zamówienia i mailach.
- W formularzu produktu nowe pole „Rozmiary (po przecinku)”.
- Dlaczego: pole rozmiarów istniało tylko w typach, więc odzieży w rozmiarach nie dało się sprzedać.

### 0.6.1 · 03.09.2026 · `8573bbd`
**Nowa galeria produktu z pełnoekranowym podglądem**
- Pierwsze zdjęcie zajmuje całą szerokość kolumny, kolejne układają się pod nim w siatce po dwa, zamiast dużego zdjęcia z paskiem miniatur.
- Kliknięcie otwiera pełnoekranowy podgląd ze strzałkami (z zawijaniem), obsługą Esc, licznikiem i blokadą przewijania tła.
- Kolumna z opisem produktu jest przyklejona podczas przewijania, bo galeria urosła w pionie.

### 0.6.2 · 03.09.2026 · `d4514b2`
**Sekcje strony głównej bez fałszywego dowodu społecznego i z trybem redakcyjnym**
- Hero nie pokazuje już zaszytych pięciu gwiazdek, które nowy sklep wyświetlał przy zerze opinii; zostaje tylko tekst dowodu społecznego, gdy jest wpisany.
- Sekcja opinii znika, gdy nie ma opinii ani logotypów, i ma przełącznik widoczności w edytorze strony głównej; gwiazdki pojawiają się tylko przy wpisanych opiniach.
- Sekcja korzyści dopasowuje siatkę do liczby kafelków i ma tryb bez ikon (tytuł, cienka linia, opis).
- Sekcja gwarancji ma poprawiony kontrast tekstu na ciemnym tle (wcześniej ok. 2:1) oraz nowe opcje: jasny lub ciemny wariant, ikony, widoczność.
- Tytuły podstron nie dublują już nazwy sklepu: wcześniej nazwa sklepu pojawiała się w tytule dwa razy.
- Pozycja Blog pojawia się w menu tylko, gdy sklep ma opublikowane wpisy.
- Wszystkie nowe ustawienia są opcjonalne; ich brak oznacza dotychczasowy wygląd.

### 0.6.3 · 03.09.2026 · `95e4b33`
**Hero w trzech układach do wyboru: split, fullbleed, editorial**
- W edytorze strony głównej sprzedawca wybiera układ hero i kadrowanie zdjęcia (góra, środek, dół), z podpowiedziami co do zdjęć.
- split: dotychczasowy układ, domyślny.
- fullbleed: zdjęcie od krawędzi do krawędzi, tekst na dole nad przejściem w kolor tła, czytelny na każdym zdjęciu; bez zdjęcia układ przechodzi w editorial.
- editorial: duża typografia, a zdjęcie jako pas 21:9 pod spodem.
- Drugi przycisk hero jest podkreślonym linkiem zamiast drugiej ramki.

### 0.6.4 · 03.09.2026 · `98258aa`
**Poprawka lint w podpowiedzi układu hero**
- W edytorze strony głównej podpowiedź układu hero nie zawiera już cudzysłowu w JSX, który zgłaszał lint.

### 0.6.5 · 03.09.2026 · `2e3e069`
**Gwarancja jako pasek zaufania nad stopką i ikony dobierane po znaczeniu**
- Nowy układ sekcji gwarancji „pasek”: wąski pas z małą ikoną, tytułem i zdaniem, bez nagłówka, w kolorze stopki, tak że oba bloki czytają się jako jeden.
- Każdy punkt gwarancji może mieć wybraną ikonę (tarcza, zwrot, paczka, ciężarówka, koperta, liść, kłódka, zegar, gwiazdka). Bez wyboru ikona zależy od pozycji, jak dotąd.
- W edytorze strony głównej doszedł wybór układu i ikony dla każdego punktu.
- Dlaczego: ikona dobierana po pozycji przy własnych treściach trafiała przypadkowo.

### 0.6.6 · 03.09.2026 · `dc3e661`
**Branding premium: jednolite tło, waga nagłówków, minimalne karty, podpis pod logo**
- Jednolite tło: sekcje, pas hero i stopka mają kolor strony i są oddzielone cienkimi liniami zamiast odcieni.
- Waga nagłówków sklepu do wyboru: lekka, normalna, pogrubiona. `lib/fonts.ts` dołącza wagę 300 do zapytania Google Fonts tylko dla fontów, które ją mają.
- Minimalny styl kart produktów: zdjęcie, nazwa i cena, bez zaokrągleń, etykiet i ikony koszyka po najechaniu, z większymi odstępami; działa na stronie głównej, w liście produktów i wyszukiwarce.
- Podpis pod logo w nawigacji (np. imię i nazwisko).
- Wszystkie cztery ustawienia są w formularzu brandingu i są opcjonalne.

### 0.6.7 · 03.09.2026 · `e94e08b`
**Wybór miejsca sekcji korzyści**
- W edytorze strony głównej sprzedawca wybiera, gdzie pokazać sekcję korzyści: na stronie głównej, na stronie O nas (pod tekstem o marce), w obu miejscach albo nigdzie. Domyślnie strona główna.

### 0.6.8 · 03.09.2026 · `080c5ff`
**Logo w stopce zamiast nazwy tekstem**
- Gdy sklep ma logo, stopka pokazuje ten sam plik i w tej samej wysokości co nawigacja.
- Dlaczego: nazwa tekstem w stopce obok logo w nagłówku wyglądała jak dwie różne marki.

### 0.6.9 · 03.09.2026 · `9dd6255`
**Podpis platformy w stopce sklepu**
- W stopce pojawił się podpis „Zbudowane w Polsce ♥ Sellflow” z linkiem do strony Sellflow.
- Znak Sellflow jest wstawiony bezpośrednio w kod, bo na subdomenie proxy przepisałoby ścieżkę obrazka na adres sklepu.

### 0.6.10 · 03.09.2026 · `57542c6`
**Podpis platformy z logo Sellflow, bez serduszka**
- Podpis w stopce używa logo Sellflow z `sell-flow.store` (14 px wysokości) zamiast znaku wstawionego w kod i serduszka.

### 0.6.11 · 03.09.2026 · `f283ed1`
**Otwarcie sklepu w stylu domów mody: hero „sam kadr”, menu na zdjęciu, lookbook**
- Nowy układ hero „cover”: zdjęcie na pełny ekran bez nagłówka i opisu, z opcjonalnym klikalnym zaproszeniem na dole, prowadzącym do listy produktów. Do wyboru wysokość i jasny lub ciemny tekst.
- Nawigacja w trybie nakładki: przezroczysta na górze strony, z tłem po przewinięciu i przy otwartym menu mobilnym. Przy jasnym tekście logo zamienia się na jasną wersję.
- Tryb nakładki włącza się tylko przy hero „cover” i bez górnego paska, który stała nawigacja by zasłoniła.
- Nowa sekcja lookbook: kolaż zdjęć na całą szerokość okna, bez nagłówka, cen i przycisków, w układzie „po dwa” albo „szeroki”, z opcjonalnym podpisem i linkiem.
- Sekcja produktów może być samą siatką, bez nadtytułu i tytułu.
- W brandingu doszedł upload jasnej wersji logo, a w edytorze strony głównej ustawienia hero „cover”, przełącznik nagłówka produktów i edytor lookbooka.
- Uwaga dla zespołu: `lib/shop.ts` składa konfigurację strony głównej klucz po kluczu, więc każdy nowy klucz trzeba tam dopisać, inaczej nie dotrze do sklepu.

### 0.6.12 · 03.09.2026 · `cf40071`
**Niższy wariant hero „cover” dla zdjęć poziomych**
- Do wysokości hero „cover” doszedł wariant średni (64% wysokości ekranu) obok pełnego i wysokiego.
- Dlaczego: poziome zdjęcie (2:1) rozciągnięte na pełny ekran traciło boki kadru, a niższa sekcja pokazuje je w całości.

## 0.7 Dokumenty prawne i lookbook (07.09.2026)
Sprzedawca podaje dane firmy raz, a regulamin, polityka prywatności i strona zwrotów składają się z nich same. Lookbook na stronie głównej dostał kadry filmowe i nowe układy, a strony sklepu przestały ciągnąć w HTML ciężkie logo zapisane w bazie.

### 0.7.0 · 07.09.2026 · `019e621`
**Dokumenty prawne składane z jednego zestawu danych**
- Panel „Dokumenty prawne” pyta o dane (NIP, adres, e-mail, czas realizacji itd.) zamiast dawać do wypełnienia szablon z [NAWIASAMI], w którym te same informacje trzeba było wpisywać kilka razy w dwóch dokumentach.
- Regulamin, polityka prywatności i strona zwrotów składają się z tych danych przy każdym wyświetleniu sklepu: zmiana NIP-u w jednym polu od razu zmienia wszystkie trzy dokumenty.
- Danych podanych w innych miejscach panelu (konto i firma, „O nas”, płatności, dostawa) formularz nie pyta drugi raz, tylko pokazuje, skąd wartość pochodzi.
- Wzory i klauzule branżowe (10 kategorii) przygotował prawnik. Generator dobiera warianty według profilu sprzedaży, włączonych metod płatności i dostawy oraz zaznaczonych klauzul, a paragrafy numeruje sam (`lib/legal/templates.ts`, `lib/legal/clauses.ts`, `lib/legal/data.ts`).
- Wygenerowany dokument publikuje się dopiero przy komplecie danych, żeby klient sklepu nie zobaczył w regulaminie „[UZUPEŁNIJ: NIP]”. Braki widzi tylko sprzedawca, z licznikiem w panelu.
- Kto woli własną treść, klika „Edytuj ręcznie” (`mode: "custom"`) i od tej chwili generator nie podmienia mu tekstu. Dokumenty napisane przed zmianą dostały tryb `custom` skryptem `scripts/migrate-legal-mode.ts`, uruchomionym na produkcji przed wdrożeniem.
- Paragrafy § na stronie sklepu są nagłówkami, a nie jednym blokiem tekstu.
- Poprawione linki: domyślny link do polityki w zgodach RODO prowadził do nieistniejącego `/polityka-prywatnosci` zamiast `/prywatnosc`, a panel podawał adresy dokumentów `/terms` i `/privacy`.

### 0.7.1 · 07.09.2026 · `a5912b5`
**Logo z kreatora trafia do Vercel Blob, nie do bazy**
- Logo wgrane w onboardingu było zapisywane w `shop_config` jako data URI i doklejane do HTML każdej podstrony, w Next.js dwukrotnie (HTML i payload RSC). Zmierzone przypadki: 1,2 MB, 694 KB i 636 KB na każde żądanie.
- `lib/blob.ts`: `uploadDataUrl()` przenosi obraz do Vercel Blob. Nazwa pliku pochodzi z odcisku sha1 treści, więc ten sam obraz nadpisuje się zamiast mnożyć kopie, a zmiana zawsze daje nowy URL omijający cache CDN.
- `POST /api/onboarding` przenosi logo po zalogowaniu i utworzeniu sklepu, bez otwierania anonimowego endpointu uploadu. Gdy storage nie odpowie, zostaje base64, bo sklep ma powstać mimo wszystko. Data URI, które nie jest obrazem, nie trafia do brandingu.
- Kreator skaluje logo do 600 px (wcześniej 512) i dobiera format po przezroczystości: logo na białym tle zapisuje jako JPEG (test: 2761 KB PNG → 28 KB JPEG), a PNG z kanałem alfa zostaje PNG-iem (1161 KB → 144 KB).

### 0.7.2 · 07.09.2026 · `c25c6b2`
**Lookbook: kadry filmowe i układ dwukolumnowy z przesunięciem**
- Kadr lookbooka może mieć krótki film w pętli, bez dźwięku i bez kontrolek; zdjęcie służy wtedy jako plakat na czas wczytywania i dla przeglądarek blokujących autoodtwarzanie. `preload="metadata"`, żeby kilka filmów nie kosztowało megabajtów przy pierwszym wejściu.
- Nowy układ „stagger”: dwie kolumny, prawa przesunięta w dół, kadry rozdzielane naprzemiennie. Nieparzysta liczba kadrów nie zostawia już pustej połowy rzędu.
- `/api/upload` przyjmuje MP4 i WebM (tylko te formaty odtworzy każda przeglądarka; HEVC z iPhone'a trzeba przekodować), a edytor strony głównej ma przycisk dodania filmu do konkretnego kadru.

### 0.7.3 · 07.09.2026 · `6aa4678`
**Lookbook: pas kadrów płynący w lewo**
- Czwarty układ: kadry w jednym rzędzie przesuwają się w pętli, więc mieści się ich dowolnie wiele, a lookbook zajmuje wysokość jednego kadru.
- Lista kadrów jest powielona, a animacja przesuwa ją o 50% szerokości, więc pętla nie ma widocznego szwu. Druga kopia jest `aria-hidden`; odstępy idą marginesem, nie `gap`, żeby pętla nie drgała.
- Tempo ok. 7 s na kadr (minimum 28 s). Najechanie kursorem zatrzymuje pas. Przy `prefers-reduced-motion` pas stoi, ale można go przewinąć ręcznie.

### 0.7.4 · 07.09.2026 · `ea8d72b`
**Lookbook: siatka po cztery kadry w rzędzie**
- Piąty układ: nieruchoma siatka, cztery kadry w rzędzie na desktopie i dwa na telefonie, wszystkie w proporcji 3:4.
- Powód: przy kadrach filmowych pas płynący w lewo dawał za dużo ruchu naraz, a w siatce jedynym ruchem zostają same filmy.

### 0.7.5 · 07.09.2026 · `094d25d`
**Lookbook: kadry filmowe w zwolnionym tempie, z regulacją w panelu**
- Klipy z sesji trwają 1–2 sekundy i w oryginalnym tempie migają. Domyślne tempo 0,5 wydłuża je dwukrotnie.
- Sprzedawca ustawia tempo w panelu (`lookbook.videoSpeed`, od 0,35 do 1), bo właściwa wartość zależy od materiału; w kodzie jest przycinane do 0,25–2.
- Nowy komponent kliencki `LookbookVideo` ustawia `playbackRate` z kodu i ponawia to przy `loadedmetadata`, bo wcześniejsze ustawienie bywa gubione.

### 0.7.6 · 07.09.2026 · `aaffa99`
**Lookbook: pętla filmu przechodzi płynnie zamiast cięcia**
- Pod filmem leży jego plakat (pierwsza klatka), a film pod koniec przebiegu wygasza się do zera, więc nawrót do początku jest niewidoczny. Symetryczne wygaszenie na starcie łagodzi przypadek, gdy plakat nie jest dokładnie pierwszą klatką.
- Krycie liczone w `requestAnimationFrame` (zdarzenie `timeupdate` przychodzi za rzadko), czas przejścia przeliczany przez tempo odtwarzania. Gdy rAF nie ruszy, film gra jak wcześniej.

## 0.8 Katalog, SEO i kontakt (09.09.2026)
Sklepy mogą sprzedawać produkty szyte na zamówienie bez ceny, mają czytelne adresy produktów, mapę witryny i dane strukturalne dla Google. Klienci dostali formularz kontaktowy na każdej stronie kontaktu i wyraźniejszą nawigację.

### 0.8.0 · 09.09.2026 · `43d7319`
**Produkty bez ceny: tryb „cena na zapytanie”**
- Nowa flaga `products.price_on_request` dla odzieży szytej na miarę: produkt nie ma ceny półkowej i nie da się go kupić z koszyka, zostaje zapytanie mailem.
- Sklep: karta i strona produktu pokazują „Cena na zapytanie”, zamiast koszyka jest przycisk `InquiryCta` (mailto z tematem, z zapasowym linkiem do /kontakt), rozmiary są informacją, nie wyborem.
- Sortowanie po cenie spycha takie produkty na koniec listy zamiast traktować je jak 0 zł.
- `POST /orders` odrzuca je kodem 409, więc stary koszyk w localStorage ani ręcznie złożone żądanie nie utworzą darmowego zamówienia.
- API zapisuje 0.00 tylko jako wypełniacz kolumny NOT NULL, zeruje cenę przed obniżką i nie dodaje wpisu do `price_history`, żeby nie zafałszować najniższej ceny z 30 dni (Omnibus).
- Panel: przełącznik w sekcji Cena chowa pola cenowe, lista produktów pokazuje „Na zapytanie”. Kolumnę na produkcji dodał `scripts/haga-spodnica-koralowa.ts`.

### 0.8.1 · 09.09.2026 · `c60fed3`
**Produkty bez ceny: „Produkt na zamówienie” zamiast „Cena na zapytanie”**
- Karta i lista pokazują „Produkt na zamówienie”, a na stronie produktu miejsce po cenie znika; informację niesie przycisk pod opisem, który otwiera wiadomość do sprzedawcy.
- W panelu przełącznik nazywa się „Produkt na zamówienie (bez ceny)”, lista pokazuje „Na zamówienie”, a komunikat kasy mówi o terminie, nie tylko o cenie. Powód: poprzednia nazwa stawiała w centrum brak ceny.

### 0.8.2 · 09.09.2026 · `bca7978`
**SEO: adresy produktów z nazwy, mapa witryny, dane strukturalne**
- Produkty mają adresy tekstowe z nazwy zamiast `/produkty/{uuid}`. `products.slug` jest nadawany raz i jest unikalny w obrębie sklepu (indeks na `shop_id`+`slug`), tak jak wpisy bloga.
- Zmiana nazwy produktu nie zmienia adresu; sprzedawca może go nadpisać ręcznie w panelu, z ostrzeżeniem.
- Stare adresy z identyfikatorem przekierowują 308 na nowe, więc linki wysłane klientom i zaindeksowane przez Google nie dają 404. Koszyk zapamiętuje adres, koszyki sprzed zmiany trafiają w to samo przekierowanie.
- Każdy sklep ma `/sitemap.xml` (strona główna, lista, produkty, wpisy bloga i tylko wypełnione strony treściowe) oraz `/robots.txt` (koszyk, zamówienie i wyszukiwarka wyłączone z indeksu). Oba liczone od hosta żądania, bo sklep działa pod subdomeną, własną domeną i ścieżką na domenie aplikacji.
- Dane strukturalne: Product i BreadcrumbList na karcie produktu (produkt na zamówienie bez bloku `offers`, bo oferta bez ceny jest niepoprawna), Organization i WebSite z wyszukiwarką na stronie głównej.
- `canonical` na karcie produktu, liście i stronie głównej, żeby sortowanie i filtry nie tworzyły duplikatów w indeksie.
- Onboarding nadaje adresy produktom demo; adresy dla 111 istniejących produktów nadał `scripts/add-product-slugs.ts`.

### 0.8.3 · 09.09.2026 · `916d864`
**Nawigacja pokazuje bieżącą stronę i reakcję na kliknięcie**
- Kreska pod etykietą w menu i stopce stoi pod bieżącą stroną, a na klikniętym linku przebiega od lewej, dopóki nowa strona się nie pojawi. Stan ładowania pochodzi z `useLinkStatus`, nie z własnego timera. Zgłoszenie Macieja: po kliknięciu nic się nie działo.
- `NavLink` ustawia `aria-current` dla czytników ekranu; ikona koszyka (bez etykiety) pulsuje w czasie ładowania. Kolor z `currentColor`, więc działa na każdym tle bez wariantów per motyw; przy wyłączonych animacjach zostaje sam stan bez ruchu.
- Objęte: menu na desktopie i mobilne, koszyk, wszystkie linki stopki. Dodany też `scripts/audit-seo-all-shops.ts`, który sprawdza, czy zmiany SEO objęły wszystkie sklepy (adresy produktów w bazie, mapa, robots i karta produktu na żywych adresach).

### 0.8.4 · 09.09.2026 · `95405dd`
**Podpis Sellflow w wektorze i powrót na górę przy zmianie strony**
- Podpis platformy w stopce sklepu jest wektorem w `currentColor` (`SellflowWordmark`) zamiast PNG ładowanego z landingu: bez osobnego żądania, skaluje się i przyjmuje przygaszony kolor drobnego druku danego sklepu.
- Przejście z długiej strony na krótszą zostawiało czytelnika w połowie treści. Przyczyna: `BrandTheme` jako pierwszy węzeł segmentu miał zerową wysokość, więc Next uznawał górę strony za widoczną i nie przewijał. Kontener treści idzie teraz pierwszy w powłoce podstron, na stronie głównej i na karcie produktu.
- Sprawdzone na sześciu przejściach; przycisk „wstecz” nadal przywraca poprzednią pozycję. Obie poprawki zgłosił Robert.

### 0.8.5 · 09.09.2026 · `d88c5d0`
**Formularz kontaktowy na stronie kontaktu każdego sklepu**
- Strona kontaktu zawsze ma formularz (imię, e-mail, opcjonalny telefon, wiadomość), także gdy sprzedawca nie podał adresu i telefonu. Wcześniej mogła kończyć się zdaniem „dane kontaktowe pojawią się tu wkrótce”, jak u HAGI.
- Wygląd wyłącznie z tokenów marki sklepu (kolory, zaokrąglenia, typografia), bez własnych kolorów w komponencie `ContactForm`.
- Walidacja po stronie serwera (`/api/shops/[shop]/contact`), limit 5 wysyłek na 10 minut z jednego adresu i ukryte pole-pułapka na boty, które po wypełnieniu dostaje odpowiedź sukcesu.
- Odbiorca po kolei: adres z „O nas”, adres z ustawień konta, e-mail właściciela; bez żadnego endpoint zwraca, że sklep nie ma skonfigurowanego kontaktu. `replyTo` ustawiony na nadawcę, więc sprzedawca odpowiada wprost klientowi.
- Nota o przetwarzaniu danych z linkiem do polityki prywatności; `/kontakt` wraca bezwarunkowo do mapy witryny.

### 0.8.6 · 09.09.2026 · `a66313d`
**Formularz kontaktowy: przy nieudanej wysyłce podaje adres zapasowy**
- Na produkcji brakowało `RESEND_API_KEY`, więc każda wysyłka kończyła się błędem, a komunikat „spróbuj ponownie za chwilę” był nieprawdziwy. Teraz endpoint zwraca publiczny adres sklepu z „O nas”, a formularz proponuje napisać wprost na niego.
- Na zewnątrz wychodzi wyłącznie adres z „O nas”, widoczny i tak na stronie; adres z ustawień konta i e-mail właściciela nie są ujawniane.

### 0.8.7 · 09.09.2026 · `39fef84`
**Skrypt sprawdzający tor awaryjny formularza kontaktowego**
- `scripts/test-contact-fallback.ts` ustawia publiczny adres na sklepie testowym, odpytuje produkcję i przywraca stan sprzed testu.
- Zakłada brakujący wiersz `about` i po teście go usuwa; pierwsza wersja aktualizowała nieistniejący wiersz i błędnie raportowała, że tor awaryjny nie działa.

## 0.9 Pierwszy sklep produkcyjny: HAGA (10.09 do 16.09.2026)
Sklep HAGA dostał pełny katalog, dane firmy, opublikowany regulamin i politykę oraz zasady dostawy i płatności od klientki. Platforma zyskała wysyłkę za granicę na zapytanie i własną integrację z Furgonetką, która przekazuje zamówienia do nadania i odsyła numer przesyłki.

### 0.9.0 · 10.09.2026 · `5df08df`
**Katalog HAGI: biała spódnica midi z żakardu**
- Szósty produkt HAGI: 490 zł, rozmiary XS–XL, trzy kadry 4:5 wycięte z dwóch zdjęć klientki.
- Dodany skryptem prosto do bazy produkcyjnej (`scripts/haga-biala-spodnica-zakard.ts`), zdjęcia na Vercel Blob, wpis w `price_history` tak jak przy zapisie przez API.

### 0.9.1 · 10.09.2026 · `0129726`
**Katalog HAGI: jedwabne spodnie, detal białej spódnicy, cena spódnicy koralowej**
- Siódmy produkt: „Jedwabne szerokie spodnie z gumkami”, 900 zł, rozmiary S/M i L/XL, trzy kadry 4:5. Trzecie zdjęcie białej spódnicy zastąpione ostrym detalem od klientki.
- Spódnica koralowa przestaje być produktem na zamówienie: cena 490 zł, `price_on_request=false` i pierwszy wpis w `price_history`.

### 0.9.2 · 10.09.2026 · `ed70eca`
**Kamizelka jedwabna i dane firmy HAGI**
- Ósmy produkt: „Jedwabna kamizelka wiązana na sznureczki”, 450 zł, rozmiary S/M/L; zdjęcie główne kolorowe, packshoty czarno-białe. Specyfikacja ma sam skład, bo wymiary przyszły bez liczb.
- Dane firmy do dokumentów prawnych (`scripts/haga-dane-firmy.ts`, klucze `legal` i `account`): nazwa, adres, NIP, data obowiązywania, szycie na miarę jako produkty personalizowane. Bez e-maila regulamin i polityka zostają w trybie „w przygotowaniu”.

### 0.9.3 · 10.09.2026 · `637d9c6`
**Czas realizacji HAGI: 7 dni, na miarę do 14**
- W danych do dokumentów prawnych domyślne „1–3” dni zastąpione wartością od klientki: 7 dni roboczych, a przy zamówieniach szytych na miarę do 14.

### 0.9.4 · 10.09.2026 · `93e6ea9`
**E-mail HAGI: regulamin i polityka opublikowane**
- Adres kontakt@hagastore.pl wpisany do `legal`, `account` i `about`, co uzupełniło dane i opublikowało regulamin oraz politykę.
- Z `about` adres biorą strona Kontakt, formularz kontaktowy i przycisk zapytania przy produktach na zamówienie.

### 0.9.5 · 11.09.2026 · `e8e09c0`
**Poprawki HAGI: skład, dostawa InPost, tylko przelew; wysyłka za granicę na zapytanie**
- Nowe pole `delivery.abroadOnRequest`: przełącznik „Wysyłka za granicę na zapytanie” w panelu dostawy. Po włączeniu strona Dostawa prosi klientów spoza Polski o kontakt przez formularz przed złożeniem zamówienia.
- Poprawki klientki (`scripts/haga-poprawki-2026-09-11.ts`, idempotentny): skład tkaniny jako jeden wiersz „Skład”, szycie na miarę opisane jako opcja, zmiana nazwy kamizelki cekinowej na „Cekinowa kamizelka z jedwabiem” bez zmiany adresu.
- Dostawa tylko InPost (paczkomat i kurier, po 18,49 zł), płatność tylko przelewem, slogan w stopce, tytuł „Blisko ciała” w „O nas”, schowana sekcja korzyści i FAQ bez placeholderów „[Do uzupełnienia…]”.

### 0.9.6 · 15.09.2026 · `634d5e0`
**Integracja z Furgonetką: zamówienia do nadania i numer przesyłki z powrotem**
- Nowy ekran „Furgonetka” w panelu: sprzedawca wkleja adres i token w swoim panelu Furgonetki, a ta cyklicznie pobiera zamówienia zmienione od wskazanej daty (`/api/furgonetka/[shop]/orders`).
- Sprzedawca robi etykiety u siebie w Furgonetce; numer przesyłki wraca do sklepu (`tracking_number`), przestawia zamówienie na „wysłane” i idzie mailem do klienta.
- Wybrana tańsza z dwóch dróg Furgonetki: bez OAuth, umowy z przewoźnikiem i rejestracji aplikacji. Kosztem jest to, że nadawanie odbywa się w panelu Furgonetki.
- Token przechowywany wyłącznie jako skrót SHA-256 i pokazywany raz przy generowaniu (w panelu widać 4 ostatnie znaki); zgubiony wymienia się na nowy. Wyciek bazy nie daje więc dostępu do cudzych zamówień i adresów klientów.
- Adres integracji stoi na domenie platformy, nie sklepu, bo subdomena lub własna domena mogą się zmienić i synchronizacja stanęłaby bez komunikatu.
- Sprzedawca przypisuje metodom dostawy usługi Furgonetki (InPost Paczkomat i Kurier, DPD, Orlen Paczka, Poczta Polska, DHL, UPS, GLS, FedEx). Kod punktu odbioru idzie tylko do przewoźnika, który go obsłuży; w innym przypadku punkt trafia do pola ulicy, żeby sprzedawca widział wybór klienta.
- Telefon jest wymagany w koszyku z produktem fizycznym, bo Furgonetka wymaga go obowiązkowo, a przewoźnicy wysyłają na niego powiadomienia.
- Sekret leży w osobnej tabeli `shop_integrations` (klucz `shopId`+`provider`), nie w `shop_config`, który storefront czyta w całości i który wraca w `GET /config`. Tabela zapisuje też czas ostatniego pobrania i wysłania jako dowód działania.

### 0.9.7 · 16.09.2026 · `66b1939`
**Katalog HAGI: lekki płaszcz bawełniany i jedwabna bluzka z guzikami na plecach**
- Dziewiąty produkt: „Lekki płaszcz bawełniany / kimono”, 480 zł, rozmiary S/M i M/L.
- Dziesiąty produkt: „Jedwabna bluzka z guzikami na plecach i wiązaniem w pasie”, 630 zł, rozmiary S/M i M/L. Oba dodane idempotentnymi skryptami z trzema zdjęciami na Vercel Blob i wpisem w `price_history`.

## 0.10 Audyt: bezpieczeństwo, pieniądze, zgodność (24.09 do 25.09.2026)
Audyt zamknął luki w bezpieczeństwie sklepów, ochronił zamówienia przed przekroczeniem limitów kodów i stanów magazynu, poprawił Omnibusa, RODO i newsletter. Sprzedawca nie traci już konfiguracji przez błędy zapisu, onboarding i domeny własne działają atomowo i z weryfikacją, a koszyk lepiej obsługuje kody rabatowe i mierzy lejek.

### 0.10.0 · 24.09.2026 · `7a495ec` · PR #1
**Bezpieczeństwo: sanitizer, dane produktów cyfrowych, sklepy poza hostem platformy**
- `sanitizeHtml` przepisany na tokenizer: każdy „<” w wyniku pochodzi z tagu odbudowanego przez sanitizer, reszta jest escapowana. Stary regex przepuszczał tagi z niedomkniętym cudzysłowem (np. `<img src=x onerror=...>`) do opisu produktu i paska TopBar.
- Storefront dostaje z danych realizacji produktu cyfrowego tylko `duration`, `mode` i `details`. Wcześniej `fileUrl`, `url`, `licenseKeys` i `instructions` trafiały w payloadzie RSC karty produktu do każdego odwiedzającego.
- Adres `app.<domena>/{slug}/...` przekierowuje 308 na `{slug}.<domena>/...`: sklep nie renderuje się na originie panelu i sesji Clerka i nie tworzy drugiej kopii strony w Google. Reguły slugów wydzielone do `lib/slug-rules.ts`, żeby `proxy.ts` nie ładował klienta bazy.
- Zamówienia, newsletter, rabaty i statystyki odwiedzin odrzucają sklepy usunięte (soft delete).
- Domyślna domena w proxy i `storefront-base` ujednolicona na sell-flow.store.

### 0.10.1 · 24.09.2026 · `ce3ee51` · PR #1
**Pieniądze i zgodność: atomowe zamówienia, Omnibus, wygasanie rabatów, feed Furgonetki**
- Zamówienie najpierw rezerwuje użycie kodu i stan magazynu warunkowymi UPDATE-ami (`uses_count < max_uses`, `stock >= qty`), a dopiero potem zapisuje się. Przy błędzie rezerwacje są cofane.
- Wcześniej równoległe zamówienia przekraczały limit użyć kodu, a `GREATEST(stock - qty, 0)` po cichu ukrywało sprzedaż ponad stan.
- Numer zamówienia liczony z MAX zamiast COUNT, do 6 prób przy kolizji (wcześniej 3).
- Błąd zapisu klienta po zapisanym zamówieniu nie zwraca już 500, co groziło duplikatem zamówienia przy ponowieniu.
- Omnibus: najniższa cena z 30 dni przed obniżką liczona razem z ceną obowiązującą na początku okna, a seria zapisów z tą samą ceną liczy się jako jedna. Wcześniej okno obejmowało bieżącą cenę promocyjną i zwykle pokazywało ją samą (`lib/price-history.ts`).
- Kod rabatowy „ważny do 1.10” działa do końca 1.10 czasu polskiego, a nie do 02:00 tego dnia; dotyczy też kodów już zapisanych.
- Furgonetka: filtr zamówień do nadania przeniesiony do SQL, bo strona z samymi odbiorami osobistymi na zawsze zatrzymywała kursor. Przy synchronizacji przyrostowej anulowane zamówienia przechodzą ze statusem `cancelled`.

### 0.10.2 · 24.09.2026 · `4e32824` · PR #1
**Panel: zapisy nie nadpisują danych sklepu, czyszczenie pól produktu, adres w onboardingu**
- Strony konfiguracji (branding, dostawa, prawo, strona główna, stopka, menu, „O nas”, FAQ, płatności, produkty) nie połykają błędów bazy. Wcześniej chwilowy błąd pokazywał formularz z wartościami domyślnymi, a jedno „Zapisz” nadpisywało nimi prawdziwą konfigurację. Nowy `error.tsx` panelu pokazuje komunikat i przycisk ponowienia.
- Branding i lista produktów korzystają z `getShopAccess` zamiast `ownerId`: admin w trybie „zaloguj jako właściciel” widzi prawdziwe dane, a nie domyślny „Mój sklep”, którego zapis nadpisywał branding klientki.
- Branding scalany w bazie (`jsonb ||`): ekran Branding i Ustawienia → Styl wysyłają tylko swoje pola, więc zapis jednego nie cofa zmian drugiego. Formularz brandingu startuje z tych samych kolorów domyślnych co sklep.
- Sekcje ustawień (poza domeną) nie są odmontowywane przy zmianie zakładki, więc po powrocie nie pokazują i nie zapisują danych sprzed zapisu.
- Edycja produktu pozwala wyczyścić kategorię, badge, krótki opis i opis (wysyłane jako `null`, wcześniej `undefined` znikało z JSON-a).
- Onboarding poprawia adres sklepu zamiast go odrzucać: `toShopSlug` (`lib/slug-rules.ts`) zawsze daje poprawny slug („OK” → ok-sklep, długie nazwy bez końcowego myślnika); ta sama funkcja działa w kreatorze i na serwerze.

### 0.10.3 · 24.09.2026 · `c0b8716` · PR #1
**Anulowanie zamówień, double opt-in newslettera, RODO w analityce, drobne poprawki sklepu**
- Anulowanie zamówienia zwraca towar na stan, oddaje użycie kodu rabatowego i koryguje statystyki klienta (`lib/order-lifecycle.ts`).
- API pilnuje dozwolonych przejść statusów, a warunkowy UPDATE sprawia, że przejście i jego skutki (także mail „wysłane”) wykonują się raz przy podwójnym kliknięciu albo równoległym żądaniu Furgonetki. Błąd z API widać w panelu zamówienia.
- Newsletter z double opt-in bez migracji: zapis wysyła podpisany link (HMAC, ważny 7 dni), a wiersz powstaje dopiero po potwierdzeniu. Link otwiera stronę z przyciskiem, zapis robi POST, żeby skanery poczty nie potwierdzały za ludzi. Limit 3 maili na adres na godzinę.
- Opcjonalny kod nagrody za zapis ustawiany w panelu idzie mailem po potwierdzeniu i nie trafia do HTML-a sklepu. Popup i domyślne teksty nie obiecują już kodu ani rabatu.
- `TrackVisit` zapisuje identyfikator odwiedzającego w localStorage tylko po zgodzie na analitykę (albo gdy sklep nie ma bannera). Wizyta liczy się nadal, ale bez identyfikatora.
- Furgonetka: „odłącz” pokazuje rozłączenie dopiero po potwierdzeniu z API.
- Wyszukiwarka: `?q=a&q=b` nie daje 500, szukanie idzie po tekście opisu, nie po HTML.
- Link do polityki w bannerze cookies działa na adresach ścieżkowych i przyjmuje tylko ścieżki sklepu albo http(s). Nieistniejąca strona na hoście działającego sklepu pokazuje „Nie znaleźliśmy tej strony” z linkiem do sklepu zamiast „sklep niedostępny”.

### 0.10.4 · 24.09.2026 · `81f1c20` · PR #2
**Onboarding atomowy, weryfikacja własności domen, poprawne wykrywanie kolizji w bazie**
- Sklep, konfiguracja i produkty startowe zapisują się w onboardingu jednym `db.batch` (transakcja w neon-http). Błąd nic nie zostawia, a ponowienie startuje od zera zamiast trafić na sklep bez konfiguracji.
- Unikalny indeks `shops.owner_id`: dwie karty ani podwójne kliknięcie nie utworzą dwóch sklepów; przegrane żądanie dostaje sklep zwycięzcy.
- Własność domeny własnej potwierdza rekord TXT `_sellflow.<domena>` z tokenem sklepu (`lib/domain-ownership.ts`). Samo skierowanie domeny na Vercel nie wystarcza, bo ten adres jest wspólny dla wszystkich projektów.
- `proxy` kieruje na sklep tylko domeny zweryfikowane. Już działające domeny zachowują weryfikację bez TXT, dopóki DNS jest poprawny.
- Niezweryfikowane zajęcie domeny nie blokuje prawdziwego właściciela: domenę może przejąć inny sklep, a zweryfikuje się ten, kto opublikuje swój TXT. Zweryfikowana domena działającego sklepu nadal blokuje (409).
- Zmiana domeny idzie w kolejności: dodanie nowej w Vercelu, zapis w bazie, zwolnienie starej. Przy błędzie bazy nowa domena jest odpinana.
- Panel sklepu i panel ops pokazują wymagany rekord TXT i status „brakuje TXT”.
- drizzle 0.45 opakowuje błędy w `DrizzleQueryError`, więc sprawdzanie komunikatu pod kątem „unique” nigdy nie działało. Nowe `uniqueViolation()` (`lib/db/errors.ts`) czyta SQLSTATE 23505, co naprawia ponawianie numeru zamówienia przy kolizji (wcześniej 500) i komunikat o zdublowanym kodzie rabatowym.
- `scripts/prepare-domains-onboarding.ts` do uruchomienia przed wdrożeniem: usuwa duplikaty właścicieli i ustawia flagę weryfikacji dla działających domen.

### 0.10.5 · 25.09.2026 · `2b983af` · PR #2
**Koszyk: ciche pole na kod, kod z linku, promocje w koszyku, pomiar lejka**
- Pole „Kod rabatowy” w koszyku i zamówieniu jest schowane za linkiem „Mam kod rabatowy” (`DiscountBox`). Otwarte pole tuż nad „Zamawiam i płacę” sygnalizowało klientce bez kodu, że inni płacą mniej. W zamówieniu zostaje nad przyciskiem, bo ten od razu składa zamówienie.
- Parametr `?kod=…` na dowolnej stronie sklepu stosuje kod (`DiscountFromLink`). Kod jest zapamiętany przy koszyku (`useCartDiscount` w `lib/cart.ts`), widoczny w koszyku z sumą po rabacie, a po wygaśnięciu sprawdzany ponownie i usuwany z wyjaśnieniem.
- Mail z nagrodą za newsletter i strona potwierdzenia zapisu prowadzą do koszyka z kodem. W panelu Rabaty przy każdym kodzie jest „Kopiuj link”.
- Promocje w koszyku (przełącznik w Rabatach, domyślnie wyłączony, klucz `cart`): kod z paska do zastosowania jednym kliknięciem albo rabat za zapis do newslettera wprost z koszyka. Pokazywane są tylko kody, które przechodzą walidację; kod za newsletter nie trafia do HTML-a.
- Pomiar lejka: anonimowa tabela `checkout_events` (bez zgody na cookies) i karta w Statystykach z wejściami na zamówienie, konwersją, zamówieniami z kodem, rozwinięciami pola, kodami zastosowanymi według źródła i odrzuconymi według powodu.
- Rabat w koszyku liczony tym samym zaokrągleniem co na serwerze.

## 0.11 Płatności online: Tpay (29.09.2026)
Sprzedawca może przyjmować płatności online przez własne konto Tpay, a klient płaci od razu po złożeniu zamówienia i wraca do sklepu na stronę z wynikiem płatności. Nieopłacone zamówienia online same się anulują po 48 h, więc towar nie wisi zarezerwowany bez końca.

### 0.11.0 · 29.09.2026 · `0af70cf` · PR #3
**Płatności online przez Tpay (własne konto sprzedawcy)**
- W panelu, w sekcji Płatności, pojawiła się karta Tpay: sprzedawca wpisuje Client ID i Secret, może zaznaczyć konto testowe (sandbox), włączyć lub wyłączyć metodę i odłączyć konto. Karta pokazuje środowisko, datę podłączenia i ostatnie powiadomienie od Tpay.
- Klucze są sprawdzane w Tpay przy zapisie, a Secret nigdy nie wraca do przeglądarki. Sekrety są szyfrowane AES-256-GCM (`lib/secret-box.ts`) kluczem trzymanym poza bazą (`INTEGRATIONS_ENCRYPTION_KEY`), a dane sklepu leżą w `shop_integrations` jako provider „tpay”.
- Klient sklepu widzi w checkoucie metodę „Płatność online”. Po złożeniu zamówienia trafia na stronę Tpay; gdy Tpay odmówi utworzenia transakcji, zamówienie i rezerwacje stanu są cofane.
- Nowa strona powrotu `/zamowienie/platnosc` informuje klienta o wyniku płatności.
- Webhook `/api/tpay/[shop]/notify` traktuje powiadomienie tylko jako sygnał: status „opłacone” jest ustawiany dopiero po odczytaniu transakcji z API Tpay i sprawdzeniu kwoty.
- Klient Tpay OpenAPI w `lib/tpay.ts`: logowanie OAuth z cache tokenu, tworzenie i odczyt transakcji. Sprawdzenie, czy Tpay jest włączony, wydzielono do `lib/tpay-status.ts` bez sekretów, bo import modułu serwerowego psuł build podglądu sklepu.
- Etykiety płatności online pojawiły się na liście zamówień i w mailach, a generowany regulamin dostał klauzulę o operatorze płatności.
- Na Pulpicie podpięty Tpay zalicza krok „Skonfiguruj płatności”, więc sprzedawca przyjmujący tylko płatności online nie widzi go już jako niezrobionego.

### 0.11.1 · 29.09.2026 · `319088c` · PR #4
**Tpay: diagnostyka odrzuconych kluczy i logowanie OAuth jako form-data**
- Panel zamiast samego „Tpay nie przyjął tych kluczy” pokazuje komunikat zwrócony przez Tpay, a każda odmowa trafia do logów (status, komunikat, końcówka Client ID, bez sekretu).
- Żądanie `/oauth/auth` idzie jako multipart/form-data, jak w przykładach Tpay, z drugą próbą w JSON. Wcześniej nie dało się odróżnić złego sekretu od braku uprawnień czy złego formatu żądania.

### 0.11.2 · 29.09.2026 · `4a8bcee` · PR #5
**Tpay: jawny User-Agent i rozpoznawanie blokady Cloudflare**
- Na produkcji logowanie do Tpay kończyło się błędem 403 ze stroną blokady Cloudflare, bo domyślny User-Agent Node'a łapał się na Browser Integrity Check. Wszystkie wywołania Tpay przedstawiają się teraz jako Sellflow.
- Gdy odpowiedź jest stroną blokady Cloudflare, panel pokazuje krótki komunikat z kodem błędu i Ray ID zamiast surowego HTML.

### 0.11.3 · 29.09.2026 · `68c2fa2` · PR #6
**Tpay: poprawny adres produkcyjnego API (api.tpay.com)**
- Produkcja łączyła się z `openapi.tpay.com`, gdzie Cloudflare odbijał żądania POST. Produkcyjne API Tpay to `api.tpay.com`; adres `openapi.` jest używany tylko w sandboxie.
- Logowanie OAuth wraca do formatu x-www-form-urlencoded jako pierwszej próby, multipart i JSON zostają jako kolejne.

### 0.11.4 · 29.09.2026 · `06b9a1a` · PR #7
**Automatyczne anulowanie nieopłaconych zamówień online po 48 h**
- Zamówienia z płatnością online, nieopłacone i w statusie „oczekujące”, starsze niż 48 h, są anulowane. Zwalniany jest stan magazynowy, kod rabatowy i agregaty klienta. Przelew i pobranie nie są objęte tą regułą.
- Przed anulowaniem system sprawdza transakcję w Tpay: jeśli była opłacona, a powiadomienie zginęło, zamówienie dostaje status „opłacone”. Gdy Tpay jest niedostępny, zamówienie czeka na kolejny przebieg.
- Zadanie działa w `lib/order-expiry.ts`, uruchamiane co godzinę przez Vercel Cron (`/api/cron/expire-orders`, autoryzacja przez `CRON_SECRET`).
- Klient dostaje mail o anulowaniu. Sprzedawca dostaje mail, gdy Tpay potwierdzi wpłatę za zamówienie już anulowane (raz, przy faktycznej zmianie).
- Regulamin, mail z potwierdzeniem zamówienia i strona powrotu z Tpay informują o 48 h na płatność.

### 0.11.5 · 29.09.2026 · `593cea3` · PR #8
**Panel: pozycja menu „Płatności (Tpay, przelew, pobranie)”**
- Dawna nazwa „Płatności i VAT” kojarzyła się z księgowością i sprzedawca szukający miejsca na klucze Tpay tam nie trafiał. Nowa nazwa jest w menu, nagłówku strony i wyszukiwarce panelu, a fraza „tpay” znajduje tę stronę.

### 0.11.6 · 29.09.2026 · `1c61a19` · PR #9
**Panel: plan Pro jako beta dla pierwszych sklepów i czytelniejsze menu boczne**
- W Ustawieniach, w sekcji planu, sklep na Pro widział jednocześnie „aktywny na planie startowym” i kartę „Płatne plany już wkrótce”. Teraz opis zależy od planu: Pro ma plakietkę Beta i kartę programu beta, a Free i Starter opis limitu i dotychczasową kartę o płatnych planach.
- Pro (beta) jest opisany jako plan płatny z ceną ustalaną indywidualnie i rozliczaną poza panelem. Karta obiecuje utrzymanie ceny przez okres beta i 30 dni uprzedzenia przed zmianą cennika.
- Menu boczne jest czytelniejsze: pozycje 13,5 px przy kontraście 11:1 (wcześniej 12 px i 3,5:1), etykiety sekcji 10,5 px i 5,7:1, ikony 16 px. Menu ma 256 px szerokości, żeby dłuższe nazwy mieściły się w jednej linii.

## 0.12 Redesign panelu i plany (29.09 do 30.09.2026)
Panel sprzedawcy dostał nowy, spójny wygląd z granatowym menu, działający także w trybie ciemnym, prowadzoną konfigurację sklepu na Pulpicie i menu ułożone według zadań. Uporządkowano też plany: Starter dostał plakietkę Beta i własną domenę.

### 0.12.0 · 29.09.2026 · `7ab0675` · PR #10
**Panel, etap 1 redesignu (kierunek A): menu, nagłówek, lista zamówień**
- Menu boczne w granacie Sellflow z logo i dopiskiem „admin” w lewym górnym rogu. Wszystkie sekcje i pozycje mają ikony, a aktywna strona jest wyróżniona ikoną w kolorze aqua.
- Nagłówek pokazuje okruszki „grupa / strona”.
- Lista zamówień: filtry wszystkich 6 statusów z licznikami, gęsta tabela z kropkami statusu i płatności, kwoty z separatorem tysięcy. Na telefonie zamówienia są pokazywane jako karty.
- Nowe tokeny kolorów panelu (`--panel-sidebar-*`, `--panel-primary`, aqua, success, warning) z wersjami dla trybu ciemnego. Hover w menu jest w CSS, kolory wyłącznie z tokenów.
- `components/admin/nav.ts` to jedna lista stron dla menu, okruszków i wyszukiwarki. Wcześniej nazwy stron były w trzech kopiach.

### 0.12.1 · 29.09.2026 · `8aabaa5` · PR #11
**Panel, etap 2 redesignu: Pulpit**
- Kafelki na Pulpicie ułożone od „do zrobienia dziś” (do obsługi, czeka na płatność), potem sprzedaż. Magenta pojawia się tylko przy niezerowych liczbach.
- Checklista konfiguracji, ostatnie zamówienia (kropki statusu, numery w foncie stałej szerokości) i szybkie akcje działają też w trybie ciemnym.
- Statusy zamówień i etykiety płatności przeniesiono do `lib/order-status.ts`, poza plik kliencki, bo Pulpit jako komponent serwerowy nie mógł ich bezpiecznie importować z tabeli zamówień.
- `lib/money.ts` daje jedno formatowanie złotówek z separatorem tysięcy.

### 0.12.2 · 29.09.2026 · `7c3e55a` · PR #12
**Panel, etap 3 redesignu: szczegóły zamówienia**
- Nagłówek zamówienia: numer w foncie stałej szerokości, znaczniki statusu i płatności, powrót do listy.
- Następny krok statusu jest głównym przyciskiem w granacie, anulowanie przyciskiem z obrysem. Magenta nie pojawia się już na każdej akcji.
- E-mail i telefon klienta są klikalne (mailto, tel). Karty, pola i kwoty w nowym stylu, z obsługą trybu ciemnego.

### 0.12.3 · 29.09.2026 · `d8b97e2` · PR #13
**Panel, etap 4 redesignu: lista produktów**
- Nad listą produktów jest wyszukiwarka po nazwie i kategorii.
- Stan magazynu pokazany kropką z tekstem (wyprzedane, mało, liczba sztuk, nie śledzony). Plakietki „Nowość” i „Usługa” mają formę obrysu.
- Nazwa produktu prowadzi do edycji; przełącznik widoczności i ołówek zostały. Ceny z separatorem tysięcy, na telefonie karty zamiast tabeli.

### 0.12.4 · 29.09.2026 · `6653935` · PR #14
**Panel, etap 5 redesignu: formularz produktu**
- Nagłówek formularza przykleja się przy przewijaniu, więc nazwa produktu i przycisk „Zapisz” są zawsze pod ręką. Powrót do listy jest nad nim.
- Sekcje formularza to karty z nagłówkami, pola mają 13,5 px i czytelniejsze etykiety.
- Wybór typu produktu i przełączniki są zaznaczane granatem, magenta została tylko na przycisku zapisu. Wszystkie kolory pochodzą z tokenów panelu, także przycisk usuwania zdjęcia w trybie ciemnym.

### 0.12.5 · 29.09.2026 · `054c90e` · PR #15
**Panel, redesign 1/4: wszystkie pozostałe ekrany na tokenach panelu**
- Płatności, Dostawa, Kody rabatowe, Newsletter, Klienci, Analityka, Kategorie, Wygląd i treści, Dokumenty prawne, dzwonek powiadomień i wyszukiwarka wyglądają tak samo jak przeprojektowane ekrany i działają w trybie ciemnym.
- Kolory wpisane na sztywno (476 miejsc w 24 plikach) zamieniono na tokeny `--panel-*`: szarości na ink, ink-muted, ink-faint, border i surface, granat na primary, magentę na accent, zieleń na success.
- Przełączniki i fokus pól pokazują stan „włączone” granatem; magenta została na przyciskach zapisu.
- Podgląd sklepu w „Logo i kolorystyka” zostaje w kolorach sklepu, nie panelu.

### 0.12.6 · 29.09.2026 · `8f9bfac` · PR #16
**Panel, redesign 2/4: tabele Klienci i Kategorie**
- Klienci: inicjały przy nazwisku, klikalny e-mail i telefon, liczby wyrównane do prawej, kwoty z separatorem tysięcy, na telefonie karty.
- Kategorie: widoczność jako kropka (wszystkie, część albo żaden produkt widoczny) z opisem „x z y”, akcje jako jednolite przyciski z ikonami, pusty stan z przyciskiem w granacie. Wyszukiwarki, nagłówki i odstępy jak w pozostałych tabelach.

### 0.12.7 · 30.09.2026 · `10b68ea` · PR #17
**Panel, redesign 3/4: Analityka**
- Analityka używa palety Sellflow zamiast osobnego pomarańczu: wykres sprzedaży w granacie, karta „Widoczność w AI” w granacie menu z akcentem aqua, źródło ruchu „AI” też w aqua.
- Kafelki KPI wyglądają jak na Pulpicie, karty mają nagłówki 48 px, listy większe fonty. Kwoty z separatorem tysięcy, wybór okresu działa w trybie ciemnym.

### 0.12.8 · 30.09.2026 · `294ee5b` · PR #18
**Panel, redesign 4/4: Ustawienia i ujednolicenie całości**
- W Ustawieniach aktywna pozycja wewnętrznego menu jest w granacie, jak w menu bocznym. Tytuły, karty, pola i opisy mają te same rozmiary co reszta panelu (wspólne komponenty `settings/ui`).
- Przyciski zapisu w całym panelu to prostokąty 36 px zamiast pigułek (14 miejsc, także karta Tpay). Komunikaty brzmią „Zapisano” i „Błąd, spróbuj ponownie”, bez wykrzyknika.
- Pola tekstowe w formularzach dostały obramowanie 1 px, promień 8 px i rozmiar 13,5 px (11 miejsc), jak w formularzu produktu. Tytuły stron są półgrube.

### 0.12.9 · 30.09.2026 · `0d1e8b1` · PR #19
**Panel: semantyczne tokeny błędu i sukcesu, panel operacyjny w stylu panelu, teksty onboardingu**
- Nowe tokeny `--panel-danger-*` i `--panel-success-*` (jasny i ciemny tryb) zastąpiły ok. 90 kolorów czerwieni i zieleni wpisanych na sztywno w panelu, panelu operacyjnym, onboardingu i logowaniu. Komunikaty o błędach są czytelne w trybie ciemnym, a białe napisy na przyciskach zapisu zachowują kontrast.
- Panel operacyjny (ops) dostał granatowe menu jak panel sklepu („Sellflow ops”) z wyróżnieniem aktywnej pozycji (`OpsNav`).
- Karty wyboru fontu mają tło z tokenu zamiast białego, a teksty onboardingu przepisano na proste zdania.

### 0.12.10 · 30.09.2026 · `d995d1a` · PR #20
**Panel UX: prowadzona konfiguracja na Pulpicie, menu według zadań, wyszukiwanie po słowach kluczowych**
- Dopóki sklep nie jest skonfigurowany, na górze Pulpitu jest sekcja „Uruchom sklep” z jednym wyróżnionym następnym krokiem (opis i przycisk w magencie) oraz ponumerowanymi krokami w kolejności: produkt, płatności, dostawa, dokumenty prawne, logo, o sklepie. Podtytuł mówi, ile kroków zostało.
- Przycisk szybkiej akcji zostaje neutralny, dopóki konfiguracja nie jest skończona.
- Menu ułożone według pracy: Sprzedaż, Oferta, Płatności i wysyłka, Wygląd sklepu, Marketing, Sklep i konto. Grupy Wygląd sklepu i Marketing są domyślnie zwinięte i otwierają się same, gdy bieżąca strona jest w środku. Każda pozycja ma jednozdaniową podpowiedź.
- Wyszukiwarka panelu dopasowuje strony po słowach kluczowych (np. regulamin, blik, domena, paczkomat) i pokazuje podpowiedź pod nazwą strony.
- Teksty panelu uporządkowano w ok. 80 miejscach, zamieniając wtrącenia na proste zdania.

### 0.12.11 · 30.09.2026 · `805ebf3` · PR #21
**Menu: etykieta „Płatności” bez listy metod**
- Pozycja menu nazywa się krótko „Płatności”. Tpay, przelew i pobranie zostały w podpowiedzi i słowach kluczowych wyszukiwarki.

### 0.12.12 · 30.09.2026 · `40ec41b` · PR #22
**Domena: ponowne podpięcie domeny już dodanej do projektu Vercel nie zwraca błędu**
- Vercel zwraca kod „in use” także wtedy, gdy domena jest już przypięta do projektu Sellflow (np. dodana ręcznie w panelu Vercela). Przed zgłoszeniem konfliktu `lib/vercel-domains.ts` sprawdza projekt i traktuje taki przypadek jako sukces.

### 0.12.13 · 30.09.2026 · `ded5269` · PR #23
**Plan: Starter też pokazuje plakietkę Beta i kartę programu beta**
- Oba płatne plany (Starter i Pro) są w cenie beta dla pierwszych sklepów. Kartę „płatne plany wkrótce” widzi już tylko plan Free.

### 0.12.14 · 30.09.2026 · `abc3d3d` · PR #24
**Ustawienia: plan właściciela sklepu zamiast plan oglądającego; podpięta domena zostaje do zarządzania**
- Ustawienia czytały plan, e-mail i ID zalogowanego użytkownika, więc administrator otwierający panel sprzedawcy widział swój własny plan (sklep HAGA pokazywał Pro po przeniesieniu na Starter). Dane są teraz czytane z właściciela sklepu (`shops.owner_id`).
- Domena, która jest już podłączona, pozostaje widoczna i można nią zarządzać na każdym planie. Blokada planu dotyczy tylko podłączania nowej domeny.

### 0.12.15 · 30.09.2026 · `4850953` · PR #25
**Plany: własna domena dostępna na planie Starter**
- Własną domenę można podłączyć na planach Starter i Pro. `lib/plans.ts` ma flagę `customDomain` dla każdego planu i funkcję `planAllowsCustomDomain()`, z której korzysta API domeny i blokada w Ustawieniach.
- Karta blokady, komunikat błędu API i opis planu Starter wspominają o domenie.

## 0.13 Handel przez agentów AI i operacje (od 30.09.2026)
Sklepy są przygotowane na zakupy przez wyszukiwarki i asystentów AI: dane strukturalne, feedy produktowe dla Google i ChatGPT, kontrola botów AI i ocena gotowości katalogu. Zespół Sellflow dostał rozbudowany panel operacyjny, a sprzedawcy reset hasła z ekranu logowania.

### 0.13.0 · 30.09.2026 · `215e8f5` · PR #26
**Handel przez agentów AI, etap 1: dane strukturalne, feed produktowy, reguły dla botów AI i analityka crawlerów**
- Karta produktu ma rozszerzone dane JSON-LD: sprzedawca, koszty i czas dostawy (`shippingDetails` z konfiguracji dostawy i dni realizacji), polityka zwrotów (`hasMerchantReturnPolicy`) i `FAQPage` z FAQ produktu. Strona `/faq` sklepu też dostaje `FAQPage`.
- Polityka zwrotów wynika z regulaminu: 14 dni, odesłanie pocztą, koszt po stronie klienta; dla produktów cyfrowych, usług i personalizowanych zwrot nie przysługuje.
- Każdy sklep ma `/feed.xml` w formacie Google Merchant (RSS): produkty fizyczne z ceną i zdjęciem, rozmiary jako warianty `item_group`, uwzględniony próg darmowej dostawy.
- W Ustawieniach → Integracje jest adres feedu z przyciskiem kopiowania i krokami podpięcia w Merchant Center.
- `robots.txt` wymienia boty AI z nazwy (m.in. OAI-SearchBot, GPTBot, Claude-SearchBot, ClaudeBot, PerplexityBot, CCBot), podzielone na wyszukujące, działające na prośbę użytkownika i trenujące. Boty trenujące stosują się do nowego przełącznika Zgodność → Boty AI (domyślnie dozwolone).
- Wizyty crawlerów AI są zapisywane po stronie serwera (przez `after()`) w tabeli wizyt jako źródło „ai_bot”; `proxy.ts` przekazuje ścieżkę w nagłówku `x-sf-path`.
- W Analityce pojawiła się karta „Boty AI w sklepie”, a statystyki ruchu ludzi nie liczą wizyt botów.
- Logika jest w `lib/agent-commerce.ts` (rejestr botów, sekcje robots, dane dostawy i zwrotów, feed) i `lib/ai-bot-log.ts`. `normalizeCompliance()` zastąpiło trzy kopie scalania domyślnych ustawień zgodności.

### 0.13.1 · 30.09.2026 · `c04a02b` · PR #27
**Handel przez agentów AI, etap 2: atrybuty produktu, gotowość dla AI, asystent AI (wkrótce), linki do koszyka**
- W formularzu produktu są nowe atrybuty: EAN (sprawdzany cyfrą kontrolną GS1), kod producenta (MPN) i materiał. Zapisuje je kolumna `products.attributes` (jsonb); materiał może być też wzięty z wcześniej wpisanej specyfikacji „Materiał/Skład”.
- Ocena gotowości dla AI (`lib/product-attributes.ts`) liczy ważone braki (np. zdjęcie, krótki opis, opis, kategoria, materiał, identyfikator, waga) i podaje, po co dane pole jest agentowi albo Google. Wynik widać na żywo w formularzu produktu, w kolumnie listy produktów i na karcie katalogu na Pulpicie.
- JSON-LD karty produktu ma gtin, mpn, materiał, kolor i rozmiar. Feed Google dostał `g:gtin`, `g:mpn` i `g:material`, a `identifier_exists` pojawia się tylko wtedy, gdy produkt nie ma żadnego identyfikatora. Materiał i EAN są widoczne w tabeli specyfikacji na karcie produktu.
- Metody dostawy w panelu mają pole z czasem transportu w dniach, używane w danych o dostawie.
- Asystent AI (Claude Opus 5.5, odpowiedź strukturalna) proponuje materiał, kategorię i krótki opis na podstawie nazwy, opisu i pierwszego zdjęcia (`/api/shops/[shop]/products/suggest`). Nic nie jest zapisywane bez kliknięcia sprzedawcy.
- Asystent działa tylko z ustawionym `ANTHROPIC_API_KEY`; bez klucza jest pokazany jako wyszarzony z plakietką „wkrótce”.
- Pola checkoutu mają atrybuty `name` i `autocomplete`, co ułatwia ich wypełnianie.
- Linki `/koszyk?dodaj=slug:ilość:rozmiar` dodają produkty do koszyka klienta (`AddFromLink`).

### 0.13.2 · 30.09.2026 · `4465c76` · PR #28
**Sklep: brak przewijania w poziomie na telefonach**
- Klientka zgłosiła, że strona produktów hagastore.pl przesuwa się na boki na telefonie z Androidem. `html` i `body` dostały `overflow-x: clip`, które przycina nadmiar bez tworzenia kontenera przewijania, więc przyklejony pasek nawigacji dalej działa.

### 0.13.3 · 30.09.2026 · `4a40b19` · PR #29
**Panel operacyjny: lista sklepów w zakładkach Aktywne i Usunięte, usunięte sklepy poza przeglądem**
- Lista sklepów w `/ops/shops` ma zakładki „Aktywne” i „Usunięte” z licznikami; wyszukiwanie działa w obrębie bieżącej zakładki.
- Przegląd w panelu operacyjnym (liczniki sklepów, nowe sklepy, sklepy bez produktów, ostatnie sklepy) pomija sklepy usunięte.

### 0.13.4 · 30.09.2026 · `a271906` · PR #30
**Panel operacyjny: kolejka „Wymaga uwagi”, stan systemu, bogatsza lista sklepów, stan sklepu, przywracanie z listy**
- Przegląd ma kolejkę „Wymaga uwagi”: niezweryfikowana domena, opłacone i niewysłane zamówienia starsze niż 3 dni, wejścia na stronę zamówienia bez zamówień, anulowane bez wpłaty, sklep, który utknął w konfiguracji. Gdy stan systemu ma problemy, pojawia się baner.
- Nowa strona `/ops/system` porównuje `schema.ts` z bazą (tabele, kolumny, indeksy), pokazuje, które zmienne środowiskowe są ustawione (bez wartości), wdrożoną wersję i czas odpowiedzi bazy.
- Lista sklepów pokazuje GMV z 30 dni, ostatnie zamówienie i aktywność właściciela (Clerk). Ma sortowanie, filtr planu, wyszukiwanie po e-mailu i eksport CSV (`/api/ops/shops/export`).
- Naprawiono licznik produktów na liście, który zawsze pokazywał 0 przez niekwalifikowane „id” w zapytaniu.
- Szczegóły sklepu pokazują jego stan: checklistę jak na Pulpicie, integracje, gotowość dla Google i AI oraz 10 ostatnich zamówień.
- Usunięty sklep można przywrócić bezpośrednio z zakładki „Usunięte”.
- Checklista konfiguracji i gotowość katalogu są w `lib/shop-setup.ts`, wspólnym dla Pulpitu i panelu operacyjnego.

### 0.13.5 · 05.10.2026 · `b23858a` · PR #31
**Logowanie: reset hasła z przycisku „Nie pamiętam hasła” (SEL-27)**
- Przycisk „Nie pamiętam hasła” na `/login` był atrapą, a aplikacja nie miała ścieżki resetu, więc sprzedawca z kontem na e-mail i hasło nie mógł odzyskać dostępu.
- Teraz sprzedawca podaje e-mail, dostaje kod, wpisuje go i ustawia nowe hasło, po czym jest zalogowany.
- Proces działa w Clerk: `signIn.create` ze strategią `reset_password_email_code`, weryfikacja kodu, `resetPassword` z wylogowaniem pozostałych sesji, na końcu `setActive`.
- Nieznany e-mail i konta zakładane tylko przez Google dostają osobne komunikaty po polsku.
- Można wysłać kod ponownie i wrócić do logowania; formularz nie kręci się bez końca, gdy proces nie zakończy się sukcesem.
- Reset działa wewnątrz `AuthForm` bez nowej trasy, bo `proxy.ts` na domenie aplikacji przekierowałby ścieżkę `/forgot-password` na subdomenę sklepu.

### 0.13.6 · 05.10.2026 · `ac0226e` · PR #32
**Lookbook HAGI: nowy układ sześciu kadrów i siatka 3 kolumn przy 6 lub 9 kadrach**
- Skrypt `scripts/haga-lookbook-2026-10-05.ts` ustawia w lookbooku sklepu HAGA nową kolejność sześciu kadrów, w tym dwa nowe zdjęcia czarno-białe. Stare kadry są wyszukiwane po nazwie pliku, nowe zdjęcia wysyłane raz.
- Przy 6 lub 9 kadrach lookbook na desktopie pokazuje trzy zdjęcia w rzędzie, żeby ostatni rząd nie był w połowie pusty.

### 0.13.7 · 06.10.2026 · `bc4d3d2` · PR #33
**Integracje: feed produktowy dla ChatGPT (specyfikacja OpenAI) obok feedu Google**
- Każdy sklep ma nowy adres `/feed-openai.tsv` z katalogiem w formacie TSV według specyfikacji produktowej OpenAI (m.in. `item_id`, `group_id`, `url`, `image_url`, `price`, `availability`, dane sprzedawcy, polityka i termin zwrotu, kraj sklepu i kraje docelowe).
- Zakres produktów i warianty rozmiarów są takie same jak w feedzie Google.
- Zakup przez checkout w ChatGPT jest wyłączony; klient kupuje na karcie produktu w sklepie.
- W Ustawieniach → Integracje jest druga karta z adresem feedu, kopiowaniem i pobraniem pliku, bo OpenAI nie pobiera feedu z URL (wymaga wgrania przez Ads Manager albo SFTP).
- Generowanie feedu jest w `lib/agent-commerce.ts`.

### 0.13.8 · 06.10.2026 · PR #34
**Numer wersji w panelu, roadmapa i ta lista zmian**
- W panelu sklepu, na dole menu bocznego pod „Podgląd sklepu”, widać numer wersji „Sellflow v0.13.8”. Po najechaniu kursorem pokazuje się skrót commitu wdrożenia (na Vercelu).
- Numer pochodzi z jednego miejsca, `package.json`, i trafia do builda przez `env` w `next.config.ts` razem ze skrótem `VERCEL_GIT_COMMIT_SHA`. Do kodu przeglądarki nie trafia cały `package.json`.
- `ROADMAP.md`: zasady numeracji `0.ETAP.ZMIANA`, przegląd etapów od stycznia 2026, propozycja kolejnych etapów do 1.0.0.
- `CHANGELOG.md`: ten plik, szczegółowy opis każdej wersji.
- Historia nadana wstecz: od 0.1 każdy commit na `main` repozytorium `app` ma jeden numer w kolejności dat, z pominięciem commitów merge i pustych „redeploy”.

## 0.14 Panel produktu: zdjęcia, SEO, wysyłka, faktura

### 0.14.0 · 09.10.2026
**Kadrowanie i kolejność zdjęć, SEO produktów i stron, czas wysyłki, faktura na firmę (feedback klientki)**
- Zdjęcia produktu: edytor kadru (przeciąganie, przybliżenie 1–3×) w ramce 4:5, takiej jak na liście produktów i karcie produktu. Plik nie jest zmieniany, zapisujemy punkt środka i zoom w `products.attributes.imageMeta`, więc feed Google i powiększenie zdjęcia dalej używają oryginału. Opis zdjęcia (alt) w tym samym oknie.
- Kolejność zdjęć: przeciąganie albo strzałki, przycisk „ustaw jako główne”, zawsze widoczny przycisk usuwania.
- Kolejność produktów: na liście produktów tryb „Ułóż kolejność” (przeciąganie lub strzałki), zapis przez `PUT /api/shops/[shop]/products/reorder`. Obowiązuje w sklepie w sortowaniu „Polecane”. Nowy produkt trafia na koniec.
- SEO produktu: tytuł i opis w Google, główna fraza i dodatkowe frazy, podgląd wyniku Google, lista kontrolna. Własny tytuł jest pełnym `<title>`. Frazy nie trafiają do `meta keywords` (Google je ignoruje), ale działają w wyszukiwarce sklepu.
- SEO stron sklepu: nowa strona panelu „SEO stron” (główna, produkty, O nas, FAQ, Kontakt, Blog, Dostawa, Zwroty), klucz configu `seo`.
- Czas wysyłki per produkt (dni robocze, od–do): widoczny na karcie produktu, trafia do danych strukturalnych i feedu Google zamiast domyślnego czasu sklepu.
- Faktura na firmę w checkoucie: pole „Chcę fakturę VAT”, NIP z sumą kontrolną, pobranie danych z rejestru MF (`/api/shops/[shop]/company-lookup`, z limitem), dane w zamówieniu, mailach i panelu (karta „Faktura VAT”, znacznik na liście).
- Bez migracji bazy: nowe dane siedzą w istniejących kolumnach JSON.

### 0.14.1 · 09.10.2026
**SEO wpisów na blogu**
- Edytor wpisu ma sekcję „SEO: wynik w Google” (tytuł, opis, główna i dodatkowe frazy, podgląd Google, lista kontrolna) oraz opis zdjęcia głównego (alt).
- Sklep używa ich w `<title>`, opisie, Open Graph (wpis jako `article`, zdjęcie z alt) i dodaje dane strukturalne `BlogPosting` oraz adres kanoniczny.
- Bez migracji: dane leżą w `shop_config` pod kluczem `blogSeo` (mapa id wpisu → SEO) i są usuwane razem z wpisem.

### 0.14.2 · 09.10.2026
**Polityka prywatności: dane do faktury**
- Generowana polityka prywatności wymienia dane do faktury VAT na firmę (nazwa firmy, NIP, adres), cel „wystawienie faktury na wniosek Klienta” oraz informację, że podanie danych jest dobrowolne, a Sklep może uzupełnić je z rejestru podatników VAT po NIP.
- Dotyczy sklepów z dokumentami generowanymi automatycznie. Sklepy, które przejęły treść na własność (tryb „edytuj ręcznie”), muszą dopisać to same.

### 0.14.3 · 09.10.2026
**Zdjęcia produktu: przyciski na kafelku nie nakładają się**
- Kafelki zdjęć w karcie produktu są szersze (min. 10 rem), a przyciski większe (32 px), żeby strzałki, „ustaw jako główne”, kadr i usuwanie dało się kliknąć bez trafiania w sąsiedni przycisk.

### 0.14.5 · 09.10.2026
**Wylogowanie z kreatora, z panelu i z panelu operacyjnego prowadzi do logowania (SEL-29, SEL-32)**
- Kreator ma w nagłówku „Wyloguj” dla zalogowanych (na telefonie sama ikona) i „Masz konto? Zaloguj się” dla gości. Wcześniej konto bez sklepu nie miało jak wyjść z kreatora, bo każda trasa odsyłała do niego z powrotem. Po wylogowaniu z kreatora szkic i dane odłożone na czas rejestracji są czyszczone, żeby następna osoba na tej przeglądarce zaczynała od pustego formularza. Czyszczenie następuje dopiero, gdy Clerk potwierdzi wylogowanie, więc nieudane wylogowanie nie kasuje szkicu. Do załadowania Clerka przycisk jest nieaktywny. Przycisk bierze stan z Clerka, więc po „Wstecz” po wylogowaniu pokazuje „Zaloguj się”, a nie nieaktualne „Wyloguj”.
- Po wylogowaniu z panelu sklepu sprzedawca trafia na `/login`, a nie do kreatora (`afterSignOutUrl` w `ClerkProvider`).
- „Wyloguj” w panelu operacyjnym naprawdę wylogowuje. Wcześniej był to link do `/login`, który zalogowanego odsyłał z powrotem do `/ops`.
- Strona główna kieruje zalogowanego na `/dashboard`, który wybiera jego sklep albo kreator. Wcześniej strona główna miała własną kopię tego wyszukiwania z `redirect()` wewnątrz `try/catch`, więc przekierowanie do panelu było połykane i sprzedawca szedł przez `/onboarding`.
