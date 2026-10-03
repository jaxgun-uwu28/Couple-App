# Phase 2 new-login position sync — 2026-10-03

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

47 unit tests pass, including immediate new-session position/direction and bounded same-session recovery. Phone browser regression logs out in Living Room, signs back in at Hall, and checks partner position matches within 1.5s despite 150ms fixture delivery delay. Existing movement/idle/collision, device ownership/logout and simultaneous reconnect/Away tests cover related regressions. Final build/CI evidence recorded after completion.

## Known Issues

Physical phone logout/login recheck remains pending. Matching web/APK required; existing fresh CI debug signing can require uninstalling old debug app. Server account/home data is preserved.

## Next Phase

Publish the verified login correction and APK, then wait for device verification. Phase 2 remains open; Phase 3 is unstarted.
