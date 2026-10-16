/* ============================================================================
 * tools/generate_bab11.js  —  GENERATOR SOAL BAB 11 (COMPREHENSIBLE INPUT)
 * ----------------------------------------------------------------------------
 * Minna no Nihongo I — Bab 11:
 *   Counter (～つ・～人・～台・～枚・～回・～個・～本・～番・～分・～日・
 *   ～時間・～週間・～か月・～年) · いくつ / 何人 · ～と (daftar pesanan) ·
 *   全部で · ～ぐらい · どのぐらい · ～だけ · かかります · 休みます ·
 *   keluarga (両親・兄弟・姉妹・兄・お兄さん・姉・お姉さん・弟・弟さん・妹・妹さん) ·
 *   kantor pos (切手・はがき・封筒・速達・書留・航空便/エアメール・船便)
 *
 * Sumber tata bahasa (bunpou):
 *   https://cilacapklik.com/2023/11/belajar-bahasa-jepang-minna-no-nihongo-1-bab-11.html
 *   (A. 文型, B. 例文, C. 会話 — sudah diekstrak; lihat BUNPOU_BAB11 di bawah)
 * Sumber kosakata (Kotoba):
 *   "KOSA KATA PELAJARAN 11" (pdf-kosa-kata-bab-11_compress.pdf, lampiran tugas) +
 *   daftar wajib tugas (termasuk 速達, 書留, 姉妹 yang tidak ada di PDF).
 *
 * ---------------------------------------------------------------------------
 * DAFTAR PION TATA BAHASA (BUNPOU) BAB 11 — diekstrak dari halaman sumber
 * (konstanta BUNPOU_BAB11 di bawah adalah sumber kebenaran untuk audit):
 *   1. Menghitung kuantitas benda dengan ～つ (ひとつ … とお)      [文型 1]
 *   2. Kata satuan / counter:                                    [文型 2]
 *        ～人 (orang; ひとり・ふたり), ～台 (mesin/kendaraan),
 *        ～枚 (benda tipis), ～回 (frekuensi), ～個 (buah/butir),
 *        ～本 (batang), ～番 (nomor urut), ～分 (menit), ～日 (hari),
 *        ～時間 (jam), ～週間 (minggu), ～か月 (bulan), ～年 (tahun)
 *   3. Kalimat ber-counter + あります / います
 *      (「外国人が 二人 います」「テーブルが 七つ あります」)   [文型 1-2]
 *   4. いくつ — menanyakan jumlah benda                         [例文 ①]
 *   5. 何人 — menanyakan jumlah orang                           [例文 ③④]
 *   6. Daftar pesanan: N を ～枚 と N を ～枚 ください          [例文 ②]
 *   7. 全部で — menyebut total                                  [例文 ②]
 *   8. ～ぐらい — kira-kira                                     [例文 ⑤⑦]
 *   9. 何回 … ～ぐらい しますか — frekuensi + kira-kira         [例文 ⑤]
 *  10. どのぐらい — menanyakan lamanya                          [例文 ⑥⑦]
 *  11. ～だけ — hanya                                           [例文 ⑥]
 *  12. ～時間 / ～週間 / ～か月 / ～年 sebagai lama waktu        [例文 ⑥]
 *  13. から ～まで ～で どのぐらい かかりますか                 [例文 ⑦]
 *  14. Keluarga + jumlah: 「兄弟は 何人ですか」「姉が 二人います」[例文 ④]
 *
 * Skema soal (7 tipe) SAMA PERSIS dengan js/questions.js:
 *   arrange, translate, complete, match, short_conversation,
 *   choose_translation, listening
 *
 * Struktur: 30 level x 15 soal = 450 soal (id q_b11_1 … q_b11_450).
 * Tier: 1-10 mudah, 11-20 sedang, 21-25 kalimat, 26-30 campuran.
 *
 * Prinsip Comprehensible Input (i+1):
 *   - Setiap kalimat soal mengandung maksimal SATU kata baru (kosakata Bab 11
 *     yang pertama kali diperkenalkan). Ekspresi bilangan + counter diperlakukan
 *     sebagai satu unit pola (grammar) yang diajarkan soal tersebut.
 *   - Kata baru dapat ditebak dari konteks / opsi / terjemahan yang tersedia.
 *   - Tidak ada dua soal dengan kalimat Jepang yang sama; pasangan kalimat yang
 *     hanya berbeda satu token ditolak sejak bank kalimat dibangun
 *     (near-duplicate registry, lihat mkSent()).
 *
 * Output:
 *   js/data/vocab_bab11.js  -> window.VOCAB_BAB11_DATA
 *   js/data/levels_bab11.js -> window.LEVELS_BAB11_DATA
 *
 * Jalankan:  node tools/generate_bab11.js
 * Audit   :  node tools/audit_bab11.js
 * ==========================================================================*/

const fs = require('fs');
const path = require('path');

/* ==========================================================================
 * DAFTAR BUNPOU (konstanta; dipakai untuk cakupan & laporan)
 * ========================================================================*/
const BUNPOU_BAB11 = [
  { key: 'bp_tsu',       name: 'Menghitung benda dengan ～つ (ひとつ … とお)',        example: '会議室に テーブルが 七つ あります' },
  { key: 'bp_nin',       name: 'Counter orang ～人 (ひとり・ふたり・～にん)',         example: '教室に 学生が 五人 います' },
  { key: 'bp_dai',       name: 'Counter mesin/kendaraan ～台',                        example: '部屋に テレビが 二台 あります' },
  { key: 'bp_mai',       name: 'Counter benda tipis ～枚',                            example: '机の 上に 切手が 五枚 あります' },
  { key: 'bp_kai',       name: 'Counter frekuensi ～回',                              example: '一週間に テニスを 二回 ぐらい します' },
  { key: 'bp_counter2',  name: 'Counter lanjutan ～個 / ～本 / ～番 / ～分 / ～日',   example: '駅まで 二十分 ぐらい かかります' },
  { key: 'bp_durasi',    name: 'Counter durasi ～時間 / ～週間 / ～か月 / ～年',      example: '日本に 二年 います' },
  { key: 'bp_ikutsu',    name: 'いくつ — menanyakan jumlah benda',                    example: 'りんごは いくつ ありますか' },
  { key: 'bp_nannin',    name: '何人 — menanyakan jumlah orang',                      example: '兄弟は 何人ですか' },
  { key: 'bp_kudasai',   name: 'N を ～枚 と N を ～枚 ください (daftar pesanan)',    example: '切手を 五枚 と はがきを 二枚 ください' },
  { key: 'bp_zenbude',   name: '全部で — menyebut total keseluruhan',                 example: '全部で 五百円 です' },
  { key: 'bp_gurai',     name: '～ぐらい — kira-kira',                                example: '二か月 ぐらい かかります' },
  { key: 'bp_kai_gurai', name: '何回 … ～ぐらい — frekuensi + kira-kira',             example: '一週間に 何回 ぐらい しますか' },
  { key: 'bp_donogurai', name: 'どのぐらい — menanyakan lama/waktu',                  example: 'どのぐらい かかりますか' },
  { key: 'bp_dake',      name: '～だけ — hanya',                                      example: '三日 だけ やすみます' },
  { key: 'bp_kakarimasu',name: 'から ～まで … かかります (waktu yang diperlukan)',    example: 'うちから 学校まで 一時間 かかります' },
  { key: 'bp_keluarga',  name: 'Keluarga + jumlah: ～が ～人 います',                 example: '姉が 二人 と 弟が 一人 います' },
];

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
function joinS(toks) { return toks.map(t => t.s).join(' '); }
function joinR(toks) { return toks.map(t => t.r).join(' '); }
function joinM(toks) { return toks.map(t => t.m).join(' ').replace(/\s+/g, ' ').trim(); }

/* --- konverter kana -> romaji (hiragana + katakana + youon + sokuon + chōon) --- */
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
 * BAGIAN 2 — KOSAKATA
 *   (a) Kosakata baru Bab 11 (`lesson: 11`) — sumber: Kotoba "Kosa Kata
 *       Pelajaran 11" (PDF lampiran) + daftar wajib tugas (速達, 書留, 姉妹)
 *       + daftar counter halaman sumber bunpou.
 *   (b) Kosakata ulang Bab 1–10 (`lesson: 1..10`) — disalin dari bank tervalidasi
 *       tools/generate_bab10.js (sudah diverifikasi ada di Kotoba Bab 1–10)
 *       + tambahan kecil yang pasti Kotoba Bab 1–10 (テニス Bab 6, 電車 Bab 2,
 *       angka & ～円 Bab 4).
 * ========================================================================*/

/* ---- (a) Bab 11 ---- */
const V_VERBS11 = [
  { id: 'v_kakarimasu', jp: 'かかります', kana: 'かかります', mean: 'memakan / perlu (waktu & uang)', lesson: 11 },
  { id: 'v_yasumimasu', jp: '休みます',   kana: 'やすみます', mean: 'libur / istirahat', lesson: 11 },
];
/* Counter (bentuk akar; permukaan tanpa ～ untuk dekomposisi teks) */
const V_COUNTERS = [
  { id: 'c_tsu',      jp: '～つ',     kana: '～つ',     mean: 'satuan benda (buah)', lesson: 11 },
  { id: 'c_nin',      jp: '～人',     kana: '～にん',   mean: 'satuan orang', lesson: 11 },
  { id: 'c_dai',      jp: '～台',     kana: '～だい',   mean: 'satuan mesin/kendaraan', lesson: 11 },
  { id: 'c_mai',      jp: '～枚',     kana: '～まい',   mean: 'satuan benda tipis (lembar)', lesson: 11 },
  { id: 'c_kai',      jp: '～回',     kana: '～かい',   mean: 'satuan frekuensi (kali)', lesson: 11 },
  { id: 'c_ko',       jp: '～個',     kana: '～こ',     mean: 'satuan benda kecil (buah/butir)', lesson: 11 },
  { id: 'c_hon',      jp: '～本',     kana: '～ほん',   mean: 'satuan benda panjang (batang)', lesson: 11 },
  { id: 'c_ban',      jp: '～番',     kana: '～ばん',   mean: 'satuan nomor urut', lesson: 11 },
  { id: 'c_fun',      jp: '～分',     kana: '～ふん',   mean: 'satuan menit', lesson: 11 },
  { id: 'c_nichi',    jp: '～日',     kana: '～にち',   mean: 'satuan hari', lesson: 11 },
  { id: 'c_jikan',    jp: '～時間',   kana: '～じかん', mean: 'satuan jam (durasi)', lesson: 11 },
  { id: 'c_shuukan',  jp: '～週間',   kana: '～しゅうかん', mean: 'satuan minggu', lesson: 11 },
  { id: 'c_kagetsu',  jp: '～か月',   kana: '～かげつ', mean: 'satuan bulan', lesson: 11 },
  { id: 'c_nen',      jp: '～年',     kana: '～ねん',   mean: 'satuan tahun', lesson: 11 },
];
/* Bilangan ～つ (Kotoba Bab 11) */
const V_TSU = [
  { id: 'w_hitotsu',   jp: '一つ',   kana: 'ひとつ',   mean: 'satu (buah)', lesson: 11 },
  { id: 'w_futatsu',   jp: '二つ',   kana: 'ふたつ',   mean: 'dua (buah)', lesson: 11 },
  { id: 'w_mittsu',    jp: '三つ',   kana: 'みっつ',   mean: 'tiga (buah)', lesson: 11 },
  { id: 'w_yottsu',    jp: '四つ',   kana: 'よっつ',   mean: 'empat (buah)', lesson: 11 },
  { id: 'w_itsutsu',   jp: '五つ',   kana: 'いつつ',   mean: 'lima (buah)', lesson: 11 },
  { id: 'w_muttsu',    jp: '六つ',   kana: 'むっつ',   mean: 'enam (buah)', lesson: 11 },
  { id: 'w_nanatsu',   jp: '七つ',   kana: 'ななつ',   mean: 'tujuh (buah)', lesson: 11 },
  { id: 'w_yattsu',    jp: '八つ',   kana: 'やっつ',   mean: 'delapan (buah)', lesson: 11 },
  { id: 'w_kokonotsu', jp: '九つ',   kana: 'ここのつ', mean: 'sembilan (buah)', lesson: 11 },
  { id: 'w_tou',       jp: '十',     kana: 'とお',     mean: 'sepuluh (buah)', lesson: 11 },
  { id: 'e_ikutsu',    jp: 'いくつ', kana: 'いくつ',   mean: 'berapa banyak', lesson: 11 },
  { id: 'w_hitori',    jp: '一人',   kana: 'ひとり',   mean: 'seorang / sendirian', lesson: 11 },
  { id: 'w_futari',    jp: '二人',   kana: 'ふたり',   mean: 'dua orang', lesson: 11 },
];
const V_FOOD11 = [
  { id: 'n_ringo',      jp: 'りんご',       kana: 'りんご',       mean: 'apel', lesson: 11 },
  { id: 'n_mikan',      jp: 'みかん',       kana: 'みかん',       mean: 'jeruk', lesson: 11 },
  { id: 'n_sandoicchi', jp: 'サンドイッチ', kana: 'サンドイッチ', mean: 'roti lapis (sandwich)', lesson: 11 },
  { id: 'n_kareeraisu', jp: 'カレーライス', kana: 'カレーライス', mean: 'nasi kari', lesson: 11 },
  { id: 'n_aisukuriimu', jp: 'アイスクリーム', kana: 'アイスクリーム', mean: 'es krim', lesson: 11 },
];
const V_POST11 = [
  { id: 'n_kitte',    jp: '切手',   kana: 'きって',   mean: 'perangko', lesson: 11 },
  { id: 'n_hagaki',   jp: 'はがき', kana: 'はがき',   mean: 'kartu pos', lesson: 11 },
  { id: 'n_fuutou',   jp: '封筒',   kana: 'ふうとう', mean: 'amplop', lesson: 11 },
  { id: 'n_sokutatsu', jp: '速達',  kana: 'そくたつ', mean: 'pos kilat (surat kilat)', lesson: 11 },
  { id: 'n_kakitome', jp: '書留',   kana: 'かきとめ', mean: 'pos tercatat (surat tercatat)', lesson: 11 },
  { id: 'n_kuukubin', jp: '航空便', kana: 'こうくうびん', mean: 'pos udara (airmail)', lesson: 11 },
  { id: 'n_eameeru',  jp: 'エアメール', kana: 'エアメール', mean: 'pos udara (airmail)', lesson: 11 },
  { id: 'n_funabin',  jp: '船便',   kana: 'ふなびん', mean: 'pos laut', lesson: 11 },
];
const V_FAMILY11 = [
  { id: 'n_ryoushin',   jp: '両親',   kana: 'りょうしん', mean: 'orang tua', lesson: 11 },
  { id: 'n_kyoudai',    jp: '兄弟',   kana: 'きょうだい', mean: 'saudara (kandung)', lesson: 11 },
  { id: 'n_shimai',     jp: '姉妹',   kana: 'しまい',     mean: 'saudara perempuan (kandung)', lesson: 11 },
  { id: 'n_ani',        jp: '兄',     kana: 'あに',       mean: 'kakak laki-laki (sendiri)', lesson: 11 },
  { id: 'n_oniisan',    jp: 'お兄さん', kana: 'おにいさん', mean: 'kakak laki-laki (orang lain)', lesson: 11 },
  { id: 'n_ane',        jp: '姉',     kana: 'あね',       mean: 'kakak perempuan (sendiri)', lesson: 11 },
  { id: 'n_oneesan',    jp: 'お姉さん', kana: 'おねえさん', mean: 'kakak perempuan (orang lain)', lesson: 11 },
  { id: 'n_otouto',     jp: '弟',     kana: 'おとうと',   mean: 'adik laki-laki (sendiri)', lesson: 11 },
  { id: 'n_otoutosan',  jp: '弟さん', kana: 'おとうとさん', mean: 'adik laki-laki (orang lain)', lesson: 11 },
  { id: 'n_imouto',     jp: '妹',     kana: 'いもうと',   mean: 'adik perempuan (sendiri)', lesson: 11 },
  { id: 'n_imoutosan',  jp: '妹さん', kana: 'いもうとさん', mean: 'adik perempuan (orang lain)', lesson: 11 },
];
const V_MISC11 = [];
const V_EXPRS11 = [
  { id: 'e_gurai',      jp: '～ぐらい',     kana: '～ぐらい',     mean: 'kira-kira', lesson: 11 },
  { id: 'e_donogurai',  jp: 'どのぐらい',   kana: 'どのぐらい',   mean: 'berapa lama', lesson: 11 },
  { id: 'e_zenbude',    jp: '全部で',       kana: 'ぜんぶで',     mean: 'semuanya (total)', lesson: 11 },
  { id: 'e_minna',      jp: 'みんな',       kana: 'みんな',       mean: 'semua / semua orang', lesson: 11 },
  { id: 'e_dake',       jp: '～だけ',       kana: '～だけ',       mean: 'hanya', lesson: 11 },
  { id: 'e_kashikomari', jp: 'かしこまりました', kana: 'かしこまりました', mean: 'baik (jawaban sopan)', lesson: 11 },
  { id: 'e_iitenki',    jp: 'いい 天気ですね', kana: 'いい てんきですね', mean: 'cuacanya bagus ya', lesson: 11 },
  { id: 'e_odekake',    jp: 'お出かけですか', kana: 'おでかけですか', mean: 'mau keluar?', lesson: 11 },
  { id: 'e_chottomade', jp: 'ちょっと～まで', kana: 'ちょっと～まで', mean: 'ke … sebentar', lesson: 11 },
  { id: 'e_itterasshai', jp: '行ってらっしゃい', kana: 'いってらっしゃい', mean: 'hati-hati (kepada yang pergi)', lesson: 11 },
  { id: 'e_iktemasu',   jp: '行ってきます', kana: 'いってきます', mean: 'saya pergi dulu', lesson: 11 },
  { id: 'e_onegai',     jp: 'お願いします', kana: 'おねがいします', mean: 'tolong', lesson: 11 },
  { id: 'e_oosutoraria', jp: 'オーストラリア', kana: 'オーストラリア', mean: 'Australia', lesson: 11 },
];

