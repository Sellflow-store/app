# Sellflow: wersje i roadmapa

Aktualna wersja: **0.13.8**. Widać ją w panelu sklepu, na dole menu bocznego. Najedź na numer, żeby zobaczyć commit wdrożenia.

Ten plik to przegląd. Szczegółowy opis każdej wersji (co się zmieniło, jak działa, dlaczego) jest w [CHANGELOG.md](CHANGELOG.md).

## Zasady numeracji

Format `0.ETAP.ZMIANA`.

- **ETAP** (druga liczba) rośnie, gdy produkt dostaje nowy obszar możliwości: płatności online, redesign panelu, handel przez agentów AI. Etap ma nazwę i jednozdaniowy cel.
- **ZMIANA** (trzecia liczba) rośnie z każdym zmergowanym PR do `main`, w tym poprawki. Nowy etap zaczyna od `.0`.
- **0.0** to etap przed kodem produktu (koncepcja, walidacja, landing). Jego numery oznaczają kamienie milowe, a nie commity.
- **1.0.0** to publiczny start: sklep zakłada się sam, bez naszej pomocy, a płatne plany działają. Do tego czasu zostajemy na `0.x`.
- Numer bumpuje się w tym samym PR co zmiana: `npm version 0.X.Y --no-git-tag-version`, wiersz w tym pliku i szczegółowy wpis w [CHANGELOG.md](CHANGELOG.md).

Wersje do 0.13.7 nadane wstecz. Od 0.1 każdy commit na `main` repozytorium `app` dostał jeden numer w kolejności dat, z pominięciem commitów merge i pustych „redeploy”. Strona marketingowa (`www`) rozwija się osobno i nie ma numerów, poza startem landingu w 0.0.

## Etapy w skrócie

| Etap | Okres | Temat | Wersje |
|---|---|---|---|
| 0.0 | styczeń do maja | Koncepcja i walidacja: akcelerator, ankiety, MVP, design system, landing | 8 kamieni milowych |
| 0.1 | 21.05 do 26.05 | MVP: konto, kreator sklepu, sklep w barwach marki | 14 |
| 0.2 | 11.06 do 18.06 | Sklep, który sprzedaje: produkty, koszyk, checkout, zamówienia | 14 |
| 0.3 | 01.07 do 04.07 | Typy produktów, analityka, pierwszy audyt bezpieczeństwa | 8 |
| 0.4 | 04.07 do 21.07 | Marka, adres sklepu, własne domeny | 26 |
| 0.5 | 26.08 | Fundament zamówień: paczkomaty, śledzenie, przelew QR | 4 |
| 0.6 | 03.09 | Wygląd sklepu na poziomie marek modowych | 13 |
| 0.7 | 07.09 | Dokumenty prawne z jednego zestawu danych, lookbook | 7 |
| 0.8 | 09.09 | Katalog, SEO, formularz kontaktowy | 8 |
| 0.9 | 10.09 do 16.09 | Pierwszy sklep produkcyjny HAGA, Furgonetka | 8 |
| 0.10 | 24.09 do 25.09 | Audyt: bezpieczeństwo, pieniądze, zgodność | 6 |
| 0.11 | 29.09 | Płatności online Tpay | 7 |
| 0.12 | 29.09 do 30.09 | Redesign panelu, plany | 16 |
| 0.13 | od 30.09 | Handel przez agentów AI, panel operacyjny | 9 (obecnie 0.13.8) |

W repozytorium `app` są dwie przerwy: 27.05 do 10.06 i 22.07 do 25.08. W tym czasie w repo `www` powstawały głównie artykuły na blog i treści landingu. Co działo się poza kodem (np. demo day akceleratora zaplanowany na lipiec), zespół może dopisać.

## Historia

### 0.0 Koncepcja i walidacja (styczeń do maja 2026)
Etap bez kodu produktu: akcelerator Unicorn Hub, walidacja segmentów, definicja MVP, design system, landing z waitlistą. Numery nadane kamieniom milowym, nie commitom.

