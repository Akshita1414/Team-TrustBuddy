// Text-to-speech utility using browser-native Web Speech API
export function speak(text, lang = 'en-US') {
  if (!window.speechSynthesis) {
    alert('Sorry, your browser does not support speech synthesis.');
    return;
  }
  if (!text) return;
  window.speechSynthesis.cancel(); // Stop any ongoing speech

  // Get available voices
  const voices = window.speechSynthesis.getVoices();
  
  // Check if the requested language voice is available
  const hasVoiceForLanguage = (langCode) => {
    return voices.some(voice => voice.lang.startsWith(langCode));
  };

  // Fallback logic for Indian languages
  let finalLang = lang;
  if (lang === 'pa-IN' && !hasVoiceForLanguage('pa')) {
    console.log('Punjabi voice not available, falling back to Hindi');
    finalLang = 'hi-IN';
  } else if (lang === 'mr-IN' && !hasVoiceForLanguage('mr')) {
    console.log('Marathi voice not available, falling back to Hindi');
    finalLang = 'hi-IN';
  } else if (lang === 'kn-IN' && !hasVoiceForLanguage('kn')) {
    console.log('Kannada voice not available, falling back to Hindi');
    finalLang = 'hi-IN';
  }

  // Split by line or sentence for non-English languages
  const isEnglish = finalLang.startsWith('en');
  const parts = isEnglish ? [text] : text.split(/\n|[.!?]/).filter(Boolean);

  function speakPart(index) {
    if (index >= parts.length) return;
    const utterance = new window.SpeechSynthesisUtterance(parts[index].trim());
    utterance.lang = finalLang;
    utterance.onend = () => speakPart(index + 1);
    window.speechSynthesis.speak(utterance);
  }

  speakPart(0);
}

// Debug function to log available voices (for development)
export function logAvailableVoices() {
  if (!window.speechSynthesis) {
    console.log('Speech synthesis not available');
    return;
  }
  
  const voices = window.speechSynthesis.getVoices();
  console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
  
  // Log Indian language voices specifically
  const indianVoices = voices.filter(v => 
    v.lang.includes('IN') || 
    v.lang.startsWith('hi') || 
    v.lang.startsWith('pa') || 
    v.lang.startsWith('mr') || 
    v.lang.startsWith('kn')
  );
  console.log('Indian language voices:', indianVoices.map(v => `${v.name} (${v.lang})`));
}

// Helper function to get correct voice language codes for Indian languages
export function getVoiceLanguage(language) {
  // Check if speech synthesis is available
  if (!window.speechSynthesis) {
    return 'en-US';
  }

  // Get available voices
  const voices = window.speechSynthesis.getVoices();
  
  // Function to check if a voice is available for a language
  const hasVoiceForLanguage = (langCode) => {
    return voices.some(voice => voice.lang.startsWith(langCode));
  };

  switch (language) {
    case 'en':
      return 'en-US';
    case 'hi':
      return 'hi-IN';
    case 'gu':
      // For Gujarati, try gu-IN first, then fallback to hi-IN (Hindi) if not available
      if (hasVoiceForLanguage('gu')) {
        return 'gu-IN';
      } else if (hasVoiceForLanguage('hi')) {
        return 'hi-IN'; // Fallback to Hindi
      } else {
        return 'en-US'; // Final fallback to English
      }
    case 'mr':
      // For Marathi, try mr-IN first, then fallback to hi-IN if not available
      if (hasVoiceForLanguage('mr')) {
        return 'mr-IN';
      } else if (hasVoiceForLanguage('hi')) {
        return 'hi-IN'; // Fallback to Hindi
      } else {
        return 'en-US'; // Final fallback to English
      }
    case 'kn':
      // For Kannada, try kn-IN first, then fallback to hi-IN if not available
      if (hasVoiceForLanguage('kn')) {
        return 'kn-IN';
      } else if (hasVoiceForLanguage('hi')) {
        return 'hi-IN'; // Fallback to Hindi
      } else {
        return 'en-US'; // Final fallback to English
      }
    default:
      return 'en-US';
  }
} 