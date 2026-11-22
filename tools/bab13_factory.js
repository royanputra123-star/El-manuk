#!/usr/bin/env node
/* ============================================================================
 * tools/bab13_factory.js
 * Kerangka data soal Bab 13: validasi record, penyusun token, dan util teks.
 *
 * Satu record "slot" = satu kalimat utuh + satu token yang bisa dirumpangkan
 * (slot) + empat pilihan pengganti slot. Record yang sama dapat dirender
 * menjadi tipe complete / choose_translation / translate / arrange / listening.
 * ========================================================================== */
'use strict';

const G = require('./bab13_grammar');
const { T, joinJp, joinKana } = G;

const BLANK = '＿＿＿';

function tokText(t) {
  if (typeof t === 'string') return t;
  return t.jp;
}

/* Normalisasi: satu pilihan = satu token {jp,kana} */
function asToken(choice) {
  if (typeof choice === 'string') return T(choice, choice);
  return { jp: choice.jp, kana: choice.kana === undefined ? choice.jp : choice.kana };
}

/**
 * rec() — membuat record soal slot.
 * @param {Object} o
 * @param {Array}  o.tokens       token kalimat lengkap
 * @param {number} o.slot         indeks token yang dirumpangkan
 * @param {Array}  o.choices      empat pilihan pengganti (pertama = jawaban benar)
 * @param {string} o.translation  terjemahan Indonesia kalimat lengkap
 * @param {string} o.explanation  pembahasan singkat
 * @param {string} o.topic        id pola bunpou
 * @param {Object} o.meta         metadata pola (untuk audit konjugasi)
 * @param {boolean} o.casual      gaya kasual
 */
function rec(o) {
  const tokens = o.tokens.map(asToken);
  const choices = o.choices.map(asToken);
  const tag = o.topic + ' :: ' + joinJp(tokens);

  if (!Array.isArray(tokens) || tokens.length < 2) throw new Error('Kalimat terlalu pendek: ' + tag);
  /* Slot dapat ditulis sebagai indeks (`slot`) atau sebagai isi token
   * (`slotToken` + `slotNth`) agar tidak salah indeks pada kalimat panjang. */
  let slotIdx = o.slot;
  if (o.slotToken !== undefined) {
    const wanted = typeof o.slotToken === 'string' ? o.slotToken : o.slotToken.jp;
    const hits = tokens.map((t, i) => (t.jp === wanted ? i : -1)).filter(i => i >= 0);
    slotIdx = hits[o.slotNth || 0];
    if (slotIdx === undefined) throw new Error('slotToken tidak ditemukan: ' + wanted + ' :: ' + tag);
  }
  if (!(slotIdx >= 0 && slotIdx < tokens.length)) throw new Error('Slot di luar kalimat: ' + tag);
  if (choices.length !== 4) throw new Error('Butuh tepat 4 pilihan (' + choices.length + '): ' + tag);
  const uniq = new Set(choices.map(c => c.jp));
  if (uniq.size !== 4) throw new Error('Pilihan duplikat: ' + tag + ' ' + JSON.stringify([...uniq]));
  const answer = tokens[slotIdx];
  if (!uniq.has(answer.jp)) throw new Error('Jawaban tidak ada di pilihan: ' + tag + ' jawab=' + answer.jp);
  if (!o.translation || !o.explanation) throw new Error('Terjemahan/pembahasan kosong: ' + tag);
  /* Normalisasi: pilihan benar selalu di indeks 0. Renderer mengacaknya. */
  const ordered = [answer, ...choices.filter(c => c.jp !== answer.jp)];
  if (ordered.length !== 4) throw new Error('Pilihan tidak valid: ' + tag);

  return {
    tokens,
    slot: slotIdx,
    choices: ordered,
    answer,
    translation: o.translation,
    explanation: o.explanation,
    topic: o.topic,
    meta: o.meta || {},
    casual: !!o.casual,
  };
}

/* Kalimat dengan slot terisi pilihan tertentu */
function fill(record, choice) {
  return record.tokens.map((t, i) => (i === record.slot ? tokText(choice) : t.jp)).join('');
}
function fullJp(record) {
  return record.tokens.map(t => t.jp).join('');
}
function fullKana(record) {
  return record.tokens.map(t => t.kana).join('');
}

/**
 * dlg() — percakapan pendek: A bertanya, B menjawab dengan satu rumpang.
 * @param {Object} o
 * @param {Array}  o.a           token kalimat A
 * @param {Array}  o.bBefore     token B sebelum rumpang
 * @param {Array}  o.answer      token jawaban (mengisi rumpang)
 * @param {Array}  o.bAfter      token B setelah rumpang
 * @param {Array}  o.options     empat pilihan (pertama = jawaban benar)
 * @param {string} o.translation terjemahan lengkap
 * @param {Array}  o.lineId      [terjemahan A, terjemahan B]
 * @param {string} o.explanation
 * @param {string} o.topic
 * @param {boolean} o.casual
 */
function dlg(o) {
  const a = o.a.map(asToken);
  const bBefore = (o.bBefore || []).map(asToken);
  const bAfter = (o.bAfter || []).map(asToken);
  const answer = Array.isArray(o.answer) ? asToken(o.answer) : asToken(o.answer);
  const options = o.options.map(asToken);
  const tag = o.topic + ' :: ' + joinJp(a) + ' / ' + joinJp(bBefore) + '___' + joinJp(bAfter);

  if (options.length !== 4) throw new Error('Butuh 4 respons (' + options.length + '): ' + tag);
  if (new Set(options.map(x => x.jp)).size !== 4) throw new Error('Respons duplikat: ' + tag);
  if (!options.some(x => x.jp === answer.jp)) throw new Error('Jawaban tidak ada di respons: ' + tag);
  const orderedOptions = [answer, ...options.filter(x => x.jp !== answer.jp)];
  if (orderedOptions.length !== 4) throw new Error('Respons tidak valid: ' + tag);
  if (!o.translation || !o.explanation || !Array.isArray(o.lineId) || o.lineId.length !== 2) {
    throw new Error('Metadata percakapan kurang: ' + tag);
  }
  return {
    a, bBefore, bAfter, answer, options: orderedOptions,
    translation: o.translation,
    lineId: o.lineId,
    explanation: o.explanation,
    topic: o.topic,
    casual: !!o.casual,
    meta: o.meta || {},
  };
}

/* match(): 4 pasangan jodohkan */
function match(o) {
  if (!Array.isArray(o.pairs) || o.pairs.length !== 4) throw new Error('Match butuh 4 pasangan: ' + o.topic);
  const jp = new Set(o.pairs.map(p => p.jp));
  const id = new Set(o.pairs.map(p => p.id));
  const vid = new Set(o.pairs.map(p => p.vocabId));
  if (jp.size !== 4 || id.size !== 4 || vid.size !== 4) throw new Error('Pasangan match duplikat: ' + o.topic);
  if (!o.translation || !o.explanation) throw new Error('Metadata match kurang: ' + o.topic);
  return { pairs: o.pairs, translation: o.translation, explanation: o.explanation, topic: o.topic, casual: false, meta: o.meta || {} };
}

module.exports = { rec, dlg, match, fill, fullJp, fullKana, tokText, BLANK };
