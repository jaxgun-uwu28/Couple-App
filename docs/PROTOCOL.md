# PROTOCOL

Document every Realtime Broadcast event and every RPC here, in the same change that adds it.

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
