#!/usr/bin/env node
/* ============================================================================
 * tools/bab13_bank_itsuka.js  ·  Level 16–20
 * Bunpou D-1/D-2: いつか (suatu hari nanti) dan だれか (seseorang)
 *
 * いつか tidak memakai partikel, menempel langsung pada predikat.
 * だれか memakai が bila menjadi subjek: 教室に だれか いますか。
 * が boleh dihilangkan setelah だれか (だれか いますか); を setelah なにか
 * dan へ setelah どこか juga boleh hilang (band berikutnya).
 * ========================================================================== */
'use strict';

const G = require('./bab13_grammar');
const F = require('./bab13_factory');
const { T, name, noun, P, w } = G;
const { rec, dlg, match } = F;

const OUT = [];
const push = r => OUT.push(r);
const jpOf = toks => toks.map(t => (typeof t === 'string' ? t : t.jp)).join('');
const asOpt = toks => ({ jp: jpOf(toks), kana: toks.map(t => (typeof t === 'string' ? t : t.kana)).join('') });

const SUBJ = {
  miraa: 'Sdr. Miller', rin: 'Sdr. Rin', santosu: 'Sdr. Santos', karina: 'Sdr. Karina',
  tanaka: 'Sdr. Tanaka', kimu: 'Sdr. Kim', yamada: 'Sdr. Yamada',
  matsumoto: 'Sdr. Matsumoto', watto: 'Sdr. Watt', min: 'Sdr. Minh',
};

/* ==========================================================================
   1) いつか — tanpa partikel, dengan keinginan (たい／ほしい) dan harapan
   ========================================================================== */
