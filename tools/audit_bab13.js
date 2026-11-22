#!/usr/bin/env node
/* ============================================================================
 * tools/audit_bab13.js  ·  Audit kualitas bank soal Bab 13
 *
 * Memeriksa berkas hasil `tools/generate_bab13.js` (js/data/levels_bab13.js)
 * tanpa mengubah apa pun. Pemeriksaan:
 *   1. Struktur  : 30 level × 15 soal, id unik, tidak ada soal kosong.
 *   2. Tipe      : semua tipe soal yang didukung aplikasi dipakai.
 *   3. Kalimat   : fullJp unik; tiap tipe konsisten dengan datanya.
 *   4. Kosakata  : setiap huruf/kanji dalam fullJp & reading ada di daftar
 *                  Bab 1–13 (tools/reference/kotoba_bab1-13.txt) atau
 *                  allowlist fungsional Bab 13.
 *   5. Pola      : setiap topik wajib muncul; hitung topik & bentuk.
 *   6. Distribusi: posisi jawaban benar merata, persentase kasual 5–12%,
 *                  jumlah soal per tier.
 *
 * Pemakaian: node tools/audit_bab13.js [--verbose]
 * Kode keluar 1 bila ada temuan berstatus GAGAL.
 * ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const G = require('./bab13_grammar');

const VERBOSE = process.argv.includes('--verbose');
const ROOT = path.resolve(__dirname, '..');
const LEVELS_FILE = path.join(ROOT, 'js/data/levels_bab13.js');
const VOCAB_FILE = path.join(ROOT, 'js/data/vocab_bab13.js');
const REF_FILE = path.join(ROOT, 'tools/reference/kotoba_bab1-13.txt');

const findings = [];
const notes = [];
const add = (status, section, msg) => findings.push({ status, section, msg });
const GAGAL = 'GAGAL';
const PERHATIAN = 'PERHATIAN';

/* ---------------------------------------------------------------- loader -- */
function loadGlobals(file, key) {
  const src = fs.readFileSync(file, 'utf8');
  const sandbox = { window: {} };
  // eslint-disable-next-line no-new-func
  new Function('window', src)(sandbox.window);
  if (!sandbox.window[key]) throw new Error(`${path.basename(file)} tidak mengisi ${key}`);
  return sandbox.window[key];
}

if (!fs.existsSync(LEVELS_FILE)) {
  console.error('Berkas levels_bab13.js belum ada. Jalankan tools/generate_bab13.js dulu.');
  process.exit(1);
}

const LEVELS = loadGlobals(LEVELS_FILE, 'LEVELS_BAB13_DATA');
const VOCAB = fs.existsSync(VOCAB_FILE) ? loadGlobals(VOCAB_FILE, 'VOCAB_BAB13_DATA') : [];
const QUESTIONS = LEVELS.flatMap(l => l.questions || []);

/* ------------------------------------------------------------- 1. struktur -- */
if (LEVELS.length !== 30) add(GAGAL, 'struktur', `Level ${LEVELS.length}, seharusnya 30`);
else notes.push('30 level');
LEVELS.forEach(lv => {
  if (!lv.questions || lv.questions.length !== 15) add(GAGAL, 'struktur', `Level ${lv.level} berisi ${lv.questions ? lv.questions.length : 0} soal (15)`);
  if (!lv.title || !lv.tier || !lv.focus) add(PERHATIAN, 'struktur', `Level ${lv.level} metadata tidak lengkap`);
});
const ids = QUESTIONS.map(q => q.id);
if (new Set(ids).size !== ids.length) add(GAGAL, 'struktur', 'Ada id soal duplikat');
if (QUESTIONS.length !== 450) add(GAGAL, 'struktur', `Total soal ${QUESTIONS.length}, seharusnya 450`);
else notes.push('450 soal');

