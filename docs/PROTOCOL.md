# PROTOCOL

Document every Realtime Broadcast event and every RPC here, in the same change that adds it.

## Phase 3 character contracts

Manifest look contract (replaces numeric prototype catalog): `{body:string,blush:string|null,hairBack:string,hairFront:string,face:string,outfit:string,accessories:string[]}`. Every string is a manifest layer ID, validated against the matching role in server-owned `character_asset_options`; accessories are unique, max five, with no extra keys. RLS is enabled on options/defaults; clients cannot write or call validation helpers. `save_character` arguments/event payloads remain unchanged, with this JSON config as `p_appearance`. Unknown IDs, wrong roles and malformed configs return INVALID_APPEARANCE before any write. Generated catalog migration comes from the same manifest as renderer/editor. Adding files/entries requires build/catalog deployment, no code edits. Invalid legacy numeric rows are preserved but read as default with configured=false; incompatible presets are omitted until resaved.

The existing private `house:<couple_id>:cottage-v1` channel and strict motion/world contracts remain compatible. `character_changed` carries `{couple_id,user_id,session_id,request_id}` UUIDs, an invalidation only. Receivers check membership/current Presence session, deduplicate 128 IDs and coalesce reads to at most two per second. `emote` adds `emote` from `love,hug,wave,laugh,cry,angry,please,clap,dance,yawn,kiss` to that envelope; strict parsing and a per-user one-second throttle apply. Reactions expire locally after three seconds; no reaction history or idle position traffic. Late or superseded-session reactions are ignored.

Presence optionally adds `afk:boolean`. Track only at the two-minute no-input transition and first resumed input; the existing phase/map values and motion messages remain unchanged. Older Presence readers discard unknown fields. AFK shows a yawn then a sitting idle pose and sleep status in the name tag. Object invalidations also refresh characters so a seat Leave from a legacy build clears its paired action.

`get_house_characters()` derives the caller's couple and returns `{couple_id,server_time,profiles:[{user_id,configured,appearance}],presets:[{slot,appearance}],social}`. Profiles are couple-scoped; five outfit slots are caller-only. Appearance is exactly fourteen catalog indices: skin 0–7, body/height 0–2, hair 0–7, hairColor 0–11, eyes 0–5, mouth 0–3, glasses/shirt/pants/shoes 0–2, shirtColor/pantsColor/shoesColor 0–11. Missing saved appearance uses the seat default. All three tables enable RLS and authenticated SELECT only; writes use caller-bound RPCs.

`save_character(p_appearance,p_preset,p_idempotency_key)` saves the caller's appearance when preset is null, otherwise the caller's outfit at slot 0–4. `character_action(p_action,p_kind,p_request_id,p_session_id,p_x,p_y,p_idempotency_key)` supports request/accept/ignore/cancel/renew. It derives both users from the active couple, serializes with the house world lock, and permits one consent row per couple. Requests expire after eight server-clock seconds. Only the recipient accepts/ignores; accepted Hug validates a 64px radius between the sender's request position and recipient's acceptance position and refuses occupied furniture. Cuddle requires two different slots on the same sofa/bed with matching sessions. Motion positions are peer-trusted hints, never reward authority. Either bound participant cancels; each active participant renews its own 90-second lease every thirty seconds. Expiry is the shorter lease; movement, Leave, background, lost partner Presence and winning replacement sessions reconcile cancellation. A furniture Leave also removes its paired action atomically. Active paired actions block new furniture/toggle starts.

Social read fields: `{id,kind:hug|cuddle,status:pending|active,sender_id,recipient_id,sender_session,recipient_session,object_id:sofa|bed|null,sender_x,sender_y,recipient_x,recipient_y,started_at,expires_at}`. Pending recipient session/position/start are null. Mutations return `{ok:true}` or `{ok:false,code}` with plain client feedback for BUSY, OUT_OF_RANGE, NEED_SEATS, EXPIRED, NOT_OWNER, NO_PARTNER, INVALID_ACTION, INVALID_APPEARANCE and REQUEST_CONFLICT. All arguments including positions are frozen across a lost-response retry. Authoritative refresh follows every mutation; recovery rereads characters and world before play. Observed expiry triggers one read; an empty social state schedules no polling.

## Phase 2 world contracts (hosted world and private-channel checks passed)

