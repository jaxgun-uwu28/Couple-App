# Phase 0 — first detailed art approval set

Date: 2026-10-02 (Asia/Manila).

Status: **REFERENCE DIRECTION APPROVED**. User accepted the revised landscape HUD ("okay that is more like it"); carry that HUD and the approved art language into the remaining Phase 0 mockups. This is not a sprite atlas, playable scene, deployment, or complete Phase 0 deliverable.

Art reference: [first art board](phase-0-first-art-v1.png), generated with the **built-in imagegen tool**, 1536 x 1024 PNG. Its portrait/top-toolbar HUD is superseded. Exact original prompts: [generation](phase-0-first-art-prompt.txt) and [targeted camera edit](phase-0-first-art-edit-prompt.txt).

Current HUD reference: [landscape HUD revision](phase-0-landscape-hud-v1.png). [Exact edit prompt](phase-0-landscape-hud-prompt.txt). User requested landscape mobile, separate floating HUD buttons, a left Chat toggle and proximity-based arcade Play. Other art choices remain unchanged. The two landscape states illustrate Chat hidden and Chat shown; they are design references, not functioning controls.

## Scope

Character, cat, dog, one sample living room, desktop/landscape mobile HUD, nearest-action prompt and fixed joystick. No whole-house art or other room mockups yet, following MASTER_SPEC Section 0's first-set approval order.

Approved selections retained: 1A, 2A, 3A, 4A, 5A, 6B, 7B, 8C, 9B, 10A, 11C, 12B, 13A, 14B, 15A, 16A, 17A, 18A. Bedroom, kitchen and bathroom selections are not drawn in this set.

## Review specification

- Orthographic top-down floor and shallow wall trim, no isometric diamond grid or side-view dollhouse. Furniture footprints and avatar feet must be readable.
- Two sample soft-chibi partners: large heads, compact bodies, distinct hair/outfit silhouettes. Their appearances are example customization choices, not fixed identities. Pose studies show standing, sitting and hugging; later production work must supply matching four-direction sprite sheets.
- Round cat and round puppy are alternative pet designs. Both appear in the study strip; only one pet belongs in a gameplay room. Standing/sleeping/expressive studies indicate personality, not a complete animation set.
- Playful apartment living room with low color-block sofa, curved table, TV, shelves/photos, plants, window, clear door into the central hall and compact arcade with two stools. Preserve a path wide enough for partners to pass and accessible seat/arcade anchors.
- Minimal Cute HUD: standalone left-side Chat icon and Settings icon, separated by space, each with its own hit area and no shared backing panel. No Home/Pet/Games top navigation or enclosing top/side toolbar. Keep You / Partner tags and object-attached action prompts.
- Landscape mobile gameplay: fixed joystick lower-left and contextual action lower-right. When near the arcade, its prompt/action reads Play. Game selection opens only from the physical arcade interaction; no global Games button. The same layout serves desktop with E and keyboard movement.
- Chat starts hidden; pressing the left speech-bubble icon shows a compact floating conversation/composer and pressing it again hides it. This is not a full-height app sidebar or a navigation panel. Keep controls independent of the conversation overlay and preserve messages/drafts across hiding.
- Camera crops the same physical room; it does not rearrange furniture or create a second map. Controls must avoid actors and doorway routes. Mobile orientation is horizontal; portrait browser entry should provide rotate guidance without relying on a native API.
- Rose & Sky remains the approved palette. Warm wood and skin/hair neutrals support it; room lighting must not silently introduce a new theme.
- Playful bounce is conveyed with grounded expressive poses; actual animation timing and reduced-motion behavior remain to be tested. Acoustic Home is documented only; no sound assets generated.

## Production and verification boundaries

Generated raster is a concept reference. Exact HUD text, touch targets, font metrics, accessible labels, control behavior and responsive camera rules must be authored and tested in the actual UI later. A drawn joystick does not establish functioning input. Static pose studies do not establish synchronized animations.

Use sprite atlases for the initial characters/pets; four directions, stable feet anchors, separately layered outfits where useful, and pages no larger than 2048 px. This follows the approved proposal; no animation library or engine dependency installed.

Inspect the output against the review specification before delivery. Record any deviations below instead of claiming a fully verified game. Do not crop, recolor or paint over generated art using programmatic image edits; request a targeted image edit if needed.

### Original art review (HUD superseded)

- Revised board inspected: overhead furniture footprints, shallow lower walls, clear central doorway, two distinguishable partners with visible feet, rose/sky sofa, curved table, TV, plants, compact arcade and two stools.
- The desktop and portrait samples show compact readable HUD labels, nearest-action prompts and separated mobile controls; static composition only, no input or touch-target verification.
- Character standing/sitting/hug poses, cat standing/sleep/happy poses, and dog standing/sleep/play-bow poses are present. They establish a reference for drawing, not a complete or frame-consistent atlas.
- The small cat figurine on the TV console survived the targeted edit. It is decorative only; the floor cat is the sole live pet. Avoid this ambiguity when authoring production room assets.
- Mobile framing is illustrative, not a mathematically exact crop or validated camera transform. Production must share the identical world coordinates and vary only camera/UI layout.
- PNG integrity verified. No font files or third-party asset pack added, and no gameplay or multiplayer verification claimed.

### Landscape HUD review

- New 1536 x 1024 PNG inspected and integrity verified. Both gameplay states are horizontal, without a top navigation strip or enclosing side HUD panel.
- Separate Chat and Settings icons share the left-side zone without a common background. The shown state uses compact individual message bubbles/composer; the hidden state retains only the icons.
- Joystick is lower-left; contextual Play is lower-right while the local avatar is near the physical arcade. Arcade has an attached Play prompt. This is the contextual Interact control in an arcade state, not a global Games shortcut.
- Room actors/furniture remain visually consistent across states. A small decorative cat figurine remains on the TV console, distinct from the sole live floor pet; omit it from production if confusing.
- Generated viewports are illustrative and extra-wide, not verified phone aspect ratios or a pixel-exact world transform. Final UI requires landscape device/safe-area testing and 44 px minimum effective touch targets.
- Actual click/touch toggling, keyboard access and proximity gating remain unimplemented in Phase 0. No game or infrastructure changes.

## Next gate

The corrected first-set direction is accepted. Prepare the remaining house and UI mockups using it, then present those concrete references for review. First-set approval does not mark Phase 0 complete.

The infrastructure spike remains deferred: no Supabase project/migration, Vercel app, debug APK, CI or realtime ping in this change. No Phase 1 work.
