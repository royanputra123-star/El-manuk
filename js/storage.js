// storage.js
// Mengelola semua data progres belajar di localStorage.
// Semua fungsi bersifat sinkron & aman terhadap localStorage yang tidak tersedia.

(function (global) {
  const STORAGE_KEY = 'nihongo_bab7_progress_v1';

  const DEFAULT_STATE = {
    currentLevel: 1,          // level terakhir dibuka/dimainkan
    unlockedLevel: 1,         // level tertinggi yang sudah terbuka
    levelScores: {},          // { [level]: { score, correct, wrong, percentage, stars, attempts, bestScore, completedAt } }
    totalXP: 0,
    streak: { count: 0, lastPlayedDate: null, best: 0 },
    badges: [],               // array of badge ids yang sudah didapat
    history: [],              // array of { level, score, correct, wrong, percentage, date }
    darkMode: false,
    totalCorrect: 0,
    totalWrong: 0,
    soundEnabled: true,
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredCloneSafe(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      return Object.assign(structuredCloneSafe(DEFAULT_STATE), parsed);
    } catch (e) {
      console.warn('Gagal membaca progres, menggunakan default.', e);
      return structuredCloneSafe(DEFAULT_STATE);
    }
  }

  function structuredCloneSafe(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  let state = loadState();

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Gagal menyimpan progres.', e);
    }
  }

  function getState() {
    return state;
  }

  function resetProgress() {
    state = structuredCloneSafe(DEFAULT_STATE);
    persist();
  }

  function setDarkMode(val) {
    state.darkMode = !!val;
    persist();
  }

  function setSoundEnabled(val) {
    state.soundEnabled = !!val;
    persist();
  }

  function setCurrentLevel(level) {
    state.currentLevel = level;
    persist();
  }

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function bumpStreak() {
    const today = todayStr();
    if (state.streak.lastPlayedDate === today) {
      // sudah dihitung hari ini
      return state.streak.count;
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;

    if (state.streak.lastPlayedDate === yStr) {
      state.streak.count += 1;
    } else {
      state.streak.count = 1;
    }
    state.streak.lastPlayedDate = today;
    if (state.streak.count > state.streak.best) state.streak.best = state.streak.count;
    persist();
    return state.streak.count;
  }

  // Badge definitions
  const BADGE_DEFS = [
    { id: 'first_step', name: 'Langkah Pertama', desc: 'Selesaikan Level 1', icon: '🎯' },
    { id: 'perfect_score', name: 'Sempurna!', desc: 'Dapatkan skor 100% di sebuah level', icon: '💯' },
    { id: 'ten_levels', name: 'Pemula Tangguh', desc: 'Selesaikan 10 level', icon: '🥉' },
    { id: 'twentyfive_levels', name: 'Pelajar Gigih', desc: 'Selesaikan 25 level', icon: '🥈' },
    { id: 'all_levels', name: 'Master Bab 7', desc: 'Selesaikan semua 50 level', icon: '🥇' },
    { id: 'streak_3', name: 'Konsisten', desc: 'Belajar 3 hari berturut-turut', icon: '🔥' },
    { id: 'streak_7', name: 'Seminggu Penuh', desc: 'Belajar 7 hari berturut-turut', icon: '🔥🔥' },
    { id: 'xp_500', name: 'Pemburu XP', desc: 'Kumpulkan 500 XP', icon: '⭐' },
    { id: 'xp_2000', name: 'Kolektor XP', desc: 'Kumpulkan 2000 XP', icon: '🌟' },
    { id: 'no_mistake_5', name: 'Tanpa Cela', desc: '5 level dengan skor 100%', icon: '🏆' },
  ];

  function getBadgeDefs() { return BADGE_DEFS; }

  function awardBadge(id) {
    if (!state.badges.includes(id)) {
      state.badges.push(id);
      persist();
      return true; // baru didapat
    }
    return false;
  }

  function checkAndAwardBadges() {
    const newlyAwarded = [];
    const levelsDone = Object.keys(state.levelScores).length;
    const perfectCount = Object.values(state.levelScores).filter(s => s.bestPercentage === 100).length;

    if (levelsDone >= 1 && awardBadge('first_step')) newlyAwarded.push('first_step');
    if (perfectCount >= 1 && awardBadge('perfect_score')) newlyAwarded.push('perfect_score');
    if (levelsDone >= 10 && awardBadge('ten_levels')) newlyAwarded.push('ten_levels');
    if (levelsDone >= 25 && awardBadge('twentyfive_levels')) newlyAwarded.push('twentyfive_levels');
    if (levelsDone >= 50 && awardBadge('all_levels')) newlyAwarded.push('all_levels');
    if (state.streak.count >= 3 && awardBadge('streak_3')) newlyAwarded.push('streak_3');
    if (state.streak.count >= 7 && awardBadge('streak_7')) newlyAwarded.push('streak_7');
    if (state.totalXP >= 500 && awardBadge('xp_500')) newlyAwarded.push('xp_500');
    if (state.totalXP >= 2000 && awardBadge('xp_2000')) newlyAwarded.push('xp_2000');
    if (perfectCount >= 5 && awardBadge('no_mistake_5')) newlyAwarded.push('no_mistake_5');

    return newlyAwarded;
  }

  // Menyimpan hasil satu level selesai
  function saveLevelResult({ level, correct, wrong, total, score, xpEarned }) {
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const prev = state.levelScores[level];
    const attempts = prev ? (prev.attempts || 1) + 1 : 1;
    const bestScore = prev ? Math.max(prev.bestScore || 0, score) : score;
    const bestPercentage = prev ? Math.max(prev.bestPercentage || 0, percentage) : percentage;

    state.levelScores[level] = {
      score,
      correct,
      wrong,
      percentage,
      bestScore,
      bestPercentage,
      attempts,
      completedAt: new Date().toISOString(),
    };

    state.totalXP += xpEarned;
    state.totalCorrect += correct;
    state.totalWrong += wrong;

    if (level >= state.unlockedLevel && percentage >= 60) {
      state.unlockedLevel = Math.min(level + 1, 50);
    }
    // longgar: walau <60% tetap bisa lanjut? aturan: unlock jika passing >=60%
    state.currentLevel = Math.min(state.unlockedLevel, 50);

    state.history.unshift({
      level, score, correct, wrong, percentage, date: new Date().toISOString(),
    });
    if (state.history.length > 200) state.history.length = 200;

    bumpStreak();
    persist();

    const newBadges = checkAndAwardBadges();
    return { percentage, newBadges, unlockedLevel: state.unlockedLevel };
  }

  function getLevelScore(level) {
    return state.levelScores[level] || null;
  }

  function isLevelUnlocked(level) {
    return level <= state.unlockedLevel;
  }

  global.Storage = {
    getState,
    resetProgress,
    setDarkMode,
    setSoundEnabled,
    setCurrentLevel,
    saveLevelResult,
    getLevelScore,
    isLevelUnlocked,
    getBadgeDefs,
    bumpStreak,
  };
})(window);
