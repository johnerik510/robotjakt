/**
 * Multi-CTA-resolver: hitta alla aktiva butiker som säljer en produkt,
 * sorterade efter uppmätt EPC (bäst först).
 *
 * Returerar max 4 CTA:er per produkt: primary (fylld knapp) + upp till 3 sekundära
 * ("Även hos:"-taggar). Faller ALDRIG tillbaka på generiska hemsideslänkar.
 *
 * Flöde:
 *  1. Auto-detektera märke från produktnamn (eller använd hint)
 *  2. Slå upp butiker via BRAND_TO_STORES (vilka säljer märket)
 *  3. Filtrera till aktiva butiker (Kjell, Elon, CS Megastore, CDON, Komplett, Proshop)
 *  4. Per butik: resolveProductDeeplink() → produkt-djuplänk (score ≥ 2 tokens)
 *  5. Sortera efter EPC-prioritet (ACTIVE_STORES.priority), inte provisionssats
 *  6. Om ingen feed-match: använd fallback-URL från sidan
 */

import { BRAND_TO_STORES } from '../data/brand-stores';
import { getStore } from '../data/affiliate-stores';
import { resolveProductDeeplink } from './cta-resolver';

export interface CTAOption {
  store: string;       // Visningsnamn ("Elon", "Kjell", "Komplett", ...)
  storeKey: string;    // Intern nyckel för resolveProductDeeplink
  url: string;
  commission: number;
  /** EPC-baserad rangordning, lägre = visas först. Se ACTIVE_STORES. */
  priority: number;
}

export interface MultiCTAResult {
  primary: CTAOption;
  others: CTAOption[];
  /** Alla CTA:er i EPC-ordning, primary först. */
  all: CTAOption[];
}

/**
 * Aktiva butiker i EPC-ordning (ingen Teknikproffset, Estore, Dustin).
 *
 * `priority` (lagre = hogre upp) styr sorteringen, INTE `commission`.
 * Provisionssatsen sager vad vi far per krona, men inte hur ofta ett klick
 * blir ett kop. Uppmatt utfall pa robotjakt 90 dagar (t.o.m. 2026-08-02):
 *
 *   Kjell            527 klick   4 tx   EPC 0,56
 *   Elon             687 klick   2 tx   EPC 0,49
 *   CS MEGASTORE     528 klick   1 tx   EPC 0,30
 *   Komplett         163 klick   0 tx   EPC 0,00
 *   Proshop          130 klick   0 tx   EPC 0,00
 *
 * n = 7 transaktioner, sa inbordes ordning mellan Kjell/Elon/CS ar brus. Att
 * Komplett + Proshop tillsammans tog 293 klick utan en enda transaktion ar det
 * daremot inte, och de flyttas darfor sist. CDON ligger kvar bakom CS eftersom
 * programmet inte gett en forsaljning sedan 2026-06-08.
 *
 * `commission` behalls oforandrad: den exponeras i CTAOption och anvands pa
 * andra stallen, och far inte forfalskas for att styra sorteringen.
 *
 * ALLA butiker maste ligga kvar som fallback. Proshop ar primar butik pa ca 57
 * sidor dar ingen annan butik har feed-tackning, och alternativet dar ar ingen
 * CTA alls.
 */
const ACTIVE_STORES: Array<{ key: string; display: string; commission: number; priority: number }> = [
  { key: 'Kjell & Company', display: 'Kjell',      commission: 0.05,  priority: 1 },
  { key: 'Elon',            display: 'Elon',       commission: 0.05,  priority: 2 },
  { key: 'CS MEGASTORE',    display: 'CS Megastore', commission: 0.04, priority: 3 },
  { key: 'CDON',            display: 'CDON',       commission: 0.045, priority: 4 },
  { key: 'Komplett',        display: 'Komplett',   commission: 0.04,  priority: 5 },
  { key: 'Proshop',         display: 'Proshop',    commission: 0.032, priority: 6 },
  { key: 'Dronarbutiken',   display: 'Dronarbutiken', commission: 0.03, priority: 7 },
];

