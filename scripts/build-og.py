#!/usr/bin/env python3
"""
Bygger robotjakts OG-bild och resterande ikonstorlekar från den nya logotypen.

Texten sätts som exakta Archivo-glyfkonturer (samma teknik som logotypen), så
OG-bilden renderar identiskt oavsett vilka fonter som finns på maskinen som
bygger den. Ingen <text> och ingen rasterlogga inbäddad.
"""
import json
import re
import subprocess
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

WORK = Path('/tmp/rj-logo')
GRAFIT = '#1B222B'
GRAFIT_DJUP = '#11161E'
KOPPAR = '#AA5910'
KOPPAR_LJUS = '#E29D56'

W, H = 1200, 630


def glyphs(text: str, weight: int):
    font = instancer.instantiateVariableFont(TTFont(WORK / 'archivo.ttf'),
                                             {'wght': weight, 'wdth': 100})
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    out, x = [], 0.0
    for ch in text:
        gname = cmap.get(ord(ch))
        if gname is None:
            continue
        pen = SVGPathPen(gs)
        gs[gname].draw(pen)
        out.append({'d': pen.getCommands(), 'x': x, 'adv': gs[gname].width})
        x += gs[gname].width
    return {'upem': font['head'].unitsPerEm, 'glyphs': out, 'width': x}


def place(spec, size, x0, baseline, tracking=0.0, fill='#fff'):
    k = size / spec['upem']
    parts, x = [], x0
    for g in spec['glyphs']:
        if g['d'].strip():
            parts.append(f'<path transform="translate({x:.2f} {baseline:.2f}) '
                         f'scale({k:.6f} {-k:.6f})" d="{g["d"]}" fill="{fill}"/>')
        x += g['adv'] * k + tracking
    return ''.join(parts), x - x0 - tracking


def text_width(spec, size, tracking=0.0):
    return spec['width'] * size / spec['upem'] + tracking * (len(spec['glyphs']) - 1)


def main():
    # Märket, återanvänt ur den byggda ikonen (samma vektor som logotypen)
    icon = (WORK / 'logo-icon.svg').read_text()
    ptr = re.search(r'<g transform="([^"]+)"', icon).group(1)
    vb = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', icon)
    ivw, ivh = float(vb.group(1)), float(vb.group(2))
    grafit_paths = re.search(r'<g fill="#1B222B">(.*?)</g>', icon, re.S).group(1)
    koppar_paths = re.search(r'<g fill="#AA5910">(.*?)</g>', icon, re.S).group(1)

    wm = glyphs('ROBOTJAKT.SE', 800)
    rad = glyphs('Vi jämför och rankar robotar', 700)
    kat = glyphs('Robotdammsugare  ·  Robotgräsklippare  ·  Poolrobot  ·  Drönare', 600)

    # Låsning centrerad horisontellt: märke + wordmark som en enhet
    MARK = 132.0
    GAP = 30.0
    WM = 104.0
    wm_w = text_width(wm, WM, -1.4)
    lock_w = MARK + GAP + wm_w
    lock_x = (W - lock_w) / 2
    lock_y = 196.0                      # märkets övre kant

    RAD = 44.0
    KAT = 26.0
    rad_w = text_width(rad, RAD, 0)
    kat_w = text_width(kat, KAT, 0)

    mark_scale = MARK / ivh
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
        f'<rect width="{W}" height="{H}" fill="{GRAFIT}"/>',
        # Lugn kopparaccent: en tunn linje i botten, inget dekorativt brus
        f'<rect x="0" y="{H-8}" width="{W}" height="8" fill="{KOPPAR}"/>',
        # Märket
        f'<g transform="translate({lock_x:.2f} {lock_y:.2f}) scale({mark_scale:.6f})">',
        f'<g transform="{ptr}">',
        f'<g fill="#FFFFFF">{grafit_paths}</g>',
        f'<g fill="{KOPPAR_LJUS}">{koppar_paths}</g>',
        '</g></g>',
    ]
    wm_paths, _ = place(wm, WM, lock_x + MARK + GAP, lock_y + MARK * 0.80, -1.4, '#FFFFFF')
    parts.append(wm_paths)

    rad_paths, _ = place(rad, RAD, (W - rad_w) / 2, 412.0, 0, '#FFFFFF')
    parts.append(rad_paths)

    kat_paths, _ = place(kat, KAT, (W - kat_w) / 2, 472.0, 0, 'rgba(255,255,255,0.62)')
    parts.append(kat_paths)

    parts.append('</svg>')
    svg = WORK / 'og-default.svg'
    svg.write_text(''.join(parts))
    print(f'og-default.svg: {svg.stat().st_size // 1024} KB, låsbredd {lock_w:.0f} px')

    subprocess.run(['rsvg-convert', '-w', str(W), '-h', str(H), str(svg),
                    '-o', str(WORK / 'og-default.png')], check=True)
    # JPG för maximal plattformskompatibilitet, WebP för storlek
    subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '82',
                    str(WORK / 'og-default.png'), '--out', str(WORK / 'og-default.jpg')],
                   check=True, capture_output=True)
    subprocess.run(['cwebp', '-q', '86', str(WORK / 'og-default.png'),
                    '-o', str(WORK / 'og-default.webp')], check=True, capture_output=True)
    for f in ('og-default.png', 'og-default.jpg', 'og-default.webp'):
        print(f'  {f}: {(WORK / f).stat().st_size // 1024} KB')

    # Resterande ikonstorlekar
    tile = WORK / 'logo-icon-tile.svg'
    for size, name in ((16, 'favicon-16x16.png'), (48, 'favicon-48x48.png')):
        subprocess.run(['rsvg-convert', '-w', str(size), '-b', 'white',
                        str(WORK / 'logo-icon.svg'), '-o', str(WORK / name)], check=True)
        print(f'  {name}: {(WORK / name).stat().st_size} B')
    # Maskable: extra marginal så Android kan beskära utan att klippa märket
    m = tile.read_text().replace(f'viewBox="0 0 {ivw:.0f} {ivh:.0f}"',
                                 f'viewBox="{-ivw*0.14:.0f} {-ivh*0.14:.0f} {ivw*1.28:.0f} {ivh*1.28:.0f}"')
    (WORK / 'logo-icon-maskable.svg').write_text(m)
    subprocess.run(['rsvg-convert', '-w', '512', str(WORK / 'logo-icon-maskable.svg'),
                    '-o', str(WORK / 'icon-512-maskable.png')], check=True)
    print(f'  icon-512-maskable.png: {(WORK / "icon-512-maskable.png").stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
