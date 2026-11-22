#!/usr/bin/env node
/* ============================================================================
 * tools/bab13_bank_tujuan.js
 * Level 11–15 · Bunpou C: Tujuan pergi / datang / pulang
 *
 * Pola inti: (Tempat へ) Kata kerja bentuk ます tanpa ます + に 行きます／来ます／帰ります。
 * Objek kegiatan tetap memakai を: レストランへ すしを 食べに 行きます。
 * Cakupan: tujuan kegiatan, tujuan tempat, へ／を／に, に来ます, に帰ります,
 * kata tanya 何をしに／どこへ／だれに.
 * ========================================================================== */
'use strict';

const G = require('./bab13_grammar');
const F = require('./bab13_factory');
const { T, noun, P, name, verbMasu, w } = G;
const { rec, dlg, match } = F;

const OUT = [];
const push = r => OUT.push(r);
const jpOf = toks => toks.map(t => (typeof t === 'string' ? t : t.jp)).join('');
const asOpt = toks => ({ jp: jpOf(toks), kana: toks.map(t => (typeof t === 'string' ? t : t.kana)).join('') });

const PLACE = {
  suupaa: 'supermarket', depaato: 'department store', eki: 'stasiun', gakkou: 'sekolah',
  toshokan: 'perpustakaan', kouen: 'taman', umi: 'laut', puuru: 'kolam renang',
  kawa: 'sungai', yama: 'gunung', resutoran: 'restoran', kissaten: 'kedai kopi',
  mise: 'toko', honnya: 'toko buku', shiyakusho: 'kantor pemerintah kota',
  yuubinkyoku: 'kantor pos', ginkou: 'bank', daigaku: 'universitas',
  hoteru: 'hotel', kuukou: 'bandara', bijutsukan: 'gedung kesenian',
  niwa: 'halaman', heya: 'kamar', uchi: 'rumah', kaisha: 'kantor perusahaan',
};

/* ==========================================================================
   1) DRILL DASAR: (Tempat へ) kegiatan-に 行きます
   ========================================================================== */
const GO = [
  { place: 'suupaa', v: 'kaimonoshimasu', act: 'berbelanja' },
  { place: 'depaato', v: 'kaimonoshimasu', act: 'berbelanja' },
  { place: 'gakkou', v: 'benkyoushimasu', act: 'belajar' },
  { place: 'toshokan', v: 'benkyoushimasu', act: 'belajar' },
  { place: 'kouen', v: 'sanposhimasu', act: 'berjalan-jalan' },
  { place: 'umi', v: 'oyogimasu', act: 'berenang' },
  { place: 'puuru', v: 'oyogimasu', act: 'berenang' },
  { place: 'kawa', v: 'tsuri', act: 'memancing', nounAct: 'tsuri' },
  { place: 'yama', v: 'sukii', act: 'bermain ski', nounAct: 'sukii' },
  { place: 'resutoran', v: 'shokujishimasu', act: 'makan' },
  { place: 'kissaten', v: 'nomimasu', act: 'minum kopi', obj: 'koohii' },
  { place: 'shiyakusho', v: 'touroku', act: 'mendaftar', nounAct: 'touroku' },
  { place: 'yuubinkyoku', v: 'okurimasu', act: 'mengirim surat', obj: 'tegami' },
  { place: 'ginkou', v: 'dashimasu', act: 'mengambil uang', obj: 'okane' },
  { place: 'kuukou', v: 'mukaemasu', act: 'menjemput teman', obj: 'tomodachi' },
  { place: 'bijutsukan', v: 'mimasu', act: 'melihat lukisan', obj: 'e' },
  { place: 'kaisha', v: 'kaigi', act: 'rapat', nounAct: 'kaigi' },
  { place: 'daigaku', v: 'benkyoushimasu', act: 'belajar bahasa Jepang', obj: 'nihongo' },
  { place: 'honnya', v: 'kaimasu', act: 'membeli kamus', obj: 'jisho' },
  { place: 'mise', v: 'kaimasu', act: 'membeli susu', obj: 'gyuunyuu' },
  { place: 'niwa', v: 'asobimasu', act: 'bermain' },
  { place: 'uchi', v: 'yasumimasu', act: 'beristirahat' },
  { place: 'hoteru', v: 'shokujishimasu', act: 'makan malam' },
  { place: 'eki', v: 'mukaemasu', act: 'menjemput Sdr. Miller', person: 'miraa' },
  { place: 'kouen', v: 'torimasu', act: 'mengambil foto', obj: 'shashin' },
  { place: 'puuru', v: 'hairimasu', act: 'masuk ke kolam' },
];
for (const row of GO) {
  let purpose;
  if (row.nounAct) purpose = [noun(row.nounAct), T('に')];
  else if (row.obj) purpose = [noun(row.obj), P.wo, G.st(row.v), T('に')];
  else if (row.person) purpose = [name(row.person), P.wo, G.st(row.v), T('に')];
  else purpose = [G.st(row.v), T('に')];
  const t = [T('わたしは'), noun(row.place), P.e, ...purpose, verbMasu('ikimasu', 'masu')];
  const actText = row.person ? 'menjemput ' + G.NAME_BY_ID.get(row.person).mean : row.obj ? row.act : row.act;
  push(rec({
    tokens: t,
    slot: t.length - 2,
    choices: [T('に'), T('を'), T('へ'), T('で')],
    translation: `Saya pergi ke ${PLACE[row.place]} untuk ${actText}.`,
    explanation: 'Tujuan kegiatan memakai kata kerja bentuk ます tanpa ます + に: 買い物に 行きます, 食べに 行きます. Partikel に menandai tujuan kegiatan, sedangkan へ menandai arah tempat.',
    topic: 'tujuan_dasar',
    meta: { place: row.place, verb: row.v, kind: 'ikimasu' },
  }));
}

