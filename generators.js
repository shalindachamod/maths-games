// Mathverse — question generators + answer checking
// Each generator returns a Question object:
//   { text, answer, extra, choices, layout }
//   text    : string or array of strings shown to the player
//   answer  : canonical answer (string or number)
//   choices : optional array of options for multiple choice questions
//   layout  : hints the engine on how to present the question

'use strict';

(function () {
  const R = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const pick = (arr) => arr[R(0, arr.length - 1)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = R(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  function numToWord(n) {
    const ones = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
      'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '');
    return String(n);
  }

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }
  function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }

  function makeChoices(correct, distractors, count = 4) {
    const set = new Set([String(correct)]);
    const pool = distractors.filter(d => d !== correct && !set.has(String(d)));
    while (set.size < count && pool.length) {
      const idx = R(0, pool.length - 1);
      set.add(String(pool.splice(idx, 1)[0]));
    }
    while (set.size < count) set.add(String(Number(correct) + set.size * R(1, 9)));
    const arr = shuffle(Array.from(set));
    return { choices: arr, answer: String(correct) };
  }

  const Gen = {};

  // ---------- Arithmetic ----------
  Gen.addition = (lvl) => {
    const max = [20, 100, 1000, 10000, 100000][Math.min(lvl, 4)];
    const a = R(2, max), b = R(2, max);
    return { text: `${a} + ${b}`, answer: String(a + b) };
  };
  Gen.subtraction = (lvl) => {
    const max = [20, 100, 1000, 10000, 100000][Math.min(lvl, 4)];
    const a = R(2, max), b = R(1, a);
    return { text: `${a} − ${b}`, answer: String(a - b) };
  };
  Gen.multiplication = (lvl) => {
    const [ma, mb] = [[12, 12], [20, 20], [99, 9], [250, 40], [999, 99]][Math.min(lvl, 4)];
    const a = R(2, ma), b = R(2, mb);
    return { text: `${a} × ${b}`, answer: String(a * b) };
  };
  Gen.division = (lvl) => {
    const [mb, mq] = [[12, 12], [12, 20], [9, 50], [40, 99], [99, 99]][Math.min(lvl, 4)];
    const b = R(2, mb), q = R(2, mq);
    return { text: `${b * q} ÷ ${b}`, answer: String(q) };
  };
  Gen.mixedOps = (lvl) => {
    const ops = lvl < 2 ? ['+', '−'] : lvl < 4 ? ['+', '−', '×'] : ['+', '−', '×', '÷'];
    const op = pick(ops);
    if (op === '+') { const a = R(2, 60), b = R(2, 60); return { text: `${a} + ${b}`, answer: String(a + b) }; }
    if (op === '−') { const a = R(10, 90), b = R(1, a); return { text: `${a} − ${b}`, answer: String(a - b) }; }
    if (op === '×') { const a = R(2, 12), b = R(2, 12); return { text: `${a} × ${b}`, answer: String(a * b) }; }
    const b = R(2, 12), q = R(2, 12); return { text: `${b * q} ÷ ${b}`, answer: String(q) };
  };
  Gen.missingNumber = (lvl) => {
    const op = pick(lvl < 3 ? ['+', '−'] : ['+', '−', '×']);
    if (op === '×') { const a = R(2, 12), b = R(2, 12); return { text: `${a} × ? = ${a * b}`, answer: String(b) }; }
    if (op === '−') { const a = R(10, 99), b = R(1, a); return { text: `${a} − ? = ${a - b}`, answer: String(b) }; }
    const a = R(10, 99), b = R(1, 50); return { text: `${a} + ? = ${a + b}`, answer: String(b) };
  };
  Gen.orderOfOps = (lvl) => {
    const n = lvl < 2 ? 3 : lvl < 4 ? 4 : 5;
    const parts = [R(2, 12)];
    for (let i = 1; i < n; i++) parts.push(R(2, 9));
    const ops = [];
    for (let i = 1; i < n; i++) ops.push(pick(['+', '×', '−']));
    let expr = String(parts[0]);
    for (let i = 0; i < ops.length; i++) expr += ` ${ops[i]} ${parts[i + 1]}`;
    const val = Function('"use strict";return (' + expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-') + ')')();
    return { text: expr, answer: String(val) };
  };
  Gen.estimation = () => {
    const a = R(21, 98), b = R(21, 98);
    return { text: `≈ ${a} + ${b}  (nearest ten)`, answer: String(Math.round((a + b) / 10) * 10) };
  };

  // ---------- Comparison ----------
  Gen.compare = (lvl) => {
    const max = [20, 100, 1000, 10000][Math.min(lvl, 3)];
    const a = R(1, max), b = R(1, max);
    return { text: [`${a}`, `${b}`], answer: a > b ? '>' : a < b ? '<' : '=', layout: 'pair' };
  };
  Gen.compareExpr = (lvl) => {
    const [a, b] = [R(2, 20), R(2, 20)];
    const [c, d] = [R(2, 20), R(2, 20)];
    const l = a + b * (lvl > 2 ? 3 : 1);
    const r = c + d * (lvl > 2 ? 3 : 1);
    return { text: [`${a} + ${b}${lvl > 2 ? ' × 3' : ''}`, `${c} + ${d}${lvl > 2 ? ' × 3' : ''}`], answer: l > r ? '>' : l < r ? '<' : '=', layout: 'pair' };
  };
  Gen.biggest = (lvl) => {
    const max = [50, 100, 1000, 10000][Math.min(lvl, 3)];
    const nums = Array.from({ length: 4 }, () => R(1, max));
    const best = Math.max(...nums);
    return { text: 'Which is biggest?', extra: nums.map(String), answer: String(best), layout: 'grid' };
  };
  Gen.smallest = (lvl) => {
    const max = [50, 100, 1000, 10000][Math.min(lvl, 3)];
    const nums = Array.from({ length: 4 }, () => R(2, max));
    const best = Math.min(...nums);
    return { text: 'Which is smallest?', extra: nums.map(String), answer: String(best), layout: 'grid' };
  };
  Gen.roundNumber = (lvl) => {
    const n = R(101, 9999);
    const place = lvl < 2 ? 10 : lvl < 4 ? 100 : 1000;
    return { text: `Round ${n} to nearest ${place}`, answer: String(Math.round(n / place) * place) };
  };

  // ---------- Sequences ----------
  function seqQuestion(kind, lvl) {
    let start = R(1, 12), step, arr = [];
    const len = 6;
    if (kind === 'arith') step = R(2, 9) * (Math.random() < 0.5 ? 1 : -1);
    else if (kind === 'geom') { step = pick([2, 3, 4]); if (Math.random() < 0.5) step = 1 / step; }
    else if (kind === 'square') step = null;
    else if (kind === 'triangular') step = null;
    let cur = start;
    if (kind === 'square') { for (let i = 0; i < len; i++) arr.push((start + i) ** 2); }
    else if (kind === 'triangular') { for (let i = 0; i < len; i++) arr.push(((start + i) * (start + i + 1)) / 2); }
    else {
      for (let i = 0; i < len; i++) { arr.push(Math.round(cur * 100) / 100); cur += step; }
    }
    const hidden = arr[arr.length - 1];
    const shown = arr.slice(0, -1);
    return {
      text: shown.map(String),
      answer: String(Number.isInteger(hidden) ? hidden : hidden.toFixed(2)),
      layout: 'sequence'
    };
  }
  Gen.sequenceArith = (lvl) => seqQuestion('arith', lvl);
  Gen.sequenceGeom = (lvl) => seqQuestion('geom', lvl);
  Gen.sequenceSquare = (lvl) => seqQuestion('square', lvl);
  Gen.sequenceTri = (lvl) => seqQuestion('triangular', lvl);

  Gen.oddOneOut = (lvl) => {
    const kind = pick(['even', 'odd', 'prime', 'square']);
    const right = kind === 'even' ? pick([3, 7, 9, 11, 13, 15]) : kind === 'odd' ? pick([4, 6, 8, 10, 12]) :
      kind === 'prime' ? pick([4, 6, 8, 9, 10, 12]) : pick([2, 3, 5, 6, 7, 8]);
    const others = [];
    for (let i = 0; i < 3; i++) {
      let n;
      do {
        if (kind === 'even') n = R(2, 30) * 2;
        else if (kind === 'odd') n = R(1, 15) * 2 + 1;
        else if (kind === 'prime') n = pick([2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
        else n = pick([1, 4, 9, 16, 25, 36, 49]);
      } while (n === right || others.includes(n));
      others.push(n);
    }
    return { text: 'Odd one out — which is NOT ' + kind + '?', extra: shuffle([right, ...others]).map(String), answer: String(right), layout: 'grid' };
  };

  // ---------- Fractions & decimals ----------
  Gen.fracSimplify = () => {
    const d = R(2, 12), k = R(2, 6);
    return { text: [`Simplify`, `${d * k}/${d}`], answer: String(k), layout: 'stacked' };
  };
  Gen.fracAdd = (lvl) => {
    const d = pick(lvl < 3 ? [2, 3, 4, 6] : [2, 3, 4, 5, 6, 8, 10]);
    const d2 = pick([d, d * 2, d * 3]);
    const n1 = R(1, d - 1), n2 = R(1, d2 - 1);
    const L = lcm(d, d2);
    const num = n1 * (L / d) + n2 * (L / d2);
    const g = gcd(num, L);
    const ans = `${num / g}/${L / g}`.replace(/\/1$/, '');
    return { text: [`${n1}/${d} + ${n2}/${d2}`, '= ?'], answer: ans, layout: 'stacked' };
  };
  Gen.fracDecimal = () => {
    const [d, n] = pick([[2, 1], [4, 1], [4, 3], [5, 1], [5, 2], [5, 3], [5, 4], [10, 1], [10, 3], [10, 7], [10, 9], [8, 1], [8, 3]]);
    return { text: `${n}/${d} as a decimal`, answer: String(Number((n / d).toFixed(3))) };
  };
  Gen.decimalFrac = () => {
    const map = { '0.5': '1/2', '0.25': '1/4', '0.75': '3/4', '0.2': '1/5', '0.4': '2/5', '0.6': '3/5', '0.8': '4/5', '0.1': '1/10', '0.3': '3/10', '0.7': '7/10' };
    const keys = Object.keys(map);
    const k = pick(keys);
    return { text: `${k} as a fraction`, answer: map[k] };
  };
  Gen.percentOf = (lvl) => {
    const p = pick(lvl < 2 ? [10, 50, 25] : lvl < 4 ? [10, 20, 25, 50, 75] : [5, 12.5, 15, 30, 35, 60, 85]);
    const n = pick(lvl < 3 ? [20, 40, 60, 80, 100, 200] : [24, 36, 48, 120, 240, 360, 450]);
    const v = (p / 100) * n;
    return { text: `${p}% of ${n}`, answer: String(Number(v.toFixed(2))) };
  };
  Gen.decimalOps = (lvl) => {
    const a = R(11, 99) / 10, b = R(11, 99) / 10;
    if (Math.random() < 0.5) return { text: `${a} + ${b}`, answer: String(Number((a + b).toFixed(2))) };
    const hi = Math.max(a, b), lo = Math.min(a, b);
    return { text: `${hi} − ${lo}`, answer: String(Number((hi - lo).toFixed(2))) };
  };

  // ---------- Algebra ----------
  Gen.linearEq = (lvl) => {
    const x = R(1, Math.min(12 + lvl * 3, 30));
    const a = R(2, Math.min(5 + lvl, 12));
    const b = R(1, Math.min(20 + lvl * 5, 60));
    if (Math.random() < 0.5) return { text: `${a}x = ${a * x}`, answer: String(x) };
    return { text: `${a}x + ${b} = ${a * x + b}`, answer: String(x) };
  };
  Gen.linearEqNeg = (lvl) => {
    const x = R(1, 12), a = R(2, 9), b = R(1, 30);
    const c = Math.random() < 0.5 ? -b : b;
    const rhs = a * x + c;
    return { text: `${a}x ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${rhs}`, answer: String(x) };
  };
  Gen.expandBrackets = () => {
    const a = R(2, 9), b = R(2, 9), c = R(1, 9);
    return { text: [`${a}(x + ${c})`, '= ax + ?'], answer: String(a * c) };
  };
  Gen.substitution = (lvl) => {
    const x = R(2, 10), y = R(2, 10);
    const forms = [
      { f: (x, y) => `${x} + ${y}`, v: (x, y) => x + y },
      { f: (x, y) => `${x} × ${y}`, v: (x, y) => x * y },
      { f: (x, y) => `2x + ${y}`, v: (x, y) => 2 * x + y },
      { f: (x, y) => `x² + y`, v: (x, y) => x * x + y },
      { f: (x, y) => `3x − y`, v: (x, y) => 3 * x - y }
    ];
    const t = pick(forms.slice(0, Math.min(2 + lvl, 5)));
    return { text: `x = ${x}, y = ${y} — find ${t.f(x, y)}`, answer: String(t.v(x, y)) };
  };
  Gen.quadraticRoots = () => {
    const r1 = R(-6, 6), r2 = R(-6, 6);
    const b = -(r1 + r2), c = r1 * r2;
    const fmt = (v, s) => v === 0 ? '' : ` ${s} ${Math.abs(v)}`;
    return { text: `Solve: x² ${b >= 0 ? '+' : '−'} ${Math.abs(b)}x ${c >= 0 ? '+' : '−'} ${Math.abs(c)} = 0`, answer: [`${Math.min(r1, r2)}, ${Math.max(r1, r2)}`, `${Math.max(r1, r2)}, ${Math.min(r1, r2)}`, `${Math.min(r1, r2)},${Math.max(r1, r2)}`, `${Math.max(r1, r2)},${Math.min(r1, r2)}`] };
  };
  // ---------- Geometry ----------
  Gen.areaRect = (lvl) => {
    const [a, b] = [R(2, 9 + lvl * 4), R(2, 9 + lvl * 4)];
    return { text: `Area of rectangle ${a} × ${b}`, answer: String(a * b) };
  };
  Gen.perimeterRect = (lvl) => {
    const [a, b] = [R(2, 20), R(2, 20)];
    return { text: `Perimeter of rectangle ${a} by ${b}`, answer: String(2 * (a + b)) };
  };
  Gen.areaTri = () => {
    const b = R(2, 12) * 2, h = R(2, 15);
    return { text: `Triangle: base ${b}, height ${h} — area?`, answer: String((b * h) / 2) };
  };
  Gen.circleCircum = (lvl) => {
    const r = R(1, 12);
    return { text: `Circumference of circle, r = ${r} (use 3.14)`, answer: String(Number((2 * 3.14 * r).toFixed(2))) };
  };
  Gen.circleArea = (lvl) => {
    const r = R(1, 10);
    return { text: `Area of circle, r = ${r} (use 3.14)`, answer: String(Number((3.14 * r * r).toFixed(2))) };
  };
  Gen.pythagoras = () => {
    const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [7, 24, 25]];
    const [a, b, c] = pick(triples);
    if (Math.random() < 0.5) return { text: `Legs ${a} & ${b} — hypotenuse?`, answer: String(c) };
    return { text: `Hypotenuse ${c}, leg ${a} — other leg?`, answer: String(b) };
  };
  Gen.anglesTriangle = () => {
    const a = R(30, 80), b = R(30, 80);
    return { text: `Triangle angles: ${a}°, ${b}° — third?`, answer: String(180 - a - b) };
  };
  Gen.anglesStraight = () => {
    const a = R(20, 160);
    return { text: `Angles on a line: ${a}° + ?`, answer: String(180 - a) };
  };
  Gen.volumeBox = (lvl) => {
    const [a, b, c] = [R(2, 8 + lvl * 2), R(2, 8), R(2, 6)];
    return { text: `Volume ${a} × ${b} × ${c}`, answer: String(a * b * c) };
  };
  Gen.unitConvert = (lvl) => {
    const convs = [
      { q: (n) => `${n} m = ? cm`, a: (n) => n * 100 },
      { q: (n) => `${n} kg = ? g`, a: (n) => n * 1000 },
      { q: (n) => `${n} L = ? mL`, a: (n) => n * 1000 },
      { q: (n) => `${n * 100} cm = ? m`, a: () => n },
      { q: (n) => `${n} km = ? m`, a: (n) => n * 1000 }
    ];
    const c = pick(convs), n = R(1, 9);
    return { text: c.q(n), answer: String(c.a(n)) };
  };

  // ---------- Time & money ----------
  Gen.timeAdd = (lvl) => {
    const h = R(1, 11), m = R(5, 55);
    const addH = R(1, 3), addM = pick([15, 20, 30, 40, 45, 50]);
    let H = h + addH, M = m + addM;
    if (M >= 60) { M -= 60; H += 1; }
    return { text: `${h}:${String(m).padStart(2, '0')} + ${addH}h ${addM}m = ?`, answer: `${H}:${String(M).padStart(2, '0')}` };
  };
  Gen.timeDiff = () => {
    const h1 = R(8, 18), m1 = pick([0, 10, 15, 30, 45]);
    const h2 = h1 + R(1, Math.min(5, 23 - h1)), m2 = pick([0, 10, 15, 30, 45]);
    let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    return { text: `${h1}:${String(m1).padStart(2, '0')} → ${h2}:${String(m2).padStart(2, '0')} — how many minutes?`, answer: String(mins) };
  };
  Gen.moneyChange = (lvl) => {
    const paid = pick([5, 10, 20, 50]);
    const price = R(1, paid - 1) + (Math.random() < 0.5 ? 0.5 : 0);
    const change = Number((paid - price).toFixed(2));
    return { text: `Item £${price.toFixed(2)}, paid £${paid}. Change?`, answer: String(change) };
  };
  Gen.moneyTotal = () => {
    const a = R(1, 20) + pick([0, 0.5, 0.25, 0.75]);
    const b = R(1, 20) + pick([0, 0.5, 0.25, 0.75]);
    return { text: `£${a.toFixed(2)} + £${b.toFixed(2)}`, answer: String(Number((a + b).toFixed(2))) };
  };

  // --- true/false claim variants (for the tf engine) ---
  Gen.timeDiffTF = () => {
    const h1 = R(8, 18), m1 = pick([0, 10, 15, 30, 45]);
    const h2 = h1 + R(1, Math.min(5, 23 - h1)), m2 = pick([0, 10, 15, 30, 45]);
    const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    const offs = [-15, -10, -5, 5, 10, 15].filter((o) => mins + o > 0);
    const shown = (Math.random() < 0.5 || !offs.length) ? mins : mins + pick(offs);
    return { text: `${h1}:${String(m1).padStart(2, '0')} → ${h2}:${String(m2).padStart(2, '0')} takes ${shown} minutes`, answer: shown === mins ? 'true' : 'false', layout: 'yn' };
  };
  Gen.moneyChangeTF = () => {
    const paid = pick([5, 10, 20, 50]);
    const price = R(1, paid - 1) + (Math.random() < 0.5 ? 0.5 : 0);
    const change = Number((paid - price).toFixed(2));
    const wrongs = [0.5, 1, 2, 5].map((d) => Number((change + d).toFixed(2)))
      .concat([0.5, 1, 2, 5].filter((d) => change - d > 0).map((d) => Number((change - d).toFixed(2))));
    const shown = Math.random() < 0.5 ? change : pick(wrongs);
    return { text: `Item £${price.toFixed(2)}, paid £${paid} — change £${shown.toFixed(2)}`, answer: shown === change ? 'true' : 'false', layout: 'yn' };
  };
  Gen.wordAgeTF = () => {
    const kid = R(6, 14), diff = R(15, 40), yr = R(2, 10);
    const ans = kid + diff + yr;
    const shown = Math.random() < 0.5 ? ans : ans + pick([-5, -3, -1, 1, 3, 5]);
    return { text: `Amy is ${kid}. Her dad is ${diff} years older. In ${yr} years, dad will be ${shown}`, answer: shown === ans ? 'true' : 'false', layout: 'yn' };
  };

  // --- helpers for sort / compare games ---
  Gen.randNum = (lvl) => {
    const max = [50, 100, 1000, 10000, 100000][Math.min(lvl, 4)];
    return { text: 'Sort these numbers', answer: String(R(1, max)) };
  };
  Gen.compareDec = (lvl) => {
    const div = lvl < 2 ? 10 : 100;
    const a = R(1, 9 * div - 1) / div, b = R(1, 9 * div - 1) / div;
    return { text: [String(a), String(b)], answer: a > b ? '>' : a < b ? '<' : '=', layout: 'pair' };
  };

  // ---------- Word problems ----------
  Gen.wordShare = (lvl) => {
    const n = pick([2, 3, 4, 5, 6]), per = R(3, 12 + lvl * 3);
    return { text: `${n * per} sweets shared equally between ${n} children. Each gets?`, answer: String(per) };
  };
  Gen.wordSpeed = (lvl) => {
    const v = pick([30, 40, 50, 60, 70, 80]), t = pick([2, 3, 4, 5]);
    return { text: `Car travels ${v} km/h for ${t} h. Distance?`, answer: String(v * t) };
  };
  Gen.wordAge = () => {
    const kid = R(6, 14), diff = R(15, 40);
    const yr = R(2, 10);
    return { text: `Amy is ${kid}. Her dad is ${diff} years older. In ${yr} years, dad will be?`, answer: String(kid + diff + yr) };
  };
  Gen.wordBuy = (lvl) => {
    const p = R(2, 15), q = R(3, 12);
    return { text: `One pen costs ${p}p. ${q} pens cost?`, answer: String(p * q) };
  };
  Gen.wordRatio = (lvl) => {
    const parts = R(2, 5), unit = R(3, 12);
    const a = parts, b = parts + R(1, 3);
    return { text: `Ratio ${a}:${b}, total ${a + b} × ${unit} — larger share?`, answer: String(b * unit) };
  };

  // ---------- Number properties ----------
  Gen.primeCheck = () => {
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
    const p = pick(primes), c = pick([4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 25, 26, 27, 28]);
    const n = Math.random() < 0.5 ? p : c;
    return { text: `Is ${n} prime?`, answer: isPrime(n) ? 'yes' : 'no', layout: 'yn' };
  };
  function isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
    return true;
  }
  Gen.factorFind = (lvl) => {
    const n = R(12, Math.min(60 + lvl * 20, 144));
    const facs = [];
    for (let i = 1; i <= n; i++) if (n % i === 0) facs.push(i);
    if (Math.random() < 0.5) return { text: `Is ${pick(facs)} a factor of ${n}?`, answer: 'yes', layout: 'yn' };
    let f;
    do { f = R(2, n - 1); } while (n % f === 0);
    return { text: `Is ${f} a factor of ${n}?`, answer: 'no', layout: 'yn' };
  };
  Gen.multipleFind = (lvl) => {
    const k = R(3, 9), m = k * R(2, Math.min(6 + lvl * 2, 12));
    const fake = m + pick([1, -1, 2, -2]);
    const n = Math.random() < 0.5 ? m : fake;
    const mult = (x) => x % k === 0;
    return { text: `Is ${n} a multiple of ${k}?`, answer: mult(n) ? 'yes' : 'no', layout: 'yn' };
  };
  Gen.gcdFind = (lvl) => {
    const a = R(12, 99), b = R(12, 99);
    return { text: `GCD / HCF of ${a} and ${b}`, answer: String(gcd(a, b)) };
  };
  Gen.lcmFind = (lvl) => {
    const a = R(2, 12), b = R(2, 12);
    return { text: `LCM of ${a} and ${b}`, answer: String(lcm(a, b)) };
  };
  Gen.evenOdd = () => {
    const n = R(1, 999);
    return { text: `${n} — even or odd?`, answer: n % 2 === 0 ? 'even' : 'odd' };
  };
  Gen.squareRoot = (lvl) => {
    const s = R(2, Math.min(10 + lvl * 4, 25));
    return { text: `√${s * s}`, answer: String(s) };
  };
  Gen.cubeRoot = () => {
    const s = R(2, 10);
    return { text: `³√${s ** 3}`, answer: String(s) };
  };
  Gen.powerCalc = (lvl) => {
    const base = R(2, Math.min(6 + lvl, 12)), exp = lvl < 3 ? 2 : pick([2, 3]);
    return { text: `${base}^${exp}`, answer: String(base ** exp) };
  };
  Gen.negativeOps = (lvl) => {
    const a = -R(1, 15), b = R(1, 15);
    if (Math.random() < 0.5) return { text: `${a} + ${b}`, answer: String(a + b) };
    return { text: `${a} − ${b}`, answer: String(a - b) };
  };
  Gen.placeValue = (lvl) => {
    const n = R(100, 9999);
    const s = String(n);
    const idx = R(0, s.length - 1);
    const names = { 0: 'units', 1: 'tens', 2: 'hundreds', 3: 'thousands' };
    const placeName = names[s.length - 1 - idx];
    return { text: `In ${n}, what is the digit in the ${placeName} place?`, answer: s[idx] };
  };

  // ---------- Data & logic ----------
  Gen.meanFind = (lvl) => {
    const n = lvl < 3 ? 3 : pick([4, 5]);
    const nums = Array.from({ length: n }, () => R(1, 20));
    const sum = nums.reduce((a, b) => a + b, 0);
    if (sum % n !== 0) nums[0] += (n - (sum % n));
    const mean = nums.reduce((a, b) => a + b, 0) / n;
    return { text: `Mean of ${nums.join(', ')}`, answer: String(mean) };
  };
  Gen.medianFind = (lvl) => {
    const n = lvl < 3 ? 3 : 5;
    const nums = shuffle(Array.from({ length: n }, () => R(1, 30)));
    nums.sort((a, b) => a - b);
    const med = nums[(n - 1) / 2];
    return { text: `Median of ${nums.join(', ')}`, answer: String(med) };
  };
  Gen.modeFind = () => {
    const mode = R(1, 10);
    const nums = shuffle([mode, mode, mode, R(1, 10), R(1, 10)]);
    return { text: `Mode of ${nums.join(', ')}`, answer: String(mode) };
  };
  Gen.rangeFind = (lvl) => {
    const nums = Array.from({ length: pick([4, 5]) }, () => R(1, 50));
    return { text: `Range of ${nums.join(', ')}`, answer: String(Math.max(...nums) - Math.min(...nums)) };
  };
  Gen.diceProb = () => {
    const target = R(1, 6);
    return { text: `P(rolling ${target} on a fair die) as a fraction`, answer: '1/6' };
  };
  Gen.coinProb = () => {
    return { text: 'P(two heads with 2 fair coins) as a fraction', answer: '1/4' };
  };
  Gen.vennCount = () => {
    const a = R(3, 12), b = R(3, 12), both = R(1, Math.min(a, b) - 1);
    const only = a + b - both;
    return { text: `Set A: ${a} items, set B: ${b} items, ${both} in both. Total distinct?`, answer: String(only) };
  };
  Gen.logicAnd = () => {
    const a = Math.random() < 0.5, b = Math.random() < 0.7;
    const res = a && b;
    return { text: `True or false: ${a ? '5 > 3' : '5 < 3'} AND ${b ? '2 + 2 = 4' : '2 + 2 = 5'}`, answer: res ? 'true' : 'false', layout: 'yn' };
  };
  Gen.logicOr = () => {
    const a = Math.random() < 0.3, b = Math.random() < 0.3;
    const res = a || b;
    return { text: `True or false: ${a ? '7 > 2' : '7 < 2'} OR ${b ? '10 = 10' : '10 ≠ 10'}`, answer: res ? 'true' : 'false', layout: 'yn' };
  };

  // ---------- Answer checking ----------
  function normAns(s) {
    return String(s).trim().toLowerCase().replace(/−/g, '-').replace(/\s+/g, '');
  }
  function checkNumeric(q, input) {
    const a = normAns(input);
    const exp = normAns(q.answer);
    if (a === exp) return true;
    const na = Number(a.replace(/[£$%]/g, ''));
    const ne = Number(exp.replace(/[£$%]/g, ''));
    if (!Number.isNaN(na) && !Number.isNaN(ne) && Math.abs(na - ne) < 1e-9) return true;
    // fraction equivalence (fraction↔fraction and fraction↔decimal)
    const fracVal = (s) => {
      const m = s.match(/^(-?\d+)\/(\d+)$/);
      return m ? Number(m[1]) / Number(m[2]) : null;
    };
    const fv = fracVal(a), fev = fracVal(exp);
    if (fv != null && fev != null && Math.abs(fv - fev) < 1e-9) return true;
    if (fv != null && !Number.isNaN(ne) && Math.abs(fv - ne) < 1e-9) return true;
    if (fev != null && !Number.isNaN(na) && Math.abs(fev - na) < 1e-9) return true;
    return false;
  }
  function checkExact(q, input) {
    return normAns(input) === normAns(q.answer);
  }
  function checkAny(q, input) {
    const answers = Array.isArray(q.answer) ? q.answer : [q.answer];
    return answers.some((ans) => checkNumeric({ ...q, answer: ans }, input));
  }

  Gen.check = checkNumeric;
  Gen.checkExact = checkExact;
  Gen.checkAny = checkAny;
  Gen.makeChoices = makeChoices;
  Gen.shuffle = shuffle;
  Gen.pick = pick;
  Gen.R = R;
  Gen.gcd = gcd;
  Gen.lcm = lcm;
  Gen.numToWord = numToWord;
  Gen.isPrime = isPrime;

  window.MVGen = Gen;
})();
