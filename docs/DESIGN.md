# DESIGN — Paw & Us

Status: **ART DIRECTION AND PHASE 0 REFERENCES APPROVED — 2026-10-02.** User approved the connected home and interaction studies with "looks good proceed". These remain concept references, not finished production assets.

## Phase 2 production spacing — approved 2026-10-03

User chose **A — Balanced cottage** from the [spacing review](mockups/phase-2-layout-options.png): 64×44 tiles (2048×1408px), 32px tiles, four-tile clear central hall and three-tile room doorways. Preserve the approved arrangement, furniture styles, arcade nook, camera and independent landscape HUD. Validate actual furniture/slot reachability in the production Tiled map.

## Approved choices
- Perspective: **1A — Cozy top-down**; visible floor, shallow front walls, broad furniture footprints.
- Character style: **2A — Soft chibi**; large heads, compact bodies, clear hair/outfit silhouettes and four-direction sprites.
- Cat style: **3A — Round companion**; broad cheeks, short legs, triangular ears and curled tail.
- Dog style: **4A — Round puppy**; bean torso, short muzzle/legs and floppy ears. Cat and dog remain alternative pet designs, not two simultaneous pets.
- House layout: **5A — Central hall cottage**; one continuous home with broad hall, connected doors and paired interaction anchors.
- Living room / furniture: **6B — Playful apartment**; color-block sofa, curved table, wall shelves and playful game nook.
- Kitchen: **7B — Social island**; central island with two opposing prep anchors and wall appliances.
- Bedroom: **8C — Moonlit room**; calm bedding, warm reading lamp, wood furniture, sparse photos and plushies.
- Bathroom: **9B — Peach bath nook**; broad pastel tiles, scalloped mirror, colorful curtain and soft cabinet shapes.
- Games area: **10A — Arcade nook**; one wood-trim cabinet, two stools and game poster within the living room.
- UI style: **11C — Minimal cute, revised by user**; separate floating icon buttons with gaps, no top toolbar or enclosing HUD panel. Chat and Settings share a small left-side zone as independent buttons with no common background. Chat toggles a compact floating conversation overlay; no persistent app sidebar.
- Color palette: **12B — Rose & Sky**; primary `#DC96AE`, secondary `#9BBBD0`, accent `#D9B875`, background `#F8F0F2`, surface `#FFF9FA`, text `#342E39`, success `#416C60`, warning `#805700`, error `#A03B53`.
- Typography: **13A — Rounded sans**; Nunito proposed for labels/prose with system sans fallback; verify font licensing before including assets.
- Animation rules: **14B — Playful bounce**; restrained squash/stretch, expressive pets, short springy entrances and emote pops. Keep feet/interaction anchors stable, limit repeated bounces and support reduced motion.
- Sound direction: **15A — Acoustic home**; sparse felt piano/acoustic plucks, soft steps, ceramic taps, quiet pets, dry UI ticks and gentle game cues. Proposal only; no audio assets selected.
- Camera rules: **16A — Local soft follow**; follow own feet within bounds, small dead zone, eased doorway movement and offscreen partner marker.
- Mobile rules: **17A — Fixed corners, landscape gameplay**; horizontal game view, adjustable joystick lower-left, contextual action lower-right and safe-area margins. Chat icon sits above the joystick on the left. Portrait browser entry needs rotate guidance; do not depend on browser orientation locking. Native orientation handling is future, guarded implementation work. Desktop retains WASD/arrows + E.
- Interaction rules: **18A — Nearest action**; stable nearest eligible target, small outline, plain verb prompt and E / Interact. Near the physical arcade, show Play and use the contextual button / E to open game selection. No global Games HUD button. Paired actions use explicit requests and availability feedback.

### Coherence rules for the selected mix