const ITSUKA = [
  { v: 'hatarakimasu', place: 'nihon', act: 'bekerja', mean: 'Saya ingin suatu hari nanti bekerja di Jepang.' },
  { v: 'ikimasu', place: 'nihon', act: 'pergi', mean: 'Saya ingin suatu hari nanti pergi ke Jepang.' },
  { v: 'ikimasu', place: 'doitsu', act: 'pergi', mean: 'Saya ingin suatu hari nanti pergi ke Jerman.' },
  { v: 'ikimasu', place: 'furansu', act: 'pergi', mean: 'Saya ingin suatu hari nanti pergi ke Prancis.' },
  { v: 'ikimasu', place: 'indoneshia', act: 'pulang', mean: 'Saya ingin suatu hari nanti pulang ke Indonesia.' },
  { v: 'oyogimasu', place: 'umi', act: 'berenang', mean: 'Saya ingin suatu hari nanti berenang di laut.' },
  { v: 'mimasu', place: 'kabuki', act: 'menonton', mean: 'Saya ingin suatu hari nanti menonton kabuki.', obj: 'kabuki' },
  { v: 'oyogimasu', place: 'puuru', act: 'berenang', mean: 'Saya ingin suatu hari nanti berenang di kolam renang.' },
  { v: 'ikimasu', place: 'kankoku', act: 'pergi', mean: 'Saya ingin suatu hari nanti pergi ke Korea.' },
  { v: 'benkyoushimasu', place: 'keizai', act: 'belajar', mean: 'Saya ingin suatu hari nanti belajar ekonomi.', obj: 'keizai' },
  { v: 'hatarakimasu', place: 'indoneshia', act: 'bekerja', mean: 'Saya ingin suatu hari nanti bekerja di Indonesia.' },
  { v: 'hatarakimasu', place: 'kankoku', act: 'bekerja', mean: 'Saya ingin suatu hari nanti bekerja di Korea.' },
  { v: 'ikimasu', place: 'itaria', act: 'pergi', mean: 'Saya ingin suatu hari nanti pergi ke Italia.' },
  { v: 'ikimasu', place: 'burajiru', act: 'pergi', mean: 'Saya ingin suatu hari nanti pergi ke Brasil.' },
  { v: 'ikimasu', place: 'mareeshia', act: 'pergi', mean: 'Saya ingin suatu hari nanti pergi ke Malaysia.' },
  { v: 'ikimasu', place: 'ingirisu', act: 'pergi', mean: 'Saya ingin suatu hari nanti pergi ke Inggris.' },
  { v: 'ikimasu', place: 'chuugoku', act: 'pergi', mean: 'Saya ingin suatu hari nanti pergi ke Tiongkok.' },
  { v: 'benkyoushimasu', place: 'nihongo', act: 'belajar', mean: 'Saya ingin suatu hari nanti belajar bahasa Jepang.', obj: 'nihongo' },
  { v: 'benkyoushimasu', place: 'kabuki', act: 'belajar', mean: 'Saya ingin suatu hari nanti mendalami kabuki.', obj: 'kabuki' },
  { v: 'mimasu', place: 'eiga', act: 'menonton', mean: 'Saya ingin suatu hari nanti menonton film Jepang.', obj: 'eiga' },
  { v: 'mimasu', place: 'bijutsu', act: 'melihat', mean: 'Saya ingin suatu hari nanti melihat kesenian Jepang.', obj: 'e' },
  { v: 'kaimonoshimasu', place: 'depaato', act: 'berbelanja', mean: 'Saya ingin suatu hari nanti berbelanja di department store.' },
  { v: 'sanposhimasu', place: 'machi', act: 'berjalan-jalan', mean: 'Saya ingin suatu hari nanti berjalan-jalan di kota.' },
];
for (const row of ITSUKA) {
  const t = [T('わたしは'), T('いつか'), noun(row.obj || row.place), row.obj ? P.wo : P.e, G.tv(row.v, 'tai')];
  /* いつか hanya sekali di depan; jangan pakai partikel setelah いつか */
  push(rec({
    tokens: t,
    slot: 1,
    choices: [T('いつか'), T('いつかで'), T('いつかの'), T('いつかへ')],
    translation: row.mean,
    explanation: 'いつか (suatu hari nanti) tidak memakai partikel dan langsung diikuti bagian kalimat berikutnya: いつか 日本へ 行きたいです. Jangan menambahkan で／の／へ setelah いつか.',
    topic: 'itsuka_pakai',
    meta: { verb: row.v },
  }));
}
/* いつか + ほしい (barang) */
const ITSUKA_HOSHI = [
  { subj: 'miraa', obj: 'kuruma' }, { subj: 'rin', obj: 'jitensha' },
  { subj: 'santosu', obj: 'tokei' }, { subj: 'karina', obj: 'kamera' },
  { subj: 'tanaka', obj: 'puuru' }, { subj: 'kimu', obj: 'inu' },
  { subj: 'yamada', obj: 'kuruma' }, { subj: 'matsumoto', obj: 'jitensha' },
  { subj: 'watto', obj: 'kamera' }, { subj: 'min', obj: 'kaban' },
  { subj: 'miraa', obj: 'tokei' }, { subj: 'rin', obj: 'kutsu' },
];
for (const row of ITSUKA_HOSHI) {
  const t = [name(row.subj), P.wa, T('いつか'), noun(row.obj), P.ga, G.hs('pos')];
  push(rec({
    tokens: t,
    slot: 2,
    choices: [T('いつか'), T('いつかが'), T('いつかに'), T('いつかを')],
    translation: `Suatu hari nanti ${SUBJ[row.subj]} ingin memiliki ${w(row.obj).mean}.`,
    explanation: 'いつか adalah keterangan waktu sehingga tidak memakai partikel: いつか 車が ほしいです. Partikel が di sini milik objek ほしい, bukan milik いつか.',
    topic: 'itsuka_pakai',
    meta: { obj: row.obj },
  }));
}

/* ==========================================================================
   2) だれか — subjek dengan が, boleh hilang
   ========================================================================== */
