"""Escritura de frames, metadatos, atlas, hoja de contactos y reporte."""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

from .io import save_png


def to_rgba(idx, palette):
    out = np.zeros(idx.shape + (4,), np.uint8)
    op = idx >= 0
    out[op, :3] = palette[idx[op]]
    out[op, 3] = 255
    return out


def checker(w, h, cell=8):
    yy, xx = np.indices((h, w))
    v = np.where(((yy // cell) + (xx // cell)) % 2 == 0, 200, 150).astype(np.uint8)
    return np.dstack([v, v, v, np.full_like(v, 255)])


def frame_name(prefix, anim, i):
    base = anim if anim.startswith(prefix + "_") or anim == prefix else f"{prefix}_{anim}"
    return f"{base}_{i:02d}.png"


def contact_sheet(result, scale=4, gap=8):
    """Cada frame final ampliado ×scale sobre tablero, con caja (verde) y línea base (roja)."""
    pal = result["palette"]
    anims = result["animations"]
    label_h = 14
    sheet_w = max((gap + len(a["canvases"]) * (a["canvas"][0] * scale + gap) for a in anims), default=200)
    sheet_h = gap + sum(a["canvas"][1] * scale + gap + label_h for a in anims)
    img = Image.new("RGBA", (max(sheet_w, 200), max(sheet_h, 40)), (40, 40, 48, 255))
    dr = ImageDraw.Draw(img)
    y = gap
    for a in anims:
        W, H = a["canvas"]
        ax, ay = a["anchor_px"]
        cw, chh = W * scale, H * scale
        dr.text((gap, y), f"{a['name']} ({len(a['canvases'])}"
                + (f"/{a['expected']})" if a["expected"] else ")"), fill=(255, 255, 255, 255))
        y += label_h
        for c, cv in enumerate(a["canvases"]):
            x = gap + c * (cw + gap)
            bgc = Image.fromarray(checker(cw, chh, 4 * scale // 2 or 4), "RGBA")
            fr = Image.fromarray(to_rgba(cv, pal), "RGBA").resize((cw, chh), Image.NEAREST)
            bgc.alpha_composite(fr)
            img.paste(bgc, (x, y))
            ys, xs = np.nonzero(cv >= 0)
            if len(ys):
                dr.rectangle([x + xs.min() * scale, y + ys.min() * scale,
                              x + (xs.max() + 1) * scale - 1, y + (ys.max() + 1) * scale - 1],
                             outline=(0, 255, 0, 255))
            dr.line([x, y + ay * scale - 1, x + cw - 1, y + ay * scale - 1], fill=(255, 0, 0, 255))
            dr.line([x + ax * scale, y + ay * scale - 4, x + ax * scale, y + ay * scale + 2],
                    fill=(255, 0, 0, 255))
            dr.text((x + 2, y + 2), str(c), fill=(255, 255, 0, 255))
        y += chh + gap
    return img


def detection_overlay(result):
    """Hoja original sin fondo, con cajas de cada frame (verde), grilla del JSON (azul)
    y manchas descartadas (rojo)."""
    rgb, alpha, info = result["rgb"], result["alpha"], result["info"]
    H, W = alpha.shape
    base = Image.fromarray(checker(W, H, 16), "RGBA")
    base.alpha_composite(Image.fromarray(np.dstack([rgb, np.where(alpha, 255, 0).astype(np.uint8)]), "RGBA"))
    dr = ImageDraw.Draw(base)
    grid = (info.get("hypothesis") or {}).get("grid") or {}
    if info.get("segmentation") == "grid":
        for i in range(1, int(grid["cols"])):
            x = int(W * i / int(grid["cols"]))
            dr.line([x, 0, x, H], fill=(0, 128, 255, 255))
        for j in range(1, int(grid["rows"])):
            y = int(H * j / int(grid["rows"]))
            dr.line([0, y, W, y], fill=(0, 128, 255, 255))
    for a in result["animations"]:
        for i, (f, _, g) in enumerate(a["items"]):
            x0, y0, x1, y1 = f.bbox
            dr.rectangle([x0, y0, x1 - 1, y1 - 1], outline=(0, 255, 0, 255), width=2)
            dr.text((x0 + 3, y0 + 3), f"{a['name']}{i}", fill=(255, 255, 0, 255))
    for d in info["discarded"]:
        x0, y0, x1, y1 = d["bbox"]
        dr.rectangle([x0 - 2, y0 - 2, x1 + 1, y1 + 1], outline=(255, 0, 0, 255), width=2)
    return base


def build_atlas(result, prefix):
    """Atlas por estanterías: una fila por animación."""
    anims = result["animations"]
    W = max((sum(cv.shape[1] for cv in a["canvases"]) for a in anims), default=1)
    H = sum(a["canvas"][1] for a in anims) or 1
    atlas = np.zeros((H, W, 4), np.uint8)
    rects, y = {}, 0
    for a in anims:
        x = 0
        for i, cv in enumerate(a["canvases"]):
            h, w = cv.shape
            atlas[y:y + h, x:x + w] = to_rgba(cv, result["palette"])
            rects[frame_name(prefix, a["name"], i)[:-4]] = [x, y, w, h]
            x += w
        y += a["canvas"][1]
    return atlas, rects


def report_text(info):
    ps = info["pixel_size"]
    lines = [f"# {info['source']}",
             f"frames: {info['frames_detected']} detectados / "
             f"{info['frames_expected'] if info['frames_expected'] is not None else '?'} esperados",
             f"tamaño de píxel: {ps['detected']} detectado (confianza {ps['confidence']}) / "
             f"{ps['expected'] if ps['expected'] else '?'} esperado → usado {ps['used']}",
             f"fondo: {info['background']['color']}  (quitado {info['background']['bg_removed']} px, "
             f"bolsas {info['background']['holes_removed']} px, halo {info['background']['halo_removed']} px)",
             f"segmentación: {info['segmentation']}, componentes: {info['components']}",
             f"canvas: {info['canvas'][0]}x{info['canvas'][1]}, anclaje {info['anchor']} en {info['anchor_px']}",
             f"colores finales ({len(info['palette'])}): {' '.join(info['palette'])}",
             f"descartados ({len(info['discarded'])}): "
             + (", ".join(f"área {d['area']} en {d['bbox']}" for d in info["discarded"]) or "ninguno")]
    for a in info.get("animations", []):
        lines.append(f"  {a['name']}: {a['frames']}" + (f"/{a['expected']}" if a["expected"] else ""))
    lines.append("avisos:" if info["warnings"] else "avisos: ninguno")
    lines += [f"  - {w}" for w in info["warnings"]]
    return "\n".join(lines) + "\n"


def write_all(result, out_dir, prefix, atlas=True, debug=True):
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    info, pal = result["info"], result["palette"]
    files = []
    info["animations"] = []
    for a in result["animations"]:
        names = []
        for i, cv in enumerate(a["canvases"]):
            n = frame_name(prefix, a["name"], i)
            save_png(out / n, to_rgba(cv, pal))
            names.append(n)
        files += names
        info["animations"].append({"name": a["name"], "row": a["row"], "frames": len(names),
                                   "expected": a["expected"], "canvas": a["canvas"],
                                   "anchor_px": a["anchor_px"], "files": names})
    meta = {k: v for k, v in info.items() if k != "options"}
    meta["options"] = info["options"]
    if atlas and files:
        img, rects = build_atlas(result, prefix)
        save_png(out / f"{prefix}_atlas.png", img)
        meta["atlas"] = {"file": f"{prefix}_atlas.png", "frames": rects}
    with open(out / f"{prefix}.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    rep = report_text(info)
    (out / f"{prefix}_report.txt").write_text(rep, encoding="utf-8")
    if debug:
        contact_sheet(result).save(out / f"{prefix}_contact.png")
        detection_overlay(result).save(out / f"{prefix}_detect.png")
    return rep
