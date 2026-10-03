# Phase 3 — Character System

## Current asset plan — approved, implementation in progress (2026-10-03)

This supersedes the earlier procedural-art plan below. Read AGENTS.md, MASTER_SPEC Section 7, Sections 9.2–9.4 and Phase 3 in Section 24, plus the asset manifest/README and preview images. All 70 listed half PNGs exist and have 200x300 RGBA headers. User approved implementation and temporary pose transforms. Keep the existing stack; Phase 3 only.

1. Use unchanged half PNGs and manifest identifiers. Cache lower body/back-hair/blush and upper front-hair/face separately, with outfit between and accessories above; preserve full-canvas alignment, complementary bob/twintails pairing and bounded phone caches.
2. Adapt the shared guided Body → Face/Hair → Clothes → Review editor to the supplied catalog. Keep full-screen mobile, onboarding/Mirror at Body, Wardrobe at Clothes and five presets. Update caller-owned appearance validation/compatibility and protocol together.
3. Use supplied faces for emotes and shared portrait composition; finish Phase 3 sync, reactions, consent-based Hug/contextual Cuddle, name tags and AFK. Mark absent views/poses as placeholders using unchanged front art and activity indicators. Do not implement Phase 4 chat or claim completed final animation art.
4. Verify alignment/cache reuse, editor/presets, authorization, invalid/duplicate/simultaneous actions, consent expiry/cancel, reconnect/disconnect, two-player sync and desktop/mobile performance. After approved implementation/checks, verify matching web/APK; remove obsolete APKs only after the new deliverable is verified. Report limitations and wait for phase approval.

### Gaps

- Male body/hair/outfits are missing.
- Back/side views and animation grids are missing: walk/run, sit/sleep, hug/cuddle, wave/clap/dance and other activity poses need clearly marked placeholders.
- Three skins are supplied versus ≥8 required; no three-body-type or three-height artwork.
- Five distinct hair styles and five colors versus ≥8/≥12 required. Bob lacks matching back; twintails lacks matching front.
- Eleven combined faces; no independent eye/mouth selection, eye colors or exact artwork for every emote.
- Nine complete outfits; no independent shirt/pants/shoes or clothing color options. Footwear included in some outfits cannot be independently selected. Accessories: three glasses, flower and choker.

User confirms free-image licensing despite stale source notices. Assets are not final; do not fill gaps by editing/redrawing/recoloring. The earlier prototype/schema does not complete these art requirements.

## Earlier inspection and prototype plan (historical)

Authorized by user “we can proceed now” on 2026-10-03, after phone smoothness and login-sync rechecks. Phase 2 accepted; user selected hybrid rendering and the guided editor on 2026-10-03. Implementation and verification are in progress. Read Phase 3, Section 7 and Sections 9.2–9.4. Preserve approved soft chibi proportions, Rose & Sky, playful bounce, landscape controls and independent HUD icons.

## Repository inspection

Keep React/Vite/Phaser/Supabase/Capacitor. Current actors are placeholder Graphics with seat-based colors, four facings and simple walk bob; Sit/Sleep use authoritative furniture anchors. No modular appearance, creator, emote wheel or consent-action tables/contracts exist. Reuse phone static caching, direct joystick transforms, current motion smoothing/budget, new-session reset, snapshot/cache and activity lease framework. Final Phase 2 checks: 47 unit tests, 15 browser tests, 99 pgTAP assertions and real transaction concurrency; user verified smooth Infinix walking (~55–77+ FPS) and login sync resolution. Git clean at inspection. Retain only latest verified local APK on future releases.

## Design gate — approved 2026-10-03

User selected **1C**, hybrid cached body/hair/face with separate clothing, and **2C**, guided Body → Face/Hair → Clothes → Review, full-screen on mobile. Mirror reuses the creator starting at Body; Wardrobe jumps to Clothes. Choices recorded in DECISIONS before implementation. Proposal alternatives below remain archived.

### 1. Outfit layering

All options preserve independent body/skin/hair/face/shirt/pants/shoes/accessory choices and one shared four-direction animation grid.

| Choice | Method | Tradeoff |
|---|---|---|
| A — recommended | Compose selected layers into a cached character atlas when appearance changes; animate that atlas | Fewest ongoing draws; small composition pause on changes; bounded per-character cache |
| B | Animate each appearance layer as a separate stacked sprite | Direct edits and flexible layering; more per-frame rendering |
| C | Cache body/face/hair together; animate clothes/accessories as separate sprites | Middle ground; more layer/depth coordination than A |

### 2. Creator layout

| Choice | Layout | Tradeoff |
|---|---|---|
| A — recommended | Floating creator over the house, preview left, scrolling choices right | Keeps the home visible; fits landscape; onboarding uses the same creator |
| B | Dedicated full-screen creator with large preview and category controls | More editing room, temporarily hides the house |
| C | Small guided steps: body, face/hair, clothes, review | Less clutter per step; more taps to revise earlier choices |

The selected options above are approved. Preserve the already approved chibi proportions and HUD.

## Implementation after choices

1. Record selected compositing/appearance/consent architecture in DECISIONS before code. Define deterministic layer order, frame alignment, asset bounds, body/height variants, reduced motion and a bounded phone cache. Create aligned animation assets matching approved art; do not ship the current placeholder bodies as final art.
2. Own-character customization: ≥8 skin tones, ≥3 body types, three heights, ≥8 hair styles/≥12 colors, ≥6 eyes, ≥4 mouths, optional glasses and independent shirt/pants/shoes colors. Shared onboarding/Mirror/Wardrobe creator; ≥5 outfit presets. Server validates catalog/ownership and idempotent actions; client never directly writes appearance or shared actions.
3. Add caller/couple-scoped RLS/RPCs and versioned snapshot/contracts in PROTOCOL alongside implementation. Appearance updates invalidate authoritative reads. Consent requests expire after eight server-clock seconds; Hug/Cuddle acceptance validates both memberships, near distance and available players/anchors, then synchronizes start/end. Either participant can cancel; movement/disconnect/recovery/duplicates and simultaneous requests must reconcile safely. Position hints remain peer-trusted ephemeral motion and never reward authority.
4. Four-direction idle/walk/sit/sleep and Phase 3 expression/paired animations; emote wheel, three-second floating reactions, near-partner requests, sofa/bed Cuddle using existing slots with no arbitrary teleport, name tags and two-minute AFK behavior. Keep activity-only cooking/cleaning/game systems, item gifting/hold-hands, chat history/composer and pets for their own phases. Talk can expose availability until Phase 4; no premature chat subsystem.
5. Tests: valid/invalid appearance, own-only writes, other-couple isolation, presets, duplicate/concurrent requests, consent accept/ignore/expiry/cancel, proximity, paired animation A↔B, disconnect/reconnect/background, slots, desktop/touch/multitouch, reduced motion, phone rendering/performance and idle message budget. Preserve Phase 2 regressions.
6. Deploy matching web/APK only after checks; verify a real two-device creator/appearance/emote/Hug/Cuddle session. Verify the new APK before deleting older local APKs. Required eight-part report, then wait for phase approval.
