#!/usr/bin/env node
/* ============================================================================
 * tools/test_bab13_browser.js
 * Uji UI Bab 13 tanpa browser sungguhan (jsdom). Menjalankan aplikasi nyata:
 * index.html + semua <script> di dalamnya, lalu menjawab soal lewat kontrol UI.
 *
 * Cakupan:
 *   1. Halaman utama: badge Bab 13, ringkasan materi tampil.
 *   2. Seluruh 450 soal di 30 level dijawab benar → 450/450, 30 layar hasil.
 *   3. Progres tersimpan (30 level, XP).
 *   4. Jalur jawaban salah untuk ketujuh tipe soal (DOM baru tiap tipe).
 *   5. Navigasi bab & regresi bank soal Bab 7–12.
 *
 * Dependensi tes (bukan runtime situs):
 *   npm install --prefix /tmp/nihongo-test jsdom
 *   NODE_PATH=/tmp/nihongo-test/node_modules node tools/test_bab13_browser.js
 *
 * Opsi: --quick  (hanya 6 level, untuk iterasi cepat)
 * ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch (e) {
  console.error('jsdom belum terpasang. Jalankan:');
  console.error('  npm install --prefix /tmp/nihongo-test jsdom');
  console.error('  NODE_PATH=/tmp/nihongo-test/node_modules node tools/test_bab13_browser.js');
  process.exit(2);
}

const ROOT = path.resolve(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const QUICK = process.argv.includes('--quick');
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ------------------------------------------------------------------ boot -- */
function boot() {
  const errors = [];
  const dom = new JSDOM(HTML, {
    url: 'http://localhost/index.html',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(window) {
      /* Stub API browser yang tidak ada di jsdom (audio, animasi, dialog). */
      window.speechSynthesis = {
        speak() {}, cancel() {}, getVoices: () => [], speaking: false, paused: false,
        pending: false, onvoiceschanged: null, addEventListener() {}, removeEventListener() {},
      };
      window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      window.matchMedia = () => ({
        matches: false, addListener() {}, removeListener() {},
        addEventListener() {}, removeEventListener() {},
      });
      window.HTMLMediaElement.prototype.play = () => Promise.resolve();
      window.HTMLMediaElement.prototype.pause = () => {};
      window.requestAnimationFrame = cb => setTimeout(() => cb(Date.now()), 0);
      window.cancelAnimationFrame = id => clearTimeout(id);
      window.confirm = () => true;
      window.alert = () => {};
      window.addEventListener('error', e => errors.push('window.onerror: ' + e.message));
    },
  });

  const w = dom.window;
  const consoleLog = w.console.log;
  w.console.log = () => {}; /* bisukan log audio aplikasi */
  for (const src of [...HTML.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])) {
    try { w.eval(fs.readFileSync(path.join(ROOT, src), 'utf8')); }
    catch (e) { errors.push(`${src}: ${e.message}`); }
  }
  w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }));
  w.dispatchEvent(new w.Event('load'));
  void consoleLog;
  return { w, errors };
}

function ui(w) {
  const D = w.document;
  const $$ = s => [...D.querySelectorAll(s)];
  const click = el => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  return { D, $$, click };
}

/* ------------------------------------------------- jawab satu soal benar -- */
async function answerCorrect(w, q) {
  const { $$, click } = ui(w);
  if (q.type === 'match') {
    for (const p of q.pairs) {
      const lb = $$('.match-item').find(b => b.textContent.trim() === p.jp && !b.classList.contains('matched'));
      if (lb) { click(lb); await sleep(8); }
      const rb = $$('.match-item').find(b => b.textContent.trim() === p.id && !b.classList.contains('matched'));
      if (rb) { click(rb); await sleep(8); }
    }
    return;
  }
  if (q.type === 'arrange' || q.type === 'translate' || q.type === 'listening') {
    for (const token of q.answer) {
      const tile = $$('.tile-bank-zone .tile').find(t => t.textContent.trim() === token);
      if (tile) { click(tile); await sleep(6); }
      else return `tile "${token}" tidak ditemukan`;
    }
    return;
  }
  const btns = $$('.options-grid .option-btn, .options-list .option-btn');
  const target = btns.find(b => b.textContent.trim() === String(q.answer).trim());
  if (!target) return `opsi jawaban tidak ditemukan`;
  click(target);
}

