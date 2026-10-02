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
- Branch CI found a slow-frame mismatch/test timeout in the long movement case. Fixed local integration to use rawDelta. A later run passed ten browser cases but exposed a collision test that could walk past the table while polling a remote avatar; it now aligns and verifies the local position before checking the table edge. The corrected case passes locally; final CI is pending. Do not treat earlier failed web runs as complete verification.
- Debug APK builds passed for pre-final client commits. Final APK, deployed web verification and actual web/phone walking/recovery remain pending. Phase 0 phone pings do not satisfy Phase 1 walking DoD.

## Known issues / pending evidence

User chose immediate signup without email verification for private testing; applied in hosted Auth. Anonymous sign-in remains off. Free SMTP/password-reset delivery is deferred before wider sharing. Android Preferences is app-private storage with backup disabled, not hardware-backed encryption. CI debug signing certificates change between builds, so replacement may require uninstall/reinstall.

Hosted SQL was applied through the dashboard: CLI migration history must be reconciled before any future `db push`; do not replay migrations, reset or replace the hosted schema. Follow PHASE_1_SETUP.md.

Final CI, final deployed web/APK smoke checks and user-observed two-device walking, reconnect and native background/foreground recovery are still required. No phase-done tag has been created.

## Next phase

Phase 2: Shared House World, **only after Phase 1 verification/report and explicit user approval**.
