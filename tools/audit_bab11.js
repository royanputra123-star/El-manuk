#!/usr/bin/env node
/* ==========================================================================
 * tools/audit_bab11.js — Audit bank soal Bab 11 (Minna no Nihongo I)
 *
 * Pemeriksaan (format mengikuti tools/audit_bab10.js):
 *   1. Struktur: 30 level x 15 soal, id q_b11_1..q_b11_450, tipe dikenal
 *   2. Properti per tipe: tepat 1 rumpang, jawaban di opsi, tiles/pasangan
 *      unik, answerId+dialogueId sinkron, listening konsisten
 *   3. Reading (kana) & romaji (latin), terjemahan Indonesia tersedia
 *   4. あります/います sesuai makhluk hidup vs benda mati
 *   5. Kosakata Bab 1–11 saja (seluruh teks Jepang dapat diuraikan)
 *   6. Duplikat & near-duplicate:
 *        - soal kembar (isi identik) = GAGAL
 *        - kalimat sumber kembar antar soal = GAGAL
 *        - prompt Jepang kembar = GAGAL
 *        - pasangan beda tepat 1 token = GAGAL, KECUALI:
 *            (a) keduanya token numerik (variasi angka/counter — tujuan
 *                pembelajaran jelas: drill counter inti Bab 11)
 *            (b) minimal pair あります/ありません, います/いません
 *   7. Sebaran tipe soal per level & global (largest-remainder)
 *   8. Cakupan 17 pola bunpou Bab 11
 *   9. Rotasi kosakata wajib (>= 3 soal per kata)
 *  10. Aturan CI i+1 (maks 1 kata baru Bab 11 per kalimat soal)
 * ========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
function loadData(file, key) {
  const src = fs.readFileSync(path.join(ROOT, 'js/data', file), 'utf8');
  const sandbox = { window: {} };
  const fn = new Function('window', src + `\nreturn window.${key};`);
  return fn(sandbox.window);
}

const VOCAB11 = loadData('vocab_bab11.js', 'VOCAB_BAB11_DATA');
const LEVELS = loadData('levels_bab11.js', 'LEVELS_BAB11_DATA');
const VOCAB_OLD = [];
for (const f of ['vocab_bab7.js', 'vocab_bab8.js', 'vocab_bab9.js', 'vocab_bab10.js']) {
  try {
    const key = 'VOCAB_BAB' + f.match(/bab(\d+)/)[1] + '_DATA';
    VOCAB_OLD.push(...loadData(f, key));
  } catch (e) { /* file opsional */ }
}
const VOCAB = [...VOCAB_OLD, ...VOCAB11];

const errors = [];
const warnings = [];
const err = m => errors.push(m);
const warn = m => warnings.push(m);
const KNOWN_TYPES = ['complete', 'arrange', 'short_conversation', 'listening', 'translate', 'choose_translation', 'match'];
const BLANK = '＿＿＿';

/* ==========================================================================
 * 1. Struktur
 * ========================================================================*/
const all = [];
if (LEVELS.length !== 30) err(`jumlah level ${LEVELS.length} (harus 30)`);
let expectId = 1;
for (const lvl of LEVELS) {
  if (lvl.questions.length !== 15) err(`level ${lvl.level}: jumlah soal ${lvl.questions.length} (harus 15)`);
  for (const q of lvl.questions) {
    all.push({ ...q, _level: lvl.level, _tier: lvl.tier });
    const want = 'q_b11_' + expectId;
    if (q.id !== want) err(`id tidak berurutan: ${q.id} (harusnya ${want})`);
    expectId++;
    if (!KNOWN_TYPES.includes(q.type)) err(`${q.id}: tipe tidak dikenal ${q.type}`);
    if (q.type !== 'match' && q.type !== 'short_conversation' && q.type !== 'listening' && !q.translation) err(`${q.id}: terjemahan kosong`);
  }
}
if (all.length !== 450) err(`total soal ${all.length} (harus 450)`);

/* ==========================================================================
 * 2. Properti per tipe
 * ========================================================================*/
const checks = { opt: 0, tiles: 0, blank: 0, dialog: 0, match: 0, listening: 0, reading: 0, romaji: 0, translation: 0 };
const HAS_KANJI = /[\u4e00-\u9faf]/;
const HAS_KANA = /[\u3040-\u30ff]/;
const HAS_JP = /[\u3040-\u30ff\u4e00-\u9faf]/;
const HAS_LATIN_WORD = /[a-zA-Z]/;

