// js/questions.js
// Render & evaluasi setiap jenis soal.
// Mendukung tipe soal: arrange, translate, complete, match, short_conversation, choose_translation, listening
// Menggunakan Web Speech API via AudioManager (js/audioManager.js) untuk pengucapan bahasa Jepang (ja-JP)

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
     AUDIO HELPERS (TTS Web Speech API ja-JP)
     ========================================================================== */

  function buildSpeakerButton(text, opts) {
    const options = opts || {};
    const size = options.size || 'md';
    const btn = el('button', 'speaker-btn speaker-btn-' + size);
    btn.type = 'button';
    btn.setAttribute('aria-label', options.label || 'Putar audio');
    btn.innerHTML = '<span class="speaker-icon">🔊</span>';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      speakWithFeedback(text, btn);
    });
    return btn;
  }

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

  function scheduleAutoPlay(buttonEl) {
    if (!buttonEl || !global.AudioManager || !AudioManager.isSupported()) return;
    setTimeout(() => {
      try { buttonEl.click(); } catch (e) {}
    }, 350);
  }

  /* ============ 1 & 2. ARRANGE & TRANSLATE (susun kata) ============ */
  function renderTileArrange(container, q) {
    const wrap = el('div', 'q-block');

    const instrRow = el('div', 'q-instruction-row');
    instrRow.appendChild(el('p', 'q-instruction', q.instruction));
    const fullSentenceText = Array.isArray(q.answer) ? q.answer.join('') : q.answer;
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

  /* ============ 3. COMPLETE (melengkapi kalimat / fill in the blank) ============ */
  function renderComplete(container, q) {
    const wrap = el('div', 'q-block');

    const instrRow = el('div', 'q-instruction-row');
    instrRow.appendChild(el('p', 'q-instruction', q.instruction));
    const fullText = q.prompt.replace('＿＿＿', q.answer);
    const mainSpeaker = buildSpeakerButton(fullText, { size: 'lg', label: 'Putar kalimat' });
    instrRow.appendChild(mainSpeaker);
    wrap.appendChild(instrRow);

    const promptCard = el('div', 'q-prompt-card q-prompt-big');
    promptCard.appendChild(el('div', 'q-prompt-text', q.prompt));
    if (q.translation) {
      promptCard.appendChild(el('div', 'q-prompt-sub', `(${q.translation})`));
    }
    wrap.appendChild(promptCard);

    const optionsWrap = el('div', 'options-grid');
    let selected = null;
    const buttons = [];

    q.options.forEach(opt => {
      const b = el('button', 'option-btn option-btn-jp', opt);
      b.type = 'button';
      b.addEventListener('click', () => {
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

    scheduleAutoPlay(mainSpeaker);

    return {
      isComplete: () => selected !== null,
      checkCorrect: () => selected === q.answer,
      reveal: (isCorrect) => {
        buttons.forEach(b => {
          if (b.textContent === q.answer) b.classList.add('option-correct');
          else if (b.textContent === selected && !isCorrect) b.classList.add('option-wrong');
        });
        if (!isCorrect) {
          wrap.appendChild(el('div', 'answer-reveal', 'Jawaban benar: ' + q.answer));
        }
      },
      onExit: () => AudioManager && AudioManager.stopAudio(),
    };
  }

  /* ============ 4. MATCH (mencocokkan kosakata) ============ */
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
        if (global.SoundFx) SoundFx.playClick();
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
          leftItems.forEach(item => {
            const lb = leftButtons[item.vocabId];
            const rb = rightButtons[item.vocabId];
            lb.classList.add('matched');
            rb.classList.add('matched');
          });
        }
      },
      onExit: () => AudioManager && AudioManager.stopAudio(),
    };
  }

  /* ============ 5. SHORT CONVERSATION (Percakapan Pendek - Tipe Soal Baru) ============ */
  function renderShortConversation(container, q) {
    const wrap = el('div', 'q-block');

    const instrRow = el('div', 'q-instruction-row');
    instrRow.appendChild(el('p', 'q-instruction', q.instruction || 'Percakapan Pendek'));

    // Teks percakapan utuh untuk dibacakan oleh TTS
    const fullConvText = q.dialogue.map(d => `${d.speaker} ${d.text.replace('＿＿＿', q.answer)}`).join(' ');
    const mainSpeaker = buildSpeakerButton(fullConvText, { size: 'lg', label: 'Putar percakapan' });
    instrRow.appendChild(mainSpeaker);
    wrap.appendChild(instrRow);

    // Render Percakapan Bubble
    const convBox = el('div', 'conv-box');
    q.dialogue.forEach(line => {
      const lineRow = el('div', `conv-row conv-row-${line.speaker.toLowerCase()}`);
      const avatar = el('div', 'conv-avatar', line.speaker);
      const bubble = el('div', 'conv-bubble', line.text);

      // Tombol speaker kecil untuk per baris percakapan
      const lineSpeaker = buildSpeakerButton(line.text.replace('＿＿＿', q.answer), { size: 'sm' });

      lineRow.appendChild(avatar);
      lineRow.appendChild(bubble);
      lineRow.appendChild(lineSpeaker);
      convBox.appendChild(lineRow);
    });
    wrap.appendChild(convBox);

    // Render Pertanyaan Pemahaman / Instruksi Sub
    const subQuest = el('div', 'conv-subquestion', q.question);
    wrap.appendChild(subQuest);

    // Options grid/list
    const optionsWrap = el('div', 'options-list');
    let selected = null;
    const buttons = [];

    q.options.forEach(opt => {
      const row = el('div', 'option-row');
      const b = el('button', 'option-btn option-btn-wide', opt);
      b.type = 'button';
      b.addEventListener('click', () => {
        // Bacakan teks opsi jika ada teks Jepang
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

    scheduleAutoPlay(mainSpeaker);

    return {
      isComplete: () => selected !== null,
      checkCorrect: () => selected === q.answer,
      reveal: (isCorrect) => {
        buttons.forEach(b => {
          if (b.textContent === q.answer) b.classList.add('option-correct');
          else if (b.textContent === selected && !isCorrect) b.classList.add('option-wrong');
        });
        if (!isCorrect) {
          wrap.appendChild(el('div', 'answer-reveal', 'Jawaban benar: ' + q.answer));
        }
      },
      onExit: () => AudioManager && AudioManager.stopAudio(),
    };
  }

  /* ============ 6. CHOOSE TRANSLATION ============ */
  function renderChooseTranslation(container, q) {
    const wrap = el('div', 'q-block');
    wrap.appendChild(el('p', 'q-instruction', q.instruction));

    const promptCard = el('div', 'q-prompt-card', q.prompt);
    wrap.appendChild(promptCard);

    const optionsWrap = el('div', 'options-list');
    let selected = null;
    const buttons = [];

    q.options.forEach(opt => {
      const row = el('div', 'option-row');
      const b = el('button', 'option-btn option-btn-jp option-btn-wide', opt);
      b.type = 'button';
      b.addEventListener('click', () => {
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

  /* ============ 7. LISTENING ============ */
  function renderListening(container, q) {
    const wrap = el('div', 'q-block');
    wrap.appendChild(el('p', 'q-instruction', q.instruction));

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

    scheduleAutoPlay(mainSpeaker);

    return {
      isComplete: () => selected.length === q.answer.length,
      checkCorrect: () => {
        const chosen = selected.map(s => s.token);
        return JSON.stringify(chosen) === JSON.stringify(q.answer);
      },
      reveal: (isCorrect) => {
        answerZone.classList.add(isCorrect ? 'zone-correct' : 'zone-wrong');

        const resultPanel = el('div', 'listening-result-panel');
        resultPanel.appendChild(el('p', 'listening-result-jp', Array.isArray(q.answer) ? q.answer.join('') : q.answer));
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
          wrap.appendChild(el('div', 'answer-reveal', 'Jawaban benar: ' + (Array.isArray(q.answer) ? q.answer.join(' ') : q.answer)));
        }
      },
      onExit: () => AudioManager && AudioManager.stopAudio(),
    };
  }

  /* ============ MAIN ROUTER ============ */
  function renderQuestion(container, q) {
    if (global.AudioManager) AudioManager.stopAudio();
    container.innerHTML = '';

    switch (q.type) {
      case 'arrange':
      case 'translate':
        return renderTileArrange(container, q);
      case 'complete':
        return renderComplete(container, q);
      case 'match':
        return renderMatch(container, q);
      case 'short_conversation':
        return renderShortConversation(container, q);
      case 'choose_translation':
        return renderChooseTranslation(container, q);
      case 'listening':
        return renderListening(container, q);
      default:
        container.appendChild(el('p', null, 'Tipe soal tidak dikenal: ' + q.type));
        return { isComplete: () => false, checkCorrect: () => false, reveal: () => {}, onExit: () => {} };
    }
  }

  global.QuestionRenderer = { renderQuestion };
})(window);
