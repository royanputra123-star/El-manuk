#!/usr/bin/env node
/* ============================================================================
 * tools/bab13_bank_campuran.js  ·  Level 26–30
 * Latihan campuran seluruh bunpou Bab 13.
 *
 * Fokus: memilih pola/partikel yang tepat di dalam kalimat utuh, menggabungkan
 * ほしい・たい・tujuan kegiatan・いつか／だれか／なにか／どこか, serta konteks
 * percakapan. Semua kalimat memakai kosakata Bab 1–13.
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
   1) PILIH POLA: kalimat dengan satu rumpang berupa pola utuh
   ========================================================================== */
const PATTERN = [
  {
    tokens: [T('わたしは'), noun('kuruma'), P.ga, T('ほしいです', 'ほしいです')],
    slot: 3,
    choices: [T('ほしいです', 'ほしいです'), T('たいです', 'たいです'), T('たかったです', 'たかったです'), T('ほしくないです', 'ほしくないです')],
    mean: 'Saya ingin memiliki mobil.', topic: 'campur_pola',
    expl: 'Benda + が + ほしいです. Jika yang diinginkan adalah kegiatan, gunakan たいです.',
  },
  {
    tokens: [T('わたしは'), noun('kamera'), P.wo, T('買いたいです', 'かいたいです')],
    slot: 3,
    choices: [T('買いたいです', 'かいたいです'), T('ほしいです', 'ほしいです'), T('買いたかったです', 'かいたかったです'), T('買いませんか', 'かいませんか')],
    mean: 'Saya ingin membeli kamera.', topic: 'campur_pola',
    expl: 'Kegiatan memakai kata kerja ます tanpa ます + たいです. Objek kata kerja memakai を.',
  },
  {
    tokens: [T('わたしは'), noun('suupaa'), P.e, G.st('kaimonoshimasu'), T('に行きます', 'にいきます')],
    slot: 4,
    choices: [T('に行きます', 'にいきます'), T('を行きます', 'をいきます'), T('が行きます', 'がいきます'), T('で行きます', 'でいきます')],
    mean: 'Saya pergi ke supermarket untuk berbelanja.', topic: 'campur_pola',
    expl: 'Tujuan kegiatan memakai ます-stem + に + 行きます. を hanya untuk objek, bukan tujuan.',
  },
  {
    tokens: [T('教室に'), T('だれか'), T('が'), G.mv('imasu', 'masu'), T('か', 'か')],
    slot: 1,
    choices: [T('だれか'), T('だれ'), T('なにか'), T('どこか')],
    mean: 'Apakah ada seseorang di ruang kelas?', topic: 'campur_pola',
    expl: 'だれか = seseorang. Untuk benda なにか, untuk tempat どこか.',
  },
  {
    tokens: [T('のどが渇きましたから、', 'のどがかわきましたから、'), T('なにか'), P.wo, G.tv('nomimasu', 'tai')],
    slot: 1,
    choices: [T('なにか'), T('なにが'), T('どこか'), T('だれか')],
    mean: 'Karena haus, saya ingin minum sesuatu.', topic: 'campur_pola',
    expl: 'なにか (sesuatu) untuk benda; partikel を boleh hilang: 何か 飲みたいです.',
  },
  {
    tokens: [T('あした'), T('は'), T('暇ですから、', 'ひまですから、'), T('どこか'), P.e, G.tv('ikimasu', 'tai')],
    slot: 3,
    choices: [T('どこか'), T('どこかで'), T('なにか'), T('いつか')],
    mean: 'Besok senggang, jadi saya ingin pergi ke suatu tempat.', topic: 'campur_pola',
    expl: 'どこか = suatu tempat. Dengan へ untuk arah; で dipakai untuk tempat kegiatan.',
  },
  {
    tokens: [T('わたしは'), T('いつか'), noun('nihon'), P.de, G.tv('hatarakimasu', 'tai')],
    slot: 1,
    choices: [T('いつか'), T('いつかで'), T('だれか'), T('なにか')],
    mean: 'Suatu hari nanti saya ingin bekerja di Jepang.', topic: 'campur_pola',
    expl: 'いつか (suatu hari nanti) tidak memakai partikel dan menyatakan waktu yang tidak pasti.',
  },
];
for (const row of PATTERN) {
  push(rec({
    tokens: row.tokens,
    slot: row.slot,
    slotToken: row.slotToken,
    slotNth: row.slotNth,
    choices: row.choices,
    translation: row.mean,
    explanation: row.expl,
    topic: row.topic,
    meta: {},
  }));
}

