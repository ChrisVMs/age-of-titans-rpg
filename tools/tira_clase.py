#!/usr/bin/env python3
"""
tira_clase.py - Rehace img/<clase>/tira.png (y img/<clase>/efectos.png) desde tools/hojas/<clase>_*.jpg (Gemini, fondo
magenta). Solo recorta (split_sheet.py), limpia el fondo, desplaza y une (build_sheet.py): nada se reescala.
Las hojas tienen el personaje a tamaños distintos: el juego lo iguala con la escala de cada hoja (ESCALAS, que imprime
este script y debe copiarse a SPRITE_CLASE.<clase> en js/pantalla/12-vista-del-guerrero.js).
Una clase nueva = una entrada en CLASES (sus hojas en orden, efectos y desde qué cuadro de la derrota está tendida).

arquero: reposo 0-9 · ataque 10-19 · doble 20-29 · lluvia 30-39 · golpe 40-49 · derrota 50-64.
         efectos: 0 flecha · 1 doble flecha · 2 lluvia · 3 flechas clavadas.
maga:    reposo 0-9 · ataque 10-19 · bola 20-29 · lanza 30-39 · meteoro 40-49 · golpe 50-59 · derrota 60-74.
         efectos: 0 rayo ámbar · 1 bola de fuego · 2 lanza de hielo · 3 meteoro · 4 explosión.
Uso (desde la raíz): python tools/tira_clase.py <clase>
"""
import glob, os, shutil, subprocess, sys, tempfile
from collections import deque
import numpy as np
from PIL import Image

CLASES = {
    'arquero': {'hojas': [('reposo', 5, 2), ('ataque', 5, 2), ('doble', 5, 2), ('lluvia', 5, 2), ('golpe', 5, 2), ('derrota', 5, 3)],
                'efectos': 4, 'tumbado': 10},
    'maga':    {'hojas': [('reposo', 5, 2), ('ataque', 5, 2), ('bola', 5, 2), ('lanza', 5, 2), ('meteoro', 5, 2), ('golpe', 5, 2), ('derrota', 5, 3)],
                'efectos': 5, 'tumbado': 11},
}
CLASE = sys.argv[1] if len(sys.argv) > 1 else 'arquero'
C = CLASES[CLASE]; HOJAS = C['hojas']
PY = sys.executable
T = tempfile.mkdtemp()

def fondo(h):   # color del fondo de la hoja (esquina superior izquierda)
    return '%02X%02X%02X' % Image.open(f'tools/hojas/{CLASE}_{h}.jpg').convert('RGB').getpixel((4, 4))

def limpiar(a, personaje=True):   # quita el magenta que deja el croma (fondo y bordes) y lo que no sea el personaje
    r, g, b = (a[..., i].astype(int) for i in range(3))
    magenta = (np.minimum(r, b) > 90) & (g < .6 * np.minimum(r, b))
    a[magenta, 3] = 0
    borde = (a[..., 3] > 0) & (np.minimum(r, b) - g > 30)   # halo rosado en el contorno: se apaga el tinte
    tope = np.minimum(np.minimum(r, b), g + 30)
    a[borde, 0] = np.minimum(r, tope)[borde]; a[borde, 2] = np.minimum(b, tope)[borde]
    # restos sueltos pequeños (manchas del fondo, puntas de flecha de la celda vecina)
    if True:   # las líneas separadoras oscuras de la hoja (columnas o filas casi enteras de negro), si las dibujó
        oscuro = (a[..., :3].astype(int).sum(2) < 120) & (a[..., 3] > 0)
        borde = lambda i, n: i < 20 or i >= n - 20   # solo cerca del borde de la celda (los astiles horizontales no)
        for x in np.nonzero(oscuro.mean(0) > .3)[0]:
            if borde(x, a.shape[1]): a[:, max(0, x - 2):x + 3, 3] = 0
        for y in np.nonzero(oscuro.mean(1) > .3)[0]:
            if borde(y, a.shape[0]): a[max(0, y - 2):y + 3, :, 3] = 0
    m = a[..., 3] > 0; H, W = m.shape; visto = np.zeros((H, W), bool); trozos = []
    for y, x in zip(*np.nonzero(m)):
        if visto[y, x]: continue
        q = deque([(y, x)]); visto[y, x] = True; px = []
        while q:
            cy, cx = q.popleft(); px.append((cy, cx))
            for yy, xx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and not visto[yy, xx]: visto[yy, xx] = True; q.append((yy, xx))
        trozos.append(px)
    grande = max((len(p) for p in trozos), default=0)
    mayor = max(trozos, key=len) if trozos else [(0, 0)]
    caja = (min(q[0] for q in mayor), max(q[0] for q in mayor), min(q[1] for q in mayor), max(q[1] for q in mayor))
    for p in trozos:
        ys = [q[0] for q in p]; xs = [q[1] for q in p]
        # trozo fuera del personaje (flechas o puntas que vienen de la celda vecina): solo en las hojas con personaje
        al_borde = personaje and (min(xs) <= 3 or max(xs) >= W - 4 or min(ys) <= 3 or max(ys) >= H - 4)
        detras = personaje and max(xs) < caja[2]   # del todo a la espalda (mira a la derecha): restos de la celda anterior
        linea = (max(xs) - min(xs) <= 8 and max(ys) - min(ys) > 40) or (max(ys) - min(ys) <= 8 and max(xs) - min(xs) > 40)   # separador
        if len(p) < grande and (len(p) < max(60, grande * .01) or al_borde or detras or linea):
            for y, x in p: a[y, x, 3] = 0
    return a

