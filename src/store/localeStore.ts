import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

export type AppLocale = 'en' | 'fr';

export const SUPPORTED_LOCALES: { code: AppLocale; labelKey: string }[] = [
  { code: 'en', labelKey: 'settings.languageEnglish' },
  { code: 'fr', labelKey: 'settings.languageFrench' },
];

interface LocaleState {
  locale: AppLocale;
  /** False until the persisted locale has been rehydrated from disk. */
  hydrated: boolean;
  setLocale: (locale: AppLocale) => void;
}

/**
 * Persisted app-language store. Components subscribe to `locale` (via the
 * useTranslation hook) so a change re-renders the whole tree with the new
 * strings; setLocale also drives i18next's active language for lookups.
 *
 * Language is chosen manually in Settings — there is no native locale module,
 * so the default is English until the user switches.
 */
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'en',
      hydrated: false,
      setLocale: (locale) => {
        i18n.changeLanguage(locale);
        set({ locale });
      },
    }),
    {
      name: 'eko-locale',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ locale }) => ({ locale }),
      onRehydrateStorage: () => (state) => {
        // Sync i18next to the restored locale, then mark ready.
        if (state?.locale) i18n.changeLanguage(state.locale);
        useLocaleStore.setState({ hydrated: true });
      },
    },
  ),
);