/* ---------------------------------------------------------------- 2. tipe -- */
const SUPPORTED = ['complete', 'choose_translation', 'translate', 'arrange', 'listening', 'short_conversation', 'match'];
const typeCount = {};
QUESTIONS.forEach(q => { typeCount[q.type] = (typeCount[q.type] || 0) + 1; });
SUPPORTED.forEach(t => {
  if (!typeCount[t]) add(GAGAL, 'tipe', `Tipe ${t} tidak dipakai`);
});
Object.keys(typeCount).forEach(t => {
  if (!SUPPORTED.includes(t)) add(GAGAL, 'tipe', `Tipe ${t} tidak didukung js/questions.js`);
});
notes.push('tipe soal: ' + Object.entries(typeCount).map(([k, v]) => `${k}=${v}`).join(', '));

/* -------------------------------------------------------------- 3. kalimat -- */
const sentences = new Map();
QUESTIONS.forEach(q => {
  if (!q.fullJp) { add(GAGAL, 'kalimat', `${q.id}: fullJp kosong`); return; }
  const key = q.fullJp.replace(/\s/g, '');
  if (sentences.has(key)) add(GAGAL, 'kalimat', `${q.id} duplikat dengan ${sentences.get(key)}: ${q.fullJp}`);
  else sentences.set(key, q.id);
  if (!q.translation) add(GAGAL, 'kalimat', `${q.id}: terjemahan kosong`);
  if (!q.explanation) add(GAGAL, 'kalimat', `${q.id}: pembahasan kosong`);
  if (!q.topic) add(GAGAL, 'kalimat', `${q.id}: topik kosong`);

  if (q.type === 'complete') {
    if (!/＿＿＿/.test(q.prompt)) add(GAGAL, 'kalimat', `${q.id}: tidak ada rongga`);
    else if (q.prompt.replace('＿＿＿', q.answer) !== q.fullJp) add(GAGAL, 'kalimat', `${q.id}: prompt+answer ≠ fullJp`);
    if (!q.options || q.options.length !== 4) add(GAGAL, 'kalimat', `${q.id}: opsi bukan 4`);
    else if (!q.options.includes(q.answer)) add(GAGAL, 'kalimat', `${q.id}: jawaban tidak ada di opsi`);
  } else if (q.type === 'choose_translation' || q.type === 'short_conversation') {
    if (!q.options || q.options.length !== 4) add(GAGAL, 'kalimat', `${q.id}: opsi bukan 4`);
    else {
      if (!q.options.includes(q.answer)) add(GAGAL, 'kalimat', `${q.id}: jawaban tidak ada di opsi`);
      if (new Set(q.options).size !== 4) add(GAGAL, 'kalimat', `${q.id}: opsi duplikat`);
    }
  } else if (q.type === 'match') {
    if (!q.pairs || q.pairs.length !== 4) add(GAGAL, 'kalimat', `${q.id}: pasangan bukan 4`);
    else {
      if (new Set(q.pairs.map(p => p.jp)).size !== 4) add(GAGAL, 'kalimat', `${q.id}: pasangan Jepang duplikat`);
      if (new Set(q.pairs.map(p => p.id)).size !== 4) add(GAGAL, 'kalimat', `${q.id}: arti pasangan duplikat`);
      q.pairs.forEach(p => { if (!p.vocabId) add(PERHATIAN, 'kalimat', `${q.id}: pasangan ${p.jp} tanpa vocabId`); });
    }
  } else if (q.type === 'arrange' || q.type === 'translate' || q.type === 'listening') {
    if (!q.tiles || !q.answer) add(GAGAL, 'kalimat', `${q.id}: tiles/answer kosong`);
    else {
      if (q.answer.join('') !== q.fullJp) add(GAGAL, 'kalimat', `${q.id}: susunan ≠ fullJp`);
      const need = {}; q.answer.forEach(t => { need[t] = (need[t] || 0) + 1; });
      q.tiles.forEach(t => { if (need[t]) need[t]--; });
      if (Object.values(need).some(v => v > 0)) add(GAGAL, 'kalimat', `${q.id}: tile kurang`);
    }
    if (q.type === 'listening' && q.audioText !== q.fullJp) add(GAGAL, 'kalimat', `${q.id}: audioText ≠ fullJp`);
  } else if (q.type === 'short_conversation') {
    if (!q.dialogue || q.dialogue.length < 2) add(GAGAL, 'kalimat', `${q.id}: dialog kurang`);
  }
});

