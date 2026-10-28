# NihonGo! — Belajar Bahasa Jepang (Minna no Nihongo Bab 11, 10, 9, 8 & Bab 7)

Website self-learning Bahasa Jepang bergaya Duolingo. Bab terbaru: **Minna no Nihongo I Bab 11**
(Comprehensible Input: counter ～つ / ～人 / ～枚 / ～台 / ～回 …, かかります, ～だけ, 全部で,
kosakata keluarga & kantor pos). Bab 10, 9, 8, dan 7 tetap dapat dimainkan.
Bab 11 berisi **30 Level × 15 Soal (450 soal)**; bab lain **50 Level × 20 Soal (1.000 soal per bab)**.

## Pembaruan Terbaru

### 1. Bab 11 (Comprehensible Input) — Bank Soal Baru (`js/data/levels_bab11.js` + `js/data/vocab_bab11.js`)

Generator: **`tools/generate_bab11.js`** → 30 level, 450 soal (`q_b11_1` … `q_b11_450`), 211 kosakata
(kana + romaji + asal bab). Pemeriksa terpisah: **`tools/audit_bab11.js`**. Laporan lengkap:
**`LAPORAN_AUDIT_BAB11.md`**.

**Tata bahasa (bunpou) yang dilatih** — 17 pola Bab 11

| Pola | Contoh |
| --- | --- |
| Menghitung benda ～つ (ひとつ … とお) | 会議室に テーブルが 七つ あります |
| Counter ～人 (ひとり・ふたり・～にん) | 教室に 学生が 五人 います |
| Counter ～台 / ～枚 / ～回 / ～個・～本・～番・～分・～日 | 部屋に テレビが 二台 あります / 切手が 五枚 あります |
| Counter durasi ～時間 / ～週間 / ～か月 / ～年 | 日本に 二年 います |
| いくつ / 何人 | りんごは いくつ ありますか |
| N を ～枚 と N を ～枚 ください | 切手を 五枚 と はがきを 二枚 ください |
| 全部で | 全部で 五百円 です |
| ～ぐらい / 何回 … ～ぐらい / どのぐらい | 一週間に 二回 ぐらい します / どのぐらい かかりますか |
| ～だけ | 三日 だけ やすみます |
| から ～まで … かかります | うちから 学校まで 一時間 かかります |
| Keluarga + jumlah ～が ～人 います | 兄が 二人 と 姉が 一人 います |

**Kosakata**: seluruh kosakata **Bab 1–11** dari Kotoba (tanpa Bab 12+), kana + romaji + asal bab.
41 kosakata wajib masuk semua — かかります, いくつ, ひとり, ふたり, ～にん, ～だい, ～まい, ～かい,
りんご, みかん, サンドイッチ, カレーライス, アイスクリーム, 切手, はがき, 封筒, 速達, 書留,
エアメール（航空便）, 船便, 両親, 兄弟, 姉妹, 兄, お兄さん, 姉, お姉さん, 弟, 弟さん, 妹, 妹さん,
外国, ～時間, ～週間 (ejaan lama ～習慣), ～か月, ～年, ～ぐらい, どのぐらい, 全部で, ～だけ —
masing-masing muncul di **≥ 3 soal** dengan rotasi merata antar level.

**Metode Comprehensible Input (CI)**

- Aturan **i+1**: tiap kalimat soal memperkenalkan maksimal 1 kata konten baru Bab 11
  (tebak dari konteks; angka + counter = satu unit pola).
- Konteks nyata (kantor pos, sekolah, keluarga, toko, perjalanan), variasi pola, tanpa
  duplikat & near-duplicate (variasi angka pada drill counter dan minimal pair
  あります/ありません diizinkan dengan tujuan pembelajaran yang jelas).
- **4 tier kesulitan**: 1–10 Mudah, 11–20 Sedang, 21–25 Kalimat, 26–30 Campuran
  (peta 30 level + legenda dinamis, tanpa hardcode 50/20).
- **7 tipe soal** existing dengan kuota largest-remainder per level
  (complete 81, arrange 77, short_conversation 72, choose_translation 59, listening 58,
  translate 58, match 45) — `js/questions.js` tidak berubah.

