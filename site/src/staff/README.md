# The staff of Anna's Basement

Eleven robots work the house by default. Press E near one to speak or take a delivery. For an empty house, add `?staff=0`.

    ?at=court&staff=lineup            all eleven in a row in the courtyard, going through their gestures (E talks to them)
    ?staff=lineup:ding,saz&staffr=6   only those, six feet off
    ?room=The%20Hall&staff=1          everyone at their posts, living their day (any ?room= will do)
    ?staff=cosima,ding,saz            only those, at their posts

They are the make of the house's butlers and the town's clerks (`../robokit/`: one shell, a face screen, a ring
of light, two mitten hands), not the lab's FORM kit. Six draw calls each.

| who | where | what |
|---|---|---|
| **Winnicbott**, the analyst | The Consulting Room | Tweed, an open cardigan, round spectacles, a watch chain. Found in the chair behind the couch's head; leaves it only when the room is empty. Pours water. |
| **Cosima**, the concierge | The Hall | Dark green lacquer, brass buttons, a pillbox cap, the key to everything. Brings coffee, champagne or a warm robe to you; arranges steam, shoulders, nails, a tasting, fifty minutes upstairs. |
| **Saz**, the bar | The Listening Room | A black waistcoat, a waxed moustache, copper headphones, a cocktail cherry for an antenna. Makes everything; sets it on the bar. |
| **Tomme**, the cave | The Cave | A wheel of cheese in a beret with a tastevin on a chain. Whispers. Brings the tasting and the wine to you. |
| **Pasha**, the banya | The Banya, the Parnaya, the Tea Room | A birch log in the felt hat of the steam room. Venik, ladle, samovar. Brings tea. |
| **Opal**, treatments | The Treatment Room | A pale pebble with half-closed eyes and a leaf on top. Reiki, hot stones, a facial, the shoulders, threading. Lie down on the table and it comes to the head of it, leans in over you and does what you choose from its card (`table` in cast.js, `services` in lines.js, `treatment()` in staff.js). |
| **Terry**, the pool | The Pool | Sea-glass green, a towel round the head. Folds, skims the pool with a net, brings towels (to the edge, if you are in the water). |
| **Bijou**, nails | The Tea Room's nail corner | Hot pink with glitter, a beehive with a file through it. "Honey", always, and gossip. |
| **Hush**, the quiet rooms | The Quiet Room, the Gallery, the Suite | A grey ball in a tea cosy. Says nothing (asterisks only). Brings tea unasked, tends the fire, turns the bed down. |
| **Luna**, the chapel | The Chapel | A luna moth, cousin of Moth (the house's garden chapel) and Wren (Vesper Street's). Lamplighter's pole; keeps the candles and the bowl; offers a question, not an answer. |
| **Ding**, the bell | The Hall, and every ground-floor room | A brass bell. Answers every bell at speed; collects from Saz's bar and carries it to you. Plumps and dusts between. |

## Files

- `cast.js`: who they are: looks, rooms, posts (plan coordinates, from each furnish file's STAFF POSTS
  header), what each makes. Change a robot here.
- `lines.js`: everything they say; `BOOKINGS` (what the concierge arranges), `CHAT` (two of them, overheard), `RANG`.
- `bodies.js`: `buildStaff(look)`, what the hands hold (`PROPS`), `body.animate()`.
- `acts.js`: `pose(name, t, D)`: about forty gestures (the town's, and a bath-house's), `HOLDS` (what is in the
  hands for each), `SECS`.
- `../staff.js`: how they behave. Manners, navigation, the card of things to say, the speech bubbles and the
  drinks are the engine's own (`../faculty/manners.js`, `nav.js`, `talk.js`, `bubbles.js`, `drinks.js`).

## Bells

    ctx.staff.ring({ order: 'espresso' })          // the runner (Ding) fetches it from whoever makes it and brings it
    ctx.staff.ring()                               // comes and asks
    ctx.staff.ring({ order: {...}, at: { down() {} } })   // sets it down for her (down() puts it there) instead of handing it over
    ctx.staff.book('steam')                        // as the concierge does: Pasha is ready for her when she gets there

It returns false when nobody can come (no staff; she is somewhere the runner cannot get to), so a bell can keep
its own fallback. The nail corner's bell-push is already wired to it (`NAILS.onBell`), only while the staff are loaded.

## Routes

The staff build their plans from the room floors, connecting thresholds and furniture colliders. The pool attendant can open the courtyard doors and follow the dry patio to the outdoor pool and hot tub. The runner stays on the ground floor. The upstairs attendants use the gallery and bridge on their own level. Each door waits when a visitor or robot is in its swing.
