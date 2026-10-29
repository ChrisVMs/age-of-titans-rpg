"""Separación de frames por componentes conectados."""
from dataclasses import dataclass, field

import numpy as np
from scipy import ndimage

EIGHT = np.ones((3, 3), bool)


@dataclass
class Frame:
    mask: np.ndarray          # bool, tamaño de la hoja completa
    row: int = 0
    col: int = 0
    notes: list = field(default_factory=list)

    @property
    def bbox(self):
        ys, xs = np.nonzero(self.mask)
        return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1

    @property
    def area(self):
        return int(self.mask.sum())


def components(alpha, min_area):
    lab, n = ndimage.label(alpha, structure=EIGHT)
    kept, discarded = [], []
    if n == 0:
        return lab, kept, discarded
    areas = ndimage.sum(alpha, lab, range(1, n + 1)).astype(int)
    slices = ndimage.find_objects(lab)
    for i, (a, sl) in enumerate(zip(areas, slices), start=1):
        info = {"label": i, "area": int(a),
                "bbox": [sl[1].start, sl[0].start, sl[1].stop, sl[0].stop]}
        (kept if a >= min_area else discarded).append(info)
    return lab, kept, discarded


def by_grid(lab, comps, shape, cols, rows, spill=0.15):
    """Asigna componentes a celdas. Un componente con masa relevante en varias celdas
    (frames pegados) se corta por las líneas de la grilla."""
    H, W = shape
    cw, ch = W / cols, H / rows
    yy, xx = np.indices(shape)
    cell_of = (np.minimum((yy / ch).astype(int), rows - 1) * cols
               + np.minimum((xx / cw).astype(int), cols - 1))
    cells = {}
    warnings = []
    for c in comps:
        m = lab == c["label"]
        ids, counts = np.unique(cell_of[m], return_counts=True)
        share = counts / counts.sum()
        heavy = ids[share >= spill]
        if len(heavy) > 1:
            warnings.append(f"componente en {c['bbox']} cruza {len(heavy)} celdas: "
                            f"frames pegados, se separa en {len(heavy)}")
            for part in _split_wide(m, len(heavy)):
                pid, pc = np.unique(cell_of[part], return_counts=True)
                cid = int(pid[pc.argmax()])
                cells.setdefault(cid, np.zeros(shape, bool))
                cells[cid] |= part
        else:
            cid = int(ids[counts.argmax()])
            cells.setdefault(cid, np.zeros(shape, bool))
            cells[cid] |= m
    frames = [Frame(mask=m, row=cid // cols, col=cid % cols) for cid, m in sorted(cells.items())]
    return frames, warnings


def split_touching(mask, k, max_iter=40):
    """Separa k frames pegados: erosiona hasta que el bloque se parte en >=k núcleos y
    reparte cada píxel al núcleo más cercano. Devuelve lista de máscaras (izq→der)."""
    m = mask.copy()
    seeds = None
    for _ in range(max_iter):
        m = ndimage.binary_erosion(m, EIGHT)
        if not m.any():
            break
        lab, n = ndimage.label(m, structure=EIGHT)
        if n >= k:
            areas = ndimage.sum(m, lab, range(1, n + 1))
            order = np.argsort(areas)[::-1]
            # núcleos comparables (no un pie o una pluma que se soltó antes)
            if areas[order[k - 1]] >= 0.3 * areas[order[0]]:
                seeds = np.where(np.isin(lab, order[:k] + 1), lab, 0)
                break
    if seeds is None:
        return None
    _, (iy, ix) = ndimage.distance_transform_edt(seeds == 0, return_indices=True)
    owner = seeds[iy, ix]
    parts = [mask & (owner == l) for l in np.unique(seeds[seeds > 0])]
    return sorted(parts, key=lambda p: np.nonzero(p)[1].mean())


def _split_wide(mask, k):
    """Corta k frames pegados; si la erosión no los separa, corta por valles de columnas."""
    parts = split_touching(mask, k)
    if parts:
        return parts
    x0, y0, x1, y1 = Frame(mask).bbox
    prof = mask[:, x0:x1].sum(0)
    w = x1 - x0
    cuts = [0]
    for i in range(1, k):
        c = int(i * w / k)
        lo, hi = max(cuts[-1] + 1, c - w // (4 * k)), min(w - 1, c + w // (4 * k))
        cuts.append(lo + int(prof[lo:hi + 1].argmin()) if hi > lo else c)
    cuts.append(w)
    parts = []
    for a, b in zip(cuts[:-1], cuts[1:]):
        p = np.zeros_like(mask)
        p[:, x0 + a:x0 + b] = mask[:, x0 + a:x0 + b]
        if p.any():
            parts.append(p)
    return parts


def by_rows(lab, comps, shape, expected_per_row=None):
    """Sin grilla: agrupa en filas por solape vertical, fusiona piezas que se solapan en X
    dentro de la fila y corta componentes demasiado anchos (frames pegados)."""
    warnings = []
    items = sorted(comps, key=lambda c: (c["bbox"][1] + c["bbox"][3]) / 2)
    rows = []
    for c in items:
        y0, y1 = c["bbox"][1], c["bbox"][3]
        for r in rows:
            ov = min(y1, r["y1"]) - max(y0, r["y0"])
            if ov > 0.5 * min(y1 - y0, r["y1"] - r["y0"]):
                r["items"].append(c)
                r["y0"], r["y1"] = min(r["y0"], y0), max(r["y1"], y1)
                break
        else:
            rows.append({"y0": y0, "y1": y1, "items": [c]})
    rows.sort(key=lambda r: r["y0"])
    frames = []
    for ri, r in enumerate(rows):
        groups = []
        for c in sorted(r["items"], key=lambda c: c["bbox"][0]):
            m = lab == c["label"]
            x0, x1 = c["bbox"][0], c["bbox"][2]
            if groups and x0 < groups[-1]["x1"] and c["area"] < groups[-1]["area"]:
                groups[-1]["mask"] |= m
                groups[-1]["x1"] = max(groups[-1]["x1"], x1)
                groups[-1]["area"] += c["area"]
            else:
                groups.append({"mask": m, "x1": x1, "area": c["area"], "w": x1 - x0})
        widths = np.array([g["w"] for g in groups])
        exp = expected_per_row[ri] if expected_per_row and ri < len(expected_per_row) else None
        ref = np.median(widths)
        if exp and exp > len(groups):
            ref = min(ref, widths.sum() / exp)
        masks = []
        for g in groups:
            k = int(round(g["w"] / ref)) if ref > 0 else 1
            if k >= 2 and g["w"] > 1.6 * ref:
                warnings.append(f"fila {ri}: bloque de {g['w']}px de ancho parece {k} frames pegados; se corta")
                masks.extend(_split_wide(g["mask"], k))
            else:
                masks.append(g["mask"])
        for ci, m in enumerate(masks):
            frames.append(Frame(mask=m, row=ri, col=ci))
    return frames, warnings