/* ------------------------------------------------- klik Periksa & lanjut -- */
async function checkAndRead(w) {
  const { D, $$, click } = ui(w);
  const btn = D.getElementById('btn-quiz-check');
  if (!btn || btn.disabled) return { ok: false };
  click(btn);
  await sleep(85);
  const fb = D.getElementById('quiz-feedback');
  const panel = D.getElementById('quiz-translation-panel');
  const out = {
    ok: true,
    correct: /feedback-correct/.test(fb ? fb.className : ''),
    wrong: /feedback-wrong/.test(fb ? fb.className : ''),
    reveal: $$('.answer-reveal').length > 0,
    detailPanel: !!(panel && !panel.classList.contains('hidden')),
    explanation: !!(fb && fb.textContent.includes('Pembahasan')),
  };
  const next = D.getElementById('btn-quiz-check');
  if (next) { click(next); await sleep(70); }
  return out;
}

/* ================================================================ TES 1 == */
async function testHome(w) {
  const { D } = ui(w);
  await sleep(300);
  const badge = D.getElementById('hero-badge-ch').textContent.trim();
  const materialHidden = D.getElementById('bab13-material').hidden;
  const bab12Hidden = D.getElementById('bab12-material').hidden;
  const levels = (w.LEVELS_BAB13_DATA || []).length;
  const vocab = (w.VOCAB_BAB13_DATA || []).length;
  const issues = [];
  if (!badge.includes('Bab 13')) issues.push(`badge halaman utama: ${badge}`);
  if (materialHidden) issues.push('ringkasan materi Bab 13 tersembunyi');
  if (!bab12Hidden) issues.push('ringkasan materi Bab 12 ikut tampil');
  if (levels !== 30) issues.push(`LEVELS_BAB13_DATA berisi ${levels} level`);
  if (vocab !== 449) issues.push(`VOCAB_BAB13_DATA berisi ${vocab} entri`);
  return { issues, info: `badge="${badge}" · level=${levels} · kosakata=${vocab}` };
}

/* ================================================================ TES 2 == */
async function testAllQuestions(w, errors) {
  const { D } = ui(w);
  const bank = w.LEVELS_BAB13_DATA;
  const totalLevels = QUICK ? 6 : bank.length;
  const issues = [];
  let correct = 0;
  let answered = 0;
  let resultScreens = 0;

  for (let li = 0; li < totalLevels; li++) {
    w.App.startQuiz(li + 1);
    await sleep(120);
    const questions = bank[li].questions;
    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi];
      const err = await answerCorrect(w, q);
      if (err) { issues.push(`${q.id} (${q.type}): ${err}`); break; }
      await sleep(20);
      const res = await checkAndRead(w);
      if (!res.ok) { issues.push(`${q.id} (${q.type}): tombol Periksa nonaktif`); break; }
      answered++;
      if (res.correct) correct++;
      else issues.push(`${q.id} [${q.type}] dinilai salah — ${q.fullJp}`);
      if (D.getElementById('screen-result').classList.contains('active')) break;
    }
    if (D.getElementById('screen-result').classList.contains('active')) resultScreens++;
    const home = D.getElementById('btn-result-home');
    if (home) { home.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); await sleep(45); }
  }

  const progress = w.StorageManager.getProgress();
  const saved = Object.values(progress.levelsDone.bab13 || {}).filter(s => s >= 60).length;
  if (resultScreens !== totalLevels) issues.push(`layar hasil ${resultScreens}/${totalLevels}`);
  if (saved < totalLevels) issues.push(`level tersimpan ${saved}/${totalLevels}`);
  if (errors.length) issues.push(...errors.slice(0, 5));
  return { issues, info: `${correct}/${answered} benar · ${resultScreens} layar hasil · ${saved} level tersimpan · XP ${progress.xp}` };
}

