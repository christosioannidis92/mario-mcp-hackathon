"""Generate themed fallback levels for the demo.

Convention (matches PR2's castle/underground rewrites):
  - playerStart at (2, 13)
  - Floor at y=14 (ground)
  - Enemies stand on floor at y=13
  - Flag near the end at y=10
"""
import json
from pathlib import Path


def empty_grid(w: int, h: int) -> list[list[str]]:
    return [["empty"] * w for _ in range(h)]


def floor_with_gaps(grid: list[list[str]], w: int, y: int = 14, gaps: list[tuple[int, int]] | None = None) -> None:
    gaps = gaps or []
    for x in range(w):
        if any(a <= x <= b for a, b in gaps):
            continue
        grid[y][x] = "ground"


def platform(grid: list[list[str]], x0: int, y: int, length: int, tile: str = "brick") -> None:
    for x in range(x0, x0 + length):
        grid[y][x] = tile


def coin_row(grid: list[list[str]], x0: int, y: int, length: int, step: int = 1) -> None:
    for x in range(x0, x0 + length, step):
        grid[y][x] = "coin"


def pipe(grid: list[list[str]], x: int, top_y: int) -> None:
    for y in range(top_y, 14):
        grid[y][x] = "pipe"


def flag_at(grid: list[list[str]], x: int, y: int = 10) -> None:
    grid[y][x] = "flag"


def save_level(level: dict, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as f:
        json.dump(level, f, indent=2)
    print(f"wrote {path}  ({level['width']}x{level['height']}, {len(level['enemies'])} enemies)")


# ---------------- overworld-2 — rolling hills + pipes -----------------
def make_overworld_2() -> dict:
    w, h = 60, 15
    g = empty_grid(w, h)
    floor_with_gaps(g, w, gaps=[(18, 19), (35, 37), (50, 51)])

    # Platforms ascending
    platform(g, 6, 10, 3)
    platform(g, 14, 9, 4)
    platform(g, 22, 11, 3)
    platform(g, 28, 8, 5)
    coin_row(g, 28, 7, 5)
    platform(g, 42, 10, 4)
    coin_row(g, 14, 8, 4)

    # Pipes
    pipe(g, 11, 12)
    pipe(g, 39, 11)

    # Staircase to flag
    platform(g, 54, 13, 1)
    platform(g, 55, 12, 1)
    platform(g, 56, 11, 1)
    platform(g, 57, 10, 1)

    flag_at(g, 58, y=9)

    enemies = [
        {"x": 8,  "y": 13, "type": "goomba"},
        {"x": 13, "y": 13, "type": "goomba"},
        {"x": 24, "y": 13, "type": "koopa"},
        {"x": 30, "y": 13, "type": "goomba"},
        {"x": 39, "y": 10, "type": "piranha"},
        {"x": 44, "y": 13, "type": "koopa"},
        {"x": 53, "y": 13, "type": "goomba"},
    ]
    return {
        "id": "overworld-2",
        "theme": "overworld",
        "width": w,
        "height": h,
        "playerStart": {"x": 2, "y": 13},
        "enemies": enemies,
        "tiles": g,
    }


# ---------------- ice-1 — gappy, narrow platforms -----------------
def make_ice() -> dict:
    w, h = 64, 15
    g = empty_grid(w, h)
    # Lots of gaps — slippery / floaty feel comes from the level layout
    floor_with_gaps(g, w, gaps=[(10, 13), (20, 23), (32, 35), (44, 47), (54, 56)])

    # Small mid-air platforms over gaps
    platform(g, 11, 11, 2)
    platform(g, 21, 10, 2)
    platform(g, 33, 11, 2)
    platform(g, 45, 10, 2)

    # Higher coin trail
    coin_row(g, 11, 9, 2)
    coin_row(g, 21, 8, 2)
    coin_row(g, 33, 9, 2)
    coin_row(g, 45, 8, 2)

    # Brick ceilings (icicle feel)
    platform(g, 5, 4, 3)
    platform(g, 25, 5, 4)
    platform(g, 50, 4, 3)

    # Approach to flag
    platform(g, 58, 12, 1)
    platform(g, 59, 11, 1)
    platform(g, 60, 10, 1)
    flag_at(g, 62, y=9)

    enemies = [
        {"x": 7,  "y": 13, "type": "goomba"},
        {"x": 16, "y": 13, "type": "koopa"},
        {"x": 27, "y": 13, "type": "goomba"},
        {"x": 38, "y": 13, "type": "koopa"},
        {"x": 50, "y": 13, "type": "goomba"},
        {"x": 57, "y": 13, "type": "koopa"},
    ]
    return {
        "id": "ice-1",
        "theme": "ice",
        "width": w,
        "height": h,
        "playerStart": {"x": 2, "y": 13},
        "enemies": enemies,
        "tiles": g,
    }


# ---------------- spooky-1 — dense enemies, dark theme -----------------
def make_spooky() -> dict:
    w, h = 72, 15
    g = empty_grid(w, h)
    floor_with_gaps(g, w, gaps=[(15, 16), (28, 30), (44, 45), (58, 60)])

    # Castle-feel: brick pillars and walls
    for x in [10, 22, 36, 50]:
        platform(g, x, 11, 1)
        platform(g, x, 12, 1)
        platform(g, x, 13, 1)

    # Floating platforms
    platform(g, 17, 9, 3)
    platform(g, 31, 10, 3)
    platform(g, 46, 9, 3)
    platform(g, 61, 10, 4)

    # Pipes (with piranhas atop)
    pipe(g, 5, 12)
    pipe(g, 33, 11)
    pipe(g, 55, 12)

    # Coins above platforms
    coin_row(g, 17, 8, 3)
    coin_row(g, 31, 9, 3)
    coin_row(g, 46, 8, 3)

    # Staircase to flag
    platform(g, 65, 13, 1)
    platform(g, 66, 12, 1)
    platform(g, 67, 11, 1)
    platform(g, 68, 10, 1)
    flag_at(g, 70, y=9)

    enemies = [
        {"x": 7,  "y": 13, "type": "goomba"},
        {"x": 8,  "y": 13, "type": "goomba"},
        {"x": 13, "y": 13, "type": "koopa"},
        {"x": 20, "y": 13, "type": "goomba"},
        {"x": 25, "y": 13, "type": "koopa"},
        {"x": 33, "y": 10, "type": "piranha"},
        {"x": 38, "y": 13, "type": "goomba"},
        {"x": 42, "y": 13, "type": "koopa"},
        {"x": 53, "y": 13, "type": "goomba"},
        {"x": 55, "y": 11, "type": "piranha"},
        {"x": 64, "y": 13, "type": "goomba"},
        {"x": 65, "y": 13, "type": "koopa"},
    ]
    return {
        "id": "spooky-1",
        "theme": "spooky",
        "width": w,
        "height": h,
        "playerStart": {"x": 2, "y": 13},
        "enemies": enemies,
        "tiles": g,
    }


def main() -> None:
    out = Path("fixtures")
    save_level(make_overworld_2(), out / "level-overworld-2.json")
    save_level(make_ice(), out / "level-ice.json")
    save_level(make_spooky(), out / "level-spooky.json")


if __name__ == "__main__":
    main()
