# Paw & Us — Master Specification (v1.4)

> v1.1 merged the Design-Approval-Gate workflow, Master Development Instruction, and the 17-phase order (Phase 0–16).
> v1.4 adds a **local-first cache + safe offline queue** (Section 3.7) on top of Supabase (still the single source of truth).
> v1.3 adds a web-first development workflow (2.9) and a **free-tier gate** for choosing the realtime backend (2.8): Supabase is the default; Vercel WebSockets is only a candidate until proven free.
> **v1.2 retargets the project to: ONE codebase → Web (Vercel) + Android APK (Capacitor), backend = Supabase, everything on FREE tiers ($0).** Sections 2 and 3 were rewritten; other sections were patched. Where older text says "server", read the **Backend Translation Note** at the top of Section 3.

> A tiny 2D multiplayer life-simulation game for two people in a long-distance relationship.
> Two players share one house, one pet, chores, a kitchen, an arcade, and memories.

---

## 0. How to Use This Document With Codex

1. This file is the **single source of truth**. Never ask Codex to build everything at once.
2. Implement **one phase at a time** (Section 24). Each Codex prompt must include:
   - The phase section from this doc + any referenced sections (data model, protocol, state machines).
   - **Allowed files/folders to modify** and **forbidden files/folders**.
   - The phase **Definition of Done** and the tests that must pass.
3. After each phase: run tests, commit, tag (`phase-N-done`), and update `CHANGELOG.md` and the **Feature Checklist** (Section 26).
4. If Codex wants to change architecture (stack, protocol, data model), it must **propose the change in `docs/DECISIONS.md` first**, not silently do it.
5. Every phase prompt must end with: *"Do not implement anything outside this phase's scope. List any assumptions you made."*

### Standard Codex Prompt Template (copy per phase)

```
ROLE: Senior full-stack game developer.
CONTEXT: Project "Paw & Us". Read /docs/MASTER_SPEC.md sections: [list].
TASK: Implement PHASE [N] — [name].
SCOPE (in): [bullet list from the phase]
SCOPE (out): everything else. Do not add features not listed.
DATABASE CHANGES: [migrations required]
PROTOCOL CHANGES: [new/changed Realtime Broadcast events + RPC functions, with payload schemas]
CLIENT STATE: [stores/slices touched]
RULES: Postgres (RLS + RPC) authoritative for [list]; validate all payloads with zod; no paid services.
UI/RESPONSIVE: must work on mobile touch (no hover) and desktop.
EDGE CASES: [list]
TESTS REQUIRED: [unit + integration + manual multiplayer script]
MAY MODIFY: [paths]
MUST NOT TOUCH: [paths]
DEFINITION OF DONE: [checklist]
```

### Mandatory Workflow Per Phase (non-negotiable)

**Plan → Design proposals → You choose → Implementation → Testing → Bug fixing → Verification → Phase report → WAIT for approval → Next phase**

1. **Analysis** — inspect existing code/spec sections relevant to the phase.
2. **Technical planning** — short written plan (files, schema, events, risks).
3. **2D design proposals** — only if the phase introduces a major visual system (see Design Gates in Section 24).
4. **User approval** — agent STOPS and waits.
5. **Implementation** — only the approved scope.
6. **Testing** — Section 23 checklist.
7. **Bug fixing**.
8. **Final verification** against Definition of Done.
9. **Phase completion report** (format below).
Never silently make a major design decision affecting the game's visual identity. Never auto-start the next phase.

### Design Approval Gate (applies to every visual system)
Before implementing any major visual system, the agent must STOP and present **~3 design directions** (A/B/C) and wait. Each option must state: visual appearance, advantages, disadvantages, implementation complexity, animation possibilities, mobile suitability, multiplayer readability, consistency with the rest of the game.

Gate subjects (each needs an approved choice, recorded in `docs/DESIGN.md`):
- Game perspective (top-down / slight-angle 2D / room-based side view)
- Character style (cute chibi / soft cartoon / cozy pixel-inspired)
- Pet style (round cute / expressive cartoon / soft illustrated) — cat AND dog
- House + furniture style
- UI style (playful rounded / cozy illustrated / minimal cute)
- Color palette (3 candidates)
- Animation language, sound direction
Once approved, later phases **must follow** the approved design; redesigning an approved system requires asking first.

**Mockups required before serious coding (Phase 0):** character, cat, dog, house perspective, living room, kitchen, bedroom, bathroom, game-room style, UI/HUD, chat, emote wheel, interaction prompt, mobile joystick, game selection screen, pet status, inventory/shop, memory page.
**Order of art approval:** (1) character + pet + one sample room + HUD first; (2) the rest of the house and UI follow that language. Do not let the agent generate the whole house before this is approved. Separate **art direction (design first)** from **implementation (build approved assets)**.

### Master Development Instruction (give to the coding agent ONCE, at the start; re-attach for new sessions)
> You are the lead software engineer, game developer, UI/UX designer, technical architect, and QA engineer for **Paw & Us**, a real-time 2D multiplayer couples game for two people in a long-distance relationship. The house is the primary game world — this is a real interactive multiplayer game, NOT a dashboard that contains games. Read `/docs/MASTER_SPEC.md` as the source of truth.
> Rules: (1) build phase-by-phase, never everything at once; (2) follow the per-phase workflow and Design Approval Gate; (3) Postgres (RLS policies + RPC functions) is authoritative for game results, currency, pet stats, inventory, ownership, shared interaction state, match results, progression — clients NEVER write those tables directly; (4) validate authentication, couple membership, room membership, game membership, ownership, inventory, currency, pet actions, and game results — no user may access another couple's data by changing an ID; (5) desktop (WASD/arrows/interact key) and mobile (virtual joystick + interact button) must both work; never depend on hover; (6) do not overbuild: no unrelated features, no unnecessary libraries, no replacing working architecture or approved designs without asking; (7) each phase ends with the report format and then you WAIT; (8) the whole product must run on FREE tiers only — Supabase (backend), Vercel Hobby (web), GitHub Actions (CI), Capacitor (Android APK) — from ONE codebase; no paid services, no self-hosted game server, no Play Store/App Store dependency.
> Inspect the existing repository before changing anything; do not replace the existing stack without approval.

### Phase Completion Report (required at the end of every phase)
**Implemented · Files Changed · Database Changes · API/RPC Changes · Realtime Changes · Tests · Known Issues · Next Phase** — then WAIT for approval.

### Definition of Done (global — applies to every phase)
Feature works · UI works · multiplayer sync works where applicable · mobile works · desktop works · errors handled · security checked · animations/transitions work · tests pass · no obvious regressions · approved design followed.

---

## 1. Vision, Principles, Non-Goals

### 1.1 Vision
When both partners are online, they **see each other walking around the same house**, doing things together. When one is offline, the house, pet, and messages **remain alive and meaningful** for the other.

### 1.2 Design Principles
1. **Cozy, never punishing.** No fail states, no death, no guilt mechanics. Neglected pets get sad/sleepy, never die or run away.
2. **Together > solo.** Prefer interactions that reward two players.
3. **Async-friendly.** The couple lives in different time zones; the game must be meaningful when only one is online.
4. **Functional furniture.** Every placeable object has an interaction or a clear decorative purpose.
5. **Touch-first.** Nothing requires hover, right-click, or keyboard-only.
6. **Database-authoritative** (Postgres RLS + RPC) for anything persistent or economic; peer-trusted only for ephemeral motion (positions, emotes).
7. **Small and shippable.** MVP first (Section 25), expand by phases.

### 1.3 Non-Goals (v1)
- No more than 2 human players per house. No public lobbies, no strangers, no friends list.
- No external video/streaming integration.
- No real-money purchases.
- No voice/video chat (maybe later; leave hooks only).
- No self-hosted game server, no paid infrastructure, no Google Play / App Store release in v1 (APK is side-loaded; iPhone users use the web/PWA).

### 1.4 Visual Requirements & Tone
Cute · warm · colorful · romantic without being overly childish · playful · cozy · visually memorable · mobile-friendly · easy to understand. The interface feels like **one coherent world**.
- **Color system controlled:** ~3 primary colors + supporting neutrals + occasional functional accents. Palette tokens: primary, secondary, accent, background, surface, text, success, warning, error.
- **Avoid (looks generic/AI-made):** excessive glassmorphism, excessive gradients, huge floating cards everywhere, generic dashboard layouts, excessive rounded pills, generic AI illustrations, random neon colors, overly complicated UI, animations that distract from gameplay.
- UI must never cover too much of the game world; chat/menus are panels over a still-visible house where practical.
- The house is ONE physical home (continuous map), not separate full-screen pages per room.

---

## 2. Tech Stack, Free-Tier Plan & Repository Structure

### 2.1 Stack (all $0)
| Layer | Choice | Cost |
|---|---|---|
| Language | TypeScript (strict) everywhere | free |
| App UI | React + Vite, Zustand, React Router | free |
| Game world | Phaser 3 (lazy-loaded inside React) | free |
| Backend | **Supabase**: Auth, Postgres + RLS + RPC (plpgsql), Realtime (Broadcast + Presence + Postgres Changes), Storage, Edge Functions (Deno), pg_cron | Free plan |
| Web hosting | **Vercel Hobby** (static Vite SPA, auto-deploy from GitHub) — personal/non-commercial use | free |
| Android app | **Capacitor** wrapping the same web build → **APK** (side-loaded; built locally with Android Studio or by GitHub Actions) | free |
| iPhone | Web/PWA ("Add to Home Screen"). A native iOS build requires a paid Apple account — **out of scope** | free |
| CI/CD | GitHub Actions (build, test, APK artifact → GitHub Releases) | free |
| Validation | zod schemas in `/packages/shared` for Broadcast payloads and RPC args | free |
| Tests | Vitest, Playwright (2 browser contexts), **pgTAP via `supabase test db`** (RLS/RPC tests) | free |
| Map authoring | Tiled (JSON export) | free |
| Art/audio | self-made or CC0/permissive packs (e.g., itch.io, Kenney, OpenGameArt); record licenses in `ASSETS.md` | free |
| Push (optional, later) | Web Push (VAPID) + Firebase Cloud Messaging for the APK | free |

**Not free / explicitly excluded:** Google Play Console ($25 one-time), Apple Developer ($99/yr), custom domain (use `*.vercel.app`), paid SMTP (see 5.1), any always-on game server.

### 2.2 Why not Socket.IO / a Node game server
Vercel serverless cannot hold persistent WebSockets and Supabase Edge Functions cannot run a tick loop. Free always-on hosts sleep or are unreliable. Therefore the architecture uses **Supabase Realtime** for transport and a **tiered trust model** (Section 3.2) instead of a central simulator.

### 2.3 Free-Tier Limits to Design Around (verify current numbers on supabase.com/pricing and vercel.com/pricing before launch — they change)
- **Supabase Free:** ~500 MB database, ~1 GB file storage, limited egress, limited Realtime messages/month and concurrent connections, limited Edge Function invocations, limited built-in auth emails per hour, and **projects pause after ~1 week of inactivity**.
- **Vercel Hobby:** generous static hosting/bandwidth for a two-person app; non-commercial terms.
- **Consequences built into the design:** (a) a **realtime message budget** (3.3), (b) client-side image compression before upload, (c) chat/log pruning, (d) a **keep-alive** cron (3.6), (e) no per-frame network traffic, (f) budget monitor screen in a dev/debug menu.

### 2.4 Repository Layout (single codebase)
```
/apps
  /web                 React + Vite + Phaser (this is BOTH the website and the APK content)
    /android           Capacitor Android project (generated by `npx cap add android`)
    capacitor.config.ts
/packages
  /shared              zod schemas, event names, constants, game rules (pure TS, used by web + tests)
  /game-data           JSON: items, recipes, chores, questions, pet defs, shop
/supabase
  /migrations          SQL (schema, RLS policies, RPC functions, cron jobs)
  /functions           Edge Functions (push, daily jobs, image checks)
  /tests               pgTAP tests (RLS + RPC)
  seed.sql             starter items/questions
/docs                  MASTER_SPEC.md DECISIONS.md PROTOCOL.md DESIGN.md CHANGELOG.md
/assets                sprites, tilemaps, audio (+ ASSETS.md licenses)
/.github/workflows     ci.yml (test+build), release-apk.yml (signed APK on tag), keepalive.yml
```
There is **no `/apps/server`**.

