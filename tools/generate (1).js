/* ============================================================================
 * tools/generate.js  —  GENERATOR SOAL BAB 8 (VERSI 2: ANTI-MONOTON)
 * ----------------------------------------------------------------------------
 * Minna no Nihongo I — Bab 8 (Kata Sifat な / い)
 *
 * Perbaikan besar dibanding versi 1:
 *   1. DATABASE KOSAKATA BERKATEGORI  -> setiap kata punya `cats` (kategori
 *      semantik: color/size/price/atmos/...) & setiap kata benda punya `fits`
 *      (kategori sifat apa yang masuk akal untuk kata benda tsb).
 *      Kalimat TIDAK lagi ditulis manual satu per satu, tapi DIRAKIT
 *      (combinatorial) sehingga menghasilkan ribuan kalimat unik & natural.
 *   2. SILABUS / PROGRESI KESULITAN   -> getSyllabus(level) membatasi pola,
 *      bentuk (present/past/negatif), panjang kalimat, & jumlah pengecoh
 *      per tier level 1-10 / 11-20 / 21-30 / 31-40 / 41-50.
 *   3. URUTAN TIPE SOAL ACAK          -> buildTypeSequence() memakai bobot
 *      per-tier + anti dua tipe sama berturut-turut (tidak lagi kaku
 *      arrange -> translate -> complete -> ...).
 *   4. DISTRAKTOR CERDAS              -> makeDistractors() mengambil pengecoh
 *      dari KATEGORI SEMANTIK YANG SAMA dan dikonjugasi ke BENTUK YANG SAMA,
 *      plus "jebakan gramatikal" (親切 vs 親切な) di level tinggi.
 *
 * Semua kosakata diambil dari kotoba.pdf. Output:
 *   js/data/vocab.js   -> window.VOCAB_DATA
 *   js/data/levels.js  -> window.LEVELS_DATA
 *
 * Jalankan:  node tools/generate.js
 * ==========================================================================*/

const fs = require('fs');
const path = require('path');

/* ==========================================================================
 * BAGIAN 1 — UTILITAS ACAK (SEEDED RNG)
 * Seed dibuat per level supaya hasil generate selalu sama tiap dijalankan
 * (reproducible), tapi tetap "terasa acak" bagi pengguna.
 * ========================================================================*/
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
function uniq(arr) { return Array.from(new Set(arr)); }

/** Pilih 1 item berdasarkan bobot: [{ v: 'arrange', w: 3 }, ...] */
function weightedPick(pairs, rnd) {
  const total = pairs.reduce((a, p) => a + p.w, 0);
  let r = rnd() * total;
  for (const p of pairs) { r -= p.w; if (r <= 0) return p.v; }
  return pairs[pairs.length - 1].v;
}

/* ==========================================================================
 * BAGIAN 2 — DATABASE KATA SIFAT (BERKATEGORI SEMANTIK)
 * ----------------------------------------------------------------------------
 * cats  : kategori semantik -> dipakai (a) mencocokkan dengan kata benda,
 *                              (b) MENGAMBIL PENGECOH SEKELAS.
 * mean  : arti default (Indonesia)
 * meanBy: arti per kategori (mis. 高い = "mahal" utk price, "tinggi" utk height)
 * pol   : polaritas (+1 positif, -1 negatif, 0 netral) -> dipakai pola ～が、～
 * ant   : lawan kata -> dipakai soal kontras & pengecoh "menjebak"
 * ========================================================================*/
const ADJ = [
  /* --- Kata sifat な --------------------------------------------------- */
  { id: 'v_hansamu',   jp: 'ハンサム', kana: 'ハンサム', type: 'adj_na', cats: ['looks_person'],               mean: 'ganteng',          pol:  1 },
  { id: 'v_kirei',     jp: 'きれい',   kana: 'きれい',   type: 'adj_na', cats: ['appearance', 'clean', 'looks_person'], mean: 'indah / bersih', pol: 1, meanBy: { clean: 'bersih', appearance: 'indah', looks_person: 'cantik' } },
  { id: 'v_shizuka',   jp: '静か',     kana: 'しずか',   type: 'adj_na', cats: ['atmos'],                      mean: 'tenang',           pol:  1, ant: 'v_nigiyaka' },
  { id: 'v_nigiyaka',  jp: 'にぎやか', kana: 'にぎやか', type: 'adj_na', cats: ['atmos'],                      mean: 'ramai',            pol:  1, ant: 'v_shizuka' },
  { id: 'v_yuumei',    jp: '有名',     kana: 'ゆうめい', type: 'adj_na', cats: ['fame'],                       mean: 'terkenal',         pol:  1 },
  { id: 'v_shinsetsu', jp: '親切',     kana: 'しんせつ', type: 'adj_na', cats: ['trait'],                      mean: 'baik hati',        pol:  1 },
  { id: 'v_genki',     jp: '元気',     kana: 'げんき',   type: 'adj_na', cats: ['trait', 'condition'],         mean: 'sehat',            pol:  1 },
  { id: 'v_hima',      jp: '暇',       kana: 'ひま',     type: 'adj_na', cats: ['busy'],                       mean: 'senggang',         pol:  1, ant: 'v_isogashii' },
  { id: 'v_benri',     jp: '便利',     kana: 'べんり',   type: 'adj_na', cats: ['utility'],                    mean: 'praktis',          pol:  1 },
  { id: 'v_suteki',    jp: 'すてき',   kana: 'すてき',   type: 'adj_na', cats: ['appearance', 'looks_person'], mean: 'bagus / indah',    pol:  1 },

  /* --- Kata sifat い --------------------------------------------------- */
  { id: 'v_ookii',      jp: '大きい',   kana: 'おおきい',   type: 'adj_i', cats: ['size'],                mean: 'besar',        pol:  0, ant: 'v_chiisai' },
  { id: 'v_chiisai',    jp: '小さい',   kana: 'ちいさい',   type: 'adj_i', cats: ['size'],                mean: 'kecil',        pol:  0, ant: 'v_ookii' },
  { id: 'v_atarashii',  jp: '新しい',   kana: 'あたらしい', type: 'adj_i', cats: ['age'],                 mean: 'baru',         pol:  1, ant: 'v_furui' },
  { id: 'v_furui',      jp: '古い',     kana: 'ふるい',     type: 'adj_i', cats: ['age'],                 mean: 'tua / lama',   pol: -1, ant: 'v_atarashii' },
  { id: 'v_ii',         jp: 'いい',     kana: 'いい',       type: 'adj_i', cats: ['quality'],             mean: 'baik',         pol:  1, ant: 'v_warui', irregular: 'yoi' },
  { id: 'v_warui',      jp: '悪い',     kana: 'わるい',     type: 'adj_i', cats: ['quality'],             mean: 'buruk',        pol: -1, ant: 'v_ii' },
  { id: 'v_atsui',      jp: '暑い',     kana: 'あつい',     type: 'adj_i', cats: ['temp_air'],            mean: 'panas',        pol:  0, ant: 'v_samui' },
  { id: 'v_samui',      jp: '寒い',     kana: 'さむい',     type: 'adj_i', cats: ['temp_air'],            mean: 'dingin',       pol:  0, ant: 'v_atsui' },
  { id: 'v_tsumetai',   jp: '冷たい',   kana: 'つめたい',   type: 'adj_i', cats: ['temp_touch'],          mean: 'dingin',       pol:  0 },
  { id: 'v_muzukashii', jp: '難しい',   kana: 'むずかしい', type: 'adj_i', cats: ['difficulty'],          mean: 'sulit',        pol: -1, ant: 'v_yasashii' },
  { id: 'v_yasashii',   jp: '易しい',   kana: 'やさしい',   type: 'adj_i', cats: ['difficulty'],          mean: 'mudah',        pol:  1, ant: 'v_muzukashii' },
  { id: 'v_takai',      jp: '高い',     kana: 'たかい',     type: 'adj_i', cats: ['price', 'height'],     mean: 'mahal',        pol: -1, ant: 'v_yasui', meanBy: { price: 'mahal', height: 'tinggi' } },
  { id: 'v_yasui',      jp: '安い',     kana: 'やすい',     type: 'adj_i', cats: ['price'],               mean: 'murah',        pol:  1, ant: 'v_takai' },
  { id: 'v_hikui',      jp: '低い',     kana: 'ひくい',     type: 'adj_i', cats: ['height'],              mean: 'rendah',       pol:  0, ant: 'v_takai' },
  { id: 'v_omoshiroi',  jp: 'おもしろい', kana: 'おもしろい', type: 'adj_i', cats: ['interest'],          mean: 'menarik',      pol:  1 },
  { id: 'v_oishii',     jp: 'おいしい', kana: 'おいしい',   type: 'adj_i', cats: ['taste'],               mean: 'enak',         pol:  1 },
  { id: 'v_isogashii',  jp: '忙しい',   kana: 'いそがしい', type: 'adj_i', cats: ['busy'],                mean: 'sibuk',        pol: -1, ant: 'v_hima' },
  { id: 'v_tanoshii',   jp: '楽しい',   kana: 'たのしい',   type: 'adj_i', cats: ['interest'],            mean: 'menyenangkan', pol:  1 },
  { id: 'v_shiroi',     jp: '白い',     kana: 'しろい',     type: 'adj_i', cats: ['color'],               mean: 'putih',        pol:  0 },
  { id: 'v_kuroi',      jp: '黒い',     kana: 'くろい',     type: 'adj_i', cats: ['color'],               mean: 'hitam',        pol:  0 },
  { id: 'v_akai',       jp: '赤い',     kana: 'あかい',     type: 'adj_i', cats: ['color'],               mean: 'merah',        pol:  0 },
  { id: 'v_aoi',        jp: '青い',     kana: 'あおい',     type: 'adj_i', cats: ['color'],               mean: 'biru',         pol:  0 },
];
const AMAP = Object.fromEntries(ADJ.map(a => [a.id, a]));

/* ==========================================================================
 * BAGIAN 3 — DATABASE KATA BENDA (DIKELOMPOKKAN PER TOPIK)
 * ----------------------------------------------------------------------------
 * topic : topik tampilan (tempat, makanan, benda, orang, waktu, ...)
 *         -> dipakai untuk soal MATCH bertema & variasi tema tiap level.
 * fits  : kategori kata sifat yang MASUK AKAL untuk kata benda ini.
 *         -> inilah kunci agar kalimat tidak ngawur ("teh ini terkenal").
 * det   : 'kore' (これ/それ/あれ + この…) | 'koko' (ここ/あそこ) | 'person' | 'plain'
 * ========================================================================*/