/* ==========================================================================
   2) OBJEK を DI DALAM TUJUAN KEGIATAN
   ========================================================================== */
const OBJ_PURPOSE = [
  { place: 'resutoran', obj: 'osushi', v: 'tabemasu', act: 'makan sushi', part: 'wo' },
  { place: 'kissaten', obj: 'koohii', v: 'nomimasu', act: 'minum kopi', part: 'wo' },
  { place: 'depaato', obj: 'kaban', v: 'kaimasu', act: 'membeli tas', part: 'wo' },
  { place: 'toshokan', obj: 'hon', v: 'karimasu', act: 'meminjam buku', part: 'wo' },
  { place: 'yuubinkyoku', obj: 'kitte', v: 'kaimasu', act: 'membeli perangko', part: 'wo' },
  { place: 'kuukou', obj: 'tomodachi', v: 'mukaemasu', act: 'menjemput teman', part: 'wo' },
  { place: 'shiyakusho', obj: 'touroku', v: 'shimasu', act: 'mendaftar', part: 'wo', nounAct: 'touroku' },
  { place: 'ginkou', obj: 'okane', v: 'dashimasu', act: 'mengambil uang', part: 'wo' },
  { place: 'kouen', obj: 'shashin', v: 'torimasu', act: 'mengambil foto', part: 'wo' },
  { place: 'suupaa', obj: 'yasai', v: 'kaimasu', act: 'membeli sayur', part: 'wo' },
  { place: 'resutoran', obj: 'tenpura', v: 'tabemasu', act: 'makan tempura', part: 'wo' },
  { place: 'depaato', obj: 'kutsu', v: 'kaimasu', act: 'membeli sepatu', part: 'wo' },
];
for (const row of OBJ_PURPOSE) {
  const t = [T('わたしは'), noun(row.place), P.e, noun(row.obj), P.wo, G.st(row.v), T('に'), verbMasu('ikimasu', 'masu')];
  push(rec({
    tokens: t,
    slot: 4,
    choices: [T('を'), T('に'), T('が'), T('へ')],
    translation: `Saya pergi ke ${PLACE[row.place]} untuk ${row.act}.`,
    explanation: 'Di dalam pola tujuan kegiatan, objek tetap ditandai を: レストランへ すしを 食べに 行きます. に dipakai setelah kata kerja (tujuan kegiatan).',
    topic: 'tujuan_objek',
    meta: { place: row.place, obj: row.obj, verb: row.v },
  }));
}
/* Soal memilih susunan kalimat yang benar (beberapa token) */
for (const row of OBJ_PURPOSE.slice(0, 8)) {
  const correct = [noun(row.place), P.e, noun(row.obj), P.wo, G.st(row.v), T('に'), verbMasu('ikimasu', 'masu')];
  const wrong = [noun(row.place), P.e, noun(row.obj), P.ni, G.st(row.v), P.wo, verbMasu('ikimasu', 'masu')];
  const wrong2 = [noun(row.place), P.wo, noun(row.obj), P.e, G.st(row.v), T('に'), verbMasu('ikimasu', 'masu')];
  const wrong3 = [noun(row.place), P.e, noun(row.obj), P.wo, G.st(row.v), verbMasu('ikimasu', 'masu'), T('に')];
  push(rec({
    tokens: correct,
    slot: 3,
    choices: [P.wo, P.ni, P.e, P.de].map(x => T(x.jp)),
    translation: `Saya pergi ke ${PLACE[row.place]} untuk ${row.act}. (partikel objek)`,
    explanation: 'Urutan aman: Tempat へ + Objek を + ます-stem + に + 行きます. Partikel を hanya untuk objek, に untuk tujuan kegiatan.',
    topic: 'tujuan_objek',
    meta: { place: row.place, obj: row.obj, verb: row.v },
  }));
  void wrong; void wrong2; void wrong3;
}

