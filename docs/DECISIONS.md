# DECISIONS

## 2026-10-03 — New login session position correction

User verified smooth phone movement at roughly 55–77+ FPS on 0.2.2. Preserve that rendering profile. A new login deliberately spawns in the hall, but RemoteMotion retained the previous session's rendered position and eased toward the new spawn, producing a false walk through the house. Reset rendered position, display frame and playback timeline on a validated new session's first packet; publish its received point immediately. Continue smoothing ordinary same-session corrections/reconnects. Existing membership/Presence session filtering rejects superseded packets; no persistent position feature, new event, RPC or database change.

## 2026-10-03 — Android-only performance follow-up

User reports 0.2.1 phone movement remains choppy. User confirmed Infinix Note 30, Helio G99, 8GB RAM, Android 14; Chrome is equally choppy, so this is not assumed to be a native wrapper issue. Actual device frame rate is unknown. Preserve desktop rendering, movement/network/database behavior and visual quality. When Capacitor.isNativePlatform() or primary pointer is coarse, bake static furniture/decorations to bounded RenderTextures at their original depths, retaining live doors/walls/toggles/outline; avoid React reconciliation on joystick pointer moves by updating its knob transform directly. Request high-performance WebGL context without disabling antialiasing or forcing a renderer. Add phone-only local Settings diagnostics for renderer, latest moving frame rate and slow frames; no uploads or realtime telemetry. Verify cached geometry/occlusion and cleanup in an isolated real-renderer browser test, preserve normal regression coverage and deliver a matching APK. Do not claim a phone FPS improvement without the user's measurement.

## 2026-10-03 — Phase 2 device feedback corrections

User reported phone frame stutter, excessive wall transparency, persistent activity outlines and long sitting diverging between devices; requested slightly faster walking. Preserve map, art direction and stack. Bake the static floor into one scene-owned texture, avoid rebuilding unchanged dynamic graphics/labels, and use elapsed frame time for camera following. Keep walls at least 85% opaque and fade only where an online avatar's head is actually occluded. Increase cottage speed by 10%, from 120 to 132px/s. Hide nearest-object outlines while the local player occupies an activity slot; toggle objects keep their ordinary prompts.

Lease renewal currently refreshes only the caller, leaving the partner's cached expiry stale. Broadcast the existing object_changed invalidation after successful renewal, serialize renewal with other interactions, and refresh authoritative state after failed renewal. At observed slot expiry, perform a bounded one-shot read to recover a missed notification; do not introduce standing-idle polling, new events, RPCs or database changes. Verify long occupancy, lost invalidation, cancellation and mobile/desktop rendering before publishing the matching web/APK fix.

## 2026-10-03 — Phase 2 balanced cottage and map authority

User authorized Phase 2 and selected spacing A: 64×44 at 32px, four-tile hall and three-tile doors. Author the source map through official Tiled scripting/export before game integration, retain editable TMX and exported JSON, and validate geometry/navigation/spawns/interaction slots. Use custom code-native furniture art in the approved palette instead of unrelated downloaded assets. Preserve existing motion smoothing and input; derive collision, rooms and prompts from the map rather than maintaining a second hard-coded layout.

Shared furniture occupancy/toggles use additive RLS-protected tables and caller-bound idempotent RPCs with atomic slot claims, bounded leases and cancellation/recovery. No client direct writes, economy or Phase 3 activities. Keep the existing map live until the compatible new client/schema rollout is verified; version channels by map so old test-room clients cannot share incompatible geometry. Expand snapshot/event contracts with the implementation. Future-system prompts explain availability without implementing cooking, games or character customization. Preserve transient feedback at three seconds.

## Phase 1 partner movement correction — 2026-10-03

User verified real web/Android connection, reconnect and Away, but reported smooth local movement with delayed/jumping partner movement. Keep Phase 1 open while fixing this; network quality has not been measured and is not assumed to be the sole cause. Preserve approved visuals, database authority, transport and moving-only one-second corrections.

Add a small 100ms receiver playback buffer using per-session monotonic motion time, and bound visible correction speed so delayed direction/stop updates ease rather than jump. Sender timestamps are peer claims only, not wall clocks or authorization. Advertise clock support in optional Presence metadata; include optional motion time only when all other receiving devices advertise support (including observers), so the existing strict-schema APK continues receiving compatible packets during replacement. Legacy packets retain bounded dead reckoning without the buffer. Reserve one of the ten rolling-second motion slots for stopping and coalesce moving changes to at most one every 100ms. Do not increase periodic traffic or add a server/library. Freeze Away at the rendered position rather than easing back to an old packet anchor. Verify variable latency, burst delivery, direction changes, rapid joystick input, collision, idle traffic and legacy compatibility before deployment and phone recheck.

## Phase 1 movement clock correction — 2026-10-03

