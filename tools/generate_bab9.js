/* ============================================================================
 * tools/generate_bab9.js  —  GENERATOR SOAL BAB 9 (ANTI-MONOTON)
 * ----------------------------------------------------------------------------
 * Minna no Nihongo I — Bab 9 (すき / じょうず / わかります / あります /
 * どうして / ～から / よく・だいたい・少し・たくさん・あまり・ぜんぜん)
 *
 * Acuan bunpou : sinaunihonggo.wordpress.com — "Tata Bahasa Bab 9"
 *   1. ～は～が 好き / 嫌いです
 *   2. ～は～が 上手 / 下手です
 *   3. ～は～が あります
 *   4. ～は～が 分かります
 *   5. どうして (～ですか)
 *   6. ～から
 *   7. よく / だいたい / 少し / たくさん / あまり / ぜんぜん
 *   (+ bahan bab sebelumnya yang sudah dipelajari: とても, そして, どんな,
 *      ～から, dan ekspresi Bab 9: 貸してください / いいですよ /
 *      残念ですが / ああ / 一緒にいかがですか / だめですか / また今度お願いします)
 *
 * Skema soal (7 tipe) SAMA PERSIS dengan js/questions.js:
 *   arrange, translate, complete, match, short_conversation,
 *   choose_translation, listening
 *
 * Output:
 *   js/data/vocab_bab9.js  -> window.VOCAB_BAB9_DATA
 *   js/data/levels_bab9.js -> window.LEVELS_BAB9_DATA
 *
 * Jalankan:  node tools/generate_bab9.js
 * ==========================================================================*/

const fs = require('fs');
const path = require('path');

/* ==========================================================================
 * BAGIAN 1 — UTILITAS ACAK (SEEDED RNG, reproducible)
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

/* --- konverter kana -> romaji (untuk metadata "cara baca") ----------------- */
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
};
function toRomaji(kanaStr) {
  let s = String(kanaStr).replace(/[\u30A1-\u30F6]/g, m =>
    String.fromCharCode(m.charCodeAt(0) - 0x60));
  s = s.replace(/(^|\s)は(?=\s|$)/g, '$1わ');
  let out = '', dbl = false, lastVowel = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i], next = s[i + 1];
    if (ch === 'っ') { dbl = true; continue; }
    if (ch === 'ー') { out += lastVowel || 'a'; continue; }
    if (ch === ' ' || ch === '　') { out += ' '; continue; }
    if ('。、？！・'.includes(ch)) { out += ' '; continue; }
    let syll = null;
    if (next && ROMAJI_TABLE[ch + next]) { syll = ROMAJI_TABLE[ch + next]; i++; }
    else if (ROMAJI_TABLE[ch]) syll = ROMAJI_TABLE[ch];
    else { out += ch; continue; }
    if (dbl) { out += syll.charAt(0); dbl = false; }
    out += syll;
    lastVowel = /[aiueo]$/.test(syll) ? syll.slice(-1) : lastVowel;
  }
  return out.replace(/\s+/g, ' ').trim();
}
/* partikel yang menempel di akhir token dipisah supaya romaji mudah dibaca */
function tokenRomaji(kana) {
  return toRomaji(String(kana).replace(/(わ|を|が|に|の|と|や|へ|も)$/, ' $1'));
}
function T(s, r) { return { s, r }; }
function joinS(toks) { return toks.map(t => t.s).join(''); }
function joinR(toks) { return toks.map(t => t.r).join(''); }

/* ==========================================================================
 * BAGIAN 2 — DATABASE KOSAKATA BAB 9 (sumber: daftar kotoba Bab 9)
 * ========================================================================*/
const B9NOUNS = [
  /* --- Musik & pertunjukan --- */
  { id: 'n_ongaku',     jp: '音楽',     kana: 'おんがく',   mean: 'musik',                          topic: 'musik',     uses: ['suki'] },
  { id: 'n_uta',        jp: '歌',       kana: 'うた',       mean: 'lagu',                           topic: 'musik',     uses: ['suki', 'jouzu'] },
  { id: 'n_kurashikku', jp: 'クラシック', kana: 'クラシック', mean: 'klasik',                         topic: 'musik',     uses: ['suki'] },
  { id: 'n_jyazu',      jp: 'ジャズ',   kana: 'ジャズ',     mean: 'jaz',                            topic: 'musik',     uses: ['suki'] },
  { id: 'n_kabuki',     jp: 'かぶき',   kana: 'かぶき',     mean: 'kabuki (drama tradisional Jepang)', topic: 'musik',   uses: ['suki'] },
  { id: 'n_konsaato',   jp: 'コンサート', kana: 'コンサート', mean: 'konser',                         topic: 'acara',     uses: ['suki'] },
  { id: 'n_karaoke',    jp: 'カラオケ', kana: 'カラオケ',   mean: 'karaoke',                        topic: 'acara',     uses: ['suki'] },
  /* --- Olahraga & aktivitas --- */
  { id: 'n_supootsu',   jp: 'スポーツ', kana: 'スポーツ',   mean: 'olahraga',                       topic: 'olahraga',  uses: ['suki', 'jouzu'] },
  { id: 'n_yakyuu',     jp: '野球',     kana: 'やきゅう',   mean: 'baseball',                       topic: 'olahraga',  uses: ['suki', 'jouzu'] },
  { id: 'n_dansu',      jp: 'ダンス',   kana: 'ダンス',     mean: 'dansa',                          topic: 'olahraga',  uses: ['suki', 'jouzu'] },
  { id: 'n_ryokou',     jp: '旅行',     kana: 'りょこう',   mean: 'wisata / perjalanan',            topic: 'aktivitas', uses: ['suki'] },
  /* --- Makanan & minuman --- */
  { id: 'n_ryouri',     jp: '料理',     kana: 'りょうり',   mean: 'masakan',                        topic: 'makanan',   uses: ['suki', 'jouzu'] },
  { id: 'n_nomimono',   jp: '飲み物',   kana: 'のみもの',   mean: 'minuman',                        topic: 'makanan',   uses: ['suki'] },
  /* --- Tulisan & huruf --- */
  { id: 'n_e',          jp: '絵',       kana: 'え',         mean: 'gambar / lukisan',               topic: 'tulisan',   uses: ['suki', 'jouzu'] },
  { id: 'n_ji',         jp: '字',       kana: 'じ',         mean: 'huruf',                          topic: 'tulisan',   uses: ['wakaru'] },
  { id: 'n_kanji',      jp: '漢字',     kana: 'かんじ',     mean: 'kanji',                          topic: 'tulisan',   uses: ['wakaru'] },
  { id: 'n_hiragana',   jp: 'ひらがな', kana: 'ひらがな',   mean: 'hiragana',                       topic: 'tulisan',   uses: ['wakaru'] },
  { id: 'n_katakana',   jp: 'カタカナ', kana: 'カタカナ',   mean: 'katakana',                       topic: 'tulisan',   uses: ['wakaru'] },
  { id: 'n_roomaji',    jp: 'ローマジ', kana: 'ローマジ',   mean: 'huruf latin (romaji)',           topic: 'tulisan',   uses: ['wakaru'] },
  /* --- Sehari-hari --- */
  { id: 'n_chiketto',   jp: 'チケット', kana: 'チケット',   mean: 'tiket',                          topic: 'seharihari', uses: ['aru'] },
  { id: 'n_jikan',      jp: '時間',     kana: 'じかん',     mean: 'waktu',                          topic: 'seharihari', uses: ['aru'] },
  { id: 'n_youji',      jp: '用事',     kana: 'ようじ',     mean: 'urusan',                         topic: 'seharihari', uses: ['aru'] },
  { id: 'n_yakusoku',   jp: '約束',     kana: 'やくそく',   mean: 'janji',                          topic: 'seharihari', uses: ['aru'] },
  { id: 'n_arubaito',   jp: 'アルバイト', kana: 'アルバイト', mean: 'kerja paruh waktu',             topic: 'seharihari', uses: [] },
  { id: 'n_komakaiokane', jp: '細かい お金', kana: 'こまかい おかね', mean: 'uang receh',           topic: 'seharihari', uses: ['aru'] },
  /* --- Orang (keluarga) --- */
  { id: 'n_goshujin',   jp: 'ご主人',   kana: 'ごしゅじん', mean: 'suami (untuk orang lain)',       topic: 'orang',     uses: [] },
  { id: 'n_otto',       jp: 'おっと',   kana: 'おっと',     mean: 'suami sendiri',                  topic: 'orang',     uses: [] },
  { id: 'n_okusan',     jp: 'おくさん', kana: 'おくさん',   mean: 'istri (untuk orang lain)',       topic: 'orang',     uses: [] },
  { id: 'n_tsuma',      jp: 'つま',     kana: 'つま',       mean: 'istri sendiri',                  topic: 'orang',     uses: [] },
  { id: 'n_kodomo',     jp: '子ども',   kana: 'こども',     mean: 'anak',                           topic: 'orang',     uses: [] },
];

const B9NA = [
  { id: 'v_suki',  jp: '好き', kana: 'すき',     mean: 'suka',                    type: 'adj_na' },
  { id: 'v_kirai', jp: '嫌い', kana: 'きらい',   mean: 'benci / tidak suka',      type: 'adj_na' },
  { id: 'v_jouzu', jp: '上手', kana: 'じょうず', mean: 'pandai / terampil',       type: 'adj_na' },
  { id: 'v_heta',  jp: '下手', kana: 'へた',     mean: 'tidak pandai',            type: 'adj_na' },
];
const B9VERB = [
  { id: 'v_wakarimasu', jp: '分かります', kana: 'わかります', mean: 'mengerti / paham', type: 'verb' },
  { id: 'v_arimasu',    jp: 'あります',   kana: 'あります',   mean: 'ada / memiliki',   type: 'verb' },
];
const B9ADV = [
  { id: 'adv_yoku',    jp: 'よく',     kana: 'よく',     mean: 'dengan baik / sering (tingkat 100%)',        type: 'adv', pct: '100%' },
  { id: 'adv_daitai',  jp: 'だいたい', kana: 'だいたい', mean: 'kira-kira / sebagian besar (tingkat 80%)',   type: 'adv', pct: '80%' },
  { id: 'adv_sukoshi', jp: '少し',     kana: 'すこし',   mean: 'sedikit (tingkat 30%)',                     type: 'adv', pct: '30%' },
  { id: 'adv_takusan', jp: 'たくさん', kana: 'たくさん', mean: 'banyak',                                     type: 'adv' },
  { id: 'adv_amari',   jp: 'あまり',   kana: 'あまり',   mean: 'tidak begitu (ikuti kalimat negatif)',      type: 'adv' },
  { id: 'adv_zenzen',  jp: 'ぜんぜん', kana: 'ぜんぜん', mean: 'sama sekali tidak (ikuti kalimat negatif)', type: 'adv', pct: '0%' },
  { id: 'adv_hayaku',  jp: '早く',     kana: 'はやく',   mean: 'dengan cepat',                               type: 'adv' },
  { id: 'adv_chotto',  jp: 'ちょっと', kana: 'ちょっと', mean: 'sedikit / sebentar',                         type: 'adv' },
];
const B9EXPR = [
  { id: 'e_doushite',       jp: 'どうして',   kana: 'どうして',   mean: 'kenapa / mengapa',                    type: 'expr' },
  { id: 'e_kara',           jp: '～から',     kana: '～から',     mean: 'karena ~',                            type: 'expr' },
  { id: 'e_kashitekudasai', jp: '貸してください', kana: 'かして ください', mean: 'tolong pinjamkan',            type: 'expr' },
  { id: 'e_iidesuyo',       jp: 'いいですよ', kana: 'いいですよ', mean: 'boleh',                               type: 'expr' },
  { id: 'e_zannendesuga',   jp: '残念ですが', kana: '残念ですが', mean: 'sayang sekali',                       type: 'expr' },
  { id: 'e_aa',             jp: 'ああ',       kana: 'ああ',       mean: 'ah / oh',                             type: 'expr' },
  { id: 'e_issyoniikaga',   jp: '一緒に いかがですか', kana: 'いっしょに いかげすか', mean: 'bagaimana kalau bersama-sama', type: 'expr' },
  { id: 'e_damedesuka',     jp: 'だめですか', kana: 'だめですか', mean: 'tidak bisa ya? tidak boleh ya?',      type: 'expr' },
  { id: 'e_matakondonegai', jp: 'また 今度 お願いします', kana: 'また こんど おねがいします', mean: 'lain kali ya', type: 'expr' },
];

