#!/usr/bin/env python3
"""
tira_skin_asesino.py - Arma la tira de una skin del Asesino con la MISMA distribución de cuadros que img/asesino/tira.png
(109 casillas), para que todas las animaciones del juego sirvan sin cambios. Usa los cuadros de img/asesino/skins/<skin>/
(de tools/skin_asesino.py) y une con tools/build_sheet.py, sin reescalar. Las casillas que la skin no usa quedan vacías.
Imprime la escala por grupo de casillas (cada hoja generada dibuja al personaje a otro tamaño): va en SKINS (08-skins.js).

Uso (desde la raíz):  python3 tools/tira_skin_asesino.py espectro
"""
import glob, json, os, shutil, statistics, subprocess, sys, tempfile
from PIL import Image

skin = sys.argv[1]; D = f'img/asesino/skins/{skin}'
TIRA = Image.open('img/asesino/tira.png'); CW, CH, N = 325, 357, 109
esc = lambda i: .84 if i < 40 else .74 if i < 55 else .72 if i < 70 else .58 if i < 80 else .82 if i < 100 else .57 if i < 108 else .88
# casilla de la tira original <- cuadro de la skin (en el orden en que el juego los usa)
REPOSO = [70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 0, 1, 2]   # el reposo de la skin tiene 13 cuadros propios
GRUPOS = {
    'reposo': REPOSO,
    'ataque': list(range(11, 20)),
    'retroceso': [56, 57, 62, 64, 65],
    'punalada': [100, 101, 102, 108, 103, 104, 105, 106, 107, 5, 6, 7, 8, 9, 10, 21, 89, 90, 91, 92, 93, 95, 96, 97, 98, 27, 81, 28, 83, 84, 86],
    'paso': [35, 36, 37, 38, 39, 20, 21, 22, 23, 24, 28, 29],   # la Danza usa 35-39: mismos cuadros
    'derrota': list(range(41, 55)),
}
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
subprocess.run(['python3', 'tools/build_sheet.py', tmp, '--cols', str(N), '--cell', f'{mw}x{mh}', '--anchor', 'bottom',
                '--bg', 'transparent', '--sep', '0', '--no-json', '--out', f'{D}/tira.png'], check=True, capture_output=True)
f = mw / CW   # la casilla de la skin se muestra al mismo ancho que la original: corrige por su tamaño
esc_casilla = [round(escalas[i] * f, 3) if i in escalas else 1 for i in range(N)]
print(json.dumps({'celda': [mw, mh], 'escala': esc_casilla}))