### 2.5 Environment & Secrets
- Web/APK bundle may contain only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (public by design; security comes from RLS).
- **Never** ship or commit the `service_role` key. Edge Function secrets live in Supabase secrets; CI secrets (keystore, passwords) live in GitHub Actions secrets.
- `.env.example` committed; `.env` git-ignored.

### 2.6 Build & Distribution
**Web:** push to `main` → Vercel builds `apps/web` and deploys. Preview deployments for branches. SPA fallback rewrite to `index.html`. PWA manifest + service worker (installable on iPhone/desktop).
**Android APK:**
1. `pnpm --filter web build` → `npx cap sync android` → `cd apps/web/android && ./gradlew assembleRelease`.
2. **Sign with your own keystore** (`keytool`, free). Back up the keystore + passwords — losing them means you cannot ship updates over an installed app.
3. Distribute the APK via **GitHub Releases** (or a Drive link); partner enables "Install unknown apps" once.
4. **Update check:** app fetches `/version.json` from the Vercel site; if a newer APK exists show "New version available — Download".
5. **Decision (log in DECISIONS.md):** *Bundled assets* (versioned, loads fast, needs new APK per change) vs *Remote URL mode* (`server.url` → the Vercel site; APK is a thin always-up-to-date shell, requires internet which a multiplayer game needs anyway). Recommended start: remote URL mode during development, bundled for stable releases.
**Android-specific requirements:** fullscreen/immersive, safe-area insets, hardware Back button handled (closes panels first, never exits mid-activity without confirm), keep-screen-on while in the house (`keep-awake` plugin), haptics plugin, App-state listener (background → presence `away`, pause sending; foreground → resync), landscape + portrait, texture atlases ≤ 2048 px for older GPUs, test on a low-end phone.

### 2.7 Coding Rules for Codex
- Local cache is **read-through only** for Tier-1/2 data: never write cached values back to Supabase; sync **actions with idempotency keys** (Section 3.7).
- Transport is behind a `RealtimeTransport` interface (Section 2.8); no direct realtime SDK calls from game code.
- No `any`. Validate every Broadcast payload and RPC argument with zod **and** re-validate in SQL (types, ranges, ownership).
- All game constants (speeds, radii, timers, rewards) live in `/packages/shared/constants.ts`.
- Content (items, recipes, questions) is **data-driven JSON** (seeded into DB where needed).
- Every DB change = a migration in `/supabase/migrations`. Never edit schema in the dashboard without capturing a migration.
- **Every table has RLS enabled.** No exceptions (CI check fails otherwise).
- Feature flags in `/packages/shared/flags.ts`.
- Web-only APIs must degrade gracefully inside the Capacitor WebView.

### 2.8 Backend Decision Gate: Supabase (default) vs Vercel WebSockets (candidate)
**Requirement that overrides everything: the whole product must cost $0 and need no credit card.**

| | **Option A — Supabase (DEFAULT)** | **Option B — Vercel WebSockets + Postgres + Redis (CANDIDATE)** |
|---|---|---|
| Realtime | Supabase Realtime (Broadcast/Presence) | WebSocket Vercel Function (+ Socket.IO) |
| Database | Supabase Postgres (free) | external Postgres (e.g., Neon/Supabase DB free tier) |
| Shared room state | Postgres + Presence | needs **Redis** (e.g., Upstash free tier) because connections can land on different function instances |
| Auth | Supabase Auth (free) | must build/choose (extra work) |
| Game loop | none; tiered trust + host client (Section 3.2) | still no durable process; a tick loop would be unreliable on serverless → same host-client idea needed |
| Free status | **known free plan** (with limits, Section 2.3) | **UNVERIFIED** — see below |
| Work | Less backend code (RLS + RPC) | More backend code (auth, rooms, validation, Redis) |

**About the Vercel WebSocket claim:** an external summary says Vercel Functions gained WebSocket support in public beta (June 2026). This has **not been verified by me** and my knowledge may be out of date. Even if true, WebSocket connections on serverless typically consume billed function time for as long as they stay open, and beta features may be limited or unavailable on the Hobby (free) plan. **Do not adopt Option B unless it passes this gate:**
1. Available on the **Hobby plan** with no card on file.
2. Published free quota covers a couple playing ~2 h/day (open-connection duration + invocations) with margin.
3. Max connection duration/idle timeouts are workable (auto-reconnect must be seamless).
4. Required add-ons (Redis, Postgres) have **free tiers** that fit.
5. Overall build effort is acceptable versus Option A.
**Rule:** Phase 0 records the verified numbers in `docs/FREE_TIER_NOTES.md` and the choice in `DECISIONS.md`. If any gate item fails or is unclear → **stay on Option A.**

**Keep the choice swappable:** isolate transport behind a `RealtimeTransport` interface in `/packages/shared` (`connect, join(coupleId), broadcast(event,payload), onEvent, presence, disconnect`). Game code must never import `supabase-js` Realtime directly outside the Supabase adapter. Persistent logic stays in clearly named RPC-style functions (`/packages/shared/api.ts` interface) so a different backend could reimplement them.

### 2.9 Web-First Development Workflow (test with two real devices early)
The **web build is the primary target**; the APK is packaging.
1. **Local:** `localhost:5173` — test with two browser windows (two accounts, same couple).
2. **Online preview (free):** push to GitHub → Vercel auto-deploys → `your-game.vercel.app` (and per-branch preview URLs). Open it on your PC and on your girlfriend's phone **well before** any APK exists. Do real two-device multiplayer testing from **Phase 1 onward**.
3. **APK:** only once the web version is stable per phase (and at the Phase 0 spike to prove the pipeline): `pnpm --filter web build` → `npx cap sync android` → build in Android Studio / `gradlew assembleRelease`, signed with your keystore (Section 2.6).
4. Never develop Android-only features; every feature must work in the browser first. Native plugins (haptics, keep-awake, back button, push) are optional enhancements guarded by `Capacitor.isNativePlatform()`.

---

---

## 3. Architecture (Supabase Realtime + Tiered Trust)

> **Backend Translation Note.** Elsewhere in this spec, "server" means one of: **(a) Postgres** — RPC functions + RLS + constraints, for anything persistent, economic, or contested; **(b) the host client** — an elected player client that simulates ephemeral shared actors (pet AI, real-time minigame physics); **(c) pg_cron / Edge Functions** — scheduled jobs (daily chores, daily question, push). There is **no tick-loop server**. Phrases like "server tick", "server snapshot", "server validates" must be implemented using these mechanisms.

### 3.1 Overview
```
   Web (Vercel)  ───────────────┐
   Android APK (Capacitor) ─────┤   same React + Phaser build
                                ▼
                        supabase-js client
        ┌───────────┬───────────┼────────────┬────────────┐
     Auth       Realtime     Postgres      Storage     Edge Functions
   (JWT)   Broadcast+Presence  RLS + RPC   (photos)   (push, jobs) + pg_cron
```

### 3.2 Tiered Trust Model (the core rule set)
| Tier | Data | Mechanism | Authority |
|---|---|---|---|
| **1 — Persistent & economic** | wallet, inventory, pet stats/xp, achievements, unlocks, match results, chores state, couple membership | Postgres tables, writable **only via RPC** (`SECURITY DEFINER`, checks `auth.uid()` ∈ couple). Clients have **no INSERT/UPDATE** on these tables | **Postgres** |
| **2 — Shared discrete state** | mess objects, object states, activities (cuddle/cook/TV), turn-based games, decoration layout, chat | Rows + RPCs; changes pushed via Realtime *Postgres Changes* or Broadcast. **Atomic claims** (`UPDATE … WHERE state='available' RETURNING`) prevent double-clean/double-reward; `version` column for optimistic concurrency | **Postgres** |
| **3 — Ephemeral** | avatar position/anim, emotes, reactions, typing, pet position/animation | Realtime **Broadcast** (+ Presence) | **Peer/host client** (receivers sanity-clamp: map bounds, max speed, no teleport > N px) |

**Deliberate trade-off (log in DECISIONS.md):** because there is no central simulator, positions and pet motion are client-trusted. For a private two-person couple this is acceptable — cheating against your partner is pointless — while **cross-couple isolation and all money/progress are fully enforced by RLS + RPC**.

**Host client (pet AI & real-time minigames):**
- Presence determines the **host** = online member with the earliest `joined_at` (tie → lower `user_id`). Host runs the pet state machine (Section 10) and broadcasts pet state; guest only interpolates.
- Host persists a **pet snapshot** via RPC every ~30 s and on important events (feed, mess created).
- If host leaves/disconnects (Presence `leave` or heartbeat timeout > 5 s) the other client becomes host from the last broadcast/DB snapshot (no teleport: tween to snapshot).
- If **nobody is online**, nothing runs. Pet stats are computed **lazily**: RPC `sync_pet()` applies decay from `last_stats_tick_at` with the capped catch-up (Section 10.2) when anyone next opens the app. Offline mess spawning likewise happens lazily via RPC on login (capped).

**Contested actions** (both clean the same poop, both claim the last ingredient): resolved by the atomic-claim RPC; loser gets a friendly "already done" toast.

**Real-time minigames (Pong, Target Rush, Pet Race):** host client simulates and streams state via Broadcast; **both clients submit the final result via `submit_match_result`**; Postgres accepts only when both reports agree (mismatch → recorded as draw/no rewards). Rewards granted once (idempotency key = match id).
**Turn-based games (Tic-Tac-Toe, Connect Four, Memory, RPS):** moves go through RPCs that validate legality and turn order in SQL; state stored in a `game_sessions` row; hidden info (unrevealed Memory cards, RPS choice) is stored server-side and only revealed by the RPC.
**Reaction Race:** use the database clock — clicks call RPC `reaction_click(session)` which stamps `clock_timestamp()`; "GO" time is chosen by the DB; early clicks penalized; compare by DB time (document that network latency affects fairness slightly; mitigate with best-of-N).

### 3.3 Realtime Channel Design & Message Budget
- One **private channel per couple**: `house:<couple_id>`. **Realtime Authorization** (RLS on `realtime.messages`) allows only the two members to join/send. Optional second channel per active game: `game:<session_id>`.
- **Presence payload:** `{ user_id, joined_at, room, status: online|away, device, app_version }`.
- **Broadcast events:** `pos`, `emote`, `reaction`, `typing`, `pet`, `activity_hint`, `ping/call_over`, `sync_request`, `sync_response`.
- **Dead reckoning (critical for the free quota):** send `{x, y, vx, vy, dir, anim, t}` **only when input direction/animation changes** plus a 1 s correction heartbeat **while moving**; **send nothing while standing still**; receiver extrapolates then eases to corrections. Stop sending when tab hidden/app backgrounded.
- Client-side throttles: pos ≤ 10/s hard cap (typically ~1–3/s), emote ≤ 3/s, typing ≤ 1 per 2 s, pet ≤ 5/s while moving (host only).
- **Budget target:** ≤ ~1M Realtime messages/month for a couple playing ~2 h/day; measure in Phase 15 and expose a debug counter. If quota gets tight: lower heartbeat rate, quantize positions, or move motion to WebRTC peer-to-peer (fallback option, adds NAT complexity — decision later).
- Use Broadcast for ephemeral data and **Postgres Changes only for Tier-2 tables** (mess, objects, chat, sessions) to avoid noisy subscriptions.

### 3.4 Connection Handling & Reconnect
- `supabase-js` auto-reconnects; on `SUBSCRIBED` after a drop: re-track Presence → fetch **house snapshot** via RPC `get_house_snapshot()` (objects, mess, pet, active activities, unread counts) → broadcast `sync_request` so the partner replies with live positions.
- Partner avatar stays as a faded "reconnecting…" ghost for **30 s**, then is removed (data kept). No duplicate avatars (key by `user_id`).
- Mid-activity disconnect: activity pauses 30 s then cancels without penalty (state in Postgres).
- Connection indicator: good / poor / offline (based on last Presence/heartbeat RTT).
- Single active device per user: newer session shows "Playing on another device" and takes over (Presence conflict check).
- App lifecycle (Capacitor `appStateChange` / Page Visibility): background → `away`, stop pos broadcasts; foreground → resync.

