// js/ui.js
// Pengelolaan Tampilan UI Aplikasi (Home, Level Map, Stats, Badges, History, Chapter Switch)

(function (global) {
  // Daftar bab yang tersedia di aplikasi (Bab 9 = bab terbaru)
  const CHAPTERS = [
    { id: 'bab9', label: 'Bab 9',
      sub: '50 Level · 1000 Soal · 好き / 嫌い · 上手 / 下手 · 分かります · どうして / から' },
    { id: 'bab8', label: 'Bab 8',
      sub: '50 Level · 1000 Soal · Kata Sifat い/な · とても / あまり · ～が、～' },
    { id: 'bab7', label: 'Bab 7',
      sub: '50 Level · 1000 Soal · あげます / もらいます · 貸します / 借ります · もう / まだ' }
  ];

  const DEFAULT_CHAPTER = 'bab9';

  function getChapterMeta(chapterId) {
    return CHAPTERS.find(c => c.id === chapterId) || CHAPTERS[0];
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function renderHomeScreen(progress) {
    const activeChapter = progress.activeChapter || DEFAULT_CHAPTER;
    const meta = getChapterMeta(activeChapter);

    // Highlight Chapter Toggle Buttons (Bab 9 / Bab 8 / Bab 7)
    CHAPTERS.forEach(c => {
      const btn = document.getElementById('btn-chap-' + c.id);
      if (btn) btn.classList.toggle('active', activeChapter === c.id);
    });

    // Stats row
    const statXp = document.getElementById('stat-xp');
    const statBadges = document.getElementById('stat-badges');

    if (statXp) statXp.textContent = progress.xp || 0;
    if (statBadges) statBadges.textContent = (progress.badges || []).length;

    // Last level / continue card
    const lastLvlNum = progress.lastLevel[activeChapter] || 1;
    const lvlScores = progress.levelsDone[activeChapter] || {};
    const bestScore = lvlScores[lastLvlNum] || 0;

    const continueTitle = document.getElementById('continue-level-title');
    const continueFill = document.getElementById('continue-progress-fill');
    const heroBadge = document.getElementById('hero-badge-ch');
    const heroTitle = document.getElementById('hero-title');
    const heroSub = document.getElementById('hero-sub');

    if (continueTitle) continueTitle.textContent = `Level ${lastLvlNum} (${meta.label})`;
    if (continueFill) continueFill.style.width = `${bestScore}%`;
    if (heroBadge) heroBadge.textContent = `Minna no Nihongo I — ${meta.label}`;
    if (heroTitle) heroTitle.innerHTML = `Kuasai Pola Kalimat<br/>Bahasa Jepang ${meta.label}`;
    if (heroSub) heroSub.textContent = meta.sub;
  }

  function renderLevelMap(progress, onSelectLevel) {
    const grid = document.getElementById('level-map-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const activeChapter = progress.activeChapter || DEFAULT_CHAPTER;
    const lvlScores = progress.levelsDone[activeChapter] || {};

    for (let l = 1; l <= 50; l++) {
      const score = lvlScores[l];
      const isPassed = score !== undefined && score >= 60;

      // Kategori warna level map
      let tierClass = 'tier-mudah';
      if (l > 10 && l <= 20) tierClass = 'tier-sedang';
      else if (l > 20 && l <= 30) tierClass = 'tier-kalimat';
      else if (l > 30 && l <= 40) tierClass = 'tier-campuran';
      else if (l > 40) tierClass = 'tier-acak';

      const tile = el('button', `map-level-tile ${tierClass} ${isPassed ? 'passed' : ''}`);
      tile.type = 'button';

      const numEl = el('span', 'level-tile-num', l);
      tile.appendChild(numEl);

      if (score !== undefined) {
        const scoreTag = el('span', 'level-tile-score', `${score}%`);
        tile.appendChild(scoreTag);
      } else {
        const playTag = el('span', 'level-tile-tag', 'Main');
        tile.appendChild(playTag);
      }

      // Bebas Melompati Level (Unlock All): Semua tombol aktif dan dapat diklik
      tile.addEventListener('click', () => {
        if (global.SoundFx) SoundFx.playClick();
        onSelectLevel(l);
      });

      grid.appendChild(tile);
    }
  }

  function renderStatsScreen(progress) {
    const activeChapter = progress.activeChapter || DEFAULT_CHAPTER;
    const chDone = progress.levelsDone[activeChapter] || {};

    const levelsCompleted = Object.values(chDone).filter(s => s >= 60).length;
    const totalCorrect = progress.totalCorrect || 0;
    const totalWrong = progress.totalWrong || 0;
    const totalAnswered = totalCorrect + totalWrong;
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    const elDone = document.getElementById('stats-levels-done');
    const elCorrect = document.getElementById('stats-total-correct');
    const elWrong = document.getElementById('stats-total-wrong');
    const elAcc = document.getElementById('stats-accuracy');
    const elXp = document.getElementById('stats-xp-total');

    if (elDone) elDone.textContent = `${levelsCompleted} / 50`;
    if (elCorrect) elCorrect.textContent = totalCorrect;
    if (elWrong) elWrong.textContent = totalWrong;
    if (elAcc) elAcc.textContent = `${accuracy}%`;
    if (elXp) elXp.textContent = progress.xp || 0;
  }

  function renderBadgesScreen(progress) {
    const grid = document.getElementById('badges-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const ALL_BADGES = [
      { id: 'b_first', name: 'Langkah Pertama', icon: '🐣', desc: 'Selesaikan 1 level pertama' },
      { id: 'b_lv10', name: 'Master 10 Level', icon: '🥉', desc: 'Selesaikan 10 level' },
      { id: 'b_lv25', name: 'Setengah Jalan', icon: '🥈', desc: 'Selesaikan 25 level' },
      { id: 'b_lv50', name: 'Lulus Bab!', icon: '🥇', desc: 'Selesaikan seluruh 50 level' },
      { id: 'b_perfect', name: 'Nilai Sempurna', icon: '💯', desc: 'Dapatkan skor 100% pada satu level' },
      { id: 'b_xp1000', name: 'Pengumpul XP', icon: '⭐', desc: 'Kumpulkan total 1,000 XP' },
    ];

    const earnedIds = progress.badges || [];

    ALL_BADGES.forEach(b => {
      const isEarned = earnedIds.includes(b.id);
      const card = el('div', `badge-card ${isEarned ? 'earned' : 'locked'}`);

      const iconEl = el('div', 'badge-icon', b.icon);
      const nameEl = el('strong', 'badge-name', b.name);
      const descEl = el('small', 'badge-desc', b.desc);
      const statusEl = el('span', 'badge-status', isEarned ? 'TERBUKA' : 'TERKUNCI');

      card.appendChild(iconEl);
      card.appendChild(nameEl);
      card.appendChild(descEl);
      card.appendChild(statusEl);

      grid.appendChild(card);
    });
  }

  function renderHistoryScreen(progress) {
    const list = document.getElementById('history-list');
    if (!list) return;

    list.innerHTML = '';

    const history = progress.history || [];

    if (history.length === 0) {
      list.appendChild(el('p', 'empty-history', 'Belum ada riwayat permainan. Mulailah memainkan level!'));
      return;
    }

    history.forEach(item => {
      const row = el('div', 'history-item');

      const infoBox = el('div', 'history-info');
      const title = el('strong', null, `Level ${item.level} (${item.chapter ? item.chapter.toUpperCase() : 'BAB 8'})`);
      const date = el('small', null, item.date);
      infoBox.appendChild(title);
      infoBox.appendChild(date);

      const scoreBox = el('div', 'history-score');
      const scoreTag = el('span', `score-badge ${item.score >= 60 ? 'pass' : 'fail'}`, `${item.score}%`);
      const xpTag = el('small', 'xp-tag', `+${item.xp} XP`);
      scoreBox.appendChild(scoreTag);
      scoreBox.appendChild(xpTag);

      row.appendChild(infoBox);
      row.appendChild(scoreBox);

      list.appendChild(row);
    });
  }

  function showToast(message) {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const toast = el('div', 'toast-item', message);
    root.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  global.UIManager = {
    CHAPTERS,
    getChapterMeta,
    renderHomeScreen,
    renderLevelMap,
    renderStatsScreen,
    renderBadgesScreen,
    renderHistoryScreen,
    showToast
  };
})(window);
