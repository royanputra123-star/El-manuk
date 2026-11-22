#!/usr/bin/env node
/* ============================================================================
 * tools/bab13_bank_campuran_extra.js  ·  bahan Level 26–30
 *
 * Menghasilkan kalimat campuran dari matriks kombinasi (tempat × kegiatan ×
 * subjek × waktu × orang) yang SELALU unik, memakai kosakata Bab 1–13.
 * Semua pola Bab 13 dicampur: ほしい · たい · tujuan kegiatan ·
 * いつか／だれか／なにか／どこか.
 * ========================================================================== */
'use strict';

const G = require('./bab13_grammar');
const F = require('./bab13_factory');
const { T, name, noun, P, w } = G;
const { rec } = F;

const OUT = [];
const push = r => OUT.push(r);

const jpOf = toks => toks.map(t => t.jp).join('');
const asOpt = toks => ({ jp: jpOf(toks), kana: toks.map(t => t.kana).join('') });

const SUBJ = { miraa: 'Sdr. Miller', rin: 'Sdr. Rin', santosu: 'Sdr. Santos', karina: 'Sdr. Karina', tanaka: 'Sdr. Tanaka', kimu: 'Sdr. Kim', yamada: 'Sdr. Yamada', matsumoto: 'Sdr. Matsumoto', watto: 'Sdr. Watt', min: 'Sdr. Minh' };
const SUBJ_IDS = Object.keys(SUBJ);



/* Kegiatan tujuan: [place, verb, objek?, keterangan] */
const PURPOSE = [
  ['suupaa', 'kaimonoshimasu', null, 'berbelanja'],
  ['depaato', 'kaimonoshimasu', null, 'berbelanja'],
  ['gakkou', 'benkyoushimasu', null, 'belajar'],
  ['toshokan', 'benkyoushimasu', null, 'belajar'],
  ['kouen', 'sanposhimasu', null, 'berjalan-jalan'],
  ['umi', 'oyogimasu', null, 'berenang'],
  ['puuru', 'oyogimasu', null, 'berenang'],
  ['resutoran', 'shokujishimasu', null, 'makan'],
  ['kissaten', 'nomimasu', 'koohii', 'minum kopi'],
  ['yuubinkyoku', 'okurimasu', 'tegami', 'mengirim surat'],
  ['ginkou', 'dashimasu', 'okane', 'mengambil uang'],
  ['kuukou', 'mukaemasu', 'tomodachi', 'menjemput teman'],
  ['bijutsukan', 'mimasu', 'e', 'melihat lukisan'],
  ['honnya', 'kaimasu', 'jisho', 'membeli kamus'],
  ['mise', 'kaimasu', 'gyuunyuu', 'membeli susu'],
  ['niwa', 'asobimasu', null, 'bermain'],
  ['uchi', 'yasumimasu', null, 'beristirahat'],
  ['daigaku', 'benkyoushimasu', 'nihongo', 'belajar bahasa Jepang'],
  ['hoteru', 'shokujishimasu', null, 'makan malam'],
  ['kaisha', 'kaigi', null, 'rapat', 'nounact'],
  ['shiyakusho', 'touroku', null, 'mendaftar', 'nounact'],
  ['kawa', 'oyogimasu', null, 'berenang'],
  ['yama', 'sanposhimasu', null, 'mendaki'],
  ['kouen', 'torimasu', 'shashin', 'mengambil foto'],
];

/* ==========================================================================
   1) Tujuan kegiatan: へ + (objek を) + ます-stem + に + 行きます
   subjek × tujuan (deterministik, unik)
   ========================================================================== */
let subjIdx = 0;
const TIME_TAG = ['', 'きのう', 'あした'];
for (const [place, verb, obj, act, kind] of PURPOSE) {
  for (let rep = 0; rep < 3; rep++) {
    const subj = SUBJ_IDS[(subjIdx++) % SUBJ_IDS.length];
    let purpose;
    if (kind === 'nounact') purpose = [noun(verb), T('に')];
    else if (obj) purpose = [noun(obj), P.wo, G.st(verb), T('に')];
    else purpose = [G.st(verb), T('に')];
    const timeTok = rep === 1 ? G.n('kinou') : rep === 2 ? G.n('ashita') : null;
    const head = timeTok ? [timeTok, P.wa, name(subj), P.wa] : [name(subj), P.wa];
    const tokens = [...head, noun(place), P.e, ...purpose, G.mv('ikimasu', rep === 1 ? 'mashita' : 'masu')];
    const tense = rep === 1 ? ' (lampau)' : rep === 2 ? ' (besok)' : '';
    push(rec({
      tokens,
      slotToken: 'に',
      slotNth: 0,
      choices: [T('に'), T('を'), T('が'), T('で')],
      translation: `${SUBJ[subj]} pergi ke ${w(place).mean || place} untuk ${act}${tense}.`,
      explanation: 'Tujuan kegiatan memakai ます-stem + に. Objek kegiatan tetap を, arah tempat memakai へ.',
      topic: 'campur_pola',
      meta: {},
    }));
  }
}

/* ==========================================================================
   2) に来ます / に帰ります dengan subjek dan waktu berbeda
   ========================================================================== */