/* ---- (b) Ulangan Bab 1–10 (dari bank tervalidasi generate_bab10.js) ---- */
const V_VERBS = [
  { id: 'v_arimasu', jp: 'あります', kana: 'あります', mean: 'ada (untuk benda mati)', lesson: 10 },
  { id: 'v_imasu',   jp: 'います',   kana: 'います',   mean: 'ada (untuk makhluk hidup)', lesson: 10 },
  { id: 'v_wa_aru',  jp: 'ありません', kana: 'ありません', mean: 'tidak ada (benda mati)', lesson: 10, hidden: true },
  { id: 'v_wa_iru',  jp: 'いません',   kana: 'いません',   mean: 'tidak ada (makhluk hidup)', lesson: 10, hidden: true },
  { id: 'v_kudasai', jp: 'ください', kana: 'ください', mean: 'tolong berikan (～を ください)', lesson: 4 },
  { id: 'v_shimasu', jp: 'します',   kana: 'します',   mean: 'melakukan (～を します)', lesson: 6 },
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
  { id: 'n_tenisu',    jp: 'テニス',   kana: 'テニス',     mean: 'tenis',        lesson: 6 },
  { id: 'n_densha',    jp: '電車',     kana: 'でんしゃ',   mean: 'kereta listrik', lesson: 2 },
];
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
  { id: 'n_nihon',       jp: '日本',     kana: 'にほん',       mean: 'Jepang',       lesson: 1 },
  { id: 'n_yuubinkyoku', jp: '郵便局',   kana: 'ゆうびんきょく', mean: 'kantor pos', lesson: 4 },
  { id: 'n_ginkou',      jp: '銀行',     kana: 'ぎんこう',     mean: 'bank',         lesson: 4 },
  { id: 'n_toshokan',    jp: '図書館',   kana: 'としょかん',   mean: 'perpustakaan', lesson: 4 },
  { id: 'n_depaato',     jp: 'デパート', kana: 'デパート',     mean: 'toserba',      lesson: 4 },
  { id: 'n_eki',         jp: '駅',       kana: 'えき',         mean: 'stasiun',      lesson: 5 },
  { id: 'n_biru',        jp: 'ビル',     kana: 'ビル',         mean: 'gedung',       lesson: 10 },
  { id: 'n_suupaa',      jp: 'スーパー', kana: 'スーパー',     mean: 'supermarket',  lesson: 5 },
  { id: 'n_gakkou',      jp: '学校',     kana: 'がっこう',     mean: 'sekolah',       lesson: 5 },
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
  { id: 'n_gaikoku',     jp: '外国',     kana: 'がいこく',     mean: 'luar negeri',  lesson: 11 },
  { id: 'n_kurasu',      jp: 'クラス',   kana: 'クラス',       mean: 'kelas',        lesson: 11 },
];
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
  { id: 'n_otokonohito',  jp: '男の人',   kana: 'おとこのひと', mean: 'laki-laki',      lesson: 10 },
  { id: 'n_onnanohito',   jp: '女の人',   kana: 'おんなのひと', mean: 'perempuan',      lesson: 10 },
  { id: 'n_otokonoko',    jp: '男の子',   kana: 'おとこのこ',   mean: 'anak laki-laki', lesson: 10 },
  { id: 'n_onnanoko',     jp: '女の子',   kana: 'おんなのこ',   mean: 'anak perempuan', lesson: 10 },
];
const V_PARTICLES = [
  { id: 'p_wa', jp: 'は', kana: 'は', mean: 'partikel topik (～は)', lesson: 1, romaji: 'wa' },
  { id: 'p_ga', jp: 'が', kana: 'が', mean: 'partikel penanda subjek (～が)', lesson: 1, romaji: 'ga' },
  { id: 'p_ni', jp: 'に', kana: 'に', mean: 'partikel tempat (～に)', lesson: 2, romaji: 'ni' },
  { id: 'p_no', jp: 'の', kana: 'の', mean: 'partikel penghubung (～の)', lesson: 2, romaji: 'no' },
  { id: 'p_to', jp: 'と', kana: 'と', mean: 'partikel "dan" (daftar lengkap)', lesson: 5, romaji: 'to' },
  { id: 'p_ya', jp: 'や', kana: 'や', mean: 'partikel "dan" (daftar sebagian)', lesson: 10, romaji: 'ya' },
  { id: 'p_mo', jp: 'も', kana: 'も', mean: 'partikel "juga" (～も)', lesson: 1, romaji: 'mo' },
  { id: 'p_o',  jp: 'を', kana: 'を', mean: 'partikel objek (～を)', lesson: 2, romaji: 'o' },
  { id: 'p_de', jp: 'で', kana: 'で', mean: 'partikel alat/cara (～で)', lesson: 5, romaji: 'de' },
  { id: 'p_kara', jp: 'から', kana: 'から', mean: 'dari (～から)', lesson: 5, romaji: 'kara' },
  { id: 'p_made', jp: 'まで', kana: 'まで', mean: 'sampai (～まで)', lesson: 5, romaji: 'made' },
];
const V_EXPRS = [
  { id: 'e_doko',      jp: 'どこ',   kana: 'どこ',   mean: 'di mana',        lesson: 3 },
  { id: 'e_dare',      jp: 'だれ',   kana: 'だれ',   mean: 'siapa',          lesson: 1 },
  { id: 'e_nani',      jp: '何',     kana: 'なに',   mean: 'apa',            lesson: 2 },
  { id: 'e_dore',      jp: 'どれ',   kana: 'どれ',   mean: 'yang mana',      lesson: 2 },
  { id: 'e_nado',      jp: 'など',   kana: 'など',   mean: 'dan lain-lain',  lesson: 10 },
  { id: 'e_suminasen', jp: 'すみません', kana: 'すみません', mean: 'permisi / maaf', lesson: 2 },
  { id: 'e_arigatou',  jp: 'ありがとう ございます', kana: 'ありがとう ございます', mean: 'terima kasih', lesson: 2 },
  { id: 'e_hai',       jp: 'はい',   kana: 'はい',   mean: 'ya',             lesson: 1 },
  { id: 'e_iie',       jp: 'いいえ', kana: 'いいえ', mean: 'tidak',          lesson: 1 },
  { id: 'e_ee',        jp: 'ええ',   kana: 'ええ',   mean: 'ya (santai)',    lesson: 6 },
  { id: 'e_soudesuka', jp: 'そうですか', kana: 'そうですか', mean: 'begitu ya', lesson: 2 },
  { id: 'e_nannin',    jp: '何人',   kana: 'なんにん', mean: 'berapa orang', lesson: 11 },
];
/* Angka Kanji (Kotoba Bab 4) + ～円 */
const V_NUM = [
  { id: 'num_1', jp: '一', kana: 'いち', mean: 'satu', lesson: 4 },
  { id: 'num_2', jp: '二', kana: 'に',   mean: 'dua', lesson: 4 },
  { id: 'num_3', jp: '三', kana: 'さん', mean: 'tiga', lesson: 4 },
  { id: 'num_4', jp: '四', kana: 'よん', mean: 'empat', lesson: 4 },
  { id: 'num_5', jp: '五', kana: 'ご',   mean: 'lima', lesson: 4 },
  { id: 'num_6', jp: '六', kana: 'ろく', mean: 'enam', lesson: 4 },
  { id: 'num_7', jp: '七', kana: 'なな', mean: 'tujuh', lesson: 4 },
  { id: 'num_8', jp: '八', kana: 'はち', mean: 'delapan', lesson: 4 },
  { id: 'num_9', jp: '九', kana: 'きゅう', mean: 'sembilan', lesson: 4 },
  { id: 'num_10', jp: '十', kana: 'じゅう', mean: 'sepuluh', lesson: 4 },
  { id: 'num_100', jp: '百', kana: 'ひゃく', mean: 'seratus', lesson: 4 },
  { id: 'num_1000', jp: '千', kana: 'せん', mean: 'seribu', lesson: 4 },
  { id: 'num_10000', jp: '万', kana: 'まん', mean: 'sepuluh ribu', lesson: 4 },
  { id: 'c_en', jp: '～円', kana: '～えん', mean: 'satuan mata uang yen', lesson: 4 },
];
const V_NAMES = [
  { id: 'nm_miraa',    jp: 'ミラーさん',   kana: 'ミラーさん',   mean: 'Sdr. Miller',   lesson: 1 },
  { id: 'nm_watto',    jp: 'ワットさん',   kana: 'ワットさん',   mean: 'Sdr. Watt',     lesson: 1 },
  { id: 'nm_yamada',   jp: '山田さん',     kana: 'やまださん',   mean: 'Sdr. Yamada',   lesson: 1 },
  { id: 'nm_matsumoto', jp: '松本さん',    kana: 'まつもとさん', mean: 'Sdr. Matsumoto', lesson: 1 },
  { id: 'nm_santosu',  jp: 'サントスさん', kana: 'サントスさん', mean: 'Sdr. Santos',   lesson: 1 },
  { id: 'nm_karina',   jp: 'カリナさん',   kana: 'カリナさん',   mean: 'Sdr. Karina',   lesson: 1 },
  { id: 'nm_rin',      jp: 'リンさん',     kana: 'リンさん',     mean: 'Sdr. Rin',      lesson: 1 },
  { id: 'nm_kimu',     jp: 'キムさん',     kana: 'キムさん',     mean: 'Sdr. Kim',      lesson: 1 },
  { id: 'nm_tanaka',   jp: '田中さん',     kana: 'たなかさん',   mean: 'Sdr. Tanaka',   lesson: 1 },
  { id: 'nm_minh',     jp: 'ミンさん',     kana: 'ミンさん',     mean: 'Sdr. Minh',     lesson: 1 },
];

const ALL_WORDS = [
  ...V_VERBS11, ...V_COUNTERS, ...V_TSU, ...V_FOOD11, ...V_POST11, ...V_FAMILY11, ...V_MISC11, ...V_EXPRS11,
  ...V_VERBS, ...V_POS, ...V_THINGS, ...V_PLACES, ...V_LIVINGS, ...V_PARTICLES, ...V_EXPRS, ...V_NUM,
];
ALL_WORDS.forEach(w => { if (!w.romaji) w.romaji = toRomaji(w.kana); });
V_NAMES.forEach(w => { if (!w.romaji) w.romaji = toRomaji(w.kana); });

const W = id => ALL_WORDS.find(w => w.id === id) || V_NAMES.find(w => w.id === id);
const VALID_VOCAB = new Set(ALL_WORDS.map(w => w.id));
const NAME_IDS = V_NAMES.map(w => w.id);
const VALID_ALL = new Set([...ALL_WORDS.map(w => w.id), ...NAME_IDS]);

/* Kosakata final untuk js/data/vocab_bab11.js (tanpa entri hidden & nama tokoh,
 * format sama dengan vocab_bab10.js) */
function typeOf(w) {
  if (V_VERBS11.includes(w) || V_VERBS.includes(w)) return w.hidden ? null : 'verb';
  if (V_COUNTERS.includes(w) || V_TSU.includes(w) || V_NUM.includes(w)) return 'counter';
  if (V_FOOD11.includes(w) || V_POST11.includes(w) || V_MISC11.includes(w)) return 'noun';
  if (V_FAMILY11.includes(w)) return 'noun_living';
  if (V_POS.includes(w)) return 'position';
  if (V_THINGS.includes(w)) return 'noun';
  if (V_PLACES.includes(w)) return 'noun_place';
  if (V_LIVINGS.includes(w)) return 'noun_living';
  if (V_PARTICLES.includes(w)) return 'particle';
  return 'expr';
}
const VOCAB_BAB11 = ALL_WORDS
  .filter(w => !w.hidden)
  .map(w => ({ id: w.id, jp: w.jp, kana: w.kana, romaji: w.romaji, id_mean: w.mean, type: typeOf(w), lesson: w.lesson }));

/* Peta cepat */
const THING = {}; const PLACE = {}; const LIVE = {}; const POS = {}; const FAM = {};
const POST = {}; const FOOD = {}; const CNT = {};
V_THINGS.forEach(w => THING[w.id] = w);
V_PLACES.forEach(w => PLACE[w.id] = w);
V_LIVINGS.forEach(w => LIVE[w.id] = w);
V_POS.forEach(w => POS[w.id] = w);
V_FAMILY11.forEach(w => FAM[w.id] = w);
V_POST11.forEach(w => POST[w.id] = w);
V_FOOD11.forEach(w => FOOD[w.id] = w);
V_COUNTERS.forEach(w => CNT[w.id] = w);

/* ==========================================================================
 * BAGIAN 2b — ANGKA + COUNTER (bacaan benar 1–10 per counter)
 * ========================================================================*/
