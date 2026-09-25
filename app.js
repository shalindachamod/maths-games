// Mathverse — app shell: catalogue rendering, filters, modal session runner,
// scoring, streaks, XP, stars, best scores and end screens (localStorage).
'use strict';

(function () {
  const Cats = window.MVCats;
  const Games = window.MVGames;
  const Engines = window.MVEngines;

  // ---------- persistent progress ----------
  const LS_KEY = 'mathverse.progress.v1';
  function loadProgress() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* private mode etc. */ }
    return { xp: 0, played: {}, best: {}, stars: {}, games: {} };
  }
  let progress = loadProgress();
  function saveProgress() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(progress)); } catch (e) { }
  }
  function gameStats(id) {
    return progress.games[id] || { plays: 0, correct: 0, asked: 0, best: 0, stars: 0 };
  }
  function setGameStats(id, s) { progress.games[id] = s; saveProgress(); }

  function starsFor(pct) {
    if (pct >= 0.9) return 3;
    if (pct >= 0.7) return 2;
    if (pct >= 0.4) return 1;
    return 0;
  }

  function totalStars() {
    let t = 0;
    Object.values(progress.games).forEach((s) => { t += s.stars || 0; });
    return t;
  }
  function gamesStarted() { return Object.keys(progress.games).length; }

  // ---------- DOM helpers ----------
  const $ = (sel) => document.querySelector(sel);
  function el(tag, cls, txt) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  // ---------- state ----------
  const filters = { cat: 'all', search: '', sort: 'default' };

  // ---------- catalogue rendering ----------
  function starsHtml(n) {
    let out = '';
    for (let i = 0; i < 3; i++) out += i < n ? '★' : '☆';
    return out;
  }

  function renderGrid() {
    const grid = $('#gameGrid');
    grid.innerHTML = '';
    let list = Games.filter((g) => filters.cat === 'all' || g.cat === filters.cat);
    if (filters.search) {
      const s = filters.search.toLowerCase();
      list = list.filter((g) =>
        g.title.toLowerCase().includes(s) ||
        g.desc.toLowerCase().includes(s) ||
        Cats[g.cat].name.toLowerCase().includes(s));
    }
    if (filters.sort === 'level') list = list.slice().sort((a, b) => a.lvl - b.lvl);
    if (filters.sort === 'az') list = list.slice().sort((a, b) => a.title.localeCompare(b.title));
    $('#resultCount').textContent = list.length + ' games';

    list.forEach((g) => {
      const st = gameStats(g.id);
      const card = el('button', 'card ' + (Cats[g.cat].color || ''));
      const top = el('div', 'card-top');
      const icon = el('span', 'card-icon', Cats[g.cat].icon);
      const lvl = el('span', 'card-lvl', 'lvl ' + g.lvl);
      top.appendChild(icon); top.appendChild(lvl);
      const title = el('div', 'card-title', g.title);
      const desc = el('div', 'card-desc', g.desc);
      const meta = el('div', 'card-meta');
      meta.appendChild(el('span', 'card-cat', Cats[g.cat].name));
      meta.appendChild(el('span', 'card-stars' + (st.stars ? ' has-stars' : ''), starsHtml(st.stars)));
      card.appendChild(top); card.appendChild(title); card.appendChild(desc); card.appendChild(meta);
      if (st.plays) {
        const played = el('div', 'card-played', 'played ×' + st.plays + (st.best ? ' · best ' + st.best + '%' : ''));
        card.appendChild(played);
      }
      card.addEventListener('click', () => openGame(g));
      grid.appendChild(card);
    });

    if (!list.length) {
      const empty = el('div', 'empty-note', 'No games match — try another filter.');
      grid.appendChild(empty);
    }
  }

  // ---------- modal ----------
  const modal = $('#gameModal');
  let session = null;   // active engine state
  let activeGame = null;

  function openGame(g) {
    activeGame = g;
    $('#modalTitle').textContent = g.title;
    $('#modalCat').textContent = Cats[g.cat].name + ' · lvl ' + g.lvl;
    $('#modalDesc').textContent = g.desc + ' — ' + (g.time ? (g.time + 's round, ') : '') + (g.goal || 10) + ' questions';
    $('#startIco').textContent = Cats[g.cat].icon;
    $('#startName').textContent = g.title;
    $('#startBlurb').textContent = g.desc + '. ' +
      (g.time ? 'You have ' + g.time + ' seconds — ' : '') +
      'Answer ' + (g.goal || 10) + ' questions. Streaks boost your score!';
    showScreen('start');
    modal.classList.add('is-open');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    if (session && typeof session === 'object') {
      session.done = true;
      if (session.timer) clearInterval(session.timer);
    }
    session = null;
    activeGame = null;
    modal.classList.remove('is-open');
    document.body.classList.remove('modal-open');
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
  $('#modalClose').addEventListener('click', closeModal);
  $('#modalBackdrop').addEventListener('click', closeModal);

  function showScreen(name) {
    ['start', 'play', 'end'].forEach((s) => {
      $('#screen' + s.charAt(0).toUpperCase() + s.slice(1)).hidden = (s !== name);
    });
  }

  // ---------- session runner ----------
  function beginGame() {
    const g = activeGame;
    showScreen('play');
    $('#gameTitle').textContent = g.title;
    $('#scoreVal').textContent = '0';
    $('#streakVal').textContent = '0';
    $('#qProgress').textContent = '0 / ' + (g.goal || 10);
    const timeChip = $('#timeChip');
    if (g.time) { timeChip.hidden = false; timeChip.textContent = formatClock(g.time); }
    else timeChip.hidden = true;

    let score = 0, streak = 0, bestStreak = 0, asked = 0, correct = 0;

    const host = $('#gameHost');
    host.innerHTML = '';

    const cb = {
      onQuestionStart() {
        asked += 1;
        $('#qProgress').textContent = Math.min(asked, g.goal || 10) + ' / ' + (g.goal || 10);
      },
      onAnswer(ok) {
        if (ok) {
          score += 10 + Math.min(streak, 10);
          streak += 1;
          correct += 1;
          bestStreak = Math.max(bestStreak, streak);
        } else {
          streak = 0;
          score = Math.max(0, score - 5);
        }
        $('#scoreVal').textContent = String(score);
        $('#streakVal').textContent = String(streak);
        const chip = $('#streakChip');
        chip.classList.toggle('is-hot', streak >= 3);
      },
      onQuestionEnd() { },
      onEnd(summary) {
        endGame(g, { score, correct, asked: Math.max(asked, summary.total), timeTaken: summary.timeTaken, bestStreak });
      }
    };

    session = Engines[g.engine](g, host, cb);
    if (session && session.onTick === undefined) session.onTick = null;
    // wire timer display
    if (g.time && session) {
      session.onTick = (left) => {
        const chip = $('#timeChip');
        chip.textContent = formatClock(left);
        chip.classList.toggle('is-low', left <= 10);
      };
    }
  }

  function formatClock(s) {
    s = Math.max(0, Math.ceil(s));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function quitGame() {
    if (session && !session.done) {
      session.done = true;
      if (session.timer) clearInterval(session.timer);
    }
    showScreen('end');
    renderEnd(activeGame, { score: 0, correct: 0, asked: 0, timeTaken: 0, quit: true });
  }

  function endGame(g, s) {
    const pct = s.asked ? Math.round((s.correct / s.asked) * 100) : 0;
    const st = gameStats(g.id);
    st.plays += 1;
    st.correct += s.correct;
    st.asked += s.asked;
    st.best = Math.max(st.best || 0, pct);
    st.stars = Math.max(st.stars || 0, starsFor(pct));
    setGameStats(g.id, st);

    const xpGain = s.correct * 10 + s.bestStreak * 5;
    progress.xp = (progress.xp || 0) + xpGain;
    saveProgress();

    renderEnd(g, { ...s, pct, xpGain });
  }

  function renderEnd(g, s) {
    showScreen('end');
    const pct = s.asked ? Math.round((s.correct / s.asked) * 100) : 0;
    const n = starsFor(pct);
    $('#endStars').textContent = '★'.repeat(n) + '☆'.repeat(3 - n);
    $('#endTitle').textContent = s.quit ? 'Round ended' : (n === 3 ? 'Perfect run!' : n >= 2 ? 'Well done!' : n >= 1 ? 'Keep going!' : 'Practice makes perfect');
    $('#endStats').textContent =
      s.asked + ' questions · ' + s.correct + ' correct · ' + pct + '%' +
      (s.bestStreak ? ' · best streak ' + s.bestStreak : '') +
      (s.xpGain ? ' · +' + s.xpGain + ' XP' : '');
    const best = gameStats(g.id);
    $('#endBest').textContent = 'This game: played ×' + best.plays + ' · best ' + best.best + '% · ' + starsHtml(best.stars);
    renderGrid(); // refresh stars on cards
    renderHeroStats();
  }

  // ---------- toolbar ----------
  function buildCatBar() {
    const bar = $('#catBar');
    const mk = (key, label, icon) => {
      const b = el('button', 'cat-btn' + (filters.cat === key ? ' is-active' : ''));
      b.appendChild(el('span', 'cat-ico', icon));
      b.appendChild(el('span', 'cat-label', label));
      b.addEventListener('click', () => {
        filters.cat = key;
        bar.querySelectorAll('.cat-btn').forEach((n) => n.classList.remove('is-active'));
        b.classList.add('is-active');
        renderGrid();
      });
      return b;
    };
    bar.appendChild(mk('all', 'All', '🎲'));
    Object.entries(Cats).forEach(([key, c]) => bar.appendChild(mk(key, c.name, c.icon)));
  }

  $('#searchInput').addEventListener('input', (e) => {
    filters.search = e.target.value.trim();
    renderGrid();
  });
  $('#sortSelect').addEventListener('change', (e) => {
    filters.sort = e.target.value;
    renderGrid();
  });
  $('#btnPlay').addEventListener('click', beginGame);
  $('#btnQuit').addEventListener('click', quitGame);
  $('#btnAgain').addEventListener('click', beginGame);
  $('#btnCloseEnd').addEventListener('click', closeModal);
  $('#btnStartClose').addEventListener('click', closeModal);

  // ---------- hero stats ----------
  function renderHeroStats() {
    $('#statGames').textContent = Games.length;
    $('#statStars').textContent = totalStars() + ' / ' + (Games.length * 3);
    $('#statPlayed').textContent = gamesStarted();
    $('#statXp').textContent = progress.xp || 0;
  }

  // ---------- boot ----------
  buildCatBar();
  renderGrid();
  renderHeroStats();
  $('#searchInput').placeholder = 'Search ' + Games.length + ' games…';
  $('#footCount').textContent = Games.length + ' games · ' + Object.keys(Cats).length + ' categories';
})();
