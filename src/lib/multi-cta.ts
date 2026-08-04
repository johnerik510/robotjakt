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
  /**
   * Sant när URL:en kommer ur en produktfeed, falskt när den är sidans egen
   * hardkodade fallback. Feed-träffar sorteras alltid före fallbacks, se sorteringen
   * i resolveMultiCTA().
   */
  fromFeed: boolean;
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
 * blir ett kop och inte hur dyr varan ar.
 *
 * Uppmatt utfall pa robotjakt, verifierat mot Adtractions API 2026-08-04:
 *
 *   30 dagar          klick   tx   provision   EPC
 *   Elon                269    1     197,30    0,73
 *   Kjell & Company     387    2      77,12    0,20
 *   CS MEGASTORE        279    0       0,00    0,00
 *   Proshop              89    0       0,00    0,00
 *   Komplett             55    0       0,00    0,00
 *
 *   90 dagar          tx   provision   snitt-ordervarde
 *   Elon               2      336,90        3 992 kr
 *   Kjell & Company    4      296,20        1 481 kr
 *   CS MEGASTORE       1      159,96        3 999 kr
 *
 * Elon gick fore Kjell 2026-08-04. Sjalva EPC-kvoten vilar pa n = 3 transaktioner
 * pa 30 dagar och ar darmed brus i sig. Det som INTE ar brus ar mekanismen bakom
 * den: bada butikerna ger 5 % provision, men Elons snittorder ligger pa 3 992 kr
 * mot Kjells 1 481 kr over 90 dagar. Elon saljer de dyra toppmodellerna, Kjell
 * mer av instegssortimentet, sa samma procentsats ger ungefar 2,7x mer per order.
 * Det haller aven om konverteringsgraden skulle jamna ut sig over tid.
 *
 * Omprova nar underlaget vuxit till ~15 transaktioner. Gar Kjells snittorder upp
 * eller Elons ner ska ordningen tillbaka.
 *
 * Bytet paverkar BARA rangordningen mellan butiker som redan har en verifierad
 * produkt-djuplank i feeden. resolveProductDeeplink() returnerar feedens egen
 * trackedUrl, sa en produkt som Elon inte saljer far fortfarande Kjell som
 * primar butik. Ingen URL byggs eller skrivs om har.
 *
 * `commission` behalls oforandrad: den exponeras i CTAOption och anvands pa
 * andra stallen, och far inte forfalskas for att styra sorteringen.
 *
 * ALLA butiker maste ligga kvar som fallback. Proshop ar primar butik pa ca 36
 * sidor dar ingen annan butik har feed-tackning, och alternativet dar ar ingen
 * CTA alls.
 */
const ACTIVE_STORES: Array<{ key: string; display: string; commission: number; priority: number }> = [
  { key: 'Elon',            display: 'Elon',       commission: 0.05,  priority: 1 },
  { key: 'Kjell & Company', display: 'Kjell',      commission: 0.05,  priority: 2 },
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
      fromFeed: true,
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
        fromFeed: false,
      });
    }
  }

  if (out.length === 0) return undefined;

  // Feed-traffar gar ALLTID fore sidans hardkodade fallback, oavsett butiksprioritet.
  //
  // Feeden ar det farskaste beviset for att butiken faktiskt saljer produkten just nu.
  // En hardkodad ctaUrl i en sida ar en ogonblicksbild fran nar sidan skrevs och kan ha
  // blivit inaktuell utan att nagot sagt ifran. Utan det har steget rackte det att flytta
  // upp en butik i ACTIVE_STORES for att en gammal fallback skulle slaa ut en levande
  // feed-lank: nar Elon gick om Kjell 2026-08-04 borjade Dreame X40 Ultra peka pa Elons
  // sida for en modell som inte langre gar att kopa online dar, i stallet for Kjells
  // feed-verifierade lank till samma modell i lager.
  //
  // Inom varje niva galler uppmatt EPC-prioritet, inte provisionssats (se ACTIVE_STORES).
  // Stabil sort bevarar inbordes ordning vid lika varden.
  out.sort((a, b) => (Number(b.fromFeed) - Number(a.fromFeed)) || (a.priority - b.priority));

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
