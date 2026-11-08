#!/usr/bin/env python3
"""
despiezar.py - MVP de esqueleto 2D: corta un cuadro del reposo del Asesino (asesino_reposo.png, casilla 70 de
img/asesino/tira.png) en piezas con polígonos (coordenadas del cuadro de 325x357) y guarda cada pieza y su punto de giro.
Las piezas son exclusivas (cada píxel va a la primera pieza cuyo polígono lo contiene, en el orden de PIEZAS) y se
ensanchan 2 px sobre las vecinas para que no se vean costuras al rotarlas.

Uso (desde la raíz):  python prototipos/esqueleto/despiezar.py      -> prototipos/esqueleto/piezas/*.png + piezas.js
"""
import json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

D = os.path.dirname(os.path.abspath(__file__))
SRC = Image.open(f'{D}/asesino_reposo.png').convert('RGBA'); W, H = SRC.size
# nombre, polígono (en orden de prioridad: lo que va delante primero), punto de giro, padre
PIEZAS = [
    # las dagas, piezas propias con su muñeca: se orientan aparte del antebrazo y se pueden ocultar (en el ataque la mano
    # delantera va vacía: el filo es el tajo)
    ('dagaD', [(232, 212), (322, 220), (322, 264), (232, 258)], (228, 238), 'antebrazoD'),
    ('dagaI', [(128, 222), (218, 244), (218, 272), (128, 258)], (122, 240), 'antebrazoI'),
    ('brazoD', [(196, 128), (240, 128), (246, 205), (322, 210), (322, 262), (214, 262), (196, 250)], (214, 142), 'torso'),
    ('brazoI', [(98, 134), (138, 134), (140, 254), (100, 256), (96, 210)], (118, 148), 'torso'),   # sin la capa de detrás
    ('cabeza', [(118, 40), (215, 40), (215, 130), (196, 138), (138, 138), (118, 130)], (166, 128), 'torso'),
    ('piernaD', [(166, 262), (250, 262), (250, 357), (166, 357)], (190, 262), 'raiz'),
    ('piernaI', [(96, 262), (166, 262), (166, 357), (96, 357)], (138, 262), 'raiz'),
    ('torso', [(118, 118), (212, 118), (214, 266), (116, 266)], (165, 255), 'raiz'),
    ('capa', [(40, 100), (135, 100), (135, 357), (40, 357)], (124, 130), 'torso'),
]
ORDEN = ['capa', 'piernaI', 'piernaD', 'torso', 'brazoI', 'dagaI', 'cabeza', 'brazoD', 'dagaD']   # de atrás hacia delante al dibujar
RAIZ = (165, 262)   # caderas: lo que se desplaza en el ataque

