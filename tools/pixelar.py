#!/usr/bin/env python3
"""
pixelar.py - Convierte cuadros HD (PNG con transparencia) en pixel art con un proceso FIJO, igual para todos los cuadros
de un personaje: así todos caen en la misma rejilla y comparten paleta, y la animación no tiembla.

Es la ÚNICA reducción de tamaño permitida en los sprites (ver CLAUDE.md, Sprites). Se aplica después de recortar,
limpiar y alinear los cuadros HD, y antes de unirlos con build_sheet.py.

Proceso (por cuadro):
  1. Reduce el cuadro a factor / pix (factor = escala de su hoja en pantalla; pix = píxeles de pantalla por píxel de arte).
  2. Sube contraste y brillo (los personajes oscuros se empastan sin esto).
  3. Bordes duros: alfa 0 o 255.
  4. Contorno oscuro de 1 píxel alrededor de la silueta.
  5. Paleta común de N colores, calculada con todos los cuadros juntos, sin tramado.

Uso:
    python3 tools/pixelar.py entrada/ salida/                      # todos los PNG, factor 1
    python3 tools/pixelar.py entrada/ salida/ --pix 2 --colores 40 --factor 0.76
    python3 tools/pixelar.py entrada/ salida/ --ampliar            # además los guarda ampliados x pix (para mirarlos)

Desde Python (factor distinto por cuadro, p. ej. tools/tira_asesino.py):
    from pixelar import pixelar
    salida = pixelar([(imagen, factor), ...], pix=2, colores=40)

Requiere: pip install pillow numpy
"""
import argparse, glob, os
import numpy as np
from PIL import Image, ImageEnhance

PIX = 2            # píxeles de pantalla por píxel de arte (probado: 2 conserva cara y cuchillas; 3 empasta)
COLORES = 40       # paleta común por personaje
CONTRASTE, BRILLO = 1.25, 1.15
CONTORNO = (14, 12, 22, 255)


def reducir(im, factor, pix=PIX):
    im = im.convert('RGBA'); f = factor / pix
    im = im.resize((max(1, round(im.width * f)), max(1, round(im.height * f))), Image.LANCZOS)
    rgb = ImageEnhance.Brightness(ImageEnhance.Contrast(im.convert('RGB')).enhance(CONTRASTE)).enhance(BRILLO)
    a = np.array(im); a[..., :3] = np.array(rgb); a[..., 3] = np.where(a[..., 3] >= 128, 255, 0)
    m = a[..., 3] > 0; borde = np.zeros_like(m)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)): borde |= np.roll(np.roll(m, dy, 0), dx, 1)
    borde &= ~m; a[borde] = CONTORNO
    return Image.fromarray(a)


def pixelar(cuadros, pix=PIX, colores=COLORES):
    """cuadros: lista de (Image, factor). Devuelve los cuadros en pixel art (sin ampliar), con paleta común."""
    peq = [reducir(im, f, pix) for im, f in cuadros]
    muestra = Image.new('RGB', (sum(c.width for c in peq), max(c.height for c in peq)))
    x = 0
    for c in peq: muestra.paste(c.convert('RGB'), (x, 0), c); x += c.width
    pal = muestra.quantize(colores, method=Image.MEDIANCUT)
    out = []
    for c in peq:
        q = np.array(c.convert('RGB').quantize(palette=pal, dither=Image.NONE).convert('RGBA'))
        q[..., 3] = np.array(c)[..., 3]; out.append(Image.fromarray(q))
    return out


def main():
    ap = argparse.ArgumentParser(description='Cuadros HD -> pixel art (misma rejilla y paleta para todos)')
    ap.add_argument('entrada'); ap.add_argument('salida')
    ap.add_argument('--pix', type=int, default=PIX); ap.add_argument('--colores', type=int, default=COLORES)
    ap.add_argument('--factor', type=float, default=1.0, help='escala en pantalla de los cuadros HD (igual para todos)')
    ap.add_argument('--ampliar', action='store_true', help='guardar también ampliados x pix, sin suavizado')
    a = ap.parse_args()
    fs = sorted(glob.glob(os.path.join(a.entrada, '*.png'))); os.makedirs(a.salida, exist_ok=True)
    for f, im in zip(fs, pixelar([(Image.open(f), a.factor) for f in fs], a.pix, a.colores)):
        if a.ampliar: im = im.resize((im.width * a.pix, im.height * a.pix), Image.NEAREST)
        im.save(os.path.join(a.salida, os.path.basename(f)))
    print(f'{len(fs)} cuadros -> {a.salida} (pix {a.pix}, {a.colores} colores)')


if __name__ == '__main__':
    main()
