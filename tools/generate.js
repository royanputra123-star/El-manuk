// tools/generate.js
// Generator Soal Bahasa Jepang - Minna no Nihongo I Bab 8
// Menghasilkan data level dan kosakata untuk Bab 8 (js/data/vocab.js & js/data/levels.js)

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

/* ========================= 2. VOCAB MASTER LIST BAB 8 ========================= */
// Semua kosakata diambil DARI kotoba.pdf, diprioritaskan kosakata Bab 8 dengan Kanji
const VOCAB = [
  // Kata Sifat な (na)
  { id: 'v_hansamu', jp: 'ハンサム', kana: 'ハンサム', id_mean: 'ganteng', type: 'adj_na' },
  { id: 'v_kirei', jp: 'きれい', kana: 'きれい', id_mean: 'indah / bersih / cantik', type: 'adj_na' },
  { id: 'v_shizuka', jp: '静か', kana: 'しずか', id_mean: 'tenang', type: 'adj_na' },
  { id: 'v_nigiyaka', jp: 'にぎやか', kana: 'にぎやか', id_mean: 'ramai', type: 'adj_na' },
  { id: 'v_yuumei', jp: '有名', kana: 'ゆうめい', id_mean: 'terkenal', type: 'adj_na' },
  { id: 'v_shinsetsu', jp: '親切', kana: 'しんせつ', id_mean: 'baik hati', type: 'adj_na' },
  { id: 'v_genki', jp: '元気', kana: 'げんき', id_mean: 'sehat / bersemangat', type: 'adj_na' },
  { id: 'v_hima', jp: '暇', kana: 'ひま', id_mean: 'senggang', type: 'adj_na' },
  { id: 'v_benri', jp: '便利', kana: 'べんり', id_mean: 'praktis', type: 'adj_na' },
  { id: 'v_suteki', jp: 'すてき', kana: 'すてき', id_mean: 'bagus / indah', type: 'adj_na' },

  // Kata Sifat い (i)
  { id: 'v_ookii', jp: '大きい', kana: 'おおきい', id_mean: 'besar', type: 'adj_i' },
  { id: 'v_chiisai', jp: '小さい', kana: 'ちいさい', id_mean: 'kecil', type: 'adj_i' },
  { id: 'v_atarashii', jp: '新しい', kana: 'あたらしい', id_mean: 'baru', type: 'adj_i' },
  { id: 'v_furui', jp: '古い', kana: 'ふるい', id_mean: 'lama / tua', type: 'adj_i' },
  { id: 'v_ii', jp: 'いい', kana: 'いい', id_mean: 'baik / bagus', type: 'adj_i' },
  { id: 'v_warui', jp: '悪い', kana: 'わるい', id_mean: 'buruk / jelek', type: 'adj_i' },
  { id: 'v_atsui', jp: '暑い', kana: 'あつい', id_mean: 'panas', type: 'adj_i' },
  { id: 'v_samui', jp: '寒い', kana: 'さむい', id_mean: 'dingin (cuaca)', type: 'adj_i' },
  { id: 'v_tsumetai', jp: '冷たい', kana: 'つめたい', id_mean: 'dingin (benda)', type: 'adj_i' },
  { id: 'v_muzukashii', jp: '難しい', kana: 'むずかしい', id_mean: 'susah / sulit', type: 'adj_i' },
  { id: 'v_yasashii', jp: '易しい', kana: 'やさしい', id_mean: 'mudah', type: 'adj_i' },
  { id: 'v_takai', jp: '高い', kana: 'たかい', id_mean: 'tinggi / mahal', type: 'adj_i' },
  { id: 'v_yasui', jp: '安い', kana: 'やすい', id_mean: 'murah', type: 'adj_i' },
  { id: 'v_hikui', jp: '低い', kana: 'ひくい', id_mean: 'rendah', type: 'adj_i' },
  { id: 'v_omoshiroi', jp: 'おもしろい', kana: 'おもしろい', id_mean: 'menarik', type: 'adj_i' },
  { id: 'v_oishii', jp: 'おいしい', kana: 'おいしい', id_mean: 'enak', type: 'adj_i' },
  { id: 'v_isogashii', jp: '忙しい', kana: 'いそがしい', id_mean: 'sibuk', type: 'adj_i' },
  { id: 'v_tanoshii', jp: '楽しい', kana: 'たのしい', id_mean: 'senang', type: 'adj_i' },
  { id: 'v_shiroi', jp: '白い', kana: 'しろい', id_mean: 'putih', type: 'adj_i' },
  { id: 'v_kuroi', jp: '黒い', kana: 'くろい', id_mean: 'hitam', type: 'adj_i' },
  { id: 'v_akai', jp: '赤い', kana: 'あかい', id_mean: 'merah', type: 'adj_i' },
  { id: 'v_aoi', jp: '青い', kana: 'あおい', id_mean: 'biru', type: 'adj_i' },

  // Kata Benda & Subjek
  { id: 'n_sakura', jp: '桜', kana: 'さくら', id_mean: 'sakura', type: 'noun' },
  { id: 'n_yama', jp: '山', kana: 'やま', id_mean: 'gunung', type: 'noun' },
  { id: 'n_fujisan', jp: '富士山', kana: 'ふじさん', id_mean: 'Gunung Fuji', type: 'noun' },
  { id: 'n_machi', jp: '町', kana: 'まち', id_mean: 'kota', type: 'noun' },
  { id: 'n_tabemono', jp: '食べ物', kana: 'たべもの', id_mean: 'makanan', type: 'noun' },
  { id: 'n_tokoro', jp: '所', kana: 'ところ', id_mean: 'tempat', type: 'noun' },
  { id: 'n_ryou', jp: '寮', kana: 'りょう', id_mean: 'asrama', type: 'noun' },
  { id: 'n_resutoran', jp: 'レストラン', kana: 'レストラン', id_mean: 'restoran', type: 'noun' },
  { id: 'n_seikatsu', jp: '生活', kana: 'せいかつ', id_mean: 'kehidupan', type: 'noun' },
  { id: 'n_shigoto', jp: '仕事', kana: 'しごと', id_mean: 'pekerjaan', type: 'noun' },
  { id: 'n_kuruma', jp: '車', kana: 'くるま', id_mean: 'mobil', type: 'noun' },
  { id: 'n_heya', jp: '部屋', kana: 'へや', id_mean: 'kamar', type: 'noun' },
  { id: 'n_daigaku', jp: '大学', kana: 'だいがく', id_mean: 'universitas', type: 'noun' },
  { id: 'n_sensei', jp: '先生', kana: 'せんせい', id_mean: 'guru', type: 'noun' },
  { id: 'n_hito', jp: '人', kana: 'ひと', id_mean: 'orang', type: 'noun' },
  { id: 'n_ocha', jp: 'お茶', kana: 'おちゃ', id_mean: 'teh hijau', type: 'noun' },
  { id: 'n_koohii', jp: 'コーヒー', kana: 'コーヒー', id_mean: 'kopi', type: 'noun' },
  { id: 'n_nihongo', jp: '日本語', kana: 'にほんご', id_mean: 'bahasa Jepang', type: 'noun' },
  { id: 'n_eiga', jp: '映画', kana: 'えいが', id_mean: 'film', type: 'noun' },

  // Kata Keterangan & Kata Hubung
  { id: 'adv_totemo', jp: 'とても', kana: 'とても', id_mean: 'sangat', type: 'adv' },
  { id: 'adv_amari', jp: 'あまり', kana: 'あまり', id_mean: 'tidak begitu', type: 'adv' },
  { id: 'conj_soshite', jp: 'そして', kana: 'そして', id_mean: 'dan / kemudian', type: 'conj' },
  { id: 'conj_ga', jp: '～が、～', kana: '～が、～', id_mean: 'tetapi', type: 'conj' },
  { id: 'e_dou', jp: 'どう', kana: 'どう', id_mean: 'bagaimana', type: 'expr' },
  { id: 'e_donna', jp: 'どんな', kana: 'どんな', id_mean: 'yang bagaimana', type: 'expr' },
];

