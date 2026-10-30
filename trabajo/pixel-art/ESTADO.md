# Conversión de sprites HD a pixel art

**Estado:** pausado (espera: el usuario termina las correcciones de los sprites HD) · **Prioridad: ALTA** · **Rama:** qa · **Actualizado:** 2026-10-30

## Objetivo
Que todos los personajes tengan el estilo pixel art de los jefes sin que la animación tiemble. Las hojas se piden en HD
(el generador las da consistentes entre cuadros) y se convierten aquí con un proceso fijo: misma rejilla y misma paleta
para todos los cuadros de un personaje.

## Próximo paso
Cuando el usuario dé por buenas las correcciones del Asesino:
1. En `tools/tira_asesino.py`, después de alinear (`QUIETOS`) y antes de `build_sheet.py`, pasar los cuadros por
   `pixelar([(cuadro, esc(k) * 296 / 325) ...])` de `tools/pixelar.py`, de modo que la escala de cada hoja ya quede
   aplicada (todos los cuadros al mismo tamaño de pixel art).
2. Con los cuadros ya a escala: en `js/pantalla/12-vista-del-guerrero.js` (`SPRITE_CLASE.asesino`) quitar `escala`
   (todo 1), poner `celda` al nuevo tamaño de celda y mostrar cada píxel de arte a `PIX` px de pantalla
   (`backgroundSize` = celdas × ancho × PIX). En `index.html`, `image-rendering: pixelated` para `.capa-skin` del Asesino.
3. Lo mismo en `animaciones.html` (ancho/alto/escala de la entrada `asesino`, sin `escalaCuadro`).
4. Subir `VERSION_IMG`. Comprobar con capturas: tamaño igual al actual, pies a la misma altura, sin temblor en reposo.
Hecho cuando el Asesino se vea en pixel art en batalla (duelo y grupo), menú, ranking y `animaciones.html`.

## Última sesión
**2026-10-30 · Claude**
- Cambios: `tools/pixelar.py` · nueva herramienta: cuadros HD -> pixel art (CLI y función `pixelar`).
- Cambios: `CLAUDE.md` (Sprites) · las hojas se piden en HD; única reducción permitida: `tools/pixelar.py`.
- Cambios: `PROMPT_SPRITE.md` · aviso al inicio: pedir siempre en HD.
- Cambios: `trabajo/pixel-art/` · este tema y `prueba_detalle.png` (HD a la izquierda, pixel art a la derecha).
- Sin commit: todo commiteado (ver el commit "Pixel art: herramienta tools/pixelar.py…").
- Verificación: prueba fuera del juego con el reposo y la Puñalada del Asesino (GIF comparativos enviados al usuario);
  `tools/pixelar.py` probado por CLI con dos cuadros.
- Quedó a medias: la conversión NO está aplicada al juego (decisión del usuario: primero sus correcciones).

## Decisiones
- 2026-10-30 · Estilo final: pixel art para los personajes, partiendo de HD · el pixel art generado directamente degradaba
  los cuadros (Maga, Arquero: rejilla y bordes distintos en cada cuadro); el HD es estable (usuario).
- 2026-10-30 · Parámetros de la prueba aprobada: píxel de 2 px de pantalla, paleta común de 40 colores, +25 % contraste,
  +15 % brillo, alfa duro, contorno oscuro de 1 px · con píxel de 3 y 32 colores la cara y las cuchillas se empastaban.
- 2026-10-30 · La conversión se aplicará cuando el usuario termine sus correcciones de los sprites HD (usuario).
- Sin decidir: si fondos e iconos (HD) también pasan a pixel art. Propuesta: dejarlos en HD; preguntar antes de aplicar.

## Hecho
- Prueba de conversión con el Asesino (reposo y Puñalada) · sin commit (scripts en el scratchpad) · aprobada por el usuario.
- `tools/pixelar.py`, reglas en `CLAUDE.md` y `PROMPT_SPRITE.md` · commit de esta sesión.

## Pendiente
- Aplicar al Asesino (ver Próximo paso).
- Maga: rehacer su tira desde su hoja HD (`tools/hojas/maga_hd.jpg`) con el mismo flujo (recorte, alineado, pixelar).
- Arquero: pedir hoja HD (aún usa el sprite del guerrero) y convertirla.
- Guerrero y skins (capas de 14 poses, ya en pixel art): decidir si se rehacen desde HD para igualar el tamaño de píxel.
- Decidir fondos e iconos (HD o pixel art).
- Valorar si el tamaño de píxel debe coincidir con el de los jefes (Minotauro, Asmodeo, Cerbero) y ajustar `PIX`.

## Cómo verificar
- `python3 tools/pixelar.py <carpeta_png> <salida> --factor 0.76 --ampliar` y mirar los PNG ampliados.
- Tras aplicarlo: `python3 tools/tira_asesino.py`, abrir `animaciones.html` (Asesino) y una batalla; comparar con
  `prueba_detalle.png`. Pruebas de siempre: `node pruebas/escenarios.js`, `node pruebas/sistemas.js`, `node pruebas/sin-pantalla.js`.

## Mapa del código
- `tools/pixelar.py` · `pixelar(cuadros, pix, colores)`: conversión; constantes `PIX`, `COLORES`, `CONTRASTE`, `BRILLO`, `CONTORNO`.
- `tools/tira_asesino.py` · arma `img/asesino/tira.png` desde `tools/hojas/asesino_*`; `esc(i)` = escala por hoja (debe
  coincidir con `SPRITE_CLASE.asesino.escala`).
- `js/pantalla/12-vista-del-guerrero.js` · `SPRITE_CLASE`: tira, cuadros, celda, escala por cuadro y reposo de cada clase.
- `js/pantalla/17-batalla.js` · `personaje()`: dibuja cada cuadro y aplica su escala.
- `animaciones.html` · entrada `asesino` (`escalaCuadro`) y `montarSprite`.

## Cuidado con
- La paleta es común por personaje: convertir SIEMPRE todos sus cuadros juntos (si se convierte un cuadro suelto, sale
  con otra paleta y desentona).
- Convertir después de alinear y apoyar los pies, y antes de `build_sheet.py`: si se alinea después, los desplazamientos
  ya no caen en la rejilla de píxeles.
- Al pasar la escala por hoja a la conversión, `escala` en el juego debe quedar a 1 (si no, se aplicaría dos veces).
- El reposo usa cuadros alineados por la capucha (`QUIETOS` en `tira_asesino.py`): mantener ese paso.

## Bitácora
- 2026-10-30 · Claude · Prueba de pixel art aprobada; herramienta y reglas listas; aplicación pendiente.