const KANJI_NUM = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九', 10: '十' };
const COUNTER_KANJI = {
  tsu: 'つ', nin: '人', dai: '台', mai: '枚', kai: '回', ko: '個', hon: '本',
  ban: '番', fun: '分', nichi: '日', jikan: '時間', shuukan: '週間', kagetsu: 'か月', nen: '年',
};
const COUNT_READ = {
  tsu:     ['', 'ひとつ', 'ふたつ', 'みっつ', 'よっつ', 'いつつ', 'むっつ', 'ななつ', 'やっつ', 'ここのつ', 'とお'],
  nin:     ['', 'ひとり', 'ふたり', 'さんにん', 'よにん', 'ごにん', 'ろくにん', 'ななにん', 'はちにん', 'きゅうにん', 'じゅうにん'],
  mai:     ['', 'いちまい', 'にまい', 'さんまい', 'よんまい', 'ごまい', 'ろくまい', 'ななまい', 'はちまい', 'きゅうまい', 'じゅうまい'],
  dai:     ['', 'いちだい', 'にだい', 'さんだい', 'よんだい', 'ごだい', 'ろくだい', 'ななだい', 'はちだい', 'きゅうだい', 'じゅうだい'],
  kai:     ['', 'いっかい', 'にかい', 'さんかい', 'よんかい', 'ごかい', 'ろっかい', 'ななかい', 'はちかい', 'きゅうかい', 'じゅっかい'],
  ko:      ['', 'いっこ', 'にこ', 'さんこ', 'よんこ', 'ごこ', 'ろっこ', 'ななこ', 'はちこ', 'きゅうこ', 'じゅっこ'],
  hon:     ['', 'いっぽん', 'にほん', 'さんぼん', 'よんほん', 'ごほん', 'ろっぽん', 'ななほん', 'はっぽん', 'きゅうほん', 'じゅっぽん'],
  ban:     ['', 'いちばん', 'にばん', 'さんばん', 'よんばん', 'ごばん', 'ろくばん', 'ななばん', 'はちばん', 'きゅうばん', 'じゅうばん'],
  fun:     ['', 'いっぷん', 'にふん', 'さんぷん', 'よんぷん', 'ごふん', 'ろっぷん', 'ななふん', 'はっぷん', 'きゅうふん', 'じゅっぷん'],
  nichi:   ['', 'いちにち', 'ふつか', 'みっか', 'よっか', 'いつか', 'むいか', 'なのか', 'ようか', 'ここのか', 'とおか'],
  jikan:   ['', 'いちじかん', 'にじかん', 'さんじかん', 'よんじかん', 'ごじかん', 'ろくじかん', 'ななじかん', 'はちじかん', 'きゅうじかん', 'じゅうじかん'],
  shuukan: ['', 'いっしゅうかん', 'にしゅうかん', 'さんしゅうかん', 'よんしゅうかん', 'ごしゅうかん', 'ろくしゅうかん', 'ななしゅうかん', 'はっしゅうかん', 'きゅうしゅうかん', 'じゅっしゅうかん'],
  kagetsu: ['', 'いっかげつ', 'にかげつ', 'さんかげつ', 'よんかげつ', 'ごかげつ', 'ろっかげつ', 'ななかげつ', 'はっかげつ', 'きゅうかげつ', 'じゅっかげつ'],
  nen:     ['', 'いちねん', 'にねん', 'さんねん', 'よんねん', 'ごねん', 'ろくねん', 'ななねん', 'はちねん', 'きゅうねん', 'じゅうねん'],
};
/* Angka kanji (1..99) */
function kanjiNum(n) {
  if (n <= 10) return KANJI_NUM[n];
  const t = Math.floor(n / 10), o = n % 10;
  return (t > 1 ? KANJI_NUM[t] : '') + '十' + (o ? KANJI_NUM[o] : '');
}
const NUM_KANA = { 0: 'ゼロ', 1: 'いち', 2: 'に', 3: 'さん', 4: 'よん', 5: 'ご', 6: 'ろく', 7: 'なな', 8: 'はち', 9: 'きゅう', 10: 'じゅう' };
function numToKana(n) {
  if (n <= 10) return NUM_KANA[n];
  const t = Math.floor(n / 10), o = n % 10;
  return (t > 1 ? NUM_KANA[t] : '') + 'じゅう' + (o ? NUM_KANA[o] : '');
}
const SUF_BASE = { tsu: 'つ', nin: 'にん', mai: 'まい', dai: 'だい', kai: 'かい', ko: 'こ', hon: 'ほん', ban: 'ばん', fun: 'ふん', nichi: 'にち', jikan: 'じかん', shuukan: 'しゅうかん', kagetsu: 'かげつ', nen: 'ねん' };
function countReading(counterId, n) {
  if (COUNT_READ[counterId] && COUNT_READ[counterId][n]) return COUNT_READ[counterId][n];
  const base = numToKana(n), suf = SUF_BASE[counterId] || '';
  if (/じゅう$/.test(base)) {
    if (suf === 'ふん') return base.replace(/う$/, '') + 'っぷん';
    if (suf === 'ほん') return base.replace(/う$/, '') + 'っぽん';
    if (suf === 'かい') return base.replace(/う$/, '') + 'っかい';
    if (suf === 'こ') return base.replace(/う$/, '') + 'っこ';
  }
  return base + suf;
}
/* Token angka+counter, mis. 三つ / 五人 / 二か月 / 二十分 */
function countTok(counterId, n) {
  return T(kanjiNum(n) + COUNTER_KANJI[counterId], countReading(counterId, n));
}
/* Token uang, mis. 五百円 / 三千円 */
const EN_READ = { 100: 'ひゃくえん', 200: 'にひゃくえん', 300: 'さんびゃくえん', 400: 'よんひゃくえん', 500: 'ごひゃくえん', 600: 'ろっぴゃくえん', 700: 'ななひゃくえん', 800: 'はっぴゃくえん', 900: 'きゅうひゃくえん', 1000: 'せんえん', 2000: 'にせんえん', 3000: 'さんぜんえん', 5000: 'ごせんえん', 10000: 'いちまんえん' };
const EN_KANJI = { 100: '百円', 200: '二百円', 300: '三百円', 400: '四百円', 500: '五百円', 600: '六百円', 700: '七百円', 800: '八百円', 900: '九百円', 1000: '千円', 2000: '二千円', 3000: '三千円', 5000: '五千円', 10000: '一万円' };
function enTok(yen) { return T(EN_KANJI[yen], EN_READ[yen] || (numToKana(yen) + 'えん')); }
function parseNumStr(str) {
  if (/^[0-9]+$/.test(str)) return parseInt(str, 10);
  const d = { '〇': 0, '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };
  if (str === '十') return 10;
  if (str === '百') return 100;
  if (str === '千') return 1000;
  if (str === '万') return 10000;
  let n = 0, cur = 0;
  for (const ch of str) {
    if (d[ch] !== undefined) cur = d[ch];
    else if (ch === '十') { n += (cur || 1) * 10; cur = 0; }
    else if (ch === '百') { n += (cur || 1) * 100; cur = 0; }
    else if (ch === '千') { n += (cur || 1) * 1000; cur = 0; }
    else if (ch === '万') { n = (n + cur || 1) * 10000; cur = 0; }
  }
  return n + cur;
}

/* ==========================================================================
 * BAGIAN 3 — BANK KALIMAT (dikurasi, konteks nyata, near-duplicate ditolak)
 *
 * Token kalimat selalu berbentuk:
 *   [kata+partikel] | [angka+counter] | [kata fungsi] | [kata]
 * sehingga tokenizer audit (tools/audit_bab11.js) memperoleh potongan yang sama.
 *
 * NEAR-DUPLICATE: dua kalimat yang hanya berbeda SATU token ditolak
 * (lihat registry NEAR_MASKS pada mkSent). Kalimat kembar (sama persis
 * setelah normalisasi) juga ditolak.
 * ========================================================================*/
const NEAR_MASKS = new Map();   /* 'len|idx|tok…' -> { jp, tok } pemilik */
const SEEN_JP = new Set();      /* jp ternormalisasi */
const SENTENCES = [];
let seq = 1;

function normJp(s) { return String(s).replace(/\s+/g, ''); }

/* Token numerik: angka+counter (三つ / 五人 / 二十分 / 五百円) — variasi angka
 * pada kalimat drill counter punya tujuan pembelajaran yang jelas (inti Bab 11),
 * sehingga pasangan kalimat yang HANYA berbeda token numerik diizinkan. */
const NUM_TOK_RE = /^[0-9〇一二三四五六七八九十百千万]+(つ|人|枚|台|個|本|回|番|歳|円|か月|ヶ月|日|週間|時間|年|分)?$/;
function isNumTokS(s) { return NUM_TOK_RE.test(String(s).replace(/[\s。、？！]/g, '')); }
/* Minimal pair afirmatif↔negatif あります/ありません, います/いません — juga
 * punya tujuan pembelajaran jelas (pembedaan positif-negatif). */
const PRED_PAIRS = [['あります', 'ありません'], ['います', 'いません']];
function learningPurposePair(a, b) {
  const x = String(a).replace(/[\s。、？！]/g, ''), y = String(b).replace(/[\s。、？！]/g, '');
  if (isNumTokS(x) && isNumTokS(y)) return true;
  return PRED_PAIRS.some(([pp, nn]) => (x === pp && y === nn) || (x === nn && y === pp));
}

function mkSent(tokens, extra) {
  const jp = joinS(tokens);
  const key = normJp(jp);
  if (SEEN_JP.has(key)) return null;
  /* tolak near-duplicate (beda 1 token) — kecuali pasangan bernuansa pembelajaran */
  for (let i = 0; i < tokens.length; i++) {
    const mask = tokens.map((t, j) => (j === i ? '*' : t.s)).join('\u0001');
    const sig = tokens.length + '|' + i + '|' + mask;
    const owner = NEAR_MASKS.get(sig);
    if (owner && !learningPurposePair(owner.tok, tokens[i].s)) return null;
  }
  SEEN_JP.add(key);
  for (let i = 0; i < tokens.length; i++) {
    const mask = tokens.map((t, j) => (j === i ? '*' : t.s)).join('\u0001');
    NEAR_MASKS.set(tokens.length + '|' + i + '|' + mask, { jp, tok: tokens[i].s });
  }
  const s = {
    key: 's' + (seq++),
    tokens,
    jp,
    reading: joinR(tokens),
    romaji: joinM(tokens),
    idn: extra.idn,
    vocab: uniq((extra.vocab || []).filter(v => VALID_ALL.has(v))),
    slots: extra.slots || [],
    tags: extra.tags || {},
  };
  SENTENCES.push(s);
  return s;
}

const PART_KANA_ROM = { 'は': 'wa', 'が': 'ga', 'に': 'ni', 'の': 'no', 'や': 'ya', 'と': 'to', 'も': 'mo', 'を': 'o', 'で': 'de', 'から': 'kara', 'まで': 'made' };
function tok(word, particle) {
  const p = particle || '';
  const pRom = PART_KANA_ROM[p] || toRomaji(p);
  const pKana = p === 'は' ? 'わ' : p;
  return T(word.jp + p, word.kana + pKana, (word.romaji || toRomaji(word.kana)) + (p ? ' ' + pRom : ''));
}
function wordTok(word) { return T(word.jp, word.kana, word.romaji || toRomaji(word.kana)); }
/* Gabungkan token T() dengan partikel */
function tokT(t, particle) {
  const p = particle || '';
  const pRom = PART_KANA_ROM[p] || toRomaji(p);
  const pKana = p === 'は' ? 'わ' : p;
  return T(t.s + p, t.r + pKana, (t.m || toRomaji(t.r)) + (p ? ' ' + pRom : ''));
}

const PRED = {
  arimasu:  T('あります', 'あります', 'arimasu'),
  arimasen: T('ありません', 'ありません', 'arimasen'),
  imasu:    T('います', 'います', 'imasu'),
  imasen:   T('いません', 'いません', 'imasen'),
  arimasuka: T('ありますか', 'ありますか', 'arimasu ka'),
  imasuka:  T('いますか', 'いますか', 'imasu ka'),
};
function existPred(living, pol) {
  if (living) return pol === 'aff' ? PRED.imasu : PRED.imasen;
  return pol === 'aff' ? PRED.arimasu : PRED.arimasen;
}
function existPredQ(living) { return living ? PRED.imasuka : PRED.arimasuka; }
function existVerbId(living, pol) {
  return living ? (pol === 'aff' ? 'v_imasu' : 'v_wa_iru') : (pol === 'aff' ? 'v_arimasu' : 'v_wa_aru');
}

/* --- padanan konteks nyata ---------------------------------------------- */
/* Benda yang wajar dihitung di sebuah tempat (soal konteks nyata) */
const PLACE_THINGS = {
  n_kaigishitsu: [['n_teeburu', 'dai'], ['n_isu', 'tsu'], ['n_terebi', 'dai'], ['n_enpitsu', 'hon'], ['n_nooto', 'tsu']],
  n_kyoushitsu:  [['n_isu', 'tsu'], ['n_tsukue', 'tsu'], ['n_enpitsu', 'hon'], ['n_keshigomu', 'ko'], ['n_nooto', 'tsu'], ['n_kitte', 'mai']],
  n_heya:        [['n_tsukue', 'tsu'], ['n_beddo', 'tsu'], ['n_terebi', 'dai'], ['n_hon', 'tsu'], ['n_kasa', 'hon'], ['n_kutsu', 'tsu']],
  n_jimusho:     [['n_pasokon', 'dai'], ['n_tsukue', 'tsu'], ['n_isu', 'tsu'], ['n_denwa', 'dai'], ['n_hagaki', 'mai']],
  n_toshokan:    [['n_hon', 'tsu'], ['n_zasshi', 'tsu'], ['n_shinbun', 'tsu'], ['n_isu', 'tsu'], ['n_tsukue', 'tsu']],
  n_yuubinkyoku: [['n_kitte', 'mai'], ['n_hagaki', 'mai'], ['n_fuutou', 'mai'], ['n_kaban', 'tsu'], ['n_posuto', 'tsu']],
  n_suupaa:      [['n_ringo', 'tsu'], ['n_mikan', 'tsu'], ['n_pan', 'tsu'], ['n_sandoicchi', 'tsu'], ['n_aisukuriimu', 'tsu'], ['n_mizu', 'tsu']],
  n_konbini:     [['n_pan', 'tsu'], ['n_mizu', 'tsu'], ['n_hagaki', 'mai'], ['n_shinbun', 'tsu'], ['n_aisukuriimu', 'tsu']],
  n_depaato:     [['n_kutsu', 'tsu'], ['n_kaban', 'tsu'], ['n_kamera', 'dai'], ['n_terebi', 'dai'], ['n_kaado', 'mai']],
  n_honya:       [['n_hon', 'tsu'], ['n_zasshi', 'tsu'], ['n_nooto', 'tsu'], ['n_techo', 'tsu']],
  n_kissaten:    [['n_teeburu', 'tsu'], ['n_isu', 'tsu'], ['n_koohii', 'tsu'], ['n_kamera', 'dai']],
  n_uchi:        [['n_reizouko', 'dai'], ['n_beddo', 'tsu'], ['n_teeburu', 'tsu'], ['n_kuruma', 'dai'], ['n_ringo', 'tsu'], ['n_mikan', 'tsu'], ['n_kareeraisu', 'tsu']],
  n_ryou:        [['n_beddo', 'tsu'], ['n_tsukue', 'tsu'], ['n_denchi', 'ko'], ['n_firumu', 'mai'], ['n_kareeraisu', 'tsu']],
  n_gakkou:      [['n_terebi', 'dai'], ['n_pasokon', 'dai'], ['n_hana', 'tsu'], ['n_isu', 'tsu']],
  n_daigaku:     [['n_isu', 'tsu'], ['n_pasokon', 'dai'], ['n_hon', 'tsu'], ['n_ki', 'hon']],
  n_kaisha:      [['n_pasokon', 'dai'], ['n_denwa', 'dai'], ['n_tsukue', 'tsu'], ['n_hagaki', 'mai']],
  n_mise:        [['n_ringo', 'tsu'], ['n_mikan', 'tsu'], ['n_kutsu', 'tsu'], ['n_aisukuriimu', 'tsu']],
  n_shokudou:    [['n_teeburu', 'tsu'], ['n_isu', 'tsu'], ['n_kareeraisu', 'tsu'], ['n_sandoicchi', 'tsu']],
  n_byouin:      [['n_beddo', 'tsu'], ['n_denwa', 'dai'], ['n_hana', 'tsu'], ['n_kasa', 'hon']],
  n_ginkou:      [['n_pasokon', 'dai'], ['n_isu', 'tsu'], ['n_kaado', 'mai'], ['n_tokei', 'tsu']],
};
/* Orang yang wajar dihitung di sebuah tempat */
const PLACE_PEOPLE = {
  n_kyoushitsu:  ['n_gakusei', 'n_sensei', 'n_kodomo', 'n_ryuugakusei', 'n_otokonoko', 'n_onnanoko'],
  n_kaigishitsu: ['n_kaishain', 'n_otokonohito', 'n_onnanohito', 'n_hito'],
  n_heya:        ['n_kodomo', 'n_tomodachi', 'n_gakusei', 'n_otokonoko', 'n_onnanoko'],
  n_jimusho:     ['n_kaishain', 'n_ryuugakusei', 'n_hito'],
  n_toshokan:    ['n_gakusei', 'n_ryuugakusei', 'n_hito'],
  n_kouen:       ['n_kodomo', 'n_otokonoko', 'n_onnanoko', 'n_tomodachi'],
  n_kissaten:    ['n_tomodachi', 'n_kaishain', 'n_hito'],
  n_resutoran:   ['n_kazoku', 'n_hito', 'n_tomodachi'],
  n_daigaku:     ['n_gakusei', 'n_ryuugakusei', 'n_sensei'],
  n_gakkou:      ['n_gakusei', 'n_sensei', 'n_kodomo'],
  n_ryou:        ['n_gakusei', 'n_ryuugakusei', 'n_tomodachi'],
  n_yuubinkyoku: ['n_ginkouin', 'n_hito'],
  n_ginkou:      ['n_ginkouin', 'n_hito'],
  n_suupaa:      ['n_hito', 'n_kodomo'],
  n_konbini:     ['n_kaishain', 'n_gakusei', 'n_hito'],
  n_shokudou:    ['n_gakusei', 'n_kaishain'],
  n_kaisha:      ['n_kaishain', 'n_ryuugakusei'],
  n_eki:         ['n_hito', 'n_tomodachi', 'n_gakusei'],
  n_byouin:      ['n_isha', 'n_hito', 'n_kodomo'],
  n_kurasu:      ['n_gakusei', 'n_kodomo', 'n_ryuugakusei'],
  n_gaikoku:     ['n_ryuugakusei', 'n_gakusei', 'n_hito'],
};
/* Posisi: acuan benda + benda yang wajar */
const POS_FRAME = {
  pos_ue:    [['n_tsukue', ['n_hon', 'n_kitte', 'n_enpitsu', 'n_ringo', 'n_mikan', 'n_hagaki', 'n_tokei', 'n_aisukuriimu']],
              ['n_teeburu', ['n_ringo', 'n_mikan', 'n_sandoicchi', 'n_kareeraisu', 'n_hagaki', 'n_fuutou', 'n_koohii']],
              ['n_tana', ['n_hon', 'n_zasshi', 'n_denchi', 'n_kamera', 'n_hako']],
              ['n_beddo', ['n_kaban', 'n_hon', 'n_nooto']],
              ['n_reizouko', ['n_mikan', 'n_ringo', 'n_mizu']]],
  pos_shita: [['n_tsukue', ['n_kaban', 'n_kutsu', 'n_kasa', 'n_nooto']],
              ['n_teeburu', ['n_kaban', 'n_kutsu', 'n_kasa']],
              ['n_beddo', ['n_kaban', 'n_kutsu', 'n_hako']],
              ['n_isu', ['n_kaban', 'n_hon']]],
  pos_naka:  [['n_hako', ['n_enpitsu', 'n_keshigomu', 'n_denchi', 'n_firumu', 'n_kaado', 'n_kitte', 'n_hagaki']],
              ['n_kaban', ['n_hon', 'n_nooto', 'n_fuutou', 'n_kaado', 'n_kitte', 'n_kamera']],
              ['n_reizouko', ['n_mikan', 'n_ringo', 'n_mizu', 'n_aisukuriimu']],
              ['n_heya', ['n_terebi', 'n_beddo', 'n_tsukue', 'n_denwa']],
              ['n_kyoushitsu', ['n_tsukue', 'n_isu', 'n_terebi']],
              ['n_yuubinkyoku', ['n_kitte', 'n_hagaki', 'n_fuutou']]],
};
const FAMILY_MEMBERS = ['n_ani', 'n_ane', 'n_otouto', 'n_imouto', 'n_kyoudai', 'n_shimai', 'n_oniisan', 'n_oneesan', 'n_otoutosan', 'n_imoutosan', 'n_ryoushin'];
const PERSON_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8];
const TSU_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const OTHER_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
/* Durasi untuk かかります / います */
const DURATIONS = [
  { id: 'fun', n: 2 }, { id: 'fun', n: 5 }, { id: 'fun', n: 10 }, { id: 'fun', n: 20 },
  { id: 'jikan', n: 1 }, { id: 'jikan', n: 2 }, { id: 'jikan', n: 3 }, { id: 'jikan', n: 5 },
  { id: 'shuukan', n: 1 }, { id: 'shuukan', n: 2 }, { id: 'shuukan', n: 3 },
  { id: 'kagetsu', n: 1 }, { id: 'kagetsu', n: 2 }, { id: 'kagetsu', n: 3 }, { id: 'kagetsu', n: 6 },
  { id: 'nen', n: 1 }, { id: 'nen', n: 2 }, { id: 'nen', n: 3 },
  { id: 'nichi', n: 2 }, { id: 'nichi', n: 3 }, { id: 'nichi', n: 7 },
];
const durTok = d => countTok(d.id, d.n);
const durMean = d => {
  const unit = { fun: 'menit', jikan: 'jam', shuukan: 'minggu', kagetsu: 'bulan', nen: 'tahun', nichi: 'hari' }[d.id];
  return `${d.n} ${unit}`;
};
/* Pasangan tempat untuk pola から～まで */
const ROUTES = [
  ['n_uchi', 'n_gakkou'], ['n_uchi', 'n_eki'], ['n_eki', 'n_daigaku'], ['n_uchi', 'n_yuubinkyoku'],
  ['n_gakkou', 'n_toshokan'], ['n_eki', 'n_kuukou'], ['n_uchi', 'n_byouin'], ['n_kaisha', 'n_uchi'],
  ['n_daigaku', 'n_depaato'], ['n_eki', 'n_depaato'], ['n_uchi', 'n_kouen'], ['n_gakkou', 'n_yuubinkyoku'],
  ['n_daigaku', 'n_yuubinkyoku'], ['n_uchi', 'n_suupaa'], ['n_ryou', 'n_daigaku'], ['n_eki', 'n_kaisha'],
];
const YEN_LIST = [100, 500, 1000, 2000, 3000, 5000, 10000];

/* ---------- slot helpers ---------- */
function slotParticle(idx, answer, cls) { return { kind: 'particle', tokIndex: idx, answer, cls }; }
function slotCount(idx, answer, counterId, n) { return { kind: 'count', tokIndex: idx, answer, counterId, n }; }
function slotSuffix(idx, answer, numeral) { return { kind: 'suffix', tokIndex: idx, answer, numeral }; }
function slotQword(idx, answer, qid) { return { kind: 'qword', tokIndex: idx, answer, qid }; }
function slotFunc(idx, answer, cls) { return { kind: 'func', tokIndex: idx, answer, cls }; }
function slotPred(idx, answer, cls) { return { kind: 'predicate', tokIndex: idx, answer, cls }; }
function slotNoun(idx, answer, nounId) { return { kind: 'noun', tokIndex: idx, answer, nounId }; }

/* ---------- 1) Kuantitas benda: [tempat]に [benda]が [counter] あります ---------- */
const CNT_MEAN_UNIT = { tsu: 'buah', nin: 'orang', mai: 'lembar', dai: 'unit', kai: 'kali', ko: 'butir', hon: 'batang', fun: 'menit', jikan: 'jam', shuukan: 'minggu', kagetsu: 'bulan', nen: 'tahun', nichi: 'hari', ban: 'nomor' };
function cntMean(counter, n) {
  if (counter === 'tsu') return `${n} buah`;
  return `${n} ${CNT_MEAN_UNIT[counter] || ''}`.trim();
}

function buildQtyThings() {
  const out = [];
  for (const placeId of Object.keys(PLACE_THINGS)) {
    const place = PLACE[placeId];
    for (const [thingId, counter] of PLACE_THINGS[placeId]) {
      const thing = W(thingId);
      const nums = counter === 'tsu' ? TSU_COUNTS : OTHER_COUNTS;
      for (const n of pickN(nums, 7, mulberry32(placeId.length * 31 + thingId.length * 7 + n_seed(placeId, thingId)))) {
        const cnt = countTok(counter, n);
        for (const pol of ['aff', 'neg']) {
          const pred = existPred(false, pol);
          const tokens = [tok(place, 'に'), tok(thing, 'が'), cnt, pred];
          const bunpou = counter === 'tsu' ? ['bp_tsu'] : { mai: ['bp_mai'], dai: ['bp_dai'], hon: ['bp_counter2'], ko: ['bp_counter2'] }[counter] || ['bp_tsu'];
          const s = mkSent(tokens, {
            idn: pol === 'aff'
              ? `Di ${place.mean} ada ${cntMean(counter, n)} ${thing.mean}.`
              : `Di ${place.mean} tidak ada ${thing.mean}.`,
            vocab: [existVerbId(false, pol), place.id, thing.id, 'p_ni', 'p_ga', 'c_' + counter, 'num_' + n],
            slots: [
              slotParticle(0, 'に', 'p_ni'),
              slotParticle(1, 'が', 'p_ga'),
              slotCount(2, cnt.s, counter, n),
              slotSuffix(2, COUNTER_KANJI[counter], KANJI_NUM[n]),
              slotPred(3, pred.s, pol === 'aff' ? 'pred_aru' : 'pred_arenai'),
            ],
            tags: {
              bucket: pol === 'aff' ? 'qty_thing' : 'qty_neg', pattern: 'qty_thing_' + pol,
              bunpou: [...bunpou, ...(pol === 'neg' ? [] : [])], counter, n,
              placeId: place.id, placeMean: place.mean, subjId: thing.id, subjMean: thing.mean,
              living: false, pol, tokens: tokens.length,
            },
          });
          if (s) out.push(s);
        }
      }
    }
  }
  return out;
}
function n_seed(a, b) { let h = 0; for (const ch of a + b) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h) % 9973; }

/* ---------- 2) Kuantitas orang: [tempat]に [orang]が [～人] います ---------- */
function buildQtyPeople() {
  const out = [];
  for (const placeId of Object.keys(PLACE_PEOPLE)) {
    const place = PLACE[placeId];
    for (const personId of PLACE_PEOPLE[placeId]) {
      const person = LIVE[personId];
      for (const n of pickN(PERSON_COUNTS, 6, mulberry32(n_seed(placeId, personId) + 17))) {
        const cnt = countTok('nin', n);
        for (const pol of ['aff', 'neg']) {
          const pred = existPred(true, pol);
          const tokens = [tok(place, 'に'), tok(person, 'が'), cnt, pred];
          const s = mkSent(tokens, {
            idn: pol === 'aff'
              ? `Di ${place.mean} ada ${n} ${person.mean}.`
              : `Di ${place.mean} tidak ada ${person.mean}.`,
            vocab: [existVerbId(true, pol), place.id, person.id, 'p_ni', 'p_ga', 'c_nin', 'num_' + n],
            slots: [
              slotParticle(0, 'に', 'p_ni'),
              slotParticle(1, 'が', 'p_ga'),
              slotCount(2, cnt.s, 'nin', n),
              slotSuffix(2, '人', KANJI_NUM[n]),
              slotPred(3, pred.s, pol === 'aff' ? 'pred_iru' : 'pred_inai'),
            ],
            tags: {
              bucket: pol === 'aff' ? 'qty_people' : 'qty_neg', pattern: 'qty_people_' + pol,
              bunpou: ['bp_nin'], counter: 'nin', n,
              placeId: place.id, placeMean: place.mean, subjId: person.id, subjMean: person.mean,
              living: true, pol, tokens: tokens.length,
            },
          });
          if (s) out.push(s);
        }
      }
    }
  }
  return out;
}

/* ---------- 3) Kuantitas di posisi: [acuan]の [posisi]に [benda]が [counter] あります ---------- */
function buildQtyPos() {
  const out = [];
  for (const posId of ['pos_ue', 'pos_shita', 'pos_naka']) {
    const pos = POS[posId];
    for (const [refId, things] of POS_FRAME[posId]) {
      const ref = W(refId);
      for (const thingId of things) {
        const thing = W(thingId);
        const pair = Object.values(PLACE_THINGS).flat().find(p => p[0] === thingId);
        const counter = pair ? pair[1] : 'tsu';
        const nums = counter === 'tsu' ? TSU_COUNTS : OTHER_COUNTS;
        for (const n of pickN(nums, 2, mulberry32(n_seed(refId + posId, thingId) + 31))) {
          const cnt = countTok(counter, n);
          const tokens = [tok(ref, 'の'), tok(pos, 'に'), tok(thing, 'が'), cnt, PRED.arimasu];
          const bunpou = counter === 'tsu' ? ['bp_tsu'] : { mai: ['bp_mai'], dai: ['bp_dai'], hon: ['bp_counter2'], ko: ['bp_counter2'] }[counter] || ['bp_tsu'];
          const s = mkSent(tokens, {
            idn: `Di ${posMean(pos.id)} ${ref.mean} ada ${n} ${thing.mean}.`,
            vocab: ['v_arimasu', ref.id, pos.id, thing.id, 'p_no', 'p_ni', 'p_ga', 'c_' + counter, 'num_' + n],
            slots: [
              slotParticle(0, 'の', 'p_no'),
              slotParticle(1, 'に', 'p_ni'),
              slotParticle(2, 'が', 'p_ga'),
              slotCount(3, cnt.s, counter, n),
              slotSuffix(3, COUNTER_KANJI[counter], KANJI_NUM[n]),
              slotPred(4, 'あります', 'pred_aru'),
            ],
            tags: {
              bucket: 'qty_pos', pattern: 'qty_pos', bunpou: bunpou, counter, n,
              refId: ref.id, refMean: ref.mean, posId: pos.id, subjId: thing.id, subjMean: thing.mean,
              living: false, pol: 'aff', tokens: tokens.length,
            },
          });
          if (s) out.push(s);
        }
      }
    }
  }
  return out;
}
const POS_MEAN = { pos_ue: 'atas', pos_shita: 'bawah', pos_mae: 'depan', pos_ushiro: 'belakang', pos_migi: 'kanan', pos_hidari: 'kiri', pos_naka: 'dalam', pos_soto: 'luar', pos_tonari: 'sebelah', pos_chikaku: 'dekat', pos_aida: 'antara' };
const posMean = id => POS_MEAN[id] || '';

