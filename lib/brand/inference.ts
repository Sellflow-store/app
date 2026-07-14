import type { Brand, Business, Inferred } from './types'
import { getStylePreset } from './presets'

/**
 * Local heuristic "AI" — deterministic, no network. Acceptance criteria
 * say sensible defaults for skipped Step-1 fields and ≤1s preview refresh,
 * which a synchronous function naturally satisfies. Swap with a real
 * Claude call later by replacing the bodies of suggestNames + inferBrand.
 */

export type Category =
  | 'candles'
  | 'home_decor'
  | 'jewelry'
  | 'apparel'
  | 'beauty'
  | 'coffee'
  | 'food'
  | 'art'
  | 'digital'
  | 'plants'
  | 'accessories'
  | 'kids'
  | 'pets'
  | 'lifestyle'

const KEYWORDS: Array<[Category, string[]]> = [
  ['candles',   ['candle', 'świec', 'wax', 'wick', 'fragran']],
  ['home_decor',['decor', 'ceramic', 'pottery', 'vase', 'mug', 'plate', 'lamp', 'dom', 'wnętrz']],
  ['jewelry',   ['jewel', 'ring', 'necklace', 'earring', 'bracelet', 'biżut', 'pierścion']],
  ['apparel',   ['shirt', 'dress', 'hoodie', 'clothing', 'tee', 'pant', 'odzież', 'ubr', 'koszul']],
  ['beauty',    ['skin', 'cream', 'serum', 'beauty', 'cosmetic', 'kosmety', 'mydł', 'soap']],
  ['coffee',    ['coffee', 'tea', 'espresso', 'kawa', 'herbat']],
  ['food',      ['food', 'snack', 'chocolate', 'candy', 'jedzen', 'czekolad']],
  ['art',       ['print', 'poster', 'art', 'painting', 'plakat', 'obraz']],
  ['digital',   ['ebook', 'course', 'template', 'kurs', 'pdf', 'cyfrowy', 'preset']],
  ['plants',    ['plant', 'flower', 'seed', 'roślin', 'kwiat']],
  ['accessories',['bag', 'wallet', 'leather', 'torb', 'plecak']],
  ['kids',      ['toy', 'plush', 'kids', 'zabaw', 'dziec']],
  ['pets',      ['pet', 'dog', 'cat', 'pies', 'kot']],
]

export function inferCategory(sells: string): Category {
  const s = (sells || '').toLowerCase()
  if (!s) return 'lifestyle'
  for (const [cat, words] of KEYWORDS) {
    if (words.some((w) => s.includes(w))) return cat
  }
  return 'lifestyle'
}

/* ── Name suggestions ────────────────────────────────────────────────────── */

type NameKit = { roots: string[]; suffixes: string[]; modifiers: string[] }

