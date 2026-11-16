# Transparent Inventor exterior render

The transparent Inventor option now uses a separately versioned 12-frame exterior approximation. It is not a complete internal assembly model or physical fit validation.

- Exterior CAD source: `minpeter/maru60` commit `a55279866ae588e6e839d7156f7e94ab3df29641`.
- Scope: latest exterior shell, original 60 Inventor keycaps, external feet, weight and USB appearance.
- Deliberately omitted: PCB, switches, plate, gaskets, catch internals and associated internal hardware. Do not interpret empty interior space as a faithful real assembly.
- The existing camera, lighting, 1024 × 1536 canvas and 30-degree angle sequence match the opaque presentation. Material/printed translucency remains an approximation.
- New asset family: `/assets/products/maru60/assembled/v716-exterior/transparent--inventor/`.
- Old transparent v1 assets and all 420 opaque v7.15 corrected assets are retained unchanged.
- The personal option remains non-orderable, independent of retail combinations.

The registry and public manifest carry per-frame SHA-256 digests. Silhouette provenance is regenerated from the exact published WebPs. Local and CI tests verify file hashes, dimensions, alpha, angle order, option pairing and silhouette bounds.