**Validasi**: `node tools/generate_bab11.js` (validasi bawaan, gagal = file tidak ditulis) dan
`node tools/audit_bab11.js` (struktur 30 × 15, id berurutan, properti per tipe, jawaban di opsi,
opsi/pasangan unik, tepat 1 rumpang, あります/います, kosakata Bab 1–11 saja, terjemahan ada,
duplikat/near-duplicate, sebaran tipe, cakupan 17 bunpou, rotasi 41 kosakata wajib, aturan i+1).
Hasil audit: **LULUS — 0 masalah** (lihat `LAPORAN_AUDIT_BAB11.md`).

### 2. Bab 10 — Bank Soal (`js/data/levels_bab10.js` + `js/data/vocab_bab10.js`)

Generator: **`tools/generate_bab10.js`** → 50 level, 1.000 soal (`q_b10_1` … `q_b10_1000`), 123 kosakata
(kana + romaji + asal bab). Pemeriksa terpisah: **`tools/audit_bab10.js`**.

**Tata bahasa (bunpou) yang dilatih**

| Pola | Contoh |
| --- | --- |
| N (tempat) に N (benda) が あります | 公園に 箱が あります |
| N (tempat) に N (orang/hewan) が います | 駅に 男の人が います |
| N (benda/orang/hewan) は N (tempat) に あります / います | 猫は 部屋に います |
| N1 の N2 (posisi) に N が あります / います | 机の 上に 本が あります |
| N1 と N2 の 間に N が あります / います | 郵便局と 銀行の 間に コンビニが あります |
| N1 や N2 (など) | 箱の 中に 鉛筆や 消しゴムなど あります |
| Kata tanya どこ / だれ / 何 (+ だれが / 何が) | 駅は どこに ありますか |

**Kosakata & kanji**: seluruh kosakata Bab 1–10 (tanpa Bab 11+) — あります, います, 11 kata posisi
(上, 下, 前, 後ろ, 右, 左, 中, 外, 隣, 近く, 間), 箱, 冷蔵庫, 棚, 窓, テーブル, ベッド, ドア, スイッチ,
電池, ポスト, 木, 物, フィルム, 公園, 喫茶店, 本屋, 乗り場, コンビニ, ビル, 駅, 銀行, 郵便局, 病院,
学校, 大学, 会社, 部屋, 教室, 事務所, 図書館, 庭, 寮, うち, 国, 空港, 犬, 猫, 象, パンダ, 魚, 男の人,
女の人, 男の子, 女の子, 先生, 学生, 会社員, 医者, 銀行員, 留学生, dst. (123 entri, lengkap dengan
kana + romaji + asal bab di `vocab_bab10.js`).

**Anti-monoton**

- **5 tier kesulitan**: 1–10 Mudah, 11–20 Sedang, 21–30 Kalimat, 31–40 Campuran, 41–50 Acak.
- **7 tipe soal** dipakai proporsional di *setiap* level (kuota largest-remainder, bukan acak murni):
  `arrange`, `translate`, `complete`, `match`, `short_conversation`, `choose_translation`, `listening`.
- Subjek, lokasi, dan kata posisi dirotasi: 40 kata benda + 21 makhluk hidup + 30 nama tempat,
  11 kata posisi, diambil dari bank 2.621 kalimat yang tervalidasi.
- **Filter kewajaran** supaya kalimat tidak janggal:
  - あります hanya untuk benda mati, います hanya untuk makhluk hidup (divalidasi untuk seluruh bank);
  - 上 / 下 hanya dengan acuan benda (机の上), 中 / 外 hanya dengan acuan wadah/ruang (箱の中, 教室の中);
  - benda dalam ruangan tidak dipasangkan dengan tempat luar ruangan (dan sebaliknya);
  - 山 / 木 tidak dipakai di tempat sempit (庭, 乗り場), 国 / 町 tidak dipakai sebagai acuan posisi;
  - kalimat negatif tidak memakai 国, 窓, dan ドア (「国に家族がいません」 dsb. terasa janggal).
