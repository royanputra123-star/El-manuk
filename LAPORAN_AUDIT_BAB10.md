# Laporan Audit & Perbaikan Bank Soal Bab 10

**Tanggal:** 11 Oktober 2026 · **Cakupan:** Minna no Nihongo I, Bab 1–10 (tanpa Bab 11+)
**Berkas utama:** `js/data/levels_bab10.js` (1.000 soal), `js/data/vocab_bab10.js` (123 kosakata),
`tools/generate_bab10.js` (generator), `tools/audit_bab10.js` (pemeriksa otomatis)

---

## 1. Ringkasan

- Bank soal Bab 10 **ditulis ulang seluruhnya** lewat generator yang diperbaiki; struktur aplikasi
  (50 level × 20 soal, `id` `q_b10_1`…`q_b10_1000`, tipe soal, format jawaban) tidak berubah.
- **Seluruh pola Bab 10 kini tercakup**, termasuk pola yang sebelumnya kosong sama sekali
  (何もありません / だれもいません = 0 → 69 soal; ～や～など = 10 → 47 soal; ～と / 間に = 10 → 99 soal).
- Kosakata dibatasi **Bab 1–10** saja: 14 kata di luar cakupan (台所, 電柱, 鳥, ソファ, カレンダー,
  ホテル, お菓子, 鍵, 家, 自転車, どの, ちょっと, ええと, どういたしまして) dihapus,
  29 kata Bab 1–10 yang belum ada ditambahkan.
- **Audit otomatis: LULUS (0 temuan)** pada bank baru.
  Audit yang sama dijalankan pada bank lama: **GAGAL — 21 masalah keras + 206 catatan**
  (9 soal kembar, 12 terjemahan match bermasalah, 296 soal memuat kata di luar cakupan).

---

## 2. Jumlah soal & kosakata: sebelum vs sesudah

| Metrik | Sebelum | Sesudah |
| --- | --- | --- |
| Jumlah level | 50 | 50 |
| Jumlah soal | 1.000 | 1.000 |
| Soal per level | 20 | 20 |
| Kosakata (`vocab_bab10.js`) | 108 entri | 123 entri |
| Bank kalimat sumber | ±2.319 kalimat | 2.621 kalimat |
| Soal dengan terjemahan Indonesia | 1.000/1.000 | 1.000/1.000 |
| Soal dengan reading (kana) + romaji | 890/890 | 900/900 |
| Kalimat soal unik (tanpa soal jodohkan) | 757 dari 890 (85,1%) | 787 dari 900 (87,4%) |
| Soal kembar (isi identik, audit) | **9** | **0** |
| Catatan/temuan audit | 21 keras + 206 catatan | 0 |

---

## 3. Apa yang terjadi pada soal lama

Karena bank lama punya banyak masalah struktural (kosakata di luar bab, kalimat janggal, opsi kacau),
bank ini **diregenerasi** dari bank kalimat yang sudah dikurasi, bukan ditambal satu per satu.

| Kategori | Jumlah | Keterangan |
| --- | --- | --- |
| Dipertahankan identik (isi sama) | 32 soal (3,2%) | soal lama yang sudah benar dan wajar ikut muncul kembali |
| Diganti / ditulis ulang | 968 soal (96,8%) | termasuk semua soal dengan kosakata di luar cakupan |
| Ditambah (pola baru) | 69 soal 何も/だれも, 47 soal や〜など, 99 soal と/間に | pola yang sebelumnya 0 atau hampir 0 |
| Kosakata dihapus | 14 entri | di luar Bab 1–10 atau diganti (家 → うち) |
| Kosakata ditambah | 29 entri | ベッド, ドア, スイッチ, テーブル, 窓, 電池, ポスト, 木, 物, フィルム, 手帳, カード, ノート, 雑誌, 新聞, 鉛筆, 消しゴム, カメラ, コーヒー, パン, お金, 家族, 医者, 銀行員, 留学生, 空港, 食堂, 会議室, 象, パンダ, dst. |

