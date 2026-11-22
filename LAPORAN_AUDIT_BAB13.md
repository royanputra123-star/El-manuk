# Implementasi dan audit Bab 13

## Ringkasan

Bab 13 (Minna no Nihongo I) ditambahkan ke NihonGo! sebagai bab terbaru: 30 level × 15 soal = **450 soal**, kosakata **449 entri** (32 entri Bab 13 + 417 entri rujukan Bab 1–12), dan ringkasan tata bahasa bergaya ruby di halaman utama.

Website tetap statis HTML/CSS/JavaScript dengan global `window.*`, tanpa backend, database, API, build bundler, atau dependensi runtime baru. Bab 1–12 tidak diubah isinya.

## Pola yang dilatih

| Pola | Penjelasan | Contoh |
|---|---|---|
| A | N が ほしいです — keinginan memiliki benda | 車が欲しいです。 |
| B | ます-stem + たいです — keinginan melakukan | 日本へ行きたいです。 |
| C | 場所 へ (objek を) ます-stem に 行きます／来ます／帰ります — tujuan kegiatan | 図書館へ勉強しに行きます。 |
| D | いつか · だれか · なにか · どこか — kata tidak tentu | 何か飲みたいです。 |
| E | いかがですか／ませんか — menawarkan dan mengajak | 一緒に行きませんか。ぜひ。 |

Bentuk sopan (です／ます) menjadi fokus utama; bentuk kasual hanya pengenalan (30 soal = 6,7%).

## Pembagian level

| Level | Tier | Fokus | Soal |
|---|---|---|---:|
| 1–5 | Mudah | ～がほしいです: empat bentuk, tanya-jawab, いかがですか, ほしい vs たい | 75 |
| 6–10 | Mudah | ～たいです: empat bentuk, objek を, ませんか／ましょう | 75 |
| 11–15 | Sedang | Tujuan kegiatan へ…に, に来ます, に帰ります／に会います | 75 |
| 16–20 | Sedang | いつか dan だれか, だれも／だれか | 75 |
| 21–25 | Kalimat | なにか dan どこか, なにも／どこも, partikel yang boleh hilang | 75 |
| 26–30 | Campuran | Semua pola bercampur + percakapan kasual | 75 |
| **Total** | | | **450** |

Tiap level 15 soal dengan komposisi 4 dialog (`short_conversation`), 2 `match`, dan 9 soal slot yang dirotasi ke lima tipe lain (complete · choose_translation · translate · arrange · listening) sehingga urutan tipe tidak monoton.

## Arsitektur generator

Bab 13 **tidak** ditulis sebagai satu berkas data raksasa. Soal disusun dari token berstruktur agar konjugasi dan partikel selalu konsisten:

| Berkas | Peran |
|---|---|
| `tools/bab13_vocab.js` | 449 entri terkurasi `[id, jp, kana, arti, jenis, bab]` + `CLOCK_WORDS` |
| `tools/bab13_grammar.js` | Token `{jp,kana}`, helper `verbMasu/verbTai/verbDict/verbNai/verbStem/hoshii`, partikel `P`, ekspresi `EXPR`, `allowedSurfaces()`, `toKana()` |
| `tools/bab13_factory.js` | Validator `rec()`, `dlg()`, `match()`, `fill()`, `fullJp()`, `BLANK`, alamat slot `slotToken`/`slotNth` |
| `tools/bab13_render.js` | `renderSlot/renderDialogue/renderMatch` → objek soal yang dibaca `js/questions.js` |
| `tools/bab13_bank_hoshii.js` | 102 record (L1–5) |
| `tools/bab13_bank_tai.js` | 110 record (L6–10) |
| `tools/bab13_bank_tujuan.js` | 97 record (L11–15) |
| `tools/bab13_bank_itsuka.js` | 101 record (L16–20) |
| `tools/bab13_bank_nanika.js` | 84 record (L21–25) |
| `tools/bab13_bank_campuran.js` | 47 record kurasi manual (L26–30) |
| `tools/bab13_bank_campuran_extra.js` | 190 record dari matriks kombinasi (L26–30) |
| `tools/generate_bab13.js` | Perakit 30 level + validator bawaan |
| `tools/audit_bab13.js` | Audit independen berkas hasil |

Manfaat pendekatan token: `ます-stem` untuk pola tujuan dihitung, bukan diketik ulang; konjugasi たい／ほしい dihitung dari akar; bentuk kana diturunkan dari peta permukaan sehingga `reading` tidak pernah memuat kanji.

## Hasil audit otomatis

`node tools/generate_bab13.js` dan `node tools/audit_bab13.js` lulus tanpa temuan:

- 30 level; tiap level tepat 15 soal; 450 soal; semua id unik (`q_b13_1`…`q_b13_450`).
- **Nol kalimat duplikat** di seluruh bab (450 kalimat unik, dibandingkan setelah spasi dihapus).
- Tiap soal punya instruksi, terjemahan, pembahasan, topik, dan kana tanpa kanji.
- `complete`: tepat satu rongga, `prompt + jawaban = fullJp`, 4 opsi unik, kunci ada di opsi.
- `choose_translation`/`short_conversation`: 4 opsi unik, kunci ada di opsi.
- `arrange`/`translate`/`listening`: kumpulan tile dapat menyusun `fullJp`, `audioText = fullJp`.
- `match`: 4 pasangan, tidak ada duplikat Jepang maupun arti, setiap pasangan punya `vocabId`.
- Semua teks Jepang lolos whitelist kosakata Bab 1–13 + allowlist fungsional (1926 permukaan).
- Tipe soal: complete 67 · short_conversation 104 · arrange 68 · match 23 · choose_translation 64 · listening 61 · translate 63 (7 tipe terpakai).
- Topik: 50 topik, 17 di antaranya topik wajib yang diperiksa keberadaannya.
- Posisi jawaban benar seimbang: 59 / 59 / 59 / 58.
- Kasual 30 soal (6,7%), tersebar di 10 level (5, 9, 12, 13, 14, 19, 23, 24, 27, 28) — bukan menumpuk di akhir.
- Tier: mudah 10 · sedang 10 · kalimat 5 · campuran 5.
- Lint tata bahasa bawaan menolak pola mustahil: `ますです`, `ですです`, `たいですです`, `電話かけ` (を hilang), `を住み`, dan sejenisnya.
- `G.verbMasu(id,'tai')` sekarang **melempar galat** alih-alih diam-diam jatuh ke bentuk ます — kesalahan bentuk ketik langsung ketahuan saat build.

