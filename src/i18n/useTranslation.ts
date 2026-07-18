import { useMemo } from 'react';
import type { TOptions } from 'i18next';
import i18n from './index';
import { useLocaleStore, type AppLocale } from '../store/localeStore';

export type TFunction = (key: string, options?: TOptions) => string;

interface UseTranslation {
  /** Translate a dotted key, e.g. t('auth.login') or t('call.ringing'). */
  t: TFunction;
  /** The active locale ('en' | 'fr'). */
  locale: AppLocale;
  /** Switch the app language (persisted). */
  setLocale: (locale: AppLocale) => void;
}

/**
 * App-wide translation hook. Subscribes to the persisted locale store so any
 * language change re-renders the consuming component, and returns a `t` bound
 * to the current locale (via i18next's getFixedT).
 *
 * Usage:
 *   const { t } = useTranslation();
 *   <Text>{t('auth.welcomeBack')}</Text>
 *   <Text>{t('appointments.confirmedSubtitle', { doctor: name })}</Text>
 */
export function useTranslation(): UseTranslation {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  // Rebind `t` to the active locale whenever it changes.
  const t = useMemo<TFunction>(() => {
    const fixed = i18n.getFixedT(locale) as (key: string, options?: TOptions) => string;
    return (key, options) => fixed(key, options);
  }, [locale]);

  return { t, locale, setLocale };
}
