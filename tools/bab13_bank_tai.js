#!/usr/bin/env node
/* ============================================================================
 * tools/bab13_bank_tai.js
 * Level 6–10 · Bunpou B: ～たいです dan perubahannya
 *
 * Cakupan: positif, negatif, lampau, negatif lampau · objek を／が ·
 * 何を／どこへ／だれに／いつ · たい vs ほしい · penawaran ませんか
 * (bukan たいですか) · sedikit bentuk kasual.
 * Catatan gramatikal: たい menyatakan keinginan pembicara, sehingga subjek
 * adalah わたし (atau pertanyaan langsung kepada lawan bicara).
 * ========================================================================== */
'use strict';

const G = require('./bab13_grammar');
const F = require('./bab13_factory');
const { T, noun, P, verbTai, verbMasu, hoshii, w, name } = G;
const { rec, dlg, match } = F;

const OUT = [];
const push = r => OUT.push(r);

const jpOf = toks => toks.map(t => (typeof t === 'string' ? t : t.jp)).join('');
const asOpt = toks => ({ jp: jpOf(toks), kana: toks.map(t => (typeof t === 'string' ? t : t.kana)).join('') });

const FORM_LABEL = {
  tai: 'sekarang positif', takunai: 'sekarang negatif',
  takatta: 'lampau positif', takunakatta: 'lampau negatif',
};
const FORM_RULE = {
  tai: 'ます tanpa ます + たいです = ingin melakukan (sekarang).',
  takunai: 'たい diperlakukan seperti kata sifat い: たくないです = tidak ingin melakukan.',
  takatta: 'たくない → たかった: たかったです = dulu ingin melakukan.',
  takunakatta: 'たくなかったです = dulu tidak ingin melakukan.',
};
const TAI_FORMS = ['tai', 'takunai', 'takatta', 'takunakatta'];
const formChoices = (verb, answerForm) => [answerForm, ...TAI_FORMS.filter(f => f !== answerForm)].map(f => verbTai(verb, f));

/* ==========================================================================
   1) DRILL BENTUK たい — 4 bentuk × kata kerja beragam
   ========================================================================== */
