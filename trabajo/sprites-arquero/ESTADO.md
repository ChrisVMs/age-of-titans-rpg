# Sprites HD del Arquero

**Estado:** pausado (espera: extensión Claude in Chrome conectada, para usar Gemini) · **Rama:** main · **Actualizado:** 2026-11-07

## Objetivo
Dar al Arquero su propio sprite HD (hoy usa el del guerrero), de rango, con el mismo estilo que el Asesino: reposo, ataque
a distancia, Doble flecha, Lluvia de flechas (estilo Wartune), recibir golpe y derrota, más los efectos (flecha, lluvia).

## Próximo paso
1. Con Chrome conectado: en Gemini, generar primero la **referencia** del personaje (prompt 0 de abajo) y guardarla en
   `tools/hojas/arquero_referencia.jpg`.
2. Cada hoja (prompts 1-7) en la misma conversación, adjuntando la referencia; guardar en `tools/hojas/arquero_<anim>.jpg`.
3. Recortar con `tools/split_sheet.py --key FF00FF`, armar la tira con `tools/build_sheet.py` (un `tools/tira_arquero.py`
   como `tira_asesino.py`), `SPRITE_CLASE.arquero` + `ANIM_ARQUERO` + proyectil, y `animaciones.html`.

## Última sesión
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
- Generar referencia y hojas (Gemini). Revisar con el criterio de `memory/criterio-hojas-gemini` (2 intentos por hoja).
- Tira, `SPRITE_CLASE.arquero`, animaciones del juego, proyectil y lluvia; `animaciones.html`.
- Luego, cuadros intermedios con `prototipos/interpolar/PROCESO.md` (solo si el usuario lo pide).

## Cómo verificar
`node pruebas/todo.js`; ver el arquero en `animaciones.html` y en batalla (lo prueba el usuario).

## Bitácora
- 2026-11-07 · Claude · Tema creado, prompts listos.