/* ---------- 4) Keluarga + jumlah ---------- */
function buildFamily() {
  const out = [];
  const NAMES = V_NAMES;
  /* 4a. [nama]は [anggota]が [～人] います。 */
  for (const nm of NAMES) {
    for (const famId of FAMILY_MEMBERS) {
      const fam = FAM[famId];
      for (const n of pickN(PERSON_COUNTS.filter(x => x <= 5), 5, mulberry32(n_seed(nm.id, famId) + 3))) {
        const cnt = countTok('nin', n);
        const tokens = [tok(nm, 'は'), tok(fam, 'が'), cnt, PRED.imasu];
        const s = mkSent(tokens, {
          idn: `${nm.mean} punya ${n} ${fam.mean}.`,
          vocab: ['v_imasu', fam.id, 'p_wa', 'p_ga', 'c_nin', 'num_' + n],
          slots: [
            slotParticle(0, 'は', 'p_wa'),
            slotParticle(1, 'が', 'p_ga'),
            slotCount(2, cnt.s, 'nin', n),
            slotSuffix(2, '人', KANJI_NUM[n]),
            slotPred(3, 'います', 'pred_iru'),
          ],
          tags: {
            bucket: 'family', pattern: 'family_have', bunpou: ['bp_keluarga', 'bp_nin'], counter: 'nin', n,
            subjId: fam.id, subjMean: fam.mean, living: true, pol: 'aff', tokens: tokens.length,
          },
        });
        if (s) out.push(s);
      }
    }
  }
  /* 4b. [nama]の [anggota]は [～人] です。 */
  for (const nm of NAMES) {
    for (const famId of ['n_kyoudai', 'n_shimai', 'n_ryoushin']) {
      const fam = FAM[famId];
      for (const n of pickN(famId === 'n_ryoushin' ? [2] : [2, 3, 4, 5], 1, mulberry32(n_seed(nm.id, famId) + 9))) {
        const cnt = countTok('nin', n);
        const tokens = [tok(nm, 'の'), tok(fam, 'は'), cnt, T('です', 'です', 'desu')];
        const s = mkSent(tokens, {
          idn: `${nm.mean} ${fam.mean}-nya ${n} orang.`,
          vocab: [fam.id, 'p_no', 'p_wa', 'c_nin', 'num_' + n],
          slots: [
            slotParticle(0, 'の', 'p_no'),
            slotParticle(1, 'は', 'p_wa'),
            slotCount(2, cnt.s, 'nin', n),
            slotQword(2, '何人', 'e_nannin'),
            slotPred(3, 'です', 'pred_desu'),
          ],
          tags: {
            bucket: 'family', pattern: 'family_desu', bunpou: ['bp_keluarga', 'bp_nannin'], counter: 'nin', n,
            subjId: fam.id, subjMean: fam.mean, living: true, pol: 'aff', isQuestion: false, tokens: tokens.length,
          },
        });
        if (s) out.push(s);
      }
    }
  }
  /* 4c. Pertanyaan: [nama]の [anggota]は 何人 ですか。 */
  for (const nm of pickN(NAMES, 8, mulberry32(41))) {
    for (const famId of pickN(['n_kyoudai', 'n_shimai'], 2, mulberry32(n_seed(nm.id, 'q')))) {
      const fam = FAM[famId];
      const tokens = [tok(nm, 'の'), tok(fam, 'は'), T('何人', 'なんにん', 'nan nin'), T('ですか', 'ですか', 'desu ka')];
      const s = mkSent(tokens, {
        idn: `${fam.mean} ${nm.mean} berapa orang?`,
        vocab: [fam.id, 'e_nannin', 'p_no', 'p_wa', 'c_nin'],
        slots: [
          slotParticle(0, 'の', 'p_no'),
          slotParticle(1, 'は', 'p_wa'),
          slotQword(2, '何人', 'e_nannin'),
          slotPred(3, 'ですか', 'q_desuka'),
        ],
        tags: {
          bucket: 'q_count', pattern: 'q_nannin', bunpou: ['bp_nannin'], counter: 'nin',
          subjId: fam.id, subjMean: fam.mean, living: true, pol: 'q', isQuestion: true, tokens: tokens.length,
        },
      });
      if (s) out.push(s);
    }
  }
  /* 4d. [anggota]が [～人] と [anggota2]が [～人] います。 (dari 例文④) */
  const PAIRS = [['n_ane', 'n_ani'], ['n_ane', 'n_otouto'], ['n_ani', 'n_imouto'], ['n_imouto', 'n_otouto'],
                 ['n_oneesan', 'n_otoutosan'], ['n_imoutosan', 'n_otoutosan'], ['n_oniisan', 'n_imoutosan'],
                 ['n_ryoushin', 'n_ani'], ['n_oneesan', 'n_otouto'], ['n_ryoushin', 'n_ane']];
  for (const [f1, f2] of PAIRS) {
    for (const [n1, n2] of [[1, 2], [2, 1], [1, 3], [2, 2], [1, 1]]) {
      const a = FAM[f1], b = FAM[f2];
      const c1 = countTok('nin', n1), c2 = countTok('nin', n2);
      const tokens = [tok(a, 'が'), c1, T('と', 'と', 'to'), tok(b, 'が'), c2, PRED.imasu];
      const s = mkSent(tokens, {
        idn: `Ada ${n1} ${a.mean} dan ${n2} ${b.mean}.`,
        vocab: ['v_imasu', a.id, b.id, 'p_ga', 'p_to', 'c_nin', 'num_' + n1, 'num_' + n2],
        slots: [
          slotParticle(0, 'が', 'p_ga'),
          slotParticle(2, 'と', 'p_to'),
          slotCount(1, c1.s, 'nin', n1),
          slotCount(4, c2.s, 'nin', n2),
          slotPred(5, 'います', 'pred_iru'),
        ],
        tags: {
          bucket: 'family', pattern: 'family_two', bunpou: ['bp_keluarga', 'bp_nin'], counter: 'nin', n: n1 + n2,
          subjId: a.id, subj2Id: b.id, living: true, pol: 'aff', tokens: tokens.length,
        },
      });
      if (s) out.push(s);
    }
  }
  return out;
}

/* ---------- 5) Kantor pos: pesanan & surat ---------- */
const MAIL_ITEMS = ['n_kitte', 'n_hagaki', 'n_fuutou'];
function buildPostal() {
  const out = [];
  /* 5a. [surat]を [～枚] ください。 */
  for (const m of MAIL_ITEMS) {
    for (const n of pickN([1, 2, 3, 5, 8, 10], 3, mulberry32(n_seed(m, 'kud') + 5))) {
      const cnt = countTok('mai', n);
      const tokens = [tok(W(m), 'を'), cnt, T('ください', 'ください', 'kudasai')];
      const s = mkSent(tokens, {
        idn: `Tolong berikan ${n} ${W(m).mean}.`,
        vocab: [m, 'v_kudasai', 'p_o', 'c_mai', 'num_' + n],
        slots: [
          slotParticle(0, 'を', 'p_o'),
          slotCount(1, cnt.s, 'mai', n),
          slotSuffix(1, '枚', KANJI_NUM[n]),
          slotFunc(2, 'ください', 'f_kudasai'),
        ],
        tags: {
          bucket: 'order', pattern: 'order_single', bunpou: ['bp_kudasai', 'bp_mai'], counter: 'mai', n,
          subjId: m, subjMean: W(m).mean, pol: 'aff', tokens: tokens.length,
        },
      });
      if (s) out.push(s);
    }
  }
  /* 5b. [surat1]を [～枚] と [surat2]を [～枚] ください。 (例文②) */
  const PAIRS = [['n_kitte', 'n_hagaki'], ['n_kitte', 'n_fuutou'], ['n_hagaki', 'n_fuutou']];
  for (const [m1, m2] of PAIRS) {
    for (const [n1, n2] of [[5, 2], [3, 4], [2, 6], [4, 1], [6, 3], [2, 2]]) {
      const c1 = countTok('mai', n1), c2 = countTok('mai', n2);
      const tokens = [tok(W(m1), 'を'), c1, T('と', 'と', 'to'), tok(W(m2), 'を'), c2, T('ください', 'ください', 'kudasai')];
      const s = mkSent(tokens, {
        idn: `Tolong berikan ${n1} ${W(m1).mean} dan ${n2} ${W(m2).mean}.`,
        vocab: [m1, m2, 'v_kudasai', 'p_o', 'p_to', 'c_mai', 'num_' + n1, 'num_' + n2],
        slots: [
          slotParticle(0, 'を', 'p_o'),
          slotParticle(2, 'と', 'p_to'),
          slotCount(1, c1.s, 'mai', n1),
          slotCount(4, c2.s, 'mai', n2),
          slotFunc(5, 'ください', 'f_kudasai'),
        ],
        tags: {
          bucket: 'order', pattern: 'order_two', bunpou: ['bp_kudasai', 'bp_mai'], counter: 'mai', n: n1 + n2,
          subjId: m1, subj2Id: m2, pol: 'aff', tokens: tokens.length,
        },
      });
      if (s) out.push(s);
    }
  }
  /* 5c. [makanan]を [～つ] ください。 */
  for (const f of ['n_ringo', 'n_mikan', 'n_sandoicchi', 'n_aisukuriimu', 'n_kareeraisu', 'n_pan']) {
    for (const n of pickN([1, 2, 3, 4, 5], 2, mulberry32(n_seed(f, 'fd') + 7))) {
      const cnt = countTok('tsu', n);
      const tokens = [tok(W(f), 'を'), cnt, T('ください', 'ください', 'kudasai')];
      const s = mkSent(tokens, {
        idn: `Tolong berikan ${n} ${W(f).mean}.`,
        vocab: [f, 'v_kudasai', 'p_o', 'c_tsu', 'num_' + n],
        slots: [
          slotParticle(0, 'を', 'p_o'),
          slotCount(1, cnt.s, 'tsu', n),
          slotSuffix(1, 'つ', KANJI_NUM[n]),
          slotFunc(2, 'ください', 'f_kudasai'),
        ],
        tags: {
          bucket: 'order', pattern: 'order_food', bunpou: ['bp_tsu', 'bp_kudasai'], counter: 'tsu', n,
          subjId: f, subjMean: W(f).mean, pol: 'aff', tokens: tokens.length,
        },
      });
      if (s) out.push(s);
    }
  }
  /* 5d. 全部で [harga] 円です。 */
  for (const yen of YEN_LIST) {
    const tokens = [T('全部で', 'ぜんぶで', 'zenbu de'), enTok(yen), T('です', 'です', 'desu')];
    const s = mkSent(tokens, {
      idn: `Semuanya ${yen} yen.`,
      vocab: ['e_zenbude', 'c_en', ...(yen >= 1000 ? ['num_1000'] : ['num_100']), ...(yen >= 10000 ? ['num_10000'] : [])],
      slots: [
        slotFunc(0, '全部で', 'f_zenbude'),
        slotPred(2, 'です', 'pred_desu'),
      ],
      tags: {
        bucket: 'price', pattern: 'zenbude_en', bunpou: ['bp_zenbude'], yen, pol: 'aff', tokens: tokens.length,
      },
    });
    if (s) out.push(s);
    /* [surat]は 全部で [harga] 円です。 */
  }
  for (const m of MAIL_ITEMS) {
    for (const yen of pickN(YEN_LIST.filter(y => y <= 5000), 2, mulberry32(n_seed(m, 'pr') + 11))) {
      const tokens = [tok(W(m), 'は'), T('全部で', 'ぜんぶで', 'zenbu de'), enTok(yen), T('です', 'です', 'desu')];
      const s = mkSent(tokens, {
        idn: `${W(m).mean} semuanya ${yen} yen.`,
        vocab: [m, 'e_zenbude', 'c_en', 'p_wa', yen >= 1000 ? 'num_1000' : 'num_100'],
        slots: [
          slotParticle(0, 'は', 'p_wa'),
          slotFunc(1, '全部で', 'f_zenbude'),
          slotPred(3, 'です', 'pred_desu'),
        ],
        tags: {
          bucket: 'price', pattern: 'zenbude_item', bunpou: ['bp_zenbude'], yen, subjId: m, pol: 'aff', tokens: tokens.length,
        },
      });
      if (s) out.push(s);
    }
  }
  /* 5e. 全部で [counter] [あります/います]。 */
  for (const [thingId, counter] of [['n_kitte', 'mai'], ['n_hagaki', 'mai'], ['n_fuutou', 'mai'], ['n_ringo', 'tsu'], ['n_enpitsu', 'hon'], ['n_denchi', 'ko']]) {
    for (const n of pickN([3, 5, 7, 10], 2, mulberry32(n_seed(thingId, 'zb') + 13))) {
      const cnt = countTok(counter, n);
      const tokens = [T('全部で', 'ぜんぶで', 'zenbu de'), cnt, PRED.arimasu];
      const s = mkSent(tokens, {
        idn: `Semuanya ada ${n} ${W(thingId).mean}.`,
        vocab: ['e_zenbude', thingId, 'v_arimasu', 'c_' + counter, 'num_' + n],
        slots: [
          slotFunc(0, '全部で', 'f_zenbude'),
          slotCount(1, cnt.s, counter, n),
          slotSuffix(1, COUNTER_KANJI[counter], KANJI_NUM[n]),
          slotPred(2, 'あります', 'pred_aru'),
        ],
        tags: {
          bucket: 'price', pattern: 'zenbude_qty', bunpou: ['bp_zenbude', 'bp_mai'].concat(counter === 'tsu' ? ['bp_tsu'] : []), counter, n, subjId: thingId, pol: 'aff', tokens: tokens.length,
        },
      });
      if (s) out.push(s);
    }
  }
  return out;
}

/* ---------- 6) かかります / どのぐらい / durasi ---------- */
function buildKakarimasu() {
  const out = [];
  /* 6a. [dari]から [sampai]まで [durasi] かかります。 */
  for (const [fromId, toId] of ROUTES) {
    const a = PLACE[fromId], b = PLACE[toId];
    for (const d of pickN(DURATIONS.filter(x => ['fun', 'jikan', 'shuukan', 'kagetsu'].includes(x.id)), 2, mulberry32(n_seed(fromId, toId) + 19))) {
      const dt = durTok(d);
      const tokens = [tok(a, 'から'), tok(b, 'まで'), dt, T('かかります', 'かかります', 'kakarimasu')];
      const s = mkSent(tokens, {
        idn: `Dari ${a.mean} sampai ${b.mean} memakan waktu ${durMean(d)}.`,
        vocab: ['v_kakarimasu', a.id, b.id, 'p_kara', 'p_made', 'c_' + d.id, 'num_' + d.n],
        slots: [
          slotParticle(0, 'から', 'p_kara'),
          slotParticle(1, 'まで', 'p_made'),
          slotCount(2, dt.s, d.id, d.n),
          slotSuffix(2, COUNTER_KANJI[d.id], KANJI_NUM[d.n]),
          slotPred(3, 'かかります', 'pred_kakaru'),
        ],
        tags: {
          bucket: 'kakaru', pattern: 'kakarimasu', bunpou: ['bp_kakarimasu', 'bp_durasi'], counter: d.id, n: d.n,
          refId: a.id, ref2Id: b.id, pol: 'aff', tokens: tokens.length,
        },
      });
      if (s) out.push(s);
    }
  }
  /* 6b. [dari]から [sampai]まで [durasi]ぐらい かかります。 */
  for (const [fromId, toId] of pickN(ROUTES, 10, mulberry32(71))) {
    const a = PLACE[fromId], b = PLACE[toId];
    const d = pick(DURATIONS.filter(x => ['fun', 'jikan', 'shuukan', 'kagetsu'].includes(x.id)), mulberry32(n_seed(fromId, toId) + 23));
    const dt = durTok(d);
    const tokens = [tok(a, 'から'), tok(b, 'まで'), dt, T('ぐらい', 'ぐらい', 'gurai'), T('かかります', 'かかります', 'kakarimasu')];
    const s = mkSent(tokens, {
      idn: `Dari ${a.mean} sampai ${b.mean} kira-kira memakan waktu ${durMean(d)}.`,
      vocab: ['v_kakarimasu', 'e_gurai', a.id, b.id, 'p_kara', 'p_made', 'c_' + d.id, 'num_' + d.n],
      slots: [
        slotParticle(0, 'から', 'p_kara'),
        slotParticle(1, 'まで', 'p_made'),
        slotCount(2, dt.s, d.id, d.n),
        slotFunc(3, 'ぐらい', 'f_gurai'),
        slotPred(4, 'かかります', 'pred_kakaru'),
      ],
      tags: {
        bucket: 'kakaru', pattern: 'kakarimasu_gurai', bunpou: ['bp_kakarimasu', 'bp_gurai', 'bp_durasi'], counter: d.id, n: d.n,
        refId: a.id, ref2Id: b.id, pol: 'aff', tokens: tokens.length,
      },
    });
    if (s) out.push(s);
  }
  /* 6c. Pertanyaan: [dari]から [sampai]まで どのぐらい かかりますか。 */
  for (const [fromId, toId] of pickN(ROUTES, 12, mulberry32(83))) {
    const a = PLACE[fromId], b = PLACE[toId];
    const tokens = [tok(a, 'から'), tok(b, 'まで'), T('どのぐらい', 'どのぐらい', 'dono gurai'), T('かかりますか', 'かかりますか', 'kakarimasu ka')];
    const s = mkSent(tokens, {
      idn: `Dari ${a.mean} sampai ${b.mean} memakan waktu berapa lama?`,
      vocab: ['v_kakarimasu', 'e_donogurai', a.id, b.id, 'p_kara', 'p_made'],
      slots: [
        slotParticle(0, 'から', 'p_kara'),
        slotParticle(1, 'まで', 'p_made'),
        slotQword(2, 'どのぐらい', 'e_donogurai'),
        slotPred(3, 'かかりますか', 'q_kakaruka'),
      ],
      tags: {
        bucket: 'q_waktu', pattern: 'q_donogurai_kakaru', bunpou: ['bp_donogurai', 'bp_kakarimasu'],
        refId: a.id, ref2Id: b.id, pol: 'q', isQuestion: true, tokens: tokens.length,
      },
    });
    if (s) out.push(s);
  }
  /* 6d. [orang]は [tempat/negara]に [durasi] います。 (例文①) */
  for (const nm of V_NAMES) {
    for (const placeId of ['n_nihon', 'n_daigaku', 'n_gakkou', 'n_kaisha', 'n_kuni', 'n_ryou', 'n_gaikoku', 'n_kurasu']) {
      const place = PLACE[placeId];
      for (const d of pickN(DURATIONS.filter(x => ['nen', 'kagetsu', 'shuukan'].includes(x.id)), 1, mulberry32(n_seed(nm.id, placeId) + 29))) {
        const dt = durTok(d);
        const tokens = [tok(nm, 'は'), tok(place, 'に'), dt, PRED.imasu];
        const s = mkSent(tokens, {
          idn: `${nm.mean} berada di ${place.mean} selama ${durMean(d)}.`,
          vocab: ['v_imasu', nm.jp === nm.jp ? '' : '', place.id, 'p_wa', 'p_ni', 'c_' + d.id, 'num_' + d.n].filter(Boolean),
          slots: [
            slotParticle(0, 'は', 'p_wa'),
            slotParticle(1, 'に', 'p_ni'),
            slotCount(2, dt.s, d.id, d.n),
            slotSuffix(2, COUNTER_KANJI[d.id], KANJI_NUM[d.n]),
            slotPred(3, 'います', 'pred_iru'),
          ],
          tags: {
            bucket: 'durasi', pattern: 'duration_imasu', bunpou: ['bp_durasi'], counter: d.id, n: d.n,
            placeId: place.id, placeMean: place.mean, pol: 'aff', living: true, tokens: tokens.length,
          },
        });
        if (s) out.push(s);
      }
    }
  }
  return out;
}

