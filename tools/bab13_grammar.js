#!/usr/bin/env node
/* ============================================================================
 * tools/bab13_grammar.js
 * Aturan konjugasi Bab 13 + tokenisasi kalimat (kanji + kana) agar generator
 * dan audit memakai sumber aturan yang sama.
 *
 * Setiap token = { jp, kana }. Kalimat = array token. Dengan begitu "cara baca"
 * (furigana) selalu konsisten dan audit bisa memeriksa whitelist kosakata.
 * ========================================================================== */
'use strict';

const { VOCAB, CLOCK_WORDS } = require('./bab13_vocab');

const BY_ID = new Map(VOCAB.map(v => [v.id, v]));
const BY_JP = new Map(VOCAB.map(v => [v.jp, v]));
const CLOCK_BY_ID = new Map(CLOCK_WORDS.map(v => [v.id, v]));

function w(id) {
  const v = BY_ID.get(id);
  if (!v) throw new Error('Kosakata tidak dikenal: ' + id);
  return v;
}

/* Nama tokoh buku teks (Minna no Nihongo). Diperlakukan sebagai nama diri,
 * sama seperti Bab 11 — bukan kosakata isi baru. */
const NAMES = [
  { id: 'miraa', jp: 'ミラーさん', kana: 'ミラーさん', mean: 'Sdr. Miller' },
  { id: 'yamada', jp: '山田さん', kana: 'やまださん', mean: 'Sdr. Yamada' },
  { id: 'matsumoto', jp: '松本さん', kana: 'まつもとさん', mean: 'Sdr. Matsumoto' },
  { id: 'santosu', jp: 'サントスさん', kana: 'サントスさん', mean: 'Sdr. Santos' },
  { id: 'karina', jp: 'カリナさん', kana: 'カリナさん', mean: 'Sdr. Karina' },
  { id: 'rin', jp: 'リンさん', kana: 'リンさん', mean: 'Sdr. Rin' },
  { id: 'kimu', jp: 'キムさん', kana: 'キムさん', mean: 'Sdr. Kim' },
  { id: 'tanaka', jp: '田中さん', kana: 'たなかさん', mean: 'Sdr. Tanaka' },
  { id: 'watto', jp: 'ワットさん', kana: 'ワットさん', mean: 'Sdr. Watt' },
  { id: 'min', jp: 'ミンさん', kana: 'ミンさん', mean: 'Sdr. Minh' },
];
const NAME_BY_ID = new Map(NAMES.map(n => [n.id, n]));

/* Token -------------------------------------------------------------------- */
function T(jp, kana) { return { jp, kana: kana === undefined ? jp : kana }; }
function name(id) {
  const n = NAME_BY_ID.get(id);
  if (!n) throw new Error('Nama tidak dikenal: ' + id);
  return T(n.jp, n.kana);
}
function noun(id) { const v = w(id); return T(v.jp, v.kana); }
function clock(id) {
  const c = CLOCK_BY_ID.get(id);
  if (!c) throw new Error('Jam tidak dikenal: ' + id);
  return T(c.jp, c.kana);
}

/* Partikel & unsur gramatikal (bukan kosakata isi) */
const P = {
  wa: T('は'), ga: T('が'), wo: T('を'), ni: T('に'), e: T('へ'), de: T('で'),
  no: T('の'), to: T('と'), mo: T('も'), ya: T('や'), kara: T('から'),
  made: T('まで'), dake: T('だけ'), gurai: T('ぐらい'), goro: T('ごろ'),
  ka: T('か'), ne: T('ね'), yo: T('よ'), na: T('な'),
  desu: T('です'), deshita: T('でした'), janai: T('じゃない'), da: T('だ'),
  masenka: T('ませんか'), mashou: T('ましょう'),
};

