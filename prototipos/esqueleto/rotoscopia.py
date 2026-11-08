#!/usr/bin/env python3
"""
rotoscopia.py - Ataque del esqueleto copiado de los cuadros del sprite (rotoscopia): las articulaciones marcadas a mano en
las casillas 11, 13, 15 y 17 de img/asesino/tira.png se pasan al espacio del cuadro de reposo (la casilla 70, que es la
que se despieza) y se convierten en ángulos de hueso relativos a su padre. Los efectos (tajo y destello) se recortan de
las casillas 14-16 por su color y se reproducen como capas encima. Escribe poses.js (lo carga index.html).

Uso (desde la raíz):  python prototipos/esqueleto/rotoscopia.py
"""
import json, math, os
import numpy as np
from PIL import Image

D = os.path.dirname(os.path.abspath(__file__))
CW, CH = 325, 357
esc = lambda i: .84 if i < 40 else .58   # escala de cada casilla en el juego (ataque .84, reposo .58)
def a_reposo(p, casilla):   # punto de una casilla -> espacio de la casilla 70 (mismo tamaño en pantalla, pies abajo al centro)
    f = esc(casilla) / esc(70); return (CW / 2 + (p[0] - CW / 2) * f, CH - (CH - p[1]) * f)

# articulaciones (px de cada casilla, marcadas sobre la rejilla)
REPOSO = dict(cadera=(165, 262), cuello=(165, 128), cabeza=(168, 92),
              hombroD=(214, 142), codoD=(222, 195), manoD=(226, 238), hombroI=(118, 148), codoI=(112, 195), manoI=(118, 240),
              caderaI=(140, 262), rodillaI=(136, 300), pieI=(130, 342), caderaD=(190, 262), rodillaD=(196, 300), pieD=(205, 342))
CUADROS = {
    11: dict(cadera=(172, 292), cuello=(190, 222), cabeza=(200, 188), hombroD=(210, 232), codoD=(228, 248), manoD=(255, 232),
             hombroI=(135, 215), codoI=(105, 222), manoI=(88, 228), caderaI=(152, 295), rodillaI=(125, 318), pieI=(110, 345),
             caderaD=(192, 295), rodillaD=(205, 315), pieD=(215, 342)),
    13: dict(cadera=(172, 295), cuello=(205, 232), cabeza=(215, 205), hombroD=(225, 245), codoD=(232, 262), manoD=(248, 248),
             hombroI=(165, 240), codoI=(150, 265), manoI=(140, 285), caderaI=(152, 298), rodillaI=(122, 320), pieI=(100, 345),
             caderaD=(192, 298), rodillaD=(210, 320), pieD=(222, 345)),
    15: dict(cadera=(165, 295), cuello=(188, 228), cabeza=(205, 205), hombroD=(215, 240), codoD=(225, 250), manoD=(235, 252),
             hombroI=(150, 215), codoI=(125, 190), manoI=(112, 180), caderaI=(145, 298), rodillaI=(110, 315), pieI=(85, 340),
             caderaD=(185, 298), rodillaD=(195, 318), pieD=(200, 342)),
    17: dict(cadera=(178, 300), cuello=(215, 228), cabeza=(228, 195), hombroD=(230, 240), codoD=(232, 262), manoD=(240, 277),
             hombroI=(165, 240), codoI=(140, 258), manoI=(132, 272), caderaI=(155, 302), rodillaI=(130, 320), pieI=(115, 345),
             caderaD=(195, 302), rodillaD=(210, 320), pieD=(222, 345)),
}
# hueso: (articulación de inicio, de fin, padre)
HUESOS = dict(torso=('cadera', 'cuello', None), cabeza=('cuello', 'cabeza', 'torso'),
              brazoD=('hombroD', 'codoD', 'torso'), antebrazoD=('codoD', 'manoD', 'brazoD'),
              brazoI=('hombroI', 'codoI', 'torso'), antebrazoI=('codoI', 'manoI', 'brazoI'),
              piernaI=('caderaI', 'rodillaI', None), espinillaI=('rodillaI', 'pieI', 'piernaI'),
              piernaD=('caderaD', 'rodillaD', None), espinillaD=('rodillaD', 'pieD', 'piernaD'))