const VMAP = Object.fromEntries(VOCAB.map(v => [v.id, v]));

/* ========================= 3. TOKEN READING MAP ========================= */
const TOKEN_READING_MAP = {
  'は': 'わ', 'が': 'が', 'の': 'の', 'で': 'で', '、': '', '。': '',
  'です': 'です', 'ではありません': 'ではありません', 'ではないです': 'ではないです',
  'でした': 'でした', 'ですか': 'ですか', 'そして': 'そして',
  '日本の': 'にほんの', '日本の食べ物': 'にほんのたべもの', '今日の': 'きょうの',
  '昨日': 'きのう', '明日': 'あした', '今日': 'きょう', '会社': 'かいしゃ',
  'さくら大学': 'さくらだいがく', '富士大学': 'ふじだいがく',
};

VOCAB.forEach(v => {
  TOKEN_READING_MAP[v.jp] = v.kana;
});

function tokenReading(token) {
  if (TOKEN_READING_MAP[token] !== undefined) return TOKEN_READING_MAP[token];
  if (!/[\u4E00-\u9FFF]/.test(token)) return token;
  return token;
}

/* ========================= 4. SENTENCE BANK BUILDER BAB 8 ========================= */
// Mengcover 6 Pola Tata Bahasa Utama Bab 8
const sentences = [];