| Wersja | Data | Kamień milowy | Źródło |
|---|---|---|---|
| 0.0.0 | styczeń | Start projektu | zespół (brak artefaktu w repozytoriach) |
| 0.0.1 | luty | Pitch deck v1 w akceleratorze Unicorn Hub Innovation Lab | `kontekst-projektu/brief.md` |
| 0.0.2 | kwiecień | Walidacja True/False zakończona: 2 ankiety, min. 40 osób na segment, przejście do rundy IV (ścieżka Go Global) | `kontekst-projektu/kontekst-walidacja.md` |
| 0.0.3 | 16.04 | Warsztaty: priorytety MoSCoW, definicja MVP, hipoteza „10% odwiedzających zapisze się na waitlistę” | `kontekst-projektu/kontekst-akcelerator.md` |
| 0.0.4 | 24.04 | Design system Sellflow i jego dokumentacja (Kacper Dąbek) | repo `Design-System`, `sellflow-docs` |
| 0.0.5 | 29.04 | Landing z waitlistą na sell-flow.store, GA4, PostHog | repo `www` |
| 0.0.6 | 30.04 | Kontekst projektu: brief, strategia, persony, walidacja | repo `kontekst-projektu` |
| 0.0.7 | 14.05 | Demo szablonu sklepu, potem uniwersalny szablon shop-v2 (Kacper Dąbek) | repo `www` |

### 0.1 MVP: konto, onboarding, sklep w barwach marki (21.05 do 26.05.2026)
Pierwszy kod platformy: sklep i panel na jednej aplikacji, rejestracja, kreator sklepu z podglądem na żywo, panel operacyjny.

| Wersja | Data | Zmiana |
|---|---|---|
| 0.1.0 | 21.05 | Start repozytorium aplikacji (Next.js) |
| 0.1.1 | 21.05 | Fundament MVP: sklep, panel, API |
| 0.1.2 | 21.05 | Przejście na proxy.ts (Next.js 16), konfiguracja bazy |
| 0.1.3 | 21.05 | Logowanie, rejestracja, weryfikacja e-maila, Google OAuth |
| 0.1.4 | 21.05 | Onboarding: konto, sklep i konfiguracja startowa |
| 0.1.5 | 21.05 | app.sell-flow.store obsługiwane jako platforma, nie sklep |
| 0.1.6 | 21.05 | Domeny podglądu Vercel obsługiwane jako platforma |
| 0.1.7 | 25.05 | Kreator sklepu z dobieraniem marki i podglądem na żywo |
| 0.1.8 | 25.05 | Rejestracja po kreatorze, dane podglądu w adresie |
| 0.1.9 | 25.05 | Formularz logowania gotowy do prerenderu |
| 0.1.10 | 25.05 | Przekierowanie z /dashboard do sklepu użytkownika |
| 0.1.11 | 25.05 | Kierowanie po zalogowaniu ze strony głównej |
| 0.1.12 | 26.05 | Sklep przyjmuje kolory marki |
| 0.1.13 | 26.05 | Panel operacyjny Sellflow: lista sklepów, wejście jako właściciel |

### 0.2 Sklep, który sprzedaje (11.06 do 18.06.2026)
Pełna ścieżka zakupu: produkty, koszyk, checkout, zamówienia, e-maile, dokumenty prawne. Kompletny panel sprzedawcy.

| Wersja | Data | Zmiana |
|---|---|---|
| 0.2.0 | 11.06 | /dashboard zawsze trafia do sklepu użytkownika |
| 0.2.1 | 11.06 | Tydzień 1: formularz produktu, zdjęcia, edytor strony głównej, karta produktu |
| 0.2.2 | 11.06 | Tydzień 2: koszyk, dostawa i płatność, checkout, API zamówień |
| 0.2.3 | 11.06 | Tydzień 3: zamówienia w panelu, e-maile transakcyjne, dokumenty prawne |
| 0.2.4 | 11.06 | Tydzień 4: strony dostawy i zwrotów, ustawienia sklepu, ochrona dostępu do panelu |
| 0.2.5 | 11.06 | Panel operacyjny: akcje operatora, limity planów, metryki platformy |
| 0.2.6 | 12.06 | Kolizja adresu sklepu nie blokuje rejestracji |
| 0.2.7 | 12.06 | Typografia i tło strony edytowalne przez sprzedawcę |
| 0.2.8 | 12.06 | Komplet panelu: klienci, statystyki, kategorie, rabaty, newsletter, menu |
| 0.2.9 | 13.06 | Kategorie: zmiana nazwy, ukrywanie, usuwanie zbiorcze |
| 0.2.10 | 13.06 | Pulpit, lista startowa, wyszukiwarka i powiadomienia w panelu |
| 0.2.11 | 13.06 | Stany magazynowe od panelu do koszyka |
| 0.2.12 | 18.06 | Wyszukiwarka w sklepie, sortowanie, filtr dostępności |
| 0.2.13 | 18.06 | Blog: edycja w panelu, wpisy w sklepie i menu |