/* ==========================================================================
   2) PILIH BENTUK ほしい / たい sesuai konteks waktu
   ========================================================================== */
const BENTUK = [
  { tokens: [T('きのうは'), noun('kamera'), P.ga, G.hs('past')], slot: 3, mean: 'Kemarin saya ingin kamera.', choices: [G.hs('past'), G.hs('pos'), G.hs('neg'), G.hs('pastneg')], expl: 'Penanda waktu きのう memerlukan bentuk lampau: ほしかったです.' },
  { tokens: [T('きのうは'), noun('kamera'), P.ga, G.hs('pastneg')], slot: 3, mean: 'Kemarin saya tidak ingin kamera.', choices: [G.hs('pastneg'), G.hs('neg'), G.hs('past'), G.hs('pos')], expl: 'Lampau negatif: ほしくなかったです.' },
  { tokens: [T('いまは'), noun('kuruma'), P.ga, G.hs('neg')], slot: 3, mean: 'Sekarang saya tidak ingin mobil.', choices: [G.hs('neg'), G.hs('pos'), G.hs('pastneg'), G.hs('past')], expl: 'Bentuk negatif sekarang: ほしくないです.' },
  { tokens: [T('きのうは'), noun('osushi'), P.wo, G.tv('tabemasu', 'takatta')], slot: 3, mean: 'Kemarin saya ingin makan sushi.', choices: [G.tv('tabemasu', 'takatta'), G.tv('tabemasu', 'tai'), G.tv('tabemasu', 'takunai'), G.tv('tabemasu', 'takunakatta')], expl: 'Lampau positif たい: 食べたかったです.' },
  { tokens: [T('きのうは'), noun('osushi'), P.wo, G.tv('tabemasu', 'takunakatta')], slot: 3, mean: 'Kemarin saya tidak ingin makan sushi.', choices: [G.tv('tabemasu', 'takunakatta'), G.tv('tabemasu', 'takunai'), G.tv('tabemasu', 'takatta'), G.tv('tabemasu', 'tai')], expl: 'Lampau negatif たい: 食べたくなかったです.' },
  { tokens: [T('いまは'), noun('koohii'), P.wo, G.tv('nomimasu', 'takunai')], slot: 3, mean: 'Sekarang saya tidak ingin minum kopi.', choices: [G.tv('nomimasu', 'takunai'), G.tv('nomimasu', 'tai'), G.tv('nomimasu', 'takunakatta'), G.tv('nomimasu', 'takatta')], expl: 'Negatif sekarang: 飲みたくないです.' },
  { tokens: [T('こんしゅう'), T('は'), noun('kaigi'), T('に'), G.mv('demasu', 'masu')], slot: 3, mean: 'Minggu ini saya mengikuti rapat.', choices: [T('に'), T('を'), T('へ'), T('が')], expl: 'Kata kerja 出ます memakai に untuk kegiatan yang diikuti (会議に 出ます).' },
  { tokens: [T('わたしは'), noun('kaigi'), T('に'), G.st('demasu'), T('に'), T('行きます', 'いきます')], slot: 2, mean: 'Saya pergi untuk mengikuti rapat.', choices: [T('に'), T('へ'), T('を'), T('が')], expl: 'Kata kerja 出ます memiliki bentuk ます tanpa ます = 出. Tujuan kegiatan: 会議に 出に 行きます — partikel に pertama menandai kegiatan yang diikuti, に kedua menandai tujuan.' },
];
for (const row of BENTUK) {
  push(rec({
    tokens: row.tokens,
    slot: row.slot,
    slotToken: row.slotToken,
    slotNth: row.slotNth,
    choices: row.choices,
    translation: row.mean,
    explanation: row.expl,
    topic: 'campur_bentuk',
    meta: {},
  }));
}

