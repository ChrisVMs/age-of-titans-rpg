"""Orquesta el pipeline completo para una hoja."""
from dataclasses import dataclass, asdict
from pathlib import Path

import numpy as np

from . import background, segment, pixelsize, palette as pal_mod, align as align_mod
from .io import load_rgba, load_hypothesis, to_hex


@dataclass
class Options:
    tolerance: float = 30.0       # distancia RGB al fondo para el flood fill
    halo_tolerance: float = 90.0  # distancia al fondo de píxeles de borde a eliminar
    hole_min_area: int = 16       # bolsas de fondo encerradas a eliminar (px de la hoja)
    min_area: int = 64            # manchas menores se descartan (px de la hoja)
    colors: int = 16
    pixel_size: int = 0           # 0 = detectar
    max_pixel_size: int = 32
    anchor: str = ""              # vacío = JSON o bottom-center
    pad: int = 0
    background: str = ""          # forzar color de fondo
    use_grid: bool = True


def _expected(hyp):
    anims = sorted(hyp.get("animations") or [], key=lambda a: a.get("row", 0))
    grid = hyp.get("grid") or {}
    if anims:
        return sum(int(a.get("frames", 0)) for a in anims), anims
    if grid.get("cols") and grid.get("rows"):
        return int(grid["cols"]) * int(grid["rows"]), anims
    return None, anims