function addSentence(tokens, idText, vocabUsed, pattern) {
  const reading = tokens.map(t => (t === '、' || t === '。' ? '' : tokenReading(t))).join('');
  sentences.push({ tokens, id: idText, vocab: vocabUsed, pattern, reading });
}

// ----------------------------------------------------------------------------
// Pola 1: Kata Benda は Kata Sifat な (な) です (Positif & Negatif)
// ----------------------------------------------------------------------------
addSentence(['この町は', '静かです'], 'Kota ini tenang.', ['v_shizuka', 'n_machi'], 'p1_na_desu');
addSentence(['ワットさんは', '親切です'], 'Sdr. Watt baik hati.', ['v_shinsetsu', 'n_sensei'], 'p1_na_desu');
addSentence(['富士大学は', '有名です'], 'Universitas Fuji terkenal.', ['v_yuumei', 'n_daigaku'], 'p1_na_desu');
addSentence(['この部屋は', 'きれいです'], 'Kamar ini bersih.', ['v_kirei', 'n_heya'], 'p1_na_desu');
addSentence(['ミラーさんは', 'ハンサムです'], 'Sdr. Miller ganteng.', ['v_hansamu'], 'p1_na_desu');
addSentence(['大学の寮は', '便利です'], 'Asrama universitas praktis.', ['v_benri', 'n_ryou', 'n_daigaku'], 'p1_na_desu');
addSentence(['今日の', '仕事は', '暇です'], 'Pekerjaan hari ini senggang.', ['v_hima', 'n_shigoto'], 'p1_na_desu');
addSentence(['お父さんは', '元気です'], 'Ayah sehat.', ['v_genki'], 'p1_na_desu');
addSentence(['このレストランは', 'すてきです'], 'Restoran ini bagus.', ['v_suteki', 'n_resutoran'], 'p1_na_desu');
addSentence(['この町は', 'にぎやかです'], 'Kota ini ramai.', ['v_nigiyaka', 'n_machi'], 'p1_na_desu');

// Negatif: Noun は あまり Na-adj ではありません
addSentence(['この町は', 'あまり', 'にぎやかではありません'], 'Kota ini tidak begitu ramai.', ['v_nigiyaka', 'n_machi', 'adv_amari'], 'p1_na_neg');
addSentence(['この部屋は', 'あまり', '静かではありません'], 'Kamar ini tidak begitu tenang.', ['v_shizuka', 'n_heya', 'adv_amari'], 'p1_na_neg');
addSentence(['この車は', 'あまり', '便利ではありません'], 'Mobil ini tidak begitu praktis.', ['v_benri', 'n_kuruma', 'adv_amari'], 'p1_na_neg');