- The top-down perspective and chibi/pet proportions govern every room; individual room selections do not introduce side-view or realistic art.
- Rose & Sky governs the whole home. The bathroom's "Peach" option selects its tile/fixture shapes and layout; use the approved rose pastel instead of adding a separate peach identity palette. The moonlit bedroom retains its calm composition and warm lamp with the approved sky/rose colors.
- The central-hall plan accommodates the kitchen island with clear passage around it and two opposing co-op anchors. Detailed dimensions must be reviewed in the mockup, not silently fixed here.
- The living room's playful game nook uses the selected compact arcade arrangement; no separate den or expanded games room.
- Playful bounce animates the cozy chibi world while the Minimal Cute HUD stays compact. Acoustic Home remains the selected audio direction; bouncy visuals do not imply toybox sound effects.
- "Moonlit" is a room art mood, not approval of a new day/night simulation. All unselected alternatives remain reference material; redesigning these approved choices requires asking.
- User's landscape/HUD correction supersedes the earlier portrait/top-navigation proposal. The home itself is the main screen; Home is not a navigation tab. Unchosen top-navigation entries do not remain in the home HUD. Other feature entry points will follow the relevant phase's physical objects/spec rather than being added as an unsolicited button bar.
- Chat starts hidden. Clicking/tapping its left-side speech-bubble icon opens a small floating message area and composer; repeating the action hides it. Messages/drafts are retained when hidden. Each HUD icon is independently visible and tappable, with no top strip or opaque side column behind the cluster. Accessible names and focus behavior must be implemented later.

### First detailed reference — direction approved

The [first art board](mockups/phase-0-first-art-v1.png) shows the selected characters, cat/dog alternatives and one playful living room. Its portrait/top-toolbar HUD is **superseded by the user's correction** and must not guide implementation. The [landscape HUD revision](mockups/phase-0-landscape-hud-v1.png) shows the corrected direction with chat hidden/shown and in-world arcade access. [Review notes and exact prompts](mockups/PHASE_0_FIRST_ART.md) record scope, generation method and limitations. These are concept references, not runnable UI, sprite sheets or production map geometry.

User accepted the revised landscape HUD ("okay that is more like it"). Retain this HUD and the existing approved art direction while preparing the remaining Phase 0 room/UI mockups. The rejected portrait/top-toolbar layout must not return. No architecture implementation or Phase 1 work.

### Remaining Phase 0 references — approved

[Connected-home reference](mockups/phase-0-home-v1.png) carries the selected room styles into one central-hall map, with opposing kitchen prep stations and the arcade inside living room. [Interaction studies](mockups/phase-0-interactions-v1.png) show contextual Games, Pet, Emotes, Inventory, Shop and Memories examples over the house, retaining the separate left-side HUD icons. [Coverage, prompts and QA notes](mockups/PHASE_0_REMAINING_MOCKUPS.md) map all 18 required subjects to their references. User approved these directions; geometry, sprites and responsive gameplay still need production authoring and tests. Proceed only with Phase 0's infrastructure hello-world, not Phase 1.

## Phase 0 proposals — 2026-10-02

**Proposal archive.** The user's selections above supersede the original recommendation. Selected rows are approved directions; unselected rows are alternatives only. Inspection and architecture recommendations are in DECISIONS.md; researched limits are in FREE_TIER_NOTES.md. No app scaffold, infrastructure spike, database migration or gameplay.

The subsequent user-directed landscape/floating-HUD revision overrides archived references to a top toolbar, global Games button or portrait gameplay, including those in the selected UI/mobile rows below.

Selection received: **1A, 2A, 3A, 4A, 5A, 6B, 7B, 8C, 9B, 10A, 11C, 12B, 13A, 14B, 15A, 16A, 17A, 18A**. Letters are local to each item.

### Shared constraints for every option

