/* ============================================================================
 * tools/generate_bab10.js  —  GENERATOR SOAL BAB 10 (ANTI-MONOTON)
 * ----------------------------------------------------------------------------
 * Minna no Nihongo I — Bab 10 (あります / います / に / が / は / の /
 * ～や～など / 上・下・前・後ろ・右・左・中・外・隣・近く・間 /
 * どこ・だれ・何)
 *
 * Acuan bunpou (Tata Bahasa Bab 10):
 *   1. N (tempat) に N (benda) が あります            → Di [tempat] ada [benda]
 *   2. N (tempat) に N (orang/hewan) が います        → Di [tempat] ada [orang/hewan]
 *   3. N (benda/orang/hewan) は N (tempat) に あります / います
 *   4. N1 の N2 (posisi) に N が あります / います
 *        posisi: 上 / 下 / 前 / 後ろ / 右 / 左 / 中 / 外 / 隣 / 近く
 *   5. N1 と N2 の 間に N が あります / います
 *   6. N1 や N2 (など)                                → ... dan lain-lain
 *   7. Kata tanya: どこ / だれ / 何  (+ だれが / 何が)
 *
 * Skema soal (7 tipe) SAMA PERSIS dengan js/questions.js:
 *   arrange, translate, complete, match, short_conversation,
 *   choose_translation, listening
 *
 * Setiap soal juga membawa metadata terjemahan untuk fitur
 * "Tampilan Terjemahan Setelah Menjawab" (js/translation.js):
 *   translation  → terjemahan Bahasa Indonesia utuh
 *   reading      → cara baca kana
 *   romaji       → cara baca romaji
 *   dialogueId   → terjemahan per baris (khusus short_conversation)
 *
 * Output:
 *   js/data/vocab_bab10.js  -> window.VOCAB_BAB10_DATA
 *   js/data/levels_bab10.js -> window.LEVELS_BAB10_DATA
 *
 * Jalankan:  node tools/generate_bab10.js
 * ==========================================================================*/

const fs = require('fs');
const path = require('path');

/* ==========================================================================
 * BAGIAN 1 — UTILITAS (SEEDED RNG reproducible + konverter romaji)
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
function weightedPick(pairs, rnd) {
  const total = pairs.reduce((a, p) => a + p.w, 0);
  let r = rnd() * total;
  for (const p of pairs) { r -= p.w; if (r <= 0) return p.v; }
  return pairs[pairs.length - 1].v;
}
function capital(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

/* Token kalimat: s = tulisan, r = kana, m = romaji */
function T(s, r, m) { return { s, r, m: m === undefined ? r : m }; }
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
  /* katakana -> hiragana */
  let s = String(kanaStr).replace(/[\u30A1-\u30F6]/g, m =>
    String.fromCharCode(m.charCodeAt(0) - 0x60));
  /* partikel は yang berdiri sendiri dibaca "wa" */
  s = s.replace(/(^|\s)は(?=\s|$)/g, '$1わ');
  let out = '';
  let pendingDouble = false;   /* sokuon っ */
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
 * BAGIAN 2 — DATABASE KOSAKATA BAB 10 (kanji standar N5/Bab 10 dipertahankan)
 * ========================================================================*/

/* --- Posisi relatif (Bunpou 4) --- */
const B10_POS = [
  { id: 'pos_ue',      jp: '上',   kana: 'うえ',   mean: 'atas' },
  { id: 'pos_shita',   jp: '下',   kana: 'した',   mean: 'bawah' },
  { id: 'pos_mae',     jp: '前',   kana: 'まえ',   mean: 'depan' },
  { id: 'pos_ushiro',  jp: '後ろ', kana: 'うしろ', mean: 'belakang' },
  { id: 'pos_migi',    jp: '右',   kana: 'みぎ',   mean: 'kanan' },
  { id: 'pos_hidari',  jp: '左',   kana: 'ひだり', mean: 'kiri' },
  { id: 'pos_naka',    jp: '中',   kana: 'なか',   mean: 'dalam' },
  { id: 'pos_soto',    jp: '外',   kana: 'そと',   mean: 'luar' },
  { id: 'pos_tonari',  jp: '隣',   kana: 'となり', mean: 'sebelah' },
  { id: 'pos_chikaku', jp: '近く', kana: 'ちかく', mean: 'dekat' },
  { id: 'pos_aida',    jp: '間',   kana: 'あいだ', mean: 'di antara' },
];

/* --- Benda mati (pakai あります) --- */
const B10_THINGS = [
  { id: 'n_hako',      jp: '箱',       kana: 'はこ',       mean: 'kotak',              topic: 'rumah',     ref: true },
  { id: 'n_reizouko',  jp: '冷蔵庫',   kana: 'れいぞうこ', mean: 'kulkas',             topic: 'rumah',     ref: true },
  { id: 'n_tana',      jp: '棚',       kana: 'たな',       mean: 'rak / lemari',       topic: 'rumah',     ref: true },
  { id: 'n_mado',      jp: '窓',       kana: 'まど',       mean: 'jendela',            topic: 'rumah',     ref: true },
  { id: 'n_tsukue',    jp: '机',       kana: 'つくえ',     mean: 'meja',               topic: 'rumah',     ref: true },
  { id: 'n_isu',       jp: 'いす',     kana: 'いす',       mean: 'kursi',              topic: 'rumah',     ref: true },
  { id: 'n_teeburu',   jp: 'テーブル', kana: 'テーブル',   mean: 'meja (model Barat)', topic: 'rumah',     ref: true },
  { id: 'n_sofa',      jp: 'ソファ',   kana: 'ソファ',     mean: 'sofa',               topic: 'rumah',     ref: true },
  { id: 'n_denwa',     jp: '電話',     kana: 'でんわ',     mean: 'telepon',            topic: 'rumah' },
  { id: 'n_terebi',    jp: 'テレビ',   kana: 'テレビ',     mean: 'televisi',           topic: 'rumah' },
  { id: 'n_tokei',     jp: '時計',     kana: 'とけい',     mean: 'jam',                topic: 'rumah' },
  { id: 'n_karendaa',  jp: 'カレンダー', kana: 'カレンダー', mean: 'kalender',           topic: 'rumah' },
  { id: 'n_kasa',      jp: '傘',       kana: 'かさ',       mean: 'payung',             topic: 'benda' },
  { id: 'n_kutsu',     jp: '靴',       kana: 'くつ',       mean: 'sepatu',             topic: 'benda' },
  { id: 'n_kaban',     jp: 'かばん',   kana: 'かばん',     mean: 'tas',                topic: 'benda' },
  { id: 'n_kagi',      jp: '鍵',       kana: 'かぎ',       mean: 'kunci',              topic: 'benda' },
  { id: 'n_hon',       jp: '本',       kana: 'ほん',       mean: 'buku',               topic: 'benda' },
  { id: 'n_jisho',     jp: '辞書',     kana: 'じしょ',     mean: 'kamus',              topic: 'benda' },
  { id: 'n_nooto',     jp: 'ノート',   kana: 'ノート',     mean: 'buku catatan',       topic: 'benda' },
  { id: 'n_enpitsu',   jp: '鉛筆',     kana: 'えんぴつ',   mean: 'pensil',             topic: 'benda' },
  { id: 'n_keshigomu', jp: '消しゴム', kana: 'けしゴム',   mean: 'penghapus',          topic: 'benda' },
  { id: 'n_chiketto',  jp: 'チケット', kana: 'チケット',   mean: 'tiket / karcis',     topic: 'benda' },
  { id: 'n_pasokon',   jp: 'パソコン', kana: 'パソコン',   mean: 'komputer',           topic: 'benda' },
  { id: 'n_mizu',      jp: '水',       kana: 'みず',       mean: 'air',                topic: 'makanan' },
  { id: 'n_okashi',    jp: 'お菓子',   kana: 'おかし',     mean: 'kue / makanan ringan', topic: 'makanan' },
  { id: 'n_hana',      jp: '花',       kana: 'はな',       mean: 'bunga',              topic: 'benda' },
  { id: 'n_kuruma',    jp: '車',       kana: 'くるま',     mean: 'mobil',              topic: 'transport', ref: true },
  { id: 'n_jitensha',  jp: '自転車',   kana: 'じてんしゃ', mean: 'sepeda',             topic: 'transport', ref: true },
  { id: 'n_post',      jp: 'ポスト',   kana: 'ポスト',     mean: 'kotak pos',          topic: 'kota',      ref: true },
  { id: 'n_denchuu',   jp: '電柱',     kana: 'でんちゅう', mean: 'tiang listrik',      topic: 'kota',      ref: true },
  { id: 'n_ki',        jp: '木',       kana: 'き',         mean: 'pohon',              topic: 'kota',      ref: true },
  { id: 'n_yama',      jp: '山',       kana: 'やま',       mean: 'gunung',             topic: 'alam' },
];

/* --- Tempat (lokasi) --- */
const B10_PLACES = [
  { id: 'n_kouen',       jp: '公園',     kana: 'こうえん',     mean: 'taman',                        topic: 'kota' },
  { id: 'n_kissaten',    jp: '喫茶店',   kana: 'きっさてん',   mean: 'kedai kopi',                   topic: 'kota' },
  { id: 'n_honya',       jp: '本屋',     kana: 'ほんや',       mean: 'toko buku',                    topic: 'kota' },
  { id: 'n_noriba',      jp: '乗り場',   kana: 'のりば',       mean: 'halte / tempat naik kendaraan', topic: 'kota' },
  { id: 'n_eki',         jp: '駅',       kana: 'えき',         mean: 'stasiun',                      topic: 'kota' },
  { id: 'n_ginkou',      jp: '銀行',     kana: 'ぎんこう',     mean: 'bank',                         topic: 'kota' },
  { id: 'n_yuubinkyoku', jp: '郵便局',   kana: 'ゆうびんきょく', mean: 'kantor pos',                 topic: 'kota' },
  { id: 'n_byouin',      jp: '病院',     kana: 'びょういん',   mean: 'rumah sakit',                  topic: 'kota' },
  { id: 'n_gakkou',      jp: '学校',     kana: 'がっこう',     mean: 'sekolah',                      topic: 'kota' },
  { id: 'n_daigaku',     jp: '大学',     kana: 'だいがく',     mean: 'universitas',                  topic: 'kota' },
  { id: 'n_konbini',     jp: 'コンビニ', kana: 'コンビニ',     mean: 'minimarket',                   topic: 'kota' },
  { id: 'n_suupaa',      jp: 'スーパー', kana: 'スーパー',     mean: 'supermarket',                  topic: 'kota' },
  { id: 'n_resutoran',   jp: 'レストラン', kana: 'レストラン', mean: 'restoran',                     topic: 'kota' },
  { id: 'n_hoteru',      jp: 'ホテル',   kana: 'ホテル',       mean: 'hotel',                        topic: 'kota' },
  { id: 'n_depaato',     jp: 'デパート', kana: 'デパート',     mean: 'toserba',                      topic: 'kota' },
  { id: 'n_mise',        jp: '店',       kana: 'みせ',         mean: 'toko',                         topic: 'kota' },
  { id: 'n_biru',        jp: 'ビル',     kana: 'ビル',         mean: 'gedung',                       topic: 'kota' },
  { id: 'n_kaisha',      jp: '会社',     kana: 'かいしゃ',     mean: 'perusahaan / kantor',          topic: 'kota' },
  { id: 'n_kyoushitsu',  jp: '教室',     kana: 'きょうしつ',   mean: 'ruang kelas',                  topic: 'bangunan' },
  { id: 'n_jimusho',     jp: '事務所',   kana: 'じむしょ',     mean: 'kantor (ruang kerja)',         topic: 'bangunan' },
  { id: 'n_toshokan',    jp: '図書館',   kana: 'としょかん',   mean: 'perpustakaan',                 topic: 'bangunan' },
  { id: 'n_ryou',        jp: '寮',       kana: 'りょう',       mean: 'asrama',                       topic: 'bangunan' },
  { id: 'n_heya',        jp: '部屋',     kana: 'へや',         mean: 'kamar',                        topic: 'bangunan' },
  { id: 'n_toire',       jp: 'トイレ',   kana: 'トイレ',       mean: 'toilet',                       topic: 'bangunan' },
  { id: 'n_daidokoro',   jp: '台所',     kana: 'だいどころ',   mean: 'dapur',                        topic: 'bangunan' },
  { id: 'n_niwa',        jp: '庭',       kana: 'にわ',         mean: 'halaman rumah',                topic: 'bangunan' },
  { id: 'n_ie',          jp: '家',       kana: 'いえ',         mean: 'rumah',                        topic: 'bangunan' },
  { id: 'n_machi',       jp: '町',       kana: 'まち',         mean: 'kota',                         topic: 'luas' },
  { id: 'n_kuni',        jp: '国',       kana: 'くに',         mean: 'negara',                       topic: 'luas' },
];

