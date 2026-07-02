// generate.js
// Generator soal Bahasa Jepang - Minna no Nihongo I Bab 7
// Menghasilkan js/data/vocab.js dan js/data/levels.js (data statis, deterministik)

const fs = require('fs');
const path = require('path');

/* ========================= 1. SEEDED RNG ========================= */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rnd) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pick(arr, rnd) { return arr[Math.floor(rnd() * arr.length)]; }
function pickN(arr, n, rnd) { return shuffle(arr, rnd).slice(0, n); }

/* ========================= 2. VOCAB MASTER LIST (46 wajib) ========================= */
const VOCAB = [
  { id: 'v_kirimasu', jp: '切ります', kana: 'きります', id_mean: 'memotong', type: 'verb' },
  { id: 'v_okurimasu', jp: '送ります', kana: 'おくります', id_mean: 'mengirim', type: 'verb' },
  { id: 'v_agemasu', jp: 'あげます', kana: 'あげます', id_mean: 'memberi', type: 'verb' },
  { id: 'v_moraimasu', jp: 'もらいます', kana: 'もらいます', id_mean: 'menerima', type: 'verb' },
  { id: 'v_kashimasu', jp: '貸します', kana: 'かします', id_mean: 'meminjamkan', type: 'verb' },
  { id: 'v_karimasu', jp: '借ります', kana: 'かります', id_mean: 'meminjam', type: 'verb' },
  { id: 'v_oshiemasu', jp: '教えます', kana: 'おしえます', id_mean: 'mengajar', type: 'verb' },
  { id: 'v_naraimasu', jp: '習います', kana: 'ならいます', id_mean: 'belajar', type: 'verb' },
  { id: 'v_denwa', jp: '電話をかけます', kana: 'でんわをかけます', id_mean: 'menelepon', type: 'verb' },
  { id: 'n_te', jp: '手', kana: 'て', id_mean: 'tangan', type: 'noun' },
  { id: 'n_hashi', jp: 'はし', kana: 'はし', id_mean: 'sumpit', type: 'noun' },
  { id: 'n_supoon', jp: 'スプーン', kana: 'スプーン', id_mean: 'sendok', type: 'noun' },
  { id: 'n_naifu', jp: 'ナイフ', kana: 'ナイフ', id_mean: 'pisau', type: 'noun' },
  { id: 'n_fooku', jp: 'フォーク', kana: 'フォーク', id_mean: 'garpu', type: 'noun' },
  { id: 'n_hasami', jp: 'はさみ', kana: 'はさみ', id_mean: 'gunting', type: 'noun' },
  { id: 'n_pasokon', jp: 'パソコン', kana: 'パソコン', id_mean: 'laptop', type: 'noun' },
  { id: 'n_keitai', jp: 'ケータイ', kana: 'ケータイ', id_mean: 'handphone', type: 'noun' },
  { id: 'n_meeru', jp: 'メール', kana: 'メール', id_mean: 'email', type: 'noun' },
  { id: 'n_nengajou', jp: '年賀状', kana: 'ねんがじょう', id_mean: 'kartu tahun baru', type: 'noun' },
  { id: 'n_panchi', jp: 'パンチ', kana: 'パンチ', id_mean: 'pelubang kertas', type: 'noun' },
  { id: 'n_hotchikisu', jp: 'ホッチキス', kana: 'ホッチキス', id_mean: 'stapler', type: 'noun' },
  { id: 'n_seroteepu', jp: 'セロテープ', kana: 'セロテープ', id_mean: 'selotip', type: 'noun' },
  { id: 'n_keshigomu', jp: '消しゴム', kana: 'けしゴム', id_mean: 'penghapus', type: 'noun' },
  { id: 'n_kami', jp: '紙', kana: 'かみ', id_mean: 'kertas', type: 'noun' },
  { id: 'n_hana', jp: '花', kana: 'はな', id_mean: 'bunga', type: 'noun' },
  { id: 'n_shatsu', jp: 'シャツ', kana: 'シャツ', id_mean: 'kemeja', type: 'noun' },
  { id: 'n_purezento', jp: 'プレゼント', kana: 'プレゼント', id_mean: 'hadiah', type: 'noun' },
  { id: 'n_nimotsu', jp: '荷物', kana: 'にもつ', id_mean: 'barang', type: 'noun' },
  { id: 'n_okane', jp: 'お金', kana: 'おかね', id_mean: 'uang', type: 'noun' },
  { id: 'n_kippu', jp: '切符', kana: 'きっぷ', id_mean: 'karcis', type: 'noun' },
  { id: 'n_kurisumasu', jp: 'クリスマス', kana: 'クリスマス', id_mean: 'Natal', type: 'noun' },
  { id: 'n_chichi', jp: '父', kana: 'ちち', id_mean: 'ayah (saya)', type: 'noun' },
  { id: 'n_haha', jp: '母', kana: 'はは', id_mean: 'ibu (saya)', type: 'noun' },
  { id: 'n_otousan', jp: 'お父さん', kana: 'おとうさん', id_mean: 'ayah (sapaan)', type: 'noun' },
  { id: 'n_okaasan', jp: 'お母さん', kana: 'おかあさん', id_mean: 'ibu (sapaan)', type: 'noun' },
  { id: 'e_mou', jp: 'もう', kana: 'もう', id_mean: 'sudah', type: 'expr' },
  { id: 'e_mada', jp: 'まだ', kana: 'まだ', id_mean: 'belum', type: 'expr' },
  { id: 'e_korekara', jp: 'これから', kana: 'これから', id_mean: 'mulai sekarang', type: 'expr' },
  { id: 'e_suteki', jp: 'すてきですね', kana: 'すてきですね', id_mean: 'indah sekali, ya', type: 'expr' },
  { id: 'e_irasshai', jp: 'いらっしゃい', kana: 'いらっしゃい', id_mean: 'selamat datang', type: 'expr' },
  { id: 'e_douzo', jp: 'どうぞお上がりください', kana: 'どうぞおあがりください', id_mean: 'silakan masuk', type: 'expr' },
  { id: 'e_shitsurei', jp: '失礼します', kana: 'しつれいします', id_mean: 'permisi', type: 'expr' },
  { id: 'e_ikaga', jp: '〜はいかがですか', kana: '〜はいかがですか', id_mean: 'bagaimana kalau ~', type: 'expr' },
  { id: 'e_itadakimasu', jp: 'いただきます', kana: 'いただきます', id_mean: 'selamat makan (sebelum makan)', type: 'expr' },
  { id: 'e_gochisousama', jp: 'ごちそうさまでした', kana: 'ごちそうさまでした', id_mean: 'terima kasih atas hidangannya', type: 'expr' },
  { id: 'n_supein', jp: 'スペイン', kana: 'スペイン', id_mean: 'Spanyol', type: 'noun' },
];

