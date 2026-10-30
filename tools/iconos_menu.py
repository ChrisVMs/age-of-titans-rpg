#!/usr/bin/env python3
# Recorta las hojas de iconos de tools/hojas/ en img/iconos/<nombre>.png con split_sheet.py:
#   iconos_menu.jpg (5x5): cada icono viene sobre una baldosa verde oscuro, que se quita (relleno desde los bordes).
#   iconos_clases.jpg (4x2): sobre verde plano (sin baldosa).
#   iconos_calabozo.jpg (4x3): insignias con baldosa propia (se conserva).
#   iconos_arbol_asesino.jpg (5x5): baldosa verde media (el croma la quita); se borra su contorno oscuro ('marco').
# Uso (desde la raíz): python3 tools/iconos_menu.py
import subprocess, glob, tempfile, numpy as np
from PIL import Image
HOJAS = []   # (hoja, columnas, filas, nombres, quitar baldosa)
NOMBRES = ['jefe', 'habilidades', 'titulos', 'arena', 'login', 'inventario', 'ranking', 'coleccion', 'torre', 'grieta',
           'ruinas', 'reyes', 'misiones', 'heroe', 'mascota', 'batalla', 'herreria', 'tienda', 'oro', 'cristales',
           'estamina', 'poder']
HOJAS += [('iconos_menu.jpg', 5, 5, NOMBRES, True),
          ('iconos_clases.jpg', 4, 2, ['clase_guerrero', 'clase_arquero', 'clase_mago', 'clase_asesino', 'vida', 'ataque', 'defensa', 'armadura'], False),
          # insignias: la baldosa oscura forma parte del dibujo (muro, ciénaga, lava): se queda, solo se quita el verde
          ('iconos_calabozo.jpg', 4, 3, ['candado', 'mas', 'calabozo', 'hoguera'] + [f'cal_{i}' for i in range(1, 9)], 'insignia'),
          # árbol del Asesino: ramas, maestría, especializaciones y nodos (nodo_<id> = id del nodo en ARBOL.asesino)
          ('iconos_arbol_asesino.jpg', 5, 5, ['rama_filo', 'rama_sombras', 'rama_venenos', 'maestria', 'esp_destructor',
            'nodo_filo_agudo', 'nodo_punto_debil', 'nodo_punalada_m', 'nodo_ejecutor', 'nodo_danza_r',
            'nodo_esquivo', 'nodo_manto', 'nodo_paso_r', 'nodo_evasion', 'nodo_emboscada',
            'nodo_toxina', 'nodo_desangrar', 'nodo_sed_a', 'nodo_cazarrecom', 'nodo_golpe_gracia',
            'esp_bastion', 'esp_gladiador'], 'marco')]
