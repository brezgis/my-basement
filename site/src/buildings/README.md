# Making a building

Each building of the school is one file in this folder:

    // site/src/buildings/snow.js
    export default function (b) { ... }

It is called once at start-up with `b`, which has everything a building is made with. Nothing in a building
file runs per frame unless you ask for it with `b.later`. The file to start from is the placeholder that
already has your building's name (`snow.js`, `library.js`, `stone.js`): replace it whole. It is already
wired in; you edit nothing else. `example.js` is a small complete building (brick, two storeys, a stair, a
gable roof) and `selftest.js` a second (stone, a round end under a half cone, a porch tower under a
pyramid, paired glazed doors): read `example.js` first. The best large example of the same way of working
is `~/projects/my_house/site/src/house.js` (a real house from drawings); what it does with its own
`wall`, `surf`, `room` and `B.pbox` you do here with `b.wall`, `b.surface`, `b.room` and `b.box`.

Units are feet throughout.

## Your coordinates

    X   left to right, as you stand outside facing the building's entrance front
    Y   from the entrance front (0) back into the building
    h   height above the building's own ground line (the grass at its walls is h = 0)

You never use world coordinates. Where the building stands, which way it faces and how high its ground is
are in the site table in `../campus.js` and are applied for you: the same file works facing any of the four
ways (try `?facing=stone:north`). Because walls and colliders are boxes square to the axes, a building
stands square to the island, and so does everything in it that is a wall, a floor or an obstacle; only
roofs, round ends and raw geometry are free of that.

`b.site` is your row of the table:

| id | `b.site.W` x `b.site.D` (allowance) | `b.site.door` | ground | faces |
|---|---|---|---|---|
| `snow` | 120 x 96 | `[68, 0]` | 8 | south |
| `library` | 140 x 100 | `[17.65, 0]` | 1.5 | east |
| `stone` | 45 x 35 | `[30, 0]` | 3 | west |

The allowance is the rectangle X 0 to W, Y 0 to D that the land is levelled for: keep the building's walls
inside it (steps and stoops may come forward of Y = 0 by a few feet; eaves may overhang). `door` is where the
path arrives: put your main door there, in the wall at Y = 0 (the path ends about 7 ft in front of it). If the
real building's door is elsewhere along the front, or the building needs more room, ask for the site table
to be changed (see Rules): do not move the building to suit.

## What `b` has

Angles are in degrees, measured in plan from +X toward +Y (0 points right along the front, 90 points into
the building). Materials are given by name (see Materials). "Plan box" always means
`X0, X1, Y0, Y1, h0, h1`.

### Raw geometry

