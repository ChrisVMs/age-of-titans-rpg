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
    despill: bool = True          # recuperar color interior en bordes teñidos de fondo


def _expected(hyp):
    anims = sorted(hyp.get("animations") or [], key=lambda a: a.get("row", 0))
    grid = hyp.get("grid") or {}
    if anims:
        return sum(int(a.get("frames", len(a.get("cols") or []))) for a in anims), anims
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
    alpha, lines, nlines = background.remove_grid_lines(rgb, alpha, bg)
    if lines["x"] or lines["y"]:
        bg_stats["grid_lines_removed"] = nlines
        info["grid_lines"] = lines
        # repetir: el fondo que quedaba encerrado entre líneas y bordes ya es accesible
        alpha2, st2 = background.remove_background(
            rgb, alpha, bg, opt.tolerance, opt.hole_min_area, opt.halo_tolerance)
        alpha = alpha2
        for k in ("bg_removed", "holes_removed", "halo_removed"):
            bg_stats[k] += st2[k]
        g = hyp.get("grid") or {}
        lc, lr = len(lines["x"]) + 1, len(lines["y"]) + 1
        # líneas en el borde de la imagen no separan celdas
        lc -= sum(1 for x in lines["x"] if x < 4 or x > W - 5)
        lr -= sum(1 for y in lines["y"] if y < 4 or y > H - 5)
        if g and (int(g.get("cols", lc)) != lc or int(g.get("rows", lr)) != lr):
            warnings.append(f"líneas de grilla dibujadas: {lc}x{lr} celdas; el JSON dice {g.get('cols')}x{g.get('rows')}")
    if opt.despill:
        rgb, alpha, nfix, nkill = background.despill(rgb, alpha, bg)
        rgb, nchroma = background.chroma_despill(rgb, alpha, bg)
        bg_stats.update(despill_fixed=nfix, despill_removed=nkill, chroma_despill=nchroma)
    info["background"] = {"color": to_hex(bg) if bg else None, **bg_stats}

    # 2. Componentes y frames
    lab, comps, discarded = segment.components(alpha, opt.min_area)
    if info.get("grid_lines"):
        # restos del JPG alrededor de las líneas: componentes casi enteros dentro de la franja
        band = np.zeros_like(alpha)
        for x in info["grid_lines"]["x"]:
            band[:, max(0, int(x) - 8):int(x) + 9] = True
        for y in info["grid_lines"]["y"]:
            band[max(0, int(y) - 8):int(y) + 9] = True
        keep = []
        for c in comps:
            m = lab == c["label"]
            if band[m].mean() >= 0.9:
                discarded.append({**c, "reason": "resto de línea de grilla"})
            else:
                keep.append(c)
        comps = keep
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
        # filas reales: ignorar chispas/partículas sueltas al contar
        big = max((f.area for f in free_frames), default=0)
        free_rows = len({f.row for f in free_frames if f.area >= 0.1 * big})
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
    pitch = None
    if not opt.pixel_size and det["size"] == 1:
        # sin rejilla entera: la IA reescaló a un tamaño no entero → paso fraccionario
        fr = pixelsize.detect_pitch(rgb, alpha, opt.max_pixel_size)
        if fr["pitch"] >= 1.5:
            pitch, phase = fr["pitch"], fr["phase"]
            if abs(pitch - round(pitch)) < 0.02:
                s, pitch = int(round(pitch)), None
            det.update(size=fr["pitch"], confidence=fr["strength"], phase_x=fr["phase"][0], phase_y=fr["phase"][1])
            warnings.append(f"tamaño de píxel no entero: {fr['pitch']} px (hoja reescalada por la IA); "
                            "se reduce sobre rejilla fraccionaria")
    if exp_ps and abs(float(exp_ps) - det["size"]) > 0.05:
        warnings.append(f"tamaño de píxel detectado {det['size']} ≠ esperado {exp_ps}")
    info["pixel_size"] = {"detected": det["size"], "expected": exp_ps, "used": pitch or s,
                          "confidence": det["confidence"], "phase": [det["phase_x"], det["phase_y"]]}

    # 4. Paleta común (sobre píxeles opacos de toda la hoja) y reducción por moda
    palette = pal_mod.build_palette(rgb[alpha], opt.colors)
    idx = np.where(alpha, pal_mod.nearest_index(rgb, palette), -1)
    small = []
    for f in frames:
        x0, y0, x1, y1 = f.bbox
        if pitch:
            d = pixelsize.downscale_mode_frac(np.where(f.mask[y0:y1, x0:x1], idx[y0:y1, x0:x1], -1),
                                              x0, y0, pitch, phase)
            ys, xs = np.nonzero(d >= 0)
            if len(ys) == 0:
                warnings.append(f"frame fila {f.row} col {f.col} quedó vacío al reducir; descartado")
                continue
            small.append((f, d[ys.min():ys.max() + 1, xs.min():xs.max() + 1], [x0, y0, x1, y1]))
            continue
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

    # Motas de fondo en el contorno (nativo): borde de la silueta con color mezcla de fondo
    if opt.despill and bg is not None and small:
        spill = pal_mod.spill_colors(palette, bg)
        removed = 0
        if spill.any():
            cleaned = []
            for f, d, g in small:
                op = d >= 0
                pad = np.pad(op, 1)
                edge = op & ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])
                kill = edge & spill[np.maximum(d, 0)]
                removed += int(kill.sum())
                cleaned.append((f, np.where(kill, -1, d), g))
            small = cleaned
        info["background"]["edge_spill_removed"] = removed

    # Paleta final: solo colores usados
    used = np.unique(np.concatenate([d[d >= 0] for _, d, _ in small])) if small else np.array([], int)
    remap = np.full(len(palette) + 1, -1, np.int32)
    remap[used] = np.arange(len(used))
    palette = palette[used]
    small = [(f, np.where(d >= 0, remap[d], -1), g) for f, d, g in small]

    # Animaciones: cada entrada del JSON toma una fila (y opcionalmente solo ciertas columnas)
    by_row = {}
    for f, d, g in small:
        by_row.setdefault(f.row, []).append((f, d, g))
    for r in by_row:
        by_row[r].sort(key=lambda t: t[0].bbox[0])
    claimed, animations = set(), []
    for spec in anims:
        if "row" not in spec:
            continue
        r, name = int(spec["row"]), spec.get("name", f"row{spec['row']}")
        cols = spec.get("cols")
        items = [t for t in by_row.get(r, []) if cols is None or t[0].col in cols]
        items = [t for t in items if id(t) not in claimed]
        claimed.update(id(t) for t in items)
        exp = spec.get("frames", len(cols) if cols else None)
        if not items:
            warnings.append(f"animación '{name}' (fila {r}) sin frames detectados")
            continue
        if exp is not None and int(exp) != len(items):
            warnings.append(f"'{name}': {len(items)} frames detectados, {exp} esperados")
        animations.append({"row": r, "name": name, "items": items, "expected": exp,
                           "separate": bool(spec.get("separate"))})
    for r in sorted(by_row):
        rest = [t for t in by_row[r] if id(t) not in claimed]
        if rest:
            if anims:
                warnings.append(f"fila {r}: {len(rest)} frames sin animación en el JSON")
            animations.append({"row": r, "name": f"row{r}", "items": rest, "expected": None, "separate": False})
    animations.sort(key=lambda a: (a["row"], a["items"][0][0].col))
    total = sum(len(a["items"]) for a in animations)
    if expected is not None and total != expected:
        warnings.append(f"total: {total} frames detectados, {expected} esperados")

    # 5. Alineación: canvas común para la hoja; las animaciones "separate" (proyectiles,
    # efectos) tienen el suyo para no inflar el del personaje.
    anchor = opt.anchor or hyp.get("anchor") or "bottom-center"
    if anchor not in align_mod.ANCHORS:
        warnings.append(f"anclaje '{anchor}' desconocido; se usa bottom-center")
        anchor = "bottom-center"
    groups = [[a for a in animations if not a["separate"]]] + [[a] for a in animations if a["separate"]]
    size, anchor_px = (0, 0), (0, 0)
    for gi, group in enumerate(groups):
        flat = [d for a in group for _, d, _ in a["items"]]
        if not flat:
            continue
        canvases, gsize, gpx = align_mod.align(flat, anchor, opt.pad)
        if gi == 0:
            size, anchor_px = gsize, gpx
        k = 0
        for a in group:
            a["canvases"] = canvases[k:k + len(a["items"])]
            a["canvas"], a["anchor_px"] = list(gsize), list(gpx)
            k += len(a["items"])

    info.update({"frames_detected": total, "frames_expected": expected, "anchor": anchor,
                 "canvas": list(size), "anchor_px": list(anchor_px),
                 "palette": [to_hex(c) for c in palette], "warnings": warnings,
                 "options": asdict(opt)})
    return {"info": info, "animations": animations, "palette": palette, "alpha": alpha,
            "rgb": rgb, "frames_all": frames}