/* --- Kosakata DASAR bab sebelumnya (data global website) yang benar-benar
 *      diperlukan dalam kalimat Bab 9 ------------------------------------ */
const GLOBAL_WORDS = [
  { id: 'n_nihongo',  jp: '日本語',   kana: 'にほんご',   mean: 'bahasa Jepang' },
  { id: 'n_eigo',     jp: '英語',     kana: 'えいご',     mean: 'bahasa Inggris' },
  { id: 'n_hito',     jp: '人',       kana: 'ひと',       mean: 'orang' },
  { id: 'n_sensei',   jp: '先生',     kana: 'せんせい',   mean: 'guru' },
  { id: 'n_tomodachi',jp: '友達',     kana: 'ともだち',   mean: 'teman' },
  { id: 'n_hon',      jp: '本',       kana: 'ほん',       mean: 'buku' },
  { id: 'n_jisho',    jp: '辞書',     kana: 'じしょ',     mean: 'kamus' },
  { id: 'n_okane',    jp: 'お金',     kana: 'おかね',     mean: 'uang' },
  { id: 'n_benkyou',  jp: '勉強',     kana: 'べんきょう', mean: 'belajar' },
  { id: 'n_otousan',  jp: 'お父さん', kana: 'おとうさん', mean: 'ayah' },
  { id: 'n_okaasan',  jp: 'お母さん', kana: 'おかあさん', mean: 'ibu' },
  { id: 'adv_totemo', jp: 'とても',   kana: 'とても',     mean: 'sangat' },
  { id: 'v_oshiemasu',jp: '教えます', kana: 'おしえます', mean: 'mengajar' },
  { id: 'v_naraimasu',jp: '習います', kana: 'ならいます', mean: 'belajar (keahlian)' },
  { id: 'v_omoshiroi',jp: '面白い',   kana: 'おもしろい', mean: 'menarik' },
  { id: 'v_shinsetsu',jp: '親切',     kana: 'しんせつ',   mean: 'baik hati' },
  { id: 'conj_soshite',jp: 'そして',  kana: 'そして',     mean: 'dan / kemudian' },
];

/* Nama tokoh (tokoh standar Minna no Nihongo, sama dengan bab lain) */
const NAMES = [
  { jp: 'ミラーさん',   kana: 'ミラーさん',   mean: 'Sdr. Miller' },
  { jp: 'ワットさん',   kana: 'ワットさん',   mean: 'Sdr. Watt' },
  { jp: '山田さん',     kana: 'やまださん',   mean: 'Sdr. Yamada' },
  { jp: '松本さん',     kana: 'まつもとさん', mean: 'Sdr. Matsumoto' },
  { jp: 'サントスさん', kana: 'サントスさん', mean: 'Sdr. Santos' },
  { jp: 'カリナさん',   kana: 'カリナさん',   mean: 'Sdr. Karina' },
  { jp: 'リンさん',     kana: 'リンさん',     mean: 'Sdr. Rin' },
  { jp: 'キムさん',     kana: 'キムさん',     mean: 'Sdr. Kim' },
  { jp: 'ジョンさん',   kana: 'ジョンさん',   mean: 'Sdr. Jon' },
  { jp: 'アミルさん',   kana: 'アミルさん',   mean: 'Sdr. Amir' },
];

const NM = {}; B9NOUNS.forEach(n => { NM[n.id] = n; });
const NAMAP = {}; B9NA.forEach(n => { NAMAP[n.id] = n; });
const GM = {}; GLOBAL_WORDS.forEach(g => { GM[g.id] = g; });
const VALID_VOCAB = new Set(VOCAB_ALL_IDS());
function VOCAB_ALL_IDS() {
  const ids = [];
  [...B9NA, ...B9VERB, ...B9NOUNS, ...B9ADV, ...B9EXPR].forEach(v => ids.push(v.id));
  GLOBAL_WORDS.forEach(g => ids.push(g.id));
  return ids;
}

/* Daftar kosakata final untuk js/data/vocab_bab9.js (hanya kata baru Bab 9) */
const VOCAB_BAB9 = [
  ...B9NA.map(n => ({ id: n.id, jp: n.jp, kana: n.kana, id_mean: n.mean, type: n.type })),
  ...B9VERB.map(n => ({ id: n.id, jp: n.jp, kana: n.kana, id_mean: n.mean, type: n.type })),
  ...B9NOUNS.map(n => ({ id: n.id, jp: n.jp, kana: n.kana, id_mean: n.mean, type: 'noun' })),
  ...B9ADV.map(n => ({ id: n.id, jp: n.jp, kana: n.kana, id_mean: n.mean, type: n.type })),
  ...B9EXPR.map(n => ({ id: n.id, jp: n.jp, kana: n.kana, id_mean: n.mean, type: n.type })),
];

/* Adverb frekuensi (skala sumber: 100% / 80% / 30% / negatif) */
const ADV_FREQ = {
  totemo:  { s: 'とても',     r: 'とても' },
  yoku:    { s: 'よく',     r: 'よく' },
  daitai:  { s: 'だいたい', r: 'だいたい' },
  sukoshi: { s: '少し',     r: 'すこし' },
  amari:   { s: 'あまり',   r: 'あまり' },
  zenzen:  { s: 'ぜんぜん', r: 'ぜんぜん' },
  takusan: { s: 'たくさん', r: 'たくさん' },
};

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
    romaji: tokens.map(t => tokenRomaji(t.r)).join(' '),
    idn: extra.idn,
    pattern: extra.pattern,
    vocab: uniq((extra.vocab || []).filter(v => VALID_VOCAB.has(v))),
    slots: extra.slots || [],
    tags: extra.tags || {},
  };
}

/* Subjek (orang yang merasa / punya kemampuan / punya sesuatu) */
const SUBJECTS = [
  { jp: 'わたし',   kana: 'わたし',   mean: 'Saya', gid: null },
  { jp: '先生',     kana: 'せんせい', mean: 'Guru', gid: 'n_sensei' },
  { jp: '友達',     kana: 'ともだち', mean: 'Teman', gid: 'n_tomodachi' },
  { jp: 'お父さん', kana: 'おとうさん', mean: 'Ayah', gid: 'n_otousan' },
  { jp: 'お母さん', kana: 'おかあさん', mean: 'Ibu', gid: 'n_okaasan' },
  { jp: '子ども',   kana: 'こども',   mean: 'Anak', gid: 'n_kodomo' },
  ...NAMES.map(n => ({ jp: n.jp, kana: n.kana, mean: n.mean, gid: null })),
];
function subTok(sub) { return T(sub.jp + 'は', sub.kana + 'わ'); }
function langWord(id) { return GM[id]; }

const MOD_NIHON = { s: '日本の', r: 'にほんの' };

/* --- POLA A: ～は～が 好き / 嫌い です ------------------------------------ */
function buildSuki(rnd) {
  const out = [];
  const objs = B9NOUNS.filter(n => n.uses.includes('suki'));
  for (const sub of SUBJECTS) {
    for (const obj of objs) {
      for (const pol of ['aff', 'neg', 'kirai']) {
        const advs = pol === 'aff' ? [null, 'totemo'] : pol === 'neg' ? ['amari'] : [null, 'totemo'];
        for (const adv of advs) {
          const canNihon = ['n_ongaku', 'n_uta', 'n_ryouri', 'n_kabuki'].includes(obj.id);
          const useNihon = canNihon && rnd() < 0.45;
          const tokens = [subTok(sub)];
          const vocab = [NAMAP[pol === 'kirai' ? 'v_kirai' : 'v_suki'].id];
          if (sub.gid) vocab.push(sub.gid);
          if (useNihon) tokens.push(T(MOD_NIHON.s, MOD_NIHON.r));
          const objIdx = tokens.length;
          tokens.push(T(obj.jp + 'が', obj.kana + 'が'));
          vocab.push(obj.id);
          const advIdx = tokens.length;
          if (adv === 'totemo') { tokens.push(T('とても', 'とても')); vocab.push('adv_totemo'); }
          if (adv === 'amari') { tokens.push(T('あまり', 'あまり')); vocab.push('adv_amari'); }
          const predIdx = tokens.length;
          const pred = pol === 'aff' ? ['好きです', 'すきです'] : pol === 'kirai' ? ['嫌いです', 'きらいです'] : ['好きではありません', 'すきではありません'];
          tokens.push(T(pred[0], pred[1]));

          const deg = adv === 'totemo' ? 'sangat ' : '';
          const objMean = useNihon ? obj.mean + ' Jepang' : obj.mean;
          let idn;
          if (pol === 'neg') idn = adv === 'amari' ? `${capital(sub.mean)} tidak begitu suka ${objMean}.` : `${capital(sub.mean)} tidak suka ${objMean}.`;
          else if (pol === 'kirai') idn = `${capital(sub.mean)} ${deg}benci ${objMean}.`;
          else idn = `${capital(sub.mean)} ${deg}suka ${objMean}.`;

          out.push(mkSent(tokens, {
            idn, pattern: 'suki',
            vocab,
            slots: [
              { index: predIdx, kind: 'predicate', answer: pred[0], cls: pol === 'kirai' ? 'pred_kirai' : 'pred_suki' },
              { index: advIdx, kind: 'adverb', answer: adv },
              { index: objIdx, kind: 'object', answer: obj.jp + 'が', objId: obj.id, topic: obj.topic },
            ],
            tags: { pattern: 'suki', pol, adverb: adv || null, subjId: sub.jp, subjMean: sub.mean, objId: obj.id, topic: obj.topic },
          }));
        }
      }
    }
  }
  return out;
}

/* --- POLA B: ～は～が 上手 / 下手 です ------------------------------------- */
function buildJouzu(rnd) {
  const out = [];
  const objs = B9NOUNS.filter(n => n.uses.includes('jouzu'))
    .map(n => ({ jp: n.jp, kana: n.kana, mean: n.mean, id: n.id }));
  objs.push({ ...GM['n_nihongo'] });
  objs.push({ ...GM['n_eigo'] });
  for (const sub of SUBJECTS) {
    for (const obj of objs) {
      for (const pol of ['aff', 'neg']) {
        for (const who of ['jouzu', 'heta']) {
          if (pol === 'neg' && who === 'heta') continue;
          const advs = pol === 'aff' ? [null, 'totemo'] : ['amari'];
          for (const adv of advs) {
            const tokens = [subTok(sub)];
            const vocab = [NAMAP['v_' + who].id];
            if (sub.gid) vocab.push(sub.gid);
            tokens.push(T(obj.jp + 'が', obj.kana + 'が'));
            vocab.push(obj.id);
            const advIdx = tokens.length;
            if (adv === 'totemo') { tokens.push(T('とても', 'とても')); vocab.push('adv_totemo'); }
            if (adv === 'amari') { tokens.push(T('あまり', 'あまり')); vocab.push('adv_amari'); }
            const predIdx = tokens.length;
            const pred = pol === 'aff'
              ? (who === 'jouzu' ? ['上手です', 'じょうずです'] : ['下手です', 'へたです'])
              : ['上手ではありません', 'じょうずではありません'];
            tokens.push(T(pred[0], pred[1]));

            const deg = adv === 'totemo' ? 'sangat ' : '';
            const idn = pol === 'neg'
              ? `${capital(sub.mean)} tidak begitu pandai ${obj.mean}.`
              : `${capital(sub.mean)} ${deg}${who === 'jouzu' ? 'pandai' : 'kurang pandai'} ${obj.mean}.`;

            out.push(mkSent(tokens, {
              idn, pattern: 'jouzu',
              vocab,
              slots: [
                { index: predIdx, kind: 'predicate', answer: pred[0], cls: who === 'jouzu' ? 'pred_jouzu' : 'pred_heta' },
                { index: advIdx, kind: 'adverb', answer: adv },
              ],
              tags: { pattern: 'jouzu', who, pol, adverb: adv || null, subjId: sub.jp, subjMean: sub.mean, objId: obj.id },
            }));
          }
        }
      }
    }
  }
  return out;
}

