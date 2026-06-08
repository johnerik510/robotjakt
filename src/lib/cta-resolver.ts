/**
 * Resolve a verified tracker URL for (store, product) or null.
 *
 * AUTO-GENERATED av scripts/regen-cta-resolver.mjs.
 * Datakällor: /tmp/adtraction-channel-exports/robotjakt.csv
 *              /tmp/lookups/robot_addrevenue.json
 *
 * Slå-upp-kedja:
 *   1. Exakt/fuzzy match i feed-matches.ts → returnerar feedens trackedUrl
 *   2. Generisk fallback från verified-links.ts (store-startsida)
 *   3. undefined → ingen CTA renderas
 *
 * Hand-byggda URL:er förekommer ALDRIG som output.
 */

import { FEED_MATCHES, FEED_BY_STORE, type FeedMatch } from '../data/feed-matches';
import { VERIFIED_LINKS } from '../data/verified-links';

/**
 * Store-name → regex som matchar feed-entries vars trackedUrl tillhör butiken.
 * Advertiser-id-rangen tillåter +0..+5 från config-värdet eftersom feeden
 * ibland har annan tracking-id-version än Adtraction-config (vi har sett
 * +1, +2, +3 i naturen).
 */
const STORE_PATTERNS: Record<string, RegExp> = {
  '6889': /addrevenue\.io\/t\?[^"]*a=986849\b/,
  'Proshop': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1870484628|1870484629|1870484630|1870484631|1870484632|1870484633)\b/,
  'Elon': /(?:track\.adtraction\.com|(?:to\.elon\.se)|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1606750990|1606750991|1606750992|1606750993|1606750994|1606750995)\b/,
  'CS MEGASTORE': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1514097158|1514097159|1514097160|1514097161|1514097162|1514097163)\b/,
  // Kjell apid uppdaterat till 1487384319 (gammalt 1098281531 var fel)
  'Kjell & Company': /(?:track\.adtraction\.com|(?:ion\.kjell\.com)|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1487384314|1487384315|1487384316|1487384317|1487384318|1487384319)\b/,
  'Komplett': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|go\.adt267\.com|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1615916037|1615916038|1615916039|1615916040|1615916041|1615916042)\b/,
  // CDON via Tradedoubler: feedens productUrl ÄR deeplinken (kanal a(3482941)).
  'CDON': /pdt\.tradedoubler\.com\/click\?a\(3482941\)/,
  'Pix4D': /addrevenue\.io\/t\?[^"]*a=987736\b/,
  'Neatsvor': /addrevenue\.io\/t\?[^"]*a=985945\b/,
  'Xiaomi': /addrevenue\.io\/t\?[^"]*a=985837\b/,
  'Robot-dammsugaren.se': /addrevenue\.io\/t\?[^"]*a=985815\b/,
  'OBH NORDICA': /addrevenue\.io\/t\?[^"]*a=985477\b/,
  'Robotrent.se': /addrevenue\.io\/t\?[^"]*a=985383\b/,
  'Nordenspa': /addrevenue\.io\/t\?[^"]*a=984922\b/,
};

const storeEntriesCache = new Map<string, FeedMatch[]>();

function getStoreEntries(storeName: string): FeedMatch[] {
  if (storeEntriesCache.has(storeName)) return storeEntriesCache.get(storeName)!;
  const pat = STORE_PATTERNS[storeName];
  const out: FeedMatch[] = [];
  if (pat) {
    for (const entry of Object.values(FEED_MATCHES)) {
      if (pat.test(entry.trackedUrl)) out.push(entry);
    }
  }
  storeEntriesCache.set(storeName, out);
  return out;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9åäö]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenOverlap(a: string, b: string): number {
  const aTokens = new Set(normalize(a).split(' ').filter((t) => t.length > 2));
  const bTokens = new Set(normalize(b).split(' ').filter((t) => t.length > 2));
  let n = 0;
  for (const t of aTokens) if (bTokens.has(t)) n++;
  return n;
}

// Tillbehör/reservdels-nyckelord — om matchad titel innehåller dessa men frågan inte → uteslut
const ACCESSORY_TOKENS = new Set([
  'mopduk','moppduk','edgewise','filter','sidoborste','borste','borstar','tillbehor',
  'reservdel','reservdelar','knivar','kniv','spiraler','wire','laddkabel','adapter',
  'dammpase','dammpose','dammpåse','hepa','kit','accessorie','accessory','bracket',
  'cover','panel','sleeve','bag','dockningsstation','docking','hubs',
]);

/**
 * Strikt token-matchning för multi-CTA: returnerar score 0 om
 * 1. Matchad titel innehåller tillbehörs-nyckelord som frågan saknar (= accessoar, ej robot)
 * 2. Frågan innehåller modellnummer (t.ex. "5") som INTE finns i matchad titel (t.ex. bara "4")
 */
function strictMatchScore(query: string, candidateTitle: string): number {
  const base = tokenOverlap(query, candidateTitle);

  const qNorm = normalize(query);
  const cNorm = normalize(candidateTitle);
  const qTokens = new Set(qNorm.split(' ').filter((t) => t.length > 2));
  const cTokens = new Set(cNorm.split(' '));

  // Anpassa tröskel efter hur många unika tokens frågan har:
  // Korta produktnamn (t.ex. "Navimow i220E") har bara 2 meningsfulla tokens → acceptera 2
  const minScore = qTokens.size <= 3 ? 2 : 3;
  if (base < minScore) return 0;

  // Uteslut om kandidat innehåller tillbehörs-ord som frågan saknar
  for (const at of ACCESSORY_TOKENS) {
    if (cTokens.has(at) && !qTokens.has(at)) return 0;
  }

  // Modellnummer-konsistens: siffror inuti token (t.ex. "5000" i "5000m2") måste stämma
  // Använd (?<!\d)\d{1,4}(?!\d) för att matcha siffror som inte omges av andra siffror
  const numRe = /(?<!\d)\d{1,4}(?!\d)/g;
  const qNums = [...qNorm.matchAll(numRe)].map((m) => m[0]);
  const cNumSet = new Set([...cNorm.matchAll(numRe)].map((m) => m[0]));
  for (const n of qNums) {
    if (!cNumSet.has(n)) return 0; // Modellnummer i frågan saknas i kandidaten
  }

  return base;
}

/**
 * Resolva tracker-URL för (storeName, productName?).
 * Returnerar undefined om ingen verifierad källa finns.
 */
export function resolveTrackedUrl(storeName: string, productName?: string): string | undefined {
  if (productName) {
    const entries = getStoreEntries(storeName);
    if (entries.length > 0) {
      let best: FeedMatch | undefined;
      let bestScore = 0;
      for (const entry of entries) {
        const score = tokenOverlap(productName, entry.title);
        if (score > bestScore) {
          bestScore = score;
          best = entry;
        }
      }
      if (best && bestScore >= 2) return best.trackedUrl;
    }
  }
  if (VERIFIED_LINKS[storeName]) return VERIFIED_LINKS[storeName];
  return undefined;
}

/**
 * Direkt per-butik lookup via FEED_BY_STORE med strict matching.
 * Returnerar BARA produkt-djuplänkar (strictMatchScore >= 3), aldrig generiska hemsideslänkar.
 * Filtrerar bort tillbehör och modellnummers-missar.
 */
function resolveFromStoreFeed(storeName: string, productName: string): string | undefined {
  const feed = FEED_BY_STORE[storeName];
  if (!feed) return undefined;
  const entries = Object.values(feed) as FeedMatch[];
  if (entries.length === 0) return undefined;

  let best: FeedMatch | undefined;
  let bestScore = 0;
  for (const entry of entries) {
    const score = strictMatchScore(productName, entry.title);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  if (best && bestScore >= 3) return best.trackedUrl;
  return undefined;
}

/**
 * Returnerar en verifierad produkt-djuplänk (score >= 2) för (store, produktnamn).
 * Faller ALDRIG tillbaka på generisk hemsideslänk.
 * Används av multi-cta.ts för sekundära CTA:er.
 */
export function resolveProductDeeplink(storeName: string, productName: string): string | undefined {
  // Prova per-butik feed direkt (snabbt och korrekt)
  const direct = resolveFromStoreFeed(storeName, productName);
  if (direct) return direct;

  // Fallback: sök i hela FEED_MATCHES (bakåtkompatibilitet för gamla feeds).
  // Använder strictMatchScore (inte lös tokenOverlap) så att modellnummer måste
  // stämma och tillbehör exkluderas — annars matchas t.ex. "Landroid Vision 500"
  // felaktigt mot "Landroid M700 Plus".
  const entries = getStoreEntries(storeName);
  if (entries.length === 0) return undefined;
  let best: FeedMatch | undefined;
  let bestScore = 0;
  for (const entry of entries) {
    const score = strictMatchScore(productName, entry.title);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  if (best && bestScore >= 2) return best.trackedUrl;
  return undefined;
}

/** Kompatibilitets-API. */
export function buildSearchDeeplink(storeName: string, query: string): string | undefined {
  return resolveTrackedUrl(storeName, query);
}

/** Kompatibilitets-API. */
export function buildProductDeeplink(storeName: string, productUrl: string): string | undefined {
  const slug = productUrl.split('/').filter(Boolean).pop() || '';
  const productName = slug.replace(/[-_]/g, ' ');
  return resolveTrackedUrl(storeName, productName);
}
