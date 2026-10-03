# Phase 2 — Shared House World

Device feedback update 2026-10-03: user confirmed phone smoothness on 0.2.2 (roughly 55–77+ observed FPS), and confirmed the 0.2.3 logout/login partner-position issue resolved. These reported issues are verified by user recheck. See PHASE_2_PHONE_PERFORMANCE.md and PHASE_2_LOGIN_SYNC.md. User subsequently approved progression; Phase 3 planning/design is authorized.

Status 2026-10-03: **complete and accepted for progression**. User tested the shared house on web/phone, confirmed phone smoothness and login-sync resolution, then authorized proceeding. Final source/build evidence is in PHASE_2_LOGIN_SYNC.md and PHASE_2_PHONE_PERFORMANCE.md. Phase 3 is authorized for planning/design; implementation waits for its design gate.

## Implemented

Approved balanced continuous cottage: 64×44 at 32px, four-tile hall, six three-tile doors, five rooms, required furniture/decorations and living-room arcade. Source authored/exported through official Tiled 1.12.2 before integration. Custom vector furniture follows approved styles/palette. Named spawns, feet collision, explicit pet navigation, reachable interaction approaches/slots, automatic door visuals, depth sorting and wall transparency near players.

132px/s normalized keyboard movement (user-requested 10% increase) and adjustable touch joystick reuse existing motion smoothing. Local follow camera, room toast, independent Map icon/minimap, contextual nearest outline/action and direct object tapping. Sit/Sleep occupy separate authoritative anchors; Leave, movement or Escape cancel. Reduced movement during player crossings prevents a partner blocking the hall. Empty/future/error hints expire after three seconds. See `PHASE_2_FIXES.md` for subsequent phone rendering, wall/outline and long-seat renewal corrections.

Fridge, TV, lamp and toilet have shared toggles. Cook/Clean/Play/Change Clothes and remaining future activities expose contextual availability feedback; their actual systems and final character animations are outside this phase. No toolbar, dashboard, global Games button or Phase 3 feature added.

## Files Changed

- `maps/author-house.js`, editable TMX/navigation artwork and README; exported shared JSON; map validation/catalog export scripts.
- Shared cottage definitions/tests, optional movement geometry and world schemas.
- World/CottageArt/HouseRuntime, HouseApi/HouseTransport, cache/App remount and floating HUD styles.
- Phase 2 migration, pgTAP and real transaction concurrency tests; hosted verification wrapper and CI.
- Android version 0.2.0/code 3 and matching debug artifact name; design/decisions/protocol/plan/status documentation.

## Database Changes

Applied `20261003000100_phase2_house_world.sql` in one hosted dashboard transaction after inspection and successful database CI. Three new tables: global read-only map catalog, couple-scoped toggles and leased player slots; RLS enabled, no client DML. Existing houses/account RPCs and IDs remain unchanged. Post-audit: two houses, three members, seventeen catalog entries, zero leftover test slots/toggles, zero unprotected app tables. Tests used rollback-only fixtures.

Dashboard-applied migration history has not been repaired with the CLI. Do not reset/replay these migrations; repair only verified versions before a future CLI db push.

## API/RPC Changes

`get_house_snapshot_v2` selects production geometry for the new client while original snapshots remain compatible with old APKs. `get_house_world` derives the caller's couple. `house_interact` serializes start/cancel/toggle/renew, validates object/proximity/slot, binds caller/session and preserves complete idempotent arguments. Slot leases last 90 seconds, renew while actively used, and release on cancellation/background/disposal; winning new devices clear their own stale session lease. Position hints remain peer-trusted and grant no reward or cross-couple access. Cache schema 2 prevents prior geometry replay. See PROTOCOL for exact contracts/errors.

## Realtime Changes

Exact private map-version channel suffix separates the full house from old test-room clients. Room changes share the existing motion contract/budget. Object notifications invalidate server reads rather than broadcasting authoritative state values; duplicate suppression and coalescing bound refreshes. Standing idle sends no movement or object events. Lease renewals are active-interaction RPCs, not motion polling. Recovery reads authoritative state before enabling play.

## Tests

- Map: five connected rooms, six 96px doors, seventeen reachable interaction approaches, eight slots, twelve clear spawns, 2176 connected navigation cells.
- 41 unit tests and strict TypeScript/build passed.
- 13 local browser tests passed: full-house desktop/mobile keyboard/joystick exploration, nearest/future actions and three-second feedback, paired sofa seats, cancellation, activity reconnect, minimap, old pairing/auth/device-ownership/Away/cache regressions and idle traffic. Manually reviewed desktop/844×390 screenshots; corrected seated actor depth.
- Hosted: 28 interaction/RLS/idempotency/expiry assertions plus six private Broadcast/Presence authorization checks passed; no test fixtures persisted.
- Database CI passed 99 pgTAP assertions plus real concurrent invite and world actions. World race yields one seat winner/one BUSY; simultaneous toggles serialize without lost updates.
- Final CI `37054851388` passed for app source `2e0dc12`: web and database jobs succeeded, including the portable full-house route and both real transaction concurrency scripts. APK build `37054855277` succeeded for the same source.
- Production verified at https://couple-app-web-two.vercel.app/: existing authenticated account opened the five-room home, joined its private channel with Connected status, and opened the labeled five-room map. No browser warning/error logs during this check. Screenshot: `artifacts/phase2/live-full-house.png`.

APK: `artifacts/phase2/Paw-and-Us-phase2-2e0dc12.apk`, SHA-256 `5e59461b0b787157f17b7e60753e88f81084fd4687f48ffa5ec149923e43f18b`. Download archive digest and Android signature/package/SDK metadata verified. Package `com.pawandus.app`, min SDK 24, target 36. Native orientation/lifecycle/storage guards preserved.

## Known Issues

Automatic approval review initially required specific production publication approval. The user then explicitly approved publishing Phase 2 to main and Vercel; the fast-forward/push succeeded and the live connection was verified. Both web and phone need the matching Phase 2 client to share its map-version channel.

User tested the full-house web/phone clients and accepted progression after resolving reported issues. Latest retained APK is 0.2.3; earlier APK references above are historical build evidence and obsolete local APK files were deleted at the user's request. Debug signing certificates differ between CI builds, requiring uninstall/reinstall for updates; server account/home data remains in Supabase. Final modular character art/animations belong to Phase 3. Game content, cooking/cleaning systems, chat and new day/night simulation remain deferred. Current poses are framework placeholders.

## Next Phase

Phase 3 Character System: confirm outfit layering and creator layout before implementation; see PHASE_3_PLAN.md.