const NOUN = [
  /* --- Tempat & bangunan ---------------------------------------------- */
  { id: 'n_machi',     jp: '町',     kana: 'まち',     mean: 'kota',            topic: 'tempat', det: 'koko', fits: ['atmos', 'size', 'clean', 'fame', 'age', 'appearance'] },
  { id: 'n_tokoro',    jp: '所',     kana: 'ところ',   mean: 'tempat',          topic: 'tempat', det: 'koko', fits: ['atmos', 'clean', 'fame', 'interest', 'utility'] },
  { id: 'n_ryou',      jp: '寮',     kana: 'りょう',   mean: 'asrama',          topic: 'tempat', det: 'koko', fits: ['atmos', 'size', 'clean', 'age', 'utility'] },
  { id: 'n_heya',      jp: '部屋',   kana: 'へや',     mean: 'kamar',           topic: 'tempat', det: 'koko', fits: ['atmos', 'size', 'clean', 'age', 'temp_air'] },
  { id: 'n_uchi',      jp: 'うち',   kana: 'うち',     mean: 'rumah',           topic: 'tempat', det: 'koko', fits: ['size', 'clean', 'age', 'atmos', 'appearance'] },
  { id: 'n_resutoran', jp: 'レストラン', kana: 'レストラン', mean: 'restoran',   topic: 'tempat', det: 'koko', fits: ['atmos', 'fame', 'clean', 'age', 'price'] },
  { id: 'n_mise',      jp: '店',     kana: 'みせ',     mean: 'toko',            topic: 'tempat', det: 'koko', fits: ['atmos', 'fame', 'size', 'age', 'price'] },
  { id: 'n_gakkou',    jp: '学校',   kana: 'がっこう', mean: 'sekolah',         topic: 'tempat', det: 'koko', fits: ['atmos', 'size', 'fame', 'age', 'clean'] },
  { id: 'n_daigaku',   jp: '大学',   kana: 'だいがく', mean: 'universitas',     topic: 'tempat', det: 'koko', fits: ['fame', 'size', 'age', 'atmos', 'clean'] },
  { id: 'n_kaisha',    jp: '会社',   kana: 'かいしゃ', mean: 'perusahaan',      topic: 'tempat', det: 'koko', fits: ['fame', 'size', 'atmos', 'age'] },
  { id: 'n_toshokan',  jp: '図書館', kana: 'としょかん', mean: 'perpustakaan',  topic: 'tempat', det: 'koko', fits: ['atmos', 'size', 'clean', 'age', 'utility'] },
  { id: 'n_byouin',    jp: '病院',   kana: 'びょういん', mean: 'rumah sakit',   topic: 'tempat', det: 'koko', fits: ['size', 'clean', 'age', 'atmos', 'fame'] },
  { id: 'n_depaato',   jp: 'デパート', kana: 'デパート', mean: 'toserba',       topic: 'tempat', det: 'koko', fits: ['size', 'atmos', 'fame', 'age', 'price'] },
  { id: 'n_suupaa',    jp: 'スーパー', kana: 'スーパー', mean: 'supermarket',   topic: 'tempat', det: 'koko', fits: ['size', 'atmos', 'price', 'utility', 'clean'] },
  { id: 'n_eki',       jp: '駅',     kana: 'えき',     mean: 'stasiun',         topic: 'tempat', det: 'koko', fits: ['size', 'atmos', 'age', 'clean', 'utility'] },
  { id: 'n_kyoushitsu',jp: '教室',   kana: 'きょうしつ', mean: 'ruang kelas',   topic: 'tempat', det: 'koko', fits: ['size', 'clean', 'atmos', 'age', 'temp_air'] },
  { id: 'n_shokudou',  jp: '食堂',   kana: 'しょくどう', mean: 'kantin',        topic: 'tempat', det: 'koko', fits: ['atmos', 'clean', 'size', 'price', 'age'] },
  { id: 'n_yuuenchi',  jp: '遊園地', kana: 'ゆうえんち', mean: 'taman hiburan', topic: 'tempat', det: 'koko', fits: ['atmos', 'interest', 'size', 'fame'] },
  { id: 'n_niwa',      jp: '庭',     kana: 'にわ',     mean: 'halaman',         topic: 'tempat', det: 'koko', fits: ['size', 'clean', 'appearance', 'atmos'] },

  /* --- Alam ------------------------------------------------------------ */
  { id: 'n_yama',    jp: '山',     kana: 'やま',     mean: 'gunung',      topic: 'alam', det: 'kore', fits: ['height', 'size', 'fame', 'appearance'] },
  { id: 'n_fujisan', jp: '富士山', kana: 'ふじさん', mean: 'Gunung Fuji', topic: 'alam', det: 'plain', fits: ['height', 'fame', 'appearance', 'size'] },
  { id: 'n_sakura',  jp: '桜',     kana: 'さくら',   mean: 'sakura',      topic: 'alam', det: 'plain', fits: ['appearance', 'fame', 'color'] },
  { id: 'n_hana',    jp: '花',     kana: 'はな',     mean: 'bunga',       topic: 'alam', det: 'kore', fits: ['appearance', 'color', 'price', 'size'] },

  /* --- Makanan & minuman ------------------------------------------------ */
  { id: 'n_tabemono', jp: '食べ物', kana: 'たべもの', mean: 'makanan',   topic: 'makanan', det: 'kore', fits: ['taste', 'price'] },
  { id: 'n_gohan',    jp: 'ご飯',   kana: 'ごはん',   mean: 'nasi',      topic: 'makanan', det: 'kore', fits: ['taste', 'temp_touch', 'price'] },
  { id: 'n_pan',      jp: 'パン',   kana: 'パン',     mean: 'roti',      topic: 'makanan', det: 'kore', fits: ['taste', 'price', 'size'] },
  { id: 'n_niku',     jp: '肉',     kana: 'にく',     mean: 'daging',    topic: 'makanan', det: 'kore', fits: ['taste', 'price'] },
  { id: 'n_sakana',   jp: '魚',     kana: 'さかな',   mean: 'ikan',      topic: 'makanan', det: 'kore', fits: ['taste', 'price', 'size'] },
  { id: 'n_yasai',    jp: '野菜',   kana: 'やさい',   mean: 'sayur',     topic: 'makanan', det: 'kore', fits: ['taste', 'price'] },
  { id: 'n_kudamono', jp: '果物',   kana: 'くだもの', mean: 'buah',      topic: 'makanan', det: 'kore', fits: ['taste', 'price'] },
  { id: 'n_ocha',     jp: 'お茶',   kana: 'おちゃ',   mean: 'teh hijau', topic: 'minuman', det: 'kore', fits: ['taste', 'temp_touch', 'price'] },
  { id: 'n_koohii',   jp: 'コーヒー', kana: 'コーヒー', mean: 'kopi',    topic: 'minuman', det: 'kore', fits: ['taste', 'temp_touch', 'price'] },
  { id: 'n_mizu',     jp: '水',     kana: 'みず',     mean: 'air',       topic: 'minuman', det: 'kore', fits: ['temp_touch', 'taste', 'clean'] },
  { id: 'n_juusu',    jp: 'ジュース', kana: 'ジュース', mean: 'jus',     topic: 'minuman', det: 'kore', fits: ['taste', 'temp_touch', 'price'] },
  { id: 'n_gyuunyuu', jp: '牛乳',   kana: 'ぎゅうにゅう', mean: 'susu',  topic: 'minuman', det: 'kore', fits: ['taste', 'temp_touch', 'price'] },

  /* --- Benda / barang --------------------------------------------------- */
  { id: 'n_kuruma',    jp: '車',     kana: 'くるま',   mean: 'mobil',      topic: 'benda', det: 'kore', fits: ['size', 'age', 'price', 'utility', 'color', 'appearance'] },
  { id: 'n_jitensha',  jp: '自転車', kana: 'じてんしゃ', mean: 'sepeda',   topic: 'benda', det: 'kore', fits: ['size', 'age', 'price', 'utility', 'color'] },
  { id: 'n_hon',       jp: '本',     kana: 'ほん',     mean: 'buku',       topic: 'benda', det: 'kore', fits: ['difficulty', 'price', 'age', 'size', 'interest', 'quality'] },
  { id: 'n_jisho',     jp: '辞書',   kana: 'じしょ',   mean: 'kamus',      topic: 'benda', det: 'kore', fits: ['difficulty', 'price', 'age', 'size', 'utility', 'quality'] },
  { id: 'n_zasshi',    jp: '雑誌',   kana: 'ざっし',   mean: 'majalah',    topic: 'benda', det: 'kore', fits: ['interest', 'price', 'age', 'difficulty'] },
  { id: 'n_shinbun',   jp: '新聞',   kana: 'しんぶん', mean: 'koran',      topic: 'benda', det: 'kore', fits: ['interest', 'price', 'difficulty', 'age'] },
  { id: 'n_kaban',     jp: 'かばん', kana: 'かばん',   mean: 'tas',        topic: 'benda', det: 'kore', fits: ['size', 'age', 'price', 'color', 'appearance', 'utility'] },
  { id: 'n_kutsu',     jp: '靴',     kana: 'くつ',     mean: 'sepatu',     topic: 'benda', det: 'kore', fits: ['size', 'age', 'price', 'color', 'appearance'] },
  { id: 'n_kasa',      jp: '傘',     kana: 'かさ',     mean: 'payung',     topic: 'benda', det: 'kore', fits: ['size', 'age', 'price', 'color', 'utility'] },
  { id: 'n_tokei',     jp: '時計',   kana: 'とけい',   mean: 'jam',        topic: 'benda', det: 'kore', fits: ['size', 'age', 'price', 'color', 'appearance'] },
  { id: 'n_megane',    jp: '眼鏡',   kana: 'めがね',   mean: 'kacamata',   topic: 'benda', det: 'kore', fits: ['size', 'age', 'price', 'color', 'appearance'] },
  { id: 'n_nekutai',   jp: 'ネクタイ', kana: 'ネクタイ', mean: 'dasi',     topic: 'benda', det: 'kore', fits: ['color', 'price', 'appearance', 'age'] },
  { id: 'n_shatsu',    jp: 'シャツ', kana: 'シャツ',   mean: 'kemeja',     topic: 'benda', det: 'kore', fits: ['color', 'price', 'appearance', 'size', 'age'] },
  { id: 'n_purezento', jp: 'プレゼント', kana: 'プレゼント', mean: 'hadiah', topic: 'benda', det: 'kore', fits: ['appearance', 'price', 'size'] },
  { id: 'n_pasokon',   jp: 'パソコン', kana: 'パソコン', mean: 'laptop',   topic: 'benda', det: 'kore', fits: ['size', 'age', 'price', 'utility', 'color'] },
  { id: 'n_keetai',    jp: 'ケータイ', kana: 'ケータイ', mean: 'ponsel',   topic: 'benda', det: 'kore', fits: ['size', 'age', 'price', 'utility', 'color'] },
  { id: 'n_kamera',    jp: 'カメラ', kana: 'カメラ',   mean: 'kamera',     topic: 'benda', det: 'kore', fits: ['size', 'age', 'price', 'utility'] },
  { id: 'n_terebi',    jp: 'テレビ', kana: 'テレビ',   mean: 'televisi',   topic: 'benda', det: 'kore', fits: ['size', 'age', 'price', 'interest'] },
  { id: 'n_shashin',   jp: '写真',   kana: 'しゃしん', mean: 'foto',       topic: 'benda', det: 'kore', fits: ['appearance', 'size', 'interest', 'age'] },
  { id: 'n_tegami',    jp: '手紙',   kana: 'てがみ',   mean: 'surat',      topic: 'benda', det: 'kore', fits: ['size', 'interest', 'age'] },
  { id: 'n_nimotsu',   jp: '荷物',   kana: 'にもつ',   mean: 'barang bawaan', topic: 'benda', det: 'kore', fits: ['size', 'age', 'appearance'] },

  /* --- Transportasi ------------------------------------------------------ */
  { id: 'n_densha',     jp: '電車',   kana: 'でんしゃ',   mean: 'kereta',        topic: 'transportasi', det: 'kore', fits: ['utility', 'price', 'size', 'atmos', 'age'] },
  { id: 'n_chikatetsu', jp: '地下鉄', kana: 'ちかてつ',   mean: 'kereta bawah tanah', topic: 'transportasi', det: 'kore', fits: ['utility', 'price', 'atmos', 'age'] },
  { id: 'n_basu',       jp: 'バス',   kana: 'バス',       mean: 'bus',           topic: 'transportasi', det: 'kore', fits: ['utility', 'price', 'size', 'atmos', 'age'] },
  { id: 'n_takushii',   jp: 'タクシー', kana: 'タクシー', mean: 'taksi',         topic: 'transportasi', det: 'kore', fits: ['utility', 'price', 'atmos'] },
  { id: 'n_shinkansen', jp: '新幹線', kana: 'しんかんせん', mean: 'shinkansen',  topic: 'transportasi', det: 'plain', fits: ['utility', 'price', 'fame', 'size'] },
  { id: 'n_hikouki',    jp: '飛行機', kana: 'ひこうき',   mean: 'pesawat',       topic: 'transportasi', det: 'kore', fits: ['utility', 'price', 'size', 'age'] },

  /* --- Orang -------------------------------------------------------------- */
  { id: 'n_hito',      jp: '人',     kana: 'ひと',     mean: 'orang',            topic: 'orang', det: 'person', fits: ['trait', 'looks_person', 'busy', 'fame'] },
  { id: 'n_sensei',    jp: '先生',   kana: 'せんせい', mean: 'guru',             topic: 'orang', det: 'person', fits: ['trait', 'looks_person', 'busy', 'fame'] },
  { id: 'n_gakusei',   jp: '学生',   kana: 'がくせい', mean: 'mahasiswa',        topic: 'orang', det: 'person', fits: ['trait', 'looks_person', 'busy'] },
  { id: 'n_isha',      jp: '医者',   kana: 'いしゃ',   mean: 'dokter',           topic: 'orang', det: 'person', fits: ['trait', 'busy', 'fame'] },
  { id: 'n_tomodachi', jp: '友達',   kana: 'ともだち', mean: 'teman',            topic: 'orang', det: 'plain',  fits: ['trait', 'looks_person', 'busy', 'condition'] },
  { id: 'n_kazoku',    jp: '家族',   kana: 'かぞく',   mean: 'keluarga',         topic: 'orang', det: 'plain',  fits: ['trait', 'condition', 'busy'] },
  { id: 'n_otousan',   jp: 'お父さん', kana: 'おとうさん', mean: 'ayah',         topic: 'orang', det: 'plain',  fits: ['trait', 'condition', 'busy', 'looks_person'] },
  { id: 'n_okaasan',   jp: 'お母さん', kana: 'おかあさん', mean: 'ibu',          topic: 'orang', det: 'plain',  fits: ['trait', 'condition', 'busy', 'looks_person'] },
  { id: 'n_tenin',     jp: '店員',   kana: 'てんいん', mean: 'pelayan toko',     topic: 'orang', det: 'person', fits: ['trait', 'busy', 'looks_person'] },

  /* --- Aktivitas & kehidupan ---------------------------------------------- */
  { id: 'n_shigoto',   jp: '仕事',   kana: 'しごと',   mean: 'pekerjaan',        topic: 'aktivitas', det: 'plain', fits: ['busy', 'difficulty', 'interest', 'quality'] },
  { id: 'n_seikatsu',  jp: '生活',   kana: 'せいかつ', mean: 'kehidupan',        topic: 'aktivitas', det: 'plain', fits: ['busy', 'interest', 'quality', 'utility'] },
  { id: 'n_benkyou',   jp: '勉強',   kana: 'べんきょう', mean: 'belajar',        topic: 'aktivitas', det: 'plain', fits: ['difficulty', 'interest', 'busy'] },
  { id: 'n_shukudai',  jp: '宿題',   kana: 'しゅくだい', mean: 'PR',             topic: 'aktivitas', det: 'plain', fits: ['difficulty', 'busy', 'quality'] },
  { id: 'n_shiken',    jp: '試験',   kana: 'しけん',   mean: 'ujian',            topic: 'aktivitas', det: 'plain', fits: ['difficulty', 'quality'] },
  { id: 'n_kaigi',     jp: '会議',   kana: 'かいぎ',   mean: 'rapat',            topic: 'aktivitas', det: 'plain', fits: ['difficulty', 'busy', 'interest', 'atmos'] },
  { id: 'n_eiga',      jp: '映画',   kana: 'えいが',   mean: 'film',             topic: 'aktivitas', det: 'kore', fits: ['interest', 'fame', 'quality', 'age'] },
  { id: 'n_supootsu',  jp: 'スポーツ', kana: 'スポーツ', mean: 'olahraga',       topic: 'aktivitas', det: 'plain', fits: ['interest', 'difficulty'] },
  { id: 'n_ohanami',   jp: 'お花見', kana: 'おはなみ', mean: 'pesta hanami',     topic: 'aktivitas', det: 'plain', fits: ['interest', 'atmos', 'fame'] },
  { id: 'n_nihongo',   jp: '日本語', kana: 'にほんご', mean: 'bahasa Jepang',    topic: 'aktivitas', det: 'plain', fits: ['difficulty', 'interest'] },
  { id: 'n_eigo',      jp: '英語',   kana: 'えいご',   mean: 'bahasa Inggris',   topic: 'aktivitas', det: 'plain', fits: ['difficulty', 'interest'] },
  { id: 'n_yasumi',    jp: '休み',   kana: 'やすみ',   mean: 'libur',            topic: 'waktu', det: 'plain', fits: ['busy', 'interest', 'atmos'] },
  { id: 'n_nichiyoubi',jp: '日曜日', kana: 'にちようび', mean: 'hari Minggu',    topic: 'waktu', det: 'plain', fits: ['busy', 'interest', 'atmos', 'temp_air'] },
  { id: 'n_kyou',      jp: '今日',   kana: 'きょう',   mean: 'hari ini',         topic: 'waktu', det: 'plain', fits: ['busy', 'temp_air', 'interest'] },
  { id: 'n_nihon',     jp: '日本',   kana: 'にほん',   mean: 'Jepang',           topic: 'negara', det: 'plain', fits: ['atmos', 'clean', 'fame', 'price', 'temp_air'] },
  { id: 'n_indoneshia',jp: 'インドネシア', kana: 'インドネシア', mean: 'Indonesia', topic: 'negara', det: 'plain', fits: ['atmos', 'fame', 'price', 'temp_air'] },
];
const NMAP = Object.fromEntries(NOUN.map(n => [n.id, n]));

