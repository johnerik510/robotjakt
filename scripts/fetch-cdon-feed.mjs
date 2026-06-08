/**
 * Hämtar robot-enheter ur CDON:s Tradedoubler-produktfeed och skriver
 * src/data/feed-matches/cdon.json i FeedMatch-format.
 *
 * Källa: Tradedoubler products API, fid=52017 (CDON.COM, program 46).
 * Tracking: feedens productUrl ÄR redan en Tradedoubler-deeplink
 *           (pdt.tradedoubler.com/click?a(3482941)...). Godkänd feed-källa.
 *           INGEN tracker byggs manuellt.
 *
 * Filtrering: bara riktiga robotenheter. Allt tillbehör/reservdelar
 *             (knivar, begränsningskabel, moppdukar, filter ...) kastas.
 *
 * Kör: node scripts/fetch-cdon-feed.mjs
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const TOKEN = 'A9751A03193B436BAFE79D788BAFA71F24624598';
const FID = 52017;
const API = (q, page) =>
  `https://api.tradedoubler.com/1.0/products.json;page=${page};pageSize=100;fid=${FID};q=${encodeURIComponent(q)}?token=${TOKEN}`;

// Sökord per kategori. Robotgräsklippare + robotdammsugare + poolrobotar.
const QUERIES = [
  // Robotgräsklippare (mowers)
  'Navimow', 'Segway robotgräsklippare', 'Worx Landroid', 'Dreame robotgräsklippare',
  'Automower', 'Gardena robotgräsklippare', 'Mammotion', 'Luba', 'Husqvarna robotgräsklippare',
  'Ecovacs Goat', 'robotgräsklippare',
  // Robotdammsugare (vacuums)
  'Roborock', 'Dreame robotdammsugare', 'Ecovacs Deebot', 'Roomba', 'iRobot',
  'Xiaomi robotdammsugare', 'Eufy robotdammsugare', 'Mova robotdammsugare',
  'Neatsvor', 'robotdammsugare',
  // Poolrobotar
  'Dolphin poolrobot', 'Zodiac poolrobot',
];

// Prisgolv: under detta är det i praktiken alltid tillbehör/reservdel.
const PRICE_FLOOR = 1800;

// Titel-ord som avslöjar tillbehör/reservdel även om priset är högt.
const ACCESSORY_RE = new RegExp(
  [
    'reservdel', 'tillbehör', 'tillbehor', 'kniv', 'blad', 'begränsningskabel',
    'begransningskabel', 'guidekabel', 'boundary', 'kabel', 'spik', 'fäste', 'faste',
    'garage', 'carport', 'tak', 'skydd', 'cover', 'fodral', 'väska', 'vaska', 'bag',
    'moppduk', 'mopduk', 'moppdyna', 'mopp ', 'duk', 'filter', 'sidoborste', 'borste',
    'borstar', 'rulle', 'roller', 'hjul', 'wheel', 'dammpåse', 'dammpase', 'dammpose',
    'påse', 'pase', 'hepa', 'laddstation', 'laddkabel', 'adapter', 'nätdel', 'natdel',
    'batteri', 'rengöringslösning', 'rengoringslosning', 'rengöringsmedel', 'spray',
    'kit', 'set för', 'pack', '-pack', 'connector', 'verbinder', 'koppling', 'anslutning',
    'bytesskiva', 'skiva', 'ramp', 'tröskel', 'troskel', 'stötfångare', 'stotfangare',
    'styrkabel', 'avståndshållare', 'avstandshallare', 'plugg', 'klammer', 'docking',
  ].join('|'),
  'i'
);

// Märkesigenkänning (matchar BRAND_KEYWORDS i src/lib/multi-cta.ts).
const BRAND_KEYWORDS = [
  ['navimow', 'segway'], ['segway', 'segway'],
  ['landroid', 'worx'], ['worx', 'worx'],
  ['automower', 'husqvarna'], ['husqvarna', 'husqvarna'],
  ['sileno', 'gardena'], ['gardena', 'gardena'],
  ['luba', 'mammotion'], ['yuka', 'mammotion'], ['mammotion', 'mammotion'],
  ['deebot', 'ecovacs'], ['goat', 'ecovacs'], ['winbot', 'ecovacs'], ['ecovacs', 'ecovacs'],
  ['roborock', 'roborock'],
  ['mova', 'dreame'], ['dreame', 'dreame'],
  ['roomba', 'irobot'], ['irobot', 'irobot'],
  ['neatsvor', 'neatsvor'],
  ['dolphin', 'maytronics'], ['zodiac', 'zodiac'],
  ['eufy', 'eufy'], ['anker', 'eufy'],
  ['xiaomi', 'xiaomi'], ['narwal', 'narwal'], ['shark', 'shark'],
  ['samsung', 'samsung'], ['lg ', 'lg'], ['tesvor', 'tesvor'],
  ['einhell', 'einhell'], ['freelexo', 'einhell'],
  ['greenworks', 'greenworks'],
  ['jonr', 'jonr'], ['wybot', 'wybot'], ['osprey', 'wybot'],
  ['bestway', 'bestway'], ['liectroux', 'liectroux'], ['dyson', 'dyson'],
  ['bosch', 'bosch'], ['indego', 'bosch'],
];

// Generiska kategori-ord som INTE är märken — entries som faller tillbaka på
// dessa saknar identifierbart märke och kan inte kopplas till en branded money page.
const GENERIC_BRANDS = new Set([
  'robotgräsklippare', 'robotgrasklippare', 'robotdammsugare', 'poolrobot',
  'trådlös', 'tradlos', 'outlet', '[outlet]', 'robot', 'smart', 'ny', 'nya',
]);

// Möbler/heminredning som råkar matcha (TV-bänk m.m.) — aldrig robotar.
const FURNITURE_RE = /(tv-bänk|tv-bank|soffbord|byrå|byra|hylla|garderob|sänggavel|matbord|skänk)/i;

function detectBrand(title) {
  const lower = title.toLowerCase();
  for (const [kw, brand] of BRAND_KEYWORDS) {
    if (lower.includes(kw)) return brand;
  }
  return (lower.split(/\s+/)[0] ?? '').replace(/[^a-zåäö]/g, '');
}

// Måste innehålla ett robot-ord för att räknas som enhet (skydd mot brusprodukter).
const ROBOT_RE = /(robotgräsklippare|robotgrasklippare|robotdammsugare|robotmopp|poolrobot|robotic mower|robot vacuum|navimow|landroid|automower|deebot|roborock|roomba|luba|mähroboter)/i;

async function fetchQuery(q) {
  const out = [];
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(API(q, page));
    if (!res.ok) break;
    const data = await res.json();
    const prods = data.products ?? [];
    out.push(...prods);
    if (prods.length < 100) break;
  }
  return out;
}

function bestOffer(p) {
  const offers = p.offers ?? [];
  // billigaste in-stock-offer
  const inStock = offers.filter((o) => (o.availability ?? '').toLowerCase() === 'in stock');
  const pool = inStock.length ? inStock : offers;
  return pool
    .map((o) => ({
      o,
      price: parseFloat(o.priceHistory?.[0]?.price?.value ?? 'NaN'),
    }))
    .filter((x) => !Number.isNaN(x.price))
    .sort((a, b) => a.price - b.price)[0];
}

async function main() {
  const byEan = new Map(); // dedup-nyckel: ean || lägsta pris vinner
  const brandsFound = new Set();
  let scanned = 0;

  for (const q of QUERIES) {
    const prods = await fetchQuery(q);
    scanned += prods.length;
    for (const p of prods) {
      const name = (p.name ?? '').trim();
      if (!name) continue;
      if (ACCESSORY_RE.test(name)) continue;
      if (FURNITURE_RE.test(name)) continue;
      if (!ROBOT_RE.test(name)) continue;

      const best = bestOffer(p);
      if (!best) continue;
      const price = best.price;
      if (price < PRICE_FLOOR) continue;

      const productUrl = best.o.productUrl;
      if (!productUrl || !productUrl.includes('tradedoubler.com')) continue;
      if (!productUrl.includes('a(3482941)')) continue; // måste vara robotjakts kanal

      const ean = p.identifiers?.ean ?? p.groupingId ?? name;
      const prev = byEan.get(ean);
      if (prev && prev.price <= price) continue;

      const brand = detectBrand(name);
      if (GENERIC_BRANDS.has(brand)) continue; // saknar identifierbart märke
      brandsFound.add(brand);

      byEan.set(ean, {
        price,
        match: {
          title: name,
          brand,
          price: String(Math.round(price)),
          sku: best.o.sourceProductId ?? ean,
          productUrl: decodeUrlTarget(productUrl),
          trackedUrl: productUrl,
          image: p.productImage?.url ?? '',
          feedSource: 'cdon',
        },
      });
    }
  }

  // Bygg {brand||title: FeedMatch}
  const result = {};
  for (const { match } of byEan.values()) {
    result[`${match.brand}||${match.title}`] = match;
  }

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outPath = join(__dirname, '..', 'src', 'data', 'feed-matches', 'cdon.json');
  writeFileSync(outPath, JSON.stringify(result, null, 1));

  console.log(`Skannade ${scanned} produkter över ${QUERIES.length} sökningar.`);
  console.log(`Skrev ${Object.keys(result).length} robotenheter → ${outPath}`);
  console.log(`Märken funna: ${[...brandsFound].sort().join(', ')}`);
  // Sammanfattning per märke
  const perBrand = {};
  for (const { match } of byEan.values()) perBrand[match.brand] = (perBrand[match.brand] ?? 0) + 1;
  console.log('Per märke:', JSON.stringify(perBrand));
}

// Plockar ut den riktiga cdon.se-produkt-URL:en ur deeplinkens url(...)-del.
function decodeUrlTarget(deeplink) {
  const m = deeplink.match(/url\(([^)]+)\)/);
  if (m) {
    try { return decodeURIComponent(m[1]); } catch { return m[1]; }
  }
  return deeplink;
}

main().catch((e) => { console.error(e); process.exit(1); });
