/**
 * Startsidans hubb-data: topp 3 per kategori.
 *
 * KÄLLA: varje post är hämtad mekaniskt ur respektive kategorisidas egen
 * produktarray (rank 1-3), inte skriven för hand. `ctaUrl` är därmed exakt
 * samma verifierade tracker-URL som topplistan använder, aldrig konstruerad
 * här (NOLLTOLERANS). Ändras en topplistas topp 3 ska den här filen
 * uppdateras i samma commit, annars visar hubben en annan vinnare än
 * kategorisidan.
 *
 * Källsidor:
 *   robotdammsugare   -> src/pages/robotdammsugare/index.astro
 *   robotgrasklippare -> src/pages/robotgrasklippare/index.astro
 *   poolrobot         -> src/pages/poolrobot/index.astro
 *   dronare           -> src/pages/dronare/index.astro
 *
 * `total` = antalet produkter i kategorins topplista, används för
 * "Visa alla N"-länkarna så antalet aldrig hårdkodas i copy.
 */

export interface HubItem {
  rank: number;
  name: string;
  brand: string;
  image: string;
  imgAlt: string;
  rating: number;
  badge?: string;
  /** En rad om vad modellen är bäst på. Kort, konkret, ingen marknadsföring. */
  bestFor: string;
  ctaText: string;
  ctaUrl: string;
  reviewUrl?: string;
}

export interface HubCategory {
  id: string;
  namn: string;
  /** Kategorins topplista, dit "visa alla" och kategorikortet pekar. */
  href: string;
  /** Bild till kategorikortet i bandet under heron. */
  bild: string;
  /** Vad kategorin faktiskt jämförs på. Blir kategoribandets underrad. */
  kriterier: string;
  total: number;
  items: HubItem[];
}

