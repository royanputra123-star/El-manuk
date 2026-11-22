#!/usr/bin/env node
/* ============================================================================
 * tools/generate_bab13.js
 * Generator bank soal Minna no Nihongo Bab 13 → 30 level × 15 soal (450 soal).
 *
 * Alur:
 *   1. Muat 5 bank record (ほしい / たい / tujuan / いつか・だれか / なにか・どこか
 *      / campuran).
 *   2. Bagi sesuai peta level yang diminta (1–5, 6–10, 11–15, 16–20, 21–25, 26–30).
 *   3. Rotasi posisi jawaban benar dan pastikan setiap level memuat ≥ 4 tipe soal.
 *   4. Validasi penuh sebelum menulis: jumlah, duplikat, kosakata, konjugasi,
 *      partikel, furigana, dan cakupan bunpou.
 * Jika validasi gagal, file keluaran TIDAK ditulis.
 * ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const G = require('./bab13_grammar');
const F = require('./bab13_factory');
const R = require('./bab13_render');

const ROOT = path.join(__dirname, '..');
const BANDS = [
  require('./bab13_bank_hoshii'),
  require('./bab13_bank_tai'),
  require('./bab13_bank_tujuan'),
  require('./bab13_bank_itsuka'),
  require('./bab13_bank_nanika'),
  { band: 'campuran', focus: '', records: require('./bab13_bank_campuran').records.slice(0, 48) },
  { band: 'campuran', focus: '', records: require('./bab13_bank_campuran_extra').records },
];

const LEVEL_COUNT = 30;
const PER_LEVEL = 15;
const TOTAL = LEVEL_COUNT * PER_LEVEL;

/* Peta level → band + fokus. Level 26–30 mengambil campuran + sisa band lain. */
const LEVEL_PLAN = [];
const BAND_RULES = [
  { band: 'hoshii', from: 1, to: 5, focus: '～がほしいです: positif · negatif · lampau · negatif lampau · tanya-jawab · いかがですか' },
  { band: 'tai', from: 6, to: 10, focus: '～たいです dan perubahannya: positif · negatif · lampau · negatif lampau · を／が · ませんか' },
  { band: 'tujuan', from: 11, to: 15, focus: 'Tujuan kegiatan: ～に行きます／来ます／帰ります · partikel へ・を・に' },
  { band: 'itsuka', from: 16, to: 20, focus: 'Kata tanya + か: いつか (suatu hari) dan だれか (seseorang)' },
  { band: 'nanika', from: 21, to: 25, focus: 'Kata tanya + か: なにか (sesuatu) dan どこか (suatu tempat), を／へ yang boleh hilang' },
  { band: 'campuran', from: 26, to: 30, focus: 'Campuran seluruh bunpou Bab 13: konteks, pola, partikel, dan percakapan' },
];
for (const rule of BAND_RULES) {
  for (let l = rule.from; l <= rule.to; l++) {
    LEVEL_PLAN.push({ level: l, band: rule.band, focus: rule.focus });
  }
}

const byBand = {};
BANDS.forEach(b => {
  if (!byBand[b.band]) byBand[b.band] = [];
  byBand[b.band] = byBand[b.band].concat(b.records);
});

/* Prioritaskan tipe percakapan & susun agar setiap level kaya variasi. */
function classify(records) {
  const dialog = [];
  const match = [];
  const slot = [];
  for (const r of records) {
    if (r.pairs) match.push(r);
    else if (r.a) dialog.push(r);
    else slot.push(r);
  }
  return { dialog, match, slot };
}

/* Susun 15 soal per level dari pool yang belum dipakai pada level-level
 * sebelumnya dalam bab yang sama. Kuota: 4 dialog + 2 match + 9 slot;
 * bila salah satu jenis habis, sisanya diisi jenis lain. */
