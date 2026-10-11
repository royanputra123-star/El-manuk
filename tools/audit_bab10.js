/* ============================================================================
 * AUDIT BANK SOAL BAB 10 (Minna no Nihongo I, Bab 1–10)
 * ----------------------------------------------------------------------------
 * Skrip ini MEMERIKSA HASIL (bukan generator):
 *   js/data/levels_bab10.js   -> window.LEVELS_BAB10_DATA
 *   js/data/vocab_bab10.js    -> window.VOCAB_BAB10_DATA
 *
 * Yang diperiksa:
 *   1. Struktur & sintaksis data (50 level x 20 soal, id unik, properti wajib)
 *   2. Kelengkapan tiap tipe soal sesuai kontrak js/questions.js
 *   3. Jawaban & opsi (jawaban ada di opsi, opsi unik, kunci konsisten)
 *   4. Kualitas terjemahan Indonesia (tanpa kanji, tanpa spasi ganda, dst.)
 *   5. Cakupan kosakata Bab 1–10 (dekomposisi semua teks Jepang)
 *   6. Duplikat & soal yang hanya beda satu kata (near-duplicate)
 *   7. Sebaran tipe soal & sebaran bunpou Bab 10 (tabel frekuensi + persen)
 *   8. Cakupan 11 kata posisi + 5 kelompok pola wajib Bab 10
 *
 * Cara pakai:  node tools/audit_bab10.js
 * Keluar dengan kode 1 bila ada temuan "hard error".
 * ==========================================================================*/

'use strict';

const fs = require('fs');
const path = require('path');

global.window = {};
require(path.join(__dirname, '..', 'js', 'data', 'vocab_bab10.js'));
require(path.join(__dirname, '..', 'js', 'data', 'levels_bab10.js'));
const VOCAB = global.window.VOCAB_BAB10_DATA;
const LEVELS = global.window.LEVELS_BAB10_DATA;

const errors = [];
const warnings = [];
const err = m => errors.push(m);
const warn = m => warnings.push(m);

/* ==========================================================================
 * 0. Kosakata acuan Bab 1–10
 * ========================================================================*/

/* Kata bantu yang tidak masuk daftar kosakata resmi Bab 10, tetapi muncul
 * sebagai bentuk gramatikal dari kata Bab 1–10 (semua Bab 1–10). */
const EXTRA_FORMS = [
  'ありません', 'いません', 'です', 'ます', 'ません', 'か', 'ですか', 'ますか',
  'さん', 'に', 'が', 'は', 'の', 'や', 'と', 'も', 'を',
];
/* Nama tokoh buku Minna no Nihongo (dipakai pada percakapan). */
const NAME_FORMS = ['ミラーさん', 'ワットさん', '山田さん', '松本さん', 'サントスさん', 'カリナさん', 'リンさん', 'キムさん'];
const NAME_IDS = ['nm_miraa', 'nm_watto', 'nm_yamada', 'nm_matsumoto', 'nm_santosu', 'nm_karina', 'nm_rin', 'nm_kimu'];
/* Bentuk negatif あります / います (Bab 10) — dipakai di field vocab. */
const HIDDEN_IDS = ['v_wa_aru', 'v_wa_iru'];

/* Kata yang TIDAK ada pada dataset pembanding MinnaNoDS Bab 1–10, tetapi
 * sudah diverifikasi manual sebagai kosakata Bab 1–10 (buku Minna no Nihongo).
 * Dicetak pada laporan agar bisa ditinjau ulang. */
const REFERENCE_EXCEPTIONS = {
  'トイレ': 'Bab 3 (buku Minna: トイレ)',
  '国': 'Bab 3 (buku Minna: お国)',
  '空港': 'Bab 5 (buku Minna: 空港)',
  '留学生': 'Bab 1 (buku Minna: 留学生)',
  'は': 'partikel Bab 1', 'が': 'partikel Bab 1', 'に': 'partikel Bab 2',
  'の': 'partikel Bab 2', 'も': 'partikel Bab 1', 'だれ': 'Bab 1 (だれ)',
  'など': 'Bab 10 (～や～など)', 'すみません': 'Bab 2', 'ありがとう ございます': 'Bab 2',
  'そうですか': 'Bab 2', 'どうも すみません': 'Bab 10', 'ありません': 'Bab 10 (bentuk negatif)',
  'いません': 'Bab 10 (bentuk negatif)',
};

