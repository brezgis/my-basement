// What the school shelves where. This is the only file of the book machinery that knows it is a school: the
// rest (catalogue.js, shelves.js, spines.js, draw.js, aim.js, ../books.js) would serve the house or the town as
// it stands, given another of these.
//
// Every title is a record of assets/books.json (the house's list: 1,611 real books on 23 shelves). A collection
// only chooses among them and puts them in order; nothing here names a book that is not in the list (a pattern
// that matches nothing simply adds nothing).
//
//   COLLECTIONS   name -> parts, in shelving order. A part is a shelf of books.json, another collection, or
//                 { shelf, author: /re/, title: /re/, since, until, by } (see catalogue.js).
//   ROOMS         room name -> the collection its shelves hold, for shelves whose furnisher did not say
//                 (K.bookcase, K.bookRow, K.bookStack with no subject). '*' is everywhere else.
//   NAMES         what each class is called on a range-end label.

export const NAMES = {
  computing: 'Computing', philosophy: 'Philosophy', psychology: 'Psychology', linguistics: 'Linguistics', science: 'Science', math: 'Mathematics',
  nature: 'Natural history', garden: 'Gardening', cooking: 'Cookery', art: 'Art', music: 'Music', film: 'Film', classics: 'Classics', poetry: 'Poetry',
  drama: 'Drama', essays: 'Essays', literature: 'Literature', mystery: 'Mystery', scifi: 'Science fiction', children: 'Children’s books',
  history: 'History', biography: 'Biography', travel: 'Travel',
};

// The order of the classes in the Book Room: Dewey's order of 1876, near enough (the cataloguer will tell you).
const DEWEY = ['computing', 'philosophy', 'psychology', 'linguistics', 'science', 'math', 'nature', 'garden', 'cooking', 'art', 'music', 'film',
  'classics', 'poetry', 'drama', 'essays', 'literature', 'mystery', 'scifi', 'children', 'history', 'biography', 'travel'];

const RUSSIANS = /Tolstoy|Dostoevsky|Chekhov|Pushkin|Gogol|Turgenev|Bulgakov|Nabokov|Akhmatova|Pasternak|Solzhenitsyn|Lermontov|Tsvetaeva|Mandelstam|Brodsky|Babel|Platonov|Zamyatin|Goncharov|Leskov|Bunin|Grossman|Shalamov|Kharms|Ulitskaya|Alexievich|Berdyaev|Bakhtin|Vygotsky|Luria|Jakobson|Vološinov|Trubetzkoy|Propp|Shklovsky|Lotman|Herzen|Gorky|Teffi|Dovlatov|Sorokin|Pelevin|Petrushevskaya|Strugatsky|Yerofeev|Erofeev|Tsypkin|Vodolazkin/;
const ROMANS = /Virgil|Ovid|Catullus|Caesar|Cicero|Petronius|Tacitus|Suetonius|Apuleius|Augustine|Lucretius|Horace|Seneca|Livy|Juvenal|Boethius|Marcus Aurelius|Pliny|Plautus|Terence|Martial|Sallust|Quintilian|Erasmus|Thomas More/;

