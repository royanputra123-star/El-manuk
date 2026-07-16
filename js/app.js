// js/app.js
// Logika Aplikasi Utama & Kuis Belajar Bahasa Jepang (Minna no Nihongo Bab 8 & Bab 7)

(function (global) {
  let activeScreen = 'screen-home';
  let currentLevelNum = 1;
  let currentQuestions = [];
  let currentQuestionIdx = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let currentLives = 3;
  let currentController = null;
  let isAnswerChecked = false;

  function getCurrentLevelData(chapter, levelNum) {
    if (chapter === 'bab7') {
      if (global.LEVELS_BAB7_DATA && global.LEVELS_BAB7_DATA[levelNum - 1]) {
        return global.LEVELS_BAB7_DATA[levelNum - 1];
      }
    }
    // Default to Bab 8
    if (global.LEVELS_DATA && global.LEVELS_DATA[levelNum - 1]) {
      return global.LEVELS_DATA[levelNum - 1];
    }
    return null;
  }

  function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));

    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
    activeScreen = screenId;

    if (global.AudioManager) AudioManager.stopAudio();

    const progress = StorageManager.getProgress();

    if (screenId === 'screen-home') {
      UIManager.renderHomeScreen(progress);
    } else if (screenId === 'screen-map') {
      UIManager.renderLevelMap(progress, (lvl) => startQuiz(lvl));
    } else if (screenId === 'screen-stats') {
      UIManager.renderStatsScreen(progress);
    } else if (screenId === 'screen-badges') {
      UIManager.renderBadgesScreen(progress);
    } else if (screenId === 'screen-history') {
      UIManager.renderHistoryScreen(progress);
    }
  }

  /* ==================== QUIZ SESSION ==================== */

  function startQuiz(levelNum) {
    const progress = StorageManager.getProgress();
    const activeChapter = progress.activeChapter || 'bab8';
    const levelData = getCurrentLevelData(activeChapter, levelNum);

    if (!levelData || !levelData.questions || levelData.questions.length === 0) {
      UIManager.showToast(`Data untuk Level ${levelNum} tidak ditemukan!`);
      return;
    }

    currentLevelNum = levelNum;
    currentQuestions = levelData.questions;
    currentQuestionIdx = 0;
    correctCount = 0;
    wrongCount = 0;
    currentLives = 3;

    showScreen('screen-quiz');
    updateHeartsUI();
    renderActiveQuestion();
  }

  function updateHeartsUI() {
    const heartsEl = document.getElementById('quiz-lives');
    if (heartsEl) heartsEl.textContent = currentLives;
  }

  function updateQuizProgressBar() {
    const fill = document.getElementById('quiz-progress-fill');
    if (!fill) return;
    const pct = (currentQuestionIdx / currentQuestions.length) * 100;
    fill.style.width = `${pct}%`;
  }

  function renderActiveQuestion() {
    isAnswerChecked = false;
    updateQuizProgressBar();

    const q = currentQuestions[currentQuestionIdx];
    const container = document.getElementById('quiz-body');
    const btnCheck = document.getElementById('btn-quiz-check');
    const feedbackEl = document.getElementById('quiz-feedback');

    if (feedbackEl) {
      feedbackEl.className = 'quiz-feedback';
      feedbackEl.innerHTML = '';
    }

    if (btnCheck) {
      btnCheck.textContent = 'Periksa';
      btnCheck.disabled = true;
      btnCheck.className = 'btn btn-primary btn-lg btn-block';
    }

    global.__onSelectionChange = () => {
      if (isAnswerChecked) return;
      if (currentController) {
        btnCheck.disabled = !currentController.isComplete();
      }
    };

    currentController = QuestionRenderer.renderQuestion(container, q);
  }

  function handleCheckAnswer() {
    if (!currentController) return;

    const btnCheck = document.getElementById('btn-quiz-check');
    const feedbackEl = document.getElementById('quiz-feedback');

    if (!isAnswerChecked) {
      isAnswerChecked = true;
      const isCorrect = currentController.checkCorrect();

      currentController.reveal(isCorrect);

      if (isCorrect) {
        correctCount++;
        if (global.SoundFx) SoundFx.playCorrect();
        if (feedbackEl) {
          feedbackEl.className = 'quiz-feedback feedback-correct';
          feedbackEl.innerHTML = '✨ <strong>Benar!</strong> Jawaban kamu tepat.';
        }
      } else {
        wrongCount++;
        currentLives = Math.max(0, currentLives - 1);
        updateHeartsUI();
        if (global.SoundFx) SoundFx.playWrong();
        if (feedbackEl) {
          feedbackEl.className = 'quiz-feedback feedback-wrong';
          feedbackEl.innerHTML = '❌ <strong>Kurang tepat.</strong> Perhatikan kembali.';
        }
      }

      btnCheck.textContent = currentQuestionIdx === currentQuestions.length - 1 ? 'Selesai ▶' : 'Lanjut ▶';
      btnCheck.disabled = false;
    } else {
      currentQuestionIdx++;
      if (currentQuestionIdx < currentQuestions.length) {
        renderActiveQuestion();
      } else {
        finishQuiz();
      }
    }
  }

  function finishQuiz() {
    if (global.AudioManager) AudioManager.stopAudio();

    const totalQuestions = currentQuestions.length;
    const scorePct = Math.round((correctCount / totalQuestions) * 100);
    const xpGained = correctCount * 10 + (scorePct >= 80 ? 50 : 0);

    const progress = StorageManager.getProgress();
    const activeChapter = progress.activeChapter || 'bab8';

    const { earnedBadge } = StorageManager.markLevelComplete(
      activeChapter,
      currentLevelNum,
      scorePct,
      xpGained,
      correctCount,
      wrongCount
    );

    // Update Result UI
    const elSub = document.getElementById('result-subtitle');
    const elPct = document.getElementById('result-percentage');
    const elCorr = document.getElementById('result-correct');
    const elWrong = document.getElementById('result-wrong');
    const elXp = document.getElementById('result-xp');
    const elScore = document.getElementById('result-score');
    const badgeBox = document.getElementById('result-badge-earned');
    const badgeName = document.getElementById('result-badge-name');

    if (elSub) elSub.textContent = `Level ${currentLevelNum} (${activeChapter.toUpperCase()})`;
    if (elPct) elPct.textContent = `${scorePct}%`;
    if (elCorr) elCorr.textContent = correctCount;
    if (elWrong) elWrong.textContent = wrongCount;
    if (elXp) elXp.textContent = `+${xpGained}`;
    if (elScore) elScore.textContent = scorePct;

    if (earnedBadge && badgeBox && badgeName) {
      badgeName.textContent = `${earnedBadge.icon} ${earnedBadge.name}`;
      badgeBox.classList.remove('hidden');
    } else if (badgeBox) {
      badgeBox.classList.add('hidden');
    }

    if (scorePct >= 60) {
      if (global.fireConfetti) fireConfetti();
      if (global.SoundFx) SoundFx.playFanfare();
    }

    showScreen('screen-result');
  }

  /* ==================== INITIALIZATION & EVENT LISTENERS ==================== */

  function initApp() {
    const progress = StorageManager.getProgress();

    // Event listeners untuk Chapter Switcher (Bab 7 & Bab 8)
    const btnBab7 = document.getElementById('btn-chap-bab7');
    const btnBab8 = document.getElementById('btn-chap-bab8');

    if (btnBab7) {
      btnBab7.addEventListener('click', () => {
        StorageManager.setActiveChapter('bab7');
        const p = StorageManager.getProgress();
        UIManager.renderHomeScreen(p);
        UIManager.showToast('Beralih ke Minna no Nihongo Bab 7');
      });
    }

    if (btnBab8) {
      btnBab8.addEventListener('click', () => {
        StorageManager.setActiveChapter('bab8');
        const p = StorageManager.getProgress();
        UIManager.renderHomeScreen(p);
        UIManager.showToast('Beralih ke Minna no Nihongo Bab 8');
      });
    }

    // Navigasi Tombol Utama
    document.getElementById('btn-continue')?.addEventListener('click', () => {
      const p = StorageManager.getProgress();
      const ch = p.activeChapter || 'bab8';
      const lastLvl = p.lastLevel[ch] || 1;
      startQuiz(lastLvl);
    });

    document.getElementById('btn-go-map')?.addEventListener('click', () => showScreen('screen-map'));
    document.getElementById('btn-go-stats')?.addEventListener('click', () => showScreen('screen-stats'));
    document.getElementById('btn-go-badges')?.addEventListener('click', () => showScreen('screen-badges'));
    document.getElementById('btn-go-history')?.addEventListener('click', () => showScreen('screen-history'));

    // Navigasi Tombol Back
    document.querySelectorAll('[data-back-to]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-back-to');
        showScreen('screen-' + target);
      });
    });

    // Quiz Control Buttons
    document.getElementById('btn-quiz-check')?.addEventListener('click', handleCheckAnswer);
    document.getElementById('btn-quiz-exit')?.addEventListener('click', () => {
      if (confirm('Apakah kamu yakin ingin keluar dari kuis? Progress level ini tidak disimpan.')) {
        showScreen('screen-home');
      }
    });

    // Result Buttons
    document.getElementById('btn-result-retry')?.addEventListener('click', () => startQuiz(currentLevelNum));
    document.getElementById('btn-result-next')?.addEventListener('click', () => {
      const nextLvl = Math.min(50, currentLevelNum + 1);
      startQuiz(nextLvl);
    });
    document.getElementById('btn-result-home')?.addEventListener('click', () => showScreen('screen-home'));

    // Reset Progress Dialog
    const btnReset = document.getElementById('btn-reset-progress');
    const dialog = document.getElementById('confirm-dialog');
    const btnCancel = document.getElementById('confirm-cancel');
    const btnOk = document.getElementById('confirm-ok');

    if (btnReset && dialog) {
      btnReset.addEventListener('click', () => dialog.classList.remove('hidden'));
    }
    if (btnCancel && dialog) {
      btnCancel.addEventListener('click', () => dialog.classList.add('hidden'));
    }
    if (btnOk && dialog) {
      btnOk.addEventListener('click', () => {
        StorageManager.resetProgress();
        dialog.classList.add('hidden');
        UIManager.showToast('Progress telah direset.');
        showScreen('screen-home');
      });
    }

    // Dark Theme Toggle
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('nihongo_theme', isDark ? 'dark' : 'light');
      });
      if (localStorage.getItem('nihongo_theme') === 'dark') {
        document.body.classList.add('dark-theme');
      }
    }

    // Initial Screen Load
    showScreen('screen-home');
  }

  document.addEventListener('DOMContentLoaded', initApp);

  global.App = { startQuiz, showScreen };
})(window);
