#!/usr/bin/env python3
"""
intermedios_asesino.py - Añade a img/asesino/tira.png los cuadros intermedios hechos con RIFE
(prototipos/interpolar/interpolar.py → salida/<secuencia>/NN_j.png) como casillas nuevas desde la 109.
Solo recorta y copia píxeles (build_sheet.py, pies abajo al centro). Las casillas 0-108 quedan igual.
Escribe js/pantalla/12a-asesino-intermedios.js con las secuencias del juego: [casilla, ms] por cuadro.

Uso (desde la raíz): python tools/intermedios_asesino.py      (tras interpolar.py; tira_asesino.py lo llama al final)
"""
import json, os, shutil, subprocess, sys, tempfile
from PIL import Image

BASE, CW, CH = 109, 325, 357   # casillas originales del asesino
SAL = 'prototipos/interpolar/salida'
SECUENCIAS = ['ataque', 'reposo', 'punalada', 'paso', 'danza', 'golpe', 'derrota']   # orden fijo: las nuevas, al final (no cambian las casillas de las anteriores)

tira = Image.open('img/asesino/tira.png')
T = tempfile.mkdtemp(); n = BASE
for c in range(BASE): tira.crop((c * CW, 0, (c + 1) * CW, CH)).save(f'{T}/c{c:03d}.png')
seqs = {}
for nombre in SECUENCIAS:
    d = json.load(open(f'{SAL}/{nombre}.json'))
    seq = []
    for f, ms in d['interpolado']:
        if f.endswith('_0.png'):   # cuadro original: su casilla de siempre
            k = int(f.split('/')[1][:2]); seq.append([None, k, ms])
        else:
            shutil.copy(f'{SAL}/{f}', f'{T}/c{n:03d}.png'); seq.append([n, None, ms]); n += 1
    seqs[nombre] = seq
subprocess.run([sys.executable, 'tools/build_sheet.py', T, '--cols', str(n), '--cell', f'{CW}x{CH}', '--anchor', 'bottom', '--bg', 'transparent',
                '--sep', '0', '--no-json', '--out', 'img/asesino/tira.png'], check=True)
shutil.rmtree(T)
# para el juego: cada entrada [casilla, ms, k] con k = posición del cuadro original en la secuencia (o null si es intermedio)
datos = {k: [[c, ms, o] for c, o, ms in v] for k, v in seqs.items()}
open('js/pantalla/12a-asesino-intermedios.js', 'w', encoding='utf8').write(
    '  // Generado por tools/intermedios_asesino.py (cuadros intermedios con RIFE): no editar a mano.\n'
    f'  // [casilla, ms, k]: casilla null = el cuadro original k de la secuencia; si no, un intermedio (casillas {BASE}-{n - 1}).\n'
    f'  const INTERMEDIOS_ASESINO = {{ cuadros: {n}, secuencias: {json.dumps(datos)} }};\n')
print(f'{n - BASE} intermedios: casillas {BASE}-{n - 1}')