const KIMASU_SET = [
  ['miraa', 'nihon', 'benkyoushimasu', null, 'belajar di Jepang'],
  ['rin', 'uchi', 'asobimasu', null, 'bermain di rumah'],
  ['santosu', 'kouen', 'sanposhimasu', null, 'jalan-jalan di taman'],
  ['karina', 'depaato', 'kaimonoshimasu', null, 'berbelanja'],
  ['tanaka', 'hoteru', 'shokujishimasu', null, 'makan di hotel'],
  ['kimu', 'puuru', 'oyogimasu', null, 'berenang'],
  ['yamada', 'shiyakusho', 'touroku', null, 'mendaftar'],
  ['matsumoto', 'bijutsukan', 'mimasu', 'e', 'melihat lukisan'],
  ['watto', 'kaisha', 'kaigi', null, 'rapat'],
  ['min', 'gakkou', 'benkyoushimasu', null, 'belajar'],
  ['miraa', 'daigaku', 'benkyoushimasu', 'nihongo', 'belajar bahasa Jepang'],
  ['rin', 'toshokan', 'karimasu', 'hon', 'meminjam buku'],
  ['santosu', 'yuubinkyoku', 'kaimasu', 'kitte', 'membeli perangko'],
  ['karina', 'kuukou', 'mukaemasu', 'tomodachi', 'menjemput teman'],
  ['tanaka', 'kissaten', 'nomimasu', 'koohii', 'minum kopi'],
];
for (const [subj, place, verb, obj, act] of KIMASU_SET) {
  for (const past of [false, true]) {
    let purpose;
    if (verb === 'kaigi' || verb === 'touroku') purpose = [noun(verb), T('に')];
    else if (obj) purpose = [noun(obj), P.wo, G.st(verb), T('に')];
    else purpose = [G.st(verb), T('に')];
    const tokens = [name(subj), P.wa, noun(place), P.e, ...purpose, G.mv('kimasu', past ? 'mashita' : 'masu')];
    push(rec({
      tokens,
      slot: tokens.length - 1,
      choices: past
        ? [G.mv('kimasu', 'mashita'), G.mv('kimasu', 'masu'), G.mv('ikimasu', 'mashita'), G.mv('kaerimasu', 'mashita')]
        : [G.mv('kimasu', 'masu'), G.mv('kimasu', 'mashita'), G.mv('ikimasu', 'masu'), G.mv('kaerimasu', 'masu')],
      translation: `${SUBJ[subj]} ${past ? 'datang' : 'akan datang'} ke ${w(place).mean} untuk ${act}.`,
      explanation: 'に来ます menyatakan datang untuk melakukan kegiatan. Kata kerja utama dipilih sesuai arah dan waktu.',
      topic: 'campur_bentuk',
      meta: {},
    }));
  }
}

const KAERU_SET = [
  ['indoneshia', 'kazoku', 'bertemu keluarga'],
  ['indoneshia', 'ryoushin', 'bertemu orang tua'],
  ['kuni', 'tomodachi', 'bertemu teman'],
  ['kuni', 'ryoushin', 'bertemu orang tua'],
  ['indoneshia', 'chichi', 'bertemu ayah'],
  ['kuni', 'haha', 'bertemu ibu'],
  ['indoneshia', 'ani', 'bertemu kakak laki-laki'],
  ['kuni', 'ane', 'bertemu kakak perempuan'],
  ['indoneshia', 'otouto', 'bertemu adik laki-laki'],
  ['kuni', 'imouto', 'bertemu adik perempuan'],
];
const FAMILY_ID = { kazoku: 'kazoku', ryoushin: 'ryoushin', tomodachi: 'tomodachi', chichi: 'chichi', haha: 'haha', ani: 'ani', ane: 'ane', otouto: 'otouto', imouto: 'imouto' };
for (const [place, who, act] of KAERU_SET) {
  for (const past of [false, true]) {
    const tokens = [T('わたしは'), noun(place), P.e, noun(FAMILY_ID[who]), T('に'), G.st('aimasu'), T('に'), G.mv('kaerimasu', past ? 'mashita' : 'masu')];
    push(rec({
      tokens,
      slot: tokens.length - 1,
      choices: past
        ? [G.mv('kaerimasu', 'mashita'), G.mv('kaerimasu', 'masu'), G.mv('ikimasu', 'mashita'), G.mv('kimasu', 'mashita')]
        : [G.mv('kaerimasu', 'masu'), G.mv('kaerimasu', 'mashita'), G.mv('ikimasu', 'masu'), G.mv('kimasu', 'masu')],
      translation: `Saya ${past ? 'pulang' : 'akan pulang'} ke ${w(place).mean} untuk ${act}.`,
      explanation: 'Pola 人 に 会いに 帰ります: orang yang ditemui memakai に, kegiatan 会いに, lalu kata kerja arah.',
      topic: 'campur_kalimat',
      meta: {},
    }));
  }
}

/* ==========================================================================
   3) ほしい / たい dengan waktu dan subjek (bank kalimat unik)
   ========================================================================== */
