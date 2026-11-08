# Sprites HD del Arquero

**Estado:** en curso · **Rama:** main · **Actualizado:** 2026-11-07

## Objetivo
Dar al Arquero su propio sprite HD (hoy usa el del guerrero), de rango, con el mismo estilo que el Asesino: reposo, ataque
a distancia, Doble flecha, Lluvia de flechas (estilo Wartune), recibir golpe y derrota, más los efectos (flecha, lluvia).

## Próximo paso
Que el usuario lo pruebe en batalla (1 contra 1 y en grupo), campamento, web y Android. Ajustes posibles: tamaño
(`escala` de `SPRITE_CLASE.arquero`), tiempos de `ANIM_ARQUERO`, posición de la flecha y la lluvia (`flechaArquero`,
`lluviaFlechas`). Luego, si lo pide: cuadros intermedios con `prototipos/interpolar/PROCESO.md`.

## Última sesión
**2026-11-08 · Claude (retroceso)**
- Golpe exagerado: centrado por la cabeza, los pies se deslizaban hasta 90 px. Ahora el golpe se alinea por los pies
  (`pies` en `tira_arquero.py`) y la animación es más corta (6 cuadros, 580 ms en vez de 10 y 900 ms). `VERSION_IMG` 24.
- Borde negro en la lluvia: las líneas separadoras de la hoja de efectos tocaban las flechas; se borran las columnas y
  filas oscuras cerca del borde de cada celda. `efectos.png?v=2` en `index.html` y `animaciones.html`.

**2026-11-08 · Claude (lluvia del rival)**
- La lluvia del arquero rival caía sobre su propio bando (`blancos` = siempre `enemigos`): ahora cae sobre el bando contrario.
  Volea y lluvia volteadas para el rival (`izq`). En grupo (arena) la lluvia es más pequeña (`media`, 140 px).

**2026-11-07 · Claude (correcciones del usuario)**
- Reposo rehecho en Gemini: la fila 2 de la hoja vieja estaba 6 px más alta (parecía ponerse de puntillas) y no respiraba.
  Ahora: botas fijas y torso y capa que se mueven. El físico delgado se mantiene (decisión del usuario: solo rehacer el reposo).
- En grupo (campaña) la flecha salía al empezar la animación y el daño llegaba antes del disparo: ahora `animHeroe` pasa el
  disparo al cuadro en que suelta y el daño llega al caer la flecha.
- Lluvia de flechas: volea hacia arriba (sale por arriba) y luego cae sobre todos los enemigos vivos (`lluviaSobre`).
- Lluvia de flechas daña a todos (pedido del usuario): `area: true` en la habilidad; el motor (`golpearA`, 29-motor) da un
  golpe a cada enemigo vivo con una sola animación. Mult 1.6 sin cambiar. Métricas: iguales que sin el cambio (la diferencia
  con `referencia.json` ya existía en HEAD).

**2026-11-07 · Claude (generado e integrado)**
- Gemini (Chrome): referencia + 7 hojas en `tools/hojas/arquero_*.jpg`. Doble flecha corregida una vez (fondo gris, faltaba
  el arco); el reposo, una vez (personaje demasiado grande). Efectos con magenta más oscuro y separadores (se limpian).
- `tools/tira_clase.py arquero` (nuevo): recorta con `split_sheet.py --key <fondo> --no-trim` (opción nueva; con fondo no verde
  ya no se borra el verde del personaje), limpia magenta, restos de celdas vecinas y separadores, centra por la cabeza y
  une con `build_sheet.py`: `img/arquero/tira.png` (65 cuadros, 349x366) y `img/arquero/efectos.png` (4).
- Juego: `SPRITE_CLASE.arquero` (escala .555, derrota .676), `ANIM_ARQUERO` (ataque, doble, lluvia, perforante, golpe,
  derrota), flecha en vuelo y lluvia sobre el enemigo; en grupo, `proyectil()` dibuja la flecha. Habilidades del arquero con
  `animacion` doble / lluvia / perforante (sin cambios de daño). `animaciones.html` con todas. `VERSION_IMG` 23.
