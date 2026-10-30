# Rehace img/asesino/tira.png desde tools/hojas/asesino_*.jpg (split_sheet.py + build_sheet.py; solo recorta y desplaza)
# Uso (desde la raíz): python3 tools/tira_asesino.py [carpeta_temporal]. Las escalas (esc) deben coincidir con SPRITE_CLASE.asesino.
import subprocess, glob, shutil, sys, numpy as np
from collections import deque
from PIL import Image
S = sys.argv[1] if len(sys.argv) > 1 else "/tmp/tira_asesino"; T = f'{S}/todos'; shutil.rmtree(T, True); import os; os.makedirs(T)
HOJAS = [('ataque', 5, 4), ('sombra', 5, 4), ('golpe', 5, 3), ('carrera', 5, 3), ('reposo', 5, 2), ('punalada', 5, 4), ('preparacion', 4, 2)]
def limpiar(a):
    m = a[..., 3] > 0; H, W = m.shape
    for i in list(range(16)) + list(range(H - 16, H)):
        if m[i].mean() > .5: a[i, :, 3] = 0
    for j in list(range(16)) + list(range(W - 16, W)):
        if m[:, j].mean() > .5: a[:, j, 3] = 0
    m = a[..., 3] > 0; lab = np.zeros((H, W), bool)
    for y, x in zip(*np.nonzero(m)):
        if lab[y, x]: continue
        q = deque([(y, x)]); lab[y, x] = True; px = []
        while q:
            cy, cx = q.popleft(); px.append((cy, cx))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = cy + dy, cx + dx
                    if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and not lab[yy, xx]: lab[yy, xx] = True; q.append((yy, xx))
        ys = [p[0] for p in px]; xs = [p[1] for p in px]
        if len(px) < 40 or (max(ys) - min(ys) <= 4 and max(xs) - min(xs) > 30) or (max(xs) - min(xs) <= 4 and max(ys) - min(ys) > 30):
            for y, x in px: a[y, x, 3] = 0
    return a
fr = []
for h, c, r in HOJAS:
    subprocess.run(['python3', 'tools/split_sheet.py', f'tools/hojas/asesino_{h}.jpg', '--uniform', '--cols', str(c), '--rows', str(r),
                    '--inset', '3', '--names', h, '--out', f'{S}/fr_{h}'], check=True, capture_output=True)
    for f in sorted(glob.glob(f'{S}/fr_{h}/*.png')): fr.append((h, limpiar(np.array(Image.open(f)))))
esc = lambda i: .84 if i < 40 else .74 if i < 55 else .72 if i < 70 else .58 if i < 80 else .82 if i < 100 else .57
def suelo(a):   # pies apoyados: quita filas vacías bajo los pies
    return a[:np.nonzero((a[..., 3] > 0).any(1))[0].max() + 1]
def capucha(a):  # centro horizontal de la capucha (primeras filas), respecto del centro del cuadro
    m = a[..., 3] > 0; t = np.nonzero(m.any(1))[0].min(); xs = np.nonzero(m[t:t + 12].any(0))[0]
    return (xs.min() + xs.max()) / 2 - a.shape[1] / 2
def mover(a, d):
    b = np.zeros_like(a)
    if d > 0: b[:, d:] = a[:, :-d]
    elif d < 0: b[:, :d] = a[:, -d:]
    else: b = a
    return b
arr = [suelo(a) if h in ('reposo', 'preparacion') else a for h, a in fr]
# cuadros en su sitio: se alinean por la capucha con el reposo (a la escala de cada hoja)
QUIETOS = list(range(0, 11)) + [19] + list(range(33, 40)) + list(range(55, 70)) + list(range(70, 80)) + list(range(83, 87)) + list(range(100, 108))
ref = capucha(arr[70]) * esc(70)
for k in QUIETOS:
    d = int(round(ref / esc(k) - capucha(arr[k]))); arr[k] = mover(arr[k], d); print(k, d, end='  ')
for k, a in enumerate(arr): Image.fromarray(a).save(f'{T}/c_{k:03d}.png')
subprocess.run(['python3', 'tools/build_sheet.py', T, '--cols', str(len(arr)), '--cell', '325x357', '--anchor', 'bottom', '--bg', 'transparent',
                '--sep', '0', '--no-json', '--out', 'img/asesino/tira.png'], check=True)
