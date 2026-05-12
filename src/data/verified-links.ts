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
 */

export const VERIFIED_LINKS: Record<string, string> = {
  // Robotjakt har 100% feed-täckning (alla 8 Adtraction-brands + 8 Addrevenue
  // har feeds). Inga generic-fallbacks behövs.
};
