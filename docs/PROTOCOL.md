# PROTOCOL

Document every Realtime Broadcast event and every RPC here, in the same change that adds it.

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
