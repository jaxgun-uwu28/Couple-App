# Phase 1 — complete

Authorized 2026-10-02; completed 2026-10-03 (Asia/Manila). Phase 2 has not started. The test room uses placeholders matching the approved top-down chibi / Rose & Sky / landscape design.

User tested the APK and web together: both connected and walked, reconnect worked, and Away worked. After the `85dea56` movement fix, user confirmed jumping and delay were reduced on both web and phone. Signal/Wi-Fi quality remains unmeasured. The subsequent interaction hint timeout is fixed and verified in the live browser; final web/APK code is `c7d3405`. Earlier foundation checks below describe `3928fc2`.

## Implemented

Email/password registration and sign-in/out, SDK session persistence, invite code/link pairing, create/refresh/cancel pending invites, private per-couple movement room, keyboard/joystick input, collision, local camera/partner cue, Settings, Presence, device takeover, reconnect/snapshot reconciliation and disposable scoped cache. Interact is a placeholder. Full house, character creator, pets, chat and games remain future phases.

## Files changed

`apps/web/src/App.tsx`, `game/World.tsx`, `game/HouseRuntime.ts`, typed House transport/API, lifecycle/storage adapters and tests; preserved `diagnostics/Phase0Probe.tsx`; shared schemas/movement rules/tests; additive migration and pgTAP tests; CI/concurrency/hosted-test scripts; official Capacitor App/Preferences dependencies and Android plugin/version configuration; phase/protocol/decision documentation. No service-role key or account identifiers are tracked.

## Database changes

Installed `20261002000200_phase1_accounts_and_house.sql` through the existing authenticated Supabase dashboard after clean-DB CI verification. Adds profiles, houses, idempotency ledger and invite attempt counters; extends couples/membership with status, role, invite and snapshot data. Every app table has RLS; clients have no persistent table write grants. Deferred constraints require pending=one, active=two, archived=zero members.

Pre/post hosted counts remain **two couples and three members**; post-migration **three profiles/two houses**, one active couple and one pending couple, zero app tables without RLS. Original memberships preserved. Hosted tests use rollback-only synthetic fixtures; no real password or account deletion.

## API/RPC changes

`create_couple`, `join_couple`, `refresh_invite`, `cancel_pending_couple`, `get_house_snapshot`. Authenticated caller binding, one couple/user, seven-day single-use invites, 12 distinct attempts/10 minutes, idempotency and unchanged/full/none snapshot responses. See PROTOCOL.md. Existing users receive backfilled houses; a pending creator without an old invite can use New invite.

## Realtime changes

Private Broadcast/Presence authorization only for own couple. Typed player/sync events, newest verified device session, away status, 30-second partner ghost, bounded collision-aware extrapolation and interpolation. Changed motion plus one correction/second while moving; hard cap ten motion messages/second and no idle/background motion. Movement integrates unsmoothed frame time to match transmitted velocity on slow/unfocused devices. Cleanup is serialized to prevent duplicate SDK channels/listeners. No Postgres Changes, persistent positions or offline multiplayer.

## Tests

