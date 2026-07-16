/**
 * Strikt CTA-resolver för REDAKTIONELLA sidor (recensioner, jämförelser, guider).
 *
 * Varför en egen resolver i stället för multi-cta.ts/resolveProductDeeplink?
 * Den lösa token-överlappningen där matchar fel produkt och rena tillbehör, t.ex.
 *   "Roborock Qrevo Pro"   -> "Roborock Qrevo Edge 2 Pro"  (annan modell)
 *   "Roborock Saros 10R"   -> "Roborock Saros 10 Vit"      (annan modell)
 *   "Roborock Qrevo Master"-> "Set med rullborstar ... Qrevo Master" (tillbehör)
 *   "Dreame X30 Ultra"     -> "Dreame ... Z30 Ultra"        (annan produkt)
 * En CTA som skickar läsaren till fel produkt bryter NOLLTOLERANS-regeln i
 * CLAUDE.md. Den här resolvern är därför medvetet restriktiv: hellre INGEN CTA
 * än en CTA till fel produkt.
 *
 * Regler för en godkänd match:
 *  1. Kandidatens titel måste innehålla modellfrasen (produktnamn utan märke)
 *     som SAMMANHÄNGANDE delsträng efter normalisering. Det skiljer
 *     "qrevo pro" från "qrevo edge 2 pro" och "saros 10r" från "saros 10".
 *  2. Märket måste finnas i titeln.
 *  3. Titlar med tillbehörs-/reservdelsmarkörer avvisas (delsträngsmatchning,
 *     svensk morfologi: "rullborstar" fångas av "borst").
 *  4. URL:en tas ALLTID ordagrant från feedens trackedUrl. Ingen URL byggs här.
 *
 * Ingen befintlig sida påverkas: filen används bara av EditorialCTA.astro.
 */

import { FEED_BY_STORE, FEED_MATCHES, type FeedMatch } from '../data/feed-matches';
import { getStore } from '../data/affiliate-stores';

export interface EditorialCTAOption {
  store: string;
  url: string;
  commission: number;
  /** Feedens titel, för spårbarhet/verifiering. */
  matchedTitle: string;
}

/** Aktiva butiker (samma roster som multi-cta.ts) med feed-nyckel. */
const ACTIVE_STORES: Array<{ key: string; display: string; commission: number }> = [
  { key: 'Elon', display: 'Elon', commission: 0.05 },
  { key: 'Kjell & Company', display: 'Kjell', commission: 0.05 },
  { key: 'CDON', display: 'CDON', commission: 0.045 },
  { key: 'Komplett', display: 'Komplett', commission: 0.04 },
  { key: 'CS MEGASTORE', display: 'CS Megastore', commission: 0.04 },
  { key: 'Proshop', display: 'Proshop', commission: 0.032 },
];

/**
 * Tillbehörs-/reservdelsmarkörer. Delsträngsmatchning mot normaliserad titel,
 * så "borst" fångar borste/borstar/rullborstar/sidoborste.
 * OBS: "mopp" ensamt får INTE stå här, eftersom riktiga robotar marknadsförs
 * med "Moppfunktion" i titeln.
 */
const ACCESSORY_MARKERS = [
  'borst', 'moppdyna', 'mopptyg', 'moppduk', 'mopduk', 'moppset', 'moppdukar',
  'set med', 'tillbehör', 'tillbehor', 'reservdel', 'dammpåse',
  'dammpase', 'dammpose', 'laddkabel', 'adapter', 'sidoborste', 'hepa',
  'kniv', 'knivar', 'spiral', 'väska', 'vaska', 'fodral', 'skydd',
  'rengöringsmedel', 'rengoringsmedel', 'batteripack', 'laddstation ',
  // Tillbehörskit och filter (även engelska/polska feed-titlar)
  'accessor', 'kit', 'filter', 'filtr', 'påsar', 'pasar', 'dammsugarpås',
  'pojemnika', 'paket om', 'pack', 'refill', 'byte',
  // Engelska tillbehör + rengöringsvätskor
  'brush', 'surface cleaner', 'detergent', 'solution', 'spare', 'mop pad',
  'dust bag', 'dustbin', 'dammbehållare',
];

/**
 * Variantkvalificerare. Om ordet DIREKT efter modellfrasen är en av dessa är
 * kandidaten en annan variant än den efterfrågade ("X40 Ultra" != "X40 Ultra
 * Complete", "Winbot W2 Pro" != "Winbot W2 Pro Omni") -> avvisa.
 * Färg-/kategoriord (white, svart, robotdammsugare) är däremot OK.
 */
const VARIANT_QUALIFIERS = new Set([
  'complete', 'plus', 'omni', 'pro', 'max', 'maxv', 'edge', 'curv', 'slim',
  'combo', 'ultra', 'gen2', 'gen3', 'gen', 'gen4', 'heat', 'gen1', 'lite',
  'gen5', 'nera', 'epro', 'gen0', 's', 'r', 'x', 'e',
]);

