# Topikalkarta — Robotjakt.se

Komplett topikalkarta for alla robotkategorier pa Robotjakt.se.
Intern länkstruktur: alla kluster-sidor länkar till sin pillar page, alla pillar pages länkar till varandra, startsidan länkar till alla pillar pages.

---

## Startsida

- `/` — Startsida / Alla konsumentrobotar
  - Presenterar alla kategorier (robotdammsugare, robotgräsklippare, poolrobotar)
  - Länkar till alla pillar pages
  - Visar topplista robotdammsugare (primärt kluster)

---

## Robotdammsugare (befintligt kluster)

### Pillar page
- `/` (alias `/robotdammsugare/`) — Bästa robotdammsugare 2026 — topplista, köpguide, FAQ

### Kluster-sidor
- `/kopguide-robotdammsugare/` — Köpguide robotdammsugare (allt du behöver veta innan köp)
- `/robotdammsugare-med-mopp/` — Bästa robotdammsugare med mopp 2026
- `/robotdammsugare-husdjur/` — Bästa robotdammsugare for husdjur 2026
- `/billigaste-robotdammsugare/` — Billigaste robotdammsugare 2026 (budget under 4 000 kr)

### Recensioner (befintliga)
- `/dreame-x40-ultra/` — Dreame X40 Ultra recension
- `/roborock-s8-maxv-ultra/` — Roborock S8 MaxV Ultra recension
- `/roborock-qrevo-master/` — Roborock Qrevo Master recension

### Recensioner (planerade)
- `/dreame-l20-ultra/` — Dreame L20 Ultra recension
- `/ecovacs-deebot-x5-omni/` — Ecovacs Deebot X5 Omni recension

---

## Robotgräsklippare (nytt kluster)

### Pillar page
- `/robotgrasklippare/` — Bästa robotgräsklippare 2026 — topplista, köpguide, FAQ
  - Intern länkning: länkar till alla kluster-sidor nedan + till startsidan + till /robotdammsugare/

### Kluster-sidor
- `/kopguide-robotgrasklippare/` — Köpguide robotgräsklippare (slinga vs GPS, installation, underhall)
- `/robotgrasklippare-utan-slinga/` — Bästa robotgräsklippare utan slinga 2026 (GPS-baserade)
- `/billigaste-robotgrasklippare/` — Billigaste robotgräsklippare 2026 (under 10 000 kr)

### Recensioner (planerade)
- `/husqvarna-automower-430x/` — Husqvarna Automower 430X recension
- `/husqvarna-automower-315x/` — Husqvarna Automower 315X recension
- `/gardena-sileno-city-500/` — Gardena Sileno City 500 recension
- `/worx-landroid-m500/` — Worx Landroid M500 recension
- `/mammotion-luba-awo-3000/` — Mammotion Luba AWO 3000 recension (utan slinga, GPS)

---

## Poolrobot (nytt kluster)

### Pillar page
- `/poolrobot/` — Bästa poolrobot 2026 — topplista, köpguide, FAQ
  - Intern länkning: länkar till kluster-sidor nedan + till startsidan + till andra pillar pages

### Kluster-sidor
- `/kopguide-poolrobot/` — Köpguide poolrobot (pooltyp, storlek, funktioner)

### Recensioner (planerade)
- `/dolphin-e30/` — Dolphin E30 recension
- `/zodiac-tornax-ot2030/` — Zodiac Tornax OT2030 recension

---

## Fönsterputsrobot (framtida kluster)

### Pillar page / guide
- `/fonsterputsrobot/` — Guide: Bästa fönsterputsrobot 2026

### Recensioner (planerade)
- `/ecovacs-winbot-w2-omni/` — Ecovacs Winbot W2 Omni recension

---

## Intern länkstruktur — regler

1. Alla recensionssidor länkar upp till sin pillar page (t.ex. `/dreame-x40-ultra/` → `/`)
2. Alla kluster-sidor länkar upp till sin pillar page
3. Alla pillar pages länkar till varandra (korskorslänkning mellan kategorier)
4. Startsidan (`/`) länkar till alla pillar pages
5. Informationssidor och köpguider länkar till relevanta topplistor/money pages
6. Nya sidor som skapas: lagg alltid till intern länk fran minst en befintlig sida

---

## Prioriteringsordning for innehallsproduktion

1. `/robotgrasklippare/` — Pillar page (hög sökordsvolym, ny kategori)
2. `/kopguide-robotgrasklippare/` — Stödjer pillar page
3. `/robotgrasklippare-utan-slinga/` — Slingfria modeller är trendig sökning
4. `/billigaste-robotgrasklippare/` — Köpintent, hög konvertering
5. Recensioner: Husqvarna Automower 430X, 315X (mest sökta modellerna)
6. `/poolrobot/` — Pillar page
7. `/kopguide-poolrobot/` — Stödjer pillar page
8. Poolrobotrecensioner: Dolphin E30, Zodiac Tornax OT2030
9. `/fonsterputsrobot/` — Lägre prioritet, mindre sökvolym
