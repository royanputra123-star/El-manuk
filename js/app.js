// app.js
// Logika utama aplikasi: navigasi, sesi kuis, penghitungan skor & XP.

(function () {
  const XP_PER_CORRECT = 5;
  const XP_PERFECT_BONUS = 30;
  const SCORE_PER_CORRECT = 10;
  const SCORE_PENALTY_WRONG = 2;
  const MAX_LIVES = 3; // hanya visual/motivasi, tidak menghentikan permainan (self-paced)

  let session = null; // { level, questions, index, correct, wrong, lives, controller }

  function getLevelData(level) {
    return window.LEVELS_DATA.find(l => l.level === level);
  }

  /* ============ NAVIGASI ============ */
  function goHome() {
    UI.renderHome();
    UI.showScreen('home');
  }

  function goMap() {
    UI.renderLevelMap(startLevel);
    UI.showScreen('map');
  }

  function goStats() {
    UI.renderStats();
    UI.showScreen('stats');
  }

  function goBadges() {
    UI.renderBadges();
    UI.showScreen('badges');
  }

  function goHistory() {
    UI.renderHistory();
    UI.showScreen('history');
  }

  /* ============ QUIZ SESSION ============ */
  function startLevel(level) {
    const levelData = getLevelData(level);
    if (!levelData) {
      UI.toast('Level tidak ditemukan.');
      return;
    }
    Storage.setCurrentLevel(level);
    session = {
      level,
      questions: levelData.questions,
      index: 0,
      correct: 0,
      wrong: 0,
      lives: MAX_LIVES,
      controller: null,
      answeredCurrent: false,
    };
    UI.showScreen('quiz');
    renderCurrentQuestion();
  }

  function renderCurrentQuestion() {
    const q = session.questions[session.index];
    const body = document.getElementById('quiz-body');
    session.controller = QuestionRenderer.renderQuestion(body, q);
    session.answeredCurrent = false;

    updateQuizHeader();

    const checkBtn = document.getElementById('btn-quiz-check');
    checkBtn.textContent = 'Periksa';
    checkBtn.disabled = true;
    checkBtn.onclick = handleCheckOrNext;

    document.getElementById('quiz-feedback').textContent = '';
    document.getElementById('quiz-feedback').className = 'quiz-feedback';

    window.__onSelectionChange = function () {
      checkBtn.disabled = !session.controller.isComplete();
    };
  }

  function updateQuizHeader() {
    const total = session.questions.length;
    const pct = Math.round((session.index / total) * 100);
    document.getElementById('quiz-progress-fill').style.width = pct + '%';
    document.getElementById('quiz-lives').textContent = session.lives;
  }

  function handleCheckOrNext() {
    const checkBtn = document.getElementById('btn-quiz-check');
    if (!session.answeredCurrent) {
      // periksa jawaban
      const isCorrect = session.controller.checkCorrect();
      session.controller.reveal(isCorrect);
      session.answeredCurrent = true;

      const feedback = document.getElementById('quiz-feedback');
      if (isCorrect) {
        session.correct++;
        feedback.textContent = '✅ Benar sekali!';
        feedback.className = 'quiz-feedback feedback-correct';
        SoundFx.playCorrect();
      } else {
        session.wrong++;
        session.lives = Math.max(0, session.lives - 1);
        feedback.textContent = '❌ Kurang tepat, tapi jangan menyerah!';
        feedback.className = 'quiz-feedback feedback-wrong';
        SoundFx.playWrong();
        document.getElementById('quiz-hearts').classList.add('shake-wrong');
        setTimeout(() => document.getElementById('quiz-hearts').classList.remove('shake-wrong'), 400);
      }
      updateQuizHeader();

      const isLast = session.index === session.questions.length - 1;
      checkBtn.textContent = isLast ? 'Lihat Hasil' : 'Lanjut';
      checkBtn.disabled = false;
    } else {
      // lanjut ke soal berikutnya atau selesai
      session.index++;
      if (session.index >= session.questions.length) {
        finishLevel();
      } else {
        renderCurrentQuestion();
      }
    }
  }

  function finishLevel() {
    const total = session.questions.length;
    const correct = session.correct;
    const wrong = session.wrong;
    const percentage = Math.round((correct / total) * 100);
    const score = Math.max(0, correct * SCORE_PER_CORRECT - wrong * SCORE_PENALTY_WRONG);
    let xpEarned = correct * XP_PER_CORRECT;
    if (percentage === 100) xpEarned += XP_PERFECT_BONUS;

    const result = Storage.saveLevelResult({
      level: session.level, correct, wrong, total, score, xpEarned,
    });

    renderResultScreen({
      level: session.level, correct, wrong, percentage, score, xpEarned,
      newBadges: result.newBadges, passed: percentage >= 60,
    });
  }

  function renderResultScreen(data) {
    const { level, correct, wrong, percentage, score, xpEarned, newBadges, passed } = data;

    document.getElementById('result-emblem').textContent = percentage === 100 ? '🏆' : (passed ? '🎉' : '💪');
    document.getElementById('result-title').textContent = percentage === 100
      ? 'Sempurna!' : (passed ? 'Level Selesai!' : 'Terus Berlatih!');
    document.getElementById('result-subtitle').textContent = 'Level ' + level;
    document.getElementById('result-percentage').textContent = percentage + '%';
    document.getElementById('result-correct').textContent = correct;
    document.getElementById('result-wrong').textContent = wrong;
    document.getElementById('result-xp').textContent = '+' + xpEarned;
    document.getElementById('result-score').textContent = score;

    const badgeBox = document.getElementById('result-badge-earned');
    if (newBadges && newBadges.length > 0) {
      const defs = Storage.getBadgeDefs();
      const firstBadge = defs.find(b => b.id === newBadges[0]);
      document.getElementById('result-badge-name').textContent = firstBadge ? firstBadge.name : '';
      badgeBox.classList.remove('hidden');
    } else {
      badgeBox.classList.add('hidden');
    }

    const nextBtn = document.getElementById('btn-result-next');
    const hasNext = level < 50;
    nextBtn.textContent = hasNext ? 'Lanjut ▶' : 'Level Terakhir 🎉';
    nextBtn.disabled = !hasNext;
    nextBtn.onclick = () => {
      if (hasNext) startLevel(level + 1);
    };

    document.getElementById('btn-result-retry').onclick = () => startLevel(level);
    document.getElementById('btn-result-home').onclick = () => goHome();

    UI.showScreen('result');

    if (passed) {
      SoundFx.playComplete();
      Confetti.fire(percentage === 100 ? 220 : 130);
    }
    if (newBadges && newBadges.length > 0) {
      setTimeout(() => SoundFx.playLevelUp(), 400);
    }
  }

  /* ============ BINDING EVENT ============ */
  function bindEvents() {
    document.getElementById('btn-continue').addEventListener('click', () => {
      const state = Storage.getState();
      startLevel(state.currentLevel || 1);
    });
    document.getElementById('btn-go-map').addEventListener('click', goMap);
    document.getElementById('btn-go-stats').addEventListener('click', goStats);
    document.getElementById('btn-go-badges').addEventListener('click', goBadges);
    document.getElementById('btn-go-history').addEventListener('click', goHistory);

    document.querySelectorAll('[data-back-to]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-back-to');
        if (target === 'home') goHome();
      });
    });

    document.getElementById('btn-reset-progress').addEventListener('click', () => {
      UI.showConfirm('Reset semua progres belajar? Tindakan ini tidak bisa dibatalkan.', () => {
        Storage.resetProgress();
        UI.toast('Progres berhasil direset.');
        goHome();
      });
    });

    document.getElementById('btn-quiz-exit').addEventListener('click', () => {
      UI.showConfirm('Keluar dari level ini? Progres level ini tidak akan disimpan.', () => {
        goHome();
      });
    });

    document.getElementById('btn-theme-toggle').addEventListener('click', () => {
      const state = Storage.getState();
      Storage.setDarkMode(!state.darkMode);
      UI.applyTheme();
      SoundFx.playClick();
    });
  }

  /* ============ INIT ============ */
  function init() {
    UI.applyTheme();
    bindEvents();
    goHome();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
