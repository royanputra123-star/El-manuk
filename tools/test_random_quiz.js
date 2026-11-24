#!/usr/bin/env node
/* ============================================================================
 * tools/test_random_quiz.js
 * Uji fitur 🎲 Random Quiz (15 soal acak per bab) memakai jsdom — menjalankan
 * aplikasi nyata dari index.html lalu menggerakkannya lewat UI.
 *
 * Cakupan:
 *   1. Kartu Random Quiz tampil di halaman setiap bab + jumlah soal tersedia.
 *   2. Setiap sesi tepat 15 soal, semua dari bab yang sama, tanpa duplikat.
 *   3. Soal berasal dari banyak level (bukan hanya Level 1) & semua tipe.
 *   4. Sesi berikutnya benar-benar mengacak ulang (kombinasi berbeda).
 *   5. Semua tipe soal bisa dijawab & diperiksa lewat UI (hasil 15/15).
 *   6. Lanjut sesi setelah "refresh" (DOM baru) melanjutkan soal yang sama.
 *   7. Fitur lama tidak rusak: kuis level, progres, XP, navigasi bab.
 *
 * Dependensi tes (bukan runtime situs):
 *   npm install --prefix /tmp/nihongo-test jsdom
 *   NODE_PATH=/tmp/nihongo-test/node_modules node tools/test_random_quiz.js
 *
 * Opsi: --quick (lewati uji semua tipe soal per bab)
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
  console.error('  NODE_PATH=/tmp/nihongo-test/node_modules node tools/test_random_quiz.js');
  process.exit(2);
}

const ROOT = path.resolve(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const QUICK = process.argv.includes('--quick');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const CHAPTERS = {
  bab13: { key: 'LEVELS_BAB13_DATA', levels: 30 },
  bab12: { key: 'LEVELS_BAB12_DATA', levels: 30 },
  bab11: { key: 'LEVELS_BAB11_DATA', levels: 30 },
  bab10: { key: 'LEVELS_BAB10_DATA', levels: 50 },
  bab9: { key: 'LEVELS_BAB9_DATA', levels: 50 },
  bab8: { key: 'LEVELS_DATA', levels: 50 },
  bab7: { key: 'LEVELS_BAB7_DATA', levels: 50 }
};

const issues = [];
function fail(msg) { issues.push(msg); }

/* ------------------------------------------------------------------ boot -- */
function boot(storage) {
  const errors = [];
  const dom = new JSDOM(HTML, {
    url: 'http://localhost/index.html',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(window) {
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
  if (storage) {
    Object.entries(storage).forEach(([k, v]) => w.localStorage.setItem(k, v));
  }
  const log = w.console.log;
  w.console.log = () => {};
  for (const src of [...HTML.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])) {
    try { w.eval(fs.readFileSync(path.join(ROOT, src), 'utf8')); }
    catch (e) { errors.push(`${src}: ${e.message}`); }
  }
  w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }));
  w.dispatchEvent(new w.Event('load'));
  void log;
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
      if (!lb) return `pasangan kiri "${p.jp}" tidak ada`;
      click(lb); await sleep(6);
      const rb = $$('.match-item').find(b => b.textContent.trim() === p.id && !b.classList.contains('matched'));
      if (!rb) return `pasangan kanan "${p.id}" tidak ada`;
      click(rb); await sleep(6);
    }
    return null;
  }
  if (q.type === 'arrange' || q.type === 'translate' || q.type === 'listening') {
    for (const token of q.answer) {
      const tile = $$('.tile-bank-zone .tile').find(t => t.textContent.trim() === token);
      if (!tile) return `tile "${token}" tidak ditemukan`;
      click(tile); await sleep(4);
    }
    return null;
  }
  const btns = $$('.options-grid .option-btn, .options-list .option-btn');
  const target = btns.find(b => b.textContent.trim() === String(q.answer).trim());
  if (!target) return 'opsi jawaban tidak ditemukan';
  click(target);
  return null;
}

async function checkAndNext(w) {
  const { D, click } = ui(w);
  const btn = D.getElementById('btn-quiz-check');
  if (!btn || btn.disabled) return { ok: false };
  const correct = /Periksa/.test(btn.textContent);
  click(btn);
  await sleep(60);
  const fb = D.getElementById('quiz-feedback');
  const out = { ok: true, checked: correct, correct: /feedback-correct/.test(fb ? fb.className : '') };
  const next = D.getElementById('btn-quiz-check');
  if (next) { click(next); await sleep(50); }
  return out;
}