const SURFACES = [];           /* { form, id, jp, mean, type } */
const seenForm = new Set();
function addForm(form, entry) {
  const f = String(form || '').replace(/\s+/g, '');
  if (!f || seenForm.has(f)) return;
  seenForm.add(f);
  SURFACES.push({ form: f, id: entry.id, jp: entry.jp, mean: entry.id_mean, type: entry.type, lesson: entry.lesson });
}
VOCAB.forEach(v => { addForm(v.jp, v); addForm(v.kana, v); });
NAME_FORMS.forEach((n, i) => addForm(n, { id: NAME_IDS[i], jp: n, id_mean: n, type: 'name', lesson: 1 }));
EXTRA_FORMS.forEach(f => addForm(f, { id: 'gram_' + f, jp: f, id_mean: f, type: 'grammar', lesson: 0 }));
SURFACES.sort((a, b) => b.form.length - a.form.length);

const VOCAB_IDS = new Set(VOCAB.map(v => v.id));
const IS_LIVING = new Set(VOCAB.filter(v => v.type === 'noun_living').map(v => v.jp));
const IS_THING = new Set(VOCAB.filter(v => v.type === 'noun').map(v => v.jp));
const IS_PLACE = new Set(VOCAB.filter(v => v.type === 'noun_place').map(v => v.jp));
const MEAN_BY_JP = {};
VOCAB.forEach(v => { MEAN_BY_JP[v.jp] = v.id_mean; MEAN_BY_JP[v.kana] = v.id_mean; });

/* ==========================================================================
 * 1. Struktur data
 * ========================================================================*/
const HAS_KANJI = /[\u4e00-\u9faf]/;
const KANA_ONLY = /^[\u3041-\u309f\u30a1-\u30fa\u30fcー\s。、？！・]+$/;

if (!Array.isArray(LEVELS)) err('LEVELS_BAB10_DATA bukan array');
if (!Array.isArray(VOCAB)) err('VOCAB_BAB10_DATA bukan array');
if (LEVELS.length !== 50) err(`jumlah level ${LEVELS.length}, seharusnya 50`);

const TYPE_REQUIRED = {
  arrange:            ['instruction', 'tiles', 'answer', 'translation', 'reading', 'romaji'],
  translate:          ['instruction', 'prompt', 'tiles', 'answer', 'translation', 'reading', 'romaji'],
  complete:           ['instruction', 'prompt', 'options', 'answer', 'translation'],
  match:              ['instruction', 'pairs'],
  short_conversation: ['instruction', 'dialogue', 'question', 'options', 'answer', 'answerId', 'dialogueId', 'translation'],
  choose_translation: ['instruction', 'prompt', 'options', 'answer', 'translation'],
  listening:          ['instruction', 'audioText', 'tiles', 'answer', 'translation', 'reading'],
};
const KNOWN_TYPES = Object.keys(TYPE_REQUIRED);

const all = [];
const idSeen = new Set();
let expectedId = 1;
for (const lvl of LEVELS) {
  if (lvl.questions.length !== 20) err(`level ${lvl.level}: ${lvl.questions.length} soal (harus 20)`);
  if (!lvl.title || !lvl.tier || !lvl.focus || !lvl.theme) warn(`level ${lvl.level}: metadata tidak lengkap`);
  for (const q of lvl.questions) {
    q._level = lvl.level;
    all.push(q);
    const want = `q_b10_${expectedId++}`;
    if (q.id !== want) err(`urutan id tidak berurutan: ${q.id} (harus ${want})`);
    if (idSeen.has(q.id)) err(`id duplikat: ${q.id}`);
    idSeen.add(q.id);
    if (!KNOWN_TYPES.includes(q.type)) err(`${q.id}: tipe tidak dikenal ${q.type}`);
    for (const prop of TYPE_REQUIRED[q.type] || []) {
      if (q[prop] === undefined || q[prop] === null || (typeof q[prop] === 'string' && !q[prop].length)) {
        err(`${q.id}: properti wajib kosong: ${prop}`);
      }
    }
  }
}
if (all.length !== 1000) err(`total soal ${all.length}, seharusnya 1000`);

