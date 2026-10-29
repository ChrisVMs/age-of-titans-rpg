#!/usr/bin/env python3
"""
build_sheet.py - Une varios frames PNG en una sola hoja (grilla) con separadores,
SIN reescalar ni interpolar: solo copia píxeles. Es la inversa de split_sheet.py.

Uso:
    python build_sheet.py frames/                          # todos los PNG de la carpeta
    python build_sheet.py frames/ --cols 5                 # 5 columnas
    python build_sheet.py frames/ --by-prefix              # una fila por animación (idle_*, run_*, ...)
    python build_sheet.py a.png b.png c.png --cols 3       # archivos sueltos
    python build_sheet.py frames/ --bg transparent         # hoja con fondo transparente
    python build_sheet.py frames/ --out mi_hoja.png --sep 4 --sep-color FFFFFF

Requiere: pip install pillow
"""
import argparse
import json
import math
import re
import sys
from collections import OrderedDict
from pathlib import Path

from PIL import Image


def natural_key(p):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", p.name)]


def collect(inputs, pattern):
    files = []
    for item in inputs:
        p = Path(item)
        if p.is_dir():
            files += sorted(p.glob(pattern), key=natural_key)
        elif p.is_file():
            files.append(p)
        else:
            sys.exit(f"No existe: {item}")
    if not files:
        sys.exit("No encontré imágenes.")
    return files


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def prefix_of(path):
    m = re.match(r"^(.*?)[_\-]?\d+$", path.stem)
    return m.group(1) if m else path.stem


def main():
    ap = argparse.ArgumentParser(description="Une frames PNG en una hoja con separadores, sin perder calidad.")
    ap.add_argument("inputs", nargs="+", help="carpeta(s) y/o archivos de imagen")
    ap.add_argument("--out", default="spritesheet.png", help="archivo de salida (default: spritesheet.png)")
    ap.add_argument("--pattern", default="*.png", help="patrón dentro de carpetas (default: *.png)")
    ap.add_argument("--cols", type=int, help="columnas (default: automático)")
    ap.add_argument("--by-prefix", action="store_true",
                    help="una fila por prefijo de nombre (idle_00, idle_01 -> fila 'idle')")
    ap.add_argument("--cell", help="tamaño fijo de celda, ej. 256x256 (default: el frame más grande)")
    ap.add_argument("--pad", type=int, default=0, help="margen interno de cada celda en px (default 0)")
    ap.add_argument("--anchor", choices=["bottom", "center"], default="bottom",
                    help="alineación dentro de la celda (default: bottom = pies alineados)")
    ap.add_argument("--bg", default="00FF00", help="color de fondo en hex, o 'transparent' (default 00FF00)")
    ap.add_argument("--sep", type=int, default=2, help="grosor del separador en px (default 2, 0 = ninguno)")
    ap.add_argument("--sep-color", default="000000", help="color del separador en hex (default 000000)")
    ap.add_argument("--border", action="store_true", help="dibujar también el borde exterior")
    ap.add_argument("--no-json", action="store_true", help="no generar el .json con las posiciones")
    args = ap.parse_args()

    files = collect(args.inputs, args.pattern)
    out_path = Path(args.out)
    files = [f for f in files if f.resolve() != out_path.resolve()]  # no incluir la hoja previa
    imgs = []
    for f in files:
        im = Image.open(f)
        im.load()
        imgs.append((f, im.convert("RGBA")))

    # 1) Filas de la grilla
    if args.by_prefix:
        groups = OrderedDict()
        for f, im in imgs:
            groups.setdefault(prefix_of(f), []).append((f, im))
        rows = list(groups.values())
    else:
        n = len(imgs)
        cols = args.cols or math.ceil(math.sqrt(n))
        rows = [imgs[i:i + cols] for i in range(0, n, cols)]
    n_cols = max(len(r) for r in rows)
    n_rows = len(rows)

    # 2) Tamaño de celda (nunca se escala: si no cabe, se avisa)
    need_w = max(im.width for _, im in imgs) + 2 * args.pad
    need_h = max(im.height for _, im in imgs) + 2 * args.pad
    if args.cell:
        cw, ch = (int(x) for x in args.cell.lower().split("x"))
        if cw < need_w or ch < need_h:
            sys.exit(f"--cell {cw}x{ch} es menor que el frame más grande + margen "
                     f"({need_w}x{need_h}). No se reescala nada: usa una celda mayor.")
    else:
        cw, ch = need_w, need_h

    # 3) Lienzo
    s = args.sep
    b = s if args.border else 0
    W = n_cols * cw + (n_cols - 1) * s + 2 * b
    H = n_rows * ch + (n_rows - 1) * s + 2 * b
    transparent = args.bg.lower() == "transparent"
    bg = (0, 0, 0, 0) if transparent else hex_rgb(args.bg) + (255,)
    sheet = Image.new("RGBA", (W, H), bg)

    # 4) Separadores
    if s > 0:
        sc = hex_rgb(args.sep_color) + (255,)
        line = lambda box: sheet.paste(Image.new("RGBA", (box[2] - box[0], box[3] - box[1]), sc), box[:2])
        for c in range(n_cols - 1 + (2 if args.border else 0)):
            x = (c * (cw + s)) if args.border else (cw + c * (cw + s))
            line((x, 0, x + s, H))
        for r in range(n_rows - 1 + (2 if args.border else 0)):
            y = (r * (ch + s)) if args.border else (ch + r * (ch + s))
            line((0, y, W, y + s))

    # 5) Pegar frames (copia exacta de píxeles)
    atlas = []
    for r, row in enumerate(rows):
        for c, (f, im) in enumerate(row):
            ox = b + c * (cw + s)
            oy = b + r * (ch + s)
            x = ox + (cw - im.width) // 2
            y = oy + (ch - im.height if args.anchor == "bottom" else (ch - im.height) // 2)
            if args.anchor == "bottom":
                y -= args.pad
            if transparent:
                sheet.paste(im, (x, y))            # copia RGBA tal cual, sin mezclar
            else:
                sheet.alpha_composite(im, (x, y))  # sobre el color de fondo
            atlas.append({"file": f.name, "row": r + 1, "col": c + 1, "index": len(atlas) + 1,
                          "cell": [ox, oy, cw, ch], "frame": [x, y, im.width, im.height]})

    # 6) Guardado sin pérdida
    out = sheet if transparent else sheet.convert("RGB")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out.save(out_path, optimize=True)
    if not args.no_json:
        meta = {"image": out_path.name, "size": [W, H], "cols": n_cols, "rows": n_rows,
                "cell": [cw, ch], "separator": s, "frames": atlas}
        out_path.with_suffix(".json").write_text(json.dumps(meta, indent=2, ensure_ascii=False))

    print(f"{len(atlas)} frames -> {out_path} ({W}x{H}, {n_cols} col x {n_rows} fil, celda {cw}x{ch})")


if __name__ == "__main__":
    main()
