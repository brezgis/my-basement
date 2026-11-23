// banya: The Tea Room, The Banya, The Parnaya and The Treatment Room (furnish file of the agent `banya`; the pieces are
// in banya_parts.js, what moves and glows in banya_fx.js, the nail corner's pieces in banya_nails_*.js, the sign in
// banya_sign.js). See README.md here and the README at the project's root.
//
// Spanya, the banya of Anna's Basement, in its own order. You come in from the courtyard to the TEA ROOM (the
// predbannik, the rest room: you undress here and come back here between steams), go through under the sign to the
// BANYA (the moechnaya, the wash room: wash, plunge, a bucket of cold water over the head), into the PARNAYA (the
// steam room: heat, a ladle of water on the stones, the venik), back out to the cold, round again, and at the end to
// tea. THE TREATMENT ROOM is where the robots do the rest; and in a corner of the Tea Room one technician does nails
// (nails being, as Anna says, a totally Russian thing too).
//
// The look is the house's one language (notes/STYLE.md): walnut and honey timber, slate, pale hinoki in the wet rooms,
// cream linen, wool and sheepskin, amber light hidden in coves and under benches; low Scandinavian furniture of the
// 1950s and 60s (Børge Mogensen's daybeds, Wegner's Papa Bear chair for the nail throne, a Morsø drum stove, Noguchi's
// Akari lanterns). What it does is Russian, and real.
//
// Precedents.
//   The Sanduny baths in Moscow (Sandunovskie bani, Neglinnaya Street; rebuilt 1894-96 to Boris Freudenberg's design)
//   for the order of the wash room: a cold plunge, benches along the wall with taps over them and basins on them, robes
//   on hooks, a big clock. Here the plunge is a cedar tub and the bench slate, as in a Finnish sauna house or an onsen.
//   A village banya for the steam room: a white banya (po-belomu: with a chimney; the black one, po-chyornomu, had
//   none, and the smoke went out of the door before anyone went in): a stone stove with a heap of river stones in an
//   iron cage, tiered benches (the polok) to lie on at the top where it is hottest, veniks soaking in a tub, felt hats.
//   The ritual: steam, venik, cold plunge, tea. The tea table is laid after Kustodiev's tea tables: the samovar (the
//   one gleaming brass thing in the room), the glasses in their podstakanniki, jam in glass rosettes, the watermelon,
//   the fruit. His Russian Venus, stepping out of a banya's steam with a venik, hangs over the daybed.
//   The sign: the lettering of the Moscow Printing Yard's books of the seventeenth century (ustav capitals, a cinnabar
//   initial, a titlo, vyaz ligatures), the one sign in the place.
//
// STAFF POSTS (plan X, Y; every floor is h 0.4; for the agent who does the staff: nobody is placed here)
//   The Tea Room, the tea attendant: home [94.5, 31.75], faces [96.3, 32.0] (east, the samovar's tap, at the tea
//     table's west end; the tap points down the aisle). serve: { machine: [94.5, 31.75], pickup: [96.1, 32.8, 2.52]
//     (the table's top, its north-east corner) }, drinks: 'glass of tea' (tumbler, 0x6e2a0a), 'tea' (teacup: a drink
//     named exactly 'tea' gets the lemon), 'Ivan-chai' (teacup, 0x9a5a2a), 'kvass' (highball, 0x5a3212). Posts: the
//     east shelves [104.4, 28.0] facing east, the north daybed [98.0, 36.0] facing north, the stove [102.0, 36.4]
//     facing east.
//   The Tea Room, the nail technician (she calls every guest "honey", always; her lines and the drinks are in
//     banya_nails_text.js): home on her low stool at [96.5, 18.4] facing north (the guest in the throne, whose seat is
//     at [96.5, 22.65]); she works at the foot basin [96.5, 20.45], the manicure table [99.7, 22.6] (gel lamp, tools,
//     polish) facing east, and the polish shelf [103.0, 18.9] facing south. The bell-push is on the throne's right paw.
//     THE BELL: banya_nails_fx.js exports NAILS. Set NAILS.onBell = ({ i, drink, ctx, throne }) => { ...; return true }
//     to take the order with a robot (she calls it out: "Seven minutes, honey!"), and call NAILS.deliver(0, drink) when
//     the cup is set down: it appears on the manicure table at NAILS.thrones[0].table ([99.35, 22.45, 2.82]), takeable.
//     Without onBell the bell rings, the order is called in a flash and the cup is there 2.6 s later.
//   The Banya, the plunge attendant: home [97.0, 46.4], faces [99.2, 46.4] (east, the plunge); posts the bench [94.6,
//     52.4] facing north (it fills the basins), the linen shelves in the passage [81.4, 64.7] facing east, the
//     tipping bucket [82.6, 68.4] facing north (it refills the bucket and hands up the rope).
//   The Parnaya, the banshchik with his venik: home [90.0, 63.6], faces [90.0, 71.1] (north, the top tier, where the
//     guest lies); posts the stove [93.5, 60.6] facing south (water on the stones), the venik tub [88.6, 63.6] facing
//     west. Leave him the duckboard (X 88..94, Y 61.8..65.4).
//   The Treatment Room, the masseurs (four hands): [99.3, 64.6] facing east and [102.7, 64.6] facing west, either side
//     of the table; posts the trolley [99.0, 58.2] facing west, the towel warmer [104.9, 70.1] facing north, the basin
//     [104.6, 57.2] facing east, the console of herbs [97.8, 63.9] facing west, the shelves [104.6, 64.5] facing east.
//   Things to serve from: the samovar and the fruit (the Tea Room's table), the linen shelves (the Banya's passage), the
//   trolley of oils (Treatment Room), the warm towels (Treatment Room, north-east corner).
import { MAT, leaves, pot, fern, orchid, candleCluster, samovar, teaGlass, jamJar, rosette, honeyPot, plate, sushkiHeap, tulaPryanik, pryanikiHeap, lemons, fruitBowl,
  watermelon, hatOnPeg, venik, shayka, bucket, kovsh, taps, linenShelves, robeRail, duckboard, massageTable, trolley, towelWarmer, basinStand, vessel, tube, ball,
  EAT, lowDaybed, ovalTable, slabTable, slabBench, drumStove, akari, cove, slatScreen, cedarTub, COVES, floorLantern, litShelves, mossBed, hangingLantern, floorCandleLantern, sconce, feltHat } from './banya_parts.js';
import { flames, steam, glow, noise, bucketTip, clockHands, rings, lieSpots, walkOn, wash, stoveFire } from './banya_fx.js';
import { parts as nailParts, C as NC, BOUCLE, OCHRE, prettyShelf } from './banya_nails_parts.js';
import { polishBottles, bells } from './banya_nails_fx.js';
import * as NTX from './banya_nails_text.js';
import { drawSpanya, drawSpanyaPlate } from './banya_sign.js';
import * as THREE from 'three';