/* --- Makhluk hidup (pakai います) --- */
const B10_LIVINGS = [
  { id: 'n_inu',        jp: '犬',       kana: 'いぬ',       mean: 'anjing',              group: 'hewan' },
  { id: 'n_neko',       jp: '猫',       kana: 'ねこ',       mean: 'kucing',              group: 'hewan' },
  { id: 'n_tori',       jp: '鳥',       kana: 'とり',       mean: 'burung',              group: 'hewan' },
  { id: 'n_sakana',     jp: '魚',       kana: 'さかな',     mean: 'ikan',                group: 'hewan' },
  { id: 'n_otokonohito', jp: '男の人',  kana: 'おとこのひと', mean: 'laki-laki (pria)',   group: 'orang' },
  { id: 'n_onnanohito', jp: '女の人',   kana: 'おんなのひと', mean: 'perempuan (wanita)', group: 'orang' },
  { id: 'n_otokonoko',  jp: '男の子',   kana: 'おとこのこ', mean: 'anak laki-laki',      group: 'orang' },
  { id: 'n_onnanoko',   jp: '女の子',   kana: 'おんなのこ', mean: 'anak perempuan',      group: 'orang' },
  { id: 'n_sensei',     jp: '先生',     kana: 'せんせい',   mean: 'guru',                group: 'orang' },
  { id: 'n_gakusei',    jp: '学生',     kana: 'がくせい',   mean: 'pelajar',             group: 'orang' },
  { id: 'n_kaishain',   jp: '会社員',   kana: 'かいしゃいん', mean: 'karyawan',          group: 'orang' },
  { id: 'n_tomodachi',  jp: '友達',     kana: 'ともだち',   mean: 'teman',               group: 'orang' },
  { id: 'n_kodomo',     jp: '子ども',   kana: 'こども',     mean: 'anak',                group: 'orang' },
  { id: 'n_hito',       jp: '人',       kana: 'ひと',       mean: 'orang',               group: 'orang' },
  { id: 'n_otousan',    jp: 'お父さん', kana: 'おとうさん', mean: 'ayah',                group: 'keluarga' },
  { id: 'n_okaasan',    jp: 'お母さん', kana: 'おかあさん', mean: 'ibu',                 group: 'keluarga' },
];

/* --- Kata kerja eksistensi --- */
const B10_VERB = [
  { id: 'v_arimasu', jp: 'あります', kana: 'あります', mean: 'ada (untuk benda mati)' },
  { id: 'v_imasu',   jp: 'います',   kana: 'います',   mean: 'ada (untuk makhluk hidup)' },
];

/* --- Partikel & ungkapan Bab 10 --- */
const B10_PARTICLES = [
  { id: 'p_ni', jp: 'に',   kana: 'に', mean: 'partikel tempat (di / ke)' },
  { id: 'p_ga', jp: 'が',   kana: 'が', mean: 'partikel penanda subjek' },
  { id: 'p_wa', jp: 'は',   kana: 'わ', mean: 'partikel penanda topik' },
  { id: 'p_no', jp: 'の',   kana: 'の', mean: 'partikel penghubung / kepemilikan' },
  { id: 'p_ya', jp: 'や',   kana: 'や', mean: 'partikel penyebutan sebagian (… dan …)' },
];
const B10_EXPR = [
  { id: 'e_doko',             jp: 'どこ',                 kana: 'どこ',                 mean: 'di mana' },
  { id: 'e_dare',             jp: 'だれ',                 kana: 'だれ',                 mean: 'siapa' },
  { id: 'e_nani',             jp: '何',                   kana: 'なに',                 mean: 'apa' },
  { id: 'e_dono',             jp: 'どの',                 kana: 'どの',                 mean: 'yang mana' },
  { id: 'e_nado',             jp: 'など',                 kana: 'など',                 mean: 'dan lain-lain' },
  { id: 'e_sumimasen',        jp: 'すみません',           kana: 'すみません',           mean: 'permisi / maaf' },
  { id: 'e_arigatou',         jp: 'ありがとう ございます', kana: 'ありがとう ございます', mean: 'terima kasih' },
  { id: 'e_douitashimashite', jp: 'どういたしまして',     kana: 'どういたしまして',     mean: 'sama-sama' },
  { id: 'e_chotto',           jp: 'ちょっと',             kana: 'ちょっと',             mean: 'sebentar / sedikit' },
  { id: 'e_eeto',             jp: 'ええと',               kana: 'ええと',               mean: 'anu / hmm' },
  { id: 'e_soudesuka',        jp: 'そうですか',           kana: 'そうですか',           mean: 'begitu ya' },
  { id: 'e_ee',               jp: 'ええ',                 kana: 'ええ',                 mean: 'ya' },
  { id: 'e_iie',              jp: 'いいえ',               kana: 'いいえ',               mean: 'tidak' },
];

/* Nama tokoh standar Minna no Nihongo */
const NAMES = [
  { jp: 'ミラーさん',   kana: 'ミラーさん',   mean: 'Sdr. Miller' },
  { jp: 'ワットさん',   kana: 'ワットさん',   mean: 'Sdr. Watt' },
  { jp: '山田さん',     kana: 'やまださん',   mean: 'Sdr. Yamada' },
  { jp: '松本さん',     kana: 'まつもとさん', mean: 'Sdr. Matsumoto' },
  { jp: 'サントスさん', kana: 'サントスさん', mean: 'Sdr. Santos' },
  { jp: 'カリナさん',   kana: 'カリナさん',   mean: 'Sdr. Karina' },
  { jp: 'リンさん',     kana: 'リンさん',     mean: 'Sdr. Rin' },
  { jp: 'キムさん',     kana: 'キムさん',     mean: 'Sdr. Kim' },
];

/* Lengkapi semua entri dengan romaji otomatis dari kana */
[...B10_POS, ...B10_THINGS, ...B10_PLACES, ...B10_LIVINGS, ...B10_VERB,
 ...B10_PARTICLES, ...B10_EXPR, ...NAMES].forEach(v => { v.rom = toRomaji(v.kana); });

/* Peta cepat */
const THING = {};  B10_THINGS.forEach(t => { THING[t.id] = t; });
const PLACE = {};  B10_PLACES.forEach(t => { PLACE[t.id] = t; });
const LIVE = {};   B10_LIVINGS.forEach(t => { LIVE[t.id] = t; });
const POS = {};    B10_POS.forEach(t => { POS[t.id] = t; });
/* 国 / 町 terlalu luas untuk jadi acuan posisi ("di dekat negara" tidak wajar) */
const NON_CONCRETE = new Set(['n_kuni', 'n_machi']);
const REF_POINTS = [...B10_THINGS.filter(t => t.ref), ...B10_PLACES.filter(pl => !NON_CONCRETE.has(pl.id))];
/* hanya "wadah/ruang" yang wajar dipakai dengan 中 / 外 */
const CONTAINER_IDS = new Set([
  'n_hako', 'n_reizouko', 'n_tana', 'n_tsukue', 'n_kuruma', 'n_post',
  'n_heya', 'n_kyoushitsu', 'n_jimusho', 'n_toshokan', 'n_byouin', 'n_gakkou', 'n_daigaku',
  'n_kaisha', 'n_honya', 'n_kissaten', 'n_resutoran', 'n_konbini', 'n_suupaa', 'n_depaato',
  'n_hoteru', 'n_biru', 'n_ie', 'n_ryou', 'n_toire', 'n_daidokoro', 'n_niwa', 'n_kouen',
]);
const CONTAINER_REFS = REF_POINTS.filter(r => CONTAINER_IDS.has(r.id));
const REF_IDS = new Set(REF_POINTS.map(r => r.id));

const VALID_VOCAB = new Set(
  [...B10_POS, ...B10_THINGS, ...B10_PLACES, ...B10_LIVINGS, ...B10_VERB,
   ...B10_PARTICLES, ...B10_EXPR].map(v => v.id)
);

/* Daftar kosakata final untuk js/data/vocab_bab10.js */
const VOCAB_BAB10 = [
  ...B10_VERB.map(v => ({ id: v.id, jp: v.jp, kana: v.kana, romaji: v.rom, id_mean: v.mean, type: 'verb' })),
  ...B10_POS.map(v => ({ id: v.id, jp: v.jp, kana: v.kana, romaji: v.rom, id_mean: v.mean, type: 'position' })),
  ...B10_THINGS.map(v => ({ id: v.id, jp: v.jp, kana: v.kana, romaji: v.rom, id_mean: v.mean, type: 'noun' })),
  ...B10_PLACES.map(v => ({ id: v.id, jp: v.jp, kana: v.kana, romaji: v.rom, id_mean: v.mean, type: 'noun_place' })),
  ...B10_LIVINGS.map(v => ({ id: v.id, jp: v.jp, kana: v.kana, romaji: v.rom, id_mean: v.mean, type: 'noun_living' })),
  ...B10_PARTICLES.map(v => ({ id: v.id, jp: v.jp, kana: v.kana, romaji: v.rom, id_mean: v.mean, type: 'particle' })),
  ...B10_EXPR.map(v => ({ id: v.id, jp: v.jp, kana: v.kana, romaji: v.rom, id_mean: v.mean, type: 'expr' })),
];

/* ==========================================================================
 * BAGIAN 3 — PERAKIT KALIMAT (COLLOCATION ENGINE)
 * ========================================================================*/
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

/* Pembentuk token: kata + partikel */
function tok(word, particle) {
  const p = particle || '';
  const pRom = p === 'は' ? 'wa' : p === 'を' ? 'o' : toRomaji(p);
  return T(word.jp + p, word.kana + (p === 'は' ? 'わ' : p), word.rom + (p ? ' ' + pRom : ''));
}
const PRED = {
  arimasu:   T('あります', 'あります', 'arimasu'),
  arimasen:  T('ありません', 'ありません', 'arimasen'),
  imasu:     T('います', 'います', 'imasu'),
  imasen:    T('いません', 'いません', 'imasen'),
};
function existPred(living, pol) {
  if (living) return pol === 'aff' ? PRED.imasu : PRED.imasen;
  return pol === 'aff' ? PRED.arimasu : PRED.arimasen;
}
function existVerbId(living) { return living ? 'v_imasu' : 'v_arimasu'; }
/* Kata posisi polos ("atas", "depan", …) — kata depan "di" ditulis di template
 * kalimat Bahasa Indonesia supaya tidak muncul "di di …". */
function posMean(pos) {
  const map = {
    pos_ue: 'atas', pos_shita: 'bawah', pos_mae: 'depan', pos_ushiro: 'belakang',
    pos_migi: 'kanan', pos_hidari: 'kiri', pos_naka: 'dalam', pos_soto: 'luar',
    pos_tonari: 'sebelah', pos_chikaku: 'dekat', pos_aida: 'antara',
  };
  return map[pos.id];
}

/* --- zona kewajaran: benda/orang dalam ruangan vs luar ruangan --------------
 * Mencegah kalimat janggal seperti 「公園に 冷蔵庫が あります」 atau
 * 「部屋に 山が あります」. */
const INDOOR_PLACES = new Set([
  'n_heya', 'n_toire', 'n_kyoushitsu', 'n_jimusho', 'n_daidokoro', 'n_ryou', 'n_ie',
  'n_toshokan', 'n_byouin', 'n_gakkou', 'n_daigaku', 'n_kaisha', 'n_honya',
  'n_kissaten', 'n_resutoran', 'n_konbini', 'n_suupaa', 'n_depaato', 'n_hoteru', 'n_biru',
]);
const OUTDOOR_PLACES = new Set(['n_kouen', 'n_niwa', 'n_machi', 'n_kuni', 'n_noriba']);
const OUTDOOR_THINGS = new Set(['n_ki', 'n_yama', 'n_denchuu', 'n_kuruma', 'n_jitensha', 'n_post']);
/* catatan: n_post sengaja 'out' agar tidak dipasangkan dengan benda dalam ruangan */
const INDOOR_THINGS = new Set([
  'n_reizouko', 'n_sofa', 'n_teeburu', 'n_isu', 'n_tsukue', 'n_tana', 'n_mado',
  'n_terebi', 'n_denwa', 'n_pasokon', 'n_karendaa', 'n_keshigomu', 'n_enpitsu',
  'n_nooto', 'n_jisho',
]);
const INDOOR_LIVINGS = new Set(['n_sakana']);

function zoneOfPlace(w) { return INDOOR_PLACES.has(w.id) ? 'in' : OUTDOOR_PLACES.has(w.id) ? 'out' : 'any'; }
function zoneOfSubj(w) {
  if (OUTDOOR_THINGS.has(w.id)) return 'out';
  if (INDOOR_THINGS.has(w.id) || INDOOR_LIVINGS.has(w.id)) return 'in';
  return 'any';
}
function compatible(subj, place) {
  if (LANDSCAPE_THINGS.has(subj.id) && NARROW_PLACES.has(place.id)) return false;
  const zs = zoneOfSubj(subj), zp = zoneOfPlace(place);
  return zs === 'any' || zp === 'any' || zs === zp;
}
/* Kewajaran posisi terhadap acuannya:
 *   上 / 下      → hanya wajar dengan acuan BENDA (机の上, 箱の下)
 *   中 / 外      → wajar dengan benda maupun tempat (箱の中, 教室の中)
 *   前・後ろ・右・左・隣・近く → wajar dengan benda maupun tempat        */
