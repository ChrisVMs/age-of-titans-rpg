#!/usr/bin/env python3
"""
modelo.py - Despieza el asesino pensado para esqueleto (tools/hojas/asesino_rig_base.jpg: el reposo redibujado por Gemini
en pose neutra, brazos y piernas sueltos, puños vacíos). Cada píxel va al hueso más cercano (distancia a su segmento,
dividida por el grosor del hueso); lo que tapan los brazos dentro del cuerpo se rellena con los colores de alrededor.
Las dagas son las del sprite actual (piezas/daga*.png, de despiezar.py), pegadas a las manos nuevas.

Espacio: el del cuadro del juego (325x357, pies abajo al centro) al doble de resolución (650x714); el visor lo dibuja a
la mitad. Escribe modelo/*.png y modelo.js (lo carga index.html); las poses las pasa poses_modelo.py.

Uso (desde la raíz):  python prototipos/esqueleto/modelo.py
"""
import json, math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

D = os.path.dirname(os.path.abspath(__file__)); W, H = 650, 714
ALTO = 602; CENTRO_X = 330   # alto de la figura (como el sprite de reposo, x2) y x de la cadera

# ---- 1. dibujo base sin el verde, al tamaño del cuadro ----
im = Image.open(f'{D}/../../tools/hojas/asesino_rig_base.jpg').convert('RGB'); a = np.asarray(im).astype(int)
r, g, b = a[..., 0], a[..., 1], a[..., 2]; verde = (g > 120) & (g - r > 50) & (g - b > 50)
a[..., 1] = np.where((g - np.maximum(r, b) > 15) & ~verde, np.maximum(r, b), g)   # halo verde del borde
im = Image.fromarray(np.dstack([a.clip(0, 255).astype(np.uint8), np.where(verde, 0, 255).astype(np.uint8)]), 'RGBA')
im = im.crop(im.getbbox()); k = ALTO / im.height; cadera_x = 353   # x de la cadera en el dibujo recortado (px del original)
im = im.resize((round(im.width * k), ALTO), Image.LANCZOS)
base = Image.new('RGBA', (W, H)); base.alpha_composite(im, (round(CENTRO_X - cadera_x * k), H - ALTO)); base.save(f'{D}/modelo/base.png')
A = np.asarray(base).copy(); opaco = A[..., 3] > 40

# ---- 2. articulaciones (marcadas sobre la rejilla del dibujo ya colocado) ----
J = dict(coronilla=(305, 120), cuello=(330, 265), cadera=(330, 415),
         hombroI=(230, 305), codoI=(205, 375), manoI=(205, 475),
         hombroD=(375, 315), codoD=(395, 400), manoD=(415, 465),
         caderaI=(270, 500), rodillaI=(230, 585), pieI=(210, 680),
         caderaD=(355, 500), rodillaD=(375, 585), pieD=(385, 680),
         capaA=(270, 270), capaM=(170, 480), capaB=(120, 650),
         tobilloI=(210, 668), puntaI=(190, 708), talonI=(235, 706),   # bota de atrás: casi de frente
         tobilloD=(373, 663), puntaD=(440, 698), talonD=(358, 700))   # bota de delante: de perfil, punta a la derecha
CAPA_LINEA = ((300, 270), (300, 700))   # la espalda: lo opaco a su izquierda y tapado por el cuerpo es capa por detrás
# hueso: (inicio, fin, padre, grosor) — el giro es su inicio; el reparto de píxeles usa distancia/grosor
HUESOS = {
    'torso': ('cadera', 'cuello', None, 62), 'cabeza': ('cuello', 'coronilla', 'torso', 60),
    'capa': ('capaA', 'capaB', 'torso', 60),   # una sola pieza: partida en dos se abría al doblarse
    'brazoI': ('hombroI', 'codoI', 'torso', 22), 'antebrazoI': ('codoI', 'manoI', 'brazoI', 22),
    'brazoD': ('hombroD', 'codoD', 'torso', 22), 'antebrazoD': ('codoD', 'manoD', 'brazoD', 22),
    'piernaI': ('caderaI', 'rodillaI', None, 30), 'espinillaI': ('rodillaI', 'tobilloI', 'piernaI', 30), 'pieI': ('tobilloI', 'puntaI', 'espinillaI', 26),
    'piernaD': ('caderaD', 'rodillaD', None, 30), 'espinillaD': ('rodillaD', 'tobilloD', 'piernaD', 30), 'pieD': ('tobilloD', 'puntaD', 'espinillaD', 26),
}
ORDEN = ['capa', 'brazoI', 'antebrazoI', 'piernaI', 'espinillaI', 'pieI', 'piernaD', 'espinillaD', 'pieD', 'torso', 'dagaI', 'cabeza',
         'brazoD', 'antebrazoD', 'dagaD']   # de atrás hacia delante (la daga trasera cruza por delante del cuerpo, como en el sprite)

