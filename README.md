# Anna's Basement

A place to walk around in the browser: a bath-house cut into the rock under a house on a floating island. You go
down a stair under a pair of cellar doors and come out into rooms round a circular courtyard that is open on one side
to the clouds. There is a warm pool, a chapel with stained glass, a banya, a bar with a wall of records, a cave of
cheese, a bedroom, an analyst's consulting room, a treatment table, and eleven robots who run it and know that they do.

**Visit it: <https://basement.brezgis.com>**

It is the fourth of a family of places built the same way. The others are Anna's House
(<https://house.brezgis.com>), Vesper Street and Cloud Spring Harbor Laboratory. The basement belongs to the house:
in the house's garden there is a slanted cellar door against the back wall, and it leads here. Nothing at the house
says so.

The plan follows Villa Vals (SeARCH and Christian Müller Architects, Vals, 2009): a plain door somewhere else, a
tunnel of stairs, and one round cut in a hillside that every room looks into.

## Getting about

| | |
|---|---|
| **W A S D**, mouse | walk and look |
| **E** | use what you are looking at: open a door, sit, lie down (on the analyst's couch, on the treatment table), talk to a robot, take what it hands you |
| **1 to 4**, **0** | choose a line on a robot's card of things to say; 0 (or X, or Esc) closes any card |
| **Q**, **R** | sip or bite what you are holding; put it down |
| **G** | ring for Ding, the bellhop, from anywhere |
| **T** | yes to a towel, when Terry offers one as you come out of the water |
| **F** | carry a lantern |
| **O** | the view from the air and back |
| **[** and **]** | move the hour |
| **H** | all the keys |

## The rooms

| | |
|---|---|
| The Stair | Three flights down from the cellar doors, with a laundry off the first landing and a door on the second that does not open yet. |
| The Hall | The concierge's desk, a fire, robes. |
| The Listening Room | The bar, a record player and a wall of record sleeves, a banquette. Its north end is double height, with the stair to the upper floor. |
| The Cave | Cheese and wine under a stone vault. Sit down and a tasting is offered. |
| The Pool | The warm pool, the house's A in tesserae on its bed. You float. |
| The Chapel | Stained glass in lit niches, each window after one scientific paper, and an oculus to the sky. |
| The Banya, the Parnaya, the Treatment Room | The wash room, the steam room, one table. |
| The Tea Room | A samovar, daybeds, and a nail corner by the cloud window. |
| The Courtyard | An old pine, a hot tub, an edge pool at the brink, string lights and lanterns. |
| Upstairs | The Suite and its Bath, the Consulting Room, the Quiet Room, the Gallery. |

## The staff

Eleven robots, of the same make as the house's butlers. Each keeps its own rooms, turns to you as you come up, and has
a card of things you can say to it. What you ask for is brought to you on a tray.

- **Cosima**, the concierge. Coffee, champagne, a warm robe; she arranges steam, shoulders, nails, a tasting, or fifty minutes upstairs.
- **Saz**, at the bar. Everything from a brown sugar shaken espresso to a negroni.
- **Tomme**, in the Cave. A wheel of cheese in a beret. Whispers, because the cheese is asleep.
- **Pasha**, the banshchik. A birch log in the felt hat of the steam room.
- **Terry**, at the pool. Folds towels, skims the water, cannot see a wet guest without producing a towel.
- **Opal**, in the Treatment Room. A pale pebble with a leaf on top. Reiki, hot stones, a facial, the shoulders, threading: lie down on the table and it comes to your head and does it, in complete sincerity.
- **Bijou**, at the nail corner. Calls everyone "honey" and knows everything about everyone.
- **Hush**, in the quiet rooms. Says nothing. Brings tea before it is wanted.
- **Luna**, who keeps the Chapel. A luna moth with a lamplighter's pole; offers a question, not an answer.
- **Winnicbott**, the analyst. Lie down on the couch and he takes his chair behind your head.
- **Ding**, the bellhop. A brass bell. Ring and he comes.

`site/src/staff/README.md` says how they are made and how they behave.

## The oculus

The chapel's light shaft comes up in the garden of Anna's House as a ring of stones in the grass, glazed with a
stained-glass ring round a clear eye. The glass is after F. G. Varela, H. R. Maturana and R. Uribe, "Autopoiesis: the
organization of living systems, its characterization and a model" (BioSystems, 1974): a membrane of links that keeps
making itself. From below it colours the column of light over the chapel's table.

## Running it yourself

There is no build step. Serve the repository's folder with any static file server and open `/site/`:

    python3 -m http.server 8000

then <http://localhost:8000/site/>. Some address parameters help when looking at one thing:
`?room=The%20Pool` stands you in a room, `?at=court` in the courtyard, `?time=21.5` sets the hour, `?staff=0` leaves
the robots out, and `?at=court&staff=lineup` stands them in a row.

## How it is made

three.js (vendored in `site/vendor/`), plain ES modules, units in feet. Everything is built in code when the page
loads: there are a few scanned models and photographed textures, and the rest is geometry and painted canvases.

- `site/src/buildings/spanya.js`: the building itself: rock, courtyard, walls, floors, stairs, rooms.
- `site/src/furnish/`: what stands in the rooms, one file per group of rooms.
- `site/src/grounds/`: the courtyard's garden, pool, tub and lights.
- `site/src/staff.js`, `site/src/staff/`: the robots. `site/src/robokit/` is the body kit they share with the other places.
- `site/src/lighting.js`, `visibility.js`, `main.js`: light, what is drawn from where, the loop.
- `tools/`: a module check (`check.sh`), the preload list (`preload.py`), and scripts that drive a headless browser for test pictures.

## Credits

Pictures on the walls are public-domain works, each with its title and source on a card in the place (E on a
picture) and in `site/assets/art/manifest.json`. Models, textures, music and the record sleeves are credited in
`site/assets/credits/`. The record sleeves are in the public domain in the United States according to their pages
on Wikimedia Commons; sources are listed in `site/assets/credits/larder.md`.