/* =========================================================== TES 1: kartu == */
async function testCardEveryChapter(w) {
  const { D } = ui(w);
  const info = [];
  for (const ch of Object.keys(CHAPTERS)) {
    w.StorageManager.setActiveChapter(ch);
    w.UIManager.renderHomeScreen(w.StorageManager.getProgress());
    await sleep(20);
    const card = D.getElementById('random-quiz-card');
    const btn = D.getElementById('btn-random-quiz');
    if (!card || !btn) { fail(`${ch}: kartu/tombol Random Quiz tidak ada`); continue; }
    if (!card.textContent.includes('Random Quiz')) fail(`${ch}: judul kartu tidak memuat "Random Quiz"`);
    if (!/15 Soal/.test(card.textContent)) fail(`${ch}: kartu tidak menyebut 15 soal`);
    const bank = w[CHAPTERS[ch].key] || [];
    const available = w.RandomQuiz.countPool(bank);
    const sub = D.getElementById('random-quiz-sub').textContent;
    const availableText = available.toLocaleString('id-ID');
    if (!sub.includes(availableText) && !sub.includes(String(available))) {
      fail(`${ch}: subjudul tidak memuat jumlah soal (${availableText}) — "${sub}"`);
    }
    const totalLevels = bank.length;
    if (!sub.includes(String(totalLevels))) fail(`${ch}: subjudul tidak menyebut jumlah level (${totalLevels})`);
    info.push(`${ch}: ${available} soal / ${totalLevels} level`);
  }
  w.StorageManager.setActiveChapter('bab13');
  return info.join(' · ');
}

/* ============================================== TES 2: isi sesi 15 soal == */
function checkSession(w, chapter, questions) {
  const bank = w[CHAPTERS[chapter].key] || [];
  if (questions.length !== 15) fail(`${chapter}: sesi berisi ${questions.length} soal (harus 15)`);

  const idToLevel = new Map();
  const sigToLevel = new Map();
  bank.forEach((level, li) => (level.questions || []).forEach(q => {
    if (q.id) idToLevel.set(String(q.id), li + 1);
    sigToLevel.set(JSON.stringify(q), li + 1);
  }));

  const ids = new Set();
  const sigs = new Set();
  const levels = new Set();
  for (const q of questions) {
    if (q.id && ids.has(q.id)) fail(`${chapter}: soal duplikat (id ${q.id})`);
    if (q.id) ids.add(q.id);
    const sig = JSON.stringify(q);
    if (sigs.has(sig)) fail(`${chapter}: soal duplikat isi (${q.id || q.type})`);
    sigs.add(sig);
    const lvl = idToLevel.get(String(q.id)) || sigToLevel.get(sig);
    if (!lvl) fail(`${chapter}: soal ${q.id || q.type} bukan berasal dari bank bab ini`);
    else levels.add(lvl);
    if (!w.RandomQuiz.RENDERABLE_TYPES.includes(q.type)) fail(`${chapter}: tipe ${q.type} tidak didukung renderer`);
  }
  if (levels.size < 3) fail(`${chapter}: soal hanya berasal dari ${levels.size} level (${[...levels].join(',')})`);
  if (levels.size === 1 && levels.has(1)) fail(`${chapter}: soal hanya dari Level 1`);
  return { levels, types: new Set(questions.map(q => q.type)) };
}

async function testSessions(w) {
  const rows = [];
  for (const ch of Object.keys(CHAPTERS)) {
    w.StorageManager.setActiveChapter(ch);
    const sets = [];
    for (let s = 0; s < 6; s++) {
      w.App.startRandomQuiz();
      await sleep(5);
      const qs = w.App.__randomQuestions();
      const r = checkSession(w, ch, qs);
      sets.push(qs.map(q => q.id || JSON.stringify(q)).join('|'));
      if (s === 0) {
        rows.push(`${ch}: ${qs.length} soal · ${r.levels.size} level · tipe ${[...r.types].sort().join(',')}`);
      }
      // UI: label progres & layar kuis
      const { D } = ui(w);
      const label = D.getElementById('quiz-mode-label');
      if (!label || label.classList.contains('hidden')) fail(`${ch}: label progres Random Quiz tidak tampil`);
      if (label && !/Soal 1\/15/.test(label.textContent)) fail(`${ch}: label progres "${label.textContent}"`);
      if (!D.getElementById('screen-quiz').classList.contains('active')) fail(`${ch}: layar kuis tidak aktif`);
    }
    const unique = new Set(sets);
    if (unique.size < 6) fail(`${ch}: ${unique.size}/6 sesi punya kombinasi soal identik (pengacakan tidak jalan)`);
  }
  return rows;
}

