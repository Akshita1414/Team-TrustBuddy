// Translation utility for TrustBuddy using backend Gemini API

const cache = {};

/**
 * Translate text to the target language using backend Gemini API
 * @param {string} text - The text to translate
 * @param {string} targetLanguage - The target language (e.g., 'hi', 'en', 'pa', 'mr', etc.)
 * @returns {Promise<string>} - The translated text
 */
export async function translateText(text, targetLanguage) {
  if (!text || !targetLanguage) return text;
  const cacheKey = `${text}__${targetLanguage}`;
  if (cache[cacheKey]) return cache[cacheKey];
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target_language: targetLanguage })
    });
    if (!res.ok) throw new Error('Translation failed');
    const data = await res.json();
    cache[cacheKey] = data.translation;
    return data.translation;
  } catch (err) {
    // On error, fallback to original text
    return text;
  }
} 