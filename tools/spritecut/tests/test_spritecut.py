import json
import sys
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import synth  # noqa: E402
from spritecut import pixelsize, palette  # noqa: E402
from spritecut.cli import main  # noqa: E402
from spritecut.pipeline import process  # noqa: E402


def run(tmp_path, sheet_path):
    out = tmp_path / "out"
    main([str(sheet_path), "-o", str(out)])
    return out / sheet_path.stem


def frames_of(d):
    return sorted(p for p in d.glob("*_[0-9][0-9].png"))


def test_good_sheet(tmp_path):
    p = synth.write_good(tmp_path)
    res = process(p)
    info = res["info"]
    assert info["frames_detected"] == 8 and info["frames_expected"] == 8
    assert info["pixel_size"]["detected"] == 4
    assert info["warnings"] == []
    assert len(info["palette"]) == len(synth.COLORS)
    d = run(tmp_path, p)
    files = [f.name for f in frames_of(d)]
    assert files[:4] == ["knight_attack_00.png", "knight_attack_01.png", "knight_attack_02.png", "knight_attack_03.png"]
    assert "knight_walk_00.png" in files
    # frame reducido a resolución nativa exacta
    walk0 = np.asarray(Image.open(d / "knight_walk_00.png"))
    truth = synth.knight(0) > 0
    ty, tx = np.nonzero(truth)
    truth = truth[ty.min():ty.max() + 1, tx.min():tx.max() + 1]
    a = walk0[..., 3] > 0
    ys, xs = np.nonzero(a)
    assert a[ys.min():ys.max() + 1, xs.min():xs.max() + 1].tolist() == truth.tolist()


def test_outputs_are_clean(tmp_path):
    d = run(tmp_path, synth.write_good(tmp_path))
    meta = json.loads((d / "knight.json").read_text())
    sizes = set()
    for f in frames_of(d):
        im = Image.open(f)
        assert im.mode == "RGBA" and "icc_profile" not in im.info
        arr = np.asarray(im)
        assert set(np.unique(arr[..., 3])) <= {0, 255}
        sizes.add(im.size)
        # pies en la línea base: la última fila del canvas tiene píxeles opacos
        assert arr[-1, :, 3].any()
    assert len(sizes) == 1 and list(sizes.pop()) == meta["canvas"]
    for f in ["knight_atlas.png", "knight_contact.png", "knight_detect.png", "knight_report.txt"]:
        assert (d / f).exists()