// ----------------------------------------------------------------------------
// Pola 2: Kata Benda は Kata Sifat い (～い) です (Positif & Negatif)
// ----------------------------------------------------------------------------
addSentence(['富士山は', '高いです'], 'Gunung Fuji tinggi.', ['v_takai', 'n_fujisan', 'n_yama'], 'p2_i_desu');
addSentence(['日本の', '食べ物は', 'おいしいです'], 'Makanan Jepang enak.', ['v_oishii', 'n_tabemono', 'n_nihon'], 'p2_i_desu');
addSentence(['この車は', '新しいです'], 'Mobil ini baru.', ['v_atarashii', 'n_kuruma'], 'p2_i_desu');
addSentence(['今日の', '仕事は', '忙しいです'], 'Pekerjaan hari ini sibuk.', ['v_isogashii', 'n_shigoto'], 'p2_i_desu');
addSentence(['日本語の', '勉強は', '楽しいです'], 'Belajar bahasa Jepang menyenangkan.', ['v_tanoshii', 'n_nihongo'], 'p2_i_desu');
addSentence(['このお茶は', '冷たいです'], 'Teh ini dingin.', ['v_tsumetai', 'n_ocha'], 'p2_i_desu');
addSentence(['今日の', '天気は', '暑いです'], 'Cuaca hari ini panas.', ['v_atsui'], 'p2_i_desu');
addSentence(['この本は', '難しいです'], 'Buku ini sulit.', ['v_muzukashii'], 'p2_i_desu');
addSentence(['この辞書は', '安いです'], 'Kamus ini murah.', ['v_yasui'], 'p2_i_desu');
addSentence(['あの山は', '低いです'], 'Gunung itu rendah.', ['v_hikui', 'n_yama'], 'p2_i_desu');
addSentence(['この映画は', 'おもしろいです'], 'Film ini menarik.', ['v_omoshiroi', 'n_eiga'], 'p2_i_desu');
addSentence(['私の', 'シャツは', '白いです'], 'Kemeja saya putih.', ['v_shiroi'], 'p2_i_desu');

// Negatif: Noun は あまり I-adj(く)ないです / くありません
addSentence(['この本は', 'あまり', '難しくないです'], 'Buku ini tidak begitu sulit.', ['v_muzukashii', 'adv_amari'], 'p2_i_neg');
addSentence(['日本の', '食べ物は', 'あまり', '高くないです'], 'Makanan Jepang tidak begitu mahal.', ['v_takai', 'n_tabemono', 'n_nihon', 'adv_amari'], 'p2_i_neg');
addSentence(['このお茶は', 'あまり', '冷たくないです'], 'Teh ini tidak begitu dingin.', ['v_tsumetai', 'n_ocha', 'adv_amari'], 'p2_i_neg');
addSentence(['大学の', '寮は', 'あまり', '大きくありません'], 'Asrama universitas tidak begitu besar.', ['v_ookii', 'n_ryou', 'n_daigaku', 'adv_amari'], 'p2_i_neg');

// ----------------------------------------------------------------------------
// Pola 3: Kata Sifat な (na) + Kata Benda
// ----------------------------------------------------------------------------
addSentence(['奈良は', 'きれいな', '町です'], 'Nara adalah kota yang indah.', ['v_kirei', 'n_machi'], 'p3_na_noun');
addSentence(['ここは', '静かな', '所です'], 'Sini adalah tempat yang tenang.', ['v_shizuka', 'n_tokoro'], 'p3_na_noun');
addSentence(['ワットさんは', '親切な', '先生です'], 'Sdr. Watt adalah guru yang baik hati.', ['v_shinsetsu', 'n_sensei'], 'p3_na_noun');
addSentence(['あれは', '有名な', 'レストランです'], 'Itu adalah restoran yang terkenal.', ['v_yuumei', 'n_resutoran'], 'p3_na_noun');
addSentence(['これは', '便利な', '車です'], 'Ini adalah mobil yang praktis.', ['v_benri', 'n_kuruma'], 'p3_na_noun');
addSentence(['それは', 'すてきな', 'プレゼントです'], 'Itu adalah hadiah yang bagus.', ['v_suteki'], 'p3_na_noun');
addSentence(['さくら大学は', '有名な', '大学です'], 'Universitas Sakura adalah universitas yang terkenal.', ['v_yuumei', 'n_daigaku'], 'p3_na_noun');

