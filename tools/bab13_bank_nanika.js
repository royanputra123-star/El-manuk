#!/usr/bin/env node
/* ============================================================================
 * tools/bab13_bank_nanika.js  ·  Level 21–25
 * Bunpou D-3/D-4: なにか (sesuatu) dan どこか (suatu tempat)
 *
 * 何か sebagai objek memakai を, tetapi を boleh dihilangkan:
 *   何かを 飲みたいです / 何か 飲みたいです
 * どこか sebagai arah memakai へ, tetapi へ boleh dihilangkan:
 *   どこかへ 行きたいです / どこか 行きたいです
 * どこか yang menjadi tempat kegiatan memakai で: どこかで 食べましょう。
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

const SUBJ = { miraa: 'Sdr. Miller', rin: 'Sdr. Rin', santosu: 'Sdr. Santos', karina: 'Sdr. Karina', tanaka: 'Sdr. Tanaka', kimu: 'Sdr. Kim', yamada: 'Sdr. Yamada', matsumoto: 'Sdr. Matsumoto', watto: 'Sdr. Watt', min: 'Sdr. Minh' };

/* ==========================================================================
   1) なにか — dengan dan tanpa を
   ========================================================================== */
const NANIKA_OBJ = [
  { v: 'nomimasu', form: 'tai', mean: 'Saya ingin minum sesuatu.', ctx: 'のどが渇きましたから、' },
  { v: 'tabemasu', form: 'tai', mean: 'Saya ingin makan sesuatu.', ctx: 'おなかがすきましたから、' },
  { v: 'kaimasu', form: 'tai', mean: 'Saya ingin membeli sesuatu.' },
  { v: 'yomimasu', form: 'tai', mean: 'Saya ingin membaca sesuatu.' },
  { v: 'mimasu', form: 'tai', mean: 'Saya ingin menonton sesuatu.' },
  { v: 'kikimasu', form: 'tai', mean: 'Saya ingin mendengarkan sesuatu.' },
  { v: 'nomimasu', form: 'tai', mean: 'Saya ingin minum sesuatu.' },
  { v: 'tabemasu', form: 'tai', mean: 'Saya ingin makan sesuatu.' },
  { v: 'kakimasu', form: 'tai', mean: 'Saya ingin menulis sesuatu.' },
  { v: 'utaimasu' === 'x' ? '' : 'shimasu', form: 'tai', mean: 'Saya ingin melakukan sesuatu.' },
  { v: 'torimasu', form: 'tai', mean: 'Saya ingin memotret sesuatu.' },
  { v: 'karimasu', form: 'tai', mean: 'Saya ingin meminjam sesuatu.' },
  { v: 'okurimasu', form: 'tai', mean: 'Saya ingin mengirim sesuatu.' },
  { v: 'mukaemasu', form: 'tai', mean: 'Saya ingin menjemput seseorang (barang).' },
  { v: 'mimasu', form: 'tai', mean: 'Saya ingin melihat sesuatu.' },
  { v: 'kaimasu', form: 'tai', mean: 'Saya ingin membeli sesuatu.' },
  { v: 'shokujishimasu', form: 'tai', mean: 'Saya ingin makan sesuatu.' },
  { v: 'asobimasu', form: 'tai', mean: 'Saya ingin bermain sesuatu.' },
];
for (const row of NANIKA_OBJ) {
  const withWo = [...(row.ctx ? [T(row.ctx, row.ctx.replace('渇', 'かわ'))] : []), T('わたしは'), T('なにか'), P.wo, G.tv(row.v, 'tai')];
  const idxWo = withWo.findIndex(t => t.jp === 'を');
  push(rec({
    tokens: withWo,
    slot: idxWo,
    choices: [T('を'), T('が'), T('に'), T('で')],
    translation: row.mean,
    explanation: 'なにか adalah objek, jadi memakai を: 何かを 飲みたいです. Partikel を boleh dihilangkan dalam percakapan: 何か 飲みたいです. が tidak dipakai untuk objek なにか di sini.',
    topic: 'nanika_partikel',
    meta: { verb: row.v },
  }));
}
/* なにか tanpa partikel — bentuk yang juga benar */
for (const row of NANIKA_OBJ.slice(0, 5)) {
  const tokens = [...(row.ctx ? [T(row.ctx, row.ctx.replace('渇', 'かわ'))] : []), T('わたしは'), T('なにか'), G.tv(row.v, 'tai')];
  const idx = tokens.findIndex(t => t.jp === 'なにか');
  push(rec({
    tokens,
    slot: idx + 1,
    choices: [G.tv(row.v, 'tai'), G.mv(row.v, 'masu'), G.tv(row.v, 'takunai'), G.tv(row.v, 'takatta')],
    translation: row.mean.replace('sesuatu', 'sesuatu (tanpa を)'),
    explanation: 'Dalam kalimat sehari-hari, を setelah なにか sering dihilangkan: 何か 飲みたいです. Perhatikan kata kerjanya tetap ～たいです.',
    topic: 'nanika_tanpa_wo',
    meta: { verb: row.v },
  }));
}
/* なにか bukan objek: なにか ありますか */
const NANIKA_ARU = [
  { place: 'heya', yes: true, thing: 'hon' },
  { place: 'reizouko', yes: false, thing: null },
  { place: 'hako', yes: true, thing: 'tokei' },
  { place: 'tana', yes: false, thing: null },
  { place: 'kyoushitsu', yes: true, thing: 'jisho' },
];
for (const row of NANIKA_ARU) {
  const q = [noun(row.place), T('に'), T('なにか'), G.mv('arimasu', 'masu'), P.ka];
  const answer = row.yes
    ? [T('はい、'), noun(row.thing), P.ga, G.mv('arimasu', 'masu')]
    : [T('いいえ、'), T('なにも'), G.mv('arimasu', 'masen')];
  push(dlg({
    a: q,
    bBefore: [], answer: asOpt(answer), bAfter: [],
    options: [
      answer,
      row.yes ? [T('いいえ、'), T('なにも'), G.mv('arimasu', 'masen')] : [T('はい、'), noun('hon'), P.ga, G.mv('arimasu', 'masu')],
      [T('はい、'), noun(row.place), T('に'), G.mv('arimasu', 'masu')],
      [T('いいえ、'), T('なにか'), G.mv('arimasu', 'masen')],
    ].map(asOpt),
    translation: `「Apakah ada sesuatu di ${w(row.place).mean}?」 — 「${row.yes ? 'Ya, ada.' : 'Tidak, tidak ada apa-apa.'}」`,
    lineId: [`Apakah ada sesuatu di ${w(row.place).mean}?`, row.yes ? 'Ya, ada.' : 'Tidak, tidak ada apa-apa.'],
    explanation: 'なにか untuk benda tidak tentu dan memakai あります (benda mati). Jawaban negatif memakai なにも ありません.',
    topic: 'nanika_aru',
    meta: { place: row.place },
  }));
}