def test_bad_sheet(tmp_path):
    p = synth.write_bad(tmp_path)
    res = process(p)
    info = res["info"]
    assert info["frames_detected"] == 8
    assert info["pixel_size"]["detected"] == 4
    assert any("pegados" in w for w in info["warnings"])
    assert len(info["discarded"]) >= 1                      # mancha suelta
    assert len(info["palette"]) == len(synth.COLORS)
    # sin magenta residual en los frames
    for a in res["animations"]:
        for cv in a["canvases"]:
            cols = res["palette"][cv[cv >= 0]].astype(int)
            assert not ((cols[:, 0] > 200) & (cols[:, 1] < 80) & (cols[:, 2] > 200)).any()
    # silueta del frame 0 de walk igual a la verdad (salvo como mucho 2 bloques)
    walk = next(a for a in res["animations"] if a["name"] == "walk")
    cv = walk["canvases"][0] >= 0
    ys, xs = np.nonzero(cv)
    got = cv[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    truth = synth.knight(0) > 0
    ty, tx = np.nonzero(truth)
    truth = truth[ty.min():ty.max() + 1, tx.min():tx.max() + 1]
    assert got.shape == truth.shape and (got != truth).sum() <= 2


def test_bad_sheet_without_grid(tmp_path):
    p = synth.write_bad(tmp_path)
    (tmp_path / "knight_bad.json").unlink()
    info = process(p)["info"]
    assert info["segmentation"] == "rows"
    assert info["frames_detected"] == 8
    assert any("pegados" in w for w in info["warnings"])


def test_count_mismatch_warns(tmp_path):
    p = synth.write_good(tmp_path)
    hyp = dict(synth.HYP, animations=[{"row": 0, "name": "walk", "frames": 5},
                                      {"row": 1, "name": "attack", "frames": 4}])
    (tmp_path / "knight.json").write_text(json.dumps(hyp))
    info = process(p)["info"]
    assert any("walk" in w and "5 esperados" in w for w in info["warnings"])


def test_wrong_hypothesis_pixel_size(tmp_path):
    p = synth.write_good(tmp_path)
    (tmp_path / "knight.json").write_text(json.dumps(dict(synth.HYP, expected_pixel_size=6)))
    info = process(p)["info"]
    assert info["pixel_size"]["used"] == 4
    assert any("≠ esperado 6" in w for w in info["warnings"])


@pytest.mark.parametrize("s", [1, 2, 3, 5, 8])
def test_pixel_size_detection(s):
    rng = np.random.default_rng(s)
    g = rng.integers(0, 6, (20, 20))
    rgb = (np.kron(g, np.ones((s, s), int))[..., None] * [40, 30, 20]).astype(np.uint8)
    det = pixelsize.detect_pixel_size(rgb, np.ones(rgb.shape[:2], bool))
    assert det["size"] == s


def test_mode_downscale_ignores_noise():
    idx = np.zeros((8, 8), np.int32)
    idx[0, 0] = 3            # un píxel ruidoso dentro del bloque
    idx[4:, 4:] = -1         # bloque transparente
    d = pixelsize.downscale_mode(idx, 4)
    assert d.tolist() == [[0, 0], [0, -1]]


def test_palette_limit_no_dither():
    px = np.random.default_rng(0).integers(0, 256, (5000, 3)).astype(np.uint8)
    pal = palette.build_palette(px, 8)
    assert len(pal) <= 8
    img = px.reshape(50, 100, 3)
    idx = palette.nearest_index(img, pal)
    assert idx.max() < len(pal)


def test_cols_and_separate_canvas(tmp_path):
    p = synth.write_good(tmp_path)
    hyp = dict(synth.HYP, animations=[{"row": 0, "name": "walk", "frames": 4},
                                      {"row": 1, "name": "attack", "cols": [0, 1, 2]},
                                      {"row": 1, "name": "fx", "cols": [3], "separate": True}])
    (tmp_path / "knight.json").write_text(json.dumps(hyp))
    res = process(p)
    by = {a["name"]: a for a in res["animations"]}
    assert len(by["attack"]["canvases"]) == 3 and len(by["fx"]["canvases"]) == 1
    assert by["walk"]["canvas"] == by["attack"]["canvas"]
    assert res["info"]["warnings"] == []


def test_fractional_pitch_and_grid_lines(tmp_path):
    """Hoja reescalada a 3.625 px por píxel (nearest) con líneas de grilla dibujadas."""
    sheet, _ = synth.make_sheet()
    nat = sheet[::synth.S, ::synth.S]
    h, w = nat.shape[:2]
    big = np.asarray(Image.fromarray(nat).resize((round(w * 3.625), round(h * 3.625)), Image.NEAREST)).copy()
    H, W = big.shape[:2]
    for i in range(1, 4):
        big[:, int(W * i / 4) - 1:int(W * i / 4) + 2] = (0, 80, 0)
    big[H // 2 - 1:H // 2 + 2] = (0, 80, 0)
    Image.fromarray(big).save(tmp_path / "knight.png")
    (tmp_path / "knight.json").write_text(json.dumps(dict(synth.HYP, expected_pixel_size=None)))
    info = process(tmp_path / "knight.png")["info"]
    assert abs(info["pixel_size"]["detected"] - 3.625) < 0.02
    assert info["frames_detected"] == 8
    assert len(info["grid_lines"]["x"]) == 3 and len(info["grid_lines"]["y"]) == 1
    assert not any("pegados" in w for w in info["warnings"])