/* ------------------------------------------------------------ 4. kosakata -- */
const ALLOWED = new Set(G.allowedSurfaces());
const MAXLEN = Math.max(...[...ALLOWED].map(s => s.length));
function unlisted(text) {
  const chunks = String(text)
    .replace(/[。、？！「」（）\s・…／＿]/g, ' ')
    .split(' ')
    .filter(Boolean);
  const bad = [];
  for (const ch of chunks) {
    const memo = new Map();
    const ok = i => {
      if (i === ch.length) return true;
      if (memo.has(i)) return memo.get(i);
      for (let len = Math.min(MAXLEN, ch.length - i); len > 0; len--) {
        if (ALLOWED.has(ch.slice(i, i + len)) && ok(i + len)) { memo.set(i, true); return true; }
      }
      memo.set(i, false);
      return false;
    };
    if (!ok(0)) bad.push(ch);
  }
  return bad;
}

/* Hanya teks berbahasa Jepang yang diperiksa: tidak memuat huruf Latin. */
const isJapanese = t => typeof t === 'string' && t.length > 0 && !/[A-Za-z]/.test(t);
const pushAll = (arr, v) => {
  if (Array.isArray(v)) v.forEach(x => pushAll(arr, x));
  else if (typeof v === 'string') arr.push(v);
};
QUESTIONS.forEach(q => {
  const texts = [];
  pushAll(texts, q.fullJp);
  pushAll(texts, q.reading || '');
  pushAll(texts, q.answer);
  pushAll(texts, q.audioText);
  pushAll(texts, q.options);
  pushAll(texts, q.tiles);
  if (q.pairs) q.pairs.forEach(p => { pushAll(texts, p.jp); });
  if (q.dialogue) q.dialogue.forEach(d => pushAll(texts, d.text));
  const bad = new Set();
  texts.filter(isJapanese).forEach(t => unlisted(t).forEach(x => bad.add(x)));
  bad.forEach(x => add(GAGAL, 'kosakata', `${q.id} (${q.type}): di luar daftar Bab 1–13 → 「${x}」`));
  if (q.reading && /[\u4e00-\u9fff]/.test(q.reading)) add(GAGAL, 'kosakata', `${q.id}: reading masih memuat kanji → ${q.reading}`);
});

/* ---------------------------------------------------------------- 5. pola -- */
const REQUIRED_TOPICS = [
  ['hoshii_bentuk', 'ほしい bentuk positif/negatif/lampau'],
  ['hoshii_partikel', 'partikel が pada ほしい'],
  ['hoshii_tawaran', 'いかがですか / tawaran'],
  ['hoshii_beda_tai', 'ほしい vs たい'],
  ['tai_bentuk', 'たい bentuk positif/negatif/lampau'],
  ['tai_objek', 'partikel を pada たい'],
  ['tai_tawaran', 'ませんか / ましょう'],
  ['tujuan_dasar', 'tujuan kegiatan へ…に'],
  ['tujuan_objek', 'objek pada kalimat tujuan'],
  ['tujuan_ki', 'に来ます'],
  ['tujuan_kaeru', 'に帰ります / に会います'],
  ['itsuka_pakai', 'いつか'],
  ['dareka_tanya', 'だれか / だれも'],
  ['nanika_partikel', 'なにか + partikel'],
  ['dokoka_partikel', 'どこか + partikel'],
  ['campur_pola', 'campuran pola bab'],
  ['campur_partikel', 'campuran partikel'],
];
const topicCount = {};
QUESTIONS.forEach(q => { topicCount[q.topic] = (topicCount[q.topic] || 0) + 1; });
REQUIRED_TOPICS.forEach(([topic, label]) => {
  if (!topicCount[topic]) add(GAGAL, 'pola', `Topik wajib tidak ada: ${label} (${topic})`);
});
notes.push('topik terpakai: ' + Object.keys(topicCount).length);

