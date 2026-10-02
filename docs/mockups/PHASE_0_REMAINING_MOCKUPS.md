# Phase 0 — connected home and interaction studies

Date: 2026-10-02 (Asia/Manila).

Status: **APPROVED AS REFERENCES** — user: "looks good proceed". User accepted the corrected landscape/floating HUD and these remaining references. They do not mark Phase 0 complete or substitute for production assets.

## Deliverables

- [Connected home](phase-0-home-v1.png): one continuous top-down central-hall home, showing the selected kitchen, bedroom, bathroom, living room and embedded arcade nook.
- [Interaction studies](phase-0-interactions-v1.png): six independent contextual overlay studies for Games, Pet, Emotes, Inventory, Shop and Memories. The study board is an art-review layout, not a proposed dashboard.
- Exact prompts: [home generation](phase-0-home-prompt.txt), [home correction](phase-0-home-edit-prompt.txt), [interaction generation](phase-0-interactions-prompt.txt), [interaction correction](phase-0-interactions-edit-prompt.txt). Built-in imagegen only; no paid API fallback, external asset pack or game code.

## Connected home review

The selected central hall connects Living room/Kitchen on one side and Bedroom/Bathroom on the other, through physical doorways. Living room retains the accepted sofa/table/TV language and compact arcade with two stools. Kitchen uses a social island with two opposing prep anchors and accessible appliance fronts. Bedroom uses the selected moonlit composition, warm lamp, wood furniture, sky bedding and rose accents; it does not add a day/night mechanic. Bathroom uses the selected bath-nook forms in rose tones, cute covered fixtures and a clear dry path.

Whole-home view is a design annotation, not the playable camera zoom. Gameplay stays landscape and follows the local player at a readable avatar scale. A generated map is not a Tiled file, collision mesh, navigation proof or exact tile plan. Detailed footprints/door widths/paired anchors require production authoring and review later. No second live pet or separate games room.

## Interaction study review

- Games is opened from proximity to the physical arcade and Play; selection/Ready/Leave remains a temporary overlay. No global Games shortcut.
- Pet care is shown near the pet. Food/Energy/Mood bars are illustrative labels, not an approved database schema, RPC payload or authoritative local state.
- Emote wheel is a temporary picker. Provide a labeled touch/keyboard-accessible alternative in production; avoid covering faces and movement controls.
- Inventory/Shop are item selection concepts. Prices and balances must come from authoritative RPC responses later; no economy amounts or reward rules are chosen here.
- Memories is a compact photo/note view over the still-visible house. Example artwork is fictional reference content, not imported user photos.
- The accepted Chat/Settings icons remain separate floating controls with no common panel. Menus opened intentionally can have their own compact solid surface; they do not become a persistent top/side navigation shell.
- Close/Back controls belong to the opened interaction. Hidden chat retains messages/drafts. No functioning UI, input, network, authorization or payment actions are implemented by these drawings.

## Required mockup coverage

"Reference" means a visible design study, not final sprite sheets, a tested responsive UI or a production-ready asset. This table prevents shared boards from being mistaken for 18 separately tested features.

| # | Required subject | Reference |
|---|---|---|
| 1 | Character | First art board: standing, sitting, paired hug |
| 2 | Cat | First art board: standing, sleep, happy |
| 3 | Dog | First art board: standing, sleep, play-bow |
| 4 | House perspective | Connected-home reference |
| 5 | Living room | First art and accepted landscape HUD; connected-home reference |
| 6 | Kitchen | Connected-home reference, Social Island |
| 7 | Bedroom | Connected-home reference, Moonlit Room composition |
| 8 | Bathroom | Connected-home reference, selected bath-nook forms |
| 9 | Game-room style | Accepted landscape HUD and connected-home arcade nook |
| 10 | UI/HUD | Accepted landscape HUD with independent left icons |
| 11 | Chat | Accepted landscape HUD: hidden and shown |
| 12 | Emote wheel | Interaction studies |
| 13 | Interaction prompt | Accepted landscape HUD: arcade Play |
| 14 | Mobile joystick | Accepted landscape HUD: fixed lower-left |
| 15 | Game selection | Interaction studies |
| 16 | Pet status | Interaction studies |
| 17 | Inventory/shop | Interaction studies, two examples |
| 18 | Memory page | Interaction studies |

Login, couple setup and Settings directions remain described in DESIGN.md. No authentication screens or real account actions are implemented here.

## QA and remaining work

Inspect each generated reference for approved style, readable paths/controls, prompt text and contradictory UI. Verify PNG integrity and document links. Log deviations explicitly; any image requiring changes must be edited with imagegen rather than painted/cropped programmatically.

### Completed reference review

- Connected-home PNG: 1536 x 1024. One central hall links the four selected rooms; arcade remains inside living room. Kitchen island corrected to put the rose/sky stations on opposing edges with two preparation boards. Approved room forms and palette are visible. Final walkability, collision footprints, door widths and anchor positions require Tiled/game validation.
- Interaction PNG: 1774 x 887. Six independent contextual studies with readable titles/actions; no top navigation bar or enclosing side HUD rail. Corrected the purple pet button to sky blue and changed invented numeric shop prices to placeholders. Each menu is shown separately over a visible house, not six simultaneous panels in a product dashboard.
- Character/pet designs remain visually coherent with the accepted first set. Small cat figurines still appear as decoration; the floor cat is the sole live pet. Remove confusing figurines during production art authoring.
- Thumbnail UI studies emphasize the opened overlays and omit complete movement-control composition. They do not prove mobile safe areas, touch sizes, emote-wheel accessibility, pause behavior or exact camera geometry. Retain the accepted fixed landscape controls in production and test their overlap with each overlay.
- PNG integrity and documentation whitespace checks passed. No sprite frames, game scripts, executable UI, database or networking added. Generated art is reference material only; all functional/authorization/sync tests remain unrun.

Art review does not replace normal/invalid/disconnect/reconnect/duplicate/simultaneous/mobile/desktop/sync/authorization tests when the game exists. Those remain unrun because there is no application yet.

Next: present these references for review. Phase 0 infrastructure proof remains deferred (Supabase migration, Vercel hello-world, debug APK, CI, private cross-platform Broadcast ping). Do not tag Phase 0 done or start Phase 1.