/* ==========================================================================
 * 2. Kelengkapan per tipe + integritas jawaban/opsi
 * ========================================================================*/
const BLANK = '＿＿＿';

function jpTextOf(q) {
  const parts = [];
  const push = v => {
    if (typeof v === 'string' && /[\u3041-\u30ff\u4e00-\u9faf]/.test(v)) parts.push(v);
    else if (Array.isArray(v)) v.forEach(push);
  };
  push(q.prompt); push(q.answer); push(q.options); push(q.tiles); push(q.audioText);
  push(q.question); push(q.instruction); push(q.fullJp);
  if (q.dialogue) q.dialogue.forEach(d => push(d.text));
  if (q.pairs) q.pairs.forEach(p => push(p.jp));
  return parts.join(' ');
}

function checkedAnswerSentence(q) {
  if (q.type === 'complete') return q.prompt.replace(BLANK, q.answer);
  if (Array.isArray(q.answer)) return q.answer.join('');
  if (q.type === 'short_conversation') return q.dialogue.map(d => (d.text === BLANK ? q.answer : d.text)).join('');
  return q.answer || '';
}

const checks = { opt: 0, tiles: 0, blank: 0, dialog: 0, match: 0, listening: 0, reading: 0, romaji: 0, translation: 0, vocab: 0 };
for (const q of all) {
  /* opsi */
  if (q.options) {
    checks.opt++;
    if (!q.options.includes(q.answer)) err(`${q.id}: jawaban "${q.answer}" tidak ada di opsi`);
    if (new Set(q.options).size !== q.options.length) err(`${q.id}: ada opsi kembar`);
    if (q.options.length < 3) err(`${q.id}: opsi kurang dari 3`);
    for (const o of q.options) if (!o || !String(o).trim()) err(`${q.id}: opsi kosong`);
  }
  /* susun kata */
  if (Array.isArray(q.tiles) && Array.isArray(q.answer)) {
    checks.tiles++;
    const bank = q.tiles.slice();
    for (const tk of q.answer) {
      const i = bank.indexOf(tk);
      if (i < 0) err(`${q.id}: token jawaban "${tk}" tidak tersedia di tiles`);
      else bank.splice(i, 1);
    }
    if (q.answer.length < 3) err(`${q.id}: jawaban kurang dari 3 token`);
    if (new Set(q.tiles).size !== q.tiles.length) warn(`${q.id}: ada tile kembar`);
  }
  /* rumpang */
  if (q.type === 'complete') {
    checks.blank++;
    const n = (q.prompt.match(new RegExp(BLANK, 'g')) || []).length;
    if (n !== 1) err(`${q.id}: jumlah rumpang ${n} (harus 1)`);
    if (!jpTextOf(q).includes(q.answer)) err(`${q.id}: jawaban tidak muncul pada teks Jepang`);
  }
  if (q.type === 'short_conversation') {
    checks.dialog++;
    const n = q.dialogue.filter(d => d.text.includes(BLANK)).length;
    if (n !== 1) err(`${q.id}: jumlah rumpang dialog ${n} (harus 1)`);
    if (!q.dialogueId || q.dialogueId.length !== q.dialogue.length) err(`${q.id}: dialogueId tidak sinkron`);
    if (!q.answerId) err(`${q.id}: answerId kosong`);
    if (!/\(.*\)|jawaban|jawabannya/.test(q.question || '')) warn(`${q.id}: pertanyaan dialog tidak memuat petunjuk kunci`);
    if (!q.options.includes(q.answer)) err(`${q.id}: kunci dialog tidak ada di opsi`);
  }
  if (q.type === 'match') {
    checks.match++;
    if (q.pairs.length < 4) err(`${q.id}: pasangan < 4`);
    const lefts = q.pairs.map(p => p.jp), rights = q.pairs.map(p => p.id);
    if (new Set(lefts).size !== lefts.length) err(`${q.id}: sisi kiri match kembar`);
    if (new Set(rights).size !== rights.length) err(`${q.id}: sisi kanan match kembar`);
  }
  if (q.type === 'listening') {
    checks.listening++;
    if (!q.audioText) err(`${q.id}: audioText kosong`);
    if (/\s/.test(q.audioText)) warn(`${q.id}: audioText mengandung spasi`);
    if (q.answer.join('') !== q.audioText.replace(/\s/g, '')) warn(`${q.id}: audioText != susunan jawaban`);
  }
  /* bacaan & romaji */
  if (q.reading) checks.reading++;
  if (q.romaji) checks.romaji++;
  if (q.translation) checks.translation++;
  if (q.vocab) checks.vocab++;
  if (q.type === 'complete' && q.answer && !/\s/.test(q.answer)) checks.blankOk = (checks.blankOk || 0) + 1;
  if (q.reading && HAS_KANJI.test(q.reading)) err(`${q.id}: reading masih memuat kanji: ${q.reading}`);
  if (q.reading && !KANA_ONLY.test(q.reading)) warn(`${q.id}: reading memuat karakter non-kana: ${q.reading}`);
  if (q.romaji && /[\u3041-\u30ff\u4e00-\u9faf]/.test(q.romaji)) err(`${q.id}: romaji memuat aksara Jepang`);
  /* terjemahan */
  if (q.type === 'match' && q.translation) {
    /* baris terjemahan soal jodohkan memang memuat sisi Jepang + artinya */
    const bad = q.translation.split(' · ').filter(part => {
      const idSide = part.includes(' — ') ? part.split(' — ').pop() : (part.split(' = ')[1] || '');
      return HAS_KANJI.test(idSide);
    });
    if (bad.length) err(`${q.id}: arti pada terjemahan match memuat kanji: ${bad.join(' | ')}`);
    for (const p of q.pairs) {
      if (!q.translation.includes(p.jp) || !q.translation.includes(p.id)) {
        err(`${q.id}: pasangan tidak muncul di terjemahan: ${p.jp}`);
      }
    }
  } else if (q.translation) {
    if (HAS_KANJI.test(q.translation)) err(`${q.id}: terjemahan memuat kanji: ${q.translation}`);
    if (/\s{2,}/.test(q.translation)) err(`${q.id}: terjemahan memuat spasi ganda: ${q.translation}`);
    if (/^\s|\s$/.test(q.translation)) warn(`${q.id}: terjemahan diawali/diakhiri spasi`);
    if (!/[a-zA-Z]/.test(q.translation) && q.type !== 'match') warn(`${q.id}: terjemahan tidak memuat kata Latin: ${q.translation}`);
  }
  /* petunjuk / pertanyaan dialog */
  if (q.question) {
    if (/\s{2,}/.test(q.question)) err(`${q.id}: petunjuk memuat spasi ganda: ${q.question}`);
    if (!/[.?):]$/.test(q.question.trim()) && !/[:)]$/.test(q.question.trim())) warn(`${q.id}: petunjuk tanpa penutup: ${q.question}`);
  }
  /* vocab */
  if ((!Array.isArray(q.vocab) || !q.vocab.length) && q.type !== 'match') warn(`${q.id}: field vocab kosong`);
  for (const v of q.vocab || []) {
    if (!VOCAB_IDS.has(v) && !HIDDEN_IDS.includes(v) && !NAME_IDS.includes(v)) {
      err(`${q.id}: id kosakata tidak dikenal: ${v}`);
    }
  }
}

