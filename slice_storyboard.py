#!/usr/bin/env python3
"""
Slice the 12-panel storyboard grid into 12 separate PNGs.

Usage:
    python3 slice_storyboard.py /path/to/storyboard.png

Output: ./panels/panel_01.png ... panel_12.png
Layout assumed: 3 rows x 4 columns, thin dark gutters between cells.
Each output crops off the numbered badge area only lightly; tweak MARGIN if needed.
"""
import sys, os
from PIL import Image

COLS, ROWS = 4, 3
MARGIN = 6  # px trimmed inside each cell to drop the gutter line

def main(path):
    img = Image.open(path).convert("RGB")
    W, H = img.size
    cw, ch = W / COLS, H / ROWS
    out = os.path.join(os.path.dirname(os.path.abspath(path)), "panels")
    os.makedirs(out, exist_ok=True)
    n = 1
    for r in range(ROWS):
        for c in range(COLS):
            left   = int(c * cw) + MARGIN
            upper  = int(r * ch) + MARGIN
            right  = int((c + 1) * cw) - MARGIN
            lower  = int((r + 1) * ch) - MARGIN
            crop = img.crop((left, upper, right, lower))
            crop.save(os.path.join(out, f"panel_{n:02d}.png"))
            n += 1
    print(f"Wrote {n-1} panels to {out}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 slice_storyboard.py /path/to/storyboard.png")
        sys.exit(1)
    main(sys.argv[1])