/* ==========================================================================
   3) PILIH PARTIKEL pada kalimat utuh
   ========================================================================== */
const PARTIKEL = [
  { tokens: [T('わたしは'), noun('kuruma'), P.ga, T('ほしいです', 'ほしいです')], slot: 2, choices: ['が', 'を', 'に', 'で'], mean: 'Saya ingin mobil.', expl: 'ほしい memakai が untuk objeknya.' },
  { tokens: [T('わたしは'), noun('koohii'), P.wo, G.tv('nomimasu', 'tai')], slot: 2, choices: ['を', 'が', 'に', 'へ'], mean: 'Saya ingin minum kopi.', expl: 'Objek kata kerja transitif memakai を (bentuk が juga dapat menekankan objek).' },
  { tokens: [T('わたしは'), noun('suupaa'), P.e, G.st('kaimonoshimasu'), T('に'), G.mv('ikimasu', 'masu')], slotToken: 'に', slotNth: 0, choices: ['へ', 'を', 'に', 'で'], mean: 'Saya pergi ke supermarket untuk berbelanja.', expl: 'Tempat tujuan memakai へ (atau に); を untuk objek.' },
  { tokens: [T('わたしは'), noun('suupaa'), P.e, noun('yasai'), P.wo, G.st('kaimasu'), T('に'), G.mv('ikimasu', 'masu')], slotToken: P.wo.jp, slotNth: 0, choices: ['を', 'が', 'に', 'へ'], mean: 'Saya pergi ke supermarket untuk membeli sayur.', expl: 'Objek kegiatan tetap を; に mengikuti kata kerja tujuan.' },
  { tokens: [T('わたしは'), noun('tomodachi'), T('に'), G.st('aimasu'), T('に'), noun('nihon'), P.e, G.mv('ikimasu', 'masu')], slotToken: 'に', slotNth: 0, choices: ['に', 'を', 'が', 'へ'], mean: 'Saya pergi ke Jepang untuk bertemu teman.', expl: 'Orang yang ditemui memakai に: 友達に 会いに 行きます.' },
  { tokens: [noun('resutoran'), P.e, noun('osushi'), P.wo, G.st('tabemasu'), T('に'), G.mv('ikimasu', 'masu')], slotToken: P.wo.jp, slotNth: 0, choices: ['を', 'に', 'が', 'で'], mean: 'Saya pergi ke restoran untuk makan sushi.', expl: 'Objek sushi memakai を; lalu 食べに (ます-stem + に).' },
  { tokens: [T('教室に'), T('だれか'), T('が'), G.mv('imasu', 'masu')], slot: 2, choices: ['が', 'を', 'に', 'へ'], mean: 'Di kelas ada seseorang.', expl: 'だれか sebagai subjek memakai が (boleh dihilangkan).' },
  { tokens: [T('どこか'), P.e, G.mv('ikimasu', 'masen'), T('か')], slot: 1, choices: ['へ', 'を', 'が', 'に'], mean: 'Mau pergi ke suatu tempat?', expl: 'どこか dengan arah memakai へ (boleh dihilangkan).' },
  { tokens: [T('どこか'), P.de, noun('koohii'), P.wo, G.mv('nomimasu', 'masen'), T('か')], slot: 1, choices: ['で', 'へ', 'を', 'が'], mean: 'Mau minum kopi di suatu tempat?', expl: 'Tempat kegiatan memakai で.' },
  { tokens: [T('なにか'), P.wo, G.mv('kaimasu', 'mashou')], slot: 1, choices: ['を', 'が', 'に', 'へ'], mean: 'Mari membeli sesuatu.', expl: 'なにか sebagai objek memakai を (boleh dihilangkan).' },
];
for (const row of PARTIKEL) {
  push(rec({
    tokens: row.tokens,
    slot: row.slot,
    slotToken: row.slotToken,
    slotNth: row.slotNth,
    choices: row.choices.map(x => T(x)),
    translation: row.mean,
    explanation: row.expl,
    topic: 'campur_partikel',
    meta: {},
  }));
}