/* ============================== TES 3: main penuh 15 soal semua tipe UI == */
async function testFullPlay(w, chapters) {
  const rows = [];
  for (const ch of chapters) {
    w.StorageManager.setActiveChapter(ch);
    const xpBefore = w.StorageManager.getProgress().xp;
    const levelsBefore = JSON.stringify(w.StorageManager.getProgress().levelsDone[ch]);
    w.App.startRandomQuiz();
    await sleep(10);
    const qs = w.App.__randomQuestions();
    const typesSeen = new Set();
    const problems = [];
    for (let i = 0; i < qs.length; i++) {
      const q = qs[i];
      typesSeen.add(q.type);
      const err = await answerCorrect(w, q);
      if (err) { problems.push(`${q.id} (${q.type}): ${err}`); break; }
      const res = await checkAndNext(w);
      if (!res.ok) { problems.push(`${q.id}: tombol Periksa nonaktif`); break; }
      if (!res.correct) problems.push(`${q.id} [${q.type}] dinilai salah padahal jawaban benar`);
      const { D } = ui(w);
      const label = D.getElementById('quiz-mode-label');
      if (i < qs.length - 1 && !(label && label.textContent.includes(`Soal ${i + 2}/15`))) {
        problems.push(`${q.id}: label progres tidak naik ("${label ? label.textContent : '-'}")`);
      }
    }
    const { D } = ui(w);
    const onResult = D.getElementById('screen-result').classList.contains('active');
    if (!onResult) problems.push('layar hasil tidak tampil setelah 15 soal');
    const correctTxt = D.getElementById('result-correct').textContent.trim();
    const wrongTxt = D.getElementById('result-wrong').textContent.trim();
    const pctTxt = D.getElementById('result-percentage').textContent.trim();
    const xpTxt = D.getElementById('result-xp').textContent.trim();
    const scoreTxt = D.getElementById('result-score').textContent.trim();
    if (correctTxt !== '15') problems.push(`jumlah benar tertulis ${correctTxt} (harus 15)`);
    if (wrongTxt !== '0') problems.push(`jumlah salah tertulis ${wrongTxt} (harus 0)`);
    if (pctTxt !== '100%') problems.push(`akurasi tertulis ${pctTxt}`);
    const expectedXp = 15 * 10 + 50; // 150 + bonus akurasi ≥ 80%
    if (xpTxt !== `+${expectedXp}`) problems.push(`XP tertulis ${xpTxt} (harus +${expectedXp})`);
    if (scoreTxt !== '100') problems.push(`skor tertulis ${scoreTxt}`);
    const retry = D.getElementById('btn-result-retry');
    const back = D.getElementById('btn-result-next');
    if (!retry || !/Ulangi Random Quiz/.test(retry.textContent)) problems.push('tombol "Ulangi Random Quiz" tidak ada');
    if (!back || !/Kembali ke Halaman Bab/.test(back.textContent)) problems.push('tombol "Kembali ke Halaman Bab" tidak ada');
    const title = D.getElementById('result-title').textContent;
    if (!/Random Quiz/.test(title)) problems.push(`judul hasil "${title}" bukan Random Quiz`);

    const p = w.StorageManager.getProgress();
    if (p.xp !== xpBefore + expectedXp) problems.push(`XP tersimpan ${p.xp} (harus ${xpBefore + expectedXp})`);
    if (p.totalCorrect < 15) problems.push(`totalCorrect tersimpan ${p.totalCorrect}`);
    if (JSON.stringify(p.levelsDone[ch]) !== levelsBefore) problems.push('progres level berubah karena Random Quiz');
    const hist = p.history[0] || {};
    if (hist.level !== 'random' || hist.chapter !== ch) problems.push('riwayat skor Random Quiz tidak tercatat');
    if (!p.randomQuiz[ch] || p.randomQuiz[ch].played < 1) problems.push('statistik Random Quiz bab tidak tersimpan');
    if (w.RandomQuiz.loadSession()) problems.push('sesi Random Quiz tidak dibersihkan setelah selesai');

    // Tombol "Ulangi" → kombinasi soal baru, posisi kembali ke soal 1.
    if (retry) {
      const before = qs.map(q => q.id).join('|');
      retry.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
      await sleep(20);
      const again = w.App.__randomQuestions();
      if (again.map(q => q.id).join('|') === before) problems.push('"Ulangi Random Quiz" memakai soal yang sama persis');
      const label = D.getElementById('quiz-mode-label');
      if (!/Soal 1\/15/.test(label ? label.textContent : '')) problems.push('"Ulangi" tidak kembali ke Soal 1/15');
    }
    // Tombol "Kembali ke Halaman Bab" → home bab aktif.
    w.App.showScreen('screen-result');
    await sleep(5);
    const backBtn = D.getElementById('btn-result-next');
    if (backBtn) { backBtn.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); await sleep(15); }
    if (!D.getElementById('screen-home').classList.contains('active')) problems.push('tombol kembali tidak membuka halaman bab');

    problems.forEach(p2 => fail(`${ch}: ${p2}`));
    rows.push(`${ch}: ${problems.length ? 'GAGAL' : 'OK'} · ${qs.length} soal · tipe ${[...typesSeen].sort().join(',')}`);
  }
  return rows;
}