- `match` punya 9 tema berputar (posisi, benda, tempat, makhluk hidup, bacaan kanji, pola, tanya-jawab,
  ungkapan, posisi & tempat) — termasuk "jodohkan kanji dengan cara bacanya".

**Validasi**: `node tools/audit_bab10.js` memeriksa struktur (50 × 20), id berurutan & unik, properti wajib
tiap tipe, jawaban ada di opsi, opsi/tile/pasangan unik, tepat 1 rumpang, kesesuaian あります/います,
kewajaran posisi, cakupan kosakata Bab 1–10 (seluruh teks Jepang didekomposisi), terjemahan Indonesia
(tanpa kanji/spasi ganda), duplikat & near-duplicate, sebaran tipe soal, serta sebaran/cakupan 10 kelompok
bunpou Bab 10 + 11 kata posisi. Generator juga punya validasi bawaan: bila gagal, file **tidak** ditulis.

### 3. Tampilan Terjemahan Setelah Menjawab (`js/translation.js`)

Setelah pengguna menekan **Periksa** (benar maupun salah):

1. **Kotak umpan balik** (`#quiz-feedback`) menampilkan status + **terjemahan Bahasa Indonesia lengkap**
   dari kalimat/soal yang dijawab, kalimat yang benar (bila salah), dan **cara baca** (kana + romaji).
2. **Kartu rincian di bawah kotak umpan balik** (`#quiz-translation-panel`) untuk tipe
   `short_conversation`, `arrange`, `translate`, dan `listening`: teks Jepang per baris, cara baca,
   dan terjemahan Bahasa Indonesia per baris.

Sumber data terjemahan:

- Bab 10 & Bab 9 → metadata terstruktur dari generator (`translation`, `reading`, `romaji`,
  `dialogueId`, `answerId`). Bab 9: 100% baris dialog (385/385) punya terjemahan Bahasa Indonesia.
- Bab 8 & Bab 7 (data lama) → **glosarium kata per kata** yang dibangun otomatis dari data kosakata
  (`VOCAB_BAB10_DATA` / `VOCAB_BAB9_DATA` / `VOCAB_BAB7_DATA` / `VOCAB_DATA`), diberi label
  "Kata kunci" agar tidak dikira terjemahan kalimat penuh.

### 4. Perbaikan Mode Gelap (`css/styles.css`)

- Variabel `body.dark-theme` disesuaikan: `--text-muted: #94a3b8`, `--accent-light: rgba(16,185,129,.25)`,
  `--success-light: rgba(34,197,94,.25)`, `--danger-light: rgba(239,68,68,.25)`, plus `color-scheme: dark`.
- **Akar masalah**: elemen `<button>` tidak mewarisi warna teks `<body>`, sehingga `.tile` dan `.match-item`
  tampil hitam di atas kartu gelap. Warna kini ditulis eksplisit memakai `--text-primary` / `--text-secondary`
  untuk `.q-prompt-card`, `.conv-bubble`, `.option-btn`, `.tile`, `.match-item`, `.listening-result-panel`,
  `.modal-box`, `.q-instruction`, dan komponen kartu lainnya.
- Status terpilih/benar/salah tetap menang secara spesifisitas di mode gelap
  (`body.dark-theme .option-btn.option-selected`, `.option-correct`, `.option-wrong`, `.zone-correct`, …).
- Warna aksen/status untuk **teks** dipisah dari warna untuk **latar**
  (`--accent-text`, `--success-text`, `--danger-text`) sehingga rasio kontras teks gelap-terang ≥ 4.9:1.
- Latar berisi teks putih (tombol utama, tombol reset, kartu lanjut, skor, avatar) digelapkan di mode gelap.
- Bonus: toast (`UIManager.showToast`) akhirnya punya gaya + animasi, dan `.chapter-switcher` dirapikan
  untuk 4 tombol bab.

### 5. Integrasi Aplikasi

**Bab 11:**

- `index.html`: tombol **Bab 11 (Baru)** (default aktif) di chapter switcher, hero, judul/meta,
  legenda peta 4 tier, dan script `vocab_bab11.js` / `levels_bab11.js`.