/* Kata kerja -------------------------------------------------------------- */
function verbStem(id) {
  const v = w(id);
  if (v.type !== 'verb' || !v.jp.endsWith('ます')) throw new Error('Bukan kata kerja ます: ' + id);
  return T(v.jp.slice(0, -2), v.kana.slice(0, -2));
}
const MASU_END = {
  masu: ['ます', 'ます'],
  masen: ['ません', 'ません'],
  mashita: ['ました', 'ました'],
  masendeshita: ['ませんでした', 'ませんでした'],
  mashou: ['ましょう', 'ましょう'],
  masenka: ['ませんか', 'ませんか'],
};
function verbMasu(id, form) {
  /* Jangan diam-diam jatuh ke ます: bentuk salah ketik harus ketahuan. */
  if (form && !MASU_END[form]) throw new Error(`Bentuk ます tidak dikenal: ${form} (${id})`);
  const f = MASU_END[form] || MASU_END.masu;
  const s = verbStem(id);
  return T(s.jp + f[0], s.kana + f[1]);
}
const TAI_END = {
  tai: ['たいです', 'たいです'],
  takunai: ['たくないです', 'たくないです'],
  takatta: ['たかったです', 'たかったです'],
  takunakatta: ['たくなかったです', 'たくなかったです'],
  taiPlain: ['たい', 'たい'],
  takunaiPlain: ['たくない', 'たくない'],
  takattaPlain: ['たかった', 'たかった'],
  takunakattaPlain: ['たくなかった', 'たくなかった'],
};
function verbTai(id, form) {
  if (form && !TAI_END[form]) throw new Error(`Bentuk たい tidak dikenal: ${form} (${id})`);
  const f = TAI_END[form] || TAI_END.tai;
  const s = verbStem(id);
  return T(s.jp + f[0], s.kana + f[1]);
}
/* Bentuk biasa (kamus) untuk percakapan kasual — hanya kata kerja yang dipakai
 * pada soal kasual, sehingga tidak ada tebakan golongan kata kerja. */
const CASUAL_DICT = {
  ikimasu: ['行く', 'いく'], kimasu: ['来る', 'くる'], kaerimasu: ['帰る', 'かえる'],
  tabemasu: ['食べる', 'たべる'], nomimasu: ['飲む', 'のむ'], kaimasu: ['買う', 'かう'],
  mimasu: ['見る', 'みる'], asobimasu: ['遊ぶ', 'あそぶ'], oyogimasu: ['泳ぐ', 'およぐ'],
  aimasu: ['会う', 'あう'], sanposhimasu: ['散歩する', 'さんぽする'],
  kaimonoshimasu: ['買い物する', 'かいものする'], shokujishimasu: ['食事する', 'しょくじする'],
  yomimasu: ['読む', 'よむ'], kakimasu: ['書く', 'かく'], torimasu: ['撮る', 'とる'],
  yasumimasu: ['休む', 'やすむ'], hatarakimasu: ['働く', 'はたらく'],
  benkyoushimasu: ['勉強する', 'べんきょうする'], kikimasu: ['聞く', 'きく'],
  shimasu: ['する', 'する'],
  imasu: ['いる', 'いる'], arimasu: ['ある', 'ある'], kimasu: ['来る', 'くる'],
  machimasu: ['待つ', 'まつ']
};
function verbDict(id) {
  const d = CASUAL_DICT[id];
  if (!d) throw new Error('Bentuk kamus belum tersedia: ' + id);
  return T(d[0], d[1]);
}
function verbNai(id) {
  const d = verbDict(id);
  // 行く → 行かない, 食べる → 食べない, する → しない
  if (d.jp.endsWith('する')) return T(d.jp.slice(0, -2) + 'しない', d.kana.slice(0, -2) + 'しない');
  if (d.jp.endsWith('る')) return T(d.jp.slice(0, -1) + 'ない', d.kana.slice(0, -1) + 'ない');
  const map = { う: 'わ', く: 'か', ぐ: 'が', す: 'さ', つ: 'た', ぬ: 'な', ぶ: 'ば', む: 'ま' };
  const last = d.jp.slice(-1), kanaLast = d.kana.slice(-1);
  if (!map[last]) throw new Error('Bentuk ない tidak dikenal: ' + d.jp);
  return T(d.jp.slice(0, -1) + map[last] + 'ない', d.kana.slice(0, -1) + map[kanaLast] + 'ない');
}

