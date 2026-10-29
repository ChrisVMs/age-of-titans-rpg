"""Detección del tamaño real del "píxel" lógico y reducción por moda."""
import numpy as np

TRANSITION_THR = 48  # diferencia de color (suma |dR|+|dG|+|dB|) que cuenta como borde


def transitions(rgb, alpha, axis):
    """Posiciones (a lo largo de axis) donde cambia el color o el alfa."""
    a = rgb.astype(np.int32)
    if axis == 1:
        d = np.abs(a[:, 1:] - a[:, :-1]).sum(-1)
        both = alpha[:, 1:] & alpha[:, :-1]
        ach = alpha[:, 1:] != alpha[:, :-1]
    else:
        d = np.abs(a[1:] - a[:-1]).sum(-1)
        both = alpha[1:] & alpha[:-1]
        ach = alpha[1:] != alpha[:-1]
    t = ((d > TRANSITION_THR) & both) | ach
    pos = np.nonzero(t)[axis] + 1
    return pos


def score_size(pos, s):
    """(mejor fase, exceso sobre azar en [0,1]) de que las transiciones caigan en múltiplos de s."""
    if len(pos) == 0 or s == 1:
        return 0, 1.0
    h = np.bincount(pos % s, minlength=s)
    phase = int(h.argmax())
    frac = h[phase] / len(pos)
    return phase, float((frac - 1 / s) / (1 - 1 / s))


def detect_pixel_size(rgb, alpha, max_size=32, rel=0.8, min_excess=0.2):
    """Devuelve dict con size, phase_x, phase_y, confidence y la curva de puntuación.
    Los divisores del tamaño real puntúan tan alto como él y los múltiplos bastante menos,
    así que se elige el tamaño más grande cuya puntuación está cerca de la máxima."""
    px, py = transitions(rgb, alpha, 1), transitions(rgb, alpha, 0)
    curve, phases = {}, {}
    for s in range(2, max_size + 1):
        fx, ex = score_size(px, s)
        fy, ey = score_size(py, s)
        curve[s] = round((ex * len(px) + ey * len(py)) / max(1, len(px) + len(py)), 3)
        phases[s] = (fx, fy)
    top = max(curve.values(), default=0)
    best = 1
    if top >= min_excess:
        best = max(s for s, e in curve.items() if e >= rel * top)
    fx, fy = phases.get(best, (0, 0))
    conf = curve.get(best, 1.0)
    return {"size": best, "phase_x": fx, "phase_y": fy, "confidence": conf, "curve": curve}


def frame_phase(rgb, alpha, s):
    """Fase local de la rejilla dentro de un recorte (las IAs a veces desplazan cada frame)."""
    fx, _ = score_size(transitions(rgb, alpha, 1), s)
    fy, _ = score_size(transitions(rgb, alpha, 0), s)
    return fx, fy


def downscale_mode(idx, s):
    """idx: int HxW con -1 = transparente, múltiplo de s en ambos ejes.
    Cada bloque s×s → opaco si la mayoría lo es; color = moda de índices opacos."""
    H, W = idx.shape
    h, w = H // s, W // s
    blocks = idx.reshape(h, s, w, s).transpose(0, 2, 1, 3).reshape(h, w, s * s)
    opaque = (blocks >= 0).sum(-1)
    k = int(idx.max()) + 1 if idx.max() >= 0 else 1
    counts = np.zeros((h * w, k), np.int32)
    flat = blocks.reshape(h * w, s * s)
    rows = np.repeat(np.arange(h * w), s * s)
    vals = flat.ravel()
    ok = vals >= 0
    np.add.at(counts, (rows[ok], vals[ok]), 1)
    mode = counts.argmax(1).reshape(h, w)
    return np.where(opaque * 2 > s * s, mode, -1)