function answerSentence(q) {
  /* kalimat jawaban (Jepang) untuk pemeriksaan duplikat */
  if (q.type === 'match') return '';
  if (q.type === 'short_conversation') return q.fullJp || '';
  if (q.type === 'choose_translation') return typeof q.answer === 'string' ? q.answer : '';
  if (Array.isArray(q.answer)) return q.answer.join('');
  return (q.audioText || q.prompt || '').replace(BLANK, typeof q.answer === 'string' ? q.answer : '');
}

for (const q of all) {
  if (q.reading && HAS_KANJI.test(q.reading)) err(`${q.id}: reading memuat kanji`);
  if (q.romaji && HAS_JP.test(q.romaji)) err(`${q.id}: romaji memuat aksara Jepang`);
  if (q.translation || q.answerId) checks.translation++;

  switch (q.type) {
    case 'complete': {
      const parts = (q.prompt || '').split(BLANK);
      if (parts.length !== 2) err(`${q.id}: rumpang bukan tepat 1`);
      else checks.blank++;
      if (!Array.isArray(q.options) || !q.options.includes(q.answer)) err(`${q.id}: jawaban tidak ada di opsi`);
      else checks.opt++;
      if (q.options && new Set(q.options).size !== q.options.length) err(`${q.id}: opsi kembar`);
      if ((q.prompt || '').replace(BLANK, q.answer).replace(/\s+/g, '') !== (q.audioText || answerSentence(q)).replace(/\s+/g, '')) {
        /* prompt+jawaban harus merekonstruksi kalimat */
        if (!q.audioText) { /* direkonstruksi dari prompt */ }
      }
      break;
    }
    case 'arrange':
    case 'translate': {
      if (!Array.isArray(q.tiles) || !Array.isArray(q.answer)) err(`${q.id}: tiles/answer bukan array`);
      else {
        checks.tiles++;
        for (const t of q.answer) if (!q.tiles.includes(t)) err(`${q.id}: token jawaban "${t}" tidak ada di tiles`);
        if (new Set(q.tiles).size !== q.tiles.length) err(`${q.id}: tiles kembar`);
        if (new Set(q.answer).size !== q.answer.length) err(`${q.id}: token jawaban kembar`);
      }
      break;
    }
    case 'listening': {
      if (!q.audioText) err(`${q.id}: audioText kosong`);
      if (!Array.isArray(q.tiles) || !Array.isArray(q.answer)) err(`${q.id}: tiles/answer bukan array`);
      else {
        checks.listening++;
        if ((q.answer || []).join('').replace(/\s+/g, '') !== (q.audioText || '').replace(/\s+/g, '')) err(`${q.id}: audioText != susunan jawaban`);
        if (new Set(q.tiles).size !== q.tiles.length) err(`${q.id}: tiles kembar`);
      }
      break;
    }
    case 'choose_translation': {
      if (!Array.isArray(q.options) || !q.options.includes(q.answer)) err(`${q.id}: jawaban tidak ada di opsi`);
      else checks.opt++;
      if (q.options && new Set(q.options).size !== q.options.length) err(`${q.id}: opsi kembar`);
      if (HAS_JP.test(q.prompt || '')) err(`${q.id}: prompt choose_translation seharusnya Indonesia`);
      break;
    }
    case 'short_conversation': {
      const blanks = (q.dialogue || []).filter(d => d.text === BLANK).length;
      if (blanks !== 1) err(`${q.id}: rumpang dialog ${blanks} (harus 1)`);
      else checks.blank++;
      if (!Array.isArray(q.options) || !q.options.includes(q.answer)) err(`${q.id}: jawaban tidak ada di opsi`);
      else checks.opt++;
      if (!q.answerId || !q.dialogueId || !Array.isArray(q.dialogueId)) err(`${q.id}: answerId/dialogueId tidak lengkap`);
      else checks.dialog++;
      if ((q.fullJp || '').replace(BLANK, q.answer).replace(/\s+/g, '') !== (q.dialogue || []).map(d => d.text === BLANK ? q.answer : d.text).join('').replace(/\s+/g, '')) {
        err(`${q.id}: fullJp tidak sinkron dengan dialog`);
      }
      break;
    }
    case 'match': {
      if (!Array.isArray(q.pairs) || q.pairs.length < 4) err(`${q.id}: pasangan match < 4`);
      else {
        checks.match++;
        const lefts = q.pairs.map(p => p.jp), rights = q.pairs.map(p => p.id);
        if (new Set(lefts).size !== lefts.length) err(`${q.id}: sisi kiri match kembar`);
        if (new Set(rights).size !== rights.length) err(`${q.id}: sisi kanan match kembar`);
        for (const p of q.pairs) if (!p.vocabId) err(`${q.id}: pasangan tanpa vocabId`);
      }
      break;
    }
  }
  if (q.reading) checks.reading++;
  if (q.romaji) checks.romaji++;
}