296 soal lama (29,6%) memuat minimal satu kata di luar cakupan Bab 1–10, mis.
ソファ (38 soal), 台所 (41), ホテル (32), お菓子 (30), 鍵 (28), 電柱 (25), 鳥 (25), カレンダー (22),
自転車 (17), 建物 (10), どういたしまして (13).

---

## 4. Sebaran tipe soal (target vs hasil)

| Tipe | Target | Hasil | Selisih |
| --- | --- | --- | --- |
| `complete` (lengkapi rumpang) | 180 | 181 | +1 |
| `arrange` (susun kata) | 170 | 171 | +1 |
| `short_conversation` (dialog) | 160 | 151 | −9 |
| `listening` | 130 | 134 | +4 |
| `translate` (terjemahkan ke Jepang) | 130 | 132 | +2 |
| `choose_translation` | 130 | 131 | +1 |
| `match` (jodohkan) | 100 | 100 | 0 |

Setiap level memakai **6–7 tipe berbeda**, dan tidak ada satu tipe pun yang muncul lebih dari **5 soal**
dalam satu level.

---

## 5. Sebaran bunpou Bab 10 (hasil audit atas 1.000 soal)

| Kode | Pola | Jumlah | Persen |
| --- | --- | --- | --- |
| A1 | N に N が あります | 302 | 30,2% |
| A2 | N に N が います | 178 | 17,8% |
| B1 | N は 場所 に あります / います | 208 | 20,8% |
| C1 | ～や ～など | 47 | 4,7% |
| C2 | ～と (daftar lengkap) / ～と～の 間に | 99 | 9,9% |
| D1 | Posisi 上/下/前/後ろ/中/外/右/左/隣/近く | 344 | 34,4% |
| D2 | Posisi 間 (N1 と N2 の 間に) | 65 | 6,5% |
| E1 | Pertanyaan どこ / 何が / だれが | 239 | 23,9% |
| E2 | Negatif ありません / いません | 156 | 15,6% |
| E3 | 何も ありません / だれも いません | 69 | 6,9% |

Pola utama tiap soal (eksklusif, total 100%):

| Pola utama | Jumlah | Persen |
| --- | --- | --- |
| `aru_place` (N に N が あります) | 129 | 12,9% |
| `pos_aru` (posisi + あります) | 120 | 12,0% |
| `q_where` (どこ) | 112 | 11,2% |
| `match` (jodohkan kosakata) | 100 | 10,0% |
| `iru_place` (N に N が います) | 74 | 7,4% |
| `wa_place` (N は N に) | 71 | 7,1% |
| `nanimo` (何も/だれも) | 69 | 6,9% |
| `aida` (間に) | 65 | 6,5% |
| `pos_desu` (N は N1 の N2 です) | 50 | 5,0% |
| `ya_nado` (や/など/と) | 47 | 4,7% |
| `q_dare` (だれが) | 47 | 4,7% |
| `neg` (bentuk negatif) | 46 | 4,6% |
| `pos_iru` (posisi + います) | 35 | 3,5% |
| `q_nani` (何が) | 35 | 3,5% |

---

## 6. Cakupan pola wajib vs yang masih tipis

**Tercakup (semua kelompok A–E ada):**

| Kelompok | Status | Bukti (jumlah soal) |
| --- | --- | --- |
| A. あります / います / N は 場所 に | ✅ | A1 = 302, A2 = 178, B1 = 208 |
| B. partikel に vs が | ✅ | 127 soal `complete` berisi partikel に/が/の/や/と/も/など + 54 soal kata posisi (上/下/中/外/右/左/隣/近く/前) |
| C. や + など vs と | ✅ | C1 = 47, C2 = 99 |
| D. 11 kata posisi (N1 の N2) | ✅ | D1 = 344, D2 = 65 |
| E. 何が / だれが / どこに + 何も・だれも | ✅ | E1 = 239, E2 = 156, E3 = 69 (dulu 0) |

**Cakupan 11 kata posisi** (muncul pada kalimat soal):
上=44 · 下=21 · 前=48 · 後ろ=15 · 右=24 · 左=16 · 中=83 · 外=14 · 隣=32 · 近く=47 · 間=65

