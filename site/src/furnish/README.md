# Furnishing a building

What stands in the school's rooms is kept apart from the buildings themselves. Each building's furniture is one
or more files in this folder:

    // site/src/furnish/stone.js
    export default function (f) { ... }

called once at start-up, after the building's own file, with `f`: everything a room is furnished with. The
files are listed per building in `index.js` (`snow: [snow_low, snow_up]`, `library: [library]`,
`stone: [stone]`); each already exists as an empty function. **Replace your own file whole and edit nothing
else.** Nothing in a furnish file runs per frame unless you ask for it with `f.later`.

Read `../buildings/README.md` first for the coordinates and the materials, and your building's own file
(`../buildings/<id>.js`) for where its walls, doors, windows and stairs are. The furniture kit's own guide is
`../kit/README.md` (written for the house: ignore its coordinates section). Units are feet.

## House rules (Anna's)

For this place her later word overrides the restraint below: the lab should be **full and lived-in** ("nothing
should be so sparse", "it should have soul"). Read the first three rules as how to arrange plenty, not as a
reason to leave a room thin; the rest stand as written.

- **One idea per room.** A lecture room is its board and its benches. An office is a desk by a window.
- **Few, large, calm things.** One long table before six small ones.
- **Leave bare wall.** A wall with one thing on it is finished.
- **Real over invented.** A real formula, a real timetable, a real book, the real name of a real thing; what
  the building's own photographs and drawings show before anything imagined.
- **Full does not mean busy.** A room may be full of benches. It may not be full of oddments.
- **Nothing may share a plane with anything else** (it flickers). Keep 0.08 ft between a face and whatever
  lies on or against it, or let one stand clearly proud of the other. `tools/zfight.py` finds what you missed.
- **Plain `c#rrggbb` paint is the cleanest thing for joinery** you build yourself (benches, panelling, a
  counter). Tinted `fir#...` renders nearly black indoors, and `painted_wood#...` is mottled on wide boards.
- No cats, as characters or decoration. There are no students: only the faculty, and the visitor.
- Keep clear ways: 3 ft through every doorway and 3 ft clear in front of every door on both sides, stairs and
  landings clear. The visitor is 1.44 ft wide and is stopped by anything between 1.4 and 5.7 ft above the floor.

## Coordinates, rooms and frames

`f` works in the **building's own plan**: X left to right along the entrance front, Y from the front back into
the building, h above the building's ground line (see `../buildings/README.md`). You never use world
coordinates, and the same file works wherever the building stands and whichever way it faces.

**Rooms.** Every room the building declared is in `f.rooms` by its name (the caption you see when you stand in
it). `f.room('Room 102')` is the same but throws, listing the names, if there is none.

    const r = f.room('Room 102');
    r.X0, r.X1, r.Y0, r.Y1      // its inside, wall face to wall face
    r.floor, r.ceil             // heights h of its floor and ceiling
    r.w, r.d, r.cx, r.cy        // width along X, depth along Y, its middle
    r.boxes                     // an L-shaped or round-ended room is several boxes; the fields above are its largest

To list a building's rooms: `python3 tools/drive.py "only=snow&at=snow" "Object.keys(window.__house.campus.rooms.reduce((o, r) => (r.site === 'snow' ? { ...o, [r.name]: 1 } : o), {}))"`.
Room boxes are the plain rectangle of the room: bookcases, piers, bays and stairs the building built inside it
are not subtracted. Look before you place.

**Frames.** Furniture is placed with a kit frame, `f.fr(X, Y, h, q)`: a point and a quarter turn (`q`: 0 faces
+Y, 1 faces -X, 2 faces -Y, 3 faces +X). Inside a frame, x runs along the piece, y is depth with the piece's
front toward +y, z is height above the frame. Frame methods: `box(mat, x0,x1, y0,y1, z0,z1, opts)`,
`soft(...)` (rounded), `cyl(mat, x, y, z0, z1, rBottom, rTop, segments)`, `bev(...)` (a board with eased
edges), `lathe(...)`, `block(x0,x1,y0,y1,z0,z1)` (an invisible obstacle), `sub(x, y, z, dq)` (a child frame),
`map(x, y)` (the plan `[X, Y]` of a point of the frame).

- `f.wall(room, side)` is a frame lying **on** a wall of a room, facing into it, at the middle of the wall and
  the room's floor: y = 0 is the wall and +y comes out into the room, z is height above the floor, and x runs
  along the wall with 0 at its middle. **+x is to the LEFT of someone looking at the wall.** `side` is
  `'front'` (the wall toward the building's entrance front, low Y), `'back'`, `'left'` (low X) or `'right'`.
  `.len` is the wall's length. `{ box: i }` picks another box of a room of several.
- `f.floor(room, X, Y, q)` is a frame standing on a room's floor at plan (X, Y) (default: its middle).

Raw geometry is as the building's: `f.box(mat, X0, X1, Y0, Y1, h0, h1, opts)`, `f.cyl(mat, X, Y, h0, h1, rB,
rT, seg)`, `f.mesh(mat, geometry)`, `f.prism`, `f.block(X0, X1, Y0, Y1, h0, h1)`, and `f.B`, the engine
Builder. `f.world(X, Y, h)` gives `{ x, y, z }` in the world, for `f.later`.

**Zones are done for you.** Everything a furnish file adds is drawn only when the room it stands in can be
seen: each piece goes to the room that wholly holds it, else the room its middle is in, else the nearest room
of the building (with a warning in the console if that is more than 2 ft away: something is standing outside
every room). So build a long thing as several pieces rather than one that crosses a doorway, and keep things
inside the room's box.

## The furniture kit

`f.kit` is the kit (`../kit/README.md` lists everything; `K` below). Pieces worth using at a school:

| for | builder | notes |
|---|---|---|
| a desk | `K.desk(fr, w, d, { gallery })` | top at 2.5; the frame is its back edge, the sitter's side is +y |
| a chair | `K.chair(fr, x, y, { kind, dq, turn, wood })` (`kind`: bentwood, windsor, captain, office ...: `kit/chairs.js`), or `K.diningChair(fr, x, y, { dq, back: 'ladder' or 'spindle', arms, wood })` | seat 1.55, sittable; faces the frame's front |
| a stool | `K.stool(fr, x, y, { h, back })` | a lab or counter stool (h 2.05) or a low one (1.5); sittable |
| a long table | `K.diningTable(fr, w, d, { style: 'trestle' or 'legs', wood })` | top 2.5, centred on the frame |
| any table | `K.table(fr, w, d, tall, mat, leg, { shelf, overhang })`, `K.sideTable(fr, x, y, { kind, h })` | |
| an easy chair, a sofa | `K.armchair(fr, fabric, pillow)`, `K.sofa(fr, w, fabric, pillows, { throw: false })` | 3k and 5k triangles: a reading room, a common room |
| a bench | `K.wallBench(fr, w, { d, h, back, cushion })` on a wall frame; or boards (`fr.bev`) and `f.seat` | `K.hallTree(fr, w)` is a hall bench with hooks and coats |
| bookcases | `K.bookcase(fr, w, tall, { d, pitch, fill, wood, subject })` on a wall frame | every book is a real one (assets/books.json) that can be taken down; `fill` 0 to 1; `subject`: see Books below |
| books | `K.bookRow(fr, x0, x1, back, z, clear, fill, { subject })`, `K.bookStack(fr, x, y, z, n, { subject })`, `K.openBook(fr, x, y, z)` | on shelves you built yourself |
| a library's shelves | `K.shelf(fr, x0, x1, back, z, clear, { front, subject, run, fill, open })`, `K.shelfRun(name, { subject, fit, fill })`, `K.shelfLabel(...)` | whole walls and ranges of books, in catalogue order: see Books below |
| cupboards, a counter | `K.sideboard`, `K.console`, `K.dresser`, `K.cabinets(fr, w, { top, paint, sink })`, `K.openShelves` | the café's counter |
| lamps | `K.ceilingLight(fr, x, y, zc, { kind: 'schoolhouse' or 'lantern' or 'bowl', lit: true, drop })`, `K.sconce(fr, x, z, { kind, lit: true })`, `K.tableLamp(fr, x, y, z, glaze, { base, shade })`, `K.floorLamp(fr, x, y)` | each lit one is a lamp (see Budgets) |
| candles | `f.candle(fr, x, y, z, tall)`, `K.pillarCandle`, `K.jarCandle` | the visitor lights them with E |
| rugs | `f.rug(X0, X1, Y0, Y1, h, style)` in plan coordinates | styles `garden`, `tabriz`, `kilim`, `runner`, `mat` |
| curtains | `K.drapes(wallFrame, x0, x1, z0, z1, mat, { maxLeft, maxRight, gather })` | x0..x1 the window's opening along the wall, z0..z1 its sill and head |
| cloth | `K.tablecloth`, `K.throwBlanket`, `K.cushion` | |
| small things | `K.mug`, `K.cup`, `K.plate`, `K.vase`, `K.posy`, `K.pottedPlant(fr, x, y, z, kind, { size })`, `K.magazines`, `K.coatRack(fr, x, y)`, `K.umbrellaStand` | sparingly |

Kit wood is oak unless `wood:` says otherwise (`K.mats` has `OAK, HONEY, WALNUT, EBONY, FIR`); a plain colour
given as a kit wood is turned into oak, so the plain-paint rule above is for joinery you build yourself. Every
solid kit piece carries its own obstacle. For pictures use `f.framed` (below), not `K.picture` directly.

    export default function (f) {
      const K = f.kit, r = f.room('Room 102');
      const d = f.floor(r, r.cx, r.Y0 + 6, 0);                    // a frame 6 ft in from the front wall, facing into the room
      K.desk(d, 5, 2.4); K.diningChair(d, 0, 3.4, { dq: 2 });      // the chair behind it, turned to face the desk
      K.bookcase(f.wall(r, 'right'), 6, 6.8);
      K.ceilingLight(f.floor(r), 0, 0, r.ceil - r.floor, { kind: 'schoolhouse', lit: true, drop: 3 });
    }

## Light, seats, things that move

- `f.lamp(X, Y, h, { power, kind })` a light with no fitting: `kind: 'lamp'` comes on at dusk, `'candle'`
  flickers, `'fill'` is daylight bouncing round a room (by day only); `f.fill(X, Y, h, power)`. The building
  already lights its rooms: add a lamp only with something to see (a reading lamp on a desk).
- `f.seat(fr, x, y, z, label)` makes a spot sittable: the eye comes to rest 2.45 ft above (x, y, z) of the
  frame, looking the way the frame faces. For a bench seat 1.5 ft high give z = 1.5. `label` is the prompt
  (`'sit'`, `'sit on the bench'`). Kit chairs, sofas and armchairs are sittable already.
- `f.later(ctx => { ... })` runs once the scene exists, for anything that moves or answers: `ctx` has `THREE`,
  `scene`, `camera`, `materials`, `interact` (push `{ x, y, z, reach, label: () => '...', act: () => {} }` for
  anything usable with E), `animated` (push `(t, dt) => {}`), `walker`, `sound`, `day`, `flash(text)`,
  `loadModel(id)`, `track(object3d, zone)` and `zoneAt(x, y, z)` (so that what you add to the scene yourself
  is drawn only when its room is: `ctx.track(mesh, ctx.zoneAt(x, y, z))`), `hold`, `faculty`.

## The faculty

Twenty-four robots work here: sixteen who teach or keep the place, and eight researchers. Who they are is in
`../faculty/roster.js`, one place: id, name, look, and `field`, a free string left empty for you (set it there,
or give `field` when you place one). Each is built round an object or an idea (`../faculty/body.js`), so they
differ in size as well as shape: mind the small ones behind tall furniture and the tall ones under low lamps.
`?lineup` stands them all in an arc about you at the Landing (turn round to see them all).

| id | name | body | size |
|---|---|---|---|
| `alder` | Alder | a card catalogue: a tall narrow moss-green cabinet of drawers on two wheels, a sprout on top, spectacles, a book | 5 ft 6, narrow |
| `cedric` | Cedric | a stack of six-sided oxblood cells with a flock of loose ones circling under him; bulb, bow tie, moustache, a pointer | large, floats |
| `delphine` | Delphine | a slate-blue spinning top on its point, leaning slowly round; navy beret, chalk, a little top in her other hand | large, floats low |
| `euclid` | Euclid | a bone-and-black cube inside the turning frame of an octahedron; a coil on top, monocle | small, floats at chest height |
| `greta` | Greta | a mustard striped plant pot on a stand, her straw hat on what grows in it, ants going round the rim, a watering can | wide and low (4 ft) |
| `horatio` | Horatio | a herm: a navy square pillar with brass buttons, a head on it, a mortarboard on that | tall (5 ft 9) |
| `isolde` | Isolde | a plum lantern of six panes, a ring to carry it by, a halo, a candle | small, floats |
| `jasper` | Jasper | a rust toolbox with a round lid, on two short legs, with arms; flat cap, a wrench | low and wide (3 ft) |
| `linnet` | Linnet | a sky-blue book standing up in the air, her quill in it for a marker, a book | very small, floats at chest height |
| `mabel` | Mabel | a cream teapot: spout, handle, her hair in a bun for the knob of the lid, green apron, spectacles, a cup | wide, floats |
| `odette` | Odette | a teal metronome: a tall severe spire, its pendulum ticking on the front, a dish on top, brass scarf | the tallest (6 ft) |
| `percival` | Percival | a charcoal striped egg on a brass surveyor's tripod, a propeller turning on top, red bow tie, moustache, a magnifying glass | middling |
| `quince` | Quince | a quince-green nerve cell: a round body, a crown of branching dendrites, an axon trailing behind | middling, floats |
| `rowan` | Rowan | a brick-red bucket in a green beanie and scarf, riding a floor polisher whose brush goes round; a duster | low and wide |
| `sorrel` | Sorrel | a sage horseshoe magnet with cream poles, held up by nothing, a flame on the bend, a flask | small, floats |
| `tobias` | Tobias | a grey-blue rack of lamps wired layer to layer, on tracks, in orange headphones | 4 ft, narrow |
| `ansel` | Ansel (postdoctoral) | an hourglass in a walnut frame, the sand half run, an antenna, a notebook | middling, floats |
| `ottoline` | Ottoline (postdoctoral) | an oscilloscope on a trolley; the green screen is her face; a white cap, a pipette | middling, on wheels |
| `pim` | Pim (doctoral) | a yellow pencil, point down, a little off the floor, a clipboard | thin, 4 ft, floats |
| `tansy` | Tansy (doctoral) | a straw skep with its bees going round, a pipette | small, floats |
| `nettle` | Nettle (doctoral) | a speckled teal mug of something hot, steaming; tired; a notebook | small, floats |
| `winifred` | Winifred (laboratory manager) | a grey pressure vessel on casters, clamps round the lid, a gauge, spectacles, a clipboard | large |
| `caspian` | Caspian (visiting fellow) | a cut stone in white and vermilion from another maker altogether, a five-sided ring of light under it, a suitcase | middling, floats |
| `barnaby` | Barnaby (glassblower, technician) | a pale green retort on an iron stand, copper below, its long beak bent down to one side, moustache, a blowpipe with a hot gather | middling |

Each may be placed once, anywhere; agree who takes whom before you start.

    f.faculty({
      id: 'delphine', field: 'Dynamical Systems',
      home: [X, Y, h],                 // where she stands: h is the floor of the room
      faces: [X, Y],                   // what she looks at when alone (her board, her desk)
      posts: [[X, Y], ...],            // the benches, shelves and instruments she works at (optional)
      lines: {
        greet: ['...'],                // one is said when you come into the room
        idle: ['*straightens the chalk*', '...'],      // now and then, to herself, mostly at a post (*...* is set in italics)
        bye: ['...'],                  // sometimes, as you leave
        topics: [                      // E on her opens a small card of up to four things to say
          { q: 'What are you working on?', a: 'Vowels. All of them.' },
          { q: 'May I see?', a: ['Of course.', 'If you are quiet.'], next: [{ q: '...', a: '...' }] },
        ],
      },
    });

**Working.** Without `lecture` (below) a robot works: a while at `home`, then to a post, where it turns to
whatever stands within arm's reach of that post (the bench, the case, the wall with the board), bends to it
with its hands busy for five to twelve seconds, sometimes mutters an `idle` line about the work, pauses, and
goes on to another post or (less often) a clear spot of **its own room** (the room `home` is in), and back
home. So put each post **two feet in front of the thing to be worked at**, and write `idle` lines as remarks on
the work. `roam: false` in the roster keeps one at home; `roam: 6` given here keeps its wandering within 6 ft
of home (posts are always visited). More than four topics take turns. A topic may have `then: ctx => {}`
(something happens) and `expr` (`'happy'`, `'wink'`, `'sass'`, `'surprised'`...).

**Excursions.** `roam: ['Delivery Room', 'Reading Room']` (room names, as the captions) lets one leave its own
room for the neighbouring rooms named, **on the same floor**, by the cased openings, arches and doors that stand
open between them; posts you give in those rooms are its excursions. It still spends most of its time in the
room `home` is in, working at the posts there; about one outing in three it goes to a post next door, works
there, perhaps at a second, and comes home. It never rests in an opening, waits if the visitor stands in one,
and keeps every other manner on the way. It does not open a shut door (it gives the excursion up and tries
later), and stairs are not walked: a post on another floor cannot be reached (so Percival cannot go down the
tower stair). Without `roam` nothing changes: `roam: false` and `roam: 6` mean what they did. Mind the
width of the way: the opening must be wider than the robot (see below).

**Manners.** They go round furniture as a visitor would, on a plan of the room made from the same obstacles
that stop the visitor (anything from 0.2 ft above the floor to the top of the robot's head), keeping their own
half-width clear: Winifred, Mabel and Delphine need 4 ft to pass, Pim and Linnet 2 ft 6. So leave them
somewhere to go. They never come nearer the visitor than their two radii, step aside when walked at, will not
wait in a doorway, in the 3 ft before one, at a stair or in an aisle under 5 ft 6 wide, and never stand where the
visitor would be shut in. A `home` or post you give them may be in an aisle (behind a counter, behind a desk) or
within 3 ft of a door, and they will stand there; one put in the doorway itself (within a step of the opening)
or at a stair is moved to the nearest floor that is neither, and the console says so. The visitor cannot walk through them.

**Lecturing.** Give `lecture` and the teacher spends its time at the front, giving the lecture whether or not
anyone is there: you come in on the middle of it.

    f.faculty({ id: 'cedric', home: [X, Y, h], faces: [X, Y],
      lecture: { stand: [X, Y, h],     // where it stands to lecture: the front of the room, clear floor
                 board: [X, Y],        // a point of the board it turns to and points at
                 script: ['A sentence.', 'Another.', ...],
                 pace: 7 },            // seconds a line (optional; otherwise by its length, about 3 s + 0.075 s a letter)
      lines: { aside: ['Come in, sit anywhere.'], topics: [...] } });

The place in the script comes from the clock, so every visitor at the same moment hears the same line and
nothing runs while the room is empty. It faces the class (away from `board`, toward the middle of the room),
turns half to the board and points for about one line in five, takes a step of 2 ft 5 along the front for
another (keep 3 ft clear either side of `stand`), and looks at the visitor now and then. The first time the
visitor comes in it nods, or says one of `lines.aside` (or "Come in, sit anywhere."), once, and carries on;
`greet`, `idle` and `bye` are not used by a lecturer. E still opens the card, from anywhere in the room if you look straight at the teacher (so from a seat at the back); when the card and its answer are
done the lecture goes on where the clock has got to. Lecture lines are shown in a larger bubble set beside the
speaker on the side away from `board` and hung below the board's lower edge (taken to be 3 ft above the floor:
a board whose middle is at 5.2), to be read from the back of the room without covering what is written: keep
each under about 120 letters (three lines of the bubble), and give `board` as the middle of what is written. If the visitor stands at
the front, it lectures from the nearest polite spot and goes back when they have gone. `stand` and `board` are in
your plan coordinates like everything else.

Each robot costs 5 draw calls (one or two cost 4) and between 700 and 4,400 triangles (2,400 on average) while
its room is in view, and nothing at all, per frame, while the visitor is more than 70 ft away or on another floor.

**Serving drinks** (the café). Give `serve` and topics that name a drink:

    f.faculty({ id: 'mabel', field: '...', home: [X, Y, h], faces: [X, Y],
      serve: { machine: [X, Y],        // where she goes to make it (stand her beside the urn or the machine)
               pickup: [X, Y, h],      // where the cup is set down: the TOP of your counter
               drinks: { 'flat white': { vessel: 'latte', liquid: 0xc9a27a, note: 'said when it is finished' } } },      // optional
      lines: { topics: [{ q: 'A flat white, please.', a: 'One moment.', serve: 'flat white' }],
               ready: ['Your %s is on the counter.'], served: ['Take your time with it.'] } });

She goes to the machine, waits four seconds, and sets the cup at `pickup`; "take your flat white" appears
there; the cup is carried at the edge of view, **Q (or E with nothing in front of you) takes a sip, R sets it
down** on the nearest table top, and the empty is put down when it is finished. Vessels: `demitasse`, `latte`,
`teacup`, `mug`, `tumbler`, `highball`, `wine`, `rocks`, `phin` (chosen from the drink's name if you give no
`drinks`: espresso and cortado are short, tea a teacup, cocoa a mug, anything iced a highball). `food: { name:
{ build: THREE => Object3D, bites, note } }` serves a dish the same way. She takes the order wherever she is
standing, goes round you to the machine and back, and if you stand in her only way she waits half a minute and
then makes it from where she is: the cup always arrives.

`f.help({ at: [X, Y, h], name: 'apple', model: 'food_apple_01', bites: 3, note: '...' })` puts "take an
apple" at a place where the thing stands (you place the thing itself); `drink: { vessel, liquid }` instead of
`model` pours a drink ("pour yourself a ...").

## Ordinary researchers

Besides the named staff, the place is peopled by plain working robots of six makes: a cohort of eighteen
(`faculty/researcher_cohort.js`), the same all day and night, who move between their rooms every few minutes and get
up on errands within a room. **An `f.researcher` call marks a SPOT, not a robot:** a place one of the cohort may come
to work, used when one is in the room and otherwise an empty chair with the work left on the table. At a spot they
sit with a cup, read, type, write, listen to a lecture, stand at a bench, or stand talking in pairs. None has
legs: they float (the wide one rolls on little wheels when it is on the floor). Who
comes to a spot is the cohort's business: on a spot, `make`, `size` and the look of `seed` no longer choose a robot
(each member of the cohort brings its own; the makes and touches below are what the cohort is made of), and `seed`
only varies the work left on the table; `pose`, `facing`, `seat`, `top`, `lines` and `role` still hold.

    f.researcher({ at: [X, Y, h],           // seated: the MIDDLE OF THE SEAT, h the top of the seat. Standing: where it stands, h the floor
                   facing: [X, Y],          // a point it faces (its table, the lecturer, the other one), or plan degrees (0 is +X, 90 is +Y)
                   pose: 'type',            // 'sit' | 'read' | 'type' | 'write' | 'listen' (seated)   'stand' | 'talk' (standing)
                   seed: 12,                // which individual: any whole number, a different one for each
                   group: 'neural',         // 'matter' | 'systems' | 'machine' | 'neural' | 'morpho' | 'collective' | 'mind' (or the group's name)
                   seat: 1.55, top: 2.5,    // optional: the seat's height above the floor, and the table's (see below)
                   make: 'tall', size: 1.1, // optional: which make (else the seed chooses), and how large (else the seed, standing ones larger)
                   role: 'tech',            // optional: one of the technical staff (below)
                   lines: ['...'] });       // optional: what it says instead of the pool's lines

| pose | what you see | what you must provide |
|---|---|---|
| `sit` | a cup on the table; looks about; lifts the cup and sips every ten to fifteen seconds | a seat and a table |
| `read` | an open book on the table, head bent to it; turns a page now and then | a seat and a table |
| `type` | a laptop open on the table; types in bursts, stops to think | a seat and a table |
| `write` | a pad on the table; the hand writes along the line, stops, looks up | a seat and a table |
| `listen` | hands in the lap, head up to what it faces; nods now and then | a seat (face it at the lecturer's `stand`) |
| `stand` | bent to a bench, hands busy, straightens now and then; a sheet of paper on the bench | a bench; give `top`, its height above the floor (else the hands work in the air) |
| `talk` | stands, gestures with one hand in turns, nods | another one facing it, 3 ft off (each with `facing` at the other) |

**The makes.** The seed chooses one; `make` asks for one. Heights are to the top of the head, standing, at the
size a seed usually gives (a standing one is made a fifth larger than a seated one, and none is over about 5 ft).

| make | what it is | standing | seated on a 1.55 chair |
|---|---|---|---|
| `round` | an egg of a trunk, a ball of a head with an aerial: the commonest | 4 ft 3 | 3 ft 9 |
| `tall` | a slim column in three sections, a small head | 5 ft 1 | 3 ft 5: the sections slide into one another |
| `box` | a case for a trunk and a screen for a head | 4 ft 8 | 3 ft 2 |
| `wide` | a low dome on a skirt, on four little wheels when it is on the floor | 3 ft | 3 ft 6: it sits without its skirt |
| `neck` | a small round trunk, a long thin neck, one large eye at the end of it | 5 ft | 3 ft 4: the neck draws in by half |
| `drum` | a stout cylinder with a dome on it, bolts at the shoulders | 4 ft 2 | 3 ft 3 |

Seated, the underside of the trunk rests on the seat, whatever the make (nothing dangles, and a seed that sat
properly before sits at the same height now). Standing at work, give `top`, the height of the work above the
floor (3 for a bench, 4 for a standing desk, 5 or so for a shelf at eye height): one that floats rises or settles
until its shoulder is just over the work (by up to 1 ft 8 above its usual height), its hands go to the work at
that height and its face turns to it, up or down. Without `top` it floats at its usual height with its hands
before it. `lift` (the height of its underside above the floor) overrides this.

**Technical staff.** `role: 'tech'` (for laboratories, the server room, the stacks, workshops) gives one a stiff
apron, a belt with pouches and a screwdriver in it, a spanner in the hand when its pose is `stand`, lines about
the equipment in place of its group's, and makes it more likely a drum, a box or a wide one.

**Seated.** `at` is the middle of the seat and `h` the height of its top: the floor plus 1.55 for a kit chair
(`K.diningChair`: give it `{ sit: false }` so the visitor is not offered an occupied chair), plus 1.5 for a
bench you built. `seat` is how high the seat is above the floor (1.55 unless you say; say 1.5 for such a bench,
2.4 for a stool), so that the feet come down to the floor; `top` is the table's top above the floor (2.5).
The body sits 0.1 ft behind the middle of the seat and the knees reach 0.65 ft in front of it, so the near
edge of the table should be 0.3 to 0.6 ft in front of the middle of the seat, and what is put on the table
(the laptop, the book) lies from 0.6 to 1.1 ft in front of it: the table needs 1.2 ft of clear top there.


**Standing.** `at` is the floor where it stands: 1.2 ft back from the edge of the bench for `stand`.

A seed changes the height, the colour of the shell, the colour and shape of the eyes, and whether it wears a
scarf, a satchel or neither; the group gives the colour of the lanyard and name tag, and what it says. Each has a
name (from a pool that avoids every name in the house, the town and the roster). They glance up when the
visitor comes within 7 ft, and E on one ("talk to Etta") has it say a line: one of `lines` if you gave any,
else one for its group or its pose. The visitor cannot walk through them, and the named robots go round them.
**Do not put one within 3 ft of a door, at a stair, or (standing) in an aisle under 5 ft 6 wide:** the console
warns, the first time the room is come near, and names it.

Cost: about 600 triangles each; the researchers of one room are 3 draw calls together (bodies, eyes, hands),
plus one for each make present, one if any has pose `sit` and one if any is technical staff standing (so 4 to
11); nothing runs for a room the visitor is more than 45 ft from or cannot see. `?crowd` stands one
of each make at the Landing, standing and seated, with a bench, a standing desk and a case.

## Boards and lettering

All lettering is painted on a 2D canvas by a function you give, and put on the wall for you. The things are
placed on a **wall frame** by their **centre**: `x` along the wall, `z` above the frame (the floor, if the
frame is `f.wall(...)`). `f.draw` is `../boards.js`: the drawing helpers (`T` text, `para` wrapped text,
`fill`, `rect`, `disc`, `line`, `poly`, `rrect`, `grain`, `paper`, `board`, `slate`, `ICON`, the faces `F`).

**A chalkboard**: a slate in a wooden frame with a chalk tray.

    f.chalkboard(f.wall(r, 'left'), 0, 5.2, 12, 4, c => {       // 12 ft by 4 ft, its middle 5.2 ft above the floor
      c.text('The quadratic', 6, 9, 6, { col: c.col.yellow });   // (string, x, y of the baseline, size, options)
      let x = c.text('x = ', 6, 22, 5);                          // text returns the x where it ended
      x = c.frac('−b ± √(b² − 4ac)', '2a', x, 22, 5);            // a fraction; so do sup, sub, sqrt
      c.axes(8, 28, 30, 14, { xl: 'steps', yl: 'loss' }); c.plot(u => Math.exp(-5 * u), 8, 28, 30, 14, { col: c.col.pink });
      c.arrow(62, 36, 52, 32, { col: c.col.blue });
    }, { frame: 'c#4d3a2b', ground: '#262b29' });

The drawing function's units are **inches on the slate**, (0, 0) at its top left, x right, y down; `c.W`,
`c.H` are its size (a 12 by 4 ft board is 144 by 48). Sizes are the height of a line of writing: 3 small, 4
ordinary, 6 a heading. Tools: `text`, `lines(list, x, y, size)`, `width`, `sup`, `sub`, `frac`, `sqrt`,
`line`, `arrow`, `path(points, { close, fill })`, `curve` (smooth), `circle`, `arc`, `rect`, `dot`,
`underline`, `axes`, `plot(fn, x, y, w, h, { x0, x1, y0, y1 })`, `smudge(x, y, w, h)` (half wiped). Every tool
takes `{ col, lw }`; colours are `c.col.white, yellow, pink, blue, green, orange`. `c.g` is the raw 2D context
(in the same inches) for anything else. Lay formulae out by hand; write what would really be on that board.
Options: `frame` (the wood's paint), `border`, `tray: false`, `ground` (`'#2c3a33'` is a green board), `hand`.

The board is chalked for you: the slate is mottled, swiped and dusty; every line strays a little, is pressed
harder here and lighter there and is sometimes gone over; every letter sits a little off its line; a heading
(size 5.5 and up) is gone over; and the slate's tooth is taken out of all of it. So draw with the tools (`c.line`,
`c.rect`, `c.path`, `c.circle`, `c.text`) rather than with `c.g`: what you draw with the raw context is grained
but not hand-drawn. Each board has its own hand, chosen by where it hangs: `hand: 'neat' | 'plain' | 'hurried' |
'bold' | 'light'` chooses it. `c.text` still returns the x where the writing ended, exactly as laid out. **A board
is not fitted for you:** what you write off its edge is cut off (`tools/signs_audit.py` lists it).

**A sign**: anything drawn. `f.sign(wallFrame, x, z, w, tall, (g, W, H) => { ... }, { res, board, thick, lip,
rough, flat })`: `draw` paints a canvas of W by H pixels; `board: 'c#27382f'` puts a board of that material
behind it; `flat: true` lays it face up at height z (a paper on a desk: give a floor or desk frame).

**A door plate or small lettered sign**: `f.plate(wallFrame, x, z, 'ROOM 102', { style, sub, w, tall })`.
Styles: `'brass'` (dark letters cut in brass), `'engraved'` (cut in pale stone), `'painted'` (cream on dark
green with a lined border: give `ground`, `ink`), `'enamel'` (white on dark blue). `sub` is a smaller second
line. Default 1.3 by 0.36 ft; beside a door at z = 5.2. For a large painted or engraved sign give `w`, `tall`.

**Paper**: `f.paper(wallFrame, x, z, w, tall, what)`, where `what` is a drawing function `(g, W, H)` or

    { kind: 'notice', title: 'NOTICE', lines: ['...', '...'], foot: 'the Librarian', hand: true }      // hand: written, not printed
    { kind: 'timetable', title: 'MICHAELMAS TERM', cols: ['', 'Mon', 'Tue'], rows: [['9', 'Syntax', ''], ['11', '', 'Botany']] }
    { kind: 'poster', title: 'ON\nLIGHT', sub: 'a public lecture', lines: ['Thursday at four'], foot: 'ALL WELCOME', colour, accent }

**Canvas sizes** are worked out for you from the thing's size in feet (no side over 2048 pixels); `res` (pixels
per foot) overrides. Use the defaults:

| thing | pixels per foot | so |
|---|---|---|
| chalkboard | 128 | 12 by 4 ft is 1536 by 512: sharp from 5 ft back, and enough for the chalk's grain |
| sign | 128 | a 6 by 1.5 ft painted sign is 768 by 192 |
| door plate | 256 | 1.3 by 0.36 ft is 333 by 92 |
| paper up to 2.2 ft | 240 | a notice 1.1 by 1.5 ft is 264 by 360 |
| poster, larger paper | 144 | 2 by 3 ft is 288 by 432 |

Letters meant to be read should be at least an inch high on a board or sign (0.08 ft; chalk size 3 and up)
and half an inch on paper. Smaller writing is texture, not text: do not rely on it. The faces: `F.goudy`
(the page's own; signs, plates, print), `F.caveat` (handwriting; chalk), `F.fraunces` (poster titles).
Goudy's figures are old-style (a 1 looks like a small capital I): for a room number on a plate that must read
at a glance, pass `{ f: f.draw.F.fraunces }`.

**Words that are too long are fitted, not cut.** `f.plate`, and the notice, timetable and poster of `f.paper`,
measure every line. A line too wide for its plate or paper is first set with its letters closer, then in smaller
type down to the least that can be read there (0.07 ft on a door plate, 0.12 ft on a large sign, half an inch on
paper, 0.06 ft on a poster), then on more lines if there is height for them (a plate with no `sub` goes to two or
three lines as soon as one line would be under a third of its height; a notice's heading to two; a timetable's
cell to three), then below that least size, and at the very last is cut short with an ellipsis. A notice's or a
poster's lines wrap to the paper, and if there are too many for it they are all set smaller. Whenever type went
below the least size or was cut, the console says `lettering: the plate "..." is too long for it`: give the
thing more room (`w`, `tall`) or fewer words. What fitted before is set exactly as before.
In your own drawing function nothing is fitted but this: `D.T` sets a line smaller if it would cross the
**canvas's** edge (`{ bleed: true }` lets it), and `{ max: width }` squeezes a line to a width. For anything in
a column or a box of your own, use `D.fit(g, text, px, maxWidth, { maxH, floor, ls, f, w, it })` and
`D.drawFit(g, fitted, x, y, colour, { f, w, it })`, which do what the plates do; `D.para(g, text, x, y, px, colour,
width, { maxY })` wraps and stops at `maxY`; `D.column(g, [paragraphs], x, y, px, colour, width, maxY)` wraps a
list and sets it all smaller until it fits. Raw `g.fillText` is never fitted.

**How to place lettering so that it reads.** `python3 tools/signs_audit.py out.json` measures every lettered
thing on its canvas and in the world and lists what is wrong by file and line (`SHOTS=dir` also photographs
each from where a visitor can stand); run it after hanging anything. What it finds most:
- *The dado rail.* Every finished room has a rail (4.4 ft in the halls and corridors of Snow Hall, 3.4 in its
  teaching rooms, 4.6 in the laboratories, 3 in the offices, 4.2 in the Museum; 4 to 4.2 in the library) standing
  an inch proud of the wall. Paper hung across it is cut in two by it. Keep the bottom of anything on the wall
  0.15 ft above the rail, or its top below it: a notice 1.3 ft tall in a corridor hangs at z = 5.25, not 4.1.
- *Door casings.* A casing is 0.4 to 0.5 ft wide and proud of the wall. A plate beside a door wants its near
  edge 0.6 ft from the opening; if the wall between the door and the corner is narrower than the plate, give the
  plate a smaller `w` (the words are fitted) rather than letting it run under the casing.
- *Other people's hangings.* The base file, the room's curator and the exhibits all hang things on the same
  walls. A wall frame's x runs to the viewer's LEFT; two frames made differently for one wall have different
  origins. The audit lists every pair that overlaps or stands within 2 in. A framed picture is wider than its
  `w` by twice its mount and moulding (0.68 ft by default): leave 0.25 ft between frames.
- *Height.* The eye is 4.85 ft up. Read standing: middles between 4 and 6.5 ft; nothing to be read under 1.6 or
  over 7.4 unless its letters are 2 in. tall. A card lying flat can only be read if it is under 4 ft (looked
  down on) and not under the thing it describes: on a shelf near eye level stand it up (`f.sign(..., { tilt:
  0.4 })` leans it back) at the front of the case. A flat thing reads from the frame's FRONT (+y): face the
  frame toward where the visitor stands, or give `turn: Math.PI`.
- *Size.* A letter must be at least 1/130 of its reading distance tall to be read on the screen: 0.3 in. at a
  glass case (3 ft from the eye, looking down), half an inch at 5 ft, an inch and a half across a room. The
  capital's height is about two thirds of the type size.
- *In a case.* A ticket stands at the front; whatever is behind it must end behind it: keep a mount's front edge
  0.1 ft behind the ticket, and a card clear of every mount.

## Models

`f.model(id, frame, x, y, z, dq, { scale, turn, seat, collide, hang })` places a collected glTF model with its
lowest point at height z of the frame (`hang: true` uses z as the model's own origin, for wall pieces; `seat:
1.5` makes it sittable; `collide: true` an obstacle; `turn` radians of extra yaw). Models are catalogued, with
sizes, triangle counts, which way each faces and its licence, in
`~/projects/my_house/site/assets/models/CATALOG.md` (230 of them) and the town's
`~/projects/town_walk/site/assets/models/CATALOG.md`. The school has none until you copy one in:

`f.computer(id, frame, (g, W, H) => { ... }, { scale, turn, glow })` stands a computer whose model has a glass named
`screen...` (the iMac G3s: `imac_g3_blueberry`, `imac_g3_tangerine`) at the frame's origin and draws its picture on
that curved glass itself, lit from within, as the house's iMac is. Do not stand an `f.sign` in front of a tube: it
shows as a flat card floating before the glass from any angle but head on.

    cp -r ~/projects/my_house/site/assets/models/<id> ~/projects/school/site/assets/models/

(make `site/assets/models/` if it is not there; the folder must hold `<id>.gltf`, its `.bin` and `textures/`)
and add a line for it under "Models" in `site/assets/CREDITS.md`: the id, what it is, its licence and source,
copied from its row of the catalogue. Prefer the kit (a kit desk is 1,500 triangles; a model chair is 6,000 to
14,000) and use a model for the one thing in a room that should be looked at.

## Framed pictures: the buildings' own drawings

Anna wants each building's own measured drawings framed on its walls. The scans are in
`~/projects/school/research/` (`stone/` HABS sheets and photographs of the Adams Stone Library;
`snow/` the University of Kansas drawings of Snow Hall; `cpl/` and `cpl_ecr.pdf` the Cambridge Public Library).
A picture is first made into a modest JPEG in `site/assets/art/`:

    python3 tools/art.py research/stone/sheet3.jpg stone_habs_sheet3 "Adams Stone Library: east and north elevations" \
      "Historic American Buildings Survey, survey MA-841, sheet 3 of 7; Library of Congress, https://www.loc.gov/item/ma0435/" \
      "Public domain (a work of the U.S. Government)"

It prints the picture's proportions and the line to add to `site/assets/CREDITS.md` (add it). Only pictures
whose source and licence you can name go in; `research/*.json` and the PDFs say where each scan came from.
(`stone_habs_sheet3` is already there, 1024 by 804: the one above.) Then hang it:

    f.framed(f.wall(r, 'back'), x, 4.8, 2.4, 1.88, 'stone_habs_sheet3', {      // the picture itself 2.4 by 1.88 ft, its middle 4.8 up
      title: 'Adams Stone Library', kicker: 'East and north elevations',
      text: 'Measured and drawn for the Historic American Buildings Survey.', foot: 'Library of Congress, HABS MA-841.' });

Keep w : tall equal to the image's proportions. Options: `frame` (the moulding's material, default `fir`),
`border` (its width, 0.16), `mat` (a paper mount, 0.18 wide; 0 for none), `glass`; and `title`, `kicker`,
`text`, `foot`: with any of these, E on the picture ("read the caption") opens a card. A room's pictures are
packed into one sheet (one draw call); keep each image at 1200 pixels or less (the tool's default).

## Things to read

- **Books.** Nothing to call: every book the kit puts on a shelf (`K.bookcase`, `K.bookRow`, `K.bookStack`,
  `K.shelf`) is a real one from `assets/books.json` (the house's list: 1,611 titles on 23 shelves), and a visitor
  who looks at a spine is offered "take down *Title*, Author"; E opens it. **Do not fill shelves with anonymous
  blocks**: a shelf of real books costs two triangles a spine (the kit only records the shelf; `../books.js`
  shelves, paints and draws them all together, a few draw calls a room).
  - *What a shelf holds.* With nothing said, what `../books/plan.js` gives its room (`ROOMS`: each professor's
    subject in their office, things to borrow in the café...), else pleasure reading. Say otherwise with
    `{ subject: 'philosophy' }` (a shelf of books.json: art, biography, children, classics, computing, cooking,
    drama, essays, film, garden, history, linguistics, literature, math, music, mystery, nature, philosophy,
    poetry, psychology, science, scifi, travel), a list of them, or a collection named in `plan.js`
    (`COLLECTIONS`: add yours there; a collection may pick by author or title, but only from the list).
    Books go on by author within a subject; the copies of a title are kept apart.
  - *A library.* `K.shelfRun('name', { subject, fit: 2, fill: 0.9 })` names a sequence; every
    `K.shelf(fr, x0, x1, back, z, clear, { front, run: 'name' })` made after it takes up where the last left off,
    so make the rows in the order a reader takes them (bay by bay from the reader's left, each bay from the top
    shelf down; a frame's x runs to the reader's LEFT). `fit: n` makes the books just stout enough that the run
    holds its collection n times, and no more. `back` and `front` are where the books' backs and spines stand
    (give the case's real depth: books are up to 0.68 ft deep and are cut to fit); `open: true` for a shelf with
    no back. `K.shelfLabel(fr, x, y, z, w, tall, from, to, head)` hangs a card that says what the rows made
    between two `K.shelfMark()`s hold. The Stone Library and the Book Room (`stone.js`, `library.js`) are the examples.
  - *What is inside.* A book shows a passage of its own text only if `../books/quotes.js` has one for it (61
    public-domain books, each cut word for word from its Project Gutenberg text); every other book shows its
    cover and where it is shelved. **Never add an invented or remembered quotation, title or author**: a passage
    goes into quotes.js only when checked against a primary text, as that file's header says.
- **A label or caption on anything**: `f.label(frame, x, y, z, { label: 'read the label', title, kicker, text,
  foot })` puts a prompt at that point of a frame; E opens a card (`text` may have several paragraphs,
  separated by newlines). `{ label, note: 'one line' }` says a single passing line at the foot of the view
  instead. Use it for the true name and source of a real thing (a specimen, an instrument, a drawing).
  `f.later(ctx => ctx.flash('...'))` says a passing line from your own code.

## Chess

`f.chess(frame, x, y, z, { opponent: 'Euclid', back })` stands a chess set (1.8 ft square) at (x, y) of a
frame on a table top at height z, and lets the visitor play: "sit down to the chess game" seats them on the
frame's **front** side (+y), `back` feet from the middle of the board (default 2.15), playing White; they look
at a piece and click, look at a marked square and click; the other side answers (`opponent` is only the name
used in the lines: a robot's name, if one keeps the room). N starts a new game; the game is kept in the
visitor's browser. You provide the table (2.5 ft or lower, at least 2.4 square) and, if you like, a chair on
the +y side (`K.diningChair(fr, x, y + 2.2, { dq: 2, sit: false })`). One set in the school; its model
(`chess_set`, 16,000 triangles) is already in `assets/models/`.

    const t = f.floor(r, X, Y, 0); K.table(t, 3, 3, 2.5, K.mats.OAK); f.chess(t, 0, 1.5, 2.5, { opponent: 'Euclid' });
    // (K.table's top runs from y = 0 to y = d: the middle of a 3 ft table is y = 1.5)

## The record player

`f.recordPlayer(frame, x, y, z)` stands a turntable (1.7 wide, 1.3 deep, 0.4 high) at (x, y) of a frame with
its foot at height z: the top of a table or cabinet you provide. Its front is the frame's front.

    const t = f.floor(r, X, Y, 0); K.sideboard(t, 4, { d: 1.6, h: 2.8 }); f.recordPlayer(t, 0, 0.8, 2.8);

The record turns while music plays; E on it puts on another record (fifteen public-domain piano, guitar and
cello recordings, shuffled). The music is heard in the player's own room and faintly outside it, and starts
when the visitor steps onto the island. One player in the whole school: it is in the Stone Library.

## Testing

From `~/projects/school`. The page is served at `http://localhost:5190/site/`; never restart it.

- `tools/check.sh` after every edit: every module must parse.
- Stand in a room by name, or anywhere by your own plan coordinates (add `&shot` to hide the welcome card):

      tools/tryshot.sh shots/stone_01.png "only=stone&room=The Stone Library&time=13&shot&fps"
      tools/tryshot.sh shots/snow_01.png "only=snow&room=Room 102,180&time=21&shot"        # looking along -X, at night
      tools/tryshot.sh shots/snow_02.png "only=snow&stand=snow:60,30,4,90,-10&time=13&shot"  # X 60, Y 30, feet at h 4, looking along +Y, 10 degrees down

  The angle is in plan degrees: 0 looks along +X, 90 along +Y (into the building), 180 along -X, 270 back
  toward the front. `only=<id>` builds only your building. `furnish=0` shows the bare building; `faculty=0`
  leaves the robots out; `lineup` shows the roster. Use your own prefix for pictures in `shots/`.
- `tools/shot.sh` and `tryshot.sh` run in virtual time (a dozen frames): robots do not move and lettering far
  from where you stand may not be painted yet. For anything that moves, or to press keys, use
  `tools/drive.py "<query>" "<js>"` (real time; `SHOT=out.png`; `KEYS="e,wait:900,1"`): `window.house.ctx`
  has `interact` (every usable thing, with `label()`), `faculty` (by id: `.state`, `.x`, `.z`), `holding()`;
  `window.__house` has `walker`, `walkTo(x, z)`, `use()` (presses E), `lastCalls`, `lastTris`.
- **Look at every picture** before believing it: each room by day (`time=13`) and at night (`time=21`), from
  its door and from its far corner.
- Walk it: `python3 tools/drive.py "at=landing&time=13" "$(cat tools/walk_test.js)"` must still pass, and
  every door must still open with 3 ft clear.
- Flicker: `python3 tools/zfight.py /tmp/z.json "only=stone"` then `python3 tools/zfight_report.py /tmp/z.json`
  lists faces that share a plane, with the line of your file that made each. Yours should list nothing.
- The renderer is shared (two slots for everyone): the tools queue. A couple of dozen pictures, not hundreds.

## Budgets

Per building, furniture only (the fabric has its own budget):

- **Triangles**: under 150,000 for a whole building's furniture, and under 25,000 in any one room. For
  scale: desk 1,500; chair 700; bookcase 850 plus 2 a book (8 for those within 11 ft of the eye); armchair 3,000; sofa 5,000; a named robot 700 to 4,400 (2,400 on average), an ordinary researcher 750; a
  model 2,000 to 15,000. Round things are where triangles go: 8 to 12 segments.
- **Draw calls**: a room's furniture should add no more than about 12 when you stand in it. Each textured
  material used in a room is one (`oak_light`, `fir`, `linen` ... and each tinted family once), all plain
  `c#` colours together are one per 8 ft square of floor, all the room's lettering is one, its rugs one, its
  books one (two while you stand near them), each model 1 to 4, each named robot 5 (all the ordinary researchers of a room 4 or 5 together), each door leaf 2 or 3. So: few materials, any number of pieces.
  `&fps` shows the totals for the view.
- **Lamps**: only four lights shine at once on the whole island (the nearest, the room you are in first). The
  building has already given each room about one lamp and one fill. Add at most two more to a room (a lit
  fitting from the kit counts as one; so does each lit candle), and none to a corridor.
- **Canvases**: at most about 12 lettered things in a room and 4 million pixels between them (three large
  chalkboards and a wall of paper is the limit); they are packed into one sheet per room, which must stay
  under 4096 pixels square. No textures of your own; no new materials (ask).
- **Nothing per frame** beyond what `f.faculty`, candles and the record player already do, unless the room's
  one idea is a thing that moves.

## What else a visitor can do here

Already working, with nothing to call: doors (E; the two leaves of a pair move together), sitting, candles (E
lights and blows out; they are remembered), steam off a hot cup (`K.mug(fr, x, y, z, colour, true)`), the
lantern (F), the hour (`[` `]`), cupboard doors (`K.hingedDoor`, `K.wardrobe`), carrying and sipping a drink
or eating (`f.faculty` with `serve`, `f.help`), talking to the faculty, taking a book down, the record
player, chess, captions and labels.

Not brought across from the house or the town (ask if a room's one idea needs one): the guest book (it writes
to Anna's own service, which knows only the house and the town); the television and the cinema (YouTube and
Internet Archive players); the house's computers, telephone and visiting friends; picking up and carrying any
object; the jigsaw, the telescope and the globe; working taps; a lightable fire (the Stone Library has a
fireplace, but life.js's fire is laid for the house's hearth and would need turning to it); the town's hidden things and its sunset story.

## What does not exist

So that you do not look for it: lecterns, school desks, lab benches, card catalogues, globes, clocks
and coat pegs as ready-made pieces (build them from frames and boxes, plainly); curved furniture other than
`fr.lathe` and `fr.cyl`; more than one record player; students.
