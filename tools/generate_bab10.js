/* ============================================================================
 * tools/generate_bab10.js  —  GENERATOR SOAL BAB 10 (REVISI AUDIT 2026-10)
 * ----------------------------------------------------------------------------
 * Minna no Nihongo I — Bab 10:
 *   あります / います · に / が / は / の / や / と / も ·
 *   上・下・前・後ろ・右・左・中・外・隣・近く・間 ·
 *   ～や～など · どこ / だれ / 何 · 何も ありません / だれも いません
 *
 * Perbedaan penting dari versi lama (hasil audit):
 *   1. Seluruh kosakata dibatasi pada Minna no Nihongo I Bab 1–10. Setiap entri
 *      kosakata menyimpan nomor pelajaran asalnya (`lesson`) sehingga bisa
 *      diaudit. Kata di luar Bab 1–10 (電柱, 台所, カレンダー, ソファ, 鳥,
 *      お菓子, ホテル, 家/いえ, どういたしまして, ええと) sudah dihapus.
 *   2. Kalimat tidak lagi dirakit acak dari "tempat × benda". Setiap pasangan
 *      tempat ↔ benda/makhluk hidup dikurasi (`PLACE_THINGS`, `PLACE_LIVINGS`)
 *      sehingga tidak ada lagi kalimat janggal seperti 「国に箱があります」.
 *   3. Kalimat pertanyaan, jawaban, dan pengecoh dirancang agar hanya ada satu
 *      jawaban benar (kunci selalu didukung petunjuk terjemahan + tata bahasa).
 *   4. Distribusi bunpou dijatah per level (kuota pola), bukan hasil acak, dan
 *      seluruh pola Bab 10 (termasuk や／など, 間, 何も／だれも) mendapat porsi.
 *
 * Skema soal (7 tipe) SAMA PERSIS dengan js/questions.js:
 *   arrange, translate, complete, match, short_conversation,
 *   choose_translation, listening
 *
 * Output:
 *   js/data/vocab_bab10.js  -> window.VOCAB_BAB10_DATA
 *   js/data/levels_bab10.js -> window.LEVELS_BAB10_DATA
 *
 * Jalankan:  node tools/generate_bab10.js
 * Audit   :  node tools/audit_bab10.js
 * ==========================================================================*/

const fs = require('fs');
const path = require('path');

/* ==========================================================================
 * BAGIAN 1 — UTILITAS (seeded RNG + konverter romaji)
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
function capital(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

/* Token kalimat: s = tulisan, r = kana, m = romaji */
function T(s, r, m) { return { s, r, m: m === undefined ? toRomaji(r) : m }; }
function joinS(toks) { return toks.map(t => t.s).join(''); }
function joinR(toks) { return toks.map(t => t.r).join(''); }
function joinM(toks) { return toks.map(t => t.m).join(' ').replace(/\s+/g, ' ').trim(); }

/* --- konverter kana -> romaji (hiragana + katakana + youon + sokuon + chōon) */
const ROMAJI_TABLE = {
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'を': 'o', 'ん': 'n',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
  'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
  'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
  'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
  'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
  'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
  'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
  'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
  'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
  'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
  'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
  'ふぁ': 'fa', 'ふぃ': 'fi', 'ふぇ': 'fe', 'ふぉ': 'fo',
  'てぃ': 'ti', 'でぃ': 'di', 'うぃ': 'wi', 'うぇ': 'we',
};
function toRomaji(kanaStr) {
  let s = String(kanaStr).replace(/[\u30A1-\u30F6]/g, m =>
    String.fromCharCode(m.charCodeAt(0) - 0x60));
  s = s.replace(/(^|\s)は(?=\s|$)/g, '$1わ');
  let out = '';
  let pendingDouble = false;
  let lastVowel = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const next = s[i + 1];
    if (ch === 'っ' || ch === 'ッ') { pendingDouble = true; continue; }
    if (ch === 'ー' || ch === '〜') { out += lastVowel || 'a'; continue; }
    if (ch === '　' || ch === ' ') { out += ' '; continue; }
    if ('。、？！・「」（）'.includes(ch)) { out += ' '; continue; }
    let syll = null;
    if (next && ROMAJI_TABLE[ch + next]) { syll = ROMAJI_TABLE[ch + next]; i++; }
    else if (ROMAJI_TABLE[ch]) { syll = ROMAJI_TABLE[ch]; }
    else { out += ch; continue; }
    if (pendingDouble) { out += syll.charAt(0); pendingDouble = false; }
    out += syll;
    lastVowel = /[aiueo]$/.test(syll) ? syll.slice(-1) : lastVowel;
  }
  return out.replace(/\s+/g, ' ').trim();
}

/* ==========================================================================
 * BAGIAN 2 — KOSAKATA BAB 1–10 (acuan utama; `lesson` = pelajaran asal)
 *   10 = Bab 10, 9 = Bab 9, … , 1 = Bab 1. Semua entri sudah diverifikasi
 *   ada pada daftar kosakata Minna no Nihongo I Bab 1–10.
 * ========================================================================*/
const V_VERBS = [
  { id: 'v_arimasu', jp: 'あります', kana: 'あります', mean: 'ada (untuk benda mati)', lesson: 10 },
  { id: 'v_imasu',   jp: 'います',   kana: 'います',   mean: 'ada (untuk makhluk hidup)', lesson: 10 },
  { id: 'v_wa_aru',  jp: 'ありません', kana: 'ありません', mean: 'tidak ada (benda mati)', lesson: 10, hidden: true },
  { id: 'v_wa_iru',  jp: 'いません',   kana: 'いません',   mean: 'tidak ada (makhluk hidup)', lesson: 10, hidden: true },
];

const V_POS = [
  { id: 'pos_ue',      jp: '上',   kana: 'うえ',   mean: 'atas',    lesson: 10 },
  { id: 'pos_shita',   jp: '下',   kana: 'した',   mean: 'bawah',   lesson: 10 },
  { id: 'pos_mae',     jp: '前',   kana: 'まえ',   mean: 'depan',   lesson: 10 },
  { id: 'pos_ushiro',  jp: '後ろ', kana: 'うしろ', mean: 'belakang', lesson: 10 },
  { id: 'pos_migi',    jp: '右',   kana: 'みぎ',   mean: 'kanan',   lesson: 10 },
  { id: 'pos_hidari',  jp: '左',   kana: 'ひだり', mean: 'kiri',    lesson: 10 },
  { id: 'pos_naka',    jp: '中',   kana: 'なか',   mean: 'dalam',   lesson: 10 },
  { id: 'pos_soto',    jp: '外',   kana: 'そと',   mean: 'luar',    lesson: 10 },
  { id: 'pos_tonari',  jp: '隣',   kana: 'となり', mean: 'sebelah', lesson: 10 },
  { id: 'pos_chikaku', jp: '近く', kana: 'ちかく', mean: 'dekat',   lesson: 10 },
  { id: 'pos_aida',    jp: '間',   kana: 'あいだ', mean: 'antara',  lesson: 10 },
];

/* Benda mati (pakai あります) */
const V_THINGS = [
  { id: 'n_hako',      jp: '箱',       kana: 'はこ',       mean: 'kotak',        lesson: 10 },
  { id: 'n_reizouko',  jp: '冷蔵庫',   kana: 'れいぞうこ', mean: 'kulkas',       lesson: 10 },
  { id: 'n_tana',      jp: '棚',       kana: 'たな',       mean: 'rak',          lesson: 10 },
  { id: 'n_mado',      jp: '窓',       kana: 'まど',       mean: 'jendela',      lesson: 10 },
  { id: 'n_teeburu',   jp: 'テーブル', kana: 'テーブル',   mean: 'meja makan',   lesson: 10 },
  { id: 'n_beddo',     jp: 'ベッド',   kana: 'ベッド',     mean: 'tempat tidur', lesson: 10 },
  { id: 'n_doa',       jp: 'ドア',     kana: 'ドア',       mean: 'pintu',        lesson: 10 },
  { id: 'n_suitchi',   jp: 'スイッチ', kana: 'スイッチ',   mean: 'saklar',       lesson: 10 },
  { id: 'n_denchi',    jp: '電池',     kana: 'でんち',     mean: 'baterai',      lesson: 10 },
  { id: 'n_posuto',    jp: 'ポスト',   kana: 'ポスト',     mean: 'kotak pos',    lesson: 10 },
  { id: 'n_ki',        jp: '木',       kana: 'き',         mean: 'pohon',        lesson: 10 },
  { id: 'n_mono',      jp: '物',       kana: 'もの',       mean: 'barang',       lesson: 10 },
  { id: 'n_firumu',    jp: 'フィルム', kana: 'フィルム',   mean: 'film (kamera)', lesson: 10 },
  { id: 'n_hana',      jp: '花',       kana: 'はな',       mean: 'bunga',        lesson: 7 },
  { id: 'n_hon',       jp: '本',       kana: 'ほん',       mean: 'buku',         lesson: 2 },
  { id: 'n_jisho',     jp: '辞書',     kana: 'じしょ',     mean: 'kamus',        lesson: 2 },
  { id: 'n_zasshi',    jp: '雑誌',     kana: 'ざっし',     mean: 'majalah',      lesson: 2 },
  { id: 'n_shinbun',   jp: '新聞',     kana: 'しんぶん',   mean: 'koran',        lesson: 2 },
  { id: 'n_techo',     jp: '手帳',     kana: 'てちょう',   mean: 'buku agenda',  lesson: 2 },
  { id: 'n_kaado',     jp: 'カード',   kana: 'カード',     mean: 'kartu',        lesson: 2 },
  { id: 'n_nooto',     jp: 'ノート',   kana: 'ノート',     mean: 'buku catatan', lesson: 2 },
  { id: 'n_enpitsu',   jp: '鉛筆',     kana: 'えんぴつ',   mean: 'pensil',       lesson: 2 },
  { id: 'n_keshigomu', jp: '消しゴム', kana: 'けしゴム',   mean: 'penghapus',    lesson: 7 },
  { id: 'n_terebi',    jp: 'テレビ',   kana: 'テレビ',     mean: 'televisi',     lesson: 2 },
  { id: 'n_kamera',    jp: 'カメラ',   kana: 'カメラ',     mean: 'kamera',       lesson: 2 },
  { id: 'n_kuruma',    jp: '車',       kana: 'くるま',     mean: 'mobil',        lesson: 2 },
  { id: 'n_tsukue',    jp: '机',       kana: 'つくえ',     mean: 'meja',         lesson: 2 },
  { id: 'n_isu',       jp: 'いす',     kana: 'いす',       mean: 'kursi',        lesson: 2 },
  { id: 'n_tokei',     jp: '時計',     kana: 'とけい',     mean: 'jam',          lesson: 2 },
  { id: 'n_kaban',     jp: 'かばん',   kana: 'かばん',     mean: 'tas',          lesson: 2 },
  { id: 'n_kasa',      jp: '傘',       kana: 'かさ',       mean: 'payung',       lesson: 2 },
  { id: 'n_kutsu',     jp: '靴',       kana: 'くつ',       mean: 'sepatu',       lesson: 3 },
  { id: 'n_denwa',     jp: '電話',     kana: 'でんわ',     mean: 'telepon',      lesson: 3 },
  { id: 'n_pasokon',   jp: 'パソコン', kana: 'パソコン',   mean: 'komputer',     lesson: 7 },
  { id: 'n_chiketto',  jp: 'チケット', kana: 'チケット',   mean: 'tiket',        lesson: 9 },
  { id: 'n_mizu',      jp: '水',       kana: 'みず',       mean: 'air',          lesson: 6 },
  { id: 'n_koohii',    jp: 'コーヒー', kana: 'コーヒー',   mean: 'kopi',         lesson: 2 },
  { id: 'n_pan',       jp: 'パン',     kana: 'パン',       mean: 'roti',         lesson: 6 },
  { id: 'n_okane',     jp: 'お金',     kana: 'おかね',     mean: 'uang',         lesson: 7 },
  { id: 'n_yama',      jp: '山',       kana: 'やま',       mean: 'gunung',       lesson: 8 },
];

/* Tempat */
const V_PLACES = [
  { id: 'n_daigaku',     jp: '大学',     kana: 'だいがく',     mean: 'universitas',  lesson: 1 },
  { id: 'n_byouin',      jp: '病院',     kana: 'びょういん',   mean: 'rumah sakit',  lesson: 1 },
  { id: 'n_kyoushitsu',  jp: '教室',     kana: 'きょうしつ',   mean: 'ruang kelas',  lesson: 3 },
  { id: 'n_jimusho',     jp: '事務所',   kana: 'じむしょ',     mean: 'kantor',       lesson: 3 },
  { id: 'n_heya',        jp: '部屋',     kana: 'へや',         mean: 'kamar',        lesson: 3 },
  { id: 'n_toire',       jp: 'トイレ',   kana: 'トイレ',       mean: 'toilet',       lesson: 3 },
  { id: 'n_kaisha',      jp: '会社',     kana: 'かいしゃ',     mean: 'perusahaan',   lesson: 3 },
  { id: 'n_shokudou',    jp: '食堂',     kana: 'しょくどう',   mean: 'kantin',       lesson: 3 },
  { id: 'n_kaigishitsu', jp: '会議室',   kana: 'かいぎしつ',   mean: 'ruang rapat',  lesson: 3 },
  { id: 'n_uchi',        jp: 'うち',     kana: 'うち',         mean: 'rumah',        lesson: 3 },
  { id: 'n_kuni',        jp: '国',       kana: 'くに',         mean: 'negara asal',  lesson: 3 },
  { id: 'n_yuubinkyoku', jp: '郵便局',   kana: 'ゆうびんきょく', mean: 'kantor pos', lesson: 4 },
  { id: 'n_ginkou',      jp: '銀行',     kana: 'ぎんこう',     mean: 'bank',         lesson: 4 },
  { id: 'n_toshokan',    jp: '図書館',   kana: 'としょかん',   mean: 'perpustakaan', lesson: 4 },
  { id: 'n_depaato',     jp: 'デパート', kana: 'デパート',     mean: 'toserba',      lesson: 4 },
  { id: 'n_eki',         jp: '駅',       kana: 'えき',         mean: 'stasiun',      lesson: 5 },
  { id: 'n_biru',        jp: 'ビル',     kana: 'ビル',         mean: 'gedung',       lesson: 10 },
  { id: 'n_suupaa',      jp: 'スーパー', kana: 'スーパー',     mean: 'supermarket',  lesson: 5 },
  { id: 'n_gakkou',      jp: '学校',     kana: 'がっこう',     mean: 'sekolah',      lesson: 5 },
  { id: 'n_kuukou',      jp: '空港',     kana: 'くうこう',     mean: 'bandara',      lesson: 5 },
  { id: 'n_resutoran',   jp: 'レストラン', kana: 'レストラン', mean: 'restoran',     lesson: 6 },
  { id: 'n_mise',        jp: '店',       kana: 'みせ',         mean: 'toko',         lesson: 6 },
  { id: 'n_niwa',        jp: '庭',       kana: 'にわ',         mean: 'halaman',      lesson: 6 },
  { id: 'n_ryou',        jp: '寮',       kana: 'りょう',       mean: 'asrama',       lesson: 8 },
  { id: 'n_machi',       jp: '町',       kana: 'まち',         mean: 'kota',         lesson: 8 },
  { id: 'n_kouen',       jp: '公園',     kana: 'こうえん',     mean: 'taman',        lesson: 10 },
  { id: 'n_kissaten',    jp: '喫茶店',   kana: 'きっさてん',   mean: 'kedai kopi',   lesson: 10 },
  { id: 'n_honya',       jp: '本屋',     kana: 'ほんや',       mean: 'toko buku',    lesson: 10 },
  { id: 'n_noriba',      jp: '乗り場',   kana: 'のりば',       mean: 'tempat naik',  lesson: 10 },
  { id: 'n_konbini',     jp: 'コンビニ', kana: 'コンビニ',     mean: 'minimarket',   lesson: 10 },
];

/* Makhluk hidup (pakai います) */
const V_LIVINGS = [
  { id: 'n_sensei',       jp: '先生',     kana: 'せんせい',     mean: 'guru',           lesson: 1 },
  { id: 'n_gakusei',      jp: '学生',     kana: 'がくせい',     mean: 'pelajar',        lesson: 1 },
  { id: 'n_kaishain',     jp: '会社員',   kana: 'かいしゃいん', mean: 'karyawan',       lesson: 1 },
  { id: 'n_isha',         jp: '医者',     kana: 'いしゃ',       mean: 'dokter',         lesson: 1 },
  { id: 'n_ginkouin',     jp: '銀行員',   kana: 'ぎんこういん', mean: 'pegawai bank',   lesson: 1 },
  { id: 'n_ryuugakusei',  jp: '留学生',   kana: 'りゅうがくせい', mean: 'pelajar asing', lesson: 1 },
  { id: 'n_hito',         jp: '人',       kana: 'ひと',         mean: 'orang',          lesson: 1 },
  { id: 'n_tomodachi',    jp: '友達',     kana: 'ともだち',     mean: 'teman',          lesson: 5 },
  { id: 'n_kazoku',       jp: '家族',     kana: 'かぞく',       mean: 'keluarga',       lesson: 5 },
  { id: 'n_otousan',      jp: 'お父さん', kana: 'おとうさん',   mean: 'ayah',           lesson: 7 },
  { id: 'n_okaasan',      jp: 'お母さん', kana: 'おかあさん',   mean: 'ibu',            lesson: 7 },
  { id: 'n_kodomo',       jp: '子ども',   kana: 'こども',       mean: 'anak',           lesson: 9 },
  { id: 'n_inu',          jp: '犬',       kana: 'いぬ',         mean: 'anjing',         lesson: 10 },
  { id: 'n_neko',         jp: '猫',       kana: 'ねこ',         mean: 'kucing',         lesson: 10 },
  { id: 'n_zou',          jp: '象',       kana: 'ぞう',         mean: 'gajah',          lesson: 10 },
  { id: 'n_panda',        jp: 'パンダ',   kana: 'パンダ',       mean: 'panda',          lesson: 10 },
  { id: 'n_sakana',       jp: '魚',       kana: 'さかな',       mean: 'ikan',           lesson: 6 },
  { id: 'n_otokonohito',  jp: '男の人',   kana: 'おとこのひと', mean: 'laki-laki',      lesson: 10 },
  { id: 'n_onnanohito',   jp: '女の人',   kana: 'おんなのひと', mean: 'perempuan',      lesson: 10 },
  { id: 'n_otokonoko',    jp: '男の子',   kana: 'おとこのこ',   mean: 'anak laki-laki', lesson: 10 },
  { id: 'n_onnanoko',     jp: '女の子',   kana: 'おんなのこ',   mean: 'anak perempuan', lesson: 10 },
];

const V_PARTICLES = [
  { id: 'p_wa', jp: 'は', kana: 'は', mean: 'partikel topik (～は)',            lesson: 1,  romaji: 'wa' },
  { id: 'p_ga', jp: 'が', kana: 'が', mean: 'partikel penanda subjek (～が)',   lesson: 1,  romaji: 'ga' },
  { id: 'p_ni', jp: 'に', kana: 'に', mean: 'partikel tempat (～に)',           lesson: 2,  romaji: 'ni' },
  { id: 'p_no', jp: 'の', kana: 'の', mean: 'partikel penghubung (～の)',       lesson: 2,  romaji: 'no' },
  { id: 'p_to', jp: 'と', kana: 'と', mean: 'partikel "dan" (daftar lengkap)', lesson: 5,  romaji: 'to' },
  { id: 'p_ya', jp: 'や', kana: 'や', mean: 'partikel "dan" (daftar sebagian)', lesson: 10, romaji: 'ya' },
  { id: 'p_mo', jp: 'も', kana: 'も', mean: 'partikel "juga" (～も)',           lesson: 1,  romaji: 'mo' },
];

const V_EXPRS = [
  { id: 'e_doko',      jp: 'どこ',   kana: 'どこ',   mean: 'di mana',        lesson: 3 },
  { id: 'e_dare',      jp: 'だれ',   kana: 'だれ',   mean: 'siapa',          lesson: 1 },
  { id: 'e_nani',      jp: '何',     kana: 'なに',   mean: 'apa',            lesson: 2 },
  { id: 'e_dore',      jp: 'どれ',   kana: 'どれ',   mean: 'yang mana',      lesson: 2 },
  { id: 'e_nado',      jp: 'など',   kana: 'など',   mean: 'dan lain-lain',  lesson: 10 },
  { id: 'e_doumo',     jp: 'どうも すみません', kana: 'どうも すみません', mean: 'terima kasih (sudah merepotkan)', lesson: 10 },
  { id: 'e_suminasen', jp: 'すみません', kana: 'すみません', mean: 'permisi / maaf', lesson: 2 },
  { id: 'e_arigatou',  jp: 'ありがとう ございます', kana: 'ありがとう ございます', mean: 'terima kasih', lesson: 2 },
  { id: 'e_hai',       jp: 'はい',   kana: 'はい',   mean: 'ya',             lesson: 1 },
  { id: 'e_iie',       jp: 'いいえ', kana: 'いいえ', mean: 'tidak',          lesson: 1 },
  { id: 'e_ee',        jp: 'ええ',   kana: 'ええ',   mean: 'ya (santai)',    lesson: 6 },
  { id: 'e_soudesuka', jp: 'そうですか', kana: 'そうですか', mean: 'begitu ya', lesson: 2 },
];