const NAME_KITS: Record<Category, NameKit> = {
  candles: {
    roots: ['Ember', 'Wick', 'Hearth', 'Vela', 'Mottle', 'Slowburn', 'Northwax', 'Quiet Wax', 'Common Wick', 'Steady Glow'],
    suffixes: ['& Oak', 'House', 'Lab', 'Co.', 'Studio', 'Atelier'],
    modifiers: ['Soft', 'Slow', 'Quiet', 'Warm', 'Calm'],
  },
  home_decor: {
    roots: ['Hearth', 'Habit', 'Linen', 'Mantle', 'Form', 'Common', 'Sable', 'Folio', 'Field'],
    suffixes: ['Studio', 'House', 'Goods', '& Co.', 'Atelier'],
    modifiers: ['Soft', 'Slow', 'Plain', 'Quiet', 'Daily'],
  },
  jewelry: {
    roots: ['Lune', 'Orbit', 'Field', 'Aster', 'Brass', 'Halo', 'Quartz', 'Linea', 'Mira'],
    suffixes: ['Studio', '& Co.', 'Atelier', 'House'],
    modifiers: ['Small', 'Slow', 'Modern', 'Quiet', 'Warm'],
  },
  apparel: {
    roots: ['Stem', 'Common Thread', 'Fold', 'Cloth', 'Knot', 'Hemline', 'Even', 'Plain', 'Warp'],
    suffixes: ['Co.', 'Studio', 'Goods', 'Supply'],
    modifiers: ['Slow', 'Made', 'Daily', 'Quiet'],
  },
  beauty: {
    roots: ['Hush', 'Glow', 'Plain', 'Field', 'Soak', 'Rinse', 'Whim', 'Bloom', 'Dew'],
    suffixes: ['Lab', 'Studio', '& Co.', 'House'],
    modifiers: ['Calm', 'Soft', 'Bare', 'Quiet', 'Daily'],
  },
  coffee: {
    roots: ['Common Roast', 'North Brew', 'Pour', 'Steady', 'Field', 'Wake', 'Slow Pour', 'Hearth'],
    suffixes: ['Roasters', 'Coffee', 'Co.', 'House'],
    modifiers: ['Slow', 'Daily', 'Quiet', 'Warm'],
  },
  food: {
    roots: ['Field', 'Common Table', 'Pantry', 'Stem', 'Salt', 'Honey', 'Cure', 'Brine'],
    suffixes: ['Kitchen', 'Goods', '& Co.', 'House'],
    modifiers: ['Small', 'Slow', 'Plain', 'Daily'],
  },
  art: {
    roots: ['Plate', 'Folio', 'Print House', 'Edition', 'Margin', 'Frame', 'Studio Mono'],
    suffixes: ['Editions', 'Studio', 'Press', '& Co.'],
    modifiers: ['Quiet', 'Small', 'Slow', 'Modern'],
  },
  digital: {
    roots: ['Foundry', 'Atlas', 'Module', 'Common Kit', 'Field Notes', 'Signal', 'Stack', 'North'],
    suffixes: ['Lab', 'Studio', 'Co.', 'Press'],
    modifiers: ['Plain', 'Modern', 'Daily', 'Quiet'],
  },
  plants: {
    roots: ['Stem', 'Sprout', 'Field', 'Bloom', 'Bough', 'Leaf House', 'Mossroom'],
    suffixes: ['Studio', '& Co.', 'House', 'Goods'],
    modifiers: ['Small', 'Slow', 'Plain', 'Quiet'],
  },
  accessories: {
    roots: ['Carry', 'Fold', 'Sable', 'Brass', 'Knot', 'Common Carry', 'Even'],
    suffixes: ['Studio', 'Goods', 'Supply', '& Co.'],
    modifiers: ['Daily', 'Quiet', 'Plain'],
  },
  kids: {
    roots: ['Loop', 'Plush', 'Field', 'Tumble', 'Soft Days', 'Common'],
    suffixes: ['& Co.', 'House', 'Studio', 'Goods'],
    modifiers: ['Soft', 'Daily', 'Small'],
  },
  pets: {
    roots: ['Pawline', 'Field', 'Common Dog', 'Tumble', 'Leash House'],
    suffixes: ['Co.', 'House', 'Goods', 'Studio'],
    modifiers: ['Daily', 'Soft', 'Quiet'],
  },
  lifestyle: {
    roots: ['Common', 'Field', 'North', 'Habit', 'Folio', 'Mantle', 'Even', 'Plain'],
    suffixes: ['& Co.', 'Studio', 'Goods', 'House'],
    modifiers: ['Slow', 'Daily', 'Quiet', 'Soft'],
  },
}

/** Always returns exactly 10 unique names. Deterministic for the same input. */
export function suggestNames(sells: string): string[] {
  const cat = inferCategory(sells)
  const kit = NAME_KITS[cat]
  const seen = new Set<string>()
  const out: string[] = []

  // Pass 1: raw roots (these are already brand-ready phrases).
  for (const r of kit.roots) {
    if (out.length >= 10) break
    if (!seen.has(r)) { seen.add(r); out.push(r) }
  }
  // Pass 2: root + suffix combos.
  for (const r of kit.roots) {
    for (const s of kit.suffixes) {
      if (out.length >= 10) break
      const name = `${r} ${s}`
      if (!seen.has(name)) { seen.add(name); out.push(name) }
    }
    if (out.length >= 10) break
  }
  // Pass 3: modifier + root.
  for (const m of kit.modifiers) {
    for (const r of kit.roots) {
      if (out.length >= 10) break
      const name = `${m} ${r}`
      if (!seen.has(name)) { seen.add(name); out.push(name) }
    }
    if (out.length >= 10) break
  }
  return out.slice(0, 10)
}

