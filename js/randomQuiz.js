// js/randomQuiz.js
// 🎲 Random Quiz — 15 soal acak dari SELURUH level dalam satu bab.
//
// Aturan:
//   • Setiap sesi selalu 15 soal (atau seluruh soal yang tersedia bila < 15).
//   • Soal diambil dari semua level bab aktif, bukan hanya Level 1.
//   • Setiap level mendapat kesempatan yang sama (round-robin antar level yang
//     urutannya diacak tiap ronde), lalu hasilnya diacak lagi.
//   • Tidak ada soal duplikat dalam satu sesi (dicek lewat id + sidik isi).
//   • Pengacakan memakai Fisher-Yates dan dilakukan ulang setiap sesi baru.
//   • Hanya tipe soal yang punya renderer di js/questions.js yang diambil.
//
// Sesi yang sedang berjalan disimpan di localStorage supaya setelah halaman
// di-refresh pengguna bisa melanjutkan sesi yang sama. Sesi baru (tombol
// "Ulangi"/"Mulai") selalu mengacak soal dari awal.

(function (global) {
  const SESSION_SIZE = 15;
  const SESSION_KEY = 'nihongo_random_quiz_session_v1';

  // Tipe soal yang benar-benar bisa dirender & diperiksa oleh js/questions.js
  const RENDERABLE_TYPES = [
    'arrange', 'translate', 'complete', 'match',
    'short_conversation', 'choose_translation', 'listening'
  ];

  /* ---------------------------------------------------------- utilitas -- */

  // Fisher-Yates Shuffle (in-place pada salinan array)
  function shuffle(arr) {
    const a = Array.isArray(arr) ? arr.slice() : [];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function hasArray(v, min) {
    return Array.isArray(v) && v.length >= (min || 1);
  }

  // Soal hanya dipakai bila tipenya didukung dan datanya lengkap.
  function isRenderable(q) {
    if (!q || RENDERABLE_TYPES.indexOf(q.type) === -1) return false;
    switch (q.type) {
      case 'match':
        return hasArray(q.pairs, 2) && q.pairs.every(p => p && p.jp && p.id);
      case 'complete':
        return typeof q.prompt === 'string' && q.prompt.length > 0 &&
          hasArray(q.options, 2) && q.answer !== undefined && q.answer !== null;
      case 'choose_translation':
        return typeof q.prompt === 'string' && q.prompt.length > 0 &&
          hasArray(q.options, 2) && q.answer !== undefined && q.answer !== null;
      case 'short_conversation':
        return hasArray(q.dialogue, 1) && hasArray(q.options, 2) &&
          q.answer !== undefined && q.answer !== null;
      case 'listening':
        return typeof q.audioText === 'string' && q.audioText.length > 0 &&
          hasArray(q.answer, 1) && hasArray(q.tiles, 1);
      case 'arrange':
      case 'translate':
        return hasArray(q.answer, 1) && hasArray(q.tiles, 1);
      default:
        return false;
    }
  }

  // Sidik isi soal — menangkap duplikat walau id-nya berbeda.
  function signature(q) {
    return JSON.stringify({
      t: q.type,
      i: q.instruction || '',
      p: q.prompt || '',
      a: q.answer,
      o: q.options || null,
      ti: q.tiles || null,
      au: q.audioText || '',
      d: (q.dialogue || []).map(x => (x && x.text) || '').join('|'),
      pa: (q.pairs || []).map(p => ((p && p.jp) || '') + '=' + ((p && p.id) || '')),
      qu: q.question || ''
    });
  }

  function questionId(q, fallback) {
    return (q && q.id) ? String(q.id) : 'anon_' + fallback;
  }

  // Kumpulan soal unik per level (tanpa tipe yang tidak bisa dirender).
  function buildLevelPools(bank) {
    const seenIds = new Set();
    const seenSigs = new Set();
    const pools = [];
    (bank || []).forEach((level, levelIdx) => {
      const qs = [];
      ((level && level.questions) || []).forEach((q, qi) => {
        if (!isRenderable(q)) return;
        const id = questionId(q, levelIdx + '_' + qi);
        if (q.id && seenIds.has(id)) return;
        const sig = signature(q);
        if (seenSigs.has(sig)) return;
        if (q.id) seenIds.add(id);
        seenSigs.add(sig);
        qs.push(q);
      });
      if (qs.length) pools.push({ level: levelIdx + 1, questions: qs });
    });
    return pools;
  }

  // Hitung jumlah soal yang tersedia (dipakai untuk teks kartu di halaman bab).
  function countPool(bank) {
    return buildLevelPools(bank).reduce((sum, p) => sum + p.questions.length, 0);
  }

  /* --------------------------------------------------------- pemilihan -- */

  /**
   * Ambil `size` soal acak tanpa duplikat dari seluruh level pada `bank`.
   * - Level yang menyumbang dipilih adil (round-robin, urutan level diacak).
   * - Di dalam satu level, tipe soal yang paling jarang terpilih didahulukan
   *   agar satu sesi tetap bervariasi (tetap acak, tidak deterministik).
   * - Hasil akhir diacak dengan Fisher-Yates.
   */
  function pickQuestions(bank, size) {
    const wanted = Math.max(1, size || SESSION_SIZE);
    const pools = buildLevelPools(bank).map(p => ({
      level: p.level,
      questions: shuffle(p.questions)
    }));

    const picked = [];
    const typeCount = {};

    while (picked.length < wanted) {
      const available = pools.filter(p => p.questions.length > 0);
      if (!available.length) break;

      // Urutan level pada ronde ini diacak → tidak ada level yang selalu dominan.
      for (const pool of shuffle(available)) {
        if (picked.length >= wanted) break;

        // Pilih soal dengan tipe paling jarang muncul; seri dipilih acak.
        let bestScore = Infinity;
        for (const q of pool.questions) {
          const used = typeCount[q.type] || 0;
          if (used < bestScore) bestScore = used;
        }
        const candidates = pool.questions.filter(q => (typeCount[q.type] || 0) === bestScore);
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];

        pool.questions = pool.questions.filter(q => q !== chosen);
        picked.push(chosen);
        typeCount[chosen.type] = (typeCount[chosen.type] || 0) + 1;
      }
    }

    return shuffle(picked).slice(0, wanted);
  }

  /* ------------------------------------------------------------ sesi -- */

  function saveSession(session) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) { /* penyimpanan opsional */ }
  }

  function loadSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !s.chapter || !Array.isArray(s.ids) || !s.ids.length) return null;
      return s;
    } catch (e) {
      return null;
    }
  }

  function clearSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* abaikan */ }
  }

  // Ubah sesi tersimpan menjadi daftar soal; null bila data bank berubah.
  function resolveSession(session, bank) {
    if (!session || !Array.isArray(session.ids)) return null;
    const byId = new Map();
    (bank || []).forEach(level => {
      ((level && level.questions) || []).forEach(q => {
        if (q && q.id) byId.set(String(q.id), q);
      });
    });
    const questions = [];
    for (const id of session.ids) {
      const q = byId.get(String(id));
      if (!q) return null;
      if (isRenderable(q)) questions.push(q);
    }
    if (questions.length !== session.ids.length) return null;
    return questions;
  }

  global.RandomQuiz = {
    SESSION_SIZE,
    SESSION_KEY,
    RENDERABLE_TYPES,
    shuffle,
    isRenderable,
    countPool,
    pickQuestions,
    saveSession,
    loadSession,
    clearSession,
    resolveSession
  };
})(window);