// ----------------------------------------------------------------------------
// Pola 4: Kata Sifat い (i) + Kata Benda
// ----------------------------------------------------------------------------
addSentence(['富士山は', '高い', '山です'], 'Gunung Fuji adalah gunung yang tinggi.', ['v_takai', 'n_fujisan', 'n_yama'], 'p4_i_noun');
addSentence(['これは', '新しい', '車です'], 'Ini adalah mobil yang baru.', ['v_atarashii', 'n_kuruma'], 'p4_i_noun');
addSentence(['日本の', '食べ物は', 'おいしい', '食べ物です'], 'Makanan Jepang adalah makanan yang enak.', ['v_oishii', 'n_tabemono', 'n_nihon'], 'p4_i_noun');
addSentence(['それは', '難しい', '本です'], 'Itu adalah buku yang sulit.', ['v_muzukashii'], 'p4_i_noun');
addSentence(['あそこは', 'おもしろい', '所です'], 'Sana adalah tempat yang menarik.', ['v_omoshiroi', 'n_tokoro'], 'p4_i_noun');
addSentence(['これは', '赤い', 'シャツです'], 'Ini adalah kemeja merah.', ['v_akai'], 'p4_i_noun');
addSentence(['桜は', '白い', '花です'], 'Sakura adalah bunga putih.', ['v_shiroi', 'n_sakura'], 'p4_i_noun');

// ----------------------------------------------------------------------------
// Pola 5: ～ が 、～ (Partikel が untuk menghubungkan dua kalimat bernilai kontras)
// ----------------------------------------------------------------------------
addSentence(['日本の', '食べ物は', 'おいしいですが、', '高いです'], 'Makanan Jepang enak, tetapi mahal.', ['v_oishii', 'v_takai', 'n_tabemono', 'n_nihon', 'conj_ga'], 'p5_ga');
addSentence(['この部屋は', '静かですが、', '小さいです'], 'Kamar ini tenang, tetapi kecil.', ['v_shizuka', 'v_chiisai', 'n_heya', 'conj_ga'], 'p5_ga');
addSentence(['日本語は', '難しいですが、', 'おもしろいです'], 'Bahasa Jepang sulit, tetapi menarik.', ['v_muzukashii', 'v_omoshiroi', 'n_nihongo', 'conj_ga'], 'p5_ga');
addSentence(['この車は', '古いですが、', '便利です'], 'Mobil ini tua, tetapi praktis.', ['v_furui', 'v_benri', 'n_kuruma', 'conj_ga'], 'p5_ga');
addSentence(['このレストランは', '有名ですが、', 'あまり', 'おいしくないです'], 'Restoran ini terkenal, tetapi tidak begitu enak.', ['v_yuumei', 'v_oishii', 'n_resutoran', 'conj_ga', 'adv_amari'], 'p5_ga');
addSentence(['この町は', 'にぎやかですが、', 'きれいです'], 'Kota ini ramai, tetapi bersih.', ['v_nigiyaka', 'v_kirei', 'n_machi', 'conj_ga'], 'p5_ga');
addSentence(['寮の', '部屋は', '狭いですが、', '新しいです'], 'Kamar asrama sempit, tetapi baru.', ['v_atarashii', 'n_heya', 'n_ryou', 'conj_ga'], 'p5_ga');
addSentence(['今日の', '仕事は', '忙しいですが、', '楽しいです'], 'Pekerjaan hari ini sibuk, tetapi menyenangkan.', ['v_isogashii', 'v_tanoshii', 'n_shigoto', 'conj_ga'], 'p5_ga');

// ----------------------------------------------------------------------------
// Pola 6: とても / あまり (Kata Keterangan Tingkat)
// ----------------------------------------------------------------------------
addSentence(['富士山は', 'とても', '高いです'], 'Gunung Fuji sangat tinggi.', ['v_takai', 'n_fujisan', 'adv_totemo'], 'p6_degree');
addSentence(['この町は', 'とても', '静かです'], 'Kota ini sangat tenang.', ['v_shizuka', 'n_machi', 'adv_totemo'], 'p6_degree');
addSentence(['日本の', '食べ物は', 'とても', 'おいしいです'], 'Makanan Jepang sangat enak.', ['v_oishii', 'n_tabemono', 'n_nihon', 'adv_totemo'], 'p6_degree');
addSentence(['ワットさんは', 'とても', '親切な', '人です'], 'Sdr. Watt adalah orang yang sangat baik hati.', ['v_shinsetsu', 'n_sensei', 'n_hito', 'adv_totemo'], 'p6_degree');
addSentence(['この車は', 'とても', '新しいです'], 'Mobil ini sangat baru.', ['v_atarashii', 'n_kuruma', 'adv_totemo'], 'p6_degree');
addSentence(['京都は', 'とても', '有名な', '町です'], 'Kyoto adalah kota yang sangat terkenal.', ['v_yuumei', 'n_machi', 'adv_totemo'], 'p6_degree');