/* ── Audience ────────────────────────────────────────────────────────────── */

const AUDIENCE: Record<Category, string> = {
  candles:    'Kupujący prezenty i ceniące estetykę domu kobiety 25–45, budżet średni–premium',
  home_decor: 'Osoby z gustem urządzające mieszkanie 28–50, budżet średni–premium',
  jewelry:    'Kupujący dla siebie i na prezent 22–45, budżet średni–premium',
  apparel:    'Świadomi stylu dorośli 22–40, budżet średni',
  beauty:     'Kobiety ciekawe pielęgnacji 25–45, budżet premium',
  coffee:     'Domowi baryści i kupujący prezenty 28–55, budżet średni–premium',
  food:       'Smakosze i kupujący prezenty 28–55, budżet średni',
  art:        'Wynajmujący i pierwsi właściciele mieszkań 25–45, budżet średni',
  digital:    'Operatorzy i twórcy 25–45, kupujący szablony i narzędzia',
  plants:     'Miejscy rodzice roślin 25–40, budżet średni',
  accessories:'Profesjonaliści ceniący codzienne akcesoria 25–45, budżet średni–premium',
  kids:       'Rodzice 28–42 kupujący dla dzieci i na prezent',
  pets:       'Właściciele zwierząt 25–50, budżet średni',
  lifestyle:  'Wymagający dorośli 25–45, ceniący spokojne, dobrze zrobione rzeczy',
}

/* ── Hero copy ───────────────────────────────────────────────────────────── */

type CopyTpl = { headlines: string[]; subs: string[] }

const COPY: Record<Category, CopyTpl> = {
  candles: {
    headlines: [
      'Ręcznie lane. Wolno palone. Na ważne chwile.',
      'Spokojne światło, tworzone partia po partii.',
      'Świece na tę część dnia, która się liczy.',
    ],
    subs: [
      'Spokojne, czysto palące się świece dla tych, którzy czują różnicę.',
      'Wosk z małych partii, przemyślane zapachy, zrobione na lata.',
      'Robione ręcznie. Po to, by Cię zwolnić.',
    ],
  },
  home_decor: {
    headlines: ['Przedmioty, z którymi żyjesz, nie obok których.', 'Do pokoi, których naprawdę używasz.'],
    subs: ['Dobra do domu z małych partii dla tych, którzy czują materiały.', 'Zrobione, by dotykać ich codziennie.'],
  },
  jewelry: {
    headlines: ['Małe rzeczy noszone latami.', 'Spokojne formy. Na dekady.'],
    subs: ['Ręcznie wykańczana biżuteria na co dzień.', 'Tworzona w małych partiach. Na lata.'],
  },
  apparel: {
    headlines: ['Zrobione prosto. Noszone codziennie.', 'Mniej rzeczy. Lepiej zrobionych.'],
    subs: ['Ubrania do szafy, po którą naprawdę sięgasz.', 'Z uczciwych tkanin, zrobione do noszenia.'],
  },
  beauty: {
    headlines: ['Pielęgnacja bez hałasu.', 'Spokojne formuły na codzienną skórę.'],
    subs: ['Ze składników, które przeczytasz na głos.', 'Uczciwe formuły. Spokojny rytuał.'],
  },
  coffee: {
    headlines: ['Wolno palona, w małych partiach.', 'Kawa na tę część poranka, która się liczy.'],
    subs: ['Ziarna z jednego źródła, palone na zamówienie.', 'Dla tych, którzy czują filiżankę.'],
  },
  food: {
    headlines: ['Uczciwe jedzenie, robione w małej skali.', 'W partiach, które czuć w smaku.'],
    subs: ['Prawdziwe składniki z prawdziwych kuchni.', 'Wolne przepisy. Krótkie listy składników.'],
  },
  art: {
    headlines: ['Grafiki na puste ściany.', 'Edycje, z którymi naprawdę żyjesz.'],
    subs: ['Limitowane druki z działającej pracowni.', 'Przemyślana praca w dostępnej cenie.'],
  },
  digital: {
    headlines: ['Narzędzia, które oszczędzą Ci wtorek.', 'Zestaw, nie wykład.'],
    subs: ['Szablony i presety z prawdziwej pracy.', 'Zetnij nudną robotę. Zostaw formę.'],
  },
  plants: {
    headlines: ['Żywe rzeczy, wysyłane delikatnie.', 'Rośliny do pokoi, w których spędzasz czas.'],
    subs: ['Hodowane z troską, pakowane z troską, wysyłane spokojnie.', 'Dla tych, którzy utrzymują rzeczy przy życiu.'],
  },
  accessories: {
    headlines: ['Codzienne akcesoria na lata.', 'Rzeczy, które pakujesz pierwsze.'],
    subs: ['Spokojne akcesoria na dni pracy.', 'Zrobione, by przetrwać niejeden sezon.'],
  },
  kids: {
    headlines: ['Rzeczy, które dzieci naprawdę zatrzymują.', 'Zrobione na całe dzieciństwo.'],
    subs: ['Miękkie, trwałe, przemyślane. Do zabawy.', 'Zaprojektowane na lata, nie tygodnie.'],
  },
  pets: {
    headlines: ['Dla psa, który naprawdę chodzi na spacery.', 'Uczciwy sprzęt na co dzień.'],
    subs: ['Wytrzymałe, miękkie, do prania.', 'Zrobione wokół tego, jak naprawdę żyją zwierzęta.'],
  },
  lifestyle: {
    headlines: ['Robione w małej skali. Z rozmysłem.', 'Spokojne rzeczy, dobrze zrobione.'],
    subs: ['Mały sklep z przemyślanymi rzeczami.', 'Dla tych, którzy zauważają.'],
  },
}