a = np.asarray(SRC); libre = a[..., 3] > 0; asignado = np.zeros((H, W), int) - 1
fi = a.astype(int); filo = (fi[..., 2] > 120) & (fi[..., 2] - fi[..., 0] > 12) & (fi[..., :3].sum(2) > 330)   # acero claro de las hojas
filo = np.asarray(Image.fromarray((filo * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0   # + su contorno oscuro
for k, (n, poli, *_ ) in enumerate(PIEZAS):
    m = Image.new('L', (W, H)); ImageDraw.Draw(m).polygon(poli, fill=255); m = (np.asarray(m) > 0) & libre & (asignado < 0)
    if n == 'dagaD': m &= filo | (np.arange(W)[None, :] > 238)   # delante de la mano todo es daga (si no, su contorno quedaba en el brazo)
    elif n.startswith('daga'): m &= filo   # la daga: solo la hoja (el polígono también pisa cinturón y piernas)
    asignado[m] = k
# ---- lo oculto: detrás de los brazos no hay dibujo. Se borran los brazos y se rellena ese hueco con los colores de
# alrededor (dentro de la silueta del cuerpo), y capa, torso y piernas salen de esa imagen; los brazos, de la original ----
BRAZOS = ('brazoD', 'brazoI', 'dagaD', 'dagaI'); kb = [i for i, p in enumerate(PIEZAS) if p[0] in BRAZOS]
brazos = np.isin(asignado, kb); cuerpo = libre & ~brazos
cerrar = lambda m, n: np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(n)).filter(ImageFilter.MinFilter(n))) > 0
hueco = brazos & cerrar(cuerpo, 71)   # lo que tapaban los brazos dentro del cuerpo (no la daga sobre el fondo)
fondo = a.astype(float).copy(); conocido = cuerpo.astype(float)
for r in (2, 4, 8, 16, 32):   # relleno por difusión: media de los vecinos conocidos, de cerca a lejos
    pesoc = np.asarray(Image.fromarray((conocido * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(float) / 255
    for c in range(3):
        canal = np.asarray(Image.fromarray((fondo[..., c] * conocido).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(float)
        nuevo = hueco & (conocido == 0) & (pesoc > .05); fondo[..., c][nuevo] = (canal / np.maximum(pesoc, 1e-3))[nuevo]
    nuevo = hueco & (conocido == 0) & (pesoc > .05); fondo[..., 3][nuevo] = 255; conocido[nuevo] = 1
fondo = fondo.clip(0, 255).astype(np.uint8); con_fondo = cuerpo | hueco
asignado2 = np.zeros((H, W), int) - 1   # piezas del cuerpo sobre la imagen rellenada
for k, (n, poli, *_ ) in enumerate(PIEZAS):
    if n in BRAZOS: continue
    m = Image.new('L', (W, H)); ImageDraw.Draw(m).polygon(poli, fill=255); m = (np.asarray(m) > 0) & con_fondo & (asignado2 < 0)
    asignado2[m] = k
falta = con_fondo & (asignado2 < 0)   # relleno fuera de todo polígono: al torso
asignado2[falta] = [p[0] for p in PIEZAS].index('torso')
Image.fromarray(fondo).save(f'{D}/fondo_rellenado.png')
os.makedirs(f'{D}/piezas', exist_ok=True); datos = {'ancho': W, 'alto': H, 'raiz': RAIZ, 'orden': ORDEN, 'piezas': {}}
colores = [(255, 140, 0), (0, 160, 255), (230, 80, 80), (80, 200, 80), (80, 120, 230), (230, 200, 60), (200, 80, 200), (60, 200, 200), (160, 160, 160)]
mapa = np.zeros((H, W, 4), np.uint8)
for k, (n, poli, giro, padre) in enumerate(PIEZAS):
    asig, src = (asignado, a) if n in BRAZOS else (asignado2, fondo)
    m = Image.fromarray(((asig == k) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))   # +2 px de solape
    m = np.asarray(m) > 0
    p = src.copy(); p[~m] = 0; im = Image.fromarray(p); bb = im.getbbox(); im.crop(bb).save(f'{D}/piezas/{n}.png')
    datos['piezas'][n] = {'x': bb[0], 'y': bb[1], 'giro': giro, 'padre': padre}
    mapa[asignado == k] = (*colores[k], 255)
# ---- malla: el dibujo entero (sin recortar) con una rejilla de triángulos; cada vértice sigue a los huesos con pesos
# suaves (el mapa de piezas difuminado), así hombros, cintura y capa se doblan sin que se vea el corte ----
PASO, SUAVE = 9, 9          # separación de la rejilla y desenfoque de los pesos (px del cuadro)
DAGAS = ('dagaD', 'dagaI')
RIGIDOS, RIGIDO_DESDE = ('brazoD', 'brazoI'), 12   # piezas con arma: rígidas a partir de esta distancia del hombro (con 34, un giro de 100° estiraba la franja)
GIROS = {p[0]: p[2] for p in PIEZAS}
CAPA_BAJO = (96, 236)       # 2.º hueso de la capa: de aquí abajo se dobla aparte (hijo de 'capa')
datos['piezas']['capaBajo'] = {'giro': CAPA_BAJO, 'padre': 'capa'}
# codos y rodillas: 2.º hueso de cada brazo y pierna (la mano y la daga van con el antebrazo; el pie con la espinilla)
ARTIC = {'antebrazoD': ((222, 195), 'brazoD'), 'antebrazoI': ((112, 195), 'brazoI'),
         'espinillaI': ((136, 300), 'piernaI'), 'espinillaD': ((196, 300), 'piernaD')}
for n, (g, padre) in ARTIC.items(): datos['piezas'][n] = {'giro': g, 'padre': padre}
def repartir(w, x, y):   # pasa al 2.º hueso la parte de cada miembro que queda más allá de su articulación
    for hijo, (g, padre) in ARTIC.items():
        if padre not in w: continue
        if padre.startswith('brazo'):   # a lo largo del brazo: hombro -> codo
            hx, hy = GIROS[padre]; vx, vy = g[0] - hx, g[1] - hy; t = ((x - hx) * vx + (y - hy) * vy) / (vx * vx + vy * vy)
            s = min(1, max(0, (t - .8) / .4))
        else: s = min(1, max(0, (y - (g[1] - 12)) / 24))   # pierna: por la altura de la rodilla
        c = w.pop(padre); w[padre] = c * (1 - s); w[hijo] = c * s
    return w
nombres = [p[0] for p in PIEZAS]
borr = {n: np.asarray(Image.fromarray((((asignado if n in BRAZOS else asignado2) == k) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(SUAVE))).astype(float)
        for k, n in enumerate(nombres)}
# una malla por pieza (como los «attachments» de Spine): con una sola malla, los triángulos que unían la daga con el
# cuerpo de debajo se estiraban al girar el brazo. Cada pieza: su rejilla, su textura (piezas/<n>.png) y pesos suaves
def pesos_de(x, y, pieza):
    if pieza in DAGAS: return {pieza: 1}   # la daga es rígida: solo sigue a su muñeca
    w = {n: borr[n][y, x] for n in nombres if n not in DAGAS and (pieza in RIGIDOS or n not in RIGIDOS)}; s = sum(w.values())   # el resto no sigue a los brazos (giran mucho)
    # brazos con daga: lejos del hombro obedecen solo a su brazo; cerca del hombro se mezclan (la unión se dobla sin corte)
    k = asignado[y, x]
    if pieza in RIGIDOS and np.hypot(x - GIROS[pieza][0], y - GIROS[pieza][1]) > RIGIDO_DESDE:   # según su malla, no según el píxel
        w = {pieza: 1}; s = 1
    if s < 1e-3: return {nombres[k] if k >= 0 else 'torso': 1}
    w = {n: v / s for n, v in w.items() if v / s > .02}; t = sum(w.values()); w = {n: v / t for n, v in w.items()}
    w = repartir(w, x, y)
    if 'capa' in w:   # la capa se reparte entre sus dos huesos según la altura
        k2 = min(1, max(0, (y - 190) / 90)); c = w.pop('capa'); w['capa'] = c * (1 - k2); w['capaBajo'] = c * k2
    return {n: round(v, 3) for n, v in w.items() if v > 0}
mallas = []
for n in ORDEN:
    k = nombres.index(n); P = datos['piezas'][n]
    m = np.asarray(Image.fromarray((((asignado if n in BRAZOS else asignado2) == k) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
    cubre = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * PASO + 1))) > 0
    ys, xs = np.nonzero(m); x0, y0 = xs.min() - PASO, ys.min() - PASO
    cols, filas = (xs.max() - x0) // PASO + 2, (ys.max() - y0) // PASO + 2
    vert, pesos, idx = [], [], {}
    for j in range(filas):
        for i in range(cols):
            x, y = min(W - 1, max(0, x0 + i * PASO)), min(H - 1, max(0, y0 + j * PASO))
            if not cubre[y, x]: continue
            idx[(i, j)] = len(vert); vert.append((int(x), int(y))); pesos.append(pesos_de(int(x), int(y), n))
    tri = []
    for j in range(filas - 1):
        for i in range(cols - 1):
            a_, b_, c_, d_ = (i, j), (i + 1, j), (i, j + 1), (i + 1, j + 1)
            for t in ((a_, b_, d_), (a_, d_, c_)):
                if all(p in idx for p in t): tri.append([idx[p] for p in t])
    mallas.append({'pieza': n, 'x': P['x'], 'y': P['y'], 'vertices': vert, 'pesos': pesos, 'triangulos': tri})
datos['mallas'] = mallas
vert = [v for m in mallas for v in m['vertices']]; tri = [t for m in mallas for t in m['triangulos']]
print('malla:', len(vert), 'vértices,', len(tri), 'triángulos')
open(f'{D}/piezas.js', 'w').write('const PIEZAS = ' + json.dumps(datos) + ';' + chr(10))   # script, no fetch: funciona abriendo el archivo
Image.fromarray(mapa).save(f'{D}/mapa_piezas.png')
print('sin asignar:', int((libre & (asignado < 0)).sum()), 'px')