/* ---------- 7) ～だけ / ～ぐらい / frekuensi / pertanyaan jumlah ---------- */
function buildMisc() {
  const out = [];
  /* 7a. [orang]は [jumlah] だけ います。 */
  for (const [placeId, personId] of [['n_kyoushitsu', 'n_gakusei'], ['n_kouen', 'n_kodomo'], ['n_heya', 'n_tomodachi'], ['n_kaigishitsu', 'n_kaishain'], ['n_toshokan', 'n_ryuugakusei'], ['n_jimusho', 'n_kaishain']]) {
    for (const n of [1, 2, 3, 4]) {
      const place = PLACE[placeId], person = LIVE[personId];
      const cnt = countTok('nin', n);
      const tokens = [tok(place, 'に'), tok(person, 'が'), cnt, T('だけ', 'だけ', 'dake'), PRED.imasu];
      const s = mkSent(tokens, {
        idn: `Di ${place.mean} hanya ada ${n} ${person.mean}.`,
        vocab: ['v_imasu', place.id, person.id, 'e_dake', 'p_ni', 'p_ga', 'c_nin', 'num_' + n],
        slots: [
          slotParticle(0, 'に', 'p_ni'),
          slotParticle(1, 'が', 'p_ga'),
          slotCount(2, cnt.s, 'nin', n),
          slotFunc(3, 'だけ', 'f_dake'),
          slotPred(4, 'います', 'pred_iru'),
        ],
        tags: {
          bucket: 'dake', pattern: 'dake_count', bunpou: ['bp_dake', 'bp_nin'], counter: 'nin', n,
          placeId, subjId: personId, living: true, pol: 'aff', tokens: tokens.length,
        },
      });
      if (s) out.push(s);
    }
  }
  /* 7b. [orang]は [hari] だけ やすみます。 */
  for (const nm of V_NAMES) {
    for (const d of pickN(DURATIONS.filter(x => ['nichi', 'shuukan'].includes(x.id)), 2, mulberry32(n_seed(nm.id, 'yas') + 37))) {
      const dt = durTok(d);
      const tokens = [tok(nm, 'は'), dt, T('だけ', 'だけ', 'dake'), T('休みます', 'やすみます', 'yasumimasu')];
      const s = mkSent(tokens, {
        idn: `${nm.mean} libur hanya ${durMean(d)}.`,
        vocab: ['v_yasumimasu', 'e_dake', 'c_' + d.id, 'num_' + d.n],
        slots: [
          slotParticle(0, 'は', 'p_wa'),
          slotCount(1, dt.s, d.id, d.n),
          slotSuffix(1, COUNTER_KANJI[d.id], KANJI_NUM[d.n]),
          slotFunc(2, 'だけ', 'f_dake'),
          slotPred(3, '休みます', 'pred_yasumu'),
        ],
        tags: {
          bucket: 'dake', pattern: 'dake_yasumi', bunpou: ['bp_dake', 'bp_durasi'], counter: d.id, n: d.n,
          pol: 'aff', tokens: tokens.length,
        },
      });
      if (s) out.push(s);
    }
  }
  /* 7c. [surat]は [jumlah] だけ あります。 */
  for (const m of MAIL_ITEMS) {
    for (const n of [2, 3, 5]) {
      const cnt = countTok('mai', n);
      const tokens = [tok(W(m), 'は'), cnt, T('だけ', 'だけ', 'dake'), PRED.arimasu];
      const s = mkSent(tokens, {
        idn: `${W(m).mean} hanya ada ${n} lembar.`,
        vocab: ['v_arimasu', m, 'e_dake', 'p_wa', 'c_mai', 'num_' + n],
        slots: [
          slotParticle(0, 'は', 'p_wa'),
          slotCount(1, cnt.s, 'mai', n),
          slotSuffix(1, '枚', KANJI_NUM[n]),
          slotFunc(2, 'だけ', 'f_dake'),
          slotPred(3, 'あります', 'pred_aru'),
        ],
        tags: {
          bucket: 'dake', pattern: 'dake_thing', bunpou: ['bp_dake', 'bp_mai'], counter: 'mai', n,
          subjId: m, pol: 'aff', tokens: tokens.length,
        },
      });
      if (s) out.push(s);
    }
  }
  /* 7d. Frekuensi: [durasi]に [aktifitas]を [～回]ぐらい します。 */
  for (const d of pickN(DURATIONS.filter(x => ['shuukan', 'kagetsu', 'nen'].includes(x.id)), 4, mulberry32(97))) {
    for (const n of [1, 2, 3]) {
      const dt = durTok(d);
      const cnt = countTok('kai', n);
      const tokens = [tokT(dt, 'に'), tok(W('n_tenisu'), 'を'), cnt, T('ぐらい', 'ぐらい', 'gurai'), T('します', 'します', 'shimasu')];
      const s = mkSent(tokens, {
        idn: `Dalam ${durMean(d)} bermain tenis kira-kira ${n} kali.`,
        vocab: ['v_shimasu', 'n_tenisu', 'e_gurai', 'p_ni', 'p_o', 'c_kai', 'c_' + d.id, 'num_' + n, 'num_' + d.n],
        slots: [
          slotParticle(0, 'に', 'p_ni'),
          slotParticle(1, 'を', 'p_o'),
          slotCount(2, cnt.s, 'kai', n),
          slotSuffix(2, '回', KANJI_NUM[n]),
          slotFunc(3, 'ぐらい', 'f_gurai'),
          slotPred(4, 'します', 'pred_suru'),
        ],
        tags: {
          bucket: 'freq', pattern: 'freq_gurai', bunpou: ['bp_kai', 'bp_kai_gurai', 'bp_gurai'], counter: 'kai', n,
          pol: 'aff', tokens: tokens.length,
        },
      });
      if (s) out.push(s);
    }
  }
  /* 7e. Pertanyaan frekuensi: [durasi]に [aktifitas]を 何回 しますか。 */
  for (const d of pickN(DURATIONS.filter(x => ['shuukan', 'kagetsu'].includes(x.id)), 3, mulberry32(101))) {
    const dt = durTok(d);
    const tokens = [tokT(dt, 'に'), tok(W('n_tenisu'), 'を'), T('何回', 'なんかい', 'nan kai'), T('しますか', 'しますか', 'shimasu ka')];
    const s = mkSent(tokens, {
      idn: `Dalam ${durMean(d)} bermain tenis berapa kali?`,
      vocab: ['v_shimasu', 'n_tenisu', 'p_ni', 'p_o', 'c_kai', 'c_' + d.id, 'num_' + d.n],
      slots: [
        slotParticle(0, 'に', 'p_ni'),
        slotParticle(1, 'を', 'p_o'),
        slotQword(2, '何回', 'q_nankai'),
        slotPred(3, 'しますか', 'q_suruka'),
      ],
      tags: {
        bucket: 'q_waktu', pattern: 'q_nankai', bunpou: ['bp_kai_gurai', 'bp_kai'], counter: 'kai',
        pol: 'q', isQuestion: true, tokens: tokens.length,
      },
    });
    if (s) out.push(s);
  }
  /* 7f. Pertanyaan jumlah benda: [tempat]に [benda]が いくつ ありますか。 */
  for (const [placeId, thingId, counter] of [['n_suupaa', 'n_ringo', 'tsu'], ['n_uchi', 'n_mikan', 'tsu'], ['n_yuubinkyoku', 'n_kitte', 'mai'], ['n_kyoushitsu', 'n_isu', 'tsu'], ['n_heya', 'n_hon', 'tsu'], ['n_jimusho', 'n_hagaki', 'mai'], ['n_kaigishitsu', 'n_teeburu', 'dai'], ['n_shokudou', 'n_kareeraisu', 'tsu']]) {
    const place = PLACE[placeId], thing = W(thingId);
    const tokens = [tok(place, 'に'), tok(thing, 'が'), T('いくつ', 'いくつ', 'ikutsu'), existPredQ(false)];
    const s = mkSent(tokens, {
      idn: `Di ${place.mean} ada berapa ${thing.mean}?`,
      vocab: ['v_arimasu', place.id, thingId, 'e_ikutsu', 'p_ni', 'p_ga', 'c_' + counter],
      slots: [
        slotParticle(0, 'に', 'p_ni'),
        slotParticle(1, 'が', 'p_ga'),
        slotQword(2, 'いくつ', 'e_ikutsu'),
        slotPred(3, existPredQ(false).s, 'q_aruka'),
      ],
      tags: {
        bucket: 'q_count', pattern: 'q_ikutsu', bunpou: ['bp_ikutsu'], counter,
        placeId, subjId: thingId, living: false, pol: 'q', isQuestion: true, tokens: tokens.length,
      },
    });
    if (s) out.push(s);
  }
  /* 7g. Pertanyaan jumlah orang: [tempat]に [orang]が 何人 いますか。 */
  for (const [placeId, personId] of [['n_kyoushitsu', 'n_gakusei'], ['n_kouen', 'n_kodomo'], ['n_daigaku', 'n_ryuugakusei'], ['n_jimusho', 'n_kaishain'], ['n_kaigishitsu', 'n_kaishain'], ['n_toshokan', 'n_gakusei'], ['n_ryou', 'n_gakusei'], ['n_shokudou', 'n_gakusei']]) {
    const place = PLACE[placeId], person = LIVE[personId];
    const tokens = [tok(place, 'に'), tok(person, 'が'), T('何人', 'なんにん', 'nan nin'), existPredQ(true)];
    const s = mkSent(tokens, {
      idn: `Di ${place.mean} ada berapa ${person.mean}?`,
      vocab: ['v_imasu', place.id, personId, 'e_nannin', 'p_ni', 'p_ga', 'c_nin'],
      slots: [
        slotParticle(0, 'に', 'p_ni'),
        slotParticle(1, 'が', 'p_ga'),
        slotQword(2, '何人', 'e_nannin'),
        slotPred(3, existPredQ(true).s, 'q_iruka'),
      ],
      tags: {
        bucket: 'q_count', pattern: 'q_nannin_place', bunpou: ['bp_nannin'], counter: 'nin',
        placeId, subjId: personId, living: true, pol: 'q', isQuestion: true, tokens: tokens.length,
      },
    });
    if (s) out.push(s);
  }
  /* 7h. どのぐらい + いますか */
  for (const placeId of ['n_nihon', 'n_daigaku', 'n_kaisha', 'n_gakkou', 'n_gaikoku']) {
    const place = PLACE[placeId];
    for (const nm of pickN(V_NAMES, 2, mulberry32(n_seed(placeId, 'dg') + 41))) {
      const tokens = [tok(nm, 'は'), tok(place, 'に'), T('どのぐらい', 'どのぐらい', 'dono gurai'), T('いますか', 'いますか', 'imasu ka')];
      const s = mkSent(tokens, {
        idn: `${nm.mean} berapa lama di ${place.mean}?`,
        vocab: ['v_imasu', 'e_donogurai', place.id, 'p_wa', 'p_ni'],
        slots: [
          slotParticle(0, 'は', 'p_wa'),
          slotParticle(1, 'に', 'p_ni'),
          slotQword(2, 'どのぐらい', 'e_donogurai'),
          slotPred(3, 'いますか', 'q_iruka'),
        ],
        tags: {
          bucket: 'q_waktu', pattern: 'q_donogurai_imasu', bunpou: ['bp_donogurai', 'bp_durasi'],
          placeId, pol: 'q', isQuestion: true, living: true, tokens: tokens.length,
        },
      });
      if (s) out.push(s);
    }
  }
  return out;
}

/* --- Gabungkan bank --- */
const bankRnd = mulberry32(20261016);
const SENT_BANK = [
  ...buildQtyThings(),
  ...buildQtyPeople(),
  ...buildQtyPos(),
  ...buildFamily(),
  ...buildPostal(),
  ...buildKakarimasu(),
  ...buildMisc(),
];
const BUCKET_POOL = {};
for (const s of SENT_BANK) {
  const b = s.tags.bucket;
  (BUCKET_POOL[b] = BUCKET_POOL[b] || []).push(s);
}

/* ==========================================================================
 * BAGIAN 4 — PERCAKAPAN (short_conversation)
 *   Konteks nyata: kantor pos, keluarga, toko, sekolah, perjalanan.
 *   Near-duplicate dijaga lewat sidik jari parameter (hanya boleh beda >= 2
 *   parameter) + kalimat persis (SEEN_JP).
 * ========================================================================*/
function A(t, id) { return { speaker: 'A', text: t, id }; }
function B(t, id) { return { speaker: 'B', text: t, id }; }
const CONV_INSTR = 'Bacalah percakapan pendek berikut lalu jawab pertanyaannya.';
const BLANK = '＿＿＿';
/* Near-duplicate percakapan:
 *   - parameter numerik (ditandai awalan '#') boleh berbeda sendirian — variasi
 *     angka pada drill counter punya tujuan pembelajaran yang jelas.
 *   - parameter non-numerik tidak boleh hanya berbeda SATU slot tanpa perbedaan
 *     lain (aturan near-duplicate yang sama dengan bank kalimat). */
const CONV_ACCEPTED = new Map(); /* template -> [params[]] */
function isNumParam(p) { return String(p).startsWith('#'); }
function convUnique(template, params) {
  const list = CONV_ACCEPTED.get(template) || [];
  for (const u of list) {
    if (u.length !== params.length) continue;
    let nonnumDiff = 0, numDiff = 0;
    for (let i = 0; i < u.length; i++) {
      if (u[i] === params[i]) continue;
      if (isNumParam(u[i]) || isNumParam(params[i])) numDiff++;
      else nonnumDiff++;
    }
    if (nonnumDiff === 0 && numDiff === 0) return false;               /* kembar */
    if (nonnumDiff === 1 && numDiff === 0) return false;               /* beda 1 kata */
    if (nonnumDiff === 1 && numDiff >= 1 && numDiff <= 2 && u.length <= 3) {
      /* 1 non-numerik + numerik = beda 2 kata -> boleh */
    }
  }
  list.push(params.slice());
  CONV_ACCEPTED.set(template, list);
  return true;
}