/* ================================ TES 4: jawaban salah & tipe campuran === */
async function testWrongAnswer(w) {
  w.StorageManager.setActiveChapter('bab13');
  w.App.startRandomQuiz();
  await sleep(10);
  const qs = w.App.__randomQuestions();
  const q = qs[0];
  const { D, $$, click } = ui(w);
  let answered = false;
  if (q.type === 'match') {
    const cols = $$('.match-col');
    const lefts = [...cols[0].querySelectorAll('.match-item')];
    const rights = [...cols[1].querySelectorAll('.match-item')];
    const wrongRight = rights.find(r => r.dataset.vocabId !== lefts[0].dataset.vocabId);
    if (wrongRight) { click(lefts[0]); await sleep(15); click(wrongRight); await sleep(60); answered = true; }
    for (const p of q.pairs) {
      const l = [...cols[0].querySelectorAll('.match-item')].find(b => b.textContent.trim() === p.jp && !b.classList.contains('matched'));
      if (l) { click(l); await sleep(8); }
      const r = [...cols[1].querySelectorAll('.match-item')].find(b => b.textContent.trim() === p.id && !b.classList.contains('matched'));
      if (r) { click(r); await sleep(8); }
    }
  } else if (q.type === 'arrange' || q.type === 'translate' || q.type === 'listening') {
    const seq = q.answer.slice().reverse();
    for (const token of seq) {
      const tile = $$('.tile-bank-zone .tile').find(t => t.textContent.trim() === token);
      if (tile) { click(tile); await sleep(4); }
    }
    answered = true;
  } else {
    const btns = $$('.options-grid .option-btn, .options-list .option-btn');
    const wrong = btns.find(b => b.textContent.trim() !== String(q.answer).trim());
    if (wrong) { click(wrong); answered = true; }
  }
  if (!answered) return 'tidak bisa memilih jawaban salah';
  const res = await checkAndNext(w);
  if (!res.ok) return 'tombol Periksa nonaktif pada jawaban salah';
  if (res.correct) return 'jawaban salah dinilai benar';
  if (D.getElementById('quiz-lives').textContent.trim() !== '2') return 'nyawa tidak berkurang setelah jawaban salah';
  return 'OK';
}

/* ========================== TES 5: lanjut sesi setelah refresh (DOM baru) */
async function testResume() {
  const first = boot();
  await sleep(200);
  const w1 = first.w;
  w1.StorageManager.setActiveChapter('bab10');
  w1.App.startRandomQuiz();
  await sleep(10);
  const all = w1.App.__randomQuestions();
  const target = all[0]; /* jawab soal pertama, lalu lanjutkan di soal 2 */
  const err = await answerCorrect(w1, target);
  if (err) fail(`resume: ${err}`);
  await checkAndNext(w1);
  const saved = w1.RandomQuiz.loadSession();
  const idsBefore = all.map(q => q.id).join('|');
  const storage = {
    [w1.StorageManager.STORAGE_KEY || 'nihongo_app_progress_v2']: w1.localStorage.getItem('nihongo_app_progress_v2'),
    [w1.RandomQuiz.SESSION_KEY]: w1.localStorage.getItem(w1.RandomQuiz.SESSION_KEY)
  };
  w1.close();
  if (!saved) { fail('resume: sesi tidak tersimpan di localStorage'); return 'tidak ada sesi'; }

  // "refresh": DOM baru dengan localStorage yang sama
  const second = boot(storage);
  await sleep(250);
  const w2 = second.w;
  const { D, click } = ui(w2);
  const resumeBtn = D.getElementById('btn-random-resume');
  if (!resumeBtn || resumeBtn.classList.contains('hidden')) {
    fail('resume: tombol "Lanjutkan Sesi" tidak tampil setelah refresh');
  }
  w2.App.resumeRandomQuiz();
  await sleep(30);
  if (!D.getElementById('screen-quiz').classList.contains('active')) fail('resume: layar kuis tidak terbuka');
  const idsAfter = w2.App.__randomQuestions().map(q => q.id).join('|');
  if (idsAfter !== idsBefore) fail('resume: daftar soal berubah setelah refresh');
  const label = D.getElementById('quiz-mode-label');
  if (!/Soal 2\/15/.test(label ? label.textContent : '')) fail(`resume: posisi soal tidak dilanjutkan ("${label ? label.textContent : '-'}")`);
  const bodyText = D.getElementById('quiz-body').textContent;
  if (!bodyText.trim()) fail('resume: soal tidak dirender');
  const info = `sesi ${saved.ids.length} soal · lanjut di soal 2/15 · ${second.errors.length} error`;
  if (second.errors.length) fail('resume: ' + second.errors[0]);
  w2.close();
  return info;
}

