/**
 * Multi-CTA-resolver: hitta alla aktiva butiker som säljer en produkt,
 * sorterade efter provision (högst först).
 *
 * Returerar max 4 CTA:er per produkt: primary (fylld knapp) + upp till 3 sekundära
 * ("Även hos:"-taggar). Faller ALDRIG tillbaka på generiska hemsideslänkar.
 *
 * Flöde:
 *  1. Auto-detektera märke från produktnamn (eller använd hint)
 *  2. Slå upp butiker via BRAND_TO_STORES (vilka säljer märket)
 *  3. Filtrera till aktiva butiker (Elon, Kjell, Komplett, CS Megastore, Proshop)
 *  4. Per butik: resolveProductDeeplink() → produkt-djuplänk (score ≥ 2 tokens)
 *  5. Sortera efter provision
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
}

export interface MultiCTAResult {
  primary: CTAOption;
  others: CTAOption[];
  /** Alla CTA:er i provisionordning, primary först. */
  all: CTAOption[];
}

// Aktiva butiker i provisionordning (ingen Teknikproffset, Estore, Dustin)
const ACTIVE_STORES: Array<{ key: string; display: string; commission: number }> = [
  { key: 'Elon',          display: 'Elon',        commission: 0.05  },
  { key: 'Kjell & Company', display: 'Kjell',     commission: 0.05  },
  { key: 'Komplett',      display: 'Komplett',     commission: 0.04  },
  { key: 'CS MEGASTORE',  display: 'CS Megastore', commission: 0.04  },
  { key: 'Proshop',       display: 'Proshop',      commission: 0.032 },
  { key: 'Dronarbutiken', display: 'Dronarbutiken', commission: 0.03 },
];

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
 * Returnerar alla butiker som säljer produkten, sorterade efter provision.
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

  // Filtrera till aktiva butiker (bevarar provisionordning)
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
      });
    }
  }

  if (out.length === 0) return undefined;

  // Sortera efter provision (stabilt: Elon och Kjell båda 5% → behåll inbördes ordning)
  out.sort((a, b) => b.commission - a.commission);

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
  if (url.includes('addrevenue.io')) return 'Dronarbutiken';
  return '';
}