- Local: TypeScript passes; **30 unit tests** pass; **11 Chromium browser tests** pass, including retained six Phase 0 regressions. Account confirmation response, invalid invite, create/cancel/reload, invite links, pending-home partner join, desktop/mobile movement, collision, two-way synchronization at **150ms simulated Broadcast latency**, idle counts, reconnect/both reconnect, device takeover, logout cache wipe and cached read-only loading. Visibility recovery is a simulated Page Visibility event; it is not Android lifecycle proof.
- Database CI: **65 pgTAP assertions** pass (17 foundation, 42 pairing, six private Presence/Broadcast checks); separate concurrent real transactions produce one invite winner, one INVALID_INVITE and exactly two members.
- Hosted: **42 pairing + six Realtime authorization assertions** pass. Positive own-Presence/Broadcast controls succeed; cross-couple reads and publishes are denied.
- Final [CI run 37042041741](https://github.com/jaxgun-uwu28/Couple-App/actions/runs/37042041741) passed web and database jobs for commit `3928fc2`: typecheck/build, 30 unit tests, all 11 browser tests, 65 pgTAP assertions and concurrent invite join. Earlier runs exposed a slow-frame mismatch and a collision test that could walk past the table while polling a remote avatar; integration uses rawDelta and the test verifies local alignment before checking the table edge.
- Commit `3928fc2` fast-forwarded to main. Vercel production deployment `NtXH6fibxGUvrdupjjE4BVNDj7ok` is Ready. Existing signed-in live and local accounts open the backfilled room, both show Connected, and each sees the partner's initial position. Local hosted reconnection passes. No account password or membership change was needed.
- Final [APK build 37042314663](https://github.com/jaxgun-uwu28/Couple-App/actions/runs/37042314663) passed for the same commit. Verified GitHub archive digest, APK v2 signature, package/version, SDK 24 minimum/36 target, sensorLandscape, backup off, App/Preferences plugins, bundled hosted URL/public key and rawDelta code. No `sb_secret_` key found. Local APK: ignored `artifacts/phase1/Paw-and-Us-phase1-3928fc2.apk`, SHA256 `c870dbe4eb3a620a7aa409526dfd3e40db924af5f0a3ae016fc08bf0f66ddcd8`. The automatic duplicate APK build of the identical main commit was cancelled after this artifact succeeded.
- User confirmed actual Phase 1 web/phone walking, connection, reconnect and Away. Reported partner movement jitter remains open until the new fix is checked on those devices. No claim is made that network quality was measured or that a timed native idle-minute observation was performed.

## Movement fix — deployed; user recheck confirmed

- `85dea56`: optional monotonic motion time negotiated through Presence for compatibility with the previous strict-schema APK (including old observer devices). Receiver keeps 32 keyframes/three seconds, uses a 100ms playback delay, bounds visible correction speed, and freezes Away at the drawn position. Sender coalesces moving changes at 100ms and reserves the tenth rolling-second slot for stopping. One correction/second only while moving; idle motion remains zero. No new library, periodic traffic, database change or RPC.
- [CI 37045121656](https://github.com/jaxgun-uwu28/Couple-App/actions/runs/37045121656) passes typecheck/build, **37 unit tests**, **12 browser tests**, **65 pgTAP assertions** and concurrent join. New cases cover late legacy stops, variable-delay turns/stops, burst delivery/clock regression, Away freeze, slow/stalled render frames, rapid stick release, and legacy Presence negotiation. Fixture latency and unit schedules are simulated; they do not measure the user's network.
- Vercel production `4twSqryXNHjmnsXCEeQ8cvAhbC1B` is Ready for this commit. Live browser reconnects with the same built module `/assets/index-D7NtQHK3.js`. Local verification room exited to leave control available to the phone.
- [APK 37045626589](https://github.com/jaxgun-uwu28/Couple-App/actions/runs/37045626589) succeeds for the same commit; archive digest and APK v2 signature pass. Bundled URL/public key and new motion clock fields verified; no `sb_secret_` key found. Ignored local file `artifacts/phase1/Paw-and-Us-phase1-movement-fix-85dea56.apk`; SHA256 `7cabbbf6082e16f4e26086fdbf8048380bc8f0f44dade1ecefb7704355f9c961`.
- User received the new APK and confirmed reduced jumping/delay on web and phone. Some partner delay remains inherent; severe stalls/loss cannot be reconstructed and buffering adds 100ms intentionally.

## Final minor fix and verification

`c7d3405` makes the Interact/E placeholder message disappear after three seconds. Repeated use resets the timer; unmount clears it, and the timer does not erase a replacement error. No database/RPC/event change. Build/typecheck pass. Live `/assets/index-f7HAL1Qu.js` verified: click shows the message, timeout removes it while connection remains active.

[Final CI 37047254312](https://github.com/jaxgun-uwu28/Couple-App/actions/runs/37047254312) passes all web/database checks (37 unit, 12 browser, 65 database assertions plus concurrent join). [Final APK 37047254377](https://github.com/jaxgun-uwu28/Couple-App/actions/runs/37047254377) passes; archive digest and APK signature verified. Ignored local file `artifacts/phase1/Paw-and-Us-phase1-c7d3405.apk`, SHA256 `d5944a20cad519315f2e33d972889d0acb41fe4f36c87ef75200232aa3ddb0f8`. The three-second fix shares web/APK code; no separate physical phone timer test is claimed.

## Known issues / pending evidence

User chose immediate signup without email verification for private testing; applied in hosted Auth. Anonymous sign-in remains off. Free SMTP/password-reset delivery is deferred before wider sharing. Android Preferences is app-private storage with backup disabled, not hardware-backed encryption. CI debug signing certificates change between builds, so replacement may require uninstall/reinstall.

Hosted SQL was applied through the dashboard: CLI migration history must be reconciled before any future `db push`; do not replay migrations, reset or replace the hosted schema. Follow PHASE_1_SETUP.md.

CI, live web and APK artifact checks pass; user confirmed real two-device movement/reconnect/Away and the movement improvement. Phase 1 is complete, with the limitations above recorded. Tag `phase-1-done` identifies the completed report and unchanged verified client code.

## Next phase

Phase 2: Shared House World, **only after Phase 1 verification/report and explicit user approval**.