/* ==========================================================================
   4) KONTEKS PERCAKAPAN: pilih respons yang tepat
   ========================================================================== */
const CONV = [
  {
    a: [T('何がほしいですか。', 'なにがほしいですか。')],
    answer: [T('車'), P.ga, G.hs('pos')],
    meanQ: 'Apa yang kamu inginkan?', meanA: 'Saya ingin mobil.',
    wrong: [[T('車'), P.wo, G.hs('pos')], [T('車'), P.ga, G.tv('kaimasu', 'tai')], [T('車'), T('に'), G.hs('pos')]],
    expl: 'Pertanyaan 何がほしいですか dijawab N が ほしいです.',
  },
  {
    a: [T('コーヒーはいかがですか。', 'こーひーはいかがですか。')],
    answer: [T('ありがとうございます。いただきます。')],
    meanQ: 'Bagaimana kalau kopi?', meanA: 'Terima kasih. Saya terima.',
    wrong: [[T('いいえ、コーヒーがほしいですか。')], [T('はい、コーヒーを飲みたいですか。')], [T('コーヒーがほしいでした。')]],
    expl: 'Tawaran いかがですか dijawab dengan menerima (ありがとうございます) atau menolak halus (すみません、ちょっと…).',
  },
  {
    a: [T('どのぐらい日本にいますか。', 'どのぐらいにほんにいますか。')],
    answer: [T('二年'), T('います', 'います')],
    meanQ: 'Berapa lama tinggal di Jepang?', meanA: 'Dua tahun.',
    wrong: [[T('二年'), T('かかります', 'かかります')], [T('二年'), P.e, G.dv('ikimasu')], [T('二年'), T('が'), G.hs('pos')]],
    expl: 'どのぐらい menanyakan durasi; jawabannya ～年 います.',
  },
  {
    a: [T('あした、どこか行きませんか。', 'あした、どこか行きませんか。')],
    answer: [T('ええ、いいですね。')],
    meanQ: 'Besok mau pergi ke suatu tempat?', meanA: 'Ya, boleh juga.',
    wrong: [[T('いいえ、どこか行きたいですか。')], [T('ええ、どこかへ行きますか。')], [T('いいえ、どこも行きます。')]],
    expl: 'Ajakan ～ませんか dijawab ええ、いいですね (menerima) atau すみません、ちょっと… (menolak).',
  },
  {
    a: [T('おなかがすきましたね。', 'おなかがすきましたね。')],
    answer: [T('そうですね。'), T('何か'), T('食べましょうか。', 'たべましょうか。')],
    meanQ: 'Kita lapar, ya.', meanA: 'Betul. Mau makan sesuatu?',
    wrong: [[T('そうですね。'), T('何か'), G.tv('tabemasu', 'takunai')], [T('いいえ、おなかがいっぱいです。'), T('何か'), T('食べましょう。')], [T('そうですね。'), T('だれか'), T('食べましょう。')]],
    expl: 'なにか (sesuatu) dikombinasikan dengan ましょうか untuk menawarkan kegiatan.',
  },
  {
    a: [T('だれか来ましたか。', 'だれかきましたか。')],
    answer: [T('いいえ、だれも来ませんでした。', 'いいえ、だれもきませんでした。')],
    meanQ: 'Apakah ada yang datang?', meanA: 'Tidak, tidak ada yang datang.',
    wrong: [[T('いいえ、なにも来ませんでした。')], [T('はい、だれかです。')], [T('いいえ、どこも来ませんでした。')]],
    expl: 'Untuk orang dipakai だれも + negatif. なにも untuk benda, どこも untuk tempat.',
  },
];
void CONV.slice(0, 0);
const CONV_USE = [
  {
    a: [T('何がほしいですか。', 'なにがほしいですか。')],
    answer: [noun('kuruma'), P.ga, G.hs('pos')],
    meanQ: 'Apa yang kamu inginkan?', meanA: 'Saya ingin mobil.',
    wrong: [[noun('kuruma'), P.wo, G.hs('pos')], [noun('kuruma'), P.ga, G.tv('kaimasu', 'tai')], [noun('kuruma'), T('に'), G.hs('pos')]],
    expl: 'Pertanyaan 何がほしいですか dijawab N が ほしいです.',
  },
  {
    a: [T('コーヒーはいかがですか。', 'こーひーはいかがですか。')],
    answer: [T('ありがとうございます。', 'ありがとうございます。'), T('いただきます。', 'いただきます。')],
    meanQ: 'Bagaimana kalau kopi?', meanA: 'Terima kasih. Saya terima.',
    wrong: [[T('いいえ、', 'いいえ、'), noun('koohii'), T('がほしいですか。', 'がほしいですか。')], [T('はい、', 'はい、'), noun('koohii'), T('を飲みたいですか。', 'をのみたいですか。')], [noun('koohii'), T('がほしいでした。', 'がほしいでした。')]],
    expl: 'Tawaran いかがですか dijawab dengan menerima (ありがとうございます) atau menolak halus (すみません、ちょっと…).',
  },
  {
    a: [T('あした、どこか行きませんか。', 'あした、どこか行きませんか。')],
    answer: [T('ええ、いいですね。', 'ええ、いいですね。')],
    meanQ: 'Besok mau pergi ke suatu tempat?', meanA: 'Ya, boleh juga.',
    wrong: [[T('いいえ、', 'いいえ、'), T('どこか行きたいですか。', 'どこか行きたいですか。')], [T('ええ、', 'ええ、'), T('どこかへ行きますか。', 'どこかへいきますか。')], [T('いいえ、', 'いいえ、'), T('どこも行きます。', 'どこもいきます。')]],
    expl: 'Ajakan ～ませんか dijawab ええ、いいですね (menerima) atau すみません、ちょっと… (menolak halus).',
  },
  {
    a: [T('おなかがすきましたね。', 'おなかがすきましたね。')],
    answer: [T('そうですね。', 'そうですね。'), T('なにか'), T('食べませんか。', 'たべませんか。')],
    meanQ: 'Kita lapar, ya.', meanA: 'Betul. Mau makan sesuatu?',
    wrong: [[T('そうですね。', 'そうですね。'), T('なにか'), G.tv('tabemasu', 'tai')], [T('いいえ、', 'いいえ、'), T('おなかがいっぱいです。', 'おなかがいっぱいです。'), T('なにか'), T('食べましょう。', 'たべましょう。')], [T('そうですね。', 'そうですね。'), T('だれか'), T('食べませんか。', 'たべませんか。')]],
    expl: 'なにか (sesuatu) dipakai bersama ませんか untuk menawarkan kegiatan kepada lawan bicara.',
  },
  {
    a: [T('だれか来ましたか。', 'だれかきましたか。')],
    answer: [T('いいえ、', 'いいえ、'), T('だれも来ませんでした。', 'だれもきませんでした。')],
    meanQ: 'Apakah ada yang datang?', meanA: 'Tidak, tidak ada yang datang.',
    wrong: [[T('いいえ、', 'いいえ、'), T('なにも来ませんでした。', 'なにもきませんでした。')], [T('はい、', 'はい、'), T('だれかです。', 'だれかです。')], [T('いいえ、', 'いいえ、'), T('どこも来ませんでした。', 'どこもきませんでした。')]],
    expl: 'Untuk orang dipakai だれも + negatif. なにも untuk benda, どこも untuk tempat.',
  },
];
void CONV;
for (const row of CONV_USE) {
  push(dlg({
    a: row.a,
    bBefore: [], answer: asOpt(row.answer), bAfter: [],
    options: [row.answer, ...row.wrong].map(asOpt),
    translation: `「${row.meanQ}」 — 「${row.meanA}」`,
    lineId: [row.meanQ, row.meanA],
    explanation: row.expl,
    topic: 'campur_konteks',
    meta: {},
  }));
}

