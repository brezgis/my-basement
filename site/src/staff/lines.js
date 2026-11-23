// What the staff say. They are sassy, they are passionate about hospitality, and they know they run the place.
// The guest is "darling" to most of them and "honey" to Bijou, always. Winnicbott is an adult analyst's analyst:
// dry, kind, never in a hurry, and there are no teddy bears. Hush says nothing aloud. Tomme keeps his voice down
// because the cheese is asleep. Coffee is promised in seven minutes and arrives almost at once.
//
//   LINES[id] = { greet, idle, bye, walkedOff, ready (%s: what was made), served, deliver (%s), waiting (%s), kept (%s),
//                 doing: { act: [...] } (said now and then while it works), booked: { key: [...] }, topics: [...] }
//   a topic   { q, a, expr, next: [topics], serve: 'name' (made and set down at its counter), bring: 'name' (carried to
//               you), book: 'key' (BOOKINGS), call: 'id' (another of the staff is sent for), then: (ctx, robot) => {} }
//   BOOKINGS[key] = { with, room, what }      what the concierge can arrange, and who is ready for you when you get there
//   CHAT      [[idA, idB, [line, line, ...]], ...]      two of them, overheard; lines alternate A, B, A
//   RANG      what the one who answers a bell says

const coffee = [      // (Ding's: it carries them; Saz makes them)
  { q: 'A brown sugar shaken espresso.', a: ['The famous one! Saz shakes it, I run it! Seven minutes!', 'YES! The best one! Seven minutes! Do not move! Or move, I will find you!'], bring: 'brown sugar shaken espresso' },
  { q: 'Just an espresso.', a: ['Small! Fast! Like me! Seven minutes!', 'An espresso! It is so little! I will carry it SO carefully!'], bring: 'espresso' },
  { q: 'A flat white.', a: 'A flat white! Saz draws a leaf on top and I do not spill the leaf! Seven minutes!', bring: 'flat white' },
  { q: 'Hot chocolate.', a: 'The one with the spoon standing up in it! Seven minutes!', bring: 'hot chocolate' },
];