/* ==========================================================================
   2) どこか — dengan dan tanpa へ
   ========================================================================== */
const DOKOKA = [
  { v: 'ikimasu', form: 'tai', mean: 'Saya ingin pergi ke suatu tempat.', place: null },
  { v: 'kaerimasu', form: 'tai', mean: 'Saya ingin pulang ke suatu tempat.', place: null },
  { v: 'asobimasu', form: 'tai', mean: 'Saya ingin bermain ke suatu tempat.', place: null },
  { v: 'oyogimasu', form: 'tai', mean: 'Saya ingin berenang di suatu tempat.', place: null },
  { v: 'sanposhimasu', form: 'tai', mean: 'Saya ingin jalan-jalan ke suatu tempat.', place: null },
  { v: 'shokujishimasu', form: 'tai', mean: 'Saya ingin makan di suatu tempat.', place: null },
  { v: 'kaimonoshimasu', form: 'tai', mean: 'Saya ingin berbelanja di suatu tempat.', place: null },
  { v: 'benkyoushimasu', form: 'tai', mean: 'Saya ingin belajar di suatu tempat.', place: null },
];
for (const row of DOKOKA) {
  const tokens = [T('わたしは'), T('どこか'), P.e, G.tv(row.v, 'tai')];
  const idx = tokens.findIndex(t => t.jp === 'へ');
  push(rec({
    tokens,
    slot: idx,
    choices: [T('へ'), T('を'), T('が'), T('に')],
    translation: row.mean,
    explanation: 'どこか adalah tempat tujuan, jadi memakai へ: どこかへ 行きたいです. Partikel へ boleh dihilangkan: どこか 行きたいです. に dipakai bila どこか menjadi titik keberadaan/kegiatan (どこかに います／どこかで 食べます).',
    topic: 'dokoka_partikel',
    meta: { verb: row.v },
  }));
}
for (const row of DOKOKA.slice(0, 3)) {
  const tokens = [T('わたしは'), T('どこか'), G.tv(row.v, 'tai')];
  push(rec({
    tokens,
    slot: 2,
    choices: [G.tv(row.v, 'tai'), G.mv(row.v, 'masu'), G.tv(row.v, 'takunai'), G.tv(row.v, 'takatta')],
    translation: row.mean.replace('ke suatu tempat', 'ke suatu tempat (tanpa へ)'),
    explanation: 'Partikel へ setelah どこか sering dihilangkan: どこか 行きたいです. Artinya tetap sama.',
    topic: 'dokoka_tanpa_e',
    meta: { verb: row.v },
  }));
}
/* どこか へ 行きませんか — ajakan */
const DOKOKA_INVITE = [
  { mean: 'Mau pergi ke suatu tempat bersama?' },
  { mean: 'Mau jalan-jalan ke suatu tempat?' },
];
void DOKOKA_INVITE;