const THING_ONLY_POS = new Set(['pos_ue', 'pos_shita']);
const CONTAINER_POS = new Set(['pos_naka', 'pos_soto']);
const PLACE_POS_IDS = ['pos_mae', 'pos_ushiro', 'pos_migi', 'pos_hidari', 'pos_tonari', 'pos_chikaku'];
const THING_REFS = B10_THINGS.filter(t => t.ref);
function refsForPos(pos) {
  if (THING_ONLY_POS.has(pos.id)) return THING_REFS;
  if (CONTAINER_POS.has(pos.id)) return CONTAINER_REFS;
  return REF_POINTS;
}
function pickRefPos(rnd) {
  const r = rnd();
  if (r < 0.28) {
    const pos = pick(B10_POS.filter(x => THING_ONLY_POS.has(x.id)), rnd);
    return { pos, ref: pick(THING_REFS, rnd) };
  }
  if (r < 0.52) {
    const pos = pick(B10_POS.filter(x => CONTAINER_POS.has(x.id)), rnd);
    return { pos, ref: pick(CONTAINER_REFS.filter(x => THING[x.id] !== undefined), rnd) };
  }
  if (r < 0.76) {
    const pos = pick(B10_POS.filter(x => CONTAINER_POS.has(x.id)), rnd);
    return { pos, ref: pick(CONTAINER_REFS.filter(x => PLACE[x.id] !== undefined), rnd) };
  }
  const pos = pick(B10_POS.filter(x => PLACE_POS_IDS.includes(x.id)), rnd);
  return { pos, ref: pick(REF_POINTS, rnd) };
}

/* Tempat sempit tidak cocok dengan objek lanskap (山 / 木 / 電柱) */
const NARROW_PLACES = new Set(['n_niwa', 'n_noriba']);
const LANDSCAPE_THINGS = new Set(['n_yama', 'n_ki', 'n_denchuu']);

/* Benda besar tidak wajar "di dalam / di atas" wadah kecil */
const BULKY_THINGS = new Set(['n_sofa', 'n_teeburu', 'n_reizouko', 'n_tsukue', 'n_kuruma',
                              'n_jitensha', 'n_tana', 'n_isu', 'n_mado']);
const FURNITURE_IDS = new Set(['n_tsukue', 'n_teeburu', 'n_sofa', 'n_tana', 'n_isu',
                               'n_kuruma', 'n_hako']);

/* Posisi yang wajar untuk sebuah subjek pada acuan tertentu:
 *   makhluk hidup : 上/下 hanya hewan + perabot, 中 hanya hewan + wadah
 *   benda         : benda besar tidak masuk ke 中/外/上                    */
function posOkFor(pos, subj, living, ref) {
  if (!subj || !pos) return true;
  const refId = ref ? ref.id : null;
  if (!living) {
    if (BULKY_THINGS.has(subj.id) &&
        (CONTAINER_POS.has(pos.id) || pos.id === 'pos_ue' || pos.id === 'pos_shita')) return false;
    return true;
  }
  const animal = subj.group === 'hewan';
  if (pos.id === 'pos_ue') return animal && FURNITURE_IDS.has(refId);
  if (pos.id === 'pos_shita') return animal && (FURNITURE_IDS.has(refId) || CONTAINER_IDS.has(refId));
  if (pos.id === 'pos_naka') return animal && CONTAINER_IDS.has(refId);
  return true;
}

function compatibleRef(subj, ref) {
  /* acuan posisi bisa berupa tempat ATAU benda (机 / 箱 / 冷蔵庫) */
  if (LANDSCAPE_THINGS.has(subj.id) && NARROW_PLACES.has(ref.id)) return false;
  const zp = PLACE[ref.id] ? zoneOfPlace(ref) : (OUTDOOR_THINGS.has(ref.id) ? 'out' : INDOOR_THINGS.has(ref.id) ? 'in' : 'any');
  const zs = zoneOfSubj(subj);
  return zs === 'any' || zp === 'any' || zs === zp;
}

/* --- POLA A/B : N(tempat) に N が あります / います ------------------------ */
function buildPlaceExist(rnd) {
  const out = [];
  for (const place of B10_PLACES) {
    for (const pol of ['aff', 'neg']) {
      /* benda mati */
      for (const thing of pickN(B10_THINGS.filter(t => compatible(t, place)), 6, rnd)) {
        const tokens = [tok(place, 'に'), tok(thing, 'が'), existPred(false, pol)];
        const predIdx = tokens.length - 1;
        const idn = pol === 'aff'
          ? `Di ${place.mean} ada ${thing.mean}.`
          : `Di ${place.mean} tidak ada ${thing.mean}.`;
        out.push(mkSent(tokens, {
          idn,
          vocab: [existVerbId(false), place.id, thing.id, 'p_ni', 'p_ga'],
          slots: [
            { kind: 'particle', tokIndex: 0, answer: 'に', cls: 'p_ni' },
            { kind: 'particle', tokIndex: 1, answer: 'が', cls: 'p_ga' },
            { kind: 'predicate', tokIndex: predIdx, answer: tokens[predIdx].s, cls: pol === 'aff' ? 'pred_aru' : 'pred_arenai' },
            { kind: 'noun', tokIndex: 0, answer: tokens[0].s, group: 'place_ni', nounId: place.id },
            { kind: 'noun', tokIndex: 1, answer: tokens[1].s, group: 'thing_ga', nounId: thing.id },
          ],
          tags: { pattern: pol === 'aff' ? 'aru_place_aff' : 'aru_place_neg', living: false, pol,
                  placeId: place.id, placeMean: place.mean, subjId: thing.id, subjMean: thing.mean },
        }));
      }
      /* makhluk hidup */
      for (const live of pickN(B10_LIVINGS.filter(t => compatible(t, place)), 5, rnd)) {
        const tokens = [tok(place, 'に'), tok(live, 'が'), existPred(true, pol)];
        const predIdx = tokens.length - 1;
        const idn = pol === 'aff'
          ? `Di ${place.mean} ada ${live.mean}.`
          : `Di ${place.mean} tidak ada ${live.mean}.`;
        out.push(mkSent(tokens, {
          idn,
          vocab: [existVerbId(true), place.id, live.id, 'p_ni', 'p_ga'],
          slots: [
            { kind: 'particle', tokIndex: 0, answer: 'に', cls: 'p_ni' },
            { kind: 'particle', tokIndex: 1, answer: 'が', cls: 'p_ga' },
            { kind: 'predicate', tokIndex: predIdx, answer: tokens[predIdx].s, cls: pol === 'aff' ? 'pred_iru' : 'pred_inai' },
            { kind: 'noun', tokIndex: 0, answer: tokens[0].s, group: 'place_ni', nounId: place.id },
            { kind: 'noun', tokIndex: 1, answer: tokens[1].s, group: 'living_ga', nounId: live.id },
          ],
          tags: { pattern: pol === 'aff' ? 'iru_place_aff' : 'iru_place_neg', living: true, pol,
                  placeId: place.id, placeMean: place.mean, subjId: live.id, subjMean: live.mean },
        }));
      }
    }
  }
  return out;
}

/* --- POLA C : N(benda/orang) は N(tempat) に あります / います ------------- */
function buildWaExist(rnd) {
  const out = [];
  const subjects = [
    ...B10_THINGS.map(t => ({ w: t, living: false })),
    ...B10_LIVINGS.map(t => ({ w: t, living: true })),
  ];
  for (const s of subjects) {
    for (const pol of ['aff', 'neg']) {
      for (const place of pickN(B10_PLACES.filter(pl => compatible(s.w, pl)), 5, rnd)) {
        const tokens = [tok(s.w, 'は'), tok(place, 'に'), existPred(s.living, pol)];
        const predIdx = tokens.length - 1;
        const verbId = s.living ? 'ada' : 'ada';
        const idn = pol === 'aff'
          ? `${capital(s.w.mean)} ${verbId} di ${place.mean}.`
          : `${capital(s.w.mean)} tidak ada di ${place.mean}.`;
        out.push(mkSent(tokens, {
          idn,
          vocab: [existVerbId(s.living), s.w.id, place.id, 'p_wa', 'p_ni'],
          slots: [
            { kind: 'particle', tokIndex: 0, answer: 'は', cls: 'p_wa' },
            { kind: 'particle', tokIndex: 1, answer: 'に', cls: 'p_ni' },
            { kind: 'predicate', tokIndex: predIdx, answer: tokens[predIdx].s,
              cls: s.living ? (pol === 'aff' ? 'pred_iru' : 'pred_inai') : (pol === 'aff' ? 'pred_aru' : 'pred_arenai') },
            { kind: 'noun', tokIndex: 1, answer: tokens[1].s, group: 'place_ni', nounId: place.id },
          ],
          tags: { pattern: (s.living ? 'wa_iru_' : 'wa_aru_') + pol, living: s.living, pol,
                  placeId: place.id, placeMean: place.mean, subjId: s.w.id, subjMean: s.w.mean },
        }));
      }
    }
  }
  return out;
}

/* --- POLA D : N1 の N2(posisi) に N が あります / います ------------------- */
function buildPositionExist(rnd) {
  const out = [];
  const usablePos = B10_POS.filter(p => p.id !== 'pos_aida');
  for (const pos of usablePos) {
    for (const ref of pickN(refsForPos(pos), 9, rnd)) {
      for (const pol of ['aff', 'neg']) {
        const candThings = pickN(B10_THINGS.filter(t => t.id !== ref.id && compatibleRef(t, ref)), 3, rnd);
        const candLives = pickN(B10_LIVINGS.filter(t => compatibleRef(t, ref)), 2, rnd);
        for (const subj of [...candThings.map(t => ({ w: t, living: false })),
                            ...candLives.map(t => ({ w: t, living: true }))]) {
          if (subj.w.id === ref.id) continue;
          if (!posOkFor(pos, subj.w, subj.living, ref)) continue;
          const tokens = [tok(ref, 'の'), tok(pos, 'に'), tok(subj.w, 'が'), existPred(subj.living, pol)];
          const predIdx = tokens.length - 1;
          const neg = pol === 'neg' ? 'tidak ' : '';
          const idn = `Di ${posMean(pos)} ${ref.mean} ${neg}ada ${subj.w.mean}.`;
          out.push(mkSent(tokens, {
            idn,
            vocab: [existVerbId(subj.living), ref.id, pos.id, subj.w.id, 'p_no', 'p_ni', 'p_ga'],
            slots: [
              { kind: 'particle', tokIndex: 0, answer: 'の', cls: 'p_no' },
              { kind: 'particle', tokIndex: 1, answer: 'に', cls: 'p_ni' },
              { kind: 'particle', tokIndex: 2, answer: 'が', cls: 'p_ga' },
              { kind: 'position', tokIndex: 1, answer: pos.jp, posId: pos.id },
              { kind: 'predicate', tokIndex: predIdx, answer: tokens[predIdx].s,
                cls: subj.living ? (pol === 'aff' ? 'pred_iru' : 'pred_inai') : (pol === 'aff' ? 'pred_aru' : 'pred_arenai') },
              { kind: 'noun', tokIndex: 0, answer: tokens[0].s, group: 'ref_no', nounId: ref.id },
              { kind: 'noun', tokIndex: 2, answer: tokens[2].s,
                group: subj.living ? 'living_ga' : 'thing_ga', nounId: subj.w.id },
            ],
            tags: { pattern: 'pos_' + (subj.living ? 'iru_' : 'aru_') + pol, living: subj.living, pol,
                    posId: pos.id, posMean: posMean(pos), refId: ref.id, refMean: ref.mean,
                    subjId: subj.w.id, subjMean: subj.w.mean },
          }));
        }
      }
    }
  }
  return out;
}