- One continuous physical home, navigable doorways, no dashboard or full-screen room pages. Furniture footprints remain understandable; walls fade when they hide players.
- Show two identifiable partners and one pet. Names/shapes supplement color; busy decoration cannot obscure actions. Paths allow two avatars to pass, and paired activities have two distinct standing/sitting anchors.
- Touch and desktop parity, no hover dependency. Proposal target: at least 44 px tap targets, readable body labels, adjustable joystick, safe areas, keyboard focus and visible status text. These dimensions remain subject to actual device tests.
- Four-direction characters and pets; depth sorting by feet for angled/top-down worlds. Sprite atlases recommended over skeletal rigs for the small four-direction characters and pets: predictable silhouettes, easier paired poses and fewer rigging dependencies. More frames cost drawing time and texture memory. Keep atlas pages within the spec's 2048 px limit.
- Reduced-motion mode, separate music/effects controls, no guilt-inducing pet sounds. Animations do not control authoritative rewards or timers. Text and labels remain clear over art.
- Complexity ratings below are relative art/client effort, not delivery estimates. Mobile/multiplayer statements are design expectations, not tested results. Compatibility notes describe likely combinations, not approvals.

### 1. Game world / perspective

| Choice | Appearance and proportions | Strength / limitation | Effort, animation, camera, readability and fit |
|---|---|---|---|
| A — Cozy top-down | Visible floor, shallow front walls; characters about 2 tiles tall, pet 1 tile; broad rounded furniture footprints | Clearest paths and cheapest collisions; less expressive room depth | Low–medium. Four-direction sprite walk and small bobs; bounded overhead follow. Excellent small-screen and two-player tracking. Fits chibi or pixel-inspired art |
| B — Storybook slight-angle | Orthographic floor with front faces, no isometric diamond grid; characters about 2.5 tiles tall, pets 1–1.25; low furniture backs | Warm depth and visible faces; more occlusion/sorting work | Medium. Four-direction walk, seated poses and contact shadows; softly follow feet. Strong readability with fading walls and restrained furniture. Fits chibi/soft cartoon best |
| C — Connected side cutaway | Dollhouse rooms shown from front, linked by visible hall; figures about 3 tiles tall, pets 1.25 | Best facial and hug silhouettes; depth navigation and overlapping partners need extra cues | High. Side walk plus front/back transition poses; camera tracks through a connected map. Portrait needs more horizontal travel. Fits soft cartoon; pixel art requires carefully aligned scale |

### 2. Characters

| Choice | Head, body, face, hair and clothes | Strength / limitation | Animation, effort, mobile/multiplayer and fit |
|---|---|---|---|
| A — Soft chibi | Head near half total height, compact torso, dot eyes with brows, chunky hair shapes, simple layered clothes | Clear identity and cute paired poses; subtle clothes need bold shapes | Medium. 6-frame walk, feet-forward sit, curled sleep, leaning hug; blush/wave emotes. Distinct hair/outfit silhouettes survive mobile scale. Best world A/B |
| B — Everyday cartoon | Head near one-third height, longer limbs, small nose/mouth, flowing hair and readable collars | More mature romance and expressive hands; smaller faces at gameplay zoom | Medium–high. 8-frame walk, natural sit, blanket sleep, arm-wrapped hug, expressive brows. Need a minimum on-screen size. Best world B/C |
| C — Cozy pixel-inspired | Head about two-fifths height; deliberate pixel clusters, small eye highlights, stepped hair, block-color garments | Crisp atlas and nostalgic identity; tiny face detail and equipment can disappear | Medium. 4-frame walk, 2-frame idle, dedicated sit/sleep/hug pixels; icon emotes. Integer-friendly zoom for both players. Best world A; avoid mixing textured illustrated furniture |

### 3. Cat

| Choice | Appearance / proportions | Strength / limitation | Motion states, effort, readability and fit |
|---|---|---|---|
| A — Round companion | Broad cheeks, short legs, triangular ears, curled tail; head roughly 45% of height | Recognizable at small scale; limited anatomy detail | Medium. Gentle idle/breath, padded walk, short-hop run, curled sleep, head-dip eat, paw-bat play, tail-up happy, drooped sad, paw-up attention, squat mess. Excellent beside chibi |
| B — Expressive cartoon | Lean body, long tail, large ears and brows | Strong acting; thin tail needs outline contrast | Medium–high. Ear twitches, elastic walk/run, stretched sleep, nibble eat, pounce play, bounce happy, lowered ears sad, meow attention, brief squat mess. Good mobile silhouette if ears stay broad; cartoon fit |
| C — Soft illustrated | Plump natural outline, muted fur patches, small muzzle, soft shading | Calm storybook appeal; markings can get muddy in motion | High. Minimal idle, smooth walk/run, tucked sleep, quiet eat, yarn play, slow-tail happy, still sad, look-up attention, discreet mess. Needs simplified shading at phone scale; illustrated house fit |