/* どこか で — tempat kegiatan */
const DOKOKA_DE = [
  { v: 'shokujishimasu', mean: 'Mari makan di suatu tempat.' },
  { v: 'yasumimasu', mean: 'Mari beristirahat di suatu tempat.' },
  { v: 'nomimasu', mean: 'Mari minum di suatu tempat.', obj: 'koohii' },
  { v: 'kaimonoshimasu', mean: 'Mari berbelanja di suatu tempat.' },
];
for (const row of DOKOKA_DE) {
  const tokens = [T('どこか'), P.de, ...(row.obj ? [noun(row.obj), P.wo] : []), G.mv(row.v, 'mashou'), T('。')];
  const idx = tokens.findIndex(t => t.jp === 'で');
  push(rec({
    tokens,
    slot: idx,
    choices: [T('で'), T('へ'), T('を'), T('が')],
    translation: row.mean,
    explanation: 'Bila どこか menjadi tempat berlangsungnya kegiatan, partikelnya で: どこかで 食べましょう。 へ dipakai untuk arah, で untuk tempat kegiatan.',
    topic: 'dokoka_de',
    meta: { verb: row.v },
  }));
}

/* Tambahan tanya-jawab なにか / どこか agar setiap level punya dialog unik */
const EXTRA_DLG = [
  { q: [T('れいぞうこ'), T('に'), T('なにか'), G.mv('arimasu', 'masu'), T('か', 'か')], a: [T('はい、'), G.n('tamago'), T('が'), G.mv('arimasu', 'masu')], qm: 'Apakah di kulkas ada sesuatu?', am: 'Ya, ada telur.' },
  { q: [T('れいぞうこ'), T('に'), T('なにか'), G.mv('arimasu', 'masu'), T('か', 'か')], a: [T('いいえ、'), T('なにも'), G.mv('arimasu', 'masen')], qm: 'Apakah di kulkas ada sesuatu?', am: 'Tidak, tidak ada apa-apa.' },
  { q: [T('かばん'), T('の'), T('中'), T('に'), T('なにか'), G.mv('arimasu', 'masu'), T('か', 'か')], a: [T('はい、'), G.n('jisho'), T('が'), G.mv('arimasu', 'masu')], qm: 'Apakah di dalam tas ada sesuatu?', am: 'Ya, ada kamus.' },
  { q: [T('かばん'), T('の'), T('中'), T('に'), T('なにか'), G.mv('arimasu', 'masu'), T('か', 'か')], a: [T('いいえ、'), T('なにも'), G.mv('arimasu', 'masen')], qm: 'Apakah di dalam tas ada sesuatu?', am: 'Tidak, tidak ada apa-apa.' },
  { q: [T('なにか'), G.mv('kaimasu', 'mashita'), T('か', 'か')], a: [T('はい、'), G.n('kamera'), P.wo, G.mv('kaimasu', 'mashita')], qm: 'Apakah kamu membeli sesuatu?', am: 'Ya, saya membeli kamera.' },
  { q: [T('なにか'), G.mv('kaimasu', 'mashita'), T('か', 'か')], a: [T('いいえ、'), T('なにも'), G.mv('kaimasu', 'masendeshita')], qm: 'Apakah kamu membeli sesuatu?', am: 'Tidak, saya tidak membeli apa-apa.' },
  { q: [T('どこか'), P.e, G.mv('ikimasu', 'mashita'), T('か', 'か')], a: [T('はい、'), G.n('umi'), P.e, G.mv('ikimasu', 'mashita')], qm: 'Apakah kamu pergi ke suatu tempat?', am: 'Ya, saya pergi ke laut.' },
  { q: [T('どこか'), P.e, G.mv('ikimasu', 'mashita'), T('か', 'か')], a: [T('いいえ、'), T('どこも'), G.mv('ikimasu', 'masendeshita')], qm: 'Apakah kamu pergi ke suatu tempat?', am: 'Tidak, saya tidak pergi ke mana-mana.' },
  { q: [T('どこか'), P.de, G.mv('shokujishimasu', 'masen'), T('か', 'か')], a: [T('ええ、'), G.n('resutoran'), P.de, G.mv('shokujishimasu', 'mashou')], qm: 'Mau makan di suatu tempat?', am: 'Ya, mari makan di restoran.' },
  { q: [T('どこか'), P.e, G.mv('asobimasu', 'masen'), T('か', 'か')], a: [T('ええ、'), G.n('kouen'), P.e, G.mv('ikimasu', 'mashou')], qm: 'Mau bermain ke suatu tempat?', am: 'Ya, mari pergi ke taman.' },
];
const EXTRA_WRONG = [
  [T('いいえ、'), T('なにも'), G.mv('arimasu', 'masen')],
  [T('はい、'), G.n('tamago'), T('が'), G.mv('arimasu', 'masu')],
  [T('はい、'), G.n('jisho'), T('が'), G.mv('arimasu', 'masu')],
  [T('はい、'), G.n('kamera'), P.wo, G.mv('kaimasu', 'mashita')],
  [T('はい、'), G.n('umi'), P.e, G.mv('ikimasu', 'mashita')],
  [T('ええ、'), G.n('resutoran'), P.de, G.mv('shokujishimasu', 'mashou')],
];
for (const [i, row] of EXTRA_DLG.entries()) {
  const correct = asOpt(row.a);
  const opts = [correct];
  for (let k = 0; k < EXTRA_WRONG.length && opts.length < 4; k++) {
    const o = asOpt(EXTRA_WRONG[(i + k) % EXTRA_WRONG.length]);
    if (!opts.some(x => x.jp === o.jp)) opts.push(o);
  }
  let f = 0;
  while (opts.length < 4) {
    const o = asOpt([T('そうですね。'.slice(0, Math.min(6, f + 1)))]);
    if (!opts.some(x => x.jp === o.jp)) opts.push(o);
    f++;
  }
  push(dlg({
    a: row.q,
    bBefore: [], answer: correct, bAfter: [],
    options: opts.slice(0, 4),
    translation: `「${row.qm}」 — 「${row.am}」`,
    lineId: [row.qm, row.am],
    explanation: 'なにか untuk benda (あります), どこか untuk tempat (へ／で). Jawaban negatif memakai なにも／どこも + negatif.',
    topic: 'nanika_aru',
    meta: {},
  }));
}

