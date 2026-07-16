# NihonGo! — Belajar Bahasa Jepang (Minna no Nihongo Bab 8 & Bab 7)

Website self-learning Bahasa Jepang bergaya Duolingo yang berfokus pada materi **Minna no Nihongo I Bab 8** (dan Bab 7), berisi **50 Level × 20 Soal (Total 1000 Soal Bab 8)**.

## Fitur Utama & Pembaruan Bab 8

1. **Pola Tata Bahasa Bab 8**:
   - Kata Benda は Kata Sifat な (な) です (e.g., この町は 静かです)
   - Kata Benda は Kata Sifat い (～い) です (e.g., 富士山は 高いです)
   - Kata Sifat な + Kata Benda (e.g., きれいな 町)
   - Kata Sifat い + Kata Benda (e.g., 高い 山)
   - ～ が 、～ (Partikel kontras, e.g., 日本の食べ物はおいしいですが、高いです)
   - とても / あまり (Kata keterangan tingkat)

2. **Penggunaan Kanji Wajib**:
   - Seluruh soal menggunakan Kanji resmi dari referensi file `kotoba.pdf` (seperti ハンサム, きれい, 静か, にぎやか, 有名, 親切, 元気, 暇, 便利, 大きい, 小さい, 新しい, 古い, 暑い, 寒い, 冷たい, 難しい, 易しい, 高い, 安い, おもしろい, おいしい, 忙しい, 楽しい, 白い, 桜, 山, 富士山, 町, 食べ物, 所, 寮, レストラン, 生活, 仕事, dll).

3. **Penyesuaian Tipe Soal**:
   - **DIHAPUS**: True or False (Benar/Salah) dan Multiple Choice (pilihan ganda tebak arti kata).
   - **DIPERTAHANKAN**: Menyusun kata (`arrange` / `translate`), Mencocokkan (`match`), Pilih Terjemahan (`choose_translation`), Listening (`listening`).
   - **DITAMBAHKAN**: Melengkapi kalimat (`complete`) & **Percakapan Pendek (Short Conversation)**.

4. **Bebas Melompati Level (Unlock All)**:
   - Pengguna bebas memilih dan memainkan level mana saja dari Level 1 hingga 50 tanpa harus membuka kunci secara berurutan.

5. **Penghapusan Streak**:
   - Seluruh kalkulasi, indikator UI, dan badge streak telah dihapus total.

6. **Integrasi Web Speech API (Text-to-Speech `ja-JP`)**:
   - Membacakan teks prompt Jepang saat soal muncul.
   - Membacakan opsi/kartu kata saat diklik.

## Cara Menjalankan

Buka `index.html` langsung di browser atau jalankan server statis:

```bash
python3 -m http.server 8080
```

Untuk membuat ulang data Bab 8:

```bash
node tools/generate.js
```
