# Phase 2 phone performance follow-up — 2026-10-03

Published phone-browser update from app source `8e4070a`; production root serves matching `index-BSmS-sSI.js`. CI `37092970603` and APK build `37092970644` succeeded for that source. Verified APK `artifacts/phase2/Paw-and-Us-phone-0.2.2-8e4070a.apk`, SHA-256 `adb67dfdda186983090a5d7f3fefa738c43d246bef8f3f7720f52add0f28eff6`; download archive digest matched GitHub, Android signature/package/version/SDK metadata checked. Physical FPS recheck requested and pending.

## Implemented

User confirmed latest APK 0.2.1 on Infinix Note 30 / Helio G99 / 8GB RAM / Android 14, with equally choppy Chrome gameplay. The previous floor-only cache did not resolve device smoothness. Apply an additional phone-only rendering profile (Capacitor native or primary coarse pointer): cache static furniture/decorations as bounded RenderTextures at original depths, preserve live walls/doors/toggles/outlines, directly update joystick knob transforms without React reconciliation on each pointer move, and request a high-performance context. Antialiasing, layout and gameplay stay intact. Desktop uses its existing path.

Settings on phones shows local renderer and latest walking FPS/slow-frame count, sampled over 120 moving frames. No network telemetry or in-game diagnostic panel; walk about 15 seconds, then open Settings to read it. APK version 0.2.2/code 5.

## Files Changed

CottageArt, World, Android version, DECISIONS, isolated browser rendering harness/test and this report. The harness is not imported into the application bundle.

## Database Changes

None.

## API/RPC Changes

None.

## Realtime Changes

None. Previous movement budget and lease fixes remain.

## Tests

45 unit tests, strict types, production build and all 14 browser tests passed locally and in final CI. Real-renderer comparison proves more than twenty static vector objects are replaced by cached textures, preserving depths/layout; manually reviewed both complete maps side by side (`artifacts/phase2/phone-cache-comparison.png`). Full-house paired activities, touch/keyboard, reconnect/Away, legacy clients, authorization/session/cache and idle regressions passed. Unchanged database checks passed again: 99 pgTAP assertions and concurrent transactions.

## Known Issues

User rechecked 0.2.2 on the Infinix and reports good smoothness after about a minute of walking, with observed FPS roughly 55–77+. Phone smoothness gate passed by user report. A separate new-login partner-position interpolation bug is being corrected; do not mark Phase 2 complete until that recheck. Retain debug-install certificate handling; server account data remains intact.

## Next Phase

Deliver verified APK 0.2.2 and phone-browser update, obtain walking FPS and smoothness feedback. Phase 2 remains open and Phase 3 stays unstarted.