/* ================================================================ TES 3 == */
async function testWrongPath() {
  const TYPES = ['complete', 'choose_translation', 'short_conversation', 'match', 'translate', 'arrange', 'listening'];
  const rows = [];
  const issues = [];
  for (const type of TYPES) {
    const { w, errors } = boot();
    await sleep(250);
    const { D, $$, click } = ui(w);
    const bank = w.LEVELS_BAB13_DATA;
    let found = null;
    for (let li = 0; li < bank.length && !found; li++) {
      const qi = bank[li].questions.findIndex(q => q.type === type);
      if (qi >= 0) found = { lvl: li + 1, qi, questions: bank[li].questions };
    }
    if (!found) { issues.push(`tipe ${type} tidak ada di bank`); w.close(); continue; }

    w.App.startQuiz(found.lvl);
    await sleep(130);
    /* maju ke soal target dengan menjawab benar */
    for (let k = 0; k < found.qi; k++) {
      await answerCorrect(w, found.questions[k]);
      await sleep(25);
      await checkAndRead(w);
      await sleep(20);
    }
    /* jawab salah */
    const q = found.questions[found.qi];
    if (q.type === 'match') {
      const cols = $$('.match-col');
      const lefts = [...cols[0].querySelectorAll('.match-item')];
      const rights = [...cols[1].querySelectorAll('.match-item')];
      const wrongRight = rights.find(r => r.dataset.vocabId !== lefts[0].dataset.vocabId);
      click(lefts[0]); await sleep(20);
      click(wrongRight); await sleep(90);
      for (const p of q.pairs) {
        const l = [...cols[0].querySelectorAll('.match-item')].find(b => b.textContent.trim() === p.jp && !b.classList.contains('matched'));
        if (l) { click(l); await sleep(12); }
        const r = [...cols[1].querySelectorAll('.match-item')].find(b => b.textContent.trim() === p.id && !b.classList.contains('matched'));
        if (r) { click(r); await sleep(12); }
      }
    } else if (q.type === 'arrange' || q.type === 'translate' || q.type === 'listening') {
      /* urutan salah: tukar dua token pertama, lalu sisipkan sisanya */
      const seq = q.answer.slice();
      if (seq.length > 1) { const t = seq[0]; seq[0] = seq[1]; seq[1] = t; }
      for (const token of seq) {
        const tile = $$('.tile-bank-zone .tile').find(x => x.textContent.trim() === token);
        if (tile) { click(tile); await sleep(6); }
      }
      for (const tile of $$('.tile-bank-zone .tile')) { click(tile); await sleep(5); }
    } else {
      const btns = $$('.options-grid .option-btn, .options-list .option-btn');
      const wrong = btns.find(b => b.textContent.trim() !== String(q.answer).trim());
      if (wrong) click(wrong);
    }
    await sleep(35);
    const res = await checkAndRead(w);
    rows.push({ type, ...res, err: errors[0] || '' });
    if (!res.ok) issues.push(`${type}: tombol Periksa nonaktif`);
    if (!res.wrong) issues.push(`${type}: tidak memberi umpan balik salah`);
    if (!res.reveal) issues.push(`${type}: tidak menampilkan jawaban benar`);
    if (!res.explanation) issues.push(`${type}: pembahasan tidak tampil`);
    if (errors.length) issues.push(`${type}: ${errors[0]}`);
    w.close();
  }
  return { issues, rows };
}