/* --- POLA C: ～は～が 分かります / 分かりません ----------------------------- */
function buildWakaru(rnd) {
  const out = [];
  const objs = B9NOUNS.filter(n => n.uses.includes('wakaru'))
    .map(n => ({ jp: n.jp, kana: n.kana, mean: n.mean, id: n.id }));
  objs.push({ ...GM['n_nihongo'] });
  objs.push({ ...GM['n_eigo'] });
  for (const sub of SUBJECTS) {
    for (const obj of objs) {
      for (const pol of ['aff', 'neg']) {
        const advs = pol === 'aff' ? [null, 'yoku', 'daitai', 'sukoshi'] : [null, 'amari', 'zenzen'];
        for (const adv of advs) {
          const tokens = [subTok(sub)];
          const vocab = ['v_wakarimasu'];
          if (sub.gid) vocab.push(sub.gid);
          tokens.push(T(obj.jp + 'が', obj.kana + 'が'));
          vocab.push(obj.id);
          const advIdx = tokens.length;
          if (adv) { tokens.push(T(ADV_FREQ[adv].s, ADV_FREQ[adv].r)); if (adv === 'amari') vocab.push('adv_amari'); if (adv === 'zenzen') vocab.push('adv_zenzen'); if (adv === 'yoku') vocab.push('adv_yoku'); if (adv === 'daitai') vocab.push('adv_daitai'); if (adv === 'sukoshi') vocab.push('adv_sukoshi'); }
          const predIdx = tokens.length;
          const pred = pol === 'aff' ? ['分かります', 'わかります'] : ['分かりません', 'わかりません'];
          tokens.push(T(pred[0], pred[1]));

          const deg = adv === 'yoku' ? 'dengan baik ' : adv === 'daitai' ? 'kira-kira ' : adv === 'sukoshi' ? 'sedikit ' : adv === 'amari' ? 'tidak begitu ' : adv === 'zenzen' ? 'sama sekali tidak ' : '';
          const negDeg = pol === 'neg' && !adv ? 'tidak ' : deg;
          const idn = pol === 'aff'
            ? `${capital(sub.mean)} mengerti ${obj.mean} ${deg}`.trim() + '.'
            : `${capital(sub.mean)} ${negDeg}mengerti ${obj.mean}.`;

          out.push(mkSent(tokens, {
            idn, pattern: 'wakaru',
            vocab,
            slots: [
              { index: predIdx, kind: 'predicate', answer: pred[0], cls: pol === 'aff' ? 'pred_wakaru' : 'pred_wakaru_neg' },
              { index: advIdx, kind: 'adverb', answer: adv },
            ],
            tags: { pattern: 'wakaru', pol, adverb: adv || null, subjId: sub.jp, subjMean: sub.mean, objId: obj.id },
          }));
        }
      }
    }
  }
  return out;
}

/* --- POLA D: ～は～が あります / ありません --------------------------------- */
function buildAru(rnd) {
  const out = [];
  const objs = B9NOUNS.filter(n => n.uses.includes('aru'))
    .map(n => ({ jp: n.jp, kana: n.kana, mean: n.mean, id: n.id }));
  objs.push({ ...GM['n_hon'] });
  objs.push({ ...GM['n_okane'] });
  const withTime = new Set(['n_youji', 'n_yakusoku', 'n_jikan']);
  for (const sub of SUBJECTS) {
    if (sub.jp === '子ども') continue; // "Anak punya janji" kurang wajar
    for (const obj of objs) {
      for (const pol of ['aff', 'neg']) {
        const advs = pol === 'aff' ? [null, 'takusan'] : [null, 'amari', 'zenzen'];
        const times = withTime.has(obj.id) ? [null, 'ashita', 'kyou'] : [null];
        for (const adv of advs) {
          for (const time of times) {
            const tokens = [];
            const vocab = ['v_arimasu'];
            if (sub.gid) vocab.push(sub.gid);
            tokens.push(subTok(sub));
            if (time) tokens.push(T(time === 'ashita' ? '明日' : '今日', time === 'ashita' ? 'あした' : 'きょう'));
            tokens.push(T(obj.jp + 'が', obj.kana + 'が'));
            vocab.push(obj.id);
            const advIdx = tokens.length;
            if (adv) { tokens.push(T(ADV_FREQ[adv].s, ADV_FREQ[adv].r)); vocab.push('adv_' + adv); }
            const predIdx = tokens.length;
            const pred = pol === 'aff' ? ['あります', 'あります'] : ['ありません', 'ありません'];
            tokens.push(T(pred[0], pred[1]));

            const deg = adv === 'takusan' ? 'banyak ' : adv === 'amari' ? 'tidak begitu ' : adv === 'zenzen' ? 'sama sekali tidak ' : '';
            const negDeg = pol === 'neg' && !adv ? 'tidak ' : deg;
            const timeMean = time === 'ashita' ? 'Besok, ' : time === 'kyou' ? 'Hari ini, ' : '';
            const idn = `${timeMean}${capital(sub.mean)} ${negDeg}punya ${obj.mean}.`;

            out.push(mkSent(tokens, {
              idn, pattern: 'aru',
              vocab,
              slots: [
                { index: predIdx, kind: 'predicate', answer: pred[0], cls: pol === 'aff' ? 'pred_aru' : 'pred_aru_neg' },
                { index: advIdx, kind: 'adverb', answer: adv },
              ],
              tags: { pattern: 'aru', pol, adverb: adv || null, subjId: sub.jp, subjMean: sub.mean, objId: obj.id, topic: 'seharihari' },
            }));
          }
        }
      }
    }
  }
  return out;
}

/* --- POLA E: ～から (sebab-akibat) — token eksplisit, pasangan terkurasi ----
 * rToks : token clause alasan (diakhiri から / ですから)
 * aToks : token clause akibat                                   */
const KARA_PAIRS = [
  { rToks: [T('日本語が', 'にほんごが'), T('好きだから、', 'すきだから、')],
    aToks: [T('日本語を勉強します', 'にほんごをべんきょうします')],
    idnR: 'karena suka bahasa Jepang', idnA: 'belajar bahasa Jepang',
    vocab: ['n_nihongo', 'v_suki', 'n_benkyou', 'e_kara'], actionKey: 'benkyou' },
  { rToks: [T('音楽が', 'おんがくが'), T('好きだから、', 'すきだから、')],
    aToks: [T('コンサートに', 'コンサートに'), T('行きます', 'いきます')],
    idnR: 'karena suka musik', idnA: 'pergi ke konser',
    vocab: ['n_ongaku', 'v_suki', 'n_konsaato', 'e_kara'], actionKey: 'konsaato' },
  { rToks: [T('チケットが', 'チケットが'), T('ありますから、', 'ありますから、')],
    aToks: [T('コンサートに', 'コンサートに'), T('行きます', 'いきます')],
    idnR: 'karena ada tiket', idnA: '(saya) pergi ke konser',
    vocab: ['n_chiketto', 'v_arimasu', 'n_konsaato', 'e_kara'], actionKey: 'konsaato' },
  { rToks: [T('日本語が', 'にほんごが'), T('ぜんぜん 分かりませんから、', 'ぜんぜん わかりませんから、')],
    aToks: [T('日本語を', 'にほんごを'), T('習います', 'ならいます')],
    idnR: 'karena sama sekali tidak mengerti bahasa Jepang', idnA: 'belajar bahasa Jepang',
    vocab: ['n_nihongo', 'v_wakarimasu', 'adv_zenzen', 'v_naraimasu', 'e_kara'], actionKey: 'narau' },
  { rToks: [T('明日', 'あした'), T('約束が', 'やくそくが'), T('ありますから、', 'ありますから、')],
    aToks: [T('残念ですが、', 'ざんねんですが、'), T('だめです', 'だめです')],
    idnR: 'karena besok ada janji', idnA: 'sayang sekali, tidak bisa',
    vocab: ['n_yakusoku', 'v_arimasu', 'e_zannendesuga', 'e_kara'], actionKey: 'dame' },
  { rToks: [T('明日', 'あした'), T('用事が', 'ようじが'), T('ありますから、', 'ありますから、')],
    aToks: [T('残念ですが、', 'ざんねんですが、'), T('だめです', 'だめです')],
    idnR: 'karena besok ada urusan', idnA: 'sayang sekali, tidak bisa',
    vocab: ['n_youji', 'v_arimasu', 'e_zannendesuga', 'e_kara'], actionKey: 'dame' },
  { rToks: [T('時間が', 'じかんが'), T('たくさん ありますから、', 'たくさん ありますから、')],
    aToks: [T('一緒に', 'いっしょに'), T('いかがですか', 'いかげすか')],
    idnR: 'karena ada banyak waktu', idnA: 'bagaimana kalau bersama-sama?',
    vocab: ['n_jikan', 'adv_takusan', 'v_arimasu', 'e_issyoniikaga', 'e_kara'], actionKey: 'ikaga' },
  { rToks: [T('歌が', 'うたが'), T('好きだから、', 'すきだから、')],
    aToks: [T('カラオケに', 'カラオケに'), T('行きます', 'いきます')],
    idnR: 'karena suka lagu', idnA: 'pergi karaoke',
    vocab: ['n_uta', 'v_suki', 'n_karaoke', 'e_kara'], actionKey: 'karaoke' },
  { rToks: [T('英語が', 'えいごが'), T('分かりますから、', 'わかりますから、')],
    aToks: [T('英語で', 'えいごで'), T('電話をかけます', 'でんわをかけます')],
    idnR: 'karena mengerti bahasa Inggris', idnA: 'menelepon dalam bahasa Inggris',
    vocab: ['n_eigo', 'v_wakarimasu', 'e_kara'], actionKey: 'denwa' },
  { rToks: [T('スポーツが', 'スポーツが'), T('好きだから、', 'すきだから、')],
    aToks: [T('ダンスを', 'ダンスを'), T('習います', 'ならいます')],
    idnR: 'karena suka olahraga', idnA: 'belajar dansa',
    vocab: ['n_supootsu', 'v_suki', 'n_dansu', 'v_naraimasu', 'e_kara'], actionKey: 'narau' },
  { rToks: [T('わたしは', 'わたしわ'), T('日本語が', 'にほんごが'), T('好きですから、', 'すきですから、')],
    aToks: [T('日本語を勉強します', 'にほんごをべんきょうします')],
    idnR: 'karena saya suka bahasa Jepang', idnA: '(saya) belajar bahasa Jepang',
    vocab: ['n_nihongo', 'v_suki', 'n_benkyou', 'e_kara'], actionKey: 'benkyou' },
  { rToks: [T('わたしは', 'わたしわ'), T('コンサートが', 'コンサートが'), T('好きですから、', 'すきですから、')],
    aToks: [T('よく', 'よく'), T('コンサートに', 'コンサートに'), T('行きます', 'いきます')],
    idnR: 'karena saya suka konser', idnA: 'sering pergi ke konser',
    vocab: ['n_konsaato', 'v_suki', 'adv_yoku', 'e_kara'], actionKey: 'konsaato' },
  { rToks: [T('山田さんは', 'やまださんわ'), T('日本語が', 'にほんごが'), T('上手ですから、', 'じょうずですから、')],
    aToks: [T('日本語を', 'にほんごを'), T('教えます', 'おしえます')],
    idnR: 'karena Sdr. Yamada pandai bahasa Jepang', idnA: 'mengajarkan bahasa Jepang',
    vocab: ['n_nihongo', 'v_jouzu', 'v_oshiemasu', 'e_kara'], actionKey: 'oshieru' },
];

