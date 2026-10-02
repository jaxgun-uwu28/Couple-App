# Phase 1 — Accounts, Couple & Multiplayer Foundation

Authorized 2026-10-02. Read MASTER_SPEC Phase 1, Sections 3.2–3.7, 4–5, approved DESIGN and current PROTOCOL. Phase 0 is tagged and preserved. Scope is Phase 1 only.

## Design gate

Keep approved top-down perspective, soft chibi proportions, Rose & Sky, rounded readable controls, landscape gameplay, local follow camera and off-screen partner cue. Matching vector/code placeholders are allowed for this phase. Desktop WASD/arrows; mobile joystick bottom-left and Interact placeholder bottom-right. Independent Settings/connection indicators; no top/side toolbar, global Games button or dashboard. Login/pairing forms scroll independently of the fullscreen play canvas. Portrait web entry offers rotate guidance without relying on orientation lock. Reduced motion and 44px controls.

## Work plan

1. Additive identity/pairing/house migration, idempotency and invite-attempt limits; preserve all existing test memberships. Document RPC/event contracts in the same change and test RLS, invalid/expired/reused invites, duplicates and simultaneous joins. Deferred membership constraints enforce one pending/two active partners.
2. Auth persistence and lifecycle adapters, scoped IndexedDB snapshot cache, full/unchanged RPC reconciliation. Wipe private cache on logout/account switch; cached world is read-only offline. No offline multiplayer or queued pairing.
3. Auth/pairing screens: register, sign in/out, create couple, invite code/link, join, refresh expired invite, cancel a pending invite. Supabase Auth owns passwords; RPCs own memberships. No character/pet onboarding, full unlink/deletion/export or future gameplay in this phase.
4. Typed private Presence/player/sync transport, single-device takeover, bounded dead reckoning/interpolation, no idle/background motion, reconnect resnapshot and no duplicate avatars/listeners.
5. Phaser collision test room with two chibi placeholders, keyboard/touch movement, camera and partner cue, connection/offline states and Interact placeholder. Full house belongs to Phase 2.
6. Local type/unit/browser checks, pgTAP in free CI, 150ms latency movement checks, hosted additive migration and web deployment, debug APK build, real web/phone walking and recovery. Report exact evidence/limitations, update checklist, commit/tag only when DoD is met, then wait for approval.

## Files

`apps/web/src` Auth/pairing/world/infra/cache, native plugin configuration, `packages/shared/src` schemas/pure movement rules, new `supabase/migrations` and `supabase/tests`, browser tests, lockfile and phase docs. Preserve approved references, account identifiers and cloud data. No new server, paid tier, game features or unrelated replacement architecture.

## Account choice — resolved

User chose immediate signup without email verification for private testing; hosted signup was enabled and confirmation disabled. Anonymous sign-in stays disabled. The app still handles confirmation-required responses. Free custom SMTP/password-reset email is deferred before wider sharing; passwords and secret keys stay out of chat/repo. Official [Supabase SMTP restrictions](https://supabase.com/docs/guides/auth/auth-smtp) were rechecked on 2026-10-02. Implementation/verification progress is in PHASE_1_STATUS.md.
