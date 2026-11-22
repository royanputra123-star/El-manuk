#!/usr/bin/env node
/* ============================================================================
 * tools/bab13_bank_hoshii.js  ·  Level 1–5
 * Bunpou A: ～がほしいです
 *
 * Cakupan: positif / negatif / lampau / negatif lampau · kalimat tanya dan
 * jawaban singkat · partikel が · penawaran dengan いかがですか (bukan
 * ほしいですか) · pembeda ほしい (benda) vs たい (kegiatan) · sedikit kasual.
 * Kosakata: Bab 1–13 (penekanan Bab 13). Nama tokoh mengikuti buku teks,
 * sama seperti Bab 11 — bukan kosakata isi baru.
 * ========================================================================== */
'use strict';

const G = require('./bab13_grammar');
const F = require('./bab13_factory');
const { T, name, noun, P, hoshii, w } = G;
const { rec, dlg, match } = F;

const OUT = [];
const push = r => OUT.push(r);

const jpOf = toks => toks.map(t => (typeof t === 'string' ? t : t.jp)).join('');
const asOpt = toks => ({ jp: jpOf(toks), kana: toks.map(t => (typeof t === 'string' ? t : t.kana)).join('') });

const SUBJ = {
  miraa: 'Sdr. Miller', rin: 'Sdr. Rin', santosu: 'Sdr. Santos', karina: 'Sdr. Karina',
  tanaka: 'Sdr. Tanaka', kimu: 'Sdr. Kim', yamada: 'Sdr. Yamada',
  matsumoto: 'Sdr. Matsumoto', watto: 'Sdr. Watt', min: 'Sdr. Minh', watashi: 'Saya',
};

const FORM_LABEL = { pos: 'sekarang positif', neg: 'sekarang negatif', past: 'lampau positif', pastneg: 'lampau negatif' };
const FORM_RULE = {
  pos: 'ほしいです = ingin sekarang.',
  neg: 'ほしくないです = tidak ingin sekarang (ほしい diperlakukan seperti kata sifat い).',
  past: 'ほしかったです = dulu ingin.',
  pastneg: 'ほしくなかったです = dulu tidak ingin.',
};
const FORMS = ['pos', 'neg', 'past', 'pastneg'];
const formChoices = answerForm => [answerForm, ...FORMS.filter(f => f !== answerForm)].map(f => hoshii(f));

/* ==========================================================================
   1) DRILL BENTUK — penanda waktu menentukan bentuk
   ========================================================================== */
const DRILL = [
  { obj: 'kuruma', form: 'pos', subj: 'watashi', time: null },
  { obj: 'kuruma', form: 'past', subj: 'miraa', time: 'kinou' },
  { obj: 'kamera', form: 'pos', subj: 'rin', time: null },
  { obj: 'kamera', form: 'neg', subj: 'watashi', time: null },
  { obj: 'tokei', form: 'past', subj: 'tanaka', time: 'kinou' },
  { obj: 'tokei', form: 'pastneg', subj: 'tanaka', time: 'kyonen' },
  { obj: 'jitensha', form: 'pos', subj: 'santosu', time: null },
  { obj: 'jitensha', form: 'neg', subj: 'santosu', time: null },
  { obj: 'kaban', form: 'pos', subj: 'karina', time: null },
  { obj: 'kaban', form: 'past', subj: 'karina', time: 'senshuu' },
  { obj: 'kutsu', form: 'neg', subj: 'kimu', time: null },
  { obj: 'kutsu', form: 'pastneg', subj: 'kimu', time: 'kinou' },
  { obj: 'inu', form: 'pos', subj: 'watto', time: null },
  { obj: 'inu', form: 'neg', subj: 'watto', time: null },
  { obj: 'neko', form: 'pos', subj: 'rin', time: null },
  { obj: 'neko', form: 'past', subj: 'rin', time: 'ototoi' },
  { obj: 'shiyakusho', form: 'neg', subj: 'yamada', time: null },
  { obj: 'shiyakusho', form: 'pastneg', subj: 'yamada', time: 'kinou' },
  { obj: 'puuru', form: 'pos', subj: 'watashi', time: null },
  { obj: 'puuru', form: 'past', subj: 'matsumoto', time: 'senshuu' },
  { obj: 'kawa', form: 'pos', subj: 'watashi', time: null },
  { obj: 'hana', form: 'pos', subj: 'min', time: null },
  { obj: 'kippu', form: 'neg', subj: 'min', time: null },
  { obj: 'hon', form: 'pos', subj: 'watashi', time: null },
  { obj: 'jisho', form: 'neg', subj: 'miraa', time: null },
  { obj: 'kutsu', form: 'past', subj: 'santosu', time: 'ototoi' },
];