/* ==========================================================================
   3) に来ます — datang untuk melakukan sesuatu
   ========================================================================== */
const KIMASU = [
  { subj: 'miraa', place: 'nihon', v: 'benkyoushimasu', act: 'belajar bahasa Jepang', obj: 'nihongo', past: true },
  { subj: 'rin', place: 'uchi', v: 'asobimasu', act: 'bermain', past: true },
  { subj: 'santosu', place: 'kouen', v: 'sanposhimasu', act: 'berjalan-jalan', past: false },
  { subj: 'karina', place: 'depaato', v: 'kaimonoshimasu', act: 'berbelanja', past: false },
  { subj: 'tanaka', place: 'hoteru', v: 'shokujishimasu', act: 'makan', past: true },
  { subj: 'kimu', place: 'puuru', v: 'oyogimasu', act: 'berenang', past: false },
  { subj: 'yamada', place: 'shiyakusho', v: 'touroku', act: 'mendaftar', nounAct: 'touroku', past: true },
  { subj: 'matsumoto', place: 'bijutsukan', v: 'mimasu', act: 'melihat lukisan', obj: 'e', past: false },
  { subj: 'watto', place: 'kaisha', v: 'kaigi', act: 'rapat', nounAct: 'kaigi', past: true },
  { subj: 'min', place: 'gakkou', v: 'benkyoushimasu', act: 'belajar', past: false },
];
for (const row of KIMASU) {
  let purpose;
  if (row.nounAct) purpose = [noun(row.nounAct), T('に')];
  else if (row.obj) purpose = [noun(row.obj), P.wo, G.st(row.v), T('に')];
  else purpose = [G.st(row.v), T('に')];
  const t = [name(row.subj), P.wa, noun(row.place), P.e, ...purpose, verbMasu('kimasu', row.past ? 'mashita' : 'masu')];
  push(rec({
    tokens: t,
    slot: t.length - 1,
    choices: row.past
      ? [verbMasu('kimasu', 'mashita'), verbMasu('kimasu', 'masu'), verbMasu('ikimasu', 'mashita'), verbMasu('kaerimasu', 'mashita')]
      : [verbMasu('kimasu', 'masu'), verbMasu('kimasu', 'mashita'), verbMasu('ikimasu', 'masu'), verbMasu('kaerimasu', 'masu')],
    translation: `${G.NAME_BY_ID.get(row.subj).mean} ${row.past ? 'datang' : 'akan datang'} ke ${PLACE[row.place]} untuk ${row.act}.`,
    explanation: 'に来ます menyatakan datang ke suatu tempat untuk melakukan kegiatan. Pilih 来ます (datang) atau 来ました (datang lampau) sesuai waktu kalimat.',
    topic: 'tujuan_ki',
    meta: { place: row.place, verb: row.v, kind: row.past ? 'kimashita' : 'kimasu' },
  }));
}

/* ==========================================================================
   4) に帰ります — pulang untuk melakukan sesuatu
   ========================================================================== */
