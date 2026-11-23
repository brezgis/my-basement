# Anna's Basement

The place under the cellar doors of Anna's House: rooms cut into the rock round a circular courtyard in a grotto,
open on one side to the clouds. The whole place is called **Anna's Basement**. **Spanya** (spa + banya, for Anya) is
the name of the banya in it only: its door carries the one cute sign in the place, СПАНЬЯ lettered in the manner of
Church Slavonic vyaz (Anna asked for it). It is the fourth sibling of
Anna's House (`~/projects/my_house`), Vesper Street (`~/projects/town_walk`) and Cloud Spring Harbor Laboratory
(`~/projects/school`), and runs on the lab's engine, forked on 21 November 2026: three.js (vendored), plain ES
modules, no build step. Units are feet.

The plan follows Villa Vals (SeARCH and Christian Müller Architects, Vals, 2009): a plain door somewhere else, a
tunnel of stairs with daylight at its end, one round cut that every room looks into. The reference drawings and
photographs are in `research/` (private, not in git; `research/SOURCES.md` credits them).

## How it belongs to the house (Anna, 21 November 2026)

Spanya is cut into the side of the house's own island, under its garden. In the house there is a slanted steel
cellar door outside, in the angle where the living room's and the office's walls meet; you open it, start down the
stair, the picture fades, and you are on the same stair here. Going up again sets you beside the doors in the garden.
It is an easter egg: nothing at the house says it is there (no sign, no airship stop); you have to try the cellar
door. This site has no top: above the rooms is the island's earth. A visitor who comes straight to this address
sees the cliff and the courtyard from the side, never from above, and begins at the top of the stair, inside the
closed doors. The chapel's light shaft comes up in the house's garden as a small stone ring in the grass, like a
skylight; the courtyard itself is too far below the garden's edge to be seen from the house.

## What it should feel like (Anna's brief)

"Very luxurious, pamper-y, but also warm, homey." "Outside-in", "warm, cozy, eccentric". "Everything should be
GORGEOUS." It is a personal place, not a resort: hers, and any guest's who stumbles on the cellar doors. It
need not look like the house upstairs. So: the island's own stone, oak, limewashed plaster in strong warm
colours, wool, brass, lamps rather than spotlights, plants indoors, pictures and odd objects on the walls,
rugs on stone. Nothing corporate, nothing minimal, nothing beige for its own sake.

The staff are robots (the same make as the house's butlers, the town's clerks and the lab's faculty:
`site/src/robokit/`). They are sassy, they are passionate about hospitality, and they know they run the place:
"Oh darling, would you like an expertly prepared brown sugar shaken espresso after your dip in the edge pool?"
Coffee is promised in seven minutes and arrives almost at once.