/* Tokoh standar Minna no Nihongo (dipakai pada percakapan) */
const V_NAMES = [
  { id: 'nm_miraa',    jp: 'ミラーさん',   kana: 'ミラーさん',   mean: 'Sdr. Miller',   lesson: 1 },
  { id: 'nm_watto',    jp: 'ワットさん',   kana: 'ワットさん',   mean: 'Sdr. Watt',     lesson: 1 },
  { id: 'nm_yamada',   jp: '山田さん',     kana: 'やまださん',   mean: 'Sdr. Yamada',   lesson: 1 },
  { id: 'nm_matsumoto', jp: '松本さん',    kana: 'まつもとさん', mean: 'Sdr. Matsumoto', lesson: 1 },
  { id: 'nm_santosu',  jp: 'サントスさん', kana: 'サントスさん', mean: 'Sdr. Santos',   lesson: 1 },
  { id: 'nm_karina',   jp: 'カリナさん',   kana: 'カリナさん',   mean: 'Sdr. Karina',   lesson: 1 },
  { id: 'nm_rin',      jp: 'リンさん',     kana: 'リンさん',     mean: 'Sdr. Rin',      lesson: 1 },
  { id: 'nm_kimu',     jp: 'キムさん',     kana: 'キムさん',     mean: 'Sdr. Kim',      lesson: 1 },
];

const ALL_WORDS = [...V_VERBS, ...V_POS, ...V_THINGS, ...V_PLACES, ...V_LIVINGS,
                   ...V_PARTICLES, ...V_EXPRS, ...V_NAMES];
ALL_WORDS.forEach(w => { if (!w.romaji) w.romaji = toRomaji(w.kana); });

const THING = {};   V_THINGS.forEach(w => { THING[w.id] = w; });
const PLACE = {};   V_PLACES.forEach(w => { PLACE[w.id] = w; });
const LIVE = {};    V_LIVINGS.forEach(w => { LIVE[w.id] = w; });
const POS = {};     V_POS.forEach(w => { POS[w.id] = w; });
const PART = {};    V_PARTICLES.forEach(w => { PART[w.id] = w; });
const EXPR = {};    V_EXPRS.forEach(w => { EXPR[w.id] = w; });
const NAME = {};    V_NAMES.forEach(w => { NAME[w.id] = w; });
const VERB = {};    V_VERBS.forEach(w => { VERB[w.id] = w; });
const W = id => THING[id] || PLACE[id] || LIVE[id] || POS[id] || PART[id] || EXPR[id] || NAME[id] || VERB[id];
const VALID_VOCAB = new Set(ALL_WORDS.map(w => w.id));
const POS_IDS = V_POS.map(p => p.id);
const PLACE_IDS = V_PLACES.map(p => p.id);
const THING_IDS = V_THINGS.map(p => p.id);
const LIVE_IDS = V_LIVINGS.map(p => p.id);

/* Kosakata final untuk js/data/vocab_bab10.js (tanpa entri bantu "hidden") */
const VOCAB_BAB10 = [
  ...V_VERBS.filter(v => !v.hidden).map(v => ({ id: v.id, jp: v.jp, kana: v.kana, romaji: v.romaji, id_mean: v.mean, type: 'verb', lesson: v.lesson })),
  ...V_POS.map(v => ({ id: v.id, jp: v.jp, kana: v.kana, romaji: v.romaji, id_mean: v.mean, type: 'position', lesson: v.lesson })),
  ...V_THINGS.map(v => ({ id: v.id, jp: v.jp, kana: v.kana, romaji: v.romaji, id_mean: v.mean, type: 'noun', lesson: v.lesson })),
  ...V_PLACES.map(v => ({ id: v.id, jp: v.jp, kana: v.kana, romaji: v.romaji, id_mean: v.mean, type: 'noun_place', lesson: v.lesson })),
  ...V_LIVINGS.map(v => ({ id: v.id, jp: v.jp, kana: v.kana, romaji: v.romaji, id_mean: v.mean, type: 'noun_living', lesson: v.lesson })),
  ...V_PARTICLES.map(v => ({ id: v.id, jp: v.jp, kana: v.kana, romaji: v.romaji, id_mean: v.mean, type: 'particle', lesson: v.lesson })),
  ...V_EXPRS.map(v => ({ id: v.id, jp: v.jp, kana: v.kana, romaji: v.romaji, id_mean: v.mean, type: 'expr', lesson: v.lesson })),
];

/* ==========================================================================
 * BAGIAN 3 — KURASI PASANGAN (kewajaran makna)
 *   Semua pasangan di bawah sudah diperiksa: benda/orang hanya dipasangkan
 *   dengan tempat yang wajar dalam kehidupan sehari-hari.
 * ========================================================================*/

/* Benda mati yang wajar ada di sebuah tempat */
const PLACE_THINGS = {
  n_heya:        ['n_tsukue', 'n_beddo', 'n_terebi', 'n_denwa', 'n_tokei', 'n_mado', 'n_tana', 'n_doa'],
  n_kyoushitsu:  ['n_tsukue', 'n_isu', 'n_terebi', 'n_tokei', 'n_mado', 'n_doa'],
  n_jimusho:     ['n_tsukue', 'n_isu', 'n_pasokon', 'n_denwa', 'n_terebi', 'n_tokei'],
  n_kaigishitsu: ['n_tsukue', 'n_isu', 'n_terebi', 'n_tokei', 'n_mado'],
  n_shokudou:    ['n_teeburu', 'n_isu', 'n_terebi', 'n_tokei'],
  n_toshokan:    ['n_hon', 'n_jisho', 'n_zasshi', 'n_shinbun', 'n_tsukue', 'n_isu', 'n_tokei'],
  n_honya:       ['n_hon', 'n_jisho', 'n_zasshi', 'n_shinbun', 'n_techo', 'n_kaado'],
  n_suupaa:      ['n_hana', 'n_mizu', 'n_koohii', 'n_sakana', 'n_pan'],
  n_konbini:     ['n_mizu', 'n_koohii', 'n_shinbun', 'n_zasshi', 'n_pan', 'n_hana'],
  n_depaato:     ['n_kutsu', 'n_kaban', 'n_tokei', 'n_hana', 'n_kamera', 'n_kasa'],
  n_kissaten:    ['n_koohii', 'n_terebi', 'n_hana', 'n_tokei'],
  n_resutoran:   ['n_hana', 'n_terebi', 'n_tokei', 'n_koohii'],
  n_yuubinkyoku: ['n_posuto', 'n_tokei', 'n_mado'],
  n_ginkou:      ['n_tokei', 'n_denwa', 'n_mado'],
  n_gakkou:      ['n_hana', 'n_ki', 'n_tokei', 'n_terebi', 'n_tsukue'],
  n_daigaku:     ['n_toshokan', 'n_hana', 'n_ki', 'n_tsukue'],
  n_kouen:       ['n_ki', 'n_hana'],
  n_niwa:        ['n_ki', 'n_hana', 'n_kuruma'],
  n_eki:         ['n_mise', 'n_posuto', 'n_denwa', 'n_tokei', 'n_hana'],
  n_ryou:        ['n_tsukue', 'n_beddo', 'n_terebi', 'n_reizouko', 'n_denwa', 'n_tokei'],
  n_kaisha:      ['n_tsukue', 'n_isu', 'n_pasokon', 'n_denwa', 'n_terebi', 'n_tokei'],
  n_biru:        ['n_mise', 'n_ginkou', 'n_jimusho', 'n_toshokan'],
  n_byouin:      ['n_hana', 'n_denwa', 'n_tokei', 'n_mado'],
  n_toire:       ['n_hana', 'n_mado', 'n_doa'],
  n_uchi:        ['n_terebi', 'n_denwa', 'n_reizouko', 'n_teeburu', 'n_isu', 'n_tokei',
                  'n_kuruma', 'n_mado', 'n_tsukue', 'n_beddo', 'n_suitchi'],
  n_mise:        ['n_hana', 'n_hon', 'n_kutsu', 'n_kamera', 'n_tokei', 'n_pan'],
  n_kuukou:      ['n_mise', 'n_denwa', 'n_tokei'],
  n_machi:       ['n_mise', 'n_ginkou', 'n_yuubinkyoku', 'n_kouen'],
  n_kuni:        [],
};

/* Makhluk hidup yang wajar ada di sebuah tempat */
const PLACE_LIVINGS = {
  n_heya:        ['n_neko', 'n_inu', 'n_hito', 'n_otokonoko', 'n_onnanoko', 'n_kodomo', 'n_gakusei'],
  n_kyoushitsu:  ['n_gakusei', 'n_sensei', 'n_kodomo', 'n_otokonoko', 'n_onnanoko', 'n_hito', 'n_ryuugakusei'],
  n_jimusho:     ['n_kaishain', 'n_otokonohito', 'n_onnanohito', 'n_hito'],
  n_kaigishitsu: ['n_kaishain', 'n_otokonohito', 'n_hito'],
  n_shokudou:    ['n_gakusei', 'n_kaishain', 'n_hito', 'n_otokonohito'],
  n_toshokan:    ['n_gakusei', 'n_hito', 'n_ryuugakusei'],
  n_honya:       ['n_hito', 'n_onnanohito', 'n_gakusei'],
  n_kouen:       ['n_kodomo', 'n_otokonoko', 'n_onnanoko', 'n_inu', 'n_neko', 'n_hito', 'n_tomodachi'],
  n_niwa:        ['n_inu', 'n_neko', 'n_kodomo', 'n_hito'],
  n_eki:         ['n_gakusei', 'n_kaishain', 'n_tomodachi', 'n_hito', 'n_otokonohito', 'n_onnanohito'],
  n_ginkou:      ['n_ginkouin', 'n_onnanohito', 'n_otokonohito', 'n_hito'],
  n_byouin:      ['n_isha', 'n_sensei', 'n_hito', 'n_okaasan'],
  n_kaisha:      ['n_kaishain', 'n_otokonohito', 'n_onnanohito', 'n_tomodachi', 'n_hito'],
  n_daigaku:     ['n_gakusei', 'n_ryuugakusei', 'n_sensei', 'n_tomodachi'],
  n_gakkou:      ['n_gakusei', 'n_sensei', 'n_kodomo', 'n_tomodachi'],
  n_suupaa:      ['n_onnanohito', 'n_hito', 'n_kodomo', 'n_tomodachi'],
  n_konbini:     ['n_hito', 'n_kaishain', 'n_gakusei'],
  n_kissaten:    ['n_tomodachi', 'n_onnanohito', 'n_otokonohito', 'n_hito'],
  n_resutoran:   ['n_tomodachi', 'n_kazoku', 'n_hito'],
  n_ryou:        ['n_gakusei', 'n_tomodachi', 'n_ryuugakusei', 'n_hito'],
  n_uchi:        ['n_okaasan', 'n_otousan', 'n_kazoku', 'n_neko', 'n_inu', 'n_hito'],
  n_kuni:        ['n_kazoku', 'n_tomodachi', 'n_otousan', 'n_okaasan'],
  n_kuukou:      ['n_hito', 'n_tomodachi', 'n_gakusei', 'n_kaishain'],
  n_depaato:     ['n_hito', 'n_onnanohito', 'n_kodomo', 'n_tomodachi'],
  n_mise:        ['n_hito', 'n_onnanohito', 'n_otokonohito'],
  n_machi:       ['n_hito', 'n_kodomo', 'n_tomodachi'],
  n_biru:        ['n_hito', 'n_kaishain'],
  n_yuubinkyoku: ['n_hito', 'n_ginkouin'],
};

/* Acuan untuk frasa posisi (N1 の N2) + benda/makhluk yang wajar di posisi itu */
const POS_FRAME_DATA = {
  pos_ue: [
    { ref: 'n_tsukue',     things: ['n_hon', 'n_enpitsu', 'n_keshigomu', 'n_tokei', 'n_kamera', 'n_zasshi', 'n_denwa'], livings: ['n_neko'] },
    { ref: 'n_teeburu',    things: ['n_mizu', 'n_koohii', 'n_pan', 'n_hana', 'n_hon', 'n_shinbun'],                    livings: ['n_neko'] },
    { ref: 'n_isu',        things: ['n_kaban', 'n_hon', 'n_kaado'],                                                    livings: ['n_neko'] },
    { ref: 'n_tana',       things: ['n_hon', 'n_jisho', 'n_tokei', 'n_kamera', 'n_hana', 'n_denchi'],                  livings: [] },
    { ref: 'n_reizouko',   things: ['n_hana', 'n_mizu', 'n_koohii', 'n_denchi'],                                       livings: [] },
    { ref: 'n_beddo',      things: ['n_kaban', 'n_hon', 'n_nooto'],                                                    livings: ['n_neko', 'n_inu'] },
  ],
  pos_shita: [
    { ref: 'n_tsukue',   things: ['n_kaban', 'n_nooto', 'n_keshigomu', 'n_kutsu'], livings: ['n_neko', 'n_inu'] },
    { ref: 'n_teeburu',  things: ['n_kaban', 'n_kutsu', 'n_kasa'],                 livings: ['n_neko', 'n_inu'] },
    { ref: 'n_isu',      things: ['n_kaban', 'n_keshigomu', 'n_hon'],              livings: ['n_neko'] },
    { ref: 'n_beddo',    things: ['n_kaban', 'n_kutsu', 'n_hon'],                  livings: ['n_neko', 'n_inu'] },
    { ref: 'n_tana',     things: ['n_kaban', 'n_kutsu', 'n_hako'],                 livings: [] },
  ],
  pos_mae: [
    { ref: 'n_eki',       things: ['n_kuruma', 'n_hana', 'n_posuto', 'n_ki', 'n_mise'], livings: ['n_hito', 'n_tomodachi', 'n_gakusei', 'n_kodomo'] },
    { ref: 'n_ginkou',    things: ['n_kuruma', 'n_hana', 'n_ki'],                        livings: ['n_hito', 'n_onnanohito', 'n_tomodachi'] },
    { ref: 'n_gakkou',    things: ['n_kuruma', 'n_hana', 'n_ki'],                        livings: ['n_gakusei', 'n_kodomo', 'n_hito'] },
    { ref: 'n_depaato',   things: ['n_kuruma', 'n_hana', 'n_posuto'],                    livings: ['n_hito', 'n_tomodachi'] },
    { ref: 'n_byouin',    things: ['n_kuruma', 'n_hana'],                                livings: ['n_hito', 'n_tomodachi'] },
    { ref: 'n_honya',     things: ['n_hana', 'n_posuto'],                                livings: ['n_hito'] },
    { ref: 'n_jimusho',   things: ['n_kuruma', 'n_hana'],                                livings: ['n_hito', 'n_otokonohito'] },
    { ref: 'n_kyoushitsu', things: ['n_hana'],                                           livings: ['n_gakusei', 'n_sensei', 'n_hito'] },
    { ref: 'n_shokudou',   things: ['n_teeburu', 'n_isu'],                                livings: ['n_gakusei', 'n_hito'] },
    { ref: 'n_kaigishitsu', things: ['n_tsukue', 'n_isu'],                                livings: ['n_kaishain', 'n_hito'] },
    { ref: 'n_uchi',      things: ['n_kuruma', 'n_hana', 'n_ki'],                        livings: ['n_hito', 'n_neko', 'n_inu'] },
    { ref: 'n_tsukue',    things: ['n_isu', 'n_kaban'],                                  livings: [] },
    { ref: 'n_terebi',    things: ['n_isu'],                                             livings: ['n_neko', 'n_kodomo'] },
    { ref: 'n_mise',      things: ['n_kuruma', 'n_hana', 'n_ki'],                        livings: ['n_hito'] },
  ],
  pos_ushiro: [
    { ref: 'n_eki',        things: ['n_kuruma', 'n_ki', 'n_hana'],        livings: ['n_hito', 'n_tomodachi'] },
    { ref: 'n_gakkou',     things: ['n_ki', 'n_kuruma'],                  livings: ['n_gakusei', 'n_kodomo', 'n_hito'] },
    { ref: 'n_biru',       things: ['n_ki', 'n_kuruma'],                  livings: ['n_hito'] },
    { ref: 'n_byouin',     things: ['n_kuruma', 'n_ki'],                  livings: ['n_hito'] },
    { ref: 'n_uchi',       things: ['n_ki', 'n_kuruma'],                  livings: ['n_inu', 'n_neko', 'n_hito'] },
    { ref: 'n_yuubinkyoku', things: ['n_ki', 'n_posuto'],                 livings: ['n_hito'] },
    { ref: 'n_kuruma',     things: [],                                    livings: ['n_hito', 'n_kodomo', 'n_tomodachi', 'n_inu'] },
    { ref: 'n_ki',         things: [],                                    livings: ['n_neko', 'n_inu', 'n_hito'] },
    { ref: 'n_mise',       things: ['n_kuruma', 'n_ki'],                  livings: ['n_hito'] },
  ],
  pos_migi: [
    { ref: 'n_mado',     things: ['n_tana', 'n_tsukue', 'n_isu', 'n_terebi', 'n_hana', 'n_tokei'], livings: ['n_neko', 'n_hito'] },
    { ref: 'n_doa',      things: ['n_tana', 'n_tsukue', 'n_isu', 'n_hana', 'n_tokei'],             livings: ['n_neko', 'n_hito'] },
    { ref: 'n_tsukue',   things: ['n_isu', 'n_tana', 'n_kaban', 'n_hana'],                        livings: ['n_neko'] },
    { ref: 'n_terebi',   things: ['n_isu', 'n_tana', 'n_hana'],                                   livings: ['n_neko'] },
    { ref: 'n_ginkou',   things: ['n_mise', 'n_hana', 'n_kuruma'],                                livings: ['n_hito'] },
    { ref: 'n_eki',      things: ['n_mise', 'n_hana', 'n_kuruma'],                                livings: ['n_hito', 'n_tomodachi'] },
    { ref: 'n_reizouko', things: ['n_tana', 'n_tsukue', 'n_teeburu'],                             livings: [] },
    { ref: 'n_kyoushitsu', things: ['n_tana', 'n_tsukue', 'n_hana'],                             livings: ['n_gakusei'] },
    { ref: 'n_jimusho',  things: ['n_tana', 'n_tsukue', 'n_pasokon'],                            livings: ['n_kaishain', 'n_hito'] },
  ],
  pos_hidari: [
    { ref: 'n_mado',     things: ['n_tana', 'n_tsukue', 'n_isu', 'n_terebi', 'n_hana', 'n_tokei'], livings: ['n_neko', 'n_hito'] },
    { ref: 'n_doa',      things: ['n_tana', 'n_tsukue', 'n_isu', 'n_hana', 'n_tokei'],             livings: ['n_neko', 'n_hito'] },
    { ref: 'n_tsukue',   things: ['n_isu', 'n_tana', 'n_kaban', 'n_hana'],                        livings: ['n_neko'] },
    { ref: 'n_terebi',   things: ['n_isu', 'n_tana', 'n_hana'],                                   livings: ['n_neko'] },
    { ref: 'n_ginkou',   things: ['n_mise', 'n_hana', 'n_kuruma'],                                livings: ['n_hito'] },
    { ref: 'n_eki',      things: ['n_mise', 'n_hana', 'n_kuruma'],                                livings: ['n_hito', 'n_tomodachi'] },
    { ref: 'n_reizouko', things: ['n_tana', 'n_tsukue', 'n_teeburu'],                             livings: [] },
    { ref: 'n_kyoushitsu', things: ['n_tana', 'n_tsukue', 'n_hana'],                             livings: ['n_gakusei'] },
    { ref: 'n_jimusho',  things: ['n_tana', 'n_tsukue', 'n_pasokon'],                            livings: ['n_kaishain', 'n_hito'] },
  ],
  pos_naka: [
    { ref: 'n_hako',      things: ['n_enpitsu', 'n_keshigomu', 'n_hon', 'n_nooto', 'n_denchi', 'n_firumu', 'n_chiketto', 'n_okane', 'n_kamera'], livings: ['n_neko'] },
    { ref: 'n_reizouko',  things: ['n_mizu', 'n_koohii', 'n_sakana', 'n_pan'],                    livings: [] },
    { ref: 'n_kaban',     things: ['n_hon', 'n_nooto', 'n_jisho', 'n_chiketto', 'n_okane', 'n_kamera'], livings: [] },
    { ref: 'n_tana',      things: ['n_hon', 'n_jisho', 'n_hako', 'n_kamera', 'n_denchi'],         livings: [] },
    { ref: 'n_tsukue',    things: ['n_hon', 'n_nooto', 'n_enpitsu', 'n_keshigomu', 'n_chiketto'], livings: [] },
    { ref: 'n_heya',      things: ['n_tsukue', 'n_beddo', 'n_terebi', 'n_denwa', 'n_tokei'],      livings: ['n_neko', 'n_inu', 'n_hito', 'n_kodomo'] },
    { ref: 'n_kyoushitsu', things: ['n_tsukue', 'n_isu', 'n_terebi'],                             livings: ['n_gakusei', 'n_sensei', 'n_kodomo', 'n_hito'] },
    { ref: 'n_kaisha',    things: ['n_tsukue', 'n_isu', 'n_pasokon', 'n_denwa'],                  livings: ['n_kaishain', 'n_hito'] },
    { ref: 'n_depaato',   things: ['n_mise', 'n_kutsu', 'n_kaban', 'n_tokei', 'n_hana'],          livings: ['n_hito', 'n_onnanohito'] },
    { ref: 'n_mise',      things: ['n_hana', 'n_hon', 'n_kutsu', 'n_kamera'],                     livings: ['n_hito'] },
    { ref: 'n_toshokan',  things: ['n_hon', 'n_jisho', 'n_zasshi', 'n_shinbun', 'n_tsukue', 'n_isu'], livings: ['n_gakusei', 'n_hito'] },
    { ref: 'n_kuruma',    things: ['n_kaban', 'n_kasa', 'n_kamera'],                              livings: ['n_hito', 'n_kodomo', 'n_tomodachi'] },
    { ref: 'n_uchi',      things: ['n_terebi', 'n_denwa', 'n_reizouko', 'n_teeburu'],             livings: ['n_kazoku', 'n_neko', 'n_inu'] },
  ],
  pos_soto: [
    { ref: 'n_heya',      things: ['n_hana', 'n_ki', 'n_kuruma', 'n_posuto'], livings: ['n_hito', 'n_kodomo', 'n_neko', 'n_inu'] },
    { ref: 'n_kyoushitsu', things: ['n_ki', 'n_hana'],                        livings: ['n_gakusei', 'n_kodomo', 'n_hito'] },
    { ref: 'n_uchi',      things: ['n_kuruma', 'n_ki', 'n_hana', 'n_posuto'], livings: ['n_inu', 'n_neko', 'n_hito'] },
    { ref: 'n_biru',      things: ['n_kuruma', 'n_ki', 'n_hana', 'n_posuto'], livings: ['n_hito', 'n_tomodachi'] },
    { ref: 'n_mise',      things: ['n_kuruma', 'n_hana'],                     livings: ['n_hito'] },
    { ref: 'n_kuruma',    things: [],                                         livings: ['n_hito', 'n_kodomo', 'n_inu'] },
    { ref: 'n_jimusho',   things: ['n_kuruma', 'n_hana', 'n_posuto'],         livings: ['n_hito'] },
  ],
  pos_tonari: [
    { ref: 'n_eki',         things: ['n_mise', 'n_ginkou', 'n_konbini', 'n_kissaten', 'n_hana', 'n_kuruma', 'n_posuto'], livings: ['n_hito', 'n_tomodachi'] },
    { ref: 'n_ginkou',      things: ['n_yuubinkyoku', 'n_mise', 'n_konbini', 'n_hana'],                                  livings: ['n_hito'] },
    { ref: 'n_yuubinkyoku', things: ['n_ginkou', 'n_mise', 'n_hana', 'n_posuto'],                                        livings: ['n_hito'] },
    { ref: 'n_honya',       things: ['n_kissaten', 'n_hana'],                                                                 livings: ['n_hito', 'n_gakusei'] },
    { ref: 'n_depaato',     things: ['n_ginkou', 'n_kissaten', 'n_hana', 'n_kuruma'],                                    livings: ['n_hito', 'n_tomodachi'] },
    { ref: 'n_gakkou',      things: ['n_kouen', 'n_mise', 'n_hana', 'n_ki'],                                             livings: ['n_hito', 'n_kodomo'] },
    { ref: 'n_jimusho',     things: ['n_kaigishitsu', 'n_mise'],                                                         livings: ['n_hito', 'n_kaishain'] },
    { ref: 'n_kaigishitsu', things: ['n_tsukue', 'n_isu', 'n_tokei', 'n_hana'],                                          livings: ['n_kaishain', 'n_hito'] },
    { ref: 'n_shokudou',    things: ['n_teeburu', 'n_isu', 'n_kissaten'],                                               livings: ['n_hito', 'n_gakusei'] },
    { ref: 'n_uchi',        things: ['n_kouen', 'n_mise', 'n_ki'],                                                       livings: ['n_hito', 'n_inu'] },
    { ref: 'n_kissaten',    things: ['n_mise', 'n_hana'],                                                                livings: ['n_hito', 'n_tomodachi'] },
    { ref: 'n_konbini',     things: ['n_mise', 'n_hana'],                                                                livings: ['n_hito'] },
    { ref: 'n_kyoushitsu',  things: ['n_terebi', 'n_tokei', 'n_hana'],                                                   livings: ['n_gakusei', 'n_hito'] },
    { ref: 'n_reizouko',    things: ['n_tana', 'n_teeburu'],                                                             livings: [] },
  ],
  pos_chikaku: [
    { ref: 'n_eki',         things: ['n_mise', 'n_ginkou', 'n_konbini', 'n_kissaten', 'n_hana', 'n_posuto'], livings: ['n_hito', 'n_tomodachi'] },
    { ref: 'n_kouen',       things: ['n_mise', 'n_gakkou', 'n_hana', 'n_ki'],                                livings: ['n_hito', 'n_kodomo'] },
    { ref: 'n_gakkou',      things: ['n_kouen', 'n_mise', 'n_hana', 'n_ki'],                                 livings: ['n_gakusei', 'n_hito'] },
    { ref: 'n_ginkou',      things: ['n_mise', 'n_yuubinkyoku', 'n_hana'],                                   livings: ['n_hito'] },
    { ref: 'n_yuubinkyoku', things: ['n_ginkou', 'n_mise', 'n_posuto', 'n_hana'],                            livings: ['n_hito'] },
    { ref: 'n_uchi',        things: ['n_kouen', 'n_mise', 'n_suupaa', 'n_hana', 'n_ki'],                     livings: ['n_hito', 'n_inu', 'n_neko'] },
    { ref: 'n_byouin',      things: ['n_mise', 'n_hana'],                                                    livings: ['n_hito'] },
    { ref: 'n_daigaku',     things: ['n_mise', 'n_toshokan', 'n_hana', 'n_ki'],                              livings: ['n_gakusei', 'n_hito'] },
    { ref: 'n_toshokan',    things: ['n_gakkou', 'n_mise', 'n_hana'],                                        livings: ['n_gakusei', 'n_hito'] },
    { ref: 'n_kaisha',      things: ['n_mise', 'n_kissaten', 'n_konbini', 'n_hana'],                         livings: ['n_kaishain', 'n_hito'] },
    { ref: 'n_depaato',     things: ['n_mise', 'n_ginkou', 'n_hana'],                                        livings: ['n_hito'] },
    { ref: 'n_kissaten',    things: ['n_mise', 'n_hana'],                                                    livings: ['n_hito', 'n_tomodachi'] },
    { ref: 'n_suupaa',      things: ['n_mise', 'n_hana'],                                                    livings: ['n_onnanohito', 'n_hito'] },
    { ref: 'n_mise',        things: ['n_hana'],                                                               livings: ['n_hito'] },
    { ref: 'n_kuruma',      things: [],                                                                      livings: ['n_hito', 'n_kodomo'] },
    { ref: 'n_ki',          things: [],                                                                      livings: ['n_neko', 'n_inu', 'n_hito'] },
  ],
};