/** Märkesord som ska strippas ur produktnamnet för att få modellfrasen. */
const BRAND_WORDS = [
  'roborock', 'dreame', 'ecovacs', 'deebot', 'eufy', 'anker', 'irobot', 'roomba',
  'narwal', 'husqvarna', 'gardena', 'worx', 'segway', 'navimow', 'mammotion',
  'dolphin', 'maytronics', 'steinbach', 'zodiac', 'dji', 'neatsvor', 'xiaomi',
  'hobot', 'dyson', 'mcculloch', 'einhell', 'greenworks', 'bosch', 'tp-link',
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9åäö+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isAccessory(title: string): boolean {
  const n = normalize(title);
  const raw = title.toLowerCase();
  return ACCESSORY_MARKERS.some((m) => n.includes(normalize(m)) || raw.includes(m));
}

/** Plocka ut modellfrasen: produktnamnet utan ledande märkesord. */
function modelPhrase(productName: string): string {
  const tokens = normalize(productName).split(' ');
  while (tokens.length > 1 && BRAND_WORDS.includes(tokens[0])) tokens.shift();
  return tokens.join(' ');
}

function brandOf(productName: string): string | undefined {
  const first = normalize(productName).split(' ')[0];
  return BRAND_WORDS.includes(first) ? first : undefined;
}

/**
 * Godkänner kandidaten bara om modellfrasen finns sammanhängande i titeln,
 * märket finns, och titeln inte är ett tillbehör.
 */
function isExactMatch(productName: string, candidateTitle: string): boolean {
  if (isAccessory(candidateTitle)) return false;
  const title = normalize(candidateTitle);
  const model = modelPhrase(productName);
  if (!model) return false;

  const at = title.indexOf(model);
  if (at === -1) return false;

  const brand = brandOf(productName);
  if (brand && !title.includes(brand)) return false;

  // Modellfrasen måste sluta på ordgräns ("saros 10" får inte matcha "saros 100")
  const after = title.slice(at + model.length);
  if (after && !after.startsWith(' ')) return false;

  // Ordet direkt efter modellfrasen får inte vara en annan variant
  const nextWord = after.trim().split(' ')[0];
  if (nextWord && VARIANT_QUALIFIERS.has(nextWord)) return false;

  return true;
}

function storeEntries(storeKey: string): FeedMatch[] {
  const feed = (FEED_BY_STORE as Record<string, Record<string, FeedMatch>>)[storeKey];
  if (feed) return Object.values(feed);
  return [];
}

/**
 * Returnerar verifierade butiks-CTA:er för produkten, sorterade på provision.
 * Tom lista = ingen verifierad länk finns -> anropande komponent renderar inget.
 */
export function resolveExactCTA(productName: string, max = 4): EditorialCTAOption[] {
  const out: EditorialCTAOption[] = [];
  const seen = new Set<string>();

  for (const store of ACTIVE_STORES) {
    let hit: FeedMatch | undefined;
    for (const entry of storeEntries(store.key)) {
      if (isExactMatch(productName, entry.title)) { hit = entry; break; }
    }
    if (!hit) {
      // Bakåtkompatibilitet: äldre feeds ligger platt i FEED_MATCHES.
      for (const entry of Object.values(FEED_MATCHES) as FeedMatch[]) {
        if (!entry.trackedUrl) continue;
        if (!isExactMatch(productName, entry.title)) continue;
        if (storeOfUrl(entry.trackedUrl) !== store.key) continue;
        hit = entry;
        break;
      }
    }
    if (!hit) continue;
    const key = store.key.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const cfg = getStore(store.key);
    out.push({
      store: cfg?.name ?? store.display,
      url: hit.trackedUrl,
      commission: cfg?.commission ?? store.commission,
      matchedTitle: hit.title,
    });
  }

  out.sort((a, b) => b.commission - a.commission);
  return out.slice(0, max);
}

/** Härled butiksnyckel ur en tracker-URL (för den platta FEED_MATCHES-fallbacken). */
function storeOfUrl(url: string): string | undefined {
  if (/to\.elon\.se|a=160675099\d/.test(url)) return 'Elon';
  if (/ion\.kjell\.com|a=14873843\d\d/.test(url)) return 'Kjell & Company';
  if (/go\.adt267\.com|a=16159160\d\d/.test(url)) return 'Komplett';
  if (/go\.csmegastore\.se|a=15140971\d\d/.test(url)) return 'CS MEGASTORE';
  if (/go\.adt284\.net|a=18704846\d\d/.test(url)) return 'Proshop';
  if (/pdt\.tradedoubler\.com\/click\?a\(3482941\)/.test(url)) return 'CDON';
  return undefined;
}
