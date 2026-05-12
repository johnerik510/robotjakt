// AUTO-GENERATED from Adtraction product feeds. DO NOT EDIT MANUALLY.
// Source: /tmp/lookups/robot_*.json (parsed from /tmp/feeds/robot_*.xml)
// Generated: 2026-05-12
// Total entries: 198075
// Feed-files: addrevenue.json (4716), estore.json (93159), teknikproffset.json (82237), komplett.json (7767)
//
// To regenerate:
//   1. Download new feeds to /tmp/feeds/robot_<brand>.xml
//   2. node /Users/axeljonemyr/Documents/scripts/parse-all-feeds.mjs
//   3. node /Users/axeljonemyr/Documents/scripts/build-feed-matches.mjs robot /Users/axeljonemyr/Documents/robotjakt/src/data/feed-matches.ts

import f0 from './feed-matches/addrevenue.json' with { type: 'json' };
import f1 from './feed-matches/estore.json' with { type: 'json' };
import f2 from './feed-matches/teknikproffset.json' with { type: 'json' };
import f3 from './feed-matches/komplett.json' with { type: 'json' };

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

export const FEED_MATCHES: Record<string, FeedMatch> = Object.assign(
  {} as Record<string, FeedMatch>,
  f0 as Record<string, FeedMatch>,
  f1 as Record<string, FeedMatch>,
  f2 as Record<string, FeedMatch>,
  f3 as Record<string, FeedMatch>,
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