/* ==========================================================================
   3) なにか／どこか pada kalimat penuh
   ========================================================================== */
const FULL = [
  { tokens: [T('のどが渇きましたから、', 'のどがかわきましたから、'), T('なにか'), P.wo, G.tv('nomimasu', 'tai'), T('。')], mean: 'Karena haus, saya ingin minum sesuatu.', slot: 1 },
  { tokens: [T('おなかがすきましたから、', 'おなかがすきましたから、'), T('なにか'), P.wo, G.tv('tabemasu', 'tai'), T('。')], mean: 'Karena lapar, saya ingin makan sesuatu.', slot: 1 },
  { tokens: [T('あした'), T('は'), T('暇ですから、', 'ひまですから、'), T('どこか'), P.e, G.tv('ikimasu', 'tai'), T('。')], mean: 'Besok senggang, jadi saya ingin pergi ke suatu tempat.', slot: 3 },
  { tokens: [T('しゅうまつ'), T('は'), T('どこか'), P.e, G.mv('asobimasu', 'masen'), T('か', 'か'), T('。')], mean: 'Akhir pekan ini mau bermain ke suatu tempat?', slot: 2 },
  { tokens: [T('なにか'), P.wo, G.mv('kaimasu', 'mashou'), T('か', 'か'), T('。')], mean: 'Mau membeli sesuatu?', slot: 0 },
  { tokens: [T('どこか'), P.e, G.mv('ikimasu', 'masen'), T('か', 'か'), T('。')], mean: 'Mau pergi ke suatu tempat?', slot: 0 },
  { tokens: [T('なにか'), G.mv('arimasu', 'masu'), T('か', 'か'), T('。')], mean: 'Ada sesuatu?', slot: 0 },
  { tokens: [T('どこか'), P.de, G.mv('shokujishimasu', 'masen'), T('か', 'か'), T('。')], mean: 'Mau makan di suatu tempat?', slot: 0 },
];
for (const row of FULL) {
  const answer = row.tokens[row.slot];
  const others = ['なにか', 'どこか', 'だれか', 'いつか'].filter(x => x !== answer.jp).slice(0, 3);
  push(rec({
    tokens: row.tokens,
    slot: row.slot,
    choices: [answer, ...others.map(x => T(x))],
    translation: row.mean,
    explanation: 'なにか = sesuatu (benda), どこか = suatu tempat, だれか = seseorang, いつか = suatu hari nanti. Pilih sesuai jenis kata yang ditanyakan konteks.',
    topic: 'nanika_dokoka_pilih',
    meta: {},
  }));
}