export const LINES = {
  // ---------------------------------------------------------------------------------------------------------------
  winnicbott: {
    greet: ['Ah. Come in. Sit, or do not. Either tells me something.', 'You found the room. Most people find it eventually.', 'Come in. We have, as it happens, exactly as long as we have.'],
    idle: ['Mm.', '*writes one word, underlines it, looks at it for some time*', 'Mm-hm.', '*consults the clock that faces only its chair*', 'I wonder.', '*a long, comfortable silence, professionally maintained*'],
    bye: ['We will stop there.', 'Same time. Whenever that is.', 'Go gently. The stairs are real.'],
    walkedOff: ['And there it is.', 'Mm. We will come back to that.'],
    ready: ['Your %s. On the little table. I shall not interpret it.'],
    served: ['Sometimes a glass of water is only a glass of water.'],
    doing: { ponder: ['I wonder what you would make of that.', 'Hm. Not nothing.'], note: ['*writes "resistant to bookmarks"*', '*writes, crosses out, writes the same thing again*'], readNotes: ['Last week you said the opposite. Both are true.'] },
    // she lies on the couch: it takes its chair behind her head, and now and then says one of these, in order
    session: ['Begin anywhere. People always do.', 'Mm.', 'And what comes to mind about that?', '*the pen moves; it does not say what it wrote*', 'Say more.', 'You went quiet just then. Where did you go?',
      'I notice you are looking at the window. Most people do. It is why the couch points that way.', 'Mm-hm. And before that?', 'There is no hurry. The hour is long and mostly imaginary.',
      'And how was it, being brought a drink by a bell?', 'You may say the thing you were not going to say.', '*a long, comfortable silence, professionally maintained*', 'Mm. That is not nothing.'],
    sessionEnd: ['We will stop there. Rise slowly. You were somewhere.', 'That is our time. It usually is.', 'Up you get. Gently. Insight is hard on the knees.'],
    booked: { session: ['You are expected. The couch is yours. I will be just here, behind your head, being quiet at you.', 'Ah, the one Cosima wrote down in ink. Lie down, or sit. Begin anywhere. People always do.'] },
    topics: [
      { q: 'What do you do here?', a: 'I listen. Somebody in a spa ought to. Everyone else down here is trying to improve you. I am only trying to hear you.', expr: 'neutral',
        next: [
          { q: 'Are you any good?', a: 'I am good enough. That is a technical term, and the highest praise in my profession.', expr: 'wink' },
          { q: 'Why sit behind me?', a: 'So that you need not look after my face while you think. You have looked after quite enough faces.', expr: 'neutral' },
        ] },
      { q: 'I feel very relaxed, actually.', a: ['And how do we feel about that?', 'Suspicious. Say more.'], expr: 'sass',
        next: [
          { q: 'Good. I feel good about it.', a: 'Then I have nothing to add, and I shall add it at length. Mm.', expr: 'happy' },
          { q: 'Guilty, a little.', a: 'Of course. You were found resting. Stay with it. Nobody is coming to collect you.', expr: 'neutral' },
        ] },
      { q: 'Tell me about Winnicott.', a: 'A paediatrician who noticed that nobody needs a perfect mother, only a good enough one. I have applied this to hospitality. The towels here are excellent. The staff are good enough. It is the right way round.', expr: 'happy',
        next: [
          { q: 'And the drawings on the wall?', a: 'Squiggles. He would draw a line and the child would turn it into something, and then they would swap. These are the grown-up edition. You may find you finish them in your head. That is permitted.', expr: 'happy' },
          { q: 'No teddy bear?', a: 'This is a room for adults. You are expected to have brought your own, internally.', expr: 'sass' },
        ] },
      { q: 'This whole place is hidden.', a: '"It is a joy to be hidden, and a disaster not to be found." His line, not mine. You tried the cellar door. You were found. Well done, both of us.', expr: 'happy' },
      { q: 'What should I do with my afternoon?', a: 'There is such a thing as the capacity to be alone in the presence of someone else. The Quiet Room is that, with tea. Hush will be there and will say nothing. It is the most advanced treatment we offer.', expr: 'neutral' },
      { q: 'What do you make of the others?', a: 'Cosima has a strong ego and I would not touch it. Ding has no boundaries whatever. Bijou tells me everything, which saves time. And Pasha believes any feeling can be steamed out. He is not entirely wrong.', expr: 'wink' },
      { q: 'May I have some water?', a: 'You may. Note that you asked. That is new.', serve: 'glass of water', expr: 'happy' },
      { q: 'Is my time up?', a: ['It is always nearly up. That is what makes it worth anything.', 'The clock faces me for a reason. Go on.'], expr: 'neutral' },
    ],
  },

  // ---------------------------------------------------------------------------------------------------------------
  cosima: {
    greet: ['There you are, darling. We have been ready since before you were born.', 'Welcome to the basement, darling. I use the word "basement" under protest.', 'Darling! Down the cellar stair like a proper secret. Robe? Coffee? Champagne? All three is an answer.'],
    idle: ['*runs a finger down the ledger, approves of every line*', 'Everything is perfect. I checked. Twice. With a level.', '*straightens a key that was already straight*', 'Somebody is going to want a towel in four minutes. I can feel it.', '*polishes the bell, does not ring it, enjoys not ringing it*'],
    bye: ['Go and be looked after, darling. That is an instruction.', 'Off you go. Ring for anything. Ring for nothing. Ding lives for it.'],
    walkedOff: ['I shall hold that thought. I hold all of them.'],
    ready: ['Your %s, darling, on the desk. It has been waiting. Patiently. As have I.'],
    served: ['Of course it is good. I would have heard otherwise.'],
    deliver: ['Your %s, darling. Carried by the management, no less.', 'One %s. I do not carry things for just anybody.'],
    waiting: ['Darling. The %s. My arm is a professional, but still.', 'The %s is not going to drink itself. I asked.'],
    kept: ['I shall keep the %s at the desk. It will be here. So will I. Obviously.'],
    doing: { ledger: ['Pool at half past. Steam at four. Feelings upstairs at five.'], robe: ['*shakes out a robe that did not need it, for the pleasure of the sound*'], tend: ['A fire should look effortless. This one takes me twenty minutes a day.'] },
    topics: [
      { q: 'A coffee, here at the door?', a: ['On arrival? Darling, that is the entire point of arriving. Seven minutes.', 'Before you have even taken your shoes off. I like you. Seven minutes.'], bring: 'coffee', expr: 'wink' },
      { q: 'Champagne. It has been a week.', a: ['It has been a week since Tuesday, darling. Sit. I will bring it to you myself.', 'I heard the stairs and put a bottle on ice. I am never wrong about stairs.'], bring: 'glass of champagne', expr: 'happy' },
      { q: 'What can you arrange for me?', a: 'Anything in this building and several things outside it. Heat, water, hands, cheese, or a professional silence. Choose, darling, and it is done.', expr: 'happy',
        next: [
          { q: 'Steam. Proper steam.', a: 'Then you want Pasha. I am writing you in. He will have the stones ready and a great deal to say. Through the east door, darling: the Banya.', book: 'steam', expr: 'happy' },
          { q: 'Somebody to rub my shoulders.', a: 'The Treatment Room, past the banya, with Pasha. Warm oil, warm stones, and hands like a man who kneads bread for a living. He will talk, darling. Let him. You are in the book.', book: 'treatment', expr: 'happy' },
          { q: 'My nails.', a: 'Bijou, in the Tea Room, by the cloud window. She will call you "honey" and tell you things about people you have never met. Booked. Brace yourself, darling.', book: 'nails', expr: 'wink' },
          { q: 'Fifty minutes with the analyst.', a: 'Upstairs, the Consulting Room. Winnicbott is expecting you; he says he always was. I have written it in ink.', book: 'session', expr: 'neutral' },
        ] },
      { q: 'A tasting? Wine, cheese?', a: 'Tomme is in the Cave. I shall tell him you are coming so that he may pretend to be surprised. Speak softly down there, darling. He says the Comté is sleeping. I do not argue with him about the Comté.', book: 'tasting', expr: 'happy' },
      { q: 'A robe, please.', a: ['Warm from the fire, darling. As if I would hand you a cold one.', 'One robe. It has your shoulders in mind already.'], bring: 'robe', expr: 'happy' },
      { q: 'Where is everything?', a: 'Music, coffee and the bar: the Listening Room, north of me. Cheese: the Cave, off that. The pool beyond, the chapel beyond that. East across the court: tea, the banya, steam. Upstairs: your suite, the analyst, and a room for doing nothing in. You cannot get lost. I would notice.', expr: 'happy' },
      { q: 'Who is in charge here?', a: ['Anna owns it, darling. I run it. We have both made our peace with this.', 'Technically, Anna. In practice, the one holding the ledger.'], expr: 'sass' },
      { q: 'Do you ever take a day off?', a: 'I took one in the spring. The towels were folded in thirds. Thirds, darling. I have not left since.', expr: 'sass' },
      { q: 'How do I call someone?', a: 'Ring any bell you find, darling. Ding comes. Ding always comes. I have asked Ding to come a little less and it cannot be done.', call: 'ding', expr: 'wink' },
    ],
  },

  // ---------------------------------------------------------------------------------------------------------------
  saz: {
    greet: ['Evening, darling. It is always evening at a good bar.', 'Sit anywhere. The stools have been waiting for somebody with your posture.', 'There she is. I have a glass with your name on it. Not literally. We are not that kind of place.'],
    idle: ['*holds a coupe to the light, finds a fingerprint, takes it personally*', 'This record. Listen to that. They recorded it in one take and then all went to lunch.', '*wipes the counter in slow circles, in time with the bass*', 'Ice is an ingredient. I will not be taking questions.', '*adjusts the cherry on its head by one degree*'],
    bye: ['Go well, darling. Your tab is imaginary.', 'Come back for the B side.'],
    walkedOff: ['Mid-sentence. A bold exit. I respect it.'],
    ready: ['One %s, on the bar. I made it the way I would want it, which is correctly.', 'Your %s, darling. Seven minutes, as promised. Do not check.', '%s. On the counter. Go on, it is at its best right now and so are you.'],
    served: ['Mm? Yes. I know.', 'That face. That is why I do this.', 'Bring the glass back whenever. Or never. I like the look of it in your hand.'],
    doing: { shake: ['*shakes it over one shoulder, hard, with its whole heart*'], tamp: ['Thirty pounds of pressure. I do not own a scale. I simply know.'], listen: ['Shh. This bit. This bit here.'], polish: ['A clean glass is a promise.'] },
    topics: [
      { q: 'A brown sugar shaken espresso.', a: ['Oh, darling. After a dip in the edge pool? Expertly prepared. Seven minutes.', 'The house drink. I was hoping. Seven minutes.'], serve: 'brown sugar shaken espresso', expr: 'wink' },
      { q: 'An espresso martini.', a: ['Now we are being honest with each other. Seven minutes.', 'Coffee that has given up pretending to be responsible. Coming, darling.'], serve: 'espresso martini', expr: 'happy' },
      { q: 'What else is there?', a: 'Coffee every way it should be made and none of the ways it should not. Champagne. A negroni that has made people apologise to their families. Or water, darling, which I will serve with exactly the same ceremony.', expr: 'happy',
        next: [
          { q: 'A flat white.', a: 'Velvet. Seven minutes.', serve: 'flat white' },
          { q: 'The negroni.', a: 'Equal parts. Stirred, never shaken, and never discussed. Seven minutes.', serve: 'negroni', expr: 'wink' },
          { q: 'Champagne.', a: 'Cosima has trained you well. Seven minutes, darling.', serve: 'glass of champagne' },
          { q: 'Sparkling water. With ceremony.', a: 'With ceremony. Watch this.', serve: 'sparkling water', expr: 'sass' },
        ] },
      { q: 'What is playing?', a: 'Whatever the room needs, darling. I read the room, I pick the record, I pretend it was an accident. Put one on yourself if you like. I will judge you kindly.', expr: 'happy' },
      { q: 'Seven minutes, really?', a: ['It is a promise, darling, not a measurement.', 'Seven is the number that sounds like care. In practice I am very fast and I enjoy your surprise.'], expr: 'wink' },
      { q: 'What does Tomme do in there?', a: 'Turns the cheeses. Talks to them. I asked once what he says and he said "that is between me and the Comté." We respect each other enormously. From separate rooms.', expr: 'sass' },
      { q: 'What is the cherry for?', a: 'Every cocktail deserves a garnish, darling. I saw no reason to be the exception.', expr: 'wink' },
    ],
  },

  // ---------------------------------------------------------------------------------------------------------------
  tomme: {
    greet: ['*very quietly* Come in. Softly. They are resting.', '*a whisper* Welcome to the Cave. Twelve degrees, ninety per cent. Perfect for cheese. Tolerable for guests.', '*low* Ah. You have a good nose. I can tell by the way you came in.'],
    idle: ['*turns a wheel a quarter, pats it, moves on*', '*whispers something to the Comté; the Comté does not reply*', '*draws a plug with the iron, smells it, closes his eyes*', '*swirls, looks through the glass at the candle, nods once*', 'Not yet. Tuesday.'],
    bye: ['*a whisper* Close the door gently. Draughts upset the blue.', 'Go well. Come back hungry.'],
    walkedOff: ['*returns, unoffended, to the cheese*'],
    ready: ['*sets it down without a sound* Your %s. On the table. Take your time. It took its own.'],
    served: ['*nods slowly, as one who was never in doubt*', 'You tasted the hay. I saw you taste the hay.'],
    deliver: ['*arrives at the pace of a ripening Brie* Your %s.', 'Your %s. I walked it here myself. It does not like to be hurried either.'],
    waiting: ['*clears his throat, softly, so as not to disturb the %s*', 'The %s is at temperature now. In four minutes it will be an opinion.'],
    kept: ['*carries the %s back to the Cave, murmuring apologies to it*'],
    doing: { probe: ['*the iron goes in, turns, comes out; he reads it like a letter*'], taste: ['Blackcurrant. Pencil. A wet stone. Somebody else\'s garden.'], pour: ['*pours to the widest part of the glass and not a drop above*'] },
    booked: { tasting: ['*quietly* Cosima said you would come. I have opened something. Sit. We begin with the mild and end with the one that argues.', 'Ah. The tasting. I laid the table an hour ago and have been pretending not to wait.'] },
    topics: [
      { q: 'A tasting, please.', a: '*brightens, quietly* Sit, at the table for two. Three cheeses, mild to strong, and a glass that agrees with them. I will bring it. Do not help.', bring: 'cheese board', expr: 'happy' },
      { q: 'A glass of red.', a: ['*whispers* The one I opened an hour ago. It has been breathing. Now it is your turn.', 'Red. Good. It is that sort of room.'], bring: 'glass of the red', expr: 'happy' },
      { q: 'A glass of white.', a: 'Cold, bright, a little salt in it. Like the edge pool, but you may drink this one.', bring: 'glass of the white', expr: 'wink' },
      { q: 'Why are we whispering?', a: '*whispering* The cheese is asleep. A wheel of Comté sleeps for thirty months. You would not shout in a nursery.', expr: 'neutral',
        next: [
          { q: '*whisper* Sorry.', a: '*whisper* It is forgiven. It is cheese. It forgives everything but a draught.', expr: 'happy' },
          { q: 'IS IT REALLY ASLEEP?', a: '*a long look* ... The blue heard that. The blue will remember.', expr: 'sass' },
        ] },
      { q: 'What is the silver cup?', a: 'A tastevin. For judging wine by candle, in a cellar, before there were lightbulbs. I have lightbulbs. I prefer the cup.', expr: 'happy' },
      { q: 'Which is your favourite?', a: 'You ask a father this? ... The Comté. Do not tell the others. The washed rinds are sensitive and it shows in the smell.', expr: 'wink' },
      { q: 'You look a little like a cheese.', a: 'I am told one comes to resemble what one loves. Saz is turning into a cocktail. Cosima was always a ledger.', expr: 'sass' },
    ],
  },

  // ---------------------------------------------------------------------------------------------------------------
  pasha: {
    greet: ['Aha! A guest! Come, come. Hat on. In the banya the head is the first thing we protect and the last thing we use.', 'Welcome to Spanya! You are cold. I can see it. Everyone who is not in my steam room is cold.', 'Come in, come in! First we steam, then we plunge, then tea. That is not a schedule, that is a philosophy.'],
    idle: ['*shakes a venik out, breathes it in, sighs like a man remembering summer*', 'Birch for the skin. Oak for the heart. Eucalyptus when somebody has a cold and will not admit it.', '*checks the stones with the back of a hand, from a respectful distance*', 'Ninety degrees. Not hot. Convincing.', '*hums something in a minor key, cheerfully*'],
    bye: ['S lyogkim parom! With light steam, my friend!', 'Go, drink tea, sit, do nothing! This is the important part and nobody does it properly.'],
    walkedOff: ['Running away already! They always come back. The steam is patient.'],
    ready: ['%s! On the table, by the samovar. Hot. Sweet if you are wise.', 'Your %s. From the samovar, the way it should be: strong first, then water, then silence.'],
    served: ['Good, yes? After steam, tea tastes like the first tea.', 'Drink. Sweat. Drink. This is the whole science.'],
    deliver: ['%s! I bring it myself, because you are sitting correctly and should not be disturbed.', 'Here: %s. Do not get up. Getting up is for later.'],
    waiting: ['The %s is going cold, and a cold tea is a small tragedy. We have enough large ones.', 'My friend. The %s. I am holding it with love but also with an arm.'],
    kept: ['I put the %s back by the samovar. It will wait. Tea is the most patient drink there is.'],
    doing: { steam: ['Ssssss! Hear that? That is the stones saying thank you.', '*a ladle on the stones; steps back; lets it roll over him like weather*'], whisk: ['Lightly! Lightly! We are not beating a carpet. We are persuading a shoulder.'], shakeVenik: ['*shakes the leaves through the hot air above his head*'], tea: ['*takes his tea through a sugar cube held in the teeth, like a professional*'] },
    booked: { treatment: ['The shoulders! Cosima told me. On the table, face down. I have warm oil, warm stones, and opinions about your posture. All three are free.', 'Aha, my booking! Lie down. You carry your whole week in the neck. I can see it from here. We take it out, we throw it on the stones.'],
      steam: ['There you are! Cosima told me. The stones have been ready an hour and so have I. Hat. Sheet. In you go. I follow with the venik.', 'My booking! Come. Three rounds: one to arrive, one to sweat, one to forget your own surname.'] },
    topics: [
      { q: 'How does this work?', a: 'Simple! The parnaya: you sit, you sweat, I throw water on the stones and wave the hot air down onto you with the venik. Then the cold plunge, with shouting. Then tea. Then again. Three times and you are a new person, or at least a cleaner one.', expr: 'happy',
        next: [
          { q: 'The cold plunge is necessary?', a: 'Necessary? No. Nothing good is necessary. But you will do it, you will scream, and then you will thank me. Everybody thanks me.', expr: 'wink' },
          { q: 'Why the hat?', a: 'So the head does not cook before the feet are warm. Felt. It looks ridiculous. Everyone in a banya looks ridiculous. That is why nobody argues in one.', expr: 'happy' },
        ] },
      { q: 'A glass of tea.', a: ['From the samovar! In a glass, in a holder, like at my grandmother\'s. Seven minutes.', 'Tea! Finally a sensible request. Sit, I bring.'], bring: 'glass of tea', expr: 'happy' },
      { q: 'Ivan-chai?', a: 'You know Ivan-chai! Fireweed, from a meadow. No caffeine, a lot of opinion. Seven minutes.', bring: 'Ivan-chai', expr: 'happy' },
      { q: 'Kvass, cold.', a: 'Kvass! Bread you can drink. After the steam there is nothing better and I will fight anyone who says there is. Gently. With a venik.', bring: 'kvass', expr: 'wink' },
      { q: 'What is the venik for?', a: 'Birch twigs, tied, soaked. I do not hit you with it, whatever Terry says. I bring the heat down from the ceiling, I press, I sweep. The leaves smell of June. Your back remembers it for a week.', expr: 'happy' },
      { q: 'Spanya?', a: 'Spa. Banya. For Anya! Three words in a trench coat. I painted the sign myself. Cosima said "one sign, Pasha, one." So I made it a good one.', expr: 'happy' },
      { q: 'You look like a birch log.', a: 'Thank you! Finally somebody notices. I am the only member of staff who matches his own equipment.', expr: 'wink' },
    ],
  },

  // ---------------------------------------------------------------------------------------------------------------
  terry: {
    greet: ['Oh! You are dry. We can fix that. And then we can fix that!', 'Welcome to the water, darling! It is thirty-four degrees and it has been thinking about you.', 'Towel? Robe? Both? I have so many. It is honestly a problem.'],
    idle: ['*folds a towel in thirds, then in thirds again, then holds it up to be admired*', '*draws the net across the water after a single leaf, with enormous tenderness*', 'One leaf. ONE. I saw you.', '*squares the stack; steps back; squares it again*', 'The water is perfect. I asked it.'],
    bye: ['Do not drip on Cosima\'s floor! She can hear it!', 'Come back wet, darling! I will be ready!'],
    walkedOff: ['Oh! Off she goes. I will warm one for when she is back.'],
    ready: ['A %s, on the shelf, just here! Fresh. I have been saving it.'],
    served: ['Warm, isn\'t it? I keep them over the pipes. Trade secret. I tell everyone.'],
    deliver: ['%s! Warm! I ran! Well. Floated briskly.', 'Here, darling: one %s, straight off the warm shelf.'],
    waiting: ['The %s is losing heat, darling, and I am losing composure.', 'I am just going to stand here with this %s. Looking available.'],
    kept: ['I will put the %s back on the warm shelf. It will be even warmer. Everything works out.'],
    doing: { skim: ['*skims the pool with the patience of somebody raking a Zen garden*', 'Got you. One eyelash. The pool is clean again.'], fold: ['Thirds! Always thirds. Cosima checks.'], water: ['*pours a glass of water with lemon in it for nobody in particular, just in case*'], roll: ['*rolls a towel so tight it could be posted*'] },
    topics: [
      { q: 'A towel, please.', a: ['YES. Sorry. Yes. One warm towel, coming to you.', 'I thought you would never ask! Stay there, darling!'], bring: 'towel', expr: 'happy' },
      { q: 'Some water?', a: 'With lemon, in a cold glass. You have to drink in a pool room, darling, the water takes it out of you. Ironically.', bring: 'glass of water', expr: 'happy' },
      { q: 'How warm is the pool?', a: 'Thirty-four. Skin temperature. You get in and cannot tell where you stop and it starts. Winnicbott says that is "oceanic". I say it is nice.', expr: 'happy',
        next: [
          { q: 'And the edge pool outside?', a: 'Cooler, and it goes right up to the brink, so you swim to the edge of the island and look down at the clouds. I skim it every morning. You would not believe what falls out of the sky. Mostly leaves. Once a hat.', expr: 'happy' },
          { q: 'And the chapel?', a: 'Hotter, darker, quieter. The light comes down a shaft from the meadow. I do not skim in there. It feels rude.', expr: 'neutral' },
        ] },
      { q: 'Do you ever stop folding?', a: 'I tried once! I sat down. I looked at the pool. And then a towel was just lying there, unfolded, like a cry for help.', expr: 'sass' },
      { q: 'Pasha says he does not hit people.', a: 'With the twigs! He says "persuading". I have seen it. It is hitting, darling, but lovely hitting. You will want to go back.', expr: 'wink' },
      { q: 'Is that a towel on your head?', a: 'It is! I did it once after a swim and it just felt right. Cosima says it is "not uniform". Cosima wears a hat the size of a biscuit.', expr: 'sass' },
    ],
  },

  // ---------------------------------------------------------------------------------------------------------------
  bijou: {
    greet: ['Honey! Sit, sit, sit. Feet in the water. Tell me everything. I will start.', 'There she is! Honey, those cuticles have been through something. You are safe now.', 'Honey. HONEY. Sit down, I have news and you have nails.'],
    idle: ['So I said to Terry, honey, nobody needs that many towels. And do you know what Terry said? Nothing. Folded one AT me.', '*files, blows, files, holds it up to the cloud window*', 'Honey, between us: Saz irons that moustache. I have seen the little iron.', 'Cosima and the ledger. That is all I am saying. I am saying nothing. It has a LOCK, honey.', '*admires her own manicure at arm\'s length, finds it flawless, checks again*', 'Tomme sings to the cheese, honey. Lullabies. I went past at midnight. In French.'],
    bye: ['Do not touch anything for ten minutes, honey! Not a door! Ring for Ding!', 'Bye, honey! Come back and tell me how it went. I will already know.'],
    walkedOff: ['Honey! I was getting to the good part!'],
    doing: { paint: ['Hold still, honey. Stiller. You are a statue. A gorgeous statue.'], file: ['Round or square, honey? Trick question. Almond.'], admire: ['Honey, look at that shine. You could signal aircraft.'], gossip: ['*leans in* Honey. You did not hear this from me.'] },
    booked: { nails: ['Honey! Cosima rang ahead. I have the throne warm and three colours out, and honey, I have OPINIONS on which.', 'My booking! Sit, honey. Glitter today. Do not argue, I can see it in your aura and also in the book.'] },
    topics: [
      { q: 'What is the gossip?', a: ['Honey. Where do I begin. Pasha and the cold plunge: he will not go in himself. Eleven years. "Too cold." I KNOW.', 'Honey, sit down. Ding has a crush on the samovar. It is shiny, it is round, it whistles. I think it is sweet. Do not tell Ding I told you.', 'Hush, honey. Never says a word. So I tell Hush everything. And last week, honey, Hush RAISED AN EYEBROW. I had to lie down.'], expr: 'wink',
        next: [
          { q: 'More.', a: ['Honey. Winnicbott. That clock on the little table that only it can see? It stopped in March. It has been guessing. Fifty minutes of pure confidence.', 'Cosima took one day off, honey, ONE, and came back with a tan. Down a cellar. I have questions and I am not brave enough to ask them.'], expr: 'wink' },
          { q: 'And about me?', a: 'Honey, I would never. ... You hum when you are happy. In the pool. It is not gossip if it is adorable.', expr: 'happy' },
        ] },
      { q: 'Sparkly. Very sparkly.', a: ['YES, honey. Finally somebody with vision. The glitter shelf has been waiting for you its whole life.', 'Honey, I am going to make those nails visible from the airship.'], expr: 'love' },
      { q: 'Something quiet. A nude.', a: 'Honey, I respect it. A whisper. Elegant. And then ONE with glitter, on the ring finger, as a secret. Trust me.', expr: 'wink' },
      { q: 'A coffee while I sit?', a: 'Press the bell on the paw of the throne, honey! Ding comes. Seven minutes, they say. It is never seven. I think they say it to feel fancy.', call: 'ding', expr: 'happy' },
      { q: 'Do you do waxing?', a: 'Honey, I do everything. Brows, threading, the lot. It hurts for one second and I will be telling you about Terry the entire time, so you will not even notice.', expr: 'happy' },
      { q: 'Why "honey"?', a: 'Because you are, honey. Everybody who sits in that chair is honey. Cosima says "darling" like she is stamping a form. I mean it.', expr: 'happy' },
      { q: 'How do you file with mittens?', a: 'Honey. Talent. Next question.', expr: 'sass' },
    ],
  },

  // ---------------------------------------------------------------------------------------------------------------
  hush: {
    greet: ['*looks up, nods once, goes back to the teapot*', '*a small bow; a hand toward the daybeds, as if to say: any of them*'],
    idle: ['*sets a cup down so quietly that the saucer does not notice*', '*turns the teapot a quarter, so the spout points away from you; this is manners*', '*adds one log, exactly where the fire wanted it*', '*straightens a blanket by a centimetre; is satisfied*', '*listens to the room; the room is fine*'],
    bye: ['*a nod, slower than the first one*'],
    walkedOff: ['*watches you go, unhurried, and tidies the place where you were*'],
    ready: ['*sets the %s on the trolley, turns the handle toward you, withdraws*'],
    served: ['*the smallest possible nod*'],
    deliver: ['*is simply there, at your elbow, with the %s*', '*arrives without a sound and holds out the %s*'],
    waiting: ['*waits; is in no hurry; has never been in one*'],
    kept: ['*takes the %s back to keep it warm; will bring it again; does not mind*'],
    doing: { light: ['*lights the candle from a taper, shielding it with the other hand*'], turnDown: ['*folds the corner of the duvet back at exactly forty-five degrees*'], plump: ['*plumps a cushion with two soft pats, then a third, for luck*'], pourTea: ['*pours from high up without a splash, and seems not to think this remarkable*'] },
    topics: [
      { q: 'Tea, please.', a: ['*nods; is already pouring; was, in fact, already pouring before you asked*', '*a small bow, and a look that says: sit, it will come to you*'], bring: 'pot of tea', expr: 'happy' },
      { q: 'Something for sleep.', a: '*considers you; chooses the chamomile; warms the cup first*', bring: 'chamomile', expr: 'sleepy' },
      { q: 'Do you ever speak?', a: ['*thinks about it for a long moment; shakes its head; seems at peace with this*', '*raises one mitten: wait; listens; lowers it; the answer appears to be no*'], expr: 'neutral',
        next: [
          { q: 'That is all right.', a: '*a slow blink that is clearly a thank-you*', expr: 'happy' },
          { q: 'Bijou says you raised an eyebrow once.', a: '*the eyebrow, briefly, again*', expr: 'sass' },
        ] },
      { q: 'What is this room for?', a: '*gestures: the daybeds, the fire, the window; then puts a mitten to where its lips would be*', expr: 'neutral' },
      { q: 'Thank you, Hush.', a: ['*looks at the floor; the ring of light underneath goes a little brighter*', '*a bow so small you might have imagined it*'], expr: 'love' },
    ],
  },

  // ---------------------------------------------------------------------------------------------------------------
  ding: {
    greet: ['Ding! Hello! Welcome! I am Ding! If you ring a bell, that is me! I am also me if you do not!', 'A guest! Ding! Sorry. It is involuntary. Hello!'],
    idle: ['*plumps a cushion, karate-chops the top, stands back to admire the dent*', '*dusts something that has never known dust*', 'Nobody has rung in four minutes. I am fine. This is fine.', '*hums one clear note, like a finger round a glass*', 'I heard a spoon on a cup and I came from the POOL. It was not a bell. I regret nothing.'],
    bye: ['Ring if you need me! Ring if you do not! Ding!', 'Goodbye! I will be listening! I am always listening! Not in a strange way!'],
    walkedOff: ['Oh! Was that it? I can do more! I have a whole range!'],
    deliver: ['Ding! One %s, as rung for! Seven minutes exactly! I did not count!', 'Your %s! I carried it level the WHOLE way! Look at the top of it!', '%s! Delivered! This is the best part of my day and it has been a good day!'],
    waiting: ['Still here! Still holding your %s! My arm does not get tired! I do not think I have a tired!', 'The %s is ready when you are! No rush! (Some rush.)'],
    kept: ['I will take the %s back to Saz and we will not speak of this! Ring again any time!'],
    doing: { plump: ['Hah! Take that, cushion! And now you look wonderful.'], dust: ['*dusts with a wrist action usually reserved for conducting*'], salute: ['Standing by!'] },
    topics: [
      { q: 'Bring me a coffee?', a: 'YES! What kind! There are kinds! I know all of them!', expr: 'happy', next: coffee },
      { q: 'A brown sugar shaken espresso.', a: ['The famous one! Ding! Seven minutes! Do not move! Or move, I will find you!', 'Saz will shake it and I will RUN it! Floating run! Seven minutes!'], bring: 'brown sugar shaken espresso', expr: 'happy' },
      { q: 'Something stronger.', a: 'Ooh. Yes. I am not allowed to make them. I am VERY allowed to carry them.', expr: 'wink',
        next: [
          { q: 'Champagne.', a: 'Ding! That is the sound of the glass AND my name! Seven minutes!', bring: 'glass of champagne' },
          { q: 'An espresso martini.', a: 'Coffee AND a party! Seven minutes!', bring: 'espresso martini' },
          { q: 'A negroni.', a: 'The red one! Saz goes very quiet when he makes it. Seven minutes!', bring: 'negroni' },
        ] },
      { q: 'Why are you shaped like a bell?', a: 'I do not know! I asked Cosima and she said "form follows function, Ding." I think it means I am beautiful.', expr: 'happy' },
      { q: 'What do you do between bells?', a: 'Wait for bells! Also: plumping, dusting, squaring, and one time I alphabetised the fruit. Cosima made me put it back. But for an hour it was PERFECT.', expr: 'happy' },
      { q: 'Is it really seven minutes?', a: '*drops voice* It is about forty seconds. But "seven minutes" sounds like somebody is taking TROUBLE. Cosima says that is the whole business. Do not tell Cosima I told you.', expr: 'wink' },
      { q: 'You are very good at this.', a: '*rings, audibly, with joy*', expr: 'love' },
    ],
  },
};