const KAERIMASU = [
  { subj: 'indoneshia', person: 'kazoku', act: 'bertemu keluarga', past: false },
  { subj: 'indoneshia', person: 'ryoushin', act: 'bertemu orang tua', past: true },
  { subj: 'kuni', person: 'tomodachi', act: 'bertemu teman', past: false },
  { subj: 'uchi', act: 'makan malam bersama keluarga', v: 'shokujishimasu', past: true },
  { subj: 'uchi', act: 'beristirahat', v: 'yasumimasu', past: false },
  { subj: 'nihon', person: 'ha', act: 'bertemu ibu', past: true },
  { subj: 'kuni', act: 'bekerja', v: 'hatarakimasu', past: false },
  { subj: 'uchi', act: 'bermain bersama anak', v: 'asobimasu', obj: 'kodomo', past: true },
];
for (const row of KAERIMASU) {
  let purpose;
  if (row.person === 'ha') purpose = [T('母', 'はは'), T('に')];
  else if (row.person) purpose = [noun(row.person), T('に')];
  else if (row.obj) purpose = [noun(row.obj), P.to, G.st(row.v), T('に')];
  else purpose = [G.st(row.v), T('に')];
  /* 家族に 会いに 帰ります — aktivitas pertemuan memakai 会います */
  if (row.person || row.person === 'ha') purpose = [row.person === 'ha' ? T('母', 'はは') : noun(row.person), T('に'), G.st('aimasu'), T('に')];
  const t = [T('わたしは'), noun(row.subj), P.e, ...purpose, verbMasu('kaerimasu', row.past ? 'mashita' : 'masu')];
  const actText = row.person === 'ha' ? 'bertemu ibu' : row.person ? `bertemu ${w(row.person).mean}` : row.act;
  push(rec({
    tokens: t,
    slot: t.length - 1,
    choices: row.past
      ? [verbMasu('kaerimasu', 'mashita'), verbMasu('kaerimasu', 'masu'), verbMasu('ikimasu', 'mashita'), verbMasu('kimasu', 'mashita')]
      : [verbMasu('kaerimasu', 'masu'), verbMasu('kaerimasu', 'mashita'), verbMasu('ikimasu', 'masu'), verbMasu('kimasu', 'masu')],
    translation: `Saya ${row.past ? 'pulang' : 'akan pulang'} ke ${PLACE[row.subj]} untuk ${actText}.`,
    explanation: 'に帰ります menyatakan pulang ke tempat asal untuk melakukan kegiatan. Untuk bertemu orang dipakai pola 人 に 会いに 帰ります.',
    topic: 'tujuan_kaeru',
    meta: { place: row.subj, verb: row.v || 'aimasu', kind: row.past ? 'kaerimashita' : 'kaerimasu' },
  }));
}

/* ==========================================================================
   5) TUJUAN KEGIATAN vs TUJUAN TEMPAT
   ========================================================================== */
const COMPARE = [
  { place: 'suupaa', v: 'kaimonoshimasu', act: 'berbelanja' },
  { place: 'toshokan', v: 'benkyoushimasu', act: 'belajar' },
  { place: 'kouen', v: 'sanposhimasu', act: 'berjalan-jalan' },
  { place: 'umi', v: 'oyogimasu', act: 'berenang' },
  { place: 'resutoran', v: 'shokujishimasu', act: 'makan' },
  { place: 'bijutsukan', v: 'mimasu', act: 'melihat lukisan', obj: 'e' },
];
for (const row of COMPARE) {
  const purpose = row.obj ? [noun(row.obj), P.wo, G.st(row.v), T('に')] : [G.st(row.v), T('に')];
  const correct = [T('わたしは'), noun(row.place), P.e, ...purpose, verbMasu('ikimasu', 'masu')];
  const wrongA = [T('わたしは'), noun(row.place), P.e, ...purpose, verbMasu('ikimasu', 'masu')].map(t => t);
  /* variasi salah: に dihilangkan dari kata kerja */
  const wrong1 = [T('わたしは'), noun(row.place), P.e, ...(row.obj ? [noun(row.obj), P.wo] : []), G.st(row.v), verbMasu('ikimasu', 'masu')];
  const wrong2 = [T('わたしは'), noun(row.place), P.wo, ...purpose, verbMasu('ikimasu', 'masu')];
  const wrong3 = [T('わたしは'), noun(row.place), P.e, ...purpose, verbMasu('ikimasu', 'masu')].slice(0, -1).concat([T('行きました', 'いきました')]);
  const options = [correct, wrong1, wrong2, wrong3];
  const uniq = new Map(options.map(o => [jpOf(o), o]));
  /* hannya pilih yang benar; pengecoh diuji lewat 'pilih kalimat benar' */
  if (uniq.size === 4) {
    push(rec({
      tokens: correct,
      slot: correct.length - 1,
      choices: [verbMasu('ikimasu', 'masu'), verbMasu('ikimasu', 'masen'), verbMasu('ikimasu', 'mashita'), verbMasu('kimasu', 'masu')],
      translation: `Saya pergi ke ${PLACE[row.place]} untuk ${row.act}.`,
      explanation: 'Bandingkan: 「スーパーへ 行きます」 (tujuan tempat) dengan 「スーパーへ 買い物に 行きます」 (tujuan kegiatan). Keduanya benar, tetapi bentuk dengan に menjelaskan kegiatan yang dilakukan.',
      topic: 'tujuan_banding',
      meta: { place: row.place, verb: row.v },
    }));
  }
  void wrongA;
}

