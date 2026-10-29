#!/usr/bin/env python3
"""
split_sheet.py - Divide una hoja de sprites (grilla) en frames PNG con fondo
transparente, SIN reescalar ni interpolar: solo recorta píxeles del original.

Uso:
    python split_sheet.py maga_hd.jpg
    python split_sheet.py maga_hd.jpg --names idle,run,idle2,attack
    python split_sheet.py maga_hd.jpg --uniform

Re-extraer solo algunos frames (sobrescribe los archivos existentes):
    python split_sheet.py maga_hd.jpg --only 7              # frame nº 7 (orden de lectura, desde 1)
    python split_sheet.py maga_hd.jpg --only 2:3            # fila 2, columna 3
    python split_sheet.py maga_hd.jpg --only 2:*            # toda la fila 2
    python split_sheet.py maga_hd.jpg --only 1:2,4:5,9-12   # combinar: varios, rangos
    python split_sheet.py maga_hd.jpg --only 7 --list       # solo mostrar qué haría

Requiere: pip install pillow numpy
"""
import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image


# ---------- Detección de la grilla ----------

def _runs(idx):
    runs, start, prev = [], None, None
    for i in idx:
        if start is None:
            start = prev = i
        elif i == prev + 1:
            prev = i
        else:
            runs.append((start, prev))
            start = prev = i
    if start is not None:
        runs.append((start, prev))
    return runs


def detect_lines(rgb, axis, dark_thr=120, frac=0.5):
    dark = rgb.astype(int).sum(2) < dark_thr
    profile = dark.mean(axis=0 if axis == "x" else 1)
    return _runs([i for i, v in enumerate(profile) if v > frac])


def cell_ranges(size, lines):
    edges, pos = [], 0
    for a, b in lines:
        edges.append((pos, a))
        pos = b + 1
    edges.append((pos, size))
    return [(a, b) for a, b in edges if b - a > 8]


def even_ranges(size, n):
    step = size / n
    return [(round(i * step), round((i + 1) * step)) for i in range(n)]


# ---------- Fondo verde -> transparente ----------

def chroma_key(img, key=(0, 255, 0), tol=90, soft=60):
    """Quita el fondo croma con borde suave y corrige el derrame de verde."""
    rgb = np.asarray(img.convert("RGB")).astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]

    greenness = g - np.maximum(r, b)
    key_dist = np.sqrt(((rgb - np.array(key, np.float32)) ** 2).sum(2))

    alpha = np.clip((key_dist - tol) / max(soft, 1), 0, 1)
    alpha = np.where(greenness > 80, np.minimum(alpha, 0.0), alpha)

    edge = (alpha > 0) & (alpha < 1) | ((alpha >= 1) & (greenness > 15))
    limit = (r + b) / 2
    g2 = np.where(edge, np.minimum(g, limit + 10), g)
    out = np.stack([r, g2, b], axis=-1).clip(0, 255).astype(np.uint8)

    return Image.fromarray(np.dstack([out, (alpha * 255).astype(np.uint8)]), "RGBA")


def trim_alpha(img):
    bbox = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    return img.crop(bbox) if bbox else img


# ---------- Selección de frames (--only) ----------

