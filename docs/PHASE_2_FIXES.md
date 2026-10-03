# Phase 2 device corrections — 2026-10-03

## Implemented

User-requested walking speed increases 10% to 132px/s. Walls remain at least 85% opaque and fade slightly only when actually occluding an online avatar. Occupied local activities hide the nearest outline until Leave; toggles retain normal outlines. Bake the static floor once and reuse unchanged actor, label, door, toggle and outline drawings; camera following uses elapsed frame time.

Long sitting diverged because renewal refreshed only the caller's expiry. Renew now invalidates the partner's cached world, serializes with Leave and reconciles rejected renewals. A cached lease expiry triggers one authoritative read to recover a missed notification; empty-world idle polling remains absent. Recovery sync also refreshes object state.

## Files Changed

CottageArt, World, HouseRuntime and four runtime regression tests; shared speed/test; Android version 0.2.1/code 4; DESIGN, DECISIONS, PROTOCOL and phase evidence.

## Database Changes

None. Existing RLS, lease duration and authoritative interaction RPC remain unchanged.

## API/RPC Changes

No new contract. Existing renew/cancel/world calls are sequenced and reconciled correctly.

## Realtime Changes

Existing object_changed UUID-only invalidation now accompanies renewal and recovery sync. No idle movement traffic, new event or client-authoritative state.

## Tests

45 unit tests, strict types, production build and all 13 desktop/mobile browser checks passed. New runtime regressions cover four renewals past original expiry, lost renewal notification with no empty-world polling, rejected renewal and Leave during renewal. Reviewed 844×390 paired seated screenshot: no gold outline, floor/furniture intact (`artifacts/phase2/fixed-seated-mobile.png`).

## Known Issues

Actual phone FPS has not been measured; static drawing work was reduced without claiming a measured device frame rate. Matching APK and real-device smoothness/long-seat recheck remain required. Existing debug CI signing uses a fresh runner key, so uninstalling the older debug APK may be required; server data remains intact.

## Next Phase

Publish the verified fixes and matching APK, then wait for physical web/phone confirmation. Phase 2 remains open; Phase 3 stays unstarted.