for (const row of DRILL) {
  const t = row.time
    ? [G.n(row.time), P.wa, noun(row.obj), P.ga, hoshii(row.form)]
    : [row.subj === 'watashi' ? T('わたし', 'わたし') : name(row.subj), P.wa, noun(row.obj), P.ga, hoshii(row.form)];
  const isPast = row.form === 'past' || row.form === 'pastneg';
  const isNeg = row.form === 'neg' || row.form === 'pastneg';
  const objMean = w(row.obj).mean;
  push(rec({
    tokens: t,
    slot: t.length - 1,
    choices: formChoices(row.form),
    translation: row.time
      ? `${w(row.time).mean.charAt(0).toUpperCase() + w(row.time).mean.slice(1)} ${isNeg ? 'tidak ' : ''}ingin memiliki ${objMean}.`
      : `${SUBJ[row.subj]} ${isNeg ? 'tidak ' : ''}ingin memiliki ${objMean}.`,
    explanation: `Pola ～がほしいです: kata benda + が + ほしい. ${FORM_RULE[row.form]} ` +
      (row.time ? `Penanda waktu 「${w(row.time).jp}」 mendukung bentuk ${isPast ? 'lampau' : 'sekarang'}.` : `Target: ${FORM_LABEL[row.form]}.`),
    topic: 'hoshii_bentuk',
    meta: { form: row.form, obj: row.obj, subj: row.subj, time: row.time || '' },
  }));
}

/* ==========================================================================
   2) TANYA–JAWAB: 何がほしいですか。
   ========================================================================== */
const QA = [
  { obj: 'kuruma', yes: true }, { obj: 'kamera', yes: false },
  { obj: 'jitensha', yes: true }, { obj: 'tokei', yes: false },
  { obj: 'kaban', yes: true }, { obj: 'kutsu', yes: false },
  { obj: 'puuru', yes: true }, { obj: 'inu', yes: true },
  { obj: 'neko', yes: false }, { obj: 'shiyakusho', yes: false },
  { obj: 'hana', yes: true }, { obj: 'hon', yes: false },
  { obj: 'kamera', yes: true }, { obj: 'jitensha', yes: false },
];
for (const row of QA) {
  const objMean = w(row.obj).mean;
  const correct = row.yes
    ? [T('はい、'), noun(row.obj), P.ga, hoshii('pos')]
    : [T('いいえ、'), noun(row.obj), P.ga, hoshii('neg')];
  const wrong = row.yes
    ? [[T('はい、'), noun(row.obj), P.ga, hoshii('neg')],
       [T('はい、'), noun(row.obj), P.ga, hoshii('past')],
       [T('はい、'), noun(row.obj), P.ga, hoshii('pastneg')]]
    : [[T('いいえ、'), noun(row.obj), P.ga, hoshii('pos')],
       [T('いいえ、'), noun(row.obj), P.ga, hoshii('past')],
       [T('いいえ、'), noun(row.obj), P.ga, hoshii('pastneg')]];
  push(dlg({
    a: [T('何がほしいですか。', 'なにがほしいですか。')],
    bBefore: [], answer: asOpt(correct), bAfter: [],
    options: [correct, ...wrong].map(asOpt),
    translation: `「Apa yang kamu inginkan?」 — 「${row.yes ? `Ya, saya ingin ${objMean}` : `Tidak, saya tidak ingin ${objMean}`}.」`,
    lineId: ['Apa yang kamu inginkan?', row.yes ? `Ya, saya ingin ${objMean}.` : `Tidak, saya tidak ingin ${objMean}.`],
    explanation: 'Objek pada ほしい ditandai が: 何がほしいですか。 Jawaban singkat: はい／いいえ + N が ほしいです (positif) atau N が ほしくないです (negatif).',
    topic: 'hoshii_tanya',
    meta: { obj: row.obj, yes: row.yes },
  }));
}

/* ==========================================================================
   3) TAWARAN: ～はいかがですか — BUKAN ～がほしいですか
   ========================================================================== */