/* --- Kata keterangan, konjungsi, ungkapan (untuk daftar kosakata app) ---- */
const FUNC_WORDS = [
  { id: 'adv_totemo',   jp: 'とても',   kana: 'とても',   mean: 'sangat',            type: 'adv' },
  { id: 'adv_amari',    jp: 'あまり',   kana: 'あまり',   mean: 'tidak begitu',      type: 'adv' },
  { id: 'adv_chotto',   jp: 'ちょっと', kana: 'ちょっと', mean: 'sedikit',           type: 'adv' },
  { id: 'conj_soshite', jp: 'そして',   kana: 'そして',   mean: 'dan / kemudian',    type: 'conj' },
  { id: 'conj_ga',      jp: '～が、～', kana: '～が、～', mean: 'tetapi',            type: 'conj' },
  { id: 'e_dou',        jp: 'どう',     kana: 'どう',     mean: 'bagaimana',         type: 'expr' },
  { id: 'e_donna',      jp: 'どんな',   kana: 'どんな',   mean: 'yang bagaimana',    type: 'expr' },
  { id: 'e_soudesune',  jp: 'そうですね', kana: 'そうですね', mean: 'bagaimana ya',  type: 'expr' },
  { id: 'e_ogenki',     jp: 'お元気ですか', kana: 'おげんきですか', mean: 'apa kabar?', type: 'expr' },
];

/* Kata benda waktu lampau -> memicu bentuk 〜でした / 〜かったです */
const TIME_PAST = [
  { jp: '昨日',   kana: 'きのう',     mean: 'kemarin' },
  { jp: 'おととい', kana: 'おととい', mean: 'kemarin lusa' },
  { jp: '先週',   kana: 'せんしゅう', mean: 'minggu lalu' },
  { jp: '先月',   kana: 'せんげつ',   mean: 'bulan lalu' },
  { jp: '去年',   kana: 'きょねん',   mean: 'tahun lalu' },
];

/* Nama orang (tokoh Minna no Nihongo) untuk soal bertema orang */
const PERSON_NAMES = [
  { jp: 'ミラーさん',   kana: 'ミラーさん',   mean: 'Sdr. Miller' },
  { jp: 'ワットさん',   kana: 'ワットさん',   mean: 'Sdr. Watt' },
  { jp: '山田さん',     kana: 'やまださん',   mean: 'Sdr. Yamada' },
  { jp: '松本さん',     kana: 'まつもとさん', mean: 'Sdr. Matsumoto' },
  { jp: 'サントスさん', kana: 'サントスさん', mean: 'Sdr. Santos' },
  { jp: 'カリナさん',   kana: 'カリナさん',   mean: 'Sdr. Karina' },
];

/* Daftar kosakata final yang dipakai aplikasi (js/data/vocab.js) */
const VOCAB = [
  ...ADJ.map(a => ({ id: a.id, jp: a.jp, kana: a.kana, id_mean: a.mean, type: a.type, category: a.cats[0] })),
  ...NOUN.map(n => ({ id: n.id, jp: n.jp, kana: n.kana, id_mean: n.mean, type: 'noun', category: n.topic })),
  ...FUNC_WORDS.map(f => ({ id: f.id, jp: f.jp, kana: f.kana, id_mean: f.mean, type: f.type, category: 'ungkapan' })),
];
const VMAP = Object.fromEntries(VOCAB.map(v => [v.id, v]));

