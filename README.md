# NihonGo! — Belajar Bahasa Jepang (Minna no Nihongo Bab 10, Bab 9, Bab 8 & Bab 7)

Website self-learning Bahasa Jepang bergaya Duolingo. Bab terbaru: **Minna no Nihongo I Bab 10**
(あります / います + partikel に・が・は・の + posisi 上・下・前・後ろ・右・左・中・外・隣・近く・間).
Bab 9, Bab 8, dan Bab 7 tetap dapat dimainkan. Setiap bab berisi **50 Level × 20 Soal (1.000 soal per bab)**.

## Pembaruan Terbaru

### 1. Bab 10 — Bank Soal Baru (`js/data/levels_bab10.js` + `js/data/vocab_bab10.js`)

Generator: **`tools/generate_bab10.js`** → 50 level, 1.000 soal (`q_b10_1` … `q_b10_1000`), 108 kosakata.

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

**Kosakata & kanji**: kanji standar N5/Bab 10 dipertahankan — あります, います, 上, 下, 前, 後ろ, 右, 左,
中, 外, 隣, 近く, 間, 箱, 冷蔵庫, 棚, 窓, 机, 鍵, 公園, 喫茶店, 本屋, 乗り場, 電柱, 駅, 銀行, 郵便局,
病院, 学校, 大学, 会社, 部屋, 教室, 事務所, 図書館, 庭, 台所, 犬, 猫, 鳥, 魚, 男の人, 女の人, 男の子,
女の子, 学生, 会社員, dll. (108 entri, lengkap dengan kana + romaji di `vocab_bab10.js`).

**Anti-monoton**

- **5 tier kesulitan**: 1–10 Mudah, 11–20 Sedang, 21–30 Kalimat, 31–40 Campuran, 41–50 Acak.
- **7 tipe soal** dipakai proporsional di *setiap* level (kuota largest-remainder, bukan acak murni):
  `arrange`, `translate`, `complete`, `match`, `short_conversation`, `choose_translation`, `listening`.
- Subjek, lokasi, dan kata posisi dirotasi: 48 subjek unik (benda + makhluk hidup), 29 tempat,
  11 posisi, diambil dari bank 2.319 kalimat yang tervalidasi.
- **Filter kewajaran** supaya kalimat tidak janggal:
  - あります hanya untuk benda mati, います hanya untuk makhluk hidup (divalidasi untuk seluruh bank);
  - 上 / 下 hanya dengan acuan benda (机の上), 中 / 外 hanya dengan acuan wadah/ruang (箱の中, 教室の中);
  - benda dalam ruangan tidak dipasangkan dengan tempat luar ruangan (dan sebaliknya);
  - 山 / 木 / 電柱 tidak dipakai di tempat sempit (庭, 乗り場), 国 / 町 tidak dipakai sebagai acuan posisi.
- `match` punya 9 tema berputar (posisi, benda, tempat, makhluk hidup, bacaan kanji, pola, tanya-jawab,
  ungkapan, posisi & tempat) — termasuk "jodohkan kanji dengan cara bacanya".

**Validasi bawaan generator** (gagal = file tidak ditulis): id soal unik, token jawaban ada di `tiles`,
jawaban ada di `options` (min. 3 opsi, tanpa duplikat), `vocabId` match unik, dialog punya tepat 1 rumpang,
kesesuaian あります/います, kewajaran posisi, dan **setiap soal wajib punya metadata terjemahan**.

### 2. Tampilan Terjemahan Setelah Menjawab (`js/translation.js`)

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

### 3. Perbaikan Mode Gelap (`css/styles.css`)

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

### 4. Integrasi Aplikasi

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
node tools/generate_bab10.js   # → js/data/vocab_bab10.js & js/data/levels_bab10.js
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