/* ========================= 5. SHORT CONVERSATION TEMPLATES ========================= */
const SHORT_CONVERSATIONS = [
  {
    dialogue: [
      { speaker: 'A', text: '昨日 松本さんの うちへ 行きました。' },
      { speaker: 'B', text: 'どんな うちですか。' },
      { speaker: 'A', text: 'きれいな うちです。そして、大きい うちです。' }
    ],
    question: '松本さんの うちは どんな うちですか。',
    options: [
      'きれいな うちです。そして、大きい うちです。',
      '古くて 小さい うちです。',
      'あまり きれいにない うちです。',
      '静かですが、狭い うちです。'
    ],
    answer: 'きれいな うちです。そして、大きい うちです。',
    vocab: ['v_kirei', 'v_ookii', 'e_donna']
  },
  {
    dialogue: [
      { speaker: 'A', text: '日本の 食べ物は どうですか。' },
      { speaker: 'B', text: 'おいしいですが、＿＿＿です。' }
    ],
    question: 'Lengkapi balasan B yang sesuai:',
    options: ['高い', '静か', '親切', '白い'],
    answer: '高い',
    vocab: ['v_oishii', 'v_takai', 'conj_ga', 'n_tabemono']
  },
  {
    dialogue: [
      { speaker: 'A', text: '富士山は どんな 山ですか。' },
      { speaker: 'B', text: '＿＿＿ 山です。' }
    ],
    question: 'Pilih jawaban B yang tepat:',
    options: ['とても 高い', 'あまり 有名ではない', '静かな', '易しい'],
    answer: 'とても 高い',
    vocab: ['v_takai', 'n_fujisan', 'adv_totemo', 'e_donna']
  },
  {
    dialogue: [
      { speaker: 'A', text: '奈良は どんな 町ですか。' },
      { speaker: 'B', text: '＿＿＿ 町です。' }
    ],
    question: 'Pilih jawaban B yang sesuai:',
    options: ['静かで きれいな', '冷たくて 忙しい', '暑くて 易しい', 'あまり 有名ではない'],
    answer: '静かで きれいな',
    vocab: ['v_shizuka', 'v_kirei', 'n_machi']
  },
  {
    dialogue: [
      { speaker: 'A', text: '日本語の 勉強は どうですか。' },
      { speaker: 'B', text: '難しいですが、＿＿＿ おもしろいです。' }
    ],
    question: 'Lengkapi balasan B dengan kata keterangan tingkat yang tepat:',
    options: ['とても', 'あまり', 'そして', 'どんな'],
    answer: 'とても',
    vocab: ['v_muzukashii', 'v_omoshiroi', 'adv_totemo', 'conj_ga']
  },
  {
    dialogue: [
      { speaker: 'A', text: 'この 部屋は 静かですか。' },
      { speaker: 'B', text: 'いいえ、＿＿＿ 静かではありません。' }
    ],
    question: 'Lengkapi jawaban B:',
    options: ['あまり', 'とても', 'そして', 'どう'],
    answer: 'あまり',
    vocab: ['v_shizuka', 'adv_amari', 'n_heya']
  },
  {
    dialogue: [
      { speaker: 'A', text: 'ワット先生は どんな 人ですか。' },
      { speaker: 'B', text: 'とても ＿＿＿ 先生です。' }
    ],
    question: 'Pilih kata sifat yang tepat untuk B:',
    options: ['親切な', '親切', '高い', '古い'],
    answer: '親切な',
    vocab: ['v_shinsetsu', 'n_sensei', 'adv_totemo']
  },
  {
    dialogue: [
      { speaker: 'A', text: '会社生活は どうですか。' },
      { speaker: 'B', text: '忙しいですが、楽しいです。' }
    ],
    question: 'Bagaimana kehidupan kerja (会社生活) menurut B?',
    options: [
      '忙しいですが、楽しいです。',
      '暇で つまらないです。',
      'あまり 忙しくないです。',
      '大変で 悪い生活です。'
    ],
    answer: '忙しいですが、楽しいです。',
    vocab: ['v_isogashii', 'v_tanoshii', 'n_seikatsu']
  }
];

