# Phase 2 new-login position sync — 2026-10-03

Published app source `58071b7` to main/Vercel; production root serves matching `index-DTPf7Xza.js`. CI `37093850016` web/database jobs succeeded; matching APK run `37093850080` succeeded. Verified `artifacts/phase2/Paw-and-Us-0.2.3-58071b7.apk`, SHA-256 `93639707de43621a5407d118739c582e6e6827c80173218cead9fdc6d8135e7f`; archive digest, Android signature and package/version/SDK metadata checked. Phone login recheck remains pending.

## Implemented

User confirmed phone 0.2.2 smoothness after one minute of walking, roughly 55–77+ FPS. Preserve that renderer. A fresh login still spawns in the hall, but its partner now establishes the new session's received position immediately instead of interpolating from the previous living-room position. Remote playback/display history resets only for a new session; normal movement and same-session recovery retain smoothing.

## Files Changed

Shared RemoteMotion and two regression tests, HouseRuntime received-point update, phone logout/login browser regression, Android 0.2.3/code 6 and diagnostic version label, DECISIONS/PROTOCOL/phone evidence and this report.

## Database Changes

None; no persistent position storage added.

## API/RPC Changes

None.

## Realtime Changes

Existing motion events unchanged. Couple membership and current Presence session validation still precede frame acceptance. No added traffic; old session packets remain filtered.

## Tests

47 unit tests, strict build/types and four focused local browser regressions passed. Final CI passed all 15 browser tests plus 99 pgTAP assertions and concurrent transaction checks. Phone browser regression logs out in Living Room, signs back in at Hall, and checks partner position matches within 1.5s despite 150ms fixture delivery delay. Existing movement/idle/collision, device ownership/logout and simultaneous reconnect/Away tests cover related regressions.

## Known Issues

User confirmed on 2026-10-03 that the reported logout/login partner-position problem is resolved after the 0.2.3 handoff. Physical recheck passed by user report. Existing fresh CI debug signing can require uninstalling old debug app for future updates; server account/home data is preserved.

## Next Phase

Web correction published, matching APK verified and physical login recheck confirmed. Wait for overall Phase 2 approval; Phase 3 is unstarted.