/* N1 と N2 の 間に …… */
const AIDA_FRAMES = [
  { a: 'n_yuubinkyoku', b: 'n_ginkou',   things: ['n_konbini', 'n_mise', 'n_hana', 'n_posuto', 'n_ki'],      livings: ['n_hito', 'n_tomodachi'] },
  { a: 'n_eki',         b: 'n_byouin',   things: ['n_ginkou', 'n_mise', 'n_hana', 'n_posuto', 'n_kissaten'], livings: ['n_hito'] },
  { a: 'n_gakkou',      b: 'n_kouen',    things: ['n_mise', 'n_hana', 'n_ki', 'n_konbini'],                  livings: ['n_hito', 'n_kodomo'] },
  { a: 'n_honya',       b: 'n_depaato',  things: ['n_kissaten', 'n_hana', 'n_ginkou', 'n_konbini'],          livings: ['n_hito'] },
  { a: 'n_ginkou',      b: 'n_suupaa',   things: ['n_mise', 'n_hana', 'n_posuto', 'n_konbini'],              livings: ['n_hito'] },
  { a: 'n_kaisha',      b: 'n_eki',      things: ['n_kissaten', 'n_ginkou', 'n_konbini', 'n_hana'],          livings: ['n_hito', 'n_kaishain'] },
  { a: 'n_toshokan',    b: 'n_yuubinkyoku', things: ['n_kouen', 'n_hana', 'n_mise'],                         livings: ['n_gakusei', 'n_hito'] },
  { a: 'n_resutoran',   b: 'n_ginkou',   things: ['n_hana', 'n_mise', 'n_konbini'],                          livings: ['n_hito'] },
  { a: 'n_ginkou',      b: 'n_byouin',   things: ['n_yuubinkyoku', 'n_hana', 'n_mise'],                      livings: ['n_hito'] },
  { a: 'n_eki',         b: 'n_kouen',    things: ['n_konbini', 'n_mise', 'n_hana', 'n_ki'],                  livings: ['n_hito', 'n_kodomo'] },
  { a: 'n_mise',        b: 'n_byouin',   things: ['n_posuto', 'n_hana', 'n_ki'],                             livings: ['n_hito'] },
  { a: 'n_daigaku',     b: 'n_eki',      things: ['n_ginkou', 'n_mise', 'n_hana', 'n_ki'],                   livings: ['n_gakusei', 'n_hito'] },
];

/* A さんと B さんの 間に C さんが います (pola 間 + 人) */
const AIDA_NAMES = [
  ['nm_miraa', 'nm_yamada', 'nm_rin'],
  ['nm_watto', 'nm_santosu', 'nm_matsumoto'],
  ['nm_karina', 'nm_kimu', 'nm_miraa'],
  ['nm_yamada', 'nm_santosu', 'nm_watto'],
  ['nm_rin', 'nm_matsumoto', 'nm_karina'],
  ['nm_matsumoto', 'nm_kimu', 'nm_santosu'],
];

/* ～や～など / ～と～ (daftar lengkap) */
const YANADO_FRAMES = [
  { ref: 'n_hako',  pos: 'pos_naka', items: ['n_enpitsu', 'n_keshigomu'], living: false },
  { ref: 'n_hako',  pos: 'pos_naka', items: ['n_hon', 'n_nooto'],         living: false },
  { ref: 'n_kaban', pos: 'pos_naka', items: ['n_jisho', 'n_nooto'],       living: false },
  { ref: 'n_kaban', pos: 'pos_naka', items: ['n_chiketto', 'n_okane'],    living: false },
  { ref: 'n_kaban', pos: 'pos_naka', items: ['n_kamera', 'n_techo'],      living: false },
  { ref: 'n_reizouko', pos: 'pos_naka', items: ['n_mizu', 'n_koohii'],    living: false },
  { ref: 'n_reizouko', pos: 'pos_naka', items: ['n_sakana', 'n_pan'],     living: false },
  { ref: 'n_tsukue', pos: 'pos_ue', items: ['n_hon', 'n_jisho'],          living: false },
  { ref: 'n_tsukue', pos: 'pos_ue', items: ['n_enpitsu', 'n_keshigomu'],  living: false },
  { ref: 'n_tsukue', pos: 'pos_ue', items: ['n_kamera', 'n_techo'],       living: false },
  { ref: 'n_tana',   pos: 'pos_ue', items: ['n_hon', 'n_zasshi'],         living: false },
  { ref: 'n_tana',   pos: 'pos_ue', items: ['n_tokei', 'n_kamera'],       living: false },
  { ref: 'n_toshokan',  place: true, items: ['n_hon', 'n_jisho'],         living: false },
  { ref: 'n_honya',     place: true, items: ['n_zasshi', 'n_shinbun'],    living: false },
  { ref: 'n_depaato',   place: true, items: ['n_kutsu', 'n_kaban'],       living: false },
  { ref: 'n_depaato',   place: true, items: ['n_tokei', 'n_kamera'],      living: false },
  { ref: 'n_kyoushitsu', place: true, items: ['n_tsukue', 'n_isu'],       living: false },
  { ref: 'n_kyoushitsu', place: true, items: ['n_gakusei', 'n_sensei'],   living: true },
  { ref: 'n_kouen',     place: true, items: ['n_ki', 'n_hana'],           living: false },
  { ref: 'n_kouen',     place: true, items: ['n_inu', 'n_neko'],          living: true },
  { ref: 'n_niwa',      place: true, items: ['n_ki', 'n_hana'],           living: false },
  { ref: 'n_niwa',      place: true, items: ['n_inu', 'n_neko'],          living: true },
  { ref: 'n_machi',     place: true, items: ['n_ginkou', 'n_yuubinkyoku'], living: false },
  { ref: 'n_machi',     place: true, items: ['n_mise', 'n_kouen'],        living: false },
  { ref: 'n_heya',      place: true, items: ['n_tsukue', 'n_beddo'],      living: false },
  { ref: 'n_heya',      place: true, items: ['n_terebi', 'n_denwa'],      living: false },
  { ref: 'n_uchi',      place: true, items: ['n_reizouko', 'n_terebi'],   living: false },
  { ref: 'n_uchi',      place: true, items: ['n_inu', 'n_neko'],          living: true },
  { ref: 'n_suupaa',    place: true, items: ['n_mizu', 'n_koohii'],       living: false },
  { ref: 'n_suupaa',    place: true, items: ['n_sakana', 'n_pan'],        living: false },
  { ref: 'n_konbini',   place: true, items: ['n_mizu', 'n_pan'],          living: false },
  { ref: 'n_eki',       place: true, items: ['n_kissaten', 'n_mise'],     living: false },
  { ref: 'n_daigaku',   place: true, items: ['n_toshokan', 'n_kyoushitsu'], living: false },
  { ref: 'n_gakkou',    place: true, items: ['n_kyoushitsu', 'n_toshokan'], living: false },
  { ref: 'n_kaisha',    place: true, items: ['n_tsukue', 'n_isu'],        living: false },
  { ref: 'n_kaisha',    place: true, items: ['n_pasokon', 'n_denwa'],     living: false },
];

/* ==========================================================================
 * BAGIAN 4 — PERAKIT KALIMAT (bank kalimat bertanda pola)
 * ========================================================================*/
const PRED = {
  arimasu:  T('あります', 'あります', 'arimasu'),
  arimasen: T('ありません', 'ありません', 'arimasen'),
  imasu:    T('います', 'います', 'imasu'),
  imasen:   T('いません', 'いません', 'imasen'),
};
function tok(word, particle) {
  const p = particle || '';
  const pRom = p === 'は' ? 'wa' : p === 'を' ? 'o' : (PART_KANA_ROM[p] || toRomaji(p));
  const pKana = p === 'は' ? 'わ' : p;
  return T(word.jp + p, word.kana + pKana, word.romaji + (p ? ' ' + pRom : ''));
}
const PART_KANA_ROM = { 'は': 'wa', 'が': 'ga', 'に': 'ni', 'の': 'no', 'や': 'ya', 'と': 'to', 'も': 'mo', 'を': 'o', 'で': 'de' };

let seq = 1;
function mkSent(tokens, extra) {
  return {
    key: 's' + (seq++),
    tokens,
    jp: joinS(tokens),
    reading: joinR(tokens),
    romaji: joinM(tokens),
    idn: extra.idn,
    vocab: uniq((extra.vocab || []).filter(v => VALID_VOCAB.has(v))),
    slots: extra.slots || [],
    tags: extra.tags || {},
  };
}
/* 人 (n_hito) tidak dipakai sebagai topik 「人は…」 karena terasa janggal;
 * kata ini tetap dipakai pada pola 「…に 人が います」. */
const TOPIC_LIVINGS = livings => livings.filter(id => id !== 'n_hito');
const POS_MEAN = { pos_ue: 'atas', pos_shita: 'bawah', pos_mae: 'depan', pos_ushiro: 'belakang',
                   pos_migi: 'kanan', pos_hidari: 'kiri', pos_naka: 'dalam', pos_soto: 'luar',
                   pos_tonari: 'sebelah', pos_chikaku: 'dekat', pos_aida: 'antara' };
const posMean = p => POS_MEAN[typeof p === 'string' ? p : (p && p.id)] || '';

/* predikat + id kata kerja "ada" */
function existPred(living, pol) {
  if (living) return pol === 'aff' ? PRED.imasu : PRED.imasen;
  return pol === 'aff' ? PRED.arimasu : PRED.arimasen;
}
/* Benda struktural (窓・ドア) tidak dipakai pada kalimat negatif
 * (「病院に窓がありません」 terasa janggal). */
const NEG_SKIP = new Set(['n_mado', 'n_doa']);
/* 国 (negara asal) tidak dipakai pada kalimat negatif:
 * 「国に家族がいません」 terasa janggal. */
const NEG_PLACE_SKIP = new Set(['n_kuni']);
function existVerbId(living, pol) {
  return living ? (pol === 'aff' ? 'v_imasu' : 'v_wa_iru') : (pol === 'aff' ? 'v_arimasu' : 'v_wa_aru');
}
function predCls(living, pol) {
  return living ? (pol === 'aff' ? 'pred_iru' : 'pred_inai') : (pol === 'aff' ? 'pred_aru' : 'pred_arenai');
}

/* ---------- Pola A/B: N( tempat ) に N が あります / います ------------- */
function buildPlaceExist() {
  const out = [];
  for (const placeId of Object.keys(PLACE_THINGS)) {
    const place = PLACE[placeId];
    for (const thingId of PLACE_THINGS[placeId]) {
      const thing = W(thingId);
      for (const pol of (NEG_SKIP.has(thingId) || NEG_PLACE_SKIP.has(placeId) ? ['aff'] : ['aff', 'neg'])) {
        const tokens = [tok(place, 'に'), tok(thing, 'が'), existPred(false, pol)];
        out.push(mkSent(tokens, {
          idn: pol === 'aff' ? `Di ${place.mean} ada ${thing.mean}.` : `Di ${place.mean} tidak ada ${thing.mean}.`,
          vocab: [existVerbId(false, pol), place.id, thing.id, 'p_ni', 'p_ga'],
          slots: [
            { kind: 'particle', tokIndex: 0, answer: 'に', cls: 'p_ni' },
            { kind: 'particle', tokIndex: 1, answer: 'が', cls: 'p_ga' },
            { kind: 'predicate', tokIndex: 2, answer: tokens[2].s, cls: predCls(false, pol) },
            { kind: 'noun', tokIndex: 1, answer: tokens[1].s, group: 'thing_ga', nounId: thing.id },
            { kind: 'noun', tokIndex: 0, answer: tokens[0].s, group: 'place_ni', nounId: place.id },
          ],
          tags: { bucket: pol === 'aff' ? 'aru_place' : 'neg', pattern: pol === 'aff' ? 'aru_place_aff' : 'neg_aru_place',
                  living: false, pol, placeId: place.id, placeMean: place.mean,
                  subjId: thing.id, subjMean: thing.mean, tokens: tokens.length },
        }));
      }
    }
    for (const liveId of (PLACE_LIVINGS[placeId] || [])) {
      const live = LIVE[liveId];
      for (const pol of (NEG_PLACE_SKIP.has(placeId) ? ['aff'] : ['aff', 'neg'])) {
        const tokens = [tok(place, 'に'), tok(live, 'が'), existPred(true, pol)];
        out.push(mkSent(tokens, {
          idn: pol === 'aff' ? `Di ${place.mean} ada ${live.mean}.` : `Di ${place.mean} tidak ada ${live.mean}.`,
          vocab: [existVerbId(true, pol), place.id, live.id, 'p_ni', 'p_ga'],
          slots: [
            { kind: 'particle', tokIndex: 0, answer: 'に', cls: 'p_ni' },
            { kind: 'particle', tokIndex: 1, answer: 'が', cls: 'p_ga' },
            { kind: 'predicate', tokIndex: 2, answer: tokens[2].s, cls: predCls(true, pol) },
            { kind: 'noun', tokIndex: 1, answer: tokens[1].s, group: 'living_ga', nounId: live.id },
            { kind: 'noun', tokIndex: 0, answer: tokens[0].s, group: 'place_ni', nounId: place.id },
          ],
          tags: { bucket: pol === 'aff' ? 'iru_place' : 'neg', pattern: pol === 'aff' ? 'iru_place_aff' : 'neg_iru_place',
                  living: true, pol, placeId: place.id, placeMean: place.mean,
                  subjId: live.id, subjMean: live.mean, tokens: tokens.length },
        }));
      }
    }
  }
  return out;
}