const VMAP = Object.fromEntries(VOCAB.map(v => [v.id, v]));

/* ========================= 3. VERB CONJUGATION TABLE ========================= */
// Setiap bentuk verba disertai kana (bacaan) agar bisa ditampilkan sebagai furigana.
// Catatan: audio TIDAK memakai field kana ini — Web Speech API membaca teks asli
// (kanji/kana campuran) langsung karena voice ja-JP browser sudah bisa melafalkan
// dengan benar. Field kana di sini murni untuk tampilan furigana di layar hasil.
const VERBS = {
  kirimasu: { kanji: '切ります', kana: 'きります', mashita: '切りました', mashitaKana: 'きりました', masen: '切りません', masenKana: 'きりません', te: '切って', teKana: 'きって', mashou: '切りましょう', mashouKana: 'きりましょう', vocab: 'v_kirimasu' },
  okurimasu: { kanji: '送ります', kana: 'おくります', mashita: '送りました', mashitaKana: 'おくりました', masen: '送りません', masenKana: 'おくりません', te: '送って', teKana: 'おくって', mashou: '送りましょう', mashouKana: 'おくりましょう', vocab: 'v_okurimasu' },
  agemasu: { kanji: 'あげます', kana: 'あげます', mashita: 'あげました', mashitaKana: 'あげました', masen: 'あげません', masenKana: 'あげません', te: 'あげて', teKana: 'あげて', mashou: 'あげましょう', mashouKana: 'あげましょう', vocab: 'v_agemasu' },
  moraimasu: { kanji: 'もらいます', kana: 'もらいます', mashita: 'もらいました', mashitaKana: 'もらいました', masen: 'もらいません', masenKana: 'もらいません', te: 'もらって', teKana: 'もらって', mashou: 'もらいましょう', mashouKana: 'もらいましょう', vocab: 'v_moraimasu' },
  kashimasu: { kanji: '貸します', kana: 'かします', mashita: '貸しました', mashitaKana: 'かしました', masen: '貸しません', masenKana: 'かしません', te: '貸して', teKana: 'かして', mashou: '貸しましょう', mashouKana: 'かしましょう', vocab: 'v_kashimasu' },
  karimasu: { kanji: '借ります', kana: 'かります', mashita: '借りました', mashitaKana: 'かりました', masen: '借りません', masenKana: 'かりません', te: '借りて', teKana: 'かりて', mashou: '借りましょう', mashouKana: 'かりましょう', vocab: 'v_karimasu' },
  oshiemasu: { kanji: '教えます', kana: 'おしえます', mashita: '教えました', mashitaKana: 'おしえました', masen: '教えません', masenKana: 'おしえません', te: '教えて', teKana: 'おしえて', mashou: '教えましょう', mashouKana: 'おしえましょう', vocab: 'v_oshiemasu' },
  naraimasu: { kanji: '習います', kana: 'ならいます', mashita: '習いました', mashitaKana: 'ならいました', masen: '習いません', masenKana: 'ならいません', te: '習って', teKana: 'ならって', mashou: '習いましょう', mashouKana: 'ならいましょう', vocab: 'v_naraimasu' },
  denwa: { kanji: '電話をかけます', kana: 'でんわをかけます', mashita: '電話をかけました', mashitaKana: 'でんわをかけました', masen: '電話をかけません', masenKana: 'でんわをかけません', te: '電話をかけて', teKana: 'でんわをかけて', mashou: '電話をかけましょう', mashouKana: 'でんわをかけましょう', vocab: 'v_denwa', noParticleO: true },
};

