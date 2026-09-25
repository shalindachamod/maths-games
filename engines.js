// Mathverse — game engines
// Contract: MVEngines.start(game, host, callbacks)
//   callbacks: { onAnswer(correct, given), onQuestionStart(), onQuestionEnd(), onEnd(summary) }
//   summary: { correct, total, timeTaken, quit }
// Engines own the question loop and per-question timing; the app owns scoring.
'use strict';

(function () {
  function genFn(game) {
    const f = window.MVGen[game.gen];
    return typeof f === 'function' ? f : window.MVGen.mixedOps;
  }

  function fmtTime(s) {
    s = Math.max(0, Math.ceil(s));
    const m = Math.floor(s / 60);
    return m + ':' + String(s % 60).padStart(2, '0');
  }

  function el(tag, cls, txt) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  const E = {};

  // ---------- shared session state ----------
  function newState(game) {
    return {
      game,
      goal: game.goal || 10,
      asked: 0,
      correct: 0,
      startTime: Date.now(),
      done: false,
      timer: null,
      timeLeft: 0,
      detachKeys: []
    };
  }

  function summary(state, quit) {
    return {
      correct: state.correct,
      total: state.asked,
      timeTaken: Math.round((Date.now() - state.startTime) / 1000),
      quit: !!quit
    };
  }

  function finish(state, cb, quit) {
    if (state.done) return;
    state.done = true;
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    state.detachKeys.forEach((d) => d());
    state.detachKeys = [];
    cb.onEnd(summary(state, quit));
  }

  function startCountdown(state, cb, onTick, onExpire) {
    if (!state.game.time) return;
    let left = state.game.time;
    state.timeLeft = left;
    onTick(left);
    state.timer = setInterval(() => {
      left -= 1;
      state.timeLeft = left;
      onTick(left);
      if (left <= 0) { onExpire(); }
    }, 1000);
  }

  function stopCountdown(state) {
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
  }

  // Register an Enter-key handler tied to this session's cleanup list.
  function regKey(state, host, fn) {
    const handler = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); fn(); }
    };
    host.addEventListener('keydown', handler);
    state.detachKeys.push(() => host.removeEventListener('keydown', handler));
  }

  // Build a question header (progress + timer live in app.js chrome)
  function qText(host, q, cls) {
    const wrap = el('div', 'q-wrap' + (cls ? ' ' + cls : ''));
    const texts = Array.isArray(q.text) ? q.text : [q.text];
    texts.forEach((t) => wrap.appendChild(el('div', 'q-line', String(t))));
    host.appendChild(wrap);
    return wrap;
  }

  function distractorsFor(q, lvl) {
    const ans = String(q.answer);
    // Fraction answers → nearby fraction variants
    const fm = ans.match(/^(-?\d+)\/(\d+)$/);
    if (fm) {
      const n = Number(fm[1]), d = Number(fm[2]);
      const out = [
        (n + 1) + '/' + d, (n - 1) + '/' + d, n + '/' + (d + 1), n + '/' + (d - 1),
        (n * 2) + '/' + (d * 2), (n + 2) + '/' + d, n + '/' + (d * 2)
      ];
      return out;
    }
    const num = Number(ans);
    const out = [];
    if (!Number.isNaN(num)) {
      if (ans.indexOf('.') !== -1) {
        const r2 = (x) => String(Number(x.toFixed(2)));
        out.push(r2(num + 0.1), r2(num - 0.1), r2(num + 0.2), r2(num - 0.2), r2(num + 0.5), r2(num - 0.5), String(num + 1));
      } else {
        out.push(num + 1, num - 1, num + 10, num - 10, num + 2, num - 2, num + 5, num - 5);
      }
    } else {
      out.push('none', 'all', 'maybe', 'always');
    }
    return out.map(String);
  }

  function flashThen(host, ok, q, next) {
    const badge = el('div', 'flash ' + (ok ? 'flash-ok' : 'flash-no'), ok ? '✔' : '✘');
    if (!ok) badge.appendChild(el('span', 'flash-ans', '  ' + String(q.answer)));
    host.appendChild(badge);
    setTimeout(() => {
      badge.remove();
      next();
    }, ok ? 350 : 850);
  }

  // ============================================================
  // Engine: quiz (multiple choice)
  // ============================================================
  E.quiz = function (game, host, cb) {
    const state = newState(game);
    const Gen = window.MVGen;

    function ask() {
      if (state.done) return;
      if (state.asked >= state.goal) return finish(state, cb, false);
      state.asked += 1;
      cb.onQuestionStart();
      host.innerHTML = '';
      const q = genFn(game)(game.lvl);
      let choices;
      if (q.layout === 'grid' && Array.isArray(q.extra)) {
        choices = Gen.shuffle(q.extra);
      } else {
        const ans0 = Array.isArray(q.answer) ? q.answer[0] : q.answer;
        choices = Gen.makeChoices(ans0, distractorsFor(Object.assign({}, q, { answer: ans0 }), game.lvl), 4).choices;
      }
      qText(host, q, q.layout === 'grid' ? 'q-grid-label' : '');
      const grid = el('div', 'choices' + (q.layout === 'grid' ? ' choices-grid' : ''));
      choices.forEach((c) => {
        const b = el('button', 'choice', String(c));
        b.addEventListener('click', () => answer(c, b));
        grid.appendChild(b);
      });
      host.appendChild(grid);
      state.current = q;
    }

    function answer(given, btn) {
      if (state.done || !state.current) return;
      const q = state.current;
      const ok = Gen.checkAny(q, given);
      if (ok) state.correct += 1;
      if (btn) btn.classList.add(ok ? 'is-right' : 'is-wrong');
      cb.onAnswer(ok, String(given));
      cb.onQuestionEnd();
      state.current = null;
      flashThen(host, ok, q, () => ask());
    }

    startCountdown(state, cb, (left) => { state.onTick && state.onTick(left); }, () => finish(state, cb, false));
    ask();
    return state;
  };

  // ============================================================
  // Engine: input (typed answers)
  // ============================================================
  E.input = function (game, host, cb) {
    const state = newState(game);
    const Gen = window.MVGen;

    function ask() {
      if (state.done) return;
      if (state.asked >= state.goal) return finish(state, cb, false);
      state.asked += 1;
      cb.onQuestionStart();
      host.innerHTML = '';
      const q = genFn(game)(game.lvl);
      qText(host, q);
      const row = el('div', 'input-row');
      const inp = el('input', 'answer-input');
      inp.type = 'text';
      inp.autocomplete = 'off';
      inp.setAttribute('inputmode', 'text');
      inp.placeholder = 'Your answer…';
      const btn = el('button', 'choice submit-btn', 'Go');
      btn.addEventListener('click', () => answer(inp.value));
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); answer(inp.value); }
      });
      row.appendChild(inp); row.appendChild(btn);
      host.appendChild(row);
      setTimeout(() => inp.focus(), 30);
      state.current = q;
    }

    function answer(given) {
      if (state.done || !state.current) return;
      const q = state.current;
      if (String(given).trim() === '') return;
      const ok = Gen.checkAny(q, given);
      if (ok) state.correct += 1;
      cb.onAnswer(ok, String(given));
      cb.onQuestionEnd();
      state.current = null;
      flashThen(host, ok, q, () => ask());
    }

    startCountdown(state, cb, (left) => { state.onTick && state.onTick(left); }, () => finish(state, cb, false));
    ask();
    return state;
  };

  // ============================================================
  // Engine: tf (true / false buttons)
  // ============================================================
  E.tf = function (game, host, cb) {
    const state = newState(game);
    const Gen = window.MVGen;

    function ask() {
      if (state.done) return;
      if (state.asked >= state.goal) return finish(state, cb, false);
      state.asked += 1;
      cb.onQuestionStart();
      host.innerHTML = '';
      const q = genFn(game)(game.lvl);
      qText(host, q);
      const ans0 = String(q.answer).toLowerCase();
      const yn = ans0 === 'yes' || ans0 === 'no';
      const vals = yn ? ['yes', 'no'] : ['true', 'false'];
      const row = el('div', 'choices tf-row');
      vals.forEach((v) => {
        const b = el('button', 'choice tf-' + (v === 'yes' || v === 'true' ? 'true' : 'false'), v.toUpperCase());
        b.addEventListener('click', () => answer(v, b));
        row.appendChild(b);
      });
      host.appendChild(row);
      state.current = q;
    }

    function answer(given, btn) {
      if (state.done || !state.current) return;
      const q = state.current;
      const ok = Gen.checkExact(q, given);
      if (ok) state.correct += 1;
      if (btn) btn.classList.add(ok ? 'is-right' : 'is-wrong');
      cb.onAnswer(ok, String(given));
      cb.onQuestionEnd();
      state.current = null;
      flashThen(host, ok, q, () => ask());
    }

    startCountdown(state, cb, (left) => { state.onTick && state.onTick(left); }, () => finish(state, cb, false));
    ask();
    return state;
  };

  // ============================================================
  // Engine: compare (>, < or =)
  // ============================================================
  E.compare = function (game, host, cb) {
    const state = newState(game);
    const Gen = window.MVGen;

    function ask() {
      if (state.done) return;
      if (state.asked >= state.goal) return finish(state, cb, false);
      state.asked += 1;
      cb.onQuestionStart();
      host.innerHTML = '';
      const q = genFn(game)(game.lvl);
      const pair = el('div', 'pair');
      const texts = Array.isArray(q.text) ? q.text : [String(q.text), 'vs'];
      pair.appendChild(el('div', 'pair-side', texts[0]));
      pair.appendChild(el('div', 'pair-mid', '?'));
      pair.appendChild(el('div', 'pair-side', texts[1] != null ? texts[1] : ''));
      host.appendChild(pair);
      const row = el('div', 'choices cmp-row');
      [['>', 'cmp-gt'], ['<', 'cmp-lt'], ['=', 'cmp-eq']].forEach(([v, cls]) => {
        const b = el('button', 'choice ' + cls, v);
        b.addEventListener('click', () => answer(v, b));
        row.appendChild(b);
      });
      host.appendChild(row);
      state.current = q;
    }

    function answer(given, btn) {
      if (state.done || !state.current) return;
      const q = state.current;
      const ok = Gen.checkExact(q, given);
      if (ok) state.correct += 1;
      if (btn) btn.classList.add(ok ? 'is-right' : 'is-wrong');
      cb.onAnswer(ok, String(given));
      cb.onQuestionEnd();
      state.current = null;
      flashThen(host, ok, q, () => ask());
    }

    startCountdown(state, cb, (left) => { state.onTick && state.onTick(left); }, () => finish(state, cb, false));
    ask();
    return state;
  };

  // ============================================================
  // Engine: sequence (fill in the next number)
  // ============================================================
  E.sequence = function (game, host, cb) {
    const state = newState(game);
    const Gen = window.MVGen;

    function ask() {
      if (state.done) return;
      if (state.asked >= state.goal) return finish(state, cb, false);
      state.asked += 1;
      cb.onQuestionStart();
      host.innerHTML = '';
      const q = genFn(game)(game.lvl);
      const shown = Array.isArray(q.text) ? q.text : String(q.text).split(/\s+/);
      const seq = el('div', 'seq-row');
      shown.forEach((t) => seq.appendChild(el('div', 'seq-tile', String(t))));
      seq.appendChild(el('div', 'seq-tile seq-blank', '?'));
      host.appendChild(seq);
      const row = el('div', 'input-row');
      const inp = el('input', 'answer-input');
      inp.type = 'text';
      inp.autocomplete = 'off';
      inp.placeholder = 'Next number…';
      const btn = el('button', 'choice submit-btn', 'Go');
      btn.addEventListener('click', () => answer(inp.value));
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); answer(inp.value); }
      });
      row.appendChild(inp); row.appendChild(btn);
      host.appendChild(row);
      setTimeout(() => inp.focus(), 30);
      state.current = q;
    }

    function answer(given) {
      if (state.done || !state.current) return;
      const q = state.current;
      if (String(given).trim() === '') return;
      const ok = Gen.checkAny(q, given);
      if (ok) state.correct += 1;
      cb.onAnswer(ok, String(given));
      cb.onQuestionEnd();
      state.current = null;
      flashThen(host, ok, q, () => ask());
    }

    startCountdown(state, cb, (left) => { state.onTick && state.onTick(left); }, () => finish(state, cb, false));
    ask();
    return state;
  };

  // ============================================================
  // Engine: memory (match pairs: expression ↔ value)
  // ============================================================
  // Each round: build `goal/2 + 2` pairs, shuffle into a grid of face-down
  // cards; each match reveals an expression and its value. The session ends
  // when all pairs are matched or the timer runs out.
  E.memory = function (game, host, cb) {
    const state = newState(game);
    const Gen = window.MVGen;

    function buildPairs() {
      const pairs = [];
      const seen = new Set();
      let guard = 0;
      while (pairs.length < 6 && guard < 200) {
        guard += 1;
        const q = genFn(game)(game.lvl);
        const key = String(q.answer);
        if (seen.has(key)) continue;
        seen.add(key);
        pairs.push({ prompt: Array.isArray(q.text) ? q.text.join(' ') : String(q.text), value: String(q.answer) });
      }
      // pad if generator produced duplicates
      while (pairs.length < 4) {
        const q = genFn(game)(game.lvl);
        pairs.push({ prompt: Array.isArray(q.text) ? q.text.join(' ') : String(q.text), value: String(q.answer) });
      }
      return pairs;
    }

    function ask() {
      if (state.done) return;
      cb.onQuestionStart();
      host.innerHTML = '';
      const pairs = buildPairs();
      const cards = [];
      pairs.forEach((p, i) => {
        cards.push({ id: i, label: p.prompt, pair: p });
        cards.push({ id: i, label: p.value, pair: p });
      });
      Gen.shuffle(cards);
      const grid = el('div', 'mem-grid');
      let first = null;
      let lock = false;
      let matched = 0;
      const info = el('div', 'mem-info', 'Find the matching pairs');
      host.appendChild(info);
      host.appendChild(grid);

      cards.forEach((card) => {
        const b = el('button', 'mem-card');
        b.dataset.pair = card.id;
        b.appendChild(el('span', 'mem-face mem-back', '?'));
        b.appendChild(el('span', 'mem-face mem-front', card.label));
        b.addEventListener('click', () => {
          if (lock || state.done || b.classList.contains('is-open') || b.classList.contains('is-matched')) return;
          b.classList.add('is-open');
          if (!first) { first = { card, btn: b }; return; }
          // second card
          const a = first;
          first = null;
          if (a.card.id === card.id) {
            matched += 1;
            state.correct += 1;
            state.asked += 1;
            a.btn.classList.add('is-matched');
            b.classList.add('is-matched');
            cb.onAnswer(true, card.label);
            info.textContent = 'Matched ' + matched + ' / ' + pairs.length;
            if (matched >= pairs.length) {
              setTimeout(() => finish(state, cb, false), 500);
            }
          } else {
            lock = true;
            state.asked += 1;
            cb.onAnswer(false, card.label);
            setTimeout(() => {
              a.btn.classList.remove('is-open');
              b.classList.remove('is-open');
              lock = false;
            }, 750);
          }
        });
        grid.appendChild(b);
      });
    }

    startCountdown(state, cb, (left) => { state.onTick && state.onTick(left); }, () => finish(state, cb, false));
    ask();
    return state;
  };

  // ============================================================
  // Engine: shoot (bubble shooter — click the bubble holding the answer)
  // ============================================================
  E.shoot = function (game, host, cb) {
    const state = newState(game);
    const Gen = window.MVGen;

    function ask() {
      if (state.done) return;
      if (state.asked >= state.goal) return finish(state, cb, false);
      state.asked += 1;
      cb.onQuestionStart();
      host.innerHTML = '';
      const q = genFn(game)(game.lvl);
      qText(host, q);
      const field = el('div', 'bubble-field');
      const nBubbles = 6;
      let choices;
      if (String(q.answer) === 'yes' || String(q.answer) === 'no') {
        choices = ['yes', 'no'];
      } else if (q.layout === 'grid' && Array.isArray(q.extra)) {
        choices = Gen.shuffle(q.extra);
      } else {
        const ans0 = Array.isArray(q.answer) ? q.answer[0] : q.answer;
        choices = Gen.makeChoices(ans0, distractorsFor(Object.assign({}, q, { answer: ans0 }), game.lvl), nBubbles).choices;
      }
      choices.forEach((c) => {
        const b = el('button', 'bubble', String(c));
        // random position within the field
        b.style.left = (5 + Math.random() * 80) + '%';
        b.style.top = (5 + Math.random() * 75) + '%';
        b.style.setProperty('--dur', (9 + Math.random() * 7).toFixed(1) + 's');
        b.style.setProperty('--delay', (Math.random() * 2).toFixed(1) + 's');
        b.addEventListener('click', () => answer(c, b));
        field.appendChild(b);
      });
      host.appendChild(field);
      state.current = q;
    }

    function answer(given, btn) {
      if (state.done || !state.current) return;
      const q = state.current;
      const ok = Gen.checkAny(q, given);
      if (ok) {
        state.correct += 1;
        if (btn) btn.classList.add('bubble-pop');
      }
      cb.onAnswer(ok, String(given));
      cb.onQuestionEnd();
      state.current = null;
      if (ok) {
        setTimeout(() => ask(), 300);
      } else {
        flashThen(host, false, q, () => ask());
      }
    }

    startCountdown(state, cb, (left) => { state.onTick && state.onTick(left); }, () => finish(state, cb, false));
    ask();
    return state;
  };

  // ============================================================
  // Engine: bond (number bonds — pick the two tiles that sum to the target)
  // ============================================================
  E.bond = function (game, host, cb) {
    const state = newState(game);
    const Gen = window.MVGen;
    const R = Gen.R;

    function ask() {
      if (state.done) return;
      if (state.asked >= state.goal) return finish(state, cb, false);
      state.asked += 1;
      cb.onQuestionStart();
      host.innerHTML = '';
      // Build a target and 6 tiles containing exactly one pair that sums to it.
      const target = R(10, 20 + game.lvl * 10);
      const a = R(1, target - 1);
      const b = target - a;
      const tiles = [a, b];
      let guard = 0;
      while (tiles.length < 6 && guard < 400) {
        guard += 1;
        const v = R(1, target - 1);
        // reject any value that would create a second valid pair
        let ok = true;
        for (let i = 0; i < tiles.length; i++) {
          for (let j = i + 1; j < tiles.length; j++) {
            if (tiles[i] + tiles[j] === target) ok = false;
          }
        }
        if (tiles.indexOf(v) !== -1) continue;
        for (let i = 0; i < tiles.length; i++) if (tiles[i] + v === target) ok = false;
        if (ok) tiles.push(v);
      }
      const shuffled = Gen.shuffle(tiles);
      const targetBox = el('div', 'bond-target');
      targetBox.appendChild(el('span', 'bond-label', 'Pick two tiles that add up to'));
      targetBox.appendChild(el('span', 'bond-value', String(target)));
      host.appendChild(targetBox);
      const row = el('div', 'bond-row');
      let picked = null;
      let solved = false;
      shuffled.forEach((v) => {
        const t = el('button', 'bond-tile', String(v));
        t.addEventListener('click', () => {
          if (state.done || solved || t.classList.contains('is-picked')) return;
          t.classList.add('is-picked');
          if (!picked) { picked = t; return; }
          const p = picked;
          picked = null;
          const sum = Number(p.textContent) + Number(t.textContent);
          const good = sum === target;
          if (good) {
            solved = true;
            state.correct += 1;
            cb.onAnswer(true, p.textContent + '+' + t.textContent);
            cb.onQuestionEnd();
            p.classList.add('is-right'); t.classList.add('is-right');
            setTimeout(() => ask(), 550);
          } else {
            cb.onAnswer(false, p.textContent + '+' + t.textContent);
            cb.onQuestionEnd();
            p.classList.add('is-wrong'); t.classList.add('is-wrong');
            setTimeout(() => {
              p.classList.remove('is-picked', 'is-wrong');
              t.classList.remove('is-picked', 'is-wrong');
            }, 600);
          }
        });
        row.appendChild(t);
      });
      host.appendChild(row);
    }

    startCountdown(state, cb, (left) => { state.onTick && state.onTick(left); }, () => finish(state, cb, false));
    ask();
    return state;
  };

  // ============================================================
  // Engine: sort (arrange tiles in ascending order by clicking them in order)
  // ============================================================
  E.sort = function (game, host, cb) {
    const state = newState(game);
    const Gen = window.MVGen;

    function ask() {
      if (state.done) return;
      if (state.asked >= state.goal) return finish(state, cb, false);
      state.asked += 1;
      cb.onQuestionStart();
      host.innerHTML = '';
      // collect 4 distinct numeric-ish values
      const vals = [];
      const seen = new Set();
      let guard = 0;
      while (vals.length < 4 && guard < 300) {
        guard += 1;
        const q = genFn(game)(game.lvl);
        const v = String(q.answer);
        if (seen.has(v)) continue;
        // numeric sort only makes sense for numbers or same-format strings
        seen.add(v);
        vals.push(v);
      }
      const info = el('div', 'sort-info', 'Click the values from SMALLEST to LARGEST');
      host.appendChild(info);
      const row = el('div', 'sort-row');
      const shuffled = Gen.shuffle(vals);
      const sorted = vals.slice().sort((x, y) => {
        const nx = Number(x), ny = Number(y);
        if (!Number.isNaN(nx) && !Number.isNaN(ny)) return nx - ny;
        return x < y ? -1 : x > y ? 1 : 0;
      });
      let idx = 0;
      shuffled.forEach((v) => {
        const b = el('button', 'sort-tile', v);
        b.addEventListener('click', () => {
          if (state.done || b.classList.contains('is-done')) return;
          if (v === sorted[idx]) {
            idx += 1;
            b.classList.add('is-done');
            if (idx >= sorted.length) {
              state.correct += 1;
              cb.onAnswer(true, sorted.join(','));
              cb.onQuestionEnd();
              flashThen(host, true, { answer: sorted.join(' ≤ ') }, () => ask());
            }
          } else {
            state.asked += 1;
            cb.onAnswer(false, v);
            cb.onQuestionEnd();
            b.classList.add('is-wrong');
            setTimeout(() => b.classList.remove('is-wrong'), 500);
            // restart the ordering attempt
            idx = 0;
            row.querySelectorAll('.is-done').forEach((n) => n.classList.remove('is-done'));
          }
        });
        row.appendChild(b);
      });
      host.appendChild(row);
    }

    startCountdown(state, cb, (left) => { state.onTick && state.onTick(left); }, () => finish(state, cb, false));
    ask();
    return state;
  };

  window.MVEngines = E;
})();