/* ---------------------------------------------------------- 6. distribusi -- */
const pos = [0, 0, 0, 0];
QUESTIONS.forEach(q => {
  if (!q.options || typeof q.answer !== 'string') return;
  const i = q.options.indexOf(q.answer);
  if (i >= 0) pos[i]++;
});
const posTotal = pos.reduce((a, b) => a + b, 0);
pos.forEach((n, i) => {
  const pct = (n / posTotal) * 100;
  if (pct < 15 || pct > 35) add(PERHATIAN, 'distribusi', `Posisi jawaban ${i + 1} = ${pct.toFixed(1)}% (target ~25%)`);
});
notes.push('posisi jawaban: ' + pos.join(' / '));

const casual = QUESTIONS.filter(q => q.casual).length;
const casualPct = (casual / QUESTIONS.length) * 100;
if (casualPct < 5 || casualPct > 12) add(GAGAL, 'distribusi', `Kasual ${casualPct.toFixed(1)}% (target 5–12%)`);
else notes.push(`kasual ${casual} soal (${casualPct.toFixed(1)}%)`);

const tiers = {};
LEVELS.forEach(lv => { tiers[lv.tier] = (tiers[lv.tier] || 0) + 1; });
notes.push('tier: ' + Object.entries(tiers).map(([k, v]) => `${k}=${v}`).join(', '));

/* ------------------------------------------------------------- 7. kosakata bab -- */
if (!VOCAB.length) add(GAGAL, 'kosakata', 'vocab_bab13.js kosong');
else {
  const lesson13 = VOCAB.filter(v => v.lesson === 13).length;
  notes.push(`kosakata: ${VOCAB.length} entri (Bab 13: ${lesson13}, rujukan Bab 1–12: ${VOCAB.length - lesson13})`);
  if (new Set(VOCAB.map(v => v.id)).size !== VOCAB.length) add(GAGAL, 'kosakata', 'id kosakata duplikat');
  VOCAB.forEach(v => {
    if (!v.jp || !v.kana || !v.id_mean) add(GAGAL, 'kosakata', `Entri kosakata tidak lengkap: ${v.id}`);
    if (!Number.isInteger(v.lesson) || v.lesson < 1 || v.lesson > 13) add(GAGAL, 'kosakata', `${v.id}: bab tidak valid (${v.lesson})`);
  });
}

if (fs.existsSync(REF_FILE)) notes.push('referensi: ' + path.relative(ROOT, REF_FILE));

/* --------------------------------------------------------------- laporan -- */
const fail = findings.filter(f => f.status === GAGAL);
const warn = findings.filter(f => f.status === PERHATIAN);
const bySection = {};
findings.forEach(f => { bySection[f.section] = (bySection[f.section] || 0) + 1; });

console.log('AUDIT BAB 13');
console.log('='.repeat(60));
notes.forEach(n => console.log('  · ' + n));
console.log('-'.repeat(60));
if (!findings.length) console.log('  Tidak ada temuan.');
else {
  const limit = VERBOSE ? findings.length : 40;
  findings.slice(0, limit).forEach(f => console.log(`  [${f.status}] ${f.section}: ${f.msg}`));
  if (findings.length > limit) console.log(`  … ${findings.length - limit} temuan lain (pakai --verbose)`);
}
console.log('-'.repeat(60));
console.log(`Ringkasan: ${GAGAL} ${fail.length} · ${PERHATIAN} ${warn.length}`);
if (Object.keys(bySection).length) console.log('Per bagian:', bySection);
process.exit(fail.length ? 1 : 0);