/* ---------- Pola C: N は N( tempat ) に あります / います ----------------- */
function buildWaExist(rnd) {
  const out = [];
  for (const placeId of Object.keys(PLACE_THINGS)) {
    const place = PLACE[placeId];
    for (const thingId of pickN(PLACE_THINGS[placeId], Math.min(PLACE_THINGS[placeId].length, 3), rnd)) {
      const thing = W(thingId);
      for (const pol of (NEG_SKIP.has(thingId) || NEG_PLACE_SKIP.has(placeId) ? ['aff'] : ['aff', 'neg'])) {
        const tokens = [tok(thing, 'は'), tok(place, 'に'), existPred(false, pol)];
        out.push(mkSent(tokens, {
          idn: pol === 'aff' ? `${capital(thing.mean)} ada di ${place.mean}.` : `${capital(thing.mean)} tidak ada di ${place.mean}.`,
          vocab: [existVerbId(false, pol), thing.id, place.id, 'p_wa', 'p_ni'],
          slots: [
            { kind: 'particle', tokIndex: 0, answer: 'は', cls: 'p_wa' },
            { kind: 'particle', tokIndex: 1, answer: 'に', cls: 'p_ni' },
            { kind: 'predicate', tokIndex: 2, answer: tokens[2].s, cls: predCls(false, pol) },
            { kind: 'qword', tokIndex: 1, answer: 'どこ', qid: 'e_doko' },
          ],
          tags: { bucket: pol === 'aff' ? 'wa_place' : 'neg', pattern: pol === 'aff' ? 'wa_thing_aff' : 'neg_wa_thing',
                  living: false, pol, placeId: place.id, placeMean: place.mean,
                  subjId: thing.id, subjMean: thing.mean, tokens: tokens.length },
        }));
      }
    }
    const topicPool = TOPIC_LIVINGS(PLACE_LIVINGS[placeId] || []);
    for (const liveId of pickN(topicPool, Math.min(topicPool.length, 2), rnd)) {
      const live = LIVE[liveId];
      for (const pol of (NEG_PLACE_SKIP.has(placeId) ? ['aff'] : ['aff', 'neg'])) {
        const tokens = [tok(live, 'は'), tok(place, 'に'), existPred(true, pol)];
        out.push(mkSent(tokens, {
          idn: pol === 'aff' ? `${capital(live.mean)} ada di ${place.mean}.` : `${capital(live.mean)} tidak ada di ${place.mean}.`,
          vocab: [existVerbId(true, pol), live.id, place.id, 'p_wa', 'p_ni'],
          slots: [
            { kind: 'particle', tokIndex: 0, answer: 'は', cls: 'p_wa' },
            { kind: 'particle', tokIndex: 1, answer: 'に', cls: 'p_ni' },
            { kind: 'predicate', tokIndex: 2, answer: tokens[2].s, cls: predCls(true, pol) },
            { kind: 'qword', tokIndex: 1, answer: 'どこ', qid: 'e_doko' },
          ],
          tags: { bucket: pol === 'aff' ? 'wa_place' : 'neg', pattern: pol === 'aff' ? 'wa_living_aff' : 'neg_wa_living',
                  living: true, pol, placeId: place.id, placeMean: place.mean,
                  subjId: live.id, subjMean: live.mean, tokens: tokens.length },
        }));
      }
    }
  }
  return out;
}

/* ---------- Pola D: N1 の N2(posisi) に N が あります / います ----------- */
function buildPosition() {
  const out = [];
  for (const posId of Object.keys(POS_FRAME_DATA)) {
    const pos = POS[posId];
    for (const frame of POS_FRAME_DATA[posId]) {
      const ref = W(frame.ref);
      for (const thingId of frame.things) {
        const thing = W(thingId);
        for (const pol of ['aff', 'neg']) {
          const tokens = [tok(ref, 'の'), tok(pos, 'に'), tok(thing, 'が'), existPred(false, pol)];
          out.push(mkSent(tokens, {
            idn: pol === 'aff'
              ? `Di ${posMean(pos)} ${ref.mean} ada ${thing.mean}.`
              : `Di ${posMean(pos)} ${ref.mean} tidak ada ${thing.mean}.`,
            vocab: [existVerbId(false, pol), ref.id, pos.id, thing.id, 'p_no', 'p_ni', 'p_ga'],
            slots: [
              { kind: 'particle', tokIndex: 0, answer: 'の', cls: 'p_no' },
              { kind: 'particle', tokIndex: 1, answer: 'に', cls: 'p_ni' },
              { kind: 'particle', tokIndex: 2, answer: 'が', cls: 'p_ga' },
              { kind: 'position', tokIndex: 1, answer: pos.jp, posId: pos.id },
              { kind: 'predicate', tokIndex: 3, answer: tokens[3].s, cls: predCls(false, pol) },
            ],
            tags: { bucket: pol === 'aff' ? 'pos_aru' : 'neg', pattern: pol === 'aff' ? 'pos_aru_aff' : 'neg_pos_aru',
                    living: false, pol, posId: pos.id, refId: ref.id, refMean: ref.mean,
                    subjId: thing.id, subjMean: thing.mean, tokens: tokens.length },
          }));
        }
      }
      for (const liveId of frame.livings) {
        const live = LIVE[liveId];
        for (const pol of ['aff', 'neg']) {
          const tokens = [tok(ref, 'の'), tok(pos, 'に'), tok(live, 'が'), existPred(true, pol)];
          out.push(mkSent(tokens, {
            idn: pol === 'aff'
              ? `Di ${posMean(pos)} ${ref.mean} ada ${live.mean}.`
              : `Di ${posMean(pos)} ${ref.mean} tidak ada ${live.mean}.`,
            vocab: [existVerbId(true, pol), ref.id, pos.id, live.id, 'p_no', 'p_ni', 'p_ga'],
            slots: [
              { kind: 'particle', tokIndex: 0, answer: 'の', cls: 'p_no' },
              { kind: 'particle', tokIndex: 1, answer: 'に', cls: 'p_ni' },
              { kind: 'particle', tokIndex: 2, answer: 'が', cls: 'p_ga' },
              { kind: 'position', tokIndex: 1, answer: pos.jp, posId: pos.id },
              { kind: 'predicate', tokIndex: 3, answer: tokens[3].s, cls: predCls(true, pol) },
            ],
            tags: { bucket: pol === 'aff' ? 'pos_iru' : 'neg', pattern: pol === 'aff' ? 'pos_iru_aff' : 'neg_pos_iru',
                    living: true, pol, posId: pos.id, refId: ref.id, refMean: ref.mean,
                    subjId: live.id, subjMean: live.mean, tokens: tokens.length },
          }));
        }
      }
      /* Jawaban lokasi: N は N1 の N2(posisi) に あります / います */
      for (const thingId of frame.things.slice(0, 2)) {
        const thing = W(thingId);
        const tokens = [tok(thing, 'は'), tok(ref, 'の'), tok(pos, 'に'), PRED.arimasu];
        out.push(mkSent(tokens, {
          idn: `${capital(thing.mean)} ada di ${posMean(pos)} ${ref.mean}.`,
          vocab: ['v_arimasu', thing.id, ref.id, pos.id, 'p_wa', 'p_no', 'p_ni'],
          slots: [
            { kind: 'particle', tokIndex: 0, answer: 'は', cls: 'p_wa' },
            { kind: 'particle', tokIndex: 1, answer: 'の', cls: 'p_no' },
            { kind: 'particle', tokIndex: 2, answer: 'に', cls: 'p_ni' },
            { kind: 'position', tokIndex: 2, answer: pos.jp, posId: pos.id },
            { kind: 'predicate', tokIndex: 3, answer: 'あります', cls: 'pred_aru' },
          ],
          tags: { bucket: 'pos_aru', pattern: 'pos_wa_aru_aff', living: false, pol: 'aff',
                  posId: pos.id, refId: ref.id, refMean: ref.mean, subjId: thing.id, subjMean: thing.mean,
                  tokens: tokens.length },
        }));
      }
      /* Bentuk です: N は N1 の N2 です */
      for (const thingId of frame.things.slice(0, 2)) {
        const thing = W(thingId);
        const tokens = [tok(thing, 'は'), tok(ref, 'の'), T(pos.jp + 'です', pos.kana + 'です', pos.romaji + ' desu')];
        out.push(mkSent(tokens, {
          idn: `${capital(thing.mean)} ada di ${posMean(pos)} ${ref.mean}.`,
          vocab: [thing.id, ref.id, pos.id, 'p_wa', 'p_no'],
          slots: [
            { kind: 'particle', tokIndex: 0, answer: 'は', cls: 'p_wa' },
            { kind: 'particle', tokIndex: 1, answer: 'の', cls: 'p_no' },
            { kind: 'position', tokIndex: 2, answer: pos.jp, posId: pos.id },
          ],
          tags: { bucket: 'pos_desu', pattern: 'pos_desu', living: false, pol: 'aff',
                  posId: pos.id, refId: ref.id, refMean: ref.mean, subjId: thing.id, subjMean: thing.mean,
                  tokens: tokens.length },
        }));
      }
      for (const liveId of TOPIC_LIVINGS(frame.livings).slice(0, 1)) {
        const live = LIVE[liveId];
        const tokens = [tok(live, 'は'), tok(ref, 'の'), T(pos.jp + 'です', pos.kana + 'です', pos.romaji + ' desu')];
        out.push(mkSent(tokens, {
          idn: `${capital(live.mean)} ada di ${posMean(pos)} ${ref.mean}.`,
          vocab: [live.id, ref.id, pos.id, 'p_wa', 'p_no'],
          slots: [
            { kind: 'particle', tokIndex: 0, answer: 'は', cls: 'p_wa' },
            { kind: 'particle', tokIndex: 1, answer: 'の', cls: 'p_no' },
            { kind: 'position', tokIndex: 2, answer: pos.jp, posId: pos.id },
          ],
          tags: { bucket: 'pos_desu', pattern: 'pos_desu', living: true, pol: 'aff',
                  posId: pos.id, refId: ref.id, refMean: ref.mean, subjId: live.id, subjMean: live.mean,
                  tokens: tokens.length },
        }));
      }
    }
  }
  return out;
}

/* ---------- Pola E: N1 と N2 の 間に N が あります / います -------------- */
function buildAida() {
  const out = [];
  for (const frame of AIDA_FRAMES) {
    const a = W(frame.a), b = W(frame.b);
    for (const thingId of frame.things) {
      const thing = W(thingId);
      for (const pol of ['aff', 'neg']) {
        const tokens = [tok(a, 'と'), tok(b, 'の'), T('間に', 'あいだに', 'aida ni'), tok(thing, 'が'), existPred(false, pol)];
        out.push(mkSent(tokens, {
          idn: pol === 'aff'
            ? `Di antara ${a.mean} dan ${b.mean} ada ${thing.mean}.`
            : `Di antara ${a.mean} dan ${b.mean} tidak ada ${thing.mean}.`,
          vocab: [existVerbId(false, pol), a.id, b.id, 'pos_aida', thing.id, 'p_to', 'p_no', 'p_ni', 'p_ga'],
          slots: [
            { kind: 'particle', tokIndex: 0, answer: 'と', cls: 'p_to' },
            { kind: 'particle', tokIndex: 1, answer: 'の', cls: 'p_no' },
            { kind: 'particle', tokIndex: 3, answer: 'が', cls: 'p_ga' },
            { kind: 'predicate', tokIndex: 4, answer: tokens[4].s, cls: predCls(false, pol) },
          ],
          tags: { bucket: pol === 'aff' ? 'aida' : 'neg', pattern: pol === 'aff' ? 'aida_aff' : 'neg_aida',
                  living: false, pol, refId: a.id, refMean: a.mean, ref2Id: b.id, ref2Mean: b.mean,
                  subjId: thing.id, subjMean: thing.mean, tokens: tokens.length },
        }));
      }
    }
    for (const liveId of frame.livings) {
      const live = LIVE[liveId];
      const tokens = [tok(a, 'と'), tok(b, 'の'), T('間に', 'あいだに', 'aida ni'), tok(live, 'が'), PRED.imasu];
      out.push(mkSent(tokens, {
        idn: `Di antara ${a.mean} dan ${b.mean} ada ${live.mean}.`,
        vocab: ['v_imasu', a.id, b.id, 'pos_aida', live.id, 'p_to', 'p_no', 'p_ni', 'p_ga'],
        slots: [
          { kind: 'particle', tokIndex: 0, answer: 'と', cls: 'p_to' },
          { kind: 'particle', tokIndex: 1, answer: 'の', cls: 'p_no' },
          { kind: 'particle', tokIndex: 3, answer: 'が', cls: 'p_ga' },
          { kind: 'predicate', tokIndex: 4, answer: 'います', cls: 'pred_iru' },
        ],
        tags: { bucket: 'aida', pattern: 'aida_iru_aff', living: true, pol: 'aff',
                refId: a.id, refMean: a.mean, ref2Id: b.id, ref2Mean: b.mean,
                subjId: live.id, subjMean: live.mean, tokens: tokens.length },
      }));
    }
  }
  for (const group of AIDA_NAMES) {
    const [a, b, c] = group.map(id => NAME[id]);
    const tokens = [tok(a, 'と'), tok(b, 'の'), T('間に', 'あいだに', 'aida ni'), tok(c, 'が'), PRED.imasu];
    out.push(mkSent(tokens, {
      idn: `Di antara ${a.mean} dan ${b.mean} ada ${c.mean}.`,
      vocab: ['v_imasu', 'pos_aida', 'p_to', 'p_no', 'p_ni', 'p_ga'],
      slots: [
        { kind: 'particle', tokIndex: 0, answer: 'と', cls: 'p_to' },
        { kind: 'particle', tokIndex: 1, answer: 'の', cls: 'p_no' },
        { kind: 'particle', tokIndex: 3, answer: 'が', cls: 'p_ga' },
        { kind: 'predicate', tokIndex: 4, answer: 'います', cls: 'pred_iru' },
      ],
      tags: { bucket: 'aida', pattern: 'aida_name_aff', living: true, pol: 'aff',
              refId: a.id, refMean: a.mean, ref2Id: b.id, ref2Mean: b.mean,
              subjId: c.id, subjMean: c.mean, tokens: tokens.length },
    }));
  }
  return out;
}

/* ---------- Pola F: ～や～など / ～と～ (daftar lengkap) ------------------ */
function buildYaNado() {
  const out = [];
  for (const frame of YANADO_FRAMES) {
    const w1 = W(frame.items[0]), w2 = W(frame.items[1]);
    const living = frame.living;
    const isPlace = !!frame.place;
    const ref = W(frame.ref);
    const pos = frame.pos ? POS[frame.pos] : null;
    const headTokens = isPlace
      ? [tok(ref, 'に')]
      : [tok(ref, 'の'), tok(pos, 'に')];
    const headId = isPlace
      ? `Di ${ref.mean}`
      : `Di ${posMean(pos)} ${ref.mean}`;
    const headVocab = isPlace ? [ref.id, 'p_ni'] : [ref.id, pos.id, 'p_no', 'p_ni'];
    const pred = existPred(living, 'aff');
    /* ～や～など */
    {
      const tokens = [...headTokens, tok(w1, 'や'), tok(w2, 'など'), T('が', 'が', 'ga'), pred];
      out.push(mkSent(tokens, {
        idn: `${headId} ada ${w1.mean}, ${w2.mean}, dan lain-lain.`,
        vocab: [existVerbId(living, 'aff'), ...headVocab, w1.id, w2.id, 'p_ya', 'e_nado', 'p_ga'],
        slots: [
          { kind: 'particle', tokIndex: headTokens.length, answer: 'や', cls: 'p_ya' },
          { kind: 'particle', tokIndex: headTokens.length + 1, answer: 'など', cls: 'p_nado' },
          { kind: 'predicate', tokIndex: headTokens.length + 3, answer: pred.s, cls: predCls(living, 'aff') },
          { kind: 'noun', tokIndex: headTokens.length, answer: tokens[headTokens.length].s,
            group: living ? 'living_ya' : 'thing_ya', nounId: w1.id },
          ...(isPlace ? [] : [{ kind: 'position', tokIndex: 1, answer: pos.jp, posId: pos.id }]),
        ],
        tags: { bucket: 'ya_nado', pattern: living ? 'ya_living_aff' : 'ya_thing_aff',
                living, pol: 'aff', list: 'ya', refId: ref.id, refMean: ref.mean,
                posId: pos ? pos.id : null, subjId: w1.id, subjMean: w1.mean,
                subj2Id: w2.id, subj2Mean: w2.mean, tokens: tokens.length },
      }));
    }
    /* ～と～ (daftar lengkap) */
    {
      const tokens = [...headTokens, tok(w1, 'と'), tok(w2, 'が'), pred];
      out.push(mkSent(tokens, {
        idn: `${headId} ada ${w1.mean} dan ${w2.mean}.`,
        vocab: [existVerbId(living, 'aff'), ...headVocab, w1.id, w2.id, 'p_to', 'p_ga'],
        slots: [
          { kind: 'particle', tokIndex: headTokens.length, answer: 'と', cls: 'p_to' },
          { kind: 'particle', tokIndex: headTokens.length + 1, answer: 'が', cls: 'p_ga' },
          { kind: 'predicate', tokIndex: headTokens.length + 2, answer: pred.s, cls: predCls(living, 'aff') },
          { kind: 'noun', tokIndex: headTokens.length, answer: tokens[headTokens.length].s,
            group: living ? 'living_to' : 'thing_to', nounId: w1.id },
          ...(isPlace ? [] : [{ kind: 'position', tokIndex: 1, answer: pos.jp, posId: pos.id }]),
        ],
        tags: { bucket: 'ya_nado', pattern: living ? 'to_living_aff' : 'to_thing_aff',
                living, pol: 'aff', list: 'to', refId: ref.id, refMean: ref.mean,
                posId: pos ? pos.id : null, subjId: w1.id, subjMean: w1.mean,
                subj2Id: w2.id, subj2Mean: w2.mean, tokens: tokens.length },
      }));
    }
  }
  return out;
}

/* ---------- Pola G: 何も ありません / だれも いません -------------------- */
function buildNanimo() {
  const out = [];
  const scopes = [
    { ref: 'n_hako', pos: 'pos_naka' }, { ref: 'n_reizouko', pos: 'pos_naka' },
    { ref: 'n_tana', pos: 'pos_ue' }, { ref: 'n_tsukue', pos: 'pos_ue' },
    { ref: 'n_kaban', pos: 'pos_naka' }, { ref: 'n_heya', pos: 'pos_naka' },
    { ref: 'n_kyoushitsu', pos: 'pos_naka' }, { ref: 'n_tsukue', pos: 'pos_shita' },
    { ref: 'n_beddo', pos: 'pos_shita' }, { ref: 'n_kuruma', pos: 'pos_naka' },
  ];
  for (const sc of scopes) {
    const ref = W(sc.ref), pos = POS[sc.pos];
    const tokens = [tok(ref, 'の'), tok(pos, 'に'), T('何も', 'なにも', 'nani mo'), PRED.arimasen];
    out.push(mkSent(tokens, {
      idn: `Di ${posMean(pos)} ${ref.mean} tidak ada apa-apa.`,
      vocab: ['v_wa_aru', ref.id, pos.id, 'e_nani', 'p_mo', 'p_no', 'p_ni'],
      slots: [
        { kind: 'particle', tokIndex: 0, answer: 'の', cls: 'p_no' },
        { kind: 'particle', tokIndex: 1, answer: 'に', cls: 'p_ni' },
        { kind: 'predicate', tokIndex: 3, answer: 'ありません', cls: 'pred_arenai' },
      ],
      tags: { bucket: 'nanimo', pattern: 'nanimo_nai', living: false, pol: 'neg',
              refId: ref.id, refMean: ref.mean, posId: pos.id, tokens: tokens.length },
    }));
    if (!['n_reizouko', 'n_heya', 'n_kyoushitsu', 'n_kuruma'].includes(sc.ref)) continue;
    const tokens2 = [tok(ref, 'に'), T('何も', 'なにも', 'nani mo'), PRED.arimasen];
    out.push(mkSent(tokens2, {
      idn: `Di ${ref.mean} tidak ada apa-apa.`,
      vocab: ['v_wa_aru', ref.id, 'e_nani', 'p_mo', 'p_ni'],
      slots: [
        { kind: 'particle', tokIndex: 0, answer: 'に', cls: 'p_ni' },
        { kind: 'predicate', tokIndex: 2, answer: 'ありません', cls: 'pred_arenai' },
      ],
      tags: { bucket: 'nanimo', pattern: 'nanimo_nai', living: false, pol: 'neg',
              refId: ref.id, refMean: ref.mean, tokens: tokens2.length },
    }));
  }
  const places = [['n_kyoushitsu', 'n_gakusei'], ['n_heya', 'n_kodomo'], ['n_kouen', 'n_kodomo'],
                  ['n_shokudou', 'n_gakusei'], ['n_toshokan', 'n_gakusei'], ['n_jimusho', 'n_kaishain'],
                  ['n_eki', 'n_tomodachi'], ['n_mise', 'n_otokonohito']];
  for (const [placeId, liveId] of places) {
    const place = PLACE[placeId], live = LIVE[liveId];
    const tokens = [tok(place, 'に'), T('だれも', 'だれも', 'dare mo'), PRED.imasen];
    out.push(mkSent(tokens, {
      idn: `Di ${place.mean} tidak ada siapa-siapa.`,
      vocab: ['v_wa_iru', place.id, 'e_dare', 'p_mo', 'p_ni'],
      slots: [
        { kind: 'particle', tokIndex: 0, answer: 'に', cls: 'p_ni' },
        { kind: 'predicate', tokIndex: 2, answer: 'いません', cls: 'pred_inai' },
      ],
      tags: { bucket: 'nanimo', pattern: 'daremo_inai', living: true, pol: 'neg',
              refId: place.id, refMean: place.mean, subjId: live.id, subjMean: live.mean, tokens: tokens.length },
    }));
  }
  return out;
}