### 4. Dog

| Choice | Appearance / proportions | Strength / limitation | Motion states, effort, readability and fit |
|---|---|---|---|
| A — Round puppy | Bean torso, short muzzle/legs, floppy ears; slightly longer than cat, similar height | Compact and easy to distinguish; less breed detail | Medium. Idle sniff, bouncy walk, short-stride run, curled sleep, bowl eat, toy play, wag happy, lowered head sad, seated attention, brief squat mess. Excellent chibi companion |
| B — Expressive cartoon | Longer legs, big muzzle, brows and contrasting ears | Most expressive fetch/play poses; requires more room around its feet | Medium–high. Pant idle, springy walk/run, side sleep, eager eat, bow play, full-tail happy, ears-down sad, paw attention, brief squat mess. Strong paired-character readability; cartoon fit |
| C — Soft illustrated | Compact adult dog, gentle natural proportions and broad fur patches | Warm and less childish; subtle feelings require face/pose zoom | High. Breathing idle, flowing walk/run, tucked sleep, quiet eat, toy-nudge play, gentle wag happy, head-down sad, gaze attention, discreet mess. Keep outline crisp; illustrated house fit |

Cat and dog are alternative pet designs; these options do not add a second simultaneous pet. All sad states are temporary and gentle. Mess is stylized, small and readable, without realistic detail.

### 5. Whole home / circulation

| Choice | Layout | Strength / limitation | Effort, motion, mobile/multiplayer and fit |
|---|---|---|---|
| A — Central hall cottage | Living/kitchen on one side of a broad hall; bedroom/bathroom opposite; arcade nook off living room | Short routes, easy wayfinding; somewhat conventional | Low–medium. Doorway walking stays continuous; wide hall supports passing. Best A/B perspectives; clear camera handoffs |
| B — Open living spine | Living and dining form center; kitchen joins it, bedroom/bath open from a short rear hall; games alcove at entry | Partners often remain visible together; clutter needs strict zones | Medium. Seamless movement, furniture as soft boundaries. Strong landscape co-presence; portrait follows locally. Best world B |
| C — Courtyard loop | Rooms connect through a looping indoor hall around a decorative lightwell; games nook near entry | Memorable home and multiple routes; larger map and more walking | High. Continuous doors and turns, no teleport. More camera travel on phones and easier partner separation. Best world A/B; cutaway requires adaptation |

### 6. Living room / furniture

Every direction includes sofa, TV, coffee table, arcade, plants, shelves, decor, windows and doors. Sit anchors on sofa; TV/arcade approach anchors face their fronts. Keep entry-to-hall path clear.

| Choice | Appearance / placement | Strength / limitation | Effort, motion, readability and fit |
|---|---|---|---|
| A — Sunlit cottage | Low cream sofa, oak table, sage plant pots, photo shelf, compact arcade by wall; bright window | Most coherent cozy baseline; less visually unusual | Medium. Sofa settle and TV glow; low backs preserve two-player sightlines. Strong on mobile; palette A, chibi/rounded pets |
| B — Playful apartment | Color-block sofa, curved table, wall shelves, blush game nook, broad windows | Memorable play space; saturated furniture competes with avatars | Medium. Cushions squash and arcade lights pulse once. Keep large objects subdued; palette B, cartoon pets |
| C — Quiet evening lounge | Dusty-blue upholstery, dark wood, warm lamp, restrained photos and fern | Romantic evening mood; dark corners may hide pet/mess | Medium–high. Lamp fade and gentle curtains. Raise floor contrast, keep actions labeled. Palette C, soft cartoon/illustrated pets |