Use Phaser's unsmoothed `game.loop.rawDelta` for the collision/movement step. Its default smoothed delta clamps unfocused/slow frames to a target frame duration, making local movement slower than the velocity sent to the partner on CI and slow devices. Keep bounded collision substeps and the existing 250ms cap; rendering/camera can retain smoothing. The multiplayer browser case gets a 60-second total timeout because it includes two browser contexts, touch, idle observation, reconnect and collision; assertions are unchanged.

## Phase 1 Android build configuration — 2026-10-02

User selected immediate signup without email verification for private testing on 2026-10-02. Hosted Supabase registration was enabled and Confirm email disabled through the existing authenticated dashboard. Anonymous sign-in remains disabled. The app still handles confirmation-required responses. Free custom SMTP/password-reset delivery is deferred until the app is shared beyond private testing; no paid email service or credential was added.

The debug APK build receives the same public Supabase URL/publishable key as the web build from existing repository variables. These values are public client configuration, never a service-role secret. This avoids re-entering project details on the phone. Native App/Preferences plugins share the web lifecycle/session code; APK version becomes 0.1.0 (code 2). Debug CI signing remains temporary; release signing is a later phase.

Log every architecture or scope decision here (date, decision, reason, alternatives). Propose changes here BEFORE implementing.

## Open decisions (from MASTER_SPEC Section 27)
- [x] 0  Existing repo stack: adopt prescribed stack in documentation-only repo
- [x] 0b Art direction (perspective, character, pet, house, UI, palette)
- [x] 0c Realtime backend: Supabase; Vercel WebSocket gate unproven
- [x] 0d Local storage: IndexedDB only when caching is needed; no SQLite
- [x] 1  Email auth: immediate signup without confirmation for private testing; free SMTP deferred before wider sharing
- [x] 2  APK delivery: bundled debug assets for Phase 0; signed release/update UX deferred
- [ ] 3  Realtime budget fallback
- [ ] 4  Shared wallet vs personal pockets
- [ ] 5  Day/night: local time vs shared house time
- [ ] 6  Chore reset time and streak rules
- [ ] 7  Dog "outside" mechanic
- [ ] 8  Push notifications for v1?
- [ ] 9  Backup strategy
- [ ] 10 Upgrade path if free limits are outgrown

## Decisions made

### 2026-10-02 — Phase 1 authorized; implementation plan

User explicitly requested Phase 1 after the Phase 0 report. Preserve the existing React/Vite/Phaser/Supabase/Capacitor stack, approved top-down chibi/Rose & Sky language, landscape controls and separate floating HUD buttons. The Phase 1 design gate verifies these approved choices; no redesign or new visual direction. Use code-drawn matching placeholders on one collision test map; the full house, modular characters, pets, chat, games and decoration remain in later phases.

Extend the existing migration chain additively: backfill profiles/houses and pending/active couple status without moving memberships; retain seat constraints and one membership per user. Add seven-day single-use invite codes, authoritative idempotent create/join/refresh/cancel-pending RPCs, explicit rate limiting for failed invite attempts, and versioned full/unchanged house snapshots. A deferred constraint verifies pending=one member, active=two, archived=zero at commit. All new tables use RLS and no client DML; functions bind auth.uid(), fully qualify objects and have explicit grants. Realtime Authorization expands only to own-couple Broadcast and Presence. Dashboard migration application remains the approved fallback; CLI migration history must be repaired before a future CLI push, never replay/reset the hosted foundation.

Evolve RealtimeTransport with typed Phase 1 player/sync events and Presence. Movement is ephemeral/peer-trusted, bounded by map collision/speed/sequence checks; no persistent position writes. Direction/animation changes plus one moving-only correction each second, max ten motion events/sec total; no motion while idle/backgrounded. Avatar identity is keyed by user_id, Presence carries device-session ownership, newest device takes over, and reconnect re-tracks/resnapshots/resyncs with a 30-second partner ghost. Future economic/shared actions remain Postgres-authoritative.

Use raw IndexedDB for a small versioned read-through snapshot cache, scoped by user+couple and wiped on logout/account change/schema bump. No gameplay offline queue in this phase: pairing requires a connection. Add only the official Capacitor App/Preferences plugins for required native lifecycle, preferences and Auth persistence; guard native calls. Preferences is app-private storage, not a claim of hardware-backed encryption; existing Android cloud backup stays disabled. Web Auth keeps SDK storage. Cached snapshots never authorize membership or writes.

Auth supports confirmed-email and immediate-session signup, existing sessions, logout and clear errors. Email confirmation/custom SMTP remains an open user decision; do not change hosted Auth security/email settings during local implementation. Built-in SMTP is restricted to organization member emails and two messages/hour (official docs rechecked); password reset/confirmation delivery cannot be claimed for arbitrary addresses without a configured provider. No paid SMTP/domain or secret in a client/repo.

