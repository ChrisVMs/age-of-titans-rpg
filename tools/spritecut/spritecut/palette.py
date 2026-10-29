"""Paleta común por hoja, sin dithering."""
import numpy as np
from scipy.cluster.vq import kmeans2


def build_palette(pixels, n_colors=16, seed=0, max_samples=60000, merge_dist=14.0):
    """pixels: Nx3 uint8 (solo opacos de todos los frames). Devuelve Kx3 uint8, K<=n."""
    uniq = np.unique(pixels, axis=0)
    if len(uniq) <= n_colors:
        pal = uniq
    else:
        rng = np.random.default_rng(seed)
        sample = pixels if len(pixels) <= max_samples else pixels[rng.choice(len(pixels), max_samples, replace=False)]
        cent, lab = kmeans2(sample.astype(np.float64), n_colors, minit="++", seed=seed, iter=30)
        cent = cent[np.bincount(lab, minlength=n_colors) > 0]
        pal = np.clip(np.rint(cent), 0, 255).astype(np.uint8)
        pal = np.unique(pal, axis=0)
        pal = merge_close(pal, sample, merge_dist)
    lum = pal.astype(float) @ [0.299, 0.587, 0.114]
    return pal[np.argsort(lum, kind="stable")]


def nearest_index(rgb, palette):
    """Índice del color de paleta más cercano (asignación directa, sin difusión de error)."""
    flat = rgb.reshape(-1, 3).astype(np.int32)
    out = np.empty(len(flat), np.int32)
    p = palette.astype(np.int32)
    for i in range(0, len(flat), 200000):
        d = ((flat[i:i + 200000, None, :] - p[None]) ** 2).sum(-1)
        out[i:i + 200000] = d.argmin(1)
    return out.reshape(rgb.shape[:2])


def merge_close(pal, sample, thr):
    """Fusiona colores casi iguales (ruido de la IA partido en dos clusters)."""
    pal = pal.astype(np.float64)
    w = np.bincount(nearest_index(sample[None], pal.astype(np.uint8))[0], minlength=len(pal)).astype(float)
    while len(pal) > 1:
        d = np.sqrt(((pal[:, None] - pal[None]) ** 2).sum(-1))
        np.fill_diagonal(d, np.inf)
        i, j = np.unravel_index(d.argmin(), d.shape)
        if d[i, j] >= thr:
            break
        tot = max(w[i] + w[j], 1)
        pal[i] = (pal[i] * w[i] + pal[j] * w[j]) / tot
        w[i] = tot
        pal, w = np.delete(pal, j, 0), np.delete(w, j)
    return np.clip(np.rint(pal), 0, 255).astype(np.uint8)