/* --- POLA E : N1 と N2 の 間に N が あります / います ---------------------- */
function buildAida(rnd) {
  const out = [];
  const pairs = [];
  for (const a of pickN(REF_POINTS, 10, rnd)) {
    for (const b of pickN(REF_POINTS.filter(x => x.id !== a.id), 2, rnd)) {
      if (a.id < b.id) pairs.push([a, b]); else pairs.push([b, a]);
    }
  }
  const seen = new Set();
  for (const [a, b] of pairs) {
    const k = a.id + '|' + b.id;
    if (seen.has(k)) continue;
    seen.add(k);
    for (const pol of ['aff', 'neg']) {
      for (const subj of [...pickN(B10_THINGS.filter(t => compatibleRef(t, a) && compatibleRef(t, b)), 2, rnd).map(t => ({ w: t, living: false })),
                          ...pickN(B10_LIVINGS.filter(t => compatibleRef(t, a) && compatibleRef(t, b)), 1, rnd).map(t => ({ w: t, living: true }))]) {
        if (subj.w.id === a.id || subj.w.id === b.id) continue;
        const tokens = [tok(a, 'と'), tok(b, 'の'), T('間に', 'あいだに', 'aida ni'),
                        tok(subj.w, 'が'), existPred(subj.living, pol)];
        const predIdx = tokens.length - 1;
        const neg = pol === 'neg' ? 'tidak ' : '';
        const idn = `Di antara ${a.mean} dan ${b.mean} ${neg}ada ${subj.w.mean}.`;
        out.push(mkSent(tokens, {
          idn,
          vocab: [existVerbId(subj.living), a.id, b.id, 'pos_aida', subj.w.id, 'p_no', 'p_ga'],
          slots: [
            { kind: 'particle', tokIndex: 1, answer: 'の', cls: 'p_no' },
            { kind: 'particle', tokIndex: 3, answer: 'が', cls: 'p_ga' },
            { kind: 'predicate', tokIndex: predIdx, answer: tokens[predIdx].s,
              cls: subj.living ? (pol === 'aff' ? 'pred_iru' : 'pred_inai') : (pol === 'aff' ? 'pred_aru' : 'pred_arenai') },
            { kind: 'noun', tokIndex: 4, answer: tokens[4].s,
              group: subj.living ? 'living_ga' : 'thing_ga', nounId: subj.w.id },
          ],
          tags: { pattern: 'aida_' + (subj.living ? 'iru_' : 'aru_') + pol, living: subj.living, pol,
                  posId: 'pos_aida', posMean: 'di antara', refId: a.id, refMean: a.mean,
                  ref2Id: b.id, ref2Mean: b.mean, subjId: subj.w.id, subjMean: subj.w.mean },
        }));
      }
    }
  }
  return out;
}

/* --- POLA F : N1 や N2 など あります / います ------------------------------ */
function buildYaNado(rnd) {
  const out = [];
  const posPool = B10_POS.filter(p => !['pos_aida'].includes(p.id));
  const thingGroups = [
    ['n_enpitsu', 'n_keshigomu'], ['n_hon', 'n_jisho'], ['n_kagi', 'n_chiketto'],
    ['n_mizu', 'n_okashi'], ['n_kasa', 'n_kaban'], ['n_nooto', 'n_enpitsu'],
    ['n_hana', 'n_kasa'], ['n_kutsu', 'n_kaban'],
  ];
  const liveGroups = [['n_inu', 'n_neko'], ['n_tori', 'n_sakana'], ['n_gakusei', 'n_sensei']];
  for (const pos of pickN(posPool, 5, rnd)) {
    for (const ref of pickN(refsForPos(pos), 6, rnd)) {
      const groups = [...thingGroups.map(g => ({ g, living: false })), ...liveGroups.map(g => ({ g, living: true }))];
      for (const { g, living } of pickN(groups, 3, rnd)) {
        if (g.includes(ref.id)) continue;
        const [w1, w2] = [g.map(id => (living ? LIVE[id] : THING[id]))][0];
        if (!w1 || !w2) continue;
        if (!compatibleRef(w1, ref) || !compatibleRef(w2, ref)) continue;
        if (!posOkFor(pos, w1, living, ref) || !posOkFor(pos, w2, living, ref)) continue;
        const tokens = [tok(ref, 'の'), tok(pos, 'に'), tok(w1, 'や'), tok(w2, 'など'), existPred(living, 'aff')];
        const predIdx = tokens.length - 1;
        const idn = `Di ${posMean(pos)} ${ref.mean} ada ${w1.mean}, ${w2.mean}, dan lain-lain.`;
        out.push(mkSent(tokens, {
          idn,
          vocab: [existVerbId(living), ref.id, pos.id, w1.id, w2.id, 'p_no', 'p_ni', 'p_ya', 'e_nado'],
          slots: [
            { kind: 'particle', tokIndex: 0, answer: 'の', cls: 'p_no' },
            { kind: 'particle', tokIndex: 1, answer: 'に', cls: 'p_ni' },
            { kind: 'particle', tokIndex: 2, answer: 'や', cls: 'p_ya' },
            { kind: 'position', tokIndex: 1, answer: pos.jp, posId: pos.id },
            { kind: 'predicate', tokIndex: predIdx, answer: tokens[predIdx].s,
              cls: living ? 'pred_iru' : 'pred_aru' },
            { kind: 'noun', tokIndex: 2, answer: tokens[2].s,
              group: living ? 'living_ya' : 'thing_ya', nounId: w1.id },
          ],
          tags: { pattern: 'ya_aff', living, pol: 'aff', posId: pos.id, posMean: posMean(pos),
                  refId: ref.id, refMean: ref.mean, subjId: w1.id, subjMean: w1.mean,
                  subj2Id: w2.id, subj2Mean: w2.mean },
        }));
      }
    }
  }
  return out;
}

/* --- POLA G : pertanyaan どこ / 何 / だれ ---------------------------------- */
function buildQuestions(rnd) {
  const out = [];

  /* G1: N は どこに ありますか / いますか */
  const subjects = [
    ...B10_THINGS.map(t => ({ w: t, living: false })),
    ...B10_LIVINGS.map(t => ({ w: t, living: true })),
  ];
  for (const s of subjects) {
    const askTok = s.living ? T('いますか', 'いますか', 'imasu ka') : T('ありますか', 'ありますか', 'arimasu ka');
    const tokens = [tok(s.w, 'は'), T('どこに', 'どこに', 'doko ni'), askTok];
    const idn = `${capital(s.w.mean)} ada di mana?`;
    out.push(mkSent(tokens, {
      idn,
      vocab: [existVerbId(s.living), s.w.id, 'e_doko', 'p_wa', 'p_ni'],
      slots: [
        { kind: 'particle', tokIndex: 0, answer: 'は', cls: 'p_wa' },
        { kind: 'particle', tokIndex: 1, answer: 'に', cls: 'p_ni' },
        { kind: 'qword', tokIndex: 1, answer: 'どこ', qid: 'e_doko' },
        { kind: 'predicate', tokIndex: 2, answer: askTok.s, cls: s.living ? 'q_iruka' : 'q_aruka' },
      ],
      tags: { pattern: s.living ? 'q_where_iru' : 'q_where_aru', living: s.living, pol: 'q',
              subjId: s.w.id, subjMean: s.w.mean, isQuestion: true },
    }));
  }

  /* G2: N(tempat)(の posisi) に 何 が ありますか / だれ が いますか */
  for (const ref of REF_POINTS) {
    const isThingRef = THING[ref.id] !== undefined && THING[ref.id].ref === true;
    const posOptions = B10_POS.filter(p => p.id !== 'pos_aida' &&
      (!THING_ONLY_POS.has(p.id) || isThingRef) &&
      (!CONTAINER_POS.has(p.id) || CONTAINER_IDS.has(ref.id)));
    for (const withPos of [false, true]) {
      if (withPos && !posOptions.length) continue;
      const pos = pick(posOptions, rnd);
      const head = withPos ? [tok(ref, 'の'), tok(pos, 'に')] : [tok(ref, 'に')];
      const posMeanStr = withPos ? posMean(pos) + ' ' + ref.mean : ref.mean;
      const posIds = withPos ? [ref.id, pos.id, 'p_no', 'p_ni'] : [ref.id, 'p_ni'];
      /* 何が ありますか */
      {
        const tokens = [...head, T('何が', 'なにが', 'nani ga'), T('ありますか', 'ありますか', 'arimasu ka')];
        const idn = `Apa yang ada di ${posMeanStr}?`;
        out.push(mkSent(tokens, {
          idn,
          vocab: ['v_arimasu', 'e_nani', ...posIds, 'p_ga'],
          slots: [
            { kind: 'qword', tokIndex: head.length, answer: '何', qid: 'e_nani' },
            { kind: 'particle', tokIndex: head.length, answer: 'が', cls: 'p_ga' },
            ...(withPos ? [{ kind: 'position', tokIndex: 1, answer: pos.jp, posId: pos.id }] : []),
            ...(withPos ? [{ kind: 'particle', tokIndex: 0, answer: 'の', cls: 'p_no' }] : []),
          ],
          tags: { pattern: 'q_nani', living: false, pol: 'q', refId: ref.id, refMean: ref.mean,
                  posId: withPos ? pos.id : null, posMean: posMeanStr, isQuestion: true },
        }));
      }
      /* だれが いますか — "siapa" tidak wajar di dalam wadah kecil */
      if (!(withPos && pos.id === 'pos_naka' && !PLACE[ref.id])) {
        const tokens = [...head, T('だれが', 'だれが', 'dare ga'), T('いますか', 'いますか', 'imasu ka')];
        const idn = `Siapa yang ada di ${posMeanStr}?`;
        out.push(mkSent(tokens, {
          idn,
          vocab: ['v_imasu', 'e_dare', ...posIds, 'p_ga'],
          slots: [
            { kind: 'qword', tokIndex: head.length, answer: 'だれ', qid: 'e_dare' },
            { kind: 'particle', tokIndex: head.length, answer: 'が', cls: 'p_ga' },
            ...(withPos ? [{ kind: 'position', tokIndex: 1, answer: pos.jp, posId: pos.id }] : []),
            ...(withPos ? [{ kind: 'particle', tokIndex: 0, answer: 'の', cls: 'p_no' }] : []),
          ],
          tags: { pattern: 'q_dare', living: true, pol: 'q', refId: ref.id, refMean: ref.mean,
                  posId: withPos ? pos.id : null, posMean: posMeanStr, isQuestion: true },
        }));
      }
    }
  }

  /* G3: jawaban lokasi — N は N1 の N2(posisi) です */
  for (const subj of pickN([...B10_THINGS, ...B10_LIVINGS], 14, rnd)) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const pair = pickRefPos(rnd);
      const pos = pair.pos;
      const ref = pair.ref;
      if (ref.id === subj.id || !compatibleRef(subj, ref)) continue;
      if (!posOkFor(pos, subj, LIVE[subj.id] !== undefined, ref)) continue;
      const tokens = [tok(subj, 'は'), tok(ref, 'の'), T(pos.jp + 'です', pos.kana + 'です', pos.rom + ' desu')];
      const idn = `${capital(subj.mean)} ada di ${posMean(pos)} ${ref.mean}.`;
      out.push(mkSent(tokens, {
        idn,
        vocab: [subj.id, ref.id, pos.id, 'p_wa', 'p_no'],
        slots: [
          { kind: 'particle', tokIndex: 0, answer: 'は', cls: 'p_wa' },
          { kind: 'particle', tokIndex: 1, answer: 'の', cls: 'p_no' },
          { kind: 'position', tokIndex: 2, answer: pos.jp, posId: pos.id },
          { kind: 'noun', tokIndex: 1, answer: tokens[1].s, group: 'ref_no', nounId: ref.id },
        ],
        tags: { pattern: 'pos_desu', living: false, pol: 'aff', posId: pos.id,
                posMean: posMean(pos), refId: ref.id, refMean: ref.mean,
                subjId: subj.id, subjMean: subj.mean },
      }));
    }
  }
  return out;
}

/* ==========================================================================
 * BAGIAN 4 — BANK KALIMAT
 * ========================================================================*/
const bankRnd = mulberry32(20261010);
const SENTENCES = [
  ...buildPlaceExist(bankRnd),
  ...buildWaExist(bankRnd),
  ...buildPositionExist(bankRnd),
  ...buildAida(bankRnd),
  ...buildYaNado(bankRnd),
  ...buildQuestions(bankRnd),
];

/* ==========================================================================
 * BAGIAN 5 — SILABUS PER TIER (50 level × 20 soal)
 *   1-10   mudah    : あります / います dasar (tempat + subjek)
 *   11-20  sedang   : bentuk negatif + pertanyaan どこに … ありますか / いますか
 *   21-30  kalimat  : N1 の N2(posisi) に N が あります / います
 *   31-40  campuran : ～や～など, 間に, jawaban lokasi, dialog 3-4 baris
 *   41-50  acak     : semua pola, kalimat panjang, pengecoh menjebak
 * ========================================================================*/
