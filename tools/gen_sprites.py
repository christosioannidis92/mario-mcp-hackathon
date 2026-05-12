"""Generate procedural pixel-art sprites for assets not available in the
source sprite sheet. Outputs 32x32 PNGs into demo/assets/.

Why: koopa, piranha, pipe, ground, flag have no equivalents in the
businessman sheet, so we mint simple placeholder pixel art that's better
than colored rects but won't compete with proper Kenney sprites later.
"""
from pathlib import Path
from PIL import Image, ImageDraw

SIZE = 32  # canonical tile size — matches engine TILE_SIZE


def new_canvas() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def save(img: Image.Image, path: str) -> None:
    out = Path(path)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)
    print(f"wrote {out}")


def ground() -> Image.Image:
    """Brown dirt with grass on top."""
    img, d = new_canvas()
    # dirt body
    d.rectangle([0, 6, 31, 31], fill=(139, 90, 43))
    # darker spots
    for cx, cy in [(6, 14), (18, 20), (24, 11), (10, 26), (22, 27)]:
        d.rectangle([cx, cy, cx + 2, cy + 2], fill=(100, 60, 28))
    # grass top
    d.rectangle([0, 0, 31, 6], fill=(76, 175, 80))
    d.rectangle([0, 6, 31, 7], fill=(56, 142, 60))
    # grass blade highlights
    for x in [3, 9, 15, 21, 27]:
        d.rectangle([x, 1, x, 3], fill=(129, 199, 132))
    # top-edge highlight
    d.rectangle([0, 0, 31, 0], fill=(165, 214, 167))
    return img


def pipe() -> Image.Image:
    """Green pipe section (single tile)."""
    img, d = new_canvas()
    # body
    d.rectangle([4, 0, 27, 31], fill=(46, 168, 79))
    # top rim cap (wider)
    d.rectangle([2, 0, 29, 7], fill=(56, 200, 95))
    # rim shadow
    d.rectangle([2, 7, 29, 8], fill=(30, 110, 50))
    # highlight on left edge
    d.rectangle([6, 9, 8, 30], fill=(120, 220, 140))
    d.rectangle([4, 9, 5, 30], fill=(85, 200, 110))
    # shadow on right edge
    d.rectangle([23, 9, 25, 30], fill=(30, 130, 60))
    d.rectangle([26, 9, 27, 30], fill=(20, 95, 40))
    return img


def flag() -> Image.Image:
    """Pole with triangular flag."""
    img, d = new_canvas()
    # pole
    d.rectangle([14, 0, 17, 31], fill=(180, 180, 180))
    d.rectangle([14, 0, 14, 31], fill=(230, 230, 230))  # highlight
    d.rectangle([17, 0, 17, 31], fill=(120, 120, 120))  # shadow
    # ball at top
    d.ellipse([12, 0, 19, 5], fill=(255, 215, 0))
    # red triangle flag
    d.polygon([(18, 4), (30, 10), (18, 16)], fill=(220, 40, 40))
    d.polygon([(18, 5), (28, 10), (18, 15)], fill=(245, 80, 80))  # highlight
    return img


def koopa() -> Image.Image:
    """Green turtle: shell + head poking out."""
    img, d = new_canvas()
    # shell body
    d.ellipse([4, 8, 28, 30], fill=(46, 168, 79))
    # shell highlight
    d.ellipse([8, 10, 22, 22], fill=(76, 200, 110))
    # shell rim
    d.ellipse([4, 26, 28, 31], fill=(20, 110, 45))
    # shell spots
    for cx, cy in [(10, 17), (18, 14), (15, 21), (22, 19)]:
        d.ellipse([cx, cy, cx + 3, cy + 3], fill=(30, 130, 55))
    # head (peeking out front)
    d.ellipse([18, 4, 30, 14], fill=(245, 220, 90))
    # eye
    d.rectangle([24, 7, 26, 9], fill=(0, 0, 0))
    d.rectangle([25, 7, 25, 8], fill=(255, 255, 255))
    # feet
    d.rectangle([6, 28, 10, 31], fill=(200, 150, 50))
    d.rectangle([22, 28, 26, 31], fill=(200, 150, 50))
    return img


def piranha() -> Image.Image:
    """Red plant with white teeth and a leaf stem."""
    img, d = new_canvas()
    # stem at bottom
    d.rectangle([14, 24, 17, 31], fill=(56, 142, 60))
    # head
    d.ellipse([4, 4, 27, 26], fill=(220, 40, 40))
    # head highlight
    d.ellipse([8, 6, 18, 16], fill=(255, 100, 100))
    # mouth opening (dark)
    d.rectangle([9, 12, 22, 19], fill=(70, 0, 0))
    # teeth top row
    for x in [10, 13, 16, 19]:
        d.polygon([(x, 12), (x + 2, 12), (x + 1, 15)], fill=(255, 255, 255))
    # teeth bottom row
    for x in [11, 14, 17]:
        d.polygon([(x, 19), (x + 2, 19), (x + 1, 16)], fill=(255, 255, 255))
    # spots
    for cx, cy in [(7, 9), (22, 8), (24, 18), (6, 20)]:
        d.ellipse([cx, cy, cx + 3, cy + 3], fill=(255, 200, 200))
    return img


def main() -> None:
    save(ground(),  "demo/assets/tiles/ground.png")
    save(pipe(),    "demo/assets/tiles/pipe.png")
    save(flag(),    "demo/assets/tiles/flag.png")
    save(koopa(),   "demo/assets/enemies/koopa.png")
    save(piranha(), "demo/assets/enemies/piranha.png")


if __name__ == "__main__":
    main()
