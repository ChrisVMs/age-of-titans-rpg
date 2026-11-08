#!/usr/bin/env python3
"""verificar_intermedios.py - Comprueba que los cuadros intermedios (prototipos/interpolar) coinciden con el juego:
casillas y tiempos de cada secuencia frente a ANIM_ASESINO, cuadros originales frente a la tira actual y, en las
secuencias ya integradas, casillas 109+ frente a los intermedios generados. Uso (desde la raíz): python tools/verificar_intermedios.py"""
import json, re, subprocess, numpy as np
from PIL import Image
import os; R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')) + '/'
src = open(R + 'prototipos/interpolar/interpolar.py', encoding='utf8').read()
ns = {}; exec(re.search(r'(?s)CW, CH = .*?\nesc = .*?\n', src).group(0), ns); exec(re.search(r'(?s)(SECUENCIAS = \{.*?\]\]\})', src).group(1), ns)
SEC, esc, CW, CH = ns['SECUENCIAS'], ns['esc'], ns['CW'], ns['CH']
juego = json.loads(subprocess.run(['node', '-e', """const j=require('./pruebas/cargar')({pantalla:true});
console.log(j.correr('JSON.stringify(Object.assign(Object.fromEntries(Object.keys(ANIM_ASESINO).map(k=>[k,ANIM_ASESINO[k]().map(x=>[x[0],x[1]])])),{reposo:SPRITE_CLASE.asesino.reposo}))'))"""],
    cwd=R, capture_output=True, text=True, check=True).stdout)
I = re.search(r'INTERMEDIOS_ASESINO = (\{.*\});', open(R + 'js/pantalla/12a-asesino-intermedios.js', encoding='utf8').read()).group(1)
I = json.loads(re.sub(r'(\w+):', r'"\1":', I, count=2))
tira = Image.open(R + 'img/asesino/tira.png').convert('RGBA'); LZ = (int(CW * .9), int(CH * .9))
def cuadro(c):
    im = tira.crop((c * CW, 0, (c + 1) * CW, CH)); f = esc(c) / .84
    im = im.resize((round(CW * f), round(CH * f)), Image.LANCZOS)
    out = Image.new('RGBA', LZ); out.alpha_composite(im, ((LZ[0] - im.width) // 2, LZ[1] - im.height)); return out
dif = lambda a, b: np.abs(np.asarray(a).astype(int) - np.asarray(b).astype(int)).max()
for n, seq in SEC.items():
    d = json.load(open(R + f'prototipos/interpolar/salida/{n}.json'))
    g = juego.get(n); base = [x for x in seq]
    # 1) secuencia: las casillas y tiempos originales del juego (antes de intercalar) frente a las del prototipo
    if n in I['secuencias']:   # en el juego ya con intermedios: se quitan para comparar
        orig_j = [x for x in g if x[0] < 109]
    else: orig_j = g
    p = base[:len(orig_j)]
    malas = [(k, a, b) for k, (a, b) in enumerate(zip(orig_j, p)) if a[0] != b[0] or (n not in I['secuencias'] and a[1] != b[1])]
    extra = base[len(orig_j):]
    print(f'{n}: juego {len(orig_j)} cuadros, prototipo {len(base)}', 'distintos: ' + str(malas) if malas else 'casillas iguales', '· de más en el prototipo: ' + str(extra) if extra else '')
    # 2) los cuadros originales del prototipo son los de la tira actual
    peor = max(dif(Image.open(R + f'prototipos/interpolar/salida/{f}'), cuadro(c)) for (f, _), (c, _) in zip(d['original'], seq))
    print(f'   cuadros originales vs tira actual: diferencia máx {peor}')
    # 3) en el juego: casillas 109+ = intermedios del prototipo, en el mismo orden
    if n in I['secuencias']:
        S = I['secuencias'][n]; files = [f for f, _ in d['interpolado'] if not f.endswith('_0.png')]
        casillas = [c for c, _, _ in S if c is not None]
        peor = 0
        for c, f in zip(casillas, files):
            celda = tira.crop((c * CW, 0, (c + 1) * CW, CH)); im = Image.open(R + f'prototipos/interpolar/salida/{f}')
            x = (CW - im.width) // 2; peor = max(peor, dif(celda.crop((x, CH - im.height, x + im.width, CH)), im))
        tiempos = [ms for _, ms in d['interpolado']] == [ms for _, ms, _ in S]
        print(f'   casillas {casillas[0]}-{casillas[-1]} ({len(casillas)}) vs intermedios ({len(files)}): diferencia máx {peor} · tiempos iguales: {tiempos}')

# ---- Maga (interpolar.py --clase maga → salida/maga_*; juego: ANIM_MAGA e INTERMEDIOS_MAGA, casillas 75+) ----
ns = {}; exec(re.search(r'(?s)(MAGA = \{.*?\]\]\})', src).group(1), ns); SECM = ns['MAGA']; CWM, CHM, BM = 364, 366, 75
jm = json.loads(subprocess.run(['node', '-e', """const j=require('./pruebas/cargar')({pantalla:true});
console.log(j.correr('JSON.stringify(Object.fromEntries(Object.keys(ANIM_MAGA).map(k=>[k,ANIM_MAGA[k]().map(x=>[x[0],x[1]])])))'))"""],
    cwd=R, capture_output=True, text=True, check=True).stdout)
IM = re.search(r'INTERMEDIOS_MAGA = (\{.*\});', open(R + 'js/pantalla/12b-maga-intermedios.js', encoding='utf8').read()).group(1)
IM = json.loads(re.sub(r'(\w+):', r'"\1":', IM, count=2))
tm = Image.open(R + 'img/maga/tira.png').convert('RGBA')
for n, seq in SECM.items():
    d = json.load(open(R + f'prototipos/interpolar/salida/maga_{n}.json'))
    orig_j = [x for x in jm[n] if x[0] < BM]
    malas = [(k, a, b) for k, (a, b) in enumerate(zip(orig_j, seq)) if a[0] != b[0]]
    print(f'maga {n}: juego {len(orig_j)} cuadros, prototipo {len(seq)}', 'distintos: ' + str(malas) if malas else 'casillas iguales')
    S = IM['secuencias'][n]; files = [f for f, _ in d['interpolado'] if not f.endswith('_0.png')]; casillas = [c for c, _, _ in S if c is not None]
    peor = 0
    for c, f in zip(casillas, files):
        im = Image.open(R + f'prototipos/interpolar/salida/{f}'); x = (im.width - CWM) // 2
        im = im.crop((max(0, x), max(0, im.height - CHM), max(0, x) + min(CWM, im.width), im.height))
        celda = tm.crop((c * CWM, 0, (c + 1) * CWM, CHM)); x = (CWM - im.width) // 2
        peor = max(peor, dif(celda.crop((x, CHM - im.height, x + im.width, CHM)), im))
    tiempos = [ms for _, ms in d['interpolado']] == [ms for _, ms, _ in S]
    print(f'   casillas {casillas[0]}-{casillas[-1]} ({len(casillas)}) vs intermedios ({len(files)}): diferencia máx {peor} · tiempos iguales: {tiempos}')
