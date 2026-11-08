#!/usr/bin/env python3
"""
interpolar.py - Prueba de cuadros intermedios con IA (RIFE, tools/rife/): toma una secuencia de casillas de una tira
(p. ej. el ataque del asesino), las coloca como en el juego (cada casilla con su escala, pies abajo al centro) y genera
N cuadros intermedios entre cada par. RIFE trabaja en RGB: la transparencia se interpola aparte (el color va
premultiplicado sobre negro y el alfa como imagen gris) y se recompone. Los efectos (tajo, destello) van aparte y en los saltos grandes hay menos intermedios. Escribe salida/<nombre>/*.png y datos.js
(lo carga index.html).

Uso (desde la raíz):  python prototipos/interpolar/interpolar.py [intermedios=2] [secuencias…, p. ej. reposo] [--clase maga]
  Sin --clase, el asesino (salida/<secuencia>); con --clase maga, salida/maga_<secuencia> (sus SECUENCIAS en MAGA).
"""
import glob, json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageFilter

D = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.abspath(f'{D}/../..')
EXE = glob.glob(f'{RAIZ}/tools/rife/**/rife-ncnn-vulkan.exe', recursive=True)[0]
MODELO = 'rife-v4.6'
CW, CH = 325, 357
esc = lambda i: .84 if i < 40 else .74 if i < 55 else .72 if i < 70 else .58 if i < 80 else .82 if i < 100 else .57 if i < 108 else .88
# secuencias del juego (12-vista-del-guerrero.js / 18-habilidades.js): [casilla, ms]
SECUENCIAS = {'ataque': [[11, 110], [12, 90], [13, 90], [14, 110], [15, 180], [16, 130], [17, 120], [18, 120], [19, 130], [70, 600]],
              'reposo': [[70, 520], [71, 260], [72, 240], [73, 240], [74, 260], [75, 300], [79, 520], [75, 300], [74, 260], [73, 240], [72, 240], [71, 260]],
              'punalada': [[100, 130], [101, 130], [102, 120], [108, 110], [103, 140], [104, 110], [105, 110], [106, 110], [107, 110], [5, 110], [6, 110], [7, 110],
                           [8, 110], [9, 110], [10, 240], [21, 90], [89, 60], [90, 60], [91, 60], [92, 60], [93, 80], [95, 70], [96, 70], [97, 70], [98, 90],
                           [27, 200], [81, 110], [28, 150], [83, 110], [84, 110], [86, 120], [70, 200]],   # termina en el reposo, como en el juego
              'paso': [[35, 100], [36, 100], [37, 100], [38, 100], [39, 100], [20, 160], [21, 150], [22, 90], [23, 90], [24, 180], [28, 120], [29, 130], [70, 600]],
              'danza': [[35, 130], [36, 160], [37, 200], [39, 180], [38, 240], [39, 180], [37, 160], [36, 130], [35, 130], [70, 600]],
              'golpe': [[56, 160], [57, 180], [62, 140], [64, 120], [65, 120], [70, 600]],
              'derrota': [[41, 120], [42, 120], [43, 120], [44, 120], [45, 120], [46, 120], [47, 120], [48, 120], [49, 120], [50, 150], [51, 150], [52, 150],
                          [53, 150], [54, 150]]}   # el último cuadro de cada una (70, el reposo) es la vuelta: el juego lo omite
EN_BUCLE = {'reposo'}   # el último cuadro también se interpola hacia el primero
SIN_EFECTOS = {'reposo'}   # sin tajo ni destello: lo azul claro son las dagas, que deben moverse (no fundirse)
BASE = .84   # escala del ataque: las demás casillas se colocan relativas a ella
LIENZO = (int(CW * .9), int(CH * .9))   # todas las casillas al tamaño de pantalla de la de ataque (.84) con margen
PREFIJO, TIRA = '', 'img/asesino/tira.png'
# Maga (tools/tira_clase.py maga): las secuencias de ANIM_MAGA (18-habilidades.js), con la vuelta al reposo (cuadro 0) para
# verla en el visor. Su reposo es el cuadro quieto con la respiración del CSS: no lleva intermedios.
MAGA = {'ataque': [[10, 90], [11, 100], [12, 110], [13, 120], [14, 150], [15, 160], [18, 120], [19, 110], [0, 600]],
        'bola': [[20, 90], [21, 110], [22, 120], [23, 130], [24, 220], [25, 140], [26, 120], [27, 110], [28, 100], [29, 100], [0, 600]],
        'lanza': [[30, 90], [31, 110], [32, 120], [33, 130], [34, 180], [35, 140], [37, 120], [38, 110], [39, 100], [0, 600]],
        'meteoro': [[40, 90], [41, 110], [42, 130], [43, 160], [44, 220], [45, 220], [46, 140], [47, 160], [48, 110], [49, 100], [0, 600]],
        'golpe': [[51, 90], [52, 110], [53, 100], [55, 100], [58, 90], [59, 80], [0, 600]],
        'derrota': [[60, 120], [61, 120], [62, 120], [63, 120], [64, 120], [65, 120], [66, 120], [67, 120], [71, 150], [72, 150], [73, 150], [74, 150]]}