- `js/ui.js`: Bab 11 di `CHAPTERS` + `DEFAULT_CHAPTER = 'bab11'`; peta level & legenda dibuat
  dinamis dari data level (30 level untuk bab11, 50 untuk bab lain — tanpa hardcode 50/20).
- `js/app.js`: `CHAPTER_LEVEL_DATA.bab11 = LEVELS_BAB11_DATA`, `DEFAULT_CHAPTER = 'bab11'`,
  tombol "level berikutnya" mengikuti jumlah level bab aktif.
- `js/storage.js`: kunci progres `bab11` ditambahkan otomatis — progres Bab 7/8/9/10 pengguna
  lama tidak hilang.
- `js/translation.js`: `VOCAB_BAB11_DATA` masuk leksikon glosarium.
- `js/questions.js` dan `css/styles.css` tidak diubah.

**Bab 10:**

- `index.html`: tombol **Bab 10 (Baru)** di chapter switcher, script `vocab_bab10.js` / `levels_bab10.js` /
  `translation.js`, dan kontainer `#quiz-translation-panel`.
- `js/ui.js`: Bab 10 masuk daftar `CHAPTERS` (jadi default).
- `js/app.js`: `CHAPTER_LEVEL_DATA.bab10 = LEVELS_BAB10_DATA`, `DEFAULT_CHAPTER = 'bab10'`,
  pemanggilan `TranslationHelper`, dan confetti/audio dibungkus `try/catch` agar layar hasil tetap tampil.
- `js/storage.js`: kunci progres `bab10` ditambahkan otomatis — progres Bab 7/8/9 pengguna lama tidak hilang,
  dan badge menjumlahkan keempat bab.

## Cara Menjalankan

Buka `index.html` langsung di browser atau jalankan server statis:

```bash
python3 -m http.server 8080
```

Membuat ulang data:

```bash
node tools/generate_bab11.js   # → js/data/vocab_bab11.js & js/data/levels_bab11.js
node tools/audit_bab11.js      # memeriksa hasil generate (exit 1 bila ada masalah)
node tools/generate_bab10.js   # → js/data/vocab_bab10.js & js/data/levels_bab10.js
node tools/audit_bab10.js      # memeriksa hasil generate (exit 1 bila ada masalah)
node tools/generate_bab9.js    # → js/data/vocab_bab9.js  & js/data/levels_bab9.js
node tools/generate.js         # → js/data/vocab.js       & js/data/levels.js (Bab 8)
```

## Fitur Lain

- **Bebas melompati level** (semua 50 level terbuka), progres/XP/badge/riwayat tersimpan di `localStorage`.
- **Web Speech API (`ja-JP`)**: prompt, opsi, dan kata pada kartu dapat dibacakan.
- **Tema gelap/terang** tersimpan di `localStorage`.

## Catatan

- Data Bab 7 masih memuat soal tipe `true_false` dan `multiple_choice` (114 + 102 soal) yang belum punya
  renderer di `js/questions.js` — tampil sebagai "Tipe soal tidak dikenal". Perbaikan ini di luar cakupan
  pembaruan Bab 10 dan masih terbuka.
- Rasio kontras teks putih di atas tombol hijau `#10b981` pada **mode terang** masih ~2.5:1 (warna merek
  lama). Mode gelap sudah diperbaiki; mode terang sengaja tidak diubah agar identitas warna tetap.

## Bab 12 — perbandingan dan perubahan waktu

Bab 12 menambah 30 level × 15 soal (450), enam tipe latihan yang sudah didukung,
ringkasan tata bahasa, pembahasan, kana, dan 30 pengenalan kasual. Kosakata memakai
lampiran PDF Bab 1–12; progres menggunakan penyimpanan lama tanpa menghapus bab lain.

- Generator: `node tools/generate_bab12.js`
- Audit: `node tools/audit_bab12.js`
- Browser end-to-end: `tools/test_bab12_browser.js` (dependensi test opsional)
- Rincian hasil, pembagian level, cara menjalankan ulang, dan batasan:
  [LAPORAN_AUDIT_BAB12.md](LAPORAN_AUDIT_BAB12.md)
- Sumber kosakata: [tools/reference/README.md](tools/reference/README.md)