/* ==========================================================================
 * BAGIAN 4 — MESIN KONJUGASI KATA SIFAT (MORPHOLOGY)
 * ----------------------------------------------------------------------------
 * Satu fungsi untuk semua bentuk. Dipakai kalimat DAN pengecoh, sehingga
 * pengecoh selalu berbentuk sama dengan jawaban benar (tidak mudah ditebak
 * dari bentuknya).
 * form: pres_aff | pres_neg | past_aff | past_neg | attr | te_ga
 * ========================================================================*/
function conj(adj, form) {
  const isI = adj.type === 'adj_i';
  const stemJp = isI ? (adj.irregular === 'yoi' ? 'よ' : adj.jp.slice(0, -1)) : adj.jp;
  const stemKn = isI ? (adj.irregular === 'yoi' ? 'よ' : adj.kana.slice(0, -1)) : adj.kana;

  const out = (s, r) => ({ s, r });
  if (isI) {
    switch (form) {
      case 'pres_aff': return out(adj.jp + 'です',            adj.kana + 'です');
      case 'pres_neg': return out(stemJp + 'くないです',      stemKn + 'くないです');
      case 'past_aff': return out(stemJp + 'かったです',      stemKn + 'かったです');
      case 'past_neg': return out(stemJp + 'くなかったです',  stemKn + 'くなかったです');
      case 'attr':     return out(adj.jp,                     adj.kana);
      case 'te_ga':    return out(adj.jp + 'ですが、',        adj.kana + 'ですが、');
      default:         return out(adj.jp + 'です',            adj.kana + 'です');
    }
  }
  switch (form) {
    case 'pres_aff': return out(adj.jp + 'です',                    adj.kana + 'です');
    case 'pres_neg': return out(adj.jp + 'ではありません',          adj.kana + 'ではありません');
    case 'past_aff': return out(adj.jp + 'でした',                  adj.kana + 'でした');
    case 'past_neg': return out(adj.jp + 'ではありませんでした',    adj.kana + 'ではありませんでした');
    case 'attr':     return out(adj.jp + 'な',                      adj.kana + 'な');
    case 'te_ga':    return out(adj.jp + 'ですが、',                adj.kana + 'ですが、');
    default:         return out(adj.jp + 'です',                    adj.kana + 'です');
  }
}

/** Arti Indonesia kata sifat sesuai kategori konteks (高い = mahal / tinggi) */
function adjMean(adj, cat) {
  if (adj.meanBy && cat && adj.meanBy[cat]) return adj.meanBy[cat];
  return adj.mean;
}

/* ==========================================================================
 * BAGIAN 5 — PERAKIT KALIMAT (COLLOCATION ENGINE)
 * ----------------------------------------------------------------------------
 * Kalimat dirakit dari (kata benda × kata sifat yang cocok × bentuk × adverb).
 * Setiap kalimat menyimpan `slots`: posisi token yang boleh dijadikan
 * bagian kosong (＿＿＿) beserta metadata untuk mesin distraktor.
 * ========================================================================*/
let sentenceSeq = 1;

function tokensToJp(tokens) { return tokens.map(t => t.s).join(''); }
function tokensToReading(tokens) {
  return tokens.map(t => t.r).join('').replace(/\u3001/g, '');
}

function makeSentence({ tokens, idn, pattern, vocab, slots, tags }) {
  return {
    key: 's' + (sentenceSeq++),
    tokens,
    jp: tokensToJp(tokens),
    reading: tokensToReading(tokens),
    idn,
    pattern,
    vocab: uniq(vocab.filter(v => VMAP[v])),
    slots: slots || [],
    tags: tags || {},
  };
}

/** Bagian subjek: "この部屋は" + reading "このへやは" (は dibaca わ) */
function topicToken(noun, det, rnd) {
  let s = '', r = '', idn = noun.mean;
  if (det === 'kono') { s = 'この'; r = 'この'; idn = noun.mean + ' ini'; }
  else if (det === 'ano') { s = 'あの'; r = 'あの'; idn = noun.mean + ' itu'; }
  return {
    token: { s: s + noun.jp + 'は', r: r + noun.kana + 'わ' },
    idn,
  };
}

/** Kata sifat mana yang cocok untuk kata benda ini (berdasarkan `fits`) */
function adjsFor(noun) {
  return ADJ
    .map(a => {
      const cat = a.cats.find(c => noun.fits.includes(c));
      return cat ? { adj: a, cat } : null;
    })
    .filter(Boolean);
}

/** Pilih determiner yang wajar untuk kata benda */
function detFor(noun, rnd) {
  if (noun.det === 'plain') return 'none';
  if (noun.det === 'person') return pick(['ano', 'none'], rnd);
  return pick(['kono', 'ano', 'none'], rnd);
}

/* Kategori sifat yang wajar dipakai dalam bentuk LAMPAU (sifat yang berubah).
 * Ukuran, warna, tinggi, umur benda tidak berubah -> dikecualikan. */
const PAST_OK_CATS = [
  'atmos', 'busy', 'condition', 'temp_air', 'temp_touch', 'price',
  'taste', 'interest', 'difficulty', 'quality', 'clean', 'fame',
];

/* ---- POLA 1 & 2: Kata Benda は (とても/あまり) Kata Sifat です ---------- */
function buildPredicateSentences(rnd) {
  const out = [];
  for (const noun of NOUN) {
    for (const { adj, cat } of adjsFor(noun)) {
      for (const form of ['pres_aff', 'pres_neg', 'past_aff', 'past_neg']) {
        const isNeg = form.endsWith('neg');
        const isPast = form.startsWith('past');
        // adverb: とても hanya untuk positif, あまり hanya untuk negatif
        const adverbs = isNeg ? [null, 'amari', 'amari'] : [null, 'totemo', 'chotto'];
        for (const adverb of uniq(adverbs)) {
          if (adverb === 'chotto' && adj.pol > 0) continue; // ちょっと utk hal kurang enak
          const det = detFor(noun, rnd);
          const tokens = [];
          const vocab = [noun.id, adj.id];
          let idnPrefix = '';

          if (isPast) {
            if (noun.topic === 'waktu') continue; // 「昨日、今日は…」tidak wajar
            // Bentuk lampau hanya wajar untuk sifat yang BISA BERUBAH.
            // 「先月、このテレビは大きかったです」(ukuran/warna) -> ditolak.
            if (!PAST_OK_CATS.includes(cat)) continue;
            const t = pick(TIME_PAST, rnd);
            // 「昨日の パーティーは」hanya wajar utk tempat/acara tanpa この/あの.
            const useNo = det === 'none' && ['tempat', 'aktivitas'].includes(noun.topic);
            tokens.push(useNo
              ? { s: t.jp + 'の', r: t.kana + 'の' }
              : { s: t.jp + '、', r: t.kana });
            idnPrefix = t.mean + ' ';
          }
          const tp = topicToken(noun, det, rnd);
          tokens.push(tp.token);

          if (adverb === 'totemo') { tokens.push({ s: 'とても', r: 'とても' }); vocab.push('adv_totemo'); }
          if (adverb === 'amari')  { tokens.push({ s: 'あまり', r: 'あまり' }); vocab.push('adv_amari'); }
          if (adverb === 'chotto') { tokens.push({ s: 'ちょっと', r: 'ちょっと' }); vocab.push('adv_chotto'); }

          const pred = conj(adj, form);
          const predIdx = tokens.length;
          tokens.push(pred);

          const m = adjMean(adj, cat);
          const deg = adverb === 'totemo' ? 'sangat ' : adverb === 'chotto' ? 'agak ' : '';
          const negWord = adverb === 'amari' ? 'tidak begitu ' : 'tidak ';
          const idn = isPast
            ? `${capital(idnPrefix)}${idnPrefix ? '' : ''}${tp.idn} ${isNeg ? negWord : deg}${m}.`
            : `${capital(tp.idn)} ${isNeg ? negWord : deg}${m}.`;

          const slots = [{
            index: predIdx, kind: 'predicate', vocabId: adj.id, cat, form, adjType: adj.type,
          }];
          if (adverb) {
            slots.push({ index: predIdx - 1, kind: 'adverb', value: adverb });
          }

          out.push(makeSentence({
            tokens, idn,
            pattern: adj.type === 'adj_na'
              ? (isNeg ? 'p1_na_neg' : 'p1_na_desu')
              : (isNeg ? 'p2_i_neg' : 'p2_i_desu'),
            vocab, slots,
            tags: { form, isPast, isNeg, adverb, cat, nounId: noun.id, adjId: adj.id, topic: noun.topic },
          }));
        }
      }
    }
  }
  return out;
}

/* ---- POLA 3 & 4: Kata Sifat + Kata Benda (modifikasi) ------------------ */
function demoFor(noun, rnd) {
  if (noun.det === 'koko') return pick([
    { s: 'ここは', r: 'ここわ', idn: 'Di sini' },
    { s: 'あそこは', r: 'あそこわ', idn: 'Di sana' },
  ], rnd);
  if (noun.det === 'person') {
    const p = pick(PERSON_NAMES, rnd);
    return { s: p.jp + 'は', r: p.kana + 'わ', idn: p.mean };
  }
  if (noun.det === 'plain') {
    // Hanya kata benda orang yang bisa "disamakan" dengan nama orang.
    // 「ミラーさんは 親切な 家族です」tidak wajar -> dilarang.
    const NAMEABLE = ['n_tomodachi', 'n_hito'];
    if (noun.topic === 'orang' && NAMEABLE.includes(noun.id)) {
      const p = pick(PERSON_NAMES, rnd);
      return { s: p.jp + 'は', r: p.kana + 'わ', idn: p.mean };
    }
    return null;
  }
  return pick([
    { s: 'これは', r: 'これわ', idn: 'Ini' },
    { s: 'それは', r: 'それわ', idn: 'Itu' },
    { s: 'あれは', r: 'あれわ', idn: 'Itu' },
  ], rnd);
}

function buildModifierSentences(rnd) {
  const out = [];
  for (const noun of NOUN) {
    for (const { adj, cat } of adjsFor(noun)) {
      for (let rep = 0; rep < 2; rep++) {
        const demo = demoFor(noun, rnd);
        if (!demo) continue;
        const attr = conj(adj, 'attr');
        const useTotemo = rep === 1;
        const tokens = [{ s: demo.s, r: demo.r }];
        const vocab = [noun.id, adj.id];
        if (useTotemo) { tokens.push({ s: 'とても', r: 'とても' }); vocab.push('adv_totemo'); }
        const attrIdx = tokens.length;
        tokens.push(attr);
        tokens.push({ s: noun.jp + 'です', r: noun.kana + 'です' });

        const idn = `${capital(demo.idn)} adalah ${noun.mean} yang ${useTotemo ? 'sangat ' : ''}${adjMean(adj, cat)}.`;
        out.push(makeSentence({
          tokens, idn,
          pattern: adj.type === 'adj_na' ? 'p3_na_noun' : 'p4_i_noun',
          vocab,
          slots: [{ index: attrIdx, kind: 'attributive', vocabId: adj.id, cat, form: 'attr', adjType: adj.type }],
          tags: { form: 'attr', isPast: false, isNeg: false, cat, nounId: noun.id, adjId: adj.id, topic: noun.topic },
        }));
      }
    }
  }
  return out;
}