### 0.3 Typy produktów, analityka, bezpieczeństwo (01.07 do 04.07.2026)
Produkty cyfrowe i usługi, analityka z widocznością w AI, pierwszy audyt bezpieczeństwa.

| Wersja | Data | Zmiana |
|---|---|---|
| 0.3.0 | 01.07 | Analityka: porównanie okresów, źródła ruchu, widoczność w AI |
| 0.3.1 | 01.07 | Edytor produktu: opis z formatowaniem, własne parametry |
| 0.3.2 | 01.07 | Typy produktów: fizyczny, cyfrowy, usługa |
| 0.3.3 | 01.07 | Checkout zależny od typu: cyfrowe i usługi bez wysyłki i adresu |
| 0.3.4 | 01.07 | Ustawienia: Integracje, Zgodność, Motyw, Omnibus |
| 0.3.5 | 02.07 | Audyt bezpieczeństwa: blokada zawieszonych sklepów, limity zapytań, XSS |
| 0.3.6 | 03.07 | Rejestracja bez ślepych zaułków przy rozjechanej sesji |
| 0.3.7 | 04.07 | Onboarding łączy istniejące konto po zweryfikowanym e-mailu |

### 0.4 Marka, adres sklepu i własne domeny (04.07 do 21.07.2026)
Cztery style sklepu z projektów w Figmie, subdomeny i polskie adresy podstron, upload na Vercel Blob, własna domena klienta.

| Wersja | Data | Zmiana |
|---|---|---|
| 0.4.0 | 04.07 | Cztery gotowe style zamiast suwaków estetyki |
| 0.4.1 | 06.07 | Cztery style sklepu z Figmy (Michał), kolor dodatkowy, zaokrąglenia |
| 0.4.2 | 10.07 | Podgląd w kreatorze bez błędu 404 przy kliknięciu |
| 0.4.3 | 10.07 | Nawigacja na subdomenie sklepu, zarezerwowane adresy platformy |
| 0.4.4 | 10.07 | Podgląd sklepu z panelu na subdomenie |
| 0.4.5 | 10.07 | Miękkie usuwanie sklepów |
| 0.4.6 | 10.07 | Panel operacyjny pod admin.domena |
| 0.4.7 | 10.07 | Panel operacyjny: obsługa zabłąkanych ścieżek |
| 0.4.8 | 10.07 | Panel operacyjny: koniec pętli przekierowań |
| 0.4.9 | 13.07 | Przełącznik zespołu między panelem sklepu a panelem operacyjnym |
| 0.4.10 | 14.07 | Treść sklepu generowana w całości po polsku |
| 0.4.11 | 14.07 | Czyste adresy na subdomenie sklepu |
| 0.4.12 | 14.07 | Polskie ścieżki podstron (produkty, o-nas, regulamin) |
| 0.4.13 | 14.07 | Kreator: zapis sklepu z dużym logo |
| 0.4.14 | 14.07 | Kreator: spójny adres w podglądzie |
| 0.4.15 | 14.07 | Kreator: odzyskanie logo przy zapisie |
| 0.4.16 | 14.07 | Upload: czytelny błąd, logo do 4 MB |
| 0.4.17 | 14.07 | Upload na Vercel Blob zamiast uploadthing |
| 0.4.18 | 14.07 | Zdjęcie hero wgrywane w panelu |
| 0.4.19 | 14.07 | Sekcja produktów przy 1 lub 2 produktach |
| 0.4.20 | 14.07 | Rozmiar logo w nawigacji |
| 0.4.21 | 14.07 | Własny favicon platformy i sklepów |
| 0.4.22 | 14.07 | Edytowalna stopka: opis, linki do social mediów |
| 0.4.23 | 21.07 | Własna domena klienta: routing, Vercel API, ekran w panelu |
| 0.4.24 | 21.07 | Panel operacyjny: zarządzanie domeną sklepu |
| 0.4.25 | 21.07 | Subdomena przekierowuje na zweryfikowaną własną domenę |

