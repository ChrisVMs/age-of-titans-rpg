"""Carga de imágenes e hipótesis JSON."""
import json
from pathlib import Path

import numpy as np
from PIL import Image


def load_rgba(path):
    """Devuelve (rgb uint8 HxWx3, alpha bool HxW). No aplica perfiles de color."""
    im = Image.open(path)
    im.load()
    has_alpha = im.mode in ("RGBA", "LA", "PA") or (im.mode == "P" and "transparency" in im.info)
    im = im.convert("RGBA")
    arr = np.asarray(im)
    rgb = arr[..., :3].copy()
    alpha = arr[..., 3] >= 128 if has_alpha else np.ones(arr.shape[:2], bool)
    return rgb, alpha


def load_hypothesis(image_path):
    """Lee <imagen>.json si existe. Es solo una hipótesis: se verifica después."""
    p = Path(image_path).with_suffix(".json")
    if not p.exists():
        return {}
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def parse_hex(color):
    c = color.lstrip("#")
    if len(c) != 6:
        raise ValueError(f"color inválido: {color}")
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


def to_hex(rgb):
    return "#{:02X}{:02X}{:02X}".format(*(int(v) for v in rgb))


def save_png(path, rgba):
    """PNG sin pérdida, sin ICC ni gamma."""
    Image.fromarray(np.ascontiguousarray(rgba), "RGBA").save(path, format="PNG", optimize=True)
