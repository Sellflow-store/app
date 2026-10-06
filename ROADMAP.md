# Sellflow: wersje i roadmapa

Aktualna wersja: **0.9.8**. Widać ją w panelu sklepu, na dole menu bocznego. Najedź na numer, żeby zobaczyć commit wdrożenia.

## Zasady numeracji

Format `0.ETAP.ZMIANA`.

- **ETAP** (druga liczba) rośnie, gdy produkt dostaje nowy obszar możliwości: płatności online, redesign panelu, handel przez agentów AI. Etap ma nazwę i jednozdaniowy cel.
- **ZMIANA** (trzecia liczba) rośnie z każdym zmergowanym PR do `main`, w tym poprawki. Nowy etap zaczyna od `.0`.
- **1.0.0** to publiczny start: sklep zakłada się sam, bez naszej pomocy, a płatne plany działają. Do tego czasu zostajemy na `0.x`. Po 0.9 przychodzi 0.10, a nie 1.0.
- Numer bumpuje się w tym samym PR co zmiana: `npm version 0.X.Y --no-git-tag-version` i dopisanie wiersza w tym pliku.

Wersje 0.1.0 do 0.9.7 nadane wstecz. Każdy commit na `main` (bez commitów merge) dostał jeden numer, w kolejności dat.

## Historia

### 0.1 Fundament zamówień (26.08.2026)
Klient wybiera paczkomat, płaci przelewem bez przepisywania danych i śledzi przesyłkę.

| Wersja | Data | Zmiana |
|---|---|---|
| 0.1.0 | 26.08 | Wybór paczkomatu w koszyku: własna mapa na publicznym API InPostu |
| 0.1.1 | 26.08 | Śledzenie przesyłki: numer w panelu, link w mailu do klienta |
| 0.1.2 | 26.08 | Przelew bez przepisywania: kod QR, suma kontrolna NRB, dane firmy z NIP-u |

### 0.2 Wygląd sklepu (03.09.2026)
Storefront na poziomie marek modowych: rozmiary, galeria, trzy układy hero, branding premium.

| Wersja | Data | Zmiana |
|---|---|---|
| 0.2.0 | 03.09 | Wybór rozmiaru: pozycja koszyka to produkt + rozmiar, walidacja po stronie serwera |
| 0.2.1 | 03.09 | Galeria produktu: zdjęcie wiodące na całą kolumnę, packshoty w siatce, lightbox |
| 0.2.2 | 03.09 | Sekcje strony głównej: bez fałszywego dowodu społecznego, tryb redakcyjny |
| 0.2.3 | 03.09 | Hero w trzech układach do wyboru w panelu: split, fullbleed, editorial |
| 0.2.4 | 03.09 | Edytor strony głównej: poprawka lint w podpowiedzi układu hero |
| 0.2.5 | 03.09 | Gwarancja jako pasek zaufania nad stopką, ikony dobierane po znaczeniu |
| 0.2.6 | 03.09 | Branding premium: jednolite tło, waga nagłówków, minimalne karty, podpis pod logo |
| 0.2.7 | 03.09 | Sekcja korzyści: strona główna, O nas, obie albo ukryta |
| 0.2.8 | 03.09 | Stopka: logotyp zamiast nazwy tekstem, gdy sklep ma logo |
| 0.2.9 | 03.09 | Stopka: podpis platformy „Zbudowane w Polsce” z linkiem do landingu |
| 0.2.10 | 03.09 | Stopka: podpis platformy z logo Sellflow |
| 0.2.11 | 03.09 | Otwarcie jak w domach mody: hero „sam kadr”, menu na zdjęciu, lookbook |
| 0.2.12 | 03.09 | Hero „cover”: niższy wariant wysokości dla kadrów poziomych |

### 0.3 Dokumenty prawne i lookbook (07.09.2026)
Regulamin i polityki generowane z jednego zestawu danych. Lookbook z kadrami filmowymi.

| Wersja | Data | Zmiana |
|---|---|---|
| 0.3.0 | 07.09 | Dokumenty prawne składane z jednego zestawu danych |
| 0.3.1 | 07.09 | Kreator zapisuje logo w Vercel Blob zamiast base64 w bazie |
| 0.3.2 | 07.09 | Lookbook: kadry filmowe i układ dwukolumnowy z przesunięciem |
| 0.3.3 | 07.09 | Lookbook: pas kadrów płynący w lewo |
| 0.3.4 | 07.09 | Lookbook: siatka po cztery kadry w rzędzie |
| 0.3.5 | 07.09 | Lookbook: kadry filmowe w zwolnionym tempie, z regulacją w panelu |
| 0.3.6 | 07.09 | Lookbook: płynne zapętlenie filmu |