const DRILL = [
  { v: 'ikimasu', form: 'tai', obj: null, place: 'nihon', time: 'ima' },
  { v: 'ikimasu', form: 'takunai', obj: null, place: 'nihon', time: 'ima' },
  { v: 'tabemasu', form: 'tai', obj: 'osushi', place: null, time: 'ima' },
  { v: 'tabemasu', form: 'takatta', obj: 'tenpura', place: null, time: 'kinou' },
  { v: 'nomimasu', form: 'tai', obj: 'koohii', place: null, time: 'ima' },
  { v: 'nomimasu', form: 'takunakatta', obj: 'biiru', place: null, time: 'kinou' },
  { v: 'kaimasu', form: 'tai', obj: 'kamera', place: 'depaato', time: 'ima' },
  { v: 'kaimasu', form: 'takunai', obj: 'kaban', place: null, time: 'ima' },
  { v: 'mimasu', form: 'tai', obj: 'eiga', place: null, time: 'ima' },
  { v: 'mimasu', form: 'takatta', obj: 'eiga', place: null, time: 'kinou' },
  { v: 'kikimasu', form: 'tai', obj: 'ongaku', place: null, time: 'ima' },
  { v: 'kikimasu', form: 'takunakatta', obj: 'jazu', place: null, time: 'kinou' },
  { v: 'yomimasu', form: 'tai', obj: 'hon', place: null, time: 'ima' },
  { v: 'yomimasu', form: 'takunai', obj: 'shinbun', place: null, time: 'ima' },
  { v: 'kakimasu', form: 'tai', obj: 'tegami', place: null, time: 'ima' },
  { v: 'kakimasu', form: 'takatta', obj: 'tegami', place: null, time: 'senshuu' },
  { v: 'aimasu', form: 'tai', person: 'tomodachi', time: 'ima' },
  { v: 'aimasu', form: 'takunakatta', person: 'tomodachi', time: 'kinou' },
  { v: 'oyogimasu', form: 'tai', place: 'umi', time: 'ima' },
  { v: 'oyogimasu', form: 'takunai', place: 'puuru', time: 'ima' },
  { v: 'asobimasu', form: 'tai', person: 'tomodachi', time: 'ima' },
  { v: 'asobimasu', form: 'takatta', person: 'kodomo', time: 'ototoi' },
  { v: 'benkyoushimasu', form: 'tai', obj: 'nihongo', time: 'ima' },
  { v: 'benkyoushimasu', form: 'takunakatta', obj: 'nihongo', time: 'kinou' },
  { v: 'hatarakimasu', form: 'tai', place: 'nihon', time: 'ima' },
  { v: 'hatarakimasu', form: 'takunai', place: 'kaisha', time: 'ima' },
  { v: 'sanposhimasu', form: 'tai', place: 'kouen', time: 'ima' },
  { v: 'sanposhimasu', form: 'takatta', place: 'kouen', time: 'kesa' },
  { v: 'kaimonoshimasu', form: 'tai', place: 'depaato', time: 'ima' },
  { v: 'kaimonoshimasu', form: 'takunai', place: 'suupaa', time: 'ima' },
  { v: 'shokujishimasu', form: 'tai', place: 'resutoran', time: 'ima' },
  { v: 'shokujishimasu', form: 'takatta', place: 'resutoran', time: 'kinou' },
  { v: 'kaerimasu', form: 'tai', place: 'indoneshia', time: 'ima' },
  { v: 'kaerimasu', form: 'takunai', place: 'uchi', time: 'ima' },
  { v: 'torimasu', form: 'tai', obj: 'shashin', time: 'ima' },
  { v: 'torimasu', form: 'takunakatta', obj: 'shashin', time: 'kyonen' },
  { v: 'yasumimasu', form: 'tai', time: 'ima' },
  { v: 'yasumimasu', form: 'takatta', time: 'kinou' },
  { v: 'hairimasu', form: 'tai', place: 'puuru', time: 'ima' },
  { v: 'demasu', form: 'tai', place: 'heya', time: 'ima' },
];

for (const row of DRILL) {
  const t = [G.n(row.time), P.wa, T('わたし', 'わたし'), P.wa];
  let target;
  if (row.obj) {
    target = noun(row.obj);
    t.push(target, P.wo);
  } else if (row.person) {
    target = noun(row.person);
    t.push(target, P.ni);
  } else if (row.place) {
    target = noun(row.place);
    t.push(target, P.e);
  }
  t.push(verbTai(row.v, row.form));
  const isPast = row.form === 'takatta' || row.form === 'takunakatta';
  const isNeg = row.form === 'takunai' || row.form === 'takunakatta';
  const act = { ikimasu: 'pergi', tabemasu: 'makan', nomimasu: 'minum', kaimasu: 'membeli', mimasu: 'menonton', kikimasu: 'mendengarkan', yomimasu: 'membaca', kakimasu: 'menulis', aimasu: 'bertemu', oyogimasu: 'berenang', asobimasu: 'bermain', benkyoushimasu: 'belajar', hatarakimasu: 'bekerja', sanposhimasu: 'berjalan-jalan', kaimonoshimasu: 'berbelanja', shokujishimasu: 'makan di restoran', kaerimasu: 'pulang', torimasu: 'mengambil foto', yasumimasu: 'beristirahat', hairimasu: 'masuk', demasu: 'keluar' }[row.v];
  const objText = row.obj ? ' ' + w(row.obj).mean : row.person ? ' dengan ' + w(row.person).mean : row.place ? ' ke ' + w(row.place).mean : '';
  push(rec({
    tokens: t,
    slot: t.length - 1,
    choices: formChoices(row.v, row.form),
    translation: `${w(row.time).mean.charAt(0).toUpperCase() + w(row.time).mean.slice(1)} saya ${isNeg ? 'tidak ' : ''}ingin ${isPast ? 'dulu ' : ''}${act}${objText}.`,
    explanation: `Pola ～たいです: kata kerja bentuk ます tanpa ます + たい. ${FORM_RULE[row.form]} ` +
      `Penanda waktu 「${w(row.time).jp}」 mendukung bentuk ${isPast ? 'lampau' : 'sekarang'} (target: ${FORM_LABEL[row.form]}).`,
    topic: 'tai_bentuk',
    meta: { form: row.form, verb: row.v, time: row.time },
  }));
}