const DAREKA = [
  { place: 'kyoushitsu', verb: 'imasu', yes: true, person: 'miraa' },
  { place: 'kyoushitsu', verb: 'imasu', yes: false, person: null },
  { place: 'heya', verb: 'imasu', yes: true, person: 'rin' },
  { place: 'heya', verb: 'imasu', yes: false, person: null },
  { place: 'kouen', verb: 'imasu', yes: true, person: 'kodomo' },
  { place: 'kouen', verb: 'imasu', yes: false, person: null },
  { place: 'eki', verb: 'imasu', yes: true, person: 'tomodachi' },
  { place: 'eki', verb: 'imasu', yes: false, person: null },
  { place: 'shokudou', verb: 'imasu', yes: true, person: 'gakusei' },
  { place: 'shokudou', verb: 'imasu', yes: false, person: null },
  { place: 'toshokan', verb: 'imasu', yes: true, person: 'gakusei' },
  { place: 'lobby', verb: 'imasu', yes: false, person: null },
  { place: 'uketsuke', verb: 'imasu', yes: true, person: 'miraa' },
  { place: 'uketsuke', verb: 'imasu', yes: false, person: null },
  { place: 'kaigishitsu', verb: 'imasu', yes: true, person: 'tanaka' },
  { place: 'kaigishitsu', verb: 'imasu', yes: false, person: null },
  { place: 'robii', verb: 'imasu', yes: true, person: 'santosu' },
];
const PLACE_LABEL = {
  kyoushitsu: 'ruang kelas', heya: 'kamar', kouen: 'taman', eki: 'stasiun',
  shokudou: 'kantin', toshokan: 'perpustakaan', robii: 'lobi',
  uketsuke: 'meja resepsionis', kaigishitsu: 'ruang rapat',
};
for (const row of DAREKA) {
  const placeId = row.place === 'lobby' ? 'robii' : row.place;
  const q = [noun(placeId), T('に'), T('だれか'), P.ga, G.mv('imasu', 'masu'), P.ka];
  const answer = row.yes
    ? [T('はい、'), row.person === 'kodomo' ? noun('kodomo') : row.person === 'gakusei' ? noun('gakusei') : row.person === 'tomodachi' ? noun('tomodachi') : name(row.person), P.ga, G.mv('imasu', 'masu')]
    : [T('いいえ、'), T('だれも'), G.mv('imasu', 'masen')];
  const options = [
    answer,
    row.yes
      ? [T('いいえ、'), T('だれも'), G.mv('imasu', 'masen')]
      : [T('はい、'), noun('gakusei'), P.ga, G.mv('imasu', 'masu')],
    [T('はい、'), noun(placeId), T('に'), G.mv('imasu', 'masu')],
    [T('いいえ、'), noun(placeId), P.ga, G.mv('arimasu', 'masen')],
  ];
  push(dlg({
    a: q,
    bBefore: [], answer: asOpt(answer), bAfter: [],
    options: options.map(asOpt),
    translation: `「Apakah ada seseorang di ${PLACE_LABEL[row.place] || w(placeId).mean}?」 — 「${row.yes ? 'Ya, ada.' : 'Tidak, tidak ada siapa-siapa.'}」`,
    lineId: [`Apakah ada seseorang di ${PLACE_LABEL[row.place] || w(placeId).mean}?`, row.yes ? 'Ya, ada.' : 'Tidak, tidak ada siapa-siapa.'],
    explanation: 'だれか (seseorang) menjadi subjek dan umumnya memakai が: 教室に だれかが いますか。 Jawaban tidak ada: だれも いません. Untuk orang selalu います, bukan あります.',
    topic: 'dareka_tanya',
    meta: { place: placeId, yes: row.yes },
  }));
}

