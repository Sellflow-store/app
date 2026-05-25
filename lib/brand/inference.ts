import type { Brand, Business, Inferred, Sliders } from './types'

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

/* ── Palette / typography / layout / copy ────────────────────────────────── */

type Palette = [string, string, string] // [paper, ink, accent]

const CATEGORY_PALETTES: Record<Category, Palette[]> = {
  candles:    [['#F5EBDD', '#2A2624', '#A89178'], ['#EEE6DA', '#1C1A18', '#7E6A55']],
  home_decor: [['#F4EFE7', '#23211E', '#9A8B73'], ['#EFEAE2', '#1E1C19', '#7E715D']],
  jewelry:    [['#F8F5EE', '#1A1916', '#B89968'], ['#F2EDE2', '#16140F', '#8C7141']],
  apparel:    [['#F2F0EC', '#111111', '#5A5A5A'], ['#EAE7E1', '#0C0C0C', '#2E2E2E']],
  beauty:     [['#F8EFE9', '#2A2120', '#C28B73'], ['#F1E5DD', '#21181A', '#A66C58']],
  coffee:     [['#EFE6D8', '#2A1D12', '#7A4A22'], ['#E7DCC9', '#1E140A', '#5B341A']],
  food:       [['#F4ECD9', '#231D14', '#A08148'], ['#E9DDC4', '#1A1410', '#7C5E2E']],
  art:        [['#F6F4EF', '#0F0F0E', '#C24B1F'], ['#EFECE5', '#0A0A0A', '#1E5BC2']],
  digital:    [['#F7F8FA', '#0C0F1A', '#3145FF'], ['#F0F2F8', '#070A14', '#1FB5A6']],
  plants:     [['#EEF1E7', '#1A2014', '#5C7A3A'], ['#E4EAD9', '#121810', '#3F5D26']],
  accessories:[['#F2EFE9', '#1A1714', '#7A5A3C'], ['#ECE8E0', '#13110E', '#5B3F26']],
  kids:       [['#FFF5EC', '#1F1B1A', '#F08A4B'], ['#FFEBE0', '#181412', '#E36B2E']],
  pets:       [['#F4EFE5', '#1E1A14', '#7A5A3C'], ['#EFEADE', '#16120D', '#5C3E22']],
  lifestyle:  [['#F4F2EC', '#171513', '#5C5A55'], ['#EDEAE2', '#0F0E0C', '#34322E']],
}

export function inferPalette(category: Category, _brand: Brand, sliders: Sliders): Palette {
  const set = CATEGORY_PALETTES[category]
  // Pick warm palette (index 0) when industrial_organic > 50, otherwise the cooler/sharper sibling.
  const idx = sliders.industrial_organic >= 50 ? 0 : 1
  return set[idx] ?? set[0]
}

export function inferLayoutType(sliders: Sliders): Inferred['layout_type'] {
  // High minimal + classic → editorial. Low minimal → card. Default → grid.
  if (sliders.minimal_expressive <= 35 && sliders.modern_classic >= 55) return 'editorial'
  if (sliders.minimal_expressive >= 70) return 'card'
  return 'grid'
}

export function inferFontPair(sliders: Sliders): Inferred['font_pair'] {
  // modern_classic > 65 → serif display, else sans display.
  const display = sliders.modern_classic >= 65 ? `"Playfair Display", Georgia, serif` : `"Space Grotesk", system-ui, sans-serif`
  const body = `"Inter Tight", "Inter", system-ui, sans-serif`
  return { display, body }
}

/* ── Audience ────────────────────────────────────────────────────────────── */

