// questions.js
// Render & evaluasi setiap jenis soal. Setiap render*Question mengembalikan
// sebuah controller object: { isComplete(), checkCorrect(), reveal(isCorrect) }
//
// ============================================================================
// INTEGRASI AUDIO (Web Speech API):
// Semua audio di file ini WAJIB melalui `AudioManager` (js/audioManager.js).
// Tidak ada kode `speechSynthesis` langsung di sini — supaya satu sumber audio
// dipakai di seluruh tipe soal (menghindari duplikasi & audio bertumpuk).
// ============================================================================

(function (global) {
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function shuffleArr(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ==========================================================================
     AUDIO HELPERS
     ========================================================================== */

  /**
   * Membuat tombol speaker (🔊) yang memutar teks Jepang tertentu melalui
   * AudioManager. Menangani animasi ikon & disable-selama-diputar secara mandiri
   * (sesuai kebutuhan UX poin 9: ikon berdenyut saat main, replay nonaktif saat main).
   *
   * @param {string} text - Teks Jepang yang dibacakan saat tombol ditekan.
   * @param {Object} [opts]
   * @param {'sm'|'md'|'lg'} [opts.size='md']
   * @param {string} [opts.label='Putar audio']
   */
  function buildSpeakerButton(text, opts) {
    const options = opts || {};
    const size = options.size || 'md';
    const btn = el('button', 'speaker-btn speaker-btn-' + size);
    btn.type = 'button';
    btn.setAttribute('aria-label', options.label || 'Putar audio');
    btn.innerHTML = '<span class="speaker-icon">🔊</span>';
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // cegah trigger klik elemen pembungkus (mis. kartu tile)
      speakWithFeedback(text, btn);
    });
    return btn;
  }

  /**
   * Memutar teks Jepang via AudioManager sambil memberi umpan balik visual pada
   * tombol terkait (animasi + nonaktif sementara). Aman dipanggil berkali-kali;
   * AudioManager otomatis menghentikan audio sebelumnya agar tidak bertumpuk.
   */
  function speakWithFeedback(text, buttonEl) {
    if (!text || !global.AudioManager || !AudioManager.isSupported()) return;
    if (buttonEl) {
      buttonEl.classList.add('speaker-playing');
      buttonEl.disabled = true;
    }
    AudioManager.playJapanese(text, {
      onEnd: () => {
        if (buttonEl) {
          buttonEl.classList.remove('speaker-playing');
          buttonEl.disabled = false;
        }
      },
    });
  }

  /**
   * Menjadwalkan auto-play SATU KALI untuk sebuah soal yang baru muncul, dengan
   * mensimulasikan klik pada tombol speaker utama supaya animasi & state tombol
   * tetap konsisten dengan pemutaran manual.
   */
  function scheduleAutoPlay(buttonEl) {
    if (!buttonEl || !global.AudioManager || !AudioManager.isSupported()) return;
    setTimeout(() => buttonEl.click(), 350);
  }

  /* ============ ARRANGE & TRANSLATE (susun kata) ============ */
  function renderTileArrange(container, q) {
    const wrap = el('div', 'q-block');

    const instrRow = el('div', 'q-instruction-row');
    instrRow.appendChild(el('p', 'q-instruction', q.instruction));
    // Tombol audio utama: memperdengarkan kalimat lengkap yang benar (bantuan
    // dengar & lafal), sekaligus diputar otomatis satu kali saat soal muncul.
    const fullSentenceText = q.answer.join('');
    const mainSpeaker = buildSpeakerButton(fullSentenceText, { size: 'lg', label: 'Putar kalimat' });
    instrRow.appendChild(mainSpeaker);
    wrap.appendChild(instrRow);

    if (q.type === 'translate') {
      const promptCard = el('div', 'q-prompt-card');
      promptCard.appendChild(el('p', null, q.prompt));
      wrap.appendChild(promptCard);
    }

    const answerZone = el('div', 'tile-answer-zone');
    const bankZone = el('div', 'tile-bank-zone');

    let selected = []; // array of {token, idx}
    const usedIdx = new Set();
    const shuffledTiles = q.tiles;
    const tileReadingOf = (token) => {
      // cari bacaan tile jika tersedia dari data generator; jika tidak, gunakan teks aslinya
      const idx = q.tiles.indexOf(token);
      return (q.tileReadings && q.tileReadings[idx]) || token;
    };

    function refreshBank() {
      bankZone.innerHTML = '';
      shuffledTiles.forEach((token, idx) => {
        if (usedIdx.has(idx)) return;
        const t = el('button', 'tile', token);
        t.type = 'button';
        t.addEventListener('click', () => {
          // Setiap kartu kata yang disentuh langsung dibacakan (sesuai spesifikasi).
          speakWithFeedback(token, t);
          usedIdx.add(idx);
          selected.push({ token, idx });
          renderAnswer();
          refreshBank();
          global.__onSelectionChange && global.__onSelectionChange();
        });
        bankZone.appendChild(t);
      });
    }

    function renderAnswer() {
      answerZone.innerHTML = '';
      if (selected.length === 0) {
        answerZone.appendChild(el('span', 'tile-answer-placeholder', 'Ketuk kata di bawah untuk menyusun kalimat'));
      }
      selected.forEach((s, pos) => {
        const t = el('button', 'tile tile-selected', s.token);
        t.type = 'button';
        t.addEventListener('click', () => {
          speakWithFeedback(s.token, t);
          usedIdx.delete(s.idx);
          selected.splice(pos, 1);
          renderAnswer();
          refreshBank();
          global.__onSelectionChange && global.__onSelectionChange();
        });
        answerZone.appendChild(t);
      });
    }

    wrap.appendChild(answerZone);
    wrap.appendChild(el('div', 'tile-divider'));
    wrap.appendChild(bankZone);
    container.appendChild(wrap);

    renderAnswer();
    refreshBank();

    // Audio otomatis satu kali ketika soal muncul.
    scheduleAutoPlay(mainSpeaker);

    return {
      isComplete: () => selected.length === q.answer.length,
      checkCorrect: () => {
        const chosen = selected.map(s => s.token);
        return JSON.stringify(chosen) === JSON.stringify(q.answer);
      },
      reveal: (isCorrect) => {
        answerZone.classList.add(isCorrect ? 'zone-correct' : 'zone-wrong');
        if (!isCorrect) {
          const correctLine = el('div', 'answer-reveal', 'Jawaban benar: ' + q.answer.join(' '));
          wrap.appendChild(correctLine);
        }
      },
      onExit: () => AudioManager && AudioManager.stopAudio(),
    };
  }

  /* ============ MATCH (mencocokkan kosakata) ============ */
  function renderMatch(container, q) {
    const wrap = el('div', 'q-block');
    wrap.appendChild(el('p', 'q-instruction', q.instruction));

    const matchArea = el('div', 'match-area');
    const leftCol = el('div', 'match-col');
    const rightCol = el('div', 'match-col');

    const leftItems = q.pairs.map((p, i) => ({ ...p, uid: 'L' + i }));
    const rightItemsShuffled = shuffleArr(q.pairs.map((p, i) => ({ ...p, uid: 'R' + i })));

    let selectedLeft = null;
    let selectedRight = null;
    let matchedCount = 0;
    let mistakes = 0;
    const leftButtons = {};
    const rightButtons = {};

    leftItems.forEach(item => {
      const b = el('button', 'match-item', item.jp);
      b.type = 'button';
      b.dataset.vocabId = item.vocabId;
      b.addEventListener('click', () => {
        if (b.classList.contains('matched')) return;
        // Setiap kartu kata Jepang yang disentuh langsung dibacakan.
        speakWithFeedback(item.jp, b);
        Object.values(leftButtons).forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        selectedLeft = item;
        tryMatch();
      });
      leftButtons[item.vocabId] = b;
      leftCol.appendChild(b);
    });

    rightItemsShuffled.forEach(item => {
      const b = el('button', 'match-item', item.id);
      b.type = 'button';
      b.dataset.vocabId = item.vocabId;
      b.addEventListener('click', () => {
        if (b.classList.contains('matched')) return;
        Object.values(rightButtons).forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        selectedRight = item;
        tryMatch();
      });
      rightButtons[item.vocabId] = b;
      rightCol.appendChild(b);
    });

    function tryMatch() {
      if (!selectedLeft || !selectedRight) return;
      if (selectedLeft.vocabId === selectedRight.vocabId) {
        leftButtons[selectedLeft.vocabId].classList.remove('selected');
        rightButtons[selectedRight.vocabId].classList.remove('selected');
        leftButtons[selectedLeft.vocabId].classList.add('matched');
        rightButtons[selectedRight.vocabId].classList.add('matched');
        matchedCount++;
        SoundFx.playClick();
      } else {
        mistakes++;
        const lb = leftButtons[selectedLeft.vocabId];
        const rb = rightButtons[selectedRight.vocabId];
        lb.classList.add('shake-wrong');
        rb.classList.add('shake-wrong');
        setTimeout(() => {
          lb.classList.remove('shake-wrong', 'selected');
          rb.classList.remove('shake-wrong', 'selected');
        }, 400);
      }
      selectedLeft = null;
      selectedRight = null;
      global.__onSelectionChange && global.__onSelectionChange();
    }

    matchArea.appendChild(leftCol);
    matchArea.appendChild(rightCol);
    wrap.appendChild(matchArea);
    wrap.appendChild(el('p', 'match-hint', 'Ketuk kata Jepang untuk mendengar & lalu artinya untuk mencocokkan.'));
    container.appendChild(wrap);

    return {
      isComplete: () => matchedCount === q.pairs.length,
      checkCorrect: () => mistakes === 0,
      reveal: (isCorrect) => {
        if (!isCorrect) {
          wrap.appendChild(el('div', 'answer-reveal', `Ada ${mistakes} pasangan yang salah dicoba, tapi semua sudah dicocokkan.`));
        }
      },
      onExit: () => AudioManager && AudioManager.stopAudio(),
    };
  }

  /* ============ COMPLETE (melengkapi kalimat) ============ */
  function renderComplete(container, q) {
    const wrap = el('div', 'q-block');

    const instrRow = el('div', 'q-instruction-row');
    instrRow.appendChild(el('p', 'q-instruction', q.instruction));
    // Audio utama: membacakan bagian kalimat yang sudah terlihat (tanpa bagian
    // kosong), agar tidak membocorkan jawaban sebelum dijawab.
    const visibleText = q.prompt.replace('______', '').trim();
    const mainSpeaker = buildSpeakerButton(visibleText, { size: 'lg', label: 'Putar kalimat' });
    instrRow.appendChild(mainSpeaker);
    wrap.appendChild(instrRow);

    const promptCard = el('div', 'q-prompt-card q-prompt-jp');
    promptCard.appendChild(el('p', null, q.prompt));
    wrap.appendChild(promptCard);

    const optionsWrap = el('div', 'options-grid');
    let selected = null;
    const buttons = [];

    q.options.forEach((opt, i) => {
      const b = el('button', 'option-btn', opt);
      b.type = 'button';
      b.addEventListener('click', () => {
        // Setiap opsi jawaban dibacakan saat disentuh — membantu membedakan lafal.
        speakWithFeedback(opt, b);
        buttons.forEach(x => x.classList.remove('option-selected'));
        b.classList.add('option-selected');
        selected = opt;
        global.__onSelectionChange && global.__onSelectionChange();
      });
      buttons.push(b);
      optionsWrap.appendChild(b);
    });

    wrap.appendChild(optionsWrap);
    container.appendChild(wrap);

    // Audio otomatis satu kali (bagian kalimat yang terlihat) ketika soal muncul.
    scheduleAutoPlay(mainSpeaker);

    return {
      isComplete: () => selected !== null,
      checkCorrect: () => selected === q.answer,
      reveal: (isCorrect) => {
        buttons.forEach(b => {
          if (b.textContent === q.answer) b.classList.add('option-correct');
          else if (b.textContent === selected && !isCorrect) b.classList.add('option-wrong');
        });
        if (q.translation) {
          wrap.appendChild(el('p', 'answer-translation', '"' + q.translation + '"'));
        }
        // Setelah dijawab, sediakan audio kalimat lengkap yang benar (aman
        // ditampilkan karena jawaban sudah terungkap).
        const fullText = q.fullSentenceText || (q.prompt.replace('______', q.answer));
        const revealRow = el('div', 'reveal-audio-row');
        revealRow.appendChild(el('span', 'reveal-audio-label', 'Dengarkan kalimat lengkap:'));
        revealRow.appendChild(buildSpeakerButton(fullText, { size: 'sm', label: 'Putar kalimat lengkap' }));
        wrap.appendChild(revealRow);
      },
      onExit: () => AudioManager && AudioManager.stopAudio(),
    };
  }

  /* ============ MULTIPLE CHOICE (arti kata) ============ */
  function renderMultipleChoice(container, q) {
    const wrap = el('div', 'q-block');
    wrap.appendChild(el('p', 'q-instruction', q.instruction));
    wrap.appendChild(el('div', 'q-prompt-card q-prompt-big', q.prompt.replace(/^"|"$/g, '')));

    const optionsWrap = el('div', 'options-grid');
    let selected = null;
    const buttons = [];

    q.options.forEach(opt => {
      const b = el('button', 'option-btn option-btn-jp', opt);
      b.type = 'button';
      b.addEventListener('click', () => {
        // Opsi kosakata Jepang dibacakan saat disentuh.
        speakWithFeedback(opt, b);
        buttons.forEach(x => x.classList.remove('option-selected'));
        b.classList.add('option-selected');
        selected = opt;
        global.__onSelectionChange && global.__onSelectionChange();
      });
      buttons.push(b);
      optionsWrap.appendChild(b);
    });

    wrap.appendChild(optionsWrap);
    container.appendChild(wrap);

    return {
      isComplete: () => selected !== null,
      checkCorrect: () => selected === q.answer,
      reveal: (isCorrect) => {
        buttons.forEach(b => {
          if (b.textContent === q.answer) b.classList.add('option-correct');
          else if (b.textContent === selected && !isCorrect) b.classList.add('option-wrong');
        });
      },
      onExit: () => AudioManager && AudioManager.stopAudio(),
    };
  }

  /* ============ TRUE / FALSE ============ */
  function renderTrueFalse(container, q) {
    const wrap = el('div', 'q-block');

    const instrRow = el('div', 'q-instruction-row');
    instrRow.appendChild(el('p', 'q-instruction', q.instruction));
    // Kata Jepang pada prompt sudah sepenuhnya terlihat (bukan bagian tersembunyi),
    // sehingga aman diputar otomatis — tidak membocorkan jawaban benar/salah.
    const jpWord = q.promptJp || q.prompt.split('=')[0].trim();
    const mainSpeaker = buildSpeakerButton(jpWord, { size: 'lg', label: 'Putar kata' });
    instrRow.appendChild(mainSpeaker);
    wrap.appendChild(instrRow);

    wrap.appendChild(el('div', 'q-prompt-card q-prompt-big', q.prompt));

    const optionsWrap = el('div', 'tf-grid');
    let selected = null;
    const buttons = [];

    [['benar', '✔️ Benar'], ['salah', '❌ Salah']].forEach(([val, label]) => {
      const b = el('button', 'option-btn tf-btn', label);
      b.type = 'button';
      b.addEventListener('click', () => {
        buttons.forEach(x => x.classList.remove('option-selected'));
        b.classList.add('option-selected');
        selected = val;
        global.__onSelectionChange && global.__onSelectionChange();
      });
      buttons.push(b);
      optionsWrap.appendChild(b);
    });

    wrap.appendChild(optionsWrap);
    container.appendChild(wrap);

    // Audio otomatis satu kali ketika soal muncul.
    scheduleAutoPlay(mainSpeaker);

    return {
      isComplete: () => selected !== null,
      checkCorrect: () => selected === q.answer,
      reveal: (isCorrect) => {
        buttons.forEach((b, i) => {
          const val = i === 0 ? 'benar' : 'salah';
          if (val === q.answer) b.classList.add('option-correct');
          else if (val === selected && !isCorrect) b.classList.add('option-wrong');
        });
      },
      onExit: () => AudioManager && AudioManager.stopAudio(),
    };
  }

  /* ============ CHOOSE TRANSLATION ============ */
  function renderChooseTranslation(container, q) {
    const wrap = el('div', 'q-block');
    wrap.appendChild(el('p', 'q-instruction', q.instruction));
    wrap.appendChild(el('div', 'q-prompt-card', q.prompt));

    const optionsWrap = el('div', 'options-list');
    let selected = null;
    const buttons = [];

    q.options.forEach(opt => {
      const row = el('div', 'option-row');
      const b = el('button', 'option-btn option-btn-jp option-btn-wide', opt);
      b.type = 'button';
      b.addEventListener('click', () => {
        // Kalimat JP dibacakan saat opsi disentuh — membantu latihan dengar & lafal.
        speakWithFeedback(opt, b);
        buttons.forEach(x => x.classList.remove('option-selected'));
        b.classList.add('option-selected');
        selected = opt;
        global.__onSelectionChange && global.__onSelectionChange();
      });
      buttons.push(b);
      row.appendChild(b);
      optionsWrap.appendChild(row);
    });

    wrap.appendChild(optionsWrap);
    container.appendChild(wrap);

    return {
      isComplete: () => selected !== null,
      checkCorrect: () => selected === q.answer,
      reveal: (isCorrect) => {
        buttons.forEach(b => {
          if (b.textContent === q.answer) b.classList.add('option-correct');
          else if (b.textContent === selected && !isCorrect) b.classList.add('option-wrong');
        });
      },
      onExit: () => AudioManager && AudioManager.stopAudio(),
    };
  }

  /* ============ LISTENING (soal baru: dengarkan lalu susun kalimat) ============ */
  function renderListening(container, q) {
    const wrap = el('div', 'q-block');
    wrap.appendChild(el('p', 'q-instruction', q.instruction));

    // Panel audio utama — cukup besar & mudah disentuh (optimasi mobile).
    const audioPanel = el('div', 'listening-audio-panel');
    const mainSpeaker = buildSpeakerButton(q.audioText, { size: 'xl', label: 'Putar Audio' });
    audioPanel.appendChild(mainSpeaker);
    audioPanel.appendChild(el('span', 'listening-audio-caption', '🔊 Putar Audio'));
    wrap.appendChild(audioPanel);
    wrap.appendChild(el('p', 'listening-hint', 'Dengarkan audio, lalu susun kalimat yang kamu dengar.'));

    const answerZone = el('div', 'tile-answer-zone');
    const bankZone = el('div', 'tile-bank-zone');

    let selected = [];
    const usedIdx = new Set();
    const shuffledTiles = q.tiles;

    function refreshBank() {
      bankZone.innerHTML = '';
      shuffledTiles.forEach((token, idx) => {
        if (usedIdx.has(idx)) return;
        const t = el('button', 'tile', token);
        t.type = 'button';
        t.addEventListener('click', () => {
          // Setiap kartu kata yang disentuh langsung dibacakan.
          speakWithFeedback(token, t);
          usedIdx.add(idx);
          selected.push({ token, idx });
          renderAnswer();
          refreshBank();
          global.__onSelectionChange && global.__onSelectionChange();
        });
        bankZone.appendChild(t);
      });
    }

    function renderAnswer() {
      answerZone.innerHTML = '';
      if (selected.length === 0) {
        answerZone.appendChild(el('span', 'tile-answer-placeholder', 'Ketuk kata di bawah untuk menyusun kalimat yang kamu dengar'));
      }
      selected.forEach((s, pos) => {
        const t = el('button', 'tile tile-selected', s.token);
        t.type = 'button';
        t.addEventListener('click', () => {
          speakWithFeedback(s.token, t);
          usedIdx.delete(s.idx);
          selected.splice(pos, 1);
          renderAnswer();
          refreshBank();
          global.__onSelectionChange && global.__onSelectionChange();
        });
        answerZone.appendChild(t);
      });
    }

    wrap.appendChild(answerZone);
    wrap.appendChild(el('div', 'tile-divider'));
    wrap.appendChild(bankZone);
    container.appendChild(wrap);

    renderAnswer();
    refreshBank();

    // Audio otomatis satu kali ketika soal muncul (inti dari tipe soal Listening).
    scheduleAutoPlay(mainSpeaker);

    return {
      isComplete: () => selected.length === q.answer.length,
      checkCorrect: () => {
        const chosen = selected.map(s => s.token);
        return JSON.stringify(chosen) === JSON.stringify(q.answer);
      },
      reveal: (isCorrect) => {
        answerZone.classList.add(isCorrect ? 'zone-correct' : 'zone-wrong');

        // Setelah menjawab: tampilkan kalimat Jepang, furigana (bacaan), arti,
        // dan tombol 🔊 Putar Lagi — sesuai spesifikasi soal Listening.
        const resultPanel = el('div', 'listening-result-panel');
        resultPanel.appendChild(el('p', 'listening-result-jp', q.answer.join('')));
        if (q.reading) {
          resultPanel.appendChild(el('p', 'listening-result-furigana', q.reading));
        }
        resultPanel.appendChild(el('p', 'listening-result-id', q.translation || ''));
        const replayRow = el('div', 'reveal-audio-row');
        replayRow.appendChild(el('span', 'reveal-audio-label', 'Putar Lagi:'));
        replayRow.appendChild(buildSpeakerButton(q.audioText, { size: 'sm', label: 'Putar lagi' }));
        resultPanel.appendChild(replayRow);
        wrap.appendChild(resultPanel);

        if (!isCorrect) {
          wrap.appendChild(el('div', 'answer-reveal', 'Jawaban benar: ' + q.answer.join(' ')));
        }
      },
      onExit: () => AudioManager && AudioManager.stopAudio(),
    };
  }

  function renderQuestion(container, q) {
    // Hentikan audio soal sebelumnya sebelum merender soal baru — mencegah
    // audio bertumpuk saat berpindah soal (persyaratan UX audio).
    if (global.AudioManager) AudioManager.stopAudio();

    container.innerHTML = '';
    switch (q.type) {
      case 'arrange':
      case 'translate':
        return renderTileArrange(container, q);
      case 'match':
        return renderMatch(container, q);
      case 'complete':
        return renderComplete(container, q);
      case 'multiple_choice':
        return renderMultipleChoice(container, q);
      case 'true_false':
        return renderTrueFalse(container, q);
      case 'choose_translation':
        return renderChooseTranslation(container, q);
      case 'listening':
        return renderListening(container, q);
      default:
        container.appendChild(el('p', null, 'Tipe soal tidak dikenal: ' + q.type));
        return { isComplete: () => false, checkCorrect: () => false, reveal: () => {}, onExit: () => {} };
    }
  }
  /* ============ LISTENING ============ */
  function renderListening(container, q) {
    const wrap = el('div', 'q-block');
    wrap.appendChild(el('p', 'q-instruction', q.instruction));
    
    const audioBtn = el('button', 'icon-btn btn-audio', '🔊');
    audioBtn.onclick = () => window.SpeechAPI.playAudio(q.audioText);
    
    const promptCard = el('div', 'q-prompt-card q-prompt-big');
    promptCard.appendChild(audioBtn);
    wrap.appendChild(promptCard);

    const optionsWrap = el('div', 'options-list');
    let selected = null;
    const buttons = [];

    q.options.forEach(opt => {
      const b = el('button', 'option-btn option-btn-wide', opt);
      b.onclick = () => {
        buttons.forEach(x => x.classList.remove('option-selected'));
        b.classList.add('option-selected');
        selected = opt;
        window.__onSelectionChange && window.__onSelectionChange();
      };
      buttons.push(b);
      optionsWrap.appendChild(b);
    });

    wrap.appendChild(optionsWrap);
    container.appendChild(wrap);

    return {
      isComplete: () => selected !== null,
      checkCorrect: () => selected === q.answer,
      reveal: (isCorrect) => {
        buttons.forEach(b => {
          if (b.textContent === q.answer) b.classList.add('option-correct');
          else if (b.textContent === selected && !isCorrect) b.classList.add('option-wrong');
        });
      }
    };
  }

  /* ============ SPEAKING ============ */
  function renderSpeaking(container, q) {
    const wrap = el('div', 'q-block');
    wrap.appendChild(el('p', 'q-instruction', q.instruction));
    wrap.appendChild(el('div', 'q-prompt-card q-prompt-big', q.prompt));
    
    const micBtn = el('button', 'btn btn-primary btn-lg btn-block', '🎙️ Ketuk untuk Bicara');
    const resultText = el('p', 'speech-result', '');
    let isCorrectSpeech = false;
    let hasSpoken = false;

    micBtn.onclick = () => {
      micBtn.textContent = 'Mendengarkan...';
      window.SpeechAPI.recognizeSpeech(q.expectedSpeech, (isCorrect, transcript) => {
        hasSpoken = true;
        isCorrectSpeech = isCorrect;
        resultText.textContent = `Kamu mengucapkan: "${transcript}"`;
        micBtn.textContent = '🎙️ Ulangi Bicara';
        window.__onSelectionChange && window.__onSelectionChange();
      });
    };

    wrap.appendChild(micBtn);
    wrap.appendChild(resultText);
    container.appendChild(wrap);

    return {
      isComplete: () => hasSpoken,
      checkCorrect: () => isCorrectSpeech,
      reveal: (isCorrect) => {
        resultText.style.color = isCorrect ? 'var(--green)' : 'var(--red)';
      }
    };
  }
  
  global.QuestionRenderer = { renderQuestion };
})(window);