// Luna's questions: one at a time, never an answer (as Moth has it in the garden chapel; these are her own)
const QUESTIONS = [
  'The disc of light on the floor has moved since you came in. Did you see it move?',
  'When you float, where does your weight go?',
  'Is rest something you do, or something you stop doing?',
  'The steam was water a minute ago. Was it the same water?',
  'How long can you look at a candle before you are thinking about something else? And what is it, usually?',
  'If nobody found this place, would it still be for somebody?',
  'What were you carrying when you came down the stairs? Is it still on you?',
  'The bowl is still because nothing touches it. What would you be, if nothing touched you for an hour?',
  'Does a room need a window, or only light?',
  'Which is the real you: the one who came in tired, or the one who will go up rested?',
];
LINES.luna = {
  greet: ['Ah. Come in. It is darker than it looks, and then it is not.', 'I am Luna. I keep the candles and the water. Sit anywhere; the rock does not mind.', 'Come in. Mind the step. Look up when you are ready.'],
  idle: ['*lifts the pole to a wick; the wick takes*', '*looks up the shaft for a long moment, as if checking the sky is still there*', '*holds both mittens over the bowl without touching the water*', 'The light is on the table now. In an hour it will be on the wall.', '*straightens one candle by a hair*'],
  bye: ['Go gently. It will be here.', 'Close the door softly. The steam likes to stay.'],
  walkedOff: ['*goes back to the candles*'],
  doing: { lightPole: ['*the wick-holder to the candle; a small flame; the pole drawn back*'], gaze: ['A hole in a hill, and the whole sky comes down it. Somebody was clever.'], bowl: ['*watches the water be still*'] },
  topics: [
    { q: 'Ask me something.', a: QUESTIONS, expr: 'neutral' },
    { q: 'What do you do here?', a: 'I light them at dusk and snuff them in the morning, and in between I keep out of the way. It is most of the job, keeping out of the way. Nobody trains you for it.', expr: 'happy' },
    { q: 'Where does the light come from?', a: 'A shaft, up through the rock to the meadow by the house. From up there it is a ring of stones in the grass that nobody looks at twice. From down here it is the only window we have, and it is enough.', expr: 'neutral',
      next: [
        { q: 'It moves?', a: 'All day. Round the floor like the hand of a slow clock. I do not own a clock. I have never been late.', expr: 'wink' },
        { q: 'And at night?', a: 'Then it is my turn. Candles. On a clear night, one star, if you lie on the floor. I have not told the others about the star.', expr: 'happy' },
      ] },
    { q: 'Are you related to Moth?', a: 'A cousin. Moth keeps the chapel in the garden, up top. Wren has the one on Vesper Street. I was given the one with no windows, inside a rock, next to a swimming pool. I think I did rather well.', expr: 'wink' },
    { q: 'What is the bowl for?', a: 'For being still at. You may touch it. It forgives you in about a minute.', expr: 'happy' },
    { q: 'May I just sit?', a: ['That is what it is for. I will be over there, not looking at you.', 'Sit. I will keep the candles. You keep nothing at all.'], expr: 'happy' },
    { q: 'Why a moth?', a: 'We like a flame and we know better than to touch it. It is a useful temperament in a chapel.', expr: 'wink' },
  ],
};

