/**
 * Szablony dokumentów prawnych dla sklepu. Wstawiamy nazwę sklepu, resztę
 * merchant uzupełnia w miejscach [W NAWIASACH]. To szkic startowy, nie porada
 * prawna — sklep powinien zweryfikować treść we własnym zakresie.
 */

export function termsTemplate(shopName: string): string {
  return `REGULAMIN SKLEPU INTERNETOWEGO ${shopName.toUpperCase()}

§1 Postanowienia ogólne
1. Sklep internetowy ${shopName} prowadzony jest przez [NAZWA FIRMY], z siedzibą w [ADRES], NIP: [NIP], REGON: [REGON].
2. Kontakt ze sprzedawcą: e-mail [ADRES E-MAIL], telefon [NUMER TELEFONU].
3. Regulamin określa zasady składania zamówień, dostawy, płatności oraz reklamacji i zwrotów.

§2 Składanie zamówień
1. Zamówienia można składać przez stronę sklepu 24 godziny na dobę.
2. Złożenie zamówienia wymaga podania danych kontaktowych i adresu dostawy oraz akceptacji niniejszego regulaminu.
3. Po złożeniu zamówienia klient otrzymuje potwierdzenie na podany adres e-mail.
4. Umowa sprzedaży zostaje zawarta z chwilą potwierdzenia zamówienia przez sprzedawcę.

§3 Ceny i płatności
1. Wszystkie ceny podane w sklepie są cenami brutto (zawierają podatek VAT) i wyrażone są w złotych polskich.
2. Dostępne metody płatności: przelew tradycyjny, płatność za pobraniem.
3. W przypadku płatności przelewem zamówienie jest realizowane po zaksięgowaniu wpłaty.

§4 Dostawa
1. Dostawa realizowana jest na terenie Polski.
2. Koszty i dostępne metody dostawy są widoczne w koszyku przed złożeniem zamówienia.
3. Czas realizacji zamówienia wynosi [LICZBA] dni roboczych od zaksięgowania wpłaty lub złożenia zamówienia za pobraniem.

§5 Odstąpienie od umowy
1. Konsument ma prawo odstąpić od umowy w terminie 14 dni bez podania przyczyny.
2. Aby skorzystać z prawa odstąpienia, należy poinformować sprzedawcę drogą mailową na adres [ADRES E-MAIL].
3. Zwracany towar należy odesłać na adres: [ADRES DO ZWROTÓW] w terminie 14 dni od odstąpienia.
4. Zwrot płatności następuje w terminie 14 dni od otrzymania oświadczenia o odstąpieniu, z użyciem tej samej metody płatności.

§6 Reklamacje
1. Sprzedawca odpowiada za zgodność towaru z umową na zasadach określonych w przepisach prawa.
2. Reklamacje należy zgłaszać na adres [ADRES E-MAIL], podając numer zamówienia i opis wady.
3. Reklamacja zostanie rozpatrzona w terminie 14 dni od jej otrzymania.

§7 Dane osobowe
1. Administratorem danych osobowych jest [NAZWA FIRMY].
2. Szczegóły przetwarzania danych opisuje Polityka prywatności dostępna na stronie sklepu.

§8 Postanowienia końcowe
1. W sprawach nieuregulowanych regulaminem zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu cywilnego oraz ustawy o prawach konsumenta.
2. Regulamin obowiązuje od dnia [DATA].`;
}

export function privacyTemplate(shopName: string): string {
  return `POLITYKA PRYWATNOŚCI SKLEPU ${shopName.toUpperCase()}

1. Administrator danych
Administratorem danych osobowych jest [NAZWA FIRMY] z siedzibą w [ADRES], NIP: [NIP]. Kontakt: [ADRES E-MAIL].

2. Jakie dane przetwarzamy
Przetwarzamy dane podane przy składaniu zamówienia: imię i nazwisko, adres e-mail, numer telefonu, adres dostawy, a także historię zamówień.

3. Cele i podstawy przetwarzania
- realizacja zamówienia i umowy sprzedaży (art. 6 ust. 1 lit. b RODO),
- obsługa reklamacji i zwrotów (art. 6 ust. 1 lit. c RODO),
- dochodzenie lub obrona roszczeń (art. 6 ust. 1 lit. f RODO),
- wysyłka informacji handlowych — wyłącznie za zgodą (art. 6 ust. 1 lit. a RODO).

4. Odbiorcy danych
Dane mogą być przekazywane podmiotom wspierającym realizację zamówień: firmom kurierskim, operatorom płatności, dostawcom usług IT (hosting, poczta e-mail). Sklep działa na platformie Sellflow.

5. Okres przechowywania
Dane przechowujemy przez okres niezbędny do realizacji zamówienia, a następnie przez okres wymagany przepisami (m.in. podatkowymi) lub do czasu przedawnienia roszczeń.

6. Twoje prawa
Masz prawo do: dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych, sprzeciwu oraz cofnięcia zgody w dowolnym momencie. Masz też prawo wnieść skargę do Prezesa UODO.

7. Pliki cookies
Sklep używa plików cookies niezbędnych do działania koszyka i utrzymania sesji. Korzystanie ze strony oznacza zgodę na ich zapisywanie w pamięci urządzenia.

8. Kontakt
W sprawach dotyczących danych osobowych napisz na adres: [ADRES E-MAIL].

Polityka obowiązuje od dnia [DATA].`;
}
