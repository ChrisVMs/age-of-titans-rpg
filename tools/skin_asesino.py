#!/usr/bin/env python3
"""
skin_asesino.py - Recorta una animación de una skin del Asesino a img/asesino/skins/<skin>/<animacion>_NN.png.
Usa split_sheet.py (sin reescalar); quita separadores y motas sueltas, descarta celdas vacías y deja todos los cuadros
del mismo tamaño, centrados y con los pies en la misma línea. Además deja <animacion>.gif para revisarla.

Uso (desde la raíz):  python3 tools/skin_asesino.py espectro ataque tools/hojas/asesino_espectro_ataque.jpg 5 2 [ms]
"""
import glob, os, subprocess, sys, tempfile
from collections import deque
import numpy as np
from PIL import Image

skin, anim, hoja, cols, filas = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
ms = int(sys.argv[6]) if len(sys.argv) > 6 else 140
dest = f'img/asesino/skins/{skin}'; os.makedirs(dest, exist_ok=True)
for f in glob.glob(f'{dest}/{anim}_*.png'): os.remove(f)
tmp = tempfile.mkdtemp()
subprocess.run(['python3', 'tools/split_sheet.py', hoja, '--cols', cols, '--rows', filas, '--uniform', '--out', tmp], check=True, capture_output=True)

def sin_motas(a, minimo=300):
    m = a[..., 3] > 40; H, W = m.shape; vis = np.zeros_like(m)
    for y0, x0 in zip(*np.nonzero(m)):
        if vis[y0, x0]: continue
        q, zona = deque([(y0, x0)]), []; vis[y0, x0] = True
        while q:
            y, x = q.popleft(); zona.append((y, x))
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and not vis[yy, xx]: vis[yy, xx] = True; q.append((yy, xx))
        if len(zona) < minimo:
            for y, x in zona: a[y, x, 3] = 0
    return a

cuadros = []
for f in sorted(glob.glob(f'{tmp}/*.png')):
    a = np.array(Image.open(f).convert('RGBA'))
    for _ in range(3):   # separadores de la rejilla pegados al borde
        m = a[..., 3] > 40
        if m.sum() < 2000: break
        ys, xs = np.nonzero(m); a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1].copy(); m = a[..., 3] > 40; H, W = m.shape
        for j in [*range(min(6, W)), *range(max(0, W - 6), W)]:
            if m[:, j].mean() > .6: a[:, j, 3] = 0
        for i in [*range(min(6, H)), *range(max(0, H - 6), H)]:
            if m[i].mean() > .6: a[i, :, 3] = 0
    a = sin_motas(a)
    if (a[..., 3] > 40).sum() < 2000: continue   # celda vacía
    im = Image.fromarray(a); cuadros.append(im.crop(im.getbbox()))
mw = max(c.width for c in cuadros); mh = max(c.height for c in cuadros); gif = []
for k, c in enumerate(cuadros):
    lienzo = Image.new('RGBA', (mw, mh)); lienzo.paste(c, ((mw - c.width) // 2, mh - c.height)); lienzo.save(f'{dest}/{anim}_{k:02d}.png')
    fondo = Image.new('RGB', (mw, mh), (40, 40, 60)); fondo.paste(lienzo, (0, 0), lienzo); gif.append(fondo)
gif[0].save(f'{tmp}/{anim}.gif', save_all=True, append_images=gif[1:], duration=ms, loop=0)
print(f'{len(cuadros)} cuadros -> {dest}/{anim}_NN.png ({mw}x{mh}); vista: {tmp}/{anim}.gif')