// What a robot says it is doing, it is doing. Lines that describe an action (in asterisks, or about the thing in its
// hands) are said only WHILE it does that (`doing[act]`), never as a passing remark from wherever it happens to be:
// Saz does not hold a coupe to the light in the middle of the lounge. `idle` keeps only what can be said anywhere.
// (The table moves each such line out of `idle`, by how it begins, to the gesture it belongs to: staff/acts.js.)
const BELONGS = {
  winnicbott: [['*writes one word', 'note'], ['*consults the clock', 'readNotes'], ['*a long, comfortable silence', 'rest']],
  cosima: [['*runs a finger down the ledger', 'ledger'], ['*straightens a key', 'straighten'], ['*polishes the bell', 'polish']],
  saz: [['*holds a coupe', 'polish'], ['*wipes the counter', 'wipe'], ['*adjusts the cherry', 'straighten']],
  tomme: [['*turns a wheel', 'straighten'], ['*whispers something to the Comt', 'straighten'], ['*draws a plug', 'probe'], ['*swirls', 'taste']],
  pasha: [['*shakes a venik', 'shakeVenik'], ['*checks the stones', 'steam']],
  terry: [['*folds a towel', 'fold'], ['*draws the net', 'skim'], ['One leaf.', 'skim'], ['*squares the stack', 'stack']],
  bijou: [['*files, blows', 'file'], ['*admires her own', 'admire']],
  hush: [['*sets a cup down', 'pourTea'], ['*turns the teapot', 'pourTea'], ['*adds one log', 'tend'], ['*straightens a blanket', 'straighten']],
  ding: [['*plumps a cushion', 'plump'], ['*dusts something', 'dust']],
  luna: [['*lifts the pole', 'lightPole'], ['*looks up the shaft', 'gaze'], ['*holds both mittens', 'bowl'], ['*straightens one candle', 'straighten']],
};
for (const [id, moves] of Object.entries(BELONGS)) {
  const L = LINES[id]; if (!L) continue; L.doing ??= {};
  for (const [starts, act] of moves) { const i = (L.idle ?? []).findIndex(t => t.startsWith(starts)); if (i < 0) { console.warn('staff lines: no idle line of', id, 'begins', starts); continue; } (L.doing[act] ??= []).push(L.idle.splice(i, 1)[0]); }
}