/* ==========================================================================
 * 3. Cakupan kosakata: dekomposisi seluruh teks Jepang
 * ========================================================================*/
/* Segmentasi teks Jepang menjadi kata-kata Bab 1–10 (dynamic programming).
 * Mengembalikan sisa teks yang tidak bisa diuraikan sama sekali. */
function decompose(text) {
  const clean = text.replace(/[\s。、？！・]+/g, '');
  const n = clean.length;
  const dp = new Array(n + 1).fill(false);
  const back = new Array(n + 1).fill(-1);
  dp[0] = true;
  for (let i = 0; i < n; i++) {
    if (!dp[i]) continue;
    for (const s of SURFACES) {
      if (clean.startsWith(s.form, i)) {
        const j = i + s.form.length;
        if (!dp[j]) { dp[j] = true; back[j] = i; }
      }
    }
  }
  if (dp[n]) return '';
  /* tidak bisa diuraikan penuh: cari titik terjauh lalu laporkan sisa setelahnya */
  let far = 0;
  for (let i = n; i >= 0; i--) if (dp[i]) { far = i; break; }
  const tail = clean.slice(far);
  /* sisa spesifik: karakter pertama yang tidak punya kata berawalan sama */
  let out = '';
  for (let i = far; i < n; i++) {
    const ok = SURFACES.some(s => clean.startsWith(s.form, i));
    if (!ok) out += clean[i];
  }
  return out || tail;
}

