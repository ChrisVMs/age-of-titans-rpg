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
