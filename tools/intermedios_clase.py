#!/usr/bin/env python3
"""
intermedios_clase.py - Añade a img/<clase>/tira.png los cuadros intermedios hechos con RIFE
(prototipos/interpolar/interpolar.py → salida/<prefijo><secuencia>/NN_j.png) como casillas nuevas tras las originales.
Solo recorta y copia píxeles (build_sheet.py, pies abajo al centro). Las casillas originales quedan igual.
Escribe el .js de la clase con las secuencias del juego: [casilla, ms, k] por cuadro (INTERMEDIOS_<CLASE>).
Una clase nueva = una entrada en CLASES (ver prototipos/interpolar/PROCESO.md).

Uso (desde la raíz): python tools/intermedios_clase.py [asesino|maga]   (tras interpolar.py; tira_asesino.py lo llama al final)
"""
import json, os, shutil, subprocess, sys, tempfile
from PIL import Image

SAL = 'prototipos/interpolar/salida'
# base: casillas originales · celda · prefijo de su salida en interpolar.py · secuencias en orden fijo (las nuevas, al final:
# así no cambian las casillas de las anteriores)
CLASES = {
    'asesino': {'base': 109, 'celda': (325, 357), 'prefijo': '', 'js': 'js/pantalla/12a-asesino-intermedios.js', 'var': 'INTERMEDIOS_ASESINO',
                'secuencias': ['ataque', 'reposo', 'punalada', 'paso', 'danza', 'golpe', 'derrota']},
    'maga':    {'base': 75, 'celda': (364, 366), 'prefijo': 'maga_', 'js': 'js/pantalla/12b-maga-intermedios.js', 'var': 'INTERMEDIOS_MAGA',
                'secuencias': ['ataque', 'bola', 'lanza', 'meteoro', 'golpe', 'derrota']},
}
clase = sys.argv[1] if len(sys.argv) > 1 else 'asesino'
C = CLASES[clase]; BASE = C['base']; CW, CH = C['celda']; TIRA = f'img/{clase}/tira.png'

tira = Image.open(TIRA)
T = tempfile.mkdtemp(); n = BASE
for c in range(BASE): tira.crop((c * CW, 0, (c + 1) * CW, CH)).save(f'{T}/c{c:03d}.png')
seqs = {}
for nombre in C['secuencias']:
    d = json.load(open(f"{SAL}/{C['prefijo']}{nombre}.json"))
    seq = []
    for f, ms in d['interpolado']:
        if f.endswith('_0.png'):   # cuadro original: su casilla de siempre
            k = int(f.split('/')[1][:2]); seq.append([None, k, ms])
        else:
            im = Image.open(f'{SAL}/{f}')
            if im.width > CW or im.height > CH:   # lienzo del prototipo más grande que la celda: se recorta centrado, pies abajo
                x = (im.width - CW) // 2; im = im.crop((max(0, x), max(0, im.height - CH), max(0, x) + min(CW, im.width), im.height))
            im.save(f'{T}/c{n:03d}.png'); seq.append([n, None, ms]); n += 1
    seqs[nombre] = seq
subprocess.run([sys.executable, 'tools/build_sheet.py', T, '--cols', str(n), '--cell', f'{CW}x{CH}', '--anchor', 'bottom', '--bg', 'transparent',
                '--sep', '0', '--no-json', '--out', TIRA], check=True)
shutil.rmtree(T)
# para el juego: cada entrada [casilla, ms, k] con k = posición del cuadro original en la secuencia (o null si es intermedio)
datos = {k: [[c, ms, o] for c, o, ms in v] for k, v in seqs.items()}
open(C['js'], 'w', encoding='utf8').write(
    '  // Generado por tools/intermedios_clase.py (cuadros intermedios con RIFE): no editar a mano.\n'
    f'  // [casilla, ms, k]: casilla null = el cuadro original k de la secuencia; si no, un intermedio (casillas {BASE}-{n - 1}).\n'
    f"  const {C['var']} = {{ cuadros: {n}, secuencias: {json.dumps(datos)} }};\n")
print(f'{clase}: {n - BASE} intermedios, casillas {BASE}-{n - 1}')