/* ---------- Pola H: kata tanya どこ / 何 / だれ -------------------------- */
function buildQuestions() {
  const out = [];
  /* どこに ありますか / いますか */
  for (const placeId of Object.keys(PLACE_THINGS)) {
    const place = PLACE[placeId];
    for (const thingId of PLACE_THINGS[placeId].slice(0, 2)) {
      const thing = W(thingId);
      const tokens = [tok(thing, 'は'), T('どこに', 'どこに', 'doko ni'), T('ありますか', 'ありますか', 'arimasu ka')];
      out.push(mkSent(tokens, {
        idn: `${capital(thing.mean)} ada di mana?`,
        vocab: ['v_arimasu', thing.id, 'e_doko', 'p_wa', 'p_ni'],
        slots: [
          { kind: 'particle', tokIndex: 0, answer: 'は', cls: 'p_wa' },
          { kind: 'particle', tokIndex: 1, answer: 'に', cls: 'p_ni' },
          { kind: 'qword', tokIndex: 1, answer: 'どこ', qid: 'e_doko' },
          { kind: 'predicate', tokIndex: 2, answer: 'ありますか', cls: 'q_aruka' },
        ],
        tags: { bucket: 'q_where', pattern: 'q_where_aru', living: false, pol: 'q',
                placeId: place.id, placeMean: place.mean, subjId: thing.id, subjMean: thing.mean,
                isQuestion: true, tokens: tokens.length },
      }));
    }
    for (const liveId of TOPIC_LIVINGS(PLACE_LIVINGS[placeId] || []).slice(0, 2)) {
      const live = LIVE[liveId];
      const tokens = [tok(live, 'は'), T('どこに', 'どこに', 'doko ni'), T('いますか', 'いますか', 'imasu ka')];
      out.push(mkSent(tokens, {
        idn: `${capital(live.mean)} ada di mana?`,
        vocab: ['v_imasu', live.id, 'e_doko', 'p_wa', 'p_ni'],
        slots: [
          { kind: 'particle', tokIndex: 0, answer: 'は', cls: 'p_wa' },
          { kind: 'particle', tokIndex: 1, answer: 'に', cls: 'p_ni' },
          { kind: 'qword', tokIndex: 1, answer: 'どこ', qid: 'e_doko' },
          { kind: 'predicate', tokIndex: 2, answer: 'いますか', cls: 'q_iruka' },
        ],
        tags: { bucket: 'q_where', pattern: 'q_where_iru', living: true, pol: 'q',
                placeId: place.id, placeMean: place.mean, subjId: live.id, subjMean: live.mean,
                isQuestion: true, tokens: tokens.length },
      }));
    }
  }
  /* 何が ありますか */
  for (const posId of ['pos_ue', 'pos_shita', 'pos_naka', 'pos_tonari', 'pos_chikaku']) {
    const pos = POS[posId];
    for (const frame of pickN(POS_FRAME_DATA[posId], 4, mulberry32(posId.length * 7 + 3))) {
      const ref = W(frame.ref);
      const tokens = [tok(ref, 'の'), tok(pos, 'に'), T('何が', 'なにが', 'nani ga'), T('ありますか', 'ありますか', 'arimasu ka')];
      out.push(mkSent(tokens, {
        idn: `Apa yang ada di ${posMean(pos)} ${ref.mean}?`,
        vocab: ['v_arimasu', ref.id, pos.id, 'e_nani', 'p_no', 'p_ni', 'p_ga'],
        slots: [
          { kind: 'particle', tokIndex: 0, answer: 'の', cls: 'p_no' },
          { kind: 'particle', tokIndex: 1, answer: 'に', cls: 'p_ni' },
          { kind: 'qword', tokIndex: 2, answer: '何', qid: 'e_nani' },
          { kind: 'particle', tokIndex: 2, answer: 'が', cls: 'p_ga' },
          { kind: 'position', tokIndex: 1, answer: pos.jp, posId: pos.id },
        ],
        tags: { bucket: 'q_nani', pattern: 'q_nani_pos', living: false, pol: 'q',
                refId: ref.id, refMean: ref.mean, posId: pos.id, isQuestion: true, tokens: tokens.length },
      }));
    }
  }
  for (const placeId of ['n_heya', 'n_kyoushitsu', 'n_toshokan', 'n_kouen', 'n_konbini', 'n_mise', 'n_tana']) {
    const place = W(placeId);
    const tokens = [tok(place, 'に'), T('何が', 'なにが', 'nani ga'), T('ありますか', 'ありますか', 'arimasu ka')];
    out.push(mkSent(tokens, {
      idn: `Apa yang ada di ${place.mean}?`,
      vocab: ['v_arimasu', place.id, 'e_nani', 'p_ni', 'p_ga'],
      slots: [
        { kind: 'particle', tokIndex: 0, answer: 'に', cls: 'p_ni' },
        { kind: 'qword', tokIndex: 1, answer: '何', qid: 'e_nani' },
        { kind: 'particle', tokIndex: 1, answer: 'が', cls: 'p_ga' },
      ],
      tags: { bucket: 'q_nani', pattern: 'q_nani_place', living: false, pol: 'q',
              refId: place.id, refMean: place.mean, isQuestion: true, tokens: tokens.length },
    }));
  }
  /* だれが いますか */
  for (const placeId of ['n_kyoushitsu', 'n_kouen', 'n_heya', 'n_jimusho', 'n_shokudou', 'n_toshokan',
                         'n_eki', 'n_resutoran', 'n_konbini', 'n_ryou']) {
    const place = W(placeId);
    const tokens = [tok(place, 'に'), T('だれが', 'だれが', 'dare ga'), T('いますか', 'いますか', 'imasu ka')];
    out.push(mkSent(tokens, {
      idn: `Siapa yang ada di ${place.mean}?`,
      vocab: ['v_imasu', place.id, 'e_dare', 'p_ni', 'p_ga'],
      slots: [
        { kind: 'particle', tokIndex: 0, answer: 'に', cls: 'p_ni' },
        { kind: 'qword', tokIndex: 1, answer: 'だれ', qid: 'e_dare' },
        { kind: 'particle', tokIndex: 1, answer: 'が', cls: 'p_ga' },
      ],
      tags: { bucket: 'q_dare', pattern: 'q_dare_place', living: true, pol: 'q',
              refId: place.id, refMean: place.mean, isQuestion: true, tokens: tokens.length },
    }));
  }
  const darePos = [['pos_mae', 'n_terebi'], ['pos_mae', 'n_doa'], ['pos_naka', 'n_heya'], ['pos_mae', 'n_kyoushitsu']];
  for (const [posId, refId] of darePos) {
    const pos = POS[posId], ref = W(refId);
    const tokens = [tok(ref, 'の'), tok(pos, 'に'), T('だれが', 'だれが', 'dare ga'), T('いますか', 'いますか', 'imasu ka')];
    out.push(mkSent(tokens, {
      idn: `Siapa yang ada di ${posMean(pos)} ${ref.mean}?`,
      vocab: ['v_imasu', ref.id, pos.id, 'e_dare', 'p_no', 'p_ni', 'p_ga'],
      slots: [
        { kind: 'particle', tokIndex: 0, answer: 'の', cls: 'p_no' },
        { kind: 'particle', tokIndex: 1, answer: 'に', cls: 'p_ni' },
        { kind: 'qword', tokIndex: 2, answer: 'だれ', qid: 'e_dare' },
        { kind: 'particle', tokIndex: 2, answer: 'が', cls: 'p_ga' },
      ],
      tags: { bucket: 'q_dare', pattern: 'q_dare_pos', living: true, pol: 'q',
              refId: ref.id, refMean: ref.mean, posId: pos.id, isQuestion: true, tokens: tokens.length },
    }));
  }
  /* ～は どこですか (bertanya letak tempat) */
  for (const placeId of Object.keys(PLACE_THINGS)) {
    if (['n_kuni', 'n_machi'].includes(placeId)) continue;
    const place = PLACE[placeId];
    const tokens = [tok(place, 'は'), T('どこですか', 'どこですか', 'doko desu ka')];
    out.push(mkSent(tokens, {
      idn: `${capital(place.mean)} di mana?`,
      vocab: [place.id, 'e_doko', 'p_wa'],
      slots: [
        { kind: 'particle', tokIndex: 0, answer: 'は', cls: 'p_wa' },
        { kind: 'qword', tokIndex: 1, answer: 'どこ', qid: 'e_doko' },
      ],
      tags: { bucket: 'q_where', pattern: 'q_where_place', living: false, pol: 'q',
              refId: place.id, refMean: place.mean, isQuestion: true, tokens: tokens.length },
    }));
  }
  return out;
}

/* --- Bank kalimat ---------------------------------------------------------*/
const bankRnd = mulberry32(20261011);
const SENTENCES = [
  ...buildPlaceExist(),
  ...buildWaExist(bankRnd),
  ...buildPosition(),
  ...buildAida(),
  ...buildYaNado(),
  ...buildNanimo(),
  ...buildQuestions(),
];
const BUCKET_POOL = {};
for (const s of SENTENCES) {
  const b = s.tags.bucket;
  (BUCKET_POOL[b] = BUCKET_POOL[b] || []).push(s);
}

/* ==========================================================================
 * BAGIAN 5 — SILABUS 50 LEVEL (kuota pola per tier)
 *   1-10   mudah    : あります / います + に / が dasar + posisi dasar
 *   11-20  sedang   : bentuk negatif + 何が / だれが / どこに + 何も / だれも
 *   21-30  kalimat  : N1 の N2(posisi) + jawaban lokasi (～です)
 *   31-40  campuran : ～や～など (dan と), N1 と N2 の 間に, percakapan
 *   41-50  acak     : seluruh pola, kalimat panjang, pengecoh lebih banyak
 * ========================================================================*/
const TIERS = [
  {
    max: 10, key: 'mudah',
    focus: 'Dasar あります / います + partikel に / が + posisi 上・下・中',
    plan: { aru_place: 4, iru_place: 4, wa_place: 4, q_where: 3, pos_aru: 2, pos_iru: 1 },
    maxTokens: 3, options: 3, extraTiles: 0,
    posAllowed: ['pos_ue', 'pos_shita', 'pos_naka'],
    slotKinds: ['particle', 'predicate'],
    typeWeights: { complete: 22, match: 12, choose_translation: 16, arrange: 18, listening: 12, short_conversation: 8, translate: 12 },
  },
  {
    max: 20, key: 'sedang',
    focus: 'Bentuk negatif ありません / いません + 何も / だれも + kata tanya',
    plan: { aru_place: 2, iru_place: 2, neg: 4, nanimo: 2, q_where: 2, q_nani: 2, q_dare: 2, wa_place: 2 },
    maxTokens: 4, options: 3, extraTiles: 1,
    posAllowed: ['pos_ue', 'pos_shita', 'pos_naka', 'pos_mae', 'pos_ushiro'],
    slotKinds: ['particle', 'predicate', 'qword', 'noun'],
    typeWeights: { complete: 20, match: 12, choose_translation: 14, arrange: 16, listening: 12, short_conversation: 14, translate: 12 },
  },
  {
    max: 30, key: 'kalimat',
    focus: 'Posisi N1 の N2 (上・下・前・後ろ・右・左・中・外・隣・近く) + jawaban ～です',
    plan: { pos_aru: 3, pos_iru: 2, pos_desu: 3, aru_place: 1, iru_place: 1, neg: 2, ya_nado: 3, q_nani: 1, q_dare: 1, q_where: 1 },
    maxTokens: 5, options: 3, extraTiles: 1,
    posAllowed: POS_IDS.filter(p => p !== 'pos_aida'),
    slotKinds: ['particle', 'predicate', 'qword', 'noun', 'position'],
    typeWeights: { complete: 18, match: 10, choose_translation: 12, arrange: 18, listening: 14, short_conversation: 16, translate: 12 },
  },
  {
    max: 40, key: 'campuran',
    focus: '～や～など dan ～と～ (daftar lengkap) + N1 と N2 の 間に + percakapan lokasi',
    plan: { ya_nado: 3, aida: 4, nanimo: 2, neg: 2, wa_place: 1, pos_aru: 2, pos_iru: 1, q_where: 1, q_dare: 1, pos_desu: 1 },
    maxTokens: 6, options: 4, extraTiles: 2,
    posAllowed: POS_IDS,
    slotKinds: ['particle', 'predicate', 'qword', 'noun', 'position'],
    typeWeights: { complete: 18, match: 10, choose_translation: 12, arrange: 16, listening: 14, short_conversation: 18, translate: 12 },
  },
  {
    max: 50, key: 'acak',
    focus: 'Ujian campuran seluruh pola Bab 10: kalimat panjang + pengecoh menjebak',
    plan: { aru_place: 2, iru_place: 1, wa_place: 2, neg: 1, nanimo: 2, pos_aru: 2, pos_iru: 1,
            pos_desu: 1, aida: 2, ya_nado: 2, q_nani: 1, q_dare: 1 },
    maxTokens: 7, options: 4, extraTiles: 3,
    posAllowed: POS_IDS,
    slotKinds: ['particle', 'predicate', 'qword', 'noun', 'position'],
    typeWeights: { complete: 18, match: 10, choose_translation: 12, arrange: 14, listening: 14, short_conversation: 20, translate: 12 },
  },
];
function getSyllabus(level) {
  return TIERS.find(t => level <= t.max) || TIERS[TIERS.length - 1];
}

/* Target global tipe soal (7 tipe, diambil dari proporsi versi terdahulu) */
const TYPE_TARGETS = {
  complete: 180, arrange: 170, short_conversation: 160, listening: 130,
  translate: 130, choose_translation: 130, match: 100,
};
const BUCKET_TYPES = {
  aru_place: ['complete', 'arrange', 'choose_translation', 'listening', 'translate', 'short_conversation'],
  iru_place: ['complete', 'arrange', 'choose_translation', 'listening', 'translate', 'short_conversation'],
  wa_place:  ['complete', 'arrange', 'choose_translation', 'listening', 'translate', 'short_conversation'],
  neg:       ['complete', 'arrange', 'choose_translation', 'listening', 'translate', 'short_conversation'],
  nanimo:    ['complete', 'arrange', 'translate', 'listening', 'short_conversation'],
  pos_aru:   ['complete', 'arrange', 'choose_translation', 'listening', 'translate', 'short_conversation'],
  pos_iru:   ['complete', 'arrange', 'choose_translation', 'listening', 'translate', 'short_conversation'],
  pos_desu:  ['complete', 'arrange', 'translate', 'listening', 'choose_translation'],
  aida:      ['complete', 'arrange', 'translate', 'listening', 'choose_translation', 'short_conversation'],
  ya_nado:   ['complete', 'arrange', 'translate', 'choose_translation', 'listening', 'short_conversation'],
  q_where:   ['complete', 'arrange', 'translate', 'listening', 'choose_translation', 'short_conversation'],
  q_nani:    ['complete', 'arrange', 'listening', 'translate', 'short_conversation'],
  q_dare:    ['complete', 'arrange', 'listening', 'translate', 'short_conversation'],
};

/* ==========================================================================
 * BAGIAN 6 — PENGECOH (distraktor)
 * ========================================================================*/
const PARTICLE_DISTRACTOR = ['に', 'が', 'は', 'の', 'や', 'と', 'も'];
/* Pengecoh partikel dipilih per slot supaya hanya SATU opsi yang berterima.
 * (「は」「も」 tidak dipakai untuk slot が pada kalimat あります/います, karena
 *  「図書館に新聞はあります」 masih gramatikal; begitu pula sebaliknya.) */
const PARTICLE_POOL_BY_CLS = {
  p_ni: ['が', 'や', 'と', 'も'],
  p_ga: ['に', 'の', 'や', 'と'],
  p_wa: ['に', 'や', 'と', 'も'],
  p_no: ['に', 'が', 'や', 'も'],
  p_ya: ['と', 'に', 'の', 'も'],
  p_to: ['や', 'に', 'の', 'も'],
  p_mo: ['は', 'が', 'に', 'の'],
};
const PRED_DISTRACTOR = {
  pred_aru:    ['います', 'ありません', 'です'],
  pred_arenai: ['あります', 'いません', 'です'],
  pred_iru:    ['あります', 'いません', 'です'],
  pred_inai:   ['います', 'ありません', 'です'],
  q_aruka:     ['いますか', 'ありません', 'あります'],
  q_iruka:     ['ありますか', 'いません', 'います'],
};
const QWORD_DISTRACTOR = ['どこ', 'だれ', '何', 'どれ'];
const POS_DISTRACTOR = V_POS.map(p => p.jp);
const NADO_DISTRACTOR = ['など', 'と', 'も', 'に'];

function nounGroupPool(group) {
  if (group === 'place_ni') return PLACE_IDS.map(id => PLACE[id].jp + 'に');
  if (group === 'thing_ga') return THING_IDS.map(id => THING[id].jp + 'が');
  if (group === 'living_ga') return LIVE_IDS.map(id => LIVE[id].jp + 'が');
  if (group === 'thing_ya' || group === 'thing_to') return THING_IDS.map(id => THING[id].jp);
  if (group === 'living_ya' || group === 'living_to') return LIVE_IDS.map(id => LIVE[id].jp);
  return [];
}
/* Pengecoh untuk slot kata benda: subjek diisi kata dari kelas yang berlawanan
 * (benda mati ↔ makhluk hidup) sehingga hanya satu jawaban yang gramatikal. */
function oppositeClassPool(living) {
  return living ? THING_IDS.map(id => THING[id].jp) : LIVE_IDS.map(id => LIVE[id].jp);
}

function extraTilesFor(sentence, syl, rnd, count) {
  const t = sentence.tags;
  const pool = ['あります', 'います', 'ありません', 'いません', 'など', 'や', 'と'];
  pool.push(...pickN(V_POS.filter(p => p.id !== t.posId).map(p => p.jp), 3, rnd));
  if (t.placeId) pool.push(...pickN(PLACE_IDS.filter(p => p !== t.placeId), 2, rnd).map(p => PLACE[p].jp + 'に'));
  if (t.refId) pool.push(...pickN(PLACE_IDS.concat(THING_IDS).filter(p => p !== t.refId), 2, rnd).map(p => W(p).jp + (t.posId ? 'の' : 'に')));
  if (t.subjId) {
    const src = t.living ? LIVE_IDS : THING_IDS;
    const other = (t.living ? THING_IDS : LIVE_IDS);
    pool.push(...pickN(src.filter(p => p !== t.subjId), 1, rnd).map(p => W(p).jp + 'が'));
    pool.push(...pickN(other, 2, rnd).map(p => W(p).jp + 'が'));
  }
  pool.push('どこに', '何が', 'だれが');
  return pickN(uniq(pool).filter(x => !sentence.tokens.some(tk => tk.s === x)), count, rnd);
}

/* ==========================================================================
 * BAGIAN 7 — GENERATOR PER TIPE SOAL (skema = js/questions.js)
 * ========================================================================*/
let qIdCounter = 1;
function nextId() { return `q_b10_${qIdCounter++}`; }
/* id baru diberikan setelah soal benar-benar dipakai, agar nomor tetap berurutan */
const PENDING_ID = 'q_b10_pending';
/* Sidik jari isi soal: dipakai untuk menolak soal yang benar-benar sama.
 * Opsi diurutkan dulu supaya urutan acak tidak dianggap soal berbeda. */
function questionSig(c) {
  const opts = (c.options || []).slice().sort().join('/');
  if (c.type === 'match') return 'match|' + c.pairs.map(p => p.jp + '=' + p.id).sort().join('|');
  if (c.type === 'short_conversation') {
    const dlg = (c.dialogue || []).map(d => d.speaker + ':' + d.text).join('~');
    return 'short_conversation|' + dlg + '|' + c.answer + '|' + opts;
  }
  if (Array.isArray(c.answer)) {
    return c.type + '|' + c.answer.join('') + '|' + (c.prompt || c.audioText || '') + '|' + opts;
  }
  return c.type + '|' + (c.prompt || c.audioText || '') + '|' + c.answer + '|' + opts;
}
function tileTokens(sentence) { return sentence.tokens.map(t => t.s).filter(t => t && t.length); }

/* --- 1) ARRANGE ----------------------------------------------------------- */
function genArrange(sentence, syl, rnd) {
  const tokens = tileTokens(sentence);
  if (tokens.length < 3) return null;
  return {
    id: PENDING_ID, type: 'arrange',
    instruction: 'Susun kata-kata berikut menjadi kalimat Bahasa Jepang yang benar.',
    tiles: shuffle(tokens, rnd),
    answer: tokens,
    translation: sentence.idn,
    reading: sentence.reading,
    romaji: sentence.romaji,
    vocab: sentence.vocab,
    _sentJp: sentence.jp,
  };
}

/* --- 2) TRANSLATE --------------------------------------------------------- */
function genTranslate(sentence, syl, rnd) {
  const tokens = tileTokens(sentence);
  if (tokens.length < 3) return null;
  let tiles = tokens.slice();
  if (syl.extraTiles > 0) {
    const extras = extraTilesFor(sentence, syl, rnd, Math.min(syl.extraTiles, 2));
    tiles = [...tokens, ...extras];
  }
  return {
    id: PENDING_ID, type: 'translate',
    instruction: 'Terjemahkan kalimat berikut ke dalam Bahasa Jepang.',
    prompt: sentence.idn,
    tiles: shuffle(tiles, rnd),
    answer: tokens,
    translation: sentence.idn,
    reading: sentence.reading,
    romaji: sentence.romaji,
    vocab: sentence.vocab,
    _sentJp: sentence.jp,
  };
}