/* ---- POLA 5: ～が、～ (kontras) ---------------------------------------- */
/* Pasangan kontras kurasi: [sifat positif, sifat "tapi"] agar logis. */
const CONTRAST_PAIRS = [
  ['v_oishii', 'v_takai'], ['v_yasui', 'v_warui'], ['v_muzukashii', 'v_omoshiroi'],
  ['v_isogashii', 'v_tanoshii'], ['v_shizuka', 'v_chiisai'], ['v_kirei', 'v_furui'],
  ['v_nigiyaka', 'v_kirei'], ['v_furui', 'v_benri'], ['v_atarashii', 'v_takai'],
  ['v_ookii', 'v_furui'], ['v_yasashii', 'v_tanoshii'], ['v_takai', 'v_oishii'],
  ['v_chiisai', 'v_benri'], ['v_yuumei', 'v_takai'], ['v_shinsetsu', 'v_isogashii'],
  ['v_omoshiroi', 'v_muzukashii'], ['v_benri', 'v_takai'], ['v_hima', 'v_samui'],
  ['v_atsui', 'v_tanoshii'], ['v_tsumetai', 'v_oishii'], ['v_suteki', 'v_takai'],
];

function buildContrastSentences(rnd) {
  const out = [];
  for (const [aId, bId] of CONTRAST_PAIRS) {
    const a = AMAP[aId], b = AMAP[bId];
    const nouns = NOUN.filter(n =>
      a.cats.some(c => n.fits.includes(c)) && b.cats.some(c => n.fits.includes(c)));
    for (const noun of nouns) {
      const catA = a.cats.find(c => noun.fits.includes(c));
      const catB = b.cats.find(c => noun.fits.includes(c));
      for (const negTail of [false, true]) {
        const det = detFor(noun, rnd);
        const tp = topicToken(noun, det, rnd);
        const tokens = [tp.token];
        const vocab = [noun.id, a.id, b.id, 'conj_ga'];
        const gaIdx = tokens.length;
        tokens.push(conj(a, 'te_ga'));
        let tailIdx;
        if (negTail) {
          tokens.push({ s: 'あまり', r: 'あまり' });
          vocab.push('adv_amari');
          tailIdx = tokens.length;
          tokens.push(conj(b, 'pres_neg'));
        } else {
          tailIdx = tokens.length;
          tokens.push(conj(b, 'pres_aff'));
        }
        const idn = `${capital(tp.idn)} ${adjMean(a, catA)}, tetapi ${negTail ? 'tidak begitu ' : ''}${adjMean(b, catB)}.`;
        out.push(makeSentence({
          tokens, idn, pattern: 'p5_ga', vocab,
          slots: [
            { index: gaIdx, kind: 'contrast_head', vocabId: a.id, cat: catA, form: 'te_ga', adjType: a.type },
            { index: tailIdx, kind: 'predicate', vocabId: b.id, cat: catB, form: negTail ? 'pres_neg' : 'pres_aff', adjType: b.type },
          ],
          tags: { form: 'contrast', isPast: false, isNeg: negTail, cat: catA, nounId: noun.id, adjId: a.id, topic: noun.topic },
        }));
      }
    }
  }
  return out;
}

/* ---- POLA 6: そして (dua sifat searah) --------------------------------- */
function buildSoshiteSentences(rnd) {
  const out = [];
  for (const noun of NOUN) {
    const cands = adjsFor(noun);
    if (cands.length < 2) continue;
    for (let i = 0; i < cands.length; i++) {
      for (let j = i + 1; j < cands.length; j++) {
        const A = cands[i], B = cands[j];
        if (A.adj.ant === B.adj.id) continue;              // hindari "besar dan kecil"
        if (A.cat === B.cat) continue;                     // hindari dua sifat sekategori
        if ((A.adj.pol || 0) * (B.adj.pol || 0) < 0) continue; // polaritas harus searah
        const det = detFor(noun, rnd);
        const tp = topicToken(noun, det, rnd);
        const tokens = [tp.token, conj(A.adj, 'te_ga')];
        // ganti "ですが、" -> "です。そして、"
        tokens[1] = { s: A.adj.type === 'adj_na' ? A.adj.jp + 'です。' : A.adj.jp + 'です。', r: (A.adj.type === 'adj_na' ? A.adj.kana : A.adj.kana) + 'です。' };
        tokens.push({ s: 'そして、', r: 'そして、' });
        const predIdx = tokens.length;
        tokens.push(conj(B.adj, 'pres_aff'));
        const idn = `${capital(tp.idn)} ${adjMean(A.adj, A.cat)}. Dan ${adjMean(B.adj, B.cat)}.`;
        out.push(makeSentence({
          tokens, idn, pattern: 'p7_soshite',
          vocab: [noun.id, A.adj.id, B.adj.id, 'conj_soshite'],
          slots: [{ index: predIdx, kind: 'predicate', vocabId: B.adj.id, cat: B.cat, form: 'pres_aff', adjType: B.adj.type }],
          tags: { form: 'soshite', isPast: false, isNeg: false, cat: B.cat, nounId: noun.id, adjId: B.adj.id, topic: noun.topic },
        }));
      }
    }
  }
  return out;
}

/* ---- POLA 7: Pertanyaan どう / どんな ---------------------------------- */
function buildQuestionSentences(rnd) {
  const out = [];
  for (const noun of NOUN) {
    const det = detFor(noun, rnd);
    const tp = topicToken(noun, det, rnd);
    // ～は どうですか。
    out.push(makeSentence({
      tokens: [tp.token, { s: 'どう', r: 'どう' }, { s: 'ですか', r: 'ですか' }],
      idn: `Bagaimana ${tp.idn}?`,
      pattern: 'p8_dou',
      vocab: [noun.id, 'e_dou'],
      slots: [{ index: 1, kind: 'question_word', value: 'どう' }],
      tags: { form: 'question', isPast: false, isNeg: false, nounId: noun.id, topic: noun.topic },
    }));
    // ～は どんな Nですか。
    out.push(makeSentence({
      tokens: [tp.token, { s: 'どんな', r: 'どんな' }, { s: noun.jp + 'ですか', r: noun.kana + 'ですか' }],
      idn: `${capital(tp.idn)} ${noun.mean} yang bagaimana?`,
      pattern: 'p8_donna',
      vocab: [noun.id, 'e_donna'],
      slots: [{ index: 1, kind: 'question_word', value: 'どんな' }],
      tags: { form: 'question', isPast: false, isNeg: false, nounId: noun.id, topic: noun.topic },
    }));
  }
  return out;
}