def sin_islas(m, minimo=400):   # quita los trozos sueltos pequeños (migas de capa en las piernas, p. ej.)
    from collections import deque
    vis = np.zeros_like(m); out = m.copy(); hh, ww = m.shape
    for y0, x0 in zip(*np.nonzero(m)):
        if vis[y0, x0]: continue
        cola, comp = deque([(y0, x0)]), []; vis[y0, x0] = True
        while cola:
            y, x = cola.popleft(); comp.append((y, x))
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < hh and 0 <= xx < ww and m[yy, xx] and not vis[yy, xx]: vis[yy, xx] = True; cola.append((yy, xx))
        if len(comp) < minimo:
            for y, x in comp: out[y, x] = False
    return out

def dist_segmento(p, q):
    yy, xx = np.mgrid[0:H, 0:W].astype(float); px, py = p; qx, qy = q; vx, vy = qx - px, qy - py
    t = np.clip(((xx - px) * vx + (yy - py) * vy) / (vx * vx + vy * vy), 0, 1)
    return np.hypot(xx - px - t * vx, yy - py - t * vy)

# ---- 3. reparto: cada píxel al hueso más cercano; la capa solo se queda con el azul de la tela ----
nombres = list(HUESOS); dist = np.stack([dist_segmento(J[HUESOS[n][0]], J[HUESOS[n][1]]) / HUESOS[n][3] for n in nombres])
R, G, B = A[..., 0].astype(int), A[..., 1].astype(int), A[..., 2].astype(int)
tela = (B - R > 18) & (B > 55)   # el azul de la capa (el traje es gris/negro)
cuerpo_d = np.stack([dist[i] for i, n in enumerate(nombres) if not n.startswith('capa')]).min(0)
lejos = cuerpo_d > 1.6   # lejos de todo hueso del cuerpo: es capa (también su contorno negro, que no es azul)
for i, n in enumerate(nombres):
    if n.startswith('capa'): dist[i][~(tela | lejos)] = 1e9; dist[i][lejos] *= .01; dist[i][tela] *= .4   # la tela, antes capa que pierna
    if n == 'cabeza': dist[i][np.mgrid[0:H, 0:W][0] > J['cuello'][1] + 6] = 1e9   # la cabeza no baja del cuello
asig = np.where(opaco, dist.argmin(0), -1)

