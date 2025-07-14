import React, { createContext, useContext, useState } from 'react';
import { LANGUAGES } from '../data/constants';
import { translations } from '../data/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  const t = (key) => {
    return (
      translations[language]?.[key] ||
      translations['en']?.[key] ||
      key
    );
  };

  return (
    <LanguageContext.Provider value={{ t, language, setLanguage, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
} 