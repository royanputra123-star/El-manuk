// audioManager.js
// ============================================================================
// AUDIO MANAGER — Satu-satunya sumber audio untuk seluruh website NihonGo.
//
// PENTING: Sistem ini WAJIB menggunakan Web Speech API bawaan browser
// (speechSynthesis + SpeechSynthesisUtterance). TIDAK menggunakan Google Cloud
// TTS, Azure TTS, ElevenLabs, OpenAI TTS, atau layanan berbayar apa pun.
//
// Semua halaman/komponen HARUS memanggil fungsi dari objek global `AudioManager`
// ini untuk memutar suara Jepang — jangan menulis kode `speechSynthesis` baru
// di file lain, agar tidak terjadi duplikasi & audio bertumpuk.
// ============================================================================

(function (global) {
  const synth = window.speechSynthesis || null;

  // Cache voice Jepang terbaik yang ditemukan browser (diisi oleh preloadVoices()).
  let cachedJapaneseVoice = null;
  let voicesReady = false;

  // Utterance yang sedang berjalan saat ini (dipakai untuk stop/replace).
  let currentUtterance = null;

  // Callback UI opsional — dipanggil saat status audio berubah, dipakai untuk
  // animasi ikon speaker (🔊 -> berdenyut) dan menonaktifkan tombol replay.
  let onStateChange = null; // (state: 'playing' | 'stopped') => void

  /**
   * Daftarkan callback untuk perubahan status audio (untuk animasi ikon UI).
   * @param {(state: 'playing'|'stopped') => void} cb
   */
  function setStateChangeHandler(cb) {
    onStateChange = typeof cb === 'function' ? cb : null;
  }

  function notify(state) {
    if (onStateChange) {
      try { onStateChange(state); } catch (e) { /* jangan biarkan error UI menghentikan audio */ }
    }
  }

  /**
   * Memuat & memilih voice Jepang (ja-JP) terbaik yang tersedia di browser.
   * Beberapa browser (terutama Chrome) memuat daftar voice secara asinkron,
   * sehingga fungsi ini mendengarkan event 'voiceschanged' juga.
   * @returns {Promise<SpeechSynthesisVoice|null>}
   */
  function preloadVoices() {
    return new Promise((resolve) => {
      if (!synth) { resolve(null); return; }

      function trySelect() {
        const voices = synth.getVoices();
        if (voices && voices.length > 0) {
          cachedJapaneseVoice = selectBestJapaneseVoice(voices);
          voicesReady = true;
          resolve(cachedJapaneseVoice);
          return true;
        }
        return false;
      }

      if (trySelect()) return;

      // Voice belum siap — tunggu event voiceschanged (umum terjadi di Chrome).
      const handler = () => {
        if (trySelect()) {
          synth.removeEventListener('voiceschanged', handler);
        }
      };
      synth.addEventListener('voiceschanged', handler);

      // Fallback: beberapa browser Android tidak pernah memicu voiceschanged,
      // jadi coba lagi beberapa kali dengan interval singkat.
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (trySelect() || attempts > 10) {
          clearInterval(interval);
          if (attempts > 10 && !voicesReady) resolve(null);
        }
      }, 300);
    });
  }

  /**
   * Memilih voice Jepang dengan kualitas terbaik dari daftar voice yang tersedia.
   * Prioritas: local service (biasanya lebih natural) > nama mengandung "Google"/"Natural"
   * > voice ja-JP apa pun > fallback null.
   * @param {SpeechSynthesisVoice[]} voices
   */
  function selectBestJapaneseVoice(voices) {
    const jpVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('ja'));
    if (jpVoices.length === 0) return null;
    if (jpVoices.length === 1) return jpVoices[0];

    // Skoring sederhana: voice lokal (localService) & nama yang menandakan kualitas tinggi
    // (mis. "Google 日本語", "Kyoko", "Otoya", "Natural") diprioritaskan.
    function score(v) {
      let s = 0;
      if (v.localService) s += 2;
      const name = (v.name || '').toLowerCase();
      if (name.includes('google')) s += 3;
      if (name.includes('natural')) s += 3;
      if (name.includes('kyoko') || name.includes('otoya') || name.includes('haruka')) s += 2;
      if (v.lang === 'ja-JP') s += 1;
      return s;
    }
    return jpVoices.slice().sort((a, b) => score(b) - score(a))[0];
  }

  /**
   * Mengembalikan voice Jepang yang sudah dipilih (memanggil preload bila belum siap).
   * @returns {SpeechSynthesisVoice|null}
   */
  function getJapaneseVoice() {
    return cachedJapaneseVoice;
  }

  /**
   * Menghentikan audio yang sedang diputar (jika ada). Aman dipanggil kapan saja,
   * termasuk saat tidak ada audio yang berjalan.
   */
  function stopAudio() {
    if (!synth) return;
    try {
      synth.cancel(); // menghapus seluruh antrian utterance agar tidak ada audio bertumpuk
    } catch (e) { /* ignore */ }
    currentUtterance = null;
    notify('stopped');
  }

  /**
   * Memutar teks Bahasa Jepang menggunakan Web Speech API.
   * Audio sebelumnya (jika ada) otomatis dihentikan agar tidak bertumpuk.
   *
   * @param {string} text - Teks Jepang yang akan dibacakan (boleh kanji/kana campuran).
   * @param {Object} [opts]
   * @param {number} [opts.rate=0.92] - Kecepatan bicara (0.5–2). Sedikit diperlambat
   *        agar lebih jelas untuk pembelajar.
   * @param {number} [opts.pitch=1] - Nada suara.
   * @param {() => void} [opts.onEnd] - Dipanggil saat audio selesai (atau dibatalkan).
   */
  function playJapanese(text, opts) {
    if (!text || !synth) return;
    const options = opts || {};

    // Hentikan audio sebelumnya agar tidak terjadi tumpang-tindih suara.
    stopAudio();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ja-JP';
    utter.rate = typeof options.rate === 'number' ? options.rate : 0.92;
    utter.pitch = typeof options.pitch === 'number' ? options.pitch : 1;
    utter.volume = 1;

    const voice = cachedJapaneseVoice || getJapaneseVoice();
    if (voice) utter.voice = voice;

    utter.onstart = () => notify('playing');
    utter.onend = () => {
      currentUtterance = null;
      notify('stopped');
      if (typeof options.onEnd === 'function') options.onEnd();
    };
    utter.onerror = () => {
      currentUtterance = null;
      notify('stopped');
      if (typeof options.onEnd === 'function') options.onEnd();
    };

    currentUtterance = utter;
    // Beberapa browser mobile butuh sedikit delay setelah cancel() sebelum speak()
    // baru bisa jalan mulus — setTimeout(0) cukup untuk menghindari race condition.
    setTimeout(() => {
      if (currentUtterance === utter) synth.speak(utter);
    }, 30);
  }

  /**
   * Mengecek apakah browser mendukung Web Speech API sama sekali.
   */
  function isSupported() {
    return !!synth;
  }

  // Muat voice sedini mungkin agar saat soal pertama muncul, audio sudah siap.
  if (synth) preloadVoices();

  // Hentikan audio otomatis saat tab disembunyikan/ditutup agar tidak terus berbunyi
  // di background (praktik baik UX audio).
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAudio();
  });

  global.AudioManager = {
    playJapanese,
    stopAudio,
    getJapaneseVoice,
    preloadVoices,
    isSupported,
    setStateChangeHandler,
  };
})(window);
