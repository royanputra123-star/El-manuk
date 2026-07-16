// js/audioManager.js
// Single source of truth untuk Audio Bahasa Jepang berbasis Web Speech API (ja-JP)

(function (global) {
  let cachedVoice = null;

  function isSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  function getJapaneseVoice() {
    if (!isSupported()) return null;
    if (cachedVoice) return cachedVoice;

    const voices = window.speechSynthesis.getVoices() || [];
    const jaVoices = voices.filter(v => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith('ja'));

    if (jaVoices.length > 0) {
      cachedVoice = jaVoices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || jaVoices[0];
      return cachedVoice;
    }
    return null;
  }

  function stopAudio() {
    if (!isSupported()) return;
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
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

    const u = new SpeechSynthesisUtterance(cleanText);
    u.lang = 'ja-JP';
    u.rate = options.rate || 0.9;

    const voice = getJapaneseVoice();
    if (voice) {
      u.voice = voice;
    }

    let finished = false;
    const handleEnd = () => {
      if (!finished) {
        finished = true;
        if (options.onEnd) options.onEnd();
      }
    };

    u.onend = handleEnd;
    u.onerror = handleEnd;

    try {
      window.speechSynthesis.speak(u);
      // Fallback timer untuk OS/browser yang kadang gagal panggil onend
      const approxMs = Math.max(1000, cleanText.length * 200);
      setTimeout(() => {
        if (!finished && !window.speechSynthesis.speaking) {
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
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = () => {
        cachedVoice = null;
        getJapaneseVoice();
      };
    }
    getJapaneseVoice();
  }

  preloadVoices();

  global.AudioManager = {
    isSupported,
    getJapaneseVoice,
    playJapanese,
    stopAudio,
    preloadVoices
  };
})(window);