/* ========================= 3b. TOKEN READING MAP (untuk furigana tampilan) ========================= */
// Bacaan partikel (khusus は yang dibaca "わ" sebagai penanda topik)
const PARTICLE_READING = {
  'を': 'を', 'に': 'に', 'は': 'わ', 'で': 'で', 'から': 'から', 'と': 'と', 'か': 'か', 'も': 'も', '、': '',
};

// Kata tambahan (bukan bagian dari 46 kosakata wajib, tapi muncul sebagai objek pelengkap)
const EXTRA_READINGS = {
  'スペイン語': 'すぺいんご',
  '日本語': 'にほんご',
};

// Gabungkan semua sumber bacaan: kosakata wajib + bentuk konjugasi verba + kata tambahan
const TOKEN_READING_MAP = {};
VOCAB.forEach(v => { TOKEN_READING_MAP[v.jp] = v.kana; });
Object.values(VERBS).forEach(v => {
  TOKEN_READING_MAP[v.kanji] = v.kana;
  TOKEN_READING_MAP[v.mashita] = v.mashitaKana;
  TOKEN_READING_MAP[v.masen] = v.masenKana;
  TOKEN_READING_MAP[v.mashou] = v.mashouKana;
  TOKEN_READING_MAP[v.te] = v.teKana;
  TOKEN_READING_MAP[v.te + 'いません'] = v.teKana + 'いません'; // bentuk まだ〜ていません
  // bentuk tanya lampau: 〜ましたか (mis. 送りましたか -> おくりましたか)
  const mashitaKa = v.mashita.replace('ました', 'ましたか');
  const mashitaKaKana = v.mashitaKana.replace('ました', 'ましたか');
  TOKEN_READING_MAP[mashitaKa] = mashitaKaKana;
});
Object.assign(TOKEN_READING_MAP, EXTRA_READINGS);

function tokenReading(token) {
  if (PARTICLE_READING[token] !== undefined) return PARTICLE_READING[token];
  if (TOKEN_READING_MAP[token] !== undefined) return TOKEN_READING_MAP[token];
  // Jika token tidak mengandung kanji (hiragana/katakana murni), bacaannya = teksnya sendiri
  if (!/[\u4E00-\u9FFF]/.test(token)) return token;
  // Token kanji tak dikenal — tandai agar ketahuan saat generate (seharusnya tidak terjadi)
  console.warn('WARNING: bacaan tidak ditemukan untuk token:', token);
  return token;
}

/* ========================= 4. SENTENCE BANK BUILDER ========================= */
// Setiap "sentence" object: { tokens:[..jp words incl. particles..], id:"terjemahan", vocab:[vocabIds], pattern:'nama pola', reading:'bacaan hiragana lengkap' }
const sentences = [];

function addSentence(tokens, idText, vocabUsed, pattern) {
  const reading = tokens.map(t => (t === '、' ? '' : tokenReading(t))).join('');
  sentences.push({ tokens, id: idText, vocab: vocabUsed, pattern, reading });
}


// --- Pola: [orang]は[objek]を[verb]ました / (もう〜ました / まだ〜ていません / まだです / 〜ますか)
const objectsForVerb = {
  okurimasu: [
    ['荷物', 'n_nimotsu', 'barang'], ['お金', 'n_okane', 'uang'], ['花', 'n_hana', 'bunga'],
    ['プレゼント', 'n_purezento', 'hadiah'], ['年賀状', 'n_nengajou', 'kartu tahun baru'],
    ['メール', 'n_meeru', 'email'], ['シャツ', 'n_shatsu', 'kemeja'], ['切符', 'n_kippu', 'karcis'],
  ],
  karimasu: [
    ['はさみ', 'n_hasami', 'gunting'], ['ナイフ', 'n_naifu', 'pisau'], ['フォーク', 'n_fooku', 'garpu'],
    ['スプーン', 'n_supoon', 'sendok'], ['はし', 'n_hashi', 'sumpit'], ['パソコン', 'n_pasokon', 'laptop'],
    ['ケータイ', 'n_keitai', 'handphone'], ['消しゴム', 'n_keshigomu', 'penghapus'], ['パンチ', 'n_panchi', 'pelubang kertas'],
    ['ホッチキス', 'n_hotchikisu', 'stapler'], ['セロテープ', 'n_seroteepu', 'selotip'], ['お金', 'n_okane', 'uang'],
  ],
  kashimasu: [
    ['はさみ', 'n_hasami', 'gunting'], ['ナイフ', 'n_naifu', 'pisau'], ['フォーク', 'n_fooku', 'garpu'],
    ['スプーン', 'n_supoon', 'sendok'], ['はし', 'n_hashi', 'sumpit'], ['パソコン', 'n_pasokon', 'laptop'],
    ['ケータイ', 'n_keitai', 'handphone'], ['消しゴム', 'n_keshigomu', 'penghapus'], ['パンチ', 'n_panchi', 'pelubang kertas'],
    ['ホッチキス', 'n_hotchikisu', 'stapler'], ['セロテープ', 'n_seroteepu', 'selotip'], ['お金', 'n_okane', 'uang'],
  ],
  agemasu: [
    ['プレゼント', 'n_purezento', 'hadiah'], ['花', 'n_hana', 'bunga'], ['年賀状', 'n_nengajou', 'kartu tahun baru'],
    ['シャツ', 'n_shatsu', 'kemeja'], ['お金', 'n_okane', 'uang'], ['荷物', 'n_nimotsu', 'barang'],
  ],
  moraimasu: [
    ['プレゼント', 'n_purezento', 'hadiah'], ['花', 'n_hana', 'bunga'], ['年賀状', 'n_nengajou', 'kartu tahun baru'],
    ['シャツ', 'n_shatsu', 'kemeja'], ['お金', 'n_okane', 'uang'], ['切符', 'n_kippu', 'karcis'],
  ],
  oshiemasu: [
    ['スペイン語', 'n_supein', 'bahasa Spanyol'],
  ],
  naraimasu: [
    ['スペイン語', 'n_supein', 'bahasa Spanyol'],
  ],
  kirimasu: [
    ['紙', 'n_kami', 'kertas'], ['花', 'n_hana', 'bunga'],
  ],
};