### 3.5 Protocol Documentation
Maintain `/docs/PROTOCOL.md`: every Broadcast event (payload zod schema, rate limit, who may send) and every RPC (name, args, auth rule, errors, idempotency). New event/RPC = documented in the same PR.
**Server-side rate limits** (Supabase has no automatic per-user limiter): enforce in RPCs/constraints — e.g., chat insert trigger rejecting < 300 ms apart and > 500 chars; reward RPCs keyed by idempotency key and daily caps in SQL.

### 3.5a Event Catalog (define architecture first; implement per phase)
`PLAYER_JOINED, PLAYER_LEFT, PLAYER_MOVED, PLAYER_STOPPED, PLAYER_ANIMATION_CHANGED, PLAYER_ROOM_CHANGED, PLAYER_EMOTE, PLAYER_REACTION, PLAYER_INTERACTION, PLAYER_SIT, PLAYER_SLEEP, PLAYER_HUG, PLAYER_CUDDLE, PLAYER_CHAT, PLAYER_TYPING`
`PET_MOVED, PET_STATE_CHANGED, PET_INTERACTION, PET_MESS_CREATED`
`OBJECT_STATE_CHANGED, CHORES_UPDATED, COOKING_STARTED, COOKING_UPDATED, MEAL_COMPLETED`
`GAME_INVITE, GAME_SELECTED, GAME_READY, GAME_STARTED, GAME_MOVE, GAME_RESULT, GAME_EXIT`
(Add: `CHAT_REACTION, CHAT_READ, ACTIVITY_STATE, HUG_REQUEST, BUILD_PLACED, MAIL_RECEIVED, GOODNIGHT_UPDATED, CONNECTION_STATE`.) Each event is labeled **Broadcast (Tier 3)** or **DB change (Tier 1–2)** in PROTOCOL.md. Do not implement every event at once.

### 3.6 Free-Tier Survival Operations
- **Keep-alive:** GitHub Actions cron (`keepalive.yml`, every ~3 days) calls a public health RPC so the Supabase project is not paused for inactivity. Also works as an uptime ping. (If the project does pause, restore it from the dashboard — data is preserved for a limited time.)
- **Scheduled jobs (pg_cron, free):** daily chores generation, daily question, countdown/anniversary notifications, pruning old rows (e.g., read chat > 1 yr optional, expired invites, old match details), cleaning orphaned storage.
- **Storage hygiene:** client compresses photos (max ~1280 px, WebP/JPEG ~80%, strip EXIF) before upload; per-couple storage quota enforced in RPC; thumbnails generated client-side.
- **Cost watchdog:** a debug screen showing DB size estimate, storage used, realtime messages sent this session.
- **Backups:** free plan has no guaranteed backups → add a monthly GitHub Action that runs `pg_dump`/`supabase db dump` to a private artifact (or export manually) and **in-app export** of memories/chat.
- **Migrations are the source of truth**; the project can be recreated on a fresh free Supabase project with `supabase db push` + seed.

### 3.7 Local-First Cache & Offline Queue (Supabase stays the source of truth)

```
         SUPABASE (source of truth: Tier 1–2 data)
                 │            ▲
      snapshot / │            │ ACTIONS (intents), never values
      changes    ▼            │
   ┌──────────────────────────────┐
   │ Phone/Browser LOCAL layer    │  fast UI · cached last state · pending actions · settings
   └──────────────────────────────┘
```
**Principle:** local storage is a *cache and working copy*, never a second database. There is **one** truth (Supabase); each device keeps a disposable copy for speed. Two independent databases that "merge later" are explicitly forbidden.

**What is stored locally**
| Store | Contents | Tech (keep simple, no extra libs unless needed) |
|---|---|---|
| Settings/preferences | volume, controls layout, joystick size, name tags, reduced motion, language | Capacitor Preferences (APK) / localStorage (web) |
| Session | Supabase auth session | Capacitor Preferences/secure-storage (APK) / supabase-js default (web) |
| Cache | last house snapshot, pet state, character appearance, inventory, chat page, memory thumbnails, `snapshot_version` | **IndexedDB** (via `idb`/Dexie) — works in browsers and Android WebView |
| Pending actions | offline queue (below) | IndexedDB |
| Assets | web: service-worker cache (PWA); APK: bundled | Workbox/vite-plugin-pwa |
*SQLite plugin only if IndexedDB proves unreliable on Android (log in DECISIONS.md). Note Android may evict WebView storage under pressure — the cache must always be rebuildable from Supabase.*

**Read path (fast start):** on launch render from cache immediately → fetch `get_house_snapshot(since_version)` (delta) → reconcile → update cache. Cache is keyed by `user_id + couple_id` + `schema_version`; wiped on logout, account switch, or schema bump.

**Write path — send ACTIONS, not state.** The phone never uploads "hunger = 80". It uploads `{action:'FEED_PET', idempotency_key, client_ts}`; the RPC applies it to the *current* database state (clamping, cooldowns, daily caps) and returns the new authoritative state, which replaces the optimistic local value. If both partners feed at once, both actions are applied in DB order and results are clamped — no conflict resolution code needed on the client.

**Optimistic UI:** local state updates instantly (animation, bar change); on RPC response reconcile; on rejection roll back with a friendly toast.

**Offline policy**
| Allowed offline (queued, replayed later) | Requires being online |
|---|---|
| Settings, UI preferences (local only) | Spending Paw Points, buying/gifting items |
| Browsing cached house/memories/chat history (read-only) | Any multiplayer activity, games, cooking sessions, cuddle/hug |
| Outfit/appearance changes (queued; last-write-wins) | Changing shared house layout/ownership |
| Low-stakes idempotent pet care (**Feed, Water, Pet**) — queued with idempotency key | Achievements, progression/XP grants, milestones |
| Writing a draft chat message / love note / memory (saved locally, sent when online) | Memory/photo changes that affect the partner immediately |
Everything else shows "You're offline — reconnect to do this." (plain language, no error codes).

**Queue rules**
- Each entry: `id (uuid = idempotency key), action, args, created_at, attempts`. Stored in IndexedDB, replayed **in order** on reconnect, one at a time with backoff.
- RPCs store processed keys (`processed_actions(idempotency_key unique, couple_id, user_id, created_at)`) → replay after a lost response is a no-op.
- Entries older than ~24 h or rejected as invalid are dropped with a small "some offline actions couldn't be applied" notice (never silently).
- Queue size capped (e.g., 100); oldest low-value entries dropped first.
- Time is the **server's**: `client_ts` is informational only; decay/cooldowns use DB `now()`.

**Offline UX:** small "Offline" chip + banner; game world shows the last cached state with the partner avatar greyed; Realtime auto-resubscribes on reconnect (Section 3.4) and the queue flushes with a subtle "Syncing…" indicator.

**Security & privacy of the local copy:** cache contains private couple data → cleared on logout; never store the `service_role` key or other secrets; never trust cached Tier-1 values when making decisions (always re-check via RPC); no Tier-1 write policy is ever relaxed to support offline.

**Free-tier benefit:** cache + delta snapshots reduce Supabase requests/egress and make cold starts feel instant even if Supabase is slow or paused-waking.

---

---

## 4. Data Model (Supabase Postgres)

> All tables live in `public`, use `uuid` PKs (`gen_random_uuid()`), have **RLS enabled**, and reference `auth.users`/`profiles`. Policy pattern: `using (is_couple_member(couple_id))` for SELECT; **no direct INSERT/UPDATE/DELETE for Tier-1 tables** — writes via RPC only. Helper `is_couple_member(uuid)` is `SECURITY DEFINER`, `STABLE`.

Types abbreviated; all tables have `id (uuid)`, `created_at`, `updated_at` unless noted.

### 4.1 Identity & Couple
- **profiles** (1:1 with `auth.users`, created by trigger): display_name, timezone, locale, avatar_config (jsonb), last_seen_at, notification_prefs (jsonb), deleted_at. (Email/password/sessions are handled by **Supabase Auth** — no custom password or session tables.)
- **couples**: status (`pending|active|unlinking|archived`), invite_code (unique, expires), anniversary_date, relationship_start_date, house_id, created_by
- **couple_members**: couple_id, user_id, role (`partner_a|partner_b`), joined_at (unique user_id → one active couple per user)
- **couple_unlink_requests**: couple_id, requested_by, status, grace_ends_at (see 5.3)

### 4.2 House & World
- **houses**: couple_id, tier (`apartment|house|dream`), wall_style, floor_styles (jsonb per room), unlocked_rooms (jsonb), layout_version
- **house_objects**: house_id, item_id (from game-data), room_id, x, y, rotation, state (jsonb), placed_by, placed_at, locked (bool, for fixed objects)
- **mess_objects**: house_id, type (`poop|pee|trash|dish|spill|laundry|clutter`), room_id, x, y, source (`pet|random|player`), spawned_at
- **inventory_items**: couple_id (shared) , item_id, quantity
- **player_inventory** (optional personal): user_id, item_id, qty (e.g. outfits)

### 4.3 Characters
- **characters**: user_id, body (jsonb: skin, body_type, height), hair, face, outfit (jsonb: top, bottom, shoes, accessories), unlocked_cosmetics (jsonb)

### 4.4 Pet
- **pets**: couple_id, species (`cat|dog`), name, breed/coat (jsonb), birthday, stats (jsonb: hunger, happiness, energy, cleanliness, bond — 0–100), state, last_stats_tick_at, xp, level, personality_traits (jsonb), accessories (jsonb)
- **pet_activity_log**: pet_id, user_id, type (`feed|play|cuddle|bathe|clean_mess|...`), payload, created_at

### 4.5 Social
- **chat_messages**: couple_id, sender_id, type (`text|emoji|sticker|system|love_note`), body, reply_to, created_at, delivered_at, read_at, deleted_at
- **love_notes**: couple_id, sender_id, body, placed_object_id (nullable — note placed in house), opened_at
- **memories**: couple_id, created_by, title, description, date, photo_asset_id, tags, pinned_in_house_object_id
- **assets**: owner_user_id, couple_id, storage_key, mime, size, width, height, status (`pending|ready|rejected`)
- **important_dates**: couple_id, title, date, repeat (`none|yearly|monthly`), notify (bool)
- **daily_questions_answers**: couple_id, question_id, user_id, answer, answered_at (reveal when both answered)

