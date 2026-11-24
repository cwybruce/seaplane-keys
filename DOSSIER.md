# Seaplane Keys — Dossier

## The game

Seaplane Keys is a golden-hour seaplane cargo game set in the Coral Keys, an
archipelago of six islands. You fly a seaplane between the islands, pick up
cargo on the water, dodge storm cells and bird flocks, thread checkpoint
buoys, and deliver every load before the sun goes down.

- **Fly the seaplane**: throttle with ↑ / W, steer with ← →, slow down with
  ↓ / S. Speed lifts you off the water; slow down to settle back onto it.
  Take off and land on the water beside each island's dock.
- **Five-leg delivery chain**: Coral Bay → Sunset Isle → Palm Reef →
  Turtle Cay → Heron Rock → Golden Shore. Land slow on the water inside a
  dock's dashed ring to load cargo, then deliver it at the next island for
  +500 points. Finish all five legs to win, with a time bonus.
- **Hazards**: drifting storm cells (turbulence and hull damage above the
  water), bird flocks at low altitude (a strike costs 25 hull), and the
  islands themselves (clip the palms and you are wrecked). Hull and fuel are
  tracked; fuel barrels float on the water, and a rescue boat trickles fuel
  back if you run dry on the water.
- **Scoring**: +500 per delivery, +50 per checkpoint buoy and fuel barrel,
  plus a time bonus on the win. Best score is saved in localStorage.
- **Presentation**: golden-hour light, sun glitter on the water, drifting
  clouds, a following camera, a live minimap with the target ring, a HUD
  (score, deliveries, fuel, hull, speed, altitude, objective), and
  synthesized WebAudio sound (engine hum, pickup chime, delivery fanfare,
  crash thud) — no audio files, no network requests.

## Files

- `game/index.html` — page and canvas, loads the scripts below.
- `game/src/game.js` — states (menu / playing / paused / over / win),
  input, main loop, scoring, save, and the `?shot=` screenshot scenes.
- `game/src/world.js` — the archipelago: islands, docks, buoys, barrels,
  storms, birds, and their motion.
- `game/src/plane.js` — seaplane physics (speed, altitude, fuel, hull),
  cargo runs, collisions, and scoring events.
- `game/src/render.js` — all drawing: sea and sky, islands, docks, plane,
  HUD, minimap, and menus.
- `game/src/audio.js` — WebAudio synthesized sound effects.
- `main.ts` — copies `game/` and `screenshots/` to `/output` and writes
  `dossier.json` with the vendored make.fun library.
- `serve.ts` — tiny static server for local play (`node serve.ts`).
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## Screenshots

1. `1-menu.jpg` — title screen over the archipelago: "SEAPLANE KEYS",
   instructions, and PRESS ENTER TO FLY.
2. `2-fly.jpg` — airborne at 399 km/h over Sunset Isle: CHECKPOINT +50
   banner, cargo on board, HUD and minimap.
3. `3-deliver.jpg` — CARGO DELIVERED +500 at Sunset Isle: the plane on the
   water beside the dock, landing-zone ring, buoys.
4. `4-over.jpg` — WRECKED screen after clipping the palms on Sunset Isle,
   with score, deliveries, and best.

All four are real renders of the game's own code in desktop Chrome
(1280×720 JPEG, each under 256 KiB), taken with a CDP script (`shots.js`).

## Tests

- `node --check` passes on all five game scripts.
- `MAKEFUN_OUTPUT_DIR=out node main.ts` run twice: identical
  `dossier.json` (sha256 `df27ba8e…`), 355,027 bytes.
- Browser test in desktop Chrome 158: 0 console errors, 0 external
  requests (all loads are local files; the favicon is a `data:` URI).
- Kit check on the final commit: 5 passed, 0 failed.