function buildConversations() {
  const list = [];
  const add = (bucket, build, minLevel) => list.push({ bucket, build, minLevel: minLevel || 1 });

  /* 1. Jumlah anggota keluarga */
  for (const nm of V_NAMES) {
    for (const famId of ['n_kyoudai', 'n_shimai']) {
      for (const n of [2, 3, 4, 5]) {
        if (!convUnique('fam_q', [nm.id, famId, '#' + n])) continue;
        const fam = FAM[famId];
        add('family', () => ({
          dialogue: [A(`${nm.jp}の ${fam.jp}は 何人 ですか。`, `${fam.mean} ${nm.mean} berapa orang?`), B(BLANK, `${fam.mean}-nya ${n} orang.`)],
          question: `Pilih jawaban B yang tepat (${fam.mean} ${nm.mean} ${n} orang):`,
          options: uniq([`${countTok('nin', n).s} です。`, `${countTok('nin', n === 2 ? 3 : 2).s} です。`, `${countTok('tsu', n).s} です。`, `みんな です。`]),
          answer: `${countTok('nin', n).s} です。`,
          answerId: `${fam.mean}-nya ${n} orang.`,
          vocab: [fam.id, 'e_nannin', 'c_nin', 'num_' + n],
        }));
      }
    }
  }

  /* 2. Jumlah benda di tempat (いくつ) */
  for (const [placeId, thingId, counter] of [
    ['n_suupaa', 'n_ringo', 'tsu'], ['n_uchi', 'n_mikan', 'tsu'], ['n_yuubinkyoku', 'n_kitte', 'mai'],
    ['n_kyoushitsu', 'n_isu', 'tsu'], ['n_jimusho', 'n_hagaki', 'mai'], ['n_heya', 'n_hon', 'tsu'],
    ['n_kaigishitsu', 'n_teeburu', 'dai'], ['n_shokudou', 'n_sandoicchi', 'tsu'], ['n_honya', 'n_zasshi', 'tsu'],
    ['n_depaato', 'n_kamera', 'dai'], ['n_ryou', 'n_beddo', 'tsu'], ['n_konbini', 'n_aisukuriimu', 'tsu'],
  ]) {
    for (const n of [2, 3, 4, 5, 7, 8, 10]) {
      if (!convUnique('ikutsu_q', [placeId, thingId, '#' + n])) continue;
      const place = PLACE[placeId], thing = W(thingId);
      add('q_count', () => ({
        dialogue: [A(`${place.jp}に ${thing.jp}が いくつ ありますか。`, `Di ${place.mean} ada berapa ${thing.mean}?`), B(BLANK, `Ada ${cntMean(counter, n)}.`)],
        question: `Pilih jawaban B yang tepat (${thing.mean} di ${place.mean}: ${cntMean(counter, n)}):`,
        options: uniq([`${countTok(counter, n).s} あります。`, `${countTok(counter, n === 2 ? 3 : 2).s} あります。`,
                        `${countTok(counter === 'tsu' ? 'nin' : 'tsu', n).s} います。`, `いいえ、ありません。`]),
        answer: `${countTok(counter, n).s} あります。`,
        answerId: `Ada ${cntMean(counter, n)}.`,
        vocab: [place.id, thingId, 'e_ikutsu', 'v_arimasu', 'c_' + counter, 'num_' + n],
      }), 1);
    }
  }

  /* 3. Jumlah orang (何人) + みんな */
  for (const [placeId, personId] of [
    ['n_kyoushitsu', 'n_gakusei'], ['n_kouen', 'n_kodomo'], ['n_daigaku', 'n_ryuugakusei'],
    ['n_jimusho', 'n_kaishain'], ['n_toshokan', 'n_gakusei'], ['n_kouen', 'n_otokonoko'],
  ]) {
    for (const n of [2, 3, 4, 5, 8]) {
      if (!convUnique('nannin_q', [placeId, personId, '#' + n])) continue;
      const place = PLACE[placeId], person = LIVE[personId];
      add('q_count', () => ({
        dialogue: [A(`${place.jp}に ${person.jp}が 何人 いますか。`, `Di ${place.mean} ada berapa ${person.mean}?`), B(BLANK, `Ada ${n} orang. Semuanya ${person.mean}.`)],
        question: `Pilih jawaban B yang tepat (di ${place.mean} ada ${n} ${person.mean}):`,
        options: uniq([`${countTok('nin', n).s} います。みんな ${person.jp}です。`, `${countTok('nin', n).s} あります。`, `${countTok('nin', n === 2 ? 4 : 2).s} います。`, `だれも いません。`]),
        answer: `${countTok('nin', n).s} います。みんな ${person.jp}です。`,
        answerId: `Ada ${n} orang. Semuanya ${person.mean}.`,
        vocab: [place.id, personId, 'e_nannin', 'e_minna', 'v_imasu', 'c_nin', 'num_' + n],
      }), 1);
    }
  }

  /* 4. Pesanan di kantor pos + total (例文②) */
  for (const [m1, m2, n1, n2, yen] of [
    ['n_kitte', 'n_hagaki', 5, 2, 500], ['n_kitte', 'n_fuutou', 3, 4, 1000], ['n_hagaki', 'n_fuutou', 2, 5, 500],
    ['n_kitte', 'n_hagaki', 4, 3, 1000], ['n_kitte', 'n_fuutou', 2, 2, 500], ['n_hagaki', 'n_kitte', 6, 2, 1000],
    ['n_kitte', 'n_hagaki', 3, 5, 1000], ['n_fuutou', 'n_kitte', 4, 2, 500], ['n_hagaki', 'n_fuutou', 3, 3, 500],
  ]) {
    if (!convUnique('order_zb', [m1, m2, '#' + n1, '#' + n2, '#' + yen])) continue;
    const a = W(m1), b = W(m2);
    add('order', () => ({
      dialogue: [
        A(`${a.jp}を ${countTok('mai', n1).s} と ${b.jp}を ${countTok('mai', n2).s} ください。`, `Tolong berikan ${n1} ${a.mean} dan ${n2} ${b.mean}.`),
        B(BLANK, `Ya. Semuanya ${yen} yen.`),
      ],
      question: `Pilih jawaban B yang tepat (semuanya ${yen} yen):`,
      options: uniq([`はい。全部で ${EN_KANJI[yen]} です。`, `はい。${countTok('mai', n2).s} だけ です。`,
                      `いいえ。全部で ${EN_KANJI[yen === 500 ? 1000 : 500]} です。`, `かしこまりました。`]),
      answer: `はい。全部で ${EN_KANJI[yen]} です。`,
      answerId: `Ya. Semuanya ${yen} yen.`,
      vocab: [m1, m2, 'v_kudasai', 'e_zenbude', 'c_mai', 'c_en', 'num_' + n1, 'num_' + n2],
    }), 11);
  }

  /* 5. Kirim paket: 船便 / 航空便 (会話) */
  for (const country of ['e_oosutoraria', 'n_gaikoku']) {
    for (const [method, dur] of [['n_funabin', { id: 'kagetsu', n: 2 }], ['n_kuukubin', { id: 'nichi', n: 7 }],
                                  ['n_funabin', { id: 'kagetsu', n: 3 }], ['n_kuukubin', { id: 'nichi', n: 3 }],
                                  ['n_funabin', { id: 'kagetsu', n: 1 }], ['n_kuukubin', { id: 'nichi', n: 10 }]]) {
      if (!convUnique('haisin', [country, method, dur.id + '#' + dur.n])) continue;
      const m = W(method), dt = durTok(dur);
      add('kakaru', () => ({
        dialogue: [
          A(`これ、${W(country).jp}まで お願いします。`, `Ini, tolong kirim ke ${W(country).mean}.`),
          B(BLANK, `Baik. Dengan ${m.mean}, ${durMean(dur)}.`),
        ],
        question: `Pilih jawaban B yang tepat (kirim ke ${W(country).mean} dengan ${m.mean}, ${durMean(dur)}):`,
        options: uniq([`はい。${m.jp}で ${dt.s} ぐらい です。`, `はい。${m.jp}で ${countTok('jikan', 2).s} ぐらい です。`,
                        `はい。${W(method === 'n_funabin' ? 'n_kuukubin' : 'n_funabin').jp}で ${dt.s} ぐらい です。`,
                        `いいえ、かしこまりました。`]),
        answer: `はい。${m.jp}で ${dt.s} ぐらい です。`,
        answerId: `Baik. Dengan ${m.mean}, ${durMean(dur)}.`,
        vocab: ['e_onegai', country, method, 'e_gurai', 'p_de', 'c_' + dur.id, 'num_' + dur.n],
      }), 11);
    }
  }

  /* 6. Berapa lama perjalanan (どのぐらい かかりますか) */
  for (const [fromId, toId, dur] of [
    ['n_uchi', 'n_gakkou', { id: 'jikan', n: 1 }], ['n_eki', 'n_daigaku', { id: 'fun', n: 10 }],
    ['n_uchi', 'n_eki', { id: 'fun', n: 5 }], ['n_daigaku', 'n_depaato', { id: 'fun', n: 20 }],
    ['n_uchi', 'n_byouin', { id: 'jikan', n: 2 }], ['n_gakkou', 'n_toshokan', { id: 'fun', n: 5 }],
    ['n_eki', 'n_kuukou', { id: 'jikan', n: 3 }], ['n_kaisha', 'n_uchi', { id: 'jikan', n: 1 }],
    ['n_daigaku', 'n_yuubinkyoku', { id: 'fun', n: 10 }], ['n_ryou', 'n_daigaku', { id: 'fun', n: 20 }],
  ]) {
    if (!convUnique('dono_kakaru', [fromId, toId, dur.id + '#' + dur.n])) continue;
    const a = PLACE[fromId], b = PLACE[toId], dt = durTok(dur);
    add('kakaru', () => ({
      dialogue: [
        A(`${a.jp}から ${b.jp}まで どのぐらい かかりますか。`, `Dari ${a.mean} sampai ${b.mean} memakan waktu berapa lama?`),
        B(BLANK, `Kira-kira ${durMean(dur)}.`),
      ],
      question: `Pilih jawaban B yang tepat (dari ${a.mean} sampai ${b.mean} kira-kira ${durMean(dur)}):`,
      options: uniq([`${dt.s} ぐらい かかります。`, `${countTok('nin', 2).s} ぐらい います。`,
                      `${dt.s} だけ かかります。`, `${durTok({ id: dur.id === 'jikan' ? 'nen' : 'jikan', n: 2 }).s} ぐらい かかります。`]),
      answer: `${dt.s} ぐらい かかります。`,
      answerId: `Kira-kira ${durMean(dur)}.`,
      vocab: [fromId, toId, 'v_kakarimasu', 'e_donogurai', 'e_gurai', 'p_kara', 'p_made', 'c_' + dur.id, 'num_' + dur.n],
    }), 11);
  }

  /* 7. Sapaan kantor pos (会話「これ、お願いします」) */
  for (const [target, method] of [['n_funabin', 'n_funabin'], ['n_kuukubin', 'n_kuukubin'], ['n_sokutatsu', 'n_sokutatsu'], ['n_kakitome', 'n_kakitome']]) {
    if (!convUnique('aiw_sapa', [target, method])) continue;
    const m = W(method);
    add('order', () => ({
      dialogue: [
        A(`いい 天気ですね。お出かけですか。`, 'Cuacanya bagus ya. Mau keluar?'),
        B(BLANK, `Ya, sebentar ke kantor pos. Ini, tolong dengan ${m.mean}.`),
      ],
      question: `Pilih jawaban B yang tepat (ke kantor pos, minta ${m.mean}):`,
      options: uniq([`ええ、ちょっと 郵便局まで。${m.jp}で お願いします。`,
                      `いいえ、ちょっと 学校まで。`,
                      `ええ、ちょっと 郵便局まで。${W(target === 'n_funabin' ? 'n_kuukubin' : 'n_funabin').jp}で お願いします。`,
                      `いってらっしゃい。`]),
      answer: `ええ、ちょっと 郵便局まで。${m.jp}で お願いします。`,
      answerId: `Ya, sebentar ke kantor pos. Ini, tolong dengan ${m.mean}.`,
      vocab: ['e_iitenki', 'e_odekake', 'e_chottomade', 'e_onegai', method, 'n_yuubinkyoku'],
    }), 11);
  }

  /* 8. ～だけ (hanya) */
  for (const [item, counter, n] of [['n_kitte', 'mai', 2], ['n_hagaki', 'mai', 3], ['n_ringo', 'tsu', 2],
                                     ['n_sandoicchi', 'tsu', 1], ['n_fuutou', 'mai', 3], ['n_aisukuriimu', 'tsu', 1],
                                     ['n_ringo', 'tsu', 3], ['n_hagaki', 'mai', 1], ['n_kareeraisu', 'tsu', 2]]) {
    if (!convUnique('dake_q', [item, counter, '#' + n])) continue;
    const it = W(item), cnt = countTok(counter, n);
    add('dake', () => ({
      dialogue: [
        A(`${it.jp}を ${cnt.s} だけ ください。`, `Tolong berikan ${cntMean(counter, n)} ${it.mean} saja.`),
        B(BLANK, 'Baik, dengan senang hati.'),
      ],
      question: `Pilih jawaban B yang tepat (jawaban untuk permintaan "${it.mean} ${cntMean(counter, n)} saja"):`,
      options: uniq([`はい、かしこまりました。`, `いいえ、かしこまりました。`, `はい、${cnt.s} あります。`, `ええ、ちょっと だけ。`]),
      answer: 'はい、かしこまりました。',
      answerId: 'Baik, dengan senang hati.',
      vocab: [item, 'e_dake', 'e_kashikomari', 'v_kudasai', 'c_' + counter, 'num_' + n],
    }), 11);
  }

  /* 9. libur (休みます) */
  for (const [nm, d] of [['nm_yamada', { id: 'nichi', n: 3 }], ['nm_watto', { id: 'nichi', n: 2 }],
                          ['nm_kimu', { id: 'shuukan', n: 1 }], ['nm_santosu', { id: 'nichi', n: 7 }],
                          ['nm_matsumoto', { id: 'shuukan', n: 2 }], ['nm_tanaka', { id: 'nichi', n: 5 }], ['nm_miraa', { id: 'kagetsu', n: 1 }]]) {
    if (!convUnique('yasumi', [nm, d.id + '#' + d.n])) continue;
    const dt = durTok(d);
    add('durasi', () => ({
      dialogue: [
        A(`${W(nm).jp}は ${dt.s} だけ やすみます。`, `${W(nm).mean} libur hanya ${durMean(d)}.`),
        B(BLANK, 'Oh, begitu ya.'),
      ],
      question: `Pilih jawaban B yang tepat (menanggapi "${W(nm).mean} libur hanya ${durMean(d)}"):`,
      options: uniq([`そうですか。`, `かしこまりました。`, `いいえ、そうです。`, `どのぐらい ですか。`]),
      answer: 'そうですか。',
      answerId: 'Oh, begitu ya.',
      vocab: [nm, 'v_yasumimasu', 'e_dake', 'e_soudesuka', 'c_' + d.id, 'num_' + d.n],
    }), 11);
  }

  /* 10. Berapa orang kakak (family two-part answer, 例文④) */
  for (const [nm, f1, f2, n1, n2] of [
    ['nm_yamada', 'n_ane', 'n_ani', 2, 1], ['nm_matsumoto', 'n_imouto', 'n_otouto', 1, 2],
    ['nm_kimu', 'n_oneesan', 'n_otoutosan', 1, 1], ['nm_karina', 'n_imoutosan', 'n_otoutosan', 2, 1],
    ['nm_rin', 'n_ani', 'n_imouto', 1, 3], ['nm_tanaka', 'n_ane', 'n_otouto', 3, 1],
    ['nm_miraa', 'n_imouto', 'n_otouto', 2, 2], ['nm_watto', 'n_oneesan', 'n_otoutosan', 1, 2],
    ['nm_yamada', 'n_ryoushin', 'n_ani', 2, 1], ['nm_matsumoto', 'n_oneesan', 'n_otouto', 2, 1],
    ['nm_kimu', 'n_ryoushin', 'n_imouto', 2, 2], ['nm_santosu', 'n_oneesan', 'n_ani', 3, 1],
  ]) {
    if (!convUnique('fam_two', [nm, f1, f2, '#' + n1, '#' + n2])) continue;
    const a = FAM[f1], b = FAM[f2];
    add('family', () => ({
      dialogue: [
        A(`${W(nm).jp}の 兄弟は 何人 ですか。`, `Saudara kandung ${W(nm).mean} berapa orang?`),
        B(BLANK, `${n1 + n2} orang. Ada ${n1} ${a.mean} dan ${n2} ${b.mean}.`),
      ],
      question: `Pilih jawaban B yang tepat (${n1 + n2} orang: ${n1} ${a.mean} dan ${n2} ${b.mean}):`,
      options: uniq([
        `${countTok('nin', n1 + n2).s} です。${a.jp}が ${countTok('nin', n1).s} と ${b.jp}が ${countTok('nin', n2).s} います。`,
        `${countTok('nin', n1 + n2).s} です。${a.jp}が ${countTok('nin', n2).s} と ${b.jp}が ${countTok('nin', n1).s} います。`,
        `${countTok('tsu', n1 + n2).s} です。`,
        `だれも いません。`,
      ]),
      answer: `${n1 + n2}人 です。${a.jp}が ${countTok('nin', n1).s} と ${b.jp}が ${countTok('nin', n2).s} います。`,
      answerId: `${n1 + n2} orang. Ada ${n1} ${a.mean} dan ${n2} ${b.mean}.`,
      vocab: [nm, 'n_kyoudai', f1, f2, 'e_nannin', 'c_nin', 'num_' + n1, 'num_' + n2, 'num_' + (n1 + n2)],
    }), 11);
  }

  /* 11. Konfirmasi total belanja (いくつ + 全部で) */
  for (const [item, counter, n, yen] of [['n_ringo', 'tsu', 5, 500], ['n_mikan', 'tsu', 7, 500],
                                          ['n_aisukuriimu', 'tsu', 3, 300], ['n_sandoicchi', 'tsu', 2, 500],
                                          ['n_kareeraisu', 'tsu', 2, 1000], ['n_mikan', 'tsu', 5, 500]]) {
    if (!convUnique('belanja', [item, counter, '#' + n, '#' + yen])) continue;
    const it = W(item), cnt = countTok(counter, n);
    add('price', () => ({
      dialogue: [
        A(`${it.jp}を ${cnt.s} ください。`, `Tolong berikan ${cntMean(counter, n)} ${it.mean}.`),
        B(BLANK, `Ya. Semuanya ${yen} yen.`),
      ],
      question: `Pilih jawaban B yang tepat (semuanya ${yen} yen):`,
      options: uniq([`はい。全部で ${EN_KANJI[yen]} です。`, `はい。全部で ${EN_KANJI[yen === 500 ? 1000 : 500]} です。`,
                      `はい。${cnt.s} だけ です。`, `いいえ。全部で です。`]),
      answer: `はい。全部で ${EN_KANJI[yen]} です。`,
      answerId: `Ya. Semuanya ${yen} yen.`,
      vocab: [item, 'v_kudasai', 'e_zenbude', 'c_en', 'c_' + counter, 'num_' + n],
    }), 11);
  }

  return list;
}
const CONV_TEMPLATES = buildConversations();

/* ==========================================================================
 * BAGIAN 5 — SILABUS 30 LEVEL (kuota tipe per level: largest-remainder)
 *   1–10   mudah    : counter dasar ～つ / ～人 / ～枚 / ～台 + あります/います
 *   11–20  sedang   : pesanan ～と…ください, かかります, どのぐらい, ～だけ, 全部で
 *   21–25  kalimat  : keluarga + jumlah, durasi panjang, ～ぐらい, 何回
 *   26–30  campuran : seluruh pola, kalimat panjang, percakapan kompleks
 * ========================================================================*/
const TIERS = [
  {
    max: 10, key: 'mudah',
    focus: 'Counter dasar ～つ / ～人 / ～枚 / ～台 + あります / います + いくつ / 何人',
    plan: { qty_thing: 4, qty_people: 4, qty_pos: 2, family: 2, order: 1, price: 1, q_count: 1 },
    maxTokens: 4, options: 3, extraTiles: 0,
    buckets: ['qty_thing', 'qty_people', 'qty_pos', 'family', 'order', 'price', 'q_count', 'qty_neg'],
    typeWeights: { complete: 22, match: 10, choose_translation: 16, arrange: 18, listening: 12, short_conversation: 12, translate: 10 },
  },
  {
    max: 20, key: 'sedang',
    focus: 'Pesanan ～と…ください · かかります · どのぐらい · ～だけ · 全部で · durasi',
    plan: { order: 3, kakaru: 2, durasi: 2, dake: 2, price: 2, q_count: 1, q_waktu: 1, qty_thing: 1 },
    maxTokens: 5, options: 3, extraTiles: 1,
    buckets: ['order', 'kakaru', 'durasi', 'dake', 'price', 'q_count', 'q_waktu', 'qty_thing', 'qty_people', 'family', 'qty_pos', 'qty_neg'],
    typeWeights: { complete: 20, match: 10, choose_translation: 14, arrange: 16, listening: 12, short_conversation: 16, translate: 12 },
  },
  {
    max: 25, key: 'kalimat',
    focus: 'Keluarga + jumlah · ～ぐらい · 何回 ～ぐらい · kalimat counter panjang',
    plan: { family: 2, freq: 2, kakaru: 2, dake: 2, durasi: 1, q_waktu: 2, order: 1, q_count: 1, price: 1, qty_pos: 1 },
    maxTokens: 6, options: 3, extraTiles: 1,
    buckets: ['family', 'freq', 'kakaru', 'dake', 'durasi', 'q_waktu', 'order', 'q_count', 'price', 'qty_pos', 'qty_thing', 'qty_people', 'qty_neg'],
    typeWeights: { complete: 18, match: 10, choose_translation: 12, arrange: 18, listening: 14, short_conversation: 16, translate: 12 },
  },
  {
    max: 30, key: 'campuran',
    focus: 'Ujian campuran seluruh pola Bab 11: kalimat panjang + pengecoh menjebak',
    plan: { kakaru: 2, freq: 2, family: 2, order: 2, dake: 1, durasi: 1, price: 1, q_waktu: 1, q_count: 1, qty_pos: 1, qty_thing: 1 },
    maxTokens: 7, options: 4, extraTiles: 2,
    buckets: ['kakaru', 'freq', 'family', 'order', 'dake', 'durasi', 'price', 'q_waktu', 'q_count', 'qty_pos', 'qty_thing', 'qty_people', 'qty_neg'],
    typeWeights: { complete: 18, match: 10, choose_translation: 12, arrange: 16, listening: 14, short_conversation: 18, translate: 12 },
  },
];
function getSyllabus(level) {
  return TIERS.find(t => level <= t.max) || TIERS[TIERS.length - 1];
}
function tierOfLevel(level) {
  const t = getSyllabus(level);
  return ['mudah', 'sedang', 'kalimat', 'campuran'].indexOf(t.key) + 1;
}

/* Target global tipe soal (proporsi sama dengan generate_bab10.js, diskalakan ke 450) */
const TYPE_TARGETS = {
  complete: 180, arrange: 170, short_conversation: 160, listening: 130,
  translate: 130, choose_translation: 130, match: 100,
};
const TYPE_ORDER = ['complete', 'arrange', 'short_conversation', 'listening', 'translate', 'choose_translation', 'match'];
const TOTAL_LEVELS = 30;
const QUESTIONS_PER_LEVEL = 15;

/* Largest-remainder: proporsi per level, dibulatkan kumulatif agar total
 * per tipe mendekati target global. */
function allocateTypesPerLevel() {
  const weightSum = TYPE_ORDER.reduce((a, t) => a + TYPE_TARGETS[t], 0);
  const f = L => {
    const ideal = {}, base = {};
    let used = 0;
    for (const t of TYPE_ORDER) {
      const v = TYPE_TARGETS[t] * (L * QUESTIONS_PER_LEVEL) / weightSum;
      ideal[t] = v; base[t] = Math.floor(v); used += base[t];
    }
    const want = L * QUESTIONS_PER_LEVEL;
    const rem = TYPE_ORDER.map((t, i) => ({ t, r: ideal[t] - base[t], i }))
      .sort((a, b) => (b.r - a.r) || ((a.i + L) % TYPE_ORDER.length) - ((b.i + L) % TYPE_ORDER.length));
    let k = 0;
    while (used < want) { base[rem[k % rem.length].t]++; used++; k++; }
    return base;
  };
  const quotas = [];
  let prev = f(0);
  for (let L = 1; L <= TOTAL_LEVELS; L++) {
    const cur = f(L);
    const q = {};
    for (const t of TYPE_ORDER) q[t] = cur[t] - prev[t];
    prev = cur;
    quotas.push(q);
  }
  return quotas;
}
const LEVEL_TYPE_QUOTA = allocateTypesPerLevel();

/* ==========================================================================
 * BAGIAN 6 — PENGECOH (distraktor)
 * ========================================================================*/
const PARTICLE_POOL_BY_CLS = {
  p_ni: ['が', 'を', 'と', 'も'],
  p_ga: ['に', 'の', 'を', 'と'],
  p_wa: ['に', 'が', 'と', 'も'],
  p_no: ['に', 'が', 'を', 'も'],
  p_o: ['に', 'が', 'と', 'も'],
  p_to: ['や', 'に', 'の', 'も'],
  p_kara: ['まで', 'に', 'で', 'と'],
  p_made: ['から', 'に', 'で', 'と'],
  p_de: ['に', 'から', 'まで', 'と'],
};
const PRED_POOL_BY_CLS = {
  pred_aru:    ['います', 'ありません', 'です'],
  pred_arenai: ['あります', 'いません', 'です'],
  pred_iru:    ['あります', 'いません', 'です'],
  pred_inai:   ['います', 'ありません', 'です'],
  pred_kakaru: ['かかりません', 'います', 'あります'],
  pred_suru:   ['しますか', 'しません', 'あります'],
  pred_yasumu: ['やすみません', 'あります', 'います'],
  pred_desu:   ['あります', 'います', 'だけ'],
  q_aruka:     ['いますか', 'ありません', 'あります'],
  q_iruka:     ['ありますか', 'いません', 'います'],
  q_kakaruka:  ['かかります', 'いますか', 'だけ'],
  q_suruka:    ['します', 'ぐらい', 'ありますか'],
  q_desuka:    ['います', 'あります', 'だけ'],
};
const QWORD_POOL = ['いくつ', '何人', 'どのぐらい', '何回', '何'];
const FUNC_POOL_BY_CLS = {
  f_gurai: ['だけ', 'から', 'まで', 'と'],
  f_dake: ['ぐらい', 'から', 'まで', 'と'],
  f_kudasai: ['あります', 'います', 'します'],
  f_zenbude: ['みんな', 'だけ', 'ぐらい', 'と'],
};
const COUNT_SAME = {};  /* counter -> angka yang lazim dipakai untuk pengecoh */
const SUFFIX_POOL = ['つ', '人', '台', '枚', '回', '個', '本', '分', '時間', '週間', 'か月', '年', '日', '番'];
function counterOfSentence(tags) {
  return tags && tags.counter;
}
function countDistractors(counter, n, rnd) {
  const pool = [];
  for (const m of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    if (m === n) continue;
    pool.push(countTok(counter, m).s);
    if (pool.length >= 6) break;
  }
  for (const c2 of ['tsu', 'nin', 'mai', 'dai', 'kai']) {
    if (c2 === counter) continue;
    pool.push(countTok(c2, n).s);
    if (pool.length >= 10) break;
  }
  return pool;
}
function mkOptions(answer, pool, syl, rnd) {
  const d = pickN(pool.filter(x => x !== answer), Math.max(2, syl.options - 1), rnd);
  const options = shuffle(uniq([answer, ...d]), rnd);
  return options.length >= 3 ? options : null;
}

/* ==========================================================================
 * BAGIAN 7 — GENERATOR PER TIPE SOAL (skema = js/questions.js)
 * ========================================================================*/
let qIdCounter = 1;
const PENDING_ID = 'q_b11_pending';
function nextId() { return `q_b11_${qIdCounter++}`; }

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