/* ==========================================================================
   5) TERJEMAH & KONJUGASI CAMPURAN (record slot panjang)
   ========================================================================== */
const MIX = [
  {
    tokens: [name('miraa'), P.wa, T('いつか'), noun('kabuki'), P.wo, G.tv('mimasu', 'tai'), T('。')],
    slot: 5, choices: [G.tv('mimasu', 'tai'), G.hs('pos'), G.tv('mimasu', 'takunai'), G.mv('mimasu', 'masu')],
    mean: 'Suatu hari nanti Sdr. Miller ingin menonton kabuki.',
    expl: 'いつか (suatu hari) + objek を + たいです. ほしい tidak dipakai untuk kegiatan menonton.',
  },
  {
    tokens: [name('rin'), P.wa, noun('puuru'), P.e, G.st('oyogimasu'), T('に'), G.mv('ikimasu', 'masu'), T('。')],
    slotToken: 'に', slotNth: 0, choices: [T('に'), T('を'), T('が'), T('で')],
    mean: 'Sdr. Rin pergi ke kolam renang untuk berenang.',
    expl: 'Tujuan kegiatan: 泳ぎに 行きます. Tempat tujuan memakai へ.',
  },
  {
    tokens: [T('しゅうまつ'), P.wa, T('どこか'), P.e, G.mv('asobimasu', 'masen'), T('か', 'か'), T('。')],
    slot: 2, choices: [T('どこか'), T('なにか'), T('だれか'), T('いつか')],
    mean: 'Akhir pekan mau bermain ke suatu tempat?',
    expl: 'どこか (suatu tempat) dengan へ. なにか untuk benda.',
  },
  {
    tokens: [T('へや'), T('に'), T('だれか'), T('が'), G.mv('imasu', 'masu'), T('。')],
    slot: 2, choices: [T('だれか'), T('なにか'), T('どこか'), T('だれも')],
    mean: 'Di kamar ada seseorang.',
    expl: 'だれか = seseorang; memakai が sebagai subjek. だれも hanya untuk kalimat negatif.',
  },
  {
    tokens: [T('わたしは'), noun('shiyakusho'), P.e, noun('touroku'), T('に'), G.mv('ikimasu', 'masu'), T('。')],
    slotToken: 'に', slotNth: 0, choices: [T('に'), T('を'), T('が'), T('へ')],
    mean: 'Saya pergi ke kantor pemerintah kota untuk mendaftar.',
    expl: 'Kata benda kegiatan (登録) memakai に: 登録に 行きます.',
  },
  {
    tokens: [T('わたしは'), noun('indoneshia'), P.e, noun('kazoku'), T('に'), G.st('aimasu'), T('に'), G.mv('kaerimasu', 'masu'), T('。')],
    slotToken: 'に', slotNth: 1, choices: [T('に'), T('を'), T('が'), T('で')],
    mean: 'Saya pulang ke Indonesia untuk bertemu keluarga.',
    expl: 'Pola 人 に 会いに 帰ります: orang memakai に, kegiatan 会いに.',
  },
  {
    tokens: [T('きのう'), T('は'), noun('kutsu'), P.ga, G.hs('pastneg')],
    slot: 4, choices: [G.hs('pastneg'), G.hs('past'), G.hs('neg'), G.hs('pos')],
    mean: 'Kemarin saya tidak ingin sepatu.',
    expl: 'Lampau negatif ほしい: ほしくなかったです.',
  },
  {
    tokens: [T('わたしは'), noun('nihongo'), P.wo, G.tv('benkyoushimasu', 'takunakatta')],
    slot: 3, choices: [G.tv('benkyoushimasu', 'takunakatta'), G.tv('benkyoushimasu', 'takunai'), G.tv('benkyoushimasu', 'takatta'), G.tv('benkyoushimasu', 'tai')],
    mean: 'Dulu saya tidak ingin belajar bahasa Jepang.',
    expl: 'Lampau negatif たい: 勉強したくなかったです.',
  },
];
for (const row of MIX) {
  push(rec({
    tokens: row.tokens,
    slot: row.slot,
    slotToken: row.slotToken,
    slotNth: row.slotNth,
    choices: row.choices,
    translation: row.mean,
    explanation: row.expl,
    topic: 'campur_kalimat',
    meta: {},
  }));
}

