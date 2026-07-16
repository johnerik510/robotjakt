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
// cdon.se svarar inte likadant på en naken klient — spegla en riktig webbläsare
// när vi verifierar att produktsidorna lever.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
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

  // Verifiera att varje produkt faktiskt lever INNAN den skrivs.
  // CDON:s feed listar produkter vars sida är borttagen: URL:en svarar HTTP 200
  // men 301:ar tyst till kategorisidan, så en vanlig statuskoll missar det.
  // Uppmätt 2026-07-16: 28 av 121 feed-produkter (23%) var döda på det viset,
  // och 17 av 69 CDON-länkar på sajten (25%) skickade läsaren till en generisk
  // kategorilista i stället för produkten. En kategorisida konverterar inte.
  const candidates = [...byEan.values()].map(({ match }) => match);
  const { kept: alive, dropped } = await filterAlive(candidates);

  // Bygg {brand||title: FeedMatch}
  const result = {};
  for (const match of alive) {
    result[`${match.brand}||${match.title}`] = match;
  }

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outPath = join(__dirname, '..', 'src', 'data', 'feed-matches', 'cdon.json');
  writeFileSync(outPath, JSON.stringify(result, null, 1));

  console.log(`Skannade ${scanned} produkter över ${QUERIES.length} sökningar.`);
  console.log(`Bortsorterade ${dropped} döda produkter (URL:en redirectar till kategorisida).`);
  console.log(`Skrev ${Object.keys(result).length} robotenheter → ${outPath}`);
  console.log(`Märken funna: ${[...brandsFound].sort().join(', ')}`);
  // Sammanfattning per märke
  const perBrand = {};
  for (const { match } of byEan.values()) perBrand[match.brand] = (perBrand[match.brand] ?? 0) + 1;
  console.log('Per märke:', JSON.stringify(perBrand));
}

// Behåller bara produkter vars cdon.se-URL fortfarande landar på en produktsida.
// En borttagen produkt 301:ar till kategorisidan och svarar 200, så statuskoden
// duger inte: vi måste följa redirecten och kolla att vi hamnar på /produkt/.
//
// VIKTIGT: cdon.se strypar samtidiga anrop. Ett strypt svar (403/429/timeout) är
// INTE ett bevis på att produkten är borta, och får aldrig sortera bort den — då
// slänger vi säljbara produkter. Bara ett lyckat svar som landar utanför
// /produkt/ räknas som dött. Därför: sekventiellt, paus mellan anrop, retry med
// backoff, och "behåll vid tvivel".
async function filterAlive(matches) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const kept = [];
  let dropped = 0, unknown = 0;

  for (const m of matches) {
    let verdict = 'unknown';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(m.productUrl, {
          redirect: 'follow',
          headers: { 'User-Agent': UA },
          signal: AbortSignal.timeout(30_000),
        });
        if (res.status === 429 || res.status === 403) { await sleep(attempt * 4000); continue; }
        if (!res.ok) { await sleep(attempt * 2000); continue; }
        verdict = new URL(res.url).pathname.startsWith('/produkt/') ? 'alive' : 'dead';
        break;
      } catch {
        await sleep(attempt * 2000);
      }
    }
    if (verdict === 'dead') { dropped++; }
    else { kept.push(m); if (verdict === 'unknown') unknown++; }
    await sleep(700);
  }

  if (unknown) console.log(`  (${unknown} produkter gick inte att verifiera – behållna, inte bortsorterade)`);
  return { kept, dropped };
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
