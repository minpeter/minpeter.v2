"""Import the reviewed 12-frame PCB-equipped transparent Inventor render into v717-pcb."""
import hashlib
import importlib.util
import json
from pathlib import Path
import sys

from PIL import Image

root = Path(__file__).resolve().parent.parent
source = Path(sys.argv[1]).resolve()
version = "v717-pcb"
relative = Path(f"public/assets/products/maru60/assembled/{version}/transparent--inventor")
target = root / relative
target.mkdir(parents=True, exist_ok=True)

frames = []
for angle in range(0, 360, 30):
    stem = f"frame_{angle:03d}"
    src_png = source / f"{stem}.png"
    src_webp = source / f"{stem}.webp"
    dst = target / f"{stem}.webp"
    if src_png.exists():
        with Image.open(src_png) as im:
            im = im.convert("RGBA")
            assert im.size == (1024, 1536), (src_png, im.size)
            im.save(dst, "WEBP", quality=88, method=6)
    else:
        with Image.open(src_webp) as im:
            assert im.size == (1024, 1536) and im.mode == "RGBA", (src_webp, im.size, im.mode)
        dst.write_bytes(src_webp.read_bytes())

    data = dst.read_bytes()
    assert data[:4] == b"RIFF" and data[8:16] == b"WEBPVP8X", dst
    assert (data[20] & 0x10) == 0x10, f"Missing alpha flag in {dst}"
    frames.append({
        "angleDegrees": angle,
        "height": 1536,
        "width": 1024,
        "src": "/" + str(relative.relative_to("public") / f"{stem}.webp"),
        "sha256": hashlib.sha256(data).hexdigest(),
    })

manifest = {
    "id": "transparent--inventor",
    "housingId": "transparent",
    "keycapId": "inventor",
    "orderable": False,
    "frames": frames,
}
for path in [root / "shared/maru60-personal-manifest.json", target / "manifest.json"]:
    path.write_text(json.dumps(manifest, indent=2) + "\n")

spec = importlib.util.spec_from_file_location("silhouette", root / "scripts/product-silhouette.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
shapes, sources = {}, {}
for frame in frames:
    key = Path(frame["src"]).stem
    shapes[key] = module.outline(Image.open(root / ("public" + frame["src"])), 0.75, envelope=True)
    assert shapes[key] is not None
    sources[key] = {"source": "public" + frame["src"], "sourceSha256": frame["sha256"]}

for name, value in [
    ("maru60-spin-silhouettes.json", shapes),
    ("maru60-spin-silhouettes.sources.json", sources),
    ("maru60-silhouette.json", {**sources["frame_000"], "outline": shapes["frame_000"]}),
]:
    (root / "shared" / name).write_text(json.dumps(value, indent=2) + "\n")

total_kb = sum((root / ("public" + f["src"])).stat().st_size for f in frames) / 1024
print(f"Imported 12 immutable v717-pcb frames ({total_kb:.1f} KB), manifests, and silhouettes.")