const people = [
  ['父', 'n_chichi', 'ayah saya', 'saya'],
  ['母', 'n_haha', 'ibu saya', 'saya'],
  ['お父さん', 'n_otousan', 'ayah (Anda/nya)', 'dia'],
  ['お母さん', 'n_okaasan', 'ibu (Anda/nya)', 'dia'],
];

// 4.1 pola verb+objek dasar: 〜を〜ます (dan bentuk lampau/negatif)
for (const [verbKey, objs] of Object.entries(objectsForVerb)) {
  const v = VERBS[verbKey];
  for (const [objJp, objVocab, objId] of objs) {
    const oParticle = v.noParticleO ? [] : ['を'];
    // kalimat positif lampau
    addSentence(
      [objJp, ...oParticle, v.mashita],
      `Saya sudah ${meaningOfVerb(verbKey)} ${objId}.`,
      [objVocab, v.vocab, 'e_mou'],
      'objek+verb (lampau)'
    );
    // dengan もう + ますか
    addSentence(
      ['もう', objJp, ...oParticle, v.mashita.replace('ました', 'ましたか')],
      `Apakah ${objId} sudah ${meaningOfVerbPassive(verbKey)}?`,
      [objVocab, v.vocab, 'e_mou'],
      'もう〜ましたか'
    );
    // jawaban positif: はい、もう〜ました。
    addSentence(
      ['はい', '、', 'もう', v.mashita],
      `Ya, sudah ${meaningOfVerb(verbKey)}.`,
      [v.vocab, 'e_mou'],
      'はい、もう〜ました'
    );
    // jawaban negatif: いいえ、まだ〜ていません。
    addSentence(
      ['いいえ', '、', 'まだ', v.te + 'いません'],
      `Belum, belum ${meaningOfVerb(verbKey)}.`,
      [v.vocab, 'e_mada'],
      'まだ〜ていません'
    );
    // まだです。
    addSentence(
      ['いいえ', '、', 'まだです'],
      `Belum.`,
      ['e_mada'],
      'まだです'
    );
  }
}

// 4.2 pola 〜に〜をあげます / もらいます / かします / かります / おしえます
const nimoDataMap = {
  agemasu: objectsForVerb.agemasu,
  moraimasu: objectsForVerb.moraimasu,
  kashimasu: objectsForVerb.kashimasu,
  karimasu: objectsForVerb.karimasu,
  oshiemasu: objectsForVerb.oshiemasu,
};
function meaningOfVerb(k) {
  const map = {
    okurimasu: 'mengirim', karimasu: 'meminjam', kashimasu: 'meminjamkan',
    agemasu: 'memberi', moraimasu: 'menerima', oshiemasu: 'mengajar',
    naraimasu: 'belajar', kirimasu: 'memotong', denwa: 'menelepon'
  };
  return map[k] || k;
}
// Bentuk pasif untuk konteks objek sebagai topik (mis. "Apakah barang sudah dikirim?")
function meaningOfVerbPassive(k) {
  const map = {
    okurimasu: 'dikirim', karimasu: 'dipinjam', kashimasu: 'dipinjamkan',
    agemasu: 'diberikan', moraimasu: 'diterima', oshiemasu: 'diajarkan',
    naraimasu: 'dipelajari', kirimasu: 'dipotong', denwa: 'ditelepon'
  };
  return map[k] || k;
}

for (const [verbKey, objs] of Object.entries(nimoDataMap)) {
  const v = VERBS[verbKey];
  for (const per of people) {
    for (const [objJp, objVocab, objId] of objs) {
      let verbId;
      if (verbKey === 'agemasu') verbId = `Saya memberi ${objId} kepada ${per[2]}.`;
      else if (verbKey === 'moraimasu') verbId = `Saya menerima ${objId} dari ${per[2]}.`;
      else if (verbKey === 'kashimasu') verbId = `Saya meminjamkan ${objId} kepada ${per[2]}.`;
      else if (verbKey === 'karimasu') verbId = `Saya meminjam ${objId} dari ${per[2]}.`;
      else if (verbKey === 'oshiemasu') verbId = `${per[2]} mengajar ${objId}.`;
      addSentence(
        [per[0], 'に', objJp, 'を', v.mashita],
        verbId,
        [per[1], objVocab, v.vocab],
        `〜に〜を${verbKey}`
      );
    }
  }
}