### 7. Kitchen

All choices include fridge, stove, sink, counter, cabinets, dining table and trash. Two co-op anchors at a counter/table remain accessible without crossing stove collision; appliance actions are clearly labeled.

| Choice | Appearance / co-op placement | Strength / limitation | Effort, motion, readability and fit |
|---|---|---|---|
| A — Cottage galley | Cream cabinets, oak worktop, sage trim; two side-by-side prep spaces, dining at open end | Simple actions and paths; modest visual variety | Medium. Chop loop, steam puff, sink sparkle; broad floor gap for partner passing. Strong mobile clarity; living A |
| B — Social island | Pastel cabinets, central island with two opposite prep anchors, wall appliances | Best face-to-face co-op; island needs a larger room | Medium–high. Passing/mixing poses and stove steam. Clearly show occupied sides; small screens need camera margin. Living B |
| C — Breakfast corner | Blue tile strip, compact wall kitchen, window table used for paired prep | Most intimate dining composition; table/prep modes must be legible | Medium. Seated eating and small kettle puff. Clear state label avoids anchor ambiguity; living C |

### 8. Bedroom

All choices include bed, wardrobe, mirror, bookshelf, lamp, decor, couple photos and plushies. Two bed anchors for Sleep/Cuddle; separate wardrobe/mirror for Change; shelf chair for Read; music spot near lamp.

| Choice | Appearance / placement | Strength / limitation | Effort, motion, readability and fit |
|---|---|---|---|
| A — Nest bedroom | Low bed centered on rear wall, cream quilt, sage wardrobe, photos beside lamp, plushies at foot | Clear paired bed positions; conventional composition | Medium. Blanket lift, cuddle lean, book page. Leave both bed sides walkable; phone-friendly. Cottage fit |
| B — Playful studio bedroom | Blush bedding, chunky wardrobe, geometric mirror, reading nook and colorful plushies | Strong customization identity; more decor can conceal access | Medium–high. Outfit reveal, shared lean, sleepy stretch. Limit shelf density, distinguish two bed anchors. Apartment fit |
| C — Moonlit room | Dusty-blue quilt, warm reading lamp, wood furniture, sparse photos and plushies | Calm romantic atmosphere; lighting needs accessibility checks | Medium–high. Lamp easing, gentle blanket and music note. Lit paths and action text preserve readability. Evening fit |

### 9. Bathroom

All choices include shower, toilet, sink, mirror, laundry basket and storage. Cute, non-realistic; actions use covered/abstracted animations. Dry central path allows two avatars; use a private-looking shower curtain without introducing a new privacy mechanic.

| Choice | Appearance / placement | Strength / limitation | Effort, motion, readability and fit |
|---|---|---|---|
| A — Mint washroom | Cream tile, sage curtain, rounded fixtures; basket beside storage | Clean actions and silhouettes; less decorative personality | Low–medium. Bubbles, towel shake, sink sparkle. Clear on phones; cottage fit |
| B — Peach bath nook | Broad peach tile, scalloped mirror, colorful curtain, soft cabinet | Charming shapes; mirrors/patterns may overfill small room | Medium. Curtain swish, small bubbles and laundry bounce. Use solid floor near avatars; apartment fit |
| C — Blue spa corner | Dusty-blue tiles, wood shelf, warm light and sparse plant | Relaxed mood; realism creep must be avoided | Medium. Tiny steam and towel flutter. Bright fixture outlines and clear floor; evening fit |

### 10. Game-room style

| Choice | Appearance / access | Strength / limitation | Effort, motion, readability and fit |
|---|---|---|---|
| A — Arcade nook | One wood-trim cabinet, two stools, wall game poster in living room | Smallest footprint; less of a dedicated games destination | Low. One ready-light change and stool sit. Both approach positions readable; cottage fit |
| B — Hobby alcove | Cabinet, small game table and tidy trophy shelf attached to hall | Supports varied games visually; adds room art | Medium. Table ready cue and gentle cabinet pulse. Keep access broad on mobile; apartment fit |
| C — Evening game den | Compact connected room with blue walls, warm ceiling light, cabinet and table | Distinct destination; more camera travel | Medium–high. Soft entry transition and ready lamp. Player names/labels stand above dark background; evening fit |

