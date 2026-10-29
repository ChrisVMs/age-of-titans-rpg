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


def _edge_profile(rgb, alpha, axis):
    """Peso de transición en cada borde de píxel a lo largo de axis (coordenada de borde x+1)."""
    a = rgb.astype(np.int32)
    if axis == 1:
        d = np.abs(a[:, 1:] - a[:, :-1]).sum(-1) * (alpha[:, 1:] & alpha[:, :-1])
        return d.sum(0).astype(np.float64)
    d = np.abs(a[1:] - a[:-1]).sum(-1) * (alpha[1:] & alpha[:-1])
    return d.sum(1).astype(np.float64)


def _spectrum(prof, pitches):
    pos = np.arange(1, len(prof) + 1, dtype=np.float64)
    w = prof - prof.mean()
    z = np.exp(-2j * np.pi * pos[None, :] / pitches[:, None]) @ w
    return z, np.abs(z) / max(np.abs(w).sum(), 1e-9)


def detect_pitch(rgb, alpha, max_size=32, step=0.005, rel=0.6):
    """Paso fraccionario de la rejilla (imágenes reescaladas por la IA a tamaño no entero),
    mismo paso en X e Y. Devuelve {"pitch", "phase": (fx, fy), "strength"}."""
    pitches = np.arange(1.5, max_size, step)
    zx, mx = _spectrum(_edge_profile(rgb, alpha, 1), pitches)
    zy, my = _spectrum(_edge_profile(rgb, alpha, 0), pitches)
    mag = (mx + my) / 2
    # el paso más grande con magnitud cercana a la máxima (los armónicos son pasos menores)
    i = int(np.nonzero(mag >= rel * mag.max())[0][-1])
    j0, j1 = max(0, i - 40), min(len(mag), i + 40)
    i = j0 + int(mag[j0:j1].argmax())
    p = float(pitches[i])
    fx = float((-np.angle(zx[i]) / (2 * np.pi) * p) % p)
    fy = float((-np.angle(zy[i]) / (2 * np.pi) * p) % p)
    return {"pitch": round(p, 3), "phase": (round(fx, 3), round(fy, 3)), "strength": round(float(mag[i]), 3)}


def downscale_mode_frac(idx, x0, y0, pitch, phase, core=0.2):
    """Reduce un recorte (idx con -1 transparente, origen x0,y0 en la hoja) sobre una
    rejilla de paso fraccionario. Cada celda usa solo su núcleo (descarta core·paso en
    cada borde, donde la IA difumina) y toma moda; opaca si la mayoría del núcleo lo es."""
    H, W = idx.shape
    out = []
    maps = []
    for n, org, p, f in ((W, x0, pitch, phase[0]), (H, y0, pitch, phase[1])):
        c = np.arange(n) + org + 0.5                     # centro del píxel en la hoja
        cell = np.floor((c - f) / p).astype(int)
        frac = ((c - f) / p) % 1.0
        inside = (frac >= core) & (frac <= 1 - core)
        maps.append((cell - cell.min(), inside))
    (cx, ix), (cy, iy) = maps
    w, h = cx.max() + 1, cy.max() + 1
    use = iy[:, None] & ix[None, :]
    CY, CX = np.broadcast_to(cy[:, None], idx.shape), np.broadcast_to(cx[None, :], idx.shape)
    cid = (CY * w + CX)[use]
    v = idx[use]
    k = int(max(idx.max(), 0)) + 1
    total = np.bincount(cid, minlength=h * w)
    opq = np.bincount(cid[v >= 0], minlength=h * w)
    counts = np.zeros((h * w, k), np.int32)
    np.add.at(counts, (cid[v >= 0], v[v >= 0]), 1)
    mode = counts.argmax(1)
    res = np.where((opq * 2 > total) & (total > 0), mode, -1)
    return res.reshape(h, w)