Audit memastikan konsistensi struktur, whitelist kosakata, dan kunci data; bukan pembuktian otomatis bahwa setiap kalimat sepenuhnya alami. Peninjauan pengajar tetap disarankan.

## Integrasi aplikasi

| Berkas | Perubahan |
|---|---|
| `index.html` | Tombol `#btn-chap-bab13` (aktif), blok `#bab13-material`, dua `<script>` data, judul/deskripsi halaman |
| `js/ui.js` | `CHAPTERS` + entri `bab13`, `DEFAULT_CHAPTER='bab13'`, `CHAPTER_LEVEL_DATA.bab13`, `chapterTotalLevels` 30, toggle material Bab 13 |
| `js/storage.js` | `CHAPTERS` + `bab13`, default `bab13`, `levelsDone`/`lastLevel` bab13, `maxLevels.bab13 = 30` |
| `js/app.js` | `DEFAULT_CHAPTER='bab13'`, `CHAPTER_LEVEL_DATA.bab13`, daftar tombol bab |
| `js/translation.js` | `VOCAB_BAB13_DATA` masuk leksikon; `sentenceOf()` memakai `fullJp` sebagai rujukan kalimat utuh |
| `js/questions.js` | Perbaikan umum (berlaku semua bab): `complete` menampilkan reveal saat salah; `choose_translation` menambah baris "Jawaban benar"; `match` hanya benar bila **semua** pasangan cocok tanpa kesalahan, membersihkan status `shake-wrong`, dan menampilkan daftar pasangan benar saat salah |

Progres pengguna lama aman: bab aktif, XP, skor, dan badge tidak dihapus; bab 13 hanya ditambahkan sebagai entri baru dengan progres kosong.

## Pengujian aplikasi

`tools/test_bab13_browser.js` (jsdom, tanpa dependensi runtime) lulus:

- Menjawab **seluruh 450 soal melalui kontrol UI aplikasi** pada 30 level: 450/450 dinilai benar, 30 layar hasil, 30 level tersimpan, XP 6000, **0 galat JavaScript**.
- Jalur jawaban salah per tipe (DOM baru tiap tipe agar tanpa state bocor): ketujuh tipe memberi umpan balik salah, reveal jawaban benar, dan pembahasan.
- Panel rincian terjemahan muncul untuk `short_conversation`, `arrange`, `translate`, `listening` (sesuai `DETAIL_TYPES` di `js/translation.js`); `complete`, `choose_translation`, dan `match` memakai kotak umpan balik — sama seperti bab sebelumnya.
- Navigasi bab: jumlah level 30 / 30 / 30 / 50 / 50 / 50 / 50 untuk Bab 13 / 12 / 11 / 10 / 9 / 8 / 7; ringkasan materi hanya tampil pada bab yang sesuai; Bab 12 level 1 tetap dapat dimainkan.
- `node tools/audit_bab10.js`, `audit_bab11.js`, `audit_bab12.js`: tetap lulus (tidak ada regresi).

### Determinisme

Regenerasi dijalankan dua kali dan menghasilkan berkas identik:

```
6232d2866ddf479f0109fc622785eb66fffd9195f2d1d6a25e5bf58ee9b70f9f  js/data/levels_bab13.js
e06170bd07f7cdfc70423e1d4807b783b26065670c08788a1eb6aec14332cb8a  js/data/vocab_bab13.js
```

### Menjalankan ulang

```sh
node tools/generate_bab13.js      # tulis js/data/levels_bab13.js + vocab_bab13.js
node tools/audit_bab13.js         # audit independen
node tools/audit_bab12.js         # regresi bab sebelumnya
find js tools -name '*.js' -exec node --check {} \;
python3 -m http.server 8000 --bind 0.0.0.0

# pengujian UI (dependensi hanya untuk tes, bukan runtime situs):
npm install --prefix /tmp/nihongo-test jsdom
NODE_PATH=/tmp/nihongo-test/node_modules node tools/test_bab13_browser.js
```

## Batasan dan tindak lanjut

- Gambar referensi tata bahasa tidak tersedia; hanya PDF kosakata. Materi mengikuti pola baku Bab 13 Minna no Nihongo I.
- いつか dan だれか tidak tercatat sebagai entri pada ekstraksi PDF Bab 13, tetapi dibentuk dari kosakata Bab 1–13 dan merupakan pola inti bab; dijelaskan sebagai allowlist fungsional di `tools/reference/README.md`.
- Audio memakai Web Speech API perangkat. Pengujian UI mematikan audio agar deterministik; kualitas pelafalan aktual perlu dicek di perangkat pengguna.
- Beberapa soal sengaja berbagi template (mis. subjek × objek × bentuk) untuk melatih konjugasi; pemeriksaan duplikat menguji teks lengkap, bukan menolak semua kalimat bertemplate serupa.