/* ==========================================================================
   2) OBJEK を dan が dengan たい
   ========================================================================== */
const OBJ_ROWS = [
  { obj: 'koohii', v: 'nomimasu', part: 'wo' },
  { obj: 'osushi', v: 'tabemasu', part: 'ga' },
  { obj: 'hon', v: 'yomimasu', part: 'wo' },
  { obj: 'eiga', v: 'mimasu', part: 'ga' },
  { obj: 'kamera', v: 'kaimasu', part: 'wo' },
  { obj: 'kutsu', v: 'kaimasu', part: 'ga' },
  { obj: 'tegami', v: 'kakimasu', part: 'wo' },
  { obj: 'ongaku', v: 'kikimasu', part: 'ga' },
  { obj: 'shashin', v: 'torimasu', part: 'wo' },
  { obj: 'jisho', v: 'kaimasu', part: 'ga' },
  { obj: 'mizu', v: 'nomimasu', part: 'wo' },
  { obj: 'niku', v: 'tabemasu', part: 'ga' },
];
for (const row of OBJ_ROWS) {
  const part = row.part === 'wo' ? P.wo : P.ga;
  const t = [T('わたしは'), noun(row.obj), part, verbTai(row.v, 'tai')];
  push(rec({
    tokens: t,
    slot: 2,
    choices: [part, part.jp === 'を' ? P.ga : P.wo, P.ni, P.e].map(x => T(x.jp)),
    translation: `Saya ingin ${({ nomimasu: 'minum', tabemasu: 'makan', yomimasu: 'membaca', mimasu: 'menonton', kaimasu: 'membeli', kakimasu: 'menulis', kikimasu: 'mendengarkan', torimasu: 'mengambil foto' })[row.v]} ${w(row.obj).mean}.`,
    explanation: 'Pada ～たいです, objek kata kerja dapat ditandai を (bentuk umum) atau が (menekankan objek). Keduanya benar: コーヒーを飲みたいです／コーヒーが飲みたいです. Yang salah adalah に atau へ untuk objek.',
    topic: 'tai_objek',
    meta: { obj: row.obj, verb: row.v, part: row.part },
  }));
}
/* Pemilihan kalimat: を vs が keduanya benar → uji lewat "pilih yang salah" */
for (const row of OBJ_ROWS.slice(0, 8)) {
  const good = [T('わたしは'), noun(row.obj), P.wo, verbTai(row.v, 'tai')];
  const goodGa = [T('わたしは'), noun(row.obj), P.ga, verbTai(row.v, 'tai')];
  const wrong = [T('わたしは'), noun(row.obj), P.ni, verbTai(row.v, 'tai')];
  const wrong2 = [T('わたしは'), noun(row.obj), P.e, verbTai(row.v, 'tai')];
  push(rec({
    tokens: good,
    slot: 2,
    choices: [P.wo, P.ni, P.e, P.ka === undefined ? P.de : P.de].map(x => T(x.jp)),
    translation: `Saya ingin ${({ nomimasu: 'minum', tabemasu: 'makan', yomimasu: 'membaca', mimasu: 'menonton', kaimasu: 'membeli', kakimasu: 'menulis', kikimasu: 'mendengarkan', torimasu: 'mengambil foto' })[row.v]} ${w(row.obj).mean}. (bentuk dengan を)`,
    explanation: 'Untuk objek langsung kata kerja transitif dipakai を: N を V-たいです. に menandai tujuan/waktu dan へ menandai arah tempat, jadi tidak tepat di sini. Varian が juga benar dan menekankan objeknya.',
    topic: 'tai_objek',
    meta: { obj: row.obj, verb: row.v, part: 'wo' },
  }));
  void goodGa; void wrong; void wrong2;
}

/* ==========================================================================
   3) KATA TANYA: 何を／どこへ／だれに／いつ
   ========================================================================== */
