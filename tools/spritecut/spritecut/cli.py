"""CLI: python -m spritecut ENTRADA [-o SALIDA] [opciones]"""
import argparse
import sys
from pathlib import Path

from .align import ANCHORS
from .io import load_hypothesis
from .output import write_all
from .pipeline import Options, process

EXTS = {".png", ".jpg", ".jpeg"}


def build_parser():
    d = Options()
    p = argparse.ArgumentParser(prog="spritecut", description="Limpia y separa spritesheets de pixel art.")
    p.add_argument("input", help="imagen PNG/JPG o carpeta (lote)")
    p.add_argument("-o", "--out", default="out", help="carpeta de salida (default: out)")
    p.add_argument("--tolerance", type=float, default=d.tolerance, help="distancia RGB al fondo para el flood fill")
    p.add_argument("--halo-tolerance", type=float, default=d.halo_tolerance, help="distancia al fondo para limpiar halos de borde (0 = no)")
    p.add_argument("--hole-min-area", type=int, default=d.hole_min_area, help="área mínima de bolsas de fondo encerradas a quitar (0 = no)")
    p.add_argument("--min-area", type=int, default=d.min_area, help="área mínima (px de la hoja) de un componente")
    p.add_argument("--colors", type=int, default=d.colors, help="colores de la paleta común")
    p.add_argument("--pixel-size", type=int, default=0, help="forzar tamaño de píxel (0 = detectar)")
    p.add_argument("--max-pixel-size", type=int, default=d.max_pixel_size)
    p.add_argument("--anchor", choices=ANCHORS, default="", help="anclaje (default: JSON o bottom-center)")
    p.add_argument("--pad", type=int, default=0, help="margen transparente alrededor del canvas")
    p.add_argument("--background", default="", help="forzar color de fondo, ej. #FF00FF")
    p.add_argument("--no-grid", action="store_true", help="ignorar la grilla del JSON")
    p.add_argument("--no-despill", action="store_true", help="no corregir bordes teñidos de fondo")
    p.add_argument("--name", default="", help="prefijo de archivos (default: 'name' del JSON o nombre del archivo)")
    p.add_argument("--no-atlas", action="store_true")
    p.add_argument("--no-debug", action="store_true", help="no generar hoja de contactos ni overlay")
    return p


def main(argv=None):
    a = build_parser().parse_args(argv)
    src = Path(a.input)
    files = sorted(f for f in src.iterdir() if f.suffix.lower() in EXTS) if src.is_dir() else [src]
    if not files:
        print("no hay imágenes", file=sys.stderr)
        return 2
    opt = Options(a.tolerance, a.halo_tolerance, a.hole_min_area, a.min_area, a.colors, a.pixel_size,
                  a.max_pixel_size, a.anchor, a.pad, a.background, not a.no_grid,
                  not a.no_despill)
    problems = 0
    for f in files:
        prefix = a.name if (a.name and len(files) == 1) else (load_hypothesis(f).get("name") or f.stem)
        try:
            res = process(f, opt)
        except Exception as e:  # una hoja rota no detiene el lote
            print(f"[ERROR] {f.name}: {e}", file=sys.stderr)
            problems += 1
            continue
        rep = write_all(res, Path(a.out) / f.stem, prefix, not a.no_atlas, not a.no_debug)
        print(rep)
        problems += bool(res["info"]["warnings"])
    print(f"{len(files)} hoja(s), {problems} con avisos/errores. Salida en {a.out}/")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