### 2026-10-02 — Isolated live authorization verification

With physical web/APK messaging confirmed, finish the existing Phase 0 authorization requirement using an ignored local-only test page and the user-created unrelated account. Use the installed Supabase SDK, in-memory Auth (no saved password/session), positive controls on its own membership/channel, then negative cross-couple reads, private subscription and private HTTP broadcast. Human enters the existing password directly in this local page. Display only test outcomes/receipt IDs; never expose Auth tokens. Stop failed-channel retries and sign out/close the temporary test page after testing. No production UI, dependency, schema, policy, RPC or event changes; no authority bypass or administrative key.

### 2026-10-02 — Phase 0 phone scrolling and recovery feedback fixes

User's installed debug APK cannot swipe from the large test canvas to the account controls. Phaser's default touch capture prevents browser scrolling; this static diagnostic canvas has no gameplay input. Disable its touch capture/wheel prevention, allow vertical touch scrolling, and bound its responsive size to the short viewport while preserving its 16:9 aspect ratio. Keep landscape/native immersive mode and approved future game visuals unchanged. The local client also recovered automatically after a join error while retaining the old error message: make visible feedback follow transport state transitions. Add genuine touch-swipe and delayed-join recovery regressions, verify web/CI, then produce an updated debug APK for the user's phone. No new service, dependency, persistent schema, RPC or event.

### 2026-10-02 — Administrative Phase 0 test memberships

User confirmed the three requested test accounts are created. Use the two similarly named accounts as seats 1/2 of one empty test couple, and the third account as seat 1 of a separate empty couple for isolation checks. Inspect confirmation and existing memberships before inserting; never move or overwrite an existing membership. Keep account emails, UUIDs and credentials out of tracked examples/evidence. Administrative fixture provisioning uses the existing schema and policies; no client pairing flow, new credential, RPC or gameplay is added. Verify the actual persisted memberships under authenticated RLS with rollback-only role changes, then hand off password entry for live client sign-in.

### 2026-10-02 — Continue with hosted Phase 0 deployment

User asked to start the next step after connecting Supabase. Continue within Phase 0 by importing the existing public GitHub repository into the authenticated personal Vercel Hobby account, using the repository root and tracked `vercel.json`. Configure only the supplied public project URL/publishable key as VITE build variables. Verify the hosted canvas and health connection; do not begin Phase 1 or change approved visuals. Preserve free plan defaults and use a `vercel.app` subdomain. Dashboard-applied foundation SQL must be recorded as applied with the official CLI migration repair command before any future `db push`; do not replay or reset the hosted migration.

The health workflow may read the existing public key from a repository variable when its optional secret is absent. This key is already distributed in the web bundle and carries only anon/authenticated client permissions; no new credential or administrator access is created. Preserve secret-first compatibility, configure the two public variables through existing repository access, and verify a manual run. This avoids adding an encryption library solely to store public configuration.

### 2026-10-02 — Hosted Supabase setup resumed

User explicitly authorized configuring the existing `ncopulzhlthauttyrvgo` project and completed dashboard sign-in. This supersedes the prior Supabase access deferral; Vercel and real Android-device verification remain separate outstanding work. Apply only the tracked Phase 0 foundation after inspecting the schema, never reset or overwrite unrelated tables/data. Verify hosted RLS/RPC using rollback-only fixtures and restrict Realtime to private channels. Use the authenticated dashboard for administrative SQL/settings; the supplied publishable key remains client-only public configuration. No secret-key extraction, new credentials, paid services or Phase 1 features.

### 2026-10-02 — Approved references; Phase 0 infrastructure plan

User's "looks good proceed" approves the remaining home/UI references and continuation within Phase 0, including step 16. This supersedes earlier scope deferrals. No gameplay, pairing flow, production HUD, movement, pet systems or Phase 1 features.

