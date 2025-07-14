import React from 'react';
import { Shield, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES } from '../data/constants';

export function Header({ title, showBackButton, onBackClick }) {
  const { t, language, setLanguage } = useLanguage();

  return (
    <header className="bg-white shadow-md border-b-4 border-orange-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {showBackButton ? (
            <button
              onClick={onBackClick}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <Shield className="w-6 h-6" />
              <span>{t('backToHome')}</span>
            </button>
          ) : (
            <>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-xl shadow-md">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">TrustBuddy</h1>
                <p className="text-orange-600 font-medium">{t('tagline')}</p>
              </div>
            </>
          )}

          {title && (
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          )}
        </div>

        {/* Language Selector */}
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="appearance-none bg-white border-2 border-orange-200 rounded-lg px-4 py-2 pr-8 text-gray-700 hover:border-orange-400 focus:border-orange-500 focus:outline-none transition-colors"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
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