function capital(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

/* ---- Bangun seluruh bank kalimat --------------------------------------- */
const poolRnd = mulberry32(20260728);
const SENTENCES = [
  ...buildPredicateSentences(poolRnd),
  ...buildModifierSentences(poolRnd),
  ...buildContrastSentences(poolRnd),
  ...buildSoshiteSentences(poolRnd),
  ...buildQuestionSentences(poolRnd),
];

/* Index kalimat per pola untuk pengambilan cepat sesuai silabus */
const BY_PATTERN = {};
for (const s of SENTENCES) {
  (BY_PATTERN[s.pattern] = BY_PATTERN[s.pattern] || []).push(s);
}

/* ==========================================================================
 * BAGIAN 6 — SILABUS / PROGRESI KESULITAN (LEVELING LOGIC)
 * ----------------------------------------------------------------------------
 * getSyllabus(level) -> aturan level tsb:
 *   patterns    : pola tata bahasa yang boleh muncul
 *   forms       : bentuk kata sifat yang boleh muncul
 *   maxTokens   : batas panjang kalimat (soal susun kata makin panjang)
 *   distractors : jumlah pilihan pengecoh
 *   trap        : boleh memakai pengecoh "jebakan gramatikal" (親切 vs 親切な)
 *   typeWeights : bobot kemunculan tipe soal
 * ========================================================================*/
const TIERS = [
  {
    max: 10, name: 'Dasar: Kalimat Positif', key: 'mudah',
    focus: 'N は Aな です / N は Aい です (positif)',
    patterns: ['p1_na_desu', 'p2_i_desu'],
    forms: ['pres_aff'],
    allowAdverb: ['totemo', null],
    maxTokens: 3, distractors: 3, trap: false,
    typeWeights: [
      { v: 'complete', w: 26 }, { v: 'choose_translation', w: 20 }, { v: 'match', w: 18 },
      { v: 'arrange', w: 16 }, { v: 'translate', w: 8 }, { v: 'listening', w: 7 },
      { v: 'short_conversation', w: 5 },
    ],
  },
  {
    max: 20, name: 'Negatif & Modifikasi', key: 'sedang',
    focus: 'Bentuk negatif (あまり〜ません) + Kata Sifat + Kata Benda (きれいな町)',
    patterns: ['p1_na_desu', 'p2_i_desu', 'p1_na_neg', 'p2_i_neg', 'p3_na_noun', 'p4_i_noun'],
    forms: ['pres_aff', 'pres_neg', 'attr'],
    allowAdverb: ['totemo', 'amari', null],
    maxTokens: 4, distractors: 3, trap: false,
    typeWeights: [
      { v: 'complete', w: 22 }, { v: 'arrange', w: 20 }, { v: 'choose_translation', w: 16 },
      { v: 'match', w: 12 }, { v: 'translate', w: 12 }, { v: 'listening', w: 10 },
      { v: 'short_conversation', w: 8 },
    ],
  },
  {
    max: 30, name: 'Bentuk Lampau', key: 'lampau',
    focus: 'Bentuk lampau (でした / かったです) + modifikasi kata benda',
    patterns: ['p1_na_desu', 'p2_i_desu', 'p1_na_neg', 'p2_i_neg', 'p3_na_noun', 'p4_i_noun', 'p8_dou', 'p8_donna'],
    forms: ['pres_aff', 'pres_neg', 'past_aff', 'past_neg', 'attr'],
    allowAdverb: ['totemo', 'amari', 'chotto', null],
    maxTokens: 5, distractors: 3, trap: true,
    typeWeights: [
      { v: 'arrange', w: 20 }, { v: 'complete', w: 20 }, { v: 'translate', w: 15 },
      { v: 'choose_translation', w: 14 }, { v: 'listening', w: 12 },
      { v: 'short_conversation', w: 11 }, { v: 'match', w: 8 },
    ],
  },
  {
    max: 40, name: 'Kalimat Majemuk (が / そして)', key: 'majemuk',
    focus: '～が、～ (tetapi) dan そして (dan) + semua bentuk',
    patterns: ['p1_na_desu', 'p2_i_desu', 'p1_na_neg', 'p2_i_neg', 'p3_na_noun', 'p4_i_noun', 'p5_ga', 'p7_soshite', 'p8_dou', 'p8_donna'],
    forms: ['pres_aff', 'pres_neg', 'past_aff', 'past_neg', 'attr', 'te_ga'],
    allowAdverb: ['totemo', 'amari', 'chotto', null],
    maxTokens: 6, distractors: 4, trap: true,
    typeWeights: [
      { v: 'arrange', w: 20 }, { v: 'translate', w: 17 }, { v: 'complete', w: 17 },
      { v: 'short_conversation', w: 15 }, { v: 'listening', w: 13 },
      { v: 'choose_translation', w: 12 }, { v: 'match', w: 6 },
    ],
  },
  {
    max: 50, name: 'Ujian Campuran', key: 'campuran',
    focus: 'Semua pola Bab 8 diacak, kalimat panjang, pengecoh menjebak',
    patterns: ['p1_na_desu', 'p2_i_desu', 'p1_na_neg', 'p2_i_neg', 'p3_na_noun', 'p4_i_noun', 'p5_ga', 'p7_soshite', 'p8_dou', 'p8_donna'],
    forms: ['pres_aff', 'pres_neg', 'past_aff', 'past_neg', 'attr', 'te_ga'],
    allowAdverb: ['totemo', 'amari', 'chotto', null],
    maxTokens: 8, distractors: 4, trap: true,
    typeWeights: [
      { v: 'translate', w: 20 }, { v: 'arrange', w: 18 }, { v: 'short_conversation', w: 17 },
      { v: 'listening', w: 16 }, { v: 'complete', w: 15 }, { v: 'choose_translation', w: 9 },
      { v: 'match', w: 5 },
    ],
  },
];

function getSyllabus(level) {
  const tier = TIERS.find(t => level <= t.max) || TIERS[TIERS.length - 1];
  // Di dalam satu tier, level akhir sedikit lebih panjang kalimatnya.
  const prevMax = TIERS[TIERS.indexOf(tier) - 1] ? TIERS[TIERS.indexOf(tier) - 1].max : 0;
  const posInTier = (level - prevMax) / (tier.max - prevMax);
  return {
    ...tier,
    level,
    maxTokens: tier.maxTokens + (posInTier > 0.6 ? 1 : 0),
    // Topik yang disorot berputar tiap level -> tema tiap level terasa beda
    topicFocus: TOPIC_CYCLE[(level - 1) % TOPIC_CYCLE.length],
  };
}

/* Rotasi tema per level supaya tiap level punya "rasa" berbeda */
const TOPIC_CYCLE = ['tempat', 'benda', 'makanan', 'orang', 'aktivitas', 'transportasi', 'alam', 'minuman', 'waktu', 'negara'];

/** Ambil kalimat yang sesuai silabus level, diutamakan sesuai tema level. */
function sentencePoolFor(syl) {
  const base = SENTENCES.filter(s =>
    syl.patterns.includes(s.pattern) &&
    (!s.tags.form || syl.forms.includes(s.tags.form) || ['contrast', 'soshite', 'question'].includes(s.tags.form)) &&
    (s.tags.adverb === undefined || syl.allowAdverb.includes(s.tags.adverb || null)) &&
    s.tokens.length <= syl.maxTokens
  );
  const themed = base.filter(s => s.tags.topic === syl.topicFocus);
  // 60% kalimat bertema level ini, sisanya campuran -> variasi tetap tinggi
  return { base, themed: themed.length >= 12 ? themed : base };
}

/* ==========================================================================
 * BAGIAN 7 — MESIN DISTRAKTOR (PENGECOH SEKATEGORI)
 * ----------------------------------------------------------------------------
 * Aturan pengambilan pengecoh, berurutan dari yang paling "menantang":
 *   1. Kata sifat SEKATEGORI SEMANTIK (warna -> warna lain) dan dikonjugasi ke
 *      BENTUK YANG SAMA dengan jawaban.
 *   2. Lawan kata (antonim) -> menuntut pemahaman arti, bukan tebak bentuk.
 *   3. Kata sifat sejenis (な vs な, い vs い) dari kategori berdekatan.
 *   4. Jebakan gramatikal (level >= 21): 親切 (tanpa な), 高いな, 静かい, dst.
 *   5. Terakhir baru pool umum (hampir tidak pernah terpakai).
 * ========================================================================*/

/** Kategori yang "berdekatan" -> dipakai kalau kategori utama kurang anggota */
const NEAR_CATS = {
  color: ['appearance'], size: ['height', 'price'], age: ['quality'],
  quality: ['age', 'utility'], temp_air: ['temp_touch'], temp_touch: ['temp_air'],
  difficulty: ['interest'], price: ['size', 'quality'], height: ['size'],
  interest: ['difficulty', 'quality'], taste: ['quality', 'price'],
  busy: ['condition'], atmos: ['clean', 'appearance'], appearance: ['clean', 'color'],
  clean: ['appearance', 'atmos'], trait: ['condition', 'looks_person'],
  looks_person: ['appearance', 'trait'],
  condition: ['trait', 'busy'], fame: ['quality', 'appearance'], utility: ['quality'],
};

/** Buat bentuk "salah gramatikal" untuk menjebak (dipakai tier >= 3) */
function grammarTraps(adj, form) {
  const traps = [];
  if (form === 'attr') {
    if (adj.type === 'adj_na') traps.push(adj.jp);            // 親切 (kurang な)
    else traps.push(adj.jp + 'な');                           // 高いな (kelebihan な)
  }
  if (form === 'pres_aff') {
    if (adj.type === 'adj_na') traps.push(adj.jp + 'いです');  // 静かいです
    else traps.push(adj.jp.slice(0, -1) + 'なです');           // 高なです
  }
  if (form === 'pres_neg') {
    if (adj.type === 'adj_na') traps.push(adj.jp + 'くないです');
    else traps.push(adj.jp + 'ではありません');
  }
  if (form === 'past_aff') {
    if (adj.type === 'adj_na') traps.push(adj.jp + 'かったです');
    else traps.push(adj.jp + 'でした');
  }
  return traps;
}

/**
 * Ambil N pengecoh untuk sebuah jawaban kata sifat.
 * @param {object} opt { vocabId, cat, form, adjType, count, allowTrap, rnd }
 */
function makeAdjDistractors({ vocabId, cat, form, count, allowTrap, rnd }) {
  const answerAdj = AMAP[vocabId];
  if (!answerAdj) return [];
  const correct = conj(answerAdj, form).s;
  const found = [];
  const seen = new Set([correct]);

  const addFrom = (list) => {
    for (const a of shuffle(list, rnd)) {
      if (found.length >= count) return;
      if (a.id === vocabId) continue;
      const surface = conj(a, form).s;
      if (seen.has(surface)) continue;
      seen.add(surface);
      found.push(surface);
    }
  };

  // Lapis 1: kategori semantik sama (warna -> warna)
  addFrom(ADJ.filter(a => a.cats.includes(cat)));

  // Lapis 2: antonim (kalau belum masuk lewat lapis 1)
  if (found.length < count && answerAdj.ant) addFrom([AMAP[answerAdj.ant]].filter(Boolean));

  // Lapis 3: jebakan gramatikal (hanya level tinggi, maksimal 1 buah)
  if (allowTrap && found.length < count) {
    const traps = grammarTraps(answerAdj, form).filter(t => !seen.has(t));
    if (traps.length) { const t = pick(traps, rnd); seen.add(t); found.push(t); }
  }

  // Lapis 4: kategori berdekatan
  if (found.length < count) {
    const near = (NEAR_CATS[cat] || []).flatMap(c => ADJ.filter(a => a.cats.includes(c)));
    addFrom(near);
  }

  // Lapis 5: kelas kata sama (な dengan な, い dengan い)
  if (found.length < count) addFrom(ADJ.filter(a => a.type === answerAdj.type));

  // Lapis 6 (jaring pengaman): seluruh kata sifat
  if (found.length < count) addFrom(ADJ);

  return found.slice(0, count);
}

/** Pengecoh untuk kata benda -> ambil dari TOPIK yang sama */
function makeNounDistractors(nounId, count, rnd, suffix = '') {
  const noun = NMAP[nounId];
  if (!noun) return [];
  const same = NOUN.filter(n => n.topic === noun.topic && n.id !== nounId);
  const pool = same.length >= count ? same : NOUN.filter(n => n.id !== nounId);
  return pickN(pool, count, rnd).map(n => n.jp + suffix);
}

/** Pengecoh untuk kata keterangan / kata tanya (kelas kata sama) */
function makeFunctionDistractors(correct, count, rnd) {
  const groups = [
    ['とても', 'あまり', 'ちょっと'],
    ['どう', 'どんな', 'そして'],
    ['そして', 'そうですね', 'ちょっと'],
  ];
  const group = groups.find(g => g.includes(correct)) || groups[0];
  const pool = uniq([...group, 'とても', 'あまり', 'どんな', 'どう', 'そして', 'ちょっと'])
    .filter(x => x !== correct);
  return pickN(pool, count, rnd);
}

/* ==========================================================================
 * BAGIAN 8 — GENERATOR PER TIPE SOAL (7 TIPE)
 * Skema field-nya dipertahankan sama persis dengan js/questions.js.
 * ========================================================================*/
let qIdCounter = 1;
function nextId() { return `q_${qIdCounter++}`; }

/** Pecah token untuk soal susun kata: level tinggi = potongan lebih halus */
function tilesFrom(sentence, syl) {
  return sentence.tokens.map(t => t.s).filter(t => t && t !== '、');
}

/* --- 1) ARRANGE ---------------------------------------------------------- */
function genArrange(sentence, syl, rnd) {
  const tokens = tilesFrom(sentence, syl);
  if (tokens.length < 2) return null;
  let tiles = shuffle(tokens, rnd);
  // Level >= 31: tambahkan 1 kata pengganggu dari kategori sama
  if (syl.level > 30 && sentence.tags.adjId) {
    const extra = makeAdjDistractors({
      vocabId: sentence.tags.adjId, cat: sentence.tags.cat || 'quality',
      form: sentence.tags.form === 'attr' ? 'attr' : 'pres_aff',
      count: 1, allowTrap: false, rnd,
    })[0];
    if (extra && !tokens.includes(extra)) tiles = shuffle([...tokens, extra], rnd);
  }
  return {
    id: nextId(), type: 'arrange',
    instruction: 'Susun kata-kata berikut menjadi kalimat Bahasa Jepang yang benar.',
    tiles, answer: tokens,
    hint: sentence.idn,
    reading: sentence.reading,
    vocab: sentence.vocab,
  };
}

/* --- 2) TRANSLATE -------------------------------------------------------- */
function genTranslate(sentence, syl, rnd) {
  const tokens = tilesFrom(sentence, syl);
  if (tokens.length < 2) return null;
  return {
    id: nextId(), type: 'translate',
    instruction: 'Terjemahkan kalimat berikut ke dalam Bahasa Jepang.',
    prompt: sentence.idn,
    tiles: shuffle(tokens, rnd), answer: tokens,
    reading: sentence.reading,
    vocab: sentence.vocab,
  };
}

/* --- 3) COMPLETE (isi bagian rumpang) ------------------------------------ */
function genComplete(sentence, syl, rnd) {
  const tokens = tilesFrom(sentence, syl);
  if (tokens.length < 2 || !sentence.slots.length) return null;

  const slot = pick(sentence.slots, rnd);
  const targetToken = sentence.tokens[slot.index] && sentence.tokens[slot.index].s;
  if (!targetToken) return null;

  const promptTokens = tokens.slice();
  const idx = tokens.indexOf(targetToken);
  if (idx === -1) return null;
  promptTokens[idx] = '＿＿＿';

  let distractors = [];
  if (slot.kind === 'predicate' || slot.kind === 'attributive' || slot.kind === 'contrast_head') {
    distractors = makeAdjDistractors({
      vocabId: slot.vocabId, cat: slot.cat, form: slot.form,
      count: syl.distractors, allowTrap: syl.trap, rnd,
    });
  } else if (slot.kind === 'adverb' || slot.kind === 'question_word') {
    distractors = makeFunctionDistractors(targetToken, syl.distractors, rnd);
  }
  if (distractors.length < 2) return null;

  const options = shuffle(uniq([targetToken, ...distractors]), rnd);
  return {
    id: nextId(), type: 'complete',
    instruction: slot.kind === 'adverb'
      ? 'Lengkapi kalimat dengan kata keterangan tingkat yang tepat.'
      : slot.kind === 'attributive'
        ? 'Lengkapi kalimat dengan bentuk kata sifat + kata benda yang benar.'
        : 'Lengkapi kalimat berikut dengan kata yang tepat.',
    prompt: promptTokens.join(' '),
    translation: sentence.idn,
    options, answer: targetToken,
    vocab: sentence.vocab,
  };
}

/* --- 4) MATCH (bertema, bukan acak global) ------------------------------- */
function genMatch(syl, rnd, matchCursor) {
  // Kumpulan kandidat: kata sifat sekategori ATAU kata benda setopik,
  // sehingga menjodohkan terasa "satu tema" dan lebih menantang.
  const useAdj = rnd() < 0.55;
  let group;
  if (useAdj) {
    const cats = uniq(ADJ.flatMap(a => a.cats));
    const cat = cats[matchCursor.i++ % cats.length];
    group = ADJ.filter(a => a.cats.includes(cat));
    if (group.length < 4) group = ADJ.filter(a => a.type === pick(['adj_i', 'adj_na'], rnd));
  } else {
    const topic = syl.topicFocus;
    group = NOUN.filter(n => n.topic === topic);
    if (group.length < 4) group = NOUN;
  }
  const size = Math.min(group.length, syl.level > 25 ? 6 : 5);
  const chosen = pickN(group, size, rnd);
  return {
    id: nextId(), type: 'match',
    instruction: 'Jodohkan kosakata Bahasa Jepang dengan artinya yang benar.',
    pairs: chosen.map(v => ({ jp: v.jp, id: v.mean, vocabId: v.id })),
    vocab: chosen.map(v => v.id),
  };
}

/* --- 5) SHORT CONVERSATION (dirakit, bukan template mati) ---------------- */
function genShortConversation(syl, rnd, pool) {
  const style = weightedPick([
    { v: 'donna', w: 3 }, { v: 'dou', w: 3 }, { v: 'contrast', w: 2 },
    { v: 'confirm_neg', w: 2 }, { v: 'comprehension', w: 3 }, { v: 'greeting', w: 1 },
  ], rnd);

  const A = (text) => ({ speaker: 'A', text });
  const B = (text) => ({ speaker: 'B', text });

  /* (a) A: ～は どんな Nですか / B: ＿＿＿ Nです */
  if (style === 'donna') {
    const s = pool.filter(x => x.pattern === 'p3_na_noun' || x.pattern === 'p4_i_noun');
    if (!s.length) return null;
    const base = pick(s, rnd);
    const noun = NMAP[base.tags.nounId];
    const adj = AMAP[base.tags.adjId];
    if (!noun || !adj) return null;
    const attr = conj(adj, 'attr').s;
    const options = shuffle(uniq([attr, ...makeAdjDistractors({
      vocabId: adj.id, cat: base.tags.cat, form: 'attr',
      count: syl.distractors, allowTrap: syl.trap, rnd,
    })]), rnd);
    return {
      id: nextId(), type: 'short_conversation',
      instruction: 'Bacalah percakapan pendek berikut lalu jawab pertanyaannya.',
      dialogue: [
        A(`${noun.jp}は どんな ${noun.jp}ですか。`),
        B(`＿＿＿ ${noun.jp}です。`),
      ],
      question: `Pilih jawaban B yang tepat (${noun.mean} yang ${adjMean(adj, base.tags.cat)}):`,
      options, answer: attr,
      vocab: uniq([...base.vocab, 'e_donna']),
    };
  }

  /* (b) A: ～は どうですか / B: とても ＿＿＿ */
  if (style === 'dou') {
    const s = pool.filter(x => x.pattern === 'p1_na_desu' || x.pattern === 'p2_i_desu');
    if (!s.length) return null;
    const base = pick(s, rnd);
    const noun = NMAP[base.tags.nounId];
    const adj = AMAP[base.tags.adjId];
    if (!noun || !adj) return null;
    const pred = conj(adj, base.tags.isPast ? 'past_aff' : 'pres_aff').s;
    const options = shuffle(uniq([pred, ...makeAdjDistractors({
      vocabId: adj.id, cat: base.tags.cat, form: base.tags.isPast ? 'past_aff' : 'pres_aff',
      count: syl.distractors, allowTrap: syl.trap, rnd,
    })]), rnd);
    return {
      id: nextId(), type: 'short_conversation',
      instruction: 'Bacalah percakapan pendek berikut lalu jawab pertanyaannya.',
      dialogue: [
        A(`${noun.jp}は どうですか。`),
        B(`とても ＿＿＿`),
      ],
      question: `Lengkapi jawaban B ("${noun.mean} sangat ${adjMean(adj, base.tags.cat)}"):`,
      options, answer: pred,
      vocab: uniq([...base.vocab, 'e_dou', 'adv_totemo']),
    };
  }

  /* (c) Kontras: B: ～ですが、＿＿＿ */
  if (style === 'contrast') {
    const s = pool.filter(x => x.pattern === 'p5_ga');
    if (!s.length) return null;
    const base = pick(s, rnd);
    const tail = base.slots.find(sl => sl.kind === 'predicate');
    if (!tail) return null;
    const answer = base.tokens[tail.index].s;
    const options = shuffle(uniq([answer, ...makeAdjDistractors({
      vocabId: tail.vocabId, cat: tail.cat, form: tail.form,
      count: syl.distractors, allowTrap: syl.trap, rnd,
    })]), rnd);
    const head = base.tokens.slice(0, tail.index).map(t => t.s).join('');
    return {
      id: nextId(), type: 'short_conversation',
      instruction: 'Bacalah percakapan pendek berikut lalu jawab pertanyaannya.',
      dialogue: [
        A(`${NMAP[base.tags.nounId] ? NMAP[base.tags.nounId].jp : ''}は どうですか。`),
        B(`${head}＿＿＿`),
      ],
      question: `Lengkapi kalimat B — artinya: "${base.idn}"`,
      options, answer,
      vocab: uniq([...base.vocab, 'conj_ga']),
    };
  }

  /* (d) Konfirmasi negatif: A: ～ですか / B: いいえ、あまり ＿＿＿ */
  if (style === 'confirm_neg') {
    const s = pool.filter(x => x.pattern === 'p1_na_desu' || x.pattern === 'p2_i_desu');
    if (!s.length) return null;
    const base = pick(s, rnd);
    const noun = NMAP[base.tags.nounId];
    const adj = AMAP[base.tags.adjId];
    if (!noun || !adj) return null;
    const neg = conj(adj, 'pres_neg').s;
    const options = shuffle(uniq([neg, ...makeAdjDistractors({
      vocabId: adj.id, cat: base.tags.cat, form: 'pres_neg',
      count: syl.distractors, allowTrap: syl.trap, rnd,
    })]), rnd);
    return {
      id: nextId(), type: 'short_conversation',
      instruction: 'Bacalah percakapan pendek berikut lalu jawab pertanyaannya.',
      dialogue: [
        A(`${noun.jp}は ${conj(adj, 'pres_aff').s}か。`),
        B(`いいえ、あまり ＿＿＿`),
      ],
      question: 'Lengkapi jawaban B dengan bentuk negatif yang benar:',
      options, answer: neg,
      vocab: uniq([...base.vocab, 'adv_amari']),
    };
  }

  /* (f) Basa-basi: お元気ですか / そうですね (ungkapan Bab 8) */
  if (style === 'greeting') {
    const name = pick(PERSON_NAMES, rnd);
    const variant = pick(['ogenki', 'soudesune'], rnd);
    if (variant === 'ogenki') {
      return {
        id: nextId(), type: 'short_conversation',
        instruction: 'Bacalah percakapan pendek berikut lalu jawab pertanyaannya.',
        dialogue: [
          A(`${name.jp}、お元気ですか。`),
          B('はい、＿＿＿'),
        ],
        question: 'Pilih jawaban B yang tepat untuk sapaan "Apa kabar?":',
        options: shuffle(['元気です', '暇です', '忙しいです', '有名です'], rnd),
        answer: '元気です',
        vocab: ['e_ogenki', 'v_genki'],
      };
    }
    const noun = NMAP[pick(Object.keys(NMAP), rnd)];
    return {
      id: nextId(), type: 'short_conversation',
      instruction: 'Bacalah percakapan pendek berikut lalu jawab pertanyaannya.',
      dialogue: [
        A(`${noun.jp}は どうですか。`),
        B('＿＿＿ ちょっと 難しいですね。'),
      ],
      question: 'Pilih ungkapan B yang tepat saat ragu-ragu menjawab ("Bagaimana ya..."):',
      options: shuffle(['そうですね', 'お元気ですか', 'どんな', 'そして'], rnd),
      answer: 'そうですね',
      vocab: ['e_soudesune', 'e_dou', noun.id],
    };
  }

  /* (e) Pemahaman isi percakapan (jawaban berupa kalimat penuh) */
  const cands = pool.filter(x => x.pattern === 'p5_ga' || x.pattern === 'p7_soshite' || x.pattern === 'p3_na_noun' || x.pattern === 'p4_i_noun');
  if (!cands.length) return null;
  const base = pick(cands, rnd);
  const noun = NMAP[base.tags.nounId];
  if (!noun) return null;
  const correct = base.jp;
  const others = shuffle(SENTENCES.filter(x =>
    x.tags.nounId === base.tags.nounId && x.jp !== correct &&
    x.tokens.length >= 2 && ['p1_na_desu', 'p2_i_desu', 'p5_ga', 'p7_soshite', 'p3_na_noun', 'p4_i_noun'].includes(x.pattern)
  ), rnd).slice(0, syl.distractors).map(x => x.jp);
  if (others.length < 2) return null;
  const name = pick(PERSON_NAMES, rnd);
  return {
    id: nextId(), type: 'short_conversation',
    instruction: 'Bacalah percakapan pendek berikut lalu jawab pertanyaannya.',
    dialogue: [
      A(`きのう ${name.jp}の ${noun.jp}を 見ました。`),
      B(`どんな ${noun.jp}ですか。`),
      A(correct),
    ],
    question: `${noun.mean} tersebut seperti apa menurut A?`,
    options: shuffle(uniq([correct, ...others]), rnd),
    answer: correct,
    vocab: uniq([...base.vocab, 'e_donna']),
  };
}

/* --- 6) CHOOSE TRANSLATION (pengecoh = pasangan minimal) ----------------- */
function genChooseTranslation(sentence, syl, rnd) {
  const correct = sentence.jp;
  // Pengecoh terbaik: kalimat dengan SUBJEK SAMA tapi sifat/bentuk berbeda
  const minimalPairs = SENTENCES.filter(s =>
    s.jp !== correct && s.tags.nounId === sentence.tags.nounId &&
    Math.abs(s.tokens.length - sentence.tokens.length) <= 1
  );
  const sameCat = SENTENCES.filter(s =>
    s.jp !== correct && s.tags.cat === sentence.tags.cat && s.pattern === sentence.pattern
  );
  let picks = pickN(minimalPairs, syl.distractors, rnd).map(s => s.jp);
  if (picks.length < syl.distractors) {
    picks = uniq([...picks, ...pickN(sameCat, syl.distractors, rnd).map(s => s.jp)]);
  }
  if (picks.length < 2) return null;
  const options = shuffle(uniq([correct, ...picks.slice(0, syl.distractors)]), rnd);
  return {
    id: nextId(), type: 'choose_translation',
    instruction: 'Pilih terjemahan Bahasa Jepang yang benar.',
    prompt: sentence.idn,
    options, answer: correct,
    vocab: sentence.vocab,
  };
}

/* --- 7) LISTENING -------------------------------------------------------- */
function genListening(sentence, syl, rnd) {
  const tokens = tilesFrom(sentence, syl);
  if (tokens.length < 2) return null;
  const extraCount = syl.level > 30 ? 3 : syl.level > 15 ? 2 : 1;
  const extras = [];

  // Pengecoh tile: bentuk lain dari sifat yang sama + sifat sekategori
  if (sentence.tags.adjId) {
    const adj = AMAP[sentence.tags.adjId];
    const otherForms = ['pres_aff', 'pres_neg', 'past_aff', 'attr']
      .filter(f => f !== sentence.tags.form)
      .map(f => conj(adj, f).s);
    extras.push(...otherForms);
    extras.push(...makeAdjDistractors({
      vocabId: adj.id, cat: sentence.tags.cat || adj.cats[0],
      form: sentence.tags.form === 'attr' ? 'attr' : 'pres_aff',
      count: 2, allowTrap: false, rnd,
    }));
  }
  extras.push(...['とても', 'あまり', 'そして、'].filter(x => !tokens.includes(x)));

  const chosenExtras = pickN(uniq(extras.filter(e => e && !tokens.includes(e))), extraCount, rnd);
  return {
    id: nextId(), type: 'listening',
    instruction: 'Dengarkan audio, lalu susun kalimat yang kamu dengar.',
    audioText: sentence.jp,
    reading: sentence.reading,
    tiles: shuffle([...tokens, ...chosenExtras], rnd),
    answer: tokens,
    translation: sentence.idn,
    vocab: sentence.vocab,
  };
}

/* ==========================================================================
 * BAGIAN 9 — PENYUSUN URUTAN TIPE SOAL (ACAK, TIDAK BISA DIHAFAL)
 * ----------------------------------------------------------------------------
 * - Tipe soal dipilih dengan bobot per tier (weightedPick + Math.random-like).
 * - Larangan: tipe sama muncul >2 kali berturut-turut.
 * - Kuota: match & listening dibatasi agar tidak menumpuk di satu level.
 * - Jaminan: minimal 5 tipe berbeda per level.
 * ========================================================================*/
function buildTypeSequence(syl, count, rnd) {
  const caps = { match: syl.level > 25 ? 2 : 3, listening: 4, short_conversation: 5 };
  const seq = [];
  const used = {};
  let guard = 0;
  while (seq.length < count && guard < count * 60) {
    guard++;
    const t = weightedPick(syl.typeWeights, rnd);
    if (caps[t] && (used[t] || 0) >= caps[t]) continue;
    const n = seq.length;
    if (n >= 2 && seq[n - 1] === t && seq[n - 2] === t) continue; // anti 3x berturut
    seq.push(t);
    used[t] = (used[t] || 0) + 1;
  }
  // Pastikan minimal 5 tipe berbeda
  const allTypes = syl.typeWeights.map(w => w.v);
  const missing = allTypes.filter(t => !seq.includes(t));
  let slot = 0;
  while (uniq(seq).length < 5 && missing.length) {
    const t = missing.shift();
    const pos = Math.floor(rnd() * seq.length);
    seq[pos] = t;
    if (++slot > 10) break;
  }
  return seq;
}

/* ==========================================================================
 * BAGIAN 10 — PEMBANGUN 50 LEVEL × 20 SOAL
 * ========================================================================*/
const TOTAL_LEVELS = 50;
const QUESTIONS_PER_LEVEL = 20;
const LEVELS = [];
const matchCursor = { i: 0 };

for (let level = 1; level <= TOTAL_LEVELS; level++) {
  const rnd = mulberry32(level * 977 + 20260728);
  const syl = getSyllabus(level);
  const { base, themed } = sentencePoolFor(syl);

  const questions = [];
  const usedSentences = new Set();   // hindari kalimat dobel dalam 1 level
  const usedSignatures = new Set();  // hindari soal identik dalam 1 level

  /** Ambil kalimat berikutnya: 65% dari tema level, sisanya dari pool umum. */
  function takeSentence(filterFn) {
    for (let attempt = 0; attempt < 80; attempt++) {
      const src = rnd() < 0.65 ? themed : base;
      const s = pick(src, rnd);
      if (!s) continue;
      if (filterFn && !filterFn(s)) continue;
      if (usedSentences.has(s.key)) continue;
      usedSentences.add(s.key);
      return s;
    }
    // fallback: boleh mengulang kalau pool kecil
    const s = pick(base, rnd);
    return filterFn && !filterFn(s) ? pick(base.filter(filterFn) || base, rnd) : s;
  }

  const typeSeq = buildTypeSequence(syl, QUESTIONS_PER_LEVEL, rnd);
  let i = 0, guard = 0;

  while (questions.length < QUESTIONS_PER_LEVEL && guard < 600) {
    guard++;
    const type = typeSeq[i % typeSeq.length];
    i++;
    let q = null;

    if (type === 'arrange') {
      q = genArrange(takeSentence(s => s.tokens.length >= 2), syl, rnd);
    } else if (type === 'translate') {
      q = genTranslate(takeSentence(s => s.tokens.length >= 2 && s.pattern !== 'p8_dou'), syl, rnd);
    } else if (type === 'complete') {
      q = genComplete(takeSentence(s => s.slots.length > 0), syl, rnd);
    } else if (type === 'match') {
      q = genMatch(syl, rnd, matchCursor);
    } else if (type === 'short_conversation') {
      q = genShortConversation(syl, rnd, base);
    } else if (type === 'choose_translation') {
      q = genChooseTranslation(takeSentence(s => s.tokens.length >= 2), syl, rnd);
    } else if (type === 'listening') {
      q = genListening(takeSentence(s => s.tokens.length >= 2), syl, rnd);
    }

    if (!q) continue;
    const sig = q.type + '|' + (q.answer ? JSON.stringify(q.answer) : '') + '|' + (q.prompt || '');
    if (usedSignatures.has(sig)) continue;
    usedSignatures.add(sig);
    questions.push(q);
  }

  LEVELS.push({
    level,
    title: `Level ${level}`,
    tier: syl.key,
    focus: syl.focus,
    theme: syl.topicFocus,
    questions,
  });
}

/* ==========================================================================
 * BAGIAN 11 — VALIDASI
 * ========================================================================*/
const usedVocab = new Set();
const typeCount = {};
let totalQ = 0;
for (const lvl of LEVELS) {
  totalQ += lvl.questions.length;
  for (const q of lvl.questions) {
    typeCount[q.type] = (typeCount[q.type] || 0) + 1;
    if (q.vocab) q.vocab.forEach(v => usedVocab.add(v));
  }
}

// Cek id vocab "hantu" (dirujuk soal tapi tidak ada di daftar VOCAB)
const ghost = Array.from(usedVocab).filter(v => !VMAP[v]);
if (ghost.length) console.warn('PERINGATAN: id kosakata tidak dikenal:', ghost);

const missing = VOCAB.filter(v => !usedVocab.has(v.id));
if (missing.length) console.warn('PERINGATAN: Kosakata belum terpakai:', missing.map(m => m.jp).join(', '));
else console.log(`OK: Semua ${VOCAB.length} kosakata terpakai di soal.`);

const badLevels = LEVELS.filter(l => l.questions.length !== QUESTIONS_PER_LEVEL);
if (badLevels.length) console.warn('PERINGATAN: level tidak lengkap:', badLevels.map(l => l.level));

// Statistik variasi
const uniqueSentences = new Set();
LEVELS.forEach(l => l.questions.forEach(q => {
  if (Array.isArray(q.answer)) uniqueSentences.add(q.answer.join(''));
  else if (q.audioText) uniqueSentences.add(q.audioText);
}));

/* ==========================================================================
 * BAGIAN 12 — TULIS OUTPUT
 * ========================================================================*/
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

console.log('---------------------------------------------');
console.log('Bank kalimat unik  :', SENTENCES.length);
console.log('Total level        :', LEVELS.length);
console.log('Total soal         :', totalQ);
console.log('Kalimat unik dipakai:', uniqueSentences.size);
console.log('Sebaran tipe soal  :', typeCount);
console.log('Selesai! Output: js/data/vocab.js & js/data/levels.js');