/* ================================ TES 6: fitur lama tetap berfungsi ====== */
async function testLegacy(w) {
  const { D, $$ } = ui(w);
  w.StorageManager.setActiveChapter('bab9');
  w.App.startQuiz(3);
  await sleep(80);
  if (!D.querySelector('.q-block')) fail('legacy: kuis level Bab 9 tidak dirender');
  if (!D.getElementById('quiz-mode-label').classList.contains('hidden')) {
    fail('legacy: label Random Quiz ikut tampil di kuis level biasa');
  }
  const qs = w.LEVELS_BAB9_DATA[2].questions;
  for (let i = 0; i < qs.length; i++) {
    const err = await answerCorrect(w, qs[i]);
    if (err) { fail(`legacy: ${qs[i].id} — ${err}`); break; }
    const res = await checkAndNext(w);
    if (!res.ok) { fail(`legacy: ${qs[i].id} Periksa nonaktif`); break; }
    if (!res.correct) fail(`legacy: ${qs[i].id} dinilai salah`);
  }
  if (!D.getElementById('screen-result').classList.contains('active')) fail('legacy: hasil level tidak tampil');
  if (D.getElementById('result-title').textContent !== 'Level Selesai!') fail('legacy: judul hasil level berubah');
  if (!/Ulangi Level/.test(D.getElementById('btn-result-retry').textContent)) fail('legacy: tombol Ulangi Level berubah');
  const p = w.StorageManager.getProgress();
  if (p.levelsDone.bab9[3] !== 100) fail(`legacy: progres level Bab 9 tidak tersimpan (${p.levelsDone.bab9[3]})`);
  const tiles = $$('.map-level-tile').length;
  w.UIManager.renderLevelMap(p, () => {});
  await sleep(10);
  if ($$('.map-level-tile').length !== 50) fail('legacy: peta 50 level Bab 9 rusak');
  void tiles;
  return `kuis level OK · progres ${p.levelsDone.bab9[3]}% · XP ${p.xp}`;
}

/* ================================================================= main == */
(async () => {
  console.log('Uji 🎲 Random Quiz (jsdom)' + (QUICK ? ' — mode cepat' : ''));
  console.log('='.repeat(72));

  {
    const { w, errors } = boot();
    await sleep(250);

    const card = await testCardEveryChapter(w);
    console.log('1. Kartu per bab   :', card);
    if (errors.length) fail('boot: ' + errors[0]);

    const sessions = await testSessions(w);
    console.log('2. Isi 15 soal     :', issues.length ? 'periksa temuan' : 'OK');
    sessions.forEach(r => console.log('   ·', r));

    const playChapters = QUICK ? ['bab13', 'bab7'] : Object.keys(CHAPTERS);
    const plays = await testFullPlay(w, playChapters);
    console.log('3. Main penuh      :', issues.length ? 'periksa temuan' : 'OK');
    plays.forEach(r => console.log('   ·', r));

    const wrong = await testWrongAnswer(w);
    console.log('4. Jawaban salah   :', wrong);

    const legacy = await testLegacy(w);
    console.log('5. Fitur lama      :', legacy);

    if (errors.length) fail('runtime: ' + errors.slice(0, 3).join(' | '));
    w.close();
  }

  const resume = await testResume();
  console.log('6. Lanjut sesi     :', resume);

  console.log('-'.repeat(72));
  if (!issues.length) {
    console.log('LULUS — tidak ada masalah.');
    process.exit(0);
  }
  console.log(`GAGAL — ${issues.length} masalah:`);
  issues.slice(0, 40).forEach(i => console.log('  ✗', i));
  process.exit(1);
})();