const OFFERS = ['koohii', 'koucha', 'ocha', 'juusu', 'biiru', 'mizu', 'wain', 'osake', 'osushi', 'tenpura'];
for (const id of OFFERS) {
  const correct = [noun(id), T('はいかがですか。', 'はいかがですか。')];
  const bad = [
    [noun(id), T('がほしいですか。', 'がほしいですか。')],
    [noun(id), T('をほしいですか。', 'をほしいですか。')],
    [noun(id), T('はほしかったですか。', 'はほしかったですか。')],
  ];
  push(dlg({
    a: [T('どうぞ。', 'どうぞ。')],
    bBefore: [], answer: asOpt(correct), bAfter: [],
    options: [correct, ...bad].map(asOpt),
    translation: `「Silakan.」 — 「Bagaimana kalau ${w(id).mean}?」`,
    lineId: ['Silakan.', `Bagaimana kalau ${w(id).mean}?`],
    explanation: 'Saat menawarkan sesuatu kepada lawan bicara jangan memakai ～がほしいですか. Gunakan ～はいかがですか: コーヒーはいかがですか。',
    topic: 'hoshii_tawaran',
    meta: { item: id },
  }));
}

const OFFER_REPLY = [
  { id: 'koohii', accept: true }, { id: 'koucha', accept: false },
  { id: 'juusu', accept: true }, { id: 'biiru', accept: false },
  { id: 'ocha', accept: true }, { id: 'wain', accept: false },
  { id: 'mizu', accept: true }, { id: 'osake', accept: false },
];
for (const row of OFFER_REPLY) {
  const itemMean = w(row.id).mean;
  const correct = row.accept
    ? [T('ありがとうございます。'), T('ぜひ、'), noun(row.id), P.ga, hoshii('pos')]
    : [T('ありがとうございます。'), T('でも、'), noun(row.id), P.ga, hoshii('neg')];
  const opts = [
    correct,
    [T('ありがとうございます。'), T('でも、'), noun(row.id), T('をほしいです', 'をほしいです')],
    [T('はい、'), noun(row.id), P.ga, hoshii('past')],
    [T('いいえ、'), noun(row.id), P.ga, hoshii('pastneg')],
  ];
  push(dlg({
    a: [{ jp: w(row.id).jp + 'はいかがですか。', kana: w(row.id).kana + 'はいかがですか。' }],
    bBefore: [], answer: asOpt(correct), bAfter: [],
    options: opts.map(asOpt),
    translation: `「Bagaimana kalau ${itemMean}?」 — 「${row.accept ? `Terima kasih. Saya ingin ${itemMean}.` : `Terima kasih, tapi saya tidak ingin ${itemMean}.`}」`,
    lineId: [`Bagaimana kalau ${itemMean}?`, row.accept ? `Terima kasih. Saya ingin ${itemMean}.` : `Terima kasih, tapi saya tidak ingin ${itemMean}.`],
    explanation: 'Untuk keinginan diri sendiri, ～がほしいです boleh dipakai dan objeknya ditandai が (bukan を). Untuk menawarkan, tetap gunakan いかがですか.',
    topic: 'hoshii_tawaran',
    meta: { item: row.id },
  }));
}

/* ==========================================================================
   4) PARTIKEL が pada ほしい
   ========================================================================== */
const PARTICLE_ROWS = [
  ['miraa', 'kamera'], ['rin', 'jitensha'], ['santosu', 'kaban'],
  ['karina', 'kutsu'], ['tanaka', 'tokei'], ['kimu', 'kuruma'],
  ['yamada', 'puuru'], ['matsumoto', 'inu'], ['watto', 'neko'], ['min', 'shiyakusho'],
];
for (const [subj, obj] of PARTICLE_ROWS) {
  const t = [name(subj), P.wa, noun(obj), P.ga, hoshii('pos')];
  push(rec({
    tokens: t,
    slot: 3,
    choices: [T('が'), T('を'), T('に'), T('は')],
    translation: `${SUBJ[subj]} ingin memiliki ${w(obj).mean}.`,
    explanation: 'ほしい menyatakan keadaan, jadi objeknya ditandai が (bukan を): N が ほしいです. に tidak dipakai karena tidak ada kata kerja tindakan.',
    topic: 'hoshii_partikel',
    meta: { obj },
  }));
}
const TOPIC_ROWS = [
  ['kuruma', 'miraa'], ['kamera', 'rin'], ['kaban', 'santosu'],
  ['tokei', 'karina'], ['jitensha', 'tanaka'], ['kutsu', 'kimu'],
];
for (const [obj, subj] of TOPIC_ROWS) {
  const t = [noun(obj), P.wa, name(subj), P.ga, hoshii('pos')];
  push(rec({
    tokens: t,
    slot: 1,
    choices: [T('は'), T('が'), T('を'), T('も')],
    translation: `Kalau ${w(obj).mean}, ${SUBJ[subj]} ingin memilikinya.`,
    explanation: 'Benda yang sudah dibicarakan menjadi topik dengan は, sedangkan pemilik keinginan ditandai が: N は (orang) が ほしいです.',
    topic: 'hoshii_partikel',
    meta: { obj },
  }));
}

