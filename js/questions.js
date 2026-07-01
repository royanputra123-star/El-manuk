// questions.js
// Render & evaluasi setiap jenis soal. Setiap render*Question mengembalikan
// sebuah controller object: { isComplete(), checkCorrect(), reveal(isCorrect) }

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

  /* ============ ARRANGE & TRANSLATE (susun kata) ============ */
  function renderTileArrange(container, q) {
    const wrap = el('div', 'q-block');
    wrap.appendChild(el('p', 'q-instruction', q.instruction));

    if (q.type === 'translate') {
      const promptCard = el('div', 'q-prompt-card');
      promptCard.appendChild(el('p', 'q-prompt-id', q.prompt));
      wrap.appendChild(promptCard);
    }

    const answerZone = el('div', 'tile-answer-zone');
    const bankZone = el('div', 'tile-bank-zone');

    let selected = []; // array of {token, tileEl}
    const bankTiles = [];

    function refreshBank() {
      bankZone.innerHTML = '';
      shuffledTiles.forEach((token, idx) => {
        if (usedIdx.has(idx)) return;
        const t = el('button', 'tile', token);
        t.type = 'button';
        t.addEventListener('click', () => {
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
          usedIdx.delete(s.idx);
          selected.splice(pos, 1);
          renderAnswer();
          refreshBank();
          global.__onSelectionChange && global.__onSelectionChange();
        });
        answerZone.appendChild(t);
      });
    }

    const usedIdx = new Set();
    const shuffledTiles = q.tiles;

    wrap.appendChild(answerZone);
    wrap.appendChild(el('div', 'tile-divider'));
    wrap.appendChild(bankZone);
    container.appendChild(wrap);

    renderAnswer();
    refreshBank();

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
    wrap.appendChild(el('p', 'match-hint', 'Ketuk kata Jepang lalu artinya untuk mencocokkan.'));
    container.appendChild(wrap);

    return {
      isComplete: () => matchedCount === q.pairs.length,
      checkCorrect: () => mistakes === 0,
      reveal: (isCorrect) => {
        if (!isCorrect) {
          wrap.appendChild(el('div', 'answer-reveal', `Ada ${mistakes} pasangan yang salah dicoba, tapi semua sudah dicocokkan.`));
        }
      },
    };
  }

  /* ============ COMPLETE (melengkapi kalimat) ============ */
  function renderComplete(container, q) {
    const wrap = el('div', 'q-block');
    wrap.appendChild(el('p', 'q-instruction', q.instruction));
    const promptCard = el('div', 'q-prompt-card q-prompt-jp');
    promptCard.appendChild(el('p', null, q.prompt));
    wrap.appendChild(promptCard);

    const optionsWrap = el('div', 'options-grid');
    let selected = null;
    const buttons = [];

    q.options.forEach(opt => {
      const b = el('button', 'option-btn', opt);
      b.type = 'button';
      b.addEventListener('click', () => {
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
        if (q.translation) {
          wrap.appendChild(el('p', 'answer-translation', '"' + q.translation + '"'));
        }
      },
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
    };
  }

  /* ============ TRUE / FALSE ============ */
  function renderTrueFalse(container, q) {
    const wrap = el('div', 'q-block');
    wrap.appendChild(el('p', 'q-instruction', q.instruction));
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
      const b = el('button', 'option-btn option-btn-jp option-btn-wide', opt);
      b.type = 'button';
      b.addEventListener('click', () => {
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
    };
  }

  function renderQuestion(container, q) {
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
      default:
        container.appendChild(el('p', null, 'Tipe soal tidak dikenal: ' + q.type));
        return { isComplete: () => false, checkCorrect: () => false, reveal: () => {} };
    }
  }

  global.QuestionRenderer = { renderQuestion };
})(window);