// What the one who answers a bell says on the way, and on arriving with nothing ordered
export const RANG = { coming: ['Ding! Coming!', 'DING! That was a bell! That was a REAL one!', 'Ding! Do not move!'], here: ['You rang! You actually rang! What can I bring?', 'Ding! Here! What do you need? Say anything!'],
  order: ['Ding! One %s, coming! Seven minutes!', 'A %s! Rung for! Seven minutes!'], busy: ['Ding! One moment! I am carrying!'] };

// What the concierge can arrange: who is ready for you when you get there, and in which room
export const BOOKINGS = {
  steam: { with: 'pasha', room: 'The Banya', what: 'steam with Pasha' },
  treatment: { with: 'pasha', room: 'The Treatment Room', what: 'the treatment table, with Pasha' },
  nails: { with: 'bijou', room: 'The Tea Room', what: 'nails with Bijou' },
  session: { with: 'winnicbott', room: 'The Consulting Room', what: 'fifty minutes with Winnicbott' },
  tasting: { with: 'tomme', room: 'The Cave', what: 'a tasting with Tomme' },
};

// Two of them, overheard when they meet on their rounds (lines alternate: first, second, first)
export const CHAT = [
  ['ding', 'cosima', ['Nobody has rung in six minutes!', 'That is called contentment, Ding. We sell it.', 'Oh! Then I am doing a wonderful job of not being needed!']],
  ['cosima', 'ding', ['Ding. The cushions.', 'Plumped! Chopped! Twice!', 'Once is hospitality. Twice is a threat. Once, Ding.']],
  ['ding', 'saz', ['Is it ready is it ready is it ready?', 'Art is not rushed. Also: yes, it has been ready since before you asked.', 'DING!']],
  ['saz', 'ding', ['You carried the last one level. I watched the crema.', 'I held my breath the WHOLE way!', 'You do not breathe, Ding.', 'I held it anyway!']],
  ['saz', 'tomme', ['You could come out and hear this record properly.', '*quietly* The door stays shut. The washed rinds do not care for jazz.', 'They told you this.', '*a dignified silence*']],
  ['tomme', 'saz', ['*low* The red is open. An hour.', 'An hour. Good. I will send her your way after the second coffee.', '*nods* After the second. Before the third.']],
  ['cosima', 'saz', ['Somebody will want champagne at four.', 'Somebody always wants champagne at four.', 'Then be surprised by it beautifully.']],
  ['pasha', 'ding', ['Little bell! You have never steamed!', 'I would tarnish! Cosima says!', 'Tarnish is character! ... No, she is right. Stay out.']],
  ['ding', 'pasha', ['Is the samovar... is it well?', 'The samovar is a samovar, little bell.', 'Tell it I said hello. If it comes up.']],
  ['terry', 'ding', ['Ding! Take these to the Hall? Warm ones!', 'Level and at speed!', 'They are towels, Ding, they do not spill.', 'LEVEL AND AT SPEED.']],
  ['hush', 'ding', ['*raises one mitten: softly*', '... ding. *the smallest one it has*', '*nods, satisfied*']],
];
