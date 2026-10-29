"""Canvas común y anclaje para que la animación no tiemble."""
import numpy as np

ANCHORS = ("bottom-center", "feet", "center", "bottom-left", "top-left")


def anchor_point(idx, anchor):
    """Punto de anclaje (x, y) en coordenadas del frame recortado (idx -1 = transparente)."""
    h, w = idx.shape
    if anchor == "bottom-center":
        return w // 2, h
    if anchor == "feet":
        # centro de los píxeles opacos en las filas más bajas (los pies), no de la caja
        op = idx >= 0
        band = op[max(0, h - max(2, h // 8)):]
        xs = np.nonzero(band)[1]
        return (int(round(xs.mean())) if len(xs) else w // 2), h
    if anchor == "center":
        return w // 2, h // 2
    if anchor == "bottom-left":
        return 0, h
    if anchor == "top-left":
        return 0, 0
    raise ValueError(f"anclaje desconocido: {anchor} (opciones: {', '.join(ANCHORS)})")


def align(frames_idx, anchor="bottom-center", pad=0):
    """Coloca todos los frames en un canvas común. Devuelve (canvases, (W,H), (ax,ay))."""
    pts = [anchor_point(f, anchor) for f in frames_idx]
    left = max(ax for ax, _ in pts) + pad
    right = max(f.shape[1] - ax for f, (ax, _) in zip(frames_idx, pts)) + pad
    top = max(ay for _, ay in pts) + pad
    bottom = max(f.shape[0] - ay for f, (_, ay) in zip(frames_idx, pts)) + pad
    W, H = left + right, top + bottom
    out = []
    for f, (ax, ay) in zip(frames_idx, pts):
        c = np.full((H, W), -1, np.int32)
        y, x = top - ay, left - ax
        c[y:y + f.shape[0], x:x + f.shape[1]] = f
        out.append(c)
    return out, (W, H), (left, top)