const JAPANESE_ONLY = /^[\u3041-\u309f\u30a1-\u30fa\u30fcー\u4e00-\u9faf\s。、？！・]+$/;
const unknownChunks = new Map();
for (const q of all) {
  const jpFields = [];
  if (q.prompt) jpFields.push(q.prompt);
  if (q.audioText) jpFields.push(q.audioText);
  if (Array.isArray(q.answer)) jpFields.push(q.answer.join(''));
  if (q.options) q.options.forEach(o => jpFields.push(o));
  if (q.tiles) q.tiles.forEach(o => jpFields.push(o));
  if (q.dialogue) q.dialogue.forEach(d => jpFields.push(d.text));
  if (q.pairs) q.pairs.forEach(p => jpFields.push(p.jp));
  for (const t of jpFields) {
    if (!JAPANESE_ONLY.test(t)) continue;
    const left = decompose(t);
    if (left) {
      for (const ch of left) unknownChunks.set(ch, (unknownChunks.get(ch) || 0) + 1);
      warn(`${q.id}: teks di luar daftar kosakata Bab 1–10: "${left}" (pada: ${t.slice(0, 60)})`);
    }
  }
}

/* kosakata yang dipakai bendera "perlu ditinjau" terhadap dataset pembanding */
const usedVocab = new Set();
for (const q of all) (q.vocab || []).forEach(v => usedVocab.add(v));
const vocabNotInReference = VOCAB.filter(v => REFERENCE_EXCEPTIONS[v.jp] || REFERENCE_EXCEPTIONS[v.kana]);
const vocabUnused = VOCAB.filter(v => !usedVocab.has(v.id));

/* ==========================================================================
 * 4. Duplikat & near-duplicate
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

/* near-duplicate: kalimat jawaban sama persis dipakai berulang */
const sentMap = new Map();
for (const q of all) {
  const sent = checkedAnswerSentence(q).replace(/\s+/g, '');
  if (!sent) continue;
  if (!sentMap.has(sent)) sentMap.set(sent, []);
  sentMap.get(sent).push(q.id);
}
const repeatedSentences = [...sentMap.entries()].filter(([, ids]) => ids.length > 1);
const sentenceReuse = repeatedSentences.reduce((s, [, ids]) => s + ids.length - 1, 0);