const WH = [
  { q: '何をしたいですか。', qMean: 'Apa yang ingin kamu lakukan?', a: [noun('tenisu'), P.wo, verbTai('shimasu', 'tai')], aMean: 'Saya ingin bermain tenis.', wh: 'nani', v: 'shimasu' },
  { q: '何を食べたいですか。', qMean: 'Apa yang ingin kamu makan?', a: [noun('osushi'), P.wo, verbTai('tabemasu', 'tai')], aMean: 'Saya ingin makan sushi.', wh: 'nani', v: 'tabemasu' },
  { q: '何を飲みたいですか。', qMean: 'Apa yang ingin kamu minum?', a: [noun('koohii'), P.wo, verbTai('nomimasu', 'tai')], aMean: 'Saya ingin minum kopi.', wh: 'nani', v: 'nomimasu' },
  { q: '何を買いたいですか。', qMean: 'Apa yang ingin kamu beli?', a: [noun('kutsu'), P.wo, verbTai('kaimasu', 'tai')], aMean: 'Saya ingin membeli sepatu.', wh: 'nani', v: 'kaimasu' },
  { q: 'どこへ行きたいですか。', qMean: 'Ke mana kamu ingin pergi?', a: [noun('nihon'), P.e, verbTai('ikimasu', 'tai')], aMean: 'Saya ingin pergi ke Jepang.', wh: 'doko', v: 'ikimasu' },
  { q: 'どこへ行きたいですか。', qMean: 'Ke mana kamu ingin pergi?', a: [noun('umi'), P.e, verbTai('ikimasu', 'tai')], aMean: 'Saya ingin pergi ke laut.', wh: 'doko', v: 'ikimasu' },
  { q: 'どこで泳ぎたいですか。', qMean: 'Di mana kamu ingin berenang?', a: [noun('umi'), P.de, verbTai('oyogimasu', 'tai')], aMean: 'Saya ingin berenang di laut.', wh: 'doko', v: 'oyogimasu' },
  { q: 'だれに会いたいですか。', qMean: 'Siapa yang ingin kamu temui?', a: [noun('tomodachi'), P.ni, verbTai('aimasu', 'tai')], aMean: 'Saya ingin bertemu teman.', wh: 'dare', v: 'aimasu' },
  { q: 'だれに会いたいですか。', qMean: 'Siapa yang ingin kamu temui?', a: [noun('kazoku'), P.ni, verbTai('aimasu', 'tai')], aMean: 'Saya ingin bertemu keluarga.', wh: 'dare', v: 'aimasu' },
  { q: 'いつ日本へ行きたいですか。', qMean: 'Kapan kamu ingin pergi ke Jepang?', a: [G.n('rainen'), verbTai('ikimasu', 'tai')], aMean: 'Saya ingin pergi tahun depan.', wh: 'itsu', v: 'ikimasu' },
  { q: 'いつ友達に会いたいですか。', qMean: 'Kapan kamu ingin bertemu teman?', a: [G.n('ashita'), verbTai('aimasu', 'tai')], aMean: 'Saya ingin bertemu besok.', wh: 'itsu', v: 'aimasu' },
  { q: '何が食べたいですか。', qMean: 'Apa yang ingin kamu makan?', a: [noun('sakana'), P.ga, verbTai('tabemasu', 'tai')], aMean: 'Saya ingin makan ikan.', wh: 'nani_ga', v: 'tabemasu' },
];
for (const row of WH) {
  const correct = row.a;
  /* Tiga pengecoh yang selalu berbeda dari jawaban: kata kerja lain, tempat
   * lain, dan bentuk negatif. */
  const negVerb = verbTai(row.v, 'takunai');
  const altVerb = verbTai(row.v === 'tabemasu' ? 'nomimasu' : 'tabemasu', 'tai');
  const otherPlace = row.a.some(t => t.jp === '日本') ? noun('umi') : noun('nihon');
  const options = [
    correct,
    [altVerb].length ? [negVerb] : [negVerb],
    [otherPlace, P.e, verbTai('ikimasu', 'tai')],
    [G.n('kinou'), verbTai(row.v, 'takatta')],
  ];
  push(dlg({
    a: [T(row.q)],
    bBefore: [], answer: asOpt(correct), bAfter: [],
    options: options.map(asOpt),
    translation: `「${row.qMean}」 — 「${row.aMean}」`,
    lineId: [row.qMean, row.aMean],
    explanation: 'Kata tanya pada たい memakai partikel sesuai perannya: 何を (objek), どこへ (arah), どこで (tempat kegiatan), だれに (orang), いつ (waktu, tanpa partikel). 何が juga dipakai untuk menekankan objek.',
    topic: 'tai_tanya',
    meta: { wh: row.wh },
  }));
}

