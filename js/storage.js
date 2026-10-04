// js/storage.js
// Pengelolaan data lokal localStorage (Progres, Skor, XP, Badge, Riwayat)
// Streak telah dihapus penuh, dan semua level (1-50) tidak terkunci (unlock all)

(function (global) {
  const STORAGE_KEY = 'nihongo_app_progress_v2';
  /* Semua bab yang dikenal aplikasi. Data lama tetap aman: bab baru cukup
   * ditambahkan ke daftar ini, progres bab lain tidak dihapus. */
  const CHAPTERS = ['bab7', 'bab8', 'bab9', 'bab10'];
  const DEFAULT_CHAPTER = 'bab10';

  function getDefaultProgress() {
    return {
      activeChapter: 'bab10',
      xp: 0,
      totalCorrect: 0,
      totalWrong: 0,
      levelsDone: {
        bab7: {},
        bab8: {},
        bab9: {},
        bab10: {}
      },
      lastLevel: {
        bab7: 1,
        bab8: 1,
        bab9: 1,
        bab10: 1
      },
      history: [],
      badges: []
    };
  }

  function getProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultProgress();
      const data = JSON.parse(raw);
      if (!data.levelsDone) data.levelsDone = {};
      if (!data.lastLevel) data.lastLevel = {};
      if (!data.activeChapter || !CHAPTERS.includes(data.activeChapter)) data.activeChapter = DEFAULT_CHAPTER;
      // Data lama (sebelum Bab 10) tetap aman: lengkapi bab yang belum ada tanpa menghapus progres.
      CHAPTERS.forEach(ch => {
        if (!data.levelsDone[ch]) data.levelsDone[ch] = {};
        if (!data.lastLevel[ch]) data.lastLevel[ch] = 1;
      });
      return data;
    } catch (e) {
      console.error('Error loading progress:', e);
      return getDefaultProgress();
    }
  }

  function saveProgress(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving progress:', e);
    }
  }

  function markLevelComplete(chapter, levelNum, scorePercent, xpGained, correctCount, wrongCount) {
    const progress = getProgress();
    const ch = chapter || progress.activeChapter || DEFAULT_CHAPTER;

    if (!progress.levelsDone[ch]) progress.levelsDone[ch] = {};
    const prevBest = progress.levelsDone[ch][levelNum] || 0;
    if (scorePercent > prevBest) {
      progress.levelsDone[ch][levelNum] = scorePercent;
    }

    progress.lastLevel[ch] = Math.min(50, levelNum + 1);
    progress.xp = (progress.xp || 0) + xpGained;
    progress.totalCorrect = (progress.totalCorrect || 0) + correctCount;
    progress.totalWrong = (progress.totalWrong || 0) + wrongCount;

    // Tambah riwayat
    progress.history.unshift({
      id: Date.now(),
      chapter: ch,
      level: levelNum,
      score: scorePercent,
      xp: xpGained,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    });
    if (progress.history.length > 50) progress.history.pop();

    // Evaluasi Badge Baru
    const earnedBadge = checkNewBadges(progress);

    saveProgress(progress);
    return { progress, earnedBadge };
  }

  function checkNewBadges(progress) {
    const BADGES_DEF = [
      { id: 'b_first', name: 'Langkah Pertama', icon: '🐣', desc: 'Selesaikan 1 level pertama' },
      { id: 'b_lv10', name: 'Master 10 Level', icon: '🥉', desc: 'Selesaikan 10 level' },
      { id: 'b_lv25', name: 'Setengah Jalan', icon: '🥈', desc: 'Selesaikan 25 level' },
      { id: 'b_lv50', name: 'Lulus Bab!', icon: '🥇', desc: 'Selesaikan seluruh 50 level' },
      { id: 'b_perfect', name: 'Nilai Sempurna', icon: '💯', desc: 'Dapatkan skor 100% pada satu level' },
      { id: 'b_xp1000', name: 'Pengumpul XP', icon: '⭐', desc: 'Kumpulkan total 1,000 XP' },
    ];

    if (!progress.badges) progress.badges = [];

    const totalLevelsDone = CHAPTERS
      .map(ch => Object.values(progress.levelsDone[ch] || {}).filter(s => s >= 60).length)
      .reduce((a, b) => a + b, 0);

    let newlyEarned = null;

    BADGES_DEF.forEach(b => {
      if (progress.badges.includes(b.id)) return;

      let qualify = false;
      if (b.id === 'b_first' && totalLevelsDone >= 1) qualify = true;
      if (b.id === 'b_lv10' && totalLevelsDone >= 10) qualify = true;
      if (b.id === 'b_lv25' && totalLevelsDone >= 25) qualify = true;
      if (b.id === 'b_lv50' && totalLevelsDone >= 50) qualify = true;
      if (b.id === 'b_xp1000' && progress.xp >= 1000) qualify = true;
      if (b.id === 'b_perfect') {
        const has100 = CHAPTERS
          .some(ch => Object.values(progress.levelsDone[ch] || {}).includes(100));
        if (has100) qualify = true;
      }

      if (qualify) {
        progress.badges.push(b.id);
        newlyEarned = b;
      }
    });

    return newlyEarned;
  }

  function resetProgress() {
    localStorage.removeItem(STORAGE_KEY);
    return getDefaultProgress();
  }

  function setActiveChapter(ch) {
    const p = getProgress();
    p.activeChapter = ch;
    saveProgress(p);
  }

  global.StorageManager = {
    CHAPTERS,
    getProgress,
    saveProgress,
    markLevelComplete,
    resetProgress,
    setActiveChapter
  };
})(window);
