#!/usr/bin/env python3
# Recorta las hojas de iconos de tools/hojas/ en img/iconos/<nombre>.png con split_sheet.py:
#   iconos_menu.jpg (5x5): cada icono viene sobre una baldosa verde oscuro, que se quita (relleno desde los bordes).
#   iconos_clases.jpg (4x2): sobre verde plano (sin baldosa).
#   iconos_calabozo.jpg (4x3): insignias con baldosa propia (se conserva).
#   iconos_runas.jpg (6x5): baldosa gris/azul oscura con borde negro: se quita rellenando desde fuera ('oscura').
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
            'esp_bastion', 'esp_gladiador'], 'marco'),
          # runas, reliquias y materiales: baldosa gris o azul oscura con borde negro ('oscura')
          ('iconos_runas.jpg', 6, 5, ['runa_ataque', 'runa_vida', 'runa_defensa', 'runa_armadura', 'runa_critico', 'runa_danoCritico',
            'runa_penetracion', 'runa_reduccion', 'runa_resistencia', 'runa_habilidad', 'runa_jefes', 'runa_fortuna',
            'rel_colmillo', 'rel_collar', 'rel_ceniza', 'rel_ala', 'rel_corona', 'rel_sello',
            'rel_cuerno', 'rel_hacha', 'rel_pezuna', 'mat_piedra', 'mat_polvo', 'mat_almas',
            'mat_esencia', 'runas', 'pulir'], 'oscura'),
          # interfaz: verde plano (celdas vacías con '-')
          ('iconos_interfaz.jpg', 5, 5, ['hecho', 'estrella', 'ficha', 'regalo', 'reciclar', 'guardar', 'cambiar', 'volver', 'anuncio', 'editar',
            '-', 'auto', '-', '-', 'desconocido', 'ranura_vacia', 'oro_1', 'plata_2', 'bronce_3', '-', '-', '-', '-', 'tienda_campana', 'hoguera_hd'], False),
          # batalla: baldosa verde con contorno y el nombre escrito abajo (se recorta antes: 'marco_texto')
          ('iconos_batalla.jpg', 5, 5, ['hab_estocada', 'hab_tajo', 'hab_aplastante', 'hab_disparo', 'hab_perforante', 'hab_lluvia', 'hab_bola', 'hab_lanza', '-', 'hab_meteoro',
            'hab_punalada', 'hab_paso', 'hab_danza', 'est_quemadura', 'est_veneno', '-', 'est_sangrado', 'est_congelacion', '-', 'est_aturdimiento'], 'marco_texto'),
          # árbol del Guerrero: fondo gris oscuro (no verde) y nombre escrito abajo ('gris_texto')
          ('iconos_arbol_guerrero.jpg', 5, 4, ['rama_furia', 'rama_baluarte', 'rama_tactica', 'nodo_fuerza', 'nodo_certero',
            'nodo_estocada_m', 'nodo_sed', 'nodo_aplastante', 'nodo_piel', 'nodo_coraza',
            'nodo_represalia', 'nodo_aliento', 'nodo_bastion', 'nodo_maestria', 'nodo_reflejos',
            'nodo_tajo_veloz', 'nodo_cazador', 'nodo_adrenalina', '-', '-'], 'gris_texto'),
          ('iconos_arbol_arquero.jpg', 5, 4, ['rama_precision', 'rama_supervivencia', 'rama_caceria', 'nodo_punteria', 'nodo_ojo_halcon',
            'nodo_disparo_m', 'nodo_letal', 'nodo_perforante', 'nodo_agilidad', 'nodo_cuero',
            'nodo_trampas', 'nodo_instinto', 'nodo_camuflaje', 'nodo_rastreo', 'nodo_flecha_ven',
            'nodo_lluvia_r', 'nodo_penetrante', 'nodo_marca', '-', '-'], 'gris_texto'),
          ('iconos_arbol_mago.jpg', 5, 4, ['rama_fuego', 'rama_hielo', 'rama_arcano', 'nodo_poder_arc', 'nodo_ignicion',
            'nodo_bola_m', 'nodo_combustion', 'nodo_meteoro', 'nodo_escarcha', 'nodo_piel_hielo',
            'nodo_lanza_m', 'nodo_hielo_et', 'nodo_ventisca', 'nodo_sabiduria', 'nodo_mente',
            'nodo_drenaje', 'nodo_concentra', 'nodo_torrente', '-', '-'], 'gris_texto'),
          ('iconos_cofres.jpg', 4, 1, ['cofre_madera', 'cofre_hierro', 'cofre_dorado', 'cofre_mitico'], False),
          ('iconos_mascotas.jpg', 5, 3, [f'masc_{i}' for i in ['rata', 'sapo', 'buho', 'lobo', 'tortuga', 'murcielago', 'fenix', 'pantera',
            'golem', 'dragon', 'grifo', 'unicornio', 'hidra', 'leviatan', 'can']], False)]