/* Kata sifat ほしい -------------------------------------------------------- */
const HOSHII_FORM = {
  pos: ['欲しいです', 'ほしいです'],
  neg: ['欲しくないです', 'ほしくないです'],
  past: ['欲しかったです', 'ほしかったです'],
  pastneg: ['欲しくなかったです', 'ほしくなかったです'],
  posPlain: ['欲しい', 'ほしい'],
  negPlain: ['欲しくない', 'ほしくない'],
  pastPlain: ['欲しかった', 'ほしかった'],
  pastnegPlain: ['欲しくなかった', 'ほしくなかった'],
};
function hoshii(form) {
  const f = HOSHII_FORM[form] || HOSHII_FORM.pos;
  return T(f[0], f[1]);
}

/* Bentuk sopan & kasual untuk kalimat perintah kecil ----------------------- */
const EXPR = {
  hai: T('はい'), iie: T('いいえ'), ee: T('ええ'),
  arigatou: T('ありがとうございます'),
  sumimasen: T('すみません'),
  ikaga: T('いかが'), ikagadesu: T('いかがですか'),
  soudesuka: T('そうですか'),
  youji: T('用事'), arimasen: T('ありません'),
};

/* Daftar permukaan yang diizinkan (untuk audit kosakata) ------------------- */
let _surfaces = null;
function surfacePairs() {
  if (_surfaces) return _surfaces;
  const map = new Map();
  const add = (jp, kana) => {
    if (!jp) return;
    if (!map.has(jp)) map.set(jp, kana === undefined ? jp : kana);
  };

  VOCAB.forEach(v => { add(v.jp, v.kana); add(v.kana, v.kana); });
  CLOCK_WORDS.forEach(v => { add(v.jp, v.kana); add(v.kana, v.kana); });
  NAMES.forEach(n => { add(n.jp, n.kana); add(n.kana, n.kana); });

  /* Semua bentuk kata kerja yang bisa dibentuk dari daftar kosakata */
  VOCAB.filter(v => v.type === 'verb').forEach(v => {
    const stem = T(v.jp.slice(0, -2), v.kana.slice(0, -2));
    add(stem.jp, stem.kana); add(stem.kana, stem.kana);
    Object.keys(MASU_END).forEach(f => { const x = verbMasu(v.id, f); add(x.jp, x.kana); add(x.kana, x.kana); });
    Object.keys(TAI_END).forEach(f => { const x = verbTai(v.id, f); add(x.jp, x.kana); add(x.kana, x.kana); });
    if (CASUAL_DICT[v.id]) {
      const d = verbDict(v.id); add(d.jp, d.kana); add(d.kana, d.kana);
      if (!d.jp.endsWith('する')) { const n = verbNai(v.id); add(n.jp, n.kana); add(n.kana, n.kana); }
    }
  });

  Object.keys(HOSHII_FORM).forEach(f => { const x = hoshii(f); add(x.jp, x.kana); add(x.kana, x.kana); });

  /* Partikel, kopula, dan akhiran gramatikal */
  [
    ['は', 'は'], ['が', 'が'], ['を', 'を'], ['に', 'に'], ['へ', 'へ'], ['で', 'で'],
    ['の', 'の'], ['と', 'と'], ['も', 'も'], ['や', 'や'], ['か', 'か'], ['から', 'から'],
    ['まで', 'まで'], ['だけ', 'だけ'], ['ぐらい', 'ぐらい'], ['ごろ', 'ごろ'],
    ['ね', 'ね'], ['よ', 'よ'], ['な', 'な'],
    ['です', 'です'], ['でした', 'でした'], ['じゃない', 'じゃない'], ['だ', 'だ'],
    ['ます', 'ます'], ['ました', 'ました'], ['ません', 'ません'], ['ませんでした', 'ませんでした'],
    ['たいです', 'たいです'], ['たくないです', 'たくないです'],
    ['たかったです', 'たかったです'], ['たくなかったです', 'たくなかったです'],
    ['たい', 'たい'], ['たくない', 'たくない'], ['たかった', 'たかった'], ['たくなかった', 'たくなかった'],
    ['いかがですか', 'いかがですか'], ['いかが', 'いかが'],
    ['かわきました', 'かわきました'], ['かわいて', 'かわいて'],
    ['そうですか', 'そうですか'], ['そうですね', 'そうですね'],
    ['ませんか', 'ませんか'], ['ましょう', 'ましょう'], ['ましょうか', 'ましょうか'],
    ['ですか', 'ですか'], ['ますか', 'ますか'],
    ['では', 'では'], ['でも', 'でも'], ['でも、', 'でも、'], ['から、', 'から、'],
    ['ですから', 'ですから'], ['ですから、', 'ですから、'], ['ですから', 'ですから'],
    ['あの', 'あの'], ['この', 'この'], ['その', 'その'], ['どの', 'どの'], ['こんな', 'こんな'],
    ['どんな', 'どんな'], ['どこ', 'どこ'], ['だれ', 'だれ'], ['どれ', 'どれ'],
    ['いつ', 'いつ'], ['なに', 'なに'], ['何', 'なに'], ['何か', 'なにか'], ['なにか', 'なにか'],
    ['どこか', 'どこか'], ['だれか', 'だれか'], ['いつか', 'いつか'],
    ['なにも', 'なにも'], ['だれも', 'だれも'], ['どこも', 'どこも'], ['何も', 'なにも'],
    ['いただきます', 'いただきます'], ['ちょっと', 'ちょっと'], ['…', '…'], ['・', '・'],
    ['は', 'は'], ['さん', 'さん'],
  ].forEach(([jp, kana]) => add(jp, kana));

  /* Ungkapan percakapan yang sudah dipakai bab sebelumnya / diminta prompt */
  [
    ['はい', 'はい'], ['いいえ', 'いいえ'], ['ええ', 'ええ'], ['うん', 'うん'], ['ううん', 'ううん'],
    ['ありがとうございます', 'ありがとうございます'], ['いただきます', 'いただきます'],
    ['すみません', 'すみません'], ['どうぞ', 'どうぞ'], ['ぜひ', 'ぜひ'],
    ['おなかがすきました', 'おなかがすきました'], ['おなかがいっぱいです', 'おなかがいっぱいです'],
    ['のどが渇きました', 'のどがかわきました'], ['のどがかわきました', 'のどがかわきました'],
    ['おなか', 'おなか'], ['のど', 'のど'],
  ].forEach(([jp, kana]) => add(jp, kana));

  _surfaces = Array.from(map.entries())
    .map(([jp, kana]) => ({ jp, kana }))
    .sort((a, b) => b.jp.length - a.jp.length || a.jp.localeCompare(b.jp));
  return _surfaces;
}