/* ==========================================================================
   6) MATCH CAMPURAN
   ========================================================================== */
push(match({
  pairs: [
    { jp: 'ほしいです', id: 'ingin memiliki', vocabId: 'c01' },
    { jp: 'たいです', id: 'ingin melakukan', vocabId: 'c02' },
    { jp: 'に行きます', id: 'pergi untuk', vocabId: 'c03' },
    { jp: '来ます', id: 'datang (arah)', vocabId: 'c04' },
  ],
  translation: 'Empat pola inti Bab 13 dalam satu pasangan.',
  explanation: 'ほしい = benda; たい = kegiatan; ます-stem + に + 行きます／来ます／帰ります = tujuan kegiatan.',
  topic: 'campur_match',
}));
push(match({
  pairs: [
    { jp: 'いつか', id: 'suatu hari nanti', vocabId: 'c11' },
    { jp: 'だれか', id: 'seseorang', vocabId: 'c12' },
    { jp: 'なにか', id: 'sesuatu', vocabId: 'c13' },
    { jp: 'どこか', id: 'suatu tempat', vocabId: 'c14' },
  ],
  translation: 'Kata tanya + か pada Bab 13.',
  explanation: 'Kata tanya + か membentuk kata tidak tentu. Jenisnya mengikuti kata tanya asal.',
  topic: 'campur_match',
}));
push(match({
  pairs: [
    { jp: '車がほしいです', id: 'ingin mobil', vocabId: 'c21' },
    { jp: '車を買いたいです', id: 'ingin membeli mobil', vocabId: 'c22' },
    { jp: '車を買いに行きます', id: 'pergi untuk membeli mobil', vocabId: 'c23' },
    { jp: '車がほしくないです', id: 'tidak ingin mobil', vocabId: 'c24' },
  ],
  translation: 'Bandingkan pola ほしい, たい, dan tujuan kegiatan.',
  explanation: 'Perubahan partikel menandakan pola berbeda: が ほしい, を たい, を …に 行きます.',
  topic: 'campur_match',
}));
push(match({
  pairs: [
    { jp: 'のどが渇きました', id: 'haus', vocabId: 'c31' },
    { jp: 'おなかがすきました', id: 'lapar', vocabId: 'c32' },
    { jp: 'おなかがいっぱいです', id: 'kenyang', vocabId: 'c33' },
    { jp: '疲れました', id: 'lelah', vocabId: 'c34' },
  ],
  translation: 'Ungkapan kondisi tubuh Bab 13.',
  explanation: 'Ungkapan ini sering menjadi alasan: のどが 渇きましたから、何か 飲みたいです。',
  topic: 'campur_match',
}));
push(match({
  pairs: [
    { jp: '週末に', id: 'akhir pekan', vocabId: 'c41' },
    { jp: '～ごろ', id: 'kira-kira (waktu)', vocabId: 'c42' },
    { jp: '会議', id: 'rapat', vocabId: 'c43' },
    { jp: '登録', id: 'pendaftaran', vocabId: 'c44' },
  ],
  translation: 'Kosakata Bab 13 yang sering muncul pada pola tujuan kegiatan.',
  explanation: '週末に 会議に 出ます; 市役所へ 登録に 行きます; 六時ごろ 帰ります。',
  topic: 'campur_match',
}));