/* ========================= 6. QUESTION GENERATION LOGIC ========================= */
let qIdCounter = 1;
function nextId() { return `q_${qIdCounter++}`; }

function joinTokens(tokens) { return tokens.filter(t => t !== '、' && t !== '。').join(''); }

// 1) ARRANGE (Susun Kalimat)
function genArrange(sentence, rnd) {
  const tokens = sentence.tokens.filter(t => t !== '、' && t !== '。');
  if (tokens.length < 2) return null;
  const tiles = shuffle(tokens, rnd);
  return {
    id: nextId(),
    type: 'arrange',
    instruction: 'Susun kata-kata berikut menjadi kalimat Bahasa Jepang yang benar.',
    tiles,
    answer: tokens,
    vocab: sentence.vocab,
    reading: sentence.reading,
  };
}

// 2) TRANSLATE (Terjemahkan & Susun Kalimat)
function genTranslate(sentence, rnd) {
  const tokens = sentence.tokens.filter(t => t !== '、' && t !== '。');
  if (tokens.length < 2) return null;
  const tiles = shuffle(tokens, rnd);
  return {
    id: nextId(),
    type: 'translate',
    instruction: 'Terjemahkan kalimat berikut ke dalam Bahasa Jepang.',
    prompt: sentence.id,
    tiles,
    answer: tokens,
    vocab: sentence.vocab,
    reading: sentence.reading,
  };
}

// 3) COMPLETE (Melengkapi Kalimat / Fill in the blank)
function genComplete(sentence, rnd) {
  const tokens = sentence.tokens.filter(t => t !== '、' && t !== '。');
  if (tokens.length < 2) return null;

  // Pilih token target yang bernilai kata sifat/kata keterangan/partikel
  let targetIdx = tokens.findIndex(t => t.includes('です') || t.endsWith('な') || t.endsWith('い') || t === 'とても' || t === 'あまり' || t.includes('ですが'));
  if (targetIdx === -1) targetIdx = Math.floor(rnd() * tokens.length);

  const targetToken = tokens[targetIdx];
  const promptTokens = tokens.slice();
  promptTokens[targetIdx] = '＿＿＿';

  // Buat pilihan jawaban (1 benar + 3 pengecoh)
  const distractors = new Set();
  const sameTypeVocab = VOCAB.filter(v => v.jp !== targetToken);

  while (distractors.size < 3) {
    const pickV = pick(sameTypeVocab, rnd);
    let opt = pickV.jp;
    if (targetToken.endsWith('な') && !opt.endsWith('な')) opt += 'な';
    if (opt !== targetToken) distractors.add(opt);
  }

  const options = shuffle([targetToken, ...Array.from(distractors)], rnd);

  return {
    id: nextId(),
    type: 'complete',
    instruction: 'Lengkapi kalimat berikut dengan kata yang tepat.',
    prompt: promptTokens.join(' '),
    translation: sentence.id,
    options,
    answer: targetToken,
    vocab: sentence.vocab,
  };
}

// 4) MATCH (Cocokkan Kosakata)
function genMatch(vocabSet, rnd) {
  const pairs = vocabSet.map(v => ({
    jp: v.jp,
    id: v.id_mean,
    vocabId: v.id,
  }));
  return {
    id: nextId(),
    type: 'match',
    instruction: 'Jodohkan kosakata Bahasa Jepang dengan artinya yang benar.',
    pairs,
    vocab: vocabSet.map(v => v.id),
  };
}

// 5) SHORT CONVERSATION (Percakapan Pendek)
function genShortConversation(rnd) {
  const conv = pick(SHORT_CONVERSATIONS, rnd);
  return {
    id: nextId(),
    type: 'short_conversation',
    instruction: 'Bacalah percakapan pendek berikut lalu jawab pertanyaannya.',
    dialogue: conv.dialogue,
    question: conv.question,
    options: shuffle(conv.options, rnd),
    answer: conv.answer,
    vocab: conv.vocab,
  };
}

