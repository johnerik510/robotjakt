/**
 * Verified generic tracker URLs per store/brand.
 *
 * Används som fallback när en specifik produkt INTE finns i feed-matches.ts.
 * Varje URL är hand-kopierad från Adtractions "Create link"-funktion (eller
 * motsvarande hos andra nätverk) och pekar på butikens startsida eller
 * huvudkategori. URL:en är därför 100% verifierad och kan inte vara trasig
 * så länge programmet är aktivt.
 *
 * Lägg till en ny rad genom att:
 *   1. Logga in på Adtraction → Brands → välj butik
 *   2. Klicka "Create link" → klistra in butikens startsida
 *   3. Kopiera resulterande tracker-URL
 *   4. Lägg till här som <store_name>: '<tracker_url>'
 *
 * REGEL: hand-byggda tracker-URL:er får ALDRIG förekomma utanför den här
 * filen och feed-matches.ts. Quality-gate blockerar push om de hittas.
 *
 * Aktiva affiliate-feeds (2026-05-22):
 *   Elon 5%       a=1606750995  as=2063681412
 *   Kjell 5%      a=1487384319  as=2063681412
 *   Komplett 4%   a=1615916042  as=2063681412
 *   CS Megastore  a=1514097163  as=2063681412
 *   Proshop 3.2%  a=1870484630  as=2063681412
 *   Addrevenue (Dronarbutiken a=987736, Neatsvor a=985945,
 *               Robot-dammsugaren.se a=985815, Robotrent a=985383,
 *               Nordenspa/Villanytt a=984922)  c=3467327
 */