for hoja, cols, filas, nombres, conBaldosa in HOJAS:
  tmp = tempfile.mkdtemp()
  # sin verde: celdas tal cual (el texto queda abajo) y un croma que no existe (magenta) para no apagar los verdes del dibujo
  uniforme = ['--key', 'FF00FF'] if conBaldosa == 'gris_texto' else ['--uniform']
  subprocess.run(['python3', 'tools/split_sheet.py', f'tools/hojas/{hoja}', '--cols', str(cols), '--rows', str(filas), *uniforme, '--out', tmp],
                 check=True, capture_output=True)
  for nombre, f in zip(nombres, sorted(glob.glob(f'{tmp}/*.png'))):
    if nombre == '-': continue
    a = np.array(Image.open(f).convert('RGBA')).astype(int); modo = conBaldosa
    if modo == 'gris_texto':   # nombre abajo (24 %) y fondo gris oscuro liso: se quita rellenando desde el borde
        # colores de la hoja original (split_sheet apaga los verdes intensos aunque no sean fondo): misma celda de la rejilla
        k = nombres.index(nombre); hoja_im = Image.open(f'tools/hojas/{hoja}').convert('RGBA'); cw, ch = hoja_im.width / cols, hoja_im.height / filas
        c0, f0 = k % cols, k // cols
        a = np.array(hoja_im.crop((round(c0 * cw), round(f0 * ch), round((c0 + 1) * cw), round((f0 + 1) * ch)))).astype(int)
        a = a[:int(a.shape[0] * .74)]; a[..., 3] = 255
        mx = a[..., :3].max(-1); mn = a[..., :3].min(-1); H, W = mx.shape
        pasa = (mx - mn <= 14) & (mx >= 14) & (mx <= 75)
        fuera = np.zeros((H, W), bool); pila = [(y, x) for y in (0, H - 1) for x in range(W)] + [(y, x) for x in (0, W - 1) for y in range(H)]
        while pila:
            y, x = pila.pop()
            if 0 <= y < H and 0 <= x < W and pasa[y, x] and not fuera[y, x]:
                fuera[y, x] = True; pila += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
        a[..., 3] = np.where(fuera, 0, 255)
        m = a[..., 3] > 0; visto = np.zeros((H, W), bool)   # texto de la fila de arriba: manchas enteras en el 14 % superior
        for y0, x0 in zip(*np.nonzero(m)):
            if visto[y0, x0]: continue
            zona, pila = [], [(y0, x0)]; visto[y0, x0] = True
            while pila:
                y, x = pila.pop(); zona.append((y, x))
                for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and not visto[yy, xx]: visto[yy, xx] = True; pila.append((yy, xx))
            if max(y for y, _ in zona) < H * .14 or len(zona) < 30:
                for y, x in zona: a[y, x, 3] = 0
        im = Image.fromarray(a.astype('uint8')); im.crop(im.getbbox()).save(f'img/iconos/{nombre}.png'); continue
    if modo == 'marco_texto':   # el nombre escrito ocupa el 24 % inferior de la celda
        a = a[:int(a.shape[0] * .76)]; modo = 'marco'
    if modo in ('insignia', 'oscura'):   # verde del dibujo dentro de la baldosa (limo, brillos): lo que no toca el borde vuelve a ser opaco
        m = a[..., 3] < 128; H, W = m.shape; fuera = np.zeros((H, W), bool)
        pila = [(y, x) for y in (0, H - 1) for x in range(W)] + [(y, x) for x in (0, W - 1) for y in range(H)]
        while pila:
            y, x = pila.pop()
            if 0 <= y < H and 0 <= x < W and m[y, x] and not fuera[y, x]:
                fuera[y, x] = True; pila += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
        a[..., 3] = np.where(m & ~fuera, 255, a[..., 3])
    if modo == 'oscura':   # baldosa oscura poco saturada (~37,47,47 o ~31,39,60) y su borde negro junto al borde de la celda
        r, g, b = a[..., 0], a[..., 1], a[..., 2]; mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b)
        H, W = mx.shape; banda = np.zeros((H, W), bool); banda[:24] = banda[-24:] = True; banda[:, :24] = banda[:, -24:] = True
        cerca = lambda c: np.sqrt(((a[..., :3] - np.array(c)) ** 2).sum(-1)) < 13   # solo los dos colores de la baldosa
        pasa = (a[..., 3] < 128) | cerca((37, 47, 47)) | cerca((31, 39, 60)) | (banda & (mx < 26))
        fuera = np.zeros((H, W), bool); pila = [(y, x) for y in (0, H - 1) for x in range(W)] + [(y, x) for x in (0, W - 1) for y in range(H)]
        while pila:
            y, x = pila.pop()
            if 0 <= y < H and 0 <= x < W and pasa[y, x] and not fuera[y, x]:
                fuera[y, x] = True; pila += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
        a[..., 3] = np.where(fuera, 0, a[..., 3])
        modo = 'marco'
    if modo == 'marco':   # contorno oscuro de la baldosa: líneas oscuras conectadas al borde, en una franja de 12 px
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
    if modo is not True:
        a[..., 3] = np.where(a[..., 3] < 40, 0, a[..., 3])   # restos casi transparentes del borde de la celda
        for _ in range(3 if conBaldosa is False else 0):   # separadores de la hoja: líneas casi llenas en el borde del dibujo (se mira tras recortarlo)
            bb = Image.fromarray(a.astype('uint8')).getbbox(); a = a[bb[1]:bb[3], bb[0]:bb[2]]; op = a[..., 3] > 40; H, W = op.shape
            for j in list(range(8)) + list(range(W - 8, W)):
                if op[:, j].mean() > .7: a[:, j, 3] = 0
            for i in list(range(8)) + list(range(H - 8, H)):
                if op[i].mean() > .7: a[i, :, 3] = 0
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

