# NihonGo! — Belajar Bahasa Jepang (Minna no Nihongo I Bab 7)

Website self-learning Bahasa Jepang bergaya "Duolingo" (desain orisinal, bukan tiruan),
berisi **50 level × 20 soal (1000 soal total)** yang seluruhnya disusun dari
**pola kalimat & kosakata resmi Minna no Nihongo I Bab 7**.

## Cara Menjalankan

Website ini murni HTML/CSS/JavaScript (tanpa build step, tanpa dependency).
Cukup buka `index.html` langsung di browser, atau jalankan server statis:

```bash
cd nihongo-app
python3 -m http.server 8080
# buka http://localhost:8080
```

## Struktur Folder

```
nihongo-app/
├── index.html          # Semua layar (Home, Level Map, Quiz, Result, Stats, Badges, History)
├── css/
│   └── styles.css      # Tema hijau/hitam/putih, mobile-first, responsive, animasi
├── js/
│   ├── data/
│   │   ├── vocab.js    # 46 kosakata wajib Bab 7 (auto-generated, termasuk bacaan/kana)
│   │   └── levels.js   # 50 level x 20 soal (auto-generated, termasuk soal Listening)
│   ├── storage.js       # localStorage: progres, skor, XP, streak, badge, riwayat
│   ├── sound.js         # Efek suara benar/salah/level-up (Web Audio API, tanpa file)
│   ├── audioManager.js  # ★ Sistem audio Jepang — SATU-SATUNYA sumber suara ucapan
│   │                    #   (Web Speech API: speechSynthesis + SpeechSynthesisUtterance)
│   ├── confetti.js      # Efek confetti saat level selesai
│   ├── questions.js      # Render & validasi 8 jenis soal (termasuk Listening) + integrasi audio
│   ├── ui.js             # Render layar Home/Map/Stats/Badges/History
│   └── app.js            # Alur aplikasi & sesi kuis
└── tools/
    └── generate.js      # Generator soal (Node.js) — sumber data levels.js & vocab.js
```

## Sistem Audio (Web Speech API)

Seluruh audio bahasa Jepang di NihonGo menggunakan **Web Speech API bawaan
browser** (`speechSynthesis` + `SpeechSynthesisUtterance`) — **bukan** Google
Cloud TTS, Azure TTS, ElevenLabs, OpenAI TTS, atau layanan berbayar lain.
Semua logika audio terpusat di **satu file**: `js/audioManager.js`, agar tidak
ada duplikasi kode audio di halaman lain.

API yang disediakan `AudioManager`:

- `AudioManager.playJapanese(text, opts)` — memutar teks Jepang (otomatis
  memilih voice `ja-JP` terbaik yang tersedia di browser, dan menghentikan
  audio sebelumnya agar tidak bertumpuk).
- `AudioManager.stopAudio()` — menghentikan audio yang sedang berjalan.
- `AudioManager.getJapaneseVoice()` — voice `ja-JP` terbaik yang terpilih.
- `AudioManager.preloadVoices()` — memuat awal daftar voice (dipanggil otomatis
  saat skrip dimuat).

**Cakupan integrasi audio:**

- Semua 8 tipe soal (susun kalimat, terjemahan, cocokkan kosakata, lengkapi
  kalimat, pilihan ganda, benar/salah, pilih terjemahan, **listening**) memiliki
  audio Jepang yang diputar otomatis satu kali saat soal muncul, plus tombol
  🔊 untuk mengulang.
- Setiap kartu kata pada soal susun-kalimat & listening dibacakan saat disentuh.
- Audio otomatis berhenti saat pengguna pindah soal atau keluar dari kuis
  (dikelola lewat `stopAudio()` di titik-titik navigasi `app.js`).
- Ikon speaker berdenyut saat memutar, dan tombolnya nonaktif sementara agar
  tidak ada audio bertumpuk.

**Soal Listening (tipe baru):** pengguna mendengarkan kalimat lewat tombol 🔊
besar, lalu menyusun kartu kata sesuai yang didengar. Panjang kalimat & jumlah
kata pengecoh meningkat mengikuti level (lihat `listeningWordRange()` dan
`listeningDistractorCount()` di `tools/generate.js`). Setelah menjawab,
kalimat Jepang, furigana (bacaan), arti Indonesia, dan tombol "Putar Lagi"
ditampilkan.

> Catatan kompatibilitas: kualitas & ketersediaan voice `ja-JP` bergantung
> pada browser/OS pengguna. Di Chrome Android/Desktop umumnya tersedia voice
> Google Japanese berkualitas baik. Jika browser sama sekali tidak mendukung
> Web Speech API, `AudioManager.isSupported()` akan bernilai `false` dan
> tombol audio otomatis dinonaktifkan tanpa memengaruhi fitur belajar lainnya.

## Tentang Data Soal (`tools/generate.js`)

Semua soal **tidak ditulis manual satu per satu**, melainkan disusun oleh generator
deterministik berbasis:

1. **Pola kalimat wajib Bab 7**: `〜ますか`, `もう〜ました`, `まだ〜ていません`, `まだです`,
   `〜を〜ます`, `〜に〜をあげます/もらいます/かします/かります/おしえます`, `〜をならいます`,
   `電話をかけます`, `〜はいかがですか`, `いただきます`, `ごちそうさまでした`, `どうぞお上がりください`,
   `失礼します`, dll.
2. **46 kosakata wajib** (lengkap dengan kanji) — semuanya dipastikan lolos validasi
   otomatis (`OK: semua 46 kosakata sudah terpakai di soal.`) sehingga tidak ada satupun
   kosakata yang terlewat.
3. **7 jenis soal**: Menyusun Kalimat, Menerjemahkan, Mencocokkan Kosakata, Melengkapi
   Kalimat, Pilihan Ganda, Benar/Salah, Pilih Terjemahan Benar.
4. **Kesulitan bertingkat**: Level 1–10 mudah, 11–20 sedang, 21–30 fokus kalimat,
   31–40 campuran, 41–50 acak semua tipe.

Untuk membuat ulang data soal (misalnya menambah variasi kalimat baru), edit
`tools/generate.js` lalu jalankan:

```bash
node tools/generate.js
```

Ini akan menulis ulang `js/data/vocab.js` dan `js/data/levels.js`.

## Fitur

- Progress belajar, level terakhir, skor, jumlah benar/salah tersimpan otomatis di `localStorage`.
- "Lanjut dari Level terakhir" saat website dibuka kembali.
- Level Map, XP, Badge, Streak harian, Statistik belajar, Riwayat skor.
- Mode gelap, efek suara ringan, animasi, confetti saat level selesai.
- Mobile-first, responsive untuk tablet & desktop, tombol besar & nyaman disentuh.
- Tombol Reset Progress (dengan konfirmasi).

## Aturan Kelulusan Level

Level dianggap lulus (membuka level berikutnya) jika skor akhir **≥ 60%** dari 20 soal.
Level tetap bisa diulang kapan saja untuk memperbaiki skor.