args = [a for a in sys.argv[1:]]
if '--clase' in args:
    k = args.index('--clase'); clase = args[k + 1]; del args[k:k + 2]
    if clase == 'maga':
        CW, CH, BASE, PREFIJO, TIRA, SECUENCIAS = 364, 366, .633, 'maga_', 'img/maga/tira.png', MAGA
        esc = lambda i: .633 if i < 20 else .663 if i < 30 else .618 if i < 60 else .772   # = SPRITE_CLASE.mago.escala
        LIENZO = (440, 400)   # la derrota (tendida y a más escala) es más ancha
        EN_BUCLE, SIN_EFECTOS = set(), set()
N = int(args[0]) if args else 2
SOLO = args[1:] or list(SECUENCIAS)   # p. ej. `interpolar.py 2 reposo` rehace solo esa

tira = Image.open(f'{RAIZ}/{TIRA}').convert('RGBA')
def cuadro(c):   # casilla c como en el juego: escalada por esc(c)/BASE respecto al ataque, pies abajo al centro
    im = tira.crop((c * CW, 0, (c + 1) * CW, CH)); f = esc(c) / BASE
    im = im.resize((round(CW * f), round(CH * f)), Image.LANCZOS)
    out = Image.new('RGBA', LIENZO); out.alpha_composite(im, ((LIENZO[0] - im.width) // 2, LIENZO[1] - im.height)); return out

def rife(a, b, t, tmp):   # imagen intermedia en t (0-1) entre dos RGB
    pa, pb, po = f'{tmp}/a.png', f'{tmp}/b.png', f'{tmp}/o.png'; a.save(pa); b.save(pb)
    subprocess.run([EXE, '-0', pa, '-1', pb, '-o', po, '-m', os.path.join(os.path.dirname(EXE), MODELO), '-s', str(t)],
                   check=True, capture_output=True)
    return Image.open(po).convert('RGB')

def partes(im):   # RGB premultiplicado sobre negro + alfa en gris (RGB)
    a = np.asarray(im).astype(float); al = a[..., 3:4] / 255
    return Image.fromarray((a[..., :3] * al).astype(np.uint8)), Image.fromarray(np.repeat(a[..., 3:4], 3, 2).astype(np.uint8))

# ---- efectos (tajo, destello): RIFE los deforma y les deja contorno negro. En los pares con efectos se quitan, se
# rellena con el color del cuerpo lo que tapaban, se interpola solo el personaje y el efecto va encima con un fundido ----
UMBRAL_EFECTOS = 300   # px de efecto en el par para tratarlo aparte
def mascara_efecto(im, ensanchar=True):
    a = np.asarray(im).astype(int); r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    m = (((r + g + b > 590) | ((b > 170) & (g > 150) & (b - r > 40))) & (al > 20))
    if not ensanchar: return m
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
def cerrar(m, n):
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(n)).filter(ImageFilter.MinFilter(n))) > 0
def separar(im):   # -> (personaje sin efecto, con el hueco del cuerpo relleno; efecto solo)
    a = np.asarray(im).copy(); ef = mascara_efecto(im)
    cuerpo = (a[..., 3] > 60) & ~ef
    hueco = ef & cerrar(cuerpo, 71)   # lo que el efecto tapaba dentro del cuerpo (el destello es grande: con 31 quedaba un hueco)
    solo = mascara_efecto(im, False)   # lo que va encima: el efecto en sí, sin el margen de traje del ensanche (dejaba un
    # parche: ese margen, fundido a medias, se veía como un recuadro sobre el traje)
    efecto = a.copy(); efecto[~solo] = 0
    f = a.astype(float); f[ef] = 0
    # el relleno toma color solo del traje oscuro: el halo claro del destello (fuera de la máscara) dejaba un parche claro
    conocido = (cuerpo & (a[..., :3].astype(int).sum(2) < 300)).astype(float)
    for rad in (2, 4, 8, 16, 32):
        pc = np.asarray(Image.fromarray((conocido * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(rad))).astype(float) / 255
        nuevo = hueco & (conocido == 0) & (pc > .05)
        for c in range(3):
            canal = np.asarray(Image.fromarray((f[..., c] * conocido).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(rad))).astype(float)
            f[..., c][nuevo] = (canal / np.maximum(pc, 1e-3))[nuevo]
        f[..., 3][nuevo] = 255; conocido[nuevo] = 1
    return Image.fromarray(f.clip(0, 255).astype(np.uint8)), Image.fromarray(efecto)
def fundir(ea, eb, t):   # efecto de a apagándose y el de b apareciendo
    a = np.asarray(ea).astype(float); b = np.asarray(eb).astype(float); a[..., 3] *= 1 - t; b[..., 3] *= t
    out = Image.fromarray(a.astype(np.uint8)); out.alpha_composite(Image.fromarray(b.astype(np.uint8))); return out

# ---- cuántos intermedios por par: con saltos grandes (la daga cambia de sitio de golpe) RIFE emborrona; se mide con
# la coincidencia de siluetas (intersección / unión) ----
def coincidencia(a, b):
    ma, mb = np.asarray(a)[..., 3] > 60, np.asarray(b)[..., 3] > 60; return (ma & mb).sum() / max(1, (ma | mb).sum())
# a mano, pares que aun así salen mal: (casilla, casilla siguiente) -> intermedios
A_MANO = {(11, 12): 1, (16, 17): 0}   # 11→12: rastro de la daga de atrás; 16→17: el puño se emborrona (2026-11-07)
def intermedios(a, b, par):
    if par in A_MANO: return A_MANO[par]
    if par[0] == par[1]: return 0   # el mismo cuadro: nada que interpolar
    c = coincidencia(a, b); return 0 if c < .5 else min(N, 1) if c < .62 else N

def juntar(rgb, alfa):
    al = np.asarray(alfa).astype(float)[..., :1]; c = np.asarray(rgb).astype(float)
    c = np.where(al > 2, c * 255 / np.maximum(al, 1), 0).clip(0, 255); al = np.where(al < 12, 0, al)   # sin velos casi transparentes
    return Image.fromarray(np.dstack([c, al]).astype(np.uint8), 'RGBA')

hechos = {}   # (casilla, casilla siguiente, t) -> imagen: en el reposo (ida y vuelta) los pares se repiten al revés
def intermedio(c1, c2, t, ra, aa, rb, ab, tmp):
    if (c2, c1, 1 - t) in hechos: return hechos[(c2, c1, 1 - t)]
    hechos[(c1, c2, t)] = juntar(rife(ra, rb, t, tmp), rife(aa, ab, t, tmp)); return hechos[(c1, c2, t)]

for nombre in SOLO:
    seq = SECUENCIAS[nombre]; nombre = PREFIJO + nombre; od = f'{D}/salida/{nombre}'; os.makedirs(od, exist_ok=True); hechos.clear()
    for f in glob.glob(f'{od}/*.png'): os.remove(f)
    orig, inter = [], []   # original: [archivo, ms]; con intermedios: [archivo, ms]
    with tempfile.TemporaryDirectory() as tmp:
        for k, (c, ms) in enumerate(seq):
            a = cuadro(c); fa = f'{nombre}/{k:02d}_0.png'; a.save(f'{D}/salida/{fa}'); orig.append([fa, ms])
            ultimo = k == len(seq) - 1
            if ultimo and nombre not in EN_BUCLE: inter.append([fa, ms]); break
            c2 = seq[0 if ultimo else k + 1][0]
            b = cuadro(c2); n = intermedios(a, b, (c, c2)); paso = ms / (n + 1)
            con_efecto = nombre not in SIN_EFECTOS and mascara_efecto(a).sum() + mascara_efecto(b).sum() > UMBRAL_EFECTOS
            (pa, ea), (pb, eb) = (separar(a), separar(b)) if con_efecto else ((a, None), (b, None))
            ra, aa = partes(pa); rb, ab = partes(pb)
            inter.append([fa, round(paso)])
            for j in range(1, n + 1):
                t = round(j / (n + 1), 4); im = intermedio(c, c2, t, ra, aa, rb, ab, tmp).copy()
                if con_efecto: im.alpha_composite(fundir(ea, eb, t))
                fi = f'{nombre}/{k:02d}_{j}.png'; im.save(f'{D}/salida/{fi}'); inter.append([fi, round(paso)])
            print(nombre, c, '->', c2, n, 'intermedios', '(efectos aparte)' if con_efecto else '', 'coincidencia %.2f' % coincidencia(a, b))
    json.dump({'nombre': nombre, 'original': orig, 'interpolado': inter, 'ancho': LIENZO[0], 'alto': LIENZO[1]}, open(f'{od}.json', 'w'))
datos = {os.path.basename(f)[:-5]: json.load(open(f)) for f in sorted(glob.glob(f'{D}/salida/*.json'))}   # todas las clases
open(f'{D}/datos.js', 'w').write('const DATOS = ' + json.dumps(datos) + ';' + chr(10))
