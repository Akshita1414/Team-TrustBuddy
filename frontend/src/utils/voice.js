// Text-to-speech utility using browser-native Web Speech API
export function speak(text, lang = 'en-US') {
  if (!window.speechSynthesis) {
    alert('Sorry, your browser does not support speech synthesis.');
    return;
  }
  if (!text) return;
  window.speechSynthesis.cancel(); // Stop any ongoing speech

  // Split by line or sentence for non-English languages
  const isEnglish = lang.startsWith('en');
  const parts = isEnglish ? [text] : text.split(/\n|[.!?]/).filter(Boolean);

  function speakPart(index) {
    if (index >= parts.length) return;
    const utterance = new window.SpeechSynthesisUtterance(parts[index].trim());
    utterance.lang = lang;
    utterance.onend = () => speakPart(index + 1);
    window.speechSynthesis.speak(utterance);
  }

  speakPart(0);
} 