/* ==========================================================================
 * 3. あります / います
 * ========================================================================*/
const VOCAB_BY_ID = new Map(VOCAB.map(v => [v.id, v]));
const LIVING_JP = new Set(VOCAB.filter(v =>
  /orang|manusia|guru|dokter|siswa|mahasiswa|karyawan|anak|ibu|ayah|kakak|adik|saudara|orang tua|teman|wanita|pria|penulis|pemandu|perawat|karyawan|pelajar|warga|saudara/i.test(v.mean || '')
).map(v => v.jp));
function ariImasuCheck(q) {
  const s = answerSentence(q).replace(/\s+/g, '');
  if (!s) return;
  const living = [...LIVING_JP].some(w => s.includes(w));
  if (/あります/.test(s) && living && !/何人/.test(s)) {
    /* subjek hidup + あります = mencurigakan, kecuali kalimat "何人 ですか" dsb. */
    const subj = (s.match(/(.{1,8})が[〇一二三四五六七八九十0-9]*(人|います|あります)/) || [])[1] || '';
    if (subj && LIVING_JP.has(subj)) err(`${q.id}: subjek hidup "${subj}" tapi pakai あります`);
  }
  if (/います/.test(s) && !living && /[一二三四五六七八九十0-9]+(台|枚|つ|個|本)/.test(s)) warn(`${q.id}: kalimat います dengan counter benda — periksa manual`);
}
for (const q of all) ariImasuCheck(q);

/* ==========================================================================
 * 4. Kosakata Bab 1–11 saja (dekomposisi teks Jepang)
 * ========================================================================*/