function buildKara() {
  return KARA_PAIRS.map((p, i) => {
    const tokens = [...p.rToks, ...p.aToks];
    const reasonStr = joinS(p.rToks).replace(/、$/, '');
    return mkSent(tokens, {
      idn: `${capital(p.idnR)}, ${p.idnA}.`,
      pattern: 'kara',
      vocab: p.vocab,
      slots: [
        { index: -1, kind: 'reason', answer: reasonStr, reasonLen: p.rToks.length, cls: 'kara_reason' },
      ],
      tags: { pattern: 'kara', pairIdx: i, reasonStr, actionKey: p.actionKey, actionStr: joinS(p.aToks) },
    });
  });
}

/* --- POLA F: そして (dua klausa searah) — 5 token, tier 3+ ----------------- */
function buildSoshite() {
  const out = [];
  const G = id => (GM[id] || NM[id]);
  const families = [
    { pred: ['好きです', 'すきです'], predMid: '好きです。そして、', predMidR: 'すきです。そして、', cls: 'suki',
      pairs: [['n_jyazu','n_kurashikku'], ['n_ongaku','n_uta'], ['n_supootsu','n_dansu'], ['n_ryouri','n_ryokou'], ['n_konsaato','n_karaoke']] },
    { pred: ['分かります', 'わかります'], predMid: '分かります。そして、', predMidR: 'わかります。そして、', cls: 'wakaru',
      pairs: [['n_nihongo','n_eigo'], ['n_kanji','n_hiragana'], ['n_hiragana','n_katakana']] },
    { pred: ['上手です', 'じょうずです'], predMid: '上手です。そして、', predMidR: 'じょうずです。そして、', cls: 'jouzu',
      pairs: [['n_nihongo','n_eigo'], ['n_uta','n_ryouri'], ['n_dansu','n_yakyuu']] },
  ];
  for (const sub of SUBJECTS) {
    for (const f of families) {
      for (const [a, b] of f.pairs) {
        const o1 = G(a), o2 = G(b);
        const tokens = [
          subTok(sub),
          T(o1.jp + 'が', o1.kana + 'が'),
          T(f.predMid, f.predMidR),
          T(o2.jp + 'も', o2.kana + 'も'),
          T(f.pred[0], f.pred[1]),
        ];
        const predVocab = { suki: 'v_suki', wakaru: 'v_wakarimasu', jouzu: 'v_jouzu' }[f.cls];
        const vocab = [predVocab, o1.id, o2.id, 'conj_soshite'];
        if (sub.gid) vocab.push(sub.gid);
        const idn = `${capital(sub.mean)} ${f.cls === 'suki' ? 'suka' : f.cls === 'wakaru' ? 'mengerti' : 'pandai'} ${o1.mean}. Dan juga ${o2.mean}.`;
        out.push(mkSent(tokens, {
          idn, pattern: 'soshite',
          vocab,
          slots: [],
          tags: { pattern: 'soshite', cls: f.cls, subjId: sub.jp, subjMean: sub.mean, objId: b, topic: G(b).topic || 'musik' },
        }));
      }
    }
  }
  return out;
}

/* --- POLA G: Pertanyaan どんな ～ が 好きですか — tier 2+ ------------------- */
function buildDonnaQ() {
  const out = [];
  const items = [
    { noun: NM['n_ongaku'], subj: null },
    { noun: NM['n_supootsu'], subj: null },
    { noun: NM['n_ryouri'], subj: null },
    { noun: { ...GM['n_hito'] }, subj: null },
    { noun: NM['n_ongaku'], subj: SUBJECTS[0] },
    { noun: NM['n_ongaku'], subj: SUBJECTS[6] },
    { noun: NM['n_uta'], subj: SUBJECTS[3] },
    { noun: NM['n_karaoke'], subj: SUBJECTS[1] },
  ];
  for (const it of items) {
    const tokens = [];
    const vocab = [it.noun.id];
    if (it.subj) { tokens.push(subTok(it.subj)); if (it.subj.gid) vocab.push(it.subj.gid); }
    tokens.push(T('どんな', 'どんな'));
    tokens.push(T(it.noun.jp + 'が', it.noun.kana + 'が'));
    tokens.push(T('好きですか', 'すきですか'));
    const idn = (it.subj ? it.subj.mean : 'Kamu') + ' suka ' + it.noun.mean + ' yang bagaimana?';
    out.push(mkSent(tokens, {
      idn, pattern: 'donna',
      vocab,
      slots: [{ index: it.subj ? 1 : 0, kind: 'question_word', answer: 'どんな', cls: 'qword' }],
      tags: { pattern: 'donna', subjId: it.subj ? it.subj.jp : null, objId: it.noun.id, topic: it.noun.topic || 'orang' },
    }));
  }
  return out;
}

/* ==========================================================================
 * BAGIAN 4 — BANK KALIMAT
 * ========================================================================*/
const bankRnd = mulberry32(20260919);
const SENTENCES = [
  ...buildSuki(bankRnd),
  ...buildJouzu(bankRnd),
  ...buildWakaru(bankRnd),
  ...buildAru(bankRnd),
  ...buildKara(),
  ...buildSoshite(),
  ...buildDonnaQ(),
];

/* ==========================================================================
 * BAGIAN 5 — SILABUS PER TIER (50 level, struktur sama dengan website)
 *   1-10   mudah    : pola dasar afirmatif
 *   11-20  sedang   : negatif + とても/あまり/ぜんぜん + pertanyaan
 *   21-30  kalimat  : adverb frekuensi + 下手です + そして
 *   31-40  campuran : どうして + ～から + dialog pinjam/mengajak
 *   41-50  acak     : semua pola, kalimat panjang, distractor menjebak
 * ========================================================================*/