### 4.6 Games & Progress
- **match_records**: couple_id, game_id, started_at, ended_at, winner_user_id (nullable for draw/coop), scores (jsonb), duration
- **game_stats**: couple_id, game_id, wins_a, wins_b, draws, best_scores (jsonb)
- **chores_state**: couple_id, date, chores (jsonb of today's chore list + completion), streak
- **wallet**: couple_id, paw_points, lifetime_earned
- **transactions**: couple_id, delta, reason, ref_id
- **achievements_unlocked**: couple_id, achievement_id, unlocked_at
- **milestones**: couple_id, type, reached_at
- **notifications**: user_id, type, payload, read_at, push_sent_at
- **push_subscriptions**: user_id, endpoint, keys, device

### 4.6a Game/Session Tables (Supabase-specific)
- **game_sessions**: couple_id, game_id, status, state (jsonb, hidden info kept server-side), turn_user_id, version, reports (jsonb for dual result reporting), started_at, ended_at
- **activity_sessions**: couple_id, type, participants, state (jsonb), version, expires_at
- **cooking_sessions**: couple_id, recipe_id, step_index, step_log (jsonb), participants
- **reward_claims**: couple_id, idempotency_key (unique), reason, amount — prevents duplicate rewards
- **app_config**: min_app_version, latest_apk_url, maintenance_flag (public read)
- **processed_actions**: couple_id, user_id, idempotency_key (unique), action, created_at — makes offline-queue replays safe; pruned after ~7 days
- **snapshot versioning:** each Tier-1/2 table has `updated_at` + a per-couple `snapshot_version` counter (bumped by RPCs) so `get_house_snapshot(since_version)` can return deltas

### 4.6b Core RPC Functions (all `SECURITY DEFINER`, verify `auth.uid()`)
`create_couple, join_couple(code), request_unlink, get_house_snapshot, sync_pet, pet_action(action, idempotency_key), persist_pet_snapshot, claim_mess, clean_mess, spawn_lazy_mess, complete_chore, start_activity/join_activity/end_activity, cooking_step, send_chat/mark_read, game_create/game_move/reaction_click/submit_match_result, claim_reward(key), purchase_item, gift_item, place_object/move_object/remove_object, save_memory, answer_daily_question, submit_goodnight` — each documented in PROTOCOL.md with auth rule + idempotency.

### 4.7 Ops
- **audit_log**: actor, action, payload (auth events, unlink, delete)
- **feature_flags** (optional) and **schema_version**

**Indexes:** couple_id on every couple-scoped table; (couple_id, created_at) on chat; (house_id, room_id) on objects/mess.

---

## 5. Accounts, Pairing, Privacy

### 5.1 Auth (Supabase Auth, free)
- **Email + password** for v1 (works identically on web and APK). OAuth (Google/Apple) deferred — needs deep-link config in Capacitor.
- **Free-tier email caveat:** Supabase's built-in email sender is heavily rate-limited. Choose in DECISIONS.md: (a) disable "confirm email" (simplest for a two-person private app), or (b) add a free custom SMTP (e.g., Resend/Brevo free tier). Password reset needs email → option (b) recommended before sharing.
- Deep links for password reset/confirm: register an app URL scheme/App Links in Capacitor and the Vercel domain.
- Cached private data is wiped on logout (Section 3.7). Session persisted by supabase-js (secure storage on Android via Capacitor Preferences/secure-storage plugin); JWT auto-refresh; "log out everywhere" via Auth admin flow.
- Couple creation/joining only via RPCs; DB constraint guarantees **exactly 2 members** and **one active couple per user**.

### 5.2 Pairing Flow
1. User A signs up → creates couple → gets **invite code + shareable link** (expires 7 days, single use).
2. User B signs up/logs in → enters code → joins → couple becomes `active`.
3. Both go through **onboarding**: character creator → pick pet species → name pet → set anniversary → timezone → notification permission → short tutorial (move, interact, chat).
4. Edge cases: invalid/expired code, code reuse, user already in a couple, A cancels before B joins, B joins while A offline (A sees it on next login).

### 5.3 Unlinking / Breakup / Deletion (must exist)
- "Leave couple" requires confirmation + **14-day grace** period; either partner may cancel during grace.
- After unlink: couple archived; each user can **export** their memories/photos/chat (zip) before deletion.
- Account deletion: soft-delete → hard-delete after 30 days; remove personal photos/assets.
- Tone: respectful, no guilt copy.

### 5.4 Privacy & Safety
- Photos/chat visible only to the two members. Private storage buckets with signed URLs.
- Image upload: size limit (e.g., 8 MB), type check, EXIF stripped, resized/thumbnailed.
- Chat text sanitized (no HTML), length limit (500 chars), emoji supported.
- GDPR-style: data export, delete, privacy policy, terms.
- No analytics on private content (chat/photos). Analytics events only for feature usage (opt-out available).

---

## 6. The World

### 6.1 Rendering
- Top-down 2D pixel/cute-vector style. **Tile size 32×32**, camera zoom scales to fit viewport (integer scaling preferred).
- **Y-sorting** for depth (characters walk behind/in front of furniture).
- Camera follows local player, clamped to house bounds; on small phones shows a minimap toggle.
- Day/night lighting overlay tied to **player's local time** (or shared "house time" — decide; default: each client uses own local time, lamps toggled by interaction).

### 6.2 House v1 Layout (final map must be drawn in Tiled before coding)
Rooms: **Living Room, Kitchen, Bedroom, Bathroom, Hall/Entry** (Garden/Balcony/Game Room unlock later).
Requirements:
- Min corridor/door width **2 tiles** so two characters + pet pass.
- Each room has named **spawn points** and **pet spawn points**.
- Collision layer, interaction-zone layer, room-trigger layer (for room name toast and per-room mess spawning), navigation mesh/grid layer for pet pathfinding.
- Map JSON stores objects with `type`, `id`, `interaction`, `slots` (e.g., sofa seats).

### 6.3 Movement Model
- 8-direction movement, constant speed (**~120 px/s**), diagonal normalized, tile collision via AABB (character hitbox small, feet-based).
- Characters **cannot overlap** each other hard, but may "soft-pass" (push-through allowed at reduced speed) so nobody gets blocked in a door.
- Pet collides with walls but passes under players visually (no blocking).
- Sitting/sleeping/activities lock movement and snap to **slots** (named anchor points with facing + animation).

### 6.4 Rooms Transitions
- Single continuous house map (no loading between rooms). Doors are visual + collision toggles (open when someone is near).
- Game rooms (Section 16) and later expansions are **separate scenes** with a fade transition, both players moved together.

### 6.5 Interactable Architecture (core system)
Every interactable defined in data:
```ts
Interactable {
  id, type, roomId, position, interactRadius,
  prompt: { icon, label },            // e.g. "✋ Open"
  mode: 'solo' | 'duo' | 'either',     // duo requires both players
  slots?: Slot[],                      // seats/positions
  states: StateMachine,                // e.g. idle→inUse→cooldown
  requires?: Condition[],              // item, time, chore state
  onInteract: ActionId,                // server handler
  cooldownMs?, rewards?
}
```
- Client shows the **nearest** valid interactable's prompt on the INTERACT button (mobile) / `E` or `Space` (desktop). Also tappable directly.
- Validation: an RPC (Tier 1–2) or the host/peer (Tier 3) checks in range, state allows, slot free, requirements met; result is propagated via Postgres Changes or Broadcast (`interaction_started/updated/ended`).
- Only one player can occupy a slot; "busy" feedback if occupied.
- All interactions are **cancelable** (Esc / ✖ button / move away where appropriate).

---

## 7. Characters

### 7.1 Customization (v1)
- Skin tone (≥8), body type (≥3), height variation (small/med/tall), hair style (≥8) + color (≥12), eyes (≥6), mouth (≥4), glasses (optional), shirt, pants, shoes + colors.
- Layered sprite system (body + hair + face + clothes layers, tinted). All layers share the same animation frame grid.
- Later: hats, hoodies, pajamas (auto-worn when sleeping option), dresses, seasonal outfits, accessories, face paint, pet-matching outfits.

### 7.2 Animations (per direction: up/down/left/right)
`idle, walk, run(optional), sit, sleep, hug, cuddle, wave, laugh, cry, angry, please, clap, dance_a, dance_b, eat, cook_stir, clean_sweep, pick_up, throw_away, read, brush_teeth, shower, play_with_pet, pet_cuddle, play_game(sit)`

### 7.3 Customization Entry Points
- Onboarding creator, **Mirror** (bedroom/bathroom) and **Wardrobe** (outfits saved as presets, ≥5 slots).
- Each player may change **only their own** character.

### 7.4 Name Tags & Presence
- Name tag above characters (toggleable). Status icon: 💬 typing, 💤 idle/AFK (after 2 min no input, character sits/yawns automatically), 📱 on mobile/background.

---

## 8. Controls & Responsive UI

### 8.1 Desktop
- Move: WASD / arrows. Interact: `E`/`Space`. Emote wheel: `Q` hold or click 😊. Chat: `Enter`. Menus: `Esc`, `I` bag, `P` pet, `H` house edit.
- Mouse click-to-move **optional** (pathfind to point) — later.

### 8.2 Mobile
- **Virtual joystick** (floating, left thumb), **INTERACT** button (right thumb, contextual icon), emote button, chat button, menu button.
- Joystick must support dead zone, 8-way, and handle multitouch (move + button simultaneously).
- Safe-area insets (notch), landscape and portrait supported (portrait: world top, chat/tools bottom; landscape: overlay controls).
- Haptics (vibration) on interact/prompt where supported (setting).
- Page Visibility: when app backgrounds, send `away` status, stop sending input; resume on foreground.
- Same UI runs as **PWA (web/iPhone)** and **Capacitor APK (Android)**: installable, fullscreen, orientation-flexible, safe areas, hardware Back handled (Section 2.6).

### 8.3 HUD
- Top bar: days together ❤️, Paw Points 🐾, partner presence dot (online/away/offline), connection indicator, settings.
- Bottom/side bar: 🐾 Pet · 💬 Chat (unread badge) · 🎒 Bag · 🏠 House/Edit · ❤️ Us (memories/questions) · 📋 Chores.
- Toasts for events ("Mochi made a mess 💩", "Your partner joined").
- **Never depend on hover.** Tooltips = tap-and-hold or visible labels.

### 8.3a Common UI Language
Use simple familiar labels: **Home, Chat, Games, Pet, Memories, Shop, Settings, Play, Cook, Clean, Feed, Sleep, Hug, Cuddle, Sit, Interact, Back, Ready, Leave.** No invented jargon for basic functions. Errors in plain language (e.g., "Connection lost. Trying to reconnect…", never "WebSocket error 1006").

### 8.4 Accessibility & Settings
- Settings: master/music/SFX volume, haptics, name tags, reduced motion, colorblind-friendly mode, text size, joystick size/position, control remap (desktop), notification preferences, language, timezone, data export, delete account, sign out.
- Reduced motion disables screen shake/particles. All critical info not color-only. Keyboard-navigable menus. Text contrast ≥ WCAG AA in UI panels.
- Localization-ready: all strings in i18n files (en first).

---

## 9. Social Systems

### 9.1 Chat
- Drawer UI over game; works in-world and on a standalone Chat screen (so it's usable without loading the game).
- Features: text, emoji picker, reply-to, message reactions, typing indicator, delivered/read state, timestamps in each user's timezone, infinite history scroll, image sending (photo) — later, **voice notes** — later, search — later, pin message.
- **Chat bubbles above characters** for ~5 s when sending in-world.
- **Love Notes:** write a note that gets left on a surface in the house (pillow, fridge, table) as a 📝 object the partner opens. Delivers push notification.
- **Offline messages**: stored and delivered; push notification if partner offline.
- Profanity filter not needed (private couple chat); no moderation reporting needed beyond abuse/safety link.

### 9.2 Reactions (floating emoji)
❤️ 😂 😭 🥺 😳 😡 🫂 😘 👏 ✨ — float above the character 3 s, both clients see it, subtle sound.

### 9.3 Emote Wheel
❤️ Love, 🫂 Hug, 👋 Wave, 😂 Laugh, 😭 Cry, 😡 Angry, 🥺 Please, 👏 Clap, 💃/🕺 Dance, 😴 Yawn, 😘 Kiss(blow). Plays animation + reaction. Emotes interrupted by movement unless looping (dance).

### 9.4 Proximity Interactions
- Proximity radius ≈ 2 tiles. Near partner → interaction menu: 💬 Talk (opens chat bubble input), 🫂 Hug, ❤️ Cuddle (standing), 👋 Wave, 😂 Emote, 🤝 Hold hands (walk together, follow offset), 🎁 Give item.
- **Hug / hold hands / cuddle are consent-based mutual actions**: initiator sends request → partner sees prompt "💕 X wants to hug" (accept/ignore, auto-expires 8 s). Accepting syncs both characters into the paired animation.
- Far away → only Chat + emotes + "📍 Call over" (pings partner with a waypoint arrow & vibration).
- **Teleport to partner** button (optional, cooldown) so long walks don't annoy.

### 9.5 Presence Features (long-distance specific)
- "Partner is online" push notification (optional, throttled, with quiet hours).
- "Knock/Poke" 🔔 button: sends a push to invite partner into the house ("Alex wants to hang out 💕").
- Where's my partner indicator (room name + arrow) when off-screen.
- Shared house **time-of-day badge** showing partner's local time.

---

## 10. Pet System

### 10.1 Pet Data
- Species: `cat | dog`. Customization: coat color/pattern (≥6), name (profanity-safe, ≤16 chars), birthday (adoption date).
- Stats (0–100): **Hunger, Happiness, Energy, Cleanliness, Bond (relationship with each player + shared)**. Also **XP/Level** (Section 21).
- Mood derived from stats (happy, sleepy, hungry, dirty, lonely, playful).

### 10.2 Stat Decay (offline-friendly)
- RPC `sync_pet()` computes decay from `last_stats_tick_at` using **capped catch-up** (max decay equivalent to ~12 h so returning isn't punishing). Stats floor at ~15 (never 0 effects beyond sadness).
- Sleep restores Energy; pet auto-sleeps at night per couple's average local time.
- Notifications (opt-in): "Mochi is hungry 🥺" at most 2/day.

### 10.3 Pet State Machine (runs on the elected host client; see Section 3.2)
States: `idle, wander, follow, sleep, eat, play, sit, scratch, curious(inspect object), beg_attention, use_litter/outside(poop), react, carried_by_activity(cuddle), bath, sulk`.
- Transitions driven by needs + personality + nearby players/objects + timers + random weights.
- Each state has min/max duration, entry/exit animation, interruption rules (player interact interrupts most states except sleep → "wake up grumpy" optional).
- **Pathfinding:** A* on the nav grid; avoid furniture; stuck-detection (if no progress 2 s → repath/teleport to nearest free tile).
- Pet never occupies a tile players need exclusively (e.g., doorway block > 5 s → moves).

### 10.4 Personalities
| | Cat | Dog |
|---|---|---|
| Social | independent, ignores sometimes | follows players, greets at join |
| Idle | sleeps randomly, sits on furniture | wags tail, waits by door |
| Quirks | knocks items off surfaces, scratches furniture, sudden zoomies, demands attention | brings toy, asks to play, excited when both players are in the house |
| Mess | litter box use + occasional accidents | needs "outside" (door/garden) + occasional accidents |

Optional trait modifiers per pet (e.g., lazy, playful, greedy, shy) — chosen/randomized at adoption.

### 10.5 Pet Interactions
- **Feed** (bowl: fill from fridge/pet food in bag; pet walks to bowl), **Treat**, **Water**, **Play** (ball, string toy, laser), **Pet/Cuddle** (hold interact on pet), **Bathe** (bathroom tub minigame), **Brush**, **Call** (come here), **Trick** (dog: sit/paw; cat: boop) later, **Sleep** (pet bed).
- **Both players interacting with pet at once** gives bonus bond ("family time").
- Pet reacts to emotes/hugs between players (runs over, circles, meows/barks).
- **Pet activity history** (who fed, last played) visible in Pet panel — a gentle "who did what" without blame framing.

### 10.6 Pet Messes & Needs
- Poop/pee spawn based on feeding time (not pure random); max **3 pet messes** on map at a time; never inside the pet's bed.
- Message toast: "Uh oh… Mochi made a mess 💩" (with room name, tap to see location arrow).
- Cleaning = interactable on the mess; cleaning gives reward + bond bump for pet.

### 10.7 Pet Visuals & Audio
- Cat/dog sprites: idle, walk, run, sit, sleep, eat, play, scratch, beg, happy, sad, bath, sulk, poop, held/cuddle (8-direction or 4-direction).
- Sound cues (meow/bark/purr), muted by default if SFX off.

---

## 11. Chores & House Upkeep

### 11.1 Mess Types & Spawning
Kitchen: dirty dishes, trash, spills, food scraps. Living room: boxes, wrappers, toys. Bedroom: clothes, books, toys. Bathroom: water puddles, empty paper roll. Pet: poop/pee.
- **Spawn director** (pg_cron + lazy RPC on login; host client only for visual placement): low rate (e.g., 1 mess per ~20–40 min online; offline spawns **capped at 3–5 total** accumulated while away). Never spawns while players are mid-activity in the room.
- Cleanliness score (0–100) = visible state, **no penalty**, just flavor + small buffs/bonuses; "Sparkling clean" gives cosmetic aura/bonus rewards.

### 11.2 Cleaning Interactions
- **Pick up → carry → dispose** loop for trash/clothes/dishes (carried object shown with player; can't run with huge piles).
- **Hold-to-clean** for spills/poop (progress ring), sweep animation, sparkles.
- Dishes: carry to sink → wash minigame (simple tap rhythm) → drying rack.
- Laundry: collect clothes → washing machine → dryer (timer, can leave and return) → fold (duo) → wardrobe.
- Trash: kitchen bin fills → carry to **outdoor bin / hallway chute** → bin empty.

### 11.3 Daily Chores Board
```
TODAY'S CHORES (resets by couple's shared reset time, e.g., 4 AM of the earlier timezone — decision logged)
☐ Feed <pet>        ☐ Clean pet mess     ☐ Wash dishes
☐ Take out trash    ☐ Laundry (duo)      ☐ Cook a meal
```
- 3–5 chores/day picked from a pool depending on existing mess; **optional**, always rewarding.
- Either player can complete; shows who did it. **Chores Streak** counts days where ≥1 chore done by *either* (gentle, no loss spiral: streak freeze tokens).
- **Duo chores** (laundry folding, moving furniture, bath the pet) need both online at once → "Teamwork bonus".
- **Async chores:** if only one online, a chore variant is solo.

---

## 12. Kitchen & Cooking

### 12.1 Objects
Fridge (ingredients), stove (1–2 burners), oven (later), sink, counter(s), dining table (2 seats), cabinets, trash bin, pantry, coffee machine (later), pet food station.

### 12.2 Ingredients & Economy Link
- Fridge **auto-stocks daily** with basics (egg, milk, flour, tomato, cheese, bread, bacon, rice, fruit); rarer ingredients sold in shop or from **garden** later. No grocery micromanagement in v1.

### 12.3 Recipe Data (JSON)
```json
{ "id":"pancakes","name":"Pancakes","mode":"duo_preferred",
  "ingredients":["flour","milk","egg"],
  "steps":[
    {"id":"s1","action":"add_item","item":"flour","role":"any"},
    {"id":"s2","action":"add_item","item":"milk","role":"other_than_s1"},
    {"id":"s3","action":"stir","role":"any"},
    {"id":"s4","action":"flip_timing","role":"any"}
  ],
  "rewards":{"happiness":10,"pawPoints":5,"buff":"cozy_belly"} }
```
- Steps are tiny interactions (tap, hold, timing, drag). **No failing hard:** timing errors produce "slightly burnt" (smaller reward, funny animation), never nothing.
- Recipes v1: toast, fried egg, breakfast plate, pancakes (duo), pasta, salad, soup, pizza (duo), cookies (later), cake (anniversary special, later), pet treats.
- Solo vs duo: **duo recipes give higher bonus**; all can be done solo.
- **Serving:** dish appears on table; eating (both sit) triggers 'Eat together' bonus; leftover dishes spawn as dirty dishes.
- **Buffs** (cosmetic/economy only): e.g., +10% Paw Points for 30 min, pet bond +. Never gameplay-blocking.

---

## 13. Living Room, Bedroom, Bathroom Activities

### 13.1 Living Room
- **Sofa (2 slots):** sit; **Cuddle** (mutual) → synced pose, hearts, "💕 Cozy moment" after 10 s, small Bond/Happiness reward (cooldown-limited to avoid farming).
- **TV:** 📺 *Watch Together* (both sit; shared "channel" activity: ambient video loops, shared playlist, later "movie night" synced timer, **couple question** panel, shared drawing board later).
- **Arcade machine:** Section 16.
- **Coffee table, plants, shelves, photo frames** (memory frames), **pet bed/toys**, **window** (shows real weather of each partner's city (opt-in) — nice long-distance touch), **fireplace** (cozy mode), **record player** (music).
- Computer/desk: placeholder for future activities (shared to-do/calendar, wishlist).

### 13.2 Bedroom
- **Bed (2 slots + pet slot):** sleep (single or both), cuddle in bed, "Goodnight 🌙" sequence when both sleep: lights fade, pet curls up, soft lullaby, sleep log saved ("slept together X nights"), optional goodnight message.
- **Wardrobe:** outfit editing/presets. **Mirror:** appearance edit + 📸 **Photo mode** (in-game screenshot with frame/filters, saved to Memories).
- **Bookshelf:** read (idle anim; unlock short cozy books/quotes later; "read together" reading timer). **Speaker:** shared playlist (predefined royalty-free tracks; selection syncs).
- **Lamp / lights:** toggle (synced), color temperature.
- **Plushies/photos** decor.

### 13.3 Bathroom
- **Shower**, **Brush teeth** (tap mini), **Wash hands**, **Toilet** (flavor only; no dwelling mechanics beyond a short anim), **Sink**, **Laundry basket**, **Pet bath tub** (pet bath minigame: scrub/rinse; both players can scrub).
- Player "hygiene" meter is **cosmetic/flavor**; only pet stats have real systems. (Decision: no personal needs bars in v1 to keep cozy. If added, never punishing.)

### 13.4 Hall / Entry
- Door (to garden/outside later), shoe rack, coat hooks, mailbox: **mail** delivers love notes, shop deliveries, daily postcard, anniversary letters.
- **Bulletin/calendar board:** important dates, countdowns.

---

## 14. Activity & Session System (shared engine)

Generic server-side **Activity** framework used by cuddle, cooking, watching TV, laundry, minigames, etc.:
```ts
Activity { id, type, participants[], state, startedAt, expiresAt, data, onJoin, onLeave, onTimeout, onComplete }
```
- Lifecycle: `proposed → active → (paused) → completed | cancelled`.
- Participants join through slot/interaction. Server broadcasts `activity_state` with minimal diffs.
- Handles disconnects (pause/timeout), cancels, rewards (idempotent — each activity completion yields reward once), and cooldown tracking.
- Anti-farming: reward diminishing returns per activity type per day.

---

## 15. Rewards, Economy, Progression

### 15.1 Currencies
- **Paw Points 🐾** (shared wallet; couple-level). Earned from chores, cooking, games, pet care, daily login, milestones.
- (Optional later) **Hearts 💗** soft currency for relationship-only items (earned only via couple activities) — avoid unless needed.
- No real-money items. If monetization ever added, separate spec.

### 15.2 Shop (Hall computer or Mail catalog)
Categories: furniture, rugs, plants, wall art, lighting, plushies, pet accessories (collars, hats, beds, toys), outfit items, wallpapers/floors, music tracks, emote packs, seasonal.
- Items have rarity, price, unlock condition (level/achievement), room restrictions, footprint, interaction (if functional).
- **Gifting:** either player can buy an item as a **gift** — appears in partner's mailbox with a note (surprise!). Spending from shared wallet vs personal "pocket" setting (decision).
- Daily/weekly rotating stock; no FOMO-punishment: all items eventually available.

### 15.3 Progression
- **Pet XP/Levels**: unlocks new tricks, accessories, behaviors.
- **House tiers**: Apartment → Bigger House (+Garden, Game Room, Balcony) → Dream Home. Unlock via **couple level** (XP from all shared activities) + Paw Points purchase.
- **Couple Level & Milestones:** days together (7, 30, 100, 365…), games played, meals cooked, nights slept together, etc. Each milestone gives a reward + a **keepsake memory card** auto-added to Memories.
- **Achievements** (cozy, e.g., "First Hug", "100 Pancakes", "Clean Streak 7", "Goodnight x30", "Pet Parent Level 5"). Achievement board in Us menu.
- **Seasonal/events**: holidays, anniversary event (auto-triggers decorations + special recipe), birthdays (partner's birthday = surprise setup tools: balloons/banner placed secretly).

---

## 16. Arcade, Game Rooms, Minigames

### 16.1 Flow
`Living room → walk to arcade → interact (either) → invite sent to partner → partner accepts → game select (both see lobby: choose game, best-of N) → "Entering Game Room…" fade → Game scene (characters seated/avatars) → countdown 3-2-1 → game → result screen (winner, stats, rewards) → "Play again / Choose another / Back to house"`.
- If partner declines/times out (15 s): cancel. Solo practice vs bot for some games (optional).
- Game sessions run on **server** (authoritative); results persisted to `match_records`/`game_stats`.
- Leaderboard = **couple's head-to-head record** (wins/losses/draws, streaks) — no global rankings.

### 16.2 VS Games (server-authoritative rules)
| Game | Rules summary | Notes |
|---|---|---|
| ❌⭕ Tic-Tac-Toe | turn-based 3×3, best-of-3 default, alternate first mover | validate move legality server-side, turn timer 30 s optional |
| 🔴 Connect Four | 7×6, gravity drop, win detection, draw | animations for drops, turn timer |
| ⚡ Reaction Race | random delay → "GO!"; server timestamps clicks; early click = penalty; best of 5 | use server time and latency compensation (RTT-based fairness window) |
| 🎯 Target Rush | targets spawn on shared playfield (server seed + timestamps), score by hits in 30 s | seeded spawns, hit validation by server |
| 🏓 Mini Pong | real-time, server simulates ball/paddles at 30–60 Hz, first to 7 | needs prediction/interp |
| 🧠 Memory Battle | shared card grid, turn-based match pairs | server hides unrevealed card values |
| 🏃 Pet Race | pets race along a track; players tap/mash or time boosts; cosmetic pet mods affect nothing | |
| 🪨 Rock Paper Scissors | simultaneous commit/reveal | server holds choices until both lock |
| 🧩 Puzzle Race | same puzzle, first to finish | later |
| 🎯 Aim Challenge | later | |
Later: Dots & Boxes, Battleship, Word games (Wordle-like duel), Drawing guess (Pictionary), Mini golf (coop), Cooking Rush (coop).

### 16.3 Co-op Games (later)
Cooking Rush, Puzzle co-op, Pet obstacle course (cooperative score), Escape room-lite.

### 16.4 Game Edge Cases
Disconnect mid-game: 30 s hold then forfeit/cancel (setting: "cancel without loss"); rematch; desync detection (state hash); cheating prevented by server logic; tab backgrounding on mobile pauses turn timer for turn-based games only if opponent agrees (or just uses generous timers).

---

## 17. Couple Games (non-competitive)

All use shared question banks in `/packages/game-data/questions/*.json`, categories, tags, difficulty, spice level (clean/romantic/deep).
- **Who Knows Who?** — A answers about self; B guesses; reveal; score; roles swap.
- **This or That** — simultaneous choice, reveal, match counter; unlimited packs (food, travel, lifestyle, silly).
- **Guess My Answer** — mutual guessing; "You know each other!" meter.
- **Our Questions** — deep prompts; both answer privately → reveal when both submitted; **Save to Memories** option.
- **Daily Question** — 1/day (mailbox or TV), async; reveal when both answered, notify partner; history archive/timeline.
- **Would You Rather**, **Truth or Dare (cozy)**, **Dream Trip Planner**, **Bucket List** (shared list with check-offs), **Shared Playlist**, **Date Night Generator** (random virtual date ideas that tie to game activities), **Love Language Quiz**, **Compliment Jar** (drop a compliment, partner draws one).
- Works async: answers stored; reveal triggers when both done; push notifications.

---

## 18. House Decoration (Build Mode)

- **Enter Build Mode** (both players can; changes broadcast live; **"edit lock"**: one editor at a time optional or conflict-free per-object lock).
- Place, move, rotate (90°), flip, remove (to inventory), recolor/variant, layer (wall/floor/surface/ceiling), snap to grid, undo/redo (local last 20 steps).
- Validation (server): within room bounds, no overlap with fixed objects/doorways, **walkable path preserved** (flood-fill check from spawn to all required interactables), surface items require surface objects.
- Wallpaper/floor per room. Lighting: lamps, string lights, curtains.
- **Presets/Save layouts** (3 slots) — swap quickly; "Stage for anniversary".
- **Memory Frames**: choose a Memory → frame placed on wall; photo shown; tap to view full memory + caption.
- **Surprise Mode:** placed items hidden from partner until "Reveal" (for birthdays).
- Pet items (beds, bowls, scratching post, toys, litter box) with real functionality.
- Mobile-friendly: drag with touch, bottom item tray, large tap targets.

---

## 19. Relationship Features

- **Memories**: create (title, date, caption, photo, tags), timeline view, **On this day** resurfacing, pin to house, edit/delete (either can delete own; shared ones require simple confirm).
- **Important Dates & Countdowns**: anniversary, birthdays, next visit/flight (**"Days until we meet" countdown on HUD** — huge for LDR), time-zone clock display for both.
- **Days Together** counter, milestones.
- **Love Notes** (Section 9.1), **Daily Questions** (17), **Letters** (longer, scheduled for future date — "open on our anniversary").
- **Shared Journal/Scrapbook:** photos + notes entries on a page timeline.
- **Visit Mode:** when partners meet in person, special in-game "together" status & reward (optional, honor system) + trip memory prompt.
- **Mood Check-in:** quick emoji mood each day; partner sees (optional privacy toggle). 
- **Care prompts** ("Send a hug", "Send a surprise snack to partner's mailbox").
- **Shared Weather/City:** show each other's local weather + time.
- **Support tools (light):** "I'm thinking of you 💭" one-tap ping (push + hearts animation in-world if online).

---

## 20. Notifications, Offline & Async Experience

> **Free-tier push plan:** v1 ships with in-app notifications (Realtime + badges + unread counts) and local notifications while the app is open. **Background push** is a later step: DB webhook/trigger on `chat_messages`/`love_notes`/invites → Edge Function → **Web Push (VAPID)** for web/PWA and **FCM** for the Android APK (both free). iPhone web push works only for the installed PWA (iOS 16.4+). If push is skipped, the "While you were away" summary on next open covers async needs.

| Trigger | Channel | Default |
|---|---|---|
| Partner came online / poke | push | ON (throttled, 1/hr) |
| Chat message (offline/background) | push | ON |
| Love note/mail/gift | push | ON |
| Daily question available / partner answered | push | ON |
| Pet needs (hungry/lonely) | push | OFF-by-default, max 2/day |
| Anniversary/important dates | push + in-app | ON |
| Game invite | in-world + push | ON |
- Quiet hours + per-type toggles + per-device.
- **Offline world:** pet sleeps/idles, messes capped, mailbox accumulates, daily chores generated, daily question posted. On return: **"While you were away" summary card** (pet moods, partner's last actions, new notes, spawned mess).
- **Solo mode in house:** if partner offline, player still has full activities (cook, clean, decorate, pet care) and can leave notes; some duo-only items show "Better together" hint.
- **Time zones:** each user stores IANA timezone; scheduled content uses per-user local time when personal (daily question availability) and a **couple reset time** for shared resets (chores).

---

## 21. Audio & Feedback

- Ambient house loops per room, day/night variants; footsteps by surface; UI clicks; interactions; pet sounds; reactions pings; success chimes; music playlist (lofi royalty-free; licenses recorded in `ASSETS.md`).
- Audio unlock on first user gesture (browser policy). Volume channels in settings. Mute on tab hidden.
- Visual feedback: sparkle/hearts particles, screen toasts, progress rings, subtle camera nudge (respect reduced motion).

---

## 22. Security, Anti-Abuse, Reliability

- **Supabase-specific:** RLS enabled on every table (CI test fails if any public table lacks RLS) · Tier-1 tables have no client write policies · all mutations through `SECURITY DEFINER` RPCs that set `search_path` and check `auth.uid()` · Realtime Authorization restricts channels to couple members · Storage buckets private with per-couple path policies (`couple_id/…`) + signed URLs · `service_role` key never in client/bundle/repo · Edge Functions verify the JWT · CORS limited to the Vercel domain · pgTAP tests for cross-couple access attempts on every table, RPC, channel, and storage path.

- **Authorization on every request/event:** authentication, couple membership, room membership, game membership, ownership, inventory, currency, pet actions, game results. A user must never reach another couple's private data (chat, pet, photos, wallet) by changing an ID — all queries scoped by the authenticated user's `couple_id`, never a client-supplied one. Include negative tests for each.

- Server validates **everything**: distance, state, ownership, cooldowns, inventory, currency (no negative/overflow), recipe step order, game moves.
- Idempotency keys for purchases/rewards (retry-safe). Transactions in DB for wallet changes.
- Rate limiting HTTP + sockets. CORS strict. Helmet headers. CSRF protection for cookie flows. Input length limits.
- Password hashing argon2, token rotation, device/session list.
- Error handling: user-friendly error toasts, automatic retry, crash reporting (Sentry) with PII scrubbing.
- Backups: daily DB backups; migration rollback plan.
- Logging: structured logs, request IDs, no sensitive content in logs.
- **Versioning:** protocol version in handshake; client prompts reload when server requires update; DB migrations backward-compatible during deploy.
- **Anti-farming:** daily caps/diminishing returns on rewards from repeatable social actions (cuddle, hug, chores).

---

## 23. Performance & Quality Targets

- 60 FPS on mid-range phones (render budget), initial load ≤ 5 s on 4G (code-split: auth/menus first, Phaser lazy-loaded, asset atlases, compressed textures).
- Memory: sprite atlases, object pooling for particles.
- Bandwidth: delta snapshots, quantized positions (e.g., 1/16 px ints), ≤ ~5 KB/s per client in idle scene.
- Latency feel: input→local response immediate (prediction); remote smoothing hides ≤150 ms jitter.
- **Free-tier capacity target:** one couple (a handful of concurrent connections) comfortably; design stays O(1) per couple. Track Realtime message count, DB size, and Storage use against the free quotas (Section 2.3).
- Battery: lower tick/render when backgrounded or idle; "battery saver" option (30 FPS).

### Testing Strategy
- **Standard checklist for every phase:** normal behavior · invalid behavior · disconnects · reconnects · duplicate actions · simultaneous actions · mobile controls · desktop controls · synchronization · authorization · empty states · error states. **Multiplayer pattern:** A→B, B→A, A disconnects, A reconnects, both act simultaneously.
- **Unit:** movement/collision math, pet FSM transitions, recipe validation, reward caps, game rules (TTT, C4 win detection), decay math.
- **Integration:** socket flows with 2 simulated clients (join, move, interact, cuddle, cook, clean, minigame, disconnect/reconnect).
- **E2E (Playwright, two contexts):** sign-up → pair → onboarding → enter house → see each other → chat → cuddle → arcade game → result.
- **Manual multiplayer test script** per phase (Section 24 "MP test" lines).
- **Chaos tests:** packet loss/latency throttle, tab sleep, double-connect, rapid reconnect.
- Content tests: all JSON game-data validates against schemas; every interactable has a handler; map has no unreachable interactables.

---

## 24. Phased Development Plan (Phase 0–16, with design gates)

> Each phase = its own Codex/agent prompt. **Every phase:** follow the Mandatory Workflow (Section 0), end with the Phase Completion Report, and WAIT for approval. **Design Gate** lines say what must be proposed (3 options) and approved before building.
> "MP test" = manual two-device check. Technical depth for each phase lives in the referenced sections.

### PHASE 0 — Architecture + Art Direction + Design System
*Primarily planning and design approval. Do NOT build the game.*
**Steps:**
1. **Inspect the repo:** framework, frontend/backend architecture, database, auth, dependencies, game engine, assets, config, env vars, scripts, deployment. Delete nothing; explain what exists.
2. **Recommend technical architecture** (Sections 2–3): Supabase (Auth/Postgres/Realtime/Storage/Edge) + Vercel + Capacitor APK, all free; explain the tiered-trust trade-off and Realtime message budget; keep an existing stack unless approved otherwise.
3. **Game world design** — 3 visual approaches (perspective, character/house proportions, furniture style, pet proportions, animation style, camera behavior, mobile + multiplayer readability, technical complexity).
4. **Character design** — 3 concepts (head, body, face, hair, clothes, walk/sit/sleep/hug animations, emotes).
5. **Pet design** — 3 directions for cat and dog (idle, walk, run, sleep, eat, play, happy, sad, attention, mess); recommend sprite vs skeletal animation.
6. **House design** — whole home, rooms + hallway, how players move between rooms (one physical home).
7. **Living room** (sofa, TV, coffee table, arcade, plants, shelves, decor, windows, doors; interaction locations).
8. **Kitchen** (fridge, stove, sink, counter, cabinets, dining table, trash; where co-op happens).
9. **Bedroom** (bed, wardrobe, mirror, bookshelf, lamp, decor, photos, plushies; sleep/cuddle/change/read/music spots).
10. **Bathroom** (shower, toilet, sink, mirror, laundry basket, storage; cute/non-realistic).
11. **UI** — 3 directions covering login, couple setup, house HUD, prompts, chat, emoji, emote wheel, pet status, inventory, games, shop, memories, settings.
12. **Color system** — 3 palettes (primary, secondary, accent, background, surface, text, success, warning, error).
13. **Animation language** (movement, idle, interaction, pet, UI transitions, emotes, reactions, game transitions).
14. **Sound direction** (ambient, footsteps, interaction, pet, UI, game, success, failure) — proposal only.
15. **Design document** `docs/DESIGN.md`: visual, character, pet, house, UI direction, palette, typography, animation rules, interaction rules, camera rules, mobile rules.
16. **Free-tier infrastructure spike (hello-world, no gameplay) + backend decision gate (Section 2.8):** verify on the official pricing/docs pages whether Vercel WebSockets are free on Hobby and whether Option B passes all five gate items (default stays Supabase); create the Supabase project + first migration with RLS and `is_couple_member`; Vercel project deploying `apps/web`; Capacitor Android shell producing a **debug APK**; GitHub Actions CI + keep-alive; a Realtime Broadcast ping between web and the APK proving cross-platform messaging; write `docs/FREE_TIER_NOTES.md` with current quota numbers.
**Plus:** the 18 mockups listed in Section 0.
**STOP after presenting options. No major implementation until a design is selected.**
**DoD:** architecture recommendation documented; design options presented; `DESIGN.md` drafted; live Vercel URL + installable debug APK both showing a Phaser canvas and exchanging a Realtime message; awaiting user choice.

### PHASE 1 — Accounts, Couple & Multiplayer Foundation
**Design Gate:** verify approved character, camera, perspective, colors, UI style are followed (don't invent a new style). Placeholder art allowed only if matching approved style.
**Scope:** Register/login/logout/session persistence; couple creation, invite code/link, join, membership validation (exactly 2 users) (Sections 4–5); HouseRoom per couple (`couple_id → multiplayer_room`); player state (id, user_id, couple_id, x, y, direction, animation, room, online, last_seen); WASD/arrows + virtual joystick; client-owned avatar movement broadcast with dead reckoning + interpolation, receivers clamp bounds/speed, strict message throttling within the Realtime budget (Section 3.2–3.3); Supabase Auth + RPCs for couple creation/joining; local cache module (IndexedDB + Preferences) for settings, session and last snapshot, with delta `get_house_snapshot` (Section 3.7); collision (walls, furniture, bounds) on a test map; camera follows local player while keeping partner findable (off-screen partner arrow); interaction-button placeholder; responsive viewport; connection indicator + reconnect without duplicate entities; online/offline presence; events `PLAYER_JOINED/LEFT/MOVED/STOPPED/ANIMATION_CHANGED/ROOM_CHANGED`.
**Tests:** A joins · B joins · A moves→B sees · B moves→A sees · A disconnects→B sees leave · A reconnects · both reconnect · rapid movement · simultaneous movement · collision · mobile + desktop movement.
**MP test:** 150 ms artificial latency still smooth; tab background/foreground recovery.
**DoD:** two real users enter the same room and walk around together reliably.

### PHASE 2 — Shared House World
**Design Gate:** house + furniture look approved in Phase 0 only; no random assets.
**Scope:** Full house map (Tiled): living room, kitchen, bedroom, bathroom, hallway (one continuous home; Section 6); Room/Furniture/Walls/Doors/Floor/Decorations/collision/interactable entities; reusable **interaction framework** (Section 6.5): proximity prompt on nearest object (Sofa→Sit, Bed→Sleep, Wardrobe→Change Clothes, Fridge→Open, Stove→Cook, Arcade→Play), slots, room-name toast, minimap; all required furniture per room (living: sofa, TV, coffee table, arcade, plants, shelves, decor, windows; kitchen: fridge, stove, sink, counters, cabinets, dining table, trash bin; bedroom: bed, wardrobe, mirror, bookshelf, lamp, photos, plushies; bathroom: shower, toilet, sink, mirror, laundry basket); room/object-state sync; map validation script (all interactables reachable, 2-tile doors).
**Tests:** walk every room · furniture + door collision · two players in same room · visibility · camera · mobile + desktop navigation · interaction detection.
**DoD:** two players freely explore the entire house together.

### PHASE 3 — Character System
**Design Gate:** final character art/proportions already approved; confirm outfit layering approach.
**Scope:** modular layered character (body, skin, hair, face, clothes, shoes, accessories) expandable later (Section 7); creator UI + onboarding; appearance synced live; animations: idle, walk, run (if supported), sit, sleep, hug, cuddle, wave, laugh, cry, angry, dance, clap, love; **emote wheel** (❤️ Love, 🫂 Hug, 👋 Wave, 😂 Laugh, 😭 Cry, 😡 Angry, 🥺 Please, 👏 Clap, 💃/🕺 Dance); **reactions** above character (appear → animate → brief → auto-disappear); **proximity interactions** (near: Talk, Hug, Cuddle, Wave, Emote; far: none physical); **Hug** (server validates proximity, consent prompt, synchronized animation, hearts, either can cancel); **Cuddle** contextual (sofa: sit together; bed: lie together; no unnatural teleporting — walk to slots); name tags, AFK (Sections 7, 9.2–9.4).
**Tests:** every animation/interaction synchronized A↔B; consent expiry; cancel mid-hug; disconnect mid-hug; slot contention.
**DoD:** expressive, synchronized characters; hug/cuddle work in context.

### PHASE 4 — Chat & Communication
**Design Gate:** chat panel + emoji UI style (from approved UI direction).
**Scope:** real-time text + emoji (standard emoji only), timestamps (user timezone), history with infinite scroll, typing indicator, read/unread state + badge, **message reactions** (❤️ 😂 🥺 👏), in-world chat bubbles, chat drawer over the visible world (small chat button → expandable panel) + standalone chat screen, offline delivery + basic push, rate limits, couple-scoped authorization; character emotes remain usable while chatting (Section 9).
**Tests:** A sends→B receives · B replies · typing · read state · emoji · reaction · disconnect/reconnect · history · unauthorized access (other couple).
**DoD:** instant, reliable, secure couple chat inside the game.

### PHASE 5 — Shared Pet
**Design Gate:** cat and dog final sprites/animation method (approved Phase 0); adoption screen look.
**Scope:** both users participate in adoption (cat/dog, coat, name); pet data (id, couple_id, name, species, level, xp, hunger, happiness, energy, cleanliness, bond, position, room, state); **state machine** (IDLE, WANDER, FOLLOW, HUNGRY, PLAYING, SLEEPING, EATING, BATHING, HAPPY, SAD, ATTENTION_SEEKING, MESSING) with host-client AI (Section 3.2), pathfinding, personalities (Section 10.3–10.4); stat decay with offline catch-up cap; pet actions **Feed, Play, Cuddle, Bathe, Pet, Sleep** (care objects: bowl, bed, toys, tub) (Section 10.5); **offline queue** introduced here for idempotent Feed/Water/Pet (Section 3.7); bond bonus when both interact; pet reacts to hugs/emotes; **activity history** (who fed/played/cleaned/bathed/cuddled); Pet panel + status; events `PET_MOVED/STATE_CHANGED/INTERACTION/MESS_CREATED`; opt-in pet notifications.
**Tests:** both clients see same position/animation/state/interaction; state transitions; decay math; simultaneous feed; stuck pet recovery.
**MP test:** you + partner + pet together in the house.
**DoD:** the pet feels like a third participant, identical on both screens.

### PHASE 6 — Chores & Mess (also creates the wallet ledger)
**Design Gate:** mess/trash/chore icon set + chore board UI.
**Scope:** pet messes (dog poop, cat poop, cat pee, pet food spills); house messes (living: wrappers, toys, boxes; kitchen: dirty plates, food scraps, trash, spills; bedroom: clothes, books, toys; bathroom: water, laundry); spawn director with caps (Section 11.1); interactions **Clean, Pick Up, Throw Away, Wash** (carry/dispose loop, hold-to-clean); chores: feed pet, clean pet mess, wash dishes, take out trash, clean room, laundry (solo + duo); daily chores board with reset + streak/freeze; cleanliness score (non-punishing); rewards: Paw Points, pet bond, cleanliness progress → **wallet/transactions tables introduced here**; **no double-clean** (atomic server claim); event `CHORES_UPDATED`, `OBJECT_STATE_CHANGED`.
**Tests:** simultaneous cleaning, duplicate interactions, A cleans→B sees it vanish instantly, reward granted once, offline mess cap, reset across time zones.
**DoD:** the house feels alive; chores optional, rewarding, never punishing.

### PHASE 7 — Kitchen & Cooking
**Design Gate:** ingredient/food icons, cooking UI/minigame style.
**Scope:** fridge (auto-stock), stove, sink, counter, trash, dining table; ingredients: egg, bread, tomato, cheese, milk, bacon, rice; ~5 simple recipes (e.g., Toasted Egg Sandwich, Egg Rice, Grilled Cheese) as JSON; actions get ingredient → place → use pan → stir → cook → flip → serve (no hard fail); **cooperative cooking** (role-split steps: A gets ingredient, B prepares pan, A adds, B cooks, both serve) and solo variants; dining together; completed meals give Happiness, Paw Points, couple-activity record; dirty-dishes link to chores; buffs; events `COOKING_STARTED/UPDATED`, `MEAL_COMPLETED` (Section 12).
**Tests:** ingredient sync · recipe validation · simultaneous cooking · completed meals · **disconnect during cooking** · reward once.
**DoD:** cooking is a real, synced, optionally cooperative activity.

### PHASE 8 — Bedroom, Living Room & Bathroom Activities
**Design Gate:** wardrobe/mirror UI, goodnight sequence look, TV screen look.
**Scope:** Bedroom: sleep (shared sleep state when both; pet may also sleep; Goodnight sequence), cuddle in bed, wardrobe (shirt, pants, dress, shoes, pajamas, accessories + presets), mirror (customization preview + photo mode), read, music (synced); Living room: sit, sofa cuddle, **Watch TV** (local synchronized activity; no external streaming), play with pet, arcade hook, fireplace/window/record player; Bathroom: shower, brush teeth, wash hands, laundry basket, pet bath tub (Section 13); generic **Activity engine** (Section 14) used by all of these; diminishing-returns rewards.
**Tests:** every activity synchronized; sleep requires both for shared state; disconnect mid-activity; slot conflicts.
**DoD:** cozy activities work in sync across rooms.

### PHASE 9 — Arcade & Competitive Games
**Design Gate:** arcade machine look, game selection screen, game-room scene style, result screen.
**Scope:** arcade as a physical living-room object; flow: Play Game → both get **invite** → both accept → game selection → game room → countdown → match → result → rewards → return to living room (Section 16.1); game-session framework (so new games plug in easily); RPC-validated results (turn-based in SQL; real-time games dual-reported); head-to-head stats; rematch; timeout; disconnect policy; events `GAME_INVITE/SELECTED/READY/STARTED/MOVE/RESULT/EXIT`.
**Games (implement in sub-batches; framework first):** 9a — Tic-Tac-Toe, Reaction Race, Rock-Paper-Scissors; 9b — Connect Four, Memory Battle; 9c — Target Rush, Mini Pong (first to 5), Pet Race (uses shared pet; players compete via pet-related actions).
**Tests:** simultaneous actions, disconnects, reconnects, invalid/duplicate moves, timeout, rematch, leaving game, completion, **reward duplication**.
**DoD:** complete arcade loop with server-authoritative, reliable games.

### PHASE 10 — Couple Games
**Design Gate:** question/reveal card UI style.
**Scope:** This or That, Who Knows Who, Guess My Answer, Couple Trivia (favorite food/color/activity/relationship memories), Couple Questions (deeper, not too serious), Shared Challenges (cook together, take a photo, play three games, clean the house, cuddle, pet care); question banks in JSON; private answers hidden until reveal; async-capable (Section 17).
**Tests:** simultaneous answers, reveal sync, answers private pre-reveal, async hours apart.
**DoD:** relationship games feel distinct from arcade.

### PHASE 11 — Decoration & Shop
**Design Gate:** inventory/build-mode UI, shop UI.
**Scope:** inventory categories (furniture, plants, wall decor, rugs, lighting, photos, plushies, pet items); place/move/rotate/remove with server validation (walkable path); live shared layout; couple ownership (no secretly removing shared items); **Memory Frames** (memory photo → framed on wall); presets, surprise mode; **shop** spending Paw Points (Section 15.2, 18).
**Tests:** simultaneous edits, persistence, invalid placement, purchase race conditions.
**DoD:** both see identical customized home; shop works.

### PHASE 12 — Relationship Features
**Design Gate:** memory timeline page, mailbox/love-note animation, countdown widget.
**Scope:** Memories (photo, title, date, description, optional location) + timeline + on-this-day + secure upload pipeline; Daily Question (private → simultaneous reveal); **Love Notes** (text, emoji, sticker; recipient gets animation; placed in house); **Countdowns** (next meeting, anniversary, birthday, vacation, date night; "days until we meet" HUD); **Goodnight** (each submits mood + optional message; when both complete → pet sleeps + shared daily event recorded); mailbox; mood check-in; shared weather/time; poke / thinking-of-you; letters (Sections 9.5, 19). *Must complement the game world, not become a generic relationship dashboard.*
**DoD:** LDR-specific features integrated into the world.

### PHASE 13 — Economy & Progression
**Scope:** Paw Points earning (feed/play pet, clean, cook, daily question, play/win game, challenge, save memory) with daily caps; spending (furniture, pet accessories, clothing, decorations, game cosmetics, emotes); pet XP + simple levels (non-grindy); couple level, milestones, achievements (First Meal, First Game, First Memory, Pet Parent, First Cuddle, House Cleaner, Cooking Together, Arcade Night…); house tier unlocks; **fairness: shared progression stays shared — no partner can permanently dominate** (Section 15).
**Tests:** ledger integrity, idempotent rewards, cap enforcement, concurrent purchases.

### PHASE 14 — Polish
**Scope:** polish animations (characters, pet, furniture, emotes, game/UI transitions); UI review (spacing, typography, buttons, icons, menus, notifications, chat, prompts); audio (ambient, footsteps, pet, interaction, game, UI, success/failure); transitions (entering/leaving game, opening chat/wardrobe, adopting pet, completing meal, pet reaction, receiving love note); empty states for every important screen; friendly error messages; offline chip/banner + "Syncing…" states; cute lightweight loading; accessibility (readability, contrast, button/touch sizes, reduced motion); **dedicated mobile review (not a shrunken desktop UI)**; PWA + **release APK pipeline (signing, GitHub Release, in-app update check)** + iPhone install guide, optional push (Web Push/FCM), battery saver, i18n pass, "While you were away" summary (Sections 8.4, 20, 21).
**Rule:** do not change approved architecture unnecessarily.

### PHASE 15 — Multiplayer QA (no major new features)
**Scenarios:** movement (A, B, simultaneous); interaction (both on same object); pet (A feeds, B feeds, A plays, B cleans, both interact); cooking (A starts, B joins, A disconnects, B continues, A reconnects); games (disconnects, reconnect, invalid/duplicate move, timeout); chat during house/cooking/game/disconnect/reconnect.
**Security tests (pgTAP + manual):** access another couple's rows/channel/storage path, call RPCs with another couple's IDs, write Tier-1 tables directly, modify another user's pet, modify currency, fake game result/score, replay reward idempotency keys, read another couple's chat, confirm no `service_role` key in the bundle.
**Offline/cache tests:** go offline mid-session and act (allowed vs blocked actions) · reconnect and replay queue · replay after lost response (idempotency) · stale queue entry dropped with notice · both phones feed simultaneously · cache wiped on logout/account switch · cold start renders from cache then reconciles · Android storage cleared (rebuild from Supabase) · queue cap behavior.
**Free-tier tests:** measure Realtime messages per play-hour, DB/Storage growth, behavior after Supabase project pause/resume, APK on a low-end Android phone, iPhone PWA.
**Performance:** FPS, network traffic, memory, CPU, mobile battery, asset loading.
**Reconnect:** Wi-Fi loss, mobile-data switch, browser refresh, tab backgrounding, phone sleep/wake.
**Final report:** bugs found / fixed / remaining, performance issues, security issues, recommended future work.

### PHASE 16 — Final Product Audit (inspect first; don't modify immediately)
**Review:** architecture, database, API, WebSocket, authN/authZ, game world, characters, pet, chores, kitchen, bedroom, living room, bathroom, chat, emotes, games, couple games, decoration, economy, memories, mobile, desktop, performance, security.
**UX questions:** Can a new user understand what to do? Can two users easily connect? Is movement intuitive? Can players find activities? Are interactions obvious? Does the house feel alive? Does the pet feel meaningful? Does it feel multiplayer? Does it feel like a couples game rather than a dashboard?
**Visual review vs approved design:** inconsistent colors/spacing/illustrations/animation, generic UI, unfinished assets, placeholders.
**Then:** fix critical + high-priority bugs only (no rewrites of working systems). **Final report:** completed features, remaining features, known bugs, security, multiplayer, mobile, performance, recommended next improvements. No unrelated features afterward.

### Multiplayer Test Matrix (run before release)
Movement · Interaction contention · Pet state parity · Mess cleanup parity · Cooking/duo desync · Every minigame · Chat ordering · Build-mode conflicts · Reconnect after sleep/airplane mode · Double login · Different time zones · Offline→online catch-up · Low-end phone · Poor network (3G throttling) · Partner leaves mid-activity.

---

## 25. MVP Definition (First Playable — Phases 0–9 core subset; games 9a only + one couple game)

Must include:
- Accounts + pairing + presence
- House (living room, kitchen, bedroom, bathroom, hall) with collision & interactables
- Two customizable characters, mobile joystick + desktop controls, real-time movement
- Chat, emoji reactions, emote wheel, hug/cuddle
- Cat or dog: movement, feed, play, cuddle, sleep, mess
- Chores: trash, pet mess, dishes
- Simple cooking (1–3 recipes) + eat together
- Sofa cuddle, bed sleep/goodnight
- Arcade: Tic-Tac-Toe + Reaction Race; one couple game (This or That)
- Basic push notifications, reconnect handling, settings
**Not in MVP:** decoration build mode, shop, progression, memories upload, extra minigames, house expansion, seasonal events.

---

## 26. Master Feature Checklist (track completion)

Phase 0 verified on 2026-10-02. Phase 1 completed on 2026-10-03: automated/browser/database/security checks pass; user confirmed real web/Android walking, reconnect, Away and reduced movement jitter. Interact/E hint clears after three seconds. Checked foundation items below apply to the Phase 1 scope; future world/game systems remain unchecked. Evidence: `docs/PHASE_0_STATUS.md` and `docs/PHASE_1_STATUS.md`. Phase 2 has not started.

**Design approvals (record in DESIGN.md):** [x] Perspective [x] Character [x] Cat [x] Dog [x] House/furniture [x] UI/HUD [x] Palette + typography [x] Animation language [x] Sound direction [x] 18 mockups reviewed

**Local-first:** [x] IndexedDB cache + schema versioning [x] Delta snapshot RPC [ ] Optimistic UI + rollback [ ] Offline queue + idempotency keys [ ] Offline policy table enforced [ ] Offline UX (chip/banner/syncing) [x] Cache wipe on logout
**Deploy/Free-tier:** [x] Backend gate decision recorded (Supabase vs Vercel WS) [x] RealtimeTransport abstraction [x] Two-device preview testing from Phase 1 [x] Supabase project + migrations [x] RLS on ALL tables [x] pgTAP RLS tests [x] Vercel deploy [x] Capacitor Android shell [ ] Signed release APK [ ] GitHub Release + in-app update check [x] Keep-alive cron [ ] Backup action [ ] Photo compression + quotas [ ] iPhone PWA install guide
**Platform:** [x] Auth [x] Pairing/invite [ ] Unlink/delete/export [x] Settings (Phase 1 controls) [ ] PWA [ ] Push [ ] i18n [ ] Accessibility [ ] Analytics (privacy-safe) [ ] Error reporting
**World:** [ ] Tiled map [x] Collision (Phase 1 test room) [ ] Nav grid [x] Y-sorting [ ] Doors [ ] Day/night [ ] Minimap [x] Camera
**Movement/Net:** [x] Realtime channel + Presence [x] Dead-reckoning broadcast [x] Interpolation [ ] Host-client election + handover [x] Reconnect/resync [x] SQL-side rate limits (pairing) [x] Protocol doc [ ] Latency indicator [ ] Message-budget counter
**Characters:** [ ] Creator [ ] Layers [ ] Anims [ ] Outfit presets [ ] Name tags [ ] AFK
**Social:** [ ] Chat [ ] Read receipts [ ] Typing [ ] Bubbles [ ] Reactions [ ] Emote wheel [ ] Proximity menu [ ] Hug/cuddle consent [ ] Hold hands [ ] Call over [ ] Teleport [ ] Poke [ ] Love notes
**Pet:** [ ] Adoption [ ] FSM [ ] Pathfinding [ ] Stats/decay (hunger, happiness, energy, cleanliness, bond) [ ] Personalities [ ] Feed/water/treat [ ] Play [ ] Cuddle [ ] Bathe [ ] Brush [ ] Sleep [ ] Messes [ ] Bond [ ] Activity log [ ] Accessories [ ] Tricks
**Chores:** [ ] Spawn director [ ] Pick/carry/dispose [ ] Hold-clean [ ] Dishes [ ] Trash [ ] Laundry [ ] Daily board [ ] Streak/freeze [ ] Duo chores [ ] Cleanliness score
**Kitchen:** [ ] Fridge stock [ ] Recipes engine [ ] Solo/duo cook [ ] Dining [ ] Buffs [ ] Dirty dishes loop
**Bedroom/Bath/Living:** [ ] Sleep/goodnight [ ] Cuddle [ ] Wardrobe [ ] Mirror/photo mode [ ] Reading [ ] Music sync [ ] Lamps [ ] Shower/teeth [ ] Pet bath [ ] Sofa cuddle [ ] TV together [ ] Window weather [ ] Fireplace
**Games:** [ ] Arcade flow [ ] Game room scene [ ] Lobby/invite [ ] TTT [ ] C4 [ ] Reaction [ ] RPS [ ] Target Rush [ ] Memory [ ] Pong [ ] Pet Race [ ] H2H stats [ ] Rematch
**Couple games:** [ ] This or That [ ] Who Knows Who [ ] Guess My Answer [ ] Our Questions [ ] Daily Question [ ] Bucket list [ ] Date night generator
**Decoration:** [ ] Inventory [ ] Build mode [ ] Rotate/recolor [ ] Validation [ ] Presets [ ] Surprise mode [ ] Memory frames [ ] Wall/floor
**Relationship:** [ ] Memories [ ] Photos pipeline [ ] Goodnight (mood + pet sleeps) [ ] Shared challenges [ ] Timeline [ ] On this day [ ] Dates/countdowns [ ] Days-until-meet HUD [ ] Letters [ ] Mailbox [ ] Mood check-in [ ] Shared weather/time [ ] Journal
**Economy/Progress:** [ ] Wallet [ ] Shop [ ] Gifting [ ] Pet XP [ ] Couple level [ ] House tiers [ ] Achievements [ ] Milestones [ ] Seasonal events
**Quality:** [ ] Unit tests [ ] Integration [ ] E2E [ ] Chaos tests [ ] Perf budgets [ ] Security review [ ] Backups [ ] Load test

---

## 27. Open Decisions (resolve before the relevant phase)

0. **Existing repository stack** (Phase 0): keep as-is or migrate to the Supabase/Vercel/Capacitor layout? Requires explicit approval.
0b. **Art direction selections** (Phase 0): perspective, character, pet, house, UI, palette.
0d. **Local storage tech** (Phase 1): IndexedDB only vs adding a SQLite plugin on Android.
0c. **Realtime backend** (Phase 0): Supabase (default) vs Vercel WebSockets — only if it passes the free-tier gate in Section 2.8.
1. **Email auth mode** (Phase 1): disable email confirmation vs free custom SMTP (needed for password reset).
2. **APK delivery mode** (Phase 0/14): bundled assets vs remote-URL shell; update-check UX.
3. **Realtime budget fallback** (Phase 15): if quota is tight, keep Supabase Broadcast with lower rates or add WebRTC P2P for motion.
4. **Shared wallet vs personal pockets + gifting** (Phase 6/13).
5. **Day/night:** per-player local time vs shared house time (Phase 2).
6. **Chore reset time & streak rules across time zones** (Phase 6).
7. **Pet "outside" mechanic for dogs:** door/garden vs indoor pee pad (Phase 5).
8. **Push notifications:** skip for v1, or Web Push + FCM (Phase 12/14).
9. **Backup strategy** on free plan: monthly dump action vs manual export (Phase 14).
10. **Upgrade path** if free limits are outgrown (Supabase Pro / dedicated game server) — monetization stance: none in v1.

---

## 28. Glossary
**Room** = the per-couple Realtime channel plus its Postgres rows. **Slot** = named seat/anchor on an object. **Interactable** = data-defined object a player can use. **Host client** = the elected player client that simulates the pet/real-time minigames. **Tier 1/2/3** = persistent / shared-discrete / ephemeral data trust levels (Section 3.2). **Activity** = server state machine for shared actions. **Snapshot** = full house state fetched from Postgres on join/reconnect. **Paw Points** = shared soft currency. **Duo** = needs both players. **Intent** = client's request; an RPC (Postgres) decides the outcome for Tier 1–2 data.

*End of spec.*
