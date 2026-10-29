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