### 0.4 Katalog, SEO i kontakt (09.09.2026)
Produkty na zamówienie, adresy i dane strukturalne pod Google, formularz kontaktowy w każdym sklepie.

| Wersja | Data | Zmiana |
|---|---|---|
| 0.4.0 | 09.09 | Produkty bez ceny: tryb „cena na zapytanie” |
| 0.4.1 | 09.09 | Produkty bez ceny: etykieta „Produkt na zamówienie” |
| 0.4.2 | 09.09 | SEO: adresy produktów z nazwy, mapa witryny, dane strukturalne |
| 0.4.3 | 09.09 | Nawigacja pokazuje bieżącą stronę i reakcję na kliknięcie |
| 0.4.4 | 09.09 | Podpis Sellflow w wektorze, powrót na górę przy zmianie strony |
| 0.4.5 | 09.09 | Formularz kontaktowy na stronie kontaktu każdego sklepu |
| 0.4.6 | 09.09 | Formularz kontaktowy: przy nieudanej wysyłce podaje adres zapasowy |
| 0.4.7 | 09.09 | Skrypt sprawdzający tor awaryjny formularza kontaktowego |

### 0.5 Pierwszy sklep produkcyjny: HAGA (10.09 do 16.09.2026)
Wdrożenie HAGI na żywo i własna integracja z Furgonetką.

| Wersja | Data | Zmiana |
|---|---|---|
| 0.5.0 | 10.09 | Katalog HAGI: biała spódnica midi z żakardu |
| 0.5.1 | 10.09 | Katalog HAGI: jedwabne spodnie, detal spódnicy, cena |
| 0.5.2 | 10.09 | Katalog HAGI: kamizelka jedwabna, dane firmy |
| 0.5.3 | 10.09 | HAGA: czas realizacji 7 dni, szycie na miarę do 14 |
| 0.5.4 | 10.09 | HAGA: regulamin i polityka opublikowane |
| 0.5.5 | 11.09 | HAGA: skład, dostawa InPost, tylko przelew, wysyłka za granicę na zapytanie |
| 0.5.6 | 15.09 | Integracja z Furgonetką: zamówienia do Furgonetki, numer przesyłki z powrotem |
| 0.5.7 | 16.09 | Katalog HAGI: płaszcz bawełniany, jedwabna bluzka |