ang = lambda a, b: math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))
def giro(a):   # en (-180, 180]
    return (a + 180) % 360 - 180

def pose(c):
    J = {k: a_reposo(v, c) for k, v in CUADROS[c].items()}; absoluto, p = {}, {}
    for h, (i, f, padre) in HUESOS.items():
        absoluto[h] = giro(ang(J[i], J[f]) - ang(REPOSO[i], REPOSO[f]))
        p[h] = round(giro(absoluto[h] - (absoluto[padre] if padre else 0)), 1)
    p['raiz'] = [round(J['cadera'][0] - REPOSO['cadera'][0], 1), round(J['cadera'][1] - REPOSO['cadera'][1], 1)]
    p['capa'] = round(-absoluto['torso'] * .6, 1); p['capaBajo'] = round(-absoluto['torso'] * .4, 1)   # la capa se queda atrás
    return p

# tiempos del sprite (ms): 11 (0), 13 (200), 15 (400-580), 17 (710), 19/reposo (950-1680)
MS = 1680
neutro = {h: 0 for h in HUESOS} | {'raiz': [0, 0], 'capa': 0, 'capaBajo': 0}
claves = [dict(neutro, t=0), dict(pose(11), t=60 / MS), dict(pose(13), t=220 / MS), dict(pose(15), t=400 / MS),
          dict(pose(15), t=560 / MS), dict(pose(17), t=760 / MS), dict(neutro, t=1000 / MS), dict(neutro, t=1)]
claves[-2]['capa'] = 5; claves[-2]['capaBajo'] = 8   # al volver, la capa aún se balancea
# si hay poses ajustadas a la silueta de cada cuadro (index.html -> ajustar(), guardadas en poses_ajustadas.json), mandan:
# una clave por cuadro del sprite (11-19) al empezar ese cuadro
INICIO = {11: 0, 12: 110, 13: 200, 14: 290, 15: 400, 16: 580, 17: 710, 18: 830, 19: 950}
if os.path.exists(f'{D}/poses_ajustadas.json'):
    aj = json.load(open(f'{D}/poses_ajustadas.json'))
    claves = [dict(neutro, t=0)] + [dict(aj[str(c)], t=max(.02, ms / MS)) for c, ms in INICIO.items()] + [dict(neutro, t=1080 / MS), dict(neutro, t=1)]

# efectos: lo brillante (tajo, destello) de las casillas 14-16, en el espacio de la casilla 70
tira = np.asarray(Image.open(f'{D}/../../img/asesino/tira.png').convert('RGBA')).astype(int)
os.makedirs(f'{D}/efectos', exist_ok=True); efectos = []
for c, desde, hasta in [(14, 290, 400), (15, 400, 580), (16, 580, 710)]:
    a = tira[:, c * CW:(c + 1) * CW].copy(); r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    brillo = ((r + g + b > 590) | ((b > 215) & (g > 195) & (b - r > 25))) & (al > 0)
    a[~brillo] = 0; im = Image.fromarray(a.astype(np.uint8)); bb = im.getbbox()
    if not bb: continue
    im.crop(bb).save(f'{D}/efectos/ataque_{c}.png'); x, y = a_reposo((bb[0], bb[1]), c)
    efectos.append({'img': f'efectos/ataque_{c}.png', 'desde': desde / MS, 'hasta': hasta / MS, 'x': round(x, 1), 'y': round(y, 1), 'escala': esc(c) / esc(70)})
open(f'{D}/poses.js', 'w').write('const POSES = ' + json.dumps({'ataque': {'ms': MS, 'claves': claves, 'efectos': efectos}}) + ';' + chr(10))
for c in CUADROS: print(c, pose(c))
print('efectos:', [e['img'] for e in efectos])