**Masih paling tipis:** 外 (14 soal), 後ろ (15), 左 (16). Semua sudah muncul dan benar,
tetapi bila ingin bobot lebih merata, tinggal menambah kerangka posisi di generator
(`POS_FRAME_DATA`) pada iterasi berikutnya.

---

## 7. Contoh soal yang diperbaiki (dan alasannya)

| Soal lama | Masalah | Soal baru |
| --- | --- | --- |
| 「国に箱があります。」 (`q_b10_7`, prompt “Di negara ada kotak.”) | benda ditaruh di “negara”, tidak masuk akal | 「部屋に 机が ありません」 (`q_b10_268`), 「部屋に 何が ありますか。→ 机が あります。」 (`q_b10_483`) |
| 「箱にだれがいますか」 (`q_b10_404`) | orang di dalam kotak → tidak masuk akal | 「教室に だれが いますか。→ だれも いません。」 (`q_b10_240`) |
| 「机の外にいます。」 (`q_b10_548`) | 机 tidak punya “luar” | 「箱の 中に 何が ありますか。」 / 「いすの 下に います。」 (`q_b10_264`) |
| 「台所に先生がいます。」 (`q_b10_52`) | 台所 di luar Bab 1–10 | 「教室に 先生が います」 (`q_b10_527`), 「教室に 何が ありますか。→ 机や いすなどが あります。」 (`q_b10_351`) |
| 「鳥は 店に います」 (`q_b10_125`) | 鳥 di luar cakupan | 「公園に 犬と 猫が います」 (`q_b10_849`) |
| 「ホテルにパソコンがあります」 (`q_b10_120`) | ホテル di luar cakupan | 「寮に テレビが あります」 (`q_b10_77`) |
| 「お菓子は台所にあります」 (`q_b10_124`) | お菓子 + 台所 di luar cakupan | 「花は スーパーに あります」 (`q_b10_22`) |
| 「電柱に何がありますか」 (`q_b10_438`) | 電柱 di luar cakupan | 「部屋に 何が ありますか」 (`q_b10_214`), 「車の 中に 何が ありますか」 (`q_b10_225`) |
| 「水は国にいます / 水は電柱にあります」 (`q_b10_162`, opsi) | opsi mustahil semua | 「花はスーパーにあります / 花は喫茶店にあります / 花は大学にあります」 (`q_b10_22`) |
| 「はい、国が あります。」 (`q_b10_117`, opsi) | jawaban tidak nyambung dengan pertanyaan | 「はい、あります。 / 何も ありません。 / 何も いません。」 (`q_b10_305`) |
| 「国に家族がいません」 (pola negatif) | negatif 国 terasa janggal | pola negatif 国 diblokir di generator |
| 「猫は どこに いますか。→ ソファの 上に います。」 (`q_b10_47`) | ソファ di luar cakupan | 「猫は どこに いますか。→ いすの 下に います。」 (`q_b10_264`) |
| Match 「電柱=tiang listrik」, 「どの=yang mana」, 「ええと=anu」 | kata di luar cakupan | Match berganti tema: posisi, benda, tempat, makhluk hidup, bacaan kanji, pola, tanya-jawab, ungkapan (mis. 「木=pohon」, 「ベッド=tempat tidur」) |

Catatan: `id` pada kolom **Soal lama** mengacu ke bank lama (sebelum regenerasi) — id yang sama di
bank baru bisa berisi soal yang berbeda, karena seluruh bank dibangun ulang.

Perbaikan juga mencakup **opsi pengecoh**: setiap soal pilihan/`complete` punya tepat satu jawaban
yang benar-benar gramatikal (mis. 「いすが います」, 「テレビの 中に あります」 sebagai pengecoh),
dan kunci selalu ada di daftar opsi.

---

## 8. Kosakata yang perlu ditinjau

**Dihapus (14):** 台所, 電柱, 鳥, ソファ, カレンダー, ホテル, お菓子, 鍵, 家 (diganti うち), 自転車,
どの, ちょっと, ええと, どういたしまして — di luar Bab 1–10 atau bentuknya sudah punya padanan
yang lebih tepat di bab tersebut.