function pickByTone(tone: string[], options: string[]): string {
  const seed = tone.join('|').length
  return options[seed % options.length] ?? options[0]
}

/* ── Default fill for skipped Step-1 fields ──────────────────────────────── */

function defaultProblem(category: Category): string {
  switch (category) {
    case 'candles':    return 'Ludzie chcą, by ich dom był spokojny, ale większość świec pachnie sztucznie.'
    case 'home_decor': return 'Większość dóbr do domu jest albo jednorazowa, albo zbyt cenna, by ich używać.'
    case 'jewelry':    return 'Biżuteria jest albo szybką modą, albo nieosiągalnie droga — nic pomiędzy.'
    case 'apparel':    return 'Szafy są pełne, ale nic nie pasuje do tego, jak naprawdę żyje kupujący.'
    case 'beauty':     return 'Półki z kosmetykami są głośne, skomplikowane i pełne składników, których nikt nie czyta.'
    case 'coffee':     return 'Większość kawy w domu smakuje jak kawa w pracy.'
    case 'food':       return 'Uczciwe jedzenie trudno znaleźć bez jazdy na targ.'
    case 'art':        return 'Puste ściany zostają puste, bo prawdziwa sztuka wydaje się poza zasięgiem.'
    case 'digital':    return 'Operatorzy tracą godziny, budując te same szablony od zera.'
    case 'plants':     return 'Rośliny docierają zestresowane, źle znoszą wysyłkę i giną w pierwszym miesiącu.'
    case 'accessories':return 'Codzienne akcesoria szybko się psują albo wyglądają przestarzale po roku.'
    case 'kids':       return 'Większość rzeczy dla dzieci jest głośna, plastikowa i zrobiona na jeden sezon.'
    case 'pets':       return 'Akcesoria dla zwierząt są albo brzydko użytkowe, albo drogo designerskie.'
    default:           return 'Ludzie chcą lepiej zrobionych codziennych rzeczy i nie wiedzą, gdzie ich szukać.'
  }
}

