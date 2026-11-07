#!/usr/bin/env python3
"""
comparar_hoja.py - Revisa una hoja generada (skin nueva) contra su hoja base, cuadro a cuadro, antes de dividirla.
Criterio (2026-11-07): se aceptan diferencias de detalle (la capa ondea menos); se regenera si cambia el número de
cuadros o la rejilla, el personaje cambia mucho de tamaño o de sitio, o se pierde la animación (cuadros casi iguales
entre sí cuando en la base se mueven). Deja una imagen base/nueva lado a lado para mirarla.

Uso:  python tools/comparar_hoja.py BASE NUEVA COLS FILAS CUADROS [salida.png]
Sale con código 1 si la hoja no pasa.
"""
import sys
import numpy as np
from PIL import Image

base, nueva, cols, filas, n = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
AREA = (.75, 1.33)        # área del personaje (nueva / base) respecto a la mediana de la hoja: un tamaño distinto pero
                          # igual en toda la hoja se acepta (tira_skin_asesino.py escala cada animación a la altura original)
DESPLAZA = .12            # el centro del personaje se mueve como mucho esta parte de la celda
MOVIMIENTO = .2           # la nueva debe moverse al menos esta parte de lo que se mueve la base (capa más quieta: ~30 %, se acepta)

def celdas(f):
    im = Image.open(f).convert('RGB'); W, H = im.size; a = np.asarray(im).astype(int)
    verde = (a[..., 1] > 150) & (a[..., 1] - a[..., 0] > 60) & (a[..., 1] - a[..., 2] > 60)
    out = []
    for i in range(cols * filas):
        r, c = divmod(i, cols); mx, my = W // cols // 20, H // filas // 20
        y0, y1, x0, x1 = r * H // filas + my, (r + 1) * H // filas - my, c * W // cols + mx, (c + 1) * W // cols - mx
        m = ~verde[y0:y1, x0:x1]
        out.append(np.asarray(Image.fromarray((m * 255).astype('uint8')).resize((64, 64))) > 127)
    return out, im

B, imb = celdas(base); N, imn = celdas(nueva); fallos = []
vacias = sum(1 for m in N[:n] if m.mean() < .02)
if vacias: fallos.append(f'{vacias} cuadros vacíos en la nueva')
if any(m.mean() > .02 for m in N[n:]): fallos.append('hay personaje en celdas que deberían estar vacías')
razones = [N[i].sum() / B[i].sum() for i in range(n) if B[i].any() and N[i].any()]; med = float(np.median(razones)) if razones else 1
print(f'tamaño de la nueva: ×{med:.2f} de la base (área; se corrige al armar la tira)')
for i in range(n):
    b, m = B[i], N[i]
    if not b.any() or not m.any(): continue
    lados = lambda x: [x[0].any(), x[-1].any(), x[:, 0].any(), x[:, -1].any()]   # arriba, abajo, izquierda, derecha
    if any(n_ and not b_ for n_, b_ in zip(lados(m), lados(b))): fallos.append(f'cuadro {i + 1}: toca un borde de la celda que en la base no toca (se cortaría)')
    ar = m.sum() / b.sum() / med; cb = np.argwhere(b).mean(0); cn = np.argwhere(m).mean(0); d = np.abs(cb - cn).max() / 64
    if not AREA[0] <= ar <= AREA[1]: fallos.append(f'cuadro {i + 1}: tamaño ×{ar:.2f}')
    if d > DESPLAZA: fallos.append(f'cuadro {i + 1}: desplazado {d:.0%} de la celda')
mov = lambda L: np.mean([(L[i] ^ L[i + 1]).mean() for i in range(n - 1)]) if n > 1 else 0
mb, mn = mov(B), mov(N)
print(f'movimiento entre cuadros: base {mb:.3f} · nueva {mn:.3f} ({mn / mb:.0%} de la base)' if mb else 'un solo cuadro')
if mb and mn < mb * MOVIMIENTO: fallos.append('se perdió la animación: los cuadros casi no cambian')
if len(sys.argv) > 6:
    w = imb.width; lado = Image.new('RGB', (w * 2 + 10, max(imb.height, imn.height)), 'white')
    lado.paste(imb, (0, 0)); lado.paste(imn.resize(imb.size), (w + 10, 0)); lado.save(sys.argv[6])
print('OK' if not fallos else 'REGENERAR:\n  ' + '\n  '.join(fallos)); sys.exit(1 if fallos else 0)
