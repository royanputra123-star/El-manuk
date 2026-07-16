window.LEVELS_DATA = [
  {
    level: 1,
    theme: "Perkenalan",
    dialog: [
      { speaker: "A", text: "おはようございます。" },
      { speaker: "B", text: "おはようございます。" },
      { speaker: "A", text: "初めまして。私は学生です。インドネシアから来ました。" },
      { speaker: "B", text: "私は会社員です。どうぞよろしくお願いします。" }
    ],
    questions: [
      {
        id: "L1_1", type: "reading",
        instruction: "Berdasarkan dialog, siapa yang berasal dari Indonesia?",
        prompt: "インドネシアから来ましたか。",
        options: ["A", "B", "先生", "医者"],
        answer: "A",
        feedback: { arti: "A datang dari Indonesia", grammar: "Partikel から (dari)", alasan: "Di dialog, A menyatakan 'インドネシアから来ました'.", contoh: "私はアメリカから来ました。" }
      },
      {
        id: "L1_2", type: "vocab",
        instruction: "Apa arti dari kanji berikut?",
        prompt: "学生",
        options: ["Guru", "Mahasiswa", "Dokter", "Peneliti"],
        answer: "Mahasiswa",
        feedback: { arti: "Mahasiswa", grammar: "Kata Benda", alasan: "学生 (gakusei) berarti mahasiswa.", contoh: "私は学生です。" }
      },
      {
        id: "L1_3", type: "grammar",
        instruction: "Apa fungsi partikel は pada kalimat berikut?",
        prompt: "私は学生です。",
        options: ["Penanda Subjek/Topik", "Penanda Objek", "Penanda Tempat", "Penanda Arah"],
        answer: "Penanda Subjek/Topik",
        feedback: { arti: "Saya adalah mahasiswa", grammar: "N1 は N2 です", alasan: "Partikel は digunakan untuk menunjukkan topik pembicaraan.", contoh: "あなたは会社員です。" }
      },
      {
        id: "L1_4", type: "listening",
        instruction: "Dengarkan dan pilih terjemahan yang tepat.",
        prompt: "初めまして。",
        audioText: "初めまして。",
        options: ["Selamat pagi", "Perkenalkan", "Senang berkenalan", "Terima kasih"],
        answer: "Perkenalkan",
        feedback: { arti: "Perkenalkan", grammar: "Salam (Aisatsu)", alasan: "初めまして diucapkan saat pertama kali bertemu.", contoh: "初めまして。私は医者です。" }
      },
      {
        id: "L1_5", type: "speaking",
        instruction: "Ucapkan kalimat berikut dengan jelas.",
        prompt: "どうぞよろしくお願いします。",
        expectedSpeech: "どうぞよろしくお願いします",
        feedback: { arti: "Senang berkenalan / Mohon bantuannya", grammar: "Salam", alasan: "Diucapkan di akhir perkenalan diri.", contoh: "私は学生です。どうぞよろしくお願いします。" }
      },
      {
        id: "L1_6", type: "arrange",
        instruction: "Susun kata-kata berikut menjadi kalimat yang benar.",
        prompt: "Saya adalah karyawan perusahaan.",
        tiles: ["会社員", "私", "です", "は"],
        answer: ["私", "は", "会社員", "です"],
        feedback: { arti: "Saya adalah karyawan.", grammar: "N1 は N2 です", alasan: "Struktur standar: Subjek + は + Objek/Keterangan + です.", contoh: "あの人は先生です。" }
      }
      // ... Diulang hingga 20-30 soal, mencakup True/False, Matching, dll.
    ]
  },
  {
    level: 2,
    theme: "Negara",
    dialog: [
      { speaker: "A", text: "あの人は誰ですか。" },
      { speaker: "B", text: "あの人は先生です。アメリカから来ました。" },
      { speaker: "A", text: "あなたはイギリス人ですか。" },
      { speaker: "B", text: "いいえ、イギリス人じゃありません。インドネシア人です。" }
    ],
    questions: [
      {
        id: "L2_1", type: "transform",
        instruction: "Ubah kalimat berikut menjadi bentuk negatif.",
        prompt: "イギリス人です。",
        options: ["イギリス人ですか。", "イギリス人じゃありません。", "イギリス人でした。", "イギリス人から来ました。"],
        answer: "イギリス人じゃありません。",
        feedback: { arti: "Bukan orang Inggris.", grammar: "〜じゃありません (Bentuk negatif dari です)", alasan: "Negasi untuk kata benda adalah じゃありません.", contoh: "私は医者じゃありません。" }
      },
      {
        id: "L2_2", type: "fill",
        instruction: "Isi bagian yang rumpang.",
        prompt: "あの人は＿＿＿ですか。",
        options: ["誰", "何歳", "国", "会社"],
        answer: "誰",
        feedback: { arti: "Orang itu siapa?", grammar: "Kata tanya 誰 (dare = siapa)", alasan: "Menanyakan identitas orang menggunakan 誰.", contoh: "あの方はどなたですか。" }
      }
      // ... 
    ]
  }
];
                window.validateVocabUsage = function() {
  const allUsedChars = new Set();
  const rawTextArrays = [];

  // 1. Ekstrak seluruh teks dari Dialog dan Soal
  window.LEVELS_DATA.forEach(lvl => {
    lvl.dialog.forEach(d => rawTextArrays.push(d.text));
    lvl.questions.forEach(q => {
      if(q.prompt) rawTextArrays.push(q.prompt);
      if(q.options) q.options.forEach(o => rawTextArrays.push(o));
      if(q.tiles) q.tiles.forEach(t => rawTextArrays.push(t));
      if(q.feedback) rawTextArrays.push(q.feedback.contoh);
    });
  });

  const fullTextStr = rawTextArrays.join(" ");

  // 2. Cek apakah setiap kanji di KOTOBA_DB muncul di dalam sistem
  let missingVocab = [];
  window.KOTOBA_DB.forEach(k => {
    if (!fullTextStr.includes(k.kanji)) {
      missingVocab.push(k.kanji);
    }
  });

  // 3. Cek kebocoran Furigana / Hiragana (validasi regex dasar)
  // Menangkap pola kurung biasa di sebelah kanji e.g., 学校(がっこう)
  const furiganaLeak = fullTextStr.match(/[\u4e00-\u9faf]+[（\(][\u3040-\u309f]+[）\)]/g);

  console.log("=== HASIL VALIDASI SISTEM ===");
  if (missingVocab.length === 0) {
    console.log("✅ SUKSES: 100% Kosakata dari kotoba.docx telah digunakan.");
  } else {
    console.error("❌ GAGAL: Kosakata berikut belum terpakai:", missingVocab);
  }

  if (!furiganaLeak) {
    console.log("✅ SUKSES: Tidak ditemukan Furigana mendampingi Kanji.");
  } else {
    console.error("❌ GAGAL: Ditemukan indikasi penggunaan Furigana:", furiganaLeak);
  }
};

// Jalankan otomatis di mode pengembangan
setTimeout(window.validateVocabUsage, 1000);