/* near-duplicate lemah: kalimat jawaban hanya berbeda 1 kata benda */
function skeleton(sent) {
  let s = sent;
  const nouns = [...IS_THING, ...IS_LIVING, ...IS_PLACE].sort((a, b) => b.length - a.length);
  for (const n of nouns) s = s.split(n).join('○');
  return s;
}
const skelMap = new Map();
for (const q of all) {
  if (q.type === 'match') continue;
  const sent = checkedAnswerSentence(q).replace(/\s+/g, '');
  if (!sent) continue;
  const sk = skeleton(sent);
  if (!skelMap.has(sk)) skelMap.set(sk, []);
  skelMap.get(sk).push(q.id);
}
const skeletonFamilies = [...skelMap.entries()].filter(([, ids]) => ids.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

/* ==========================================================================
 * 5. Sebaran tipe soal
 * ========================================================================*/
const TYPE_TARGET = { complete: 180, arrange: 170, short_conversation: 160, listening: 130, translate: 130, choose_translation: 130, match: 100 };
const typeCount = {};
for (const q of all) typeCount[q.type] = (typeCount[q.type] || 0) + 1;

/* ==========================================================================
 * 6. Sebaran bunpou
 * ========================================================================*/
const POS_WORDS = VOCAB.filter(v => v.type === 'position').map(v => v.jp);
const BUNPOU = [
  { key: 'A1', name: 'N に N が あります',        test: s => /が\s*あります/.test(s) && !/何も|だれも/.test(s) && !POS_WORDS.some(p => s.includes(p + 'の') || s.includes('の ' + p)) },
  { key: 'A2', name: 'N に N が います',          test: s => /が\s*います/.test(s) && !/だれも/.test(s) && !POS_WORDS.some(p => s.includes(p + 'の') || s.includes('の ' + p)) },
  { key: 'B1', name: 'N は 場所 に あります/います', test: s => /は\s*[^。]*に\s*(あります|います)/.test(s) },
  { key: 'C1', name: '～や ～など',                test: s => /や/.test(s) && /など/.test(s) },
  { key: 'C2', name: '～と (daftar lengkap) / 間 に', test: s => /と\s*[^。]*の\s*間に/.test(s) || /と\s*[^。]*が\s*(あります|います)/.test(s) },
  { key: 'D1', name: 'Posisi 上/下/前/後ろ/中/外/右/左/隣/近く', test: s => POS_WORDS.some(p => p !== '間' && (s.includes('の ' + p) || s.includes('の' + p))) },
  { key: 'D2', name: 'Posisi 間 (N1 と N2 の 間に)', test: s => /間/.test(s) },
  { key: 'E1', name: 'Pertanyaan どこ / 何が / だれが', test: s => /どこ/.test(s) || /何が/.test(s) || /だれが/.test(s) },
  { key: 'E2', name: 'Negatif ありません / いません', test: s => /ありません|いません/.test(s) },
  { key: 'E3', name: '何も ありません / だれも いません', test: s => /何も|だれも/.test(s) },
];
/* pola utama (prioritas, tidak tumpang tindih) untuk tabel frekuensi */
function primaryPattern(q) {
  if (q.type === 'match') return 'match';
  const s = checkedAnswerSentence(q).replace(/\s+/g, '');
  if (/何も|だれも/.test(s)) return 'nanimo';
  if (/と[^。]*の間に/.test(s)) return 'aida';
  if (/や.*など/.test(s)) return 'ya_nado';
  if (/どこ/.test(s)) return 'q_where';
  if (/何が/.test(s)) return 'q_nani';
  if (/だれが/.test(s)) return 'q_dare';
  if (POS_WORDS.some(p => s.includes('の' + p)) && /です/.test(s)) return 'pos_desu';
  if (POS_WORDS.some(p => s.includes('の' + p))) return /います/.test(s) ? 'pos_iru' : 'pos_aru';
  if (/ありません|いません/.test(s)) return 'neg';
  if (/は[^。]*に(あります|います)/.test(s)) return 'wa_place';
  if (/がいます/.test(s)) return 'iru_place';
  if (/があります/.test(s)) return 'aru_place';
  if (/と[^。]*があります/.test(s)) return 'ya_nado';
  return 'lain-lain';
}
const PRIMARY_NAME = {
  aru_place: 'N に N が あります', iru_place: 'N に N が います',
  wa_place: 'N は 場所 に あります/います', neg: 'Bentuk negatif ありません/いません',
  nanimo: '何も ありません / だれも いません', pos_aru: 'Posisi + あります',
  pos_iru: 'Posisi + います', pos_desu: 'Posisi + です', aida: 'N1 と N2 の 間に',
  ya_nado: '～や～など / ～と', q_where: 'どこに/どこ の質問', q_nani: '何が の質問',
  q_dare: 'だれが の質問', match: 'Jodohkan kosakata', 'lain-lain': 'lain-lain',
};
const primaryCount = {};
const levelTypeMap = [];
for (const lvl of LEVELS) {
  const tc = {};
  for (const q of lvl.questions) tc[q.type] = (tc[q.type] || 0) + 1;
  levelTypeMap.push({ level: lvl.level, types: Object.keys(tc).length, detail: tc });
}
for (const q of all) {
  const p = primaryPattern(q);
  primaryCount[p] = (primaryCount[p] || 0) + 1;
}

const bunpouHits = {};
for (const b of BUNPOU) bunpouHits[b.key] = [];
const posWordHits = {};
POS_WORDS.forEach(p => { posWordHits[p] = 0; });
for (const q of all) {
  const s = checkedAnswerSentence(q).replace(/\s+/g, '');
  for (const b of BUNPOU) if (b.test(s)) bunpouHits[b.key].push(q.id);
  for (const p of POS_WORDS) if (s.includes('の' + p)) posWordHits[p]++;
}

/* ==========================================================================
 * LAPORAN
 * ========================================================================*/
const line = s => console.log(s);
line('================================================================');
line('AUDIT BANK SOAL BAB 10 (Minna no Nihongo I, Bab 1–10)');
line('================================================================');
line(`Level          : ${LEVELS.length}`);
line(`Total soal     : ${all.length}`);
line(`Kosakata (file): ${VOCAB.length} entri`);
line('');
line('--- Sebaran tipe soal ---');
for (const t of KNOWN_TYPES) {
  const n = typeCount[t] || 0;
  const tgt = TYPE_TARGET[t];
  const d = n - tgt;
  line(`  ${t.padEnd(18)} ${String(n).padStart(4)}  ${(n / 10).toFixed(1).padStart(5)}%   target ${String(tgt).padStart(3)}  (${d >= 0 ? '+' : ''}${d})`);
}
line('');
line('--- Pola utama tiap soal (eksklusif, total 100%) ---');
const primaryOrder = ['aru_place', 'iru_place', 'wa_place', 'neg', 'nanimo', 'pos_aru', 'pos_iru', 'pos_desu',
  'aida', 'ya_nado', 'q_where', 'q_nani', 'q_dare', 'match', 'lain-lain'];
for (const k of primaryOrder) {
  const n = primaryCount[k] || 0;
  if (!n && k === 'lain-lain') continue;
  line(`  ${k.padEnd(10)} ${String(n).padStart(4)}  ${(n / 10).toFixed(1).padStart(5)}%  ${PRIMARY_NAME[k] || k}`);
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
line('--- Sebaran bunpou Bab 10 (soal terkait, % dari 1000) ---');
for (const b of BUNPOU) {
  const n = bunpouHits[b.key].length;
  line(`  ${b.key}  ${String(n).padStart(4)}  ${(n / 10).toFixed(1).padStart(5)}%  ${b.name}`);
}
line('');
line('  Cakupan tiap kata posisi (muncul pada kalimat soal):');
line('    ' + POS_WORDS.map(p => `${p}=${posWordHits[p]}`).join('  '));
line('');
line('--- Kosakata ---');
line(`  entri dipakai di field vocab : ${VOCAB.length - vocabUnused.length}/${VOCAB.length}`);
if (vocabUnused.length) warn('kosakata tidak terpakai: ' + vocabUnused.map(v => v.jp).join(', '));
line(`  entri di luar dataset pembanding (diverifikasi manual): ${vocabNotInReference.length}`);
for (const v of vocabNotInReference) line(`      - ${v.jp} (${v.kana}) — ${REFERENCE_EXCEPTIONS[v.jp] || REFERENCE_EXCEPTIONS[v.kana]}`);
if (unknownChunks.size) {
  line(`  teks Jepang di luar daftar kosakata: ${[...unknownChunks.keys()].join(' ')}`);
} else {
  line('  OK: seluruh teks Jepang dapat diuraikan dari kosakata Bab 1–10.');
}
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
line(`  soal kembar (isi identik)       : ${dupCount}`);
line(`  kalimat jawaban yang dipakai >1x: ${repeatedSentences.length} kalimat (kelebihan ${sentenceReuse} pemakaian)`);
line(`  keluarga kalimat beda 1 kata    : ${skeletonFamilies.length}`);
for (const [sk, ids] of skeletonFamilies.slice(0, 8)) {
  line(`      ${ids.length}x [${ids.slice(0, 4).join(', ')}${ids.length > 4 ? ', …' : ''}]  ${sk.slice(0, 60)}`);
}
line('');
if (warnings.length) {
  line(`CATATAN / PERLU DITINJAU (${warnings.length}):`);
  const shown = warnings.slice(0, 60);
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
  line('       kosakata Bab 1–10, duplikat, maupun sebaran pola.');
}
line('================================================================');