- `b.box(mat, X0, X1, Y0, Y1, h0, h1, opts)` a box. `opts`: `{ grain: 'long' }` for boards (the texture's
  grain follows the longer side of each face), `{ swap: true }` swaps the texture's two directions,
  `{ rot: [rx, ry, rz] }` turns it about its own middle (radians, in the building's three.js space, below),
  `{ collide: true }` makes it an obstacle.
- `b.cyl(mat, X, Y, h0, h1, rBottom, rTop, segments)` an upright cylinder or cone frustum.
- `b.block(X0, X1, Y0, Y1, h0, h1)` an invisible obstacle.
- `b.mesh(mat, geometry)` any three.js `BufferGeometry` you build yourself, in the building's three.js
  space: **x = X, y = h, z = -Y**. It needs `position`, `normal` and `uv` (give `uv` in feet, so the
  material tiles at its true size); other attributes are dropped. This is how to make anything the
  functions below do not: carved or moulded stone, a turret's corbelling, a dormer's cheeks.
- `b.prism(mat, [[x, y], ...], z0, z1)` an outline in the three.js x-y plane (X and h) extruded along
  three.js z (so from Y = -z1 to Y = -z0).
- `b.B` is a full engine Builder in your coordinates (`pbox`, `pcyl`, `prbox`, `prism`, `mesh`, `block`):
  code written for `house.js` runs on it unchanged. `b.G` is `{ grain: 'long' }`.

All geometry is merged by material into one mesh per material for your building, so a thousand boxes of
limestone are one draw call. That is the whole performance model: few materials, any number of pieces.

### Walls

    b.wall({ ax, c, a, b, h0, h1, t, fl, neg, pos, opens, trim, wood, sash, base, outside })

- `ax: 'X'` the wall runs along X, its middle at `Y = c`; `ax: 'Y'` it runs along Y at `X = c`.
  `a`, `b`: where it starts and ends along its axis. `h0`, `h1`: bottom and top. `t`: thickness (default 1.5).
- `neg`, `pos`: the material of the face toward lower / higher coordinate (for `ax: 'X'`, `neg` faces -Y, the
  front). When the two differ the wall is two leaves back to back. A face whose material begins `plaster`,
  `ceil`, `painted_wood`, `fir`, `oak_light`, `tile_subway` or `c#` is taken to be a room's wall; if exactly
  one face is such, the other is the outside of the building. `outside: 'neg' | 'pos'` says so explicitly.
- `fl`: the floor level the openings and the skirting are measured from (default `h0`). Give it when the wall
  starts below the floor, e.g. a ground-storey wall from the ground (`h0: 0`) with the floor at `fl: 4`.
- `trim`: the stone of sills, lintels and arch rings outside (default `limestone_smooth`). `wood`: door frames
  and the casings inside (default `fir`). `sash`: window frames and bars (default `sash`). `base`: the
  skirting on plastered faces (a material; `false` for none).
- `opens: [{ kind, at, w, sill, head, ... }]`, each from `at` to `at + w` along the wall (absolute, like `a`
  and `b`), from `sill` to `head` above `fl`:
  - `kind: 'win'` a window: frame, glass, `n` lights side by side (default 1), each divided by
    `bars: [across, up]` (default `[1, 2]`: one bar across the middle). Nobody walks through it.
  - `kind: 'door'` a panelled door, `'gdoor'` a glazed one. `hinge: 'a' | 'b'` the end it is hung at,
    `swing: 'neg' | 'pos'` the side it opens toward, `angle` how far (default 1.62), `leaves: 2` a pair,
    `fixed: true` never opens. Visitors open and close it with E. Doors in an outside wall start shut;
    doors between rooms start open (`inside: true` makes an outside-wall door behave as an inside one).
    The leaf is made of the wall's `wood` (dark fir if the wall names none); `leaf: 'c#5a4332'` on the opening gives it another
    material. The two leaves of a pair open and close together.
    **Which door** is `style:` on the opening (the leaves are made by `../doors.js`; its `STYLES` table is the list):
    `'four'` (the common four-panel door; the default indoors), `'five'` (two tall panels over a cross panel over two
    small), `'six'` (the default in an outside wall), `'three'` (one leaf of a six-panel pair, heavy), `'eight'`,
    `'ten'` (a heavy outer leaf, two panels by five), `'ladder'` (five cross panels), `'half'` (half-glazed, six
    lights over two panels: the default for a single `gdoor`), `'frosted'` (the same with obscured glass), `'light'`
    (one large light over two small panels), `'french'` (a glazed leaf with a panel at its foot: the default for a
    `gdoor` pair), `'ledged'` (ledged and braced boards, strap hinges, a latch: cellars and stores); or an object
    like an entry of that table. Panels are raised and fielded in bolection mouldings; every leaf has a knob on a
    rose with a keyhole plate on both faces, butt hinges and a lock's edge; one leaf of a pair carries the astragal
    that covers the joint. `kick: true`, `push: true` add brass plates; `metal: 'brass' | 'bronze' | 'iron'`.
    `doorstyle:` on the wall changes the default for its doors.
    **An open leaf is solid** where it stands (a collider of its own, `d.box`, which the walker and the robots both
    meet), so leave floor for it: a leaf swings through a quarter circle of its own width on the side it opens to
    and comes to rest square to the wall at its hinge. A swinging leaf never moves into anybody: it waits (and,
    opening toward the visitor, eases them back, once `life.attend(walker)` has been called).
    `transom: true` (or a height) stops the leaves at 6.9 ft under a bar with a fixed light over it, in the same
    opening: for corridor doors where the storey is tall. Under an arch, `headBars: 3` divides the glass of the
    head into three lights (or `[0.15, 0.85]`: where the bars stand), and `dentils: true` puts a dentil course on
    the frame's head outside.
  - **Doorcases** are made for you on every room's face of a door or cased opening: an architrave 0.36 wide in three
    members on plinth blocks, and over a flat head (where the wall goes on at least 0.45 ft above it) `case:`
    `'cornice'` (the default: frieze, bed mould and cap, 0.68 high in all), `'blocks'` (corner blocks with roundels)
    `'plain'`, or `'jambs'` (nothing over the head: where a ceiling comes down within 0.4 ft of it); `doorcase:` on the wall sets it for the wall. Nothing of a case reaches more than 0.39 ft beyond
    a jamb below the head, so a plate or a notice hung beside a door should start 0.45 from the jamb or more.
  - `kind: 'cased'` an opening with nothing in it.
  - `arch: true` a round head (a semicircle on the full width; `head` is the crown); `arch: 1.2` a segmental
    head rising 1.2 ft. A window's glass and frame follow the curve; a door's leaf stops at the springing with
    fixed glass above.
  - `trim: false` no sill, lintel or casing on this opening; `trim: 'brownstone'` another stone.
  - **Thresholds are made for you.** Every door and cased opening whose `sill` is 0 gets a threshold: one piece
    from jamb to jamb, the wall's thickness and 0.06 ft more on each side, standing 0.05 ft above the floor; the
    wall under it stops 0.2 ft below the floor, so nothing lies in the floor's plane in a doorway whatever floors
    run in under the wall (or stop short of it), and there is always something to stand on. It is the wall's
    `trim` stone in an outside wall and its `wood` indoors; `threshold: 'oak_light'` on the opening for another
    material (a doorway that is really indoors in a wall that counts as outside), `threshold: false` for none.
    **Do not add saddles or sills of your own inside the wall's thickness**; a sill that stands out in front of
    the wall (over a base course, onto a stoop) is yours: stop it at the wall's face, 0.02 ft lower.
- Walls collide; every opening is recorded as a portal for you (see Rooms).

Rules for walls:

- **One storey per call.** Openings in one call must not overlap along the wall, so a wall with windows on
  two floors is two calls (as in `example.js`: `s1`, `s2`).
- **Corners: one wall runs through, the other butts into it.** Never let two walls overlap. Run the front
  and back the full width (`a: 0, b: W`) and the sides between them (`a: t, b: D - t`). Where a two-leaf
  wall ends free at an outside corner, the outside material is turned round the end for you; where it butts
  into another wall (or a round one) nothing is cut. Walls are built together when your function returns,
  so the order you call them in does not matter.
- Keep openings at least a wall's thickness from the wall's ends.
- A projecting band (water table, string course, cornice) is a `b.box` standing proud of the wall by an inch
  or so: never in the wall's plane.

**Round and polygonal walls**:

    b.arcWall({ X, Y, r, from, to, n, h0, h1, t, fl, out, in, trim, sash, opens })

Centre `(X, Y)`, radius `r` to the middle of the wall, from angle `from` to `to`, in `n` flat facets (12 for
a half-round end reads as round; 3 or 5 makes a polygonal bay). `out`, `in`: the materials of its two faces.
`opens: [{ i, sill, head, margin }]` puts a flat-headed window in facet `i` (0 is the first from `from`),
`margin` feet in from each end of the facet (default 0.5). There are no doors and no arched heads in a round
wall: build those by hand. A straight wall that runs into the round one should end exactly where the round
wall's middle line begins (see `selftest.js`).

### Floors, ceilings, stairs

- `b.floor(X0, X1, Y0, Y1, h, { mat, thick, under, holes, swap, surface })` a floor whose top is at `h`:
  boards (`mat`, default `floor`) on top, the ceiling of the room below (`under`, default `ceil`; `null` for
  none) beneath, `thick` deep in all (default 1), and somewhere to stand. `holes: [[X0, X1, Y0, Y1], ...]`
  are left open for stairwells and recorded as openings to see through. Keep floors and ceilings about
  half a wall inside the outer faces of the outside walls (as `IN` in `example.js`): run out to the face,
  their edges flicker against the masonry.
- `b.ceiling(X0, X1, Y0, Y1, h, { mat, thick })` a ceiling whose underside is at `h` (under a roof).
- `b.floorArc({ X, Y, r, from, to, h, mat, thick, under, n, surface })` the floor of a round end.
- `b.stair({ ax, from, to, lo, hi, h0, h1, steps, mat, closed })` one straight flight you can walk, along
  axis `ax` from `from` (at height `h0`) to `to` (at `h1`); `lo`..`hi` is its width across. `steps` defaults
  to risers of about 7.5 in. `closed`: the material filling the space underneath (default `plaster`; `null`
  leaves it open). Give it from the foot up or from the head down, as you like.
  **The last run of a flight is the landing's**: the flight makes N risers and N - 1 treads, and the floor or
  landing above must come forward over the last run (a hole in the floor stops one run short of `to`). If it
  cannot (a hole as long as the flight, a stone stoop), say `top: true` and the flight makes its own top tread.
  `b.steps({ ... })` is the same in solid stone, for outside: solid under every step, the last included, and
  standing 3 ft **into the ground** (`foot`), because the land is only level for about 5 ft round a building.
  Carry cheek blocks, stoops and anything else beside outside steps down below h = 0 as well (to -3).
  A stair is treads, risers and a slope to walk on. **You add**: the landing at the top and bottom (floors),
  the hole in the floor above (`holes`), rails (`b.rail`, next), a `b.block` along any open side that has no
  rail so nobody steps off it, and guards round the well upstairs. Stairs with
  landings are several flights with `b.floor` or `b.box` + `b.surface` between them. **Winders, curved and
  spiral stairs do not exist**: build the treads from geometry and give the walker a series of small
  `b.surface` steps (each no more than 1.3 ft above the last).
- `b.rail({ ax, from, to, at, h0, h1, steps, mat, height, ends, foot, string, bal, per, w, d, newel, bw, block })`
  a handrail that meets what carries it, level (leave `h1` out) or raking: along `ax` from `from` (where the
  floor, or the pitch line of a flight, is at `h0`) to `to` (`h1`), at `at` across. Give it the same `from`,
  `to`, `h0`, `h1` and `steps` as the flight it serves. It is cut to the true length of the slope, runs into a
  newel post at each end, and stands on balusters: on the treads when `steps` is given (`per` to a tread,
  default 2; 0.5 is every second tread), otherwise every `bal` ft (0.45; 0 for none). `height`: the rail's top
  above the floor or pitch line (2.9). `ends: ['post', 'wall']`: what each end does: `'post'` a newel (the
  default), `'wall'` runs 0.1 ft on into a wall or another rail's post, `'none'` stops. `foot`: how far the
  newel at `from` goes down below `h0` (outside: 1.5, into the ground). `string: true` adds a string board
  closing the ends of the treads of an open flight; it is centred on the rail and `sw` thick (0.11), and must take
  in the treads' ends: with the rail set 0.07 in from the flight's edge, give `sw: 0.2`, or the ends of the treads
  stand out through its face. It stops the walker (`block: false` if something else
  does). **Use it instead of turning boxes by hand**: every hand-made rail in the first three buildings was the
  wrong length for its slope, or stopped short of its posts, or stood on nothing.
- `b.surface(X0, X1, Y0, Y1, h)` somewhere to stand at height `h` (a stoop, a landing, a gallery).
  `b.ramp(ax, u0, u1, lo, hi, h0, h1)` a slope to walk on, with no geometry.

The walker is 1.44 ft wide and 5.7 ft tall, steps up 1.3 ft, and is stopped by any obstacle between 1.4 and
5.7 ft above their feet. So: doorways at least 2.6 wide and 6.5 high, 3 ft clear in front of every door on
both sides, stair flights at least 3 ft wide, and nothing lower than 6.5 ft over a stair.

### Rooms, light and what is drawn

- `b.room(name, X0, X1, Y0, Y1, floor, ceil, opts)` a room: the plan rectangle of its **inside** (wall face
  to wall face), its floor level and its ceiling height (both are heights `h`, not differences). The name is
  the caption while a visitor stands in it; whatever is in it later (furniture) is drawn only when the room
  can be seen; and its volume is lit as indoors (no open sky, a warm room light, lamps after dark).
  **Every space you can walk into needs a room**, or it is lit as if it stood outdoors. An L-shaped room is
  two `b.room` calls with the same name. Rooms must not reach outside the walls (standing in that part
  outdoors, the island would not be drawn). A stair hall that rises through two storeys is two rooms, one
  on each floor; `b.floor`'s `holes` joins them.
  `opts`: `{ light: false }` records the room without lighting it (when you light a whole storey at once,
  below); `{ pad }` how far the lit volume reaches into the walls (default 0.3: keep it less than half your
  thinnest outside wall); `{ over }` how far the room's own box reaches above its ceiling (default 0.6).
- `b.roomArc(name, { X, Y, r, from, to, floor, ceil, t })` the round part of a room (`r` to the wall's inside
  face, `t` the wall's thickness). Give it the same name as the rest.
- `b.interior(X0, X1, Y0, Y1, h0, h1, { floor, ceil })` a volume lit as indoors, with no room: for a whole
  storey at once, a passage, a closet, a tower stair. The count matters: every lit volume is a test in every
  pixel's shader. **Aim for no more than about 16 per building**: in a big building, light each storey of
  each wing with one `b.interior` and give its rooms `{ light: false }`.
- Openings in walls (`opens`) and holes in floors are recorded as portals automatically. For any other gap
  one can see through (an open gallery, a screen of columns between two rooms): `b.portal(X0, X1, Y0, Y1,
  h0, h1, n, kind)`, a thin plan box across the gap, `n` the axis that crosses it (`'X'`, `'Y'` or `'h'`).
- `b.lamp(X, Y, h, { power, kind, halo })` a light. `kind: 'lamp'` (default) comes on at dusk; `'candle'`
  flickers; `'fill'` is invisible daylight bouncing round a room, by day only. `power` about 0.5 to 1.2.
  Only four lights shine at once (the nearest, the room you are in first), so be sparing: about one lamp and
  one fill per room. `b.fill(X, Y, h, power)` is the fill.
- Fittings you can see come from the furniture kit: `b.kit.ceilingLight(b.fr(X, Y, floor), 0, 0, ceil - floor,
  { kind: 'schoolhouse' | 'lantern' | 'bowl', lit: true, drop })`, `b.kit.sconce(...)` (see `../kit/README.md`).
  `b.fr(X, Y, h, q)` is a kit frame in your coordinates (`q` quarter turns: 0 faces +Y, 1 faces -X, 2 faces
  -Y, 3 faces +X). **No furniture yet**: lamps only, for now.

### Finishes: what each room's walls, floor and ceiling are made of

    b.finishes({ 'Room 103': { wall, dado: [height, mat], rail, frieze: [height, mat], picture, floor, ceil, beams, datum }, ... })

One table for the building, keyed by the names given to `b.room`, near the top of the file, so that the whole
scheme can be read and changed in one place (`snow.js`, `FINISHES`, is the worked example). Call it once, anywhere
in the building function; it returns `false` when the page was opened with `?finishes=0`, which shows every room in
the building file's own materials, for comparing. Nothing is laid on anything: the finishes are built into the walls
and floors when they are made, so no face moves and nothing shares a plane.

- **Walls.** Every wall face that the building file declares as `plaster` (or a tint of it) and that looks into a
  room in the table is made of that room's finish instead: `wall` the field; `dado: [3.4, mat]` the wall below 3.4 ft
  above the room's floor; `frieze: [12.9, mat]` the wall above that height. A dado gets a rail and a frieze a picture
  rail, in the wall's `wood` (`rail:` / `picture:` another material, or `false` for none); each stops inside the
  casings of any opening that crosses its height. A wall between two rooms becomes two leaves, each room's own; a
  wall two storeys high is cut where one room gives way to the next. `datum:` measures the dado and frieze from
  another height than the room's floor (a raked lecture room). Wall colours should be tints of `plaster`
  (`'plaster#a3b08f'`): all of them are one mesh, and they are lit as indoors under a slope.
- **Floors and ceilings.** `floor` replaces the boards of `b.floor` under the room, `ceil` the underside of the floor
  above it (or of a `b.ceiling`): each floor is cut to the rooms, a piece going to the nearest room at that level
  within 1.8 ft, so a room's floor runs in under its walls to the thresholds and out into its bays. `floor` may be
  `{ tiles: [size, a, b], border: [[width, mat], ...], well: [X0, X1, Y0, Y1, mat, rim] }`: a chequer of two plain
  colours (`'c#rrggbb/roughness'`) inside a border, laid as one flat sheet (two triangles a tile: keep to one or two
  rooms). It is set out as a tiler would: the field is a whole, odd number of tiles each way, centred on the room,
  so a tile lies on each axis and the pattern ends alike at both walls; the border's bands are given from the wall
  inward, run round the field and turn its corners; the outermost takes up what is left to the walls and runs on
  under them, so every threshold (0.05 ft proud, 0.2 deep) sits in it and nothing lies in the tiles' plane. `well`
  is a mat sunk in the field (plan coordinates; its edges move to the nearest joints), with a rim.
- **Beams.** `beams: { ax, n, d, w, mat }`: `n` beams along `ax` under the room's ceiling, evenly spaced (an even `n`
  leaves the middle, where the lamp hangs, clear), `d` deep and `w` wide; `at: [...]` gives their places instead.
  Where the floor above has a hole (`b.floor`'s `holes`: a stairwell), they are framed round it: the beams that
  would cross it stop at a header beside it, carried by a trimmer along each of its other sides.
- Not finished by the table: round walls (`b.arcWall`: give its `in`/`out` yourself), walls cut by hand (`b.mesh`,
  gables, partitions under a slope), `b.floorArc`, floors built from boxes, the skirting (the wall's `base`).
- Cost: a material is a mesh, whatever the number of rooms that use it. Tints of one photograph share a mesh and
  plain colours share one for the whole building, so a scheme of a dozen wall colours, three floor tints and a
  tiled floor adds two or three meshes, not a dozen.

### Roofs

Every roof is flat pieces. `over` is the overhang at the eaves; `pitch` is rise over run; each returns the
height of its ridge or apex. All take `mat` (default `slate`), `under` (the underside, default `timber`;
`null` for none) and `thick` (default 0.3).

- `b.roof.gable({ X0, X1, Y0, Y1, eave, pitch, ridge, over, overG, gable, gt })` two slopes over the plan
  rectangle, the ridge along `'X'` or `'Y'`. `overG` is the overhang at the gable ends. `gable`: the material
  of the two triangular end walls above the eave line, `gt` thick (default: none; then carry the walls up
  yourself with `b.mesh` or `b.prism`).
- `b.roof.hip({ X0, X1, Y0, Y1, eave, pitch, over })` hipped on all four sides, the ridge along the longer
  side; a square plan gives a pyramid.
- `b.roof.cone({ X, Y, r, eave, rise, n, from, to, over })` a cone or part of one in `n` flat faces: the
  half cone over a round end (`from: -90, to: 90`), a polygonal bay's roof, a whole turret (`0` to `360`).
  `r` is the radius at the eave line, `rise` the height of the apex above the eave.
- `b.roof.face(mat, [[X, Y, h], ...], { thick, under, edge })` one flat piece through three or more points
  in a plane (convex, in order round the outline). Slate courses run level and up the slope whatever its
  shape. **Everything else is made of these**: a hipped gable (jerkinhead), a cross gable, a gablet, dormers,
  a mansard, a shed, a roof with a flat deck, a tower's broach.

What the roofs do not do: they do not cut each other. Where two roofs meet (a cross gable into a main roof,
a tower against a slope) let them run into each other; the junction is right from outside, and under it
build nothing that shows. There are no gutters, ridge tiles, finials, crestings or chimneys (boxes and
`b.cyl` do those), no curved roofs (domes, ogees, bell casts: geometry by hand), and no ceilings that follow
a roof's slope (use `b.roof.face` with `under: 'plaster'`, or `b.mesh`).

### The rest

- `b.world(X, Y, h)` gives `{ x, y, z }` in the world, for `b.later`.
- `b.later(ctx => { ... })` runs once the scene exists: `ctx` has `THREE`, `scene`, `camera`, `materials`,
  `interact` (push `{ x, y, z, reach, label: () => '...', act: () => {} }` for anything usable with E),
  `animated` (push `(t, dt) => {}`), `walker`, `sound`, `day` (`day.light` 1 by day to 0 at night), `flash(text)`.
  Nothing needs it yet.
- Window light on the grass after dark, the glass's glow, the doors' leaves and handles, colliders for
  walls, the outline of the building (for what is "inside" it): all recorded for you.

## Materials

Photographic (CC0) unless marked painted; each tiles at its true size.

- Masonry: `limestone` (painted: rough, rock-faced ashlar in courses, for Snow Hall), `limestone_smooth`
  (painted: dressed stone for trim, sills, steps), `brownstone` (painted), `brick` (soft old pinkish brick),
  `brick_red` (pressed red brick), `clinker` (dark rough brick), `flagstone`, `pavers`, `concrete`, `stone`
  (a plain grey).
- Roofing: `slate` (painted: blue-grey, in courses), `slate_red` (painted), `shingle` (wood shingles),
  `shake` (the house's redwood shakes), `roof` (asphalt-grey), `copper` (aged, dark).
- Inside: `plaster`, `ceil`, `floor` (boards), `fir` (dark stained trim), `oak_light`, `painted_wood`, `tile`,
  `tile_hex`, `tile_subway`, `marble`. Outside wood: `timber` (dark), `sash` (window frames).
- `glass` (windows), `glow` (a lit lantern's glass), `soot` (black, dead matt).
- Any textured material in another colour: `'limestone#c9b8a0'`, `'brick#8a5a4a'`, `'plaster#e8e0d0'`,
  `'painted_wood#2f4a40'` (a tint; one material for all tints of the same photograph).
- **Under a sloping roof**: the light indoors is boxes, which stop under a slope. `plaster` and `ceil` (and
  their tints) are lit as indoors anywhere over a building's rooms, whatever the height, so a plastered slope
  is right by itself. For any other finish of an open roof (boards, the roof's own `under`) name the material
  with `@in`: `'oak_light@in'` (one more draw call each). Beyond the walls (an eave's soffit) nothing is
  changed, so keep `timber` for what is out of doors. `?indoorlit=0` shows the building without this.
- A plain colour: `'c#rrggbb'`, optionally `'/roughness/metalness'` (`'c#b08d4a/0.35/1'` is brass). All
  plain colours share one material and one draw call. They render about 20% darker than typed. `'e#rrggbb/2'`
  glows (each distinct one is a draw call).

A material that does not exist yet (terracotta, granite, a red sandstone, stained glass, a second slate) is
a request, not a local invention: materials live in `../materials.js`.

## Testing your building

From the project root (`~/projects/school`). The page is served at
`http://localhost:5190/site/`; never restart the server.

- `tools/check.sh` first: every module must parse.
- `?only=<your id>` builds only your building (the others are skipped: faster, and their mistakes are not
  yours). `?at=<your id>` stands you 14 ft in front of your door, facing it. Together:

      tools/tryshot.sh shots/snow_01.png "only=snow&at=snow&time=13&fps"

  Use your own prefix for file names in `shots/`. `&open` opens the doors, `&sites` pegs out the allowance,
  `&time=21` is night (check that every room has light), `&time=dusk` the golden hour.
- Anywhere else: `view=x,feetY,z,yaw,pitch` is in **world** terms. Get a world point from your own
  coordinates in the page: `__house.campus.sites.snow` is your site, and in a building function
  `b.world(X, Y, h)`. Easier: walk there.
- Walk it, in real time, with the real walker:

      python3 tools/drive.py "only=snow&at=snow&time=13" "(async () => { const H = window.__house; \
        H.walker.pitch = -0.3; H.use(); await new Promise(r => setTimeout(r, 1200)); \
        return [await H.walkTo(60, 30, { near: 0.6 }), H.lastCalls, H.lastTris]; })()"

  (`walkTo` takes world x, z: see `tools/walk_test.js` for a helper that turns your X, Y into them.)
  `SHOT=shots/snow_02.png` before the command takes a picture at the end. A leg that returns
  `arrived: false` hit something: a door too narrow, a step too high, a missing floor.
- **Look at every picture** (read the PNG) before believing it. Look from outside at each corner, from
  inside each room by day and at night, up each stair, and out of a window.
- The renderer is shared with everyone else working on the island and with two other projects: the tools
  queue for two slots. Take pictures deliberately (a couple of dozen, not hundreds).

## Budgets

For the bare building (no furniture):

- **Under 120,000 triangles**, and **under 60 draw calls**, which in practice means under about 25
  materials (each material is one mesh; each door leaf is one more, of 250 to 500 triangles, and its
  share of five meshes that hold the glass and the metal of every door on the island). `&fps` shows the totals for
  the view; this prints your building's own:

      python3 tools/drive.py "only=snow&at=snow" "(() => { let n = 0, t = 0; window.__house.scene.traverse(o => { \
        if (o.isMesh && (o.userData.zone ?? '').startsWith('shell:snow')) { n++; t += (o.geometry.index ? \
        o.geometry.index.count : o.geometry.attributes.position.count) / 3; } }); return [n, Math.round(t)]; })()"

  (`example.js` is 13 meshes and 13,000 triangles.)
- Round things are where triangles go: 12 facets for a round end, 8 to 12 segments for a column, 14 for an
  arch (the default). A box is 12 triangles; a wall with ten windows is about 1,500.
- No textures of your own, no canvases, no models. No more than about 16 lit volumes (see Rooms) and about
  one lamp and one fill per room.

## Rules for working in parallel

- **One file per building, and it is yours alone**: `buildings/<id>.js`. Do not create other files in
  `site/` (helpers you need go inside your file).
- **Everything else is read-only for you**: `building.js`, `campus.js`, `materials.js`, `lighting.js`,
  `main.js`, the other buildings, the tools, this README. If you need something that is not here (a
  material, a kind of opening, a roof helper, more room on your site, your door moved, a bug fixed in
  `building.js`), **ask for it**: say exactly what, and why, to whoever gave you the work, and meanwhile
  build it by hand in your own file with `b.mesh`. Do not work round a shared file by copying it.
- Do not touch `~/projects/my_house` or `~/projects/town_walk` (read them freely).
- Scratch files go in your own scratchpad with names that begin with your building's id; pictures go in
  `shots/` with the same prefix.
- No commits, no pushes, no publishing; do not restart the server.
- Nothing may share a plane with anything else (it flickers): keep an inch (0.08) between a face and
  whatever lies on it, or let one stand clearly proud of the other.
- Build what the drawings show, at the sizes they give. Where a drawing is unclear, choose the plainer
  reading and say so in a comment. No furniture, people, signs, plants or props: the bare building.

## What does not exist yet

So that you do not look for it: openings stacked in one wall call; doors or arched windows in round walls;
pointed (Gothic) arches and tracery; circular windows (roundels, roses); columns, capitals, carving and
mouldings as ready-made pieces; winding and spiral stairs; roofs that trim one another; chimneys, dormers,
gutters and finials as ready-made pieces; vaults and sloping ceilings; stained glass; furniture bound to a
building (the kit is here, and `b.fr` makes its frames, but only its lamps have been tried); models. All of
these can be built from `b.box`, `b.cyl`, `b.mesh` and `b.roof.face`; ask if one of them ought to be shared.