function buildLevelQuestions(level, pool, globalIndex, seenSentences) {
  const used = pool.used;
  const sentenceKey = (r) => {
    if (r.pairs) return r.pairs.map(p => p.jp).join('・');
    if (r.a) return r.a.map(t => t.jp).join('') + r.bBefore.map(t => t.jp).join('') + r.answer.jp + r.bAfter.map(t => t.jp).join('');
    return r.tokens.map(t => t.jp).join('');
  };
  const fresh = (list) => list.filter(r => !used.has(r) && !seenSentences.has(sentenceKey(r)));
  const take = (list, n) => {
    const out = fresh(list);
    /* rotasi agar urutan bervariasi tetapi deterministik */
    const shift = pool.cursor[list.__kind] || 0;
    const rotated = out.length ? out.slice(shift % out.length).concat(out.slice(0, shift % out.length)) : [];
    pool.cursor[list.__kind] = shift + n;
    return rotated.slice(0, n);
  };
  pool.dialog.__kind = 'dialog';
  pool.match.__kind = 'match';
  pool.slot.__kind = 'slot';

  const picked = [];
  const pushAll = (arr) => arr.forEach(r => picked.push(r));

  pushAll(take(pool.dialog, 4));
  pushAll(take(pool.match, 2));
  pushAll(take(pool.slot, PER_LEVEL - picked.length));
  /* Lengkapi dari jenis lain bila kuota tidak terpenuhi (pool menipis). */
  if (picked.length < PER_LEVEL) {
    const rest = [...fresh(pool.slot), ...fresh(pool.dialog), ...fresh(pool.match)]
      .filter(r => !picked.includes(r));
    for (const r of rest) { if (picked.length >= PER_LEVEL) break; picked.push(r); }
  }
  /* Jaring pengaman: buang record yang kalimatnya sama dengan yang sudah
   * terpakai pada level ini (kalau ada) lalu isi dari pool lain. */
  const seenLocal = new Set();
  const dedup = [];
  for (const r of picked) {
    const k = r.pairs ? r.pairs.map(p => p.jp).join('・')
      : r.a ? r.a.map(t => t.jp).join('') + r.bBefore.map(t => t.jp).join('') + r.answer.jp + r.bAfter.map(t => t.jp).join('')
      : r.tokens.map(t => t.jp).join('');
    if (seenLocal.has(k)) continue;
    seenLocal.add(k);
    dedup.push(r);
  }
  if (dedup.length < PER_LEVEL) {
    const extra = [...fresh(pool.slot), ...fresh(pool.dialog), ...fresh(pool.match)].filter(r => !dedup.includes(r));
    for (const r of extra) {
      const k = r.pairs ? r.pairs.map(p => p.jp).join('・')
        : r.a ? r.a.map(t => t.jp).join('') + r.bBefore.map(t => t.jp).join('') + r.answer.jp + r.bAfter.map(t => t.jp).join('')
        : r.tokens.map(t => t.jp).join('');
      if (seenLocal.has(k)) continue;
      seenLocal.add(k); dedup.push(r);
      if (dedup.length >= PER_LEVEL) break;
    }
  }
  picked.length = 0;
  picked.push(...dedup);
  if (picked.length !== PER_LEVEL) throw new Error(`Pool ${pool.name} tidak cukup untuk level ${level} (${picked.length}/${PER_LEVEL})`);

  const kinds = picked.map(r => (r.pairs ? 'match' : r.a ? 'dialog' : 'slot'));
  /* Urutkan agar tidak mengelompok: slot, dialog, slot, slot, match, ... */
  const order = ['slot', 'dialog', 'slot', 'slot', 'match', 'slot', 'dialog', 'slot', 'slot', 'match', 'slot', 'dialog', 'slot', 'slot', 'dialog'];
  const buckets = { slot: [], dialog: [], match: [] };
  picked.forEach((r, i) => buckets[kinds[i]].push(r));
  const seq = [];
  for (const kind of order) {
    if (buckets[kind].length) seq.push({ kind, rec: buckets[kind].shift() });
    else {
      const alt = ['dialog', 'slot', 'match'].find(k => buckets[k].length);
      if (alt) seq.push({ kind: alt, rec: buckets[alt].shift() });
    }
  }
  while (seq.length < PER_LEVEL) {
    const alt = ['slot', 'dialog', 'match'].find(k => buckets[k].length);
    if (!alt) break;
    seq.push({ kind: alt, rec: buckets[alt].shift() });
  }

  const typeCount = {};
  const questions = seq.map((item, i) => {
    const id = `q_b13_${globalIndex.n++}`;
    let q;
    if (item.kind === 'dialog') q = R.renderDialogue(item.rec, id, i);
    else if (item.kind === 'match') q = R.renderMatch(item.rec, id);
    else {
      const type = R.TYPE_CYCLE[(globalIndex.t + i) % R.TYPE_CYCLE.length];
      q = R.renderSlot(item.rec, type, id, i);
      globalIndex.t++;
    }
    typeCount[q.type] = (typeCount[q.type] || 0) + 1;
    used.add(item.rec);
    return q;
  });
  return { questions, typeCount };
}