/* --- 3) COMPLETE ---------------------------------------------------------- */
function slotAllowed(sl, syl) {
  if (sl.kind === 'particle') {
    if (sl.cls === 'p_ya' || sl.cls === 'p_to') return syl.level >= 21;
    if (sl.cls === 'p_no') return syl.level >= 11;
    if (sl.cls === 'p_wa') return syl.level >= 11;
    return true;
  }
  if (sl.kind === 'position') return syl.level >= 21;
  if (sl.kind === 'qword') return syl.level >= 11;
  if (sl.kind === 'noun') return syl.level >= 11;
  return syl.slotKinds.includes(sl.kind);
}
function genComplete(sentence, syl, rnd) {
  const tokens = tileTokens(sentence);
  if (tokens.length < 3) return null;
  const usable = sentence.slots.filter(sl => slotAllowed(sl, syl) && syl.slotKinds.includes(sl.kind));
  if (!usable.length) return null;
  const preferOrder = ['position', 'particle', 'predicate', 'qword', 'noun'];
  const cands = shuffle(usable, rnd).sort((a, b) => preferOrder.indexOf(a.kind) - preferOrder.indexOf(b.kind));
  const slot = cands[0];
  const promptTokens = tokens.slice();
  const raw = promptTokens[slot.tokIndex];
  let answer = null, options = null, instruction = '';

  if (slot.kind === 'particle') {
    if (!raw.endsWith(slot.answer)) return null;
    promptTokens[slot.tokIndex] = raw.slice(0, -slot.answer.length) + '＿＿＿';
    answer = slot.answer;
    if (slot.cls === 'p_nado') {
      options = mkOptions(answer, NADO_DISTRACTOR, syl, rnd);
      instruction = 'Lengkapi kalimat berikut dengan kata "dan lain-lain" yang tepat.';
    } else {
      options = mkOptions(answer, PARTICLE_POOL_BY_CLS[slot.cls] || PARTICLE_DISTRACTOR, syl, rnd);
      if (slot.cls === 'p_ya') instruction = 'Lengkapi kalimat berikut dengan partikel yang tepat (daftar sebagian).';
      else if (slot.cls === 'p_to') instruction = 'Lengkapi kalimat berikut dengan partikel yang tepat (daftar lengkap).';
      else instruction = 'Lengkapi kalimat berikut dengan partikel yang tepat.';
    }
  } else if (slot.kind === 'position') {
    if (!raw.startsWith(slot.answer)) return null;
    promptTokens[slot.tokIndex] = '＿＿＿' + raw.slice(slot.answer.length);
    answer = slot.answer;
    options = mkOptions(answer, POS_DISTRACTOR, syl, rnd);
    instruction = 'Lengkapi kalimat berikut dengan kata posisi yang tepat.';
  } else if (slot.kind === 'qword') {
    if (!raw.startsWith(slot.answer)) return null;
    promptTokens[slot.tokIndex] = '＿＿＿' + raw.slice(slot.answer.length);
    answer = slot.answer;
    options = mkOptions(answer, QWORD_DISTRACTOR, syl, rnd);
    instruction = 'Lengkapi pertanyaan berikut dengan kata tanya yang tepat.';
  } else if (slot.kind === 'predicate') {
    promptTokens[slot.tokIndex] = '＿＿＿';
    answer = slot.answer;
    options = mkOptions(answer, PRED_DISTRACTOR[slot.cls] || ['あります', 'います', 'ありません', 'いません'], syl, rnd);
    instruction = 'Lengkapi kalimat berikut dengan predikat yang tepat.';
  } else if (slot.kind === 'noun') {
    if (!raw.endsWith(slot.answer)) return null;
    promptTokens[slot.tokIndex] = '＿＿＿' + raw.slice(slot.answer.length);
    answer = slot.answer;
    const crossPool = oppositeClassPool(!!sentence.tags.living);
    options = mkOptions(answer, crossPool, syl, rnd);
    instruction = 'Lengkapi kalimat berikut dengan kata yang tepat.';
    sentence._nounSlotCrossClass = true;
  }
  if (!options || !answer) return null;

  return {
    id: PENDING_ID, type: 'complete',
    instruction,
    prompt: promptTokens.join(' '),
    translation: sentence.idn,
    options, answer,
    reading: sentence.reading,
    romaji: sentence.romaji,
    vocab: sentence.vocab,
    _sentJp: sentence.jp,
    _slotKind: slot.kind,
  };
}
function mkOptions(answer, pool, syl, rnd) {
  const d = pickN(pool.filter(x => x !== answer), Math.max(2, syl.options - 1), rnd);
  const options = shuffle(uniq([answer, ...d]), rnd);
  return options.length >= 3 ? options : null;
}

/* --- 4) MATCH (kosakata) -------------------------------------------------- */
const MATCH_THEMES = [
  {
    name: 'posisi',
    instr: 'Jodohkan kata posisi Bahasa Jepang dengan artinya.',
    pick: () => V_POS.map(v => ({ id: v.id, jp: v.jp, right: v.mean })),
  },
  {
    name: 'benda',
    instr: 'Jodohkan kosakata benda Bahasa Jepang dengan artinya.',
    pick: () => V_THINGS.map(v => ({ id: v.id, jp: v.jp, right: v.mean })),
  },
  {
    name: 'tempat',
    instr: 'Jodohkan nama tempat Bahasa Jepang dengan artinya.',
    pick: () => V_PLACES.map(v => ({ id: v.id, jp: v.jp, right: v.mean })),
  },
  {
    name: 'makhluk hidup',
    instr: 'Jodohkan kosakata makhluk hidup dengan artinya.',
    pick: () => V_LIVINGS.map(v => ({ id: v.id, jp: v.jp, right: v.mean })),
  },
  {
    name: 'bacaan kanji',
    instr: 'Jodohkan kanji dengan cara baca (kana) yang benar.',
    pick: () => [...V_THINGS, ...V_PLACES, ...V_LIVINGS, ...V_POS]
      .filter(v => /[\u4e00-\u9faf]/.test(v.jp) && v.jp.length <= 4)
      .map(v => ({ id: v.id, jp: v.jp, right: v.kana })),
  },
  {
    name: 'pola & partikel',
    instr: 'Jodohkan pola/partikel Bab 10 dengan fungsinya.',
    pick: () => [
      { id: 'v_arimasu', jp: 'あります', right: 'ada (untuk benda mati)' },
      { id: 'v_imasu', jp: 'います', right: 'ada (untuk makhluk hidup)' },
      { id: 'p_ni', jp: '～に', right: 'partikel tempat (di / ke)' },
      { id: 'p_ga', jp: '～が', right: 'partikel penanda subjek' },
      { id: 'p_wa', jp: '～は', right: 'partikel penanda topik' },
      { id: 'p_no', jp: '～の', right: 'partikel penghubung (kepemilikan)' },
      { id: 'p_ya', jp: '～や～', right: 'menyebut sebagian dari beberapa hal' },
      { id: 'p_to', jp: '～と～', right: 'menyebut daftar lengkap' },
      { id: 'e_nado', jp: 'など', right: 'dan lain-lain' },
      { id: 'p_mo', jp: '～も', right: 'juga / pun' },
    ],
  },
  {
    name: 'kata tanya & ungkapan',
    instr: 'Jodohkan kata tanya/ungkapan Bab 10 dengan artinya.',
    pick: () => [
      { id: 'e_doko', jp: 'どこ', right: 'di mana' },
      { id: 'e_dare', jp: 'だれ', right: 'siapa' },
      { id: 'e_nani', jp: '何', right: 'apa' },
      { id: 'e_dore', jp: 'どれ', right: 'yang mana' },
      { id: 'e_suminasen', jp: 'すみません', right: 'permisi / maaf' },
      { id: 'e_arigatou', jp: 'ありがとう ございます', right: 'terima kasih' },
      { id: 'e_soudesuka', jp: 'そうですか', right: 'begitu ya' },
      { id: 'e_hai', jp: 'はい', right: 'ya' },
      { id: 'e_iie', jp: 'いいえ', right: 'tidak' },
      { id: 'e_ee', jp: 'ええ', right: 'ya (santai)' },
      { id: 'e_doumo', jp: 'どうも すみません', right: 'terima kasih (sudah merepotkan)' },
    ],
  },
  {
    name: 'frasa posisi',
    instr: 'Jodohkan frasa posisi Bahasa Jepang dengan artinya.',
    pick: () => [
      { id: 'fp1', jp: '机の 上', right: 'di atas meja', ids: ['n_tsukue', 'pos_ue'] },
      { id: 'fp2', jp: '箱の 中', right: 'di dalam kotak', ids: ['n_hako', 'pos_naka'] },
      { id: 'fp3', jp: '駅の 前', right: 'di depan stasiun', ids: ['n_eki', 'pos_mae'] },
      { id: 'fp4', jp: '本屋の 隣', right: 'di sebelah toko buku', ids: ['n_honya', 'pos_tonari'] },
      { id: 'fp5', jp: '公園の 近く', right: 'di dekat taman', ids: ['n_kouen', 'pos_chikaku'] },
      { id: 'fp6', jp: 'いすの 下', right: 'di bawah kursi', ids: ['n_isu', 'pos_shita'] },
      { id: 'fp7', jp: '窓の 右', right: 'di kanan jendela', ids: ['n_mado', 'pos_migi'] },
      { id: 'fp8', jp: 'うちの 外', right: 'di luar rumah', ids: ['n_uchi', 'pos_soto'] },
      { id: 'fp9', jp: '冷蔵庫の 上', right: 'di atas kulkas', ids: ['n_reizouko', 'pos_ue'] },
      { id: 'fp10', jp: 'ベッドの 後ろ', right: 'di belakang tempat tidur', ids: ['n_beddo', 'pos_ushiro'] },
      { id: 'fp11', jp: '郵便局と 銀行の 間', right: 'di antara kantor pos dan bank', ids: ['n_yuubinkyoku', 'n_ginkou', 'pos_aida'] },
      { id: 'fp12', jp: 'テレビの 前', right: 'di depan televisi', ids: ['n_terebi', 'pos_mae'] },
    ],
  },
  {
    name: 'tanya jawab',
    instr: 'Jodohkan pertanyaan dengan jawaban yang sesuai.',
    pick: () => [
      { id: 'qa1', jp: '駅は どこですか。', right: '銀行の 隣です。', idn: 'Di mana stasiun? — Di sebelah bank.', ids: ['n_eki', 'pos_tonari', 'n_ginkou'] },
      { id: 'qa2', jp: '箱の 中に 何が ありますか。', right: '鉛筆や 消しゴムなどが あります。', idn: 'Apa yang ada di dalam kotak? — Ada pensil, penghapus, dan lain-lain.', ids: ['e_nani', 'e_nado', 'p_ya'] },
      { id: 'qa3', jp: '公園に だれが いますか。', right: '子どもが います。', idn: 'Siapa yang ada di taman? — Ada anak-anak.', ids: ['e_dare', 'n_kodomo'] },
      { id: 'qa4', jp: '猫は どこに いますか。', right: 'いすの 下に います。', idn: 'Di mana kucing? — Ada di bawah kursi.', ids: ['n_neko', 'pos_shita', 'n_isu'] },
      { id: 'qa5', jp: '冷蔵庫に 水が ありますか。', right: 'はい、あります。', idn: 'Apakah ada air di kulkas? — Ya, ada.', ids: ['n_reizouko', 'n_mizu', 'e_hai'] },
      { id: 'qa6', jp: '教室に だれが いますか。', right: 'だれも いません。', idn: 'Siapa yang ada di ruang kelas? — Tidak ada siapa-siapa.', ids: ['e_dare', 'v_wa_iru', 'p_mo'] },
      { id: 'qa7', jp: '郵便局は どこに ありますか。', right: '銀行の 近くに あります。', idn: 'Di mana kantor pos? — Ada di dekat bank.', ids: ['n_yuubinkyoku', 'pos_chikaku', 'n_ginkou'] },
      { id: 'qa8', jp: '机の 下に 何が ありますか。', right: 'かばんが あります。', idn: 'Apa yang ada di bawah meja? — Ada tas.', ids: ['n_tsukue', 'pos_shita', 'n_kaban'] },
      { id: 'qa9', jp: '乗り場は どこですか。', right: '駅の 前です。', idn: 'Di mana tempat naik? — Di depan stasiun.', ids: ['n_noriba', 'pos_mae', 'n_eki'] },
      { id: 'qa10', jp: '庭に 犬が いますか。', right: 'いいえ、いません。', idn: 'Apakah ada anjing di halaman? — Tidak, tidak ada.', ids: ['n_niwa', 'n_inu', 'e_iie'] },
      { id: 'qa11', jp: 'うちの 近くに 何が ありますか。', right: 'スーパーが あります。', idn: 'Apa yang ada di dekat rumah? — Ada supermarket.', ids: ['n_uchi', 'pos_chikaku', 'n_suupaa'] },
      { id: 'qa12', jp: '机の 上に 何が ありますか。', right: 'いいえ、何も ありません。', idn: 'Apa yang ada di atas meja? — Tidak ada apa-apa.', ids: ['n_tsukue', 'pos_ue', 'e_iie'] },
    ],
  },
];
let matchCursor = 0;
const vocabSeen = new Map();
function genMatch(syl, rnd) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const theme = MATCH_THEMES[matchCursor % MATCH_THEMES.length];
    matchCursor++;
    const pool = theme.pick();
    if (pool.length < 4) continue;
    const size = Math.min(pool.length, syl.level > 25 ? 5 : 4);
    const ranked = shuffle(pool, rnd).sort((a, b) => (vocabSeen.get(a.id) || 0) - (vocabSeen.get(b.id) || 0));
    const chosen = ranked.slice(0, size);
    const rights = chosen.map(v => v.right);
    if (uniq(rights).length !== rights.length) continue;
    const lefts = chosen.map(v => v.jp);
    if (uniq(lefts).length !== lefts.length) continue;
    chosen.forEach(v => vocabSeen.set(v.id, (vocabSeen.get(v.id) || 0) + 1));
    return {
      id: PENDING_ID, type: 'match',
      instruction: theme.instr,
      pairs: chosen.map(v => ({ jp: v.jp, id: v.right, vocabId: v.id })),
      vocab: uniq(chosen.flatMap(v => v.ids || [v.id]).filter(id => VALID_VOCAB.has(id))),
      translation: chosen.map(v => (v.idn ? `${v.jp} = ${v.right} — ${v.idn}` : `${v.jp} = ${v.right}`)).join(' · '),
    };
  }
  return null;
}

/* --- konverter kanji -> kana (untuk baris percakapan) -------------------- */
const KANA_DICT = (() => {
  const entries = ALL_WORDS
    .filter(v => /[\u4e00-\u9faf]/.test(v.jp))
    .map(v => ({ jp: v.jp, kana: v.kana }));
  const seen = new Set();
  return entries
    .filter(e => !seen.has(e.jp) && seen.add(e.jp))
    .sort((a, b) => b.jp.length - a.jp.length);
})();
function kanaSpacing(kana) {
  return String(kana)
    .replace(/(の|に|が|は|を|と|や|へ)(?=[\s。、？！]|$)/g, ' $1')
    .replace(/です(?=か?[。、？！]?$)/g, ' です')
    .replace(/ます(?=[。、？！]?$)/g, ' ます')
    .replace(/\s+/g, ' ')
    .trim();
}
function toKana(text) {
  let out = String(text);
  for (const e of KANA_DICT) out = out.split(e.jp).join(e.kana);
  return out;
}

/* --- 5) SHORT CONVERSATION ------------------------------------------------ */
function A(t, id) { return { speaker: 'A', text: t, id }; }
function B(t, id) { return { speaker: 'B', text: t, id }; }
const CONV_INSTR = 'Bacalah percakapan pendek berikut lalu jawab pertanyaannya.';
const BLANK = '＿＿＿';
const ud = s => s.replace(/\.$/, '');

/* Kumpulan template percakapan per bucket. Semua opsi salah karena alasan
 * yang jelas (predikat/pola/kata bertentangan dengan isi pertanyaan). */
