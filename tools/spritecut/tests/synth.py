"""Genera hojas sintéticas de prueba con verdad conocida (sin depender de archivos externos)."""
import json

import numpy as np
from PIL import Image

MAGENTA = (255, 0, 255)
COLORS = {1: (30, 30, 40), 2: (200, 200, 210), 3: (120, 120, 140), 4: (230, 180, 140),
          5: (180, 40, 40), 6: (240, 210, 60)}
NW, NH, S = 16, 24, 4  # resolución nativa del frame y tamaño de píxel


def knight(frame, attack=False):
    """Caballero de 16x24 nativo; frame cambia piernas/espada."""
    g = np.zeros((NH, NW), np.int32)
    g[2:7, 5:11] = 2; g[3:6, 6:10] = 1; g[4, 6:10] = 4          # yelmo con visor
    g[7:15, 4:12] = 3; g[8:14, 5:11] = 2; g[10, 4:12] = 5        # torso y cinturón
    g[8:13, 2:4] = 3; g[8:13, 12:14] = 3                         # brazos
    off = [0, 1, 0, -1][frame % 4]
    g[15:22, 5:7] = 1; g[15:22, 9:11] = 1                         # piernas
    g[22:24, 4 + off:7 + off] = 1; g[22:24, 9 - off:12 - off] = 1  # pies
    if attack:
        reach = 2 + frame
        g[9:11, 14:min(NW, 14 + reach)] = 6
    g[0:2, 7:9] = 5                                              # pluma
    return g


def render(g):
    img = np.zeros((NH * S, NW * S, 3), np.uint8)
    img[:] = MAGENTA
    big = np.kron(g, np.ones((S, S), np.int32))
    for k, c in COLORS.items():
        img[big == k] = c
    return img, big > 0


def make_sheet(cols=4, rows=2, cell=(24, 32)):
    cw, ch = cell[0] * S, cell[1] * S
    sheet = np.zeros((rows * ch, cols * cw, 3), np.uint8)
    sheet[:] = MAGENTA
    masks = np.zeros(sheet.shape[:2], bool)
    for r in range(rows):
        for c in range(cols):
            img, m = render(knight(c, attack=(r == 1)))
            y = ch - img.shape[0] - S          # pies a la misma altura
            x = (cw - img.shape[1]) // 2 // S * S
            ys, xs = slice(r * ch + y, r * ch + y + img.shape[0]), slice(c * cw + x, c * cw + x + img.shape[1])
            sheet[ys, xs][m] = img[m]
            masks[ys, xs] |= m
    return sheet, masks


HYP = {"name": "knight", "background": "#FF00FF", "grid": {"cols": 4, "rows": 2},
       "expected_pixel_size": 4, "anchor": "bottom-center",
       "animations": [{"row": 0, "name": "walk", "frames": 4}, {"row": 1, "name": "attack", "frames": 4}]}


def write_good(dirpath):
    sheet, _ = make_sheet()
    p = dirpath / "knight.png"
    Image.fromarray(sheet).save(p)
    (dirpath / "knight.json").write_text(json.dumps(HYP))
    return p


def write_bad(dirpath, seed=1):
    """Fondo irregular (gradiente + ruido), halos rosados, ruido en colores,
    frames 1 y 2 de la fila 0 pegados, una mancha suelta."""
    rng = np.random.default_rng(seed)
    sheet, masks = make_sheet()
    H, W = masks.shape
    # pegar frame 1 contra frame 2: desplazar contenido de la celda 1 hacia la derecha
    cw = W // 4
    cell = slice(cw, 2 * cw)
    shift = 48
    sub, msub = sheet[:H // 2, cell].copy(), masks[:H // 2, cell].copy()
    sheet[:H // 2, cell][msub] = MAGENTA
    masks[:H // 2, cell] = False
    tgt = sheet[:H // 2, cw + shift:2 * cw + shift]
    tgt[msub] = sub[msub]
    masks[:H // 2, cw + shift:2 * cw + shift] |= msub
    # fondo irregular
    yy, xx = np.indices((H, W))
    bg = np.dstack([255 - xx * 20 // W, 8 + yy * 14 // H, 255 - yy * 16 // H]).astype(np.int32)
    bg += rng.integers(-6, 7, bg.shape)
    out = np.where(masks[..., None], sheet.astype(np.int32) + rng.integers(-8, 9, sheet.shape), bg)
    # halo: anillo de 1px rosado alrededor de los sprites
    from scipy import ndimage
    ring = ndimage.binary_dilation(masks) & ~masks
    near = ndimage.grey_dilation(np.where(masks[..., None], sheet, 0), size=(3, 3, 1))
    out[ring] = (near[ring].astype(np.int32) + np.array(MAGENTA)) // 2
    # mancha suelta
    out[10:13, 10:13] = (20, 20, 20)
    p = dirpath / "knight_bad.png"
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(p)
    (dirpath / "knight_bad.json").write_text(json.dumps({**HYP, "name": "knight_bad"}))
    return p
