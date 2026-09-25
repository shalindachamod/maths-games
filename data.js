// Mathverse — game catalogue (120 games)
// A game definition:
// {
//   id, title, cat, engine, gen, desc, lvl (0-4),
//   goal (questions per round), time (seconds per round, optional),
//   wrong (per-question penalty in seconds for timed games)
// }
'use strict';

(function () {
  const C = {
    arith: { name: 'Arithmetic', icon: '➕', color: 'c-amber' },
    compare: { name: 'Compare & Order', icon: '⚖️', color: 'c-violet' },
    seq: { name: 'Sequences', icon: '🔢', color: 'c-cyan' },
    frac: { name: 'Fractions & Decimals', icon: '½', color: 'c-rose' },
    alg: { name: 'Algebra', icon: '✖️', color: 'c-lime' },
    geo: { name: 'Geometry', icon: '📐', color: 'c-orange' },
    time: { name: 'Time & Money', icon: '⏰', color: 'c-teal' },
    word: { name: 'Word Problems', icon: '📝', color: 'c-blue' },
    num: { name: 'Number & Logic', icon: '🧠', color: 'c-pink' }
  };

  // helper to build ids
  let auto = 0;
  const G = (o) => Object.assign({ id: 'g' + (++auto), lvl: 2, goal: 10, engine: 'quiz' }, o);

  const games = [
    // ---------- ARITHMETIC (16) ----------
    G({ title: 'Addition Blitz', cat: 'arith', gen: 'addition', lvl: 0, desc: 'Warm up your sums with small numbers.' }),
    G({ title: 'Addition Arena', cat: 'arith', gen: 'addition', lvl: 1, desc: 'Two-digit additions, steady and quick.' }),
    G({ title: 'Addition Siege', cat: 'arith', gen: 'addition', lvl: 2, desc: 'Three-digit column addition.' }),
    G({ title: 'Addition Everest', cat: 'arith', gen: 'addition', lvl: 3, desc: 'Four-digit giants.' }),
    G({ title: 'Addition Black Hole', cat: 'arith', gen: 'addition', lvl: 4, desc: 'Five-digit monsters. Good luck.', time: 90 }),
    G({ title: 'Subtraction Start', cat: 'arith', gen: 'subtraction', lvl: 0, desc: 'Gentle take-aways.' }),
    G({ title: 'Subtraction Sprint', cat: 'arith', gen: 'subtraction', lvl: 1, desc: 'Two-digit differences.' }),
    G({ title: 'Subtraction Summit', cat: 'arith', gen: 'subtraction', lvl: 2, desc: 'Three-digit borrowing.' }),
    G({ title: 'Subtraction Storm', cat: 'arith', gen: 'subtraction', lvl: 3, desc: 'Four-digit, fast.', time: 100 }),
    G({ title: 'Times Table Twins', cat: 'arith', gen: 'multiplication', lvl: 0, desc: 'Tables up to 12 × 12.' }),
    G({ title: 'Times Table Turbo', cat: 'arith', gen: 'multiplication', lvl: 1, desc: 'Bigger factors, quicker clock.', time: 90 }),
    G({ title: 'Multiplication Mayhem', cat: 'arith', gen: 'multiplication', lvl: 2, desc: 'Two-digit × one-digit.' }),
    G({ title: 'Multiplication Masters', cat: 'arith', gen: 'multiplication', lvl: 3, desc: 'Three-digit × two-digit.' }),
    G({ title: 'Division Debut', cat: 'arith', gen: 'division', lvl: 0, desc: 'Exact small divisions.' }),
    G({ title: 'Division Deluxe', cat: 'arith', gen: 'division', lvl: 2, desc: 'Chunkier dividends.' }),
    G({ title: 'Four Operations Fusion', cat: 'arith', gen: 'mixedOps', lvl: 3, desc: '+ − × ÷ all mixed together.' }),

    // ---------- COMPARE & ORDER (12) ----------
    G({ title: 'Greater or Less', cat: 'compare', engine: 'compare', gen: 'compare', lvl: 0, desc: 'Pick >, < or =.' }),
    G({ title: 'Compare Clash', cat: 'compare', engine: 'compare', gen: 'compare', lvl: 2, desc: 'Bigger numbers, sharper eyes.' }),
    G({ title: 'Expression Face-Off', cat: 'compare', engine: 'compare', gen: 'compareExpr', lvl: 3, desc: 'Compare two sums without computing fully.' }),
    G({ title: 'Biggest Hunter', cat: 'compare', engine: 'quiz', gen: 'biggest', lvl: 0, desc: 'Spot the largest of four.', goal: 8 }),
    G({ title: 'Smallest Seeker', cat: 'compare', engine: 'quiz', gen: 'smallest', lvl: 1, desc: 'Find the tiniest number.', goal: 8 }),
    G({ title: 'Ranger Rounder', cat: 'compare', engine: 'input', gen: 'roundNumber', lvl: 1, desc: 'Round to tens, hundreds, thousands.' }),
    G({ title: 'Order the Line', cat: 'compare', engine: 'sort', gen: 'randNum', lvl: 1, desc: 'Click numbers into ascending order.', goal: 6 }),
    G({ title: 'Ascending Arrow', cat: 'compare', engine: 'sort', gen: 'randNum', lvl: 2, desc: 'Click four numbers into ascending order.', goal: 6 }),
    G({ title: 'Estimate Station', cat: 'compare', engine: 'input', gen: 'estimation', lvl: 1, desc: 'Round-then-add estimation.', goal: 8 }),
    G({ title: 'Place Value Patrol', cat: 'compare', engine: 'input', gen: 'placeValue', lvl: 1, desc: 'Name the digit in each place.', goal: 8 }),
    G({ title: 'Between the Walls', cat: 'compare', engine: 'compare', gen: 'compare', lvl: 3, desc: 'Thousands go head to head.' }),
    G({ title: 'Magnitude Master', cat: 'compare', engine: 'quiz', gen: 'biggest', lvl: 3, desc: 'Ten-thousands showdown.', goal: 8 }),

    // ---------- SEQUENCES (10) ----------
    G({ title: 'Step by Step', cat: 'seq', engine: 'sequence', gen: 'sequenceArith', lvl: 0, desc: 'Simple counting patterns.' }),
    G({ title: 'Pattern Piper', cat: 'seq', engine: 'sequence', gen: 'sequenceArith', lvl: 2, desc: 'Rising and falling steps.' }),
    G({ title: 'Double Trouble', cat: 'seq', engine: 'sequence', gen: 'sequenceGeom', lvl: 2, desc: 'Multiply-type patterns.' }),
    G({ title: 'Square Dance', cat: 'seq', engine: 'sequence', gen: 'sequenceSquare', lvl: 3, desc: 'Perfect squares in a row.' }),
    G({ title: 'Triangle Trek', cat: 'seq', engine: 'sequence', gen: 'sequenceTri', lvl: 3, desc: 'Triangular numbers trail.' }),
    G({ title: 'Sequence Sprint', cat: 'seq', engine: 'sequence', gen: 'sequenceArith', lvl: 4, desc: 'Speed round of patterns.', time: 90 }),
    G({ title: 'Odd One Out', cat: 'seq', engine: 'quiz', gen: 'oddOneOut', lvl: 2, desc: 'Which number does not belong?', goal: 8 }),
    G({ title: 'Missing Link', cat: 'seq', engine: 'input', gen: 'missingNumber', lvl: 1, desc: 'Find the number behind the ?.' }),
    G({ title: 'Order of Operations', cat: 'seq', engine: 'input', gen: 'orderOfOps', lvl: 3, desc: 'BIDMAS / PEMDAS practice.' }),
    G({ title: 'BIDMAS Blitz', cat: 'seq', engine: 'input', gen: 'orderOfOps', lvl: 4, desc: 'Five-term expressions at speed.', time: 100 }),

    // ---------- FRACTIONS & DECIMALS (14) ----------
    G({ title: 'Fraction Snap', cat: 'frac', engine: 'quiz', gen: 'fracSimplify', lvl: 1, desc: 'Choose the simplest form.', goal: 8 }),
    G({ title: 'Simplify Surge', cat: 'frac', engine: 'input', gen: 'fracSimplify', lvl: 2, desc: 'Type the simplified fraction.' }),
    G({ title: 'Fraction Plus', cat: 'frac', engine: 'input', gen: 'fracAdd', lvl: 2, desc: 'Add fractions with like or easy denominators.' }),
    G({ title: 'Fraction Forge', cat: 'frac', engine: 'input', gen: 'fracAdd', lvl: 4, desc: 'Trickier denominators.' }),
    G({ title: 'Fraction to Decimal', cat: 'frac', engine: 'input', gen: 'fracDecimal', lvl: 2, desc: 'Convert common fractions.' }),
    G({ title: 'Decimal to Fraction', cat: 'frac', engine: 'input', gen: 'decimalFrac', lvl: 2, desc: 'The reverse direction.' }),
    G({ title: 'Percentage Pit-Stop', cat: 'frac', engine: 'input', gen: 'percentOf', lvl: 1, desc: '10%, 25%, 50% of friendly numbers.' }),
    G({ title: 'Percent Powerhouse', cat: 'frac', engine: 'input', gen: 'percentOf', lvl: 4, desc: 'Awkward percentages, real numbers.' }),
    G({ title: 'Decimal Dash', cat: 'frac', engine: 'input', gen: 'decimalOps', lvl: 2, desc: 'Add and subtract decimals.' }),
    G({ title: 'Decimal Duel', cat: 'frac', engine: 'compare', gen: 'compareDec', lvl: 2, desc: 'Which decimal wins?' }),
    G({ title: 'Fraction Shoal', cat: 'frac', engine: 'shoot', gen: 'fracDecimal', lvl: 3, desc: 'Shoot the matching decimal bubbles.' }),
    G({ title: 'Percent Bubble Pop', cat: 'frac', engine: 'shoot', gen: 'percentOf', lvl: 2, desc: 'Pop bubbles holding the answer.' }),
    G({ title: 'Bond with Halves', cat: 'frac', engine: 'bond', gen: 'decimalFrac', lvl: 1, desc: 'Pick two tiles that sum to the target.', goal: 8 }),
    G({ title: 'Decimal Sorter', cat: 'frac', engine: 'sort', gen: 'fracDecimal', lvl: 3, desc: 'Sort decimal values, small to large.', goal: 6 }),

    // ---------- ALGEBRA (12) ----------
    G({ title: 'Solve for x — Starter', cat: 'alg', engine: 'input', gen: 'linearEq', lvl: 0, desc: 'One-step equations.' }),
    G({ title: 'Solve for x — Pro', cat: 'alg', engine: 'input', gen: 'linearEq', lvl: 2, desc: 'Two-step equations.' }),
    G({ title: 'Negative Frontier', cat: 'alg', engine: 'input', gen: 'linearEqNeg', lvl: 3, desc: 'Equations with negatives.' }),
    G({ title: 'Bracket Buster', cat: 'alg', engine: 'input', gen: 'expandBrackets', lvl: 2, desc: 'Expand a(x + b).' }),
    G({ title: 'Substitution Station', cat: 'alg', engine: 'input', gen: 'substitution', lvl: 1, desc: 'Plug in x and y.' }),
    G({ title: 'Substitution Supreme', cat: 'alg', engine: 'input', gen: 'substitution', lvl: 4, desc: 'Squares and three-term forms.' }),
    G({ title: 'Quadratic Roots', cat: 'alg', engine: 'input', gen: 'quadraticRoots', lvl: 4, desc: 'Factor-friendly quadratics.', goal: 6 }),
    G({ title: 'Equation Elevator', cat: 'alg', engine: 'quiz', gen: 'linearEq', lvl: 1, desc: 'Multiple choice equations.', goal: 8 }),
    G({ title: 'Algebra Bubble Raid', cat: 'alg', engine: 'shoot', gen: 'linearEq', lvl: 2, desc: 'Shoot the value of x.' }),
    G({ title: 'Term Memory', cat: 'alg', engine: 'memory', gen: 'substitution', lvl: 2, desc: 'Match expressions to values.' }),
    G({ title: 'Negative Snap', cat: 'alg', engine: 'quiz', gen: 'negativeOps', lvl: 2, desc: 'Quick-fire signed number sums.', goal: 8 }),
    G({ title: 'Signed Number Storm', cat: 'alg', engine: 'input', gen: 'negativeOps', lvl: 3, desc: 'Type signed answers fast.', time: 90 }),

    // ---------- GEOMETRY (14) ----------
    G({ title: 'Rectangle Area Rookie', cat: 'geo', engine: 'input', gen: 'areaRect', lvl: 0, desc: 'length × width.' }),
    G({ title: 'Area Ace', cat: 'geo', engine: 'input', gen: 'areaRect', lvl: 2, desc: 'Bigger rectangles.' }),
    G({ title: 'Perimeter Path', cat: 'geo', engine: 'input', gen: 'perimeterRect', lvl: 1, desc: 'Walk the border.' }),
    G({ title: 'Triangle Area', cat: 'geo', engine: 'input', gen: 'areaTri', lvl: 2, desc: 'Half base times height.' }),
    G({ title: 'Circumference Circuit', cat: 'geo', engine: 'input', gen: 'circleCircum', lvl: 3, desc: '2πr with π = 3.14.' }),
    G({ title: 'Circle Area Arena', cat: 'geo', engine: 'input', gen: 'circleArea', lvl: 3, desc: 'πr² with π = 3.14.' }),
    G({ title: 'Pythagoras Hunt', cat: 'geo', engine: 'input', gen: 'pythagoras', lvl: 3, desc: 'Classic right-triangle triples.' }),
    G({ title: 'Triangle Angle Trap', cat: 'geo', engine: 'input', gen: 'anglesTriangle', lvl: 2, desc: 'Angles sum to 180°.' }),
    G({ title: 'Straight Line Angles', cat: 'geo', engine: 'input', gen: 'anglesStraight', lvl: 1, desc: 'They sum to 180° too.' }),
    G({ title: 'Box Builder', cat: 'geo', engine: 'input', gen: 'volumeBox', lvl: 2, desc: 'Volume of a cuboid.' }),
    G({ title: 'Unit Converter', cat: 'geo', engine: 'input', gen: 'unitConvert', lvl: 1, desc: 'mm, cm, m, km and friends.' }),
    G({ title: 'Geometry Bubble Blitz', cat: 'geo', engine: 'shoot', gen: 'areaRect', lvl: 1, desc: 'Pop the right areas.' }),
    G({ title: 'Shape Memory Match', cat: 'geo', engine: 'memory', gen: 'areaRect', lvl: 1, desc: 'Match dimensions to areas.', goal: 8 }),
    G({ title: 'Perimeter Quiz Quest', cat: 'geo', engine: 'quiz', gen: 'perimeterRect', lvl: 1, desc: 'Choice-based perimeters.', goal: 8 }),

    // ---------- TIME & MONEY (10) ----------
    G({ title: 'Clockwork Adds', cat: 'time', engine: 'input', gen: 'timeAdd', lvl: 1, desc: 'Add hours and minutes.' }),
    G({ title: 'Time Traveler', cat: 'time', engine: 'input', gen: 'timeDiff', lvl: 2, desc: 'How long between two times?' }),
    G({ title: 'Change Please', cat: 'time', engine: 'input', gen: 'moneyChange', lvl: 1, desc: 'Work out the change.' }),
    G({ title: 'Shopping Spree', cat: 'time', engine: 'input', gen: 'moneyTotal', lvl: 1, desc: 'Add up the basket.' }),
    G({ title: 'Money Bubble Bank', cat: 'time', engine: 'shoot', gen: 'moneyChange', lvl: 2, desc: 'Shoot the correct change.' }),
    G({ title: 'Cash Memory', cat: 'time', engine: 'memory', gen: 'moneyTotal', lvl: 1, desc: 'Match totals to items.', goal: 8 }),
    G({ title: 'Price Sorter', cat: 'time', engine: 'sort', gen: 'moneyTotal', lvl: 2, desc: 'Sort prices low to high.', goal: 6 }),
    G({ title: 'True Time Truths', cat: 'time', engine: 'tf', gen: 'timeDiffTF', lvl: 2, desc: 'True or false time claims.' }),
    G({ title: 'Money True or False', cat: 'time', engine: 'tf', gen: 'moneyChangeTF', lvl: 2, desc: 'Spot wrong change instantly.' }),
    G({ title: 'Clock Crunch', cat: 'time', engine: 'input', gen: 'timeAdd', lvl: 3, desc: 'Timed clock arithmetic.', time: 90 }),

    // ---------- WORD PROBLEMS (10) ----------
    G({ title: 'Fair Shares', cat: 'word', engine: 'input', gen: 'wordShare', lvl: 1, desc: 'Sharing equally.' }),
    G({ title: 'Speed Machines', cat: 'word', engine: 'input', gen: 'wordSpeed', lvl: 2, desc: 'Distance = speed × time.' }),
    G({ title: 'Age Old Riddles', cat: 'word', engine: 'input', gen: 'wordAge', lvl: 2, desc: 'Ages now and later.' }),
    G({ title: 'Pen Palace', cat: 'word', engine: 'input', gen: 'wordBuy', lvl: 1, desc: 'Simple shopping maths.' }),
    G({ title: 'Ratio Reasoner', cat: 'word', engine: 'input', gen: 'wordRatio', lvl: 3, desc: 'Split amounts by ratio.' }),
    G({ title: 'Story Sum Sprint', cat: 'word', engine: 'quiz', gen: 'wordBuy', lvl: 1, desc: 'Choice-based story sums.', goal: 8 }),
    G({ title: 'Word Bubble Blast', cat: 'word', engine: 'shoot', gen: 'wordShare', lvl: 2, desc: 'Shoot the shared amount.' }),
    G({ title: 'Story True or False', cat: 'word', engine: 'tf', gen: 'wordAgeTF', lvl: 3, desc: 'Judge the claims.' }),
    G({ title: 'Ratio Memory', cat: 'word', engine: 'memory', gen: 'wordRatio', lvl: 3, desc: 'Match ratios to shares.', goal: 8 }),
    G({ title: 'Story Sorter', cat: 'word', engine: 'sort', gen: 'wordSpeed', lvl: 3, desc: 'Order journeys by distance.', goal: 6 }),

    // ---------- NUMBER & LOGIC (22) ----------
    G({ title: 'Prime or Not', cat: 'num', engine: 'tf', gen: 'primeCheck', lvl: 2, desc: 'Judge primality fast.', goal: 12 }),
    G({ title: 'Prime Bubble Hunt', cat: 'num', engine: 'shoot', gen: 'primeCheck', lvl: 2, desc: 'Shoot only the primes... carefully.' }),
    G({ title: 'Factor or Fiction', cat: 'num', engine: 'tf', gen: 'factorFind', lvl: 2, desc: 'Is it really a factor?', goal: 12 }),
    G({ title: 'Multiple Choice Multiples', cat: 'num', engine: 'tf', gen: 'multipleFind', lvl: 2, desc: 'Spot true multiples.', goal: 12 }),
    G({ title: 'GCD Grinder', cat: 'num', engine: 'input', gen: 'gcdFind', lvl: 3, desc: 'Greatest common divisor.' }),
    G({ title: 'LCM Launcher', cat: 'num', engine: 'input', gen: 'lcmFind', lvl: 3, desc: 'Lowest common multiple.' }),
    G({ title: 'Even Steven', cat: 'num', engine: 'input', gen: 'evenOdd', lvl: 0, desc: 'Even or odd, lightning round.', time: 60 }),
    G({ title: 'Square Root Sprint', cat: 'num', engine: 'input', gen: 'squareRoot', lvl: 1, desc: 'Roots of perfect squares.' }),
    G({ title: 'Cube Root Cruise', cat: 'num', engine: 'input', gen: 'cubeRoot', lvl: 3, desc: 'Cubes and their roots.' }),
    G({ title: 'Power Up', cat: 'num', engine: 'input', gen: 'powerCalc', lvl: 2, desc: 'Squares and cubes of numbers.' }),
    G({ title: 'Negative Navigator', cat: 'num', engine: 'input', gen: 'negativeOps', lvl: 2, desc: 'Below zero adventures.' }),
    G({ title: 'Mean Machine', cat: 'num', engine: 'input', gen: 'meanFind', lvl: 2, desc: 'Averages that come out whole.' }),
    G({ title: 'Median Hunter', cat: 'num', engine: 'input', gen: 'medianFind', lvl: 2, desc: 'Find the middle value.' }),
    G({ title: 'Mode Radar', cat: 'num', engine: 'input', gen: 'modeFind', lvl: 1, desc: 'Most frequent value.' }),
    G({ title: 'Range Rover', cat: 'num', engine: 'input', gen: 'rangeFind', lvl: 1, desc: 'Largest minus smallest.' }),
    G({ title: 'Dice Chances', cat: 'num', engine: 'quiz', gen: 'diceProb', lvl: 2, desc: 'Simple die probabilities.', goal: 8 }),
    G({ title: 'Coin Flip Chances', cat: 'num', engine: 'quiz', gen: 'coinProb', lvl: 3, desc: 'Two-coin probability.', goal: 8 }),
    G({ title: 'Venn Counter', cat: 'num', engine: 'input', gen: 'vennCount', lvl: 3, desc: 'Union of two sets.' }),
    G({ title: 'Logic AND Gate', cat: 'num', engine: 'tf', gen: 'logicAnd', lvl: 2, desc: 'Both must be true.', goal: 12 }),
    G({ title: 'Logic OR Gate', cat: 'num', engine: 'tf', gen: 'logicOr', lvl: 2, desc: 'Either will do.', goal: 12 }),
    G({ title: 'Squares Memory Match', cat: 'num', engine: 'memory', gen: 'squareRoot', lvl: 2, desc: 'Match squares to roots.', goal: 8 }),
    G({ title: 'Number Bond Builder', cat: 'num', engine: 'bond', gen: 'powerCalc', lvl: 2, desc: 'Pick two tiles that add to the target.', goal: 8 })
  ];

  window.MVCats = C;
  window.MVGames = games;
})();
