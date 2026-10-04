// js/translation.js
// Fitur "Tampilan Terjemahan Setelah Menjawab".
//
// Setelah pengguna memeriksa jawaban (benar maupun salah), modul ini menyusun:
//   1. Panel di dalam kotak umpan balik (#quiz-feedback):
//        - status benar/salah
//        - terjemahan Bahasa Indonesia lengkap dari soal/kalimat yang dijawab
//        - cara baca (kana + romaji bila tersedia)
//   2. Kartu rincian di bawah kotak umpan balik (#quiz-translation-panel) untuk
//      tipe soal percakapan (short_conversation) dan susun kata
//      (arrange / translate / listening): teks Jepang, cara baca, dan
//      terjemahan per baris.
//
// Sumber data terjemahan:
//   - Metadata bawaan soal (translation / reading / romaji / dialogueId /
//     answerId) yang dihasilkan tools/generate_bab10.js & tools/generate_bab9.js
//   - Fallback: glosarium kata per kata yang dibangun dari data kosakata
//     (window.VOCAB_BAB10_DATA / VOCAB_BAB9_DATA / VOCAB_BAB7_DATA / VOCAB_DATA)
//     untuk data bab lama yang belum menyimpan terjemahan kalimat.

(function (global) {
  const BLANK = '＿＿＿';
  const BLANK_ALT = '______';

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function fillBlank(text, answer) {
    if (typeof text !== 'string') return text;
    return text.split(BLANK).join(answer).split(BLANK_ALT).join(answer);
  }

  /* ========================================================================
     GLOSARIUM FALLBACK (untuk data Bab 7 / Bab 8 yang tanpa metadata)
     ====================================================================== */
  let lexiconCache = null;

  function buildLexicon() {
    const extra = [
      { jp: 'あります', id: 'ada (benda mati)' },
      { jp: 'ありません', id: 'tidak ada (benda mati)' },
      { jp: 'います', id: 'ada (makhluk hidup)' },
      { jp: 'いません', id: 'tidak ada (makhluk hidup)' },
      { jp: 'です', id: 'adalah' },
      { jp: 'ではありません', id: 'bukan' },
      { jp: 'どこ', id: 'di mana' },
      { jp: 'だれ', id: 'siapa' },
      { jp: '何', id: 'apa' },
      { jp: 'など', id: 'dan lain-lain' },
      { jp: 'すみません', id: 'permisi / maaf' },
      { jp: 'はい', id: 'ya' },
      { jp: 'いいえ', id: 'tidak' },
      { jp: '上', id: 'atas' }, { jp: '下', id: 'bawah' }, { jp: '前', id: 'depan' },
      { jp: '後ろ', id: 'belakang' }, { jp: '右', id: 'kanan' }, { jp: '左', id: 'kiri' },
      { jp: '中', id: 'dalam' }, { jp: '外', id: 'luar' }, { jp: '隣', id: 'sebelah' },
      { jp: '近く', id: 'dekat' }, { jp: '間', id: 'di antara' },
    ];
    const map = new Map();
    ['VOCAB_BAB10_DATA', 'VOCAB_BAB9_DATA', 'VOCAB_BAB7_DATA', 'VOCAB_DATA'].forEach(key => {
      const arr = global[key];
      if (!Array.isArray(arr)) return;
      arr.forEach(v => {
        if (!v || !v.jp) return;
        const mean = v.id_mean || v.mean || v.id;
        if (!mean) return;
        if (!map.has(v.jp)) map.set(v.jp, mean);
        if (v.kana && v.kana !== v.jp && !map.has(v.kana)) map.set(v.kana, mean);
      });
    });
    extra.forEach(e => { if (!map.has(e.jp)) map.set(e.jp, e.id); });

    return Array.from(map.entries())
      .map(([jp, id]) => ({ jp, id }))
      .sort((a, b) => b.jp.length - a.jp.length);
  }

  function lexicon() {
    if (!lexiconCache) lexiconCache = buildLexicon();
    return lexiconCache;
  }

  const PARTICLE_CHARS = new Set(['は', 'が', 'を', 'に', 'で', 'の', 'と', 'や', 'も', 'へ', 'か', 'ね', 'よ', 'っ']);

  /* Pecah teks Jepang menjadi daftar {jp, id} memakai pencocokan terpanjang. */
  function glossWords(text) {
    if (!text) return [];
    const dict = lexicon();
    const src = String(text).replace(/[。、？！・「」（）\s]/g, ' ');
    const out = [];
    const seen = new Set();
    for (const chunk of src.split(' ')) {
      if (!chunk) continue;
      let i = 0;
      while (i < chunk.length) {
        let matched = null;
        for (const entry of dict) {
          if (chunk.startsWith(entry.jp, i)) { matched = entry; break; }
        }
        if (matched) {
          if (!seen.has(matched.jp)) { seen.add(matched.jp); out.push(matched); }
          i += matched.jp.length;
          continue;
        }
        const ch = chunk[i];
        if (!PARTICLE_CHARS.has(ch) && /[\u4e00-\u9faf\u3040-\u30ff\u30a1-\u30f6]/.test(ch)) {
          /* kumpulkan sisa kata yang tidak dikenal */
          let j = i;
          while (j < chunk.length && !dict.some(e => chunk.startsWith(e.jp, j))) j++;
          const unknown = chunk.slice(i, j);
          if (unknown && !seen.has(unknown)) { seen.add(unknown); out.push({ jp: unknown, id: '' }); }
          i = j || i + 1;
          continue;
        }
        i++;
      }
    }
    return out;
  }

  function glossText(text) {
    return glossWords(text).map(g => (g.id ? `${g.jp} = ${g.id}` : g.jp)).join(' · ');
  }

  /* ========================================================================
     RESOLVER: ambil jp / terjemahan / cara baca dari sebuah objek soal
     ====================================================================== */
  function sentenceOf(q) {
    if (Array.isArray(q.answer)) return q.answer.join('');
    if (q.type === 'complete') return fillBlank(q.prompt, q.answer);
    if (q.fullSentenceText) return q.fullSentenceText;
    if (typeof q.answer === 'string') return q.answer;
    return '';
  }

  function resolve(q) {
    if (!q) return null;
    const base = {
      type: q.type,
      jp: '',
      idn: '',
      reading: q.reading || '',
      romaji: q.romaji || '',
      lines: null,
      pairs: null,
      glossed: false,
    };

    switch (q.type) {
      case 'arrange':
      case 'listening':
        base.jp = sentenceOf(q);
        base.idn = q.translation || '';
        break;

      case 'translate':
        base.jp = sentenceOf(q);
        base.idn = q.translation || q.prompt || (q.displayId || '');
        break;

      case 'complete':
        base.jp = sentenceOf(q);
        base.idn = q.translation || '';
        break;

      case 'choose_translation':
        base.jp = typeof q.answer === 'string' ? q.answer : sentenceOf(q);
        base.idn = q.translation || q.prompt || '';
        break;

      case 'short_conversation': {
        const lines = (q.dialogue || []).map(line => fillBlank(line.text, q.answer));
        base.jp = lines.join(' ');
        const ids = Array.isArray(q.dialogueId) ? q.dialogueId : null;
        base.lines = (q.dialogue || []).map((line, i) => {
          const jp = fillBlank(line.text, q.answer);
          let id = null;
          if (ids && ids[i]) {
            /* dialogueId disimpan sebagai "A: <terjemahan>" */
            id = ids[i].replace(/^[AB]\s*:\s*/, '');
          }
          if (!id && line.text.includes(BLANK)) id = q.answerId || '';
          return { speaker: line.speaker, jp, id: id || null };
        });
        base.idn = q.translation ||
          (base.lines.map(l => `${l.speaker}: ${l.id || glossText(l.jp)}`).join(' — '));
        base.glossed = !ids;
        break;
      }

      case 'match':
        base.pairs = (q.pairs || []).map(p => ({ jp: p.jp, id: p.id }));
        base.idn = q.translation || base.pairs.map(p => `${p.jp} = ${p.id}`).join(' · ');
        break;

      case 'true_false':
        base.jp = q.promptJp || '';
        base.idn = q.prompt || '';
        break;

      case 'multiple_choice': {
        base.jp = typeof q.answer === 'string' ? q.answer : '';
        base.idn = String(q.prompt || '').replace(/^["“]|["”]$/g, '');
        if (Array.isArray(q.optionReadings) && Array.isArray(q.options)) {
          const idx = q.options.indexOf(q.answer);
          if (idx >= 0) base.reading = q.optionReadings[idx] || base.reading;
        }
        break;
      }

      default:
        return null;
    }

    if (!base.idn) {
      const fallback = glossText(base.jp);
      if (fallback) { base.idn = fallback; base.glossed = true; }
    }
    if (!base.jp && Array.isArray(q.dialogue)) base.jp = '';
    return base;
  }

  /* ========================================================================
     RENDER: kotak umpan balik
     ====================================================================== */
  function renderFeedback(feedbackEl, q, isCorrect) {
    if (!feedbackEl) return null;
    feedbackEl.innerHTML = '';
    feedbackEl.className = 'quiz-feedback ' + (isCorrect ? 'feedback-correct' : 'feedback-wrong');

    const info = resolve(q);

    const status = el('div', 'fb-status');
    status.innerHTML = isCorrect
      ? '<span class="fb-emoji">✨</span><span><strong>Benar!</strong> Jawaban kamu tepat.</span>'
      : '<span class="fb-emoji">❌</span><span><strong>Kurang tepat.</strong> Perhatikan penjelasan berikut.</span>';
    feedbackEl.appendChild(status);

    if (!info) return info;

    if (info.idn) {
      const row = el('div', 'fb-row');
      row.appendChild(el('span', 'fb-row-label', info.glossed ? '🔎 Kata kunci' : '🇮🇩 Terjemahan'));
      row.appendChild(el('span', 'fb-row-text', info.idn));
      feedbackEl.appendChild(row);
    }

    if (info.jp && !isCorrect && info.type !== 'match') {
      const row = el('div', 'fb-row');
      row.appendChild(el('span', 'fb-row-label', '✅ Kalimat benar'));
      row.appendChild(el('span', 'fb-row-text fb-jp', info.jp));
      feedbackEl.appendChild(row);
    }

    if (info.reading) {
      const row = el('div', 'fb-row');
      row.appendChild(el('span', 'fb-row-label', '🔤 Cara baca'));
      const textEl = el('span', 'fb-row-text', info.reading);
      if (info.romaji) textEl.appendChild(el('span', 'fb-romaji', ' (' + info.romaji + ')'));
      row.appendChild(textEl);
      feedbackEl.appendChild(row);
    }

    return info;
  }

  /* ========================================================================
     RENDER: kartu rincian di bawah kotak umpan balik
     (short_conversation + tipe susun kata arrange / translate / listening)
     ====================================================================== */
  const DETAIL_TYPES = new Set(['short_conversation', 'arrange', 'translate', 'listening']);

  function renderDetail(panelEl, q) {
    if (!panelEl) return null;
    panelEl.innerHTML = '';

    if (!q || !DETAIL_TYPES.has(q.type)) {
      panelEl.classList.add('hidden');
      return null;
    }
    const info = resolve(q);
    if (!info) { panelEl.classList.add('hidden'); return null; }

    panelEl.classList.remove('hidden');
    panelEl.appendChild(el('p', 'qtr-title',
      q.type === 'short_conversation' ? '📖 Terjemahan percakapan' : '📖 Terjemahan kalimat'));

    if (info.lines && info.lines.length) {
      info.lines.forEach(line => {
        const row = el('div', 'qtr-line');
        const jpRow = el('div', 'qtr-jp');
        jpRow.appendChild(el('span', 'qtr-speaker', line.speaker + ':'));
        jpRow.appendChild(el('span', null, ' ' + line.jp));
        row.appendChild(jpRow);
        if (line.id) row.appendChild(el('div', 'qtr-id', line.id));
        else row.appendChild(el('div', 'qtr-id qtr-gloss', glossText(line.jp) || '—'));
        panelEl.appendChild(row);
      });
      if (info.romaji) {
        const rom = el('div', 'qtr-romaji');
        rom.appendChild(el('span', 'fb-row-label', '🔤 Cara baca'));
        rom.appendChild(el('span', null, ' ' + info.romaji));
        panelEl.appendChild(rom);
      }
    } else {
      const row = el('div', 'qtr-line');
      row.appendChild(el('div', 'qtr-jp', info.jp));
      if (info.reading) row.appendChild(el('div', 'qtr-reading', info.reading));
      if (info.romaji) row.appendChild(el('div', 'qtr-romaji', info.romaji));
      row.appendChild(el('div', 'qtr-id', info.idn || '—'));
      if (info.glossed) row.appendChild(el('div', 'qtr-note', 'Terjemahan kata per kata (data bab lama)'));
      panelEl.appendChild(row);
    }

    return info;
  }

  global.TranslationHelper = { resolve, renderFeedback, renderDetail, glossText, glossWords };
})(window);
