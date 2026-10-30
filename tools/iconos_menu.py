#!/usr/bin/env python3
# Recorta las hojas de iconos de tools/hojas/ en img/iconos/<nombre>.png con split_sheet.py:
#   iconos_menu.jpg (5x5): cada icono viene sobre una baldosa verde oscuro, que se quita (relleno desde los bordes).
#   iconos_clases.jpg (4x2): sobre verde plano (sin baldosa).
#   iconos_calabozo.jpg (4x3): insignias con baldosa propia (se conserva).
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
          ('iconos_calabozo.jpg', 4, 3, ['candado', 'mas', 'calabozo', 'hoguera'] + [f'cal_{i}' for i in range(1, 9)], 'insignia')]
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