// 習います pattern: [orang]は[objek]を習います (tanpa に karena subjek yang belajar)
for (const per of people) {
  for (const [objJp, objVocab, objId] of nimoDataMap.oshiemasu) {
    addSentence(
      [per[0], 'は', objJp, 'を', VERBS.naraimasu.mashita],
      `${per[2]} belajar ${objId}.`,
      [per[1], objVocab, VERBS.naraimasu.vocab],
      '〜をならいます'
    );
  }
}

// 電話をかけます pattern (dengan penerima memakai に)
for (const per of people) {
  addSentence(
    [per[0], 'に', VERBS.denwa.mashita],
    `Saya menelepon ${per[2]}.`,
    [per[1], VERBS.denwa.vocab],
    '〜に電話をかけます'
  );
  addSentence(
    [per[0], 'に', 'もう', VERBS.denwa.mashita.replace('ました', 'ましたか')],
    `Apakah sudah menelepon ${per[2]}?`,
    [per[1], VERBS.denwa.vocab, 'e_mou'],
    'もう電話をかけましたか'
  );
}

// 手を切りました (idiom cedera tangan)
addSentence(['手', 'を', VERBS.kirimasu.mashita], 'Tangan saya teriris/terpotong.', ['n_te', 'v_kirimasu'], '手を切りました');
addSentence(['気を', 'つけて', 'ください'].slice(0,0), '', [], ''); // no-op placeholder removed below

// Kalimat pemberian dengan konteks Natal
addSentence(
  ['クリスマス', 'に', '父', 'に', 'プレゼント', 'を', VERBS.agemasu.mashita],
  'Waktu Natal, saya memberi hadiah kepada ayah.',
  ['n_kurisumasu', 'n_chichi', 'n_purezento', 'v_agemasu'],
  'クリスマス+あげます'
);
addSentence(
  ['クリスマス', 'に', '母', 'から', 'プレゼント', 'を', VERBS.moraimasu.mashita],
  'Waktu Natal, saya menerima hadiah dari ibu.',
  ['n_kurisumasu', 'n_haha', 'n_purezento', 'v_moraimasu'],
  'クリスマス+もらいます'
);
addSentence(
  ['母', 'に', '年賀状', 'を', VERBS.okurimasu.mashita],
  'Saya mengirim kartu tahun baru kepada ibu.',
  ['n_haha', 'n_nengajou', 'v_okurimasu'],
  '年賀状を送ります'
);

// Ungkapan percakapan (dialog Bab 7)
addSentence(['いらっしゃい'], 'Selamat datang.', ['e_irasshai'], 'salam');
addSentence(['どうぞお上がりください'], 'Silakan masuk.', ['e_douzo'], 'salam');
addSentence(['失礼します'], 'Permisi.', ['e_shitsurei'], 'salam');
addSentence(['いただきます'], 'Selamat makan (sebelum makan).', ['e_itadakimasu'], 'makan');
addSentence(['ごちそうさまでした'], 'Terima kasih atas hidangannya (sesudah makan).', ['e_gochisousama'], 'makan');
addSentence(['花', 'は', 'すてきですね'], 'Bunganya indah sekali, ya.', ['n_hana', 'e_suteki'], 'pujian');
addSentence(['プレゼント', 'は', 'すてきですね'], 'Hadiahnya indah sekali, ya.', ['n_purezento', 'e_suteki'], 'pujian');
addSentence(['シャツ', 'は', 'いかがですか'], 'Bagaimana kalau kemeja ini?', ['n_shatsu', 'e_ikaga'], '〜はいかがですか');
addSentence(['プレゼント', 'は', 'いかがですか'], 'Bagaimana kalau hadiah ini?', ['n_purezento', 'e_ikaga'], '〜はいかがですか');
addSentence(['花', 'は', 'いかがですか'], 'Bagaimana kalau bunga ini?', ['n_hana', 'e_ikaga'], '〜はいかがですか');
addSentence(['これから', '日本語', 'を', VERBS.naraimasu.mashou], 'Mulai sekarang, mari belajar bahasa Jepang.', ['e_korekara', 'v_naraimasu'], 'これから〜ましょう');
addSentence(['これから', 'スペイン語', 'を', VERBS.naraimasu.mashou], 'Mulai sekarang, mari belajar bahasa Spanyol.', ['e_korekara', 'v_naraimasu', 'n_supein'], 'これから〜ましょう');

/* ========================= 5. TAMBAHAN: pastikan tiap vocab dipakai berkali-kali ========================= */
// (sentence bank sudah mencakup semua vocab; cek di akhir skrip)

/* ========================= 6. QUESTION GENERATORS ========================= */
let uid = 0;
function nextId() { uid += 1; return 'q' + uid; }

function joinTokens(tokens) {
  // gabungkan token dengan spasi, tapi rapikan tanda baca koma dan titik
  let s = tokens.join(' ');
  s = s.replace(/\s+、/g, '、').replace(/、\s+/g, '、 ');
  return s;
}

function correctSentenceStr(tokens) {
  let s = tokens.join('');
  return s;
}

// distractor kata kerja acak (bentuk salah) untuk soal translate/complete
function verbDistractor(correctForm, verbKey) {
  const v = VERBS[verbKey];
  if (!v) return null;
  const opts = [v.mashita, v.masen, v.mashou].filter(f => f !== correctForm);
  return opts;
}