/* ==========================================================================
   4) PENAWARAN: ～ませんか (bukan ～たいですか)
   ========================================================================== */
const INVITE = [
  { phrase: [noun('juusu'), P.wo, verbMasu('nomimasu', 'masen'), P.ka], mean: 'Mau minum jus?', literal: 'Tidak mau minum jus?' },
  { phrase: [noun('koohii'), P.wo, verbMasu('nomimasu', 'masen'), P.ka], mean: 'Mau minum kopi?', literal: 'Tidak mau minum kopi?' },
  { phrase: [noun('eiga'), P.wo, verbMasu('mimasu', 'masen'), P.ka], mean: 'Mau menonton film?', literal: 'Tidak mau menonton film?' },
  { phrase: [noun('tenisu'), P.wo, verbMasu('shimasu', 'masen'), P.ka], mean: 'Mau bermain tenis?', literal: 'Tidak mau bermain tenis?' },
  { phrase: [noun('resutoran'), P.e, verbMasu('ikimasu', 'masen'), P.ka], mean: 'Mau pergi ke restoran?', literal: 'Tidak mau pergi ke restoran?' },
  { phrase: [noun('kouen'), P.e, verbMasu('sanposhimasu', 'masen'), P.ka], mean: 'Mau jalan-jalan ke taman?', literal: 'Tidak mau jalan-jalan ke taman?' },
  { phrase: [noun('isshoni'), noun('osushi'), P.wo, verbMasu('tabemasu', 'masen'), P.ka], mean: 'Mau makan sushi bersama?', literal: 'Tidak mau makan sushi bersama?' },
  { phrase: [noun('puuru'), P.e, verbMasu('ikimasu', 'masen'), P.ka], mean: 'Mau pergi ke kolam renang?', literal: 'Tidak mau pergi ke kolam renang?' },
];
for (const row of INVITE) {
  const correct = asOpt(row.phrase);
  /* ganti ませんか → たいですか (bentuk yang tidak tepat untuk menawarkan) */
  const bad1 = asOpt(row.phrase.slice(0, -2).concat([{ jp: 'たいですか', kana: 'たいですか' }]));
  /* ganti ません → ましょう (ajakan bersama, bukan pertanyaan) */
  const bad2 = asOpt(row.phrase.slice(0, -2).concat([{ jp: 'ましょうか', kana: 'ましょうか' }]));
  const bad3 = asOpt(row.phrase.slice(0, -1).concat([{ jp: 'ましょう', kana: 'ましょう' }]));
  push(dlg({
    a: [T('いっしょに')],
    bBefore: [], answer: correct, bAfter: [],
    options: [correct, bad1, bad2, bad3],
    translation: `「${row.mean}」 (ungkapan mengajak)`,
    lineId: ['Ajakan kepada lawan bicara.', row.mean],
    explanation: 'Mengajak/menawarkan kegiatan memakai ～ませんか: ジュースを飲みませんか。 Bentuk ～たいですか menanyakan keinginan pribadi orang lain sehingga kurang sopan untuk mengajak. Jawaban sopan: ええ、いいですね／すみません、ちょっと…',
    topic: 'tai_tawaran',
    meta: {},
  }));
}
/* Jawaban ajakan */
const INVITE_REPLY = [
  { ok: true, text: 'ええ、いいですね。', mean: 'Ya, boleh juga.' },
  { ok: false, text: 'すみません、今日は用事があります。', mean: 'Maaf, hari ini saya ada urusan.' },
  { ok: true, text: 'ええ、ぜひ。', mean: 'Ya, tentu.' },
  { ok: false, text: 'すみません、ちょっと…。', mean: 'Maaf, agak repot…' },
];
for (const row of INVITE_REPLY) {
  const c = [T(row.text)];
  const w1 = [T(row.ok ? 'すみません、ちょっと…。' : 'ええ、いいですね。')];
  const w2 = [T('ジュースを飲みたいですか。')];
  const w3 = [T('ジュースがほしいですか。')];
  push(dlg({
    a: [T('ジュースを飲みませんか。')],
    bBefore: [], answer: asOpt(c), bAfter: [],
    options: [asOpt(c), asOpt(w1), asOpt(w2), asOpt(w3)],
    translation: `「Mau minum jus?」 — 「${row.mean}」`,
    lineId: ['Mau minum jus?', row.mean],
    explanation: 'Ajakan ～ませんか dijawab dengan ええ、いいですね／ぜひ (menerima) atau すみません、ちょっと… (menolak halus). Jangan menjawab dengan たいですか atau ほしいですか karena itu pertanyaan, bukan jawaban.',
    topic: 'tai_tawaran',
    meta: {},
  }));
}