/* ==========================================================================
   7) KASUAL CAMPURAN
   ========================================================================== */
const KASUAL = [
  {
    q: '週末、どこか行く？',
    a: [noun('umi'), P.e, G.st('oyogimasu'), T('に'), G.dv('ikimasu')],
    ans: 'Ke laut untuk berenang.',
    wrong: [[noun('umi'), P.wo, G.st('oyogimasu'), T('に'), G.dv('ikimasu')], [noun('umi'), P.e, G.dv('ikimasu'), T('に')], [G.n('kinou'), noun('umi'), P.e, G.dv('ikimasu')]],
    expl: 'Tujuan kegiatan tetap ます-stem + に. Dalam kasual, 行きます menjadi 行く.',
  },
  {
    q: '何か食べたい？',
    a: [T('うん、'), noun('osushi'), P.ga, G.tv('tabemasu', 'taiPlain')],
    ans: 'Iya, aku mau sushi.',
    wrong: [[T('うん、'), noun('osushi'), P.ga, G.hs('pos')], [T('ううん、'), T('何も'), G.tv('tabemasu', 'taiPlain')], [T('うん、'), T('いつか'), noun('osushi'), P.ga, G.tv('tabemasu', 'taiPlain')]],
    expl: 'Kegiatan memakai たい, bukan ほしい. 何も dipakai pada jawaban negatif.',
  },
  {
    q: 'だれか来る？',
    a: [T('うん、'), name('miraa'), P.ga, G.dv('kimasu')],
    ans: 'Iya, Sdr. Miller akan datang.',
    wrong: [[T('うん、'), name('miraa'), P.wo, G.dv('kimasu')], [T('うん、'), T('なにか'), P.ga, G.dv('kimasu')], [T('ううん、'), T('だれも'), G.dv('kimasu')]],
    expl: 'Subjek orang memakai が. だれも hanya untuk negatif (だれも 来ない).',
  },
  {
    q: '何がほしい？',
    a: [T('新しい'), noun('kuruma'), P.ga, G.hs('posPlain')],
    ans: 'Mobil baru.',
    wrong: [[T('新しい'), noun('kuruma'), P.wo, G.hs('posPlain')], [T('新しい'), noun('kuruma'), P.ga, G.tv('kaimasu', 'taiPlain')], [T('いつか'), G.hs('posPlain')]],
    expl: 'ほしい memakai が. たい untuk kegiatan (買いたい).',
  },
];
for (const row of KASUAL) {
  const correct = asOpt(row.a);
  const opts = [correct, ...row.wrong.map(asOpt)];
  const uniq = []; const seen = new Set();
  for (const o of opts) { if (!seen.has(o.jp)) { seen.add(o.jp); uniq.push(o); } }
  let k = 0;
  while (uniq.length < 4) {
    const o = asOpt([T('そうですね。'.slice(0, Math.min(6, k + 1)))]);
    if (!seen.has(o.jp)) { seen.add(o.jp); uniq.push(o); }
    k++;
  }
  push(dlg({
    a: [T(row.q)],
    bBefore: [], answer: correct, bAfter: [],
    options: uniq.slice(0, 4),
    translation: `「${row.q}」 — 「${row.ans}」 (kasual)`,
    lineId: [row.q, row.ans],
    explanation: row.expl,
    topic: 'campur_kasual',
    casual: true,
    meta: {},
  }));
}

module.exports = {
  band: 'campuran',
  focus: 'Campuran seluruh bunpou Bab 13: pilih pola, partikel, bentuk, dan respons percakapan',
  records: OUT,
};