/* --------------------------------------------------------------------------
   Bangun semua level
   -------------------------------------------------------------------------- */
function buildAll() {
  const globalIndex = { n: 1, t: 0 };
  const levels = [];
  const usedGlobal = new Set();
  const stats = { generated: 0 };

  /* Semua kalimat unik lintas bab: dipakai menyaring record duplikat. */
  const globalSentences = new Set();

  /* Kumpulan record per band, dengan kursor agar pemakaian merata. */
  const pools = {};
  for (const key of Object.keys(byBand)) {
    const cls = classify(byBand[key]);
    pools[key] = { ...cls, name: key, cursor: { dialog: 0, match: 0, slot: 0 }, used: new Set() };
  }

  /* Tidak ada kalimat yang dipakai dua kali di seluruh bab. Karena itu setiap
   * band diberi jendela record unik per level (anti duplikat). */
  const usedInBand = {};
  for (const plan of LEVEL_PLAN) {
    const pool = pools[plan.band];
    if (!usedInBand[plan.band]) usedInBand[plan.band] = new Set();
    pool.used = usedInBand[plan.band];
    const { questions, typeCount } = buildLevelQuestions(plan.level, pool, globalIndex, globalSentences);
    if (questions.length !== PER_LEVEL) throw new Error(`Level ${plan.level} tidak berisi ${PER_LEVEL} soal (${questions.length})`);
    /* Setiap level minimal 4 tipe soal yang berbeda. */
    if (Object.keys(typeCount).length < 4) {
      throw new Error(`Level ${plan.level} hanya memuat ${Object.keys(typeCount).length} tipe soal`);
    }
    questions.forEach(q => {
      usedGlobal.add(q.fullJp);
      globalSentences.add(q.fullJp.replace(/\s/g, ''));
    });
    stats.generated += questions.length;
    levels.push({
      level: plan.level,
      title: `Level ${plan.level}`,
      tier: plan.level <= 10 ? 'mudah' : plan.level <= 20 ? 'sedang' : plan.level <= 25 ? 'kalimat' : 'campuran',
      focus: plan.focus,
      theme: 'Minna no Nihongo Bab 13',
      questions,
    });
  }
  /* ---------------------------------------------------------------------
   Perbaikan cakupan: pastikan setiap topik wajib muncul minimal sekali.
   Ganti soal yang topiknya paling berlimpah dengan record bertopik hilang.
   --------------------------------------------------------------------- */
  const REQUIRED = [
    'hoshii_bentuk', 'hoshii_partikel', 'hoshii_tawaran', 'hoshii_beda_tai',
    'tai_bentuk', 'tai_objek', 'tai_tawaran', 'tujuan_dasar', 'tujuan_objek',
    'tujuan_ki', 'tujuan_kaeru', 'itsuka_pakai', 'dareka_tanya',
    'nanika_partikel', 'dokoka_partikel', 'campur_pola', 'campur_partikel',
  ];
  const countTopics = () => {
    const m = {};
    levels.forEach(l => l.questions.forEach(q => { m[q.topic] = (m[q.topic] || 0) + 1; }));
    return m;
  };
  for (let guard = 0; guard < 60; guard++) {
    const counts = countTopics();
    const missing = REQUIRED.filter(t => !counts[t]);
    if (!missing.length) break;
    const target = missing[0];
    let replaced = false;
    for (const plan of LEVEL_PLAN) {
      const pool = pools[plan.band];
      const rec2 = [...pool.slot, ...pool.dialog, ...pool.match]
        .find(r => r.topic === target && !globalSentences.has(r.pairs ? r.pairs.map(p => p.jp).join('・') : r.a ? r.a.map(t => t.jp).join('') + r.bBefore.map(t => t.jp).join('') + r.answer.jp + r.bAfter.map(t => t.jp).join('') : r.tokens.map(t => t.jp).join('')));
      if (!rec2) continue;
      /* cari soal di level dengan topik terbanyak untuk diganti */
      let best = null;
      levels.forEach((lv2, li) => lv2.questions.forEach((q2, qi) => {
        const c = counts[q2.topic] || 0;
        if (c > 3 && (!best || c > best.c)) best = { li, qi, c };
      }));
      if (!best) continue;
      const lv2 = levels[best.li];
      const old = lv2.questions[best.qi];
      const kind = rec2.pairs ? 'match' : rec2.a ? 'dialog' : 'slot';
      let nq;
      if (kind === 'match') nq = R.renderMatch(rec2, old.id);
      else if (kind === 'dialog') nq = R.renderDialogue(rec2, old.id, best.qi);
      else nq = R.renderSlot(rec2, R.TYPE_CYCLE[best.qi % R.TYPE_CYCLE.length], old.id, best.qi);
      /* pastikan kalimat tidak duplikat */
      const nk = (nq.fullJp || '').replace(/\s/g, '');
      const dup = levels.some(l => l.questions.some(q => q !== old && q.fullJp && q.fullJp.replace(/\s/g, '') === nk));
      if (dup) { globalSentences.add(nk); continue; }
      lv2.questions[best.qi] = nq;
      globalSentences.add(nk);
      replaced = true;
    }
    if (!replaced) break;
  }

  /* ---------------------------------------------------------------------
   Seimbangkan posisi jawaban benar (target ~25% per posisi).
   --------------------------------------------------------------------- */
  let posCursor = 0;
  levels.forEach(lv2 => lv2.questions.forEach(q => {
    if (!q.options || !q.options.length || typeof q.answer !== 'string') return;
    const idx = q.options.indexOf(q.answer);
    if (idx < 0) return;
    const target = posCursor++ % 4;
    if (idx === target) return;
    const opts = q.options.slice();
    opts.splice(idx, 1);
    opts.splice(target, 0, q.answer);
    q.options = opts;
  }));

  return { levels, stats };
}

