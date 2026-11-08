#!/usr/bin/env python3
"""
tira_skin_asesino.py - Arma la tira de una skin del Asesino con la MISMA distribución de cuadros que img/asesino/tira.png
(109 casillas), para que todas las animaciones del juego sirvan sin cambios. Usa los cuadros de img/asesino/skins/<skin>/
(de tools/skin_asesino.py) y une con tools/build_sheet.py, sin reescalar. Las casillas que la skin no usa quedan vacías.
Imprime la escala por grupo de casillas (cada hoja generada dibuja al personaje a otro tamaño): va en SKINS (08-skins.js).

Uso (desde la raíz):  python3 tools/tira_skin_asesino.py espectro
"""
import glob, json, os, shutil, statistics, subprocess, sys, tempfile
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image

skin = sys.argv[1]; D = f'img/asesino/skins/{skin}'
TIRA = Image.open('img/asesino/tira.png'); CW, CH, N = 325, 357, 109
esc = lambda i: .84 if i < 40 else .74 if i < 55 else .72 if i < 70 else .58 if i < 80 else .82 if i < 100 else .57 if i < 108 else .88
from asesino_grupos import GRUPOS, HOJAS   # casillas de la tira por animación y su reparto en hojas (compartido con hoja_base_asesino.py)
# POR_CUADRO=1: cada cuadro mide en pantalla lo mismo que la casilla original que imita (cuando el generador copió los
# tamaños de la hoja base, que no son todos iguales: p. ej. la casilla 108 está dibujada pequeña y su escala lo compensa).
# Sin él: una escala por hoja generada (la mediana), para generadores que dibujan todos los cuadros del mismo tamaño.
POR_CUADRO = os.environ.get('POR_CUADRO') == '1'
alto = lambda im: (lambda b: b[3] - b[1])(im.getbbox())
# silueta normalizada (alto fijo, centrada) para comparar poses
def silueta(im):
    im = im.convert('RGBA'); im = im.crop(im.getbbox()); h = 96; w = max(1, round(im.width * h / im.height))
    m = np.zeros((h, 160), bool); a = np.asarray(im.resize((w, h)))[..., 3] > 60; x0 = max(0, 80 - w // 2); n = min(w, 160 - x0)
    m[:, x0:x0 + n] = a[:, :n]; return m
parecido = lambda a, b: (a & b).sum() / max(1, (a | b).sum())
opciones = {}   # casilla -> [(archivo, escala)]: dos animaciones pueden compartir casilla (la 21 y la 28: puñalada y paso)
for anim, slots in GRUPOS.items():
    fs = sorted(glob.glob(f'{D}/{anim}_*.png'))
    assert len(fs) == len(slots), f'{anim}: {len(fs)} cuadros, se esperaban {len(slots)}'
    r = [alto(TIRA.crop((s * CW, 0, s * CW + CW, CH))) * esc(s) / alto(Image.open(f)) for s, f in zip(slots, fs)]
    esc_anim = {}
    if POR_CUADRO:
        esc_anim = dict(zip(slots, r))
        # el reposo de la skin ocupa también las casillas 0-2 (el juego muestra la 0 fuera de las animaciones): allí van
        # cuadros de reposo, con la escala del reposo (la tira base tiene otras poses en esas casillas)
        if anim == 'reposo':
            med = statistics.median(x for s, x in zip(slots, r) if s >= 70)
            for s in slots:
                if s < 70: esc_anim[s] = med
    else:
        # escala por hoja generada (cada una a su tamaño: la Puñalada viene de 3 hojas, la Derrota de 2; HOJAS)
        # (el reposo: sin las casillas 0-2, que en la tira base son otras poses)
        ini = 0
        for cuadros, _ in HOJAS[anim]:
            ref = [x for s, x in zip(slots[ini:ini + cuadros], r[ini:ini + cuadros]) if anim != 'reposo' or s >= 70]
            for s in slots[ini:ini + cuadros]: esc_anim[s] = statistics.median(ref)   # alto en pantalla igual al original
            ini += cuadros
    for s, f in zip(slots, fs): opciones.setdefault(s, []).append((f, esc_anim[s]))
# en una casilla compartida va el cuadro más parecido a la pose original (si no, la última animación pisaba a la primera:
# en mitad de la Puñalada salía el cuadro del Paso, con otra pose de brazos)
casillas, escalas = {}, {}
for s, ops in opciones.items():
    if len(ops) > 1 and s not in (0, 1, 2):
        base = silueta(TIRA.crop((s * CW, 0, s * CW + CW, CH)))
        ops = sorted(ops, key=lambda o: -parecido(silueta(Image.open(o[0])), base))
    casillas[s], escalas[s] = ops[0]
mw = max(Image.open(f).width for f in casillas.values()); mh = max(Image.open(f).height for f in casillas.values())
tmp = tempfile.mkdtemp(); vacio = Image.new('RGBA', (mw, mh))
for i in range(N):
    (shutil.copy(casillas[i], f'{tmp}/c_{i:03d}.png') if i in casillas else vacio.save(f'{tmp}/c_{i:03d}.png'))
subprocess.run([sys.executable, 'tools/build_sheet.py', tmp, '--cols', str(N), '--cell', f'{mw}x{mh}', '--anchor', 'bottom',
                '--bg', 'transparent', '--sep', '0', '--no-json', '--out', f'{D}/tira.png'], check=True, capture_output=True)
f = mw / CW   # la casilla de la skin se muestra al mismo ancho que la original: corrige por su tamaño
esc_casilla = [round(escalas[i] * f, 3) if i in escalas else 1 for i in range(N)]
print(json.dumps({'celda': [mw, mh], 'escala': esc_casilla}))
