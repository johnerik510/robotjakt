// AUTO-GENERATED from Adtraction + Addrevenue + Tradedoubler product feeds.
// Aktiva butiker: Elon, Kjell, Komplett, CS Megastore, Proshop, Addrevenue, CDON.
// Regenereras från /tmp/lookups/robotjakt_*_robots.json (filtrade feeds per butik).
// CDON: scripts/fetch-cdon-feed.mjs (Tradedoubler fid=52017, kanal a(3482941)).
// Senast uppdaterad: 2026-06-08

import f_elon from './feed-matches/elon.json' with { type: 'json' };
import f_kjell from './feed-matches/kjell.json' with { type: 'json' };
import f_komplett from './feed-matches/komplett.json' with { type: 'json' };
import f_csmegastore from './feed-matches/csmegastore.json' with { type: 'json' };
import f_proshop from './feed-matches/proshop.json' with { type: 'json' };
import f_addrevenue from './feed-matches/addrevenue_robots.json' with { type: 'json' };
import f_cdon from './feed-matches/cdon.json' with { type: 'json' };

export interface FeedMatch {
  title: string;
  brand: string;
  price: string;
  sku: string;
  productUrl: string;
  trackedUrl: string;
  image: string;
  feedSource: string;
}

// Per-butik lookup används av multi-cta.ts för snabb filtrering per butik
export const FEED_BY_STORE: Record<string, Record<string, FeedMatch>> = {
  'Elon': f_elon as Record<string, FeedMatch>,
  'Kjell & Company': f_kjell as Record<string, FeedMatch>,
  'Komplett': f_komplett as Record<string, FeedMatch>,
  'CS MEGASTORE': f_csmegastore as Record<string, FeedMatch>,
  'Proshop': f_proshop as Record<string, FeedMatch>,
  'Addrevenue': f_addrevenue as Record<string, FeedMatch>,
  'CDON': f_cdon as Record<string, FeedMatch>,
};

export const FEED_MATCHES: Record<string, FeedMatch> = Object.assign(
  {} as Record<string, FeedMatch>,
  f_cdon as Record<string, FeedMatch>,
  f_addrevenue as Record<string, FeedMatch>,
  f_komplett as Record<string, FeedMatch>,
  f_proshop as Record<string, FeedMatch>,
  f_csmegastore as Record<string, FeedMatch>,
  f_kjell as Record<string, FeedMatch>,
  f_elon as Record<string, FeedMatch>,
);

export function findFeedMatch(brand: string, title: string): FeedMatch | undefined {
  return FEED_MATCHES[`${brand}||${title}`];
}

export function findByBrand(brand: string): FeedMatch[] {
  return Object.values(FEED_MATCHES).filter((m) => m.brand === brand);
}

export function findByTitleSubstring(brand: string, titleFragment: string): FeedMatch[] {
  const lower = titleFragment.toLowerCase();
  return Object.values(FEED_MATCHES).filter(
    (m) => m.brand === brand && m.title.toLowerCase().includes(lower)
  );
}