def recortar(h, c, f, personaje=True):
    out = f'{T}/fr_{h}'
    subprocess.run([PY, 'tools/split_sheet.py', glob.glob(f'tools/hojas/{CLASE}_{h}.*')[0], '--uniform', '--cols', str(c), '--rows', str(f),
                    '--inset', '0', '--no-trim', '--key', fondo(h), '--names', h, '--out', out], check=True, capture_output=True)
    return [limpiar(np.array(Image.open(x).convert('RGBA')), personaje) for x in sorted(glob.glob(f'{out}/*.png'))]

def suelo(a):   # sin márgenes vacíos
    m = a[..., 3] > 0; f = np.nonzero(m.any(1))[0]; c = np.nonzero(m.any(0))[0]
    return a[f.min():f.max() + 1, c.min():c.max() + 1]

def pies(a):   # centro horizontal de los pies (últimas filas con contenido)
    m = a[..., 3] > 0; b = np.nonzero(m.any(1))[0].max(); xs = np.nonzero(m[b - 25:b + 1].any(0))[0]
    return (xs.min() + xs.max()) / 2

def capucha(a):   # centro horizontal de la cabeza (primeras filas con contenido)
    m = a[..., 3] > 0; t = np.nonzero(m.any(1))[0].min(); xs = np.nonzero(m[t:t + 20].any(0))[0]
    return (xs.min() + xs.max()) / 2

fr = []
for h, c, f in HOJAS: fr += [(h, suelo(x)) for x in recortar(h, c, f)]
# escala de cada hoja: igualar la altura del reposo (primer cuadro de cada hoja, de pie)
altura = {h: a.shape[0] for h, a in [fr[i] for i in range(0, len(fr))] if True}
alto0 = {}
for h, a in fr: alto0.setdefault(h, a.shape[0])
ESCALAS = {h: round(alto0['reposo'] / alto0[h], 3) for h in alto0}
# todos al mismo ancho, con la cabeza en el centro (lo que no esté de pie se deja centrado por su caja)
ANCHO = int(max(a.shape[1] for _, a in fr) * 1.3); ALTO = max(a.shape[0] for _, a in fr) + 8
os.makedirs(f'{T}/todos')
for k, (h, a) in enumerate(fr):
    lienzo = np.zeros((a.shape[0], ANCHO, 4), np.uint8)
    tumbado = h == 'derrota' and k - [x for x, _ in fr].index('derrota') >= C['tumbado']   # cuadros de la derrota en el suelo
    # el golpe se alinea por los pies (por la cabeza, los pies se deslizaban al echarse atrás): pies como en el reposo
    x0 = ((ANCHO - a.shape[1]) // 2 if tumbado else int(round(ANCHO / 2 - capucha(fr[0][1]) + pies(fr[0][1]) - pies(a))) if h == 'golpe'
          else int(round(ANCHO / 2 - capucha(a))))
    x0 = max(0, min(ANCHO - a.shape[1], x0)); lienzo[:, x0:x0 + a.shape[1]] = a
    Image.fromarray(lienzo).save(f'{T}/todos/{k:03d}.png')
os.makedirs(f'img/{CLASE}', exist_ok=True)
subprocess.run([PY, 'tools/build_sheet.py', f'{T}/todos', '--cols', str(len(fr)), '--cell', f'{ANCHO}x{ALTO}', '--anchor', 'bottom', '--bg', 'transparent',
                '--sep', '0', '--no-json', '--out', f'img/{CLASE}/tira.png'], check=True)
# efectos: una fila (sin alinear)
ef = recortar('efectos', C['efectos'], 1, False); EA = max(a.shape[1] for a in ef) + 8; EH = max(a.shape[0] for a in ef) + 8
os.makedirs(f'{T}/ef')
for k, a in enumerate(ef): Image.fromarray(a).save(f'{T}/ef/{k}.png')
subprocess.run([PY, 'tools/build_sheet.py', f'{T}/ef', '--cols', str(C['efectos']), '--cell', f'{EA}x{EH}', '--anchor', 'center', '--bg', 'transparent',
                '--sep', '0', '--no-json', '--out', f'img/{CLASE}/efectos.png'], check=True)
shutil.rmtree(T)
print(f'tira: {len(fr)} cuadros, celda {ANCHO}x{ALTO} · efectos: celda {EA}x{EH}')
print('ESCALAS (por hoja, relativas al reposo):', ESCALAS)