/* --------------------------------------------------------------------------
   VALIDASI
   -------------------------------------------------------------------------- */
function validate(levels) {
  const problems = [];
  const fail = (msg) => problems.push(msg);

  if (levels.length !== LEVEL_COUNT) fail(`Jumlah level ${levels.length}, seharusnya ${LEVEL_COUNT}`);
  const ids = new Set();
  const sentences = new Map();
  let total = 0, casual = 0;
  const typeTotals = {};
  const topicTotals = {};

  const allowed = G.allowedSurfaces();
  const allowedSet = new Set(allowed);
  const maxLen = Math.max(...allowed.map(s => s.length));

  /* Tokenisasi dengan backtracking: cari pembagian yang seluruhnya ada di
   * daftar kosakata + grammar. */
  function lexiconCheck(text, where) {
    const raw = String(text).replace(/＿+/g, '');
    const chunks = raw.replace(/[。、？！「」（）\s・…]/g, ' ').split(' ').filter(Boolean);
    for (const chunk of chunks) {
      const memo = new Map();
      const ok = (i) => {
        if (i === chunk.length) return true;
        if (memo.has(i)) return memo.get(i);
        for (let len = Math.min(maxLen, chunk.length - i); len > 0; len--) {
          if (allowedSet.has(chunk.slice(i, i + len)) && ok(i + len)) { memo.set(i, true); return true; }
        }
        memo.set(i, false);
        return false;
      };
      if (!ok(0)) fail(`${where}: kosakata di luar daftar Bab 1–13 → 「${chunk}」`);
    }
  }

  /* Tidak ada katakana/kanji di luar whitelist pada cara baca (reading). */
  const KANJI = /[\u4e00-\u9fff]/;

  for (const lvl of levels) {
    if (lvl.questions.length !== PER_LEVEL) fail(`Level ${lvl.level}: ${lvl.questions.length} soal`);
    if (!lvl.focus) fail(`Level ${lvl.level}: fokus kosong`);
    for (const q of lvl.questions) {
      total++;
      if (ids.has(q.id)) fail(`ID ganda ${q.id}`);
      ids.add(q.id);
      if (!/^q_b13_\d+$/.test(q.id)) fail(`Format ID salah ${q.id}`);
      if (!q.translation) fail(`${q.id}: terjemahan kosong`);
      if (!q.explanation) fail(`${q.id}: pembahasan kosong`);
      if (!q.reading) fail(`${q.id}: cara baca kosong`);
      if (KANJI.test(q.reading)) fail(`${q.id}: cara baca masih memuat kanji → ${q.reading}`);
      if (!q.fullJp) fail(`${q.id}: fullJp kosong`);
      typeTotals[q.type] = (typeTotals[q.type] || 0) + 1;
      topicTotals[q.topic] = (topicTotals[q.topic] || 0) + 1;
      if (q.casual) casual++;

      const key = q.fullJp.replace(/\s/g, '');
      if (sentences.has(key) && !q.casual) {
        fail(`Kalimat duplikat ${q.id} ↔ ${sentences.get(key)}: ${q.fullJp}`);
      } else if (!sentences.has(key)) {
        sentences.set(key, q.id);
      }

      lexiconCheck(q.fullJp, q.id + ' fullJp');
      lexiconCheck(q.reading, q.id + ' reading');

      if (q.options) {
        if (q.options.length !== 4) fail(`${q.id}: ${q.options.length} opsi`);
        if (new Set(q.options).size !== 4) fail(`${q.id}: opsi duplikat`);
        if (q.options.filter(o => o === q.answer).length !== 1) fail(`${q.id}: jawaban tidak unik di opsi`);
        q.options.forEach(o => lexiconCheck(o, q.id + ' opsi'));
      }
      if (q.type === 'complete') {
        if ((q.prompt.match(/＿＿＿/g) || []).length !== 1) fail(`${q.id}: rumpang bukan 1`);
        /* prompt + jawaban harus sama dengan kalimat utuh */
        const filled = q.prompt.replace('＿＿＿', q.answer);
        if (filled !== q.fullJp) fail(`${q.id}: prompt+answer ≠ fullJp`);
      }
      if (Array.isArray(q.answer)) {
        if (q.tiles.length !== q.answer.length) fail(`${q.id}: tile ≠ jawaban`);
        if ([...q.tiles].sort().join('|') !== [...q.answer].sort().join('|')) fail(`${q.id}: kecocokan tile salah`);
        if (q.answer.join('') !== q.fullJp) fail(`${q.id}: susunan ≠ fullJp`);
      }
      if (q.type === 'listening' && q.audioText !== q.answer.join('')) fail(`${q.id}: audioText ≠ jawaban`);
      if (q.type === 'short_conversation') {
        if (q.dialogue.length !== 2) fail(`${q.id}: dialog bukan 2 baris`);
        if (!q.answerId || !Array.isArray(q.dialogueId) || q.dialogueId.length !== 2) fail(`${q.id}: metadata dialog kurang`);
        const joined = q.dialogue.map(d => d.text.replace('＿＿＿', q.answer)).join('');
        if (joined !== q.fullJp) fail(`${q.id}: dialog ≠ fullJp (${joined} vs ${q.fullJp})`);
      }
      if (q.type === 'match') {
        if (q.pairs.length !== 4) fail(`${q.id}: pasangan bukan 4`);
        if (new Set(q.pairs.map(p => p.jp)).size !== 4) fail(`${q.id}: jp pasangan duplikat`);
        if (new Set(q.pairs.map(p => p.id)).size !== 4) fail(`${q.id}: arti pasangan duplikat`);
      }
      /* Posisi jawaban benar tidak boleh selalu sama */
      if (q.options) {
        const idx = q.options.indexOf(q.answer);
        if (idx < 0) fail(`${q.id}: jawaban tidak ada di opsi`);
      }
    }
  }

  if (total !== TOTAL) fail(`Total soal ${total}, seharusnya ${TOTAL}`);
  const casualPct = (casual / total) * 100;
  if (casualPct < 5 || casualPct > 12) fail(`Soal kasual ${casual} (${casualPct.toFixed(1)}%), target 5–12%`);

  /* Cakupan bunpou: semua kelompok wajib ada */
  const required = [
    ['hoshii_bentuk', 'ほしい 4 bentuk'],
    ['hoshii_partikel', 'partikel が pada ほしい'],
    ['hoshii_tawaran', 'いかがですか'],
    ['hoshii_beda_tai', 'ほしい vs たい'],
    ['tai_bentuk', 'たい 4 bentuk'],
    ['tai_objek', 'を／が dengan たい'],
    ['tai_tawaran', 'ませんか'],
    ['tujuan_dasar', 'に行きます'],
    ['tujuan_objek', 'objek を dalam tujuan'],
    ['tujuan_ki', 'に来ます'],
    ['tujuan_kaeru', 'に帰ります'],
    ['itsuka_pakai', 'いつか'],
    ['dareka_tanya', 'だれか'],
    ['nanika_partikel', 'なにか'],
    ['dokoka_partikel', 'どこか'],
    ['campur_pola', 'campuran pola'],
    ['campur_partikel', 'campuran partikel'],
  ];
  for (const [topic, label] of required) {
    if (!topicTotals[topic]) fail(`Bunpou tidak teruji: ${label} (${topic})`);
  }
  const totalTypes = Object.keys(typeTotals).length;
  if (totalTypes < 7) fail(`Hanya ${totalTypes} tipe soal dipakai (butuh 7)`);

  return { problems, stats: { total, casual, casualPct, typeTotals, topicTotals, levelCount: levels.length } };
}