const HOSHI_OBJ = ['kuruma', 'kamera', 'jitensha', 'tokei', 'kaban', 'kutsu', 'shatsu', 'inu', 'neko', 'hana', 'hon', 'jisho', 'kasa', 'isu', 'kippu', 'puuru', 'kawa'];
const HOSHI_FORM = ['pos', 'neg', 'past', 'pastneg'];
for (let i = 0; i < 34; i++) {
  const obj = HOSHI_OBJ[i % HOSHI_OBJ.length];
  const form = HOSHI_FORM[i % HOSHI_FORM.length];
  const subj = SUBJ_IDS[(i * 3) % SUBJ_IDS.length];
  const withTime = i % 3 === 1;
  const past = form === 'past' || form === 'pastneg';
  const time = past ? (i % 2 ? 'kinou' : 'senshuu') : (i % 2 ? 'ima' : 'konshuu');
  const tokens = withTime
    ? [G.n(time), P.wa, noun(obj), P.ga, G.hs(form)]
    : [name(subj), P.wa, noun(obj), P.ga, G.hs(form)];
  const isNeg = form === 'neg' || form === 'pastneg';
  const mean = w(obj).mean;
  push(rec({
    tokens,
    slot: tokens.length - 1,
    choices: [form, ...HOSHI_FORM.filter(f => f !== form)].map(f => G.hs(f)),
    translation: withTime
      ? `${w(time).mean.charAt(0).toUpperCase() + w(time).mean.slice(1)} ${isNeg ? 'tidak ' : ''}ingin memiliki ${mean}.`
      : `${SUBJ[subj]} ${isNeg ? 'tidak ' : ''}ingin memiliki ${mean}.`,
    explanation: 'ほしい mengikuti perubahan kata sifat い dan objeknya memakai が.',
    topic: 'campur_bentuk',
    meta: {},
  }));
}

const TAI_SET = [
  ['tabemasu', 'osushi'], ['nomimasu', 'koohii'], ['kaimasu', 'kamera'],
  ['mimasu', 'eiga'], ['yomimasu', 'hon'], ['kakimasu', 'tegami'],
  ['kikimasu', 'ongaku'], ['torimasu', 'shashin'], ['karimasu', 'jisho'],
  ['okurimasu', 'tegami'], ['tabemasu', 'tenpura'], ['nomimasu', 'ocha'],
  ['kaimasu', 'kutsu'], ['mimasu', 'kabuki'], ['yomimasu', 'shinbun'],
  ['tabemasu', 'sakana'], ['nomimasu', 'juusu'], ['kaimasu', 'hana'],
  ['tabemasu', 'sashimi'], ['nomimasu', 'biiru'],
];
const TAI_FORM = ['tai', 'takunai', 'takatta', 'takunakatta'];
for (let i = 0; i < 34; i++) {
  const [verb, obj] = TAI_SET[i % TAI_SET.length];
  const form = TAI_FORM[i % TAI_FORM.length];
  const withTime = i % 3 === 2;
  const past = form === 'takatta' || form === 'takunakatta';
  const time = past ? (i % 2 ? 'kinou' : 'senshuu') : (i % 2 ? 'ima' : 'konshuu');
  const tokens = withTime
    ? [G.n(time), P.wa, noun(obj), P.wo, G.tv(verb, form)]
    : [T('わたしは'), noun(obj), P.wo, G.tv(verb, form)];
  const isNeg = form === 'takunai' || form === 'takunakatta';
  push(rec({
    tokens,
    slot: tokens.length - 1,
    choices: [form, ...TAI_FORM.filter(f => f !== form)].map(f => G.tv(verb, f)),
    translation: withTime
      ? `${w(time).mean.charAt(0).toUpperCase() + w(time).mean.slice(1)} saya ${isNeg ? 'tidak ' : ''}ingin ${past ? 'dulu ' : ''}${verb === 'tabemasu' ? 'makan' : verb === 'nomimasu' ? 'minum' : verb === 'kaimasu' ? 'membeli' : verb === 'mimasu' ? 'menonton' : verb === 'yomimasu' ? 'membaca' : verb === 'kakimasu' ? 'menulis' : verb === 'kikimasu' ? 'mendengarkan' : verb === 'torimasu' ? 'memotret' : verb === 'karimasu' ? 'meminjam' : 'mengirim'} ${w(obj).mean}.`
      : `Saya ${isNeg ? 'tidak ' : ''}ingin ${past ? 'dulu ' : ''}${verb === 'tabemasu' ? 'makan' : verb === 'nomimasu' ? 'minum' : verb === 'kaimasu' ? 'membeli' : verb === 'mimasu' ? 'menonton' : verb === 'yomimasu' ? 'membaca' : verb === 'kakimasu' ? 'menulis' : verb === 'kikimasu' ? 'mendengarkan' : verb === 'torimasu' ? 'memotret' : verb === 'karimasu' ? 'meminjam' : 'mengirim'} ${w(obj).mean}.`,
    explanation: 'たい mengikuti perubahan kata sifat い; objeknya memakai を (atau が untuk menekankan).',
    topic: 'campur_bentuk',
    meta: {},
  }));
}

module.exports = { records: OUT };