Motion session lifecycle: the first valid frame for a newly preferred session immediately establishes its sanitized position and resets playback/display history. Same-session movement and reconnect responses retain smoothing. HouseRuntime still requires matching couple membership and the current Presence session before accepting any frame; superseded session packets cannot reset the display. Login retains the hall spawn; no persistent position RPC is added.

`cottage-v1` uses layout version 2, 2048×1408 geometry, 132px/s feet collision (user-requested 10% increase), five named room IDs and existing motion events/smoothing. `PLAYER_ROOM_CHANGED` carries the same validated full motion frame. Phase 1 geometry remains available for old snapshots/tests. Phase 2 Presence advertises `app_version: phase2`; versioned private channel `house:<couple_id>:cottage-v1` separates incompatible maps. Membership policies must authorize this exact suffix as well as the existing channel; no arbitrary topics.

Implemented by `20261003000100_phase2_house_world.sql`:

| RPC | Args | Contract |
|---|---|---|
| `get_house_snapshot_v2` | Same args as original snapshot | Always returns full own account snapshot with `cottage-v1` / layout 2, or own `none`. The original RPC remains unchanged for old APKs. Cache schema 2 excludes prior layout caches; World remounts if map changes. |
| `get_house_world` | None | Caller-derived couple UUID, ISO server time, `{object_id,enabled}[]` states and `{object_id,slot_id,user_id,session_id,expires_at}[]` unexpired slots. No supplied couple ID. Strict client schema permits at most 32 toggles and two player slots. |
| `house_interact` | `p_action: start\|cancel\|toggle\|renew`, nullable `p_object_id/p_slot_id`, UUID `p_session_id/p_idempotency_key`, finite `p_x/p_y` | Caller-bound; serialized per user/request/house. Validates catalog proximity, slot IDs and atomic occupancy. Start is one slot per player; cancellation/renewal require matching caller AND session. Toggles only fridge/lamp/TV/toilet. Other activities return UNAVAILABLE; no games/cooking/customization. Position hints are peer-trusted gameplay-only, never economy/security authority. Duplicate complete argument sets return the same result; altered arguments/key reuse returns REQUEST_CONFLICT. |

Actions return `{ok:true,couple_id}` or `{ok:false,code,couple_id?}`. Codes: REQUEST_CONFLICT, NO_HOUSE, INVALID_ACTION, INVALID_OBJECT, OUT_OF_RANGE, UNAVAILABLE, INVALID_SLOT, BUSY, ALREADY_USING, NOT_OWNER. Anonymous execute and client table writes are denied; all three new tables have RLS. Catalog is global public map metadata readable by authenticated users; couple states/slots require membership.

Slots expire after 90 seconds; active connected seated/lying clients renew every 30 seconds, and background/Leave/movement/Escape/disposal release their own session best effort. Renewals serialize with Leave and reconcile authoritative state after errors. Reconnect refreshes authoritative state. Ordinary standing idle players send no movement/object events or polling. `object_changed` strict payload contains only UUID `couple_id,user_id,session_id,request_id`; it is sent after successful start/cancel/toggle/renew and when answering recovery sync, never a state write. Receivers bind membership/current Presence session, suppress 128 duplicate IDs and coalesce refresh hints at two reads/s; recovery always reads server state even if a hint was lost. Renewal adds no motion events. Object-state leases use server time adjusted locally; observing a cached lease expire triggers one authoritative refresh to recover a missed notification. Empty world state schedules no polling.

## Phase 1 RPC contracts

Implemented only by `20261002000200_phase1_accounts_and_house.sql`; apply after the Phase 0 foundation. Anonymous execute is revoked. All write functions bind the caller via `auth.uid()`, use an empty search path and serialize caller/request-key operations; no client table writes. RLS is enabled on profiles, houses, processed_actions and invite_attempts as well as existing tables. Profiles are created by an Auth trigger; initial name is trimmed/bounded to 24 characters, timezone validated. Existing memberships/IDs are preserved and backfilled.