/* ==========================================================================
   6) KATA TANYA: 何をしに／どこへ／だれに
   ========================================================================== */
const WH = [];

void WH;

const WH2 = [
  {
    q: '何をしに日本へ行きますか。', qMean: 'Untuk melakukan apa kamu pergi ke Jepang?',
    a: [noun('nihongo'), P.wo, G.st('benkyoushimasu'), T('に')], aMean: 'Untuk belajar bahasa Jepang.',
  },
  {
    q: 'どこへ買い物に行きますか。', qMean: 'Ke mana kamu pergi berbelanja?',
    a: [noun('suupaa'), P.e, G.st('kaimonoshimasu'), T('に'), verbMasu('ikimasu', 'masu')], aMean: 'Saya pergi ke supermarket untuk berbelanja.',
  },
  {
    q: 'だれに会いに国へ帰りますか。', qMean: 'Untuk bertemu siapa kamu pulang ke negara?',
    a: [T('家族', 'かぞく'), T('に')], aMean: 'Untuk bertemu keluarga.',
  },
  {
    q: '空港へ何をしに行きますか。', qMean: 'Untuk melakukan apa kamu pergi ke bandara?',
    a: [noun('tomodachi'), P.wo, G.st('mukaemasu'), T('に')], aMean: 'Untuk menjemput teman.',
  },
  {
    q: 'レストランへ何をしに行きますか。', qMean: 'Untuk melakukan apa kamu pergi ke restoran?',
    a: [noun('osushi'), P.wo, G.st('tabemasu'), T('に')], aMean: 'Untuk makan sushi.',
  },
  {
    q: 'あしたどこへ行きますか。', qMean: 'Besok pergi ke mana?',
    a: [noun('toshokan'), P.e, G.st('benkyoushimasu'), T('に'), verbMasu('ikimasu', 'masu')], aMean: 'Ke perpustakaan untuk belajar.',
  },
];
for (const row of WH2) {
  const correct = row.a;
  const options = [
    correct,
    [correct[0], P.ga, G.st('tabemasu'), T('に')],
    [correct[0], P.wo, G.st('ikimasu'), T('に')],
    [G.n('kinou'), G.st('benkyoushimasu'), T('に')],
  ];
  push(dlg({
    a: [T(row.q)],
    bBefore: [], answer: asOpt(correct), bAfter: [],
    options: options.map(asOpt),
    translation: `「${row.qMean}」 — 「${row.aMean}」`,
    lineId: [row.qMean, row.aMean],
    explanation: 'Tujuan kegiatan memakai ます-stem + に. Pertanyaan 何をしに 行きますか menanyakan kegiatan yang menjadi tujuan.',
    topic: 'tujuan_tanya',
    meta: {},
  }));
}

/* ==========================================================================
   7) PARTIKEL: に (tujuan kegiatan) vs へ (arah) vs を (objek)
   ========================================================================== */
