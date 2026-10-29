"""Eliminación de fondo: flood fill desde los bordes + alfa binario + limpieza de halos."""
import numpy as np
from scipy import ndimage

from .io import parse_hex, to_hex

FOUR = ndimage.generate_binary_structure(2, 1)
EIGHT = np.ones((3, 3), bool)


def color_dist(rgb, color):
    d = rgb.astype(np.int32) - np.asarray(color, np.int32)
    return np.sqrt((d * d).sum(-1))


def color_dist_map(rgb, ref):
    d = rgb.astype(np.float64) - ref
    return np.sqrt((d * d).sum(-1))


def border_color(rgb, alpha):
    """Color más frecuente en el borde de la imagen (entre píxeles opacos)."""
    edge = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    a = np.concatenate([alpha[0], alpha[-1], alpha[:, 0], alpha[:, -1]])
    edge = edge[a]
    if len(edge) == 0:
        return None, 1.0
    # Moda con colores agrupados a 4 bits para tolerar ruido; luego mediana real del grupo.
    keys = (edge >> 4).astype(np.int32)
    k = keys[:, 0] * 256 + keys[:, 1] * 16 + keys[:, 2]
    vals, counts = np.unique(k, return_counts=True)
    best = vals[counts.argmax()]
    sel = edge[k == best]
    return tuple(int(v) for v in np.median(sel, axis=0)), counts.max() / len(k)


def resolve_background(rgb, alpha, hint=None, tol=30.0):
    """Elige el color de fondo verificando la pista del JSON contra el borde real."""
    notes = []
    measured, share = border_color(rgb, alpha)
    if measured is None:
        return None, ["imagen sin píxeles opacos en el borde: fondo ya transparente"]
    if hint:
        h = parse_hex(hint)
        edge_px = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
        frac = float((color_dist(edge_px, h) <= tol).mean())
        if frac >= 0.5:
            return h, notes
        notes.append(f"el fondo del JSON {hint} solo cubre {frac:.0%} del borde; "
                     f"se usa el medido {to_hex(measured)}")
    elif share < 0.5:
        notes.append(f"borde poco uniforme: el color dominante {to_hex(measured)} es solo {share:.0%}")
    return measured, notes


def _flood(cand, alpha):
    """Píxeles candidatos conectados (4-vecindad) con el borde de la imagen."""
    lab, _ = ndimage.label(cand & alpha, structure=FOUR)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    return np.isin(lab, border[border > 0])


def local_background(rgb, known, win=31):
    """Color de fondo esperado en cada píxel: media del fondo conocido en una ventana;
    donde no hay fondo cerca, el valor del fondo conocido más próximo."""
    k = known.astype(np.float64)
    den = ndimage.uniform_filter(k, win)
    out = np.empty(rgb.shape, np.float64)
    for c in range(3):
        out[..., c] = ndimage.uniform_filter(rgb[..., c] * k, win) / np.maximum(den, 1e-9)
    have = den > 1e-6
    if not have.all():
        _, (iy, ix) = ndimage.distance_transform_edt(~have, return_indices=True)
        out = out[iy, ix]
    return out


def remove_background(rgb, alpha, bg, tol=30.0, hole_min_area=16, halo_tol=90.0,
                      halo_passes=2, halo_resid=24.0):
    """Devuelve (alpha bool, stats). Todo el resultado es 100% opaco o 100% transparente."""
    alpha = alpha.copy()
    stats = {"bg_removed": 0, "holes_removed": 0, "halo_removed": 0}
    if bg is None:
        return alpha, stats
    dist = color_dist(rgb, bg)
    outer = _flood(dist <= tol, alpha)
    # Fondo irregular (gradiente/ruido): segundo pase contra un modelo local del fondo
    # estimado desde lo ya quitado, para no depender de un único color.
    if outer.any():
        dist = np.minimum(dist, color_dist_map(rgb, local_background(rgb, outer)))
        outer = _flood(dist <= tol, alpha)
    stats["bg_removed"] = int(outer.sum())
    alpha &= ~outer
    # Bolsas de fondo encerradas (entre brazo y cuerpo): mismas reglas, área mínima.
    if hole_min_area:
        inner = (dist <= tol) & alpha
        lab, n = ndimage.label(inner, structure=FOUR)
        if n:
            areas = ndimage.sum(inner, lab, range(1, n + 1))
            big = np.isin(lab, np.nonzero(areas >= hole_min_area)[0] + 1)
            stats["holes_removed"] = int(big.sum())
            alpha &= ~big
    # Halo: píxeles de borde que son mezcla de fondo + color interior vecino (antialias
    # rosa), o directamente muy cercanos al fondo.
    if not halo_tol:
        return alpha, stats
    bgv = np.asarray(bg, np.float64)
    for _ in range(halo_passes):
        interior = ndimage.binary_erosion(alpha, EIGHT, border_value=0)
        edge = alpha & ~interior
        if not edge.any() or not interior.any():
            break
        _, (iy, ix) = ndimage.distance_transform_edt(~interior, return_indices=True)
        inner = rgb[iy, ix].astype(np.float64)
        v = bgv - inner
        vv = (v * v).sum(-1)
        t = np.clip(((rgb - inner) * v).sum(-1) / np.maximum(vv, 1e-9), 0, 1)
        resid = np.sqrt(((rgb - (inner + t[..., None] * v)) ** 2).sum(-1))
        blend = (t >= 0.25) & (resid <= halo_resid) & (vv > 60 ** 2)
        halo = edge & (blend | (dist <= halo_tol))
        if not halo.any():
            break
        stats["halo_removed"] += int(halo.sum())
        alpha &= ~halo
    return alpha, stats