export const HUB: HubCategory[] = [
  {
    id: 'robotdammsugare',
    namn: 'Robotdammsugare',
    href: '/robotdammsugare/',
    bild: '/images/products/dreame-x50-ultra.webp',
    kriterier: 'Sugkraft, navigering och moppfunktion',
    total: 11,
    items: [
      {
        rank: 1,
        name: 'Dreame X50 Ultra',
        brand: 'Dreame',
        image: '/images/products/dreame-x50-ultra.webp',
        imgAlt: 'Dreame X50 Ultra robotdammsugare med basstation',
        rating: 4.9,
        badge: 'Bäst i test',
        bestFor: 'Starkast sugkraft vi jämfört, utfällbar mopparm som når hörnen.',
        ctaText: 'Bra pris hos Elon',
        ctaUrl: 'https://to.elon.se/t/t?a=1606750995&as=2063681412&t=2&tk=1&cupa_sku=151996&url=https://www.elon.se/dreame-x50-ultra-white-151996',
      },
      {
        rank: 2,
        name: 'Roborock Saros 20 Sonic',
        brand: 'Roborock',
        image: '/images/products/roborock-saros-20-sonic.webp',
        imgAlt: 'Roborock Saros 20 Sonic robotdammsugare',
        rating: 4.8,
        badge: 'Nyhet 2026',
        bestFor: 'Anti-tangle-borsten trasslar aldrig, byggd för långt hår.',
        ctaText: 'Bra pris hos Elon',
        ctaUrl: 'https://to.elon.se/t/t?a=1606750995&as=2063681412&t=2&tk=1&cupa_sku=154763&url=https://www.elon.se/roborock-saros-20-sonic-s20s52-00-svart-154763',
      },
      {
        rank: 3,
        name: 'Dreame X60 Ultra',
        brand: 'Dreame',
        image: '/images/products/dreame-x60-ultra.webp',
        imgAlt: 'Dreame X60 Ultra robotdammsugare med basstation',
        rating: 4.8,
        badge: 'Bäst på moppning',
        bestFor: 'Moppar med 100-gradigt vatten och når kanter med utfällbar arm.',
        ctaText: 'Bra pris hos Elon',
        ctaUrl: 'https://to.elon.se/t/t?a=1606750995&as=2063681412&t=2&tk=1&cupa_sku=153177&url=https://www.elon.se/dreame-x60-ultra-white-153177',
      },
    ],
  },
  {
    id: 'robotgrasklippare',
    namn: 'Robotgräsklippare',
    href: '/robotgrasklippare/',
    bild: '/images/products/dreame-a3-awd-pro-5000.webp',
    kriterier: 'Navigering, lutning och arbetsyta',
    total: 10,
    items: [
      {
        rank: 1,
        name: 'Dreame A3 AWD Pro 5000',
        brand: 'Dreame',
        image: '/images/products/dreame-a3-awd-pro-5000.webp',
        imgAlt: 'Dreame A3 AWD Pro 5000 robotgräsklippare',
        rating: 4.8,
        badge: 'Bäst i test',
        bestFor: 'AWD på alla hjul tar branta slänter, kabelfri GPS upp till 5 000 m².',
        ctaText: 'Bra pris hos Proshop',
        ctaUrl: 'https://go.adt284.net/t/t?a=1870484630&as=2063681412&t=2&tk=1&cupa_sku=3454280&url=https://www.proshop.se/Robotgraesklippare/Dreame-A3-AWD-Pro-5000-Robotgraesklippare-5000-m/3454280',
      },
      {
        rank: 2,
        name: 'Dreame A3 AWD 1000',
        brand: 'Dreame',
        image: '/images/dreame-a3-awd-1000.webp',
        imgAlt: 'Dreame A3 AWD 1000 robotgräsklippare',
        rating: 4.6,
        badge: 'Bäst AWD budget',
        bestFor: 'Samma AWD-grepp i en mindre trädgård, upp till 1 000 m².',
        ctaText: 'Bra pris hos Kjell',
        ctaUrl: 'https://ion.kjell.com/t/t?a=1487384319&as=2063681412&t=2&tk=1&cupa_sku=66730&url=https://www.kjell.com/se/produkter/hem-fritid/tradgard/robotgrasklippare-tillbehor/robotgrasklippare/dreame-a3-awd-1000-robotgrasklippare-p66730',
      },
      {
        rank: 3,
        name: 'Segway Navimow i220E',
        brand: 'Segway',
        image: '/images/products/segway-navimow-i220e.webp',
        imgAlt: 'Segway Navimow i220E robotgräsklippare',
        rating: 4.5,
        badge: 'Utan slinga',
        bestFor: 'LiDAR och RTK utan perimeterkabel, tyst nog för villakvarter.',
        ctaText: 'Bra pris hos CS Megastore',
        ctaUrl: 'https://go.csmegastore.se/t/t?a=1514097163&as=2063681412&t=2&tk=1&cupa_sku=25854166&url=https://www.csmegastore.se/i/25854166/segway-navimow-i220e-lidar-robotgr%c3%a4sklippare-2000-m',
      },
    ],
  },
  {
    id: 'poolrobot',
    namn: 'Poolrobot',
    href: '/poolrobot/',
    bild: '/images/products/zodiac-gt3220.webp',
    kriterier: 'Sugteknik, filter och väggklättring',
    total: 6,
    items: [
      {
        rank: 1,
        name: 'Zodiac Electric Pool Cleaner GT3220',
        brand: 'Zodiac',
        image: '/images/products/zodiac-gt3220.webp',
        imgAlt: 'Zodiac Electric Pool Cleaner GT3220 poolrobot',
        rating: 4.5,
        badge: 'Bäst i test',
        bestFor: 'Tar både botten och väggar, filtret töms utan verktyg.',
        ctaText: 'Bra pris hos CS Megastore',
        ctaUrl: 'https://go.csmegastore.se/t/t?a=1514097163&as=2063681412&t=2&tk=1&cupa_sku=20565812&url=https://www.csmegastore.se/i/20565812/zodiac-electric-pool-cleaner-gt3220',
      },
      {
        rank: 2,
        name: 'Planet Pool Orca 50CL',
        brand: 'Planet Pool',
        image: '/images/orca-50cl.webp',
        imgAlt: 'Planet Pool Orca 50CL batteridriven poolrobot',
        rating: 4.3,
        badge: 'Bäst budget',
        bestFor: 'Batteridriven och lätt att lyfta i och ur, ingen kabel att trassla.',
        ctaText: 'Bra pris hos Villanytt',
        ctaUrl: 'https://addrevenue.io/t?c=3467327&a=984922&m=SE&u=https%3A%2F%2Fvillanytt.se%2Fprodukt%2Fpoolrobot-orca-50cl-batteridriven%2F%3Futm_source%3DGoogle%20Shopping%26utm_campaign%3DGoogle%20Shopping%26utm_medium%3Dcpc%26utm_term%3D62432',
      },
      {
        rank: 3,
        name: 'CF 200CL Poolrobot',
        brand: 'CF',
        image: '/images/cf-200cl.webp',
        imgAlt: 'CF 200CL poolrobot',
        rating: 4.2,
        badge: 'Prisvärd kabeldriven',
        bestFor: 'Kraftfull sugmotor som orkar hela badsäsongen utan laddpaus.',
        ctaText: 'Bra pris hos Villanytt',
        ctaUrl: 'https://addrevenue.io/t?c=3467327&a=984922&m=SE&u=https%3A%2F%2Fvillanytt.se%2Fprodukt%2Fcf-200cl-poolrobot%2F%3Futm_source%3DGoogle%20Shopping%26utm_campaign%3DGoogle%20Shopping%26utm_medium%3Dcpc%26utm_term%3D74422',
      },
    ],
  },
  {
    id: 'dronare',
    namn: 'Drönare',
    href: '/dronare/',
    bild: '/images/dji-mini-5-pro.webp',
    kriterier: 'Kamera, flygtid och regelklass',
    total: 4,
    items: [
      {
        rank: 1,
        name: 'DJI Mini 5 Pro',
        brand: 'DJI',
        image: '/images/dji-mini-5-pro.webp',
        imgAlt: 'DJI Mini 5 Pro drönare',
        rating: 4.9,
        badge: 'Bäst i test',
        bestFor: 'Under 250 g ger enklare regler, ändå 1-tums sensor och 4K/120.',
        ctaText: 'Bra pris hos Kjell',
        ctaUrl: 'https://ion.kjell.com/t/t?a=1487384319&as=2063681412&t=2&tk=1&cupa_sku=57972&url=https://www.kjell.com/se/produkter/hem-fritid/fritid/dronare/dji-dronare/dji-mini-5-pro-hopfallbar-dronare-med-50-mp-kamera-p57972',
        reviewUrl: '/dji-mini-5-pro/',
      },
      {
        rank: 2,
        name: 'DJI Air 3S',
        brand: 'DJI',
        image: '/images/dji-air-3s.webp',
        imgAlt: 'DJI Air 3S drönare',
        rating: 4.7,
        badge: 'Bäst bildkvalitet',
        bestFor: 'Dubbla kameror, 1-tums vidvinkel plus 70 mm tele i samma flygning.',
        ctaText: 'Bra pris hos Dronarbutiken',
        ctaUrl: 'https://addrevenue.io/t?c=3467327&a=987736&m=SE&u=https%3A%2F%2Fdronarbutiken.se%2Fproducts%2Fdji-air-3s-dji-rc-n3',
        reviewUrl: '/dji-air-3s/',
      },
      {
        rank: 3,
        name: 'DJI Mini 4 Pro Fly More Combo',
        brand: 'DJI',
        image: '/images/dji-mini-4-pro.webp',
        imgAlt: 'DJI Mini 4 Pro drönare',
        rating: 4.6,
        badge: 'Prisvärd 4K',
        bestFor: 'Fjolårsmodellen med 4K/60 HDR, oftast tusenlappar billigare.',
        ctaText: 'Bra pris hos Kjell',
        ctaUrl: 'https://ion.kjell.com/t/t?a=1487384319&as=2063681412&t=2&tk=1&cupa_sku=57765&url=https://www.kjell.com/se/produkter/hem-fritid/fritid/dronare/dji-dronare/dji-mini-4-pro-fly-more-combo-p57765',
      },
    ],
  },
];

/** Totalt antal robotar i alla kategoriers topplistor, för hubbens copy. */
export const HUB_TOTAL = HUB.reduce((n, c) => n + c.total, 0);