const AUDIENCE: Record<Category, string> = {
  candles:    'Gift-buyers and home-aesthetic women 25–45, mid-to-premium spend',
  home_decor: 'Aesthetic-minded apartment dwellers 28–50, mid-to-premium spend',
  jewelry:    'Self-gifters and gift-shoppers 22–45, mid-premium spend',
  apparel:    'Style-conscious adults 22–40, mid-tier spend',
  beauty:     'Skincare-curious women 25–45, premium spend',
  coffee:     'Home brewers and gift-buyers 28–55, mid-premium spend',
  food:       'Foodies and gift-buyers 28–55, mid spend',
  art:        'Renters and first-home buyers 25–45, mid spend',
  digital:    'Operators and creators 25–45 who buy templates and tools',
  plants:     'Urban plant parents 25–40, mid spend',
  accessories:'Daily-carry-minded professionals 25–45, mid-premium',
  kids:       'Parents 28–42 buying for kids and gifts',
  pets:       'Pet owners 25–50, mid spend',
  lifestyle:  'Discerning adults 25–45 who value quiet, well-made things',
}

/* ── Hero copy ───────────────────────────────────────────────────────────── */

type CopyTpl = { headlines: string[]; subs: string[] }

const COPY: Record<Category, CopyTpl> = {
  candles: {
    headlines: [
      'Hand-poured. Slow-burned. Made for moments.',
      'Quiet light, made one batch at a time.',
      'Candles for the part of the day that matters.',
    ],
    subs: [
      'Calm, clean-burning candles for people who notice the difference.',
      'Small-batch wax, considered scents, made to last.',
      'Made by hand. Built to slow you down.',
    ],
  },
  home_decor: {
    headlines: ['Objects you live with, not around.', 'For the rooms you actually use.'],
    subs: ['Small-batch home goods for people who notice materials.', 'Made to be touched daily.'],
  },
  jewelry: {
    headlines: ['Small things, worn forever.', 'Quiet pieces. Built to last decades.'],
    subs: ['Hand-finished jewellery for everyday wear.', 'Made in small batches. Sized to last.'],
  },
  apparel: {
    headlines: ['Made simply. Worn daily.', 'Fewer pieces. Better made.'],
    subs: ['Clothing for a wardrobe you actually reach for.', 'Cut from honest fabric, built to be worn.'],
  },
  beauty: {
    headlines: ['Skincare without the noise.', 'Calm formulas for everyday skin.'],
    subs: ['Made with ingredients you can read out loud.', 'Honest formulas. Quiet routine.'],
  },
  coffee: {
    headlines: ['Slow-roasted, in small batches.', 'Coffee for the part of the morning that counts.'],
    subs: ['Single-origin beans, roasted to order.', 'Made for people who notice the cup.'],
  },
  food: {
    headlines: ['Honest food, made small.', 'Made in batches you can taste.'],
    subs: ['Real ingredients, made in real kitchens.', 'Slow recipes. Short pantries.'],
  },
  art: {
    headlines: ['Prints for blank walls.', 'Editions you actually live with.'],
    subs: ['Limited prints from a working studio.', 'Considered work, made affordable.'],
  },
  digital: {
    headlines: ['Tools that save you a Tuesday.', 'The kit, not the lecture.'],
    subs: ['Templates and presets built from real work.', 'Cut the busywork. Keep the shape.'],
  },
  plants: {
    headlines: ['Living things, sent gently.', 'Plants for rooms you spend time in.'],
    subs: ['Grown carefully, packed carefully, shipped slowly.', 'For people who keep things alive.'],
  },
  accessories: {
    headlines: ['Daily carry, made to last.', 'Things you pack first.'],
    subs: ['Quiet accessories for working days.', 'Built to outlast the season.'],
  },
  kids: {
    headlines: ['Things kids actually keep.', 'Made for the long childhood.'],
    subs: ['Soft, durable, considered. Made for play.', 'Designed for years, not weeks.'],
  },
  pets: {
    headlines: ['Made for the dog that gets walked.', 'Honest gear for everyday animals.'],
    subs: ['Tough, soft, washable.', 'Built around how pets actually live.'],
  },
  lifestyle: {
    headlines: ['Made small. Made on purpose.', 'Quiet goods, made well.'],
    subs: ['A small store of considered things.', 'Made for people who notice.'],
  },
}

function pickByTone(tone: string[], options: string[]): string {
  const seed = tone.join('|').length
  return options[seed % options.length] ?? options[0]
}

/* ── Default fill for skipped Step-1 fields ──────────────────────────────── */