def parse_only(spec, n_rows, n_cols):
    """Devuelve un set de (fila, col) base 0. Acepta N, R:C, R:*, N-M, separados por coma."""
    chosen = set()

    def by_index(n):
        if not 1 <= n <= n_rows * n_cols:
            sys.exit(f"Frame {n} fuera de rango (1-{n_rows * n_cols}).")
        chosen.add(((n - 1) // n_cols, (n - 1) % n_cols))

    for part in (p.strip() for p in spec.split(",") if p.strip()):
        try:
            if ":" in part:
                rs, cs = part.split(":")
                r = int(rs)
                if not 1 <= r <= n_rows:
                    sys.exit(f"Fila {r} fuera de rango (1-{n_rows}).")
                if cs == "*":
                    chosen.update((r - 1, c) for c in range(n_cols))
                else:
                    c = int(cs)
                    if not 1 <= c <= n_cols:
                        sys.exit(f"Columna {c} fuera de rango (1-{n_cols}).")
                    chosen.add((r - 1, c - 1))
            elif "-" in part:
                a, b = (int(x) for x in part.split("-"))
                for n in range(min(a, b), max(a, b) + 1):
                    by_index(n)
            else:
                by_index(int(part))
        except ValueError:
            sys.exit(f"No entiendo '{part}'. Usa N, R:C, R:* o N-M.")
    return chosen


# ---------- Programa principal ----------

def main():
    ap = argparse.ArgumentParser(description="Divide una hoja de sprites en frames PNG transparentes sin perder calidad.")
    ap.add_argument("image")
    ap.add_argument("--cols", type=int, help="columnas (si no se da, se detecta)")
    ap.add_argument("--rows", type=int, help="filas (si no se da, se detecta)")
    ap.add_argument("--out", default=None, help="carpeta de salida (default: <imagen>_frames)")
    ap.add_argument("--names", default="", help="nombres por fila, separados por coma")
    ap.add_argument("--only", default=None,
                    help="extraer solo estos frames: N, R:C, R:*, N-M (separados por coma)")
    ap.add_argument("--list", action="store_true", help="solo mostrar qué frames se extraerían")
    ap.add_argument("--inset", type=int, default=3,
                    help="píxeles a descartar junto a cada línea separadora (default 3)")
    ap.add_argument("--key", default="00FF00", help="color de fondo en hex (default 00FF00)")
    ap.add_argument("--uniform", action="store_true",
                    help="mismo canvas para todos los frames, alineados por la base")
    args = ap.parse_args()

    src = Path(args.image)
    img = Image.open(src)
    img.load()
    rgb = np.asarray(img.convert("RGB"))
    W, H = img.size

    # 1) Grilla
    xr = even_ranges(W, args.cols) if args.cols else cell_ranges(W, detect_lines(rgb, "x"))
    yr = even_ranges(H, args.rows) if args.rows else cell_ranges(H, detect_lines(rgb, "y"))
    if len(xr) < 2 and not args.cols:
        sys.exit("No pude detectar columnas. Usa --cols N.")
    if len(yr) < 2 and not args.rows:
        sys.exit("No pude detectar filas. Usa --rows N.")
    n_rows, n_cols = len(yr), len(xr)
    print(f"Imagen {W}x{H} -> {n_cols} columnas x {n_rows} filas")

    names = [n.strip() for n in args.names.split(",") if n.strip()]
    key = tuple(int(args.key[i:i + 2], 16) for i in (0, 2, 4))
    m = args.inset

    def fname(r, c):
        label = names[r] if r < len(names) else f"row{r + 1}"
        return f"{label}_{c:02d}.png"

    selected = parse_only(args.only, n_rows, n_cols) if args.only else None

    if args.list:
        for r in range(n_rows):
            for c in range(n_cols):
                if selected is None or (r, c) in selected:
                    print(f"  nº {r * n_cols + c + 1:>2}  fila {r + 1}, col {c + 1}  ->  {fname(r, c)}")
        return

    # 2) Recortar y quitar fondo (se procesan todos para que --uniform dé siempre
    #    el mismo tamaño de canvas, aunque solo guardes algunos)
    frames = {}
    for r, (y0, y1) in enumerate(yr):
        for c, (x0, x1) in enumerate(xr):
            l = x0 + (m if c > 0 else 0)
            rt = x1 - (m if c < n_cols - 1 else 0)
            t = y0 + (m if r > 0 else 0)
            b = y1 - (m if r < n_rows - 1 else 0)
            frames[(r, c)] = trim_alpha(chroma_key(img.crop((l, t, rt, b)), key))

    # 3) Canvas uniforme opcional (anclaje inferior-central)
    if args.uniform:
        mw = max(f.width for f in frames.values())
        mh = max(f.height for f in frames.values())
        for k, f in frames.items():
            canvas = Image.new("RGBA", (mw, mh), (0, 0, 0, 0))
            canvas.paste(f, ((mw - f.width) // 2, mh - f.height))
            frames[k] = canvas

    # 4) Guardado (PNG sin pérdida)
    out_dir = Path(args.out or src.stem + "_frames")
    out_dir.mkdir(parents=True, exist_ok=True)
    saved = 0
    for (r, c), f in sorted(frames.items()):
        if selected is not None and (r, c) not in selected:
            continue
        f.save(out_dir / fname(r, c), optimize=True)
        saved += 1
        if selected is not None:
            print(f"  guardado: {fname(r, c)}")

    print(f"{saved} imagen(es) guardadas en: {out_dir}/")
    if src.suffix.lower() in (".jpg", ".jpeg"):
        print("Nota: el original es JPG (ya tiene compresión). "
              "Usa PNG si puedes, para máxima calidad.")


if __name__ == "__main__":
    main()
