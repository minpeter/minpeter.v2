"""Import all 35 reviewed PCB-equipped opaque retail combinations (420 frames) into v717-pcb."""
from concurrent.futures import ProcessPoolExecutor
import hashlib
import importlib.util
import json
from pathlib import Path
import sys

from PIL import Image

HOUSINGS = (
    "ash-gray",
    "bone-white",
    "charcoal",
    "dark-green",
    "ice-blue",
    "lilac-purple",
    "white-marble",
)
KEYCAPS = (
    "nicepbt-bow-retail",
    "nicepbt-noel-latin-retail",
    "nicepbt-purple-chonkers-retail",
    "pbtfans-wob-retail",
    "retro-programmer-retail",
)
VERSION = "v717-pcb"
CANONICAL_RETAIL = "bone-white--nicepbt-bow-retail"


def convert_frame(args: tuple[str, str, int, str]) -> dict:
    src_str, dst_str, angle, public_src = args
    src = Path(src_str)
    dst = Path(dst_str)
    dst.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        rgba = im.convert("RGBA")
        assert rgba.size == (1024, 1536), (src, rgba.size)
        rgba.save(dst, "WEBP", quality=88, method=6)
    data = dst.read_bytes()
    assert data[:4] == b"RIFF" and data[8:16] == b"WEBPVP8X", dst
    assert (data[20] & 0x10) == 0x10, f"Missing alpha flag in {dst}"
    return {
        "angleDegrees": angle,
        "height": 1536,
        "width": 1024,
        "sha256": hashlib.sha256(data).hexdigest(),
        "src": public_src,
    }


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    source_root = Path(sys.argv[1]).resolve()
    base_rel = Path(f"public/assets/products/maru60/assembled/{VERSION}")

    combos = sorted(f"{h}--{k}" for h in HOUSINGS for k in KEYCAPS)
    assert len(combos) == 35

    tasks: list[tuple[str, str, int, str]] = []
    for combo in combos:
        for angle in range(0, 360, 30):
            stem = f"frame_{angle:03d}"
            src = source_root / combo / f"{stem}.png"
            assert src.exists() and src.stat().st_size > 5000, f"Missing rendered frame: {src}"
            dst_rel = base_rel / combo / f"{stem}.webp"
            public_src = "/" + str(dst_rel.relative_to("public"))
            tasks.append((str(src), str(root / dst_rel), angle, public_src))

    with ProcessPoolExecutor(max_workers=16) as pool:
        results = list(pool.map(convert_frame, tasks))

    manifests = []
    by_combo: dict[str, list[dict]] = {}
    for idx, combo in enumerate(combos):
        frames = results[idx * 12 : (idx + 1) * 12]
        by_combo[combo] = frames
        housing_id, keycap_id = combo.split("--", 1)
        entry = {
            "id": combo,
            "housingId": housing_id,
            "keycapId": keycap_id,
            "orderable": False,
            "frames": frames,
        }
        manifests.append(entry)
        (root / base_rel / combo / "manifest.json").write_text(
            json.dumps(entry, indent=2) + "\n"
        )

    (root / "shared/maru60-assembled-manifests.json").write_text(
        json.dumps(manifests, indent=2) + "\n"
    )

    spec = importlib.util.spec_from_file_location(
        "silhouette", root / "scripts/product-silhouette.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    shapes, sources = {}, {}
    for frame in by_combo[CANONICAL_RETAIL]:
        key = Path(frame["src"]).stem
        shapes[key] = module.outline(
            Image.open(root / ("public" + frame["src"])), 0.75, envelope=True
        )
        assert shapes[key] is not None
        sources[key] = {
            "source": "public" + frame["src"],
            "sourceSha256": frame["sha256"],
        }

    (root / "shared/maru60-retail-silhouettes.json").write_text(
        json.dumps(shapes, indent=2) + "\n"
    )
    (root / "shared/maru60-retail-silhouettes.sources.json").write_text(
        json.dumps(sources, indent=2) + "\n"
    )

    total_mb = sum((root / ("public" + r["src"])).stat().st_size for r in results) / (1024 * 1024)
    print(
        f"Imported {len(combos)} combinations ({len(results)} immutable {VERSION} WebP frames, {total_mb:.2f} MB), "
        "manifests, and retail silhouettes."
    )


if __name__ == "__main__":
    main()