function defaultEdge(category: Category, traits: string[]): string {
  const trait = traits[0]?.toLowerCase() ?? 'przemyślane'
  const base: Record<Category, string> = {
    candles:    'Ręcznie lane w małych partiach z naturalnego wosku i przemyślanych zapachów.',
    home_decor: 'Robione w małych seriach przez twórców, których naprawdę znamy.',
    jewelry:    'Ręcznie wykańczane. Metale z recyklingu. Prawdziwe gwarancje.',
    apparel:    'Szyte w małych seriach. Naturalne włókna. Uczciwa konstrukcja.',
    beauty:     'Krótkie listy składników. Niezależnie testowane. Bez wypełniaczy.',
    coffee:     'Z jednego źródła, palone na zamówienie, wysyłane w 48h.',
    food:       'Robione przez ludzi, do których możesz zadzwonić. Krótkie listy. Uczciwe ceny.',
    art:        'Limitowane edycje, sygnowane i numerowane przez artystę.',
    digital:    'Zbudowane z prawdziwych roboczych plików, nie gotowców.',
    plants:     'Hodowane u nas. Pakowane spokojnie. Wysyłane ciepłe.',
    accessories:'Cięte z pełnoziarnistej skóry. Szyte tak, by dało się je naprawić.',
    kids:       'Testowane przez dzieci. Szyte, by je przetrwać.',
    pets:       'Do prania, do naprawy, w dobrym rozmiarze.',
    lifestyle:  'Mała oferta. Dobrze zrobiona. Bez wypełniaczy.',
  }
  return `${base[category]} W jednym słowie: ${trait}.`
}

/* ── Product catalog ─────────────────────────────────────────────────────── */

export type InferredProduct = {
  name: string
  price: string
  originalPrice?: string
  description: string
  badge?: 'sale' | 'new' | 'bestseller'
  collections: string[]
}

