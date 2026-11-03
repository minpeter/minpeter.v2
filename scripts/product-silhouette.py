"""Generate solid outer product outlines offline (Python 3 + Pillow).

Usage: python3 scripts/product-silhouette.py INPUT_FILE_OR_DIRECTORY OUTPUT [--tolerance 3] [--convex] [--envelope]
Keeps the full image canvas: never crop, rotate, or infer opaque backgrounds.
Interior holes are deliberately filled. Concave/disconnected outer shapes remain.
Optional --convex envelopes each component for simple solid keyboard bodies.
--envelope joins all alpha components into one body envelope (keyboard only).
The browser receives a few SVG points, not the source image or image processing.
"""
import argparse
from collections import defaultdict
import hashlib
import json
import math
from pathlib import Path

from PIL import Image


def simplify(points, tolerance):
    if len(points) <= 2:
        return points
    a, b = points[0], points[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    length = math.hypot(dx, dy)
    distances = [abs(dy * (p[0] - a[0]) - dx * (p[1] - a[1])) / length
                 if length else math.dist(p, a) for p in points]
    split = max(range(len(points)), key=lambda i: distances[i])
    if distances[split] <= tolerance:
        return [a, b]
    return (simplify(points[:split + 1], tolerance)[:-1]
            + simplify(points[split:], tolerance))


def convex_hull(points):
    points = sorted(set(points))
    def cross(a, b, c):
        return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
    def half(sequence):
        hull = []
        for point in sequence:
            while len(hull) >= 2 and cross(hull[-2], hull[-1], point) <= 0:
                hull.pop()
            hull.append(point)
        return hull[:-1]
    return half(points) + half(reversed(points))


def simplify_closed(loop, tolerance):
    # Keep the four support extrema as anchors. A single RDP split can
    # discard a rounded corner's extreme and shrink the visible product.
    anchors = sorted({0, *(min(range(len(loop)), key=lambda i: sign * loop[i][axis])
                           for axis in (0, 1) for sign in (-1, 1))})
    points = []
    for index, start in enumerate(anchors):
        end = anchors[(index + 1) % len(anchors)]
        segment = loop[start:end + 1] if end > start else loop[start:] + loop[:end + 1]
        points.extend(simplify(segment, tolerance)[:-1])
    return points


def outline(image, tolerance=3, convex=False, envelope=False):
    alpha = image.convert("RGBA").getchannel("A")
    if alpha.getextrema() in ((255, 255), (0, 0)):
        return None  # Explicit outline or reserved plain placeholder, never segmentation.
    if alpha.width > 1024:
        alpha = alpha.resize((1024, round(alpha.height * 1024 / alpha.width)), Image.Resampling.LANCZOS)
    width, height = alpha.size
    pixels = alpha.load()

    def inside(x, y):
        return 0 <= x < width and 0 <= y < height and pixels[x, y] >= 128

    edges = defaultdict(list)
    for y in range(height):
        for x in range(width):
            if not inside(x, y):
                continue
            if not inside(x, y - 1):
                edges[(x, y)].append((x + 1, y))
            if not inside(x + 1, y):
                edges[(x + 1, y)].append((x + 1, y + 1))
            if not inside(x, y + 1):
                edges[(x + 1, y + 1)].append((x, y + 1))
            if not inside(x - 1, y):
                edges[(x, y + 1)].append((x, y))
    if envelope:
        # Explicit single-body envelope: include even tiny disconnected edge pixels.
        # Generic outlines still preserve meaningful disconnected/concave parts.
        points = simplify_closed(convex_hull(list(edges)), tolerance)
        return {"width": width, "height": height,
                "polygons": [" ".join(f"{x},{y}" for x, y in points)]}
    polygons = []
    while edges:
        start = next(iter(edges))
        current, loop = start, []
        while True:
            loop.append(current)
            destination = edges[current].pop()
            if not edges[current]:
                del edges[current]
            current = destination
            if current == start:
                break
        area = sum(a[0] * b[1] - b[0] * a[1]
                   for a, b in zip(loop, loop[1:] + loop[:1])) / 2
        # Clockwise loops are outer contours; reverse loops are interior holes.
        if area < width * height * .001:
            continue
        if convex:
            loop = convex_hull(loop)
        points = simplify_closed(loop, tolerance)
        polygons.append(" ".join(f"{x},{y}" for x, y in points))
    return {"width": width, "height": height, "polygons": polygons} if polygons else None


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--tolerance", type=float, default=3)
    parser.add_argument("--convex", action="store_true")
    parser.add_argument("--envelope", action="store_true")
    args = parser.parse_args()
    def entry(source):
        return {
            "source": source.as_posix(),
            "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
            "outline": outline(Image.open(source), args.tolerance, args.convex, args.envelope),
        }

    if args.input.is_dir():
        entries = {source.stem: entry(source) for source in sorted(args.input.glob("*.webp"))}
        result = {key: value["outline"] for key, value in entries.items()}
        # Keep source paths/hashes out of the runtime/client payload.
        provenance = {key: {field: value[field] for field in ("source", "sourceSha256")}
                      for key, value in entries.items()}
        args.output.with_suffix(".sources.json").write_text(json.dumps(provenance, indent=2) + "\n")
    else:
        result = entry(args.input)
    args.output.write_text(json.dumps(result, indent=2) + "\n")
