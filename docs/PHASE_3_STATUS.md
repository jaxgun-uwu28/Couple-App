# Phase 3 — verification in progress

## Implemented

Manifest-driven unchanged 200x300 PNG layers, lower/upper base caches with separate outfit/accessories, guided full-screen mobile creator, onboarding/Mirror/Wardrobe entries, five outfit presets, live appearance sync, emote wheel/three-second reactions, mutual Hug/contextual sofa/bed Cuddle, cancel/recovery, name tags and AFK. Front-only direction/pose transforms are explicitly placeholders in UI/code and documented in DESIGN. Shared face/portrait rendering prepares future chat portraits; no Phase 4 chat.

## Files Changed

Character manifest/README/half PNGs (source PNGs unmodified); shared character schemas; CharacterArt, LayeredCharacter, CharacterEditor, World and styles; optional Android memory plugin/activity/version; catalog generator/migrations/tests; CI/APK workflows; DECISIONS, DESIGN, PROTOCOL and phase plan. Full-resolution source/reference images are preserved but not included in the game bundle.

## Database Changes

Earlier character appearance/outfit/social tables plus two server-only RLS catalog/default tables. Generated allowlist data uses manifest IDs. Numeric prototype rows are preserved and exposed as unconfigured defaults until the owner resaves; unsupported presets are omitted. No direct client writes.

## API/RPC Changes

Caller-owned save/read/consent RPCs; look JSON is `{body,blush,hairBack,hairFront,face,outfit,accessories}` of validated manifest IDs. Reject unknown/wrong-role/duplicate IDs, malformed and extra fields. New catalog entries work without editing validators; rebuild and deploy generated SQL data. Consent remains session-bound, eight-second requests and bounded leases.

## Realtime Changes

UUID invalidation for authoritative character reads and session-bound ephemeral emotes on the existing private couple channel. Existing movement smoothing/budget remains. No periodic standing-idle traffic or new state-value broadcasts.

## Tests

Local typecheck/build and 53 unit tests passed. Browser checks completed for composition/cache cleanup, guided mobile creator/live appearance/cancel and Mirror/Wardrobe entry, consent expiry/accept/cancel/reaction expiry. Full exact-commit CI/database/concurrency verification remains pending. Two-character production web benchmark and Android diagnostics are below; real Android sync/performance remains pending.

## Known Issues

Provisional front-only artwork: no male parts, back/side views, pose grids, body/height variants, independent eyes/mouth/shoes/clothing colors or full specification option counts. Temporary transforms/effects do not constitute final pose art. Android process PSS excludes isolated WebView renderer memory; JS heap and decoded character pixels are distinct metrics, not total app/GPU memory. Device measurements must not be inferred from emulated touch or headless results.

## Next Phase

Phase 4 remains unstarted. Finish Phase 3 CI, hosted verification, matching APK and real web/phone checks, then present the final report and wait for approval.

## Performance evidence

Two characters in view, 1280x800, 30 seconds alternating movement, production build with fixture authentication. Headless Chromium measured about 7 FPS; it is not representative hardware evidence. Visible Edge used AMD Radeon 660M / ANGLE Direct3D11. Exact FPS, heap samples and screenshot live under `artifacts/phase3/web-performance.json` and `two-character-performance.png`; final measured range will be recorded after verification. Decoded source/cached character pixels are bounded at approximately 17.9 MiB (70 source layers + eight actor textures), excluding GPU copies and whole-app memory.

Phone: user selected manual APK diagnostics; measurement is pending. Open the new APK on the phone and matching web build with both characters visible, move for one minute, then open Settings. Record FPS, slow frames, JS heap if supported, character pixels and app-process PSS. The current Infinix Note 30/Helio G99 device is the available phone, not an independently tested low-end model.

Native diagnostics follow [Capacitor custom code](https://capacitorjs.com/docs/android/custom-code) and [Android Debug memory API](https://developer.android.com/reference/android/os/Debug#getMemoryInfo(android.os.Debug.MemoryInfo)). No telemetry or extra permissions.