function buildConversations() {
  const list = [];
  const add = (bucket, build, minLevel) => list.push({ bucket, build, minLevel: minLevel || 1 });

  /* 1. Menanyakan letak tempat: すみません、X は どこですか。
   * Acuan jawaban disesuaikan: tempat umum ditunjukkan relatif terhadap
   * bangunan/tempat lain (駅の前, 銀行の隣), sedangkan ruangan di dalam
   * bangunan boleh relatif terhadap ruangan atau benda di sekitarnya. */
  const ROOM_PLACES = ['n_heya', 'n_kyoushitsu', 'n_kaigishitsu', 'n_toire', 'n_jimusho', 'n_shokudou'];
  const ROOM_REFS = ['n_kyoushitsu', 'n_kaigishitsu', 'n_jimusho', 'n_shokudou'];
  const ROOM_POS = ['pos_tonari', 'pos_mae', 'pos_migi', 'pos_hidari'];
  const PUBLIC_REFS = ['n_eki', 'n_ginkou', 'n_mise', 'n_honya', 'n_depaato', 'n_byouin', 'n_gakkou',
                       'n_yuubinkyoku', 'n_kaisha', 'n_toshokan', 'n_kissaten', 'n_konbini', 'n_kouen',
                       'n_suupaa', 'n_resutoran', 'n_daigaku', 'n_ryou', 'n_biru'];
  const PUBLIC_POS = ['pos_tonari', 'pos_mae', 'pos_chikaku', 'pos_ushiro'];
  for (const placeId of Object.keys(PLACE_THINGS)) {
    if (['n_kuni', 'n_machi', 'n_toire'].includes(placeId)) continue;
    const place = PLACE[placeId];
    const isRoom = ROOM_PLACES.includes(placeId);
    const refIds = isRoom ? ROOM_REFS : PUBLIC_REFS;
    const posIds = isRoom ? ROOM_POS : PUBLIC_POS;
    add('q_where', (rnd) => {
      const cands = [];
      for (const pid of posIds) {
        for (const frame of POS_FRAME_DATA[pid]) {
          if (frame.ref === placeId) continue;
          if (!refIds.includes(frame.ref)) continue;
          cands.push({ ref: W(frame.ref), pos: POS[pid] });
        }
      }
      if (!cands.length) return null;
      const { ref, pos } = pick(cands, rnd);
      const ans = `${ref.jp}の ${pos.jp}です。`;
      const ansId = `Ada di ${posMean(pos)} ${ref.mean}.`;
      const other = pick(cands.filter(c => c.ref.id !== ref.id || c.pos.id !== pos.id), rnd);
      return {
        dialogue: [A(`すみません、${place.jp}は どこですか。`, `Permisi, ${place.mean} di mana?`), B(BLANK, ansId)],
        question: `Pilih jawaban B yang tepat (${ud(place.mean)} ada di ${posMean(pos)} ${ref.mean}):`,
        options: uniq([ans, `${other.ref.jp}の ${other.pos.jp}です。`, `${place.jp}が あります。`, `はい、${place.jp}です。`]),
        answer: ans, answerId: ansId,
        vocab: [place.id, ref.id, pos.id, 'e_suminasen', 'e_doko'],
      };
    });
  }

  /* 2. Menanyakan letak benda: X は どこに ありますか。 */
  for (const posId of ['pos_ue', 'pos_shita', 'pos_naka', 'pos_tonari', 'pos_chikaku', 'pos_mae', 'pos_migi', 'pos_hidari']) {
    const pos = POS[posId];
    for (const frame of pickN(POS_FRAME_DATA[posId], 6, mulberry32(posId.length * 13 + 5))) {
      if (!frame.things.length) continue;
      const ref = W(frame.ref);
      const thing = W(pick(frame.things, mulberry32(frame.ref.length + 11)));
      add('q_where', (rnd) => {
        const ans = `${ref.jp}の ${pos.jp}に あります。`;
        const ansId = `Ada di ${posMean(pos)} ${ref.mean}.`;
        const otherPos = pick(V_POS.filter(p => p.id !== posId && p.id !== 'pos_aida' &&
          (p.id !== 'pos_ue' && p.id !== 'pos_shita' || true)), rnd);
        return {
          dialogue: [A(`${thing.jp}は どこに ありますか。`, `${capital(thing.mean)} ada di mana?`), B(BLANK, ansId)],
          question: `Pilih jawaban B yang tepat (${ud(thing.mean)} ada di ${posMean(pos)} ${ref.mean}):`,
          options: uniq([ans, `${ref.jp}の ${otherPos.jp}に あります。`, `${ref.jp}の ${pos.jp}に います。`, `${ref.jp}に ${thing.jp}が あります。`]),
          answer: ans, answerId: ansId,
          vocab: [thing.id, ref.id, pos.id, 'e_doko', 'v_arimasu'],
        };
      });
    }
  }

  /* 3. Menanyakan letak makhluk hidup: X は どこに いますか。 */
  for (const posId of ['pos_ue', 'pos_shita', 'pos_naka', 'pos_mae', 'pos_ushiro', 'pos_tonari', 'pos_chikaku']) {
    const pos = POS[posId];
    for (const frame of pickN(POS_FRAME_DATA[posId].filter(f => TOPIC_LIVINGS(f.livings).length), 5, mulberry32(posId.length * 17 + 9))) {
      const ref = W(frame.ref);
      const live = LIVE[pick(TOPIC_LIVINGS(frame.livings), mulberry32(frame.ref.length + 23))];
      add('q_where', (rnd) => {
        const ans = `${ref.jp}の ${pos.jp}に います。`;
        const ansId = `Ada di ${posMean(pos)} ${ref.mean}.`;
        const otherPos = pick(V_POS.filter(p => p.id !== posId && p.id !== 'pos_aida'), rnd);
        return {
          dialogue: [A(`${live.jp}は どこに いますか。`, `${capital(live.mean)} ada di mana?`), B(BLANK, ansId)],
          question: `Pilih jawaban B yang tepat (${ud(live.mean)} ada di ${posMean(pos)} ${ref.mean}):`,
          options: uniq([ans, `${ref.jp}の ${otherPos.jp}に あります。`, `${ref.jp}に ${live.jp}が あります。`, `はい、います。`]),
          answer: ans, answerId: ansId,
          vocab: [live.id, ref.id, pos.id, 'e_doko', 'v_imasu'],
        };
      });
    }
  }

  /* 4. 何が ありますか — jawaban benda / や・など */
  for (const frame of pickN(YANADO_FRAMES, 14, mulberry32(77))) {
    add('q_nani', (rnd) => {
      const w1 = W(frame.items[0]), w2 = W(frame.items[1]);
      const isPlace = !!frame.place;
      const ref = W(frame.ref);
      const pos = frame.pos ? POS[frame.pos] : null;
      const headJp = isPlace ? `${ref.jp}に` : `${ref.jp}の ${pos.jp}に`;
      const headId = isPlace ? `di ${ref.mean}` : `di ${posMean(pos)} ${ref.mean}`;
      if (frame.living) return null;
      const ans = `${w1.jp}や ${w2.jp}などが あります。`;
      const ansId = `Ada ${w1.mean}, ${w2.mean}, dan lain-lain.`;
      const other = W(pick(THING_IDS.filter(id => !frame.items.includes(id)), rnd));
      return {
        dialogue: [A(`${headJp} 何が ありますか。`, `Apa yang ada ${headId}?`), B(BLANK, ansId)],
        question: `Pilih jawaban B yang tepat (yang ada ${headId}: ${w1.mean}, ${w2.mean}, dan lain-lain):`,
        options: uniq([ans, `${w1.jp}と ${w2.jp}が あります。`, `${other.jp}が います。`, `いいえ、何も ありません。`]),
        answer: ans, answerId: ansId,
        vocab: [frame.ref, ...(pos ? [pos.id] : []), w1.id, w2.id, 'e_nani', 'v_arimasu', 'e_nado'],
      };
    }, 21);
  }
  for (const [placeId, thingIds] of [['n_heya', ['n_tsukue', 'n_beddo']], ['n_kyoushitsu', ['n_tsukue', 'n_isu']],
                                     ['n_toshokan', ['n_hon', 'n_jisho']], ['n_konbini', ['n_mizu', 'n_pan']],
                                     ['n_kyoushitsu', ['n_nooto', 'n_keshigomu']]]) {
    const place = PLACE[placeId];
    const w1 = W(thingIds[0]), w2 = W(thingIds[1]);
    add('q_nani', (rnd) => {
      const ans = thingIds.length === 2 && rnd() < 0.5 ? `${w1.jp}や ${w2.jp}などが あります。` : `${w1.jp}が あります。`;
      const ansId = ans.includes('など') ? `Ada ${w1.mean}, ${w2.mean}, dan lain-lain.` : `Ada ${w1.mean}.`;
      const other = THING[pick(THING_IDS.filter(id => !thingIds.includes(id)), rnd)];
      return {
        dialogue: [A(`${place.jp}に 何が ありますか。`, `Apa yang ada di ${place.mean}?`), B(BLANK, ansId)],
        question: `Pilih jawaban B yang tepat (${ansId.replace(/^Ada /, 'yang ada: ').replace(/\.$/, '')}):`,
        options: uniq([ans, `${w1.jp}が います。`, `${other.jp}が あります。`, `いいえ、何も ありません。`]),
        answer: ans, answerId: ansId,
        vocab: [place.id, w1.id, w2.id, 'e_nani', 'v_arimasu'],
      };
    }, 11);
  }

  /* 5. だれが いますか */
  for (const placeId of ['n_kyoushitsu', 'n_kouen', 'n_heya', 'n_jimusho', 'n_shokudou', 'n_toshokan', 'n_eki', 'n_resutoran']) {
    const place = PLACE[placeId];
    add('q_dare', (rnd) => {
      const liveId = pick(PLACE_LIVINGS[placeId], rnd);
      const live = LIVE[liveId];
      const other = LIVE[pick(LIVE_IDS.filter(id => id !== liveId && LIVE[id].mean !== live.mean), rnd)];
      const ans = `${live.jp}が います。`;
      const ansId = `Ada ${live.mean}.`;
      return {
        dialogue: [A(`${place.jp}に だれが いますか。`, `Siapa yang ada di ${place.mean}?`), B(BLANK, ansId)],
        question: `Pilih jawaban B yang tepat (yang ada adalah ${live.mean}):`,
        options: uniq([ans, `${live.jp}が あります。`, `${place.jp}が います。`, `はい、だれか います。`]),
        answer: ans, answerId: ansId,
        vocab: [place.id, live.id, 'e_dare', 'v_imasu'],
      };
    }, 11);
    add('q_dare', (rnd) => {
      const idx = PLACE_LIVINGS[placeId].indexOf('n_neko');
      const liveId = pick(PLACE_LIVINGS[placeId], rnd);
      const live = LIVE[liveId];
      const ans = `いいえ、だれも いません。`;
      const ansId = 'Tidak, tidak ada siapa-siapa.';
      return {
        dialogue: [A(`${place.jp}に だれが いますか。`, `Siapa yang ada di ${place.mean}?`), B(BLANK, ansId)],
        question: 'Pilih jawaban B yang tepat (jawabannya: tidak ada siapa-siapa):',
        options: uniq([ans, `はい、${live.jp}が います。`, `いいえ、何も ありません。`, `${live.jp}が いません。`]),
        answer: ans, answerId: ansId,
        vocab: [place.id, 'e_dare', 'v_wa_iru', 'p_mo'],
      };
    }, 11);
  }

  /* 6. Dialog ya/tidak: X に Y が ありますか / いますか */
  for (const placeId of ['n_heya', 'n_kyoushitsu', 'n_toshokan', 'n_konbini', 'n_kouen', 'n_eki', 'n_jimusho', 'n_uchi']) {
    const place = PLACE[placeId];
    const things = (PLACE_THINGS[placeId] || []).map(id => ({ id, living: false }));
    const lives = (PLACE_LIVINGS[placeId] || []).map(id => ({ id, living: true }));
    const subjects = [...things, ...lives];
    if (!subjects.length) continue;
    add('neg', (rnd) => {
      const s = pick(subjects, rnd);
      const w = W(s.id);
      const yes = rnd() < 0.5;
      const pred = s.living ? 'います' : 'あります';
      const predNeg = s.living ? 'いません' : 'ありません';
      const ans = yes ? `はい、${w.jp}が ${pred}。` : `いいえ、${w.jp}は ${predNeg}。`;
      const ansId = yes ? `Ya, ada ${w.mean}.` : `Tidak, ${w.mean} tidak ada.`;
      return {
        dialogue: [A(`${place.jp}に ${w.jp}が ${pred}か。`, `Apakah ada ${w.mean} di ${place.mean}?`), B(BLANK, ansId)],
        question: `Pilih jawaban B yang tepat (jawabannya: ${yes ? 'ada' : 'tidak ada'} ${w.mean}):`,
        options: uniq([
          ans,
          yes ? `いいえ、${w.jp}は ${predNeg}。` : `はい、${w.jp}が ${pred}。`,
          `はい、${place.jp}が ${pred}。`,
          `ええ、${w.jp}です。`,
        ]),
        answer: ans, answerId: ansId,
        vocab: [place.id, w.id, s.living ? 'v_imasu' : 'v_arimasu', yes ? 'e_hai' : 'e_iie'],
      };
    });
  }

  /* 7. 何も ありません */
  for (const sc of [{ ref: 'n_hako', pos: 'pos_naka' }, { ref: 'n_reizouko', pos: 'pos_naka' },
                    { ref: 'n_tana', pos: 'pos_ue' }, { ref: 'n_tsukue', pos: 'pos_shita' },
                    { ref: 'n_kaban', pos: 'pos_naka' }, { ref: 'n_kyoushitsu', pos: 'pos_naka' }]) {
    const ref = W(sc.ref), pos = POS[sc.pos];
    add('nanimo', () => {
      const ans = '何も ありません。';
      const ansId = 'Tidak ada apa-apa.';
      return {
        dialogue: [A(`${ref.jp}の ${pos.jp}に 何が ありますか。`, `Apa yang ada di ${posMean(pos)} ${ref.mean}?`), B(BLANK, ansId)],
        question: 'Pilih jawaban B yang tepat (jawabannya: tidak ada apa-apa):',
        options: uniq([ans, 'はい、あります。', '何が あります。', '何も いません。']),
        answer: ans, answerId: ansId,
        vocab: [ref.id, pos.id, 'e_nani', 'v_wa_aru', 'p_mo'],
      };
    }, 11);
  }

  /* 8. だれも いません */
  for (const placeId of ['n_kyoushitsu', 'n_heya', 'n_kouen', 'n_toshokan', 'n_jimusho', 'n_shokudou']) {
    const place = PLACE[placeId];
    add('nanimo', () => {
      const ans = 'だれも いません。';
      const ansId = 'Tidak ada siapa-siapa.';
      return {
        dialogue: [A(`${place.jp}に だれが いますか。`, `Siapa yang ada di ${place.mean}?`), B(BLANK, ansId)],
        question: 'Pilih jawaban B yang tepat (jawabannya: tidak ada siapa-siapa):',
        options: uniq([ans, 'はい、います。', 'だれが います。', 'だれも ありません。']),
        answer: ans, answerId: ansId,
        vocab: [place.id, 'e_dare', 'v_wa_iru', 'p_mo'],
      };
    }, 11);
  }

  /* 9. ～や～など (jawaban sebagian) */
  for (const frame of pickN(YANADO_FRAMES.filter(f => !f.living).slice(0, 20), 10, mulberry32(91))) {
    add('ya_nado', (rnd) => {
      const w1 = W(frame.items[0]), w2 = W(frame.items[1]);
      const isPlace = !!frame.place;
      const ref = W(frame.ref);
      const pos = frame.pos ? POS[frame.pos] : null;
      const headJp = isPlace ? `${ref.jp}に` : `${ref.jp}の ${pos.jp}に`;
      const headId = isPlace ? `di ${ref.mean}` : `di ${posMean(pos)} ${ref.mean}`;
      const ans = `${w1.jp}や ${w2.jp}などが あります。`;
      const ansId = `Ada ${w1.mean}, ${w2.mean}, dan lain-lain.`;
      const other = W(pick(THING_IDS.filter(id => !frame.items.includes(id)), rnd));
      return {
        dialogue: [A(`${headJp} 何が ありますか。`, `Apa yang ada ${headId}?`), B(BLANK, ansId)],
        question: `Pilih jawaban B yang tepat (${w1.mean} dan ${w2.mean} dan lain-lain):`,
        options: uniq([ans, `${w1.jp}と ${w2.jp}が あります。`, `${other.jp}が います。`, `いいえ、何も ありません。`]),
        answer: ans, answerId: ansId,
        vocab: [frame.ref, ...(pos ? [pos.id] : []), w1.id, w2.id, 'e_nani', 'p_ya', 'e_nado', 'v_arimasu'],
      };
    }, 31);
  }

  /* 10. 間に */
  for (const frame of AIDA_FRAMES) {
    const a = W(frame.a), b = W(frame.b);
    if (!frame.things.length) continue;
    add('aida', (rnd) => {
      const thing = W(pick(frame.things, rnd));
      const ans = `${a.jp}と ${b.jp}の 間に あります。`;
      const ansId = `Ada di antara ${a.mean} dan ${b.mean}.`;
      const other = W(pick([...PLACE_IDS, ...THING_IDS].filter(id => id !== a.id && id !== b.id && id !== thing.id), rnd));
      return {
        dialogue: [A(`${thing.jp}は どこに ありますか。`, `${capital(thing.mean)} ada di mana?`), B(BLANK, ansId)],
        question: `Pilih jawaban B yang tepat (${ud(thing.mean)} ada di antara ${a.mean} dan ${b.mean}):`,
        options: uniq([ans, `${other.jp}の 隣に あります。`, `${a.jp}と ${b.jp}が あります。`, `${b.jp}の 中に あります。`]),
        answer: ans, answerId: ansId,
        vocab: [a.id, b.id, thing.id, 'pos_aida', 'v_arimasu', 'e_doko'],
      };
    }, 31);
  }
  for (const [aId, bId, cId] of AIDA_NAMES) {
    const a = NAME[aId], b = NAME[bId], c = NAME[cId];
    add('aida', () => {
      const ans = `${a.jp}と ${b.jp}の 間に います。`;
      const ansId = `Ada di antara ${a.mean} dan ${b.mean}.`;
      return {
        dialogue: [A(`${c.jp}は どこに いますか。`, `${c.mean} ada di mana?`), B(BLANK, ansId)],
        question: `Pilih jawaban B yang tepat (${ud(c.mean)} ada di antara ${a.mean} dan ${b.mean}):`,
        options: uniq([ans, `${a.jp}の 隣に います。`, `${a.jp}と ${b.jp}の 間に あります。`, `${a.jp}と ${b.jp}が います。`]),
        answer: ans, answerId: ansId,
        vocab: ['pos_aida', 'v_imasu', 'e_doko'],
      };
    }, 31);
  }

  /* 11. Konfirmasi posisi (ya) */
  for (const posId of ['pos_ue', 'pos_shita', 'pos_naka', 'pos_tonari', 'pos_chikaku', 'pos_mae']) {
    const pos = POS[posId];
    for (const frame of pickN(POS_FRAME_DATA[posId], 3, mulberry32(posId.length * 29 + 3))) {
      if (!frame.things.length) continue;
      const ref = W(frame.ref);
      const thing = W(frame.things[0]);
      add('pos_aru', (rnd) => {
        const ans = `はい、${ref.jp}の ${pos.jp}に あります。`;
        const ansId = `Ya, ada di ${posMean(pos)} ${ref.mean}.`;
        return {
          dialogue: [A(`${thing.jp}は ${ref.jp}の ${pos.jp}に ありますか。`, `Apakah ${thing.mean} ada di ${posMean(pos)} ${ref.mean}?`), B(BLANK, ansId)],
          question: 'Pilih jawaban B yang tepat (jawabannya "ya"):',
          options: uniq([ans, `いいえ、${ref.jp}の ${pos.jp}に あります。`, `はい、${thing.jp}が います。`, `ええ、${ref.jp}です。`]),
          answer: ans, answerId: ansId,
          vocab: [ref.id, pos.id, thing.id, 'v_arimasu'],
        };
      }, 21);
    }
  }
  return list;
}
const CONV_TEMPLATES = buildConversations();
function genShortConversation(syl, rnd) {
  const eligible = CONV_TEMPLATES.filter(t => t.bucket === syl.bucketWanted && (t.minLevel || 1) <= syl.level);
  const pool = eligible.length ? eligible : CONV_TEMPLATES.filter(t => (t.minLevel || 1) <= syl.level);
  if (!pool.length) return null;
  for (let attempt = 0; attempt < 12; attempt++) {
    const tpl = pick(pool, rnd);
    const q = tpl.build(rnd);
    if (!q || q.options.length < 3) continue;
    if (!q.options.includes(q.answer)) continue;
    const uniqOpts = uniq(q.options);
    if (uniqOpts.length < 3) continue;
    const dialogueId = q.dialogue.map(line => {
      const text = line.text === BLANK ? q.answer : line.text;
      const idText = line.text === BLANK ? q.answerId : line.id;
      return `${line.speaker}: ${idText || text}`;
    });
    const resolvedLines = q.dialogue.map(d => (d.text === BLANK ? q.answer : d.text));
    const fullJp = resolvedLines.join(' ');
    const dialogueReading = resolvedLines.map(line => kanaSpacing(toKana(line)));
    const reading = dialogueReading.join(' ');
    return {
      id: PENDING_ID, type: 'short_conversation',
      instruction: CONV_INSTR,
      dialogue: q.dialogue.map(d => ({ speaker: d.speaker, text: d.text })),
      question: q.question,
      options: shuffle(uniqOpts, rnd),
      answer: q.answer,
      answerId: q.answerId,
      translation: dialogueId.join(' — '),
      dialogueId,
      reading,
      romaji: toRomaji(reading),
      dialogueReading,
      fullJp,
      vocab: uniq((q.vocab || []).filter(v => VALID_VOCAB.has(v))),
      _sentJp: fullJp,
    };
  }
  return null;
}

/* --- 6) CHOOSE TRANSLATION (pengecoh: minimal pair) ----------------------- */
/* Sisa token yang sah setelah kata diganti: partikel / です / kosong.
 * Mencegah penggantian yang merusak kata lain (mis. 銀行 -> 本屋 pada 銀行員). */
const TOKEN_TAIL_OK = /^(に|が|は|の|や|と|も|です|ですか|ます|か)?$/;
function tailOk(rest) { return TOKEN_TAIL_OK.test(rest); }

/* Alternatif pengganti tempat/acuan yang tetap wajar menurut tabel kurasi. */
function plausibleRefAlts(t, refId) {
  const out = new Set();
  const subjIds = [t.subjId, t.subj2Id].filter(Boolean);
  for (const subj of subjIds) {
    const living = !!t.living;
    for (const p of PLACE_IDS) {
      if (p === refId) continue;
      const list = living ? (PLACE_LIVINGS[p] || []) : (PLACE_THINGS[p] || []);
      if (list.includes(subj)) out.add(p);
    }
    if (t.posId && t.refId) {
      for (const frame of (POS_FRAME_DATA[t.posId] || [])) {
        if (frame.ref === refId) continue;
        const list = living ? frame.livings : frame.things;
        if (list.includes(subj)) out.add(frame.ref);
      }
    }
  }
  out.delete(t.subjId); out.delete(t.subj2Id);
  return [...out];
}
/* Alternatif pengganti subjek yang tetap wajar di tempat/acuan itu. */
function plausibleSubjAlts(t) {
  const out = new Set();
  if (t.placeId) {
    const list = t.living ? (PLACE_LIVINGS[t.placeId] || []) : (PLACE_THINGS[t.placeId] || []);
    list.forEach(x => out.add(x));
  }
  if (t.posId && t.refId) {
    for (const frame of (POS_FRAME_DATA[t.posId] || [])) {
      if (frame.ref !== t.refId) continue;
      (t.living ? frame.livings : frame.things).forEach(x => out.add(x));
    }
  }
  out.delete(t.subjId); out.delete(t.subj2Id); out.delete(t.refId); out.delete(t.placeId);
  return [...out];
}

function makeVariant(sentence, rnd) {
  const t = sentence.tags;
  const toks = sentence.tokens.map(x => ({ ...x }));
  const r = rnd();
  /* 1) tukar あります <-> います (kelas subjek berbeda) */
  if (r < 0.34) {
    const i = toks.findIndex(x => ['あります', 'います', 'ありません', 'いません'].includes(x.s));
    if (i >= 0) {
      const swap = { 'あります': 'います', 'います': 'あります', 'ありません': 'いません', 'いません': 'ありません' };
      toks[i] = T(swap[toks[i].s], swap[toks[i].s], swap[toks[i].s] === 'います' ? 'imasu' : swap[toks[i].s] === 'あります' ? 'arimasu'
        : swap[toks[i].s] === 'いません' ? 'imasen' : 'arimasen');
      return { jp: joinS(toks) };
    }
  }
  /* 2) tukar kata posisi */
  if (r < 0.6 && t.posId && t.posId !== 'pos_aida') {
    const altPos = pick(V_POS.filter(p => p.id !== t.posId && p.id !== 'pos_aida'), rnd);
    const i = toks.findIndex(x => x.s.startsWith(POS[t.posId].jp) || x.s === POS[t.posId].jp + 'です');
    if (i >= 0) {
      const rest = toks[i].s.slice(POS[t.posId].jp.length);
      if (!tailOk(rest)) return null;
      toks[i] = T(altPos.jp + rest, altPos.kana + rest, altPos.romaji + (rest ? ' ' + toRomaji(rest) : ''));
      return { jp: joinS(toks) };
    }
  }
  /* 3) tukar tempat / acuan (dipilih dari pasangan yang wajar) */
  const refId = t.refId || t.placeId;
  if (r < 0.82 && refId) {
    const altIds = plausibleRefAlts(t, refId);
    const alt = W(pick(altIds.length ? altIds : PLACE_IDS.concat(THING_IDS).filter(p => p !== refId && p !== t.subjId && p !== t.ref2Id), rnd));
    const src = W(refId);
    const i = toks.findIndex(x => x.s.startsWith(src.jp));
    if (i >= 0) {
      const rest = toks[i].s.slice(src.jp.length);
      if (!tailOk(rest)) return null;
      toks[i] = T(alt.jp + rest, alt.kana + rest, alt.romaji + (rest ? ' ' + toRomaji(rest) : ''));
      return { jp: joinS(toks) };
    }
  }
  /* 4) tukar subjek (dipilih dari kata yang wajar di tempat/acuan itu) */
  if (t.subjId) {
    const src = W(t.subjId);
    const plausible = plausibleSubjAlts(t);
    const altPool = (plausible.length ? plausible
      : (t.living ? LIVE_IDS : THING_IDS).filter(x => x !== t.subjId && x !== t.refId && x !== t.subj2Id));
    if (altPool.length) {
      const alt = W(pick(altPool, rnd));
      const i = toks.findIndex(x => x.s.startsWith(src.jp));
      if (i >= 0) {
        const rest = toks[i].s.slice(src.jp.length);
        if (!tailOk(rest)) return null;
        toks[i] = T(alt.jp + rest, alt.kana + rest, alt.romaji + (rest ? ' ' + toRomaji(rest) : ''));
        return { jp: joinS(toks) };
      }
    }
  }
  return null;
}
function genChooseTranslation(sentence, syl, rnd) {
  const opts = [sentence.jp];
  let guard = 0;
  while (opts.length < syl.options && guard < 40) {
    guard++;
    const v = makeVariant(sentence, rnd);
    if (v && v.jp && v.jp.length >= 4 && !opts.includes(v.jp) && v.jp !== sentence.jp) opts.push(v.jp);
  }
  if (opts.length < 3) return null;
  return {
    id: PENDING_ID, type: 'choose_translation',
    instruction: 'Pilih terjemahan Bahasa Jepang yang benar.',
    prompt: sentence.idn,
    options: shuffle(opts, rnd),
    answer: sentence.jp,
    translation: sentence.idn,
    reading: sentence.reading,
    romaji: sentence.romaji,
    vocab: sentence.vocab,
    _sentJp: sentence.jp,
  };
}

