# chibi_v1 — layered character assets (exported from chibis_600x400.psd)

LICENSE: CONFIRMED by the asset provider/user as free images on 2026-10-03. These are provisional assets, not final art. See docs/DECISIONS.md. Preserve all source PNGs unchanged.

- `full/` 400x600 per layer (source quality). `half/` 200x300 per layer (recommended for in-game).
- Every PNG is a full-canvas transparent layer. Draw the selected layers at (0,0), same size, bottom to top.
- Stacking order (bottom to top): hair_back, body (+blush), outfit, hair_front, face, accessories.
- `manifest.json` lists every layer (id, group, file, bbox) and the option catalog + default look.
- Runtime `default_config` stores layer IDs; `expression_sets` maps selected face IDs to emote/pose face IDs. Add new male files/layer records (same canvas and layer roles) and an expression-set entry if their faces differ; the editor/renderer discover them automatically. Run `node scripts/export-character-catalog.mjs` to generate server allowlist data, then rebuild/deploy the catalog migration. For a later deployed catalog, give the generated SQL a new migration timestamp; never rewrite an already-applied migration. No application/validator code changes required.
- Pairing notes: `twintails` exists only as hair_back and `bob` only as hair_front, so pair them with another style's front/back (e.g., twintails back + short front).
- Missing: male parts, back/side views, sit/sleep/hug/walk poses, eye colors, separate shoes.
- `preview_looks.png` and `preview_options.png` are reference renders built from these exported PNGs.
