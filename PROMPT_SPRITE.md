> **Pedir siempre en HD** (personajes grandes, con detalle y contornos limpios), nunca en pixel art: el generador no
> mantiene la misma rejilla de píxeles entre cuadros y la animación tiembla. La conversión a pixel art la hace
> `tools/pixelar.py` con un proceso fijo para todos los cuadros (ver `trabajo/pixel-art/ESTADO.md`).

Create a 2D sprite sheet of [CHARACTER DESCRIPTION, e.g. "a knight with a blue cape and silver armor"] performing a [ANIMATION, e.g. "walk cycle"], side view, facing right.

CANVAS AND GRID (strict):
- Output image of exactly [1280x1024] px.
- [5] columns x [4] rows = [20] cells, each cell exactly [256x256] px, all equal.
- One animation per row, frames ordered left to right: [row 1: walk, row 2: run, row 3: idle, row 4: attack].
- Each character is centered horizontally in its cell. The feet touch the same horizontal baseline in every cell, at 80% of the cell height.
- The character fits inside 60% of the cell width and height. Wide empty margin around it, so no frame ever touches another cell or the cell edges.
- No grid lines, borders, labels, numbers, text, or watermarks.

BACKGROUND:
- Perfectly flat solid green, exactly #00FF00, across the entire image.
- No gradient, no shadows, no ground, no floor, no glow, no vignette, no particles, no reflections.
- Do not use green anywhere on the character, including highlights and reflected light on armor or metal.
- The character must not cast any shadow on the background.

ART STYLE:
- Clean [hand-painted / cartoon / cel-shaded / flat vector-style] 2D illustration with crisp, well-defined outlines.
- Consistent lighting from the top-left in every frame.
- Consistent line weight and color palette in every frame.
- Avoid very thin wisps of hair, semi-transparent fabric, smoke, or motion blur, since they make background removal harder.
- The character keeps identical proportions, size, colors, costume details, and design in all frames. Only the pose changes.


## Reemplazo de personaje o skin en frames existentes (genérico)

Adjuntar 1) la hoja de frames actual (rejilla verde con separadores negros, p. ej. exportada de `img/<personaje>/tira.png`)
y 2) una imagen de referencia del nuevo aspecto. Rellenar lo que va entre corchetes.

```
Redraw the FIRST attached image (a sprite sheet of [N] animation frames of [CURRENT CHARACTER, e.g. "a hooded assassin with two curved daggers"] performing [ANIMATION, e.g. "a slashing attack"]) frame by frame, replacing ONLY the character's appearance with the one in the SECOND attached image ([NEW LOOK, e.g. "translucent pale-blue glowing cape and hood, black leather armor, ghostly light-blue daggers"]).

KEEP EXACTLY (strict):
- The same [N] frames, in the same order, with the same poses, body proportions, size and position of the character inside each cell. Do not add, remove, merge or reorder frames.
- The same canvas size, the same [COLS] columns x [ROWS] rows grid and the same black separator lines between cells. Empty cells stay empty.
- The same flat solid green #00FF00 background in every cell (no shadows, glow or gradient on the background).
- The same effects (impact flashes, dust, trails) where they appear, recolored to fit the new look if needed.
- The same cartoon 2D hand-painted style with thick dark outlines and the same line weight.

CHANGE ONLY:
- Clothing, armor, colors, materials, eyes and weapons, to match the reference. Same silhouette and weapon type unless the reference says otherwise.
- Translucent or glowing parts must be tinted and opaque enough that the green background does not show through.

No text, no labels, no numbers, no watermark.
```


### Skins del Asesino (flujo completo, 2026-11-07: Escarcha)
1. `python tools/hoja_base_asesino.py` → hojas base en `tools/hojas/asesino_base_<anim>[_N].png` (cuadros y rejilla: `tools/asesino_grupos.py`).
2. A Gemini, por hoja: la base + la referencia de la skin (`tools/hojas/asesino_skins/<skin>.png`) y el prompt de arriba, añadiendo:
   "the character at the SAME SMALL SIZE ... keep crouched poses crouched ... Do NOT add slash trails or effects that are not in
   the original ... pure bright flat green #00FF00 (not a darker green)". Gemini tiende a agrandar, enderezar poses y añadir tajos.
3. Revisar: `python tools/comparar_hoja.py BASE NUEVA COLS FILAS N lado.png`; corregir en la misma conversación (2 intentos).
4. `python tools/skin_asesino.py <skin> <anim> HOJA COLS FILAS` (2.ª hoja y siguientes con `INICIO=N`; paso con `DESVANECER=3,4,5`),
   luego `python tools/tira_skin_asesino.py <skin>` y copiar celda y escalas a SKINS (`js/logica/08-skins.js`).

## Enemigos de las etapas 2-3 (contenido de nivel alto)

Hoy son la parca teñida con un filtro. Cada uno se rehace con el **reemplazo genérico** de arriba sobre la hoja de la
parca, para que tenga **los mismos 7 cuadros** (260×200 cada uno, en fila: `img/enemigos/parca.png`, 1820×200) y entre en
el juego sin código: guardar la hoja en `img/enemigos/<id>.png` y poner `hoja: 'img/enemigos/<id>.png'` en su entrada
de `TIPOS_ENEMIGO` (`js/logica/22-campanas-etapas-de-10.js`). Los jefes usan la de `img/enemigos/parca_jefe.png` (mismo
formato) como base. Añadir cada uno a `animaciones.html`.

En el prompt genérico: [N] = 7, [COLS] = 7, [ROWS] = 1, [CURRENT CHARACTER] = "a hooded grim reaper with a long scythe",
[ANIMATION] = "idle, a scythe attack and a hit reaction", y en [NEW LOOK] la descripción de la tabla (con su imagen de
referencia). Si el enemigo no lleva guadaña, pedir que el arma nueva siga el mismo movimiento.

| id | Etapa | Nuevo aspecto ([NEW LOOK]) |
|---|---|---|
| `esqueleto` | 2 | a skeleton warrior in rusted chain mail, chipped round shield and a notched short sword, glowing pale-blue eye sockets |
| `caballero` | 2 | a spectral knight in translucent blue-grey plate armor, tattered dark cape, ghostly longsword, faint cyan glow |
| `gargola` | 2 | a hunched stone gargoyle with bat wings and claws, cracked grey stone skin with moss, glowing amber eyes |
| `campeon` (jefe) | 2 | an undead champion in heavy black plate armor with bone trims and a huge two-handed greatsword, red eye glow |
| `liche` (jefe) | 2 | a lich king in ornate purple-and-gold robes and a spiked crown, skeletal hands, a staff with a green soul gem |
| `diablillo` | 3 | a small red imp with tiny horns, bat wings, a long tail and a three-pronged fork |
| `demonio` | 3 | a fire demon with charred black skin and glowing lava cracks, curved horns, flaming claws |
| `sucubo` | 3 | a succubus with dark purple skin, curled horns, bat wings, a black leather outfit and a whip of shadow |
| `verdugo` (jefe) | 3 | an abyssal executioner: huge brute in a black iron hood and chains, a giant blood-red axe |
| `senor` (jefe) | 3 | the Lord of the Abyss: towering demon with a crown of horns, obsidian armor with lava veins, a burning greatsword |

## Arquero (2026-11-07)
Prompts usados (referencia + 7 hojas, fondo magenta porque el traje es verde) en `trabajo/sprites-arquero/ESTADO.md`. Pedir el personaje
a ~55 % del alto de la celda: a tamaño normal el arco largo se corta. Tira: `python tools/tira_arquero.py`.