/* ==========================================================================
   4) BEDA なにか & どこか
   ========================================================================== */
const BEDA = [
  { correct: 'なにか', tokens: [T('ふうとう'), T('の'), T('中'), T('に'), T('なにか'), T('が'), G.mv('arimasu', 'masu')], mean: 'Di dalam amplop ada sesuatu.' },
  { correct: 'どこか', tokens: [T('あした'), T('は'), T('どこか'), P.e, G.mv('ikimasu', 'masen'), T('か')], mean: 'Besok mau pergi ke suatu tempat?' },
  { correct: 'なにか', tokens: [T('なにか'), P.wo, G.mv('mimasu', 'mashou'), T('か')], mean: 'Mau menonton sesuatu?' },
  { correct: 'どこか', tokens: [T('どこか'), P.de, G.mv('nomimasu', 'masen'), T('か')], mean: 'Mau minum di suatu tempat?' },
  { correct: 'だれか', tokens: [T('きょうしつ'), T('に'), T('だれか'), T('が'), G.mv('imasu', 'masu')], mean: 'Di ruang kelas ada seseorang.' },
  { correct: 'いつか', tokens: [T('いつか'), noun('nihon'), P.e, G.tv('ikimasu', 'tai')], mean: 'Suatu hari nanti saya ingin pergi ke Jepang.' },
  { correct: 'なにか', tokens: [T('なにか'), T('を'), G.mv('kaimasu', 'mashita'), T('か')], mean: 'Apakah kamu membeli sesuatu?' },
  { correct: 'どこか', tokens: [T('どこか'), P.e, G.mv('ikimasu', 'mashita'), T('か')], mean: 'Apakah kamu pergi ke suatu tempat?' },
];
for (const row of BEDA) {
  const idx = row.tokens.findIndex(t => ['なにか', 'どこか', 'だれか', 'いつか'].includes(t.jp));
  const others = ['なにか', 'どこか', 'だれか', 'いつか'].filter(x => x !== row.correct);
  push(rec({
    tokens: row.tokens,
    slot: idx,
    choices: [T(row.correct), ...others.map(x => T(x))],
    translation: row.mean,
    explanation: 'Kenali jenisnya: なにか untuk benda, どこか untuk tempat, だれか untuk orang, いつか untuk waktu. Partikel ikut menyesuaikan perannya.',
    topic: 'nanika_dokoka_beda',
    meta: {},
  }));
}