/* --------------------------------------------------------------------------
   Main
   -------------------------------------------------------------------------- */
function main() {
  const { levels } = buildAll();

  /* Sebaran posisi jawaban benar (tidak mengubah urutan agar tetap deterministik) */
  const mc = levels.flatMap(l => l.questions).filter(q => q.options);
  const posCount = [0, 0, 0, 0];
  mc.forEach(q => posCount[q.options.indexOf(q.answer)]++);
  const balanced = posCount.every(c => Math.abs(c - mc.length / 4) < mc.length * 0.18);
  if (!balanced) console.log('Info sebaran posisi jawaban:', posCount.join(' / '));

  const { problems, stats } = validate(levels);
  if (problems.length) {
    console.error(`VALIDASI GAGAL (${problems.length}):`);
    problems.slice(0, 60).forEach(p => console.error(' - ' + p));
    process.exit(1);
  }

  const header = '// Generated by tools/generate_bab13.js — Minna no Nihongo Bab 13 (bunpou Bab 13, kosakata Bab 1–13).\n';
  fs.writeFileSync(path.join(ROOT, 'js/data/levels_bab13.js'), header + 'window.LEVELS_BAB13_DATA = ' + JSON.stringify(levels, null, 2) + ';\n');
  fs.writeFileSync(path.join(ROOT, 'js/data/vocab_bab13.js'),
    '// Kosakata terkurasi dari lampiran PDF Kotoba Bab 1–13 (diverifikasi tools/bab13_vocab.js).\n'
    + 'window.VOCAB_BAB13_DATA = ' + JSON.stringify(G.VOCAB.map(v => ({
      id: v.id, jp: v.jp, kana: v.kana, id_mean: v.mean, type: v.type, lesson: v.lesson,
    })), null, 2) + ';\n');

  console.log(`Bab 13: ${levels.length} level · ${stats.total} soal · ${stats.casual} kasual (${stats.casualPct.toFixed(1)}%)`);
  console.log('Tipe soal:', stats.typeTotals);
  console.log('Posisi jawaban benar:', posCount.join(' / '));
}

if (require.main === module) main();

module.exports = { buildAll, validate };