/**
 * Prioritet for en fallback-butik som inte finns i ACTIVE_STORES, t.ex. de
 * mindre Addrevenue-butikerna (Villanytt, Neatsvor, Robotrent). De ligger kvar
 * fore de nollsaljande Adtraction-butikerna, precis som med den gamla
 * provisionssorteringen dar de fick 0,05 som default.
 */
const UNKNOWN_STORE_PRIORITY = 2.5;

function priorityOf(storeKey: string): number {
  return ACTIVE_STORES.find((s) => s.key === storeKey)?.priority ?? UNKNOWN_STORE_PRIORITY;
}

// BRAND_TO_STORES använder t.ex. "CSMegastore" (ihopskrivet) → mappa till vår nyckel
const ALIAS_TO_KEY: Record<string, string> = {
  'CSMegastore':   'CS MEGASTORE',
  'Teknikproffset': '',  // Inaktiv
  'Estore':        '',   // Inaktiv
  'Dustin':        '',   // Inaktiv
};

// Märkesigenkänning från produktnamn
const BRAND_KEYWORDS: Array<[string, string]> = [
  ['roborock',   'roborock'],
  ['dreame',     'dreame'],
  ['mova',       'dreame'],
  ['ecovacs',    'ecovacs'],
  ['deebot',     'ecovacs'],
  ['husqvarna',  'husqvarna'],
  ['automower',  'husqvarna'],
  ['gardena',    'gardena'],
  ['sileno',     'gardena'],
  ['worx',       'worx'],
  ['landroid',   'worx'],
  ['segway',     'segway'],
  ['navimow',    'segway'],
  ['mammotion',  'mammotion'],
  ['luba',       'mammotion'],
  ['yuka',       'mammotion'],
  ['dji',        'dji'],
  ['mini 4',     'dji'],
  ['mini 5',     'dji'],
  ['air 3',      'dji'],
  ['neatsvor',   'neatsvor'],
  ['tp-link',    'tp-link'],
  ['tapo',       'tp-link'],
  ['zodiac',     'zodiac'],
  ['dolphin',    'maytronics'],
  ['steinbach',  'steinbach'],
  ['poolrunner', 'steinbach'],
  ['orca',       'orca'],
  ['jonr',       'jonr'],
  ['xiaomi',     'xiaomi'],
  ['irobot',     'irobot'],
  ['roomba',     'irobot'],
  ['grimsholm',  'grimsholm'],
  ['cf',         'cf'],
  ['einhell',    'einhell'],
  ['freelexo',   'einhell'],
  ['greenworks', 'greenworks'],
  ['optimow',    'greenworks'],
  ['indego',     'bosch'],
  ['liectroux',  'liectroux'],
  ['wybot',      'wybot'],
  ['osprey',     'wybot'],
  ['dyson',      'dyson'],
];

function detectBrand(productName: string): string {
  const lower = productName.toLowerCase();
  for (const [kw, brand] of BRAND_KEYWORDS) {
    if (lower.includes(kw)) return brand;
  }
  // Fallback: första ord i produktnamnet
  return lower.split(/\s+/)[0] ?? '';
}

function normalizeStoreKey(raw: string): string {
  if (raw in ALIAS_TO_KEY) return ALIAS_TO_KEY[raw] ?? '';
  return raw;
}

/**
 * Returnerar alla butiker som säljer produkten, sorterade efter EPC-prioritet.
 * Max 4 CTA:er (1 primär + 3 sekundära).
 *
 * @param productName - Fullständigt produktnamn (märke ingår ofta)
 * @param brandHint - Valfritt explicit märke (override auto-detektering)
 * @param fallback - Verifierad URL från sidan (används om feed missar primärbutiken)
 */
