# Phase 2 — Shared House World

Authorized 2026-10-03. Phase 1 is complete/tagged. Read Phase 2 and Section 6 only, plus approved DESIGN and current implementation. Scope: one continuous five-room home, required furniture, collision/doors, room triggers, minimap, reusable nearest-object interaction/slots and authoritative shared object state. No Phase 3 creator/emotes/consent, pets, cooking recipes, real games, decoration shop or economy.

## Repository inspection

Keep React/Vite/Phaser/Supabase/Capacitor and the working Auth, pairing, scoped cache, Presence and clock-negotiated motion smoothing. Current room/furniture are hard-coded Phase 1 geometry, map/room schemas accept only `phase1-room`, and the Interact/E prompt is a three-second placeholder. No production Tiled map, tile atlas, house interactions or shared object-state tables exist. Git tree was clean at phase start. Tiled was absent from PATH and the standard Program Files locations checked; do not claim a map was drawn/validated in Tiled yet.

## Design gate — A approved 2026-10-03

Preserve the approved central-hall topology: Kitchen upper-left, Bedroom upper-right, Living Room lower-left, Bathroom lower-right, arcade in Living Room. Art remains cozy top-down, soft chibi and Rose & Sky with independent landscape controls. The approved reference is not a walkability proof; DESIGN requires production dimensions to be reviewed.

See `mockups/phase-2-layout-options.png` / editable SVG. These are documentation diagrams only, not playable maps/assets. Same tile drawing scale and furniture footprints in all options:

| Choice | Map | Hall clearance | Doors | Tradeoff |
|---|---|---|---|---|
| A — recommended | 64×44 tiles / 2048×1408px | 4 tiles / 128px | 3 tiles / 96px | Balanced room scale and passing space |
| B | 56×40 / 1792×1280px | 3 tiles / 96px | 2 tiles / 64px | Shorter walks, tighter clearances |
| C | 72×48 / 2304×1536px | 5 tiles / 160px | 4 tiles / 128px | More passing/decor space, longer walks |

User chose A. Proceed with production map authoring and Phase 2 implementation. No new art direction, room arrangement or HUD redesign is proposed.

## Implementation sequence after choice

1. Record architecture/rollout decisions in DECISIONS before changes. Author the selected production map in Tiled with 32px tiles, room/wall/floor/door/collision/navigation/interaction/slot/spawn layers, then export and validate before implementing game integration. Tiled's official JSON/CLI formats support source maps and repeatable exports: [JSON format](https://docs.mapeditor.org/en/stable/reference/json-map-format/), [export documentation](https://docs.mapeditor.org/en/stable/manual/export/). Use official Tiled tools; no substitute editor or claim of manual authoring without evidence.
2. Create consistent custom furniture/room art from approved references; no random downloaded assets. Verify footprints, depth/occlusion and mobile readability. Use a data-driven house definition for shared collision, reachable anchors and interaction eligibility; preserve current input/smoothing rather than rewriting networking.
3. Additive RLS/RPC migration for authoritative shared interactions/object states, atomic slot contention, caller binding, idempotency, cancellation and disconnect recovery. Expand snapshots/contracts in PROTOCOL in the same change. Peer-owned position hints remain sanity-clamped, never economy authority. Plan versioned map/client rollout so old test-room clients cannot mix geometry or overwrite shared state.
4. Implement doors/proximity, room-change events and short room toast, nearest eligible outline/verb prompt (E/Space/tap), slots/cancellation and independent minimap toggle. Basic actions expose the framework; future cooking/games/character features remain unavailable. No global Games button, toolbar or app dashboard. Preserve the three-second transient hint behavior. Day/night simulation is not included by the approved room-art mood; defer new major lighting choices until explicitly proposed.
5. Validate all named room/player/pet spawns, navigation grid and reachable interactables, door clearance, non-overlapping collision/anchors, required furniture, IDs and map bounds. Test keyboard/touch route through every room, two players crossing doorways, camera/occlusion, nearest selection, empty/busy/error states, duplicate/simultaneous slot actions, authorization, room/object sync, disconnect/reconnect and native recovery.
6. CI/hosted additive verification, deploy web and matching APK, real two-device full-house exploration. Update checklist and required eight-part phase report, tag only after DoD, then wait for Phase 3 approval.

Current status: selected A authored/exported in official Tiled 1.12.2 and validated. Full-house client, custom vector furniture, map-aware movement, minimap/room prompts and RPC-controlled interactions are implemented. Hosted additive migration applied; 28 world/security assertions passed with rollback-only fixtures. Final browser regressions, private-channel checks, CI/concurrency, deployment, matching APK and real web/phone exploration remain before completion. Phase 2 is not complete.