/* ================================================================ TES 4 == */
async function testChapterNav(w) {
  const { D } = ui(w);
  const issues = [];
  const counts = {};
  for (const ch of ['bab13', 'bab12', 'bab11', 'bab10', 'bab9', 'bab8', 'bab7']) {
    w.StorageManager.setActiveChapter(ch);
    const p = w.StorageManager.getProgress();
    w.UIManager.renderHomeScreen(p);
    w.UIManager.renderLevelMap(p, () => {});
    await sleep(30);
    counts[ch] = D.querySelectorAll('.map-level-tile').length;
    const m13 = D.getElementById('bab13-material').hidden;
    const m12 = D.getElementById('bab12-material').hidden;
    if (ch === 'bab13' && (m13 || !m12)) issues.push('ringkasan Bab 13 tidak tampil pada bab aktif');
    if (ch !== 'bab13' && !m13) issues.push(`ringkasan Bab 13 masih tampil di ${ch}`);
    if (ch === 'bab12' && m12) issues.push('ringkasan Bab 12 hilang');
  }
  const expected = { bab13: 30, bab12: 30, bab11: 30, bab10: 50, bab9: 50, bab8: 50, bab7: 50 };
  for (const [ch, n] of Object.entries(expected)) {
    if (counts[ch] !== n) issues.push(`${ch}: ${counts[ch]} level (harusnya ${n})`);
  }
  /* bank soal bab lama masih bisa dibuka */
  for (const [ch, key] of [['bab12', 'LEVELS_BAB12_DATA'], ['bab11', 'LEVELS_BAB11_DATA']]) {
    w.StorageManager.setActiveChapter(ch);
    w.App.startQuiz(1);
    await sleep(140);
    if (!D.querySelector('.q-block')) issues.push(`${ch}: soal level 1 gagal dirender`);
  }
  /* materi memuat pola inti */
  const material = D.getElementById('bab13-material').textContent;
  for (const key of ['ほしい', 'たい', 'に行きます', 'いつか', 'なにか', 'どこか']) {
    if (!material.includes(key)) issues.push(`ringkasan kehilangan "${key}"`);
  }
  return { issues, info: JSON.stringify(counts) };
}

/* ================================================================= main == */
(async () => {
  console.log('Uji UI Bab 13 (jsdom)' + (QUICK ? ' — mode cepat' : ''));
  console.log('='.repeat(64));

  const problems = [];

  {
    const { w, errors } = boot();
    const home = await testHome(w);
    console.log('1. Halaman utama  :', home.issues.length ? 'GAGAL' : 'OK', '·', home.info);
    problems.push(...home.issues);

    const all = await testAllQuestions(w, errors);
    console.log(`2. Semua soal     : ${all.issues.length ? 'GAGAL' : 'OK'} · ${all.info}`);
    problems.push(...all.issues);
    w.close();
  }

  {
    const wrong = await testWrongPath();
    console.log(`3. Jalur salah     : ${wrong.issues.length ? 'GAGAL' : 'OK'}`);
    console.log('   tipe                 salah  reveal  panel  pembahasan');
    wrong.rows.forEach(r => console.log(
      '  ', String(r.type).padEnd(20), String(r.wrong).padEnd(6), String(r.reveal).padEnd(7),
      String(r.detailPanel).padEnd(6), String(r.explanation)));
    problems.push(...wrong.issues);
  }

  {
    const { w, errors } = boot();
    await sleep(300);
    const nav = await testChapterNav(w);
    console.log(`4. Navigasi bab    : ${nav.issues.length ? 'GAGAL' : 'OK'} · ${nav.info}`);
    problems.push(...nav.issues);
    if (errors.length) problems.push(...errors.slice(0, 5));
    w.close();
  }

  console.log('-'.repeat(64));
  if (!problems.length) {
    console.log('LULUS — tidak ada masalah.');
    process.exit(0);
  }
  console.log(`GAGAL — ${problems.length} masalah:`);
  problems.slice(0, 25).forEach(p => console.log('  -', p));
  if (problems.length > 25) console.log(`  … ${problems.length - 25} lagi`);
  process.exit(1);
})();