const PART = [
  { place: 'gakkou', v: 'benkyoushimasu', slotPart: 'ni' },
  { place: 'suupaa', v: 'kaimonoshimasu', slotPart: 'he' },
  { place: 'kouen', v: 'sanposhimasu', slotPart: 'ni' },
  { place: 'toshokan', v: 'benkyoushimasu', slotPart: 'he' },
  { place: 'resutoran', v: 'shokujishimasu', slotPart: 'ni' },
  { place: 'umi', v: 'oyogimasu', slotPart: 'he' },
  { place: 'puuru', v: 'oyogimasu', slotPart: 'ni' },
  { place: 'bijutsukan', v: 'mimasu', slotPart: 'he' },
];
for (const row of PART) {
  const isNi = row.slotPart === 'ni';
  const t = [T('わたしは'), noun(row.place), isNi ? P.e : P.e, isNi ? G.st(row.v) : P.e, T('')];
  void t;
  const tokens = isNi
    ? [T('わたしは'), noun(row.place), P.e, G.st(row.v), T('に'), verbMasu('ikimasu', 'masu')]
    : [T('わたしは'), noun(row.place), P.e, G.st(row.v), T('に'), verbMasu('ikimasu', 'masu')];
  const slot = 4;
  push(rec({
    tokens,
    slot,
    choices: [T('に'), T('を'), T('が'), T('で')],
    translation: `Saya pergi ke ${PLACE[row.place]} untuk ${row.v === 'benkyoushimasu' ? 'belajar' : row.v === 'kaimonoshimasu' ? 'berbelanja' : row.v === 'sanposhimasu' ? 'berjalan-jalan' : row.v === 'oyogimasu' ? 'berenang' : 'makan'}.`,
    explanation: 'Kata kerja bentuk ます tanpa ます + に menandai tujuan kegiatan: 勉強に 行きます. Jangan memakai を (objek) atau で (tempat kegiatan) untuk tujuan ini.',
    topic: 'tujuan_partikel',
    meta: { place: row.place, verb: row.v },
  }));
}

/* ==========================================================================
   8) MATCH & KASUAL (sedikit)
   ========================================================================== */
push(match({
  pairs: [
    { jp: '買い物に行きます', id: 'pergi untuk berbelanja', vocabId: 'tp01' },
    { jp: '食べに行きます', id: 'pergi untuk makan', vocabId: 'tp02' },
    { jp: '迎えに行きます', id: 'pergi untuk menjemput', vocabId: 'tp03' },
    { jp: '会いに行きます', id: 'pergi untuk bertemu', vocabId: 'tp04' },
  ],
  translation: 'Empat tujuan kegiatan: 買い物 · 食べ · 迎え · 会い + に 行きます.',
  explanation: 'Bentuk ます tanpa ます (買います→買い, 食べます→食べ) ditambah に lalu 行きます.',
  topic: 'tujuan_match',
}));
push(match({
  pairs: [
    { jp: '行きます', id: 'pergi', vocabId: 'tk01' },
    { jp: '来ます', id: 'datang', vocabId: 'tk02' },
    { jp: '帰ります', id: 'pulang', vocabId: 'tk03' },
    { jp: 'に', id: 'penanda tujuan kegiatan', vocabId: 'tk04' },
  ],
  translation: '行きます (pergi) · 来ます (datang) · 帰ります (pulang) · に (tujuan kegiatan).',
  explanation: 'Ketiga kata kerja arah ini dapat dipakai dalam pola kegiatan-に.',
  topic: 'tujuan_match',
}));
push(match({
  pairs: [
    { jp: 'スーパーへ行きます', id: 'pergi ke supermarket', vocabId: 'ts01' },
    { jp: 'スーパーへ買い物に行きます', id: 'pergi ke supermarket untuk berbelanja', vocabId: 'ts02' },
    { jp: '日本へ来ました', id: 'datang ke Jepang', vocabId: 'ts03' },
    { jp: '国へ帰ります', id: 'pulang ke negara', vocabId: 'ts04' },
  ],
  translation: 'Bandingkan tujuan tempat dan tujuan kegiatan, serta 来ます／帰ります.',
  explanation: 'Tujuan tempat: へ + tempat. Tujuan kegiatan: ます-stem + に. Keduanya bisa muncul bersama: スーパーへ 買い物に 行きます.',
  topic: 'tujuan_match',
}));
push(match({
  pairs: [
    { jp: '何をしに行きますか。', id: 'pergi untuk melakukan apa?', vocabId: 'tw01' },
    { jp: 'だれに会いに行きますか。', id: 'pergi untuk bertemu siapa?', vocabId: 'tw02' },
    { jp: '国へ帰ります', id: 'pulang ke negara', vocabId: 'tw03' },
    { jp: '友達を迎えに行きます', id: 'pergi menjemput teman', vocabId: 'tw04' },
  ],
  translation: 'Pertanyaan dan jawaban seputar tujuan kegiatan.',
  explanation: '何をしに menanyakan kegiatan; だれに menanyakan orang; objek kegiatan tetap memakai を.',
  topic: 'tujuan_match',
}));