function defaultProblem(category: Category): string {
  switch (category) {
    case 'candles':    return 'People want their home to feel calm but most candles smell artificial.'
    case 'home_decor': return 'Most home goods are either disposable or too precious to actually use.'
    case 'jewelry':    return 'Jewellery is either fast-fashion or untouchably expensive — nothing in between.'
    case 'apparel':    return 'Wardrobes are full but nothing fits how the buyer actually lives.'
    case 'beauty':     return 'Beauty shelves are loud, complicated, and full of ingredients no one reads.'
    case 'coffee':     return 'Most coffee at home tastes like coffee at work.'
    case 'food':       return 'Honest food is hard to find without driving to a farmer’s market.'
    case 'art':        return 'Blank walls stay blank because real art feels out of reach.'
    case 'digital':    return 'Operators waste hours rebuilding the same templates from scratch.'
    case 'plants':     return 'Plants arrive stressed, ship badly, and die in the first month.'
    case 'accessories':return 'Daily-carry gear breaks fast or looks dated within a year.'
    case 'kids':       return 'Most kids’ things are loud, plastic, and built for one season.'
    case 'pets':       return 'Pet gear is either ugly utility or expensive design.'
    default:           return 'People want better-made everyday things and don’t know where to look.'
  }
}

function defaultEdge(category: Category, traits: string[]): string {
  const trait = traits[0]?.toLowerCase() ?? 'considered'
  const base: Record<Category, string> = {
    candles:    'Hand-poured in small batches with natural wax and considered scents.',
    home_decor: 'Made in small runs by makers we actually know.',
    jewelry:    'Hand-finished. Recycled metals. Real warranties.',
    apparel:    'Cut in small runs. Natural fibres. Honest construction.',
    beauty:     'Short ingredient lists. Independently tested. No filler.',
    coffee:     'Single-origin, roasted-to-order, shipped within 48h.',
    food:       'Made by people you can call. Short pantries. Honest pricing.',
    art:        'Limited editions, signed and numbered by the artist.',
    digital:    'Built from real working files, not stock kits.',
    plants:     'Grown by us. Packed slowly. Shipped warm.',
    accessories:'Cut from full-grain leather. Stitched to be repaired.',
    kids:       'Tested by kids. Sewn to survive them.',
    pets:       'Washable, repairable, sized properly.',
    lifestyle:  'Small range. Made well. Nothing filler.',
  }
  return `${base[category]} Built around being ${trait}.`
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
    { name: 'Object 01',          price: '129', description: 'Considered everyday object.',                      badge: 'bestseller', collections: ['new-arrivals', 'best-sellers'] },
    { name: 'Object 02',          price: '149', description: 'Considered everyday object.',                                            collections: ['best-sellers'] },
    { name: 'Object 03',          price: '169', description: 'Considered everyday object.',                      badge: 'new',        collections: ['new-arrivals'] },
    { name: 'Object 04',          price: '199', description: 'Considered everyday object.',                                            collections: ['new-arrivals'] },
    { name: 'Object 05',          price: '99',  originalPrice: '129', description: 'Considered everyday object.', badge: 'sale',  collections: ['best-sellers'] },
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
    sells: input.sells || 'Considered everyday goods',
    name,
    logoDataUrl: input.logoDataUrl,
    problem: input.problem?.trim() || defaultProblem(category),
    edge:    input.edge?.trim()    || defaultEdge(category, []),
  }
}

export function inferBrand(business: Business, brand: Brand): Inferred {
  const filled = fillBusinessDefaults(business)
  const category = inferCategory(filled.sells)
  const palette = inferPalette(category, brand, brand.sliders)
  const layout_type = inferLayoutType(brand.sliders)
  const font_pair = inferFontPair(brand.sliders)
  const headline = pickByTone(brand.tone, COPY[category].headlines)
  const sub = pickByTone(brand.tone, COPY[category].subs)
  return {
    category,
    audience: AUDIENCE[category],
    palette,
    layout_type,
    hero_headline: headline,
    hero_sub: sub,
    effective_name: filled.name,
    font_pair,
  }
}