### 11. UI system (all screens)

| Choice | Appearance / layout | Strength / limitation | Effort, animation, mobile/multiplayer and fit |
|---|---|---|---|
| A — Playful rounded | Rounded buttons, solid pastel surfaces, small icon-label HUD, compact chat drawer | Approachable controls; excessive pills would compete with world | Medium. Short pressed bounce, sliding panels; pet/inventory rows stay flat. Mobile bottom sheet, desktop edge panel. Chibi/apartment fit |
| B — Cozy paper | Cream paper surfaces, restrained drawn edges, stitched selection underline, notebook memories | Strong illustrated identity; textures/frame art cost more and can reduce contrast | High. Gentle page slide; plain text fields and broad tap areas. Keep drawer narrow enough to see partner. Illustrated/cottage fit |
| C — Minimal cute | Small warm toolbar, thin separators, solid cream drawer, one accent action, paw motif used sparingly | House remains primary and labels stay readable; less decorative personality | Low–medium. Brief slide/fade with reduced-motion instant mode. Compact desktop drawer/mobile sheet; best with any selected world |

Apply each direction consistently: Login (two clear fields/actions), couple setup (create/join choice and code), house HUD (Chat, Pet, Games and Settings), interaction prompt (verb + key/tap), chat (message list/composer), emoji picker (large grid), emote wheel (labeled wedges plus accessible list), pet status (labeled needs and Feed/Sleep), inventory/shop (item image, ownership, price and one action), games (selection, Ready, Leave), memories (photo/date and note), settings (labeled toggles/sliders). Economy remains RPC-authoritative regardless of UI.

The games screen appears as a panel opened from a physical arcade/table. Inventory/shop and memories are panels over the home where practical. Offline/error/empty views preserve context and provide a clear Back or retry action. Avatar names remain visible outside panels.

### 12. Color system

All palettes use three identity colors, neutrals and functional accents. Pastel identity colors are decoration/selection backgrounds; use text token for body copy, not white text on a pastel. Success/warning/error also have labels/icons. Contrast and actual device rendering remain unverified.

| Token | A — Peach & sage | B — Rose & sky | C — Lavender & honey |
|---|---|---|---|
| Primary | #E8A18C | #DC96AE | #AAA0D0 |
| Secondary | #A5B69D | #9BBBD0 | #95ADBC |
| Accent | #D9B767 | #D9B875 | #D8B267 |
| Background | #F7F1E8 | #F8F0F2 | #F1EFF6 |
| Surface | #FFF9F1 | #FFF9FA | #FCFAFF |
| Text | #352F2A | #342E39 | #302E3B |
| Success | #41674B | #416C60 | #3E6557 |
| Warning | #805800 | #805700 | #775600 |
| Error | #A33D45 | #A03B53 | #A04151 |

- **A:** warm home/natural pet appeal, easy furniture cohesion; can feel muted. Low token effort; subtle peach/sage transitions. Strong mobile grounding and partner outline contrast. Best cottage.
- **B:** cheerful social identity and distinct outfits; avoid turning the room into competing pink/blue blocks. Low token effort; restrained rose selection. Strong labeled multiplayer accents. Best apartment.
- **C:** romantic evening tone; requires careful floor/character contrast. Medium art/light effort; warm lights against lavender. Mobile brightness must be checked. Best evening rooms.

### 13. Typography