const PRODUCT_TEMPLATES: Record<Category, InferredProduct[]> = {
  candles: [
    { name: 'Sojowa · Cedar',     price: '89',  description: 'Cedr + wetiwer. Spokojny dym wieczoru.',           badge: 'bestseller', collections: ['new-arrivals', 'best-sellers'] },
    { name: 'Sojowa · Linen',     price: '89',  description: 'Świeże prześcieradło rano, lekka biel.',           badge: 'new',        collections: ['new-arrivals'] },
    { name: 'Sojowa · Smoke',     price: '109', description: 'Drewno opałowe, dłuższy spalanie.',                                     collections: ['new-arrivals', 'best-sellers'] },
    { name: 'Sojowa · Field',     price: '99',  description: 'Łąka po deszczu, zielony chłód.',                                       collections: ['new-arrivals'] },
    { name: 'Świecznik · Brass',  price: '149', originalPrice: '189', description: 'Mosiądz polerowany ręcznie.',  badge: 'sale',     collections: ['best-sellers'] },
    { name: 'Zapałki · Long',     price: '29',  description: '12cm zapałki w szklanej fiolce.',                                       collections: ['best-sellers'] },
    { name: 'Wax Melt · Trio',    price: '69',  description: 'Trzy zapachy do podgrzewacza.',                     badge: 'new',        collections: ['new-arrivals'] },
  ],
  home_decor: [
    { name: 'Misa ceramiczna',    price: '129', description: 'Ręcznie toczona, glazura matowa.',                  badge: 'bestseller', collections: ['new-arrivals', 'best-sellers'] },
    { name: 'Wazon · Low',        price: '149', description: 'Niski, szeroka szyjka. Beton barwiony.',                                collections: ['new-arrivals'] },
    { name: 'Świecznik · Brass',  price: '169', description: 'Mosiądz polerowany.',                                                   collections: ['best-sellers'] },
    { name: 'Taca · Oak',         price: '199', originalPrice: '249', description: 'Dąb olejowany, brzegi cięte ręcznie.', badge: 'sale', collections: ['new-arrivals', 'best-sellers'] },
    { name: 'Ramka · Linen',      price: '79',  description: 'Lniana passe-partout, format A4.',                                      collections: ['best-sellers'] },
    { name: 'Doniczka · Stone',   price: '109', description: 'Kamień rzeźbiony, do średnich roślin.',                                 collections: ['new-arrivals'] },
  ],
  jewelry: [
    { name: 'Lune Ring',          price: '249', description: 'Srebro recykling, wykończenie matowe.',             badge: 'bestseller', collections: ['new-arrivals', 'best-sellers'] },
    { name: 'Aster Studs',        price: '189', description: 'Małe, codzienne. Para.',                                                collections: ['new-arrivals'] },
    { name: 'Halo Chain',         price: '329', description: 'Łańcuszek 45cm, zapięcie magnetyczne.',                                 collections: ['best-sellers'] },
    { name: 'Mira Bracelet',      price: '219', description: 'Cienka linka srebra, regulowana.',                  badge: 'new',        collections: ['new-arrivals'] },
    { name: 'Orbit Hoops',        price: '199', description: 'Klasyczne kółka, średnica 18mm.',                                       collections: ['best-sellers'] },
    { name: 'Linea Pendant',      price: '279', originalPrice: '349', description: 'Cienki wisior, łańcuszek 50cm.', badge: 'sale',   collections: ['best-sellers'] },
  ],
  apparel: [
    { name: 'Linen Tee',          price: '199', description: 'Cienki len, ciemna kostka.',                        badge: 'bestseller', collections: ['new-arrivals', 'best-sellers'] },
    { name: 'Workwear Pant',      price: '349', description: 'Bawełna 12oz, prosta nogawka.',                                         collections: ['new-arrivals'] },
    { name: 'Light Overshirt',    price: '399', originalPrice: '479', description: 'Płócienna, dwie kieszenie.',  badge: 'sale',     collections: ['best-sellers'] },
    { name: 'Daily Sweat',        price: '299', description: 'Petla francuska, surowe brzegi.',                                       collections: ['new-arrivals', 'best-sellers'] },
    { name: 'Plain Sock',         price: '49',  description: 'Czesana bawełna, długość middle.',                                      collections: ['best-sellers'] },
    { name: 'Heavy Tee',          price: '249', description: '240gsm, szerszy krój.',                            badge: 'new',        collections: ['new-arrivals'] },
  ],
  beauty: [
    { name: 'Calm Serum',         price: '189', description: 'Niacynamid + cynk, rano i wieczorem.',              badge: 'bestseller', collections: ['new-arrivals', 'best-sellers'] },
    { name: 'Daily Cream',        price: '149', description: 'Lekka emulsja, bez zapachu.',                                           collections: ['best-sellers'] },
    { name: 'Quiet Bar',          price: '49',  description: 'Mydło na bazie oliwy, ręcznie krojone.',                                collections: ['new-arrivals'] },
    { name: 'Night Oil',          price: '199', description: 'Olej z dzikiej róży, 30ml.',                       badge: 'new',        collections: ['new-arrivals'] },
    { name: 'Soft Mist',          price: '99',  description: 'Tonik kwiatowy, 100ml.',                                                collections: ['best-sellers'] },
    { name: 'Hand Balm',          price: '79',  originalPrice: '99', description: 'Masło shea + nagietek.',      badge: 'sale',     collections: ['new-arrivals'] },
  ],
  coffee: [
    { name: 'Single Origin · Kolumbia', price: '69', description: 'Filterka, nuty czekolady i suszonej śliwki.',  badge: 'bestseller', collections: ['new-arrivals', 'best-sellers'] },
    { name: 'Espresso Blend',     price: '79',  description: 'Brazylia + Etiopia, do ekspresu i mocy.',                               collections: ['best-sellers'] },
    { name: 'Decaf · Slow',       price: '69',  description: 'Bezkofeinowa, proces Mountain Water.',             badge: 'new',        collections: ['new-arrivals'] },
    { name: 'Filter Cone',        price: '89',  description: 'Plastikowy V60 #02, czarny.',                                           collections: ['best-sellers'] },
    { name: 'Server · Glass',     price: '129', description: 'Karafka 500ml, borokrzem.',                                             collections: ['new-arrivals'] },
    { name: 'Subskrypcja · 2kg/m',price: '249', originalPrice: '299', description: 'Co miesiąc, anuluj w sekundę.', badge: 'sale',  collections: ['new-arrivals', 'best-sellers'] },
  ],
  food: [
    { name: 'Granola · Field',    price: '39',  description: 'Owies, migdały, miód lipowy.',                     badge: 'bestseller', collections: ['new-arrivals', 'best-sellers'] },
    { name: 'Honey · Wild',       price: '49',  description: 'Miód spadziowy, 500g.',                                                 collections: ['best-sellers'] },
    { name: 'Chocolate · 70%',    price: '29',  description: 'Single origin Wenezuela, tabliczka 80g.',          badge: 'new',        collections: ['new-arrivals'] },
    { name: 'Pasta · Linguine',   price: '24',  description: 'Brąz, twarda pszenica, suszona powoli.',                                collections: ['new-arrivals'] },
    { name: 'Sól · Flake',        price: '34',  originalPrice: '44', description: 'Płatki, ręcznie zbierane.',  badge: 'sale',     collections: ['best-sellers'] },
    { name: 'Olej · Cold-press',  price: '79',  description: 'Pierwsze tłoczenie na zimno, 250ml.',                                   collections: ['new-arrivals'] },
  ],
  art: [
    { name: 'Print 01 · Field',   price: '149', description: 'Druk giclée, A3, edycja 50.',                      badge: 'bestseller', collections: ['new-arrivals', 'best-sellers'] },
    { name: 'Print 02 · Mono',    price: '129', description: 'A4, papier 250gsm, edycja 100.',                                        collections: ['best-sellers'] },
    { name: 'Print 03 · Color',   price: '189', description: 'A2, edycja otwarta, podpisany.',                   badge: 'new',        collections: ['new-arrivals'] },
    { name: 'Ramka · Oak',        price: '99',  description: 'Dąb naturalny, A3.',                                                    collections: ['best-sellers'] },
    { name: 'Studio Tee',         price: '139', originalPrice: '179', description: 'Limited collab, M-XL.',      badge: 'sale',     collections: ['new-arrivals'] },
  ],
  digital: [
    { name: 'Notion Kit · Ops',   price: '149', description: 'System operacyjny solo founder, 12 templates.',    badge: 'bestseller', collections: ['new-arrivals', 'best-sellers'] },
    { name: 'Brand Templates',    price: '99',  description: 'Figma kit + 6 layoutów landing.',                                       collections: ['best-sellers'] },
    { name: 'Email Toolkit',      price: '79',  description: 'Sekwencje + sample copy.',                          badge: 'new',        collections: ['new-arrivals'] },
    { name: 'Pricing Calculator', price: '49',  description: 'Sheet do wyceniania B2B usług.',                                        collections: ['best-sellers'] },
    { name: 'OKR Bundle',         price: '129', originalPrice: '169', description: '4 widoki + manual.',         badge: 'sale',     collections: ['new-arrivals'] },
  ],
  plants: [
    { name: 'Monstera · S',       price: '89',  description: 'Wys. 25cm, doniczka 12cm w cenie.',                badge: 'bestseller', collections: ['new-arrivals', 'best-sellers'] },
    { name: 'Pothos · M',         price: '69',  description: 'Wys. 40cm, łatwy w utrzymaniu.',                                        collections: ['best-sellers'] },
    { name: 'Olive · L',          price: '249', originalPrice: '299', description: 'Drzewko 80cm, oliwka europejska.', badge: 'sale', collections: ['new-arrivals'] },
    { name: 'Sansewiera · M',     price: '99',  description: 'Tnąca powietrze, dla zapominalskich.',             badge: 'new',        collections: ['new-arrivals'] },
    { name: 'Calathea · S',       price: '79',  description: 'Wymaga wilgoci, paskowana.',                                            collections: ['new-arrivals'] },
    { name: 'Ficus · L',          price: '329', description: 'Lyrata, wysokość 110cm.',                                               collections: ['best-sellers'] },
  ],
  accessories: [
    { name: 'Tote · Sable',       price: '249', description: 'Pełne ziarno, mieści 15".',                        badge: 'bestseller', collections: ['new-arrivals', 'best-sellers'] },
    { name: 'Wallet · Plain',     price: '189', description: 'Bifold, 6 kart, monety.',                                               collections: ['best-sellers'] },
    { name: 'Belt · Daily',       price: '149', originalPrice: '189', description: 'Sprzączka mosiężna, szer. 32mm.', badge: 'sale', collections: ['new-arrivals'] },
    { name: 'Card Holder',        price: '89',  description: '4 sloty, ścisły.',                                  badge: 'new',        collections: ['new-arrivals'] },
    { name: 'Keychain',           price: '49',  description: 'Skóra + karabinek.',                                                    collections: ['best-sellers'] },
    { name: 'Crossbody · Small',  price: '299', description: 'Regulowany pasek, A5 layout.',                                          collections: ['new-arrivals'] },
  ],
  kids: [
    { name: 'Plush · Small',      price: '79',  description: 'Bawełna organiczna, ręcznie szyte.',               badge: 'bestseller', collections: ['new-arrivals', 'best-sellers'] },
    { name: 'Rattle · Wood',      price: '49',  description: 'Drewno bukowe, olej spożywczy.',                                        collections: ['best-sellers'] },
    { name: 'Tee · Cotton',       price: '69',  description: 'Bio bawełna, rozmiary 86-128.',                    badge: 'new',        collections: ['new-arrivals'] },
    { name: 'Soft Book',          price: '59',  description: 'Materiałowa, 8 stron.',                                                 collections: ['best-sellers'] },
    { name: 'Wooden Set',         price: '129', originalPrice: '159', description: 'Klocki, 30 elementów.',     badge: 'sale',     collections: ['new-arrivals'] },
  ],
  pets: [
    { name: 'Leash · Daily',      price: '129', description: 'Płaska skóra, długość 150cm.',                     badge: 'bestseller', collections: ['new-arrivals', 'best-sellers'] },
    { name: 'Bed · Wash',         price: '249', description: 'Pokrowiec zdejmowany, rozmiar M.',                                       collections: ['best-sellers'] },
    { name: 'Bowl · Stone',       price: '99',  description: 'Granit, antypoślizgowa baza.',                     badge: 'new',        collections: ['new-arrivals'] },
    { name: 'Brush · Wood',       price: '79',  description: 'Drewniany trzonek, szczotka żywioł.',                                   collections: ['new-arrivals'] },
    { name: 'Treat Pouch',        price: '69',  originalPrice: '89', description: 'Pas + komora na zamek.',     badge: 'sale',     collections: ['best-sellers'] },
  ],
  lifestyle: [
    { name: 'Przedmiot 01',       price: '129', description: 'Przemyślany codzienny przedmiot.',                badge: 'bestseller', collections: ['new-arrivals', 'best-sellers'] },
    { name: 'Przedmiot 02',       price: '149', description: 'Przemyślany codzienny przedmiot.',                                     collections: ['best-sellers'] },
    { name: 'Przedmiot 03',       price: '169', description: 'Przemyślany codzienny przedmiot.',                badge: 'new',        collections: ['new-arrivals'] },
    { name: 'Przedmiot 04',       price: '199', description: 'Przemyślany codzienny przedmiot.',                                     collections: ['new-arrivals'] },
    { name: 'Przedmiot 05',       price: '99',  originalPrice: '129', description: 'Przemyślany codzienny przedmiot.', badge: 'sale', collections: ['best-sellers'] },
  ],
}

