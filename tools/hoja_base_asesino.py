#!/usr/bin/env python3
"""
hoja_base_asesino.py - Exporta las hojas base del Asesino para pedir una skin nueva al generador de imágenes: por cada
animación (asesino_grupos.GRUPOS), sus cuadros de img/asesino/tira.png en rejilla de fondo verde #00FF00 con separadores
negros, unidos con build_sheet.py (sin reescalar). Salen a tools/hojas/asesino_base_<animacion>[_N].png.
Con la hoja generada de cada una: tools/skin_asesino.py y luego tools/tira_skin_asesino.py.

Uso (desde la raíz):  python tools/hoja_base_asesino.py [animacion ...]    (sin argumentos: todas)
"""
import os, subprocess, sys, tempfile
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from asesino_grupos import GRUPOS, HOJAS

TIRA = Image.open('img/asesino/tira.png'); CW, CH = 325, 357
for anim in sys.argv[1:] or GRUPOS:
    slots, ini = GRUPOS[anim], 0
    for n, (cuadros, cols) in enumerate(HOJAS[anim], 1):
        tmp = tempfile.mkdtemp()
        for i, s in enumerate(slots[ini:ini + cuadros]):
            TIRA.crop((s * CW, 0, s * CW + CW, CH)).save(f'{tmp}/{anim}_{i:02d}.png')
        ini += cuadros
        out = f'tools/hojas/asesino_base_{anim}' + (f'_{n}' if len(HOJAS[anim]) > 1 else '') + '.png'
        subprocess.run([sys.executable, 'tools/build_sheet.py', tmp, '--cols', str(cols), '--bg', '00FF00',
                        '--sep', '4', '--sep-color', '000000', '--border', '--anchor', 'center', '--no-json', '--out', out], check=True, capture_output=True)
        print(out, cuadros, 'cuadros,', cols, 'columnas')