/* だれか sebagai objek: だれかに 会いましたか */
const DAREKA_OBJ = [
  { verb: 'aimasu', form: 'mashita', mean: 'bertemu seseorang', ans: 'はい、ミラーさんに会いました。' },
  { verb: 'kikimasu', form: 'mashita', mean: 'bertanya kepada seseorang', ans: 'はい、先生に聞きました。' },
  { verb: 'denwa', form: 'kakemasu', mean: 'menelepon seseorang', ans: 'はい、友達に電話しました。' },
];
for (const row of DAREKA_OBJ) {
  const q = row.verb === 'denwa'
    ? [T('だれか'), T('に'), noun('denwa'), G.mv('kakemasu', 'mashita'), P.ka]
    : [T('だれか'), T('に'), G.mv(row.verb, 'mashita'), P.ka];
  const opts = [
    [T('はい、'), noun('tomodachi'), T('に'), G.mv(row.verb === 'denwa' ? 'kakemasu' : row.verb, 'mashita')],
    [T('はい、'), noun('tomodachi'), P.ga, G.mv(row.verb === 'denwa' ? 'kakemasu' : row.verb, 'mashita')],
    [T('はい、'), noun('tomodachi'), P.wo, G.mv(row.verb === 'denwa' ? 'kakemasu' : row.verb, 'mashita')],
    [T('いいえ、'), T('だれか'), T('に'), G.mv(row.verb === 'denwa' ? 'kakemasu' : row.verb, 'masendeshita')],
  ];
  push(dlg({
    a: q,
    bBefore: [], answer: asOpt(opts[0]), bAfter: [],
    options: opts.map(asOpt),
    translation: `「Apakah kamu ${row.mean}?」 — 「Ya, saya ${row.mean.replace('seseorang', 'teman')}.」`,
    lineId: [`Apakah kamu ${row.mean}?`, 'Ya, saya melakukannya.'],
    explanation: 'だれか yang menjadi objek pelaku memakai に (だれかに 会います／聞きます). が dipakai bila だれか adalah subjek kalimat.',
    topic: 'dareka_objek',
    meta: { verb: row.verb },
  }));
}

/* だれか + が hilang (boleh tanpa が) */
const DAREKA_NOGA = [
  { place: 'kyoushitsu', person: 'miraa' },
  { place: 'heya', person: 'rin' },
  { place: 'kouen', person: 'kodomo' },
  { place: 'eki', person: 'tomodachi' },
];
for (const row of DAREKA_NOGA) {
  const withGa = [noun(row.place), T('に'), T('だれか'), P.ga, G.mv('imasu', 'masu'), P.ka];
  const noGa = [noun(row.place), T('に'), T('だれか'), G.mv('imasu', 'masu'), P.ka];
  const personTok = row.person === 'kodomo' ? noun('kodomo') : row.person === 'tomodachi' ? noun('tomodachi') : name(row.person);
  push(dlg({
    a: noGa,
    bBefore: [], answer: asOpt([T('はい、'), personTok, P.ga, G.mv('imasu', 'masu')]), bAfter: [],
    options: [
      [T('はい、'), personTok, P.ga, G.mv('imasu', 'masu')],
      [T('いいえ、'), T('だれか'), G.mv('imasu', 'masen')],
      [T('はい、'), personTok, P.ni, G.mv('arimasu', 'masu')],
      [T('はい、'), noun(row.place), T('に'), G.mv('imasu', 'masu')],
    ].map(asOpt),
    translation: `「Apakah ada seseorang di ${w(row.place).mean}?」 — 「Ya, ada.」`,
    lineId: [`Apakah ada seseorang di ${w(row.place).mean}?`, 'Ya, ada.'],
    explanation: 'Setelah だれか, partikel が boleh dihilangkan dalam percakapan: 教室に だれか いますか。 Keduanya benar, tetapi jawaban tetap memakai が untuk menyebut orangnya.',
    topic: 'dareka_partikel',
    meta: { place: row.place },
  }));
  void withGa;
}

/* ==========================================================================
   3) いつか vs だれか (bentuk kata tanya + か)
   ========================================================================== */
