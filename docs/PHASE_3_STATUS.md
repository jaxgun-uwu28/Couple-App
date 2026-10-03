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

Implementation commit `b9f1541` passed CI run `37100633508`: typecheck/build, manifest/map validation, 53 unit tests, 19 browser tests, 166 database assertions and actual pairing/slot/character races. Hosted rollback-only verification passed 19 manifest checks plus 48 character/consent/authorization checks; catalog has 70 options, a valid default and RLS enabled. APK run `37100635235` succeeded; downloaded archive digest and APK signature/package verified: 0.3.1, version code 8. All 65 externally bundled PNG files are 200x300; five small layers are inlined by Vite. Actual Android sync/performance remains pending.

## Known Issues

Provisional front-only artwork: no male parts, back/side views, pose grids, body/height variants, independent eyes/mouth/shoes/clothing colors or full specification option counts. Temporary transforms/effects do not constitute final pose art. Android process PSS excludes isolated WebView renderer memory; JS heap and decoded character pixels are distinct metrics, not total app/GPU memory. Device measurements must not be inferred from emulated touch or headless results. The CI-generated debug signing certificate differs from the previous 0.2.3 APK, so Android may require uninstall/reinstall; backend data is preserved, but sign-in must be repeated. No signing credentials were modified. Stable release signing remains deferred.

## Next Phase

User explicitly approved Phase 3 publication after automatic review required it. Main was fast-forwarded to `f3b29a1`; Vercel reported success and the existing live web session showed Connected plus the new Body-step editor. This commit differs from verified application commit `b9f1541` only in this report. The matching verified APK is `artifacts/phase3/Paw-and-Us-0.3.1-b9f1541.apk`. Obsolete local APKs/extracted copies and APK archives were deleted after signature/package/digest verification; exactly one deliverable APK remains.

Phase 4 remains unstarted. Real web/phone Hug/Cuddle/appearance/reconnect checks and physical Android performance are pending user results; finish these before marking Phase 3 complete. The manual test request is open. Final phase approval remains pending.

## Performance evidence

Two characters in view, 1280x800, 30 seconds alternating movement, production build with fixture authentication and two browser contexts. Headless Chromium measured about 7 FPS; it is not representative hardware evidence. Visible Edge 154 used AMD Radeon 660M / ANGLE Direct3D11: **32–35 FPS**, 27 recorded rolling-window samples, **35.2–44.9 MiB JS heap**, and **17.9 MiB estimated decoded character pixels/caches**. CDP heap was 9.5 MiB before warmup and 31.6 MiB afterward; that cold-start increase is not proof of a leak. Exact samples/screenshot are under `artifacts/phase3/web-performance.json` and `two-character-performance.png`. Pixel/cache estimates exclude GPU copies and whole-app memory. No 60-FPS or long-term-memory-stability claim.

Phone: user selected manual APK diagnostics; measurement is pending. Open the new APK on the phone and matching web build with both characters visible, move for one minute, then open Settings. Record FPS, slow frames, JS heap if supported, character pixels and app-process PSS. The current Infinix Note 30/Helio G99 device is the available phone, not an independently tested low-end model.

Native diagnostics follow [Capacitor custom code](https://capacitorjs.com/docs/android/custom-code) and [Android Debug memory API](https://developer.android.com/reference/android/os/Debug#getMemoryInfo(android.os.Debug.MemoryInfo)). No telemetry or extra permissions.
