# Phase 1 — verification in progress

Authorized 2026-10-02; updated 2026-10-03 (Asia/Manila). Phase 1 is **not complete**. Phase 2 has not started. The test room uses placeholders matching the approved top-down chibi / Rose & Sky / landscape design.

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
- Actual web/phone walking and native recovery remain pending. User was given the replacement APK and asked to sign in, walk both devices, verify stopped positions/collision and reconnect. Phase 0 phone pings do not satisfy Phase 1 walking DoD.

## Known issues / pending evidence

User chose immediate signup without email verification for private testing; applied in hosted Auth. Anonymous sign-in remains off. Free SMTP/password-reset delivery is deferred before wider sharing. Android Preferences is app-private storage with backup disabled, not hardware-backed encryption. CI debug signing certificates change between builds, so replacement may require uninstall/reinstall.

Hosted SQL was applied through the dashboard: CLI migration history must be reconciled before any future `db push`; do not replay migrations, reset or replace the hosted schema. Follow PHASE_1_SETUP.md.

Final CI and deployed web/APK artifact smoke checks pass. User-observed two-device walking, reconnect and native background/foreground recovery are still required. No phase-done tag has been created.

## Next phase

Phase 2: Shared House World, **only after Phase 1 verification/report and explicit user approval**.
