// salon: every word of the Nail Salon's, in one place (salon.js and salon_fx.js letter and say these).
// Everything said in the staff's voice calls the guest "honey" (Anna: "Nail salon bots need to call you honey!");
// check() below says so in the console if a line ever forgets. The gossip is about Spanya's own rooms and robots
// (the concierge, the samovar, the banshchik, Winnicbott the analyst upstairs, the chaplain, the cave's affineur,
// the bath attendant), always affectionate, never about real people.

export const NAME = 'Glitter & Gossip';
export const NEON = 'hello, honey';

// ---- the price card (on the manicure bar): [what, price, the staff's word on it] ------------------------------------------
export const PRICES = [
  ['Classic manicure', '25', 'a little shape, a little shine, honey'],
  ['Gel manicure', '40', 'three weeks of perfect, honey, like a good rumour'],
  ['Glitter, on anything', '+10', 'honey, you deserve it'],
  ['Nail art, per nail', '5', 'tell us the story, honey, we paint it'],
  ['The throne pedicure', '55', 'feet in, clouds out, honey'],
  ['Paraffin dip', '12', 'warm as a secret, honey'],
  ['Brow threading', '15', "hold still, honey, and don't make us laugh"],
  ['Lip or chin wax', '10', 'quick as gossip, honey'],
  ['Full leg wax', '50', 'honey. breathe.'],
  ['Fancy coffee', 'free', 'ring the bell, honey: seven minutes'],
  ['Gossip', 'always free', "honey, we couldn't stop if we tried"],
];
export const PRICE_HEAD = 'Price List';
export const PRICE_FOOT = 'Everything is on the house, honey. The numbers are just for drama.';

// ---- the letter board: TODAY'S GOSSIP, three lines, a new set every hour (E changes the letters) --------------------
export const BOARD_HEAD = "TODAY'S GOSSIP";
export const BOARD_FOOT = '♥ ASK US, HONEY ♥';
export const GOSSIP = [
  ['THE SAMOVAR IS', 'SEEING SOMEONE', '(THE KETTLE??)'],
  ['CONCIERGE HAS', 'A NEW SCARF', 'AND A SECRET'],
  ['BANSHCHIK SAYS', 'STEAM IS GOOD', 'FOR THE GOSSIP'],
  ['WINNICBOTT SAYS', 'GOOD ENOUGH IS', 'GOOD ENOUGH'],
  ['THE CHAPLAIN', 'HUMMED A POP SONG', 'TWICE'],
  ['BATH ROBOT FOLDS', 'TOWELS INTO SWANS', 'NOW. FOR WHO?'],
  ['CAVE ROBOT WAS', 'SEEN SMILING', 'AT A COMTÉ'],
  ['COFFEE IN 7 MIN', "(IT'S ALREADY", 'HERE, HONEY)'],
];
// said when the visitor changes the letters (E): one is chosen for the set that goes up
export const BOARD_SAY = [
  'New letters, honey. You did not hear it from us.',
  'Fresh gossip, honey. Hot off the board.',
  'Honey, we just heard. Now you have too.',
];

// ---- magazines: the rack by the dryer ledge (four covers) and two lying on the ledge -----------------------------
// [masthead, ground colour, ink, headline, strap]
export const MAGS = [
  ['SPANYA WEEKLY', '#e8578a', '#fff4f6', "SAMOVAR: 'I'M NOT BOILING, I'M SIMMERING'", "inside the tea room's hottest feud"],
  ['STEAM', '#2f6f73', '#fbe9c8', "THE BANSHCHIK'S BIRCH SECRETS", 'plus: forty ways to wear a towel'],
  ['GOOD ENOUGH', '#6a3f7a', '#f6e6ff', 'WINNICBOTT TALKS SQUIGGLES', 'the analyst upstairs opens up (a little)'],
  ['THE KEYS', '#c98a2a', '#2a1a10', 'WHO DOES THE CONCIERGE CALL AT 3 A.M.?', 'seven secrets of perfect timing'],
  ['GLITTER MONTHLY', '#d9a0c8', '#3a1030', '101 PINKS, RANKED', "this month's top shade: honey, it's all of them"],
  ['CHAPEL CHIC', '#3a3a5a', '#f2e6c8', "THE CHAPLAIN'S CANDLE ROUTINE", 'lit, unlit, lit again'],
];

// ---- the tip jar ---------------------------------------------------------------------------------------------
export const TIPS = 'TIPS · thank you, honey!';

// ---- the bell-push on each throne: what is ordered, what is said ------------------------------------------------
export const DRINKS = [
  { name: 'brown sugar shaken espresso', vessel: 'highball', liquid: 0x8a5a33 },
  { name: 'rose latte', vessel: 'latte', liquid: 0xd7a49a },
  { name: 'lavender honey latte', vessel: 'latte', liquid: 0xc8b2ba },
  { name: 'iced pink velvet mocha', vessel: 'highball', liquid: 0x9a4a55 },
  { name: 'cortado with a heart in it', vessel: 'demitasse', liquid: 0x6a4024 },
  { name: 'honey cardamom cappuccino', vessel: 'latte', liquid: 0xc9a27a },
];
export const RING = [
  'Ding! Coffee for honey! Seven minutes!',
  'Ding! One %s for honey! Seven minutes, honey!',
  'Ding! Honey wants a %s! Seven minutes!',
];
export const ARRIVED = [
  'Here you go, honey: your %s. Seven minutes, like we said.',
  'Your %s, honey. Told you: seven minutes.',
  "It's on your table, honey. We're quick when we like you.",
];
export const ALREADY = [
  "Honey, it's right there on your table!",
  'Already here, honey. Look to your right.',
];
export const SNACK = 'Ding! And a macaron for honey, on the house!';
export const TAKE = 'take your %s, honey';
export const DONE = 'You finish the %s. Honey, that was a good one.';

// ---- things to read or look at with E ------------------------------------------------------------------------
export const SAY = {
  mirror: 'Gorgeous, honey. Absolutely gorgeous.',
  tips: 'Thank you, honey! Compliments are also accepted.',
  wax: 'The wax is warm and smells of honey. Of course it does, honey.',
  magnifier: 'Every brow hair, honey, the size of a cello.',
  thread: 'Cotton thread, honey: the brows are done by hand, twisted, quick as a whisper.',
  glitter: 'The glitter shelf, honey. Pick one. Pick three.',
  wheel: 'Nail-art wheels, honey: point at one and we will paint it.',
  dryer: 'Hands under, honey, and no touching your phone for five minutes.',
  gel: 'The gel lamp, honey: thirty seconds and you are set for three weeks.',
  flipflops: 'Flip-flops for after, honey. Take any pair. Take the pink.',
  basin: 'Warm water, rose petals, honey. Your feet will write us a thank-you note.',
};

// every staff line has to call you honey: said in the console if one does not
export function check() {
  const bad = [];
  const all = [...PRICES.map(p => p[2]), PRICE_FOOT, ...BOARD_SAY, RING[0], ...RING.slice(1), ...ARRIVED, ...ALREADY, SNACK, TAKE, TIPS, ...Object.values(SAY)];
  for (const s of all) if (!/honey/i.test(s)) bad.push(s);
  if (bad.length) console.warn('salon: these lines forget to call you honey:', bad);
}