// 6) CHOOSE TRANSLATION (Pilih Terjemahan Kalimat)
function genChooseTranslation(sentence, allSentences, rnd) {
  const correctStr = joinTokens(sentence.tokens);
  const candidates = allSentences.filter(s => s !== sentence && s.tokens.length >= 2 && joinTokens(s.tokens) !== correctStr);
  if (candidates.length < 2) return null;
  const distractorSentences = pickN(candidates, 2, rnd);
  const optionSentences = shuffle([sentence, ...distractorSentences], rnd);
  const options = optionSentences.map(s => joinTokens(s.tokens));

  return {
    id: nextId(),
    type: 'choose_translation',
    instruction: 'Pilih terjemahan Bahasa Jepang yang benar.',
    prompt: sentence.id,
    options,
    answer: correctStr,
    vocab: sentence.vocab,
  };
}

// 7) LISTENING (Dengarkan & Susun Kalimat)
function genListening(sentence, rnd) {
  const tokens = sentence.tokens.filter(t => t !== '、' && t !== '。');
  if (tokens.length < 2) return null;
  const audioText = tokens.join('');
  let pool = tokens.slice();

  // Tambahkan 1-2 kata pengecoh
  let attempts = 0;
  while (pool.length < tokens.length + 2 && attempts < 30) {
    attempts++;
    const other = pick(sentences, rnd);
    const cand = pick(other.tokens.filter(t => t !== '、' && t !== '。'), rnd);
    if (cand && !pool.includes(cand)) {
      pool.push(cand);
    }
  }

  return {
    id: nextId(),
    type: 'listening',
    instruction: 'Dengarkan audio, lalu susun kalimat yang kamu dengar.',
    audioText,
    reading: sentence.reading,
    tiles: shuffle(pool, rnd),
    answer: tokens,
    translation: sentence.id,
    vocab: sentence.vocab,
  };
}

/* ========================= 7. BUILD 50 LEVELS (20 SOAL PER LEVEL = 1000 SOAL) ========================= */
const TOTAL_LEVELS = 50;
const QUESTIONS_PER_LEVEL = 20;

const LEVELS = [];

let sentenceCursor = 0;
let vocabCursor = 0;

function nextSentence() {
  const s = sentences[sentenceCursor % sentences.length];
  sentenceCursor++;
  return s;
}

for (let level = 1; level <= TOTAL_LEVELS; level++) {
  const rnd = mulberry32(level * 8831 + 42);
  const questions = [];
  let guard = 0;

  // Rotasi 6 tipe soal aktif (arrange, translate, complete, match, short_conversation, choose_translation, listening)
  const typeTypes = ['arrange', 'translate', 'complete', 'match', 'short_conversation', 'choose_translation', 'listening'];

  while (questions.length < QUESTIONS_PER_LEVEL && guard < 500) {
    guard++;
    const type = typeTypes[questions.length % typeTypes.length];
    let q = null;

    if (type === 'arrange') {
      q = genArrange(nextSentence(), rnd);
    } else if (type === 'translate') {
      q = genTranslate(nextSentence(), rnd);
    } else if (type === 'complete') {
      q = genComplete(nextSentence(), rnd);
    } else if (type === 'match') {
      const set = pickN(VOCAB, 6, rnd);
      q = genMatch(set, rnd);
    } else if (type === 'short_conversation') {
      q = genShortConversation(rnd);
    } else if (type === 'choose_translation') {
      q = genChooseTranslation(nextSentence(), sentences, rnd);
    } else if (type === 'listening') {
      q = genListening(nextSentence(), rnd);
    }

    if (q) questions.push(q);
  }

  LEVELS.push({
    level,
    title: `Level ${level}`,
    tier: level <= 10 ? 'mudah' : level <= 20 ? 'sedang' : level <= 30 ? 'kalimat' : level <= 40 ? 'campuran' : 'acak',
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
  console.warn('PERINGATAN: Kosakata belum terpakai:', missing.map(m => m.jp));
} else {
  console.log('OK: Semua', VOCAB.length, 'kosakata Bab 8 sudah terpakai di soal.');
}

/* ========================= 9. SAVE OUTPUT ========================= */
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

console.log('Selesai membuat generator Bab 8!');
console.log('Total level:', LEVELS.length, '| Total soal:', LEVELS.reduce((a, l) => a + l.questions.length, 0));