- Adopt the specified pnpm / strict TypeScript / React + Vite / lazy Phaser 3 stack in this documentation-only repository. There is no existing application architecture to replace. Add libraries only when used: Zod and Supabase for the ping; defer router, Zustand and caches until needed.
- Retain Supabase for private Realtime and Postgres authority; Vercel WebSocket gate is unproven. Keep SDK use behind the shared RealtimeTransport interface. IndexedDB remains the future read-through cache choice; no SQLite and no offline queue in the spike.
- Minimal membership foundation: `couples`, `couple_members` with two constrained seats, one couple per user, RLS, no client writes, and a narrowly scoped `is_couple_member` helper. Provision test accounts/membership through administrative setup only; Phase 1 owns pairing RPCs. A public read-only `health` RPC exposes no couple data. Private Broadcast policies verify channel topic against membership; use existing RLS on Supabase-owned `realtime.messages`, do not alter its ownership or RLS setting.
- Add only `spike_ping`, validated by Zod and manually sent with a 1/s client cap, bounded duplicate suppression and visible connection state. No game events or idle broadcasts. Payload identity remains peer-trusted within the authenticated couple; no authority or reward depends on it.
- Test canvas and connection form are explicitly temporary Phase 0 diagnostics, not a replacement home/dashboard design. Responsive touch/keyboard access; no new major visual identity.
- Capacitor 8 Android debug shell uses bundled web assets, matching web build and no remote `server.url`. Native landscape follows the user's correction. Remote shell and signed-release/update UX can be reconsidered in their phase. Local SDK 36 and Java 21 are present.
- Add Vitest, Playwright desktop/mobile/two-context checks and pgTAP isolation/write-denial tests. CI uses free standard Linux runners; no larger runners or paid services. Keepalive is best effort, not a guarantee against pause. Cloud deployment, migration execution and actual web-to-APK ping must be verified before marking Phase 0 done.

Files: root workspace/tooling; `apps/web` and generated Android; `packages/shared`; `supabase/migrations`, tests and config; `.github/workflows`; deployment config; protocol, setup and evidence docs. Account access is currently unavailable; prepare and test local artifacts while asking for the existing free project/account information. Never expose private keys.

Build verification: user deferred hosted access and supplied public configuration only. Retain Capacitor's AGP 8.13.0; local Google Maven TLS download failure does not justify changing tooling or weakening HTTPS. Use the standard free GitHub Ubuntu 24.04 runner's already-installed SDK 36 as the APK fallback. Its SDK manager is not on PATH, so validate the installed platform/build-tools directly. Native shell hides system bars with a swipe to restore them; landscape and disabled cloud backup protect the intended layout and local auth data. Still no gameplay or new visual system.

### 2026-10-02 — Landscape HUD accepted; continue Phase 0 mockups

User accepted the revised HUD ("okay that is more like it"). Record horizontal gameplay, independent left-side icons, hidden/shown Chat and physical arcade Play as the accepted reference. Carry this and the selected art direction into remaining house/UI mockups under the existing Phase 0 continuation. Do not infer infrastructure or gameplay authorization; no Phase 1 work.

### 2026-10-02 — User-directed landscape HUD revision

User explicitly corrected the first reference: horizontal mobile gameplay, no top toolbar or enclosing HUD panel; Games accessed by approaching the physical arcade and pressing Play; Chat as a standalone left-side icon that shows/hides chat. Revise the visual reference and DESIGN.md accordingly. The user's correction supersedes the earlier portrait/top-HUD proposals without needing another direction-selection gate. Other approved art choices remain unchanged. This is Phase 0 design work only, not application or backend implementation.

### 2026-10-02 — User-approved art direction

User selected 1A, 2A, 3A, 4A, 5A, 6B, 7B, 8C, 9B, 10A, 11C, 12B, 13A, 14B, 15A, 16A, 17A, 18A. Record the complete approved direction in DESIGN.md. Alternatives remain archived; original agent recommendation is superseded. No architecture change, new feature or infrastructure approval inferred from these visual choices. Phase 0 remains incomplete pending detailed mockups and deferred validation.

### 2026-10-02 — Phase 0 continuation: first detailed art set

User authorized continuation. Create character/pet/sample-room/HUD reference first; retain approved art choices. Remaining rooms wait for concrete first-set review per MASTER_SPEC Section 0. This continuation adds reference art and documentation only; no backend, application or gameplay change. Infrastructure spike remains deferred under the original scope. No Phase 0 completion tag.

## 2026-10-02 — Phase 0 recommendations (pending approval)

- Repo: seven documentation files and Git metadata only. No frontend, backend, database, auth, dependencies, engine, assets, env files, scripts or deployment config to preserve or migrate.
- Recommend prescribed TypeScript / React + Vite / Phaser 3 / Supabase / Vercel Hobby / Capacitor stack. Nothing installed. Isolate RealtimeTransport; use private couple channels, RLS + RPC and a read-through IndexedDB cache with idempotent action replay. SQLite is not justified by evidence yet.
- Trust trade-off: avatar positions and host-simulated pet motion are peer-trusted and sanity-clamped. Persistent state, rewards and contested actions remain database-authoritative. No central game-loop server. Proposal only; no new contracts implemented.
- Backend gate: official Vercel docs now describe Hobby WebSockets beta, but the complete no-card usage/recovery/add-on gate is unproven. Retain default Supabase; see FREE_TIER_NOTES.md. No Redis or transport switch.
- Scope: user requested inspection, quota research and proposals, then a stop. Defer infrastructure spike and gameplay. Phase 0 remains incomplete; no done tag.
- Art: choices were pending when proposals were presented; they are now recorded in the approval entry above. Detailed mockups remain pending.