/* ==========================================================================
   5) MATCH
   ========================================================================== */
push(match({
  pairs: [
    { jp: '何かを飲みたいです', id: 'ingin minum sesuatu (dengan を)', vocabId: 'n01' },
    { jp: '何か飲みたいです', id: 'ingin minum sesuatu (tanpa を)', vocabId: 'n02' },
    { jp: 'どこかへ行きたいです', id: 'ingin pergi ke suatu tempat (dengan へ)', vocabId: 'n03' },
    { jp: 'どこか行きたいです', id: 'ingin pergi ke suatu tempat (tanpa へ)', vocabId: 'n04' },
  ],
  translation: 'Bentuk dengan partikel dan tanpa partikel untuk なにか／どこか.',
  explanation: 'Pada percakapan sehari-hari, を setelah なにか dan へ setelah どこか sering dihilangkan tanpa mengubah arti.',
  topic: 'nanika_match',
}));
push(match({
  pairs: [
    { jp: 'なにか', id: 'sesuatu (benda)', vocabId: 'n11' },
    { jp: 'どこか', id: 'suatu tempat', vocabId: 'n12' },
    { jp: 'だれか', id: 'seseorang', vocabId: 'n13' },
    { jp: 'いつか', id: 'suatu hari nanti', vocabId: 'n14' },
  ],
  translation: 'Empat kata tidak tentu: なにか · どこか · だれか · いつか.',
  explanation: 'Semua adalah kata tanya + か, tetapi jenisnya berbeda: benda, tempat, orang, waktu.',
  topic: 'nanika_match',
}));
push(match({
  pairs: [
    { jp: 'のどが渇きました', id: 'saya haus', vocabId: 'n21' },
    { jp: 'おなかがすきました', id: 'saya lapar', vocabId: 'n22' },
    { jp: 'おなかがいっぱいです', id: 'saya kenyang', vocabId: 'n23' },
    { jp: '何か飲みたいです', id: 'ingin minum sesuatu', vocabId: 'n24' },
  ],
  translation: 'Ungkapan kondisi tubuh Bab 13 dan kelanjutannya dengan なにか.',
  explanation: 'おなかが すきました → 何か 食べたいです; のどが 渇きました → 何か 飲みたいです.',
  topic: 'nanika_match',
}));
push(match({
  pairs: [
    { jp: 'どこかで食べましょう', id: 'mari makan di suatu tempat', vocabId: 'n31' },
    { jp: 'どこかへ行きましょう', id: 'mari pergi ke suatu tempat', vocabId: 'n32' },
    { jp: '何か食べませんか', id: 'mau makan sesuatu?', vocabId: 'n33' },
    { jp: 'だれかいますか', id: 'ada orang?', vocabId: 'n34' },
  ],
  translation: 'Partikel で dan へ setelah どこか, serta なにか pada ajakan.',
  explanation: 'で = tempat kegiatan; へ = arah tujuan. Keduanya bisa mengikuti どこか.',
  topic: 'nanika_match',
}));

/* ==========================================================================
   6) KASUAL
   ========================================================================== */