Named staff so far: **Winnicbott**, the analyst in the Consulting Room (after D. W. Winnicott; Anna's name for it). The Consulting Room is an adult analyst's room, "Winnicott for grown-ups": no teddy bears, blankets or other transitional objects, no children's things. As a quiet nod to Winnicott's squiggle game, hang a few framed squiggle-style line drawings: Winnicott's own are still in copyright (he died in 1971), so use public-domain line drawings in that spirit (Paul Klee, d. 1940, "taking a line for a walk"; Kandinsky, d. 1944) and one or two squiggles drawn here, in ink on cream paper, plainly framed. The Nail Salon's robots call every guest "honey", always, and gossip without pause.

**The style is one language for every room, set out in `notes/STYLE.md`** (dark warm wood, mid-century and a bit Scandinavian, rough stone and slate, amber concealed light; Anna's four reference pictures are in `research/refs/`). Where the paragraph above or the table below suggests a period style (country house, Viennese, Victorian), STYLE.md wins.

## The rooms (the plan of 21 November, evening: three quarters of the first one, and fewer rooms)

Names are exactly those given to `b.room` in `site/src/buildings/spanya.js` (read its header and `notes/REFIT.md`).
Ground storey: floor h 0.4, ceiling 10.6 (tall). Upper storey (west wing and middle only): floor 11.5, ceiling 19.8 (snug).

| room | where (plan X, Y) | what it is |
|---|---|---|
| The Stair | under the rock, west: X -55..12, Y 25..31 | Three flights down from the closed cellar doors. Clear floor; runner, lit handrail, a few framed things. |
| The Hall | X 13.5..35.8, Y 17.5..40.2 | The concierge: desk, fire, robes. No stair in it any more. |
| The Listening Room | X 13.5..35.8 (to 42.7 by the glass), Y 40.8..72.5 | Coffee bar, wine, cheese, records. Its north part is DOUBLE HEIGHT, with the stair to the upper floor along its north wall, a gallery along its west wall and a bridge overhead. |
| The Cave | X -2.5..12, Y 50..64 | Cheese and wine, small. |
| The Pool | X 43.3..76.7, Y 53..72.5 | The warm pool (basin X 50..70, Y 57.5..67.5). |
| The Chapel | X 46..74, Y 74..101 | Same size as before; the shaft at X 60, Y 87.5. |
| The Tea Room | X 84.2..106.5, Y 17.5..40.2 | The banya's rest room: samovar, daybeds, fruit; and now a small NAIL CORNER (one technician, one throne at the cloud window, the bell and coffee, a small lit shelf of polish with glitter). |
| The Banya | X 84.2..106.5, Y 40.8..55 (and a passage X 77.3..84.2 back to Y 72.5) | The wash room: plunge, benches, veniks, the tipping bucket. "Spanya" proper: the Church Slavonic sign is at its door. |
| The Parnaya | X 84.8..95, Y 55.6..72.5 | The steam room. |
| The Treatment Room | X 95.6..106.5, Y 55.6..72.5 | One table. |
| The Gallery | upper: X 13.5..24.9, Y 40.8..53.6; a strip X 13.5..20.5 on to Y 72.5; a bridge X 20.5..42.7, Y 59.8..64.2 | The stair's head, a landing with books, the way to the suite, the consulting room and (over the bridge) the quiet room. |
| The Suite | upper: X 13.5..35.8, Y 17.5..40.2 (less the bath) | THE bedroom. Keep the window daybed. The bed less cluttered. |
| The Bath | upper: X 13.5..24, Y 17.5..27 | The suite's bathroom, a soaking tub under the window over the clouds. |
| The Consulting Room | upper: X 25.5..35.8 (to 42.7 by the glass), Y 40.8..53 | Winnicbott's room, small. |
| The Quiet Room | upper: X 43.3..76.7, Y 53..72.5 | The day room: daybeds at the courtyard windows, a fire. |
| The Courtyard | a circle, centre X 60, Y 28, radius 23 inside | SIMPLE: lawn and moss, the old pine, a few boulders, one drift of fern and white flowers, the tub and loungers at the brink, the edge pool. |

Gone: the nail salon as a room (its files are kept in `site/src/furnish/shelved/`), the dressing room, the east
suite, the reading loft as a room, the meadow. The full-size building is kept at `notes/spanya_full_size_2026-11-21.js`.

## Visiting

    python3 -m http.server 5192 --bind <address> --directory <this folder>

then `http://<address>:5192/`. W A S D to walk, the mouse to look, E to use things, H for the keys, `[` and `]`
move the hour. `?at=doors|meadow|court|brink` and `?view=x,feetY,z,yaw,pitch` stand you somewhere (world x is
the plan's Y, world z the plan's X: the place faces south); `?room=<name>` stands you in a room; `?time=13`.
The rest of the query parameters are the lab's (`~/projects/school/README.md`).

## State (22 November 2026)

First furnished version. Every room is furnished and walkable. Nine robots work the furnished rooms. Terry also makes rounds of the courtyard pool and tub. Approach a staff member and press E to talk or order. Use `?staff=0` for an empty house or `?at=court&staff=lineup` to see the cast together. The house's cellar door (`~/projects/my_house/site/src/garden/cellar.js`) and this
site's way back up (`HOUSE_ADDRESS` in `site/src/campus.js`) are wired but the house does not point here until this
site has a public address (`SPANYA_ADDRESS` there). The guest book on the concierge's desk (`site/src/guestbook.js`)
needs this site's address in the guest-book service's `GB_ORIGINS` and 'basement' in its `GB_PLACES` before it works
on the published site. `notes/` (style guide, art register, briefs) and `research/` are kept off GitHub.

## Where things are

- `site/src/campus.js`: where the place stands, the island under it, the named viewpoints.
- `site/src/buildings/spanya.js`: the building: rock, meadow, courtyard, walls, floors, stairs, rooms, finishes.
  `site/src/buildings/README.md` is the interface it is written in.
- `site/src/furnish/`: what stands in the rooms, one file per group of rooms (`index.js` lists them;
  `README.md` is the interface). `site/src/kit/` is the furniture kit, `site/src/robokit/` the robots' bodies.
- `site/src/grounds.js`, `site/src/grounds/`: the courtyard's garden and the meadow.
- `tools/`: `check.sh`, `tryshot.sh`, `drive.py` (see the lab's README, "Tools"; the same scripts).