const BEDA = [
  { a: 'いつか', b: 'だれか', q: [T('だれか'), T('に'), G.mv('aimasu', 'mashita'), P.ka], mean: 'Apakah kamu bertemu seseorang?', correct: 'dareka' },
  { a: 'いつか', b: 'だれか', q: [T('いつか'), noun('nihon'), P.e, G.tv('ikimasu', 'tai')], mean: 'Suatu hari nanti saya ingin pergi ke Jepang.', correct: 'itsuka' },
  { a: 'いつか', b: 'だれか', q: [noun('kyoushitsu'), T('に'), T('だれか'), P.ga, G.mv('imasu', 'masu')], mean: 'Di kelas ada seseorang.', correct: 'dareka' },
  { a: 'いつか', b: 'だれか', q: [T('いつか'), noun('kaigi'), T('に'), G.mv('demasu', 'masu')], mean: 'Suatu hari nanti saya akan mengikuti rapat.', correct: 'itsuka' },
];
for (const row of BEDA) {
  const tokens = row.q;
  const slot = tokens.findIndex(t => t.jp === row.correct === 'itsuka' ? 'いつか' : 'だれか');
  const idx = tokens.findIndex(t => t.jp === (row.correct === 'itsuka' ? 'いつか' : 'だれか'));
  push(rec({
    tokens,
    slot: idx,
    choices: [row.correct === 'itsuka' ? T('いつか') : T('だれか'),
      row.correct === 'itsuka' ? T('だれか') : T('いつか'),
      T('いつかは'), T('だれかは')],
    translation: row.mean,
    explanation: 'いつか = suatu hari nanti (waktu). だれか = seseorang (orang). Keduanya dibentuk dari kata tanya + か dan tidak boleh tertukar.',
    topic: 'itsuka_dareka_beda',
    meta: {},
  }));
  void slot;
}

/* ==========================================================================
   4) いつか dalam kalimat panjang & konteks
   ========================================================================== */
const ITSUKA_LONG = [
  { tokens: [T('わたしは'), T('いつか'), noun('nihon'), P.de, G.tv('hatarakimasu', 'tai')], mean: 'Suatu hari nanti saya ingin bekerja di Jepang.' },
  { tokens: [T('いつか'), noun('sekai'), P.e, G.tv('ikimasu', 'tai')], mean: 'Suatu hari nanti saya ingin pergi ke seluruh dunia.' },
  { tokens: [T('いつか'), noun('kaigi'), T('に'), G.tv('demasu', 'tai')], mean: 'Suatu hari nanti saya ingin mengikuti rapat.' },
  { tokens: [T('いつか'), noun('kabuki'), P.wo, G.tv('mimasu', 'tai')], mean: 'Suatu hari nanti saya ingin menonton kabuki.' },
  { tokens: [T('いつか'), noun('nihongo'), P.wo, G.tv('benkyoushimasu', 'tai')], mean: 'Suatu hari nanti saya ingin belajar bahasa Jepang.' },
  { tokens: [T('いつか'), noun('indoneshia'), P.e, G.tv('kaerimasu', 'tai')], mean: 'Suatu hari nanti saya ingin pulang ke Indonesia.' },
];
for (const row of ITSUKA_LONG) {
  const idx = row.tokens.findIndex(t => t.jp === 'いつか');
  push(rec({
    tokens: row.tokens,
    slot: idx,
    choices: [T('いつか'), T('いつかへ'), T('なにか'), T('どこか')],
    translation: row.mean,
    explanation: 'いつか menyatakan waktu yang belum pasti (suatu hari nanti) dan tidak memakai partikel. なにか untuk benda, どこか untuk tempat, だれか untuk orang.',
    topic: 'itsuka_pakai',
    meta: {},
  }));
}

/* ==========================================================================
   5) MATCH
   ========================================================================== */