function detectVerbKeyFromToken(token) {
  for (const [k, v] of Object.entries(VERBS)) {
    if (token === v.mashita || token === v.masen || token === v.mashou) return k;
  }
  return null;
}

// 1) ARRANGE (menyusun kalimat)
function genArrange(sentence, rnd) {
  const tokens = sentence.tokens.filter(t => t !== '、');
  if (tokens.length < 2) return null;
  const shuffled = shuffle(tokens, rnd);
  return {
    id: nextId(),
    type: 'arrange',
    instruction: 'Susun kata berikut menjadi kalimat yang benar',
    tiles: shuffled,
    tileReadings: shuffled.map(tokenReading), // bacaan tiap kartu, untuk audio saat kartu disentuh
    answer: tokens,
    displayId: sentence.id,
    reading: sentence.reading, // bacaan kalimat lengkap, untuk audio jawaban benar
    vocab: sentence.vocab,
  };
}

// 2) TRANSLATE (Indonesia -> susun kata Jepang, dengan distraktor)
function genTranslate(sentence, rnd) {
  const tokens = sentence.tokens.filter(t => t !== '、');
  if (tokens.length < 2) return null;
  let pool = tokens.slice();
  // cari verb token utk buat distraktor bentuk salah
  for (const t of tokens) {
    const vk = detectVerbKeyFromToken(t);
    if (vk) {
      const distractors = verbDistractor(t, vk);
      if (distractors && distractors.length) {
        pool.push(pick(distractors, rnd));
      }
      break;
    }
  }
  pool = shuffle(pool, rnd);
  return {
    id: nextId(),
    type: 'translate',
    instruction: 'Terjemahkan kalimat berikut ke Bahasa Jepang',
    prompt: sentence.id,
    tiles: pool,
    tileReadings: pool.map(tokenReading), // bacaan tiap kartu, untuk audio saat kartu disentuh
    answer: tokens,
    reading: sentence.reading,
    vocab: sentence.vocab,
  };
}

// 3) MATCH (mencocokkan kosakata) - butuh set vocab min 4
function genMatch(vocabSet, rnd) {
  const items = pickN(vocabSet, Math.min(4, vocabSet.length), rnd);
  if (items.length < 3) return null;
  return {
    id: nextId(),
    type: 'match',
    instruction: 'Cocokkan kosakata Jepang dengan artinya',
    pairs: items.map(v => ({ jp: v.jp, id: v.id_mean, vocabId: v.id, reading: v.kana })),
    vocab: items.map(v => v.id),
  };
}

// 4) COMPLETE (melengkapi kalimat)
function genComplete(sentence, rnd) {
  const tokens = sentence.tokens.filter(t => t !== '、');
  let blankIdx = -1;
  let verbKey = null;
  for (let i = tokens.length - 1; i >= 0; i--) {
    const vk = detectVerbKeyFromToken(tokens[i]);
    if (vk) { blankIdx = i; verbKey = vk; break; }
  }
  if (blankIdx === -1) return null;
  const correct = tokens[blankIdx];
  const distractors = verbDistractor(correct, verbKey) || [];
  if (distractors.length < 2) return null;
  const options = shuffle([correct, ...distractors.slice(0, 2)], rnd);
  const displayTokens = tokens.slice();
  displayTokens[blankIdx] = '______';
  // kalimat lengkap versi jawaban benar (untuk audio setelah user menjawab)
  const fullTokens = tokens.slice();
  const fullSentenceText = fullTokens.join('');
  return {
    id: nextId(),
    type: 'complete',
    instruction: 'Lengkapi kalimat berikut',
    prompt: joinTokens(displayTokens),
    options,
    optionReadings: options.map(tokenReading), // bacaan tiap opsi jawaban
    answer: correct,
    translation: sentence.id,
    fullSentenceText,
    reading: sentence.reading,
    vocab: sentence.vocab,
  };
}