for hoja, cols, filas, nombres, conBaldosa in HOJAS:
  tmp = tempfile.mkdtemp()
  subprocess.run(['python3', 'tools/split_sheet.py', f'tools/hojas/{hoja}', '--cols', str(cols), '--rows', str(filas), '--uniform', '--out', tmp],
                 check=True, capture_output=True)
  for nombre, f in zip(nombres, sorted(glob.glob(f'{tmp}/*.png'))):
    a = np.array(Image.open(f).convert('RGBA')).astype(int)
    if conBaldosa == 'insignia':   # verde del dibujo dentro de la baldosa (limo, brillos): lo que no toca el borde vuelve a ser opaco
        m = a[..., 3] < 128; H, W = m.shape; fuera = np.zeros((H, W), bool)
        pila = [(y, x) for y in (0, H - 1) for x in range(W)] + [(y, x) for x in (0, W - 1) for y in range(H)]
        while pila:
            y, x = pila.pop()
            if 0 <= y < H and 0 <= x < W and m[y, x] and not fuera[y, x]:
                fuera[y, x] = True; pila += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
        a[..., 3] = np.where(m & ~fuera, 255, a[..., 3])
    if conBaldosa == 'marco':   # contorno oscuro de la baldosa: líneas oscuras conectadas al borde, en una franja de 12 px
        oscuro = (np.maximum(np.maximum(a[..., 0], a[..., 1]), a[..., 2]) < 80) & (a[..., 3] > 0); H, W = oscuro.shape
        franja = np.zeros((H, W), bool); franja[:12] = franja[-12:] = True; franja[:, :12] = franja[:, -12:] = True
        quitar = np.zeros((H, W), bool); pila = [(y, x) for y in range(H) for x in range(W) if franja[y, x] and (y in (0, H - 1) or x in (0, W - 1)) or (franja[y, x] and not oscuro[y, x] and a[y, x, 3] == 0)]
        pila = [(y, x) for y, x in pila if oscuro[y, x]] + [(y, x) for y in range(H) for x in range(W) if franja[y, x] and oscuro[y, x] and a[max(0, y - 1):y + 2, max(0, x - 1):x + 2, 3].min() == 0]
        while pila:
            y, x = pila.pop()
            if 0 <= y < H and 0 <= x < W and franja[y, x] and oscuro[y, x] and not quitar[y, x]:
                quitar[y, x] = True; pila += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1), (y + 1, x + 1), (y - 1, x - 1), (y + 1, x - 1), (y - 1, x + 1)]
        a[..., 3] = np.where(quitar, 0, a[..., 3])
        op = a[..., 3] > 40   # líneas finas de la celda: filas/columnas casi llenas con vacío a 4 px a un lado
        for i in range(H):
            if op[i].mean() > .6 and ((i < 4 or op[i - 4].mean() < .3) or (i >= H - 4 or op[i + 4].mean() < .3)): a[i, :, 3] = 0
        for j in range(W):
            if op[:, j].mean() > .6 and ((j < 4 or op[:, j - 4].mean() < .3) or (j >= W - 4 or op[:, j + 4].mean() < .3)): a[:, j, 3] = 0
        m = a[..., 3] > 40; visto = np.zeros((H, W), bool)   # restos sueltos del contorno: manchas aisladas de menos de 120 px
        for y0, x0 in zip(*np.nonzero(m)):
            if visto[y0, x0]: continue
            zona, pila = [], [(y0, x0)]; visto[y0, x0] = True
            while pila:
                y, x = pila.pop(); zona.append((y, x))
                for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and not visto[yy, xx]: visto[yy, xx] = True; pila.append((yy, xx))
            if len(zona) < 120:
                for y, x in zona: a[y, x, 3] = 0
    if conBaldosa is not True:
        a[..., 3] = np.where(a[..., 3] < 40, 0, a[..., 3])   # restos casi transparentes del borde de la celda
        im = Image.fromarray(a.astype('uint8')); im.crop(im.getbbox()).save(f'img/iconos/{nombre}.png'); print(nombre, im.getbbox()); continue
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # baldosa: tras split_sheet queda oscura y algo verdosa (~12,25,18); el contorno negro del dibujo no es verdoso.
    # Se borra la zona de baldosa conectada con los bordes (relleno desde fuera), así el dibujo no pierde nada.
    baldosa = ((g - r >= 5) & (g >= b) & (np.maximum(np.maximum(r, g), b) < 70)) | (a[..., 3] == 0)
    H, W = baldosa.shape; fuera = np.zeros((H, W), bool); pila = [(y, x) for y in (0, H - 1) for x in range(W)] + [(y, x) for x in (0, W - 1) for y in range(H)]
    while pila:
        y, x = pila.pop()
        if 0 <= y < H and 0 <= x < W and baldosa[y, x] and not fuera[y, x]:
            fuera[y, x] = True; pila += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    # huecos de baldosa encerrados por el dibujo (asas, cintas, toldos): zonas de baldosa de al menos 25 píxeles
    visto = fuera.copy()
    for y0, x0 in zip(*np.nonzero(baldosa & ~visto)):
        if visto[y0, x0]: continue
        zona, pila = [], [(y0, x0)]; visto[y0, x0] = True
        while pila:
            y, x = pila.pop(); zona.append((y, x))
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < H and 0 <= xx < W and baldosa[yy, xx] and not visto[yy, xx]: visto[yy, xx] = True; pila.append((yy, xx))
        if len(zona) >= 25:
            for y, x in zona: fuera[y, x] = True
    a[..., 3] = np.where(fuera, 0, a[..., 3])
    im = Image.fromarray(a.astype('uint8'))
    im.crop(im.getbbox()).save(f'img/iconos/{nombre}.png')
    print(nombre, im.getbbox())
