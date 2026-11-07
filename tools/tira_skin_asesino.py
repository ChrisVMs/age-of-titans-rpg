#!/usr/bin/env python3
"""
tira_skin_asesino.py - Arma la tira de una skin del Asesino con la MISMA distribución de cuadros que img/asesino/tira.png
(109 casillas), para que todas las animaciones del juego sirvan sin cambios. Usa los cuadros de img/asesino/skins/<skin>/
(de tools/skin_asesino.py) y une con tools/build_sheet.py, sin reescalar. Las casillas que la skin no usa quedan vacías.
Imprime la escala por grupo de casillas (cada hoja generada dibuja al personaje a otro tamaño): va en SKINS (08-skins.js).

Uso (desde la raíz):  python3 tools/tira_skin_asesino.py espectro
"""
import glob, json, os, shutil, statistics, subprocess, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image

skin = sys.argv[1]; D = f'img/asesino/skins/{skin}'
TIRA = Image.open('img/asesino/tira.png'); CW, CH, N = 325, 357, 109
esc = lambda i: .84 if i < 40 else .74 if i < 55 else .72 if i < 70 else .58 if i < 80 else .82 if i < 100 else .57 if i < 108 else .88
from asesino_grupos import GRUPOS   # casillas de la tira por animación (compartido con hoja_base_asesino.py)
alto = lambda im: (lambda b: b[3] - b[1])(im.getbbox())
casillas, escalas = {}, {}
for anim, slots in GRUPOS.items():
    fs = sorted(glob.glob(f'{D}/{anim}_*.png'))
    assert len(fs) == len(slots), f'{anim}: {len(fs)} cuadros, se esperaban {len(slots)}'
    r = []
    for s, f in zip(slots, fs):
        casillas[s] = f
        if anim != 'reposo' or s >= 70: r.append(alto(TIRA.crop((s * CW, 0, s * CW + CW, CH))) * esc(s) / alto(Image.open(f)))
    # escala por hoja generada (la Puñalada viene de 3 hojas de 12, 12 y 7 cuadros, cada una a su tamaño)
    trozos = [(0, 12), (12, 24), (24, 31)] if anim == 'punalada' else [(0, len(slots))]
    rs = r if anim != 'reposo' else r + [r[0]] * 3
    for a, b in trozos:
        for s in slots[a:b]: escalas[s] = statistics.median(rs[a:b])   # alto en pantalla igual al original
mw = max(Image.open(f).width for f in casillas.values()); mh = max(Image.open(f).height for f in casillas.values())
tmp = tempfile.mkdtemp(); vacio = Image.new('RGBA', (mw, mh))
for i in range(N):
    (shutil.copy(casillas[i], f'{tmp}/c_{i:03d}.png') if i in casillas else vacio.save(f'{tmp}/c_{i:03d}.png'))
subprocess.run([sys.executable, 'tools/build_sheet.py', tmp, '--cols', str(N), '--cell', f'{mw}x{mh}', '--anchor', 'bottom',
                '--bg', 'transparent', '--sep', '0', '--no-json', '--out', f'{D}/tira.png'], check=True, capture_output=True)
f = mw / CW   # la casilla de la skin se muestra al mismo ancho que la original: corrige por su tamaño
esc_casilla = [round(escalas[i] * f, 3) if i in escalas else 1 for i in range(N)]
print(json.dumps({'celda': [mw, mh], 'escala': esc_casilla}))
