# Maru60 v7.15 corrected opaque renders

This update contains 420 opaque render frames: seven housing colors × five retail keycap sets × twelve angles. All existing v1 assets remain available. The transparent Inventor configuration continues to use its existing v1 render, not the corrected candidate.

## Model provenance and limits

- Source CAD revision: `5193353d03f712453d2a996fb2d16f109dd155e8`.
- Corrected render scene SHA-256: `f1ca1f23cb73d73c2060badc997bd20ef0c3edde75bf3709a9cc34e423f58258`.
- Wrist-rest bumpons: three. Lower-case bumpons: four.
- Weight, plate and gasket geometry were corrected during the source audit.
- Catch and strike geometry is photo-derived, not supplier CAD.
- PCB and switch internals are omitted. Physical engagement and compatibility are not certified by these renders.
- Material colors and printed appearance are approximate.
- All public combinations remain non-orderable.

## Validation

The source batch passed matching PNG/WebP hashes, 1024×1536 RGBA dimensions, twelve-angle completeness, alpha margin checks and scene consistency. The public manifests use a separate minimal structural schema. Runtime validation does not establish physical suitability.