/* ==========================================================================
   5) たい vs ほしい
   ========================================================================== */
const VERSUS = [
  { kind: 'tai', v: 'kaimasu', obj: 'kuruma' },
  { kind: 'hoshi', obj: 'kuruma' },
  { kind: 'tai', v: 'tabemasu', obj: 'sakana' },
  { kind: 'hoshi', obj: 'kamera' },
  { kind: 'tai', v: 'yomimasu', obj: 'hon' },
  { kind: 'hoshi', obj: 'tokei' },
  { kind: 'tai', v: 'nomimasu', obj: 'ocha' },
  { kind: 'hoshi', obj: 'kutsu' },
];
for (const row of VERSUS) {
  const isTai = row.kind === 'tai';
  const t = isTai
    ? [T('わたしは'), noun(row.obj), P.wo, verbTai(row.v, 'tai')]
    : [T('わたしは'), noun(row.obj), P.ga, hoshii('pos')];
  const other = isTai
    ? [T('わたしは'), noun(row.obj), P.ga, hoshii('pos')]
    : [T('わたしは'), noun(row.obj), P.wo, verbTai('kaimasu', 'tai')];
  const bad = isTai
    ? [T('わたしは'), noun(row.obj), P.ga, T('買いたいです', 'かいたいです'), P.wo]
    : [T('わたしは'), noun(row.obj), P.wo, hoshii('pos')];
  push(rec({
    tokens: t,
    slot: t.length - 1,
    choices: [t[t.length - 1], other[other.length - 1], T('ほしくないです', 'ほしくないです'), T('ほしかったです', 'ほしかったです')],
    translation: isTai
      ? 'Saya ingin membeli ' + w(row.obj).mean + ' (kegiatan).'
      : 'Saya ingin memiliki ' + w(row.obj).mean + ' (benda).',
    explanation: isTai
      ? 'Ingin melakukan kegiatan: kata kerja ます tanpa ます + たいです → 買いたいです. Objeknya memakai を.'
      : 'Ingin memiliki benda: N が ほしいです. ほしい tidak bisa digabung dengan kata kerja.',
    topic: 'tai_beda_hoshi',
    meta: { kind: row.kind, obj: row.obj },
  }));
  void bad;
}

/* ==========================================================================
   6) KALIMAT MAJEMUK: alasan + たい
   ========================================================================== */
