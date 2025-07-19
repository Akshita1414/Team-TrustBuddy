import React from 'react';
import { Shield, Globe, Flower } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES } from '../data/constants';

export function Header({ title, showBackButton, onBackClick }) {
  const { t, language, setLanguage } = useLanguage();

  return (
    <header className="backdrop-blur-glass bg-white/70 dark:bg-gray-900/70 shadow-glass border-b-4 border-saffron rounded-b-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {showBackButton ? (
            <button
              onClick={onBackClick}
              className="flex items-center gap-2 text-bharatgreen hover:text-saffron font-medium transition-colors"
              aria-label={t('backToHome')}
            >
              <Shield className="w-6 h-6" />
              <span>{t('backToHome')}</span>
            </button>
          ) : (
            <>
              <div className="bg-gradient-to-r from-saffron to-bharatgreen p-3 rounded-2xl shadow-glass flex items-center gap-2">
                <Shield className="w-8 h-8 text-white" />
                {/* Bharat badge */}
                <span className="ml-2 flex items-center gap-1 px-2 py-1 bg-white/70 dark:bg-gray-800/70 rounded-lg text-xs font-semibold text-saffron shadow-sm border border-saffron">
                  <Flower className="w-4 h-4 text-saffron" />
                  Bharat
                </span>
              </div>
              <div className="flex flex-col ml-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight font-sans">TrustBuddy</h1>
                <p className="text-bharatgreen font-medium text-sm" aria-label="Tagline">{t('tagline')}</p>
                <span className="text-xs text-gray-500 mt-1">Helping Bharat shop safer — one product at a time.</span>
              </div>
            </>
          )}

          {title && (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white ml-4">{title}</h1>
          )}
        </div>

        {/* Language Selector */}
        <div className="relative" aria-label="Language Selector">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="appearance-none bg-white/80 dark:bg-gray-800/80 border-2 border-bharatgreen rounded-lg px-4 py-2 pr-8 text-gray-700 dark:text-white hover:border-saffron focus:border-saffron focus:outline-none transition-colors font-sans min-w-[120px]"
            aria-label="Select Language"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="font-sans">
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
          <Globe className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </header>
  );
}