/* --- 1) ARRANGE --- */
function genArrange(sentence, syl, rnd) {
  const tokens = tileTokens(sentence);
  if (tokens.length < 3) return null;
  /* tiles wajib unik — kalimat dengan permukaan token kembar dilewati */
  if (new Set(tokens).size !== tokens.length) return null;
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

/* --- 2) TRANSLATE --- */
function extraTilesFor(sentence, syl, rnd, count) {
  const t = sentence.tags;
  const pool = ['あります', 'います', 'ください', 'だけ', 'ぐらい', 'です'];
  if (t.counter) {
    pool.push(...pickN([[1], [2], [3], [5], [8]].map(([m]) => countTok(t.counter, m).s), 2, rnd));
    pool.push(...pickN(['nin', 'mai', 'dai', 'tsu'].filter(c => c !== t.counter).map(c => countTok(c, 3).s), 2, rnd));
  }
  pool.push('全部で', 'どのぐらい', 'いくつ', '何人');
  return pickN(uniq(pool).filter(x => !sentence.tokens.some(tk => tk.s === x)), count, rnd);
}
function genTranslate(sentence, syl, rnd) {
  const tokens = tileTokens(sentence);
  if (tokens.length < 3) return null;
  if (new Set(tokens).size !== tokens.length) return null; /* tiles unik */
  let tiles = tokens.slice();
  if (syl.extraTiles > 0) {
    tiles = [...tokens, ...extraTilesFor(sentence, syl, rnd, Math.min(syl.extraTiles, 2))];
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

/* --- 3) COMPLETE --- */
function slotAllowed(sl, syl) {
  if (sl.kind === 'qword') return syl.level >= 6;
  if (sl.kind === 'func') return syl.level >= 11;
  return true;
}
function genComplete(sentence, syl, rnd) {
  const tokens = tileTokens(sentence);
  if (tokens.length < 3) return null;
  const usable = sentence.slots.filter(sl => slotAllowed(sl, syl));
  if (!usable.length) return null;
  const preferOrder = ['count', 'suffix', 'qword', 'func', 'particle', 'predicate'];
  const cands = shuffle(usable, rnd).sort((a, b) => preferOrder.indexOf(a.kind) - preferOrder.indexOf(b.kind));
  const slot = cands[0];
  const promptTokens = tokens.slice();
  const raw = promptTokens[slot.tokIndex];
  let answer = null, options = null, instruction = '';

  if (slot.kind === 'particle') {
    if (!raw.endsWith(slot.answer)) return null;
    promptTokens[slot.tokIndex] = raw.slice(0, -slot.answer.length) + BLANK;
    answer = slot.answer;
    options = mkOptions(answer, PARTICLE_POOL_BY_CLS[slot.cls] || ['に', 'が', 'は', 'の'], syl, rnd);
    instruction = 'Lengkapi kalimat berikut dengan partikel yang tepat.';
  } else if (slot.kind === 'count') {
    if (raw !== slot.answer) return null;
    promptTokens[slot.tokIndex] = BLANK;
    answer = slot.answer;
    options = mkOptions(answer, countDistractors(slot.counterId, slot.n, rnd), syl, rnd);
    instruction = 'Lengkapi kalimat berikut dengan bilangan + kata bantu yang tepat.';
  } else if (slot.kind === 'suffix') {
    if (!raw.endsWith(slot.answer) || !raw.startsWith(slot.numeral)) return null;
    promptTokens[slot.tokIndex] = slot.numeral + BLANK;
    answer = slot.answer;
    options = mkOptions(answer, SUFFIX_POOL, syl, rnd);
    instruction = 'Lengkapi kalimat berikut dengan kata bantu bilangan yang tepat.';
  } else if (slot.kind === 'qword') {
    if (!raw.startsWith(slot.answer)) return null;
    promptTokens[slot.tokIndex] = BLANK + raw.slice(slot.answer.length);
    answer = slot.answer;
    options = mkOptions(answer, QWORD_POOL, syl, rnd);
    instruction = 'Lengkapi pertanyaan berikut dengan kata tanya yang tepat.';
  } else if (slot.kind === 'func') {
    if (raw !== slot.answer && !raw.endsWith(slot.answer)) return null;
    promptTokens[slot.tokIndex] = BLANK;
    answer = slot.answer;
    options = mkOptions(answer, FUNC_POOL_BY_CLS[slot.cls] || ['だけ', 'ぐらい', 'から', 'まで'], syl, rnd);
    instruction = 'Lengkapi kalimat berikut dengan kata yang tepat.';
  } else if (slot.kind === 'predicate') {
    if (raw !== slot.answer) return null;
    promptTokens[slot.tokIndex] = BLANK;
    answer = slot.answer;
    options = mkOptions(answer, PRED_POOL_BY_CLS[slot.cls] || ['あります', 'います', 'ありません', 'いません'], syl, rnd);
    instruction = 'Lengkapi kalimat berikut dengan predikat yang tepat.';
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

/* --- 4) MATCH (kosakata) --- */
const MATCH_THEMES = [
  {
    name: 'counter',
    instr: 'Jodohkan kata bantu bilangan (counter) dengan fungsinya.',
    pick: () => [
      { id: 'c_nin', jp: '～人', right: 'satuan orang' },
      { id: 'c_dai', jp: '～台', right: 'satuan mesin/kendaraan' },
      { id: 'c_mai', jp: '～枚', right: 'satuan benda tipis (lembar)' },
      { id: 'c_kai', jp: '～回', right: 'satuan frekuensi (kali)' },
      { id: 'c_tsu', jp: '～つ', right: 'satuan benda (buah)' },
      { id: 'c_ko', jp: '～個', right: 'satuan benda kecil (butir)' },
      { id: 'c_hon', jp: '～本', right: 'satuan benda panjang (batang)' },
      { id: 'c_fun', jp: '～分', right: 'satuan menit' },
      { id: 'c_nichi', jp: '～日', right: 'satuan hari' },
      { id: 'c_jikan', jp: '～時間', right: 'satuan jam (durasi)' },
      { id: 'c_shuukan', jp: '～週間', right: 'satuan minggu' },
      { id: 'c_kagetsu', jp: '～か月', right: 'satuan bulan' },
      { id: 'c_nen', jp: '～年', right: 'satuan tahun' },
      { id: 'c_ban', jp: '～番', right: 'satuan nomor urut' },
    ],
  },
  {
    name: 'makanan',
    instr: 'Jodohkan kosakata makanan Bab 11 dengan artinya.',
    pick: () => V_FOOD11.map(v => ({ id: v.id, jp: v.jp, right: v.mean })),
  },
  {
    name: 'kantor pos',
    instr: 'Jodohkan kosakata kantor pos Bab 11 dengan artinya.',
    pick: () => V_POST11.map(v => ({ id: v.id, jp: v.jp, right: v.mean })),
  },
  {
    name: 'keluarga',
    instr: 'Jodohkan kosakata keluarga Bab 11 dengan artinya.',
    pick: () => V_FAMILY11.map(v => ({ id: v.id, jp: v.jp, right: v.mean })),
  },
  {
    name: 'bilangan ～つ & orang',
    instr: 'Jodohkan bilangan dengan artinya.',
    pick: () => [
      { id: 'w_hitotsu', jp: '一つ', right: 'satu (buah)' },
      { id: 'w_futatsu', jp: '二つ', right: 'dua (buah)' },
      { id: 'w_mittsu', jp: '三つ', right: 'tiga (buah)' },
      { id: 'w_yottsu', jp: '四つ', right: 'empat (buah)' },
      { id: 'w_itsutsu', jp: '五つ', right: 'lima (buah)' },
      { id: 'w_muttsu', jp: '六つ', right: 'enam (buah)' },
      { id: 'w_nanatsu', jp: '七つ', right: 'tujuh (buah)' },
      { id: 'w_yattsu', jp: '八つ', right: 'delapan (buah)' },
      { id: 'w_kokonotsu', jp: '九つ', right: 'sembilan (buah)' },
      { id: 'w_tou', jp: '十', right: 'sepuluh (buah)' },
      { id: 'w_hitori', jp: '一人', right: 'seorang / sendirian' },
      { id: 'w_futari', jp: '二人', right: 'dua orang' },
    ],
  },
  {
    name: 'bacaan kanji',
    instr: 'Jodohkan kanji dengan cara baca (kana) yang benar.',
    pick: () => [...V_FAMILY11, ...V_POST11, ...V_MISC11, ...V_COUNTERS]
      .filter(v => /[\u4e00-\u9faf]/.test(v.jp))
      .map(v => ({ id: v.id, jp: v.jp, right: v.kana })),
  },
  {
    name: 'tempat Bab 11',
    instr: 'Jodohkan kosakata tempat dengan artinya.',
    pick: () => [
      { id: 'n_gaikoku', jp: '外国', right: 'luar negeri' },
      { id: 'n_kurasu', jp: 'クラス', right: 'kelas' },
      { id: 'n_yuubinkyoku', jp: '郵便局', right: 'kantor pos' },
      { id: 'n_gakkou', jp: '学校', right: 'sekolah' },
      { id: 'n_daigaku', jp: '大学', right: 'universitas' },
      { id: 'n_konbini', jp: 'コンビニ', right: 'minimarket' },
    ],
  },
  {
    name: 'ungkapan Bab 11',
    instr: 'Jodohkan ungkapan Bab 11 dengan artinya.',
    pick: () => [
      { id: 'e_gurai', jp: '～ぐらい', right: 'kira-kira' },
      { id: 'e_donogurai', jp: 'どのぐらい', right: 'berapa lama' },
      { id: 'e_zenbude', jp: '全部で', right: 'semuanya (total)' },
      { id: 'e_minna', jp: 'みんな', right: 'semua / semua orang' },
      { id: 'e_dake', jp: '～だけ', right: 'hanya' },
      { id: 'e_ikutsu', jp: 'いくつ', right: 'berapa banyak' },
      { id: 'e_nannin', jp: '何人', right: 'berapa orang' },
      { id: 'v_kakarimasu', jp: 'かかります', right: 'memakan waktu' },
      { id: 'v_yasumimasu', jp: '休みます', right: 'libur / istirahat' },
    ],
  },
  {
    name: 'percakapan kantor pos',
    instr: 'Jodohkan ungkapan percakapan dengan artinya.',
    pick: () => [
      { id: 'e_kashikomari', jp: 'かしこまりました', right: 'baik (jawaban sopan)' },
      { id: 'e_iitenki', jp: 'いい 天気ですね', right: 'cuacanya bagus ya' },
      { id: 'e_odekake', jp: 'お出かけですか', right: 'mau keluar?' },
      { id: 'e_chottomade', jp: 'ちょっと～まで', right: 'ke … sebentar' },
      { id: 'e_itterasshai', jp: '行ってらっしゃい', right: 'hati-hati (kepada yang pergi)' },
      { id: 'e_iktemasu', jp: '行ってきます', right: 'saya pergi dulu' },
      { id: 'e_onegai', jp: 'お願いします', right: 'tolong' },
      { id: 'e_oosutoraria', jp: 'オーストラリア', right: 'Australia' },
    ],
  },
  {
    name: 'tanya jawab',
    instr: 'Jodohkan pertanyaan dengan jawaban yang sesuai.',
    pick: () => [
      { id: 'qa1', jp: '兄弟は 何人ですか。', right: '四人 です。', idn: 'Saudara berapa orang? — Empat orang.', ids: ['e_nannin', 'n_kyoudai'] },
      { id: 'qa2', jp: 'りんごは いくつ ありますか。', right: '五つ あります。', idn: 'Apel ada berapa? — Ada lima.', ids: ['e_ikutsu', 'n_ringo'] },
      { id: 'qa3', jp: '机の 上に 何が ありますか。', right: '切手が 五枚 あります。', idn: 'Apa yang ada di atas meja? — Ada lima perangko.', ids: ['n_kitte'] },
      { id: 'qa4', jp: 'どのぐらい かかりますか。', right: '二時間 ぐらい かかります。', idn: 'Berapa lama? — Kira-kira dua jam.', ids: ['e_donogurai', 'v_kakarimasu'] },
      { id: 'qa5', jp: '教室に 学生が 何人 いますか。', right: '八人 います。', idn: 'Di kelas ada berapa murid? — Delapan orang.', ids: ['e_nannin'] },
      { id: 'qa6', jp: 'これは 何ですか。', right: 'はがきです。', idn: 'Ini apa? — Kartu pos.', ids: ['n_hagaki'] },
      { id: 'qa7', jp: '何日 だけ やすみますか。', right: '三日 だけ やすみます。', idn: 'Libur berapa hari saja? — Tiga hari saja.', ids: ['e_dake', 'v_yasumimasu'] },
      { id: 'qa8', jp: '全部で いくらですか。', right: '全部で 五百円 です。', idn: 'Semuanya berapa yen? — Lima ratus yen.', ids: ['e_zenbude'] },
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
    const size = Math.min(pool.length, syl.level > 22 ? 5 : 4);
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
      vocab: uniq(chosen.flatMap(v => v.ids || [v.id]).filter(id => VALID_ALL.has(id))),
      translation: chosen.map(v => (v.idn ? `${v.jp} = ${v.right} — ${v.idn}` : `${v.jp} = ${v.right}`)).join(' · '),
    };
  }
  return null;
}

/* --- konverter kanji -> kana (untuk baris percakapan) --- */
/* Leksikon longest-match: nama tokoh, kosakata, lalu angka+counter, EN. */
const KANA_DICT = (() => {
  const entries = [];
  const seen = new Set();
  for (const v of ALL_WORDS) {
    if (v.jp && v.kana && !seen.has(v.jp)) { seen.add(v.jp); entries.push([v.jp, v.kana]); }
  }
  for (const v of V_NAMES) {
    if (v.jp && v.kana && !seen.has(v.jp)) { seen.add(v.jp); entries.push([v.jp, v.kana]); }
  }
  /* tambahan bentuk sopan/ekspresi yang muncul di dialog */
  for (const [jp, kana] of [
    ['かしこまりました', 'かしこまりました'], ['行ってらっしゃい', 'いってらっしゃい'],
    ['行ってきます', 'いってきます'], ['行ってきます', 'いってきます'],
  ]) if (!seen.has(jp)) { seen.add(jp); entries.push([jp, kana]); }
  return entries.sort((a, b) => b[0].length - a[0].length);
})();

const COUNT_SUF_TO_ID = { 'つ': 'tsu', '人': 'nin', '枚': 'mai', '台': 'dai', '回': 'kai', '個': 'ko', '本': 'hon', '番': 'ban', '分': 'fun', '日': 'nichi', '週間': 'shuukan', 'か月': 'kagetsu', 'ヶ月': 'kagetsu', '年': 'nen', '時間': 'jikan' };
const COUNT_RE = /^([0-9]+|[〇一二三四五六七八九十百千万]+)(つ|人|枚|台|回|個|本|番|分|日|週間|か月|ヶ月|年|時間)/;
const EN_RE = /^([0-9]+|[〇一二三四五六七八九十百千万]+)円/;

function dialogReading(text) {
  let s = String(text), out = '';
  outer: while (s.length) {
    const m = s.match(COUNT_RE);
    if (m) {
      const id = COUNT_SUF_TO_ID[m[2]];
      out += countReading(id, parseNumStr(m[1]));
      s = s.slice(m[0].length);
      continue;
    }
    const me = s.match(EN_RE);
    if (me) {
      out += EN_READ[parseNumStr(me[1])] || (numToKana(parseNumStr(me[1])) + 'えん');
      s = s.slice(me[0].length);
      continue;
    }
    for (const [surface, reading] of KANA_DICT) {
      if (s.startsWith(surface)) { out += reading; s = s.slice(surface.length); continue outer; }
    }
    out += s[0];
    s = s.slice(1);
  }
  return out;
}

/* --- 5) SHORT CONVERSATION --- */
function genShortConversation(syl, rnd) {
  const eligible = CONV_TEMPLATES.filter(t => (t.minLevel || 1) <= syl.level);
  const preferred = eligible.filter(t => t.bucket === syl.bucketWanted);
  const pool = preferred.length ? preferred : eligible;
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
    const dialogueReading = resolvedLines.map(line => dialogReading(line));
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
      vocab: uniq((q.vocab || []).filter(v => VALID_ALL.has(v))),
      _sentJp: fullJp,
    };
  }
  return null;
}

/* --- 6) CHOOSE TRANSLATION (pengecoh: minimal pair) --- */
const TOKEN_TAIL_OK = /^(に|が|は|の|や|と|も|で|から|まで|です|ですか|ます|か|だけ|ぐらい)?$/;
function tailOk(rest) { return TOKEN_TAIL_OK.test(rest); }

function makeVariant(sentence, rnd) {
  const t = sentence.tags;
  const toks = sentence.tokens.map(x => ({ ...x }));
  const r = rnd();
  /* 1) tukar あります <-> います */
  if (r < 0.3) {
    const i = toks.findIndex(x => ['あります', 'います', 'ありません', 'いません'].includes(x.s));
    if (i >= 0) {
      const swap = { 'あります': 'います', 'います': 'あります', 'ありません': 'いません', 'いません': 'ありません' };
      toks[i] = T(swap[toks[i].s], swap[toks[i].s], toRomaji(swap[toks[i].s]));
      return { jp: joinS(toks) };
    }
  }
  /* 2) tukar jumlah counter (angka berbeda) */
  if (r < 0.58 && t.counter && t.n) {
    const m = pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(x => x !== t.n), rnd);
    const i = toks.findIndex(x => x.s === countTok(t.counter, t.n).s);
    if (i >= 0) {
      toks[i] = countTok(t.counter, m);
      return { jp: joinS(toks) };
    }
  }
  /* 3) tukar jenis counter (counter lain, angka sama) */
  if (r < 0.72 && t.counter && t.n) {
    const c2 = pick(['tsu', 'nin', 'mai', 'dai', 'kai'].filter(x => x !== t.counter), rnd);
    const i = toks.findIndex(x => x.s === countTok(t.counter, t.n).s);
    if (i >= 0) {
      toks[i] = countTok(c2, t.n);
      return { jp: joinS(toks) };
    }
  }
  /* 4) tukar subjek/objek dengan kata sekelas */
  if (t.subjId) {
    const src = W(t.subjId);
    const cls = V_FAMILY11.includes(src) ? V_FAMILY11
      : V_POST11.includes(src) ? V_POST11
      : V_FOOD11.includes(src) ? V_FOOD11
      : V_LIVINGS.includes(src) ? V_LIVINGS
      : V_THINGS.includes(src) ? V_THINGS : null;
    if (cls && cls.length > 1) {
      const alt = pick(cls.filter(x => x.id !== t.subjId), rnd);
      const i = toks.findIndex(x => x.s.startsWith(src.jp));
      if (i >= 0) {
        const rest = toks[i].s.slice(src.jp.length);
        if (!tailOk(rest)) return null;
        toks[i] = T(alt.jp + rest, alt.kana + rest, alt.romaji + (rest ? ' ' + toRomaji(rest) : ''));
        return { jp: joinS(toks) };
      }
    }
  }
  /* 5) tukar tempat */
  if (t.placeId) {
    const src = PLACE[t.placeId];
    const alt = pick(V_PLACES.filter(x => x.id !== t.placeId), rnd);
    const i = toks.findIndex(x => x.s.startsWith(src.jp));
    if (i >= 0) {
      const rest = toks[i].s.slice(src.jp.length);
      if (!tailOk(rest)) return null;
      toks[i] = T(alt.jp + rest, alt.kana + rest, alt.romaji + (rest ? ' ' + toRomaji(rest) : ''));
      return { jp: joinS(toks) };
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

/* --- 7) LISTENING --- */
function genListening(sentence, syl, rnd) {
  const tokens = tileTokens(sentence);
  if (tokens.length < 3) return null;
  const t = sentence.tags;
  const extras = extraTilesFor(sentence, syl, rnd, Math.min(syl.extraTiles + 1, 3));
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
 * BAGIAN 8 — PEMBANGUN 30 LEVEL × 15 SOAL
 *   - Kalimat dipakai maksimal SEKALI (tidak ada soal kembar).
 *   - Aturan i+1: sebuah kalimat hanya boleh memperkenalkan maksimal SATU
 *     kata baru Bab 11 (kata yang belum pernah muncul pada soal sebelumnya).
 * ========================================================================*/
const PATTERN_MIN_LEVEL = {
  order_two: 11, kakarimasu: 11, kakarimasu_gurai: 11, q_donogurai_kakaru: 11,
  duration_imasu: 11, dake_count: 11, dake_yasumi: 11, dake_thing: 11,
  zenbude_item: 11, zenbude_qty: 11,
  freq_gurai: 21, q_nankai: 21, family_two: 21,
  q_nannin: 6, family_desu: 6,
};
function content11(sentence) {
  return uniq(sentence.vocab.filter(id => {
    const w = W(id);
    return w && w.lesson === 11 && typeOf(w) !== 'counter';
  }));
}
function bucketAvailable(bucket, syl) {
  return (BUCKET_POOL[bucket] || []).some(s =>
    s.tokens.length <= syl.maxTokens &&
    (PATTERN_MIN_LEVEL[s.tags.pattern] || 1) <= syl.level);
}
function claimQuestion(cand) {
  const sg = questionSig(cand);
  if (globalSigs.has(sg)) return false;
  if (cand.prompt && HAS_KANJI_OR_KANA.test(cand.prompt)) {
    const pk = normJp(cand.prompt);
    if (usedPrompts.has(pk)) return false;
    usedPrompts.add(pk);
  }
  globalSigs.add(sg);
  return true;
}
function takeSentence(bucket, syl, rnd, usedInLevel, introduced) {
  const pool = (BUCKET_POOL[bucket] || []).filter(s =>
    s.tokens.length <= syl.maxTokens &&
    (PATTERN_MIN_LEVEL[s.tags.pattern] || 1) <= syl.level &&
    !usedSentences.has(s.key) && !usedInLevel.has(s.key));
  if (!pool.length) return null;
  /* aturan i+1 keras: tolak kalimat yang memperkenalkan > 1 kata baru */
  const fresh = pool.filter(s => content11(s).every(id => introduced.has(id) || content11(s).length <= 1));
  const novelOk = pool.filter(s => content11(s).filter(id => !introduced.has(id)).length <= 1);
  const candidates = novelOk.length ? novelOk : fresh;
  const scored = shuffle(candidates, rnd)
    .sort((a, b) => (content11(a).filter(id => !introduced.has(id)).length) - (content11(b).filter(id => !introduced.has(id)).length));
  return scored[0] || null;
}

const HAS_KANJI_OR_KANA = /[\u3040-\u30ff\u4e00-\u9faf]/;
const MANDATORY = [
  ['かかります', 'かかります'], ['いくつ', 'いくつ'], ['ひとり', '一人'], ['ふたり', '二人'],
  ['～にん', '[一二三四五六七八九十]+人|一人|二人'], ['～だい', '[一二三四五六七八九十]+台'], ['～まい', '[一二三四五六七八九十]+枚'], ['～かい', '[一二三四五六七八九十]+回'],
  ['りんご', 'りんご'], ['みかん', 'みかん'], ['サンドイッチ', 'サンドイッチ'], ['カレーライス', 'カレーライス'],
  ['アイスクリーム', 'アイスクリーム'], ['切手', '切手'], ['はがき', 'はがき'], ['封筒', '封筒'],
  ['速達', '速達'], ['書留', '書留'], ['エアメール（航空便）', 'エアメール|航空便'], ['船便', '船便'],
  ['両親', '両親'], ['兄弟', '兄弟'], ['姉妹', '姉妹'], ['兄', '兄(?!弟)'], ['お兄さん', 'お兄さん'],
  ['姉', '姉(?!妹)'], ['お姉さん', 'お姉さん'], ['弟', '弟(?!さん)'], ['弟さん', '弟さん'],
  ['妹', '妹(?!さん)'], ['妹さん', '妹さん'], ['外国', '外国'],
  ['～時間', '[一二三四五六七八九十]+時間'], ['～週間', '[一二三四五六七八九十]+週間'],
  ['～か月', '[一二三四五六七八九十]+か月'], ['～年', '[一二三四五六七八九十]+年'],
  ['～ぐらい', 'ぐらい'], ['どのぐらい', 'どのぐらい'], ['全部で', '全部で'], ['～だけ', 'だけ'],
];

/* Pin kalimat untuk kosakata wajib yang rotasinya rawan tipis: tiap label
 * wajib dijamin minimal 3 kalimat sumber yang akan diprioritaskan jadi soal. */
const pinnedKeys = new Set();
{
  const surfaces = MANDATORY.map(([label, pattern]) => [label, new RegExp(pattern)]);
  const pinCount = new Map();
  for (const s of SENTENCES) {
    let pin = false;
    for (const [label, re] of surfaces) {
      if ((pinCount.get(label) || 0) < 3 && re.test(s.jp)) {
        pinCount.set(label, (pinCount.get(label) || 0) + 1);
        pin = true;
      }
    }
    if (pin) pinnedKeys.add(s.key);
  }
}

const LEVELS = [];
const THEME_CYCLE = ['kantor pos', 'keluarga', 'toko', 'rumah', 'perjalanan', 'sekolah', 'makanan', 'tanya jawab', 'campuran'];
const typeUsed = { complete: 0, arrange: 0, short_conversation: 0, listening: 0, translate: 0, choose_translation: 0, match: 0 };
const globalSigs = new Set();
const usedPrompts = new Set();       /* prompt Jepang ternormalisasi (unik global) */
const usedSentences = new Set();
const introduced = new Set();          /* id kosakata Bab 11 yang sudah diperkenalkan */
const questionSentences = [];          /* { qid, level, tokens, text, isConv } untuk audit near-dup */

for (let level = 1; level <= TOTAL_LEVELS; level++) {
  const rnd = mulberry32(level * 977 + 20261016);
  const base = getSyllabus(level);
  const syl = Object.assign({}, base, { level, bucketWanted: null });
  const quota = LEVEL_TYPE_QUOTA[level - 1];
  const typeBag = [];
  for (const t of TYPE_ORDER) {
    for (let k = 0; k < quota[t]; k++) typeBag.push(t);
  }
  const bag = shuffle(typeBag, rnd);
  const questions = [];
  const usedInLevel = new Set();
  const levelTypeCount = {};

  for (const wantType of bag) {
    let q = null;
    for (let attempt = 0; attempt < 24 && !q; attempt++) {
      if (wantType === 'match') {
        const cand = genMatch(syl, rnd);
        if (!cand) continue;
        if (!claimQuestion(cand)) continue;
        q = cand;
      } else if (wantType === 'short_conversation') {
        syl.bucketWanted = pick(syl.buckets, rnd);
        const cand = genShortConversation(syl, rnd);
        if (!cand) continue;
        if (!claimQuestion(cand)) continue;
        q = cand;
      } else {
        let sent = null;
        if (attempt === 0 && pinnedKeys.size) {
          const pinPool = SENTENCES.filter(s =>
            pinnedKeys.has(s.key) && !usedSentences.has(s.key) &&
            s.tokens.length <= syl.maxTokens &&
            (PATTERN_MIN_LEVEL[s.tags.pattern] || 1) <= syl.level &&
            content11(s).filter(id => !introduced.has(id)).length <= 1);
          if (pinPool.length) sent = pick(pinPool, rnd);
        }
        if (!sent) {
          const bucket = pick(syl.buckets.filter(b => bucketAvailable(b, syl)), rnd);
          if (!bucket) continue;
          sent = takeSentence(bucket, syl, rnd, usedInLevel, introduced);
          if (!sent) continue;
        }
        let cand = null;
        if (wantType === 'arrange') cand = genArrange(sent, syl, rnd);
        else if (wantType === 'translate') cand = genTranslate(sent, syl, rnd);
        else if (wantType === 'complete') cand = genComplete(sent, syl, rnd);
        else if (wantType === 'choose_translation') cand = genChooseTranslation(sent, syl, rnd);
        else if (wantType === 'listening') cand = genListening(sent, syl, rnd);
        if (!cand) continue;
        if (!claimQuestion(cand)) continue;
        usedSentences.add(sent.key);
        usedInLevel.add(sent.key);
        content11(sent).forEach(id => introduced.add(id));
        cand._sentence = sent;
        q = cand;
      }
    }
    if (!q) {
      console.error(`Level ${level}: gagal membuat soal tipe ${wantType} (percakapan: ${CONV_TEMPLATES.length} template)`);
      process.exit(1);
    }
    q.id = nextId();
    typeUsed[q.type]++;
    levelTypeCount[q.type] = (levelTypeCount[q.type] || 0) + 1;
    questions.push(q);
    /* eksposur lewat percakapan/match juga memperkenalkan kosakata */
    if (q.type === 'short_conversation' || q.type === 'match') {
      (q.vocab || []).forEach(id => introduced.add(id));
      (q.pairs || []).forEach(p => { if (p.vocabId) introduced.add(p.vocabId); });
    }
    if (q.type === 'short_conversation') {
      questionSentences.push({ qid: q.id, level, text: q.fullJp, isConv: true });
    } else if (q.type !== 'match') {
      questionSentences.push({ qid: q.id, level, tokens: q._sentence.tokens.map(t => t.s), text: q._sentence.jp, isConv: false });
    }
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
 * BAGIAN 9 — VALIDASI (gagal = file tidak ditulis)
 * ========================================================================*/
const problems = [];
const ALL_IDS = new Set();
const typeCount = {};
let totalQ = 0, missingTranslation = 0;
const HAS_KANJI = /[\u4e00-\u9faf]/;

/* 1) struktur */
for (const lvl of LEVELS) {
  totalQ += lvl.questions.length;
  if (lvl.questions.length !== QUESTIONS_PER_LEVEL) problems.push(`level ${lvl.level}: jumlah soal ${lvl.questions.length}`);
  for (const q of lvl.questions) {
    typeCount[q.type] = (typeCount[q.type] || 0) + 1;
    if (ALL_IDS.has(q.id)) problems.push(`duplicate id: ${q.id}`);
    ALL_IDS.add(q.id);
    if (!q.translation) missingTranslation++;
    if (q.translation && q.type !== 'match' && HAS_KANJI.test(q.translation)) problems.push(`${q.id}: terjemahan Indonesia memuat kanji: ${q.translation}`);
    if (q.translation && /\s{2,}/.test(q.translation)) problems.push(`${q.id}: terjemahan memuat spasi ganda`);
    if (q.reading && HAS_KANJI.test(q.reading)) { problems.push(`${q.id}: reading memuat kanji`); if (process.env.DBG) console.error('DBG', q.id, q.type, JSON.stringify(q.reading).slice(0,120), '| prompt:', (q.prompt||q.audioText||'').slice(0,60)); }
    if (q.romaji && /[\u3041-\u30ff\u4e00-\u9faf]/.test(q.romaji)) problems.push(`${q.id}: romaji memuat aksara Jepang`);
    if (Array.isArray(q.answer)) {
      const tset = new Set(q.tiles || []);
      for (const tk of q.answer) if (!tset.has(tk)) problems.push(`${q.id}: token jawaban tidak ada di tiles: ${tk}`);
      if (q.answer.length < 3) problems.push(`${q.id}: jawaban terlalu pendek`);
      if (new Set(q.tiles).size !== q.tiles.length) problems.push(`${q.id}: tiles duplikat`);
    }
    if (q.options) {
      if (!q.options.includes(q.answer)) problems.push(`${q.id}: answer tidak ada di options`);
      if (new Set(q.options).size !== q.options.length) problems.push(`${q.id}: options duplikat`);
      if (q.options.length < 3) problems.push(`${q.id}: options kurang dari 3`);
      if (q.type === 'complete') {
        const blanks = (q.prompt.match(/＿＿＿/g) || []).length;
        if (blanks !== 1) problems.push(`${q.id}: complete harus punya tepat 1 rumpang (${blanks})`);
        const recon = normJp(q.prompt.replace('＿＿＿', q.answer));
        const target = normJp(String(q._sentJp).replace('＿＿＿', q.answer));
        if (recon !== target) problems.push(`${q.id}: prompt+answer != kalimat sumber`);
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
      if (!/\(.*\)/.test(q.question) && !/jawaban/.test(q.question)) problems.push(`${q.id}: pertanyaan dialog tanpa petunjuk kunci`);
    }
    if (q.vocab) q.vocab.forEach(v => { if (!VALID_ALL.has(v)) problems.push(`${q.id}: vocab id tak dikenal ${v}`); });
    if (!q.reading && q.type !== 'match') problems.push(`${q.id}: reading kosong`);
    if (!q.romaji && q.type !== 'match') problems.push(`${q.id}: romaji kosong`);
  }
}
if (totalQ !== TOTAL_LEVELS * QUESTIONS_PER_LEVEL) problems.push(`total soal ${totalQ} != ${TOTAL_LEVELS * QUESTIONS_PER_LEVEL}`);

/* id berurutan */
{
  let expect = 1;
  for (const lvl of LEVELS) for (const q of lvl.questions) {
    const want = `q_b11_${expect++}`;
    if (q.id !== want) problems.push(`id tidak berurutan: ${q.id} (harus ${want})`);
  }
}

/* 2) validasi あります/います pada bank kalimat */
for (const s of SENT_BANK) {
  const t = s.tags;
  if (!/(あります|います|ありません|いません)/.test(s.jp)) continue;
  const usesImasu = /(います|いません|いますか)/.test(s.jp);
  if (t.living !== undefined && t.living !== usesImasu && !t.isQuestion) {
    problems.push(`存在 verb salah: ${s.jp} (living=${t.living})`);
  }
  if (t.isQuestion && t.living !== undefined && t.living !== usesImasu) {
    problems.push(`存在 verb pertanyaan salah: ${s.jp} (living=${t.living})`);
  }
}

/* 3) cakupan bunpou Bab 11 */
const BUNPOU_TESTS = {
  bp_tsu:       s => /[一二三四五六七八九十]+つ/.test(s) || /[一二三四五六七八九十]?[つ]/.test(s),
  bp_nin:       s => /(一人|二人|[三四五六七八九十]+人)/.test(s) && !/何人/.test(s),
  bp_dai:       s => /[一二三四五六七八九十]+台/.test(s),
  bp_mai:       s => /[一二三四五六七八九十]+枚/.test(s),
  bp_kai:       s => /[一二三四五六七八九十]+回/.test(s),
  bp_counter2:  s => /[一二三四五六七八九十]+(個|本|番|分|日)/.test(s),
  bp_durasi:    s => /[一二三四五六七八九十]+(時間|週間|か月|年)/.test(s),
  bp_ikutsu:    s => /いくつ/.test(s),
  bp_nannin:    s => /何人/.test(s),
  bp_kudasai:   s => /ください/.test(s) && /[一二三四五六七八九十]+(枚|つ|台|個|本)/.test(s),
  bp_zenbude:   s => /全部で/.test(s),
  bp_gurai:     s => /ぐらい/.test(s),
  bp_kai_gurai: s => /何回/.test(s) || (/[一二三四五六七八九十]+回/.test(s) && /ぐらい/.test(s)),
  bp_donogurai: s => /どのぐらい/.test(s),
  bp_dake:      s => /だけ/.test(s),
  bp_kakarimasu: s => /かかります/.test(s),
  bp_keluarga:  s => /(兄|姉|弟|妹|兄弟|姉妹|両親|お兄さん|お姉さん|弟さん|妹さん)/.test(s) && /(います|何人|人)/.test(s),
};
const bunpouHits = {};
for (const b of BUNPOU_BAB11) bunpouHits[b.key] = [];
for (const q of LEVELS.flatMap(l => l.questions)) {
  const texts = [];
  if (q.prompt) texts.push(q.prompt);
  if (q.audioText) texts.push(q.audioText);
  if (Array.isArray(q.answer)) texts.push(q.answer.join(''));
  if (q.translation) texts.push(q.translation);
  if (q.dialogue) q.dialogue.forEach(d => texts.push(d.text.replace('＿＿＿', q.answer)));
  if (q.pairs) q.pairs.forEach(p => texts.push(p.jp));
  const s = texts.join(' ');
  for (const b of BUNPOU_BAB11) if (BUNPOU_TESTS[b.key](s)) bunpouHits[b.key].push(q.id);
}
for (const b of BUNPOU_BAB11) {
  if (!bunpouHits[b.key].length) problems.push(`bunpou belum tercakup: ${b.key} (${b.name})`);
}

/* 4) duplikat & near-duplicate antar soal */
const exactMap = new Map();
for (const entry of questionSentences) {
  const key = normJp(entry.text);
  if (exactMap.has(key)) problems.push(`kalimat kembar: ${entry.qid} == ${exactMap.get(key)}`);
  else exactMap.set(key, entry.qid);
}
/* near-dup: boleh beda 1 token hanya untuk pasangan bernuansa pembelajaran
 * (variasi angka/counter & minimal pair あります/ありません, います/いません). */
const nearMap = new Map();
for (const entry of questionSentences) {
  if (entry.isConv || !entry.tokens) continue;
  const toks = entry.tokens;
  for (let i = 0; i < toks.length; i++) {
    const sig = toks.length + '|' + i + '|' + toks.map((t, j) => (j === i ? '*' : t)).join('\u0001');
    const owners = nearMap.get(sig);
    if (owners) {
      const clash = owners.find(o => !learningPurposePair(o.tok, toks[i]));
      if (clash) problems.push(`near-duplicate (beda 1 token): ${entry.qid} vs ${clash.qid}`);
      else owners.push({ qid: entry.qid, tok: toks[i] });
    } else {
      nearMap.set(sig, [{ qid: entry.qid, tok: toks[i] }]);
    }
  }
}
/* near-dup percakapan (dibandingkan antar percakapan) */
const convMap = new Map();
for (const entry of questionSentences.filter(e => e.isConv)) {
  const key = normJp(entry.text);
  if (convMap.has(key)) problems.push(`percakapan kembar: ${entry.qid} == ${convMap.get(key)}`);
  else convMap.set(key, entry.qid);
}

/* 5) aturan i+1 (per soal kalimat: maksimal 1 kata baru Bab 11).
 * "Baru" = belum muncul pada soal sebelumnya (urutan pembuatan), termasuk
 * eksposur lewat percakapan & match. */
let iPlus1Violations = 0;
{
  const seenWords = new Set();
  for (const lvl of LEVELS) {
    for (const q of lvl.questions) {
      const ids = new Set();
      if (q._sentence) content11(q._sentence).forEach(id => ids.add(id));
      (q.vocab || []).forEach(id => { if (W(id) && W(id).lesson === 11 && typeOf(W(id)) !== 'counter') ids.add(id); });
      (q.pairs || []).forEach(p => {
        const w = p.vocabId && W(p.vocabId);
        if (w && w.lesson === 11 && typeOf(w) !== 'counter') ids.add(p.vocabId);
      });
      const novel = [...ids].filter(id => !seenWords.has(id));
      if (q._sentence && novel.length > 1) {
        iPlus1Violations++;
        problems.push(`${q.id}: memperkenalkan ${novel.length} kata baru sekaligus (${novel.join(', ')})`);
      }
      ids.forEach(id => seenWords.add(id));
    }
  }
}

/* 6) rotasi kosakata wajib Bab 11: muncul di >= 3 soal */
function questionCorpus(q) {
  const texts = [];
  if (q.prompt) texts.push(q.prompt);
  if (q.audioText) texts.push(q.audioText);
  if (Array.isArray(q.answer)) texts.push(q.answer.join(''));
  if (typeof q.answer === 'string') texts.push(q.answer);
  if (q.translation) texts.push(q.translation);
  if (q.reading) texts.push(q.reading);
  if (q.dialogue) q.dialogue.forEach(d => texts.push(d.text.replace('＿＿＿', q.answer)));
  if (q.pairs) q.pairs.forEach(p => texts.push(p.jp + ' ' + p.id));
  return texts.join(' ');
}
const mandatoryCounts = {};
for (const [label, pattern] of MANDATORY) {
  const re = new RegExp(pattern);
  let n = 0;
  for (const q of LEVELS.flatMap(l => l.questions)) {
    if (re.test(questionCorpus(q))) n++;
  }
  mandatoryCounts[label] = n;
  if (n < 3) problems.push(`kosakata wajib "${label}" hanya muncul di ${n} soal (min 3)`);
}

/* 7) sebaran tipe per level sesuai kuota largest-remainder */
for (let i = 0; i < LEVELS.length; i++) {
  const q = LEVEL_TYPE_QUOTA[i];
  const got = {};
  for (const qq of LEVELS[i].questions) got[qq.type] = (got[qq.type] || 0) + 1;
  for (const t of TYPE_ORDER) {
    if ((got[t] || 0) !== q[t]) problems.push(`level ${i + 1}: tipe ${t} = ${got[t] || 0}, kuota ${q[t]}`);
  }
}

console.log('---------------------------------------------');
console.log('Total level        :', LEVELS.length);
console.log('Total soal         :', totalQ, '(target', TOTAL_LEVELS * QUESTIONS_PER_LEVEL + ')');
console.log('Bank kalimat       :', SENT_BANK.length, '| percakapan template:', CONV_TEMPLATES.length);
console.log('Sebaran tipe soal  :', JSON.stringify(typeCount));
console.log('Kuota per level (largest-remainder):');
for (let i = 0; i < 3; i++) console.log('  contoh level', i + 1, JSON.stringify(LEVEL_TYPE_QUOTA[i]));
console.log('Cakupan bunpou Bab 11:');
for (const b of BUNPOU_BAB11) {
  console.log(`  ${b.key.padEnd(13)} ${String(bunpouHits[b.key].length).padStart(4)} soal  ${b.name}`);
}
console.log('Kosakata wajib (jumlah soal):');
for (const [label] of MANDATORY) console.log(`  ${label.padEnd(16)} ${mandatoryCounts[label]}`);
console.log('Pelanggaran i+1   :', iPlus1Violations);
console.log('Soal tanpa terjemahan:', missingTranslation);
if (problems.length) {
  console.log('MASALAH VALIDASI (' + problems.length + '):');
  problems.slice(0, 50).forEach(p => console.log(' -', p));
  console.log('File TIDAK ditulis karena masih ada masalah validasi.');
  process.exit(1);
}
console.log('OK: validasi generator lolos.');

/* ==========================================================================
 * BAGIAN 10 — TULIS OUTPUT
 * ========================================================================*/
const outDir = path.join(__dirname, '..', 'js', 'data');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'vocab_bab11.js'),
  `// Auto-generated. Jangan diedit manual — edit tools/generate_bab11.js lalu jalankan ulang.\nwindow.VOCAB_BAB11_DATA = ${JSON.stringify(VOCAB_BAB11, null, 2)};\n`
);
const CLEAN_LEVELS = LEVELS.map(lvl => ({
  level: lvl.level, title: lvl.title, tier: lvl.tier, focus: lvl.focus, theme: lvl.theme,
  questions: lvl.questions.map(q => {
    const c = {};
    for (const k of Object.keys(q)) if (!k.startsWith('_')) c[k] = q[k];
    return c;
  }),
}));
fs.writeFileSync(
  path.join(outDir, 'levels_bab11.js'),
  `// Auto-generated. Jangan diedit manual — edit tools/generate_bab11.js lalu jalankan ulang.\nwindow.LEVELS_BAB11_DATA = ${JSON.stringify(CLEAN_LEVELS)};\n`
);
console.log('Selesai! Output: js/data/vocab_bab11.js & js/data/levels_bab11.js');