### 0.5 Fundament zamówień (26.08.2026)
Klient wybiera paczkomat, płaci przelewem bez przepisywania danych i śledzi przesyłkę.

| Wersja | Data | Zmiana |
|---|---|---|
| 0.5.0 | 26.08 | Fundament pod płatności i wysyłkę: rodzaj metody dostawy, gabaryt produktu |
| 0.5.1 | 26.08 | Wybór paczkomatu w koszyku: własna mapa na publicznym API InPostu |
| 0.5.2 | 26.08 | Śledzenie przesyłki: numer w panelu, link w mailu do klienta |
| 0.5.3 | 26.08 | Przelew bez przepisywania: kod QR, suma kontrolna NRB, dane firmy z NIP-u |

### 0.6 Wygląd sklepu (03.09.2026)
Storefront na poziomie marek modowych: rozmiary, galeria, trzy układy hero, branding premium.

| Wersja | Data | Zmiana |
|---|---|---|
| 0.6.0 | 03.09 | Wybór rozmiaru: pozycja koszyka to produkt + rozmiar, walidacja po stronie serwera |
| 0.6.1 | 03.09 | Galeria produktu: zdjęcie wiodące na całą kolumnę, packshoty w siatce, lightbox |
| 0.6.2 | 03.09 | Sekcje strony głównej: bez fałszywego dowodu społecznego, tryb redakcyjny |
| 0.6.3 | 03.09 | Hero w trzech układach do wyboru w panelu: split, fullbleed, editorial |
| 0.6.4 | 03.09 | Edytor strony głównej: poprawka lint w podpowiedzi układu hero |
| 0.6.5 | 03.09 | Gwarancja jako pasek zaufania nad stopką, ikony dobierane po znaczeniu |
| 0.6.6 | 03.09 | Branding premium: jednolite tło, waga nagłówków, minimalne karty, podpis pod logo |
| 0.6.7 | 03.09 | Sekcja korzyści: strona główna, O nas, obie albo ukryta |
| 0.6.8 | 03.09 | Stopka: logotyp zamiast nazwy tekstem, gdy sklep ma logo |
| 0.6.9 | 03.09 | Stopka: podpis platformy „Zbudowane w Polsce” z linkiem do landingu |
| 0.6.10 | 03.09 | Stopka: podpis platformy z logo Sellflow |
| 0.6.11 | 03.09 | Otwarcie jak w domach mody: hero „sam kadr”, menu na zdjęciu, lookbook |
| 0.6.12 | 03.09 | Hero „cover”: niższy wariant wysokości dla kadrów poziomych |

### 0.7 Dokumenty prawne i lookbook (07.09.2026)
Regulamin i polityki generowane z jednego zestawu danych. Lookbook z kadrami filmowymi.

| Wersja | Data | Zmiana |
|---|---|---|
| 0.7.0 | 07.09 | Dokumenty prawne składane z jednego zestawu danych |
| 0.7.1 | 07.09 | Kreator zapisuje logo w Vercel Blob zamiast base64 w bazie |
| 0.7.2 | 07.09 | Lookbook: kadry filmowe i układ dwukolumnowy z przesunięciem |
| 0.7.3 | 07.09 | Lookbook: pas kadrów płynący w lewo |
| 0.7.4 | 07.09 | Lookbook: siatka po cztery kadry w rzędzie |
| 0.7.5 | 07.09 | Lookbook: kadry filmowe w zwolnionym tempie, z regulacją w panelu |
| 0.7.6 | 07.09 | Lookbook: płynne zapętlenie filmu |

### 0.8 Katalog, SEO i kontakt (09.09.2026)
Produkty na zamówienie, adresy i dane strukturalne pod Google, formularz kontaktowy w każdym sklepie.