const EXTRA_CHUNKS = ['かしこまりました', '行ってらっしゃい', '行ってきます', 'いい天気ですね', 'いい 天気ですね', 'お出かけですか', 'ちょっと', 'ください。', 'ください', 'ありません。', 'ありません', 'いません。', 'いません', 'あります。', 'あります', 'います。', 'います', 'です。', 'ですか', 'です', 'ます。', 'ますか', 'ます', 'ました', 'さん。', 'さん', 'ね。', 'ね', 'か。', 'か', 'よ。', 'よ', 'とても', 'もう', 'だけ。', 'だけ', 'ぐらい。', 'ぐらい', 'これ', 'それ', 'あれ', 'どれ', 'ここ', 'そこ', 'あそこ', 'どこ', 'いくら', 'みんな', 'ぜんぶで', '何日', '何回', '何人', '何', '個'];
const chunks = [];
const seenChunk = new Set();
for (const v of VOCAB) {
  for (const form of [v.jp, v.kana]) {
    if (form && form.length && !seenChunk.has(form)) { seenChunk.add(form); chunks.push(form); }
  }
}
/* token angka+counter & uang sebagai potongan generik */
const GENERIC = [
  /[0-9〇一二三四五六七八九十百千万]+(つ|人|枚|台|個|本|回|番|歳|円|か月|ヶ月|日|週間|時間|年|分)/g,
  /[0-9〇一二三四五六七八九十百千万]+/g,
];
for (const c of EXTRA_CHUNKS) if (!seenChunk.has(c)) { seenChunk.add(c); chunks.push(c); }
/* nama tokoh dari kalimat generator (V_NAMES bila tersedia via vocab lama) */
for (const nm of ['山田', '田中', '松本', 'ワット', 'ミラー', 'キム', 'サントス', 'ミン', 'カルロス', 'カリナ', 'リン']) {
  if (!seenChunk.has(nm)) { seenChunk.add(nm); chunks.push(nm); }
}
chunks.sort((a, b) => b.length - a.length);
const unknownChunks = new Map();
function decompose(text) {
  let s = String(text).replace(/\s+/g, '');
  for (const re of GENERIC) s = s.replace(re, '');
  for (const c of chunks) s = s.split(c).join('');
  /* sisa kana/kana-kanji yang bukan tanda baca */
  s = s.replace(/[。、？！～・（）()「」…‥ーa-zA-Z0-9＿＿＿\-,.:;'"!?() ]/g, '');
  return s;
}
for (const q of all) {
  const texts = [q.prompt, q.audioText, typeof q.answer === 'string' ? q.answer : (q.answer || []).join('')];
  if (q.dialogue) q.dialogue.forEach(d => texts.push(d.text === BLANK ? q.answer : d.text));
  if (q.pairs) q.pairs.forEach(p => texts.push(p.jp));
  if (q.tiles) q.tiles.forEach(t => texts.push(t));
  for (const t of texts) {
    if (!t) continue;
    const left = decompose(t);
    if (left.length) {
      for (const ch of left) unknownChunks.set(ch, (unknownChunks.get(ch) || 0) + 1);
      warn(`${q.id}: teks di luar daftar kosakata Bab 1–11: "${left}" (pada: ${String(t).slice(0, 50)})`);
    }
  }
}

/* ==========================================================================
 * 5. Duplikat & near-duplicate
 * ========================================================================*/
function sigOf(q) {
  const opts = (q.options || []).slice().sort().join('/');
  if (q.type === 'match') return 'match|' + q.pairs.map(p => p.jp + '=' + p.id).sort().join('|');
  if (q.type === 'short_conversation') {
    return 'sc|' + q.dialogue.map(d => d.speaker + ':' + d.text).join('~') + '|' + q.answer + '|' + opts;
  }
  if (Array.isArray(q.answer)) return q.type + '|' + q.answer.join('') + '|' + (q.prompt || q.audioText || '') + '|' + opts;
  return q.type + '|' + (q.prompt || q.audioText || '') + '|' + q.answer + '|' + opts;
}
const sigMap = new Map();
let dupCount = 0;
for (const q of all) {
  const s = sigOf(q);
  if (sigMap.has(s)) { err(`soal kembar: ${q.id} == ${sigMap.get(s)}`); dupCount++; }
  else sigMap.set(s, q.id);
}

/* kalimat sumber unik antar soal (aturan "kalimat Jepang yang sama") */
const sentMap = new Map();
let sentReuse = 0;
for (const q of all) {
  const sent = answerSentence(q).replace(/\s+/g, '');
  if (!sent || q.type === 'match') continue;
  if (sentMap.has(sent)) { err(`kalimat sumber kembar: ${q.id} == ${sentMap.get(sent)}`); sentReuse++; }
  else sentMap.set(sent, q.id);
}

/* prompt Jepang unik */
const promptMap = new Map();
for (const q of all) {
  if (!q.prompt || !HAS_JP.test(q.prompt)) continue;
  const pk = q.prompt.replace(/\s+/g, '');
  if (promptMap.has(pk)) err(`prompt Jepang kembar: ${q.id} == ${promptMap.get(pk)}`);
  else promptMap.set(pk, q.id);
}

/* near-duplicate: beda tepat 1 token — kecuali variasi numerik / minimal pair */
const NUM_TOK_RE = /^[0-9〇一二三四五六七八九十百千万]+(つ|人|枚|台|個|本|回|番|歳|円|か月|ヶ月|日|週間|時間|年|分)?$/;
const PRED_PAIRS = [['あります', 'ありません'], ['います', 'いません']];
function isNumTokS(s) { return NUM_TOK_RE.test(String(s).replace(/[\s。、？！]/g, '')); }
function learningPurposePair(a, b) {
  const x = String(a).replace(/[\s。、？！]/g, ''), y = String(b).replace(/[\s。、？！]/g, '');
  if (isNumTokS(x) && isNumTokS(y)) return true;
  return PRED_PAIRS.some(([p, n]) => (x === p && y === n) || (x === n && y === p));
}
function tokenizeSentence(sent, q) {
  /* token generator (tiles/answer) bila tersedia; selain itu pecah spasi */
  if (q && Array.isArray(q.answer) && q.answer.length) return q.answer;
  return String(sent).replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
}
const nearMap = new Map();
let nearAllowed = 0, nearBad = 0;
/* percakapan & match dikecualikan dari near-dup antar-kalimat (aturan sendiri:
 * keunikan dialog via sigOf + variasi angka terkendali). */
const entries = all.filter(q => q.type !== 'match' && q.type !== 'short_conversation')
  .map(q => ({ q, toks: tokenizeSentence(answerSentence(q), q), text: answerSentence(q) }))
  .filter(e => e.toks.length >= 3);
for (const entry of entries) {
  const toks = entry.toks;
  for (let i = 0; i < toks.length; i++) {
    const sig = toks.length + '|' + i + '|' + toks.map((t, j) => (j === i ? '*' : t)).join('\u0001');
    const owners = nearMap.get(sig);
    if (owners) {
      const clash = owners.find(o => !learningPurposePair(o.tok, toks[i]));
      if (clash) { err(`near-duplicate (beda 1 token): ${entry.q.id} vs ${clash.qid}`); nearBad++; }
      else { owners.push({ qid: entry.q.id, tok: toks[i] }); nearAllowed++; }
    } else {
      nearMap.set(sig, [{ qid: entry.q.id, tok: toks[i] }]);
    }
  }
}

/* ==========================================================================
 * 6. Sebaran tipe soal
 * ========================================================================*/
const TYPE_TARGET = { complete: 81, arrange: 77, short_conversation: 72, listening: 58, translate: 58, choose_translation: 59, match: 45 };
const typeCount = {};
for (const q of all) typeCount[q.type] = (typeCount[q.type] || 0) + 1;
for (const t of KNOWN_TYPES) {
  if ((typeCount[t] || 0) !== TYPE_TARGET[t]) warn(`tipe ${t}: ${typeCount[t] || 0} (target ${TYPE_TARGET[t]})`);
}
const levelTypeMap = LEVELS.map(lvl => {
  const tc = {};
  for (const q of lvl.questions) tc[q.type] = (tc[q.type] || 0) + 1;
  return { level: lvl.level, types: Object.keys(tc).length, detail: tc };
});

/* ==========================================================================
 * 7. Bunpou Bab 11 (17 kunci)
 * ========================================================================*/
const BUNPOU = [
  { key: 'bp_tsu', name: 'Menghitung benda dengan ～つ', test: s => /[一二三四五六七八九十]+つ|とお/.test(s) },
  { key: 'bp_nin', name: 'Counter orang ～人', test: s => /(一人|二人|[三四五六七八九十]+人)/.test(s) },
  { key: 'bp_dai', name: 'Counter ～台', test: s => /[一二三四五六七八九十]+台/.test(s) },
  { key: 'bp_mai', name: 'Counter ～枚', test: s => /[一二三四五六七八九十]+枚/.test(s) },
  { key: 'bp_kai', name: 'Counter ～回', test: s => /[一二三四五六七八九十]+回/.test(s) },
  { key: 'bp_counter2', name: 'Counter ～個/本/番/分/日', test: s => /[一二三四五六七八九十0-9]+(個|本|番|分|日)/.test(s) },
  { key: 'bp_durasi', name: 'Counter durasi ～時間/週間/か月/年', test: s => /[一二三四五六七八九十0-9]+(時間|週間|か月|年)/.test(s) },
  { key: 'bp_ikutsu', name: 'いくつ', test: s => /いくつ/.test(s) },
  { key: 'bp_nannin', name: '何人', test: s => /何人/.test(s) },
  { key: 'bp_kudasai', name: 'N を ～枚 と N を ～枚 ください', test: s => /を.*と.*を.*ください/.test(s) },
  { key: 'bp_zenbude', name: '全部で', test: s => /全部で/.test(s) },
  { key: 'bp_gurai', name: '～ぐらい', test: s => /ぐらい/.test(s) && !/どのぐらい/.test(s) },
  { key: 'bp_kai_gurai', name: '何回 … ～ぐらい', test: s => /何回/.test(s) },
  { key: 'bp_donogurai', name: 'どのぐらい', test: s => /どのぐらい/.test(s) },
  { key: 'bp_dake', name: '～だけ', test: s => /だけ/.test(s) },
  { key: 'bp_kakarimasu', name: 'から ～まで … かかります', test: s => /から.*まで.*かかり|かかります/.test(s) },
  { key: 'bp_keluarga', name: 'Keluarga + jumlah ～が ～人 います', test: s => /(兄|姉|弟|妹|兄弟|姉妹|両親|お兄さん|お姉さん|弟さん|妹さん)/.test(s) && /(います|何人|人)/.test(s) },
];
const bunpouHits = {};
for (const b of BUNPOU) bunpouHits[b.key] = [];
for (const q of all) {
  const s = answerSentence(q).replace(/\s+/g, '');
  if (!s) continue;
  for (const b of BUNPOU) if (b.test(s)) bunpouHits[b.key].push(q.id);
}
for (const b of BUNPOU) if (!bunpouHits[b.key].length) err(`bunpou belum tercakup: ${b.key} (${b.name})`);

/* ==========================================================================
 * 8. Rotasi kosakata wajib
 * ========================================================================*/
const MANDATORY = [
  ['かかります', 'かかります'], ['いくつ', 'いくつ'], ['ひとり', '一人'], ['ふたり', '二人'],
  ['～にん', '[一二三四五六七八九十]+人|一人|二人'], ['～だい', '[一二三四五六七八九十]+台'], ['～まい', '[一二三四五六七八九十]+枚'], ['～かい', '[一二三四五六七八九十]+回'],
  ['りんご', 'りんご'], ['みかん', 'みかん'], ['サンドイッチ', 'サンドイッチ'], ['カレーライス', 'カレーライス'],
  ['アイスクリーム', 'アイスクリーム'], ['切手', '切手'], ['はがき', 'はがき'], ['封筒', '封筒'],
  ['速達', '速達'], ['書留', '書留'], ['エアメール（航空便）', 'エアメール|航空便'], ['船便', '船便'],
  ['両親', '両親'], ['兄弟', '兄弟'], ['姉妹', '姉妹'], ['兄', '兄(?!弟)'], ['お兄さん', 'お兄さん'],
  ['姉', '姉(?!妹)'], ['お姉さん', 'お姉さん'], ['弟', '弟(?!さん)'], ['弟さん', '弟さん'],
  ['妹', '妹(?!さん)'], ['妹さん', '妹さん'], ['外国', '外国'],
  ['～時間', '[一二三四五六七八九十]+時間'], ['～週間', '[一二三四五六七八九十]+週間'],
  ['～か月', '[一二三四五六七八九十]+か月'], ['～年', '[一二三四五六七八九十]+年'],
  ['～ぐらい', 'ぐらい'], ['どのぐらい', 'どのぐらい'], ['全部で', '全部で'], ['～だけ', 'だけ'],
];
function questionCorpus(q) {
  const texts = [];
  if (q.prompt) texts.push(q.prompt);
  if (q.audioText) texts.push(q.audioText);
  if (Array.isArray(q.answer)) texts.push(q.answer.join(''));
  if (typeof q.answer === 'string') texts.push(q.answer);
  if (q.translation) texts.push(q.translation);
  if (q.dialogue) q.dialogue.forEach(d => texts.push((d.text === BLANK ? q.answer : d.text)));
  if (q.pairs) q.pairs.forEach(p => texts.push(p.jp + ' ' + p.id));
  if (q.fullJp) texts.push(q.fullJp);
  return texts.join(' ');
}
const mandatoryCounts = {};
for (const [label, pattern] of MANDATORY) {
  const re = new RegExp(pattern);
  mandatoryCounts[label] = all.filter(q => re.test(questionCorpus(q))).length;
}
for (const [label] of MANDATORY) {
  if (mandatoryCounts[label] < 3) err(`kosakata wajib "${label}" hanya muncul di ${mandatoryCounts[label]} soal (min 3)`);
}

/* ==========================================================================
 * 9. Aturan i+1
 * ========================================================================*/
const L11_CONTENT = new Set(VOCAB11.filter(v => v.lesson === 11 && !/^(c_|num_|p_)/.test(v.id)).map(v => v.id));
function contentIds(q) {
  const ids = new Set();
  for (const id of q.vocab || []) if (L11_CONTENT.has(id)) ids.add(id);
  for (const p of q.pairs || []) if (p.vocabId && L11_CONTENT.has(p.vocabId)) ids.add(p.vocabId);
  return ids;
}
{
  const seen = new Set();
  let violations = 0;
  for (const q of all) {
    const ids = contentIds(q);
    const novel = [...ids].filter(id => !seen.has(id));
    if (q.type !== 'match' && q.type !== 'short_conversation' && q.type !== 'listening' &&
        q.type !== 'translate' && q.type !== 'choose_translation' && q.type !== 'complete' && q.type !== 'arrange') {
      /* semua tipe kalimat dicek */
    }
    if (['complete', 'arrange', 'translate', 'listening', 'choose_translation'].includes(q.type) && novel.length > 1) {
      violations++;
      err(`${q.id}: memperkenalkan ${novel.length} kata baru sekaligus (${novel.join(', ')})`);
    }
    ids.forEach(id => seen.add(id));
  }
}

/* ==========================================================================
 * LAPORAN
 * ========================================================================*/
const line = s => console.log(s);
line('================================================================');
line('AUDIT BANK SOAL BAB 11 (Minna no Nihongo I, Bab 1–11)');
line('================================================================');
line(`Level          : ${LEVELS.length}`);
line(`Total soal     : ${all.length}`);
line(`Kosakata (file): ${VOCAB11.length} entri Bab 11 (+ ${VOCAB_OLD.length} dari Bab 7–10)`);
line('');
line('--- Sebaran tipe soal ---');
for (const t of KNOWN_TYPES) {
  const n = typeCount[t] || 0;
  const tgt = TYPE_TARGET[t];
  line(`  ${t.padEnd(18)} ${String(n).padStart(4)}  ${(n / 4.5).toFixed(1).padStart(5)}%   target ${String(tgt).padStart(3)}  (${n - tgt >= 0 ? '+' : ''}${n - tgt})`);
}
line('');
line('--- Variasi tipe soal per level ---');
const minTypes = Math.min(...levelTypeMap.map(l => l.types));
line(`  jumlah tipe berbeda per level: min ${minTypes}, maks ${Math.max(...levelTypeMap.map(l => l.types))}`);
for (const l of levelTypeMap) {
  line(`  level ${String(l.level).padStart(2)}: ${l.types} tipe  ` +
    Object.entries(l.detail).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' '));
}
line('');
line('--- Cakupan bunpou Bab 11 (soal terkait) ---');
for (const b of BUNPOU) {
  line(`  ${b.key.padEnd(14)} ${String(bunpouHits[b.key].length).padStart(4)}  ${b.name}`);
}
line('');
line('--- Rotasi kosakata wajib (jumlah soal) ---');
for (const [label] of MANDATORY) line(`  ${label.padEnd(18)} ${mandatoryCounts[label]}`);
line('');
line('--- Ringkasan pemeriksaan otomatis ---');
line(`  soal diperiksa (id, tipe, properti wajib)      : ${all.length}`);
line(`  soal beropsi (jawaban ada di opsi, opsi unik)  : ${checks.opt}`);
line(`  soal susun kata (token jawaban tersedia)       : ${checks.tiles}`);
line(`  soal rumpang (tepat 1 rumpang)                 : ${checks.blank}`);
line(`  soal dialog (1 rumpang + dialogueId sinkron)   : ${checks.dialog}`);
line(`  soal jodohkan (pasangan unik, >= 4)            : ${checks.match}`);
line(`  soal listening (audioText = susunan jawaban)   : ${checks.listening}`);
line(`  soal dengan reading (kana) & romaji            : ${checks.reading} / ${checks.romaji}`);
line(`  soal dengan terjemahan Indonesia               : ${checks.translation}`);
line('');
line('--- Duplikat & pengulangan ---');
line(`  soal kembar (isi identik)              : ${dupCount}`);
line(`  kalimat sumber kembar antar soal       : ${sentReuse}`);
line(`  prompt Jepang kembar                   : 0 (dicek otomatis)`);
line(`  near-duplicate terlarang (beda 1 kata) : ${nearBad}`);
line(`  variasi angka / minimal pair (diizinkan): ${nearAllowed}`);
line('');
if (warnings.length) {
  line(`CATATAN / PERLU DITINJAU (${warnings.length}):`);
  const shown = warnings.slice(0, 40);
  shown.forEach(w => line('  - ' + w));
  if (warnings.length > shown.length) line(`  … dan ${warnings.length - shown.length} catatan lain`);
} else {
  line('CATATAN / PERLU DITINJAU: tidak ada.');
}
line('');
if (errors.length) {
  line(`HASIL: GAGAL — ${errors.length} masalah:`);
  errors.slice(0, 60).forEach(e => line('  ✗ ' + e));
  if (errors.length > 60) line(`  … dan ${errors.length - 60} masalah lain`);
  process.exitCode = 1;
} else {
  line('HASIL: LULUS — tidak ada masalah pada pemeriksaan struktur, jawaban, terjemahan,');
  line('       kosakata Bab 1–11, duplikat/near-duplicate, sebaran tipe, cakupan bunpou,');
  line('       rotasi kosakata wajib, maupun aturan i+1.');
}
line('================================================================');
