#!/usr/bin/env python3
"""
Bygger robotjakts logotyp-SVG:er.

Märket kommer från ChatGPT (raster) och vektoriseras med potrace, en gång per
färg, så resultatet blir en riktig tvåfärgs-vektor utan inbäddad bitmap.
Wordmark och tagline sätts som exakta glyfkonturer ur Archivo (sitens egen
display-font), inte som <text>, så filen renderar identiskt överallt utan att
fonten behöver finnas.

Ut:
  logo.svg        full låsning, ljus text (för mörk header/footer)
  logo-dark.svg   full låsning, mörk text (för ljus bakgrund)
  logo-icon.svg   bara märket
"""
import json
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image

WORK = Path('/tmp/rj-logo')
GRAFIT = '#1B222B'
KOPPAR = '#AA5910'
VIT = '#FFFFFF'


def split_colors(src: Path):
    """Dela märket i två svartvita masker, en per logofärg."""
    im = Image.open(src).convert('RGB')
    w, h = im.size
    px = im.load()

    def mask(pred, out):
        m = Image.new('1', (w, h), 1)  # 1 = vitt = bakgrund för potrace
        mp = m.load()
        hits = 0
        for y in range(h):
            for x in range(w):
                if pred(*px[x, y]):
                    mp[x, y] = 0
                    hits += 1
        m.save(out)
        return hits

    # Grafit: mörkt och lågmättat. Koppar: tydligt varmt, r klart > b.
    dark = mask(lambda r, g, b: max(r, g, b) < 120 and (max(r, g, b) - min(r, g, b)) < 60,
                WORK / 'mask-grafit.pbm')
    warm = mask(lambda r, g, b: r > 110 and r - b > 55 and g < r - 20,
                WORK / 'mask-koppar.pbm')
    print(f'  maskpixlar: grafit={dark}, koppar={warm}')
    return dark, warm


def trace(pbm: Path, out_svg: Path):
    subprocess.run(
        ['potrace', '-s', '-o', str(out_svg), '--flat', '-t', '4', '-a', '1.0',
         '-O', '0.2', str(pbm)],
        check=True)
    return out_svg


def paths_from(svg: Path):
    """Plocka ut path-d och viewBox ur potrace-utdata."""
    s = svg.read_text()
    vb = re.search(r'viewBox="([^"]+)"', s)
    tr = re.search(r'<g([^>]*)>', s)
    ds = re.findall(r'\sd="([^"]+)"', s)
    return vb.group(1) if vb else None, (tr.group(1) if tr else ''), ds


def glyph_paths(spec: dict, size: float, x0: float, y0: float, tracking: float = 0.0):
    """Glyfkonturer -> SVG-paths, skalade och placerade. y flippas (font-y är upp)."""
    upem = spec['upem']
    k = size / upem
    out = []
    x = x0
    for g in spec['glyphs']:
        if g['d'].strip():
            out.append(
                f'<path transform="translate({x:.2f} {y0:.2f}) scale({k:.6f} {-k:.6f})" d="{g["d"]}"/>'
            )
        x += g['adv'] * k + tracking
    return out, x - x0 - tracking


def main():
    mark = WORK / 'mark.png'
    if not mark.exists():
        sys.exit('mark.png saknas')

    print('1. delar upp märket i färgmasker')
    split_colors(mark)

    print('2. vektoriserar')
    vb_g, _, d_grafit = paths_from(trace(WORK / 'mask-grafit.pbm', WORK / 'v-grafit.svg'))
    vb_k, _, d_koppar = paths_from(trace(WORK / 'mask-koppar.pbm', WORK / 'v-koppar.svg'))
    print(f'  grafit: {len(d_grafit)} paths, koppar: {len(d_koppar)} paths')

    # potrace ger samma yta för båda maskerna (samma källbild), så en gemensam
    # transform räcker. Höjden hämtas ur viewBoxen.
    vw, vh = [float(v) for v in vb_g.split()[2:4]]
    # potrace lägger geometrin i 10x skala med flippad y och uttrycker det i en
    # egen <g transform>. Den MÅSTE följa med, annars hamnar paths utanför ytan.
    _, ptr_attrs, _ = paths_from(WORK / 'v-grafit.svg')
    m = re.search(r'transform="([^"]+)"', ptr_attrs)
    PTR = m.group(1)
    print(f'  märkets vektoryta: {vw:.0f} x {vh:.0f}, potrace-transform: {PTR}')

    wm = json.loads((WORK / 'wm.json').read_text())
    tag = json.loads((WORK / 'tag.json').read_text())

    # Layout i slutliga SVG-enheter
    H = 120.0                 # total höjd; headern visar loggan 40 px hög
    MARK = 104.0
    MARK_X, MARK_Y = 4.0, (H - MARK) / 2
    GAP = 20.0
    WM_SIZE = 82.0
    text_x = MARK_X + MARK + GAP
    wm_baseline = 88.0

    wm_paths, wm_w = glyph_paths(wm, WM_SIZE, text_x, wm_baseline, tracking=-1.2)
    tag_paths, tag_w = [], 0
    total_w = text_x + wm_w + 8
    print(f'  wordmark {wm_w:.0f} u, tagline {tag_w:.0f} u, total {total_w:.0f} x {H:.0f}')

    mark_scale = MARK / vh
    mark_g = (f'<g transform="translate({MARK_X:.2f} {MARK_Y:.2f}) '
              f'scale({mark_scale:.6f})">')

    def lockup(text_color: str, out: Path, tag_color: str):
        body = GRAFIT if text_color != VIT else VIT
        parts = [
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total_w:.0f} {H:.0f}" '
            f'width="{total_w:.0f}" height="{H:.0f}" role="img" aria-label="Robotjakt.se">',
            mark_g,
            f'<g transform="{PTR}">',
            f'<g fill="{body}">' + ''.join([f'<path d="{d}"/>' for d in d_grafit]) + '</g>',
            f'<g fill="{KOPPAR}">' + ''.join([f'<path d="{d}"/>' for d in d_koppar]) + '</g>',
            '</g>',
            '</g>',
            f'<g fill="{text_color}">' + ''.join(wm_paths) + '</g>',
            f'<g fill="{tag_color}">' + ''.join(tag_paths) + '</g>',
            '</svg>',
        ]
        out.write_text(''.join(parts))
        print(f'  skrev {out.name} ({out.stat().st_size // 1024} KB)')

    print('3. skriver låsningar')
    lockup(VIT, WORK / 'logo.svg', 'rgba(255,255,255,0.72)')
    lockup(GRAFIT, WORK / 'logo-dark.svg', 'rgba(27,34,43,0.68)')

    # Bara märket, kvadratiskt
    icon = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vw:.0f} {vh:.0f}" '
            f'width="{vw:.0f}" height="{vh:.0f}" role="img" aria-label="Robotjakt">'
            + f'<g transform="{PTR}">'
            + f'<g fill="{GRAFIT}">' + ''.join([f'<path d="{d}"/>' for d in d_grafit]) + '</g>'
            + f'<g fill="{KOPPAR}">' + ''.join([f'<path d="{d}"/>' for d in d_koppar]) + '</g>'
            + '</g></svg>')
    (WORK / 'logo-icon.svg').write_text(icon)
    print(f'  skrev logo-icon.svg ({(WORK / "logo-icon.svg").stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
