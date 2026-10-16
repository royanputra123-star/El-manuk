# Laporan Audit Bank Soal Bab 11 (Comprehensible Input)

**Tanggal:** 16 Oktober 2026 · **Cakupan:** Minna no Nihongo I, Bab 1–11
**Berkas utama:** `js/data/levels_bab11.js` (450 soal), `js/data/vocab_bab11.js` (211 kosakata),
`tools/generate_bab11.js` (generator), `tools/audit_bab11.js` (pemeriksa otomatis)

---

## 1. Ringkasan

- Bank soal Bab 11 dibuat **baru seluruhnya** lewat generator dengan validasi bawaan
  (gagal = file tidak ditulis), mengikuti pola kerja `tools/generate_bab10.js`.
- Struktur: **30 level × 15 soal = 450 soal**, `id` `q_b11_1` … `q_b11_450`, 7 tipe soal existing
  tanpa tipe baru.
- **Seluruh 17 pola bunpou Bab 11 tercakup** (dari halaman pembelajaran Bab 11 + kotoba):
  ～つ, ～人, ～台, ～枚, ～回, ～個/本/番/分/日, ～時間/週間/か月/年, いくつ, 何人,
  ～と…ください, 全部で, ～ぐらい, 何回…～ぐらい, どのぐらい, ～だけ, から～まで…かかります,
  keluarga + jumlah.
- Kosakata dibatasi **Bab 1–11** saja (Kotoba Bab 11 + kotoba Bab 1–10 yang sudah ada),
  lengkap dengan kana + romaji + asal bab. **41 kosakata wajib** semuanya muncul di
  **≥ 3 soal** (rotasi merata antar level).
- **Audit otomatis: LULUS (0 masalah, 0 catatan).**

---

## 2. Jumlah soal & kosakata

| Metrik | Nilai |
| --- | --- |
| Jumlah level | 30 |
| Jumlah soal | 450 (`q_b11_1` … `q_b11_450`) |
| Soal per level | 15 |
| Kosakata (`vocab_bab11.js`) | 211 entri (kana + romaji + asal bab) |
| Bank kalimat sumber (unik, terde-duplikasi) | 1.089 kalimat |
| Template percakapan | 168 varian (unik secara parametrik) |
| Soal dengan terjemahan Indonesia | 450/450 |
| Soal dengan reading (kana) + romaji | 405/405 (45 match tidak butuh reading) |
| Soal kembar (isi identik) | **0** |
| Kalimat sumber kembar antar soal | **0** |
| Prompt Jepang kembar | **0** |
| Near-duplicate terlarang (beda 1 kata) | **0** |
| Variasi angka / minimal pair (diizinkan) | 123 pasang |

---

## 3. Aturan anti-duplikat & near-duplicate

Diterapkan pada generator (registrasi saat pembuatan bank) **dan** audit:

| Aturan | Status |
| --- | --- |
| Soal kembar (isi identik setelah normalisasi) | **Dilarang** (0 temuan) |
| Dua soal dengan kalimat Jepang sumber yang sama | **Dilarang** — tiap kalimat sumber dipakai maksimal 1× untuk 1 soal |
| Prompt Jepang sama setelah normalisasi | **Dilarang** (0 temuan) |
| Pasangan kalimat beda tepat 1 kata | **Dilarang**, kecuali dua pengecualian bernuansa pembelajaran yang jelas |
| ↳ (a) keduanya token numerik (三つ/五つ, 二人/五人, 二時間/三時間 …) | **Diizinkan** — variasi angka pada drill counter adalah inti pembelajaran Bab 11 |
| ↳ (b) minimal pair あります↔ありません, います↔いません | **Diizinkan** — pembedaan positif–negatif |
| Percakapan: beda 1 parameter non-numerik | **Dilarang**; variasi angka diizinkan (alasan sama dengan (a)) |

Near-duplicate terlarang = 0; 123 pasangan yang lolos semuanya adalah variasi angka
atau minimal pair afirmatif–negatif.

---

## 4. Sebaran tipe soal (target vs hasil)

Kuota per level dihitung dengan metode **largest-remainder kumulatif** terhadap proporsi
Bab 10 (180/170/160/130/130/130/100 per 1.000), diskalakan ke 450.