| Choice | Appearance | Strength / limitation | Effort, motion, mobile/multiplayer and fit |
|---|---|---|---|
| A — Rounded sans | Nunito for labels and prose, system sans fallback | Friendly and legible; familiar rather than unique | Low. Static text during motion; strong names/chat at phone sizes. Best chibi/minimal UI |
| B — Humanist sans | Atkinson Hyperlegible throughout, system fallback | Clear character shapes; less playful headings | Low. No animated letters; best chat and crowded name tags. Fits any art, especially minimal UI |
| C — Storybook titles | Fraunces for short titles, Atkinson for all controls/chat | Warm editorial identity; mixed-font assets and fitting checks | Medium. Only title reveal fade; never decorative body text. Mobile labels stay sans. Best paper UI |

Font names are proposals, not downloaded dependencies. Verify licenses before including font files; use fallback fonts during initial mockups.

### 14. Animation language

| Choice | Behavior | Strength / limitation | Effort, readability and fit |
|---|---|---|---|
| A — Gentle tactile | Small idle breath, grounded walk, tiny contact squash, warm pet gestures; 120–180 ms UI slide; short emote rise and game-entry fade | Responsive without distraction; restrained spectacle | Medium sprite effort. Gestures do not displace collision feet; two-person poses stay anchored. Best mobile and world B/chibi; reduced motion disables bob/slide |
| B — Playful bounce | More squash/stretch, short idle stretch, eager pet run, springy panel entrance, emote pop and brief game reveal | Strong personality; may overwhelm shared activities | High paired-pose work. Cap repeated bounces, no constant screen shake; partner actions remain legible. Best apartment/cartoon; reduced motion uses static poses |
| C — Quiet storybook | Almost still idle, smooth walk, soft seated gestures, slow pet tail/ear acting, dissolve menus, gentle game dissolve | Calm romance; weaker feedback if everything fades | Medium–high frames. Use clear pressed/ready states despite softness; easier co-presence at rest. Best illustrated/evening; reduced motion makes transitions instant |

Movement interpolation is transport-independent. Sit/Sleep/Hug/Cuddle synchronize to database activity state later; a beautiful animation must not pretend an unconfirmed action succeeded. Reactions expire cleanly without hiding faces.

### 15. Sound direction (proposal only)

| Choice | Ambient, footsteps, interaction, pet, UI, games, success/failure | Strength / limitation | Effort, mobile/multiplayer and fit |
|---|---|---|---|
| A — Acoustic home | Sparse felt piano/acoustic plucks, soft wood steps, ceramic taps, quiet meow/woof, dry UI tick, little game chimes, warm success/unresolved neutral failure | Cozy without guilt; needs variation to avoid repetition | Medium sourcing/editing. Low transient volume and per-source cooldown; background audio pauses with lifecycle. Best cottage |
| B — Toybox charm | Light marimba, padded steps, playful pops, expressive pets, tiny UI clicks, upbeat game cue, short cheerful success/soft thunk failure | Recognizable feedback; repeated pops can fatigue | Medium. Rate-limit overlap when both act; no stereo-only cues. Best apartment/bouncy animation |
| C — Evening calm | Very sparse electric piano, room air, brushed steps, subdued object/pet sounds, nearly silent UI, mellow game tones, resolving success/neutral muted failure | Intimate and calm; quiet cues must have visible feedback | Medium. Mobile speakers require midrange clarity; mute remains fully usable. Best evening rooms |

No audio files sourced or licensed yet. Avoid recognizable songs and external streaming. Music and effects independently adjustable; browser audio begins only after a user gesture.

### 16. Camera

| Choice | Behavior | Strength / limitation | Effort, animation, mobile/multiplayer and fit |
|---|---|---|---|
| A — Local soft follow | Follow own feet inside map bounds, small dead zone, doorway easing; partner edge marker if offscreen | Predictable local control; cannot always keep both visible | Medium. No shake; panels leave local play area. Best mobile portrait and worlds A/B |
| B — Together framing | Fit both when nearby, bounded zoom, return to local follow when apart | Highlights couple moments; zoom may make sprites small | High. Slow scale changes, minimum avatar size. Phone must revert earlier; best landscape world B |
| C — Room-biased follow | Camera biases toward current room center, slides across physical doorways, local follow within large rooms | Strong room composition; crossings may momentarily push partner offscreen | Medium–high. Continuous motion, never room page replacement. Good side-cutaway; touch aiming needs camera stability |

