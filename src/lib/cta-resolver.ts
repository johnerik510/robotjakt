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

import { FEED_MATCHES, type FeedMatch } from '../data/feed-matches';
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
  'Elon': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1606750990|1606750991|1606750992|1606750993|1606750994|1606750995)\b/,
  'Dustin': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1531274793|1531274794|1531274795|1531274796|1531274797|1531274798)\b/,
  'CS MEGASTORE': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1514097158|1514097159|1514097160|1514097161|1514097162|1514097163)\b/,
  'Kjell & Company': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1098281528|1098281529|1098281530|1098281531|1098281532|1098281533)\b/,
  'Komplett': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1615916037|1615916038|1615916039|1615916040|1615916041|1615916042)\b/,
  'Teknikproffset': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1954032645|1954032646|1954032647|1954032648|1954032649|1954032650)\b/,
  'Estore': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1954032577|1954032578|1954032579|1954032580|1954032581|1954032582)\b/,
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