const REASON = [
  { reason: [T('のどが渇きましたから、', 'のどがかわきましたから、')], act: [noun('mizu'), P.wo, verbTai('nomimasu', 'tai')], mean: 'Karena haus, saya ingin minum air.', reasonMean: 'haus' },
  { reason: [T('おなかがすきましたから、', 'おなかがすきましたから、')], act: [T('何か'), P.wo, verbTai('tabemasu', 'tai')], mean: 'Karena lapar, saya ingin makan sesuatu.', reasonMean: 'lapar' },
  { reason: [T('疲れましたから、', 'つかれましたから、')], act: [G.n('uchi'), P.e, verbTai('kaerimasu', 'tai')], mean: 'Karena lelah, saya ingin pulang ke rumah.', reasonMean: 'lelah' },
  { reason: [T('暇ですから、', 'ひまですから、')], act: [noun('kouen'), P.e, verbTai('sanposhimasu', 'tai')], mean: 'Karena senggang, saya ingin jalan-jalan ke taman.', reasonMean: 'senggang' },
  { reason: [T('日本語を勉強しますから、', 'にほんごをべんきょうしますから、')], act: [noun('jisho'), P.wo, verbTai('kaimasu', 'tai')], mean: 'Karena belajar bahasa Jepang, saya ingin membeli kamus.', reasonMean: 'belajar bahasa Jepang' },
  { reason: [T('雨ですから、', 'あめですから、')], act: [G.n('uchi'), P.de, verbTai('yasumimasu', 'tai')], mean: 'Karena hujan, saya ingin beristirahat di rumah.', reasonMean: 'hujan' },
];
for (const row of REASON) {
  const t = [...row.reason, ...row.act];
  push(rec({
    tokens: t,
    slot: t.length - 1,
    choices: formChoices('nomimasu', 'tai').map(x => x.jp).includes(t[t.length - 1].jp)
      ? ['tai', 'takunai', 'takatta', 'takunakatta'].map(f => verbTai('nomimasu', f))
      : [t[t.length - 1], hoshii('pos'), verbMasu('nomimasu', 'masu'), verbTai('nomimasu', 'takunai')],
    translation: row.mean,
    explanation: 'Alasan dengan から mendahului kalimat keinginan. Kata kerja tetap memakai bentuk ～たいです sesuai waktu; から menyatakan sebab.',
    topic: 'tai_kalimat',
    meta: {},
  }));
  void row.reasonMean;
}

/* ==========================================================================
   7) KASUAL: 何が食べたい？ / どこへ行きたい？ / 行きたい
   ========================================================================== */
const CASUAL = [
  { q: '何が食べたい？', a: [noun('osushi'), P.ga, verbTai('tabemasu', 'taiPlain')], aMean: 'Aku mau sushi.' },
  { q: '何が飲みたい？', a: [noun('koohii'), P.ga, verbTai('nomimasu', 'taiPlain')], aMean: 'Aku mau kopi.' },
  { q: 'どこへ行きたい？', a: [noun('nihon'), P.e, verbTai('ikimasu', 'taiPlain')], aMean: 'Aku mau ke Jepang.' },
  { q: 'だれに会いたい？', a: [noun('tomodachi'), P.ni, verbTai('aimasu', 'taiPlain')], aMean: 'Aku mau bertemu teman.' },
  { q: '映画を見たい？', a: [T('うん、'), verbTai('mimasu', 'taiPlain')], aMean: 'Iya, mau.' },
  { q: '映画を見たい？', a: [T('ううん、'), verbTai('mimasu', 'takunaiPlain')], aMean: 'Tidak, tidak mau.' },
  { q: '昨日、何を食べたかった？', a: [noun('tenpura'), P.wo, verbTai('tabemasu', 'takattaPlain')], aMean: 'Aku dulu mau tempura.' },
];
for (const row of CASUAL) {
  const correct = asOpt(row.a);
  const altVerb = row.a.some(t => t.jp.includes('食べ')) ? 'nomimasu' : 'tabemasu';
  const w1 = asOpt([verbTai(altVerb, 'taiPlain')]);
  const w2 = asOpt([verbTai('ikimasu', 'takattaPlain')]);
  const w3 = asOpt([correct.jp + 'です']);
  push(dlg({
    a: [T(row.q)],
    bBefore: [], answer: correct, bAfter: [],
    options: [correct, w1, w2, w3],
    translation: `「${row.q}」 — 「${row.aMean}」 (kasual)`,
    lineId: [row.q, row.aMean],
    explanation: 'Bentuk kasual たい tidak memakai です: 行きたい、食べたい. Lampau kasual: 食べたかった. Pertanyaan kasual memakai intonasi naik. Fokus utama tetap sopan です／ます.',
    topic: 'tai_kasual',
    casual: true,
    meta: {},
  }));
}