export const VERIFIED_LINKS: Record<string, string> = {
  // Generiska ingångslänkar (homepage/kategori) per butik:
  'Kjell & Company': 'https://ion.kjell.com/t/t?a=1487384319&as=2063681412&t=2&tk=1',
  'CS MEGASTORE': 'https://go.csmegastore.se/t/t?a=1514097163&as=2063681412&t=2&tk=1',
  'Elon': 'https://to.elon.se/t/t?a=1606750995&as=2063681412&t=2&tk=1',
  'Komplett': 'https://go.adt267.com/t/t?a=1615916042&as=2063681412&t=2&tk=1',
  'Proshop': 'https://go.adt284.net/t/t?a=1870484630&as=2063681412&t=2&tk=1',

  // Produktspecifika djuplänkar Elon (feed-verifierade):
  // 2026-07-16: Elon slutade sälja dessa tre (404 + borta ur Elons feed). Flyttade till
  // Kjell, som har samma produkter i sin feed (samma 5% provision). Nyckelnamnet följer butiken.
  'Kjell_s8_maxv_ultra': 'https://ion.kjell.com/t/t?a=1487384319&as=2063681412&t=2&tk=1&cupa_sku=66015&url=http://www.kjell.com/se/produkter/hem-fritid/stadning-rengoring/robotdammsugare/roborock-robotdammsugare/roborock-s8-maxv-ultra-helautomatisk-robotdammsugare-vit-p66015',
  'Elon_x50_ultra': 'https://to.elon.se/t/t?a=1606750995&as=2063681412&t=2&tk=1&cupa_sku=151996&url=https://www.elon.se/dreame-x50-ultra-white-151996',
  'Elon_x60_ultra': 'https://to.elon.se/t/t?a=1606750995&as=2063681412&t=2&tk=1&cupa_sku=153177&url=https://www.elon.se/dreame-x60-ultra-white-153177',
  'Elon_saros20': 'https://to.elon.se/t/t?a=1606750995&as=2063681412&t=2&tk=1&cupa_sku=154763&url=https://www.elon.se/roborock-saros-20-sonic-s20s52-00-svart-154763',
  'Kjell_qrevo_s': 'https://ion.kjell.com/t/t?a=1487384319&as=2063681412&t=2&tk=1&cupa_sku=66011&url=http://www.kjell.com/se/produkter/hem-fritid/stadning-rengoring/robotdammsugare/roborock-robotdammsugare/roborock-qrevo-s-helautomatisk-robotdammsugare-vit-p66011',
  'Elon_qrevo_curv': 'https://to.elon.se/t/t?a=1606750995&as=2063681412&t=2&tk=1&cupa_sku=148694&url=https://www.elon.se/roborock-qrevo-curv-white-148694',
  'Elon_l10s_gen3': 'https://to.elon.se/t/t?a=1606750995&as=2063681412&t=2&tk=1&cupa_sku=153176&url=https://www.elon.se/dreame-l10s-ultra-gen-3-black-153176',
  'Elon_l10s_gen3_white': 'https://to.elon.se/t/t?a=1606750995&as=2063681412&t=2&tk=1&cupa_sku=153175&url=https://www.elon.se/dreame-l10s-ultra-gen-3-white-153175',
  // 2026-07-16: sku 152011 är BLACK i feeden, URL:en sa white -> 404. Rättad mot feedens trackedUrl.
  'Elon_aqua10': 'https://to.elon.se/t/t?a=1606750995&as=2063681412&t=2&tk=1&cupa_sku=152011&url=https://www.elon.se/dreame-aqua10-ultra-roller-black-152011',
  'Elon_aqua10_white': 'https://to.elon.se/t/t?a=1606750995&as=2063681412&t=2&tk=1&cupa_sku=152012&url=https://www.elon.se/dreame-aqua10-ultra-roller-white-152012',
  // 2026-07-16: URL saknade färgsegmentet -> 404. Rättad mot feedens trackedUrl (sku 152009 = white).
  'Elon_matrix10': 'https://to.elon.se/t/t?a=1606750995&as=2063681412&t=2&tk=1&cupa_sku=152009&url=https://www.elon.se/dreame-matrix-10-ultra-white-152009',
  'Elon_d20_ultra': 'https://to.elon.se/t/t?a=1606750995&as=2063681412&t=2&tk=1&cupa_sku=152003&url=https://www.elon.se/dreame-d20-ultra-152003',
  'Elon_d20_plus': 'https://to.elon.se/t/t?a=1606750995&as=2063681412&t=2&tk=1&cupa_sku=152004&url=https://www.elon.se/dreame-d20-plus-152004',
  'Kjell_l40_ultra': 'https://ion.kjell.com/t/t?a=1487384319&as=2063681412&t=2&tk=1&cupa_sku=65909&url=http://www.kjell.com/se/produkter/hem-fritid/stadning-rengoring/robotdammsugare/dreame-robotdammsugare/dreame-l40-ultra-robotdammsugare-p65909',
  // 2026-07-16: Elon bytte URL/sku (153028 -> 155097), gamla gav 404. Rättad mot feedens trackedUrl.
  'Elon_eufy_x10': 'https://to.elon.se/t/t?a=1606750995&as=2063681412&t=2&tk=1&cupa_sku=155097&url=https://www.elon.se/eufy-eufy-x10-pro-omni-white-155097',
  // 2026-07-16: Elon_d10s_pro borttagen. URL:en gav 404 och Dreame D10s Pro finns inte som
  // robot i NÅGON av våra feeds (bara tillbehör) -> ingen verifierbar affiliatelänk = ingen CTA.
  'Elon_saros10': 'https://to.elon.se/t/t?a=1606750995&as=2063681412&t=2&tk=1&cupa_sku=149298&url=https://www.elon.se/roborock-saros-10-white-149298',
  'Elon_qrevo_edge': 'https://to.elon.se/t/t?a=1606750995&as=2063681412&t=2&tk=1&cupa_sku=148695&url=https://www.elon.se/roborock-qrevo-edge-white-148695',
  'Elon_x40_ultra': 'https://to.elon.se/t/t?a=1606750995&as=2063681412&t=2&tk=1&cupa_sku=151995&url=https://www.elon.se/dreame-x40-ultra-151995',

  // Produktspecifika djuplänkar Komplett (feed-verifierade):
  'Komplett_s8_maxv_ultra': 'https://go.adt267.com/t/t?a=1615916042&as=2063681412&t=2&tk=1&cupa_sku=1307027&url=https://www.komplett.se/product/1307027/hem-fritid/dammsugare-rengoring/robotdammsugare/roborock-s8-maxv-ultra-robotdammsugare-svart',
  'Komplett_saros10': 'https://go.adt267.com/t/t?a=1615916042&as=2063681412&t=2&tk=1&cupa_sku=1320411&url=https://www.komplett.se/product/1320411/hem-fritid/dammsugare-rengoring/robotdammsugare/roborock-saros-10-robotdammsugare-vit',
  'Komplett_worx_vision': 'https://go.adt267.com/t/t?a=1615916042&as=2063681412&t=2&tk=1&cupa_sku=1333222&url=https://www.komplett.se/product/1333222/hem-fritid/dammsugare-rengoring/robotgrasklippare/worx-wr305e-landroid-vision-cloud-500m2',
  'Komplett_dreame_a3_5000': 'https://go.adt267.com/t/t?a=1615916042&as=2063681412&t=2&tk=1&cupa_sku=1334171&url=https://www.komplett.se/product/1334171/hem-fritid/tradgard/robotgrasklippare/dreame-a3-awd-pro-5000m2-robotgrasklippare',
  'Komplett_rockneoq110': 'https://go.adt267.com/t/t?a=1615916042&as=2063681412&t=2&tk=1&cupa_sku=1339517&url=https://www.komplett.se/product/1339517/hem-fritid/tradgard/robotgrasklippare/roborock-rockneoq110-robotgrasklippare',

  // Produktspecifika djuplänkar Kjell (feed-verifierade):
  'Kjell_navimow_i105e': 'https://ion.kjell.com/t/t?a=1487384319&as=2063681412&t=2&tk=1&cupa_sku=66290&url=http://www.kjell.com/se/produkter/hem-fritid/tradgard/robotgrasklippare-tillbehor/robotgrasklippare/segway-navimow-i105e-robotgrasklippare-p66290',
  'Kjell_dreame_a1_pro': 'https://ion.kjell.com/t/t?a=1487384319&as=2063681412&t=2&tk=1&cupa_sku=66312&url=http://www.kjell.com/se/produkter/hem-fritid/tradgard/robotgrasklippare-tillbehor/robotgrasklippare/dreame-a1-pro-robotgrasklippare-p66312',
  'Kjell_dreame_a3_1000': 'https://ion.kjell.com/t/t?a=1487384319&as=2063681412&t=2&tk=1&cupa_sku=66730&url=http://www.kjell.com/se/produkter/hem-fritid/tradgard/robotgrasklippare-tillbehor/robotgrasklippare/dreame-a3-awd-1000-robotgrasklippare-p66730',
  'Kjell_mova_1000': 'https://ion.kjell.com/t/t?a=1487384319&as=2063681412&t=2&tk=1&cupa_sku=66311&url=http://www.kjell.com/se/produkter/hem-fritid/tradgard/robotgrasklippare-tillbehor/robotgrasklippare/mova-1000-robotic-lawn-mower-robotgrasklippare-p66311',
  'Kjell_dji_mini3': 'https://ion.kjell.com/t/t?a=1487384319&as=2063681412&t=2&tk=1&cupa_sku=57774&url=http://www.kjell.com/se/produkter/hem-fritid/fritid/dronare/dji-dronare/dji-mini-3-p57774',
  'Kjell_dji_mini4pro': 'https://ion.kjell.com/t/t?a=1487384319&as=2063681412&t=2&tk=1&cupa_sku=57765&url=http://www.kjell.com/se/produkter/hem-fritid/fritid/dronare/dji-dronare/dji-mini-4-pro-fly-more-com',
  'Kjell_dji_mini5pro': 'https://ion.kjell.com/t/t?a=1487384319&as=2063681412&t=2&tk=1&cupa_sku=57972&url=http://www.kjell.com/se/produkter/hem-fritid/fritid/dronare/dji-dronare/dji-mini-5-pro-hopfallbar-d',

  // Produktspecifika djuplänkar CS Megastore (feed-verifierade):
  'CS MEGASTORE_s8_maxv_ultra': 'https://go.csmegastore.se/t/t?a=1514097163&as=2063681412&t=2&tk=1&cupa_sku=21582900&url=https://www.csmegastore.se/i/21582900/roborock-s8-maxv-ultra-dammsugare-utan-p%C3%A5se',
  'CS MEGASTORE_saros10r': 'https://go.csmegastore.se/t/t?a=1514097163&as=2063681412&t=2&tk=1&cupa_sku=24161332&url=https://www.csmegastore.se/i/24161332/roborock-robotdammsugare-saros-10r-svart',
  'CS MEGASTORE_dreame_a3_5000': 'https://go.csmegastore.se/t/t?a=1514097163&as=2063681412&t=2&tk=1&cupa_sku=25340186&url=https://www.csmegastore.se/i/25340186/dreame-a3-awd-pro-robotgrasklippare-5000m2',
  'CS MEGASTORE_navimow_i220e': 'https://go.csmegastore.se/t/t?a=1514097163&as=2063681412&t=2&tk=1&cupa_sku=25567775&url=https://www.csmegastore.se/i/25567775/segway-navimow-i220e-lidar-pro-robotgrasklippare-2000-m2',
  'CS MEGASTORE_navimow_i210e': 'https://go.csmegastore.se/t/t?a=1514097163&as=2063681412&t=2&tk=1&cupa_sku=25466562&url=https://www.csmegastore.se/i/25466562/segway-navimow-i210e',
  'CS MEGASTORE_luba3_5000x': 'https://go.csmegastore.se/t/t?a=1514097163&as=2063681412&t=2&tk=1&cupa_sku=25727478&url=https://www.csmegastore.se/i/25727478/mammotion-luba-3-5000x-awd-lidar-rtk-robotgrasklippare',

  // Produktspecifika djuplänkar Proshop (feed-verifierade):
  'Proshop_x50_ultra': 'https://go.adt284.net/t/t?a=1870484630&as=2063681412&t=2&tk=1&cupa_sku=3434057&url=https://www.proshop.se/Robotdammsugare/Dreame-Robotdammsugare-X50-Ultra-White/3434057',
  'Proshop_x40_ultra': 'https://go.adt284.net/t/t?a=1870484630&as=2063681412&t=2&tk=1&cupa_sku=3396835&url=https://www.proshop.se/Robotdammsugare/Dreame-Robotdammsugare-X40-Ultra/3396835',
  'Proshop_s8_maxv_ultra': 'https://go.adt284.net/t/t?a=1870484630&as=2063681412&t=2&tk=1&cupa_sku=3281903&url=https://www.proshop.se/Robotdammsugare/Roborock-Robotdammsugare-S8-MaxV-Ultra-Black/3281903',
  'Proshop_qrevo_maxv': 'https://go.adt284.net/t/t?a=1870484630&as=2063681412&t=2&tk=1&cupa_sku=3342139&url=https://www.proshop.se/Robotdammsugare/Roborock-Robotdammsugare-Q-Revo-MaxV-Black/3342139',
  'Proshop_qrevo_edge': 'https://go.adt284.net/t/t?a=1870484630&as=2063681412&t=2&tk=1&cupa_sku=3368325&url=https://www.proshop.se/Robotdammsugare/Roborock-Robotdammsugare-Qrevo-Edge-White/3368325',
  'Proshop_qrevo_s': 'https://go.adt284.net/t/t?a=1870484630&as=2063681412&t=2&tk=1&cupa_sku=3353131&url=https://www.proshop.se/Robotdammsugare/Roborock-Robotdammsugare-Qrevo-S-White/3353131',
  'Proshop_t30c': 'https://go.adt284.net/t/t?a=1870484630&as=2063681412&t=2&tk=1&cupa_sku=3356577&url=https://www.proshop.se/Robotdammsugare/Ecovacs-Robotdammsugare-Deebot-T30C-Vit/3356577',
  'Proshop_eufy_x10': 'https://go.adt284.net/t/t?a=1870484630&as=2063681412&t=2&tk=1&cupa_sku=3282928&url=https://www.proshop.se/Robotdammsugare/Eufy-Robotdammsugare-X10-Pro-Omni-Black/3282928',
  'Proshop_narwal_freo': 'https://go.adt284.net/t/t?a=1870484630&as=2063681412&t=2&tk=1&cupa_sku=3274713&url=https://www.proshop.se/Robotdammsugare/Narwal-Robotdammsugare-Freo-X-Ultra/3274713',
  'Proshop_hobot_2s': 'https://go.adt284.net/t/t?a=1870484630&as=2063681412&t=2&tk=1&cupa_sku=3313226&url=https://www.proshop.se/Foenstertvaett/Hobot-2S-White/3313226',
  'Proshop_winbot_w2pro': 'https://go.adt284.net/t/t?a=1870484630&as=2063681412&t=2&tk=1&cupa_sku=3356596&url=https://www.proshop.se/Foenstertvaett/Ecovacs-Winbot-W2-Pro/3356596',
  'Proshop_zodiac_gt3220': 'https://go.adt284.net/t/t?a=1870484630&as=2063681412&t=2&tk=1&cupa_sku=3145255&url=https://www.proshop.se/Pool-badbassaeng/Zodiac-Robot-GT3220/3145255',
  'Proshop_navimow_i105e': 'https://go.adt284.net/t/t?a=1870484630&as=2063681412&t=2&tk=1&cupa_sku=3252813&url=https://www.proshop.se/Robotgraesklippare/Segway-Navimow-i105e-robotgraesklippare-500-m/3252813',
  'Proshop_worx_m500': 'https://go.adt284.net/t/t?a=1870484630&as=2063681412&t=2&tk=1&cupa_sku=3066543&url=https://www.proshop.se/Robotgraesklippare/Worx-Landroid-M500-Plus-WR165E-robotic-lawnmower-500-m/3066543',
  'Proshop_gardena_sileno_city': 'https://go.adt284.net/t/t?a=1870484630&as=2063681412&t=2&tk=1&cupa_sku=3051379&url=https://www.proshop.se/Robotgraesklippare/Gardena-smart-SILENO-city-robotic-lawnmower-500-m/3051379',
  'Proshop_gardena_sileno_life750': 'https://go.adt284.net/t/t?a=1870484630&as=2063681412&t=2&tk=1&cupa_sku=3051380&url=https://www.proshop.se/Robotgraesklippare/Gardena-smart-SILENO-life-robotic-lawnmower-750-m/3051380',
  'Proshop_gardena_sileno_life1100': 'https://go.adt284.net/t/t?a=1870484630&as=2063681412&t=2&tk=1&cupa_sku=3260133&url=https://www.proshop.se/Robotgraesklippare/Gardena-Robotgraesklippare-smart-SILENO-life-1100-m/3260133',
  'Proshop_gardena_sileno_sense': 'https://go.adt284.net/t/t?a=1870484630&as=2063681412&t=2&tk=1&cupa_sku=3443528&url=https://www.proshop.se/Robotgraesklippare/Gardena-smart-SILENO-sense-robotic-lawnmower-600-m/3443528',

  // Addrevenue Neatsvor:
  'Neatsvor': 'https://addrevenue.io/t?c=3467327&a=985945&m=SE&u=https%3A%2F%2Fwww.neatsvor.se%2Fprodukt%2Fneatsvor-x520-robotdammsugare%2F',
  'Neatsvor_x500': 'https://addrevenue.io/t?c=3467327&a=985945&m=SE&u=https%3A%2F%2Fwww.neatsvor.se%2Fprodukt%2Fneatsvor-x500-robotdammsugare%2F',
  'Neatsvor_x600pro': 'https://addrevenue.io/t?c=3467327&a=985945&m=SE&u=https%3A%2F%2Fwww.neatsvor.se%2Fprodukt%2Fneatsvor-x600-pro-robotdammsugare-vit%2F',
  'Neatsvor_x650pro': 'https://addrevenue.io/t?c=3467327&a=985945&m=SE&u=https%3A%2F%2Fwww.neatsvor.se%2Fprodukt%2Fneatsvor-x650-pro-robotdammsugare%2F',

  // Addrevenue Dronarbutiken:
  'Dronarbutiken_air3s': 'https://addrevenue.io/t?c=3467327&a=987736&m=SE&u=https%3A%2F%2Fdronarbutiken.se%2Fproducts%2Fdji-air-3s-dji-rc-n3',

  // Addrevenue Robot-dammsugaren.se:
  'Robot-dammsugaren.se': 'https://addrevenue.io/t?a=985815&c=3467327&url=https%3A%2F%2Frobot-dammsugaren.se%2Fproducts%2Fjonr-x1-max',
  'Robot-dammsugaren.se_t5pro': 'https://addrevenue.io/t?a=985815&c=3467327&url=https%3A%2F%2Frobot-dammsugaren.se%2Fproducts%2Fjonr-t5-pro-gen-2',
  'Robot-dammsugaren.se_p20pro': 'https://addrevenue.io/t?c=3467327&a=985815&m=SE&u=https%3A%2F%2Frobot-dammsugaren.se%2Fproducts%2Fjonr-p20-pro',

  // Addrevenue Robotrent.se:
  'Robotrent.se': 'https://addrevenue.io/t?c=3467327&a=985383&m=SE&u=https%3A%2F%2Frobotrent.se%2Fproducts%2Fliectroux-l200-robotdammsugare-med-moppfunktion',
  'Robotrent.se_c30b': 'https://addrevenue.io/t?c=3467327&a=985383&m=SE&u=https%3A%2F%2Frobotrent.se%2Fproducts%2Fliectroux-c30b-robotdammsugare',

  // Addrevenue Nordenspa/Villanytt (poolrobotar):
  'Nordenspa': 'https://addrevenue.io/t?a=984922&c=3467327&url=https%3A%2F%2Fvillanytt.se%2Fprodukt-kategori%2Fpoolrobot%2F',
};
