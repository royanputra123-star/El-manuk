// js/storage.js
// Pengelolaan data lokal localStorage (Progres, Skor, XP, Badge, Riwayat)
// Streak telah dihapus penuh, dan semua level (1-50) tidak terkunci (unlock all)

(function (global) {
  const STORAGE_KEY = 'nihongo_app_progress_v2';

  function getDefaultProgress() {
    return {
      activeChapter: 'bab8',
      xp: 0,
      totalCorrect: 0,
      totalWrong: 0,
      levelsDone: {
        bab7: {},
        bab8: {}
      },
      lastLevel: {
        bab7: 1,
        bab8: 1
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
      if (!data.levelsDone) data.levelsDone = { bab7: {}, bab8: {} };
      if (!data.lastLevel) data.lastLevel = { bab7: 1, bab8: 1 };
      if (!data.activeChapter) data.activeChapter = 'bab8';
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
    const ch = chapter || progress.activeChapter || 'bab8';

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

    const totalLevelsDone = Object.values(progress.levelsDone.bab8 || {}).filter(s => s >= 60).length +
                             Object.values(progress.levelsDone.bab7 || {}).filter(s => s >= 60).length;

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
        const has100 = Object.values(progress.levelsDone.bab8 || {}).includes(100) ||
                       Object.values(progress.levelsDone.bab7 || {}).includes(100);
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
    getProgress,
    saveProgress,
    markLevelComplete,
    resetProgress,
    setActiveChapter
  };
})(window);
