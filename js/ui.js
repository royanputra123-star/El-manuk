// ui.js
// Render untuk layar Home, Level Map, Stats, Badges, History + util UI umum (toast, confirm, tema).

(function (global) {
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

  function showScreen(id) {
    $all('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('screen-' + id);
    if (target) target.classList.add('active');
    window.scrollTo(0, 0);
  }

  function toast(msg) {
    const root = document.getElementById('toast-root');
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  function showConfirm(message, onConfirm) {
    const overlay = document.getElementById('confirm-dialog');
    document.getElementById('confirm-message').textContent = message;
    overlay.classList.remove('hidden');

    const okBtn = document.getElementById('confirm-ok');
    const cancelBtn = document.getElementById('confirm-cancel');

    function cleanup() {
      overlay.classList.add('hidden');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
    }
    function onOk() { cleanup(); onConfirm(); }
    function onCancel() { cleanup(); }

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
  }

  function applyTheme() {
    const state = Storage.getState();
    if (state.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  function tierClassOfLevel(level) {
    if (level <= 10) return 'mudah';
    if (level <= 20) return 'sedang';
    if (level <= 30) return 'kalimat';
    if (level <= 40) return 'campuran';
    return 'acak';
  }

  function starsForPercentage(pct) {
    if (pct >= 90) return '★★★';
    if (pct >= 70) return '★★☆';
    if (pct >= 1) return '★☆☆';
    return '';
  }

  /* ============ HOME ============ */
  function renderHome() {
    const state = Storage.getState();
    $('#stat-streak').textContent = state.streak.count;
    $('#stat-xp').textContent = state.totalXP;
    $('#stat-badges').textContent = state.badges.length;

    const level = state.currentLevel || 1;
    $('#continue-level-title').textContent = 'Level ' + level;
    const scoreEntry = Storage.getLevelScore(level);
    const pct = scoreEntry ? scoreEntry.bestPercentage : 0;
    $('#continue-progress-fill').style.width = pct + '%';
  }

  /* ============ LEVEL MAP ============ */
  function renderLevelMap(onLevelClick) {
    const state = Storage.getState();
    const grid = document.getElementById('level-map-grid');
    grid.innerHTML = '';
    for (let level = 1; level <= 50; level++) {
      const locked = level > state.unlockedLevel;
      const node = document.createElement('button');
      node.type = 'button';
      const tier = tierClassOfLevel(level);
      node.className = 'level-node ' + (locked ? 'locked' : 'unlocked-' + tier);
      if (level === state.currentLevel) node.classList.add('current');

      if (locked) {
        node.innerHTML = '<span class="lock-icon">🔒</span>';
      } else {
        const scoreEntry = state.levelScores[level];
        const stars = scoreEntry ? starsForPercentage(scoreEntry.bestPercentage) : '';
        node.innerHTML = `<span>${level}</span><span class="stars">${stars}</span>`;
      }
      node.addEventListener('click', () => {
        if (locked) {
          toast('Selesaikan level sebelumnya dulu ya!');
          SoundFx.playWrong();
          return;
        }
        onLevelClick(level);
      });
      grid.appendChild(node);
    }
  }

  /* ============ STATS ============ */
  function renderStats() {
    const state = Storage.getState();
    const levelsDone = Object.keys(state.levelScores).length;
    const totalCorrect = state.totalCorrect || 0;
    const totalWrong = state.totalWrong || 0;
    const totalAnswered = totalCorrect + totalWrong;
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    $('#stats-levels-done').textContent = levelsDone + ' / 50';
    $('#stats-total-correct').textContent = totalCorrect;
    $('#stats-total-wrong').textContent = totalWrong;
    $('#stats-accuracy').textContent = accuracy + '%';
    $('#stats-xp-total').textContent = state.totalXP;
    $('#stats-streak-best').textContent = state.streak.best || 0;
  }

  /* ============ BADGES ============ */
  function renderBadges() {
    const state = Storage.getState();
    const defs = Storage.getBadgeDefs();
    const grid = document.getElementById('badges-grid');
    grid.innerHTML = '';
    defs.forEach(b => {
      const earned = state.badges.includes(b.id);
      const card = document.createElement('div');
      card.className = 'badge-card' + (earned ? ' earned' : '');
      card.innerHTML = `
        <span class="badge-icon">${b.icon}</span>
        <span class="badge-name">${b.name}</span>
        <span class="badge-desc">${b.desc}</span>
      `;
      grid.appendChild(card);
    });
  }

  /* ============ HISTORY ============ */
  function renderHistory() {
    const state = Storage.getState();
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    if (!state.history || state.history.length === 0) {
      list.innerHTML = '<div class="history-empty">Belum ada riwayat. Mulai belajar sekarang!</div>';
      return;
    }
    state.history.slice(0, 60).forEach(h => {
      const item = document.createElement('div');
      item.className = 'history-item';
      const date = new Date(h.date);
      const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ' ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      item.innerHTML = `
        <div class="history-item-left">
          <span class="history-item-level">Level ${h.level}</span>
          <span class="history-item-date">${dateStr}</span>
        </div>
        <div class="history-item-right">
          <div class="history-item-pct">${h.percentage}%</div>
          <div class="history-item-score">✅ ${h.correct} · ❌ ${h.wrong} · Skor ${h.score}</div>
        </div>
      `;
      list.appendChild(item);
    });
  }

  global.UI = {
    showScreen, toast, showConfirm, applyTheme,
    renderHome, renderLevelMap, renderStats, renderBadges, renderHistory,
    tierClassOfLevel, starsForPercentage,
  };
})(window);