| RPC | Arguments | Result / rules |
|---|---|---|
| `create_couple` | `p_idempotency_key: uuid` | Pending couple with caller in seat 1 and one house. `{ok:true,couple_id}`; otherwise `{ok:false,code:ALREADY_IN_COUPLE \| REQUEST_CONFLICT}`. |
| `join_couple` | `p_code: text`, `p_idempotency_key: uuid` | Trim/uppercase/remove display hyphen; eight characters from `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`. Locks invite/couple row, inserts seat 2, consumes code, activates pair and increments snapshot version. Errors: `INVALID_INVITE` (bad/expired/consumed), `ALREADY_IN_COUPLE`, `RATE_LIMIT`, `REQUEST_CONFLICT`. Twelve distinct attempts per authenticated user/10 minutes; failures return JSON rather than SQL exceptions so throttles commit. |
| `refresh_invite` | `p_idempotency_key: uuid` | Creator of pending couple only; rotates code, invalidates old invite, expires after seven DB-clock days, increments version. `NO_PENDING_COUPLE` / `REQUEST_CONFLICT` on refusal. |
| `cancel_pending_couple` | `p_idempotency_key: uuid` | Creator of pending couple only; archives it, consumes invite and removes its one membership. Active couples cannot be cancelled with this RPC. `NO_PENDING_COUPLE` / `REQUEST_CONFLICT`. Full unlink/grace/deletion belongs to later work. |
| `get_house_snapshot` | `p_since_version: bigint = 0`, `p_known_couple_id: uuid = null` | Authenticated read derives own couple; supplied ID never authorizes access. Returns `none` (unpaired), `unchanged` (same ID and version), or `full` with version, user/couple IDs, status, house map/layout and ordered members (user_id, seat, role, joined_at, display_name). Pending creator alone receives code/expiry. Changed versions return replacement data for these small Phase 1 entities; future client versions force full snapshot. No positions, pet/economy or gameplay state. |

Write replay is retained seven days in a caller-scoped, client-inaccessible ledger. Same key/action/normalized args returns the original JSON; changing action/args or replaying another user's key returns `REQUEST_CONFLICT` without private data. Rate-limit failures are not added to the ledger. Null request keys/negative or null snapshot versions raise `22023`; null Auth raises `42501`. Invalid UUID arguments use PostgreSQL `22P02`. Deferred constraints require pending=one member, active=two and archived=zero at transaction commit; unique user and seats remain enforced. No persistent position write or offline pairing replay.

## Broadcast events (Tier 3, ephemeral)

### Phase 1 house transport

`HouseRealtimeTransport` isolates typed player messages and Presence from Phaser. The Phase 0 adapter remains available only at `?probe=1`. Both use private `house:<couple_id>` authorization; Phase 1 extends the existing policy to Broadcast and Presence. No Postgres Changes or persistent position writes.

| Event | Payload | Sender and limit |
|---|---|---|
| `PLAYER_JOINED`, `PLAYER_LEFT` | `motionSchema` | Active member/device on entry/exit; no periodic sends. |
| `PLAYER_MOVED`, `PLAYER_STOPPED`, `PLAYER_ANIMATION_CHANGED` | `motionSchema` | Active foreground device; direction/animation/velocity change plus one correction/second while moving. Moving changes coalesce at 100ms intervals, use at most nine rolling-second slots, and reserve the tenth for a stop. Combined hard cap ten motion packets/rolling second; nothing while idle/backgrounded. |
| `PLAYER_ROOM_CHANGED` | `motionSchema` | Reserved room-transition contract; Phase 1 has one collision test room and produces no room transitions. |
| `sync_request` | UUID `request_id`, `user_id`, `session_id` | Join/recover/Presence-session change. Last eight request IDs retained, no idle polling. |
| `sync_response` | UUID `request_id`, `to_session`, `player: motionSchema` | Active foreground member/device; at most one response/user/second. Only matching outstanding requests accepted. |

