// sound.js
// Efek suara ringan menggunakan Web Audio API (tanpa file eksternal agar loading cepat).

(function (global) {
  let ctx = null;
  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    return ctx;
  }

  function isEnabled() {
    try { return Storage.getState().soundEnabled !== false; } catch (e) { return true; }
  }

  function tone(freq, duration, type, delay, gainStart) {
    if (!isEnabled()) return;
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    const startTime = c.currentTime + (delay || 0);
    gain.gain.setValueAtTime(gainStart || 0.15, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  function playCorrect() {
    tone(523.25, 0.12, 'sine', 0, 0.18);
    tone(659.25, 0.14, 'sine', 0.1, 0.18);
    tone(783.99, 0.18, 'sine', 0.2, 0.16);
  }

  function playWrong() {
    tone(220, 0.18, 'sawtooth', 0, 0.12);
    tone(180, 0.22, 'sawtooth', 0.08, 0.1);
  }

  function playLevelUp() {
    [523.25, 587.33, 659.25, 783.99, 1046.5].forEach((f, i) => {
      tone(f, 0.16, 'triangle', i * 0.09, 0.15);
    });
  }

  function playClick() {
    tone(880, 0.05, 'square', 0, 0.06);
  }

  function playComplete() {
    [659.25, 783.99, 987.77].forEach((f, i) => tone(f, 0.2, 'sine', i * 0.12, 0.15));
  }

  global.SoundFx = { playCorrect, playWrong, playLevelUp, playClick, playComplete };
})(window);