push(match({
  pairs: [
    { jp: 'いつか', id: 'suatu hari nanti', vocabId: 'i01' },
    { jp: 'だれか', id: 'seseorang', vocabId: 'i02' },
    { jp: 'なにか', id: 'sesuatu', vocabId: 'i03' },
    { jp: 'どこか', id: 'suatu tempat', vocabId: 'i04' },
  ],
  translation: 'Empat kata tidak tentu Bab 13: いつか · だれか · なにか · どこか.',
  explanation: 'Semua dibentuk dari kata tanya + か. Arti dan fungsi partikelnya berbeda sesuai jenisnya.',
  topic: 'itsuka_match',
}));
push(match({
  pairs: [
    { jp: 'いつか日本へ行きたいです。', id: 'Suatu hari nanti ingin pergi ke Jepang.', vocabId: 'i11' },
    { jp: '教室にだれかがいます。', id: 'Di kelas ada seseorang.', vocabId: 'i12' },
    { jp: '何か飲みたいです。', id: 'Ingin minum sesuatu.', vocabId: 'i13' },
    { jp: 'どこかへ行きたいです。', id: 'Ingin pergi ke suatu tempat.', vocabId: 'i14' },
  ],
  translation: 'Contoh kalimat untuk empat kata tidak tentu.',
  explanation: 'Perhatikan partikel: だれか が (subjek orang), 何か を (objek benda, boleh hilang), どこか へ (arah, boleh hilang), いつか tanpa partikel.',
  topic: 'itsuka_match',
}));
push(match({
  pairs: [
    { jp: 'いつ', id: 'kapan (bertanya)', vocabId: 'i21' },
    { jp: 'いつか', id: 'suatu hari (tidak pasti)', vocabId: 'i22' },
    { jp: 'だれ', id: 'siapa (bertanya)', vocabId: 'i23' },
    { jp: 'だれか', id: 'seseorang (tidak pasti)', vocabId: 'i24' },
  ],
  translation: 'Bandingkan kata tanya biasa dan bentuk + か yang tidak tentu.',
  explanation: 'Tanpa か, kalimat menjadi pertanyaan; dengan か, menjadi pernyataan tentang sesuatu yang tidak pasti.',
  topic: 'itsuka_match',
}));

/* ==========================================================================
   6) KASUAL
   ========================================================================== */
const CASUAL = [
  { q: 'いつか日本へ行きたい？', a: [T('うん、'), T('いつか'), G.dv('ikimasu'), T('（行きたい）')], ans: 'Iya, suatu hari nanti.' },
  { q: '教室にだれかいる？', a: [T('ううん、'), T('だれも'), G.nv('imasu')], ans: 'Tidak, tidak ada siapa-siapa.' },
  { q: '教室にだれかいる？', a: [T('うん、'), name('miraa'), P.ga, G.dv('imasu')], ans: 'Iya, ada Sdr. Miller.' },
  { q: 'だれか来ましたか。', a: [T('いいえ、'), T('だれも'), G.mv('kimasu', 'masendeshita')], ans: 'Tidak, tidak ada yang datang.' },
];
for (const row of CASUAL) {
  const correct = asOpt(row.a);
  const opts = [correct, asOpt([T('ううん、'), T('どこも'), G.nv('imasu')]),
    asOpt([T('うん、'), T('だれか'), P.ga, G.dv('imasu')]),
    asOpt([T('うん、'), T('いつか'), G.dv('ikimasu')])];
  const uniq = [];
  const seen = new Set();
  for (const o of opts) { if (!seen.has(o.jp)) { seen.add(o.jp); uniq.push(o); } }
  let k = 0;
  while (uniq.length < 4) {
    const o = asOpt([T('いいえ'), T('。'.repeat(k + 1))]);
    if (!seen.has(o.jp)) { seen.add(o.jp); uniq.push(o); }
    k++;
  }
  push(dlg({
    a: [T(row.q)],
    bBefore: [], answer: correct, bAfter: [],
    options: uniq.slice(0, 4),
    translation: `「${row.q}」 — 「${row.ans}」 (kasual)`,
    lineId: [row.q, row.ans],
    explanation: 'Bentuk kasual: います → いる, 来ます → 来る. だれか tetap memakai が; だれも dipakai untuk jawaban negatif.',
    topic: 'itsuka_kasual',
    casual: true,
    meta: {},
  }));
}

/* ==========================================================================
   7) SOAL SUSUN & TERJEMAH via record tambahan (gaya kalimat penuh)
   ========================================================================== */