All Broadcast schemas are strict. Motion has UUID `user_id/couple_id/session_id`, nonnegative safe-integer `seq`, finite `x/y/vx/vy`, `direction: up|down|left|right`, `animation: idle|walk`, `room: phase1-room`, and optional finite nonnegative `motion_ms` (sender's monotonic per-session clock). These are peer claims, never authorization. Receivers require current own-couple membership and the preferred online Presence session; ignore stale/duplicate sequence values and backwards motion times, clamp bounds and velocity to 170px/s, bound ordinary corrections to elapsed speed +48px, and enforce collision during interpolation/extrapolation. Requested initial sync can seed a distant valid position; it does not grant persistent authority. Extrapolation stops after 1.4 seconds without correction.

Timed packets retain up to 32 keyframes/three seconds. A receiver-local offset estimate and 100ms playback delay preserve turn/stop order under moderate jitter without synchronizing wall clocks. Visible corrections ease at at most 1.4 times walk speed; a render step is capped at 100ms after a stalled frame, while normal 20–60fps rendering keeps pace. Legacy untimed packets use the same bounded correction easing. Away clears the timeline and freezes the rendered position. This reduces jumps; it cannot remove network delay or reconstruct packets that never arrive.

Presence payload (`presenceSchema`, strips SDK metadata): UUID `user_id/session_id`, ISO offset `joined_at`, room, `status: online|away`, `device: web|android`, `app_version: phase1`, optional `motion_clock: 1`. Send `motion_ms` only after other receiving devices advertise this clock support; otherwise omit it so the previous APK's strict motion schema remains compatible. Newest server snapshot time wins device ownership; UUID breaks equal timestamps. Losing device stops input and offers Play here; devices do not automatically reclaim control. Avatar map keys are user IDs. Absence fades partner for 30 seconds then removes it; away stops extrapolation. Foreground/re-subscribe fetches authoritative snapshot, re-tracks Presence and requests live positions. Channel cleanup is serialized per SDK client to prevent StrictMode/reconnect reuse of a channel pending removal.

Every snapshot variant includes ISO `server_time`, used to order device sessions without trusting client wall clocks. Cache uses `user_id:couple_id:schema_version`, strict snapshot validation, IndexedDB with in-memory fallback, and invalidates outstanding writes on logout/account switch. Cached world is read-only until the server and private channel recover. Native session/settings use Capacitor Preferences in app-private storage with Android backup disabled; it is not hardware-backed encryption. Web sessions use the SDK default, settings localStorage. Pairing retries reuse an intent's idempotency key after network loss; no offline action queue is introduced in Phase 1.

Device ownership is stamped once from a **fresh** RPC before Presence tracking; cached server_time cannot establish a new session's priority. Normal recovery retains that timestamp, while Play here explicitly creates a new session/timestamp. Ephemeral `lastSeen` is a receiver-local observation, never persistence/authorization. The collision step uses unsmoothed frame time with the existing 250ms cap; visual camera easing retains smoothing.

### Phase 0 diagnostic event
| Event | Sender | Payload (zod schema) | Rate limit | Notes |
|---|---|---|---|---|
| `spike_ping` | Authenticated couple member on web or Android | `spikePingSchema` in `packages/shared/src/index.ts`: UUID `id`, UUID `sender_id`, `device: web \| android`, ISO UTC `sent_at`; strict, no extra fields | Manual only, 1/s client cap | Phase 0 diagnostics. Private `house:<couple_id>`, `private: true`, server acknowledgement, no self-delivery, no persistence or offline replay. Client validates inbound/outbound and retains 128 IDs for duplicate suppression. Identity/time are peer claims, never authority; Supabase authorizes channel membership, not payload identity. No idle broadcasts. |

## RPC functions (Tier 1-2, Postgres)
| RPC | Args | Auth rule | Idempotent? | Errors |
|---|---|---|---|---|
| `is_couple_member` | `{ p_couple_id: uuid }` | authenticated; helper binds caller via `auth.uid()` in SECURITY DEFINER with empty search path | Read-only | Invalid UUID: `22P02`; anonymous execute: `42501`; false for non-member. Also used by RLS. |
| `health` | `{}` | anon or authenticated, no private data returned | Read-only | Returns exactly `{ status: "ok" }`; unavailable/paused project yields HTTP/network error. |

## Phase 0 transport and storage

`RealtimeTransport` exposes connect, join, broadcast, onEvent, onState, presence and disconnect. Supabase adapter is the sole Realtime SDK caller; no game code exists yet. Only Broadcast authorization is enabled now; Presence tracking and game subscriptions are deferred. Reconnect reuses SDK subscription recovery or the explicit Reconnect action. Token refresh updates channel authentication. No snapshot or game state exists in Phase 0.

`couples` and `couple_members` are admin-provisioned test foundations: RLS, SELECT only for authenticated own pair, no client DML. Two seats, unique user across couples. No pairing, signup or membership-writing RPC. Disable **Allow public access** in hosted Realtime settings before verification. No Postgres Changes subscriptions.

## Postgres Changes subscriptions
| Table | Filter | Used for |
|---|---|---|