/* Kasual: 明日、日本へ行く？ / 買い物に行く — memakai bentuk kamus */
const CASUAL = [
  { q: 'あした、どこへ行く？', a: [noun('suupaa'), P.e, G.st('kaimonoshimasu'), T('に'), G.dv('ikimasu')], aMean: 'Ke supermarket untuk berbelanja.' },
  { q: 'あした、どこへ行く？', a: [noun('umi'), P.e, G.st('oyogimasu'), T('に'), G.dv('ikimasu')], aMean: 'Ke laut untuk berenang.' },
  { q: 'ひまなとき、何をする？', a: [noun('toshokan'), P.e, G.st('benkyoushimasu'), T('に'), G.dv('ikimasu')], aMean: 'Ke perpustakaan untuk belajar.' },
  { q: '国へ帰る？', a: [T('うん、'), noun('kazoku'), T('に'), G.st('aimasu'), T('に')], aMean: 'Iya, untuk bertemu keluarga.' },
  { q: 'きょう、どこか行く？', a: [noun('depaato'), P.e, G.st('kaimonoshimasu'), T('に'), G.dv('ikimasu')], aMean: 'Ke department store untuk berbelanja.' },
  { q: 'あした、なにする？', a: [noun('puuru'), P.e, G.st('oyogimasu'), T('に'), G.dv('ikimasu')], aMean: 'Ke kolam renang untuk berenang.' },
  { q: 'しゅうまつ、なにする？', a: [noun('kawa'), P.e, noun('tsuri'), T('に'), G.dv('ikimasu')], aMean: 'Ke sungai untuk memancing.' },
  { q: 'あした、どこへ行く？', a: [noun('ginkou'), P.e, G.n === undefined ? T('') : noun('okane'), P.wo, G.st('dashimasu'), T('に'), G.dv('ikimasu')], aMean: 'Ke bank untuk mengambil uang.' },
  { q: 'あした、どこへ行く？', a: [noun('yuubinkyoku'), P.e, noun('tegami'), P.wo, G.st('okurimasu'), T('に'), G.dv('ikimasu')], aMean: 'Ke kantor pos untuk mengirim surat.' },
];
/* Pengecoh untuk soal kasual: kombinasi yang tidak mengulang jawaban benar. */
const CASUAL_WRONG = [
  [noun('suupaa'), P.wo, G.st('kaimonoshimasu'), T('に'), G.dv('ikimasu')],
  [noun('suupaa'), P.e, G.st('kaimonoshimasu'), G.dv('ikimasu')],
  [T('ううん、'), noun('gakkou'), P.e, G.st('benkyoushimasu'), T('に')],
  [noun('umi'), P.e, G.st('oyogimasu'), T('に'), G.mv('ikimasu', 'masu')],
];
for (const [i, row] of CASUAL.entries()) {
  const correct = asOpt(row.a);
  const wrongs = CASUAL_WRONG.filter((_, j) => j !== i % CASUAL_WRONG.length).slice(0, 3);
  const opts = [correct, ...wrongs.map(asOpt)];
  const seen = new Set();
  let k = 0;
  const uniqueOpts = [];
  for (const o of opts) {
    if (seen.has(o.jp)) continue;
    seen.add(o.jp); uniqueOpts.push(o);
  }
  while (uniqueOpts.length < 4) {
    const fill = asOpt([T('ちょっと'), G.dv('ikimasu'), T(''), T('か')].slice(0, 2).concat([{ jp: '。'.repeat(k + 1) }]));
    if (!seen.has(fill.jp)) { seen.add(fill.jp); uniqueOpts.push(fill); }
    k++;
  }
  push(dlg({
    a: [T(row.q)],
    bBefore: [], answer: correct, bAfter: [],
    options: uniqueOpts.slice(0, 4),
    translation: `「${row.q}」 — 「${row.aMean}」 (kasual)`,
    lineId: [row.q, row.aMean],
    explanation: 'Dalam percakapan kasual, 行きます menjadi 行く. Pola tujuan kegiatan ます-stem + に tetap sama.',
    topic: 'tujuan_kasual',
    casual: true,
    meta: {},
  }));
}

module.exports = {
  band: 'tujuan',
  focus: 'Tujuan kegiatan: ～に行きます／来ます／帰ります (へ・を・に)',
  records: OUT,
};