| Wersja | Data | Zmiana |
|---|---|---|
| 0.8.0 | 09.09 | Produkty bez ceny: tryb „cena na zapytanie” |
| 0.8.1 | 09.09 | Produkty bez ceny: etykieta „Produkt na zamówienie” |
| 0.8.2 | 09.09 | SEO: adresy produktów z nazwy, mapa witryny, dane strukturalne |
| 0.8.3 | 09.09 | Nawigacja pokazuje bieżącą stronę i reakcję na kliknięcie |
| 0.8.4 | 09.09 | Podpis Sellflow w wektorze, powrót na górę przy zmianie strony |
| 0.8.5 | 09.09 | Formularz kontaktowy na stronie kontaktu każdego sklepu |
| 0.8.6 | 09.09 | Formularz kontaktowy: przy nieudanej wysyłce podaje adres zapasowy |
| 0.8.7 | 09.09 | Skrypt sprawdzający tor awaryjny formularza kontaktowego |

### 0.9 Pierwszy sklep produkcyjny: HAGA (10.09 do 16.09.2026)
Wdrożenie HAGI na żywo i własna integracja z Furgonetką.

| Wersja | Data | Zmiana |
|---|---|---|
| 0.9.0 | 10.09 | Katalog HAGI: biała spódnica midi z żakardu |
| 0.9.1 | 10.09 | Katalog HAGI: jedwabne spodnie, detal spódnicy, cena |
| 0.9.2 | 10.09 | Katalog HAGI: kamizelka jedwabna, dane firmy |
| 0.9.3 | 10.09 | HAGA: czas realizacji 7 dni, szycie na miarę do 14 |
| 0.9.4 | 10.09 | HAGA: regulamin i polityka opublikowane |
| 0.9.5 | 11.09 | HAGA: skład, dostawa InPost, tylko przelew, wysyłka za granicę na zapytanie |
| 0.9.6 | 15.09 | Integracja z Furgonetką: zamówienia do Furgonetki, numer przesyłki z powrotem |
| 0.9.7 | 16.09 | Katalog HAGI: płaszcz bawełniany, jedwabna bluzka |

