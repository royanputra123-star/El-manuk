// js/app.js
// Logika Aplikasi Utama & Kuis Belajar Bahasa Jepang (Minna no Nihongo Bab 10, Bab 9, Bab 8 & Bab 7)

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

  /* --- Mode Random Quiz (15 soal acak dari seluruh level bab aktif) --- */
  let isRandomQuiz = false;
  let randomChapter = null;
  let randomResumeState = null; // { idx, correct, wrong, lives } saat melanjutkan sesi

  const DEFAULT_CHAPTER = 'bab13';

  // Pemetaan bab -> data bank soal (Bab 10 = bab terbaru)
  const CHAPTER_LEVEL_DATA = {
    bab13: 'LEVELS_BAB13_DATA',
    bab12: 'LEVELS_BAB12_DATA',
    bab11: 'LEVELS_BAB11_DATA',
    bab10: 'LEVELS_BAB10_DATA',
    bab9: 'LEVELS_BAB9_DATA',
    bab8: 'LEVELS_DATA',
    bab7: 'LEVELS_BAB7_DATA'
  };

  function getCurrentLevelData(chapter, levelNum) {
    const key = CHAPTER_LEVEL_DATA[chapter] || CHAPTER_LEVEL_DATA[DEFAULT_CHAPTER];
    const bank = global[key];

    if (bank && bank[levelNum - 1]) return bank[levelNum - 1];

    // Fallback: coba bab lain agar level tetap bisa dimainkan
    for (const ch of Object.keys(CHAPTER_LEVEL_DATA)) {
      const alt = global[CHAPTER_LEVEL_DATA[ch]];
      if (alt && alt[levelNum - 1]) return alt[levelNum - 1];
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
    } else if (screenId === 'screen-result') {
      renderResultScreen();
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
    const activeChapter = progress.activeChapter || DEFAULT_CHAPTER;
    const levelData = getCurrentLevelData(activeChapter, levelNum);

    if (!levelData || !levelData.questions || levelData.questions.length === 0) {
      UIManager.showToast(`Data untuk Level ${levelNum} tidak ditemukan!`);
      return;
    }

    isRandomQuiz = false;
    randomChapter = null;
    randomResumeState = null;
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

  /* ==================== 🎲 RANDOM QUIZ (15 SOAL) ==================== */

  function getChapterBank(chapter) {
    const key = CHAPTER_LEVEL_DATA[chapter];
    const bank = key && global[key];
    return Array.isArray(bank) ? bank : [];
  }

  function chapterLabel(chapter) {
    const meta = global.UIManager && UIManager.getChapterMeta
      ? UIManager.getChapterMeta(chapter)
      : null;
    return meta ? meta.label : String(chapter || '').toUpperCase();
  }

  // Mulai sesi Random Quiz baru (selalu mengacak ulang 15 soal).
  function startRandomQuiz() {
    const progress = StorageManager.getProgress();
    const chapter = progress.activeChapter || DEFAULT_CHAPTER;
    const bank = getChapterBank(chapter);

    if (!global.RandomQuiz) {
      UIManager.showToast('Modul Random Quiz belum tersedia.');
      return;
    }

    const questions = RandomQuiz.pickQuestions(bank, RandomQuiz.SESSION_SIZE);
    if (!questions.length) {
      UIManager.showToast('Bank soal bab ini tidak ditemukan.');
      return;
    }

    RandomQuiz.saveSession({
      chapter: chapter,
      ids: questions.map((q, i) => q.id || 'anon_' + i),
      startedAt: Date.now()
    });

    isRandomQuiz = true;
    randomChapter = chapter;
    randomResumeState = null;
    currentLevelNum = 0;
    currentQuestions = questions;
    currentQuestionIdx = 0;
    correctCount = 0;
    wrongCount = 0;
    currentLives = 3;

    showScreen('screen-quiz');
    updateHeartsUI();
    renderActiveQuestion();
    UIManager.showToast(`🎲 Random Quiz ${chapterLabel(chapter)} — ${questions.length} soal acak`);
  }

  // Lanjutkan sesi Random Quiz yang tersimpan (dipakai setelah refresh).
  function resumeRandomQuiz() {
    const saved = global.RandomQuiz && RandomQuiz.loadSession();
    if (!saved) return false;

    const chapter = saved.chapter;
    const questions = RandomQuiz.resolveSession(saved, getChapterBank(chapter));
    if (!questions || !questions.length) {
      RandomQuiz.clearSession();
      return false;
    }

    const st = saved.state || {};
    isRandomQuiz = true;
    randomChapter = chapter;
    randomResumeState = {
      idx: Math.min(Math.max(0, st.idx || 0), questions.length - 1),
      correct: Math.max(0, st.correct || 0),
      wrong: Math.max(0, st.wrong || 0),
      lives: typeof st.lives === 'number' ? st.lives : 3
    };
    currentLevelNum = 0;
    currentQuestions = questions;
    currentQuestionIdx = randomResumeState.idx;
    correctCount = randomResumeState.correct;
    wrongCount = randomResumeState.wrong;
    currentLives = randomResumeState.lives;

    showScreen('screen-quiz');
    updateHeartsUI();
    renderActiveQuestion();
    UIManager.showToast(`🎲 Melanjutkan Random Quiz ${chapterLabel(chapter)} — soal ${currentQuestionIdx + 1}/${questions.length}`);
    return true;
  }

  function persistRandomProgress() {
    if (!isRandomQuiz || !global.RandomQuiz) return;
    RandomQuiz.saveSession({
      chapter: randomChapter,
      ids: currentQuestions.map((q, i) => q.id || 'anon_' + i),
      startedAt: Date.now(),
      state: {
        idx: currentQuestionIdx,
        correct: correctCount,
        wrong: wrongCount,
        lives: currentLives
      }
    });
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

    const modeEl = document.getElementById('quiz-mode-label');
    if (modeEl) {
      if (isRandomQuiz) {
        modeEl.textContent = `🎲 Soal ${Math.min(currentQuestionIdx + 1, currentQuestions.length)}/${currentQuestions.length}`;
        modeEl.classList.remove('hidden');
      } else {
        modeEl.classList.add('hidden');
      }
    }
  }

  function renderActiveQuestion() {
    isAnswerChecked = false;
    updateQuizProgressBar();
    persistRandomProgress();

    const q = currentQuestions[currentQuestionIdx];
    const container = document.getElementById('quiz-body');
    const btnCheck = document.getElementById('btn-quiz-check');
    const feedbackEl = document.getElementById('quiz-feedback');

    if (feedbackEl) {
      feedbackEl.className = 'quiz-feedback';
      feedbackEl.innerHTML = '';
    }

    const translationPanel = document.getElementById('quiz-translation-panel');
    if (translationPanel) {
      translationPanel.innerHTML = '';
      translationPanel.classList.add('hidden');
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
      const q = currentQuestions[currentQuestionIdx];
      const translationPanel = document.getElementById('quiz-translation-panel');

      currentController.reveal(isCorrect);

      if (isCorrect) {
        correctCount++;
        if (global.SoundFx) SoundFx.playCorrect();
      } else {
        wrongCount++;
        currentLives = Math.max(0, currentLives - 1);
        updateHeartsUI();
        if (global.SoundFx) SoundFx.playWrong();
      }

      /* --- Tampilan terjemahan setelah menjawab -------------------------
       * Kotak feedback : status + terjemahan Bahasa Indonesia + cara baca.
       * Panel di bawahnya : rincian per baris untuk percakapan & susun kata. */
      if (global.TranslationHelper) {
        TranslationHelper.renderFeedback(feedbackEl, q, isCorrect);
        TranslationHelper.renderDetail(translationPanel, q);
      } else if (feedbackEl) {
        feedbackEl.className = 'quiz-feedback ' + (isCorrect ? 'feedback-correct' : 'feedback-wrong');
        feedbackEl.innerHTML = isCorrect
          ? '✨ <strong>Benar!</strong> Jawaban kamu tepat.'
          : '❌ <strong>Kurang tepat.</strong> Perhatikan kembali.';
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

    if (isRandomQuiz) {
      finishRandomQuiz();
      return;
    }

    const totalQuestions = currentQuestions.length;
    const scorePct = Math.round((correctCount / totalQuestions) * 100);
    const xpGained = correctCount * 10 + (scorePct >= 80 ? 50 : 0);

    const progress = StorageManager.getProgress();
    const activeChapter = progress.activeChapter || DEFAULT_CHAPTER;

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
      try { if (global.fireConfetti) fireConfetti(); } catch (e) { /* efek visual opsional */ }
      try { if (global.SoundFx) SoundFx.playFanfare(); } catch (e) { /* audio opsional */ }
    }

    showScreen('screen-result');
  }

  /* -------------------- Hasil Random Quiz 15 soal -------------------- */

  function finishRandomQuiz() {
    const totalQuestions = currentQuestions.length;
    const scorePct = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const xpGained = correctCount * 10 + (scorePct >= 80 ? 50 : 0);
    const chapter = randomChapter || StorageManager.getProgress().activeChapter || DEFAULT_CHAPTER;

    // Hasil Random Quiz ikut tercatat di XP, statistik, badge, dan riwayat —
    // memakai fungsi penyimpanan yang sama, tanpa mengubah progres level.
    const { earnedBadge } = StorageManager.recordRandomQuiz(
      chapter,
      scorePct,
      xpGained,
      correctCount,
      wrongCount,
      totalQuestions
    );

    RandomQuiz.clearSession();
    randomResumeState = null;

    const elSub = document.getElementById('result-subtitle');
    if (elSub) elSub.textContent = `🎲 Random Quiz — ${chapterLabel(chapter)} · ${totalQuestions} soal`;

    const badgeBox = document.getElementById('result-badge-earned');
    const badgeName = document.getElementById('result-badge-name');
    if (earnedBadge && badgeBox && badgeName) {
      badgeName.textContent = `${earnedBadge.icon} ${earnedBadge.name}`;
      badgeBox.classList.remove('hidden');
    } else if (badgeBox) {
      badgeBox.classList.add('hidden');
    }

    if (scorePct >= 60) {
      try { if (global.fireConfetti) fireConfetti(); } catch (e) { /* efek visual opsional */ }
      try { if (global.SoundFx) SoundFx.playFanfare(); } catch (e) { /* audio opsional */ }
    }

    renderResultScreen();
    showScreen('screen-result');
  }

  // Isi angka-angka di layar hasil (dipakai kuis level maupun Random Quiz).
  function renderResultScreen() {
    const totalQuestions = currentQuestions.length || 1;
    const scorePct = Math.round((correctCount / totalQuestions) * 100);
    const xpGained = correctCount * 10 + (scorePct >= 80 ? 50 : 0);
    const isPerfect = totalQuestions > 1 && correctCount === totalQuestions;

    const elPct = document.getElementById('result-percentage');
    const elCorr = document.getElementById('result-correct');
    const elWrong = document.getElementById('result-wrong');
    const elXp = document.getElementById('result-xp');
    const elScore = document.getElementById('result-score');
    const elTitle = document.getElementById('result-title');
    const elEmblem = document.getElementById('result-emblem');

    if (elPct) elPct.textContent = `${scorePct}%`;
    if (elCorr) elCorr.textContent = correctCount;
    if (elWrong) elWrong.textContent = wrongCount;
    if (elXp) elXp.textContent = `+${xpGained}`;
    if (elScore) elScore.textContent = scorePct;

    if (elTitle) {
      if (isRandomQuiz) elTitle.textContent = scorePct >= 60 ? 'Random Quiz Selesai!' : 'Random Quiz Selesai';
      else elTitle.textContent = 'Level Selesai!';
    }
    if (elEmblem) elEmblem.textContent = scorePct >= 80 ? '🏆' : (scorePct >= 60 ? '🎉' : '💪');

    const retry = document.getElementById('btn-result-retry');
    if (retry) retry.textContent = isRandomQuiz ? '🎲 Ulangi Random Quiz' : '🔄 Ulangi Level';

    const next = document.getElementById('btn-result-next');
    if (next) {
      if (isRandomQuiz) {
        next.textContent = 'Kembali ke Halaman Bab';
        next.classList.remove('hidden');
      } else {
        const chapter = StorageManager.getProgress().activeChapter || DEFAULT_CHAPTER;
        const bank = getChapterBank(chapter);
        const total = bank.length || 50;
        next.textContent = currentLevelNum >= total ? 'Kembali ke Halaman Bab' : 'Lanjut ▶';
        next.classList.remove('hidden');
      }
    }

    const home = document.getElementById('btn-result-home');
    if (home) home.textContent = isRandomQuiz ? 'Kembali ke Home' : 'Kembali ke Home';
  }


  /* ==================== INITIALIZATION & EVENT LISTENERS ==================== */

  function initApp() {
    const progress = StorageManager.getProgress();

    // Event listeners untuk Chapter Switcher (Bab 10, Bab 9, Bab 8 & Bab 7)
    const chapterList = (global.UIManager && UIManager.CHAPTERS) || [
      { id: 'bab13', label: 'Bab 13' }, { id: 'bab12', label: 'Bab 12' }, { id: 'bab11', label: 'Bab 11' }, { id: 'bab10', label: 'Bab 10' }, { id: 'bab9', label: 'Bab 9' },
      { id: 'bab8', label: 'Bab 8' }, { id: 'bab7', label: 'Bab 7' }
    ];

    chapterList.forEach(c => {
      const btn = document.getElementById('btn-chap-' + c.id);
      if (!btn) return;
      btn.addEventListener('click', () => {
        StorageManager.setActiveChapter(c.id);
        const p = StorageManager.getProgress();
        UIManager.renderHomeScreen(p);
        UIManager.showToast(`Beralih ke Minna no Nihongo ${c.label}`);
      });
    });

    // Navigasi Tombol Utama
    document.getElementById('btn-continue')?.addEventListener('click', () => {
      const p = StorageManager.getProgress();
      const ch = p.activeChapter || DEFAULT_CHAPTER;
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
      const msg = isRandomQuiz
        ? 'Apakah kamu yakin ingin keluar dari Random Quiz? Sesi ini bisa dilanjutkan lagi nanti.'
        : 'Apakah kamu yakin ingin keluar dari kuis? Progress level ini tidak disimpan.';
      if (confirm(msg)) {
        if (isRandomQuiz) persistRandomProgress();
        showScreen('screen-home');
      }
    });

    // Result Buttons
    document.getElementById('btn-result-retry')?.addEventListener('click', () => {
      if (isRandomQuiz) startRandomQuiz();
      else startQuiz(currentLevelNum);
    });
    document.getElementById('btn-result-next')?.addEventListener('click', () => {
      if (isRandomQuiz) { showScreen('screen-home'); return; }
      const p = StorageManager.getProgress();
      const ch = p.activeChapter || DEFAULT_CHAPTER;
      const bank = global[CHAPTER_LEVEL_DATA[ch]] || [];
      const total = bank.length || 50;
      if (currentLevelNum >= total) {
        showScreen('screen-home');
        return;
      }
      startQuiz(currentLevelNum + 1);
    });
    document.getElementById('btn-result-home')?.addEventListener('click', () => showScreen('screen-home'));

    // 🎲 Random Quiz — tombol di halaman bab
    document.getElementById('btn-random-quiz')?.addEventListener('click', () => {
      if (global.SoundFx) SoundFx.playClick();
      startRandomQuiz();
    });
    document.getElementById('btn-random-resume')?.addEventListener('click', () => {
      if (global.SoundFx) SoundFx.playClick();
      if (resumeRandomQuiz()) showScreen('screen-quiz');
    });

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

    // Setelah refresh: bila ada sesi Random Quiz yang belum selesai,
    // beri tahu pengguna bahwa sesi bisa dilanjutkan (tombol "Lanjutkan Sesi").
    const saved = global.RandomQuiz && RandomQuiz.loadSession();
    if (saved) {
      const questions = RandomQuiz.resolveSession(saved, getChapterBank(saved.chapter));
      const idx = (saved.state && saved.state.idx) || 0;
      if (questions && questions.length && idx < questions.length) {
        UIManager.showToast(`🎲 Sesi Random Quiz tersimpan (soal ${idx + 1}/${questions.length}). Tekan "Lanjutkan Sesi".`);
      } else if (!questions) {
        RandomQuiz.clearSession();
      }
    }
  }

  document.addEventListener('DOMContentLoaded', initApp);

  global.App = {
    startQuiz,
    showScreen,
    startRandomQuiz,
    resumeRandomQuiz,
    isRandomMode: () => isRandomQuiz,
    // Dipakai oleh tes otomatis untuk memeriksa isi sesi Random Quiz.
    __randomQuestions: () => currentQuestions.slice()
  };
})(window);