/* ==========================================================================
   5) ほしい (benda) vs たい (kegiatan)
   ========================================================================== */
const BEDA = [
  { obj: 'kuruma', form: 'pos' }, { obj: 'kamera', form: 'pos' },
  { obj: 'tokei', form: 'neg' }, { obj: 'kaban', form: 'pos' },
  { obj: 'kutsu', form: 'neg' }, { obj: 'jitensha', form: 'pos' },
];
for (const row of BEDA) {
  const t = [T('わたしは'), noun(row.obj), P.ga, hoshii(row.form)];
  const isNeg = row.form === 'neg';
  push(rec({
    tokens: t,
    slot: t.length - 1,
    choices: [hoshii(row.form), hoshii(isNeg ? 'pos' : 'neg'), G.tv('tabemasu', 'tai'), G.tv('kaimasu', 'tai')],
    translation: `Saya ${isNeg ? 'tidak ' : ''}ingin memiliki ${w(row.obj).mean}.`,
    explanation: 'Benda memakai N が ほしいです. Kegiatan memakai kata kerja ます tanpa ます + たいです. Keduanya tidak bisa ditukar.',
    topic: 'hoshii_beda_tai',
    meta: { obj: row.obj },
  }));
}
const BEDA_VERB = [
  { obj: 'puuru', v: 'oyogimasu', act: 'berenang' },
  { obj: 'kawa', v: 'oyogimasu', act: 'berenang' },
  { obj: 'umi', v: 'oyogimasu', act: 'berenang' },
  { obj: 'nihon', v: 'ikimasu', act: 'pergi ke Jepang' },
];
for (const row of BEDA_VERB) {
  const t = [T('わたしは'), noun(row.obj), P.de, G.tv(row.v, 'tai')];
  push(rec({
    tokens: t,
    slot: t.length - 1,
    choices: [G.tv(row.v, 'tai'), hoshii('pos'), G.mv(row.v, 'masu'), G.tv(row.v, 'takunai')],
    translation: `Saya ingin ${row.act === 'pergi ke Jepang' ? 'pergi ke Jepang' : `${row.act} di ${w(row.obj).mean}`}.`,
    explanation: 'Keinginan melakukan kegiatan memakai ～たいです: 泳ぎたいです／行きたいです. ほしい hanya untuk benda yang ingin dimiliki.',
    topic: 'hoshii_beda_tai',
    meta: { obj: row.obj, verb: row.v },
  }));
}

/* ==========================================================================
   6) KALIMAT: alasan ですから + keinginan
   ========================================================================== */
const REASON_ROWS = [
  { subj: 'miraa', obj: 'kuruma', adj: 'benri', adjMean: 'praktis', adjJp: '便利' },
  { subj: 'rin', obj: 'kamera', adj: 'atarashii', adjMean: 'baru', adjJp: '新しい' },
  { subj: 'santosu', obj: 'jitensha', adj: 'benri', adjMean: 'praktis', adjJp: '便利' },
  { subj: 'karina', obj: 'kaban', adj: 'kirei', adjMean: 'indah', adjJp: '綺麗' },
  { subj: 'tanaka', obj: 'kutsu', adj: 'atarashii', adjMean: 'baru', adjJp: '新しい' },
  { subj: 'kimu', obj: 'tokei', adj: 'kirei', adjMean: 'indah', adjJp: '綺麗' },
  { subj: 'yamada', obj: 'puuru', adj: 'ookii', adjMean: 'besar', adjJp: '大きい' },
  { subj: 'watto', obj: 'inu', adj: 'chiisai', adjMean: 'kecil', adjJp: '小さい' },
];
for (const row of REASON_ROWS) {
  const tokens = [noun(row.obj), T('は'), T(row.adjJp, w(row.adj).kana), T('ですから、', 'ですから、'),
    name(row.subj), T('は'), noun(row.obj), P.ga, hoshii('pos')];
  push(rec({
    tokens,
    slot: tokens.length - 1,
    choices: formChoices('pos'),
    translation: `Karena ${w(row.obj).mean} ${row.adjMean}, ${SUBJ[row.subj]} ingin memilikinya.`,
    explanation: 'Alasan dengan ですから mendahului kalimat keinginan. Inti pola tetap N が ほしいです; ほしい berubah seperti kata sifat い.',
    topic: 'hoshii_kalimat',
    meta: { obj: row.obj, subj: row.subj },
  }));
}

/* ==========================================================================
   7) KASUAL
   ========================================================================== */