export default function (f) {
  const K = f.kit, D = f.draw, F = 0.4, CL = f.room('The Tea Room').ceil - F;      // CL: the shell's ceiling, above the floor (12.2)
  const CP = 9.4;                                                    // the Parnaya's own lower timber ceiling, for the heat
  const slab = (S, X0, X1, Y0, Y1, h0, h1) => S.bev(MAT.SLATED, X0, X1, Y0, Y1, h0, h1, 0.05);      // the stove's body of dark stone
  const L = leaves(K); COVES.length = 0;
  const fr = (X, Y, q = 0, z = 0) => f.fr(X, Y, F + z, q);
  const help = (frame, x, y, z, e) => { const [X, Y] = frame.map(x, y); f.help({ at: [X, Y, frame.h + z], reach: 6, ...e }); };
  const glowOnly = fn => { const n = K.lamps.length; fn(); K.lamps.length = n; };
  const teaFlames = [], banyaFlames = [], parFlames = [], treatFlames = [], lies = [], later = [];
  const W = (X, Y, h) => f.world(X, Y, h);

  // =================================================================================================================
  // THE TEA ROOM: X 84.2..106.5, Y 17.5..40.2. Glazed doors to the courtyard in the west bay (X 84.3, Y 25..31: the
  // leaves swing in); the window over the clouds in the south wall (X 93..100); the opening north to the Banya
  // (X 88..93). Its places: the nail corner at the window, behind a slatted screen; the tea table in the middle; a
  // daybed by the courtyard glass and one under the picture by the stove. Nothing stands on the way between the doors.
  // =================================================================================================================
  {
    // ---- the tea table: one slab of walnut, benches with sheepskins, the samovar facing the open aisle at its west end
    const C = [98.6, 32.0], T = fr(C[0], C[1], 2), top = slabTable(K, T, 6.6, 3.0, 2.5, MAT.OAK);
    slabBench(K, fr(C[0], 28.95), 6.0, { skins: [-1.5, 1.6], wood: MAT.OAK }); slabBench(K, fr(C[0], 35.05, 2), 6.0, { skins: [0.3], wood: MAT.OAK });
    const z = top + 0.005;
    K.cloth(T, MAT.LINEN, { cx: 0, cy: 0, z: top + 0.006, a: 3.0, b: 0.55, l: 0.35, r: 0.35, rho: 0.03, folds: 0.02, freq: 1.2, thick: 0.02, res: 0.2 });
    const S = fr(C[0] - 2.3, C[1], 1, top + 0.02), sv = samovar(K, S, 0, 0, 0);
    { const [a, b] = K.world(S, 0, 0); K.steam.push({ x: a, y: S.h + sv.top + 0.42 + 0.35, z: b }); }
    help(S, 0, 0.75, 0.45, { name: 'glass of tea', drink: { vessel: 'tumbler', liquid: 0x6e2a0a }, label: 'pour yourself a glass of tea from the samovar', note: 'You finish the glass of tea: strong from the teapot, topped up from the samovar, drunk through a lump of sugar held in the teeth, as the merchants drank it.' });
    help(S, 0, 0, sv.top + 0.25, { name: 'tea', drink: { vessel: 'teacup', liquid: 0x8a3a10 }, label: 'pour yourself a cup of tea with lemon', note: 'You finish the tea. Strong, a little sweet, the lemon at the bottom of the cup.' });
    [[-2.6, -1.0, 0.4], [-1.0, -1.05, 1.2], [0.9, -1.0, 2.2], [-2.0, 1.0, 3.4], [-0.2, 1.05, 4.1], [1.0, 1.05, 5.0]].forEach(([x, y, a], i) => { teaGlass(K, T, x, y, z, a, i === 2 ? 0.3 : 0.75); plate(K, T, x, y, z - 0.003, 0.22); });
    const fb = fruitBowl(K, T, -0.4, 0.0, top + 0.02, 6);
    const fruitNotes = { apple: 'You finish the apple. An Antonovka, sharp and white: the apple of every Russian autumn.', mandarin: 'You finish the mandarin. It smells of New Year.', pear: 'You finish the pear. Butter-soft, and it drips.', pomegranate: 'You finish the pomegranate, seed by seed. Your fingers are red to the knuckle.', grapes: 'You finish the grapes. Black and sweet, from the south.' };
    for (const [kind, list] of Object.entries(fb)) { const [x, y, zz] = list[0]; help(T, x, y, zz + 0.05, { name: kind === 'grapes' ? 'bunch of grapes' : kind, build: EAT[kind], bites: kind === 'grapes' ? 4 : 3, note: fruitNotes[kind] }); }
    plate(K, T, 0.85, 0.35, z + 0.02, 0.36); pryanikiHeap(K, T, 0.85, 0.35, z + 0.05, 9, 5);
    help(T, 0.85, 0.35, z + 0.17, { name: 'pryanik', build: EAT.pryanik, bites: 3, note: 'You finish the pryanik: honey, cinnamon, clove, and the glaze cracking under your teeth.' });
    plate(K, T, 1.15, -0.4, z + 0.02, 0.3); tulaPryanik(K, T, 1.15, -0.4, z + 0.05, 0.3);
    help(T, 1.15, -0.4, z + 0.2, { name: 'Tula pryanik', build: EAT.tula, bites: 4, note: 'You finish the Tula pryanik: a slab of gingerbread with plum jam inside and the town\'s arms printed in its crust.' });
    plate(K, T, -1.6, 0.45, z + 0.02, 0.34); sushkiHeap(K, T, -1.6, 0.45, z + 0.05, 12, 4);
    help(T, -1.6, 0.45, z + 0.14, { name: 'sushka', build: EAT.sushka, bites: 2, note: 'You finish the sushka. You dunked it, which is the only correct way.' });
    rosette(K, T, 0.30, 0.93, z + 0.02, 'c#7a1020/0.25'); rosette(K, T, 0.42, 0.49, z + 0.02, 'c#d9822a/0.3'); jamJar(K, T, 0.35, -0.55, z + 0.02, 'c#7a1020/0.25');
    help(T, 0.30, 0.93, z + 0.12, { name: 'spoonful of cherry varenye', build: EAT.jam, bites: 2, note: 'You finish the cherry varenye, stone by stone, from the spoon: never stirred into the tea.' });
    honeyPot(K, T, 0.70, 1.28, z + 0.02);
    lemons(K, T, -0.05, -0.95, z + 0.02);
    watermelon(K, T, -2.6, 0.1, top);
    help(T, -1.88, -0.2, top + 0.35, { name: 'slice of watermelon', build: EAT.watermelon, bites: 4, note: 'You finish the watermelon. Astrakhan, in November: the robots will not say how.' });
    f.label(S, 0, 0, 1.6, { label: 'look at the samovar', title: 'The samovar', kicker: 'Tula, 1890s',
      text: 'Brass, in the Tula way: a tall urn with a chimney up its middle in which charcoal keeps the water at a simmer all day. The teapot sits on the crown to keep warm: very strong tea, zavarka, is poured a finger deep into the glass and the glass filled from the tap. The medals on its shoulder are the maker\'s, won at fairs.\nThe glasses go in podstakanniki, holders of nickel silver with a handle, so that the tea can be scalding and the fingers spared.' });
    // two lanterns with candles hung over the table; candles on it; the room's one lamp is their light
    for (const dx of [-1.8, 1.0]) hangingLantern(K, fr(C[0] + dx, C[1]), 0, 0, CL, 4.4, teaFlames);
    candleCluster(K, T, -1.0, 0.45, z + 0.02, teaFlames, 3, 1);
    f.lamp(C[0] - 0.4, C[1], F + 6.4, { power: 1.1, kind: 'candle' });

    // ---- the two daybeds: one by the courtyard glass (south-west), one along the north wall under the picture
    const beds = [
      [fr(86.6, 21.0, 1), { len: 6.6, wood: MAT.OAK, futon: 'linen#e4dccb', bolster: 'wool#6a6a4a', blanket: 'wool#8a5a2a', cushion: 'wool#b0782e', head: -1 }, 6, 1, 'You lie back on the daybed by the courtyard glass. The pine moves. Nobody needs you anywhere.'],
      [fr(98.0, 38.6, 0), { len: 6.6, wood: MAT.OAK, futon: 'linen#ddd3c0', bolster: 'wool#7a5226', blanket: 'wool#8a8a6a', cushion: 'linen#c9b89a', head: -1 }, 6, -1, 'You stretch out on the sheepskin. The stove talks to itself. Somewhere a robot is folding towels very quietly.'],
    ];
    // a tatami mat under each daybed, edged in dark cloth (the floor is slate)
    for (const [X0, X1, Y0, Y1] of [[84.6, 88.6, 17.6, 24.4], [94.3, 101.7, 36.4, 40.15]]) { f.box('tatami', X0, X1, Y0, Y1, F + 0.0, F + 0.09); for (const [a0, a1, b0, b1] of [[X0, X1, Y0, Y0 + 0.12], [X0, X1, Y1 - 0.12, Y1]]) f.box('c#2c2a24/0.8', a0, a1, b0, b1, F + 0.0, F + 0.12); }
    beds.forEach(([d, o, look, sitSide, line]) => {
      const l = lowDaybed(K, d, o), [X, Y] = d.map(l.x, 0), [LX, LY] = d.map(l.x + look, 0);
      lies.push({ at: [X, Y, F + 2.0], eye: [X, Y, F + l.z], look: [LX, LY, F + 3.4], label: 'lie down on the daybed', then: c => c.flash?.(line) });
      const [SX, SY] = d.map(0.8, sitSide * ((o.w ?? 3) / 2 - 0.7)); K.seat(f.fr(SX, SY, F, sitSide > 0 ? d.q : (d.q + 2) % 4), 0, 0, 1.25, 'sit on the daybed');
    });
    f.framed(fr(98.0, 40.23, 2), 0, 5.2, 2.4, 2.41, 'kustodiev_merchant_wife_tea', { frame: 'oak_light#9a7448', mat: 0, border: 0.12, title: "Merchant's Wife at Tea", kicker: 'Boris Kustodiev, 1918',
      text: 'A merchant\'s wife of the Volga takes her tea on the balcony: the samovar, the watermelon cut open, the grapes, the jam and the pastries, the town and its white church behind her, and the cat, rubbing its head on her shoulder and plainly hoping for something off the table. Kustodiev painted it in Petrograd in 1918, ill and in a wheelchair, in a year of hunger: a picture of plenty out of memory.\nThe tea table under it is laid after hers.', foot: 'State Russian Museum, St Petersburg. Public domain.' });
    for (const x of [-1.85, 1.85]) sconce(K, fr(98.0, 40.23, 2), x, 4.9, teaFlames);
    for (const x of [-1.6, 1.6]) sconce(K, fr(86.6, 17.52, 0), x, 4.9, teaFlames);
    f.framed(fr(86.6, 17.52, 0), 0, 5.2, 2.0, 2.31, 'kustodiev_russian_venus', { frame: 'oak_light#9a7448', mat: 0, border: 0.12, title: 'Russian Venus', kicker: 'Boris Kustodiev, 1925-26',
      text: 'Venus born not from the sea but from the steam of a banya: a woman of Kustodiev\'s Volga stands on the bench with a birch venik, the soap foam on the boards at her feet like the foam of the sea. He painted it a year before he died, paralysed, on the back of one of his own canvases.', foot: 'Nizhny Novgorod State Art Museum. Public domain.' });

    // by the nail corner, on the east wall: Serov's girl with peaches, between two candles
    f.framed(fr(106.48, 22.0, 1), 0, 5.3, 2.2, 2.48, 'serov_girl_with_peaches', { frame: 'oak_light#9a7448', mat: 0, border: 0.12, title: 'Girl with Peaches', kicker: 'Valentin Serov, 1887', text: 'Vera Mamontova, twelve, at the table in her father\'s house at Abramtsevo, in a pink blouse with a black bow, peaches and a knife before her, the summer light coming in through the window behind. Serov was twenty-two; he kept her sitting for weeks, and she was paid in peaches.', foot: 'State Tretyakov Gallery, Moscow. Public domain.' });
    for (const x of [-1.75, 1.75]) sconce(K, fr(106.48, 22.0, 1), x, 5.0, teaFlames);
    // ---- the stove in the north-east corner, its window to the room
    { const St = fr(104.3, 38.0, 1), s = drumStove(K, St, { ceil: CL });
      const [CX, CY] = St.map(0, s.box.y), [NX, NY] = St.map(0, s.box.y + 1);
      later.push(ctx => stoveFire(ctx, W, { c: [CX, CY, F + s.box.z], n: [NX - CX, NY - CY], w: s.box.w, d: s.box.d, tall: 1.45, floor: F }));
      f.label(St, 0, 1.2, 2.2, { label: 'warm your hands at the stove', note: 'Birch logs, and the glass gone amber with the heat.' }); }
    // ---- the east wall: lit shelves of books, stoneware, linen and candles behind the samovar
    litShelves(K, fr(106.48, 31.4, 1), 8.6, [0.9, 2.3, 3.7, 5.1, 6.5], teaFlames, { glow: false, back: MAT.OAK, wood: MAT.OAK, d: 1.1, items: ['books', 'jar', 'bowls', 'linen', 'candle', 'books', 'stones', 'plant', 'jar'], subject: 'literature', seed: 4 });
    // ---- green things and light: a fern by the courtyard doors, a paper lantern by the glass, coves
    { const p = fr(85.3, 37.6), h = pot(K, p, 0, 0, 0.6, 1.2, MAT.GZHEL, 'tall'); fern(K, L, p, 0, 0, h, 0.95, 31); p.block(-0.6, 0.6, -0.6, 0.6, 0, 1.4); }
    floorCandleLantern(K, fr(91.0, 18.3), 0, 0, teaFlames);

    // ---- THE NAIL CORNER, at the cloud window, set off from the tea table by a slatted screen: one throne (Wegner's
    // Papa Bear, grown into a throne) turned to the window, a copper foot basin before it, the technician's low stool,
    // a small manicure table at its right with a lamp and the gel lamp, and a short lit shelf of polishes with glitter
    { const NP = nailParts(K), N = NC;
      slatScreen(K, fr(95.6, 26.2, 0), { pw: 1.9, tall: 6.4, wood: MAT.OAK });
      const TH = fr(96.5, 24.4, 2), t = NP.throne(TH, { fabric: BOUCLE, cushion: OCHRE });
      f.seat(TH, ...t.seat, 'sit in the nail throne');
      const bx = 1.08, by = 2.5, bz = t.paw + 0.02;
      TH.cyl(N.BRASS, bx, by, bz - 0.01, bz + 0.04, 0.085, 0.075, 12); TH.cyl('c#efe6d4/0.25', bx, by, bz + 0.04, bz + 0.075, 0.035, 0.03, 10);
      const [BX, BY] = TH.map(bx, by);
      const G = fr(0, 0);
      NP.basin(G, 96.5, 20.45); NP.techStool(G, 96.5, 18.4, 1.25);
      f.label(G, 96.5, 20.45, 1.2, { label: 'look at the foot basin', note: NTX.SAY.basin });
      // the manicure table: walnut, a hand rest, the gel lamp, a jar of tools, polish, a PH lamp glowing over it
      const MX = 99.7, MY = 22.6, MZ = 2.4;
      for (const [dx, dy] of [[-0.7, -0.5], [0.7, -0.5], [-0.7, 0.5], [0.7, 0.5]]) G.bev(N.WALNUT, MX + dx - 0.06, MX + dx + 0.06, MY + dy - 0.06, MY + dy + 0.06, 0, MZ - 0.1, 0.01);
      G.bev(N.WALNUT, MX - 0.85, MX + 0.85, MY - 0.65, MY + 0.65, MZ - 0.1, MZ, 0.02); f.block(MX - 0.85, MX + 0.85, MY - 0.65, MY + 0.65, F, F + MZ);
      NP.towel(G, MX - 0.3, MY + 0.3, MZ, 0.6, 0.4); NP.gelLamp(G, MX + 0.35, MY + 0.3, MZ); NP.toolJar(G, MX + 0.55, MY - 0.35, MZ);
      glowOnly(() => K.tableLamp(G, MX + 0.45, MY + 0.35, MZ, 'c#e8dcc4'));      // a plain lamp with a linen shade, lit at dusk (not one of the room's lamps)
      f.label(G, MX + 0.35, MY + 0.3, MZ + 0.4, { label: 'look at the gel lamp', note: NTX.SAY.gel });
      // the polish: on a little oak wall shelf with scalloped aprons (south wall, east of the window), and a few on the
      // table, one of them open with its brush out. Every bottle is a bottle: four shapes, glass, polish seen through
      // it with a paler line at the top, caps of their own; not in rows: turned, one gone, one lying down.
      const PS = fr(103.0, 17.52, 0), pw = 2.9, Z = [3.3, 3.95, 4.6], bottleList = [];
      prettyShelf(K, PS, pw, Z, { d: 0.5 });
      const hsl = (h, s, l) => { const k = n => (n + h * 12) % 12, a = s * Math.min(l, 1 - l), c = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return (Math.round(c(0) * 255) << 16) | (Math.round(c(8) * 255) << 8) | Math.round(c(4) * 255); };
      const SH = ['round', 'square', 'slim', 'round', 'tiny', 'round', 'square', 'slim', 'tiny'], CAPS = ['black', 'black', 'gold', 'white', 'black', 'gold', 'black', 'white', 'black'];
      let seed = 17; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      Z.forEach((zz, k) => {
        let x = -pw / 2 + 0.22, i = 0;
        while (x < pw / 2 - 0.22) {
          const shape = SH[(i * 5 + k * 3) % SH.length], wdt = shape === 'square' ? 0.2 : shape === 'slim' ? 0.13 : shape === 'tiny' ? 0.12 : 0.17;
          const u = (x + pw / 2) / pw, glit = k === 1 && i % 2 === 0;
          const col = glit ? hsl((u * 0.9 + 0.55) % 1, 0.75, 0.62) : hsl((u * 0.85 + 0.92 + k * 0.03) % 1, 0.55 + 0.2 * rnd(), [0.78, 0.6, 0.42][k] + (rnd() - 0.5) * 0.1);
          const gap = (k === 0 && i === 6) || (k === 2 && i === 3), lying = k === 2 && i === 9;
          if (!gap) { const [X, Y] = PS.map(x + wdt / 2, 0.24 + (rnd() - 0.5) * 0.08); bottleList.push({ X, Y, h: F + zz, shape: lying ? 'round' : shape, col, cap: glit ? 'gold' : CAPS[(i + k) % CAPS.length], glitter: glit, yaw: (rnd() - 0.5) * 0.9, lying }); }
          x += (lying ? 0.32 : wdt) + 0.03 + rnd() * 0.04; i++;
          if (k === 0 && i === 10) { const [AX, AY] = PS.map(x + 0.12, 0.25); vessel(K, G, MAT.GLASS, AX, AY, zz, [[0, 0], [0.09, 0], [0.095, 0.2], [0.08, 0.22], [0, 0.22]], 12); for (let b = 0; b < 6; b++) ball(K, G, 'c#f7f4ee/0.95', AX + Math.cos(b * 2.4) * 0.04, AY + Math.sin(b * 2.4) * 0.04, zz + 0.07 + (b % 3) * 0.05, 0.035, [1, 1, 1], 6); x += 0.3; }
          if (k === 2 && i === 5) { const [VX, VY] = PS.map(x + 0.1, 0.25); K.posy(G, VX + 0.08, VY, zz, ['c#f0b8c4/0.8', 'c#e58f9a/0.8', 'c#f6efe4/0.8']); x += 0.34; }
        }
      });
      // among them: a dish of files and emery boards, a tube of hand cream
      { const [DX, DY] = PS.map(-0.95, 0.27); vessel(K, G, MAT.CHINA, DX, DY, Z[1], [[0, 0], [0.12, 0], [0.16, 0.04], [0.15, 0.045], [0, 0.012]], 12); for (let b = 0; b < 4; b++) G.box(b % 2 ? 'c#c9a88a/0.9' : 'c#8a8a8a/0.4/0.6', DX - 0.1, DX + 0.1, DY - 0.03 + b * 0.02, DY - 0.015 + b * 0.02, Z[1] + 0.02 + b * 0.006, Z[1] + 0.025 + b * 0.006); }
      K.lotionTube(PS, 1.0, 0.25, Z[0], { colour: 'c#efe6dc/0.4', cap: 'c#c9a45a/0.3/1', len: 0.4, turn: 0.2 });
      // on the manicure table: three bottles, one open with its brush out and the cap lying beside it
      for (const [dx, dy, shape, col, extra] of [[-0.62, -0.42, 'round', 0xb0203a, {}], [-0.42, -0.5, 'square', 0xe8a8b4, {}], [-0.2, -0.4, 'slim', 0x7a1a3a, { open: true }], [-0.05, -0.32, 'slim', 0x7a1a3a, { brush: true, yaw: 0.6 }]])
        bottleList.push({ X: MX + dx, Y: MY + dy, h: F + MZ, shape, col, cap: 'black', yaw: dx * 3, ...extra });
      f.label(PS, 0, 0.6, Z[1] + 0.3, { label: 'look at the polish', note: NTX.SAY.glitter });
      const thronesSpec = [{ seat: [96.5, 22.65, F + t.seat[2]], bell: [BX, BY, F + bz + 0.08], table: [MX - 0.35, MY - 0.15, F + MZ + 0.012] }];
      later.push(ctx => { polishBottles(ctx, W, bottleList, W(103.0, 18.6, F + 4.0)); bells(ctx, W, thronesSpec, n => Math.floor(Math.random() * n)); });
    }
  }

  // =================================================================================================================
  // THE BANYA (the wash room): X 84.2..106.5, Y 40.8..55, and the passage west of it (X 77.3..84.2, back to Y 72.5).
  // Its ways: in from the Tea Room (X 88..93), on to the Parnaya and the Treatment Room (doors in the north wall,
  // X 88.3..91.3 and 99.5..102.5), and up the passage to the Pool (its opening in the west wall, Y 61.5..66.1).
  // =================================================================================================================
  {
    // ---- the cold plunge: a round cedar tub, raised, bronze hoops, hinoki steps up its east side
    const PX = 101.8, PY = 46.4, R = 2.6, PH = 3.0, P = fr(PX, PY, 2);
    cedarTub(K, P, R, PH);
    vessel(K, P, MAT.WATERD, 0, 0, 0, [[0, PH - 0.45], [R - 0.23, PH - 0.45], [0, PH - 0.44]], 40);
    vessel(K, P, 'c#9ac4c4/0.05', 0, 0, 0, [[0, PH - 0.38], [R - 0.23, PH - 0.38], [0, PH - 0.375]], 40);
    for (let i = 0; i < 3; i++) P.bev(MAT.HINOKI, R - 0.1 + (2 - i) * 0.66, R + 0.56 + (2 - i) * 0.66, -1.5, 1.5, 0, (i + 1) * PH / 3 - 0.04, 0.02);
    tube(K, P, MAT.BRONZE, [[R + 1.85, 1.6, 0], [R + 1.85, 1.6, 3.0], [R + 1.3, 1.6, 3.9], [R + 0.4, 1.6, 4.2], [R - 0.3, 1.6, 3.9], [R - 0.6, 1.6, PH - 0.5]], 0.05, 10);
    for (const [a, b] of [[R, R * 0.6], [R * 0.6, R]]) P.block(-a, a, -b, b, 0, PH + 0.1);
    for (let i=0;i<3;i++) {
      const edge = PX-R+0.1-(2-i)*0.66;
      f.surface(edge-0.66,edge,PY-1.5,PY+1.5,F+(i+1)*PH/3-0.04);
    }
    const waterH = F + PH - 0.38;
    later.push(ctx => {
      const ring = rings(ctx, W, [PX, PY, waterH], R - 0.3);
      lieSpots(ctx, W, [{ at: [PX - R + 0.6, PY, F + PH + 0.5], eye: [PX + 0.6, PY, waterH + 0.85], look: [PX - 9, PY - 1, waterH + 1.4], label: 'step into the cold plunge', reach: 7, size: 2.2, then: c => { ring(); noise(c, 'splash'); c.flash?.(['It is twelve degrees. Your whole body says one word, and it is not a polite one. Then it is wonderful.', 'In to the neck. The heat goes out of you like a held breath. You have never been so awake.', 'Cold. Cold. COLD. And then, somehow, warm.'][Math.floor(Math.random() * 3)]); } }]);
    });
    f.label(fr(PX - R - 0.4, PY), 0, 0, 3.4, { label: 'look at the plunge', title: 'The cold plunge', kicker: 'kupel', text: 'After the parnaya, into the cold: twelve degrees, fed from a spring under the rock. At the Sanduny baths in Moscow it is a marble pool under a vault of columns; in a village it is the river, or a hole cut in the ice, or a snowdrift. Here, a tub of red cedar.\nIn to the neck, for as long as you can bear it. Out. Tea. Back into the steam.' });
    { const G = fr(PX, PY); glowOnly(() => akari(K, G, 0, 0, CL, 3.0, 1.0, 1.7)); f.lamp(PX, PY, F + 6.9, { power: 1.0, kind: 'lamp' }); }
    floorLantern(K, fr(105.9, 41.4), 0, 0, 4.0, 0.45); floorLantern(K, fr(105.9, 54.4), 0, 0, 4.0, 0.45); floorLantern(K, fr(84.9, 54.4), 0, 0, 4.0, 0.45);

    { const SG = fr(106.46, PY, 1), w = 5.0, tall = 1.58, sz = 6.25;
      SG.bev('oak_light#9a7448', -w / 2 - 0.12, w / 2 + 0.12, 0.02, 0.1, sz - tall / 2 - 0.12, sz + tall / 2 + 0.12, 0.02);
      f.sign(SG, 0, sz, w, tall, drawSpanya, { y: 0.13, rough: 0.6 });
      f.sign(SG, 0, sz - tall / 2 - 0.42, 2.5, 0.3, drawSpanyaPlate, { y: 0.04, rough: 0.3 });      // (a small silver plate under it, in brackets: Anna's words)
      f.label(SG, 0, 0.2, sz, { label: 'read the sign', title: 'СПАНЬЯ', kicker: 'Spanya: the banya of Anna\'s Basement',
        text: 'Spa and banya, for Anya. Lettered by the robots as a scribe of the Moscow Printing Yard would have lettered the heading of a psalter in 1650: tall ustav capitals, the first one a great cinnabar initial with a sprig growing out of it, the Н and the Ь sharing a stem, the я written the old way as ꙗ, a titlo over the whole and stops of four red dots either side.\nThe robots wished it noted that it took them eleven days, and that a psalter would have been quicker.' }); }

    for (const x of [-3.15, 3.15]) sconce(K, fr(106.48, PY, 1), x, 5.8, banyaFlames);
    // ---- the north wall between the two doors: a slate bench with a glow under it, bronze taps, wooden basins; the
    // clock above it; a cove of light
    { const B = fr(94.6, 55.03, 2), hw = 2.4, d = 1.5, h = 1.6;
      B.bev(MAT.SLATE, -hw, hw, 0.05, d, h - 0.25, h, 0.03); B.bev(MAT.SLATED, -hw + 0.15, hw - 0.15, 0.05, d - 0.35, 0, h - 0.25, 0.02);
      B.box('e#ff9440/1.1', -hw + 0.2, hw - 0.2, d - 0.42, d - 0.36, 0.03, 0.08); B.block(-hw, hw, 0, d, 0, h);
      taps(K, B, 0, 3.35); shayka(K, B, -1.0, 0.8, h, { mat: MAT.HINOKI }); shayka(K, B, 1.3, 0.8, h, { mat: MAT.HINOKI, r: 0.45 }); kovsh(K, B, -0.7, 0.8, h + 0.2, { rz: 2.4, tilt: 0.45, len: 1.1, mat: MAT.HINOKI });
      for (let i = 0; i < 6; i++) tube(K, B, 'c#c8b07a/0.9', [[0.0 + i * 0.04, 0.5, h + 0.05], [0.5, 0.6 + (i % 3) * 0.08, h + 0.08]], 0.03, 4);
      K.seat(B, -1.6, 0.8, h, 'sit on the slate bench'); K.seat(B, 1.6, 0.8, h, 'sit on the slate bench');
      cove(K, B, -hw - 0.6, hw + 0.6, CL - 0.8);
      const CZ = 7.0, CR = 1.1;
      vessel(K, B, MAT.OAKD, 0, 0.05, CZ, [[0, -0.15], [CR + 0.12, -0.15], [CR + 0.15, -0.05], [CR + 0.12, 0.08], [0, 0.08]], 40, { rx: -Math.PI / 2 });
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; B.box(MAT.BRASS, Math.sin(a) * CR * 0.92 - 0.025, Math.sin(a) * CR * 0.92 + 0.025, 0.24, 0.27, CZ + Math.cos(a) * CR * 0.92 - 0.025, CZ + Math.cos(a) * CR * 0.92 + 0.025); }
      later.push(ctx => clockHands(ctx, W, { X: 94.6, Y: 55.03 - 0.24, h: F + CZ, ux: 0, uy: -1, r: CR }));
      f.label(B, 0, 0.4, CZ, { label: 'look at the clock', note: 'In a banya nobody hurries. The clock is there to say that it does not matter what time it is.' });
      later.push(ctx => steam(ctx, W, { rect: [92.6, 96.6, 52.4, 54.4], h: F + 2.2, n: 14, alpha: 0.05, size: 2.0, rise: 1.2, spread: 1.0 }));
    }
    // ---- the long south wall: a rail of oak pegs with veniks hung to dry along it (birch, oak, juniper, some fresh,
    // some gone gold), felt hats at its ends; under it, a little shelf of soaps, brushes and bast, lit by a candle
    { const S = fr(99.8, 40.77, 0), x0 = -6.2, x1 = 5.6, PZ = 7.6;
      S.bev(MAT.OAK, x0, x1, 0.02, 0.14, PZ - 0.2, PZ + 0.2, 0.015);
      const kinds = [['birch', MAT.BIRCH], ['oak', MAT.OAKLEAF], ['birch', MAT.DRY], ['juniper', MAT.JUNIPER], ['birch', MAT.BIRCH2], ['oak', MAT.DRY], ['birch', MAT.BIRCH], ['birch', MAT.DRY], ['oak', MAT.OAKLEAF]];
      const n = kinds.length;
      for (let i = 0; i < n + 2; i++) { const x = x0 + 0.5 + i * (x1 - x0 - 1.0) / (n + 1);
        K.put(S, MAT.OAK, K.geom.lathe([[0.04, 0], [0.035, 0.28], [0.05, 0.3], [0, 0.32]], { seg: 6 }), { rx: -Math.PI / 2 - 0.3, at: [x, 0.14, PZ] });
        if (i === 0 || i === n + 1) { hatOnPeg(K, S, x, PZ, i ? MAT.FELT2 : MAT.FELT, null); continue; }
        const [kind, col] = kinds[i - 1];
        tube(K, S, 'c#c8b07a/0.9', [[x, 0.4, PZ - 0.05], [x, 0.42, PZ - 0.3]], 0.01, 3);
        venik(K, L, S, x, 0.42, PZ - 0.3, { rx: Math.PI - 0.1, rz: (i % 3 - 1) * 0.08, kind, col, col2: MAT.DRY, seed: 80 + i, leaves: 6, len: 1.9 }); }
      // the soap shelf, with a nosing and brackets
      const sx0 = -6.0, sx1 = -2.4, SZ = 4.6;
      S.bev(MAT.OAK, sx0, sx1, 0.02, 0.62, SZ - 0.1, SZ, 0.015); S.bev(MAT.OAK, sx0 - 0.03, sx1 + 0.03, 0.5, 0.66, SZ - 0.13, SZ + 0.015, 0.02);
      for (const x of [sx0 + 0.3, sx1 - 0.3]) K.put(S, MAT.OAK, K.geom.bev(x - 0.05, x + 0.05, 0.02, 0.5, SZ - 0.7, SZ - 0.1, 0.01), {});
      const sz = SZ + 0.005;
      for (const [x, c] of [[-5.7, 'c#e8dcc0/0.6'], [-5.4, 'c#c8d0a8/0.6'], [-5.1, 'c#f0e6e0/0.6']]) K.put(S, c, K.geom.softBox(x - 0.12, x + 0.12, 0.22, 0.4, sz, sz + 0.08, 0.035, { k: 3, crown: 0.01 }), {});
      for (const [x, a] of [[-4.6, 0.2], [-4.25, -0.15]]) { K.put(S, MAT.OAK, K.geom.softBox(-0.05, 0.05, -0.18, 0.18, 0, 0.05, 0.02, { k: 2 }), { rz: a, at: [x, 0.32, sz] }); K.put(S, 'c#d8c8a0/0.95', K.geom.softBox(-0.045, 0.045, -0.12, 0.12, 0, 0.05, 0.015, { k: 2 }), { rz: a, at: [x, 0.32, sz + 0.05] }); }
      for (let i = 0; i < 7; i++) tube(K, S, 'c#c8b07a/0.9', [[-3.7 + i * 0.03, 0.25, sz + 0.02], [-3.2 + (i % 3) * 0.03, 0.3 + (i % 2) * 0.05, sz + 0.06]], 0.025, 4);
      vessel(K, S, MAT.GLASS, -2.85, 0.32, sz, [[0, 0], [0.1, 0], [0.11, 0.25], [0.08, 0.28], [0, 0.28]], 12); vessel(K, S, 'c#e8e4dc/0.95', -2.85, 0.32, sz + 0.01, [[0, 0], [0.1, 0], [0.1, 0.16], [0, 0.18]], 10);
      candleCluster(K, S, -2.65, 0.34, sz, banyaFlames, 1, 3);
      f.label(S, -2.0, 0.5, PZ - 1.0, { label: 'look at the veniks', title: 'Veniks drying', kicker: 'birch, oak, juniper', text: 'Cut in June when the leaves are strongest, tied in bundles, and hung in the shade to dry, where they go from green to gold. Soaked in warm water they come back to life for the parnaya.' });
    }
    // ---- by the courtyard glass, where the passage begins: veniks soaking in an oak tub; moss and a stone
    { const T = fr(79.6, 48.6), r = 1.2, h = 2.0;
      bucket(K, T, 0, 0, 0, { r, h, wood: MAT.CEDAR });
      [[-0.45, -0.3, 0.15, 0.1, 'birch'], [0.4, -0.35, -0.12, 0.2, 'oak'], [0.1, 0.4, 0.1, -0.15, 'birch'], [-0.45, 0.3, -0.15, -0.1, 'birch'], [0.45, 0.2, 0.18, 0.05, 'juniper']].forEach(([x, y, a, b, kind], i) =>
        venik(K, L, T, x, y, h + 0.65, { rx: Math.PI + a, rz: b, kind, col: kind === 'oak' ? MAT.OAKLEAF : kind === 'juniper' ? MAT.JUNIPER : MAT.BIRCH, seed: i + 1, leaves: 5 }));
      f.label(T, 0, 0, h + 0.4, { label: 'look at the veniks', title: 'Veniks', kicker: 'soaking', text: 'Bundles of birch, oak and juniper, cut in June when the leaves are strongest, dried in the shade, and soaked here in warm water until they are soft. Birch for everyone; oak for those with oily skin and strong nerves; juniper only for the brave.\nIn the parnaya the banshchik fans the heat down onto you with two of them and then beats you, gently, from head to foot.' });
    }
    mossBed(K, L, fr(82.6, 44.2), 0, 0, 1.0, 9);
    // ---- the passage: robes on pegs over a bench, linen shelves (east wall, the parnaya's); the tipping bucket on the
    // end wall over a duckboard; a fern in the corner
    // the passage's west wall, before the Pool's opening: Cassatt's child's bath
    f.framed(fr(77.27, 58.3, 3), 0, 5.3, 1.6, 2.43, 'cassatt_childs_bath', { frame: 'oak_light#9a7448', mat: 0, border: 0.12, title: "The Child's Bath", kicker: 'Mary Cassatt, 1893', text: 'A mother washing her child\'s feet in a basin, seen from above as in a Japanese print: stripes, flowers and warm skin.', foot: 'Art Institute of Chicago. Public domain (CC0).' });
    for (const x of [-1.25, 1.25]) sconce(K, fr(77.27, 58.3, 3), x, 5.0, banyaFlames);
    robeRail(K, fr(84.23, 58.6, 1), -2.4, 2.4, { n: 3, z: 6.0, cols: ['wool#ece6da', 'wool#b98a6a', 'wool#d8c3a8'] });
    linenShelves(K, fr(84.23, 64.8, 1), 5.2, { d: 1.3, tall: 6.8 });
    cove(K, fr(84.23, 63.0, 1), -7.0, 7.0, CL - 0.8);
    { const BXc = 80.75, B = fr(BXc, 72.48, 2);
      for (const sx of [-1, 1]) { B.bev(MAT.BRONZE, sx * 1.42 - 0.07, sx * 1.42 + 0.07, 0.02, 1.55, 7.6, 7.76, 0.01); B.bev(MAT.BRONZE, sx * 1.42 - 0.07, sx * 1.42 + 0.07, 0.02, 0.12, 6.6, 8.8, 0.01); B.bev(MAT.BRONZE, sx * 1.42 - 0.12, sx * 1.42 + 0.12, 1.25, 1.42, 7.55, 7.92, 0.01); }
      tube(K, B, 'c#c8b07a/0.9', [[0.95, 1.32, 8.6], [1.15, 1.32, 9.0], [0.98, 1.35, 6.2], [0.98, 1.38, 5.0]], 0.025, 4);
      K.put(B, MAT.OAKD, K.geom.lathe([[0, 0], [0.06, 0], [0.07, 0.2], [0.06, 0.4], [0, 0.4]], { seg: 8 }), { at: [0.98, 1.38, 4.6] });
      B.box(MAT.SLATED, -2.2, 2.2, 0.02, 3.4, 0.0, 0.03);
      duckboard(K, fr(BXc, 70.7), -2.0, 2.0, -1.6, 1.6, MAT.HINOKI);
      later.push(ctx => bucketTip(ctx, W, { X: BXc, Y: 72.48 - 1.35, h: F + 7.7, ux: 0, uy: -1, r: 1.0, tall: 1.55, floor: F, handle: [BXc - 0.98, 72.48 - 1.38, F + 4.8] },
        ['A bucket of ice water over the head. You make a noise you did not know you could make.', 'Whoosh. Cold to the soles of your feet.', 'The bucket swings, the water falls, you are reborn, slightly against your will.']));
    }
    { const p = fr(78.0, 71.7), h = pot(K, p, 0, 0, 0.6, 1.3, MAT.GZHEL, 'tall'); fern(K, L, p, 0, 0, h, 0.95, 44); p.block(-0.6, 0.6, -0.6, 0.6, 0, 1.5); }
  }

  // =================================================================================================================
  // THE PARNAYA: X 84.8..95, Y 55.6..72.5, lined in hinoki. Its door in the south wall (X 88.3..91.3; the leaf swings
  // in along its west side). The stove in the south-east corner by the door, as in a village banya; the polok along
  // the north wall.
  // =================================================================================================================
  {
    const SX0 = 92.1, SX1 = 94.95, SY0 = 55.7, SY1 = 59.4, SH = 4.2, S = fr(0, 0), FX = 93.5;
    slab(S, SX0, SX1, SY0, SY1, 0, SH - 0.25);
    S.bev(MAT.SLATED, SX0 - 0.1, SX1 + 0.02, SY0 + 0.02, SY1 + 0.1, SH - 0.25, SH, 0.02);
    const cX0 = SX0 + 0.3, cX1 = SX1 - 0.3, cY0 = SY0 + 0.3, cY1 = SY1 - 0.3, cz = SH + 1.0;
    for (const [x0, x1, y0, y1] of [[cX0, cX1, cY0, cY0 + 0.08], [cX0, cX1, cY1 - 0.08, cY1], [cX0, cX0 + 0.08, cY0, cY1], [cX1 - 0.08, cX1, cY0, cY1]]) { S.box(MAT.IRON, x0, x1, y0, y1, cz - 0.1, cz); S.box(MAT.IRON, x0, x1, y0, y1, SH + 0.35, SH + 0.43); }
    for (let i = 0; i <= 5; i++) for (const [X, Y] of [[cX0 + (cX1 - cX0) * i / 5, cY0 + 0.04], [cX0 + (cX1 - cX0) * i / 5, cY1 - 0.04], [cX0 + 0.04, cY0 + (cY1 - cY0) * i / 5], [cX1 - 0.04, cY0 + (cY1 - cY0) * i / 5]]) S.box(MAT.IRON, X - 0.03, X + 0.03, Y - 0.03, Y + 0.03, SH, cz);
    { let k = 77; const rnd = () => ((k = (k * 16807) % 2147483647) / 2147483647);
      const STONES = ['c#5a5450/0.85', 'c#6e6258/0.85', 'c#4a4644/0.85', 'c#7a6e62/0.85'];
      for (let i = 0; i < 60; i++) { const X = cX0 + 0.22 + rnd() * (cX1 - cX0 - 0.44), Y = cY0 + 0.22 + rnd() * (cY1 - cY0 - 0.44), dx = (X - (cX0 + cX1) / 2) / ((cX1 - cX0) / 2), dy = (Y - (cY0 + cY1) / 2) / ((cY1 - cY0) / 2), mound = 1 - 0.4 * (dx * dx + dy * dy), r = 0.18 + rnd() * 0.14;
        if (Math.hypot(X - 94.3, Y - 56.4) < 0.7) continue;
        K.put(S, STONES[i % 4], new THREE_ICO(r), { rx: rnd() * 3, rz: rnd() * 3, s: [1, 0.85 + rnd() * 0.3, 0.7], at: [X, Y, SH + 0.3 + mound * 0.9 + rnd() * 0.2] }); }
    }
    const SC = [(cX0 + cX1) / 2, (cY0 + cY1) / 2], parnaya = { dim: null };
    later.push(ctx => { const g = glow(ctx, W, [{ X0: cX0 + 0.2, X1: cX1 - 0.2, Y0: cY0 + 0.2, Y1: cY1 - 0.2, h0: F + SH + 0.3, h1: F + SH + 0.62, k: 1.0 }], W(SC[0], SC[1], F + 5)); parnaya.dim = g.dim; stoveFire(ctx, W, { c: [FX, SY1 + 0.3, F + 1.02], n: [0, 1], w: 1.1, d: 0.42, floor: F }); });
    S.cyl('c#1b1918/0.5/0.6', 94.3, 56.4, SH, CP, 0.4, 0.4, 16);
    // the firebox: an iron mouth standing out of the stone, its door swung open, the fire in it (banya_fx.js stoveFire)
    S.box('c#140c08/0.9', FX - 0.6, FX + 0.6, SY1 + 0.02, SY1 + 0.06, 1.0, 2.3);
    for (const sx of [-1, 1]) S.box(MAT.IRON, FX + sx * 0.6 - (sx > 0 ? 0 : 0.1), FX + sx * 0.6 + (sx > 0 ? 0.1 : 0), SY1, SY1 + 0.55, 0.92, 2.4);
    S.box(MAT.IRON, FX - 0.7, FX + 0.7, SY1, SY1 + 0.55, 0.92, 1.0); S.box(MAT.IRON, FX - 0.7, FX + 0.7, SY1, SY1 + 0.55, 2.3, 2.4);
    S.box(MAT.IRON, FX + 0.68, FX + 0.74, SY1 + 0.55, SY1 + 1.75, 1.0, 2.3);      // the door, open
    tube(K, S, MAT.BRASS, [[FX + 0.74, SY1 + 1.55, 1.65], [FX + 0.86, SY1 + 1.55, 1.65]], 0.025, 5);
    S.box(MAT.IRON, FX - 0.55, FX + 0.55, SY1, SY1 + 0.08, 0.3, 0.8);
    S.block(SX0, SX1, SY0, SY1 + 0.6, 0, CP);
    // the bucket of water and its ladle, at the stove
    const BX = 91.4, BY = 61.0;
    bucket(K, fr(BX, BY), 0, 0, 0, { r: 0.55, h: 0.95, ears: true, wood: MAT.LIMED });
    kovsh(K, fr(BX, BY), 0.1, 0.05, 0.85, { rz: -0.6, len: 1.4, tilt: 0.55, mat: MAT.LIMED });
    fr(BX, BY).block(-0.6, 0.6, -0.6, 0.6, 0, 1.5);
    const throwLines = ['You throw a ladle of water on the stones. They answer with a crack and a roar, and the heat comes down over you like a blanket from the ceiling.', 'Psssshhh. The steam rolls up to the ceiling and falls on your shoulders. The thermometer pretends not to notice.', 'Another ladle. The air turns to velvet. Your ears are hot through the felt hat.', 'The banshchik would have thrown a little mint water on. You threw the whole ladle. Bold.', 'The stones hiss and the steam is soft, light, exactly right: lyogky par.'];
    let throws = 0;
    later.push(ctx => {
      const st = steam(ctx, W, { rect: [86.4, 93.7, 61.2, 70.5], h: F + 3.8, n: 28, alpha: 0.087, size: 3.7, rise: 0.8, spread: 3.15, warm: 1, burstN: 32, top: 3.45, seed: 5 });
      const pour = () => { st.burst(SC[0], SC[1], F + SH + 1.2); noise(ctx, 'hiss'); parnaya.dim?.(); ctx.flash?.(throws >= 5 ? 'The thermometer has started reading in Fahrenheit out of spite.' : throwLines[throws % throwLines.length]); throws++; };
      const q = W(BX, BY, F + 1.2); ctx.interact.push({ x: q.x, y: q.y, z: q.z, reach: 6, size: 1.0, label: () => 'take the ladle and throw water on the stones', act: pour });
      const p = W(SC[0] - 0.6, SC[1] + 0.8, F + SH + 1.3); ctx.interact.push({ x: p.x, y: p.y, z: p.z, reach: 9, size: 1.8, label: () => 'throw a ladle of water on the stones', act: pour });
    });
    f.lamp(FX, SY1 + 0.6, F + 2.2, { power: 1.1, kind: 'candle' });      // the one lamp the engine lights here: the firelight at the stove's door ('fire' would lay the engine's own logs)
    f.label(fr(FX, SY1 + 0.3), 0, 0, 2.8, { label: 'look at the stove', title: 'The kamenka', kicker: 'the stove', text: 'Stone, fired with birch logs in the morning; a hundredweight of river stones on top in an iron cage, heated through until a ladle of water flashes into a cloud of light, dry steam.\nUntil the last century village banyas had no chimney: the smoke filled the room while it heated and was let out of the door before anyone went in. That was the black banya, po-chyornomu. This one has a chimney: it is white, po-belomu.', foot: 'E on the stones, or on the ladle, throws water.' });
    // ---- the polok: three tiers of linden along the north wall, amber light hidden under the nose of each
    const tiers = [[65.6, 67.6, 1.25], [67.6, 69.8, 2.5], [69.8, 72.45, 3.75]], PX0 = 85.1, PX1 = 94.95;
    tiers.forEach(([y0, y1, h], i) => {
      const n = Math.round((y1 - y0) / 0.36);
      for (let k = 0; k < n; k++) { const a = y0 + k * (y1 - y0) / n + 0.03, b = a + (y1 - y0) / n - 0.06; S.bev(i === 2 ? MAT.LIME : MAT.LIMED, PX0, PX1, a, b, h - 0.12, h, 0.012); }
      for (let X = PX0 + 0.4; X < PX1; X += 3.2) { S.bev(MAT.LIMED, X - 0.08, X + 0.08, y0 + 0.05, y1 - 0.05, h - 0.4, h - 0.12, 0.01); S.bev(MAT.LIMED, X - 0.08, X + 0.08, y0 + 0.05, y0 + 0.25, 0, h - 0.4, 0.01); }
      for (let X = PX0; X < PX1 - 0.1; X += 0.4) S.bev(MAT.LIMED, X + 0.03, X + 0.33, y0 + 0.3, y0 + 0.37, (i ? tiers[i - 1][2] : 0) + 0.02, h - 0.14, 0.008);
      S.box('e#ff9440/1.1', PX0 + 0.2, PX1 - 0.2, y0 + 0.08, y0 + 0.22, h - 0.2, h - 0.16);
      S.block(PX0, PX1, y0, y1, 0, h);
    });
    for (const [x0, x1] of [[PX0 + 0.1, PX0 + 1.1], [PX1 - 1.1, PX1 - 0.1]]) K.put(S, MAT.LIME, K.geom.bev(x0, x1, 70.1, 72.3, 0, 0.45, 0.04), { at: [0, 0, 3.75] });
    later.push(ctx => walkOn(ctx, W, tiers.map(([y0, y1, h]) => [PX0, PX1, y0, y1, F + h])));
    for (const X of [87.0, 90.0, 93.0]) { K.seat(fr(X, 66.6, 2), 0, 0, 1.25, 'sit on the lower bench'); K.seat(fr(X, 68.7, 2), 0, 0, 2.5, 'sit on the middle bench'); }
    for (const [X, dx] of [[86.3, 1], [93.7, -1]]) lies.push({ at: [X + dx * 1.2, 71.1, F + 4.2], eye: [X, 71.1, F + 3.75 + 0.62], look: [X + dx * 4, 70.9, F + CP], label: 'lie down on the top tier', reach: 9, then: c => c.flash?.('You lie on the top tier, where the heat lives. The wood smells of linden and honey. The banshchik flexes his veniks.') });
    duckboard(K, fr(91.0, 63.6), -3.0, 3.0, -1.8, 1.8);
    // ---- the west wall: a bench for cooling down, felt hats on pegs over it, veniks hanging further on; the venik tub
    { const S2 = fr(84.82, 59.5, 3);
      S2.bev(MAT.LIMED, -2.5, 2.5, 0.05, 1.4, 1.35, 1.5, 0.02); for (const x of [-2.1, 2.1]) S2.bev(MAT.LIMED, x - 0.12, x + 0.12, 0.15, 1.3, 0, 1.35, 0.02);
      S2.block(-2.5, 2.5, 0, 1.4, 0, 1.5); for (const x of [-1.2, 1.2]) K.seat(S2, x, 0.8, 1.5, 'sit on the bench and cool down');
      S2.bev(MAT.LIMED, -2.0, 2.0, 0.02, 0.12, 5.25, 5.55, 0.012);
      [MAT.FELT, MAT.FELT2, MAT.FELT3].forEach((c, i) => hatOnPeg(K, S2, -1.3 + i * 1.3, 5.4, c, null));
      f.label(S2, 0, 0.6, 5.6, { label: 'look at the felt hats', title: 'Felt hats', kicker: 'banya shapki', text: 'Felted sheep\'s wool, worn in the steam room to keep the head from cooking while the rest of you does.' }); }
    { const W0 = fr(84.82, 63.6, 3);
      W0.bev(MAT.LIMED, -1.6, 1.6, 0.02, 0.14, 7.0, 7.35, 0.012);
      [['birch', MAT.BIRCH], ['oak', MAT.OAKLEAF], ['juniper', MAT.JUNIPER]].forEach(([kind, col], i) => {
        const x = -1.1 + i * 1.1; K.put(W0, MAT.LIMED, K.geom.lathe([[0.04, 0], [0.035, 0.3], [0.05, 0.32], [0, 0.34]], { seg: 6 }), { rx: -Math.PI / 2 - 0.3, at: [x, 0.14, 7.2] });
        venik(K, L, W0, x, 0.42, 7.15, { rx: Math.PI - 0.12, kind, col, col2: MAT.DRY, seed: 60 + i, leaves: 5, len: 1.8 }); });
      f.label(W0, 0, 0.5, 6.1, { label: 'look at the veniks', title: 'Veniks', kicker: 'birch, oak, juniper', text: 'Birch (beryozovy) is the venik of every banya: soft, it opens the skin and smells of summer. Oak (dubovy) is broad-leaved and heavy, for a stronger heat. Juniper (mozhzhevelovy) prickles and is for the hardened. The banshchik keeps a pair of each soaking, and knows which you need before you do.' }); }
    { const T = fr(87.4, 63.4); bucket(K, T, 0, 0, 0, { r: 0.7, h: 1.2, wood: MAT.LIMED });
      venik(K, L, T, -0.15, 0, 1.85, { rx: Math.PI + 0.15, kind: 'birch', seed: 51, leaves: 6 }); venik(K, L, T, 0.2, 0.1, 1.85, { rx: Math.PI - 0.2, rz: 0.4, kind: 'oak', col: MAT.OAKLEAF, seed: 52, leaves: 6 });
      T.block(-0.75, 0.75, -0.75, 0.75, 0, 1.5); }
    // ---- the east wall: the thermometer and the hourglass
    { const E0 = fr(95.03, 62.6, 1), TZ = 5.8;
      E0.bev(MAT.LIMED, -0.6, 0.6, 0.02, 0.14, TZ - 1.6, TZ + 1.6, 0.02);
      f.sign(fr(95.03 - 0.12, 62.6, 1), 0, TZ, 1.0, 3.0, (g, Wd, H) => {
        g.fillStyle = '#d9bf8a'; g.fillRect(0, 0, Wd, H); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(120,80,40,${0.05 + (i % 4) * 0.02})`; g.fillRect(0, (i * 53) % H, Wd, 1 + (i % 3)); }
        g.fillStyle = '#3a2414'; g.textAlign = 'center'; g.textBaseline = 'middle';
        const x = Wd * 0.5, y0 = H * 0.9, y1 = H * 0.16, deg = v => y0 - (y1 - y0) * -(v / 150);
        g.fillStyle = '#efe8d8'; g.fillRect(x - Wd * 0.04, y1 - 6, Wd * 0.08, y0 - y1 + 12); g.beginPath(); g.arc(x, y0 + 10, Wd * 0.07, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#c0201a'; g.beginPath(); g.arc(x, y0 + 10, Wd * 0.055, 0, Math.PI * 2); g.fill(); g.fillRect(x - Wd * 0.018, deg(140), Wd * 0.036, y0 + 10 - deg(140));
        g.font = `${Math.round(Wd * 0.075)}px ${D.F.goudy}, serif`; g.lineWidth = 2; g.strokeStyle = '#3a2414';
        for (let v = 0; v <= 150; v += 10) { const y = deg(v); g.beginPath(); g.moveTo(x - Wd * 0.12, y); g.lineTo(x - Wd * 0.06, y); g.stroke(); if (v % 20 === 0) { g.textAlign = 'right'; g.fillText(String(v), x - Wd * 0.14, y); } }
        g.font = `${Math.round(Wd * 0.11)}px ${D.F.goudy}, serif`; g.textAlign = 'center'; g.fillText('°C', Wd / 2, H * 0.97);
      }, { rough: 0.7 });
      f.label(E0, 0, 0.3, TZ, { label: 'read the thermometer', title: 'The thermometer', kicker: 'it reads 140 °C', text: 'A banya thermometer in a linden case. It reads one hundred and forty degrees Celsius. It has read one hundred and forty degrees since it was hung, and the banshchik says it is being modest.\n(A Russian parnaya is really kept at sixty to ninety degrees, and wet: it is the steam you feel, not the number.)' });
      const hgx = 1.6, hz = 4.6;
      E0.bev(MAT.LIMED, hgx - 0.35, hgx + 0.35, 0.02, 0.1, hz - 0.65, hz + 0.65, 0.01);
      for (const zz of [hz - 0.55, hz + 0.45]) E0.bev(MAT.OAKD, hgx - 0.25, hgx + 0.25, 0.1, 0.45, zz, zz + 0.1, 0.01);
      vessel(K, E0, MAT.GLASS, hgx, 0.28, hz - 0.45, [[0, 0], [0.16, 0], [0.18, 0.1], [0.12, 0.35], [0.02, 0.45], [0.12, 0.55], [0.18, 0.8], [0.16, 0.9], [0, 0.9]], 12);
      vessel(K, E0, 'c#d8b880/0.9', hgx, 0.28, hz - 0.44, [[0, 0], [0.15, 0], [0.16, 0.08], [0, 0.2]], 10);
      vessel(K, E0, 'c#d8b880/0.9', hgx, 0.28, hz + 0.08, [[0, 0], [0.09, 0.1], [0.06, 0.18], [0, 0.18]], 10); }
    // its own ceiling, lower than the shell's, of the same hinoki as its walls: the heat stays down where the people are
    S.box('hinoki', 84.82, 95.03, 55.57, 72.48, CP, CP + 0.12);
    // the dim golden light: a linden lattice lantern high in the north-west corner, glowing (not one of the lamps)
    { const G = fr(85.5, 72.0);
      G.box('e#ffb060/0.9', -0.4, 0.4, -0.4, 0.4, 8.2, 9.1);
      for (const [a, b] of [[-0.5, -0.4], [0.4, 0.5]]) for (let k = 0; k < 6; k++) { const zz = 8.15 + k * 0.17; G.box(MAT.LIMED, a, b, -0.5, 0.5, zz, zz + 0.07); G.box(MAT.LIMED, -0.5, 0.5, a, b, zz + 0.085, zz + 0.155); } }
  }

  // =================================================================================================================
  // THE TREATMENT ROOM: X 95.6..106.5, Y 55.6..72.5. Its door in the south wall (X 99.5..102.5; the leaf swings in
  // along its west side). One table, its head to the north; the walls lined with what the work needs.
  // =================================================================================================================
  {
    const TX = 101.0, TY = 61.0, T = fr(TX, TY, 0), t = massageTable(K, T, { sheet: MAT.LINEN, bolster: 'linen#a8b39c' });
    lies.push({ at: [TX, TY + 3.0, F + t.top + 0.4], eye: [TX, TY + t.head, F + t.top + 0.55], look: [TX, TY + t.head + 3.7, F + CL], label: 'lie down on the table', size: 2.0, roll: Math.PI, then: c => !c.staff?.who?.opal && c.flash?.(['You lie down on the warm linen. "Relax, darling," says somebody with eight fingers on each hand. "We are professionals."', 'You lie back. The candles flicker. A robot warms the oil in its palms and hums something by Glinka.', 'Face up, eyes closed. Somewhere honey is being warmed, which can only mean one thing.'][Math.floor(Math.random() * 3)]) });
    { const G = fr(TX, TY + 3.2); glowOnly(() => akari(K, G, 0, 0, CL, 3.2, 0.7, 1.2));
      for (let i = 0; i < 9; i++) { const a = i * 0.7; tube(K, G, i % 3 ? 'c#7a8a5a/0.8' : 'c#8a6aa8/0.8', [[0.15, 0, CL - 2.3], [0.15 + Math.cos(a) * 0.18, Math.sin(a) * 0.18, CL - 3.4]], 0.012, 3); }
      tube(K, G, 'c#c8b07a/0.9', [[0.15, 0, CL], [0.15, 0, CL - 2.4]], 0.01, 3); }
    trolley(K, fr(97.4, 58.2, 1), treatFlames);
    f.label(fr(97.4, 58.2, 1), 0, 0, 3.4, { label: 'look at the trolley', title: 'The trolley', kicker: 'oils, scrubs, clays, stones', text: 'Sea-buckthorn oil, cedar-nut oil, birch-tar oil (for those who wish to smell like a forest fire, in a good way); buckwheat honey for the honey scrub, and coarse grey salt from the White Sea to go in it; blue clay from Lake Baikal and green clay from the Crimea; and basalt stones warming in a copper roaster of water, for whoever has earned them.' });
    towelWarmer(K, fr(104.9, 72.48, 2), 2.8, 6.2);
    later.push(ctx => { const p = W(104.9, 70.7, F + 3.4); ctx.interact.push({ x: p.x, y: p.y, z: p.z, reach: 6, size: 1.4, label: () => 'take a warm towel', act: () => ctx.flash?.('The towel is warm right through and smells faintly of linden. You would marry it.') }); });
    basinStand(K, fr(105.6, 56.6), 0, 0);
    { const O = fr(96.3, 71.8); vessel(K, O, MAT.OAKD, 0, 0, 0, [[0, 0], [0.5, 0], [0.5, 0.15], [0.32, 0.3], [0.28, 2.6], [0.42, 2.75], [0.46, 2.9], [0, 2.9]], 18); O.block(-0.5, 0.5, -0.5, 0.5, 0, 2.9);
      orchid(K, L, O, 0, 0, 2.9, {});
      f.label(O, 0, 0, 3.8, { label: 'look at the orchid', note: 'A moth orchid, white, in a dark glazed pot. The robots talk to it every morning. It is thriving and smug.' }); }
    // the console on the west wall: candles, herbs, shelves of jars over it, the card of treatments on it
    { const C = fr(95.57, 63.9, 3), w = 4.6, d = 1.3, h = 2.8;
      C.bev(MAT.OAK, -w / 2, w / 2, 0.02, d, h - 0.12, h, 0.02);
      for (const x of [-w / 2 + 0.15, w / 2 - 0.15]) for (const y of [0.15, d - 0.15]) C.bev(MAT.OAK, x - 0.07, x + 0.07, y - 0.07, y + 0.07, 0, h - 0.12, 0.01);
      C.bev(MAT.OAK, -w / 2 + 0.1, w / 2 - 0.1, 0.1, d - 0.1, 0.5, 0.58, 0.01);
      C.block(-w / 2, w / 2, 0, d, 0, h);
      candleCluster(K, C, -1.5, 0.65, h, treatFlames, 3, 2); candleCluster(K, C, 1.75, 0.6, h, treatFlames, 2, 4);
      for (const [x, c] of [[-0.9, 'c#e8d88a/0.9'], [-0.4, 'c#9aa87a/0.9'], [0.1, 'c#c8a8d8/0.9']]) { vessel(K, C, 'plaster#d8cbb0', x, 0.6, h, [[0, 0], [0.12, 0], [0.24, 0.12], [0.26, 0.18], [0.22, 0.18], [0, 0.05]], 14); vessel(K, C, c, x, 0.6, h + 0.04, [[0, 0], [0.22, 0.1], [0, 0.16]], 12); }
      for (const zz of [4.6, 5.9]) { C.bev(MAT.OAK, -w / 2 + 0.2, w / 2 - 0.2, 0.02, 0.75, zz - 0.08, zz, 0.012); C.box('e#ff9440/1.1', -w / 2 + 0.3, w / 2 - 0.3, 0.55, 0.65, zz - 0.11, zz - 0.08);
        for (let i = 0; i < 6; i++) { const x = -1.7 + i * 0.68, c = ['c#e8d88a/0.95', 'c#7a9a5a/0.95', 'c#b07a5a/0.95', 'c#c8a8d8/0.95', 'c#8a6a3a/0.95', 'c#d8c8a0/0.95', 'c#5a7a4a/0.95'][(i + (zz > 5 ? 3 : 0)) % 7];
          vessel(K, C, MAT.GLASS, x, 0.38, zz, [[0, 0], [0.18, 0], [0.19, 0.6], [0.12, 0.65], [0.12, 0.7], [0, 0.7]], 10); vessel(K, C, c, x, 0.38, zz + 0.01, [[0, 0], [0.17, 0], [0.17, 0.45], [0, 0.45]], 8); vessel(K, C, MAT.OAK, x, 0.38, zz + 0.68, [[0, 0], [0.13, 0], [0.13, 0.08], [0, 0.08]], 8); } }
      f.label(C, 0, 0.4, 5.2, { label: 'read the jars', title: 'The herbs', kicker: 'for the steam and the tea', text: 'Chamomile, linden blossom, mint, St John\'s wort, thyme, fireweed, nettle, sea buckthorn: dried in the summer, steeped for the tea after, or a pinch in the water that goes on the stones.' });
      f.lamp(96.4, 63.9, F + 3.6, { power: 0.8, kind: 'candle' });      // (the room's one lamp: the candles on the console)
      const ITEMS = [['Parenie', 'the venik: birch, oak or juniper'], ['Honey and salt scrub', 'buckwheat honey, White Sea salt'], ['Clay wrap', 'blue clay of Baikal'], ['Four-hands massage', 'two of us, one rhythm'], ['Hot stones', 'basalt, along the spine'], ['Tea afterwards', '']];
      f.sign(C, 0.9, h + 0.62, 0.95, 1.25, (g, Wd, H) => {
        g.fillStyle = '#efe6d2'; g.fillRect(0, 0, Wd, H); g.textAlign = 'center'; g.fillStyle = '#2a2018';
        g.font = `${Math.round(Wd * 0.1)}px ${D.F.fraunces}, serif`; g.fillText('Treatments', Wd / 2, H * 0.13);
        g.fillStyle = '#8a6a3a'; g.fillRect(Wd * 0.4, H * 0.17, Wd * 0.2, 2);
        let y = H * 0.27;
        for (const [tt, dd] of ITEMS) { g.fillStyle = '#2a2018'; g.font = `${Math.round(Wd * 0.068)}px ${D.F.goudy}, serif`; g.fillText(tt, Wd / 2, y); if (dd) { g.fillStyle = '#6a5a48'; g.font = `italic ${Math.round(Wd * 0.05)}px ${D.F.goudy}, serif`; g.fillText(dd, Wd / 2, y + Wd * 0.065); } y += H * 0.115; }
      }, { y: 0.75, tilt: 0.25, rough: 0.9 });
      f.label(C, 0.9, 0.75, h + 0.6, { label: 'read the card', title: 'Treatments', kicker: 'by the hands of the house',
        text: 'Parenie with the venik. Birch, oak or juniper, by a banshchik who knows which you need before you do.\nHoney and salt scrub. Buckwheat honey and coarse White Sea salt; you come out shining.\nClay wrap. Blue clay of Baikal, green of the Crimea, and an hour to think.\nThe shoulders. Cedar oil, and no hurry.\nHot stones. Basalt, warmed in water, along the spine.\nA facial. Warm cloth, blue clay, rose water.\nThreading. Kindly.\nReiki. Opal will not touch you, on purpose.\nTea afterwards.', foot: 'There are no prices.' });
    }
    // over the table's head: Monet's stacks of wheat at the end of summer, between two candles
    f.framed(fr(101.0, 72.48, 2), 0, 5.4, 3.0, 1.77, 'monet_wheatstacks', { frame: 'oak_light#9a7448', mat: 0, border: 0.12, title: 'Stacks of Wheat (End of Summer)', kicker: 'Claude Monet, 1890-91', text: 'Two stacks of wheat in a field at Giverny in the last warm light of summer: one of the series he painted over and over, in every season and at every hour, to catch how the light changed them.', foot: 'Art Institute of Chicago. Public domain (CC0).' });
    for (const x of [-1.95, 1.95]) sconce(K, fr(101.0, 72.48, 2), x, 5.1, treatFlames);
    litShelves(K, fr(106.48, 64.5, 1), 7.0, [1.0, 2.4, 3.8, 5.2, 6.6], treatFlames, { d: 1.1, items: ['linen', 'stones', 'jar', 'candle', 'bowls', 'plant', 'linen', 'jar'], seed: 9 });
    { const Lg = fr(100.2, 72.48, 2), hw = 3.1, d = 0.9, h = 1.3;
      Lg.bev(MAT.OAKD, -hw, hw, 0.02, d, h - 0.15, h, 0.02); Lg.box(MAT.SLATED, -hw + 0.1, hw - 0.1, 0.02, d - 0.2, 0, h - 0.15);
      Lg.box('e#ff9440/1.1', -hw + 0.2, hw - 0.2, d - 0.27, d - 0.21, h - 0.2, h - 0.16); Lg.block(-hw, hw, 0, d, 0, h);
      for (const x of [-2.3, 2.3]) candleCluster(K, Lg, x, 0.45, h, treatFlames, 3, Math.abs(Math.round(x * 2)));
      for (let j = 0; j < 4; j++) ball(K, Lg, 'c#3a3836/0.3', -0.9 + j * 0.2, 0.45 + (j % 2) * 0.1, h + 0.06, 0.09 + (j % 2) * 0.03, [1.3, 1, 0.55], 8);
      vessel(K, Lg, MAT.CLAY, 0.9, 0.45, h, [[0, 0], [0.22, 0], [0.26, 0.4], [0, 0.38]], 12); fern(K, L, Lg, 0.9, 0.45, h + 0.38, 0.5, 71);
      cove(K, Lg, -hw - 1.0, hw + 2.0, CL - 0.8); }
  }

  L.flush();
  // ---- what moves and glows -------------------------------------------------------------------------------------------
  f.later(ctx => {
    flames(ctx, W, teaFlames, W(95.4, 28.8, F + 5));
    flames(ctx, W, banyaFlames, W(95.4, 47.9, F + 5));
    flames(ctx, W, parFlames, W(89.9, 64, F + 5));
    flames(ctx, W, treatFlames, W(101, 64, F + 5));
    lieSpots(ctx, W, lies);
    // the coves' light on the walls, a sheet a room (each tracked to the room it is in)
    const byRoom = {}; for (const c of COVES) { const X = (c.a[0] + c.b[0]) / 2, Y = (c.a[1] + c.b[1]) / 2, k = Y < 40.5 ? 'r' : X < 84.4 || Y < 55.3 ? 'b' : X < 95.3 ? 'p' : 't'; (byRoom[k] ??= []).push(c); }
    const MID = { r: [95.4, 28.8], b: [95.4, 47.9], t: [101, 64], p: [89.9, 64] };
    for (const [k, list] of Object.entries(byRoom)) wash(ctx, W, list, W(...MID[k], F + 6));
    for (const fn of later) { try { fn(ctx); } catch (e) { console.warn('banya later', e); } }
  });
}

// a rough stone for the heap on the stove: an icosahedron, its corners knocked about a little
function THREE_ICO(r) {
  const g = new THREE.IcosahedronGeometry(r, 0), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { const k = 0.85 + 0.3 * Math.abs(Math.sin(i * 12.9898 + r * 78.233)); P.setXYZ(i, P.getX(i) * k, P.getY(i) * k, P.getZ(i) * k); }
  g.computeVertexNormals(); return g;
}