// 5) MULTIPLE CHOICE (pilihan ganda arti kata)
function genMultipleChoice(vocabItem, vocabPool, rnd) {
  const others = vocabPool.filter(v => v.id !== vocabItem.id);
  const distractors = pickN(others, 3, rnd);
  const optionItems = shuffle([vocabItem, ...distractors], rnd);
  return {
    id: nextId(),
    type: 'multiple_choice',
    instruction: 'Pilih kata Bahasa Jepang yang tepat',
    prompt: `"${cap(vocabItem.id_mean)}"`,
    options: optionItems.map(v => v.jp),
    optionReadings: optionItems.map(v => v.kana), // bacaan tiap opsi, untuk audio saat opsi disentuh
    answer: vocabItem.jp,
    vocab: [vocabItem.id],
  };
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// 6) TRUE/FALSE
function genTrueFalse(vocabItem, vocabPool, rnd) {
  const isTrue = rnd() > 0.5;
  let displayedMeaning = vocabItem.id_mean;
  if (!isTrue) {
    const others = vocabPool.filter(v => v.id !== vocabItem.id && v.type === vocabItem.type);
    const wrong = pick(others.length ? others : vocabPool, rnd);
    displayedMeaning = wrong.id_mean;
  }
  return {
    id: nextId(),
    type: 'true_false',
    instruction: 'Benar atau salah?',
    prompt: `${vocabItem.jp} = ${displayedMeaning}`,
    promptJp: vocabItem.jp, // teks Jepang murni, untuk audio (tanpa "= arti")
    reading: vocabItem.kana,
    answer: isTrue ? 'benar' : 'salah',
    vocab: [vocabItem.id],
  };
}

// 7) CHOOSE TRANSLATION (pilih terjemahan kalimat yang benar)
function genChooseTranslation(sentence, allSentences, rnd) {
  const correctStr = joinTokens(sentence.tokens);
  const candidates = allSentences.filter(s => s !== sentence && s.tokens.length >= 2 && joinTokens(s.tokens) !== correctStr);
  if (candidates.length < 2) return null;
  const shuffledCandidates = shuffle(candidates, rnd);
  const distractorSentences = [];
  const seen = new Set([correctStr]);
  for (const cand of shuffledCandidates) {
    const txt = joinTokens(cand.tokens);
    if (seen.has(txt)) continue;
    seen.add(txt);
    distractorSentences.push(cand);
    if (distractorSentences.length === 2) break;
  }
  if (distractorSentences.length < 2) return null;
  const optionSentences = shuffle([sentence, ...distractorSentences], rnd);
  const options = optionSentences.map(s => joinTokens(s.tokens));
  const optionReadings = optionSentences.map(s => s.reading);
  return {
    id: nextId(),
    type: 'choose_translation',
    instruction: 'Pilih terjemahan Bahasa Jepang yang benar',
    prompt: sentence.id,
    options,
    optionReadings, // bacaan tiap opsi kalimat, untuk audio saat opsi disentuh
    answer: correctStr,
    vocab: sentence.vocab,
  };
}

// 8) LISTENING (dengarkan audio Web Speech API, lalu susun kalimat yang didengar)
// Tingkat kesulitan mengikuti level: makin tinggi level, makin panjang kalimat &
// makin banyak kata pengecoh (distraktor) yang disisipkan di antara kartu kata.
function listeningWordRange(level) {
  if (level === 1) return [2, 3];
  if (level === 2) return [3, 5];
  if (level >= 3 && level <= 10) return [4, 7];
  if (level <= 20) return [5, 8];
  if (level <= 30) return [6, 9];
  if (level <= 40) return [6, 10];
  return [7, 12]; // 41-50: paling sulit
}
function listeningDistractorCount(level) {
  if (level <= 10) return 0;          // level awal: tanpa pengecoh, fokus mendengar & menyusun
  if (level <= 20) return 1;
  if (level <= 30) return 1;
  if (level <= 40) return 2;
  return 2;                            // 41-50: paling banyak pengecoh
}

// Kelompokkan seluruh kalimat berdasarkan jumlah token (panjang kalimat)
function buildListeningPools() {
  const pools = {};
  sentences.forEach(s => {
    const len = s.tokens.filter(t => t !== '、').length;
    if (!pools[len]) pools[len] = [];
    pools[len].push(s);
  });
  return pools;
}
const listeningPoolsByLength = buildListeningPools();

function pickListeningSentence(level, rnd) {
  const [minLen, maxLen] = listeningWordRange(level);
  let candidates = [];
  for (let len = minLen; len <= maxLen; len++) {
    if (listeningPoolsByLength[len]) candidates = candidates.concat(listeningPoolsByLength[len]);
  }
  if (candidates.length === 0) {
    // fallback: pilih panjang yang tersedia paling mendekati target
    const allLens = Object.keys(listeningPoolsByLength).map(Number).sort((a, b) => a - b);
    const target = Math.round((minLen + maxLen) / 2);
    let closest = allLens[0];
    let bestDiff = Infinity;
    allLens.forEach(l => { const d = Math.abs(l - target); if (d < bestDiff) { bestDiff = d; closest = l; } });
    candidates = listeningPoolsByLength[closest] || sentences;
  }
  return pick(candidates, rnd);
}

function genListening(sentence, rnd, level) {
  const tokens = sentence.tokens.filter(t => t !== '、');
  if (tokens.length < 2) return null;
  const distractorCount = listeningDistractorCount(level);
  const usedSet = new Set(tokens);
  let pool = tokens.slice();

  // Sisipkan kata pengecoh dari kalimat lain (tidak duplikat dengan token asli)
  let attempts = 0;
  while (pool.length < tokens.length + distractorCount && attempts < 50) {
    attempts++;
    const otherSentence = pick(sentences, rnd);
    const candidates = otherSentence.tokens.filter(t => t !== '、');
    if (candidates.length === 0) continue;
    const candidateToken = pick(candidates, rnd);
    if (candidateToken && !usedSet.has(candidateToken) && !pool.includes(candidateToken)) {
      pool.push(candidateToken);
    }
  }
  pool = shuffle(pool, rnd);

  // audioText: kalimat utuh tanpa spasi antar-kata (lebih natural saat dibacakan Web Speech API)
  const audioText = tokens.join('');

  return {
    id: nextId(),
    type: 'listening',
    instruction: 'Dengarkan audio, lalu susun kalimat yang kamu dengar.',
    audioText,
    reading: sentence.reading, // bacaan hiragana lengkap, untuk furigana setelah menjawab
    tiles: pool,
    answer: tokens,
    translation: sentence.id,
    vocab: sentence.vocab,
  };
}


/* ========================= 7. LEVEL BUILDER ========================= */
const TOTAL_LEVELS = 50;
const QUESTIONS_PER_LEVEL = 20;

function tierOf(level) {
  if (level <= 10) return 'mudah';
  if (level <= 20) return 'sedang';
  if (level <= 30) return 'kalimat';
  if (level <= 40) return 'campuran';
  return 'acak';
}

function typeWeightsForTier(tier) {
  switch (tier) {
    case 'mudah':
      return { multiple_choice: 3, true_false: 3, match: 3, complete: 3, arrange: 3, translate: 2, choose_translation: 2, listening: 2 };
    case 'sedang':
      return { multiple_choice: 2, true_false: 2, match: 2, complete: 3, arrange: 3, translate: 3, choose_translation: 3, listening: 3 };
    case 'kalimat':
      return { multiple_choice: 2, true_false: 2, match: 2, complete: 2, arrange: 4, translate: 3, choose_translation: 3, listening: 3 };
    case 'campuran':
      return { multiple_choice: 2, true_false: 2, match: 2, complete: 3, arrange: 3, translate: 3, choose_translation: 3, listening: 3 };
    default: // acak
      return { multiple_choice: 2, true_false: 2, match: 2, complete: 3, arrange: 3, translate: 2, choose_translation: 3, listening: 4 };
  }
}

function buildTypeSequence(weights, count, rnd) {
  const pool = [];
  for (const [type, w] of Object.entries(weights)) {
    for (let i = 0; i < w; i++) pool.push(type);
  }
  const seq = [];
  for (let i = 0; i < count; i++) {
    seq.push(pool[Math.floor(rnd() * pool.length)]);
  }
  return seq;
}

// rotating cursors supaya seluruh sentence bank & vocab bank ter-cover merata
let sentenceCursor = 0;
let vocabCursor = 0;
function nextSentence() {
  const s = sentences[sentenceCursor % sentences.length];
  sentenceCursor++;
  return s;
}
function nextVocab() {
  const v = VOCAB[vocabCursor % VOCAB.length];
  vocabCursor++;
  return v;
}

const LEVELS = [];
for (let level = 1; level <= TOTAL_LEVELS; level++) {
  const rnd = mulberry32(level * 7919 + 13);
  const tier = tierOf(level);
  const weights = typeWeightsForTier(tier);
  const typeSeq = buildTypeSequence(weights, QUESTIONS_PER_LEVEL, rnd);
  const questions = [];
  let guard = 0;
  while (questions.length < QUESTIONS_PER_LEVEL && guard < 500) {
    guard++;
    const type = typeSeq[questions.length] || pick(Object.keys(weights), rnd);
    let q = null;
    if (type === 'arrange') {
      q = genArrange(nextSentence(), rnd);
    } else if (type === 'translate') {
      q = genTranslate(nextSentence(), rnd);
    } else if (type === 'match') {
      const set = pickN(VOCAB, 6, rnd);
      q = genMatch(set, rnd);
    } else if (type === 'complete') {
      q = genComplete(nextSentence(), rnd);
    } else if (type === 'multiple_choice') {
      q = genMultipleChoice(nextVocab(), VOCAB, rnd);
    } else if (type === 'true_false') {
      q = genTrueFalse(nextVocab(), VOCAB, rnd);
    } else if (type === 'choose_translation') {
      q = genChooseTranslation(nextSentence(), sentences, rnd);
    } else if (type === 'listening') {
      q = genListening(pickListeningSentence(level, rnd), rnd, level);
    }
    if (q) questions.push(q);
  }
  LEVELS.push({
    level,
    tier,
    title: `Level ${level}`,
    questions,
  });
}

/* ========================= 8. VALIDASI COVERAGE VOCAB ========================= */
const usedVocab = new Set();
for (const lvl of LEVELS) {
  for (const q of lvl.questions) {
    if (q.vocab) q.vocab.forEach(v => usedVocab.add(v));
  }
}
const missing = VOCAB.filter(v => !usedVocab.has(v.id));
if (missing.length) {
  console.warn('PERINGATAN: kosakata belum terpakai:', missing.map(m => m.jp));
} else {
  console.log('OK: semua', VOCAB.length, 'kosakata sudah terpakai di soal.');
}

/* ========================= 9. OUTPUT ========================= */
const outDir = path.join(__dirname, '..', 'js', 'data');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(
  path.join(outDir, 'vocab.js'),
  `// Auto-generated. Jangan diedit manual — edit tools/generate.js lalu jalankan ulang.\nwindow.VOCAB_DATA = ${JSON.stringify(VOCAB, null, 2)};\n`
);

fs.writeFileSync(
  path.join(outDir, 'levels.js'),
  `// Auto-generated. Jangan diedit manual — edit tools/generate.js lalu jalankan ulang.\nwindow.LEVELS_DATA = ${JSON.stringify(LEVELS)};\n`
);

console.log('Total kalimat dasar:', sentences.length);
console.log('Total level:', LEVELS.length, '| Total soal:', LEVELS.reduce((a, l) => a + l.questions.length, 0));
