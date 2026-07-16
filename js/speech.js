window.SpeechAPI = (function() {
  const synth = window.speechSynthesis;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  function playAudio(text, rate = 0.9) {
    if (synth.speaking) synth.cancel();
    const utterThis = new SpeechSynthesisUtterance(text);
    utterThis.lang = 'ja-JP';
    utterThis.rate = rate; // Kecepatan dapat diatur
    
    // Gunakan suara perempuan atau laki-laki Jepang jika tersedia
    const voices = synth.getVoices();
    const jpVoice = voices.find(v => v.lang === 'ja-JP' && v.name.includes('Female')) || voices.find(v => v.lang === 'ja-JP');
    if (jpVoice) utterThis.voice = jpVoice;
    
    synth.speak(utterThis);
  }

  function recognizeSpeech(expectedText, callback) {
    if (!SpeechRecognition) {
      return callback(false, "Web Speech API tidak didukung di browser ini.");
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();
    
    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript.replace(/[\s。、！？]/g, '');
      const cleanExpected = expectedText.replace(/[\s。、！？]/g, '');
      const isCorrect = speechResult === cleanExpected;
      callback(isCorrect, speechResult);
    };

    recognition.onerror = (event) => {
      callback(false, `Error: ${event.error}`);
    };
  }

  return { playAudio, recognizeSpeech };
})();

