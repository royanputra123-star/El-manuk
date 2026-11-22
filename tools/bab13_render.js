#!/usr/bin/env node
/* ============================================================================
 * tools/bab13_render.js
 * Ubah record bank soal menjadi objek soal yang dipakai js/questions.js.
 *
 * Tipe yang didukung aplikasi: complete, choose_translation, translate,
 * arrange, listening, short_conversation, match.
 * ========================================================================== */
'use strict';

const G = require('./bab13_grammar');
const F = require('./bab13_factory');
const { fullJp, fullKana, fill, tokText } = F;

const TYPE_CYCLE = ['complete', 'choose_translation', 'translate', 'arrange', 'listening'];

function rotate(arr, n) {
  if (!arr.length) return arr;
  const k = ((n % arr.length) + arr.length) % arr.length;
  return arr.slice(k).concat(arr.slice(0, k));
}

function base(rec, id, type) {
  return {
    id,
    type,
    translation: rec.translation,
    reading: '',
    explanation: rec.explanation,
    topic: rec.topic,
    casual: !!rec.casual,
    fullJp: '',
  };
}

/* Satu record slot → satu soal bertipe `type` */
function renderSlot(rec, type, id, variantIndex) {
  const q = base(rec, id, type);
  const correctJp = fullJp(rec);
  q.fullJp = correctJp;
  q.reading = G.toKana(correctJp);
  const blankPrompt = rec.tokens.map((t, i) => (i === rec.slot ? F.BLANK : t.jp)).join('');
  const optsJp = rec.choices.map(c => fill(rec, c));

  if (type === 'complete') {
    /* Isi rumpang pada tataran kata/partikel: prompt = kalimat + rongga,
     * opsi = kata pengisi, sehingga prompt + answer = fullJp. */
    q.instruction = 'Lengkapi bagian rumpang sesuai arti dan konteks.';
    q.prompt = blankPrompt;
    q.options = rotate(rec.choices.map(c => c.jp), variantIndex);
    q.answer = rec.answer.jp;
    return q;
  }

  if (type === 'choose_translation') {
    q.instruction = 'Pilih kalimat Jepang yang sesuai arti berikut.';
    q.prompt = rec.translation;
    q.options = rotate(optsJp, variantIndex);
    q.answer = correctJp;
    return q;
  }

  /* Susun kata (tiles) */
  const tiles = rec.tokens.map(t => t.jp);
  const shuffled = rotate([...tiles].reverse(), variantIndex);
  if (type === 'arrange') {
    q.instruction = 'Susun kata menjadi kalimat yang benar.';
    q.prompt = rec.translation;
  } else if (type === 'translate') {
    q.instruction = 'Susun terjemahan Jepang dari kalimat berikut.';
    q.prompt = rec.translation;
  } else {
    q.instruction = 'Dengarkan lalu susun kalimat yang kamu dengar.';
    q.prompt = rec.translation;
    q.audioText = correctJp;
  }
  q.tiles = shuffled;
  q.answer = tiles;
  return q;
}

/* Record percakapan → short_conversation */
function renderDialogue(rec, id, variantIndex) {
  const q = base(rec, id, 'short_conversation');
  const aText = rec.a.map(t => t.jp).join('');
  const bText = rec.bBefore.map(t => t.jp).join('') + F.BLANK + rec.bAfter.map(t => t.jp).join('');
  const bFull = rec.bBefore.map(t => t.jp).join('') + rec.answer.jp + rec.bAfter.map(t => t.jp).join('');
  q.fullJp = aText + bFull;
  q.reading = G.toKana(q.fullJp);
  q.instruction = rec.casual
    ? 'Baca percakapan kasual berikut, lalu pilih respons yang tepat.'
    : 'Baca percakapan, lalu pilih respons sesuai konteks.';
  q.dialogue = [
    { speaker: 'A', text: aText },
    { speaker: 'B', text: bText },
  ];
  q.question = (rec.casual ? 'Konteks kasual. ' : '') + rec.translation.split(' — ')[0].replace(/^「|」$/g, '') + ' Pilih respons B.';
  q.options = rotate(rec.options.map(o => o.jp), variantIndex);
  q.answer = rec.answer.jp;
  q.answerId = rec.lineId[1];
  q.dialogueId = rec.lineId;
  return q;
}

/* Record match → match */
function renderMatch(rec, id) {
  const q = base(rec, id, 'match');
  q.fullJp = rec.pairs.map(p => p.jp).join('・');
  q.reading = G.toKana(q.fullJp);
  q.instruction = 'Jodohkan kata Jepang dengan arti atau fungsinya.';
  q.pairs = rec.pairs.map(p => ({ jp: p.jp, id: p.id, vocabId: p.vocabId }));
  return q;
}

module.exports = { renderSlot, renderDialogue, renderMatch, TYPE_CYCLE, rotate };