const TIERS = [
  {
    max: 10, key: 'mudah',
    focus: 'Pengenalan あります / います + partikel に / が (tempat & benda/orang)',
    patterns: ['aru_place_aff', 'iru_place_aff', 'wa_aru_aff', 'wa_iru_aff', 'pos_desu'],
    maxTokens: 3, distractors: 3, qChoice: 3,
    typeWeights: [
      { v: 'complete', w: 22 }, { v: 'match', w: 18 }, { v: 'choose_translation', w: 16 },
      { v: 'arrange', w: 16 }, { v: 'listening', w: 12 }, { v: 'short_conversation', w: 8 },
      { v: 'translate', w: 8 },
    ],
  },
  {
    max: 20, key: 'sedang',
    focus: 'Bentuk negatif ありません / いません + pertanyaan どこに … ありますか / いますか',
    patterns: ['aru_place_aff', 'aru_place_neg', 'iru_place_aff', 'iru_place_neg',
               'wa_aru_aff', 'wa_aru_neg', 'wa_iru_aff', 'wa_iru_neg',
               'q_where_aru', 'q_where_iru', 'pos_desu'],
    maxTokens: 4, distractors: 3, qChoice: 3,
    typeWeights: [
      { v: 'complete', w: 20 }, { v: 'arrange', w: 18 }, { v: 'short_conversation', w: 14 },
      { v: 'choose_translation', w: 14 }, { v: 'listening', w: 12 }, { v: 'match', w: 12 },
      { v: 'translate', w: 10 },
    ],
  },
  {
    max: 30, key: 'kalimat',
    focus: 'Posisi: N1 の N2 (上/下/前/後ろ/右/左/中/外/隣/近く) に N が あります / います',
    patterns: ['aru_place_aff', 'aru_place_neg', 'iru_place_aff', 'iru_place_neg',
               'wa_aru_aff', 'wa_aru_neg', 'wa_iru_aff', 'wa_iru_neg',
               'pos_aru_aff', 'pos_aru_neg', 'pos_iru_aff', 'pos_iru_neg',
               'q_where_aru', 'q_where_iru', 'q_nani', 'q_dare', 'pos_desu'],
    maxTokens: 5, distractors: 3, qChoice: 3,
    typeWeights: [
      { v: 'arrange', w: 20 }, { v: 'short_conversation', w: 16 }, { v: 'complete', w: 16 },
      { v: 'listening', w: 14 }, { v: 'translate', w: 12 }, { v: 'choose_translation', w: 12 },
      { v: 'match', w: 10 },
    ],
  },
  {
    max: 40, key: 'campuran',
    focus: '～や～など, A と B の 間に, serta percakapan lokasi (すみません、…は どこですか)',
    patterns: ['aru_place_aff', 'aru_place_neg', 'iru_place_aff', 'iru_place_neg',
               'wa_aru_aff', 'wa_aru_neg', 'wa_iru_aff', 'wa_iru_neg',
               'pos_aru_aff', 'pos_aru_neg', 'pos_iru_aff', 'pos_iru_neg',
               'aida_aru_aff', 'aida_aru_neg', 'aida_iru_aff', 'aida_iru_neg',
               'ya_aff', 'q_where_aru', 'q_where_iru', 'q_nani', 'q_dare', 'pos_desu'],
    maxTokens: 6, distractors: 4, qChoice: 4,
    typeWeights: [
      { v: 'short_conversation', w: 20 }, { v: 'arrange', w: 16 }, { v: 'listening', w: 16 },
      { v: 'complete', w: 14 }, { v: 'translate', w: 14 }, { v: 'choose_translation', w: 10 },
      { v: 'match', w: 10 },
    ],
  },
  {
    max: 50, key: 'acak',
    focus: 'Ujian campuran seluruh pola Bab 10: kalimat panjang + pengecoh menjebak',
    patterns: ['aru_place_aff', 'aru_place_neg', 'iru_place_aff', 'iru_place_neg',
               'wa_aru_aff', 'wa_aru_neg', 'wa_iru_aff', 'wa_iru_neg',
               'pos_aru_aff', 'pos_aru_neg', 'pos_iru_aff', 'pos_iru_neg',
               'aida_aru_aff', 'aida_aru_neg', 'aida_iru_aff', 'aida_iru_neg',
               'ya_aff', 'q_where_aru', 'q_where_iru', 'q_nani', 'q_dare', 'pos_desu'],
    maxTokens: 7, distractors: 4, qChoice: 4,
    typeWeights: [
      { v: 'short_conversation', w: 18 }, { v: 'listening', w: 18 }, { v: 'translate', w: 14 },
      { v: 'arrange', w: 14 }, { v: 'complete', w: 14 }, { v: 'choose_translation', w: 12 },
      { v: 'match', w: 10 },
    ],
  },
];
function getSyllabus(level) {
  const t = TIERS.find(x => level <= x.max) || TIERS[TIERS.length - 1];
  return Object.assign({}, t, { level });
}
function sentencePoolFor(syl) {
  return SENTENCES.filter(s => {
    if (!syl.patterns.includes(s.tags.pattern)) return false;
    if (s.tokens.length > syl.maxTokens) return false;
    return true;
  });
}

/* ==========================================================================
 * BAGIAN 6 — MESIN DISTRAKTOR (pengecoh sekelas / sepola)
 * ========================================================================*/
const PRED_DISTRACTOR = {
  pred_aru:    ['います', 'ありません', 'です'],
  pred_arenai: ['あります', 'いません', 'です'],
  pred_iru:    ['あります', 'いません', 'です'],
  pred_inai:   ['います', 'ありません', 'です'],
  q_aruka:     ['いますか', 'ありません', 'ありますか'],
  q_iruka:     ['ありますか', 'いません', 'いますか'],
};
const PARTICLE_DISTRACTOR = ['に', 'が', 'は', 'の', 'や', 'と', 'で'];
const QWORD_DISTRACTOR = ['どこ', 'だれ', '何', 'どの', 'いつ', 'どうして'];
const POS_DISTRACTOR = B10_POS.map(p => p.jp);

function nounGroupPool(group) {
  if (group === 'place_ni') return B10_PLACES.map(p => p.jp + 'に');
  if (group === 'thing_ga') return B10_THINGS.map(t => t.jp + 'が');
  if (group === 'living_ga') return B10_LIVINGS.map(t => t.jp + 'が');
  if (group === 'thing_ya') return B10_THINGS.map(t => t.jp + 'や');
  if (group === 'living_ya') return B10_LIVINGS.map(t => t.jp + 'や');
  if (group === 'ref_no') return REF_POINTS.map(r => r.jp + 'の');
  return [];
}
function distractorTokensFor(sentence, rnd, count) {
  const t = sentence.tags;
  const pool = ['あります', 'います', 'ありません', 'いません', 'に', 'が', 'は', 'の'];
  pool.push(...POS_DISTRACTOR.slice(0, 8));
  if (t.placeId) pool.push(...pickN(B10_PLACES.filter(p => p.id !== t.placeId), 3, rnd).map(p => p.jp + 'に'));
  if (t.refId) pool.push(...pickN(REF_POINTS.filter(p => p.id !== t.refId), 3, rnd).map(p => p.jp + 'の'));
  if (t.subjId) {
    const src = t.living ? B10_LIVINGS : B10_THINGS;
    pool.push(...pickN(src.filter(p => p.id !== t.subjId), 3, rnd).map(p => p.jp + 'が'));
  }
  pool.push('どこに', '何が', 'だれが', 'など', 'や');
  return pickN(uniq(pool), count, rnd);
}

/* ==========================================================================
 * BAGIAN 7 — GENERATOR PER TIPE SOAL (skema = js/questions.js)
 * ========================================================================*/
let qIdCounter = 1;
function nextId() { return `q_b10_${qIdCounter++}`; }
function tileTokens(sentence) { return sentence.tokens.map(t => t.s).filter(t => t && t.length); }

