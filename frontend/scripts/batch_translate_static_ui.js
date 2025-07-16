
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const TRANSLATIONS_PATH = path.join(__dirname, '../src/data/translations.js');
const API_URL = 'http://localhost:8000/api/translate';
const TARGET_LANGUAGES = ['hi', 'mr', 'pa', 'bn', 'ta', 'te', 'gu', 'kn', 'ml', 'ur']; 
const THROTTLE_MS = 1200; 

function loadTranslations() {
  const raw = fs.readFileSync(TRANSLATIONS_PATH, 'utf-8');
  // Remove all comment lines and parse as JS object
  const noComments = raw.split('\n').filter(line => !line.trim().startsWith('//')).join('\n');
  const objStr = noComments.replace(/^export const translations =\s*/, '').replace(/;\s*$/, '');
  try {
    // eslint-disable-next-line no-eval
    return eval('(' + objStr + ')');
  } catch (e) {
    console.error('Failed to parse translations.js. First 100 chars:', objStr.slice(0, 100));
    throw e;
  }
}

function saveTranslations(translations) {
 const out = 'export const translations = ' + JSON.stringify(translations, null, 2) + ';\n';
  fs.writeFileSync(TRANSLATIONS_PATH, out, 'utf-8');
}

async function translate(text, target_language) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, target_language })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error: ${err}`);
  }
  const data = await res.json();
  return data.translation;
}

async function main() {
  let translations = loadTranslations();
  const english = translations.en;
  let updated = false;

  for (const lang of TARGET_LANGUAGES) {
    if (!translations[lang]) translations[lang] = {};
    for (const key of Object.keys(english)) {
      if (translations[lang][key]) continue; 
      try {
        console.log(`[${lang}] Translating: ${key}`);
        const result = await translate(key, lang);
        translations[lang][key] = result.trim();
        updated = true;
        await new Promise(r => setTimeout(r, THROTTLE_MS));
      } catch (err) {
        console.error(`[${lang}] Error translating '${key}':`, err.message);
        if (err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED')) {
          console.error('Quota exhausted or API error. Stopping.');
          break;
        }
      }
    }
  }
  if (updated) {
    saveTranslations(translations);
    console.log('Translations updated and saved.');
  } else {
    console.log('No new translations needed.');
  }
}

main(); 