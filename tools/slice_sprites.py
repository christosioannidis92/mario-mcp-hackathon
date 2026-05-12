"""Slice a sprite sheet with a uniform-ish background into individual PNGs.

Usage:
  python tools/slice_sprites.py <input.png> [--out <dir>] [--min-area N]
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import label


def slice_sheet(input_path: str, out_dir: str, min_area: int = 1500, threshold: int = 40) -> None:
    img = Image.open(input_path).convert("RGBA")
    arr = np.array(img)
    h, w = arr.shape[:2]

    corners = np.array(
        [arr[0, 0, :3], arr[0, w - 1, :3], arr[h - 1, 0, :3], arr[h - 1, w - 1, :3]],
        dtype=int,
    )
    bg = np.median(corners, axis=0)
    print(f"image: {w}x{h}, background ~ {tuple(int(x) for x in bg)}")

    diff = np.linalg.norm(arr[:, :, :3].astype(int) - bg, axis=2)
    mask = diff > threshold

    labels, n = label(mask, structure=np.ones((3, 3), dtype=int))
    print(f"raw components: {n}")

    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    kept = []
    for lid in range(1, n + 1):
        ys, xs = np.where(labels == lid)
        area = len(ys)
        if area < min_area:
            continue
        y0, y1 = int(ys.min()), int(ys.max())
        x0, x1 = int(xs.min()), int(xs.max())
        bw, bh = x1 - x0 + 1, y1 - y0 + 1
        crop = img.crop((x0, y0, x1 + 1, y1 + 1))
        crop_arr = np.array(crop)
        bg_mask = np.linalg.norm(crop_arr[:, :, :3].astype(int) - bg, axis=2) <= threshold
        crop_arr[bg_mask, 3] = 0
        fname = f"sprite_{lid:03d}_{bw}x{bh}_at_{x0}-{y0}.png"
        Image.fromarray(crop_arr).save(out_path / fname)
        kept.append((lid, x0, y0, bw, bh, area))

    print(f"saved {len(kept)} sprites to {out_path}/")
    print("\n  idx |  x  |  y  |  w  |  h  | area")
    print("  ----|-----|-----|-----|-----|------")
    for lid, x0, y0, bw, bh, area in sorted(kept, key=lambda r: (r[2] // 100, r[1])):
        print(f"  {lid:>3} | {x0:>3} | {y0:>3} | {bw:>3} | {bh:>3} | {area}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("--out", default="demo/assets/sprites_extracted")
    parser.add_argument("--min-area", type=int, default=1500)
    parser.add_argument("--threshold", type=int, default=40)
    args = parser.parse_args()
    slice_sheet(args.input, args.out, args.min_area, args.threshold)
