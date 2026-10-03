# Phase 2 device corrections — 2026-10-03

Published to main/Vercel from app source `32d5a48`. Existing authenticated browser connected successfully to the updated client (`index-DeiMUr_D.js`), with no warning/error logs. Live evidence: `artifacts/phase2/fixes-live-connected.png`. Matching Android 0.2.1/code 4 is ready; physical phone recheck remains pending.

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

CI `37091478014` succeeded for source `32d5a48`: web and database jobs passed, including 99 pgTAP assertions and real concurrent transaction checks. APK run `37091478052` succeeded for the same source. Download archive digest matched GitHub metadata; Android signature and package/SDK metadata verified. APK `artifacts/phase2/Paw-and-Us-phase2-0.2.1-32d5a48.apk`, SHA-256 `969c5d1c4c3b07157ac939fbd7c89abc68a359df8b0bc2effabe0f486781d376`.

## Known Issues

Actual phone FPS has not been measured; static drawing work was reduced without claiming a measured device frame rate. Real-device smoothness/long-seat recheck remains required. The verified APK certificate differs from the earlier debug build, so uninstall the older debug APK before installing; server data remains intact.

## Next Phase

Web fixes published and matching APK verified. Wait for physical web/phone confirmation, including over two minutes seated together, Leave/reconnect and walking smoothness. Phase 2 remains open; Phase 3 stays unstarted.