const CASUAL = [
  { q: '何がほしい？', a: [T('新しい'), noun('kamera'), P.ga, hoshii('posPlain')], ans: 'Kamera baru.' },
  { q: '何がほしい？', a: [noun('kuruma'), P.ga, hoshii('posPlain')], ans: 'Mobil.' },
  { q: 'カメラがほしい？', a: [T('うん、'), noun('kamera'), P.ga, hoshii('posPlain')], ans: 'Iya, aku mau kamera.' },
  { q: 'カメラがほしい？', a: [T('ううん、'), noun('kamera'), P.ga, hoshii('negPlain')], ans: 'Tidak, aku tidak mau kamera.' },
  { q: '車がほしかった？', a: [T('うん、'), hoshii('pastPlain')], ans: 'Iya, dulu aku mau.' },
  { q: '車がほしかった？', a: [T('ううん、'), hoshii('pastnegPlain')], ans: 'Tidak, dulu aku tidak mau.' },
  { q: '何がほしい？', a: [noun('jitensha'), P.ga, hoshii('posPlain')], ans: 'Sepeda.' },
];
for (const row of CASUAL) {
  const correct = asOpt(row.a);
  const opts = [correct];
  for (const alt of [[hoshii('negPlain')], [hoshii('pastPlain')], [correct.jp + 'です']]) {
    const o = asOpt(alt);
    if (!opts.some(x => x.jp === o.jp)) opts.push(o);
  }
  let fill = 0;
  while (opts.length < 4) {
    const o = asOpt([T('ううん、'), noun('kuruma'), P.ga, hoshii(fill % 2 ? 'posPlain' : 'pastnegPlain')]);
    if (!opts.some(x => x.jp === o.jp)) opts.push(o);
    fill++;
  }
  push(dlg({
    a: [T(row.q)],
    bBefore: [], answer: correct, bAfter: [],
    options: opts.slice(0, 4),
    translation: `「${row.q}」 — 「${row.ans}」 (kasual)`,
    lineId: [row.q, row.ans],
    explanation: 'Bentuk kasual ほしい tanpa です; pertanyaan memakai intonasi naik. Lampau kasual ほしかった, negatif lampau ほしくなかった. Fokus utama tetap bentuk sopan.',
    topic: 'hoshii_kasual',
    casual: true,
    meta: {},
  }));
}

/* ==========================================================================
   8) MATCH
   ========================================================================== */
push(match({
  pairs: [
    { jp: 'ほしいです', id: 'ingin sekarang', vocabId: 'h01' },
    { jp: 'ほしくないです', id: 'tidak ingin sekarang', vocabId: 'h02' },
    { jp: 'ほしかったです', id: 'dulu ingin', vocabId: 'h03' },
    { jp: 'ほしくなかったです', id: 'dulu tidak ingin', vocabId: 'h04' },
  ],
  translation: 'ほしい berubah seperti kata sifat い: ほしいです · ほしくないです · ほしかったです · ほしくなかったです.',
  explanation: 'Empat bentuk ini menyatakan keinginan pada waktu dan polaritas berbeda.',
  topic: 'hoshii_match',
}));
push(match({
  pairs: [
    { jp: '何がほしいですか。', id: 'Apa yang kamu inginkan?', vocabId: 'h11' },
    { jp: '車がほしいです。', id: 'Saya ingin mobil.', vocabId: 'h12' },
    { jp: 'コーヒーはいかがですか。', id: 'Bagaimana kalau kopi?', vocabId: 'h13' },
    { jp: 'いいえ、ほしくないです。', id: 'Tidak, saya tidak ingin.', vocabId: 'h14' },
  ],
  translation: 'Pasangan tanya-jawab seputar ほしい, termasuk tawaran いかがですか.',
  explanation: 'Menanyakan keinginan boleh dengan 何がほしいですか, tetapi menawarkan benda memakai ～はいかがですか.',
  topic: 'hoshii_match',
}));
push(match({
  pairs: [
    { jp: 'が', id: 'objek pada ほしい', vocabId: 'h21' },
    { jp: 'を', id: 'objek kata kerja', vocabId: 'h22' },
    { jp: 'たいです', id: 'ingin melakukan', vocabId: 'h23' },
    { jp: 'ほしいです', id: 'ingin memiliki', vocabId: 'h24' },
  ],
  translation: 'が untuk ほしい; を untuk objek kata kerja; たいです = ingin melakukan; ほしいです = ingin memiliki.',
  explanation: 'Kunci Bab 13: 車がほしいです vs 車を買いたいです.',
  topic: 'hoshii_match',
}));

module.exports = {
  band: 'hoshii',
  focus: '～がほしいです (positif · negatif · lampau · negatif lampau · tanya-jawab · いかがですか)',
  records: OUT,
};