const FULL = [
  { tokens: [T('きょうしつ'), T('に'), T('だれか'), T('が'), T('いますか。', 'いますか。')], mean: 'Apakah ada seseorang di ruang kelas?', slot: 2, choices: ['だれか', 'いつか', 'なにか', 'どこか'] },
  { tokens: [noun('kaigishitsu'), T('に'), T('だれか'), T('が'), T('います', 'います'), T('。')], mean: 'Di ruang rapat ada seseorang.', slot: 2, choices: ['だれか', 'だれ', 'いつか', 'どこ'] },
  { tokens: [T('いつか'), noun('kaigi'), T('に'), G.tv('demasu', 'tai'), T('。')], mean: 'Suatu hari nanti saya ingin mengikuti rapat.', slot: 0, choices: ['いつか', 'いつかへ', 'だれか', 'なにか'] },
  { tokens: [T('いつか'), noun('kabuki'), P.wo, G.tv('mimasu', 'tai'), T('。')], mean: 'Suatu hari nanti saya ingin menonton kabuki.', slot: 0, choices: ['いつか', 'いつ', 'どこか', 'なにか'] },
  { tokens: [T('だれか'), T('に'), noun('denwa'), P.wo, G.mv('kakemasu', 'mashita'), T('。')], mean: 'Saya menelepon seseorang.', slot: 0, choices: ['だれか', 'だれ', 'どこか', 'なにか'] },
  { tokens: [T('へや'), T('に'), T('だれか'), T('が'), G.mv('imasu', 'masu'), T('。')], mean: 'Di kamar ada seseorang.', slot: 2, choices: ['だれか', 'なにか', 'どこか', 'だれも'] },
];
for (const row of FULL) {
  push(rec({
    tokens: row.tokens,
    slot: row.slot,
    choices: row.choices.map(x => T(x)),
    translation: row.mean,
    explanation: 'だれか = seseorang (memakai が sebagai subjek atau に bila menjadi objek pelaku). いつか = suatu hari nanti (tanpa partikel).',
    topic: 'dareka_kalimat',
    meta: {},
  }));
}

/* ==========================================================================
   8) TAMBAHAN: いつか pada kalimat beragam + だれか pada kalimat beragam
   ========================================================================== */