const TIERS = [
  {
    max: 10, key: 'mudah',
    focus: 'Pengenalan pola dasar Bab 9 (bentuk positif: 好き / 分かります / あります / 上手)',
    patterns: ['suki_aff', 'wakaru_aff', 'aru_aff', 'jouzu_aff'],
    adverbs: [null, 'totemo'],
    maxTokens: 4, distractors: 3, qChoice: 3,
    typeWeights: [
      { v: 'complete', w: 24 }, { v: 'match', w: 18 }, { v: 'choose_translation', w: 18 },
      { v: 'arrange', w: 16 }, { v: 'listening', w: 12 }, { v: 'short_conversation', w: 6 },
      { v: 'translate', w: 6 },
    ],
  },
  {
    max: 20, key: 'sedang',
    focus: 'Bentuk negatif (あまり〜ません / 嫌いです) + とても / ぜんぜん + pertanyaan',
    patterns: ['suki_aff', 'suki_neg', 'suki_kirai', 'wakaru_aff', 'wakaru_neg', 'aru_aff', 'aru_neg', 'jouzu_aff', 'donna'],
    adverbs: [null, 'totemo', 'amari', 'zenzen'],
    maxTokens: 5, distractors: 3, qChoice: 3,
    typeWeights: [
      { v: 'complete', w: 22 }, { v: 'arrange', w: 18 }, { v: 'choose_translation', w: 14 },
      { v: 'short_conversation', w: 12 }, { v: 'listening', w: 12 }, { v: 'match', w: 12 },
      { v: 'translate', w: 10 },
    ],
  },
  {
    max: 30, key: 'kalimat',
    focus: 'Kata keterangan frekuensi (よく / だいたい / 少し / たくさん) + 下手です + そして',
    patterns: ['suki_aff', 'suki_neg', 'suki_kirai', 'wakaru_aff', 'wakaru_neg', 'aru_aff', 'aru_neg', 'jouzu_aff', 'jouzu_heta', 'donna', 'soshite'],
    adverbs: [null, 'totemo', 'amari', 'zenzen', 'yoku', 'daitai', 'sukoshi', 'takusan'],
    maxTokens: 5, distractors: 3, qChoice: 3,
    typeWeights: [
      { v: 'arrange', w: 20 }, { v: 'short_conversation', w: 16 }, { v: 'complete', w: 16 },
      { v: 'listening', w: 14 }, { v: 'translate', w: 12 }, { v: 'choose_translation', w: 12 },
      { v: 'match', w: 10 },
    ],
  },
  {
    max: 40, key: 'campuran',
    focus: 'Alasan: どうして ～ですか + ～から + dialog pinjam / mengajak (貸してください)',
    patterns: ['suki_aff', 'suki_neg', 'suki_kirai', 'wakaru_aff', 'wakaru_neg', 'aru_aff', 'aru_neg', 'jouzu_aff', 'jouzu_heta', 'kara', 'donna', 'soshite'],
    adverbs: [null, 'totemo', 'amari', 'zenzen', 'yoku', 'daitai', 'sukoshi', 'takusan'],
    maxTokens: 7, distractors: 4, qChoice: 4,
    typeWeights: [
      { v: 'short_conversation', w: 20 }, { v: 'arrange', w: 16 }, { v: 'listening', w: 16 },
      { v: 'complete', w: 14 }, { v: 'translate', w: 14 }, { v: 'choose_translation', w: 10 },
      { v: 'match', w: 10 },
    ],
  },
  {
    max: 50, key: 'acak',
    focus: 'Ujian campuran: semua pola Bab 9, kalimat panjang, distractor menjebak',
    patterns: ['suki_aff', 'suki_neg', 'suki_kirai', 'wakaru_aff', 'wakaru_neg', 'aru_aff', 'aru_neg', 'jouzu_aff', 'jouzu_heta', 'kara', 'donna', 'soshite'],
    adverbs: [null, 'totemo', 'amari', 'zenzen', 'yoku', 'daitai', 'sukoshi', 'takusan'],
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

function patternKey(s) {
  if (s.tags.pattern === 'kara') return 'kara';
  if (s.tags.pattern === 'soshite') return 'soshite';
  if (s.tags.pattern === 'donna') return 'donna';
  const base = s.tags.pattern;
  if (base === 'suki') {
    if (s.tags.pol === 'neg') return 'suki_neg';
    if (s.tags.pol === 'kirai') return 'suki_kirai';
    return 'suki_aff';
  }
  if (base === 'jouzu') return s.tags.who === 'heta' ? 'jouzu_heta' : 'jouzu_aff';
  if (base === 'wakaru') return s.tags.pol === 'neg' ? 'wakaru_neg' : 'wakaru_aff';
  if (base === 'aru') return s.tags.pol === 'neg' ? 'aru_neg' : 'aru_aff';
  return base;
}
function sentencePoolFor(syl) {
  return SENTENCES.filter(s => {
    if (!syl.patterns.includes(patternKey(s))) return false;
    if (s.tags.adverb && !syl.adverbs.includes(s.tags.adverb)) return false;
    if (s.tokens.length > syl.maxTokens) return false;
    return true;
  });
}

/* ==========================================================================
 * BAGIAN 6 — MESIN DISTRAKTOR (pengecoh sekelas / sepola)
 * ========================================================================*/
const PRED_DISTRACTOR = {
  pred_suki:        ['嫌いです', '上手です', '分かります'],
  pred_kirai:       ['好きです', '上手です', '分かります'],
  pred_jouzu:       ['下手です', '好きです', '分かります'],
  pred_heta:        ['上手です', '好きです', '分かります'],
  pred_wakaru:      ['あります', '上手です', '好きです'],
  pred_wakaru_neg:  ['あります', '上手です', '分かります'],
  pred_aru:         ['分かります', '上手です', '好きです'],
  pred_aru_neg:     ['分かります', '上手です', '好きです'],
};
const ADV_DISTRACTOR_FREQ = ['よく', '少し', 'ぜんぜん', 'だいたい', 'とても'];
const QWORD_DISTRACTOR = ['どう', 'どうして', 'そして', 'よく'];
const ADV_DISTRACTOR_DEG = ['とても', 'ぜんぜん', 'あまり', '少し', 'ちょっと'];

function objsForTopic(topic, excludeId) {
  return B9NOUNS.filter(n => n.topic === topic && n.id !== excludeId);
}
function makeObjDistractors(topic, excludeId, count, rnd) {
  const pool = objsForTopic(topic, excludeId);
  const src = pool.length >= count ? pool : B9NOUNS.filter(n => n.id !== excludeId && n.uses.length);
  return pickN(src, count, rnd).map(n => n.jp + 'が');
}
function distractorTokensFor(sentence, rnd, count) {
  const t = sentence.tags;
  const pool = [];
  if (t.pattern === 'suki') pool.push(...PRED_DISTRACTOR.pred_suki, 'とても', 'ぜんぜん');
  if (t.pattern === 'jouzu') pool.push(...PRED_DISTRACTOR.pred_jouzu, 'とても', 'あまり');
  if (t.pattern === 'wakaru') pool.push(...PRED_DISTRACTOR.pred_wakaru, 'ぜんぜん', '少し');
  if (t.pattern === 'aru') pool.push(...PRED_DISTRACTOR.pred_aru, 'たくさん', '少し');
  if (t.pattern === 'kara') pool.push('そして', 'どうして', 'まったく');
  if (t.topic) pool.push(...makeObjDistractors(t.topic, t.objId || null, 2, rnd));
  return pickN(uniq(pool), count, rnd);
}

/* ==========================================================================
 * BAGIAN 7 — GENERATOR PER TIPE SOAL (skema = js/questions.js)
 * ========================================================================*/
let qIdCounter = 1;
function nextId() { return `q_b9_${qIdCounter++}`; }
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

/* --- 2) TRANSLATE ---------------------------------------------------------- */
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

/* --- 3) COMPLETE ----------------------------------------------------------- */
function genComplete(sentence, syl, rnd) {
  const tokens = tileTokens(sentence);
  if (tokens.length < 3 || !sentence.slots.length) return null;
  const usable = sentence.slots.filter(sl => {
    if (sl.kind === 'reason') return syl.level >= 31;
    if (sl.kind === 'adverb' && !sl.answer) return false;
    if (sl.kind === 'object' && syl.level < 11) return false;
    if (sl.kind === 'question_word' && syl.level < 11) return false;
    return true;
  });
  if (!usable.length) return null;
  const slot = pick(usable, rnd);

  /* blank clause alasan (kara) — pilihan = clause alasan lain */
  if (slot.kind === 'reason') return null; // (ditangani genCompleteKara)
  const target = slot.answer;
  const idx = tokens.indexOf(target);
  if (idx === -1) return null;
  const promptTokens = tokens.slice();
  promptTokens[idx] = '＿＿＿';

  if (slot.kind === 'predicate') {
    let pool = PRED_DISTRACTOR[slot.cls] || PRED_DISTRACTOR.pred_suki;
    if (syl.level < 21) pool = pool.filter(x => x !== '下手です'); // heta = tier 3
    const d = pickN(pool, syl.distractors, rnd);
    const options = shuffle(uniq([target, ...d]), rnd);
    if (options.length < 3) return null;
    return {
      id: nextId(), type: 'complete',
      instruction: 'Lengkapi kalimat berikut dengan kata yang tepat.',
      prompt: promptTokens.join(' '),
      translation: sentence.idn,
      options, answer: target,
      reading: sentence.reading,
      romaji: sentence.romaji,
      vocab: sentence.vocab,
      _sentJp: sentence.jp,
    };
  }
  if (slot.kind === 'adverb') {
    const isFreq = ['よく', 'だいたい', '少し', 'ぜんぜん', 'たくさん'].includes(target);
    const d = pickN(isFreq ? ADV_DISTRACTOR_FREQ : ADV_DISTRACTOR_DEG, syl.distractors, rnd).filter(x => x !== target);
    const options = shuffle(uniq([target, ...d]), rnd);
    if (options.length < 3) return null;
    return {
      id: nextId(), type: 'complete',
      instruction: 'Lengkapi kalimat berikut dengan kata keterangan yang tepat.',
      prompt: promptTokens.join(' '),
      translation: sentence.idn,
      options, answer: target,
      reading: sentence.reading,
      romaji: sentence.romaji,
      vocab: sentence.vocab,
      _sentJp: sentence.jp,
    };
  }
  if (slot.kind === 'object') {
    const d = makeObjDistractors(slot.topic, slot.objId, syl.distractors, rnd).filter(x => x !== target);
    const options = shuffle(uniq([target, ...d]), rnd);
    if (options.length < 3) return null;
    return {
      id: nextId(), type: 'complete',
      instruction: 'Lengkapi kalimat berikut dengan kata benda yang tepat.',
      prompt: promptTokens.join(' '),
      translation: sentence.idn,
      options, answer: target,
      reading: sentence.reading,
      romaji: sentence.romaji,
      vocab: sentence.vocab,
      _sentJp: sentence.jp,
    };
  }
  if (slot.kind === 'question_word') {
    let qpool = QWORD_DISTRACTOR;
    if (syl.level < 21) qpool = qpool.filter(x => x !== 'よく'); // yoku = tier 3
    const d = pickN(qpool, syl.distractors, rnd).filter(x => x !== target);
    const options = shuffle(uniq([target, ...d]), rnd);
    if (options.length < 3) return null;
    return {
      id: nextId(), type: 'complete',
      instruction: 'Lengkapi pertanyaan berikut dengan kata tanya yang tepat.',
      prompt: promptTokens.join(' '),
      translation: sentence.idn,
      options, answer: target,
      reading: sentence.reading,
      romaji: sentence.romaji,
      vocab: sentence.vocab,
      _sentJp: sentence.jp,
    };
  }
  return null;
}

/* COMPLETE khusus pola ～から: blank = seluruh clause alasan,
 * pengecoh = clause alasan dari pasangan lain (konteks tidak cocok) */
function genCompleteKara(sentence, syl, rnd) {
  const t = sentence.tags;
  const rToks = KARA_PAIRS[t.pairIdx].rToks;
  const reasonStr = joinS(rToks).replace(/、$/, '');
  const aStr = joinS(KARA_PAIRS[t.pairIdx].aToks);
  const others = KARA_PAIRS
    .map((p, i) => ({ p, i }))
    .filter(x => x.i !== t.pairIdx && x.p.actionKey !== t.actionKey)
    .map(x => joinS(x.p.rToks).replace(/、$/, ''));
  const d = pickN(others, syl.qChoice - 1, rnd);
  const options = shuffle(uniq([reasonStr, ...d]), rnd);
  if (options.length < 3) return null;
  return {
    id: nextId(), type: 'complete',
    instruction: 'Lengkapi kalimat berikut dengan alasan yang paling tepat.',
    prompt: `＿＿＿、 ${aStr}`,
    translation: sentence.idn,
    options, answer: reasonStr,
    reading: sentence.reading,
    romaji: sentence.romaji,
    vocab: sentence.vocab,
    _sentJp: sentence.jp,
  };
}

/* --- 4) MATCH (9 tema yang berputar) --------------------------------------- */
const MATCH_THEMES = [
  {
    name: 'musik',
    pick: () => B9NOUNS.filter(x => x.topic === 'musik' || x.id === 'n_konsaato' || x.id === 'n_karaoke'),
    left: v => v.jp, right: v => v.mean,
  },
  {
    name: 'aktivitas',
    pick: () => B9NOUNS.filter(x => x.topic === 'olahraga' || x.topic === 'aktivitas' || x.topic === 'makanan'),
    left: v => v.jp, right: v => v.mean,
  },
  {
    name: 'keterangan',
    pick: () => B9ADV.map(x => ({ id: x.id, jp: x.jp, mean: x.id_mean || x.mean, minLevel: (x.id === 'adv_yoku' || x.id === 'adv_daitai' || x.id === 'adv_sukoshi' || x.id === 'adv_takusan' || x.id === 'adv_hayaku') ? 21 : (x.id === 'adv_chotto' ? 11 : 1) })),
    left: v => v.jp, right: v => v.mean,
  },
  {
    name: 'tulisan',
    pick: () => B9NOUNS.filter(x => x.topic === 'tulisan'),
    left: v => v.jp, right: v => v.mean,
  },
  {
    name: 'sehari-hari',
    pick: () => B9NOUNS.filter(x => x.topic === 'seharihari'),
    left: v => v.jp, right: v => v.mean,
  },
  {
    name: 'orang',
    pick: () => B9NOUNS.filter(x => x.topic === 'orang'),
    left: v => v.jp, right: v => v.mean,
  },
  {
    name: 'pola',
    pick: () => [...B9NA, ...B9VERB].map(x => ({ id: x.id, jp: x.jp, mean: x.mean })),
    left: v => v.jp, right: v => v.mean,
  },
  {
    name: 'persen',
    pick: () => B9ADV.filter(x => x.pct).map(x => ({ id: x.id, jp: x.jp, mean: `tingkat ${x.pct}`, minLevel: 21 })),
    left: v => v.jp, right: v => v.mean,
  },
  {
    name: 'fungsi',
    pick: () => [
      { id: 'e_kashitekudasai', jp: '貸してください', mean: 'meminta tolong meminjamkan' },
      { id: 'e_iidesuyo', jp: 'いいですよ', mean: 'mengatakan "boleh"' },
      { id: 'e_zannendesuga', jp: '残念ですが', mean: 'penolakan yang sopan' },
      { id: 'e_doushite', jp: 'どうして', mean: 'bertanya alasan' },
      { id: 'e_kara', jp: '～から', mean: 'menyatakan sebab', minLevel: 31 },
      { id: 'e_issyoniikaga', jp: '一緒に いかがですか', mean: 'mengajak dengan sopan' },
      { id: 'e_matakondonegai', jp: 'また 今度 お願いします', mean: 'menawarkan kesempatan lain' },
      { id: 'e_damedesuka', jp: 'だめですか', mean: 'bertanya apakah tidak boleh' },
    ],
    left: v => v.jp, right: v => v.mean,
  },
  {
    name: 'tanya-jawab',
    pick: () => [
      { id: 'qa1', jp: '音楽が 好きですか。', mean: 'はい、とても 好きです。', voc: ['v_suki'] },
      { id: 'qa2', jp: '日本語が 分かりますか。', mean: 'いいえ、ぜんぜん 分かりません。', voc: ['v_wakarimasu', 'adv_zenzen'] },
      { id: 'qa3', jp: '明日 は 約束が あります か。', mean: 'はい、あります。', voc: ['v_arimasu', 'n_yakusoku'] },
      { id: 'qa4', jp: 'どうして ですか。', mean: '音楽が 好きだから です。', voc: ['v_suki', 'e_kara'], minLevel: 31 },
      { id: 'qa5', jp: '一緒に いかがですか。', mean: '残念ですが、約束が あります から、だめ です。', voc: ['e_zannendesuga', 'e_kara', 'n_yakusoku'], minLevel: 31 },
      { id: 'qa6', jp: 'どんな 音楽が 好きですか。', mean: 'ジャズ が 好きです。', voc: ['e_donna', 'v_suki', 'n_jyazu'] },
      { id: 'qa7', jp: 'うたが 下手ですか。', mean: 'いいえ、とても 上手です。', voc: ['v_heta', 'v_jouzu', 'n_uta'], minLevel: 21 },
      { id: 'qa8', jp: 'この 本を 貸してください。', mean: 'いいですよ。', voc: ['e_kashitekudasai', 'e_iidesuyo', 'n_hon'] },
      { id: 'qa9', jp: '英語 は 分かります か。', mean: 'はい、だいたい 分かります。', voc: ['v_wakarimasu', 'adv_daitai', 'n_eigo'], minLevel: 21 },
      { id: 'qa10', jp: 'カラオケは 好きですか。', mean: 'いいえ、あまり 好きではありません。', voc: ['v_suki', 'n_karaoke'] },
    ],
    left: v => v.jp, right: v => v.mean,
  },
];

function genMatch(syl, rnd, themeIdx) {
  const theme = MATCH_THEMES[themeIdx % MATCH_THEMES.length];
  const pool = theme.pick().filter(v => (v.minLevel || 1) <= syl.level);
  if (pool.length < 4) return null;
  const size = Math.min(pool.length, syl.level > 25 ? 6 : 5);
  const chosen = pickN(pool, size, rnd);
  const instr = theme.name === 'tanya-jawab'
    ? 'Jodohkan pertanyaan dengan jawaban yang sesuai.'
    : theme.name === 'fungsi'
      ? 'Jodohkan ungkapan dengan fungsinya yang benar.'
      : theme.name === 'persen'
        ? 'Jodohkan kata keterangan dengan tingkatannya.'
        : 'Jodohkan kosakata Bahasa Jepang dengan artinya yang benar.';
  return {
    id: nextId(), type: 'match',
    instruction: instr,
    pairs: chosen.map(v => ({ jp: theme.left(v), id: theme.right(v), vocabId: v.id })),
    vocab: chosen.map(v => v.voc || v.id).flat().filter(id => VALID_VOCAB.has(id)),
  };
}

/* --- 5) SHORT CONVERSATION ---------------------------------------------------
 * Template dialog 2-4 baris. family = tipe dialog (dipakai utk anti-repetisi
 * dalam satu level). build() dipanggil saat soal dibuat.                    */
function A(t, id) { return { speaker: 'A', text: t, id }; }
function B(t, id) { return { speaker: 'B', text: t, id }; }
const CONV_INSTR = 'Bacalah percakapan pendek berikut lalu jawab pertanyaannya.';

const D_TAKUSAN = '`ええ、${o.jp}は たくさん あります。`';
const D_ARIMASU = '`はい、${o.jp}が あります。`';
function convTemplates(rnd) {
  const list = [];
  const add = (family, build, minLevel) => list.push({ family, build, minLevel: minLevel || 1 });

  /* C1: bertanya hobi (suki) — 2 baris */
  for (const name of NAMES) {
    for (const oid of ['n_ongaku', 'n_uta', 'n_jyazu', 'n_kurashikku', 'n_karaoke', 'n_ryokou', 'n_ryouri']) {
      const o = NM[oid];
      add('suki_qa', () => {
        const yes = rnd() < 0.5;
        const ansLine = yes
          ? `はい、とても ${o.jp}が 好きです。`
          : `いいえ、あまり ${o.jp}が 好きではありません。`;
        const ansId = yes ? `Ya, sangat suka ${o.mean}.` : `Tidak, tidak begitu suka ${o.mean}.`;
        return {
          dialogue: [A(`${name.jp}、${o.jp}は 好きですか。`, `${name.mean}, apakah suka ${o.mean}?`), B('＿＿＿', ansId)],
          question: `Pilih jawaban B yang tepat (${o.mean}${yes ? ' sangat disukai' : ' tidak begitu disukai'}):`,
          options: shuffle(uniq([
            ansLine,
            `はい、とても ${o.jp}が 上手です。`,
            `いいえ、${o.jp}が 分かります。`,
            `はい、${o.jp}が あります。`,
          ]), rnd),
          answer: ansLine,
          answerId: ansId,
          vocab: [o.id, 'v_suki'],
        };
      });
    }
  }

  /* C2: kemampuan bahasa (wakaru) — 2 baris */
  for (const name of NAMES) {
    for (const lid of ['n_nihongo', 'n_eigo']) {
      const lang = GM[lid];
      add('wakaru_qa', (syl) => {
        const pol = rnd() < 0.5 ? 'aff' : 'neg';
        const affPool = syl.level >= 21 ? ['totemo', 'yoku', 'daitai', 'sukoshi'] : ['totemo'];
        const adv = pol === 'aff' ? pick(affPool, rnd) : pick(['amari', 'zenzen'], rnd);
        const ansLine = pol === 'aff'
          ? `はい、${ADV_FREQ[adv].s} ${lang.jp}が 分かります。`
          : `いいえ、${ADV_FREQ[adv].s} ${lang.jp}が 分かりません。`;
        const deg = adv === 'yoku' ? 'dengan baik' : adv === 'daitai' ? 'kira-kira' : adv === 'sukoshi' ? 'sedikit' : adv === 'totemo' ? 'sangat' : adv === 'amari' ? 'tidak begitu' : 'sama sekali';
        const ansId = pol === 'aff'
          ? `Ya, ${deg} mengerti ${lang.mean}.`
          : `Tidak, ${deg} mengerti ${lang.mean}.`;
        return {
          dialogue: [A(`${name.jp}、${lang.jp}は 分かりますか。`, `${name.mean}, apakah mengerti ${lang.mean}?`), B('＿＿＿', ansId)],
          question: `Pilih jawaban B yang tepat (${lang.mean} ${deg} dimengerti):`,
          options: shuffle(uniq([
            ansLine,
            `はい、${lang.jp}が 上手です。`,
            `はい、${lang.jp}が 好きです。`,
            `いいえ、${lang.jp}が あります。`,
          ]), rnd),
          answer: ansLine,
          answerId: ansId,
          vocab: [lang.id, 'v_wakarimasu', 'adv_' + adv],
        };
      });
    }
  }

  /* C3: keahlian (jouzu) — 2 baris */
  for (const name of NAMES) {
    for (const oid of ['n_nihongo', 'n_eigo', 'n_uta', 'n_yakyuu', 'n_dansu', 'n_ryouri', 'n_e']) {
      const o = GM[oid] || NM[oid];
      add('jouzu_qa', (syl) => {
        const yes = rnd() < 0.5;
        const dExtra = syl.level >= 21 ? D_TAKUSAN : D_ARIMASU;
        const ansLine = yes
          ? `ええ、${o.jp}は とても 上手です。`
          : `いいえ、${o.jp}は あまり 上手ではありません。`;
        const ansId = yes ? `Ya, sangat pandai ${o.mean}.` : `Tidak, tidak begitu pandai ${o.mean}.`;
        return {
          dialogue: [A(`${name.jp}、${o.jp}が 上手ですか。`, `${name.mean}, apakah pandai ${o.mean}?`), B('＿＿＿', ansId)],
          question: `Pilih jawaban B yang tepat (${o.mean}${yes ? ' dikuasai dengan baik' : ' belum dikuasai'}):`,
          options: shuffle(uniq([
            ansLine,
            `ええ、${o.jp}は とても 好きです。`,
            `いいえ、${o.jp}は ぜんぜん 分かります。`,
            dExtra,
          ]), rnd),
          answer: ansLine,
          answerId: ansId,
          vocab: [o.id, 'v_jouzu'],
        };
      });
    }
  }

  /* C4: alasan 3 baris (どうして + から) */
  const karaForConv = KARA_PAIRS.map((p, i) => ({ p, i })).filter(x =>
    !x.p.aToks.some(t => t.s === 'だめです') && !x.p.aToks.some(t => t.s === 'いかがですか') &&
    !x.p.rToks.some(t => t.s.includes('わたし') || t.s.includes('山田')));
  for (const name of NAMES) {
    for (const { p, i } of karaForConv) {
      add('reason', () => {
        const action = joinS(p.aToks);
        const reasonAsIs = joinS(p.rToks).replace(/、$/, '');
        const rBase = reasonAsIs.replace(/(から|ですから)$/, '');
        const ans = reasonAsIs + '。';
        const ansId = `${capital(p.idnR)}.`;
        return {
          dialogue: [
            A(`${name.jp}は ${action}。`, `${name.mean} ${p.idnA}.`),
            A(`どうして ですか。`, 'Kenapa?'),
            B('＿＿＿', ansId),
          ],
          question: `Pilih alasan B yang sesuai (${p.idnR}):`,
          options: shuffle(uniq([
            ans,
            rBase + 'です。',
            `とても ${rBase}。`,
            `いいえ、${reasonAsIs}。`,
          ]), rnd),
          answer: ans,
          answerId: ansId,
          vocab: p.vocab,
        };
      }, 31);
    }
  }

  /* C5: pinjam barang (貸してください) — 3-4 baris */
  for (const name of pickN(NAMES, 8, rnd)) {
    add('loan', (syl) => {
      const useJisho = rnd() < 0.3;
      const item = useJisho ? 'この 辞書' : 'この 本';
      const itemVocab = useJisho ? 'n_jisho' : 'n_hon';
      const ok = syl.level >= 31 ? (rnd() < 0.5) : true; /* kara tier 4 */
      const d1 = A(`${name.jp}、${item}を 貸してください。`,
        `${name.mean}, tolong pinjamkan ${useJisho ? 'kamus' : 'buku'} ini.`);
      if (ok) {
        const ans = 'いいですよ。';
        const ansId = 'Boleh.';
        return {
          dialogue: [d1, B('＿＿＿', ansId), A('ありがとう ございます。', 'Terima kasih.')],
          question: 'Pilih jawaban B yang sopan (memberi barang yang dipinjam):',
          options: shuffle(uniq([ans, 'いいえ、ありません。', '残念ですが、だめです。', 'どうして ですか。']), rnd),
          answer: ans,
          answerId: ansId,
          vocab: ['e_kashitekudasai', 'e_iidesuyo', itemVocab],
        };
      }
      const ans = '残念ですが、細かい お金が ありません から、だめ です。';
      const ansId = 'Sayang sekali, karena tidak ada uang receh, tidak bisa.';
      return {
        dialogue: [
          d1,
          B('＿＿＿', ansId),
          A('ああ。', 'Ah, begitu.'),
          A('また 今度 お願いします。', 'Lain kali ya, tolong.'),
        ],
        question: 'Pilih jawaban B yang sopan (menolak meminjamkan dengan alasan):',
        options: shuffle(uniq([ans, 'いいですよ。', '残念ですが、約束が あります。', 'どうして ですか。']), rnd),
        answer: ans,
        answerId: ansId,
        vocab: ['e_kashitekudasai', 'e_zannendesuga', 'n_komakaiokane', 'e_aa', 'e_matakondonegai', itemVocab],
      };
    });
  }

  /* C6: mengajak (一緒に いかがですか) — 2 baris */
  for (const name of pickN(NAMES, 8, rnd)) {
    add('invite', (syl) => {
      const event = pick(['コンサート', 'カラオケ', '旅行'], rnd);
      const ok = syl.level >= 31 ? (rnd() < 0.5) : true; /* kara tier 4 */
      const ans = ok
        ? 'いいですね。ありがとう ございます。'
        : '残念ですが、明日 約束が あります から、だめ です。';
      const ansId = ok
        ? 'Wah, bagus. Terima kasih.'
        : 'Sayang sekali, karena besok ada janji, tidak bisa.';
      return {
        dialogue: [
          A(`${name.jp}、明日 ${event}に 行きます。一緒に いかがですか。`,
            `${name.mean}, besok pergi ke ${event}. Bagaimana kalau bersama-sama?`),
          B('＿＿＿', ansId),
        ],
        question: 'Pilih jawaban B yang tepat:',
        options: shuffle(uniq([
          ans,
          ok ? (syl.level >= 31 ? 'いいえ、明日 約束が あります から、だめ です。' : 'いいえ、だめです。') : 'いいですね。ありがとう ございます。',
          'ええ、とても 好きです。',
          'はい、明日 あります。',
        ]), rnd),
        answer: ans,
        answerId: ansId,
        vocab: ['e_issyoniikaga', ok ? 'e_aa' : 'e_zannendesuga', 'n_yakusoku'],
      };
    });
  }

  /* C7: どんな ～ が 好きですか (pemahaman) — 2 baris */
  for (const name of pickN(NAMES, 6, rnd)) {
    add('donna', () => {
      const xid = pick(['n_jyazu', 'n_kurashikku', 'n_ongaku', 'n_karaoke'], rnd);
      const x = NM[xid];
      const otherPool = ['n_jyazu', 'n_kurashikku', 'n_ongaku', 'n_karaoke'].filter(t => t !== xid);
      const y = NM[pick(otherPool, rnd)];
      const ans = `${x.jp}が 好きです。`;
      const ansId = `Suka ${x.mean}.`;
      return {
        dialogue: [A(`${name.jp}、どんな 音楽が 好きですか。`, `${name.mean}, musik seperti apa yang disukai?`), B('＿＿＿', ansId)],
        question: `Pilih jawaban B yang sesuai (${x.mean} yang disukai):`,
        options: shuffle(uniq([
          ans,
          `${y.jp}が 好きです。`,
          `${x.jp}が 上手です。`,
          `${x.jp}が あります。`,
        ]), rnd),
        answer: ans,
        answerId: ansId,
        vocab: [x.id, y.id, 'v_suki'],
      };
    });
  }

  /* C8: soshite — dua hobi — 2 baris */
  for (const name of pickN(NAMES, 6, rnd)) {
    add('soshite', () => {
      const xid = pick(['n_ongaku', 'n_uta', 'n_karaoke'], rnd);
      const yid = pick(['n_ryouri', 'n_ryokou', 'n_konsaato', 'n_kabuki'], rnd);
      const x = NM[xid], y = NM[yid];
      const ans = `${x.jp}が 好きです。そして、${y.jp}も 好きです。`;
      const ansId = `Suka ${x.mean}. Dan juga suka ${y.mean}.`;
      return {
        dialogue: [A(`${name.jp}、好きな 音楽 と 趣味 は 何ですか。`, `${name.mean}, musik dan hobi yang disukai apa?`), B('＿＿＿', ansId)],
        question: `Pilih jawaban B yang benar (suka ${x.mean} dan juga ${y.mean}):`,
        options: shuffle(uniq([
          ans,
          `${x.jp}が 上手です。そして、${y.jp}も 上手です。`,
          `${x.jp}が あります。そして、${y.jp}も あります。`,
          `${x.jp}が 分かります。そして、${y.jp}も 分かります。`,
        ]), rnd),
        answer: ans,
        answerId: ansId,
        vocab: [x.id, y.id, 'v_suki'],
      };
    }, 21);
  }

  /* C9: perbandingan dua orang — 4 baris */
  const namePairs = pickN(NAMES, 4, rnd);
  for (let k = 0; k < 2; k++) {
    const [n1, n2] = [namePairs[k * 2], namePairs[k * 2 + 1]];
    add('compare', () => {
      const xid = pick(['n_jyazu', 'n_kurashikku'], rnd);
      const yid = xid === 'n_jyazu' ? 'n_kurashikku' : 'n_jyazu';
      const x = NM[xid], y = NM[yid];
      const ans = `${y.jp}が 好きです。`;
      return {
        dialogue: [
          A(`${n1.jp}、${x.jp}が 好きですか。`, `${n1.mean}, apakah suka ${x.mean}?`),
          B(`いいえ、${y.jp}が 好きです。`, `Tidak, suka ${y.mean}.`),
          A(`${n2.jp}、${y.jp}が 好きですか。`, `${n2.mean}, apakah suka ${y.mean}?`),
          B(`はい、とても ${y.jp}が 好きです。`, `Ya, sangat suka ${y.mean}.`),
        ],
        question: `Apa yang disukai oleh ${n2.mean}?`,
        options: shuffle(uniq([
          ans,
          `${x.jp}が 好きです。`,
          `${y.jp}が 上手です。`,
          `${x.jp}が あります。`,
        ]), rnd),
        answer: ans,
        vocab: [x.id, y.id, 'v_suki'],
      };
    });
  }

  /* C10: kepemilikan (aru) — 2 baris */
  for (const name of pickN(NAMES, 6, rnd)) {
    for (const oid of ['n_chiketto', 'n_yakusoku', 'n_youji']) {
      const o = NM[oid];
      add('aru_qa', () => {
        const yes = rnd() < 0.5;
        const ansLine = yes ? `はい、${o.jp}が あります。` : `いいえ、${o.jp}が ありません。`;
        const ansId = yes ? `Ya, ada ${o.mean}.` : `Tidak, tidak ada ${o.mean}.`;
        return {
          dialogue: [A(`${name.jp}、明日 ${o.jp}が あります か。`, `${name.mean}, besok ada ${o.mean}?`), B('＿＿＿', ansId)],
          question: `Pilih jawaban B yang tepat (besok ${yes ? 'ada' : 'tidak ada'} ${o.mean}):`,
          options: shuffle(uniq([
            ansLine,
            yes ? `いいえ、${o.jp}が ありません。` : `はい、${o.jp}が あります。`,
            `はい、${o.jp}が 分かります。`,
            `ええ、${o.jp}が 上手です。`,
          ]), rnd),
          answer: ansLine,
          answerId: ansId,
          vocab: [o.id, 'v_arimasu'],
        };
      });
    }
  }

  /* C11: ～ですから (alasan dengan kalimat sifat) — 2 baris */
  for (const name of pickN(NAMES, 5, rnd)) {
    add('desukara', () => {
      const ans = '日本の 音楽が 好きです から。';
      const ansId = 'Karena suka musik Jepang.';
      return {
        dialogue: [A(`${name.jp}、どうして 日本語が 上手ですか。`, `${name.mean}, kenapa pandai bahasa Jepang?`), B('＿＿＿', ansId)],
        question: 'Pilih alasan B yang sesuai (suka musik Jepang):',
        options: shuffle(uniq([
          ans,
          '日本の 音楽が 好きです。',
          'よく 音楽が 好きです。',
          '日本の 音楽が あります。',
        ]), rnd),
        answer: ans,
        answerId: ansId,
        vocab: ['n_ongaku', 'v_jouzu', 'v_suki', 'n_nihongo'],
      };
    }, 31);
  }

  /* C12: heta vs jouzu — 2 baris */
  for (const name of pickN(NAMES, 5, rnd)) {
    add('heta_jouzu', () => {
      const o = pick([NM['n_dansu'], NM['n_yakyuu']], rnd);
      const ans = `いいえ、わたしは ${o.jp}が 上手です。`;
      const ansId = `Tidak, saya pandai ${o.mean}.`;
      return {
        dialogue: [A(`${name.jp}、${o.jp}が 下手ですね。`, `${name.mean}, kurang pandai ${o.mean} ya.`), B('＿＿＿', ansId)],
        question: `Pilih jawaban B yang tepat (${name.mean} menjawab bahwa ia pandai):`,
        options: shuffle(uniq([
          ans,
          `はい、わたしは ${o.jp}が 下手です。`,
          `ええ、${o.jp}が 好きです。`,
          `いいえ、${o.jp}が 分かります。`,
        ]), rnd),
        answer: ans,
        answerId: ansId,
        vocab: [o.id, 'v_jouzu', 'v_heta'],
      };
    }, 21);
  }

  /* C13: hayaku — 2 baris */
  add('hayaku', () => {
    const name = pick(NAMES, rnd);
    const ans = 'はい、はやく 来ます。';
    const ansId = 'Ya, akan datang lebih cepat.';
    return {
      dialogue: [A(`${name.jp}、明日 の 約束、はやく 来ます か。`, `${name.mean}, untuk janji besok, datang lebih cepat?`), B('＿＿＿', ansId)],
      question: 'Pilih jawaban B yang tepat (akan datang lebih cepat):',
      options: shuffle(uniq([ans, 'はい、ゆっくり 行きます。', 'いいえ、ぜんぜん 分かります。', 'ええ、とても 好きです。']), rnd),
      answer: ans,
      answerId: ansId,
      vocab: ['adv_hayaku', 'n_yakusoku'],
    };
  });

  /* C14: chotto + pinjam — 2 baris */
  add('chotto_loan', () => {
    const name = pick(NAMES, rnd);
    const ans = 'いいですよ。';
    const ansId = 'Boleh.';
    return {
      dialogue: [A(`${name.jp}、ちょっと 本を 貸してください。`, `${name.mean}, sebentar, tolong pinjamkan buku.`), B('＿＿＿', ansId)],
      question: 'Pilih jawaban B yang sopan (memberi buku):',
      options: shuffle(uniq([ans, 'どうして ですか。', '残念ですが、だめです。', 'はい、分かります。']), rnd),
      answer: ans,
      answerId: ansId,
      vocab: ['adv_chotto', 'e_kashitekudasai', 'e_iidesuyo', 'n_hon'],
    };
  });

  return list;
}

function genShortConversation(syl, rnd, templates, usedFamilies) {
  const eligible = templates.filter(t => (t.minLevel || 1) <= syl.level);
  const fresh = eligible.filter(t => !usedFamilies.has(t.family));
  const pool = fresh.length >= 6 ? fresh : eligible;
  const tpl = pick(pool, rnd);
  const q = tpl.build(syl);
  if (!q || !q.dialogue || !q.options) return null;
  usedFamilies.add(tpl.family);

  /* terjemahan Bahasa Indonesia per baris (untuk panel terjemahan setelah
   * menjawab). Baris tanpa terjemahan dibiarkan kosong → diisi glosarium. */
  const dialogueId = q.dialogue.map(line =>
    (line.id ? `${line.speaker}: ${line.id}` : ''));
  const fullJp = q.dialogue.map(d => d.text.replace('＿＿＿', q.answer)).join(' ');

  return {
    id: nextId(), type: 'short_conversation',
    instruction: CONV_INSTR,
    dialogue: q.dialogue.map(d => ({ speaker: d.speaker, text: d.text })),
    question: q.question,
    options: q.options,
    answer: q.answer,
    answerId: q.answerId || '',
    translation: dialogueId.filter(Boolean).join(' — '),
    dialogueId,
    fullJp,
    vocab: q.vocab,
  };
}

/* --- 6) CHOOSE TRANSLATION (pengecoh = minimal pair) ------------------------- */
function objWord(t) {
  if (!t.objId) return null;
  return GM[t.objId] || NM[t.objId] || null;
}
function makeVariant(sentence, rnd) {
  const t = sentence.tags;
  const toks = sentence.tokens.map(x => ({ ...x }));
  let v = null;
  if (t.pattern === 'suki') {
    const r = rnd();
    if (r < 0.4 && t.topic) {
      const altPool = objsForTopic(t.topic, t.objId);
      if (altPool.length) {
        const alt = pick(altPool, rnd);
        const i = toks.findIndex(x => x.s.endsWith('が'));
        if (i > 0) {
          toks[i] = T(alt.jp + 'が', alt.kana + 'が');
          v = { jp: joinS(toks), idn: sentence.idn.replace(objWord(t).mean, alt.mean) };
        }
      }
    } else if (r < 0.7 && t.pol !== 'neg' && t.pol !== 'kirai') {
      const i = toks.findIndex(x => x.s === '好きです');
      if (i >= 0) { toks[i] = T('嫌いです', 'きらいです'); v = { jp: joinS(toks), idn: sentence.idn.replace('suka', 'benci') }; }
    } else if (t.pol === 'aff' && t.adverb !== 'totemo') {
      const i = toks.findIndex(x => x.s === '好きです');
      if (i >= 0) {
        toks.splice(i, 1, T('あまり', 'あまり'), T('好きではありません', 'すきではありません'));
        v = { jp: joinS(toks), idn: sentence.idn.replace('suka', 'tidak begitu suka') };
      }
    }
  } else if (t.pattern === 'jouzu') {
    const i = toks.findIndex(x => x.s === '上手です' || x.s === '下手です');
    if (i >= 0) {
      toks[i] = T(t.who === 'jouzu' ? '下手です' : '上手です', t.who === 'jouzu' ? 'へたです' : 'じょうずです');
      v = { jp: joinS(toks), idn: sentence.idn.replace(t.who === 'jouzu' ? 'pandai' : 'kurang pandai', t.who === 'jouzu' ? 'kurang pandai' : 'pandai') };
    }
  } else if (t.pattern === 'wakaru') {
    const r = rnd();
    if (r < 0.5) {
      const i = toks.findIndex(x => x.s === '分かります' || x.s === '分かりません');
      if (i >= 0) {
        toks[i] = T(t.pol === 'aff' ? '分かりません' : '分かります', t.pol === 'aff' ? 'わかりません' : 'わかります');
        v = { jp: joinS(toks), idn: sentence.idn.replace(t.pol === 'aff' ? '' : 'tidak ', '') };
      }
    } else {
      const writingIds = ['n_ji', 'n_kanji', 'n_hiragana', 'n_katakana', 'n_roomaji'];
      const altPool = writingIds.includes(t.objId)
        ? writingIds.filter(x => x !== t.objId)
        : ['n_nihongo', 'n_eigo'].filter(x => x !== t.objId);
      const altId = pick(altPool, rnd);
      const o = GM[altId] || NM[altId];
      const i = toks.findIndex(x => x.s.endsWith('が'));
      if (i > 0 && objWord(t)) {
        toks[i] = T(o.jp + 'が', o.kana + 'が');
        v = { jp: joinS(toks), idn: sentence.idn.replace(objWord(t).mean, o.mean) };
      }
    }
  } else if (t.pattern === 'aru') {
    const r = rnd();
    if (r < 0.5) {
      const i = toks.findIndex(x => x.s === 'あります' || x.s === 'ありません');
      if (i >= 0) {
        toks[i] = T(t.pol === 'aff' ? 'ありません' : 'あります', 'ありません');
        v = { jp: joinS(toks), idn: sentence.idn.replace(t.pol === 'aff' ? 'punya' : 'tidak', t.pol === 'aff' ? 'tidak' : 'punya') };
      }
    } else {
      const daily = ['n_chiketto', 'n_yakusoku', 'n_youji', 'n_jikan'].filter(x => x !== t.objId);
      const o = NM[pick(daily.length ? daily : ['n_chiketto'], rnd)];
      const i = toks.findIndex(x => x.s.endsWith('が'));
      if (i > 0 && objWord(t)) {
        toks[i] = T(o.jp + 'が', o.kana + 'が');
        v = { jp: joinS(toks), idn: sentence.idn.replace(objWord(t).mean, o.mean) };
      }
    }
  } else if (t.pattern === 'kara') {
    const others = KARA_PAIRS.filter((p, i) => i !== t.pairIdx);
    const other = pick(others, rnd);
    v = { jp: joinS([...KARA_PAIRS[t.pairIdx].rToks, ...other.aToks]), idn: `${capital(KARA_PAIRS[t.pairIdx].idnR)}, ${other.idnA}.` };
  }
  return v;
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

/* --- 7) LISTENING -------------------------------------------------------------
 * Mode 'sentence': audio = kalimat utuh.
 * Mode 'qa'      : audio = pertanyaan + jawaban (percakapan pendek),
 *                   siswa menyusun kalimat jawaban yang didengar.          */
function genListening(sentence, syl, rnd) {
  const tokens = tileTokens(sentence);
  if (tokens.length < 3) return null;
  const t = sentence.tags;
  const canQA = syl.level > 15 &&
    (t.pattern === 'suki' || t.pattern === 'wakaru') &&
    !['わたし', '先生', '友達'].includes(t.subjId) &&
    t.pol !== 'kirai' &&
    rnd() < 0.3;
  if (canQA) {
    const objTok = sentence.tokens.find(x => x.s.endsWith('が'));
    if (objTok) {
      const qLine = t.pattern === 'suki'
        ? `${t.subjId}、${objTok.s.replace('が', '')}は 好きですか。`
        : `${t.subjId}、${objTok.s.replace('が', '')}は 分かりますか。`;
      const extraCount = syl.level > 30 ? 3 : 2;
      const extras = pickN(uniq(distractorTokensFor(sentence, rnd, 6).filter(x => !tokens.includes(x))), extraCount, rnd);
      return {
        id: nextId(), type: 'listening',
        instruction: 'Dengarkan pertanyaan dan jawabannya, lalu susun jawaban yang kamu dengar.',
        audioText: qLine + ' ' + sentence.jp,
        reading: sentence.reading,
        romaji: sentence.romaji,
        tiles: shuffle([...tokens, ...extras], rnd),
        answer: tokens,
        translation: sentence.idn,
        vocab: sentence.vocab,
        _sentJp: sentence.jp,
      };
    }
  }
  const isKara = t.pattern === 'kara';
  const extraCount = syl.level > 30 ? 3 : syl.level > 10 ? 2 : 1;
  const extras = pickN(uniq(distractorTokensFor(sentence, rnd, 6).filter(x => !tokens.includes(x))), extraCount, rnd);
  return {
    id: nextId(), type: 'listening',
    instruction: isKara
      ? 'Dengarkan audio, lalu susun kalimat sebab-akibat yang kamu dengar.'
      : 'Dengarkan audio, lalu susun kalimat yang kamu dengar.',
    audioText: sentence.jp,
    reading: sentence.reading,
    romaji: sentence.romaji,
    tiles: shuffle([...tokens, ...extras], rnd),
    answer: tokens,
    translation: sentence.idn,
    vocab: sentence.vocab,
    _sentJp: sentence.jp,
  };
}

/* ==========================================================================
 * BAGIAN 8 — URUTAN TIPE SOAL (ACAK, ANTI 3x BERTURUT)
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
    if (n >= 2 && seq[n - 1] === t && seq[n - 2] === t) continue;
    seq.push(t);
    used[t] = (used[t] || 0) + 1;
  }
  return seq;
}

/* ==========================================================================
 * BAGIAN 9 — PEMBANGUN 50 LEVEL × 20 SOAL
 * ========================================================================*/
const TOTAL_LEVELS = 50;
const QUESTIONS_PER_LEVEL = 20;
const LEVELS = [];
const THEME_CYCLE = ['musik', 'olahraga', 'tulisan', 'sehari-hari', 'orang', 'pola', 'persen', 'fungsi', 'tanya-jawab'];
const matchCursor = { i: 0 };
const globalSigs = new Set();
const globalTypeSent = new Set();
let sigFallbacks = 0;

const convRng = mulberry32(990919);
const CONV_TEMPLATES = convTemplates(convRng);

for (let level = 1; level <= TOTAL_LEVELS; level++) {
  const rnd = mulberry32(level * 977 + 20260919);
  const syl = getSyllabus(level);
  const pool = sentencePoolFor(syl);

  const questions = [];
  const usedSentences = new Set();
  const usedFamilies = new Set();

  function takeSentence(filterFn) {
    for (let attempt = 0; attempt < 150; attempt++) {
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

  while (questions.length < QUESTIONS_PER_LEVEL && guard < 900) {
    guard++;
    const type = typeSeq[i % typeSeq.length];
    i++;
    let q = null;
    const sentBased = ['arrange', 'translate', 'complete', 'choose_translation', 'listening'].includes(type);
    const baseFilter = sentBased
      ? s => s.tokens.length >= 3 && !globalTypeSent.has(type + '|' + s.jp)
      : null;

    // Kuota terarah per pola khusus agar terwakili di semua tipe kalimat:
    //   kara (T4/5, 20%), soshite (T3+, 12%), donna (T2+, 10%)
    const pickKara = syl.level >= 31 &&
      ['arrange', 'translate', 'listening', 'choose_translation'].includes(type) && rnd() < 0.2;
    const pickSoshite = !pickKara && syl.level >= 21 &&
      ['arrange', 'translate', 'listening'].includes(type) && rnd() < 0.12;
    const pickDonna = !pickKara && !pickSoshite && syl.level >= 11 &&
      ['arrange', 'translate', 'listening', 'complete'].includes(type) && rnd() < 0.10;
    const patFilter = (pat, minTok) => s => s.tags.pattern === pat &&
      (!minTok || s.tokens.length >= minTok) && !globalTypeSent.has(type + '|' + s.jp);
    const prefFilter = pickKara ? patFilter('kara', 3)
      : pickSoshite ? patFilter('soshite', 3)
      : pickDonna ? (type === 'complete' ? (s => s.tags.pattern === 'donna' && s.slots.length > 0 && !globalTypeSent.has(type + '|' + s.jp)) : patFilter('donna', 3))
      : null;

    if (type === 'arrange') {
      q = genArrange(takeSentence(prefFilter || (s => s.tokens.length >= 3 && !globalTypeSent.has(type + '|' + s.jp))), syl, rnd);
    } else if (type === 'translate') {
      q = genTranslate(takeSentence(prefFilter || (s => s.tokens.length >= 3 && s.tags.pattern !== 'kara' && !globalTypeSent.has(type + '|' + s.jp))), syl, rnd);
    } else if (type === 'complete') {
      const s = (syl.level >= 31 && rnd() < 0.25)
        ? takeSentence(patFilter('kara', 0))
        : takeSentence(prefFilter || (s => s.slots.length > 0 && !globalTypeSent.has(type + '|' + s.jp)));
      if (s.tags.pattern === 'kara' && syl.level >= 31) q = genCompleteKara(s, syl, rnd);
      else q = genComplete(s, syl, rnd);
    } else if (type === 'match') {
      q = genMatch(syl, rnd, matchCursor.i++);
    } else if (type === 'short_conversation') {
      q = genShortConversation(syl, rnd, CONV_TEMPLATES, usedFamilies);
    } else if (type === 'choose_translation') {
      q = genChooseTranslation(takeSentence(prefFilter || (s => s.tokens.length >= 3 && !globalTypeSent.has(type + '|' + s.jp))), syl, rnd);
    } else if (type === 'listening') {
      q = genListening(takeSentence(prefFilter || (s => s.tokens.length >= 3 && !globalTypeSent.has(type + '|' + s.jp))), syl, rnd);
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
const problems = [];

for (const lvl of LEVELS) {
  totalQ += lvl.questions.length;
  for (const q of lvl.questions) {
    typeCount[q.type] = (typeCount[q.type] || 0) + 1;
    if (ALL_IDS.has(q.id)) problems.push(`duplicate id: ${q.id}`);
    ALL_IDS.add(q.id);
    if (q.vocab) q.vocab.forEach(v => allVocabRefs.add(v));

    if (q.type === 'arrange' || q.type === 'translate') {
      const tset = new Set(q.tiles);
      for (const tok of q.answer) if (!tset.has(tok)) problems.push(`${q.id}: token jawaban tidak ada di tiles: ${tok}`);
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
    if (q.type === 'short_conversation' && q.dialogue) {
      const blanks = q.dialogue.filter(d => d.text.includes('＿＿＿')).length;
      if (blanks > 1) problems.push(`${q.id}: dialog punya lebih dari 1 blank (${blanks})`);
      if (q.dialogue.length < 2) problems.push(`${q.id}: dialog kurang dari 2 baris`);
    }
  }
}

const ghost = Array.from(allVocabRefs).filter(v => !VALID_VOCAB.has(v));
if (ghost.length) problems.push('id kosakata tidak dikenal: ' + ghost.join(', '));

const unused = VOCAB_BAB9.filter(v => !allVocabRefs.has(v.id));

console.log('---------------------------------------------');
console.log('Total level        :', LEVELS.length);
console.log('Total soal         :', totalQ, '(target', TOTAL_LEVELS * QUESTIONS_PER_LEVEL + ')');
console.log('Sebaran tipe soal  :', JSON.stringify(typeCount));
console.log('Soal yang terpaksa mengulang signature global:', sigFallbacks);
if (unused.length) {
  console.log('PERINGATAN kosakata Bab 9 belum terreferensi:', unused.map(m => m.jp).join(', '));
} else {
  console.log('OK: semua', VOCAB_BAB9.length, 'kosakata Bab 9 terreferensi di field vocab.');
}
const incomplete = LEVELS.filter(l => l.questions.length !== QUESTIONS_PER_LEVEL);
if (incomplete.length) problems.push('level tidak lengkap: ' + incomplete.map(l => l.level).join(', '));
if (problems.length) {
  console.log('MASALAH VALIDASI (' + problems.length + '):');
  problems.slice(0, 40).forEach(p => console.log(' -', p));
  process.exitCode = 1;
} else {
  console.log('OK: validasi lolos (id unik, tiles lengkap, answer di options, vocab id valid).');
}

/* ==========================================================================
 * BAGIAN 11 — TULIS OUTPUT
 * ========================================================================*/
const outDir = path.join(__dirname, '..', 'js', 'data');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(
  path.join(outDir, 'vocab_bab9.js'),
  `// Auto-generated. Jangan diedit manual — edit tools/generate_bab9.js lalu jalankan ulang.\nwindow.VOCAB_BAB9_DATA = ${JSON.stringify(VOCAB_BAB9, null, 2)};\n`
);
fs.writeFileSync(
  path.join(outDir, 'levels_bab9.js'),
  `// Auto-generated. Jangan diedit manual — edit tools/generate_bab9.js lalu jalankan ulang.\nwindow.LEVELS_BAB9_DATA = ${JSON.stringify(LEVELS)};\n`
);
console.log('Selesai! Output: js/data/vocab_bab9.js & js/data/levels_bab9.js');
