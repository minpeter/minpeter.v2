"""Import the reviewed 12-frame exterior-only render without replacing old assets."""
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import sys

from PIL import Image

root = Path(__file__).resolve().parent.parent
source = Path(sys.argv[1]).resolve()
version = 'v716-exterior'
relative = Path(f'public/assets/products/maru60/assembled/{version}/transparent--inventor')
target = root / relative
target.mkdir(parents=True, exist_ok=True)
frames = []
for angle in range(0, 360, 30):
    name = f'frame_{angle:03}.webp'
    src = source / name
    with Image.open(src) as im:
        assert im.size == (1024, 1536) and im.mode == 'RGBA', (name, im.size, im.mode)
    shutil.copy2(src, target / name)
    frames.append({'angleDegrees': angle, 'height': 1536, 'width': 1024,
                   'src': '/' + str(relative.relative_to('public') / name),
                   'sha256': hashlib.sha256(src.read_bytes()).hexdigest()})
manifest = {'id': 'transparent--inventor', 'housingId': 'transparent',
            'keycapId': 'inventor', 'orderable': False, 'frames': frames}
for path in [root / 'shared/maru60-personal-manifest.json', target / 'manifest.json']:
    path.write_text(json.dumps(manifest, indent=2) + '\n')
spec = importlib.util.spec_from_file_location('silhouette', root / 'scripts/product-silhouette.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
shapes, sources = {}, {}
for frame in frames:
    key = Path(frame['src']).stem
    shapes[key] = module.outline(Image.open(root / ('public' + frame['src'])), 3, envelope=True)
    assert shapes[key] is not None
    sources[key] = {'source': 'public' + frame['src'], 'sourceSha256': frame['sha256']}
for name, value in [('maru60-spin-silhouettes.json', shapes),
                    ('maru60-spin-silhouettes.sources.json', sources),
                    ('maru60-silhouette.json', {**sources['frame_000'], 'outline': shapes['frame_000']})]:
    (root / 'shared' / name).write_text(json.dumps(value, indent=2) + '\n')
print('Imported 12 immutable frames, exact public manifests, and matching silhouettes.')
