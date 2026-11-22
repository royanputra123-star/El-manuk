# Referensi kosakata Bab 1–13

Sumber utama: lampiran pengguna `ilide.info-kotoba-bab-1-25-pr_18c5724e0251ceab7dd566c8bb0ab304.pdf` (22 halaman).
SHA-256 PDF: `09f989e9a642e93c86d3d6b2d46812cfc8a3a6961b2e2aeb77d6a94ee256f0a7`.

## Berkas di folder ini

| Berkas | Isi | Dipakai oleh |
|---|---|---|
| `kotoba_bab1-12.txt` | Ekstraksi teks halaman 1–12, **dipotong sebelum 第十三課** | `tools/audit_bab12.js`, `tools/generate_bab12.js` |
| `kotoba_bab1-13.txt` | Ekstraksi teks halaman 1–13 (544 baris), berhenti di akhir daftar Bab 13 | `tools/audit_bab13.js`, `tools/generate_bab13.js` |

Keduanya disimpan agar audit tidak bergantung pada path unggahan sementara atau paket PDF. Kesalahan ejaan cetak sumber tidak disalin ke materi.

## Kosakata Bab 13

Daftar terkurasi ada di `tools/bab13_vocab.js` dalam bentuk `[id, jp, kana, arti, jenis, bab]`, berisi 449 entri: 32 entri Bab 13 dan 417 entri rujukan Bab 1–12. Bentuk kanji diperiksa terhadap kanji **atau** pembacaan kana sumber.

Entri Bab 13 (32): 遊びます · 泳ぎます · 迎えます · 疲れます · 出します · 入ります · 出ます · 結婚します · 買い物します · 食事します · 散歩します · 大変 · 欲しい · 寂しい · 広い · 狭い · 市役所 · プール · 川 · 経済 · 美術 · 釣り · スキー · 会議 · 登録 · 週末 · ～ごろ · 何か · どこか · おなかがすきました · おなかがいっぱいです · のどがかわきました.

Semua entri dapat diuji ulang dengan `node tools/audit_bab13.js` (bagian *kosakata*).

## Allowlist fungsional Bab 13

Partikel, morfem konjugasi, kata penunjuk, dan unsur pola **bukan** kosakata baru, jadi dipisahkan sebagai grammar allowlist di `tools/bab13_grammar.js` (`allowedSurfaces()`), bukan dianggap entri kosakata. Isinya: partikel は が を に で の と も や から まで だけ ぐらい ごろ か ね よ な, bentuk です／でした／じゃない／だ, serta konjugasi ます／ません／ました／ませんでした／ましょう／ませんか, たい／たくない／たかった／たくなかった, ほしい (empat bentuk), dan ます-stem untuk pola tujuan kegiatan.

**Catatan penting:** いつか dan だれか **tidak** muncul sebagai entri pada daftar kosakata Bab 13 di PDF sumber (yang tercatat: 何か／なにか dan どこか). Keduanya tetap dipakai karena:

1. Merupakan pola inti Bab 13 Minna no Nihongo (kata tanya + か: いつか, だれか, なにか, どこか) yang diminta materi, dan
2. Dibentuk sepenuhnya dari kosakata Bab 1–13 yang sudah terdaftar (いつ + か, だれ + か).

Preseden yang sama dipakai pada Bab 12 (どこ, のほうが, のなかで di-allowlist walau tidak muncul sebagai entri). Tambahan allowlist fungsional Bab 13: いかが, ませんか, そうですか, ぜひ, いいですね, うん／ううん, いただきます, ありがとうございます, どうぞ, おなか, のど.

## Tata bahasa

Tidak ada lampiran gambar tata bahasa pada sesi ini. Materi mengikuti pola Bab 13 Minna no Nihongo I:

- **A** N が ほしいです — ほしい berubah seperti kata sifat い (ほしくないです · ほしかったです · ほしくなかったです).
- **B** ます-stem + たいです — objek memakai を (boleh が untuk menekankan); たい juga berubah seperti kata sifat い.
- **C** 場所 へ (objek を) ます-stem に 行きます／来ます／帰ります — tujuan kegiatan.
- **D** いつか · だれか · なにか · どこか — kata tidak tentu; bentuk negatif なにも／だれも／どこも + ません.
- **E** いかがですか／ませんか — menawarkan dan mengajak.

Ringkasan ini juga tampil di aplikasi pada blok `#bab13-material` di `index.html`.

Contoh 鶏肉／牛肉／京都 tidak digunakan karena tidak terdaftar pada sumber yang tersedia.