- Cuadros 26 y 32 se saltan (restos de flechas pegados al cuerpo).
- Verificación: `node pruebas/todo.js` igual que antes (solo falla «Clases: cadena…», previo); juego y `animaciones.html`
  cargan sin errores de consola.

**2026-11-07 · Claude**
- Tema creado. Prompts listos (abajo). La extensión de Chrome no respondía: nada generado aún.

## Decisiones
- 2026-11-07 · Usuario: Doble flecha es **solo animación** (Disparo certero se dibuja como dos flechas); las habilidades no cambian.
- 2026-11-07 · Usuario: aspecto «explorador del bosque».
- 2026-11-07 · Fondo **magenta #FF00FF** (no verde): el traje es verde y el croma verde se lo comería.

## Prompts (Gemini)
Bloque común (añadir al final de cada prompt 1-7):
```
Side view, facing right. Same character as the attached reference image, identical design, colors, proportions and size in every frame; only the pose changes.
CANVAS: the grid given below, all cells equal, character centered horizontally in each cell, feet on the same baseline at 85% of the cell height, character inside 60% of the cell width and height, wide empty margins, nothing touches another cell. No grid lines, labels, numbers, text or watermark.
BACKGROUND: perfectly flat solid magenta #FF00FF in every cell. No gradient, shadows, ground, glow or particles on the background. Never use magenta or pink on the character or effects.
STYLE: high-detail hand-painted cartoon 2D fantasy RPG art, thick dark outlines, consistent top-left lighting. No motion blur, no semi-transparent smoke.
```
0. Referencia (1 imagen): `A hooded forest ranger archer for a 2D fantasy RPG: dark forest-green hood and short cape, brown leather armor and bracers, dark trousers and boots, a wooden longbow and a quiver of arrows on the back, face partly shaded by the hood. Full body, standing in a relaxed ready pose holding the bow. Single character centered.` + bloque común (lienzo 1024x1024, una celda).
1. Reposo · 5x2 (10): `idle breathing loop, bow held low, subtle cape and chest movement, frame 10 flows back into frame 1.`
2. Ataque · 5x2 (10): `basic shot from his place: reaches to the quiver, nocks an arrow, draws the bow, aims, releases (the arrow leaves the frame to the right, small white release flash), bow recoils, returns to idle.`
3. Doble flecha · 5x2 (10): `Double Arrow skill: nocks two arrows at once with a faint green glow, full draw, releases both arrows together (two arrows flying right, slightly spread), recoil, back to idle.`
4. Lluvia de flechas · 5x2 (10): `Arrow Rain skill: kneels, nocks several arrows, aims steeply upward at 60 degrees, releases a volley into the sky (arrows flying up and out of the frame), holds the pose, stands back to idle.`
5. Recibir golpe · 5x2 (10): `hit reaction: flinches back from a blow on the chest, staggers one step back, recovers balance and returns to idle with the bow.`
6. Derrota · 5x3 (15): `defeat: hit hard, drops to one knee, the bow slips from his hand, falls to the ground and lies still (last 3 frames almost identical, lying down).`
7. Efectos · 4x1 (4, sin personaje): `game effects on magenta: 1 a single wooden arrow flying right, horizontal; 2 two arrows flying right, slightly spread, faint green trail; 3 a dense rain of arrows falling down from the sky at a steep angle, about 20 arrows; 4 arrows stuck in the ground with small dust puffs.`

## Pendiente
- Pruebas del usuario (batalla, grupo, campamento, Android).
- Luego, cuadros intermedios con `prototipos/interpolar/PROCESO.md` (solo si el usuario lo pide).

## Cómo verificar
`node pruebas/todo.js`; ver el arquero en `animaciones.html` y en batalla (lo prueba el usuario).

## Bitácora
- 2026-11-07 · Claude · Hojas generadas e integradas en el juego.
- 2026-11-07 · Claude · Tema creado, prompts listos.