export function resolveMultiCTA(
  productName: string,
  brandHint?: string,
  fallback?: { store: string; url: string },
): MultiCTAResult | undefined {
  const brand = brandHint?.toLowerCase() ?? detectBrand(productName);

  // Hämta butiker som säljer märket
  const brandStoreKeys: string[] = (BRAND_TO_STORES[brand] ?? [])
    .map(normalizeStoreKey)
    .filter(Boolean);

  // Filtrera till aktiva butiker (bevarar EPC-ordningen i ACTIVE_STORES)
  const storesToTry = brandStoreKeys.length > 0
    ? ACTIVE_STORES.filter(s => brandStoreKeys.includes(s.key))
    : ACTIVE_STORES.filter(s => s.key !== 'Dronarbutiken'); // skip drone-only store om brand okänt

  const seen = new Set<string>();
  const out: CTAOption[] = [];

  for (const store of storesToTry) {
    const url = resolveProductDeeplink(store.key, productName);
    if (!url) continue;

    const keyNorm = store.key.toLowerCase();
    if (seen.has(keyNorm)) continue;
    seen.add(keyNorm);

    // Hämta display-namn från affiliate-stores (kan avvika från store.display)
    const storeConfig = getStore(store.key);
    out.push({
      store: storeConfig?.name ?? store.display,
      storeKey: store.key,
      url,
      commission: storeConfig?.commission ?? store.commission,
      priority: store.priority,
    });
  }

  // Lägg till fallback om den inte redan finns via feed
  if (fallback?.url && fallback.url.startsWith('http')) {
    const fallbackKeyNorm = (fallback.store || '').toLowerCase();
    if (!seen.has(fallbackKeyNorm)) {
      const storeConfig = getStore(fallback.store);
      out.push({
        store: storeConfig?.name ?? fallback.store,
        storeKey: fallback.store,
        url: fallback.url,
        commission: storeConfig?.commission ?? 0.05,
        priority: priorityOf(fallback.store),
      });
    }
  }

  if (out.length === 0) return undefined;

  // Sortera efter uppmätt EPC-prioritet, inte provisionssats (se ACTIVE_STORES).
  // Stabil sort: vid lika prioritet behålls inbördes ordning, så en feed-match
  // ligger kvar före sidans egen fallback-URL.
  out.sort((a, b) => a.priority - b.priority);

  const limited = out.slice(0, 4);
  return {
    primary: limited[0],
    others: limited.slice(1),
    all: limited,
  };
}

/** Extrahera butiksnamn från en tracking-URL. */
export function storeFromUrl(url: string): string {
  if (!url) return '';
  if (url.includes('to.elon.se') || url.includes('elon.se')) return 'Elon';
  if (url.includes('ion.kjell.com') || url.includes('kjell.com')) return 'Kjell & Company';
  if (url.includes('go.adt267.com') || url.includes('komplett.se')) return 'Komplett';
  if (url.includes('go.csmegastore.se') || url.includes('csmegastore.se')) return 'CS MEGASTORE';
  if (url.includes('go.adt284.net') || url.includes('proshop.se')) return 'Proshop';
  if (url.includes('addrevenue.io')) {
    // Addrevenue används för flera butiker. Avgör butik via target-domänen
    // i u=-parametern, aldrig blint "Dronarbutiken" (det mislabelar Robotrent,
    // Neatsvor m.fl. och bryter CTA-standarden butik=destination).
    let host = '';
    try {
      const target = new URL(url).searchParams.get('u');
      if (target) host = new URL(decodeURIComponent(target)).hostname.replace(/^www\./, '');
    } catch { /* ignore */ }
    if (host.includes('neatsvor')) return 'Neatsvor';
    if (host.includes('robotrent')) return 'Robotrent';
    if (host.includes('robot-dammsugaren')) return 'Robot-dammsugaren';
    if (host.includes('dronarbutiken')) return 'Dronarbutiken';
    if (host.includes('villanytt')) return 'Villanytt';
    if (host.includes('dustie')) return 'Dustie';
    if (host.includes('mistore')) return 'MiStore';
    // Okänd addrevenue-domän: härled rent namn ur domänen (aldrig mislabel)
    const seg = host.split('.')[0];
    if (seg) return seg.charAt(0).toUpperCase() + seg.slice(1);
    return 'Dronarbutiken';
  }
  if (url.includes('tradedoubler.com') || url.includes('cdon.se')) return 'CDON';
  return '';
}
