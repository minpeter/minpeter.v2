"""Import rendered Skateboard Stand assets, generate SHA-256 manifests and SVG silhouettes."""
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import sys

from PIL import Image

COLORS = [
    "cobalt-blue",
    "charcoal",
    "bone-white",
    "ash-gray",
    "ice-blue",
    "dark-green",
    "white-marble",
]
VIEWS = [
    ("stand", "stand"),
    ("board", "with-board"),
]
SCENES = ["scene-wall", "scene-real", "scene-slot", "scene-top", "scene-side", "scene-underside"]

root = Path(__file__).resolve().parent.parent
source = Path(sys.argv[1]).resolve()
target_root = root / "public/assets/products/skateboard-stand"

manifests = []
for view_id, folder in VIEWS:
    for color_id in COLORS:
        rel_dir = Path(f"public/assets/products/skateboard-stand/turntable/{folder}/{color_id}")
        dst_dir = root / rel_dir
        dst_dir.mkdir(parents=True, exist_ok=True)
        src_dir = source / "turntable" / folder / color_id
        frames = []
        for angle in range(0, 360, 30):
            name = f"frame_{angle:03d}.webp"
            src = src_dir / name
            with Image.open(src) as im:
                assert im.size == (1024, 1536) and im.mode == "RGBA", (src, im.size, im.mode)
            shutil.copy2(src, dst_dir / name)
            frames.append({
                "angleDegrees": angle,
                "height": 1536,
                "sha256": hashlib.sha256(src.read_bytes()).hexdigest(),
                "src": "/" + str(rel_dir.relative_to("public") / name),
                "width": 1024,
            })
        manifests.append({
            "colorId": color_id,
            "frames": frames,
            "id": f"{view_id}--{color_id}",
            "viewId": view_id,
        })

(root / "shared/skateboard-stand-manifests.json").write_text(
    json.dumps(manifests, indent=2) + "\n"
)

# Copy usage showcase scenes (fail fast if any scene is missing or unreadable)
scenes_dst = target_root / "scenes"
scenes_dst.mkdir(parents=True, exist_ok=True)
scene_versions = {}
for scene_name in SCENES:
    src = source / "scenes" / f"{scene_name}.webp"
    if not src.exists():
        raise FileNotFoundError(f"Missing required showcase scene: {src}")
    with Image.open(src) as im:
        im.verify()
    shutil.copy2(src, scenes_dst / f"{scene_name}.webp")
    scene_versions[scene_name] = hashlib.sha256(src.read_bytes()).hexdigest()[:8]

# Copy OG preview
og_src = source / "og.png"
with Image.open(og_src) as im:
    assert im.size == (1200, 630), (og_src, im.size)
shutil.copy2(og_src, target_root / "og.png")

# Generate silhouettes from bone-white stand & board turntables
spec = importlib.util.spec_from_file_location("silhouette", root / "scripts/product-silhouette.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def build_silhouettes(folder, out_name, single_out=None):
    shapes, sources = {}, {}
    rel_dir = Path(f"public/assets/products/skateboard-stand/turntable/{folder}/bone-white")
    for angle in range(0, 360, 30):
        stem = f"frame_{angle:03d}"
        file_path = root / rel_dir / f"{stem}.webp"
        with Image.open(file_path) as im:
            outline = module.outline(im, tolerance=1.5)
        assert outline is not None, file_path
        shapes[stem] = outline
        sources[stem] = {
            "source": str(rel_dir / f"{stem}.webp"),
            "sourceSha256": hashlib.sha256(file_path.read_bytes()).hexdigest(),
        }
    (root / "shared" / f"{out_name}.json").write_text(json.dumps(shapes, indent=2) + "\n")
    (root / "shared" / f"{out_name}.sources.json").write_text(json.dumps(sources, indent=2) + "\n")
    if single_out:
        (root / "shared" / single_out).write_text(
            json.dumps({**sources["frame_000"], "outline": shapes["frame_000"]}, indent=2) + "\n"
        )


build_silhouettes("stand", "skateboard-stand-silhouettes")
build_silhouettes("with-board", "skateboard-stand-board-silhouettes", "skateboard-stand-silhouette.json")

print(
    f"Imported {len(manifests)} turntable sets ({len(manifests) * 12} frames), "
    f"{len(scene_versions)} scenes ({scene_versions}), og.png, and silhouettes."
)