export const COLLECTIONS = {
  // Rindge Library. The Book Room is the whole list in class order; the Reading Room has what is new, then what is most asked for.
  stack: DEWEY,
  new: [{ since: 2000, by: 'newest' }],
  reading: [{ since: 2000, shelf: DEWEY }, 'mystery', 'scifi', 'literature', 'poetry', 'essays', 'travel', 'biography', 'nature', 'children', 'cooking', 'garden'],
  returns: [{ by: 'mixed', salt: 'returned' }],
  trustees: ['history', 'biography', 'essays', 'travel', 'art'],
  // The Stone Library houses Philosophy: philosophy and the classics first, then a gentleman's general library
  // (everything but the cookery and the children's books, which are across the yard).
  stone: ['philosophy', 'classics', 'history', 'biography', 'essays', 'poetry', 'drama', 'literature', 'linguistics', 'psychology', 'math', 'science', 'nature',
    'art', 'music', 'travel', 'garden', 'mystery', 'scifi', 'computing', 'film'],
  seminar: [{ author: /^Plato$/ }, 'philosophy', 'classics'],      // (what lies on the seminar table: PHIL 110 is reading Plato)
  // Snow Hall: each professor's own subject first, then the shelves it comes from. (The faculty as it stands in
  // furnish/snow_up.js and snow_low.js on 14 November 2026: the Laboratory's groups.)
  dynamics: [{ shelf: ['math', 'science'], title: /Chaos|^Sync|Fractal|Symmetry|Calculus|Mathematical Analysis|Complex Analysis|Linear Algebra|Topology|Geometry and the Imagination|What Is Mathematics|Probability Theory|Science and Hypothesis|Value of Science|^Principia$|Heavenly Spheres|Order of Time|Journey Through Genius|Euler/ }, 'math'],
  morphogenesis: [{ shelf: ['nature', 'science', 'math', 'computing', 'garden'], title: /Growth and Form|Art Forms in Nature|Origin of Species|Double Helix|Gene: An|Selfish Gene|Blind Watchmaker|Wonderful Life|Lives of a Cell|Beak of the Finch|Fractal|Symmetry|Micrographia|Anatomy|corporis fabrica|Essential Turing|Metamorphosis insectorum|Voyage of the Beagle|Song of the Dodo|Entangled Life|Liliacées|Hortus/ }, 'nature', 'science'],
  mind: [{ shelf: 'philosophy', title: /Mind|Conscious|Intention|Psychosemantics|Strange Loop|Gödel, Escher|Embodied|Self|View from Nowhere|Meditations on First|Perception|Principles of Psychology|Brains|Fluid Concepts|Biological Categories|Mirror of Nature|Human Understanding/ },
    { shelf: 'science', title: /Astonishing Hypothesis|Phantoms in the Brain|Feeling of What Happens|Emperor’s New Mind|Emperor's New Mind/ }, { shelf: 'nature', title: /Other Minds/ }, 'philosophy'],
  neural: [{ shelf: ['computing', 'science', 'psychology', 'philosophy', 'math', 'nature'], title: /Computer and the Brain|Perceptrons|Society of Mind|Astonishing Hypothesis|Phantoms in the Brain|Feeling of What Happens|Principles of Psychology|Mistook His Wife|Musicophilia|Mnemonist|Shattered World|Cybernetics|Information Theory, Inference|Theory of Communication|Pattern Recognition|^Deep Learning$|Embodied Mind|Behave|Ecological Approach|Other Minds|Emperor|Why Zebras/ }, 'psychology', 'science'],
  deeplearning: [{ shelf: ['computing', 'math', 'linguistics'], title: /Deep Learning|Pattern Recognition|Statistical Learning|Machine Learning|Learning from Data|Information Theory|Convex Optimization|Matrix Computations|Linear Algebra|Statistical Rethinking|Artificial Intelligence|Perceptrons|Alignment Problem|Human Compatible|Superintelligence|Causality|Book of Why|Neural|Speech and Language Processing|Statistical Natural|Distributional|Probabil|Weapons of Math|Algorithms/ }, 'computing'],
  collective: [{ shelf: ['nature', 'garden', 'science', 'psychology'], title: /The Ants|Bee|Hive|^Sync|Bird|Raven|Selfish Gene|Entangled Life|Mother Tree|Shadow of Man|Smart Enough|Octopus|Sting in the Tale|Buzz|Obedience to Authority|Lives of a Cell|Immense World|Other Minds|Living Planet|Forest Unseen/ }, 'nature'],
  complexity: [{ shelf: ['science', 'math', 'computing', 'nature', 'philosophy', 'garden'], title: /^Sync|Chaos|Fractal|Growth and Form|Cybernetics|Sciences of the Artificial|The Ants|Honeybee Democracy|Lives of a Cell|Gödel, Escher|Strange Loop|Society of Mind|Pattern on the Stone|^The Information|Theory of Communication|Selfish Gene|Blind Watchmaker|Wonderful Life|Entangled Life|Order of Time|Emperor|Buzz about Bees|Lives of Bees|Origin of Species|Double Helix|Gene: An|Symmetry|Scientific Revolutions|Computer and the Brain/ },
    'science', 'math'],
  statphys: [{ shelf: 'science', title: /Feynman|QED|Physical Law|Six Easy|Principia|Opticks|Spacetime|Gravitation|Brief History of Time|Elegant Universe|Fabric of the Cosmos|Lessons on Physics|Order of Time|Infinity|Emperor|Science and Hypothesis|Value of Science|^Sync|Ignition|^The Elements/ },
    { shelf: ['math', 'computing'], title: /Probability|Information Theory|Theory of Communication|Chaos|Fractal|Statistical|Symmetry|^The Information/ }, 'science', 'math', 'nature'],
  computation: [{ shelf: ['computing', 'math', 'philosophy'], title: /Theory of Computation|Automata|Computability|Gödel|Turing|Art of Computer Programming|Introduction to Algorithms|Interpretation of Computer Programs|Laws of Thought|Principia Mathematica|Mathematical Introduction to Logic|Introduction to Logic|Set Theory|Symbolic Logic|Name of This Book|Mockingbird|Lady or the Tiger|^Code|Pattern on the Stone|Compilers|Hacker’s Delight|Hacker's Delight|How to Design Programs|Foundations of Arithmetic|Mathematical Philosophy|Proofs/ },
    'computing', 'math'],
  // (what the faculty taught when these shelves were first asked for: Russian, Latin, cognitive science, computational
  // linguistics, botany, quantum mechanics. No room holds them now; give a room one of these names in ROOMS to have them back.)
  russian: [{ author: RUSSIANS }, { title: /Russia|Igor’s Campaign|Igor's Campaign|Slavic|Soviet/ }, 'linguistics'],
  latin: [{ shelf: ['classics', 'philosophy', 'poetry', 'history'], author: ROMANS }, { title: /Latin|Roman|Rome/ }, 'classics'],
  cogsci: [{ shelf: 'psychology', title: /Cognition|Perception|Mnemonist|Shattered World|Mistook|Musicophilia|Thought of the Child|Intelligence in Children|Mind in Society|Communication|Flow/ }, 'neural', 'psychology'],
  compling: [{ shelf: 'linguistics', title: /Comput|Statistic|Corpus|Processing|Information|Pars|Formal|Mathematical|Machine|Neural|Syntactic Structures|Aspects of the Theory|Least Effort|Probabil/ }, 'deeplearning', 'linguistics'],
  botany: [{ shelf: ['nature', 'garden'], title: /Moss|Sweetgrass|Entangled|Mother Tree|Lab Girl|Oak|Forest|Trees|Botany|Hortus|Liliacées|Roses|Growth and Form|Origin of Species|Plant|Garden|Perennial|Flower|Wild|Selborne|Art Forms in Nature|Invention of Nature|Microbes/ }, 'garden', 'nature'],
  quantum: ['statphys'],
  // the hall's own reading room: a little of what each of them teaches
  reserve: [{ shelf: ['dynamics', 'morphogenesis', 'mind', 'neural', 'deeplearning', 'collective', 'complexity', 'statphys', 'computation'], by: 'author' }],
  // the café's books to borrow, and anywhere nobody has said: things to read for pleasure
  borrow: [{ shelf: ['literature', 'mystery', 'scifi', 'essays', 'poetry', 'travel', 'cooking', 'nature', 'biography', 'children'], by: 'mixed' }],
};

export const ROOMS = {
  // Snow Hall: a professor's office and classroom hold their subject; a group's room, its group's
  'Room 305': 'dynamics', 'Room 202': 'dynamics',                                  // Delphine: Dynamical Systems
  'Room 201 A': 'morphogenesis', 'Room 201': 'morphogenesis',                      // Horatio: Morphogenesis
  'Room 208': ['mind', 'neural'], 'Room 205': 'mind',                              // Odette (Philosophy of Mind) shares 208 with Quince
  'Room 207': 'neural', 'Room 203': 'neural',                                      // Quince: Neural Computation, and his group's laboratory
  'Room 206 A': 'deeplearning', 'Room 206': 'deeplearning', 'Room 303': 'deeplearning',      // Tobias: Deep Learning
  'Botanical Laboratory': 'collective',                                            // Greta: Collective Behavior
  'Room 307': 'complexity', 'Lecture Room': 'complexity', 'Dressing Room': 'complexity',      // Cedric: Emergence and Complexity
  'Room 302': ['complexity', 'dynamics', 'computation'],                           // the Complex Systems Theory group's room
  'Room 102 A': 'statphys', 'Room 102': 'statphys',                                // Sorrel: Statistical Physics
  'Room 304': 'computation', 'Room 103': 'computation',                            // Euclid: Theory of Computation
  'Room 306': 'reserve', 'Room 306 A': 'borrow',                                   // the common room; the snug
  Museum: 'borrow',                                                                // the café's books to borrow, the study room
  // Rindge Library
  // (the Reading Room's and the Book Room's own shelves are runs of their own: furnish/library.js. These are for what lies about: on tables, trucks, a desk.)
  'Reading Room': 'returns', 'Delivery Room': 'new', 'Cataloguing Room': 'returns', 'Book Room': 'returns',
  'Librarian’s & Trustees’ Room': 'trustees', 'Upper Room': ['science', 'math', 'computing', 'psychology', 'philosophy'],
  // the Stone Library
  'The Stone Library': 'seminar',
  '*': 'borrow',
};
