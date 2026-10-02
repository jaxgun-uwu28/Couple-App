# Approved balanced cottage

`cottage-v1.tmx` was authored and exported by **official Tiled 1.12.2** using `author-house.js` after the user selected spacing A. It is editable in Tiled. Object layers define the full continuous house, furniture, decorations, collision, interactions, slots and named room/player/pet spawns. Navigation is an explicit walkable-cell tile layer. Custom Phaser vector furniture artwork follows these footprints; this TMX is the geometry source rather than a finished raster-art atlas.

Re-author/export with `tiled --evaluate maps/author-house.js <absolute-repository-root>`, then run `node scripts/validate-house-map.mjs` and `node scripts/export-house-catalog.mjs`. The tiny navigation tile is generated from its editable SVG by `node scripts/render-navigation.mjs`. Official tooling was extracted into ignored `.cache/tiled` without a system installation.

The exported JSON is in `packages/shared/src/maps/cottage-v1.json`; it embeds the tileset and uses CSV arrays. Application rendering does not load the navigation image. SQL catalog export must match it before a migration is applied; never regenerate an already-applied migration with different geometry. Later layout changes require a new version/migration and protocol review.

Geometry validation currently proves five connected rooms, six 96px door openings, 17 reachable interaction approaches, eight slot anchors and twelve clear spawns. It checks against a 12px feet collider, not merely against tile colors.