### 17. Mobile controls / HUD placement

| Choice | Appearance / behavior | Strength / limitation | Effort, motion, readability and fit |
|---|---|---|---|
| A — Fixed corners | Adjustable fixed joystick lower-left, Interact lower-right, compact top HUD | Easy muscle memory; consumes fixed corner space | Medium. Thumb nub follows input, no decorative pulse. Keep pet/path away from control zones; desktop uses WASD/arrows + E |
| B — Floating joystick | Joystick appears within left thumb zone on touch; right Interact stays fixed | More visible world while idle; first-touch origin can surprise | Medium–high. Immediate origin feedback, safe-area exclusions. Two players remain unobscured at rest; keyboard parity unchanged |
| C — Handed layout | Fixed controls with explicit left/right-handed swap and larger adjustable zones | Best accessibility/flexibility; more layout combinations to verify | High QA effort. No autonomous movement of controls. HUD avoids thumbs across orientations; keyboard parity unchanged |

All directions support portrait and landscape, stop motion on background, and provide an accessible alternative to emote-wheel gestures. Joystick input is local; realtime remains change-driven.

### 18. Interaction prompt / selection

| Choice | Appearance / behavior | Strength / limitation | Effort, animation, readability and fit |
|---|---|---|---|
| A — Nearest action | Small outline on nearest eligible object and verb above it; E / Interact button | Most direct and least screen coverage; nearby objects need stable priority | Medium. Gentle outline onset; no pulsing. Two-player occupied anchors show status. Strong mobile and minimal UI |
| B — Object bubble | Tap object to select; small attached verb bubble; approach then confirm | More deliberate choice; extra selection step | Medium–high. Bubble tracks object without covering avatar. Clear in crowded rooms if target large; paper/rounded UI fit |
| C — Compact action tray | Nearest object label plus 2–3 plain verbs in a small bottom tray | Good multi-action objects; tray uses more world space | Medium. Short slide, stable button positions. Useful on mobile if above controls; drawer UI fit |

All actions validate range, membership and authoritative availability later. Show a friendly already-done response for simultaneous claims. Selecting a partner uses explicit Hug/Cuddle requests; proximity alone never silently starts an activity.

## Mockup approval order

First set: three low-fidelity concept previews, each containing **character + cat + dog + one sample living room + HUD/interaction/joystick**. They compare composition and proportions, not final sprites, animations or tested gameplay. These exploratory bundles do not auto-select any choice.

After that language is chosen, finish the 18 required subjects: character; cat; dog; house perspective; living room; kitchen; bedroom; bathroom; game-room style; UI/HUD; chat; emote wheel; interaction prompt; mobile joystick; game selection; pet status; inventory/shop; memory page. Some first-set subjects overlap. Do not draw the full house or mark the remaining mockups complete before approval.

## Verification and pause report

- Implemented: repository inspection, official-page quota research, pending architecture recommendations and A/B/C proposals. No game implementation.
- Files changed: FREE_TIER_NOTES.md, DECISIONS.md, DESIGN.md and CHANGELOG.md; a conversation-only concept preview lives outside the game repo.
- Database / API / RPC / Realtime changes: none. No contracts added to PROTOCOL.md.
- Tests: documentation diff/whitespace and 18-item proposal coverage. Concept preview checked in headless Edge at 736 and 320 px for all three variants: no container overflow or script errors; Chat/Back and prompt feedback work. Sample screenshots inspected; adjusted mobile pet placement to avoid the action button. No runnable game, real-device or multiplayer tests exist yet; no animation/sync claims.
- Known issues: all Phase 0 visual references are approved. Infrastructure proof is incomplete; email delivery and realtime usage require later validation. The report above describes the original proposal-stage checks, not the subsequent infrastructure test results.
- Next: finish the Phase 0 infrastructure spike and live verification. Cloud access is deferred at the user's request. Do not start Phase 1.
