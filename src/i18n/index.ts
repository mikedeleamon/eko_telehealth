/**
 * i18next initialization for Eko Telehealth.
 *
 * Pure-JS setup (no native locale module, no react-i18next): the default
 * language is English and the user switches manually in Settings. The active
 * language is driven by the persisted locale store; components read strings
 * through the useTranslation hook (src/i18n/useTranslation), which subscribes
 * to that store and re-renders the tree on language change.
 */
import i18n from 'i18next';
import en from './locales/en';
import fr from './locales/fr';

if (!i18n.isInitialized) {
  i18n.init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
    compatibilityJSON: 'v4',
  });
}

export default i18n;