/* ==========================================================================
   8) MATCH
   ========================================================================== */
push(match({
  pairs: [
    { jp: '食べたいです', id: 'ingin makan', vocabId: 't01' },
    { jp: '食べたくないです', id: 'tidak ingin makan', vocabId: 't02' },
    { jp: '食べたかったです', id: 'dulu ingin makan', vocabId: 't03' },
    { jp: '食べたくなかったです', id: 'dulu tidak ingin makan', vocabId: 't04' },
  ],
  translation: 'Perubahan たい sama seperti kata sifat い: たい → たくない → たかった → たくなかった.',
  explanation: 'たい melekat pada bentuk ます tanpa ます, lalu berubah seperti kata sifat い.',
  topic: 'tai_match',
}));
push(match({
  pairs: [
    { jp: '何を買いたいですか。', id: 'Apa yang ingin kamu beli?', vocabId: 't11' },
    { jp: 'どこへ行きたいですか。', id: 'Ke mana ingin pergi?', vocabId: 't12' },
    { jp: 'だれに会いたいですか。', id: 'Siapa yang ingin ditemui?', vocabId: 't13' },
    { jp: 'いつ行きたいですか。', id: 'Kapan ingin pergi?', vocabId: 't14' },
  ],
  translation: 'Empat kata tanya dengan たい: 何を · どこへ · だれに · いつ.',
  explanation: 'Partikel mengikuti peran kata tanya: objek を, arah へ, orang に, waktu tanpa partikel.',
  topic: 'tai_match',
}));
push(match({
  pairs: [
    { jp: 'ジュースを飲みませんか。', id: 'Mau minum jus?', vocabId: 't21' },
    { jp: 'ええ、いいですね。', id: 'Ya, boleh juga.', vocabId: 't22' },
    { jp: 'すみません、ちょっと…', id: 'Maaf, agak repot…', vocabId: 't23' },
    { jp: 'ぜひ。', id: 'Tentu (menerima).', vocabId: 't24' },
  ],
  translation: 'Ungkapan mengajak dengan ませんか beserta jawaban menerima dan menolak halus.',
  explanation: 'Mengajak memakai ～ませんか, bukan ～たいですか. Jawaban menerima: ええ、いいですね／ぜひ. Menolak halus: すみません、ちょっと…',
  topic: 'tai_match',
}));
push(match({
  pairs: [
    { jp: '車がほしいです', id: 'ingin memiliki mobil', vocabId: 't31' },
    { jp: '車を買いたいです', id: 'ingin membeli mobil', vocabId: 't32' },
    { jp: 'を', id: 'partikel objek kata kerja', vocabId: 't33' },
    { jp: 'が', id: 'partikel objek ほしい', vocabId: 't34' },
  ],
  translation: 'ほしい untuk benda (N が ほしい), たい untuk kegiatan (N を V-たい).',
  explanation: 'Perbedaan kunci: が dipakai dengan ほしい, sedangkan kata kerja transitif memakai を.',
  topic: 'tai_match',
}));
push(match({
  pairs: [
    { jp: 'たいです', id: 'ingin melakukan', vocabId: 't41' },
    { jp: 'たくないです', id: 'tidak ingin melakukan', vocabId: 't42' },
    { jp: 'ませんか', id: 'mengajak lawan bicara', vocabId: 't43' },
    { jp: 'ましょう', id: 'mari kita lakukan', vocabId: 't44' },
  ],
  translation: 'たいです (keinginan), たくないです (negatif), ませんか (ajakan), ましょう (ajakan bersama).',
  explanation: '～ませんか menawarkan/mengajak; ～ましょう menyatakan "mari kita lakukan" setelah kesepakatan.',
  topic: 'tai_match',
}));

module.exports = {
  band: 'tai',
  focus: '～たいです (positif · negatif · lampau · negatif lampau · を／が · kata tanya · ませんか)',
  records: OUT,
};