### 0.10 Audyt: bezpieczeństwo, pieniądze, zgodność (24.09 do 25.09.2026)
Poprawki z audytu (PR #1): atomowe zamówienia, Omnibus, RODO, weryfikacja domen.

| Wersja | Data | Zmiana |
|---|---|---|
| 0.10.0 | 24.09 | Bezpieczeństwo: sanitizer, dane produktów cyfrowych, sklepy poza hostem platformy |
| 0.10.1 | 24.09 | Pieniądze i zgodność: atomowe zamówienia, Omnibus, wygasanie rabatów, feed Furgonetki |
| 0.10.2 | 24.09 | Panel: zapisy nie nadpisują danych sklepu, czyszczenie pól produktu |
| 0.10.3 | 24.09 | Anulowanie zamówień, double opt-in newslettera, RODO w analityce |
| 0.10.4 | 24.09 | Onboarding atomowy, weryfikacja własności domen, wykrywanie kolizji w bazie |
| 0.10.5 | 25.09 | Koszyk: pole na kod, kod z linku, promocje w koszyku, pomiar lejka |

### 0.11 Płatności online: Tpay (29.09.2026)
Sklep przyjmuje płatności online na własne konto merchanta.

| Wersja | Data | Zmiana | PR |
|---|---|---|---|
| 0.11.0 | 29.09 | Płatności online przez Tpay (własne konto merchanta) | #3 |
| 0.11.1 | 29.09 | Tpay: diagnostyka odmowy kluczy, OAuth jako form-data | #4 |
| 0.11.2 | 29.09 | Tpay: jawny User-Agent, rozpoznanie blokady Cloudflare | #5 |
| 0.11.3 | 29.09 | Tpay: poprawny adres produkcyjnego API | #6 |
| 0.11.4 | 29.09 | Automatyczne anulowanie nieopłaconych zamówień online po 48 h | #7 |
| 0.11.5 | 29.09 | Panel: pozycja menu „Płatności” | #8 |
| 0.11.6 | 29.09 | Plan Pro jako beta dla pierwszych sklepów, czytelniejsze menu | #9 |

### 0.12 Redesign panelu i plany (29.09 do 30.09.2026)
Cały panel na jednym systemie tokenów, prowadzona konfiguracja na Pulpicie, plany Starter i Pro.

| Wersja | Data | Zmiana | PR |
|---|---|---|---|
| 0.12.0 | 29.09 | Redesign, etap 1: menu, nagłówek, lista zamówień | #10 |
| 0.12.1 | 29.09 | Redesign, etap 2: Pulpit | #11 |
| 0.12.2 | 29.09 | Redesign, etap 3: szczegóły zamówienia | #12 |
| 0.12.3 | 29.09 | Redesign, etap 4: lista produktów | #13 |
| 0.12.4 | 29.09 | Redesign, etap 5: formularz produktu | #14 |
| 0.12.5 | 29.09 | Redesign 1/4: pozostałe ekrany na tokenach panelu | #15 |
| 0.12.6 | 29.09 | Redesign 2/4: tabele Klienci i Kategorie | #16 |
| 0.12.7 | 30.09 | Redesign 3/4: Analityka | #17 |
| 0.12.8 | 30.09 | Redesign 4/4: Ustawienia i ujednolicenie całości | #18 |
| 0.12.9 | 30.09 | Tokeny stanów (błąd, sukces), panel operacyjny w stylu panelu, teksty onboardingu | #19 |
| 0.12.10 | 30.09 | Prowadzona konfiguracja na Pulpicie, menu według zadań, wyszukiwarka | #20 |
| 0.12.11 | 30.09 | Menu: etykieta „Płatności” bez listy metod | #21 |
| 0.12.12 | 30.09 | Domena: ponowne podpięcie domeny już dodanej w Vercel | #22 |
| 0.12.13 | 30.09 | Plan Starter z oznaczeniem Beta i kartą programu beta | #23 |
| 0.12.14 | 30.09 | Ustawienia: plan właściciela sklepu zamiast plan oglądającego | #24 |
| 0.12.15 | 30.09 | Własna domena dostępna w planie Starter | #25 |

### 0.13 Handel przez agentów AI i operacje (od 30.09.2026)
Sklep czytelny dla ChatGPT, Gemini i Perplexity: dane strukturalne, feedy, reguły dla botów AI. Do tego panel operacyjny i reset hasła.

| Wersja | Data | Zmiana | PR |
|---|---|---|---|
| 0.13.0 | 30.09 | Agentic commerce, etap 1: dane strukturalne, feed Google, reguły dla botów AI, analityka botów | #26 |
| 0.13.1 | 30.09 | Agentic commerce, etap 2: atrybuty produktu, gotowość dla AI, linki do koszyka | #27 |
| 0.13.2 | 30.09 | Sklep na telefonie nigdy nie przewija się w poziomie | #28 |
| 0.13.3 | 30.09 | Panel operacyjny: zakładki Aktywne i Usunięte | #29 |
| 0.13.4 | 30.09 | Panel operacyjny: kolejka „wymaga uwagi”, stan systemu, przywracanie sklepów | #30 |
| 0.13.5 | 05.10 | Reset hasła z „Nie pamiętam hasła” | #31 |
| 0.13.6 | 05.10 | Lookbook HAGI: układ sześciu kadrów, siatka 3 kolumny | #32 |
| 0.13.7 | 06.10 | Feed produktowy dla ChatGPT (specyfikacja OpenAI) obok feedu Google | #33 |
| 0.13.8 | 06.10 | Numer wersji w panelu, ta roadmapa (historia od stycznia) | #34 |

## Co dalej (propozycja do decyzji)

Kolejność etapów do ustalenia. Poniżej to, co wynika z otwartych wątków w kodzie.

- **0.14 Kanały AI na automacie:** wysyłka feedu OpenAI przez SFTP bez ręcznego wgrywania, asystent AI w sklepie (dziś oznaczony „wkrótce”).
- **0.15 Samodzielny start sklepu:** onboarding bez naszej pomocy, płatne plany z rozliczeniem, koniec programu beta.
- **1.0.0 Publiczny start:** warunek z zasad numeracji, czyli samodzielne zakładanie sklepu i działające płatne plany.
