# Phase 2 — Shared House World

Status 2026-10-03: **published to main and Vercel; automated checks passed; real web/Android exploration pending**. User approved Phase 2, spacing A and explicitly approved production publication. Main was fast-forwarded to the verified Phase 2 branch. Do not tag complete or begin Phase 3 until the two-device check and user approval.

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

Real web-to-phone full-house exploration is **not yet verified**. Android debug signing certificates differ from the previous build, so Android may require uninstalling the old debug app before installing this APK; sign in again afterwards. Server account/home data remains in Supabase. Final modular character art/animations, game selection/content, cooking/cleaning systems, chat and new day/night simulation remain deferred to their own approved work. Current poses are framework placeholders.

## Next Phase

Finish current-phase real-device verification and obtain approval. Phase 3 Character System stays unstarted.