| Tipe | Jumlah | % | Target | Selisih |
| --- | --- | --- | --- | --- |
| complete | 81 | 18,0% | 81 | +0 |
| arrange | 77 | 17,1% | 77 | +0 |
| short_conversation | 72 | 16,0% | 72 | +0 |
| listening | 58 | 12,9% | 58 | +0 |
| translate | 58 | 12,9% | 58 | +0 |
| choose_translation | 59 | 13,1% | 59 | +0 |
| match | 45 | 10,0% | 45 | +0 |

Variasi tipe soal per level: **min 7 tipe berbeda, maks 7** (setiap level memuat seluruh tipe).
Contoh kuota level 1: complete=3, arrange=3, short_conversation=2, listening=2, translate=2,
choose_translation=2, match=1.

---

## 5. Tier & fokus per level

| Level | Tier | Fokus | Opsi / tile ekstra |
| --- | --- | --- | --- |
| 1–10 | Mudah | Counter dasar ～つ/～人/～枚/～台 + あります/います + いくつ/何人 | 3 opsi, 0 |
| 11–20 | Sedang | Pesanan ～と…ください · かかります · どのぐらい · ～だけ · 全部で | 3 opsi, 1 |
| 21–25 | Kalimat | Keluarga + jumlah · ～ぐらい · 何回 · kalimat counter panjang | 3 opsi, 1 |
| 26–30 | Campuran | Seluruh pola + kalimat panjang + pengecoh menjebak | 4 opsi, 2 |

Peta level menampilkan 30 level dengan legenda 4 tier (dibuat dinamis dari data level,
tanpa hardcode 50/20).

---

## 6. Cakupan bunpou Bab 11 (soal terkait)

| Kunci | Jumlah | Pola |
| --- | --- | --- |
| bp_tsu | 86 | Menghitung benda dengan ～つ |
| bp_nin | 119 | Counter orang ～人 |
| bp_dai | 22 | Counter ～台 |
| bp_mai | 55 | Counter ～枚 |
| bp_kai | 3 | Counter ～回 |
| bp_counter2 | 39 | Counter ～個/本/番/分/日 |
| bp_durasi | 50 | Counter durasi ～時間/週間/か月/年 |
| bp_ikutsu | 38 | いくつ |
| bp_nannin | 23 | 何人 |
| bp_kudasai | 11 | N を ～枚 と N を ～枚 ください |
| bp_zenbude | 33 | 全部で |
| bp_gurai | 14 | ～ぐらい |
| bp_kai_gurai | 1 | 何回 … ～ぐらい |
| bp_donogurai | 11 | どのぐらい |
| bp_dake | 28 | ～だけ |
| bp_kakarimasu | 40 | から ～まで … かかります |
| bp_keluarga | 56 | Keluarga + jumlah ～が ～人 います |

---

## 7. Rotasi kosakata wajib (41 item, minimal 3 soal)

| Kata | Soal | Kata | Soal | Kata | Soal |
| --- | --- | --- | --- | --- | --- |
| かかります | 44 | 封筒 | 14 | ～時間 | 10 |
| いくつ | 42 | 速達 | 3 | ～週間 | 15 |
| ひとり | 29 | 書留 | 3 | ～か月 | 17 |
| ふたり | 28 | エアメール（航空便） | 5 | ～年 | 10 |
| ～にん | 125 | 船便 | 5 | ～ぐらい | 30 |
| ～だい | 22 | 両親 | 6 | どのぐらい | 14 |
| ～まい | 57 | 兄弟 | 15 | 全部で | 38 |
| ～かい | 3 | 姉妹 | 11 | ～だけ | 32 |
| りんご | 20 | 兄 | 15 | | |
| みかん | 17 | お兄さん | 8 | | |
| サンドイッチ | 13 | 姉 | 15 | | |
| カレーライス | 10 | お姉さん | 7 | | |
| アイスクリーム | 11 | 弟 | 20 | | |
| 切手 | 28 | 弟さん | 9 | | |
| はがき | 31 | 妹 | 14 | | |
| | | 妹さん | 8 | | |
| | | 外国 | 10 | | |