### 0.6 Audyt: bezpieczeństwo, pieniądze, zgodność (24.09 do 25.09.2026)
Poprawki z audytu (PR #1): atomowe zamówienia, Omnibus, RODO, weryfikacja domen.

| Wersja | Data | Zmiana |
|---|---|---|
| 0.6.0 | 24.09 | Bezpieczeństwo: sanitizer, dane produktów cyfrowych, sklepy poza hostem platformy |
| 0.6.1 | 24.09 | Pieniądze i zgodność: atomowe zamówienia, Omnibus, wygasanie rabatów, feed Furgonetki |
| 0.6.2 | 24.09 | Panel: zapisy nie nadpisują danych sklepu, czyszczenie pól produktu |
| 0.6.3 | 24.09 | Anulowanie zamówień, double opt-in newslettera, RODO w analityce |
| 0.6.4 | 24.09 | Onboarding atomowy, weryfikacja własności domen, wykrywanie kolizji w bazie |
| 0.6.5 | 25.09 | Koszyk: pole na kod, kod z linku, promocje w koszyku, pomiar lejka |

### 0.7 Płatności online: Tpay (29.09.2026)
Sklep przyjmuje płatności online na własne konto merchanta.

| Wersja | Data | Zmiana | PR |
|---|---|---|---|
| 0.7.0 | 29.09 | Płatności online przez Tpay (własne konto merchanta) | #3 |
| 0.7.1 | 29.09 | Tpay: diagnostyka odmowy kluczy, OAuth jako form-data | #4 |
| 0.7.2 | 29.09 | Tpay: jawny User-Agent, rozpoznanie blokady Cloudflare | #5 |
| 0.7.3 | 29.09 | Tpay: poprawny adres produkcyjnego API | #6 |
| 0.7.4 | 29.09 | Automatyczne anulowanie nieopłaconych zamówień online po 48 h | #7 |
| 0.7.5 | 29.09 | Panel: pozycja menu „Płatności” | #8 |
| 0.7.6 | 29.09 | Plan Pro jako beta dla pierwszych sklepów, czytelniejsze menu | #9 |

### 0.8 Redesign panelu i plany (29.09 do 30.09.2026)
Cały panel na jednym systemie tokenów, prowadzona konfiguracja na Pulpicie, plany Starter i Pro.

| Wersja | Data | Zmiana | PR |
|---|---|---|---|
| 0.8.0 | 29.09 | Redesign, etap 1: menu, nagłówek, lista zamówień | #10 |
| 0.8.1 | 29.09 | Redesign, etap 2: Pulpit | #11 |
| 0.8.2 | 29.09 | Redesign, etap 3: szczegóły zamówienia | #12 |
| 0.8.3 | 29.09 | Redesign, etap 4: lista produktów | #13 |
| 0.8.4 | 29.09 | Redesign, etap 5: formularz produktu | #14 |
| 0.8.5 | 29.09 | Redesign 1/4: pozostałe ekrany na tokenach panelu | #15 |
| 0.8.6 | 29.09 | Redesign 2/4: tabele Klienci i Kategorie | #16 |
| 0.8.7 | 30.09 | Redesign 3/4: Analityka | #17 |
| 0.8.8 | 30.09 | Redesign 4/4: Ustawienia i ujednolicenie całości | #18 |
| 0.8.9 | 30.09 | Tokeny stanów (błąd, sukces), panel operacyjny w stylu panelu, teksty onboardingu | #19 |
| 0.8.10 | 30.09 | Prowadzona konfiguracja na Pulpicie, menu według zadań, wyszukiwarka | #20 |
| 0.8.11 | 30.09 | Menu: etykieta „Płatności” bez listy metod | #21 |
| 0.8.12 | 30.09 | Domena: ponowne podpięcie domeny już dodanej w Vercel | #22 |
| 0.8.13 | 30.09 | Plan Starter z oznaczeniem Beta i kartą programu beta | #23 |
| 0.8.14 | 30.09 | Ustawienia: plan właściciela sklepu zamiast plan oglądającego | #24 |
| 0.8.15 | 30.09 | Własna domena dostępna w planie Starter | #25 |

### 0.9 Handel przez agentów AI i operacje (30.09.2026 do dziś)
Sklep czytelny dla ChatGPT, Gemini i Perplexity: dane strukturalne, feedy, reguły dla botów AI. Do tego panel operacyjny i reset hasła.

| Wersja | Data | Zmiana | PR |
|---|---|---|---|
| 0.9.0 | 30.09 | Agentic commerce, etap 1: dane strukturalne, feed Google, reguły dla botów AI, analityka botów | #26 |
| 0.9.1 | 30.09 | Agentic commerce, etap 2: atrybuty produktu, gotowość dla AI, linki do koszyka | #27 |
| 0.9.2 | 30.09 | Sklep na telefonie nigdy nie przewija się w poziomie | #28 |
| 0.9.3 | 30.09 | Panel operacyjny: zakładki Aktywne i Usunięte | #29 |
| 0.9.4 | 30.09 | Panel operacyjny: kolejka „wymaga uwagi”, stan systemu, przywracanie sklepów | #30 |
| 0.9.5 | 05.10 | Reset hasła z „Nie pamiętam hasła” | #31 |
| 0.9.6 | 05.10 | Lookbook HAGI: układ sześciu kadrów, siatka 3 kolumny | #32 |
| 0.9.7 | 06.10 | Feed produktowy dla ChatGPT (specyfikacja OpenAI) obok feedu Google | #33 |
| 0.9.8 | 06.10 | Numer wersji w panelu, ta roadmapa | |

## Co dalej (propozycja do decyzji)

Kolejność etapów do ustalenia. Poniżej to, co wynika z otwartych wątków w kodzie.

- **0.10 Kanały AI na automacie:** wysyłka feedu OpenAI przez SFTP bez ręcznego wgrywania, asystent AI w sklepie (dziś oznaczony „wkrótce”).
- **0.11 Samodzielny start sklepu:** onboarding bez naszej pomocy, płatne plany z rozliczeniem, koniec programu beta.
- **1.0.0 Publiczny start:** warunek z zasad numeracji, czyli samodzielne zakładanie sklepu i działające płatne plany.
