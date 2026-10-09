// js/audioManager.js
// Single source of truth untuk Audio Bahasa Jepang berbasis Web Speech API (ja-JP)

(function (global) {
  let cachedVoice = null;
  // Simpan referensi utterance aktif. Tanpa ini, Chrome/Edge di desktop bisa
  // membuang (garbage collect) utterance di tengah bicara sehingga suara
  // terputus atau onend tidak pernah terpanggil.
  let activeUtterance = null;
  let speakTimer = null;

  function isSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  function isJapaneseVoice(v) {
    return !!v && !!v.lang && v.lang.toLowerCase().replace('_', '-').startsWith('ja');
  }

  function getJapaneseVoice() {
    if (!isSupported()) return null;
    if (cachedVoice) return cachedVoice;

    const voices = window.speechSynthesis.getVoices() || [];
    const jaVoices = voices.filter(isJapaneseVoice);

    if (jaVoices.length > 0) {
      // Prioritaskan suara "natural/online" (Edge: Nanami/Keita, Chrome: Google 日本語)
      cachedVoice = jaVoices.find(v => /Google|Natural|Online/i.test(v.name))
        || jaVoices.find(v => v.localService === false)
        || jaVoices[0];
      return cachedVoice;
    }
    return null;
  }

  /**
   * Mengembalikan true jika perangkat punya suara Bahasa Jepang.
   * Di PC (Windows/Linux) suara Jepang sering belum terpasang, sehingga
   * speechSynthesis diam walaupun tidak ada error. Di HP biasanya sudah ada.
   * Mengembalikan null jika daftar suara belum selesai dimuat.
   */
  function hasJapaneseVoice() {
    if (!isSupported()) return false;
    const voices = window.speechSynthesis.getVoices() || [];
    if (voices.length === 0) return null;
    return voices.some(isJapaneseVoice);
  }

  function stopAudio() {
    if (!isSupported()) return;
    if (speakTimer) { clearTimeout(speakTimer); speakTimer = null; }
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
    activeUtterance = null;
  }

  function playJapanese(text, opts) {
    if (!text || !isSupported()) {
      if (opts && opts.onEnd) opts.onEnd();
      return;
    }

    const options = opts || {};
    stopAudio();

    // Clean text: Hapus tanda baca/placeholder kosong seperti ＿＿＿
    const cleanText = text.replace(/[＿_]/g, '');
    if (!cleanText.trim()) {
      if (options.onEnd) options.onEnd();
      return;
    }

    // Beri jeda singkat setelah cancel(); speak() langsung setelah cancel()
    // sering diabaikan oleh Chrome/Edge desktop.
    speakTimer = setTimeout(() => {
      speakTimer = null;
      speakNow(cleanText, options);
    }, 60);
  }

  function speakNow(cleanText, options) {
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(cleanText);
    activeUtterance = u;
    u.lang = 'ja-JP';
    u.rate = options.rate || 0.9;

    const voice = getJapaneseVoice();
    if (voice) {
      u.voice = voice;
      // Pastikan lang sesuai dengan suara yang dipilih
      u.lang = voice.lang || 'ja-JP';
    } else {
      console.warn('[AudioManager] Tidak ada suara Bahasa Jepang di perangkat ini. Pasang paket suara Jepang di sistem operasi.');
    }

    let finished = false;
    const handleEnd = () => {
      if (!finished) {
        finished = true;
        if (activeUtterance === u) activeUtterance = null;
        if (options.onEnd) options.onEnd();
      }
    };

    u.onend = handleEnd;
    u.onerror = (ev) => {
      if (ev && ev.error && ev.error !== 'interrupted' && ev.error !== 'canceled') {
        console.warn('SpeechSynthesis error:', ev.error);
      }
      handleEnd();
    };

    try {
      // Chrome kadang memasukkan speech dalam status paused; lanjutkan
      if (synth.paused) synth.resume();
      synth.speak(u);

      // Fallback timer untuk browser yang kadang gagal memanggil onend
      const approxMs = Math.max(1500, cleanText.length * 250);
      setTimeout(() => {
        if (!finished && !synth.speaking && !synth.pending) {
          handleEnd();
        }
      }, approxMs);
    } catch (err) {
      console.warn('SpeechSynthesis error:', err);
      handleEnd();
    }
  }

  function preloadVoices() {
    if (!isSupported()) return;
    // Gunakan addEventListener agar tidak menimpa listener lain
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      cachedVoice = null;
      getJapaneseVoice();
    });
    getJapaneseVoice();
  }

  preloadVoices();

  global.AudioManager = {
    isSupported,
    hasJapaneseVoice,
    getJapaneseVoice,
    playJapanese,
    stopAudio,
    preloadVoices
  };
})(window);
