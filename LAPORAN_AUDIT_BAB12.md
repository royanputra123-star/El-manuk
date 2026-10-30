# Implementasi dan audit Bab 12

## Arsitektur

Website statis HTML/CSS/JavaScript, global data `window.*`, tanpa backend/database/API/build bundler. Kuis menggunakan `QuestionRenderer`, umpan balik `TranslationHelper`, navigasi `UIManager`, dan progres localStorage `nihongo_app_progress_v2`. Tidak ada perubahan CSS, dependensi runtime baru, atau perubahan bank soal bab sebelumnya.

Bab 12 tersedia pada tombol bab, halaman utama, peta 30 level, lanjut belajar, skor/XP, hasil, riwayat, dan progres tersimpan. Pengguna baru masuk Bab 12; pilihan bab pengguna lama tetap dipertahankan. Batas lanjut level Bab 12 adalah 30. Ringkasan tata bahasa hanya ditampilkan pada Bab 12. Materi dilengkapi ruby pada ringkasan dan kana kalimat setelah menjawab. Penjelasan ditampilkan pada panel feedback yang sudah ada; soal lama tanpa metadata penjelasan tetap sama.

## Pembagian level

| Level | Fokus | Soal |
|---|---|---:|
| 1–5 | Pengenalan sifat い／な dan kata benda, empat bentuk | 75 |
| 6–10 | Penguatan lampau dan negatif dalam konteks waktu | 75 |
| 11–15 | Perbandingan dua hal dengan より | 75 |
| 16–20 | どちら, respons のほうが dan どちらも | 75 |
| 21–25 | Kelompok のなかで, kata tanya, dan いちばん | 75 |
| 26–30 | Campuran seluruh pola dan percakapan kasual | 75 |
| **Total** | **30 × 15** | **450** |

Band 1–10 melatih keempat bentuk secara berselang, bukan hanya mengelompokkan semua bentuk positif dahulu. Kata benda (雨／雪／曇り／休み／パーティー) dan pengecualian いい ikut dilatih. Band terakhir menggabungkan semua kelompok pola dengan enam soal kasual per level (30 total = 6,67%). Kasual dibatasi pada intonasi tanya sifat, tanpa pola lanjutan.

## Hasil audit otomatis

`node tools/audit_bab12.js` lulus:
- 30 level; tiap level tepat 15; ID unik dan berurutan; total 450.
- 450 teks Jepang jawaban/dialog lengkap unik (tidak ada duplikat persis).
- Semua soal punya instruksi, terjemahan, penjelasan, dan kana tanpa kanji.
- Tiap pilihan ganda punya empat opsi unik dan kunci berada di opsi.
- Rumpang tepat satu; tile dan jawaban konsisten; listening identik dengan jawaban.
- Dialog dan jawaban sinkron; konteks pilihan selera diberikan, bukan ditebak.
- 156 entri kata terkurasi divalidasi terhadap ekstraksi PDF Bab 1–12; teks Jepang dan distraktor dipindai memakai daftar kata + grammar allowlist yang eksplisit.
- Tipe: complete 101, choose_translation 70, translate 69, arrange 69, listening 70, short_conversation 71.
- Topik: bentuk 162, より 86, どちら 86, いちばん 86, kasual 30.
- Time signal Bab 4–5 divariasikan merata (bukan hanya 今日／昨日): おととい, 昨日, 今日, 明日, あさって, 今朝, 今晩, 毎朝, 毎晩, 毎日, 先週, 今週, 来週, 先月, 今月, 来月, 去年, 今年, 来年. Masing-masing ≥ 15 kemunculan; ke-19 kata muncul di semua 6 pita level; dipasangkan dengan kala yang sesuai (lampau hanya dengan おととい／昨日／今朝／先週／先月／去年; non-lampau dengan hari ini, kebiasaan, dan masa depan). Posisi jawaban pilihan ganda seimbang (A/B/C/D ≈ 61/60/61/60).

Audit memastikan konsistensi struktur, daftar kosakata, dan kunci data; bukan pembuktian otomatis bahwa setiap kalimat sepenuhnya alami. Variasi pola/minimal pair sengaja dipertahankan untuk latihan konjugasi dan pembanding; pemeriksaan duplikat menguji teks lengkap, bukan menolak semua template serupa.

## Pengujian aplikasi

`tools/test_bab12_browser.js` lulus menggunakan Playwright + Chromium headless:
- Menjawab **seluruh 450 soal melalui kontrol UI aplikasi**, menyelesaikan 30 layar hasil dengan skor 100% dan progres 30 level tersimpan.
- Memeriksa pembahasan setelah setiap jawaban dan pemulihan Level 30 sesudah reload.
- Jalur jawaban salah/reveal untuk keenam jenis soal.
- Navigasi, jumlah level, dan pembukaan soal bab lama: Bab 7–10 (50 level), Bab 11 (30).
- Migrasi localStorage lama menjaga bab aktif, XP, dan skor lama, serta menambah progres Bab 12 kosong.
- Tidak ada galat JavaScript browser.
- Viewport 360, 390, 768, 1280 px: tombol bab tersedia dan halaman/ringkasan tidak overflow horizontal.

`node tools/audit_bab10.js` dan `node tools/audit_bab11.js`: lulus.
Semua JavaScript diperiksa `node --check`; `git diff --check`: lulus. Regenerasi data deterministik diperiksa SHA-256.
Tidak ada perintah build pada repository: aplikasi statis langsung disajikan melalui HTTP.

### Menjalankan ulang

```sh
node tools/generate_bab12.js
node tools/audit_bab12.js
node tools/audit_bab10.js
node tools/audit_bab11.js
find js tools -name '*.js' -exec node --check {} \;
python3 -m http.server 8000 --bind 0.0.0.0
# Pada terminal terpisah (dependensi test opsional, bukan runtime website):
npm install --prefix /tmp/nihongo-test playwright @sparticuz/chromium
NODE_PATH=/tmp/nihongo-test/node_modules node tools/test_bab12_browser.js
```

Chromium membutuhkan pustaka sistem NSS/NSPR. Di sandbox pengujian, pustaka dibuka dari arsip `al2023.tar.br` milik paket Chromium, lalu `LD_LIBRARY_PATH` diarahkan ke folder `lib` tersebut. Pada sistem dengan Chromium sendiri, gunakan `CHROME_PATH` dan sediakan pustaka sistemnya. `TEST_URL` dapat mengganti alamat pengujian.

## Batasan dan tindak lanjut

- Gambar referensi tata bahasa tidak tersedia; hanya PDF kosakata yang dilampirkan. Materi mengikuti pola tertulis pengguna (lihat `tools/reference/README.md`).
- Audio Web Speech API memakai mesin suara perangkat, seperti bab sebelumnya. Pengujian UI mematikan audio agar deterministik; kualitas suara/pelafalan aktual perlu pemeriksaan di perangkat pengguna.
- Audit PDF berbasis daftar kata dan morfem, bukan parser linguistik atau pemeriksaan ahli. Peninjauan akhir oleh pengajar tetap disarankan, terutama untuk kealamian konteks dan distraktor.