/* --- 7) LISTENING --------------------------------------------------------- */
function genListening(sentence, syl, rnd) {
  const tokens = tileTokens(sentence);
  if (tokens.length < 3) return null;
  const t = sentence.tags;
  const extras = extraTilesFor(sentence, syl, rnd, Math.min(syl.extraTiles + 1, 4));
  return {
    id: PENDING_ID, type: 'listening',
    instruction: t.isQuestion
      ? 'Dengarkan audio, lalu susun pertanyaan yang kamu dengar.'
      : 'Dengarkan audio, lalu susun kalimat yang kamu dengar.',
    audioText: sentence.jp,
    tiles: shuffle([...tokens, ...extras], rnd),
    answer: tokens,
    translation: sentence.idn,
    reading: sentence.reading,
    romaji: sentence.romaji,
    vocab: sentence.vocab,
    _sentJp: sentence.jp,
  };
}

/* ==========================================================================
 * BAGIAN 8 — PEMBANGUN 50 LEVEL × 20 SOAL
 * ========================================================================*/
const TOTAL_LEVELS = 50;
const QUESTIONS_PER_LEVEL = 20;
const MATCH_PER_LEVEL = 2;
const LEVELS = [];
const THEME_CYCLE = ['rumah', 'kota', 'bangunan', 'benda', 'posisi',
                     'makhluk hidup', 'transport', 'tanya jawab', 'campuran'];
const typeUsed = { complete: 0, arrange: 0, short_conversation: 0, listening: 0, translate: 0, choose_translation: 0, match: 0 };
const sentUseCount = new Map();
const sentUseTypes = new Map();
const globalSigs = new Set();
const scCoreGlobal = new Map();   /* inti dialog (dialogue + jawaban) -> jumlah pakai */
let sigDup = 0;

function bucketAvailable(bucket, syl) {
  const pool = BUCKET_POOL[bucket] || [];
  return pool.some(s => s.tokens.length <= syl.maxTokens &&
    (!s.tags.posId || syl.posAllowed.includes(s.tags.posId)));
}

function takeSentence(bucket, syl, rnd, usedInLevel) {
  const pool = (BUCKET_POOL[bucket] || []).filter(s =>
    s.tokens.length <= syl.maxTokens &&
    (!s.tags.posId || syl.posAllowed.includes(s.tags.posId)));
  if (!pool.length) return null;
  const fresh = pool.filter(s => !usedInLevel.has(s.key) && (sentUseCount.get(s.key) || 0) < 2);
  const candidates = fresh.length ? fresh : pool.filter(s => !usedInLevel.has(s.key));
  const scored = shuffle(candidates.length ? candidates : pool, rnd)
    .sort((a, b) => (sentUseCount.get(a.key) || 0) - (sentUseCount.get(b.key) || 0));
  const chosen = scored[0];
  if (!chosen) return null;
  usedInLevel.add(chosen.key);
  sentUseCount.set(chosen.key, (sentUseCount.get(chosen.key) || 0) + 1);
  return chosen;
}

function chooseType(bucket, syl, rnd, levelCount) {
  const allowed = BUCKET_TYPES[bucket] || ['complete'];
  /* batasi agar satu tipe tidak mendominasi dalam satu level */
  const balanced = levelCount ? allowed.filter(tp => (levelCount[tp] || 0) < 5) : allowed;
  const pool = balanced.length ? balanced : allowed;
  const scored = pool.map(tp => ({ tp, deficit: (TYPE_TARGETS[tp] - typeUsed[tp]) / TYPE_TARGETS[tp] }))
    .sort((a, b) => b.deficit - a.deficit);
  const top = scored.filter(x => x.deficit >= scored[0].deficit - 0.08);
  return pick(top.map(x => x.tp), rnd);
}

for (let level = 1; level <= TOTAL_LEVELS; level++) {
  const rnd = mulberry32(level * 977 + 20261011);
  const base = getSyllabus(level);
  const syl = Object.assign({}, base, { level, bucketWanted: null });
  const questions = [];
  const usedInLevel = new Set();
  const levelTypeCount = {};
  const scCoreLevel = new Set();
  const slotList = [];
  for (const bucket of Object.keys(syl.plan)) {
    for (let k = 0; k < syl.plan[bucket]; k++) slotList.push(bucket);
  }
  /* buang bucket yang tidak punya kalimat layak di level ini */
  const plan = slotList.filter(b => bucketAvailable(b, syl));
  while (plan.length < QUESTIONS_PER_LEVEL - MATCH_PER_LEVEL) plan.push('aru_place');
  const planShuffled = shuffle(plan.slice(0, QUESTIONS_PER_LEVEL - MATCH_PER_LEVEL), rnd);
  /* match diselipkan di posisi tetap agar tiap level punya 2 soal kosakata */
  const matchPositions = [3, 11];
  let nonMatchIdx = 0;

  for (let i = 0; i < QUESTIONS_PER_LEVEL; i++) {
    let q = null;
    if (matchPositions.includes(i)) {
      for (let attempt = 0; attempt < 12 && !q; attempt++) {
        const cand = genMatch(syl, rnd);
        if (!cand) continue;
        const sg = questionSig(cand);
        if (globalSigs.has(sg)) continue;
        globalSigs.add(sg);
        q = cand;
      }
      if (q) { q.id = nextId(); typeUsed.match++; questions.push(q); continue; }
    }
    for (let attempt = 0; attempt < 14 && !q; attempt++) {
      const bucket = planShuffled[nonMatchIdx % planShuffled.length];
      nonMatchIdx++;
      const sent = takeSentence(bucket, syl, rnd, usedInLevel);
      if (!sent) continue;
      syl.bucketWanted = bucket;
      let type = chooseType(bucket, syl, rnd, levelTypeCount);
      const deficitOf = tp => (TYPE_TARGETS[tp] - typeUsed[tp]) / TYPE_TARGETS[tp];
      const tryOrder = [type, ...(BUCKET_TYPES[bucket] || []).filter(t => t !== type)
        .sort((a, b) => deficitOf(b) - deficitOf(a))];
      for (const tp of tryOrder) {
        /* jaga keseimbangan: hindari satu tipe >5 soal dalam satu level
         * selama masih ada tipe lain yang belum mencapai batas. */
        if ((levelTypeCount[tp] || 0) >= 5 && tryOrder.some(t2 => (levelTypeCount[t2] || 0) < 5)) continue;
        let cand = null;
        if (tp === 'short_conversation') cand = genShortConversation(syl, rnd);
        else if (tp === 'complete') cand = genComplete(sent, syl, rnd);
        else if (tp === 'arrange') cand = genArrange(sent, syl, rnd);
        else if (tp === 'translate') cand = genTranslate(sent, syl, rnd);
        else if (tp === 'choose_translation') cand = genChooseTranslation(sent, syl, rnd);
        else if (tp === 'listening') cand = genListening(sent, syl, rnd);
        if (cand) {
          const sig = questionSig(cand);
          if (globalSigs.has(sig)) { sigDup++; continue; }
          if (sentUseTypes.get(sent.key) === cand.type) continue;
          /* dialog dengan inti sama (pertanyaan + jawaban) tidak diulang
           * dalam satu level; secara global maksimal 1x. */
          if (cand.type === 'short_conversation') {
            const core = (cand.dialogue || []).map(d => d.text).join('|') + '>>' + cand.answer;
            if (scCoreLevel.has(core)) continue;
            if ((scCoreGlobal.get(core) || 0) >= 1 && attempt < 12) continue;
            scCoreLevel.add(core);
            scCoreGlobal.set(core, (scCoreGlobal.get(core) || 0) + 1);
          }
          sentUseTypes.set(sent.key, cand.type);
          globalSigs.add(sig);
          q = cand;
          q._bucket = bucket;
          q._sentKey = sent.key;
          typeUsed[cand.type] = (typeUsed[cand.type] || 0) + 1;
          levelTypeCount[cand.type] = (levelTypeCount[cand.type] || 0) + 1;
          break;
        }
      }
    }
    if (!q) {
      /* fallback: soal kosakata (tetap dicek agar tidak kembar) */
      for (let attempt = 0; attempt < 12 && !q; attempt++) {
        const cand = genMatch(syl, rnd);
        if (!cand) continue;
        const sg = questionSig(cand);
        if (globalSigs.has(sg)) continue;
        globalSigs.add(sg);
        q = cand;
      }
      if (q) { q.id = nextId(); typeUsed.match++; }
    }
    if (q) { if (q.id === PENDING_ID) q.id = nextId(); questions.push(q); }
  }

  LEVELS.push({
    level,
    title: `Level ${level}`,
    tier: syl.key,
    focus: syl.focus,
    theme: THEME_CYCLE[(level - 1) % THEME_CYCLE.length],
    questions,
  });
}

/* ==========================================================================
 * BAGIAN 9 — VALIDASI
 * ========================================================================*/
const ALL_IDS = new Set();
const allVocabRefs = new Set();
const typeCount = {};
const bucketCount = {};
let totalQ = 0, missingTranslation = 0;
const problems = [];
const HAS_KANJI = /[\u4e00-\u9faf]/;

for (const lvl of LEVELS) {
  totalQ += lvl.questions.length;
  if (lvl.questions.length !== QUESTIONS_PER_LEVEL) problems.push(`level ${lvl.level}: jumlah soal ${lvl.questions.length}`);
  for (const q of lvl.questions) {
    typeCount[q.type] = (typeCount[q.type] || 0) + 1;
    if (q._bucket) bucketCount[q._bucket] = (bucketCount[q._bucket] || 0) + 1;
    if (ALL_IDS.has(q.id)) problems.push(`duplicate id: ${q.id}`);
    ALL_IDS.add(q.id);
    if (q.vocab) q.vocab.forEach(v => { allVocabRefs.add(v); if (!VALID_VOCAB.has(v)) problems.push(`${q.id}: vocab id tak dikenal ${v}`); });
    if (!q.translation) missingTranslation++;
    if (q.translation && q.type !== 'match' && HAS_KANJI.test(q.translation)) problems.push(`${q.id}: terjemahan Indonesia masih memuat kanji: ${q.translation}`);
    if (q.translation && /\s{2,}/.test(q.translation)) problems.push(`${q.id}: terjemahan mengandung spasi ganda: ${q.translation}`);
    if (Array.isArray(q.answer)) {
      const tset = new Set(q.tiles || []);
      for (const tk of q.answer) if (!tset.has(tk)) problems.push(`${q.id}: token jawaban tidak ada di tiles: ${tk}`);
      if (q.answer.length < 3) problems.push(`${q.id}: jawaban terlalu pendek (${q.answer.length})`);
      if (!q.reading) problems.push(`${q.id}: reading kosong`);
      if (HAS_KANJI.test(q.reading || '')) problems.push(`${q.id}: reading masih mengandung kanji: ${q.reading}`);
    }
    if (q.type === 'listening') {
      if (!q.audioText) problems.push(`${q.id}: audioText kosong`);
      const tset = new Set(q.tiles || []);
      if (new Set(q.tiles).size !== q.tiles.length) problems.push(`${q.id}: tiles duplikat`);
      for (const tk of q.answer) if (!tset.has(tk)) problems.push(`${q.id}: token audio tidak ada di tiles: ${tk}`);
    }
    if (q.type === 'arrange' || q.type === 'translate') {
      if (!Array.isArray(q.answer) || q.answer.join('') !== q._sentJp) {
        if (q.answer.join('') !== q._sentJp) problems.push(`${q.id}: susunan jawaban tidak sama dengan kalimat sumber`);
      }
    }
    if (q.options) {
      if (!q.options.includes(q.answer)) problems.push(`${q.id}: answer tidak ada di options`);
      if (new Set(q.options).size !== q.options.length) problems.push(`${q.id}: options duplikat`);
      if (q.options.length < 3) problems.push(`${q.id}: options kurang dari 3`);
      if (q.type === 'complete') {
        const blanks = (q.prompt.match(/＿＿＿/g) || []).length;
        if (blanks !== 1) problems.push(`${q.id}: complete harus punya tepat 1 rumpang (${blanks})`);
        if (q.prompt.replace('＿＿＿', q.answer).replace(/ /g, '') !== q._sentJp) problems.push(`${q.id}: prompt+answer != kalimat sumber`);
        /* pastikan tidak tersisa variabel teknis */
        if (/＿＿＿＿＿＿/.test(q.prompt)) problems.push(`${q.id}: rumpang ganda`);
      }
    }
    if (q.pairs) {
      const ids = q.pairs.map(p => p.vocabId);
      if (new Set(ids).size !== ids.length) problems.push(`${q.id}: vocabId match duplikat`);
      const rights = q.pairs.map(p => p.id);
      if (new Set(rights).size !== rights.length) problems.push(`${q.id}: sisi kanan match duplikat`);
      if (q.pairs.length < 4) problems.push(`${q.id}: pasangan match kurang dari 4`);
    }
    if (q.type === 'short_conversation') {
      const blanks = q.dialogue.filter(d => d.text.includes('＿＿＿')).length;
      if (blanks !== 1) problems.push(`${q.id}: dialog harus punya tepat 1 rumpang (${blanks})`);
      if (!q.answerId) problems.push(`${q.id}: answerId kosong`);
      if (!q.dialogueId || q.dialogueId.length !== q.dialogue.length) problems.push(`${q.id}: dialogueId tidak lengkap`);
      if (!q.fullJp) problems.push(`${q.id}: fullJp kosong`);
      if (!q.question) problems.push(`${q.id}: pertanyaan dialog kosong`);
      if (!/\(.*\)/.test(q.question) && !/jawabannya/.test(q.question)) {
        problems.push(`${q.id}: pertanyaan dialog tidak memuat petunjuk kunci`);
      }
    }
  }
}

/* --- validasi あります / います pada bank kalimat --- */
let existMismatch = 0;
for (const s of SENTENCES) {
  const t = s.tags;
  if (!/(あります|います|ありません|いません)/.test(s.jp)) continue;   /* pola ～です dll. */
  const usesImasu = /(います|いません|いますか)/.test(s.jp);
  if (t.living !== undefined && t.living !== usesImasu && !(t.bucket === 'nanimo')) {
    existMismatch++;
    problems.push(`存在 verb salah: ${s.jp} (living=${t.living})`);
  }
}
/* --- validasi posisi tidak dipakai dengan acuan yang salah --- */
for (const s of SENTENCES) {
  const t = s.tags;
  if ((t.posId === 'pos_ue' || t.posId === 'pos_shita') && t.refId && !THING[t.refId]) {
    problems.push(`posisi ${t.posId} harus dengan acuan benda: ${s.jp}`);
  }
}
/* --- validasi pengecoh soal tipe noun: harus dari kelas yang berlawanan --- */
for (const lvl of LEVELS) {
  for (const q of lvl.questions) {
    if (q.type === 'complete' && q._slotKind === 'noun') {
      const answerPool = LIVE_IDS.map(id => LIVE[id].jp).includes(q.answer) ? 'living' : 'thing';
      for (const opt of q.options) {
        if (opt === q.answer) continue;
        const isLiving = LIVE_IDS.map(id => LIVE[id].jp).includes(opt);
        const isThing = THING_IDS.map(id => THING[id].jp).includes(opt);
        if (!isLiving && !isThing) problems.push(`${q.id}: opsi noun tak dikenal ${opt}`);
        if (answerPool === 'living' && isLiving) problems.push(`${q.id}: opsi noun sekelas (ambigu): ${opt}`);
        if (answerPool === 'thing' && isThing) problems.push(`${q.id}: opsi noun sekelas (ambigu): ${opt}`);
      }
    }
  }
}
/* --- deteksi soal kembar (isi benar-benar sama) --- */
const seenSig = new Map();
for (const lvl of LEVELS) {
  for (const q of lvl.questions) {
    const sg = questionSig(JSON.parse(JSON.stringify(q)));
    if (seenSig.has(sg)) problems.push(`soal kembar: ${q.id} == ${seenSig.get(sg)}`);
    else seenSig.set(sg, q.id);
  }
}
/* --- distribusi bunpou --- */
const bucketMeta = {
  aru_place: 'N に N が あります',
  iru_place: 'N に N が います',
  wa_place:  'N は N に あります / います',
  neg:       'Bentuk negatif ありません / いません',
  nanimo:    '何も ありません / だれも いません',
  pos_aru:   'N1 の N2(posisi) に N が あります',
  pos_iru:   'N1 の N2(posisi) に N が います',
  pos_desu:  'N は N1 の N2(posisi) です',
  aida:      'N1 と N2 の 間に N が あります / います',
  ya_nado:   'N1 や N2 など (dan と untuk daftar lengkap)',
  q_where:   'どこに ありますか / いますか',
  q_nani:    '何が ありますか (dan jawabannya)',
  q_dare:    'だれが いますか (dan jawabannya)',
};
const bucketMissing = Object.keys(bucketMeta).filter(b => !bucketCount[b]);

const ghost = Array.from(allVocabRefs).filter(v => !VALID_VOCAB.has(v));
if (ghost.length) problems.push('id kosakata tidak dikenal: ' + ghost.join(', '));
const unusedVocab = VOCAB_BAB10.filter(v => !allVocabRefs.has(v.id));

console.log('---------------------------------------------');
console.log('Total level        :', LEVELS.length);
console.log('Total soal         :', totalQ, '(target', TOTAL_LEVELS * QUESTIONS_PER_LEVEL + ')');
console.log('Bank kalimat       :', SENTENCES.length);
console.log('Sebaran tipe soal  :', JSON.stringify(typeCount));
console.log('Sebaran bunpou     :');
for (const b of Object.keys(bucketMeta)) {
  const n = bucketCount[b] || 0;
  console.log(`   ${b.padEnd(10)} ${String(n).padStart(4)}  ${(n / 10).toFixed(1)}%  ${bucketMeta[b]}`);
}
console.log('Soal duplikat sig  :', sigDup);
console.log('Soal tanpa terjemahan:', missingTranslation);
console.log('Kalimat bank salah あります/います:', existMismatch);
if (bucketMissing.length) console.log('PERINGATAN bunpou belum terpakai:', bucketMissing.join(', '));
if (unusedVocab.length) {
  console.log('PERINGATAN kosakata belum terreferensi:', unusedVocab.map(m => m.jp).join(', '));
} else {
  console.log('OK: semua', VOCAB_BAB10.length, 'kosakata terreferensi di field vocab.');
}
if (problems.length) {
  console.log('MASALAH VALIDASI (' + problems.length + '):');
  problems.slice(0, 40).forEach(p => console.log(' -', p));
  process.exitCode = 1;
} else {
  console.log('OK: validasi generator lolos.');
}

/* ==========================================================================
 * BAGIAN 10 — TULIS OUTPUT
 * ========================================================================*/
if (problems.length) {
  console.log('File TIDAK ditulis karena masih ada masalah validasi.');
  process.exit(1);
}
const outDir = path.join(__dirname, '..', 'js', 'data');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'vocab_bab10.js'),
  `// Auto-generated. Jangan diedit manual — edit tools/generate_bab10.js lalu jalankan ulang.\nwindow.VOCAB_BAB10_DATA = ${JSON.stringify(VOCAB_BAB10, null, 2)};\n`
);
/* buang properti bantu (_bucket / _sentKey / _slotKind) dari output */
const CLEAN_LEVELS = LEVELS.map(lvl => ({
  level: lvl.level, title: lvl.title, tier: lvl.tier, focus: lvl.focus, theme: lvl.theme,
  questions: lvl.questions.map(q => {
    const c = {};
    for (const k of Object.keys(q)) if (!k.startsWith('_')) c[k] = q[k];
    return c;
  }),
}));
fs.writeFileSync(
  path.join(outDir, 'levels_bab10.js'),
  `// Auto-generated. Jangan diedit manual — edit tools/generate_bab10.js lalu jalankan ulang.\nwindow.LEVELS_BAB10_DATA = ${JSON.stringify(CLEAN_LEVELS)};\n`
);
console.log('Selesai! Output: js/data/vocab_bab10.js & js/data/levels_bab10.js');