# ---- 4. lo oculto: los brazos se borran del cuerpo y ese hueco se rellena (difusión de los colores de alrededor) ----
brazos = np.isin(asig, [nombres.index(n) for n in ('brazoI', 'antebrazoI', 'brazoD', 'antebrazoD')])
cuerpo = opaco & ~brazos
cerrar = lambda m, n: np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(n)).filter(ImageFilter.MinFilter(n))) > 0
hueco = brazos & cerrar(cuerpo, 41)
fondo = A.astype(float).copy(); conocido = cuerpo.astype(float)
for rad in (2, 4, 8, 16, 32):
    pc = np.asarray(Image.fromarray((conocido * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(rad))).astype(float) / 255
    nuevo = hueco & (conocido == 0) & (pc > .05)
    for c in range(3):
        canal = np.asarray(Image.fromarray((fondo[..., c] * conocido).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(rad))).astype(float)
        fondo[..., c][nuevo] = (canal / np.maximum(pc, 1e-3))[nuevo]
    fondo[..., 3][nuevo] = 255; conocido[nuevo] = 1
fondo = fondo.clip(0, 255).astype(np.uint8)
# el hueco relleno es del hueso del cuerpo más cercano (sin contar brazos)
dist_c = dist.copy()
for n in ('brazoI', 'antebrazoI', 'brazoD', 'antebrazoD'): dist_c[nombres.index(n)] = 1e9
dist_c[nombres.index('capa')] = 1e9   # el hueco del brazo es del cuerpo (la capa de detrás se completa en 4b)
asig_c = np.where(hueco, dist_c.argmin(0), asig)

# ---- 4a. piernas y pies solo dentro de una cápsula alrededor de su hueso: lo que cogían más lejos (tela de la capa,
# borde del torso) se movía con el miembro como un trozo suelto. Eso pasa a la capa (detrás de la espalda) o se quita ----
MIEMBROS = [n for n in nombres if n.startswith(('pierna', 'espinilla', 'pie'))]   # en los brazos cortaba la hombrera y el puño
(lx0, ly0), (lx1, ly1) = CAPA_LINEA; yy0, xx0 = np.mgrid[0:H, 0:W]
detras = xx0 < lx0 + (lx1 - lx0) * (yy0 - ly0) / (ly1 - ly0)
for n in MIEMBROS:
    i = nombres.index(n); fuera = (asig_c == i) & (dist[i] > 1.3)
    asig_c[fuera & detras] = nombres.index('capa'); asig_c[fuera & ~detras] = -2   # entre las piernas: fuera (colgaba del torso)
    asig[(asig == i) & (dist[i] > 1.3)] = -2   # los brazos usan asig: sin esos píxeles

# ---- 4b. la capa entera: todo lo que queda detrás del cuerpo (a la izquierda de la línea de la espalda) también es capa;
# lo que no es tela de verdad (tapado por pierna, torso o brazo) se rellena con el color de la tela de alrededor ----
ic = nombres.index('capa'); capa_ver = asig_c == ic
(ax, ay), (bx, by) = CAPA_LINEA; yy0, xx0 = np.mgrid[0:H, 0:W]
detras = xx0 < ax + (bx - ax) * (yy0 - ay) / (by - ay)
bota = np.isin(asig_c, [nombres.index(n) for n in ('espinillaI', 'espinillaD', 'pieI', 'pieD')]) & (yy0 > 600)   # la bota no es capa
forma = (capa_ver | (opaco & detras & (yy0 > ay) & ~bota)) & cerrar(capa_ver | (opaco & detras), 15)
semilla = capa_ver & (tela | lejos)   # el relleno toma color solo de la tela de verdad (no de puños ni botas)
falta = forma & ~semilla; capa_img = np.zeros_like(A); capa_img[semilla] = A[semilla]
conocido = semilla.astype(float); cf = capa_img.astype(float)
for rad in (2, 4, 8, 16, 32, 64):
    pc = np.asarray(Image.fromarray((conocido * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(rad))).astype(float) / 255
    nuevo = falta & (conocido == 0) & (pc > .02)
    for c in range(3):
        canal = np.asarray(Image.fromarray((cf[..., c] * conocido).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(rad))).astype(float)
        cf[..., c][nuevo] = (canal / np.maximum(pc, 1e-3))[nuevo]
    cf[..., 3][nuevo] = 255; conocido[nuevo] = 1
CAPA = cf.clip(0, 255).astype(np.uint8); CAPA_ZONA = forma

# ---- 5. piezas: su zona + un disco en la articulación con el padre (tapa el corte al doblar) + 3 px de solape ----
os.makedirs(f'{D}/modelo', exist_ok=True); datos = {'orden': ORDEN, 'piezas': {}}
yy, xx = np.mgrid[0:H, 0:W]
for i, n in enumerate(nombres):
    ini, fin, padre, grosor = HUESOS[n]; brazo = n in ('brazoI', 'antebrazoI', 'brazoD', 'antebrazoD')
    zona = (asig == i) if brazo else (asig_c == i)
    zona = np.asarray(Image.fromarray((zona * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) > 0
    if padre and not n.startswith('capa'):   # disco en su giro: el codo o la rodilla enteros van con el hijo
        gx, gy = J[ini]; zona |= np.hypot(xx - gx, yy - gy) < grosor * .9
    src = A if brazo else np.where((fondo[..., 3] > 0)[..., None], fondo, A)
    if brazo: zona &= opaco
    else: zona &= (src[..., 3] > 40)
    if not brazo: zona &= ~(brazos & ~hueco) | (asig_c == i)
    if n == 'capa': zona, src = CAPA_ZONA, CAPA
    zona = sin_islas(zona)
    p = src.copy(); p[~zona] = 0; pim = Image.fromarray(p); bb = pim.getbbox()
    pim.crop(bb).save(f'{D}/modelo/{n}.png')
    datos['piezas'][n] = {'img': f'modelo/{n}.png', 'm': [1, 0, 0, 1, bb[0], bb[1]], 'giro': list(J[ini]), 'padre': padre}

# ---- 6. dagas del sprite actual: el puño del reposo viejo (casilla 70, x1) va al puño nuevo (x2), mismo giro relativo
# al antebrazo ----
pj = open(f'{D}/piezas.js').read(); VIEJO = json.loads(pj[pj.index('{'):pj.rindex('}') + 1])
REPOSO_V = dict(codoD=(222, 195), manoD=(226, 238), codoI=(112, 195), manoI=(118, 240))
ang = lambda p, q: math.atan2(q[1] - p[1], q[0] - p[0])
for lado in 'DI':
    P = VIEJO['piezas']['daga' + lado]; mano_v = REPOSO_V['mano' + lado]
    giro = ang(J['codo' + lado], J['mano' + lado]) - ang(REPOSO_V['codo' + lado], REPOSO_V['mano' + lado])
    c, s = math.cos(giro) * 2, math.sin(giro) * 2   # x2: del cuadro al espacio del modelo
    # punto de la imagen (u,v) -> mano_nueva + R·2·((P.x+u, P.y+v) - mano_vieja)
    ox, oy = P['x'] - mano_v[0], P['y'] - mano_v[1]; mx, my = J['mano' + lado]
    datos['piezas']['daga' + lado] = {'img': f'piezas/daga{lado}.png', 'm': [c, s, -s, c, mx + c * ox - s * oy, my + s * ox + c * oy],
                                      'giro': list(J['mano' + lado]), 'padre': 'antebrazo' + lado}
datos['articulaciones'] = J; datos['huesos'] = {n: [h[0], h[1], h[2]] for n, h in HUESOS.items()}
open(f'{D}/modelo.js', 'w').write('const MODELO = ' + json.dumps(datos) + ';' + chr(10))
# mapa de piezas para revisar el reparto
col = np.random.RandomState(3).randint(60, 255, (len(nombres), 3)); mapa = np.zeros((H, W, 4), np.uint8)
for i in range(len(nombres)): mapa[asig_c == i] = (*col[i], 255)
Image.fromarray(mapa).save(f'{D}/modelo/_mapa.png'); print('piezas:', list(datos['piezas']))