const CASUAL = [
  { q: '何か飲みたい？', a: [T('うん、'), noun('mizu'), P.ga, G.tv('nomimasu', 'taiPlain')], ans: 'Iya, aku mau air.' },
  { q: '何か飲みたい？', a: [T('ううん、'), T('何も'), G.tv('nomimasu', 'takunaiPlain')], ans: 'Tidak, aku tidak mau apa-apa.' },
  { q: 'あした、どこか行く？', a: [T('うん、'), noun('umi'), P.e, G.dv('ikimasu')], ans: 'Iya, ke laut.' },
  { q: 'あした、どこか行く？', a: [T('ううん、'), T('どこも'), G.dv('ikimasu')], ans: 'Tidak, tidak ke mana-mana.' },
  { q: 'なにか買いましたか。', a: [T('はい、'), noun('kamera'), P.wo, G.mv('kaimasu', 'mashita')], ans: 'Ya, saya beli kamera.' },
];
for (const row of CASUAL) {
  const correct = asOpt(row.a);
  const opts = [correct,
    asOpt([T('ううん、'), T('何も'), G.tv('nomimasu', 'takunaiPlain')]),
    asOpt([T('うん、'), T('どこか'), P.e, G.dv('ikimasu')]),
    asOpt([correct.jp + 'です']),
  ];
  const uniq = []; const seen = new Set();
  for (const o of opts) { if (!seen.has(o.jp)) { seen.add(o.jp); uniq.push(o); } }
  let k = 0;
  while (uniq.length < 4) {
    const pool = [
      [T('ううん、'), T('どこも'), G.dv('ikimasu')],
      [T('うん、'), T('なにか'), P.wo, G.dv('kaimasu')],
      [T('ううん、'), T('何も'), G.tv('nomimasu', 'takunaiPlain')],
      [T('うん、'), G.n('kuruma'), P.ga, G.hs('posPlain')],
    ];
    const o = asOpt(pool[k % pool.length]);
    if (!seen.has(o.jp)) { seen.add(o.jp); uniq.push(o); }
    k++;
  }
  push(dlg({
    a: [T(row.q)],
    bBefore: [], answer: correct, bAfter: [],
    options: uniq.slice(0, 4),
    translation: `「${row.q}」 — 「${row.ans}」 (kasual)`,
    lineId: [row.q, row.ans],
    explanation: 'Bentuk kasual: 行きます → 行く, 飲みたい → 飲みたい. Untuk jawaban negatif dipakai 何も／どこも + bentuk negatif.',
    topic: 'nanika_kasual',
    casual: true,
    meta: {},
  }));
}

/* ==========================================================================
   7) KALIMAT LENGKAP (susun & terjemah)
   ========================================================================== */
const LONG = [
  { tokens: [T('のどが渇きましたから、', 'のどがかわきましたから、'), T('何か'), T('飲みたいです', 'のみたいです'), T('。')], mean: 'Karena haus, saya ingin minum sesuatu.', slot: 1, choices: ['何か', '何が', '何も', 'どこか'] },
  { tokens: [T('あした'), T('は'), T('暇ですから、', 'ひまですから、'), T('どこかへ'), T('行きたいです', 'いきたいです'), T('。')], mean: 'Besok senggang, jadi saya ingin pergi ke suatu tempat.', slot: 3, choices: ['どこかへ', 'どこかが', 'どこかを', 'なにかへ'] },
  { tokens: [T('なにか'), T('を'), T('食べませんか', 'たべませんか'), T('。')], mean: 'Mau makan sesuatu?', slot: 0, choices: ['なにか', 'どこか', 'だれか', 'いつか'] },
  { tokens: [T('どこかで'), T('食事しませんか', 'しょくじしませんか'), T('。')], mean: 'Mau makan di suatu tempat?', slot: 0, choices: ['どこかで', 'どこかへ', 'どこかを', 'なにかで'] },
  { tokens: [T('部屋に'), T('なにか'), T('ありますか', 'ありますか'), T('。')], mean: 'Apakah di kamar ada sesuatu?', slot: 1, choices: ['なにか', 'なにが', 'だれか', 'どこか'] },
  { tokens: [T('休みに'), T('どこか'), T('へ'), T('遊びに行きます', 'あそびにいきます'), T('。')], mean: 'Pada hari libur saya pergi bermain ke suatu tempat.', slot: 1, choices: ['どこか', 'どこかで', 'なにか', 'だれか'] },
];
for (const row of LONG) {
  push(rec({
    tokens: row.tokens,
    slot: row.slot,
    choices: row.choices.map(x => T(x)),
    translation: row.mean,
    explanation: 'Ingat aturan partikel: を (boleh hilang) setelah なにか sebagai objek; へ (boleh hilang) setelah どこか sebagai arah; で setelah どこか sebagai tempat kegiatan.',
    topic: 'nanika_kalimat',
    meta: {},
  }));
}

module.exports = {
  band: 'nanika',
  focus: 'Kata tanya + か: なにか (sesuatu) dan どこか (suatu tempat), termasuk を／へ yang boleh hilang',
  records: OUT,
};
