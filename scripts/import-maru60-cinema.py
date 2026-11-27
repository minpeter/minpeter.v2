"""Export the 120-frame 4:5 Disney-choreographed Maru60 scroll-cinema WebP sequence."""

import hashlib
import json
from pathlib import Path
import shutil
import sys
import tempfile

from PIL import Image

# Curated 120-frame continuous 3D sequence across all 4 acts (zero hard jump-cuts):
#   Act I      (00..23): Profile Turn — Charcoal + PBTfans WoB (6° edge -> front -> USB-C -> brushed steel backplate + 7 bumpons)
#   Act I->II  (24..31): Disney Anticipation (-180° -> -185°) -> 90° Arc Whip + Shader Morph (Charcoal -> Bone White) -> Overshoot Settle
#   Act II     (32..62): Coil -> Cascading Overlapping 6-Layer Bloom + PCB Peek -> Flare -> Staggered Snap Lock -> Hero Reveal (0°)
#   Act II->III(63..70): Anticipation Breath -> Curved 3D Arc Dive + Morph (Bone White -> Dark Green + NicePBT BoW)
#   Act III    (71..81): Surface Macro — Specular light sweep across Dark Green honeycomb & porcelain BoW keycaps
#   Act III->IV(82..87): Continuous 3D Arc Pull-Back off Dark Green spoke #3 unveiling all 8 Maru60 finishes
#   Act IV     (88..119): 8-Finish Radial Lineup — exact 4 frames per finish × 8 finishes, caption-synced at foreground-left arrival
SEQUENCE_SPEC: list[tuple[str, str, int]] = [
    # Act I — Profile & Backplate (24 frames: 00..23)
    *[("v3", "profile-turn", f) for f in (
        # profileFront (00..08): 6° silhouette -> hinge open -> full Charcoal + WoB front
        0, 14, 15, 16, 17, 18, 19, 21, 24,
        # profileUsb (09..16): smooth 90° turn onto flush stainless USB-C edge
        36, 38, 40, 41, 42, 44, 46, 48,
        # profileBackplate arrival (17..23): 90° turn onto brushed steel weight + 7× 3M bumpons
        60, 62, 64, 65, 66, 68, 72,
    )],
    # Act I->II Continuous Disney Bridge + Act II Six-Layer Assembly (39 frames: 24..62)
    *[("v4", "bridge-assembly", f) for f in range(1, 40)],
    # Act II->III Continuous 3D Arc Dive into Surface Macro (8 frames: 63..70)
    *[("v4", "dive-macro", f) for f in range(0, 8)],
    # Act III — Material Surface Macro Specular Sweep (11 frames: 71..81)
    *[("v3", "surface-macro", f) for f in (0, 5, 10, 15, 20, 25, 31, 37, 42, 47, 52)],
    # Act III->IV Continuous 3D Pull-Back off Dark Green into 8-Unit Ring (6 frames: 82..87)
    *[("v4", "pullback-radial", f) for f in range(0, 6)],
    # Act IV — 8 Official Finishes Radial Parade (32 frames: 88..119, exact 4 frames per finish!)
    # Finish 1: Dark Green + NicePBT BoW (step 4, arrived directly via pullback-radial)
    ("v3", "radial-array", 4 * 20 + 0),
    ("v3", "radial-array", 4 * 20 + 8),
    ("v3", "radial-array", 4 * 20 + 10),
    ("v3", "radial-array", 4 * 20 + 12),
    # Finishes 2..7: Ice Blue (5), Charcoal (6), Bone White (7), Transparent (0), Ash Gray (1), Lilac Purple (2)
    *[
        ("v3", "radial-array", frame % 160)
        for prev_step, step in ((4, 5), (5, 6), (6, 7), (7, 0), (0, 1), (1, 2))
        for frame in (prev_step * 20 + 15, step * 20 + 0, step * 20 + 10, step * 20 + 12)
    ],
    # Finish 8: White Marble + NicePBT BoW (step 3) — silky deceleration into razor-sharp final stop
    ("v3", "radial-array", 2 * 20 + 14),
    ("v3", "radial-array", 2 * 20 + 16),
    ("v3", "radial-array", 2 * 20 + 18),
    ("v3", "radial-array", 3 * 20 + 0),
]

assert len(SEQUENCE_SPEC) == 120, len(SEQUENCE_SPEC)

root = Path(__file__).resolve().parent.parent
sources = {
    "v3": Path(sys.argv[1]).resolve(),
    "v4": Path(sys.argv[2]).resolve(),
}
target = root / "public/assets/products/maru60/cinema"
target.parent.mkdir(parents=True, exist_ok=True)

# Validate all inputs exist before encoding into a clean staging directory.
for src_key, study, src_f in SEQUENCE_SPEC:
    src_path = sources[src_key] / study / f"frame_{src_f:03d}.png"
    if not src_path.is_file():
        raise FileNotFoundError(f"Missing cinema source frame: {src_path}")

staging = Path(tempfile.mkdtemp(prefix=".cinema-staging-", dir=target.parent))
hasher = hashlib.sha256()
total_bytes = 0

try:
    for out_idx, (src_key, study, src_f) in enumerate(SEQUENCE_SPEC):
        src_path = sources[src_key] / study / f"frame_{src_f:03d}.png"
        dst_path = staging / f"f{out_idx:02d}.webp"
        with Image.open(src_path) as im:
            assert im.size == (1440, 1800), (src_path, im.size)
            im.save(dst_path, "WEBP", quality=90, method=6)
        data = dst_path.read_bytes()
        hasher.update(data)
        total_bytes += len(data)

    target.mkdir(parents=True, exist_ok=True)
    for staged in sorted(staging.glob("f*.webp")):
        staged.replace(target / staged.name)
    for old in target.glob("f*.webp"):
        idx = int(old.stem[1:]) if old.stem[1:].isdigit() else -1
        if idx < 0 or idx >= len(SEQUENCE_SPEC):
            old.unlink()
finally:
    shutil.rmtree(staging, ignore_errors=True)

summary = {
    "frameCount": len(SEQUENCE_SPEC),
    "height": 1800,
    "totalBytes": total_bytes,
    "version": hasher.hexdigest()[:8],
    "width": 1440,
}
print(json.dumps(summary, indent=2))