export function inferProducts(category: Category): InferredProduct[] {
  return PRODUCT_TEMPLATES[category] ?? PRODUCT_TEMPLATES.lifestyle
}

/* ── Public API ──────────────────────────────────────────────────────────── */

export function fillBusinessDefaults(input: Business): Business {
  const category = inferCategory(input.sells)
  const name = input.name?.trim()
    ? input.name.trim()
    : suggestNames(input.sells || 'goods')[0] ?? 'Common Store'
  return {
    sells: input.sells || 'Przemyślane codzienne przedmioty',
    name,
    logoDataUrl: input.logoDataUrl,
    problem: input.problem?.trim() || defaultProblem(category),
    edge:    input.edge?.trim()    || defaultEdge(category, []),
  }
}

export function inferBrand(business: Business, brand: Brand): Inferred {
  const filled = fillBusinessDefaults(business)
  const category = inferCategory(filled.sells)
  // Paleta, fonty i layout pochodzą w całości z wybranego presetu stylu;
  // kategoria steruje tylko copy, produktami i audience.
  const preset = getStylePreset(brand.preset)
  const headline = pickByTone(brand.tone, COPY[category].headlines)
  const sub = pickByTone(brand.tone, COPY[category].subs)
  return {
    category,
    audience: AUDIENCE[category],
    palette: [preset.palette.paper, preset.palette.ink, preset.palette.accent],
    layout_type: preset.layout_type,
    hero_headline: headline,
    hero_sub: sub,
    effective_name: filled.name,
    font_pair: preset.fontStacks,
  }
}