def process(path, opt=Options()):
    path = Path(path)
    hyp = load_hypothesis(path)
    rgb, alpha0 = load_rgba(path)
    H, W = alpha0.shape
    warnings, info = [], {"source": path.name, "sheet_size": [W, H], "hypothesis": hyp}

    # 1. Fondo
    bg, notes = background.resolve_background(rgb, alpha0, opt.background or hyp.get("background"), opt.tolerance)
    warnings += notes
    alpha, bg_stats = background.remove_background(
        rgb, alpha0, bg, opt.tolerance, opt.hole_min_area, opt.halo_tolerance)
    info["background"] = {"color": to_hex(bg) if bg else None, **bg_stats}

    # 2. Componentes y frames
    lab, comps, discarded = segment.components(alpha, opt.min_area)
    info["components"] = len(comps)
    info["discarded"] = discarded
    for d in discarded:
        alpha[lab == d["label"]] = False
    expected, anims = _expected(hyp)
    grid = hyp.get("grid") or {}
    exp_rows = [int(a.get("frames", 0)) for a in anims] or None
    free_frames, free_warn = segment.by_rows(lab, comps, alpha.shape, exp_rows)
    if opt.use_grid and grid.get("cols") and grid.get("rows"):
        frames, w = segment.by_grid(lab, comps, alpha.shape, int(grid["cols"]), int(grid["rows"]))
        warnings += w
        free_rows = len({f.row for f in free_frames})
        if free_rows != int(grid["rows"]):
            warnings.append(f"la grilla del JSON dice {grid['rows']} filas pero el contenido forma {free_rows}")
        info["segmentation"] = "grid"
    else:
        frames, warnings_rows = free_frames, free_warn
        warnings += warnings_rows
        info["segmentation"] = "rows"

    # 3. Tamaño de píxel
    det = pixelsize.detect_pixel_size(rgb, alpha, opt.max_pixel_size)
    exp_ps = hyp.get("expected_pixel_size")
    s = opt.pixel_size or det["size"]
    if not opt.pixel_size and det["confidence"] < 0.2 and exp_ps:
        warnings.append(f"detección de tamaño de píxel poco fiable ({det['confidence']}); se usa el del JSON")
        s = int(exp_ps)
    if exp_ps and int(exp_ps) != det["size"]:
        warnings.append(f"tamaño de píxel detectado {det['size']} ≠ esperado {exp_ps}")
    info["pixel_size"] = {"detected": det["size"], "expected": exp_ps, "used": s,
                          "confidence": det["confidence"], "phase": [det["phase_x"], det["phase_y"]]}

    # 4. Paleta común (sobre píxeles opacos de toda la hoja) y reducción por moda
    palette = pal_mod.build_palette(rgb[alpha], opt.colors)
    idx = np.where(alpha, pal_mod.nearest_index(rgb, palette), -1)
    small = []
    for f in frames:
        x0, y0, x1, y1 = f.bbox
        fx, fy = pixelsize.frame_phase(rgb[y0:y1, x0:x1], f.mask[y0:y1, x0:x1], s) if s > 1 else (0, 0)
        fx, fy = (fx + x0) % s, (fy + y0) % s
        gx0 = x0 - ((x0 - fx) % s)
        gy0 = y0 - ((y0 - fy) % s)
        gx1 = x1 + (-(x1 - fx)) % s
        gy1 = y1 + (-(y1 - fy)) % s
        crop = np.full((gy1 - gy0, gx1 - gx0), -1, np.int32)
        sx0, sy0, sx1, sy1 = max(gx0, 0), max(gy0, 0), min(gx1, W), min(gy1, H)
        sub = np.where(f.mask[sy0:sy1, sx0:sx1], idx[sy0:sy1, sx0:sx1], -1)
        crop[sy0 - gy0:sy1 - gy0, sx0 - gx0:sx1 - gx0] = sub
        d = pixelsize.downscale_mode(crop, s)
        ys, xs = np.nonzero(d >= 0)
        if len(ys) == 0:
            warnings.append(f"frame fila {f.row} col {f.col} quedó vacío al reducir; descartado")
            continue
        small.append((f, d[ys.min():ys.max() + 1, xs.min():xs.max() + 1], [gx0, gy0, gx1, gy1]))

    # Paleta final: solo colores usados
    used = np.unique(np.concatenate([d[d >= 0] for _, d, _ in small])) if small else np.array([], int)
    remap = np.full(len(palette) + 1, -1, np.int32)
    remap[used] = np.arange(len(used))
    palette = palette[used]
    small = [(f, np.where(d >= 0, remap[d], -1), g) for f, d, g in small]

    # Animaciones
    by_row = {}
    for f, d, g in small:
        by_row.setdefault(f.row, []).append((f, d, g))
    names = {int(a["row"]): a["name"] for a in anims if "row" in a and "name" in a}
    exp_by_row = {int(a["row"]): int(a.get("frames", 0)) for a in anims if "row" in a}
    for r in exp_by_row:
        if r not in by_row:
            warnings.append(f"animación '{names.get(r, r)}' (fila {r}) sin frames detectados")
    animations = []
    for r in sorted(by_row):
        items = sorted(by_row[r], key=lambda t: t[0].bbox[0])
        name = names.get(r, f"row{r}")
        if r in exp_by_row and exp_by_row[r] != len(items):
            warnings.append(f"'{name}': {len(items)} frames detectados, {exp_by_row[r]} esperados")
        animations.append({"row": r, "name": name, "items": items, "expected": exp_by_row.get(r)})
    total = sum(len(a["items"]) for a in animations)
    if expected is not None and total != expected:
        warnings.append(f"total: {total} frames detectados, {expected} esperados")

    # 5. Alineación (canvas común para toda la hoja)
    anchor = opt.anchor or hyp.get("anchor") or "bottom-center"
    if anchor not in align_mod.ANCHORS:
        warnings.append(f"anclaje '{anchor}' desconocido; se usa bottom-center")
        anchor = "bottom-center"
    flat = [d for a in animations for _, d, _ in a["items"]]
    canvases, size, anchor_px = align_mod.align(flat, anchor, opt.pad) if flat else ([], (0, 0), (0, 0))
    k = 0
    for a in animations:
        a["canvases"] = canvases[k:k + len(a["items"])]
        k += len(a["items"])

    info.update({"frames_detected": total, "frames_expected": expected, "anchor": anchor,
                 "canvas": list(size), "anchor_px": list(anchor_px),
                 "palette": [to_hex(c) for c in palette], "warnings": warnings,
                 "options": asdict(opt)})
    return {"info": info, "animations": animations, "palette": palette, "alpha": alpha,
            "rgb": rgb, "frames_all": frames}
