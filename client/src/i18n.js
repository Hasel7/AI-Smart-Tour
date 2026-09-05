import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import en from './locales/en/translation.json';
import fr from './locales/fr/translation.json';
import es from './locales/es/translation.json';
import jp from './locales/jp/translation.json';
import de from './locales/de/translation.json';
import it from './locales/it/translation.json';
import pt from './locales/pt/translation.json';

// Configuration
i18n
  // Detects user language from browser automatically
  .use(LanguageDetector)
  // Passes i18n instance to react-i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      gb: { translation: en }, // Alias for users who selected GB english before
      us: { translation: en }, // Alias for US english
      fr: { translation: fr },
      es: { translation: es },
      jp: { translation: jp },
      de: { translation: de },
      it: { translation: it },
      pt: { translation: pt },
    },
    supportedLngs: ['en', 'fr', 'es', 'jp', 'de', 'it', 'pt'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, // React already inherently protects against XSS
    },
    detection: {
      order: ['queryString', 'cookie', 'localStorage', 'sessionStorage', 'navigator'],
      caches: ['localStorage', 'cookie']
    }
  });

export default i18n;