/* --- 1) ARRANGE ----------------------------------------------------------- */
function genArrange(sentence, syl, rnd) {
  const tokens = tileTokens(sentence);
  if (tokens.length < 3) return null;
  let tiles = shuffle(tokens, rnd);
  if (syl.level > 30) {
    const ex = distractorTokensFor(sentence, rnd, 1)[0];
    if (ex && !tokens.includes(ex)) tiles = shuffle([...tokens, ex], rnd);
  }
  return {
    id: nextId(), type: 'arrange',
    instruction: 'Susun kata-kata berikut menjadi kalimat Bahasa Jepang yang benar.',
    tiles, answer: tokens,
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
  return {
    id: nextId(), type: 'translate',
    instruction: 'Terjemahkan kalimat berikut ke dalam Bahasa Jepang.',
    prompt: sentence.idn,
    tiles: shuffle(tokens, rnd), answer: tokens,
    translation: sentence.idn,
    reading: sentence.reading,
    romaji: sentence.romaji,
    vocab: sentence.vocab,
    _sentJp: sentence.jp,
  };
}

/* --- 3) COMPLETE (partikel / predikat / posisi / kata benda / kata tanya) -- */
function slotAllowed(sl, syl) {
  if (sl.kind === 'particle') {
    if (sl.cls === 'p_ya') return syl.level >= 31;
    if (sl.cls === 'p_no') return syl.level >= 21;
    return true;
  }
  if (sl.kind === 'position') return syl.level >= 21;
  if (sl.kind === 'qword') return syl.level >= 11;
  if (sl.kind === 'noun') return syl.level >= 11;
  return true;
}
function mkOptions(answer, pool, syl, rnd) {
  const d = pickN(pool.filter(x => x !== answer), syl.distractors, rnd);
  const options = shuffle(uniq([answer, ...d]), rnd);
  return options.length >= 3 ? options : null;
}
function genComplete(sentence, syl, rnd) {
  const tokens = tileTokens(sentence);
  if (tokens.length < 3) return null;
  const usable = sentence.slots.filter(sl => slotAllowed(sl, syl));
  if (!usable.length) return null;
  const slot = pick(usable, rnd);
  const promptTokens = tokens.slice();
  const raw = promptTokens[slot.tokIndex];
  let answer = null, options = null, instruction = '';

  if (slot.kind === 'particle') {
    if (!raw.endsWith(slot.answer)) return null;
    promptTokens[slot.tokIndex] = raw.slice(0, -slot.answer.length) + '＿＿＿';
    answer = slot.answer;
    options = mkOptions(answer, PARTICLE_DISTRACTOR, syl, rnd);
    instruction = 'Lengkapi kalimat berikut dengan partikel yang tepat.';
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
    options = mkOptions(answer, PRED_DISTRACTOR[slot.cls] || ['あります', 'います', 'ありません'], syl, rnd);
    instruction = 'Lengkapi kalimat berikut dengan predikat yang tepat.';
  } else if (slot.kind === 'noun') {
    if (!raw.startsWith(slot.answer) && raw !== slot.answer) return null;
    promptTokens[slot.tokIndex] = '＿＿＿' + raw.slice(slot.answer.length);
    answer = slot.answer;
    const pool = nounGroupPool(slot.group);
    if (!pool.length) return null;
    options = mkOptions(answer, pool, syl, rnd);
    instruction = 'Lengkapi kalimat berikut dengan kata benda yang tepat.';
  }
  if (!options || !answer) return null;

  return {
    id: nextId(), type: 'complete',
    instruction,
    prompt: promptTokens.join(' '),
    translation: sentence.idn,
    options, answer,
    reading: sentence.reading,
    romaji: sentence.romaji,
    vocab: sentence.vocab,
    _sentJp: sentence.jp,
  };
}

/* --- 4) MATCH (8 tema yang berputar) -------------------------------------- */
const MATCH_THEMES = [
  {
    name: 'posisi',
    instr: 'Jodohkan kata posisi Bahasa Jepang dengan artinya.',
    pick: () => B10_POS.filter(p => p.id !== 'pos_aida').map(v => ({ id: v.id, jp: v.jp, right: v.mean })),
  },
  {
    name: 'benda',
    instr: 'Jodohkan kosakata benda Bab 10 dengan artinya.',
    pick: () => B10_THINGS.map(v => ({ id: v.id, jp: v.jp, right: v.mean })),
  },
  {
    name: 'tempat',
    instr: 'Jodohkan nama tempat Bahasa Jepang dengan artinya.',
    pick: () => B10_PLACES.map(v => ({ id: v.id, jp: v.jp, right: v.mean })),
  },
  {
    name: 'makhluk hidup',
    instr: 'Jodohkan kosakata makhluk hidup dengan artinya.',
    pick: () => B10_LIVINGS.map(v => ({ id: v.id, jp: v.jp, right: v.mean })),
  },
  {
    name: 'bacaan kanji',
    instr: 'Jodohkan kanji dengan cara baca (kana) yang benar.',
    pick: () => [...B10_THINGS, ...B10_PLACES, ...B10_LIVINGS, ...B10_POS]
      .filter(v => /[\u4e00-\u9faf]/.test(v.jp) && v.jp.length <= 4)
      .map(v => ({ id: v.id, jp: v.jp, right: v.kana })),
  },
  {
    name: 'pola',
    instr: 'Jodohkan ungkapan/predikat Bab 10 dengan fungsinya.',
    pick: () => [
      { id: 'v_arimasu', jp: 'あります', right: 'ada (untuk benda mati)' },
      { id: 'v_imasu',   jp: 'います',   right: 'ada (untuk makhluk hidup)' },
      { id: 'p_ni', jp: '～に', right: 'partikel tempat (di / ke)' },
      { id: 'p_ga', jp: '～が', right: 'partikel penanda subjek' },
      { id: 'p_no', jp: '～の', right: 'partikel penghubung / kepemilikan' },
      { id: 'p_ya', jp: '～や～', right: 'menyebut sebagian dari beberapa hal' },
      { id: 'e_nado', jp: 'など', right: 'dan lain-lain' },
      { id: 'e_doko', jp: 'どこ', right: 'di mana' },
      { id: 'e_dare', jp: 'だれ', right: 'siapa' },
      { id: 'e_nani', jp: '何', right: 'apa' },
    ],
  },
  {
    name: 'tanya-jawab',
    instr: 'Jodohkan pertanyaan dengan jawaban yang sesuai.',
    pick: () => [
      { id: 'qa1', jp: '駅は どこですか。', right: '本屋の 隣です。' },
      { id: 'qa2', jp: '箱の 中に 何が ありますか。', right: '鍵が あります。' },
      { id: 'qa3', jp: '公園に だれが いますか。', right: '男の人が います。' },
      { id: 'qa4', jp: '猫は どこに いますか。', right: 'ソファの 上に います。' },
      { id: 'qa5', jp: '冷蔵庫に 水が ありますか。', right: 'はい、あります。' },
      { id: 'qa6', jp: '庭に 犬が いますか。', right: 'いいえ、いません。' },
      { id: 'qa7', jp: '郵便局は どこに ありますか。', right: '銀行の 近くに あります。' },
      { id: 'qa8', jp: '机の 下に 何が ありますか。', right: 'かばんが あります。' },
      { id: 'qa9', jp: '乗り場は どこですか。', right: '駅の 前です。' },
      { id: 'qa10', jp: '教室に 学生が いますか。', right: 'はい、たくさん います。' },
    ],
  },
  {
    name: 'ungkapan',
    instr: 'Jodohkan ungkapan percakapan Bab 10 dengan artinya.',
    pick: () => [
      { id: 'e_sumimasen', jp: 'すみません', right: 'permisi / maaf' },
      { id: 'e_arigatou', jp: 'ありがとう ございます', right: 'terima kasih' },
      { id: 'e_douitashimashite', jp: 'どういたしまして', right: 'sama-sama' },
      { id: 'e_eeto', jp: 'ええと', right: 'anu / hmm (sedang berpikir)' },
      { id: 'e_chotto', jp: 'ちょっと', right: 'sebentar / sedikit' },
      { id: 'e_soudesuka', jp: 'そうですか', right: 'begitu ya' },
      { id: 'e_ee', jp: 'ええ', right: 'ya' },
      { id: 'e_iie', jp: 'いいえ', right: 'tidak' },
      { id: 'e_dono', jp: 'どの', right: 'yang mana' },
      { id: 'e_doko', jp: 'どこ', right: 'di mana' },
    ],
  },
  {
    name: 'posisi & tempat',
    instr: 'Jodohkan gabungan kata posisi/tempat dengan artinya.',
    pick: () => [
      { id: 'pt1', jp: '机の 上', right: 'di atas meja' },
      { id: 'pt2', jp: '箱の 中', right: 'di dalam kotak' },
      { id: 'pt3', jp: '駅の 前', right: 'di depan stasiun' },
      { id: 'pt4', jp: '本屋の 隣', right: 'di sebelah toko buku' },
      { id: 'pt5', jp: '公園の 近く', right: 'di dekat taman' },
      { id: 'pt6', jp: '郵便局と 銀行の 間', right: 'di antara kantor pos dan bank' },
      { id: 'pt7', jp: '建物の 後ろ', right: 'di belakang gedung' },
      { id: 'pt8', jp: '部屋の 外', right: 'di luar kamar' },
    ],
  },
];
function genMatch(syl, rnd, themeIdx) {
  const theme = MATCH_THEMES[themeIdx % MATCH_THEMES.length];
  const pool = theme.pick();
  if (pool.length < 4) return null;
  const size = Math.min(pool.length, syl.level > 25 ? 6 : 5);
  const chosen = pickN(pool, size, rnd);
  return {
    id: nextId(), type: 'match',
    instruction: theme.instr,
    pairs: chosen.map(v => ({ jp: v.jp, id: v.right, vocabId: v.id })),
    vocab: chosen.map(v => v.id).filter(id => VALID_VOCAB.has(id)),
    translation: chosen.map(v => `${v.jp} = ${v.right}`).join(' · '),
  };
}

/* --- konverter kanji -> kana berbasis kamus kosakata Bab 10 ----------------
 * Dipakai untuk membuat "cara baca" baris percakapan (furigana sederhana).
 * Pencocokan terpanjang lebih dulu, jadi 本屋 menang atas 本 dan
 * 松本さん menang atas 本. */
const KANA_DICT = (() => {
  const entries = [
    ...[...B10_THINGS, ...B10_PLACES, ...B10_LIVINGS, ...B10_POS, ...B10_VERB, ...B10_EXPR]
      .filter(v => /[\u4e00-\u9faf]/.test(v.jp))
      .map(v => ({ jp: v.jp, kana: v.kana })),
    ...NAMES.filter(v => /[\u4e00-\u9faf]/.test(v.jp)).map(v => ({ jp: v.jp, kana: v.kana })),
    { jp: '男の人', kana: 'おとこのひと' }, { jp: '女の人', kana: 'おんなのひと' },
  ];
  const seen = new Set();
  return entries
    .filter(e => !seen.has(e.jp) && seen.add(e.jp))
    .sort((a, b) => b.jp.length - a.jp.length);
})();
/* Pisahkan partikel (の/に/が/…) dan か penutup dari kata sebelumnya agar
 * "cara baca" & romaji percakapan mudah dibaca: ぎんこうの → ぎんこう の */
function kanaSpacing(kana) {
  return String(kana)
    .replace(/(の|に|が|は|を|と|や|へ)(?=[\s。、？！]|$)/g, ' $1')
    .replace(/です(?=か?[。、？！]?\s*$)/g, ' です')
    .replace(/(か)(?=[。、？！]?\s*$)/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim();
}

function toKana(text) {
  let out = String(text);
  for (const e of KANA_DICT) out = out.split(e.jp).join(e.kana);
  return out;
}

/* --- 5) SHORT CONVERSATION (dialog lokasi benda/orang) --------------------- */
function A(t, id) { return { speaker: 'A', text: t, id }; }
function B(t, id) { return { speaker: 'B', text: t, id }; }
const CONV_INSTR = 'Bacalah percakapan pendek berikut lalu jawab pertanyaannya.';
const BLANK = '＿＿＿';

function convTemplates(rnd) {
  const list = [];
  const add = (family, build, minLevel) => list.push({ family, build, minLevel: minLevel || 1 });

  /* C1: bertanya letak tempat (すみません、X は どこですか) — 2 baris */
  for (const place of B10_PLACES) {
    add('where_place', () => {
      const ref = pick(REF_POINTS.filter(r => r.id !== place.id), rnd);
      const pos = pick(B10_POS.filter(p => PLACE_POS_IDS.includes(p.id)), rnd);
      const ans = `${ref.jp}の ${pos.jp}です。`;
      const ansId = `Ada di ${posMean(pos)} ${ref.mean}.`;
      const other = pick(REF_POINTS.filter(r => r.id !== ref.id && r.id !== place.id), rnd);
      const otherPos = pick(B10_POS.filter(p => p.id !== pos.id && p.id !== 'pos_aida'), rnd);
      return {
        dialogue: [
          A(`すみません、${place.jp}は どこですか。`, `Permisi, ${place.mean} di mana?`),
          B(BLANK, ansId),
        ],
        question: `Pilih jawaban B yang tepat (${place.mean} ada di ${posMean(pos)} ${ref.mean}):`,
        options: shuffle(uniq([
          ans,
          `${other.jp}の ${otherPos.jp}です。`,
          `${place.jp}が あります。`,
          `はい、${place.jp}です。`,
        ]), rnd),
        answer: ans,
        answerId: ansId,
        vocab: [place.id, ref.id, pos.id, 'e_sumimasen', 'e_doko'],
      };
    });
  }

  /* C2: ada apa di dalam/atas … (何が ありますか) — 2 baris */
  for (const ref of REF_POINTS) {
    add('nani_pos', () => {
      const pair = pickRefPos(rnd);
      const pos = pair.pos;
      const ref = pair.ref;
      const candidates = B10_THINGS.filter(t => t.id !== ref.id && posOkFor(pos, t, false, ref));
      if (!candidates.length) return null;
      const thing = pick(candidates, rnd);
      const other = pick(candidates.filter(t => t.id !== thing.id), rnd);
      const ans = `${thing.jp}が あります。`;
      const ansId = `Ada ${thing.mean}.`;
      return {
        dialogue: [
          A(`${ref.jp}の ${pos.jp}に 何が ありますか。`, `Apa yang ada di ${posMean(pos)} ${ref.mean}?`),
          B(BLANK, ansId),
        ],
        question: `Pilih jawaban B yang tepat (yang ada adalah ${thing.mean}):`,
        options: shuffle(uniq([
          ans,
          `${other.jp}が います。`,
          `${thing.jp}が います。`,
          `いいえ、ありません。`,
        ]), rnd),
        answer: ans,
        answerId: ansId,
        vocab: [ref.id, pos.id, thing.id, 'e_nani', 'v_arimasu'],
      };
    });
  }

  /* C3: siapa yang ada di … (だれが いますか) — 2 baris */
  for (const place of pickN(B10_PLACES, 10, rnd)) {
    add('dare_place', () => {
      const person = pick(B10_LIVINGS.filter(l => l.group !== 'hewan'), rnd);
      const other = pick(B10_LIVINGS.filter(l => l.id !== person.id), rnd);
      const ans = `${person.jp}が います。`;
      const ansId = `Ada ${person.mean}.`;
      return {
        dialogue: [
          A(`${place.jp}に だれが いますか。`, `Siapa yang ada di ${place.mean}?`),
          B(BLANK, ansId),
        ],
        question: `Pilih jawaban B yang tepat (yang ada adalah ${person.mean}):`,
        options: shuffle(uniq([
          ans,
          `${other.jp}が あります。`,
          `${person.jp}が あります。`,
          `${place.jp}が います。`,
        ]), rnd),
        answer: ans,
        answerId: ansId,
        vocab: [place.id, person.id, 'e_dare', 'v_imasu'],
      };
    });
  }

  /* C4: di mana makhluk hidup berada — 2 baris */
  for (const live of B10_LIVINGS) {
    add('where_living', () => {
      let pair = pickRefPos(rnd);
      for (let guard = 0; guard < 12 && !posOkFor(pair.pos, live, true, pair.ref); guard++) pair = pickRefPos(rnd);
      if (!posOkFor(pair.pos, live, true, pair.ref)) return null;
      const pos = pair.pos;
      const ref = pair.ref;
      const ans = `${ref.jp}の ${pos.jp}に います。`;
      const ansId = `Ada di ${posMean(pos)} ${ref.mean}.`;
      const otherPos = pick(B10_POS.filter(p => p.id !== pos.id && p.id !== 'pos_aida'), rnd);
      return {
        dialogue: [
          A(`${live.jp}は どこに いますか。`, `${capital(live.mean)} ada di mana?`),
          B(BLANK, ansId),
        ],
        question: `Pilih jawaban B yang tepat (${live.mean} ada di ${posMean(pos)} ${ref.mean}):`,
        options: shuffle(uniq([
          ans,
          `${ref.jp}の ${otherPos.jp}に あります。`,
          `${ref.jp}に ${live.jp}が あります。`,
          `はい、います。`,
        ]), rnd),
        answer: ans,
        answerId: ansId,
        vocab: [live.id, ref.id, pos.id, 'e_doko', 'v_imasu'],
      };
    });
  }

  /* C5: ada / tidak ada (ya / iie) — 2 baris */
  for (const place of pickN(B10_PLACES, 10, rnd)) {
    for (const subj of pickN([...B10_THINGS, ...B10_LIVINGS], 3, rnd)) {
      add('yes_no', () => {
        const living = LIVE[subj.id] !== undefined;
        const yes = rnd() < 0.5;
        const ans = yes
          ? `はい、${subj.jp}が ${living ? 'います' : 'あります'}。`
          : `いいえ、${subj.jp}は ${living ? 'いません' : 'ありません'}。`;
        const ansId = yes
          ? `Ya, ada ${subj.mean}.`
          : `Tidak, ${subj.mean} tidak ada.`;
        return {
          dialogue: [
            A(`${place.jp}に ${subj.jp}が ${living ? 'います' : 'あります'}か。`,
              `Apakah ada ${subj.mean} di ${place.mean}?`),
            B(BLANK, ansId),
          ],
          question: `Pilih jawaban B yang tepat (${yes ? 'ada' : 'tidak ada'} ${subj.mean}):`,
          options: shuffle(uniq([
            ans,
            yes ? `いいえ、${subj.jp}は ${living ? 'いません' : 'ありません'}。` : `はい、${subj.jp}が ${living ? 'います' : 'あります'}。`,
            `はい、${place.jp}が ${living ? 'います' : 'あります'}。`,
            `ええ、${subj.jp}です。`,
          ]), rnd),
          answer: ans,
          answerId: ansId,
          vocab: [place.id, subj.id, living ? 'v_imasu' : 'v_arimasu', yes ? 'e_ee' : 'e_iie'],
        };
      });
    }
  }

  /* C6: 3 baris — tanya letak + ucapan terima kasih */
  for (const place of pickN(B10_PLACES, 8, rnd)) {
    add('thanks', () => {
      const ref = pick(REF_POINTS.filter(r => r.id !== place.id), rnd);
      const pos = pick(B10_POS.filter(p => PLACE_POS_IDS.includes(p.id)), rnd);
      const ans = `${ref.jp}の ${pos.jp}です。`;
      const ansId = `Ada di ${posMean(pos)} ${ref.mean}.`;
      return {
        dialogue: [
          A(`すみません、${place.jp}は どこですか。`, `Permisi, ${place.mean} di mana?`),
          B(BLANK, ansId),
          A('ありがとう ございます。', 'Terima kasih.'),
        ],
        question: `Pilih jawaban B yang tepat (${place.mean} ada di ${posMean(pos)} ${ref.mean}):`,
        options: shuffle(uniq([ans, `${ref.jp}です。`, `${place.jp}が あります。`, 'どういたしまして。']), rnd),
        answer: ans,
        answerId: ansId,
        vocab: [place.id, ref.id, pos.id, 'e_sumimasen', 'e_arigatou', 'e_douitashimashite', 'e_doko'],
      };
    }, 21);
  }

  /* C7: 3 baris — ~や~など (isi kotak/rak) */
  for (const ref of pickN(REF_POINTS, 8, rnd)) {
    add('ya_nado', () => {
      const pair = pickRefPos(rnd);
      const pos = pair.pos;
      const ref = pair.ref;
      const pairs = [['n_enpitsu', 'n_keshigomu'], ['n_hon', 'n_jisho'], ['n_kagi', 'n_chiketto'],
                     ['n_mizu', 'n_okashi'], ['n_kasa', 'n_kaban']];
      const g = pick(pairs, rnd);
      const w1 = THING[g[0]], w2 = THING[g[1]];
      const ans = `${w1.jp}や ${w2.jp}など あります。`;
      const ansId = `Ada ${w1.mean}, ${w2.mean}, dan lain-lain.`;
      const other = pick(B10_THINGS.filter(t => !g.includes(t.id)), rnd);
      return {
        dialogue: [
          A(`${ref.jp}の ${pos.jp}に 何が ありますか。`, `Apa yang ada di ${posMean(pos)} ${ref.mean}?`),
          B(BLANK, ansId),
        ],
        question: `Pilih jawaban B yang tepat (${w1.mean} dan ${w2.mean} dll.):`,
        options: shuffle(uniq([
          ans,
          `${w1.jp}と ${w2.jp}が います。`,
          `${other.jp}が あります。`,
          `${w1.jp}や ${w2.jp}など います。`,
        ]), rnd),
        answer: ans,
        answerId: ansId,
        vocab: [ref.id, pos.id, w1.id, w2.id, 'p_ya', 'e_nado', 'v_arimasu'],
      };
    }, 31);
  }

  /* C8: 4 baris — mencari orang di dua tempat */
  for (const name of pickN(NAMES, 6, rnd)) {
    add('find_person', () => {
      const p1 = pick(B10_PLACES, rnd);
      const p2 = pick(B10_PLACES.filter(p => p.id !== p1.id), rnd);
      const ans = `${p2.jp}に います。`;
      const ansId = `Ada di ${p2.mean}.`;
      return {
        dialogue: [
          A(`${name.jp}は ${p1.jp}に いますか。`, `Apakah ${name.mean} ada di ${p1.mean}?`),
          B(`いいえ、${p1.jp}には いません。`, `Tidak, tidak ada di ${p1.mean}.`),
          A(`じゃ、どこに いますか。`, 'Kalau begitu, ada di mana?'),
          B(BLANK, ansId),
        ],
        question: `Pilih jawaban B yang tepat (${name.mean} ada di ${p2.mean}):`,
        options: shuffle(uniq([
          ans,
          `${p1.jp}に います。`,
          `${p2.jp}が あります。`,
          `${p2.jp}の 中に あります。`,
        ]), rnd),
        answer: ans,
        answerId: ansId,
        vocab: [p1.id, p2.id, 'v_imasu', 'e_doko'],
      };
    }, 31);
  }

  /* C9: 3 baris — antara dua bangunan (間に) */
  add('aida', () => {
    const a = pick(REF_POINTS, rnd);
    const b = pick(REF_POINTS.filter(x => x.id !== a.id), rnd);
    const thing = pick(B10_THINGS.filter(t => t.id !== a.id && t.id !== b.id), rnd);
    const ans = `${a.jp}と ${b.jp}の 間に あります。`;
    const ansId = `Ada di antara ${a.mean} dan ${b.mean}.`;
    return {
      dialogue: [
        A(`${thing.jp}は どこに ありますか。`, `${capital(thing.mean)} ada di mana?`),
        B(BLANK, ansId),
        A('そうですか。ありがとう ございます。', 'Begitu ya. Terima kasih.'),
      ],
      question: `Pilih jawaban B yang tepat (${thing.mean} ada di antara ${a.mean} dan ${b.mean}):`,
      options: shuffle(uniq([
        ans,
        `${a.jp}の 隣に あります。`,
        `${b.jp}の 中に あります。`,
        `${a.jp}と ${b.jp}が あります。`,
      ]), rnd),
      answer: ans,
      answerId: ansId,
      vocab: [a.id, b.id, thing.id, 'pos_aida', 'v_arimasu', 'e_doko', 'e_soudesuka'],
    };
  }, 31);

  /* C10: 2 baris — konfirmasi posisi dengan ね / そうですか */
  for (const ref of pickN(REF_POINTS, 8, rnd)) {
    add('confirm_pos', () => {
      const pair = pickRefPos(rnd);
      const pos = pair.pos;
      const ref = pair.ref;
      const cands = B10_THINGS.filter(t => t.id !== ref.id && posOkFor(pos, t, false, ref));
      if (!cands.length) return null;
      const subj = pick(cands, rnd);
      const ans = `はい、${ref.jp}の ${pos.jp}に あります。`;
      const ansId = `Ya, ada di ${posMean(pos)} ${ref.mean}.`;
      return {
        dialogue: [
          A(`${subj.jp}は ${ref.jp}の ${pos.jp}に ありますか。`,
            `Apakah ${subj.mean} ada di ${posMean(pos)} ${ref.mean}?`),
          B(BLANK, ansId),
        ],
        question: `Pilih jawaban B yang tepat (jawabannya "ya"):`,
        options: shuffle(uniq([
          ans,
          `いいえ、${ref.jp}の ${pos.jp}に あります。`,
          `はい、${subj.jp}が います。`,
          `ええ、${ref.jp}です。`,
        ]), rnd),
        answer: ans,
        answerId: ansId,
        vocab: [ref.id, pos.id, subj.id, 'v_arimasu'],
      };
    }, 21);
  }

  return list;
}

function genShortConversation(syl, rnd, templates, usedFamilies) {
  const eligible = templates.filter(t => (t.minLevel || 1) <= syl.level);
  const fresh = eligible.filter(t => !usedFamilies.has(t.family));
  const pool = fresh.length >= 6 ? fresh : eligible;
  if (!pool.length) return null;
  const tpl = pick(pool, rnd);
  const q = tpl.build(syl);
  if (!q || !q.dialogue || !q.options || !q.options.includes(q.answer)) return null;
  usedFamilies.add(tpl.family);

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
    id: nextId(), type: 'short_conversation',
    instruction: CONV_INSTR,
    dialogue: q.dialogue.map(d => ({ speaker: d.speaker, text: d.text })),
    question: q.question,
    options: q.options,
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

/* --- 6) CHOOSE TRANSLATION (pengecoh = minimal pair) ---------------------- */
function makeVariant(sentence, rnd) {
  const t = sentence.tags;
  const toks = sentence.tokens.map(x => ({ ...x }));
  const r = rnd();

  /* 1) tukar あります <-> います */
  if (r < 0.3 && (t.pattern.startsWith('aru') || t.pattern.startsWith('iru') ||
                  t.pattern.startsWith('wa_') || t.pattern.startsWith('pos_') ||
                  t.pattern.startsWith('aida_'))) {
    const i = toks.findIndex(x => ['あります', 'います', 'ありません', 'いません'].includes(x.s));
    if (i >= 0) {
      const swap = { 'あります': 'います', 'います': 'あります', 'ありません': 'いません', 'いません': 'ありません' };
      toks[i] = T(swap[toks[i].s], swap[toks[i].s], toRomaji(swap[toks[i].s]));
      return { jp: joinS(toks), idn: sentence.idn.replace(/\bada\b/, t.living ? 'ada (benda)' : 'ada (makhluk)') };
    }
  }
  /* 2) tukar posisi */
  if (r < 0.55 && t.posId) {
    const altPos = pick(B10_POS.filter(p => p.id !== t.posId && p.id !== 'pos_aida'), rnd);
    const i = toks.findIndex(x => x.s.startsWith(POS[t.posId].jp));
    if (i >= 0) {
      const rest = toks[i].s.slice(POS[t.posId].jp.length);
      toks[i] = T(altPos.jp + rest, altPos.kana + (rest === 'に' ? 'に' : rest), altPos.rom + (rest ? ' ' + toRomaji(rest) : ''));
      return { jp: joinS(toks), idn: sentence.idn.replace(t.posMean, posMean(altPos)) };
    }
  }
  /* 3) tukar tempat / acuan */
  const placeId = t.placeId || t.refId;
  if (r < 0.8 && placeId) {
    const alt = pick(REF_POINTS.filter(p => p.id !== placeId && p.id !== t.subjId && p.id !== t.ref2Id), rnd);
    const i = toks.findIndex(x => x.s.startsWith((PLACE[placeId] || THING[placeId]).jp));
    if (i >= 0) {
      const src = PLACE[placeId] || THING[placeId];
      const rest = toks[i].s.slice(src.jp.length);
      const restRom = rest ? ' ' + toRomaji(rest) : '';
      toks[i] = T(alt.jp + rest, alt.kana + rest, alt.rom + restRom);
      return { jp: joinS(toks), idn: sentence.idn.replace(src.mean, alt.mean) };
    }
  }
  /* 4) tukar subjek */
  if (t.subjId) {
    const src = t.living ? LIVE[t.subjId] : THING[t.subjId];
    const altPool = (t.living ? B10_LIVINGS : B10_THINGS).filter(x => x.id !== t.subjId && x.id !== t.placeId && x.id !== t.refId);
    if (src && altPool.length) {
      const alt = pick(altPool, rnd);
      const i = toks.findIndex(x => x.s.startsWith(src.jp));
      if (i >= 0) {
        const rest = toks[i].s.slice(src.jp.length);
        toks[i] = T(alt.jp + rest, alt.kana + rest, alt.rom + (rest ? ' ' + toRomaji(rest) : ''));
        return { jp: joinS(toks), idn: sentence.idn.replace(src.mean, alt.mean) };
      }
    }
  }
  return null;
}
function genChooseTranslation(sentence, syl, rnd) {
  const opts = [sentence.jp];
  let guard = 0;
  while (opts.length < syl.qChoice && guard < 40) {
    guard++;
    const v = makeVariant(sentence, rnd);
    if (v && v.jp && v.jp.length >= 4 && !opts.includes(v.jp)) opts.push(v.jp);
  }
  if (opts.length < 3) return null;
  return {
    id: nextId(), type: 'choose_translation',
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
  const extraCount = syl.level > 30 ? 3 : syl.level > 10 ? 2 : 1;
  const extras = pickN(uniq(distractorTokensFor(sentence, rnd, 6).filter(x => !tokens.includes(x))), extraCount, rnd);
  return {
    id: nextId(), type: 'listening',
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
 * BAGIAN 8 — URUTAN TIPE SOAL (ACAK, ANTI 3x BERTURUT)
 * ========================================================================*/
function buildTypeSequence(syl, count, rnd) {
  /* Kuota proporsional (largest remainder) + batas per tipe, lalu diacak
   * agar tiap level punya campuran 7 tipe soal yang seimbang (anti-monoton). */
  const caps = { match: syl.level > 25 ? 2 : 3, listening: 4, short_conversation: 5 };
  const items = syl.typeWeights.map(p => ({ v: p.v, w: p.w }));
  const totalW = items.reduce((a, p) => a + p.w, 0);

  const quota = {};
  let assigned = 0;
  const rema = items.map(it => {
    const exact = (it.w / totalW) * count;
    quota[it.v] = Math.floor(exact);
    assigned += quota[it.v];
    return { v: it.v, r: exact - Math.floor(exact) };
  });
  rema.sort((a, b) => b.r - a.r);
  for (let i = 0; assigned < count; i = (i + 1) % rema.length) { quota[rema[i].v]++; assigned++; }

  /* terapkan batas & sebar kembali kelebihannya */
  let surplus = 0;
  for (const it of items) {
    const cap = caps[it.v] || count;
    if (quota[it.v] > cap) { surplus += quota[it.v] - cap; quota[it.v] = cap; }
  }
  const donors = items.map(it => it.v).filter(v => quota[v] < (caps[v] || count));
  for (let i = 0; surplus > 0 && donors.length; i = (i + 1) % donors.length) {
    const v = donors[i];
    quota[v]++; surplus--;
    if (quota[v] >= (caps[v] || count)) donors.splice(donors.indexOf(v), 1);
  }

  /* susun urutan acak tanpa 3 tipe sama berturut-turut */
  const seq = [];
  let guard = 0;
  while (seq.length < count && guard < count * 50) {
    guard++;
    const avail = items.map(it => it.v).filter(v => quota[v] > 0);
    if (!avail.length) break;
    const n = seq.length;
    let cand = avail;
    if (n >= 2 && seq[n - 1] === seq[n - 2]) cand = avail.filter(v => v !== seq[n - 1]);
    if (!cand.length) cand = avail;
    const v = pick(cand, rnd);
    quota[v]--;
    seq.push(v);
  }
  return seq;
}

/* ==========================================================================
 * BAGIAN 9 — PEMBANGUN 50 LEVEL × 20 SOAL
 * ========================================================================*/
const TOTAL_LEVELS = 50;
const QUESTIONS_PER_LEVEL = 20;
const LEVELS = [];
const THEME_CYCLE = ['rumah', 'kota', 'bangunan', 'benda', 'posisi',
                     'makhluk hidup', 'transport', 'tanya jawab', 'campuran'];
const matchCursor = { i: 0 };
const globalSigs = new Set();
const globalTypeSent = new Set();
let sigFallbacks = 0;

const convRng = mulberry32(1010202);
const CONV_TEMPLATES = convTemplates(convRng);

for (let level = 1; level <= TOTAL_LEVELS; level++) {
  const rnd = mulberry32(level * 761 + 20261010);
  const syl = getSyllabus(level);
  const pool = sentencePoolFor(syl);

  const questions = [];
  const usedSentences = new Set();
  const usedFamilies = new Set();
  const usedPosInLevel = new Set();

  function takeSentence(filterFn) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const s = pick(pool, rnd);
      if (!s) continue;
      if (filterFn && !filterFn(s)) continue;
      if (usedSentences.has(s.key)) continue;
      usedSentences.add(s.key);
      return s;
    }
    const alt = pool.filter(s => !filterFn || filterFn(s));
    return pick(alt.length ? alt : pool, rnd);
  }

  const typeSeq = buildTypeSequence(syl, QUESTIONS_PER_LEVEL, rnd);
  let i = 0, guard = 0;

  while (questions.length < QUESTIONS_PER_LEVEL && guard < 1200) {
    guard++;
    const type = typeSeq[i % typeSeq.length];
    i++;
    let q = null;
    const sentBased = ['arrange', 'translate', 'complete', 'choose_translation', 'listening'].includes(type);
    const fresh = s => !globalTypeSent.has(type + '|' + s.jp);

    /* anti-monoton: sebar posisi & lokasi yang berbeda dalam satu level */
    const posFilter = s => !s.tags.posId || !usedPosInLevel.has(s.tags.posId);

    if (type === 'match') {
      q = genMatch(syl, rnd, matchCursor.i++);
    } else if (type === 'short_conversation') {
      q = genShortConversation(syl, rnd, CONV_TEMPLATES, usedFamilies);
    } else {
      const minTok = s => s.tokens.length >= 3 && fresh(s);
      let s = null;
      for (let attempt = 0; attempt < 12 && !s; attempt++) {
        const cand = takeSentence(x => minTok(x) && posFilter(x));
        if (!cand) break;
        s = cand;
      }
      if (!s) s = takeSentence(minTok);
      if (!s) continue;

      if (type === 'arrange') q = genArrange(s, syl, rnd);
      else if (type === 'translate') q = genTranslate(s, syl, rnd);
      else if (type === 'complete') q = genComplete(s, syl, rnd);
      else if (type === 'choose_translation') q = genChooseTranslation(s, syl, rnd);
      else if (type === 'listening') q = genListening(s, syl, rnd);

      if (q && s.tags.posId) usedPosInLevel.add(s.tags.posId);
    }

    if (!q) continue;
    if (sentBased) globalTypeSent.add(type + '|' + q._sentJp);
    const sig = q.type + '|' +
      (Array.isArray(q.answer) ? q.answer.join('') : (q.answer || '')) + '|' +
      (q.dialogue ? JSON.stringify(q.dialogue) : '') + '|' +
      (q.pairs ? JSON.stringify(q.pairs.map(p => p.jp + '=' + p.id)) : (q.prompt || q.audioText || ''));
    if (globalSigs.has(sig)) sigFallbacks++;
    globalSigs.add(sig);
    delete q._sentJp;
    questions.push(q);
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
 * BAGIAN 10 — VALIDASI
 * ========================================================================*/
const ALL_IDS = new Set();
const allVocabRefs = new Set();
const typeCount = {};
let totalQ = 0;
let missingTranslation = 0;
const problems = [];

for (const lvl of LEVELS) {
  totalQ += lvl.questions.length;
  for (const q of lvl.questions) {
    typeCount[q.type] = (typeCount[q.type] || 0) + 1;
    if (ALL_IDS.has(q.id)) problems.push(`duplicate id: ${q.id}`);
    ALL_IDS.add(q.id);
    if (q.vocab) q.vocab.forEach(v => allVocabRefs.add(v));

    if (!q.translation) missingTranslation++;

    if (q.type === 'arrange' || q.type === 'translate') {
      const tset = new Set(q.tiles);
      for (const tok of q.answer) if (!tset.has(tok)) problems.push(`${q.id}: token jawaban tidak ada di tiles: ${tok}`);
      if (!q.reading) problems.push(`${q.id}: reading kosong`);
    }
    if (q.type === 'listening') {
      const tset = new Set(q.tiles);
      for (const tok of q.answer) if (!tset.has(tok)) problems.push(`${q.id}: token audio tidak ada di tiles: ${tok}`);
      if (!q.audioText) problems.push(`${q.id}: audioText kosong`);
      if (!Array.isArray(q.answer) || q.answer.length < 3) problems.push(`${q.id}: listening answer terlalu pendek`);
    }
    if (q.options) {
      if (!q.options.includes(q.answer)) problems.push(`${q.id}: answer tidak ada di options`);
      if (new Set(q.options).size !== q.options.length) problems.push(`${q.id}: options duplikat`);
      if (q.options.length < 3) problems.push(`${q.id}: options kurang dari 3`);
    }
    if (q.pairs) {
      const ids = q.pairs.map(p => p.vocabId);
      if (new Set(ids).size !== ids.length) problems.push(`${q.id}: vocabId match duplikat`);
    }
    if (q.reading && /[\u4e00-\u9faf]/.test(q.reading)) {
      problems.push(`${q.id}: reading masih mengandung kanji: ${q.reading}`);
    }
    if (q.type === 'short_conversation' && q.dialogue) {
      const blanks = q.dialogue.filter(d => d.text.includes('＿＿＿')).length;
      if (blanks !== 1) problems.push(`${q.id}: dialog harus punya tepat 1 blank (${blanks})`);
      if (q.dialogue.length < 2) problems.push(`${q.id}: dialog kurang dari 2 baris`);
      if (!q.dialogueId || q.dialogueId.length !== q.dialogue.length) {
        problems.push(`${q.id}: dialogueId tidak lengkap`);
      }
      if (!q.answerId) problems.push(`${q.id}: answerId kosong`);
    }
  }
}

/* --- validasi tata bahasa: あります (benda mati) vs います (makhluk hidup) -- */
let existMismatch = 0;
for (const s of SENTENCES) {
  const t = s.tags;
  if (!t.subjId || t.pattern === 'pos_desu') continue;
  const isLive = !!LIVE[t.subjId];
  const usesImasu = /(います|いません|いますか)/.test(s.jp);
  if (isLive !== usesImasu) {
    existMismatch++;
    if (existMismatch <= 5) problems.push(`存在 verb salah: ${s.jp} (subjek ${t.subjId}, hidup=${isLive})`);
  }
  /* subjek harus benar-benar dari kelas yang benar */
  if (!isLive && !THING[t.subjId]) problems.push(`subjek tak dikenal: ${t.subjId}`);
}
if (existMismatch) problems.push(`${existMismatch} kalimat salah pakai あります/います`);

/* --- validasi kewajaran: posisi & pasangan benda/tempat --------------------- */
for (const s of SENTENCES) {
  const t = s.tags;
  if (t.posId && THING_ONLY_POS.has(t.posId) && !THING_REFS.some(r => r.id === t.refId)) {
    problems.push(`posisi ${t.posId} butuh acuan benda: ${s.jp}`);
  }
  if (t.posId && CONTAINER_POS.has(t.posId) && !CONTAINER_IDS.has(t.refId)) {
    problems.push(`posisi ${t.posId} butuh acuan wadah/ruang: ${s.jp}`);
  }
  if (t.refId && NON_CONCRETE.has(t.refId)) {
    problems.push(`acuan terlalu luas: ${s.jp}`);
  }
  if (t.posId && t.subjId) {
    const subj = THING[t.subjId] || LIVE[t.subjId];
    const ref = THING[t.refId] || PLACE[t.refId];
    if (subj && !posOkFor(POS[t.posId], subj, LIVE[t.subjId] !== undefined, ref)) {
      problems.push(`posisi tidak wajar untuk subjek: ${s.jp}`);
    }
  }
  if (t.placeId && t.subjId) {
    const subj = THING[t.subjId] || LIVE[t.subjId];
    const place = PLACE[t.placeId];
    if (subj && place && !compatible(subj, place)) {
      problems.push(`pasangan tidak wajar: ${s.jp}`);
    }
  }
  if (t.refId && t.subjId) {
    const subj = THING[t.subjId] || LIVE[t.subjId];
    const ref = THING[t.refId] || PLACE[t.refId];
    if (subj && ref && !compatibleRef(subj, ref)) {
      problems.push(`pasangan acuan tidak wajar: ${s.jp}`);
    }
  }
}

const ghost = Array.from(allVocabRefs).filter(v => !VALID_VOCAB.has(v));
if (ghost.length) problems.push('id kosakata tidak dikenal: ' + ghost.join(', '));
const unused = VOCAB_BAB10.filter(v => !allVocabRefs.has(v.id));

console.log('---------------------------------------------');
console.log('Total level        :', LEVELS.length);
console.log('Total soal         :', totalQ, '(target', TOTAL_LEVELS * QUESTIONS_PER_LEVEL + ')');
console.log('Bank kalimat       :', SENTENCES.length);
console.log('Sebaran tipe soal  :', JSON.stringify(typeCount));
console.log('Soal berulang sig  :', sigFallbacks);
console.log('Soal tanpa terjemahan:', missingTranslation);
console.log('Kalimat bank salah あります/います:', existMismatch);
if (unused.length) {
  console.log('PERINGATAN kosakata Bab 10 belum terreferensi:', unused.map(m => m.jp).join(', '));
} else {
  console.log('OK: semua', VOCAB_BAB10.length, 'kosakata Bab 10 terreferensi di field vocab.');
}
const incomplete = LEVELS.filter(l => l.questions.length !== QUESTIONS_PER_LEVEL);
if (incomplete.length) problems.push('level tidak lengkap: ' + incomplete.map(l => l.level).join(', '));
if (missingTranslation) problems.push(`${missingTranslation} soal tanpa metadata terjemahan`);
if (problems.length) {
  console.log('MASALAH VALIDASI (' + problems.length + '):');
  problems.slice(0, 40).forEach(p => console.log(' -', p));
  process.exitCode = 1;
} else {
  console.log('OK: validasi lolos (id unik, tiles lengkap, answer di options, vocab id valid, terjemahan lengkap).');
}

/* ==========================================================================
 * BAGIAN 11 — TULIS OUTPUT
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
fs.writeFileSync(
  path.join(outDir, 'levels_bab10.js'),
  `// Auto-generated. Jangan diedit manual — edit tools/generate_bab10.js lalu jalankan ulang.\nwindow.LEVELS_BAB10_DATA = ${JSON.stringify(LEVELS)};\n`
);
console.log('Selesai! Output: js/data/vocab_bab10.js & js/data/levels_bab10.js');