**Perlu ditinjau manusia (15 entri):** kata Bab 1–10 yang **tidak ada** dalam dataset pembanding
(MinnaNoDS, lessons 1–10) sehingga diverifikasi manual dari buku Minna no Nihongo:
トイレ (Bab 3), 国 (お国, Bab 3), 空港 (Bab 5), 留学生 (Bab 1), は/が/も (partikel Bab 1),
に/の (Bab 2), だれ (Bab 1), など (Bab 10), どうも すみません (Bab 10), すみません (Bab 2),
ありがとう ございます (Bab 2), そうですか (Bab 2).
Bila ada yang diragukan, cukup hapus dari `vocab_bab10.js` + generator lalu regenerasi.

Catatan: フィルム (Bab 10) dan パンダ/象 (Bab 10) dipakai secukupnya; keduanya ada di daftar bab.

---

## 9. Hasil validasi otomatis

### a. Generator (`node tools/generate_bab10.js`)

```
Total level        : 50
Total soal         : 1000 (target 1000)
Bank kalimat       : 2621
Soal tanpa terjemahan: 0
Kalimat bank salah あります/います: 0
OK: semua 123 kosakata terreferensi di field vocab.
OK: validasi generator lolos.
```

### b. Audit bank soal (`node tools/audit_bab10.js` → exit 0)

```
--- Ringkasan pemeriksaan otomatis ---
  soal diperiksa (id, tipe, properti wajib)      : 1000
  soal beropsi (jawaban ada di opsi, opsi unik)  : 463
  soal susun kata (token jawaban tersedia)       : 437
  soal rumpang (tepat 1 rumpang)                 : 181
  soal dialog (1 rumpang + dialogueId sinkron)   : 151
  soal jodohkan (pasangan unik, >= 4)            : 100
  soal listening (audioText = susunan jawaban)   : 134
  soal dengan reading (kana) & romaji            : 900 / 900
  soal dengan terjemahan Indonesia               : 1000

--- Duplikat & pengulangan ---
  soal kembar (isi identik)       : 0
  kalimat jawaban yang dipakai >1x: 58 kalimat (kelebihan 89 pemakaian)
  keluarga kalimat beda 1 kata    : 109

CATATAN / PERLU DITINJAU: tidak ada.
HASIL: LULUS
```

Yang diperiksa: sintaksis & struktur (`50 × 20`, `id` berurutan & unik), properti wajib tiap tipe
sesuai kontrak `js/questions.js`, jawaban ada di opsi, opsi/tile/pasangan unik, tepat satu rumpang,
kesesuaian あります/います, kewajaran posisi (上/下 dengan benda, 中/外 dengan wadah/ruang),
cakupan kosakata (seluruh teks Jepang didekomposisi ke daftar Bab 1–10),
terjemahan Indonesia (tanpa kanji, tanpa spasi ganda), duplikat & near-duplicate,
sebaran tipe soal, serta sebaran + cakupan 10 kelompok bunpou dan 11 kata posisi.

### c. Perbandingan audit: bank lama vs bank baru

| Temuan audit | Bank lama | Bank baru |
| --- | --- | --- |
| Hasil akhir | **GAGAL** (exit 1) | **LULUS** (exit 0) |
| Masalah keras | 21 | 0 |
| Soal kembar | 9 | 0 |
| Catatan (kosakata di luar cakupan, dsb.) | 206 | 0 |
| Teks di luar kosakata Bab 1–10 | ada (建物, 鍵, ホテル, 台所, 鳥, ソファ, カレンダー, 電柱, お菓子 …) | tidak ada |

---

## 10. Cara menjalankan ulang

```bash
node tools/generate_bab10.js   # tulis ulang js/data/vocab_bab10.js + js/data/levels_bab10.js
node tools/audit_bab10.js      # periksa hasilnya (exit 1 bila ada masalah)
python3 -m http.server 8080    # jalankan aplikasi di browser
```

Semua perintah di atas sudah dijalankan pada revisi ini; hasilnya seperti pada bagian 9.