const EXTRA_FIXED = [
  { tokens: [T('いつか'), noun('nihon'), P.de, noun('kaigi'), P.e, G.tv('demasu', 'tai')], mean: 'Suatu hari nanti saya ingin mengikuti rapat di Jepang.' },
  { tokens: [T('いつか'), noun('tomodachi'), P.to, noun('nihon'), P.e, G.tv('ikimasu', 'tai')], mean: 'Suatu hari nanti saya ingin pergi ke Jepang bersama teman.' },
  { tokens: [T('いつか'), noun('kazoku'), P.to, noun('ryouri'), P.wo, G.tv('tabemasu', 'tai')], mean: 'Suatu hari nanti saya ingin makan masakan bersama keluarga.' },
  { tokens: [T('いつか'), noun('umi'), P.e, noun('kuruma'), P.de, G.tv('ikimasu', 'tai')], mean: 'Suatu hari nanti saya ingin pergi ke laut dengan mobil.' },
  { tokens: [T('いつか'), noun('nihongo'), P.de, noun('shigoto'), P.wo, G.tv('shimasu', 'tai')], mean: 'Suatu hari nanti saya ingin bekerja dengan bahasa Jepang.' },
  { tokens: [T('いつか'), noun('kuni'), P.e, G.tv('kaerimasu', 'tai')], mean: 'Suatu hari nanti saya ingin pulang ke negara saya.' },
  { tokens: [T('だれか'), T('と'), noun('kouen'), P.e, G.tv('asobimasu', 'tai')], mean: 'Saya ingin bermain ke taman dengan seseorang.' },
  { tokens: [noun('uketsuke'), T('に'), T('だれか'), T('が'), G.mv('imasu', 'masu')], mean: 'Di meja resepsionis ada seseorang.' },
  { tokens: [noun('kaigishitsu'), T('に'), T('だれか'), T('が'), G.mv('imasu', 'masen')], mean: 'Di ruang rapat tidak ada siapa-siapa.' },
  { tokens: [T('だれか'), T('が'), noun('denwa'), P.wo, G.mv('kakemasu', 'mashita')], mean: 'Seseorang menelepon.' },
  { tokens: [T('だれか'), T('に'), noun('kitte'), P.wo, G.mv('agemasu', 'mashita')], mean: 'Saya memberi perangko kepada seseorang.' },
];
for (const row of EXTRA_FIXED) {
  if (row.skip) continue;
  const idx = row.tokens.findIndex(t => ['いつか', 'だれか', 'なにか', 'どこか'].includes(t.jp));
  const right = row.tokens[idx < 0 ? 0 : idx];
  push(rec({
    tokens: row.tokens,
    slot: idx < 0 ? 0 : idx,
    choices: [right, ...['いつか', 'だれか', 'なにか', 'どこか'].filter(x => x !== right.jp).map(x => T(x))],
    translation: row.mean,
    explanation: 'Pilih kata tidak tentu sesuai jenis: いつか waktu, だれか orang, なにか benda, どこか tempat.',
    topic: 'itsuka_pakai',
    meta: {},
  }));
}
const EXTRA2 = [
  { tokens: [T('いつか'), noun('nihon'), P.e, noun('kaigi'), T('に'), G.tv('demasu', 'tai')], mean: 'Suatu hari nanti saya ingin pergi ke Jepang untuk mengikuti rapat.' },
  { tokens: [T('いつか'), noun('kuni'), P.e, noun('kazoku'), T('に'), G.st('aimasu'), T('に'), G.tv('kaerimasu', 'tai')], mean: 'Suatu hari nanti saya ingin pulang kampung untuk bertemu keluarga.' },
  { tokens: [T('だれか'), T('に'), noun('nihongo'), P.wo, G.tv('oshiemasu', 'tai')], mean: 'Saya ingin mengajari seseorang bahasa Jepang.' },
  { tokens: [T('だれか'), T('に'), noun('kamera'), P.wo, G.tv('karimasu', 'tai')], mean: 'Saya ingin meminjam kamera dari seseorang.' },
  { tokens: [T('きょうしつ'), T('に'), T('だれか'), T('が'), G.mv('imasu', 'masu'), T('か', 'か')], mean: 'Apakah di kelas ada seseorang?' },
  { tokens: [T('いつか'), noun('shiyakusho'), P.e, noun('touroku'), T('に'), G.tv('ikimasu', 'tai')], mean: 'Suatu hari nanti saya ingin pergi ke kantor pemerintah kota untuk mendaftar.' },
  { tokens: [T('いつか'), noun('puuru'), P.e, noun('kodomo'), P.to, G.tv('ikimasu', 'tai')], mean: 'Suatu hari nanti saya ingin pergi ke kolam renang bersama anak.' },
  { tokens: [T('いつか'), noun('kuni'), P.e, noun('ryoushin'), T('に'), G.st('aimasu'), T('に'), G.tv('kaerimasu', 'tai')], mean: 'Suatu hari nanti saya ingin pulang ke negara saya untuk bertemu orang tua.' },
];
for (const row of EXTRA2) {
  if (!row.tokens.length) continue;
  const idx = row.tokens.findIndex(t => ['いつか', 'だれか', 'なにか', 'どこか'].includes(t.jp));
  const right = row.tokens[idx < 0 ? 0 : idx];
  push(rec({
    tokens: row.tokens,
    slot: idx < 0 ? 0 : idx,
    choices: [right, ...['いつか', 'だれか', 'なにか', 'どこか'].filter(x => x !== right.jp).map(x => T(x))],
    translation: row.mean,
    explanation: 'Kata tanya + か menunjukkan sesuatu yang tidak pasti. Pilih yang sesuai jenis kata pada kalimat.',
    topic: 'dareka_kalimat',
    meta: {},
  }));
}

module.exports = {
  band: 'itsuka',
  focus: 'Kata tanya + か: いつか (suatu hari) dan だれか (seseorang)',
  records: OUT,
};