function allowedSurfaces() {
  return surfacePairs().map(p => p.jp);
}

/* Ubah teks kanji menjadi kana memakai kamus permukaan yang diizinkan. */
function toKana(text) {
  if (!text) return '';
  const pairs = surfacePairs();
  let out = '';
  let i = 0;
  while (i < text.length) {
    let hit = null;
    for (const p of pairs) {
      if (text.startsWith(p.jp, i) && p.jp !== p.kana) { hit = p; break; }
    }
    if (hit) { out += hit.kana; i += hit.jp.length; continue; }
    out += text[i];
    i++;
  }
  return out;
}

/* Tokenisasi kalimat: { jp, kana } */
function token(jp, kana) { return { jp, kana: kana === undefined ? jp : kana }; }
function joinJp(tokens) { return tokens.map(t => t.jp).join(''); }
function joinKana(tokens) { return tokens.map(t => t.kana).join(''); }

module.exports = {
  VOCAB, CLOCK_WORDS, NAMES, NAME_BY_ID, BY_ID, BY_JP,
  T, token, name, noun, clock, w, P, EXPR,
  verbStem, verbMasu, verbTai, verbDict, verbNai, hoshii,
  HOSHII_FORM, TAI_END, MASU_END,
  joinJp, joinKana, allowedSurfaces, surfacePairs, toKana,
  /* alias pendek untuk bank soal */
  nm: name, n: noun, c: clock, tv: verbTai, mv: verbMasu, dv: verbDict, nv: verbNai,
  hs: hoshii, st: verbStem, p: P, ex: EXPR,
};
