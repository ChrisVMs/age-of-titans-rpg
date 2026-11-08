#!/usr/bin/env python3
"""
poses_modelo.py - Pasa las poses del sprite (reposo y ataque: poses_ajustadas.json / poses.js, hechas sobre la casilla 70)
al modelo nuevo (modelo.js). Cada hueso se lleva a la misma dirección absoluta que tenía en el cuadro del sprite: los
ángulos viejos son relativos al reposo viejo, así que se pasan a absolutos y se restan las direcciones del reposo nuevo.
La raíz se baja o sube para que el pie más bajo quede siempre en el suelo. Escribe poses_modelo.js.

Uso (desde la raíz, después de modelo.py):  python prototipos/esqueleto/poses_modelo.py
"""
import json, math, os
D = os.path.dirname(os.path.abspath(__file__))
leer = lambda f, k: json.loads((t := open(f'{D}/{f}').read())[t.index('{'):t.rindex('}') + 1])
M = leer('modelo.js', 'MODELO'); POSES = leer('poses.js', 'POSES'); J = M['articulaciones']; HN = M['huesos']
# reposo viejo (rotoscopia.REPOSO, px de la casilla 70) y sus huesos
RV = dict(cadera=(165, 262), cuello=(165, 128), cabeza=(168, 92), hombroD=(214, 142), codoD=(222, 195), manoD=(226, 238),
          hombroI=(118, 148), codoI=(112, 195), manoI=(118, 240), caderaI=(140, 262), rodillaI=(136, 300), pieI=(130, 342),
          caderaD=(190, 262), rodillaD=(196, 300), pieD=(205, 342))
HV = dict(torso=('cadera', 'cuello'), cabeza=('cuello', 'cabeza'), brazoD=('hombroD', 'codoD'), antebrazoD=('codoD', 'manoD'),
          brazoI=('hombroI', 'codoI'), antebrazoI=('codoI', 'manoI'), piernaI=('caderaI', 'rodillaI'), espinillaI=('rodillaI', 'pieI'),
          piernaD=('caderaD', 'rodillaD'), espinillaD=('rodillaD', 'pieD'))
ang = lambda p, q: math.degrees(math.atan2(q[1] - p[1], q[0] - p[0]))
giro = lambda a: (a + 180) % 360 - 180
padre = {n: h[2] for n, h in HN.items()}
SUELO = max(J[k][1] for k in ('puntaI', 'talonI', 'puntaD', 'talonD'))   # la suela (los pies los clava el visor)

def convertir(p):   # pose vieja (relativa al reposo viejo) -> pose del modelo nuevo
    viejo, nuevo, q = {}, {}, {}
    for n in HV:   # en orden de padres (HV ya va padre antes que hijo)
        viejo[n] = p.get(n, 0) + (viejo[padre[n]] if padre[n] in viejo else 0)
        # la cabeza no: el punto marcado no es el mismo (centro viejo, coronilla nueva); solo su giro
        nuevo[n] = viejo[n] + (0 if n == 'cabeza' else ang(*[RV[x] for x in HV[n]]) - ang(*[J[x] for x in HN[n][:2]]))
        q[n] = round(giro(nuevo[n] - (nuevo[padre[n]] if padre[n] else 0)), 1)
    for k, v in p.items():   # capa, dagas y visibilidad: igual que antes (son relativos a su padre)
        if k not in HV and k not in ('raiz', 't'): q[k] = v
    # raíz: x como en el sprite (x2); y para que el pie más bajo toque el suelo
    rx = p.get('raiz', [0, 0])[0] * 2; pies = []
    for lado in 'ID':
        c = J['cadera' + lado]; a1 = math.radians(nuevo['pierna' + lado]); a2 = math.radians(nuevo['espinilla' + lado])
        rot = lambda pt, cen, a: (cen[0] + (pt[0] - cen[0]) * math.cos(a) - (pt[1] - cen[1]) * math.sin(a),
                                      cen[1] + (pt[0] - cen[0]) * math.sin(a) + (pt[1] - cen[1]) * math.cos(a))
        pie = rot(rot(J['punta' + lado], J['rodilla' + lado], a2), c, a1)   # el pie gira con la espinilla (en su rodilla) y luego con el muslo (en la cadera)
        pies.append(pie[1])
    q['raiz'] = [round(rx, 1), round(SUELO - max(pies), 1)]
    return q

# reposo: las mismas claves de respiración del visor, sobre la pose del cuadro 70 (todo 0 = el reposo viejo)
REPOSO = [dict(t=0, raiz=[0, 0], torso=0, cabeza=0, capa=0, capaBajo=-2, brazoD=0, brazoI=0),
          dict(t=.3, raiz=[0, 2], torso=-1, cabeza=1.5, capa=3, capaBajo=0, brazoD=2, brazoI=-2),
          dict(t=.5, raiz=[0, 3], torso=-1.5, cabeza=2.5, capa=4, capaBajo=5, brazoD=3, brazoI=-3),
          dict(t=.8, raiz=[0, 1], torso=-.5, cabeza=1, capa=1, capaBajo=2, brazoD=1, brazoI=-1),
          dict(t=1, raiz=[0, 0], torso=0, cabeza=0, capa=0, capaBajo=-2, brazoD=0, brazoI=0)]
salida = {'reposo': {'ms': 3200, 'claves': []}, 'ataque': dict(POSES['ataque'], claves=[])}
for nombre, claves in (('reposo', REPOSO), ('ataque', POSES['ataque']['claves'])):
    for c in claves:
        q = convertir(c); q['t'] = c['t']
        if nombre == 'reposo': q['raiz'][1] += c['raiz'][1] * 2   # la respiración sube y baja el cuerpo
        salida[nombre]['claves'].append(q)
# si hay poses ajustadas a la silueta de cada cuadro con el modelo (ajustar.js -> poses_modelo_ajustadas.json), mandan
if os.path.exists(f'{D}/poses_modelo_ajustadas.json'):
    aj = json.load(open(f'{D}/poses_modelo_ajustadas.json'))
    for i, c in enumerate(range(11, 20), 1): salida['ataque']['claves'][i] = dict(aj[str(c)], t=salida['ataque']['claves'][i]['t'])
open(f'{D}/poses_modelo.js', 'w').write('const POSES = ' + json.dumps(salida) + ';' + chr(10))
print(salida['reposo']['claves'][0])