Semua ≥ 3 soal (terendah: ～かい, 速達, 書留 = 3 soal). Generator juga memakai
**daftar pin** untuk menjamin minimal 3 soal per kata wajib secara deterministik.

---

## 8. Aturan CI i+1 (Comprehensible Input)

- Setiap kalimat soal (tipe kalimat) memperkenalkan **maksimal 1 kata konten baru Bab 11**
  ("baru" = belum muncul pada soal sebelumnya, termasuk eksposur lewat percakapan & match).
- Pelanggaran i+1 pada bank final: **0**.
- Percakapan dibebaskan dari aturan i+1 (setiap baris dialog diberi terjemahan Indonesia
  per baris + opsi jawaban dengan petunjuk) — didokumentasikan sebagai keputusan desain.
- Angka + counter (三つ/五人/二か月) diperlakukan sebagai **satu unit pola**, sehingga
  variasi angka tidak dihitung sebagai kata baru.

---

## 9. Aturan あります / います

- Benda mati → あります / ありません; makhluk hidup → います / いません
  (dikurasi per pasangan tempat↔subjek seperti Bab 10, `PLACE_THINGS` / `PLACE_PEOPLE`).
- Audit memeriksa konsistensi subjek-hidup vs predikat pada seluruh kalimat jawaban.
- 0 masalah pada audit final.

---

## 10. Ringkasan pemeriksaan otomatis (`node tools/audit_bab11.js`)

```
soal diperiksa (id, tipe, properti wajib)      : 450
soal beropsi (jawaban ada di opsi, opsi unik)  : 212
soal susun kata (token jawaban tersedia)       : 135
soal rumpang (tepat 1 rumpang)                 : 153
soal dialog (1 rumpang + dialogueId sinkron)   : 72
soal jodohkan (pasangan unik, >= 4)            : 45
soal listening (audioText = susunan jawaban)   : 58
soal dengan reading (kana) & romaji            : 405 / 405
soal dengan terjemahan Indonesia               : 450

HASIL: LULUS — tidak ada masalah pada pemeriksaan struktur, jawaban, terjemahan,
       kosakata Bab 1–11, duplikat/near-duplicate, sebaran tipe, cakupan bunpou,
       rotasi kosakata wajib, maupun aturan i+1.
```

---

## 11. Integrasi aplikasi

| Berkas | Perubahan |
| --- | --- |
| `index.html` | Tombol "Bab 11 (Baru)" (default aktif), hero, judul/meta, legenda peta 4 tier, script `vocab_bab11.js` + `levels_bab11.js` |
| `js/ui.js` | `CHAPTERS` + `DEFAULT_CHAPTER='bab11'`, peta level 30 level per bab (dinamis dari data), legenda dibangun dari tier aktual, statisik `x / <jumlah level>` (hardcode 50 dihapus) |
| `js/app.js` | `CHAPTER_LEVEL_DATA.bab11`, `DEFAULT_CHAPTER='bab11'`, tombol "level berikutnya" mengikuti jumlah level bab aktif |
| `js/storage.js` | Kunci `bab11` untuk `levelsDone`/`lastLevel` (progres Bab 7–10 **tidak diubah**, migrasi lengkap-tambah tanpa hapus), `lastLevel` dibatasi per bab (30 untuk bab11) |
| `js/translation.js` | `VOCAB_BAB11_DATA` masuk leksikon glosarium |
| `js/questions.js` | **Tidak diubah** — 7 tipe existing sudah didukung |
| `css/styles.css` | **Tidak diubah** — kelas tier/legend sudah tersedia |

Bab 1–10: `js/data/vocab_bab*.js`, `js/data/levels_bab*.js` **tidak disentuh**
(`git diff` terhadap berkas data lama kosong).

---

## 12. Cara memverifikasi ulang

```bash
node tools/generate_bab11.js   # regenerasi + validasi bawaan (gagal = tidak menulis file)
node tools/audit_bab11.js      # audit penuh (exit 1 bila ada temuan)
python3 -m http.server 8080   # buka http://localhost:8080 — uji 2 level, semua tipe,
                               # benar/salah, terjemahan, dan progres Bab 7–10
```
