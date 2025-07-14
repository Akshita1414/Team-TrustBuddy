import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './data/translations';

const resources = {
  en: { translation: translations.en },
  hi: { translation: translations.hi },
  pa: { translation: translations.pa },
  mr: { translation: translations.mr },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n; 