# ---- iconos_resto.jpg: rejilla irregular (filas 1-2 de 5 columnas, filas 3-5 de 6) y texto en algunas celdas ----
# Se corta celda a celda desde la hoja original (split_sheet apaga los verdes del dibujo), se quita la franja de texto
# de las celdas que lo tienen y el fondo verde se borra rellenando desde el borde (los verdes del dibujo, encerrados
# por su contorno negro, se conservan).
RESTO = 'tools/hojas/iconos_resto.jpg'
SKINS = ['egida_tormentosa', 'obsidiana_oscura', 'guardian_espectral', 'gendarme_mecanico', 'druida_verdial',
         'aurico_solar', 'cristalino_amaranto', 'infernal', 'caballero_muerte', 'necro_guardian']
T = (.18, .86)  # celda con "BLESSING" arriba y el nombre abajo
B = (0, .84)   # celda con el nombre abajo
FILAS_RESTO = [((0, 210), 5, [(f'skin_{k}', None) for k in SKINS[:5]]),
               ((210, 421), 5, [(f'skin_{k}', None) for k in SKINS[5:]]),
               ((421, 597), 6, [(n, None) for n in ['mod_frenesi', 'mod_coraza', 'mod_robusto', 'mod_espinas', 'mod_regen', 'mod_igneo']]),
               ((597, 771), 6, [('mod_gelido', None), ('mod_venenoso', None), ('bend_furia', T), ('bend_muralla', T), ('bend_vigor', T), ('bend_coraza', T)]),
               ((771, 944), 6, [('bend_respiro', None), ('bend_segunda', B), ('eco_kael', B), ('eco_brunna', B), ('eco_vex', B), ('eco_aldric', B)])]
OSCURAS = {'mod_coraza', 'bend_furia', 'bend_muralla', 'bend_vigor', 'bend_coraza'}
hoja_resto = Image.open(RESTO).convert('RGBA')
for (y0, y1), cols, celdas in FILAS_RESTO:
    cw = hoja_resto.width / cols
    for k, (nombre, r) in enumerate(celdas):
        a = np.array(hoja_resto.crop((round(k * cw) + 3, y0 + 3, round((k + 1) * cw) - 3, y1 - 3))).astype(int)
        if r: a = a[int(a.shape[0] * r[0]):int(a.shape[0] * r[1])]
        H, W = a.shape[:2]; dif = a[..., 1] - np.maximum(a[..., 0], a[..., 2]); verde = (dif > 40) & (a[..., 1] > 120)
        if nombre in OSCURAS: verde |= (dif > 70) & (a[..., 1] > 95)   # baldosa verde oscura (~6,122,7)
        fuera = np.zeros((H, W), bool); pila = [(y, x) for y in (0, H - 1) for x in range(W)] + [(y, x) for x in (0, W - 1) for y in range(H)]
        while pila:
            y, x = pila.pop()
            if 0 <= y < H and 0 <= x < W and verde[y, x] and not fuera[y, x]:
                fuera[y, x] = True; pila += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
        a[..., 3] = np.where(fuera, 0, 255)
        im = Image.fromarray(a.astype('uint8')); im.crop(im.getbbox()).save(f'img/iconos/{nombre}.png')
